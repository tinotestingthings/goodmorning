# Attentinus v3 — feestdagen, agenda-koppeling, UI-ronde

Plan (22 aug 2026). **Status: fase 1–3 gebouwd op 22 aug 2026** (feestdagen +
`dates.js`, agenda-chips, UI-ronde); fase 4 (ICS-export) bewust open gelaten —
zeg het als je hem wilt. Drie wensen van Tinus in één samenhangend
plan: (1) datums die elk jaar op een andere dag vallen (Moederdag, Vaderdag,
Pasen…), (2) Attentinus-datums zichtbaar in de agenda van de digest-app,
(3) een UI/UX-ronde over de app zelf. Uitgangspunt blijft: klein, handmatig,
één datalijst (`attentinus.people` in `attentinus_state`), geen AI aan de
persoonslijst.

## Beslissingen (default gekozen — zeg het als je het anders wilt)

1. **Feestdag = zesde categorie met een ingebouwde lijst, geen regel-editor.**
   Naast verjaardag/trouwdag/sterfdag/jubileum/anders komt de chip *Feestdag*.
   Kies je die, dan verdwijnen de datumvelden en kies je uit een vaste lijst:
   Moederdag (2e zondag mei) · Vaderdag (3e zondag juni) · Valentijnsdag ·
   Pasen · Hemelvaart · Pinksteren · Secretaressedag (3e donderdag april) ·
   Dierendag · Sinterklaas · Kerst. De app toont de regel én de eerstvolgende
   datum ("2e zondag van mei · zo 9 mei 2027"). Drie regeltypes dekken alles:
   vaste dag, n-de weekdag van een maand (n = -1 voor "laatste"), en
   paas-afstand (computus van Meeus, 12 regels). Een feestdag toevoegen is
   later één regel in de tabel; een eigen-regel-editor is UI voor een geval
   dat nog niet bestaat.
   Naam blijft verplicht ("Mama", "Papa") — het gaat om iemand, de ideeënbak
   hoort bij die persoon. Jaartal vervalt bij feestdagen (geen "wordt N").
   *Twijfel:* Pasen/Pinksteren/Hemelvaart zijn geen cadeaudagen; ze staan erin
   omdat het niets kost, niet omdat je ze nodig hebt. Zeg het als je de lijst
   korter wilt.

2. **Eén datumbestand, drie lezers.** Nu staat de "volgende keer"-logica twee
   keer (`attentinus/index.html` `nextOccur`, `home.js` `attentNextDays`) en
   de agenda wordt de derde. Dat wordt `attentinus/dates.js` met
   `window.AttentDates = { OCCASIONS, next(entry, from) → {date, days},
   on(entries, ymd) → entries }`. Geladen door `attentinus/index.html` én door
   de root-`index.html` (vóór `home.js`; sandbox idem) en opgenomen in de
   sw.js-precache (één cache-bump). Pure functies, dus testbaar zonder jsdom:
   `tests/attentinus.dates.test.mjs` (Moederdag 2027 = 9 mei, Vaderdag 2027 =
   20 juni, Pasen 2027 = 28 maart, 29 feb in een niet-schrikkeljaar → 28 feb,
   vandaag = 0 dagen).

3. **Agenda-koppeling = tónen, niet schrijven.** Attentinus-datums verschijnen
   als all-day chip in de agenda van de digest-app, naast chores/to-do's/ICS:
   dagweergave (`calendar.js` ~484-489), all-day-rij van de week (~1242-1245),
   maand-stipjes via `bump()` (~95), agendalijst (~717) en Today (~731). Eén
   nieuwe bron `attentOn(ds)` naast `choresOn/todosOn/icsOn`, één chip-klasse
   `cal-allday-attent` (bestaande chore-chip-stijl + het gift-icoon uit
   `home.js`). Er worden **geen to-do's aangemaakt**: dat geeft dubbelingen en
   verwijder-resurrectie over apparaten heen, en de ideeënbak ís al de actie.
   Klik op een chip opent `attentinus/#<id>` — een hash-deeplink naar de
   detailpagina (nieuw in Attentinus, vijf regels).

4. **Data voor de agenda komt uit een cache, geen tweede fetch.** `home.js`
   haalt `attentinus_state` al op bij elke home-render (`renderAttentTile`,
   ~725) en schrijft de lijst dan óók naar `k("attentCache")` — zelfde patroon
   als `readGymCache` en `icsCache`. `calendar.js` leest die synchroon tijdens
   renderen. De cache is alleen-lezen, staat niet in de agendasync-`KEYS` en
   gaat dus nooit de server op (regel 2 uit CLAUDE.md blijft gelden: alleen
   Attentinus zelf schrijft `attentinus_state`). Staleness: hooguit één
   home-render.

5. **Vensters.** De agenda toont álle voorkomens in het zichtbare bereik (het is
   een agenda). De home-tile houdt 21 dagen. Het 60-dagen-"Binnenkort"-blok in
   de app vervalt door beslissing 6.

6. **UI/UX-ronde — flow en structuur, geen nieuwe huisstijl.**
   - *Eén chronologische jaarlijst* met maandkoppen, vandaag bovenaan, over de
     jaargrens heen. Nu staan Binnenkort en Iedereen onder elkaar en staat
     dezelfde persoon twee keer op het scherm (zie demo: 4 personen, 8 regels).
     De oranje (≤21 d) en rode (vandaag) badge blijven als enige nadruk.
   - *Zoekveld* verschijnt pas boven de 12 regels (alfabetisch zoeken was de
     enige reden voor "Iedereen").
   - *Detail = leesweergave*, niet een altijd openstaand formulier: naam,
     categorie-icoon, "zo 9 mei · over 12 dagen · wordt 34", daaronder de
     ideeënbak (dat is waar je voor komt). *Wijzig* klapt het formulier open.
     Geen losse Opslaan-knop meer in beeld als je niets wijzigt.
   - *Terug-link "‹ Digest"* in de kop — nu kom je niet terug zonder
     browserknop. Geen menu: één link.
   - *Copy:* "+ persoon" → "+ toevoegen" (een feestdag is geen persoon);
     badge + subregel niet meer laten wrappen ("25 dgn / 1 notitie").
   - *Niet nu:* thema's (de app volgt `prefers-color-scheme`, de digest-app
     heeft handmatige thema's), typografie, kleuren, componentstijl. Dat is de
     repo-brede DESIGN.md-slag die je op 20 aug bewust hebt uitgesteld — die
     doen we voor alle apps tegelijk, niet hier per app.

7. **Import/export** blijft plak-tekst, client-side. Feestdag in het datumslot:
   `Mama ; moederdag` (id of label, hoofdletterongevoelig). Export schrijft
   dezelfde vorm terug. Bestaande regels (`Naam ; 21 aug 1965 ; verjaardag`)
   veranderen niet.

8. **ICS-export voor je telefoon-agenda: optioneel (fase 4), niet standaard.**
   Alleen als je Attentinus óók in Apple/Google Agenda wilt. Vaste dagen en
   n-de-weekdag gaan als `RRULE:FREQ=YEARLY` (Moederdag =
   `BYMONTH=5;BYDAY=2SU`), paas-gebonden als losse instanties voor 10 jaar.
   Zonder server is het een bestand, geen abonnement: bij wijzigingen opnieuw
   importeren. Daarom geen default.

9. **Geen nieuwe herinneringen.** Home-tile (≤21 d), agenda-chips en de digest
   zijn de herinnering. `reminders.js`/push blijven buiten scope.

## Datamodel

Een feestdag-regel in `attentinus.people` (bestaande velden ongewijzigd):

```
{ id, name: "Mama", cat: "feestdag", occasion: "moederdag", ideas: [...] }
```

`month/day/year` ontbreken; lezers gaan altijd via `AttentDates.next(entry)`.
De tabel in `attentinus/dates.js`:

```
OCCASIONS = [
  { id: "moederdag",       label: "Moederdag",       rule: { nth: 2,  weekday: 0, month: 5 } },
  { id: "vaderdag",        label: "Vaderdag",        rule: { nth: 3,  weekday: 0, month: 6 } },
  { id: "valentijn",       label: "Valentijnsdag",   rule: { month: 2,  day: 14 } },
  { id: "pasen",           label: "Pasen",           rule: { easter: 0 } },
  { id: "hemelvaart",      label: "Hemelvaart",      rule: { easter: 39 } },
  { id: "pinksteren",      label: "Pinksteren",      rule: { easter: 49 } },
  { id: "secretaressedag", label: "Secretaressedag", rule: { nth: 3,  weekday: 4, month: 4 } },
  { id: "dierendag",       label: "Dierendag",       rule: { month: 10, day: 4 } },
  { id: "sinterklaas",     label: "Sinterklaas",     rule: { month: 12, day: 5 } },
  { id: "kerst",           label: "Kerst",           rule: { month: 12, day: 25 } }
]
```

`home.js` `attentCat()` (migratie van oude rijen) blijft werken: nieuwe rijen
hebben altijd `cat`.

## Fasen (elk: sandbox → `/code-review medium` → gerichte promote)

**Fase 1 — Feestdagen + `dates.js`** (~150 regels netto)
`attentinus/dates.js` (regels + computus + `next/on`); `attentinus/index.html`:
chip Feestdag, select, regeltekst i.p.v. datumvelden, lijst/detail via
`AttentDates`, import/export; `home.js`: `attentNextDays` eruit,
`AttentDates.next` erin; root `index.html` + `sw.js` (cache-bump);
`tests/attentinus.dates.test.mjs`. Acceptatie: "Mama · moederdag" staat in
de lijst met "zo 9 mei 2027", de home-tile zegt vanaf 18 apr 2027
"Mama: moederdag over 21 dagen".

**Fase 2 — Agenda-koppeling** (~100 regels)
`home.js`: cache schrijven in `renderAttentTile`; `calendar.js`: `attentOn`,
vijf render-hooks, chip-klasse, klik → deeplink; `attentinus/index.html`:
`#<id>` opent detail. Raakt `home.js`/`calendar.js` → vóór push
`tests/agendasync.behaviour.mjs` draaien (recept in CLAUDE.md). Eigen
worktree: beide bestanden zijn gevoelig voor parallelle sessies.

**Fase 3 — UI-ronde** (~200 regels, vooral `renderList`/`renderDetail`)
Beslissing 6 in één slag; op telefoon, iPad en laptop nakijken via
`localhost:8123/attentinus/index.html?demo` (drie breakpoints, Tinus gebruikt
alle drie). Geen stijlwijzigingen buiten de genoemde punten.

**Fase 4 — ICS-export** (optioneel, ~60 regels)
Knop onder "Lijst importeren of exporteren…" → `attentinus.ics` downloaden.

Fase 1 en 2 kunnen in één sessie; fase 3 apart (andere soort werk, eigen
review). Volgorde 1 → 2 → 3 is ook de volgorde van nut: zonder 1 kan Moederdag
nergens staan, zonder 2 staat hij alleen in de app.

## Niet in dit plan (bewust)

- Regel-editor voor eigen terugkerende dagen — pas als de tabel tekortschiet.
- To-do's aanmaken vanuit Attentinus-datums (beslissing 3).
- Push-/lokale herinneringen (beslissing 9).
- Thema's, typografie, kleuren — DESIGN.md-slag voor alle apps tegelijk.
- Verjaardagen importeren uit een Google-Contacts-ICS-feed. Kan later via de
  bestaande ICS-abonnementen ("importeer als personen"), maar dan gaat de
  persoonslijst via een externe feed — jouw keuze, niet de default.

## Aandachtspunten

- Bekende beperking (bewust, uit de review van 22 aug): `k("attentCache")` is
  per omgeving (dd./sbx.), niet per gebruiker, en wordt niet gewist bij
  uitloggen. Op een apparaat waar een ándere account inlogt blijven de oude
  namen in de agenda staan tot die account zijn eigen tile-fetch heeft gedaan.
  Eén gebruiker, dus gelaten; oplossing als het ooit speelt: cache wissen in
  auth.js bij SIGNED_OUT.

- Root-`index.html` laadt elk script in de lijst; `attentinus/dates.js` komt
  vóór `home.js`. `sw.js`-precache moet hem kennen, anders faalt de PWA
  offline. Cache-bump max. één keer per sessie — en een andere sessie heeft
  `sandbox/sw.js` op dit moment al open.
- `attentinus_state` blijft exclusief van de app; `dates.js` en de cache
  lezen alleen. Niets in dit plan raakt de sync-logica van `boot.js`.
- Live en sandbox van `attentinus/` moeten na elke promote identiek zijn
  (`diff -rq attentinus sandbox/attentinus`).
