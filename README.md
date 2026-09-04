# Morgens Werkvormen-app

Interne webapp voor **Morgens** waarin consultants werkvormen en liberating structures
vinden, daarmee een bouwplan voor een sessie samenstellen, en dat exporteren naar Word in
de Morgens-huisstijl. Daarnaast een gedeelde inspiratiefeed voor ervaringen en tips.

**Live:** <https://werkvormen-app-web.pages.dev/>

Registreren kan alleen met een `@morgens.nl`-adres.

---

## Stack

| Onderdeel                  | Keuze                                                             |
| -------------------------- | ----------------------------------------------------------------- |
| Frontend                   | React 18 + TypeScript, SCSS-modules                               |
| Build                      | Vite 8 (rolldown) met `@vitejs/plugin-react` 6                    |
| Hosting                    | Cloudflare Pages, automatische deploy bij elke push naar `main`   |
| Database, accounts, opslag | Supabase (Postgres, Auth, Storage) — regio `eu-west-1`            |
| Word-export                | `docxtemplater` + `pizzip` + `file-saver`, volledig in de browser |

Kosten: €0 per maand. Alles draait op gratis plannen.

---

## Lokaal draaien

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # productiebuild in dist/
npx tsc --noEmit     # typecheck (vite build doet dit niet)
```

Maak een `.env` in de repo-root:

```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

Beide waarden staan in het Supabase-dashboard onder **Project Settings → API**. Ze mogen
publiek zijn — de anon-sleutel is ontworpen om in de frontend te staan, en de
toegangsregels (Row Level Security) in de database bepalen wat iemand mag zien.

> **Gebruik nooit de `service_role`-sleutel in deze app.** Die staat op hetzelfde scherm,
> ziet er bijna identiek uit, en negeert álle toegangsregels.

`.env` staat in `.gitignore`. Dezelfde twee variabelen moeten daarom óók in Cloudflare
Pages staan onder **Settings → Variables and secrets**, anders slaagt de build wel maar
valt de app om zodra iemand hem opent.

---

## Structuur

```
src/
  App.tsx                  sessie, profiel en thema; kiest inlogscherm of app
  main.tsx                 instappunt
  lib/
    supabase.ts            client, domeincontrole, keuze waar de sessie wordt bewaard
    werkvormenApi.ts       werkvormen en voorstellen (snake_case <-> camelCase)
    inspiratieApi.ts       berichten, reacties in threads, emoji-reacties
    persoonlijkApi.ts      favorieten en bouwplannen + eenmalige overzetting
    afbeeldingenApi.ts     verkleinen en uploaden naar Supabase Storage
  components/              alle schermen; per component een .module.scss
  models/                  types.ts, bouwplan.ts, suggestion.ts, post.ts
  data/                    mockData.ts (bron voor seed.sql), bouwplanTemplate.ts
  assets/werkvormen/       34 gebundelde afbeeldingen
supabase/
  schema.sql               beginsituatie van de database
  seed.sql                 de 34 werkvormen (gegenereerd uit mockData.ts)
  bootstrap-admin.sql      eerste beheerder aanwijzen
  README.md                hoe de database in elkaar zit en waarom
```

---

## Database

Latere wijzigingen zijn als **migratie** toegepast en staan in Supabase onder
**Database → Migrations**; dat is de bron van waarheid, niet `supabase/schema.sql`.
Zie `supabase/README.md` voor de opzet en de redenen achter een paar keuzes.

Tabellen: `profiles` (met rol `gebruiker` of `admin`), `werkvormen`, `suggestions`,
`posts`, `post_comments`, `post_reactions`, `favorites`, `bouwplannen`.
Storage-bucket: `werkvormen`.

Row Level Security staat overal aan. Kort samengevat:

- **Werkvormen** — iedereen met een morgens.nl-account leest; alleen beheerders schrijven.
- **Inspiratie** — iedereen leest en schrijft; je verwijdert je eigen bericht, beheerders alles.
- **Bouwplannen en favorieten** — strikt privé, `owner_id = auth.uid()`. Ook beheerders
  komen hier niet bij; er staan klantnamen in.

---

## Deployment

Elke push naar `main` start automatisch een build op Cloudflare Pages (`npm run build`,
output `dist`). Een push naar een andere branch geeft een preview op een eigen adres,
zonder de productiesite te raken. Elke eerdere versie blijft bewaard en is in het
dashboard terug te zetten.

Cloudflare bouwt wat er in **GitHub** staat, niet wat er op je laptop staat. Faalt een
build terwijl het lokaal werkt, controleer dan eerst of `git status` schoon is.

---

## Valkuilen

Dingen die tijd hebben gekost en dat opnieuw zullen doen:

- **`npm install` hoort op Windows te draaien**, niet via een Linux-verbinding of WSL naar
  dezelfde map. `esbuild`, `rollup` en `sass` installeren een binary per besturingssysteem;
  installeer je vanaf Linux, dan vindt Windows geen `vite.cmd`.
- **Vite en de React-plugin horen bij elkaar.** Vite 8 vereist `@vitejs/plugin-react` 6;
  versie 4 hoorde bij Vite 5. Bump je de een, bump dan de ander — anders faalt
  `npm install` met een ERESOLVE-fout over peer dependencies.
- **Een wachtwoordeis mag nooit op het inlogveld staan.** `minLength` hoort alleen bij het
  _kiezen_ van een wachtwoord. Staat hij ook bij inloggen, dan blokkeert de browser het
  formulier zodra je de eis in Supabase verhoogt, en is iedereen met een ouder, korter
  wachtwoord buitengesloten zonder dat er ooit een verzoek aankomt.
  Houd `MIN_WACHTWOORD_LENGTE` in `src/lib/supabase.ts` gelijk aan de instelling in
  Supabase onder **Authentication → Password settings**.
- **De afbeelding van een werkvorm hangt aan `image_slug`, niet aan de titel.** Dat was
  ooit andersom, en toen liet hernoemen de afbeelding stilzwijgend verdwijnen. Volgorde bij
  het tonen: `image_url` (geüpload) → `image_slug` (gebundeld bestand) → titel als
  terugval.
- **`supabase/seed.sql` is gegenereerd uit `src/data/mockData.ts`** en moet niet met de
  hand worden bijgewerkt. De werkvormen worden sinds fase C uit de database gelezen;
  `mockData.ts` is alleen nog de bron voor die seed.
- **`src/components/HelpView.tsx` bevat beweringen die verouderen** — het aantal
  werkvormen, dat er geen AI-adviseur is, dat er geen automatische back-up is. Verandert
  daar iets, pas die pagina dan mee aan.

---

## Bekende beperkingen

- Aanmeld- en herstelmails lopen via Supabase' eigen maildienst: **2 per uur voor het hele
  project**. Genoeg voor een geleidelijke uitrol, te weinig voor een grote groep tegelijk.
  Opvolger is een eigen domein met Resend als SMTP.
- **Geen automatische back-up** op het gratis plan. Werkvormen zijn te herstellen uit
  `supabase/seed.sql`; bouwplannen en inspiratieberichten niet.
- De layout is gemaakt voor laptop- en desktopschermen, niet voor een telefoon.
- Geen AI-functionaliteit. Zie de handoff voor wat daarvoor is onderzocht en waarom het
  er nog niet is.
- Vervangen of geannuleerde afbeeldingsuploads blijven in de Storage-bucket staan; er is
  geen opruiming van ongebruikte bestanden.

---

Ontwikkeld en onderhouden door Munzur Atak (<munzur.atak@morgens.nl>).
