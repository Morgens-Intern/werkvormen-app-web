# Database (Supabase)

Uitvoeren in het Supabase-dashboard onder **SQL Editor**, in deze volgorde.

| # | Bestand | Wanneer |
| --- | --- | --- |
| 1 | `schema.sql` | eenmalig, bij het inrichten. Opnieuw draaien is veilig. |
| 2 | `seed.sql` | direct daarna. Vult de 34 werkvormen; doet niets als de tabel al gevuld is. |
| 3 | `bootstrap-admin.sql` | pas nadat je jezelf in de app hebt geregistreerd. |

## Hoe de beveiliging in elkaar zit

De toegang tot data hangt **niet** af van de frontend. Elke tabel heeft Row Level
Security aan staan; de regels bepalen per rij wie wat mag. Zelfs met de anon key
in de hand — die staat publiek in de app, dat hoort zo — komt niemand bij data
waar hij geen recht op heeft.

De domeincontrole zit in drie lagen:

1. **Het registratieformulier** weigert een niet-morgens.nl adres. Comfort, geen
   beveiliging: met de ontwikkelaarsconsole omzeil je dit.
2. **De Before User Created hook** in Supabase blokkeert de registratie aan de
   serverkant.
3. **De toegangsregels** (`is_morgens()`) controleren bij élke query opnieuw of
   het e-mailadres in het token op `@morgens.nl` eindigt. Dit is de laag die er
   echt toe doet: wie op wat voor manier dan ook een account bemachtigt, ziet
   alsnog niets.

## Waarom bepaalde dingen zo staan

- **`is_admin()` is `security definer`.** Deze functie wordt gebruikt in de
  toegangsregels ván `profiles`. Zonder `security definer` zou het lezen van
  `profiles` de regels opnieuw aanroepen, die weer deze functie aanroepen:
  oneindige recursie en een onbruikbare tabel.
- **`is_admin()` staat ná de tabel `profiles`.** Postgres controleert de inhoud
  van een SQL-functie meteen bij het aanmaken; eerder in het bestand bestaat de
  tabel nog niet en klapt het script.
- **De rolbewaking zit in een trigger, niet in een toegangsregel.** Een regel op
  `profiles` die `profiles` bevraagt geeft dezelfde recursie.
- **De bewaking slaat over als `auth.uid()` leeg is.** Dat is het geval vanuit de
  SQL-editor en met de service_role-sleutel. Die weg is al volledig bevoegd, en
  het is de enige manier om de eerste beheerder aan te wijzen.

## Al toegepast op het project

Schema, seed en de beveiligingsaanscherping staan sinds 31-08-2026 in het
Supabase-project `werkvormen-app` (regio eu-west-1, Ierland). De bestanden hier
zijn de bron van waarheid; opnieuw draaien is veilig.

De Supabase database linter gaf zeven waarschuwingen. Zes zijn opgelost in
blok 5 van `schema.sql`. Eén blijft bewust staan:

> `is_admin()` kan door ingelogde gebruikers via RPC worden aangeroepen.

Dat kan niet anders. De functie wordt gebruikt binnen de toegangsregels, en een
regel draait met de rechten van de bevragende rol — zou je het recht intrekken,
dan breekt elke regel die hem gebruikt. Het is bovendien ongevaarlijk: de functie
heeft geen parameters en kijkt naar `auth.uid()`, dus een gebruiker leert
uitsluitend of hijzélf beheerder is. Dat wist hij al.

## Getest

Schema en seed zijn tegen een echte PostgreSQL gedraaid vóór gebruik. Gecontroleerd:
beide scripts draaien schoon en zijn idempotent (tweede run geeft geen dubbele
werkvormen), een profiel wordt automatisch aangemaakt bij registratie, een gewone
gebruiker kan zichzelf niet promoveren, een beheerder kan dat wel bij een ander,
de laatste beheerder kan zichzelf niet degraderen, en e-mailadres en id liggen vast.

## seed.sql niet met de hand bijwerken

Dat bestand is gegenereerd uit `src/data/mockData.ts`. Wijzigt de bronlijst, dan
wordt de seed opnieuw gegenereerd — anders lopen ze uiteen.
