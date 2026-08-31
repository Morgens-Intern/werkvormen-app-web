-- ============================================================================
--  Eerste beheerder aanwijzen.
--
--  Draai dit PAS nadat je jezelf in de app hebt geregistreerd en je e-mailadres
--  hebt bevestigd. Uitvoeren in het Supabase-dashboard onder SQL Editor.
--
--  Dit werkt alleen vanuit de SQL-editor, niet vanuit de app: daar geldt de
--  regel dat alleen een beheerder rollen mag wijzigen, en die is er nog niet.
--  Daarna kun je collega's gewoon via het beheerscherm promoveren.
-- ============================================================================

update public.profiles
set    rol = 'admin'
where  email = 'munzur.atak@morgens.nl';

-- Controle: hier hoort nu precies één regel te staan, met rol 'admin'.
select email, rol, created_at from public.profiles order by created_at;
