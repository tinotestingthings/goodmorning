# El Patroon — naaipatronen op je eigen maten

Alle 74 designs van [FreeSewing](https://freesewing.org) (MIT), getekend op
jouw maten, met materiaallijst, controle en een print op ware grootte. Geen
eigen patroonwiskunde: de geometrie komt uit FreeSewing zelf, dat via
[esm.sh](https://esm.sh) in de browser draait — geen build-stap, geen server.

- **Design kiezen** uit de lijst (zoeken op naam, categorie of techniek; 64
  van de 74 hebben een lijntekening). Bij elk design staan de links naar
  FreeSewing's eigen pagina met stofbehoefte en naaiinstructies.
- **Maten**: 40 voorbeeldsets van FreeSewing, of je eigen profiel. Bij elke
  maat staat hun eigen meetinstructie met foto, vertaald, met het Engelse
  origineel en de bron eronder. Kies *Vergelijk met* een standaardmaat en
  *Vul lege velden* — daarna pas je alleen aan wat bij jou echt afwijkt, en
  zie je per maat het verschil (*+3 cm*, *= standaard*).
- **Controle** vóór je knipt: FreeSewing's eigen foutenlogboek en
  ontwerpersvlaggen, plus een plausibiliteitstoets op de maatset (verwisselde
  eenheden, een komma vergeten). Oordeel: klaar / controleer / geblokkeerd.
- **Printen**: A4 tot A0 met FreeSewing's eigen tiler — montagemarkeringen en
  een liniaal van 10 cm per vel. "Passend maken" uit, dan klopt de schaal.
  Of *Download SVG* voor een drukker met een plotter.
- **Eigen designs** in `designs/*.mjs`. Dat zijn gewone FreeSewing-modules;
  ze verschijnen als `eigen/<naam>` in dezelfde lijst en krijgen automatisch
  opties, materiaallijst, controle en print. `designs/kraagtrui.mjs` is het
  voorbeeld: Huey zonder capuchon, met een staande kraag.

## Bestanden

| Bestand | Wat |
|---|---|
| `boot.js` | de gate: login + sync, laadt daarna `app.js` |
| `app.js` | de UI (DOM-werk, verder niets) |
| `patroon.mjs` | de rekenkern: design laden, tekenen, materiaallijst, tegelen |
| `validator.mjs` | het oordeel |
| `profielen.mjs` | eigen maten: opslag, eenheden, export/import |
| `maten-nl.mjs` | Nederlandse vertaling van FreeSewing's meetinstructies |
| `designs/` | eigen designs |
| `catalogus.json`, `maten.json`, `maten/`, `linedrawings/`, `vendor/` | gegenereerd |

De gegenereerde bestanden komen uit `tinotestingthings/el-patroon` (branch
`web`, `npm run assets`). Daar staan ook de tests: `node check.mjs` tekent
alle designs op drie maatsets. **Wijzig ze niet met de hand hier** — pas het
daar aan, draai de check, en kopieer `app/` opnieuw hierheen.

## Eenmalige setup: Supabase-tabel

De app draait zonder tabel gewoon lokaal; je maten staan dan alleen in de
browser van dit apparaat (de export/import-knop blijft je back-up). Voor sync:

```sql
create table public.elpatroon_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.elpatroon_state enable row level security;
create policy "own row" on public.elpatroon_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
grant select, insert, update on public.elpatroon_state to authenticated;
```

De laatste regel is niet optioneel: zonder GRANT bestaat de tabel wel, maar
krijgt de app 42501 ("permission denied") en draait hij lokaal door.

## State (in `elpatroon_state.data`, keys via de boot-shim)

- `elpatroon.profielen.v1` — `{ <id>: { naam, notitie, referentie,
  maten: { <maatnaam>: <mm> } } }`. Maten staan intern in millimeters; de UI
  toont centimeters.

Patronen worden niet bewaard: die tekent FreeSewing elke keer opnieuw uit het
design plus je maten, dus ze zijn geen staat.
