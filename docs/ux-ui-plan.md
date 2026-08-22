# UX/UI-plan goodmorning — 22 aug 2026

Doel: de hoofdapp en de utility-apps voelen als één rustig product, op telefoon, iPad en laptop.
Smaak (vastgelegd): minimalistisch en duidelijk — rustige achtergrond, één accentkleur, strakke
SVG-lijniconen, geen decoratie of verzonnen cijfers; navigatie is het eerste ergernispunt.
Werkwijze per fase: sandbox → `/code-review medium` → testen op de drie apparaten → promote.

## Vandaag besloten en uitgevoerd (sandbox)

- **Attentinus-tegel uit de hero-rij** — de brede verjaardagskaart (alleen zichtbaar ≤21 dagen) is genoeg.
- **Podcast-tegel uit de hero-rij** — de Utilities-tegel met wachtrij-nummertje is genoeg.
- Hero-rij is nu: Today-weer + vogel van de dag. `renderAppTile`/`MOST_USED` zijn weg uit home.js.

## Wat er nu staat (inventaris)

| Laag | Stijl nu | Opmerking |
|---|---|---|
| Hoofdapp (`style.css`) | dark-first (`--bg #0f1115`), light via `prefers-color-scheme`; tokens `--bg/--card-bg/--text/--text-dim/--border/--keep/--dismiss/--skip` | de enige plek met een echte tokenset |
| Attentinus, Trainerinus, Luisterinus | light-first (`--bg #f5f5f7`) + eigen dark-media; 7–10 eigen vars per app | drie bijna-gelijke kopieën van hetzelfde |
| NoteSprint | 22 eigen vars, monospace, geen dark mode | wijkt bewust af (typ-app) |
| ChordSprint | 12 eigen vars, eigen font-var, geen dark mode | |
| WijnWijs, Vogelspotinus, Events, Kangaroo | gebundeld/eigen CSS, geen gedeelde tokens | Events en Kangaroo hebben een buildstap |

Conclusie: de hoofdapp is donker-eerst, de utility-apps licht-eerst, en elke app heeft zijn eigen
kleurset. Dat is precies de drift die het geparkeerde DESIGN.md-plan moest stoppen — en dit is
het moment om het in één slag te doen, vóór Luisterinus een eigen uiterlijk krijgt.

## Fasen

### Fase A — Today opruimen (½ sessie, grotendeels gedaan)

- Hero-rij: weer + vogel. Beslispunt: zo laten (rustig) of de vogel-tegel breed maken nu er ruimte is.
- Brede kaarten onder de hero-rij (Events, Trainerinus, Attentinus, vault-notitie) delen één
  "wide tile"-stijl: zelfde hoogte, icoon links, titel + subregel, pijl rechts. Nu zijn het drie
  losse CSS-blokken (`events-tile`, `trainer-tile`, `attent-tile`) met kleine verschillen → één klasse.
- Conditionele kaarten blijven conditioneel (Opduikinus-principe); vaste blokken maximaal drie:
  hero, Trainerinus, dashboard (Tasks/Projects/Backlog + urgent).
- Klaar wanneer: Today past zonder scrollen op de iPad en toont op de telefoon boven de vouw
  alleen hero + eerste kaart.

### Fase B — DESIGN.md + gedeelde tokens (1–2 sessies) — de kern

1. `design.css` in de repo-root (gepromoot → ook in `sandbox/`): tokens voor kleur (bg, card, text,
   text-dim, border, accent = het blauw `--skip`, ok = groen, warn = amber, danger = rood), radius
   (12/14/22), spacing (4/8/12/16/24), typografie (systeemfont, 5 maten), en 4 componentklassen:
   `.card`, `.tile`, `.btn`, `.badge`. Light én dark via `prefers-color-scheme`, zonder "first".
2. `DESIGN.md` (platte tekst, à la Stitch): dezelfde tokens uitgelegd + de smaakregels hierboven +
   do's/don'ts met voorbeelden uit de eigen apps. Eén verwijsregel in CLAUDE.md: alleen lezen bij
   UI-werk (token-hygiëne).
3. Hoofdapp: linkt `design.css` NIET. Hij heeft een themakiezer (theme.js zet `data-theme`, paletten in
   style.css vanaf regel ~2207) met hogere specificiteit, dus de tokens zouden er dood zijn; bovendien
   botsten generieke klassen (`.card/.btn/.tile`) met bestaande selectors. De hoofdapp ís de referentie.
   Follow-up (fase D): gekozen theme via localStorage doorgeven aan de utility-apps.
   Bewuste unificatie: Attentinus/Trainerinus krijgen radius 14 (was 20) en een hairline-schaduw (was zacht/groot).
4. Utility-apps: `<link rel="stylesheet" href="../design.css">` + eigen `:root` weg; app-specifieke
   regels blijven. Volgorde: Luisterinus (kaal, dus goedkoop) → Attentinus → Trainerinus →
   ChordSprint → (NoteSprint blijft zoals hij is) → daarna de gebundelde apps
   (WijnWijs, Vogelspotinus, Events, Kangaroo) elk in een eigen kleine ronde.
- Klaar wanneer: elke app licht én donker correct toont met dezelfde kleuren, en een screenshot
  van twee willekeurige apps naast elkaar als één product leest.

### Fase C — Luisterinus-app (½–1 sessie, ná fase B)

- Rij: titel, bron-domein · datum, **duur** (het script schrijft `duration_s` in de rij — kleine
  SQL-migratie), status als rustige tekst; geen knoppen tot je tikt.
- Vaste mini-speler onderaan (titel + play/pauze + voortgang) zodat scrollen de speler niet verliest;
  één speler tegelijk.
- Acties per aflevering (besluit Tinus): **klaar/geluisterd** (`listened_at`; automatisch aan het einde, of met
  één tik), **verwijderen** (rij weg; bucketbestand ruimt het script op), **taak aanmaken** (zelfde `actions`-rij
  als de Task-knop in Triage, zodat de digest-taak hem in 30 Tasks zet). Utilities-nummertje = klaar én ongehoord;
  gehoorde items gedimd onderaan.
- Testrijen (`title = 'test'`) en `test.m4a` weg.

### Fase D — Utilities & navigatie (½ sessie)

- Tegelvolgorde op gebruik (Luisterinus, Attentinus, Trainerinus bovenaan); slider blijft.
- Nummertjes consistent: rood = "iets voor jou" (Triage-tab, Luisterinus), grijs = telling.
- Terugknop in de app-header groter op telefoon; "Open ↗" alleen op laptop tonen.

## Besluiten (Tinus, 22 aug 2026)

| Vraag | Besluit |
|---|---|
| Hero-rij | weer + vogel zo laten |
| Luisterinus per aflevering | acties: **klaar/geluisterd**, **verwijderen**, **taak aanmaken**, etc. — nummertje = klaar én ongehoord |
| Licht of donker | systeem volgen, geen "first" |
| NoteSprint | niets doen |
| Referentiestijl | **het Utilities-menu** van de hoofdapp (donkere tegels, groene lijniconen, ronde hoeken) is de maat; de utility-apps volgen die stijl |

## Wat dit plan niet is

- Geen functionele uitbreidingen (Luisterinus fase 3/4, nieuwe apps) — alleen uiterlijk en navigatie.
- Geen herbouw van gebundelde apps; alleen tokens en kleine CSS-rondes.
- Geen per-app smaakrondes: eerst DESIGN.md, dan pas apps erlangs leggen.
