-- ============================================================================
--  Morgens Werkvormen-app — databaseschema (fase B + C)
--  Uitvoeren in het Supabase-dashboard onder SQL Editor.
--  Dit script is idempotent: opnieuw draaien is veilig.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  1. HULPFUNCTIE: DOMEINCONTROLE
-- ----------------------------------------------------------------------------

-- Controleert of de ingelogde gebruiker een morgens.nl-adres heeft.
-- Leest het e-mailadres uit het token, niet uit een tabel: niet te vervalsen
-- door de gebruiker.
create or replace function public.is_morgens()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(lower(auth.jwt() ->> 'email') like '%@morgens.nl', false);
$$;

-- ----------------------------------------------------------------------------
--  2. PROFIELEN (met de beheerder-hulpfunctie)
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  email        text        not null,
  display_name text,
  rol          text        not null default 'gebruiker'
                           check (rol in ('gebruiker', 'admin')),
  created_at   timestamptz not null default now()
);

-- Controleert of de ingelogde gebruiker beheerder is.
--
-- LET OP: 'security definer' is hier essentieel. Deze functie wordt gebruikt
-- binnen de toegangsregels ván de profiles-tabel. Zonder security definer zou
-- het lezen van profiles opnieuw de toegangsregels aanroepen, die weer deze
-- functie aanroepen -> oneindige recursie en een onbruikbare tabel.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin'
  );
$$;


-- Maakt automatisch een profiel zodra iemand zich registreert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      initcap(replace(split_part(new.email, '@', 1), '.', ' '))
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bewaakt wat er bij een wijziging wél en niet mag.
-- Dit zit bewust in een trigger en niet in een toegangsregel: een regel op
-- profiles die profiles bevraagt veroorzaakt recursie.
create or replace function public.guard_profile_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'Het id en e-mailadres van een profiel liggen vast.';
  end if;

  if new.rol is distinct from old.rol then
    -- auth.uid() is leeg wanneer de wijziging NIET via de app binnenkomt, maar
    -- vanuit de Supabase SQL-editor of met de service_role-sleutel. Die weg is
    -- al volledig bevoegd — en is de enige manier om de éérste beheerder aan
    -- te wijzen, want op dat moment bestaat er nog geen beheerder die het mag.
    if auth.uid() is not null then
      if not public.is_admin() then
        raise exception 'Alleen een beheerder kan rollen wijzigen.';
      end if;

      -- Voorkomt dat de laatste beheerder zichzelf degradeert en niemand
      -- het nog terug kan draaien zonder het Supabase-dashboard.
      if old.rol = 'admin'
         and (select count(*) from public.profiles where rol = 'admin') <= 1 then
        raise exception 'Er moet minstens één beheerder overblijven.';
      end if;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.guard_profile_changes();

alter table public.profiles enable row level security;

drop policy if exists "eigen profiel lezen" on public.profiles;
create policy "eigen profiel lezen"
  on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists "eigen profiel bijwerken" on public.profiles;
create policy "eigen profiel bijwerken"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "beheerder mag profielen bijwerken" on public.profiles;
create policy "beheerder mag profielen bijwerken"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
--  3. WERKVORMEN
-- ----------------------------------------------------------------------------

create table if not exists public.werkvormen (
  id              uuid primary key default gen_random_uuid(),
  title           text        not null,
  category        text[]      not null default '{}',
  fase            text[]      not null default '{}',
  goal            text        not null default '',
  description     text        not null default '',
  duration        integer     not null default 0,
  group_size_min  integer     not null default 0,
  group_size_max  integer     not null default 9999,
  materials       text[]      not null default '{}',
  steps           text[]      not null default '{}',
  tips            text[]      not null default '{}',
  image_url       text,
  extra_link      text,
  tags            text[]      not null default '{}',
  settings        text[]      not null default '{}',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.werkvormen enable row level security;

drop policy if exists "werkvormen lezen" on public.werkvormen;
create policy "werkvormen lezen"
  on public.werkvormen for select to authenticated
  using (public.is_morgens());

drop policy if exists "beheerder beheert werkvormen" on public.werkvormen;
create policy "beheerder beheert werkvormen"
  on public.werkvormen for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ----------------------------------------------------------------------------
--  4. VOORSTELLEN
-- ----------------------------------------------------------------------------

create table if not exists public.suggestions (
  id           uuid primary key default gen_random_uuid(),
  submitter_id uuid        not null references public.profiles(id) on delete cascade,
  werkvorm     jsonb       not null,
  status       text        not null default 'open'
                           check (status in ('open', 'goedgekeurd', 'afgewezen')),
  created_at   timestamptz not null default now()
);

create index if not exists suggestions_status_idx on public.suggestions (status, created_at desc);

alter table public.suggestions enable row level security;

drop policy if exists "eigen voorstellen zien" on public.suggestions;
create policy "eigen voorstellen zien"
  on public.suggestions for select to authenticated
  using (submitter_id = auth.uid() or public.is_admin());

drop policy if exists "voorstel indienen" on public.suggestions;
create policy "voorstel indienen"
  on public.suggestions for insert to authenticated
  with check (submitter_id = auth.uid() and public.is_morgens());

drop policy if exists "beheerder beoordeelt voorstellen" on public.suggestions;
create policy "beheerder beoordeelt voorstellen"
  on public.suggestions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "beheerder verwijdert voorstellen" on public.suggestions;
create policy "beheerder verwijdert voorstellen"
  on public.suggestions for delete to authenticated
  using (public.is_admin());

-- ----------------------------------------------------------------------------
--  5. AFSCHERMING VAN DE FUNCTIES
--
--  Zonder dit staan de functies als RPC-eindpunt open op /rest/v1/rpc/.
--  Gesignaleerd door de Supabase database linter.
-- ----------------------------------------------------------------------------

-- Triggerfuncties horen niet aanroepbaar te zijn. De triggers blijven werken:
-- Postgres controleert het uitvoerrecht bij het aanmaken van de trigger, niet
-- bij elke keer dat hij afgaat.
revoke execute on function public.handle_new_user()       from public, anon, authenticated;
revoke execute on function public.guard_profile_changes() from public, anon, authenticated;

-- is_admin() en is_morgens() worden gebruikt bínnen de toegangsregels. Een regel
-- wordt uitgevoerd met de rechten van de bevragende rol, dus 'authenticated'
-- MOET deze mogen aanroepen — anders breken alle regels. Voor niet-ingelogde
-- bezoekers is er geen reden ze te tonen.
revoke execute on function public.is_admin()   from public, anon;
revoke execute on function public.is_morgens() from public, anon;
grant  execute on function public.is_admin()   to authenticated;
grant  execute on function public.is_morgens() to authenticated;
