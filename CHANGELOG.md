# Changelog

Newest first. One line per deploy to the live root.

## 2026-08-20 (v2026.08.20-1) — Cross-device: iPhone-notch, iOS-zoom, tablet/laptop-layout, toetsenbord in triage

Ronde om de app op telefoon, tablet én laptop echt goed te laten werken.
Drie echte bugs op iPhone/iPad: (1) `viewport-fit=cover` + een translucent
statusbalk lieten de pagina op y=0 beginnen, dús ónder de notch — in de
geïnstalleerde PWA stonden de begroeting en de terug-knoppen achter klok en
batterij; de shell krijgt nu `env(safe-area-inset-top/left/right)` in één
keer op `body` (border-box houdt de 100svh-hoogte exact, links/rechts voor
landschap). (2) Invoervelden stonden op 0.9rem/0.85rem; Safari zoomt de hele
pagina in zodra een veld onder 16px focus krijgt en zoomt nooit terug — alle
velden nu 1rem, gelijk aan de capture-textarea. (3) Android: grijze tap-flits
weg (`-webkit-tap-highlight-color`) en `overscroll-behavior` dicht, zodat
doortrekken bovenaan een lijst niet langer de hele PWA herlaadt.

Tablet/laptop-layout herzien: de shell was per schermmaat op één breedte
gezet, waardoor élk oppervlak meerekte — een to-do-regel én een nieuwsartikel
liepen tot ~1200px, gemeten 142 tekens per regel. Nu neemt de shell het
scherm (de week-grid van de kalender is de enige view die de breedte echt
verdient: 181px-kolommen) terwijl leesoppervlakken een eigen kolom houden:
home/settings/utilities 760px, de triage-deck 640px (72 tekens per regel) en
een gecentreerde tabbalk-cluster. Telefoons zijn onaangeroerd — onder 768px
is het hele blok inert.

Triage op laptop: het dek was swipe-only, dus met een toetsenbord onbereikbaar
en met een muis selecteerde slepen de artikeltekst. Nu ← nope / → keep /
L later / T task / P project / U undo (hint verschijnt alleen bij een precieze
aanwijzer), `cursor: grab`, en de selectie wordt gewist zodra een swipe begint.

Bevat ook de tien punten uit de /code-review van gisteren die nog niet live
stonden: uitstellen van herhaaltaken werkt nu in álle gevallen (gemiste
occurrence i.p.v. vandaag; legacy-chores zonder startDate volgen nu ook hun
exceptions; chore-rijen hebben dezelfde swipe als to-do's), gym-schema pakt
legacy-chores mee, backlog-drag negeert een tweede vinger en ruimt zijn
hold-timer op bij pointercancel, triage-undo wist zijn historie-regel én de
aangemaakte to-do, de all-day-dropzone stopt 40px boven de strook,
todo-kopieerlogica zit in één `todoCopyAt()`, en de held-captures-migratie
draait nog één keer per apparaat i.p.v. bij elke capture.

Getest op 360/390 (Android/iPhone), 768 (iPad) en 1440 (laptop): geen
horizontale overflow, safe-area gesimuleerd op 47px (tabbalk blijft exact op
de onderrand), toetsenbordronde end-to-end doorlopen. Tests 7/7 groen. Geen
cache-bump (network-first shell). Gerichte promote: andere sessies hebben
explainer/, sandbox/notesprint en sandbox/wine onder handen.

## 2026-08-19 (9) — Attentinus live + Opduikinus-kaart (gerichte promote)

Nieuwe utility-app attentinus/: verjaardagen en andere jaarlijkse datums met
vaste categorieën + iconen (verjaardag/trouwdag/sterfdag/jubileum/anders),
jaartal-semantiek per categorie (wordt N / N jaar getrouwd / N jaar geleden),
cadeau-ideeën per persoon en client-side plak-import/-export (persoonslijst
gaat nooit langs een AI). Home: vaste kleine Attentinus-herotegel vervangt de
NoteSprint/ChordSprint-tegels; conditionele rij zodra iemand binnen 21 dagen
valt; launcher-tegel in practice.js. Opduikinus: home rendert een uitklapbare
vault-notitie-kaart zodra feed.json een vaultNote-veld heeft (taak-kant volgt;
zonder veld geen kaart). Tabel attentinus_state nog aanmaken (SQL in
attentinus/README.md). Gerichte promote van attentinus/ + home.js +
practice.js + style.css (andere sessies hadden sandbox-werk in flight);
geen cache-bump (network-first shell).

## 2026-08-19 (v2026.08.19-8) — Takenlijst-veegronde: triage-redesign, kalender-drags, weeknummers, backlog, historie

Grote veegronde door Tinus' openstaande-punten-lijst. Triage opnieuw
vormgegeven: swipen beslist keep/nope, de verouderde X/⋯/✓-cirkels en
"Undo last" zijn vervangen door één balk met de vroegere ⋯-menukeuzes als
icoonknoppen (Later · Note · Task · Project · Undo), soepeler animaties
(spring-terug, stapel-promotie, beslissings-pil i.p.v. kleurvlak), en een
triage-historie (klokje in de header + "Triage decisions" in Calendar →
History; log in k("triage.log"), lokaal net als capture.log). De capture-FAB
verbergt zich op de Triage-tab (stond op Undo). Kalender: shift+slepen
dupliceert een blok (origineel blijft vervaagd staan), en een blok op de
all-day-strook droppen maakt de taak Outlook-achtig tijdloos op die dag
(strook licht op, label "All day") i.p.v. klemmen op 00:00. Weeknummers in
maandview gefixt: de Wk-cel erfde aspect-ratio 1:1 van .cal-cell en werd
door de gelijke-rijhoogtes (v-19-1) rijhoogte-BREED, waardoor hij onder de
maandagkolom schoof — .cal-cell.cal-wk wint nu (het ISO-rekenwerk klopte al).
Backlog toont nu ook to-do-items (zelfde pool; chip "To-do", badge telt mee)
en is te herordenen met vasthouden-en-slepen (Items.setOrder bestond al; ▲▼
blijft). "Hold to ponder" is weg uit quick capture (nooit gebruikt) — nog
geparkeerde rijen worden stil vrijgegeven; capture-sheet kreeg "See history →".
Settings → Agenda: "Copy gym schedule (next 14 days)" kopieert gym-dagen/
-tijden uit agenda-items (tekst/categorie-match) om te delen. Geverifieerd
als al gefixt: uitstellen schuift endDate mee (overal), geen sync tijdens
typen (uiBusy-guard v-19-1), offline werkt (network-first + cache-fallback;
edge: verse boot offline verliest pre-pull-edits, by design). Vault-scan:
2 app-captures zonder tags + 1 goodmorning→goodmorning-app-drift gefixt,
seed-tabel "note types & topics" toegevoegd aan de conventies (approved:
pending). Tests: agendasync.behaviour.mjs 7/7 groen. Geen cache-bump
(network-first shell). Gerichte promote: promote.sh niet gebruikt omdat
andere sessies explainer/ en sandbox/notesprint onder handen hebben;
sandbox/home.js en style.css dragen Attentinus/Opduikinus-werk dat bewust
niet mee-promoot.

## 2026-08-19 (v2026.08.19-7) — Radar "Week in review" in de app (feed-contract uitgebreid)

De radar-strip toont nu een "Week in review"-blok wanneer de feed
`today.radar.weekly = { date, lines[] }` bevat: max 5 korte regels uit de
wekelijkse meta-review, automatisch verborgen zodra de samenvatting ouder is
dan 10 dagen (een stilgevallen taak laat dus niets stafs hangen). Contract
vastgelegd in de vault-spec (40 Projects/2026-07-15-daily-digest-app-
instructions-and-build-prompt.md); de daily-digest-taakprompt moet het veld
nog gaan schrijven — snippet daarvoor ligt bij Tinus. Sandbox-feed heeft
voorbeelddata. Chirurgische promote van alleen het weekly-blok in home.js
(sandbox/home.js bevat Attentinus-werk van een andere sessie dat bewust
niet mee is gepromoot). Geen cache-bump (network-first shell).

## 2026-08-19 (6) — WijnWijs route B: herbouw als leesbare broncode (gerichte promote)

WijnWijs is herbouwd van een 428KB prebuilt bundle naar ES-modules in
wine/src/ (vogelspotinus-patroon; boot.js laadt src/main.js, bundle.js weg).
Vragenbank (210 vragen) leeft nu als broncode met 11 genormaliseerde topics.
Alle façade-onderdelen uit de review van 18/8 zijn vervangen door echt gedrag:
streak/dagdoel/weekgrafiek uit een oefenlogboek, dekking = beantwoord/210,
beheersing zonder 88%-plafond, échte flashcards/examenstand/zwakke plekken,
wijnboek koppelt vragen op gewogen trefwoorden. State v3 migreert v2 (xp,
reviews, wijnboek blijven). Tests: tests/wijnwijs.core.test.mjs (16 groen).
Gerichte promote van alleen wine/ (andere sessies hadden sandbox-werk in
flight); geen cache-bump (network-first shell).

## 2026-08-19 (5) — Trainerinus: oefencoach-dashboard (gerichte promote)

Nieuwe utility-app trainerinus/: per dag groen/grijs voor Vogelspotinus,
ChordSprint, NoteSprint en Kangaroo, gezamenlijke alles-groen-streak en
weekgrid. Vogels/gym exact uit hun state-tabellen, chords/notes via
state-hash + updated_at-heuristiek (historie bouwt vanaf nu op). Home toont
een rij zolang er vandaag nog iets grijs is; launcher-tegel in practice.js.
Sync-tabel trainerinus_state moet nog aangemaakt (SQL in trainerinus/README.md);
tot die tijd draait de app lokaal. Gerichte promote van alleen trainerinus/ +
practice.js (promote.sh niet gebruikt: andere sessie had sandbox/notesprint
onder handen); de home-tegel-code zat al in v2026.08.19-4. Geen cache-bump
(network-first shell).

## 2026-08-19 (v2026.08.19-4) — Radar 2.0 + drie nieuwe thema's (Carbon/Slate/Porcelain) + werkende themapreview

Radar 2.0: elk radar-item zonder taak heeft nu een "+ task"-knop in de strip
(één tik = radar-getagde to-do op vandaag), en de urgentiedrempels (rood/amber,
voorheen hard 7/30 dagen) zijn instelbaar via Settings → Compliance radar en
syncen mee (k("radar.cfg") in de sync-KEYS). Dode radarBadge verwijderd. De
wekelijkse radar-samenvatting in de feed is taak-kant (Cowork), niet app-code.
Drie nieuwe thema's naast de bestaande zeven: Carbon (vlaggenschip-dark:
near-black, gelaagde kaarten met subtiele gradient/elevatie, azuur accent),
Slate ("normal": rustig grafiet tussen licht en donker) en Porcelain (warm-
neutraal licht met zachte papier-schaduwen). Plus een echte fix: de theme-
swatches in Settings toonden allemaal het actieve palet (vars stonden alleen op
:root[data-theme]) — elke swatch previewt nu zijn eigen kleuren. Geen
cache-bump nodig (network-first shell). Gerichte promote.

## 2026-08-19 (v2026.08.19-3) — Editor-sheet vraagt bevestiging bij weggooien; dode dagview-code weg

Een tik naast de open to-do/chore-sheet (of een swipe-down) gooide getypte
invoer stilletjes weg; met onopgeslagen wijzigingen komt er nu eerst "Discard
unsaved changes?" (de Cancel-knop blijft direct — dat is een bewuste actie).
Verder buildDayHeader/buildDayTimeline verwijderd: dood sinds de Day-view via
het Outlook-weekgrid loopt, plus de bijbehorende verweesde CSS. Geen
cache-bump nodig (shell is network-first). Gerichte promote van calendar.js +
style.css.

## 2026-08-19 (v2026.08.19-2) — Vogelspotinus: Griftpark-100-cursus + oefensessies met een einde

Het leersysteem is herbouwd rond het doel "leer de 100 vaakst gehoorde
Griftpark-vogels" (luistervink.nl). Home toont nu één cursuskaart met één knop;
een sessie = max 20 herhalingen + 5 nieuwe vogels in cursusvolgorde, eindigt
met een samenvatting, en fouten komen binnen de sessie terug. Meerkeuze en
typen voeden nu ook de Leitner-planning (telden voorheen niet mee), afleiders
zijn gelijkende soorten, en 398 extra iNaturalist-foto's + geluid->naam en
naam->foto-vragen voorkomen dat je de foto leert in plaats van de vogel.
Bladeren sorteert standaard op echte waarnemingsaantallen. Gerichte promote:
alleen vogelspotinus/ (andere sessies hadden sandbox-werk in flight).

## 2026-08-19 (v2026.08.19-1) — Kalender-bugfixes: to-do's overal aanmaken/bewerken, geen refresh tijdens typen

De to-do/chore-editor is nu een bottom-sheet die in élke kalenderweergave
verschijnt — voorheen zette "Edit details" vanuit Agenda / My Day / Done /
History (en vanaf home) alleen een vlag en verscheen er niets. Agenda en My Day
hebben een eigen "+ Add task"-knop (My Day sprong eerst naar maandview).
De druppel/+ kan nu échte to-do's maken: soort "Task" heeft een When?-rij
(Today standaard / Tomorrow / datum / geen datum = oude backlog-gedrag).
Sync ververst de UI niet meer tijdens het typen: geen pull zolang een veld
focus heeft of een sheet openstaat, geen re-render als de gepulde snapshot
identiek is (eigen push-echo), en de SW-update-reload wacht tot je klaar bent.
Appearance (thema) en triage-status (decisions/handedOff/notes) syncen nu mee
in agenda_state — thema "wordt niet opgeslagen" was cross-device, en het
triagedeck kwam op elk ander apparaat opnieuw langs; stale ids worden gesnoeid.
Maandview-cellen zijn weer allemaal even hoog (grid-auto-rows: 1fr), home heeft
één 12px-ritme (quicklinks/tiles/radar), en de compliance-radar noemt nu de
dichtstbijzijnde deadline bij naam ("73d · ISO 27701 …"). Cache v65→v66.
Gerichte promote (promote.sh niet gebruikt: andere sessies hebben
sandbox/vogelspotinus en sandbox/notesprint onder handen).

Volledig herontwerp van events/: rustige witte look, strakke SVG-lijniconen
i.p.v. de unicode-glyphs, lichte zijbalk, nette mobiele bottom-nav (5 tabs) met
wit "More"-paneel. Regio's die je toevoegt (bv. Amsterdam) zijn nu zichtbaar in
de topbar en zijbalk en kunnen ook weer verwijderd worden (net als voorkeuren);
dode Settings-velden (Home city, Notifications, film-alert checkboxes) die
niets opsloegen zijn weg. Nepdata vervangen door echt: datum in Discover-header
was hardcoded "12 August", deadline-telling en Timeline-cutoff waren vaste
datums, Sources-statistieken ("92% coverage") waren verzonnen. Lopende
meerdaagse events blijven nu in Discover staan (verdwenen eerder zodra ze
begonnen) en tonen "NOW until …"; Timeline groepeert ze onder "Ongoing".
Gerichte kopie naar sandbox/events (identiek aan live).

Broncode nu in de repo (kangaroo-src/, bash kangaroo-src/build.sh). Body map is
de homepage; Quick actions/This week/setup-strip weg; nieuwe History-tab
(workouts + cardio); sessievoortgang overleeft een reload en 'Finish & log
workout' logt ook deels afgemaakte sessies (oorzaak van de 0-workouts-teller);
Knees toegevoegd aan body map en spierlijst. Gerichte promote van alleen
kangaroo/ (promote.sh niet gebruikt: andere sessie had sandbox/vogelspotinus
onder handen).

## 2026-08-18 (v2026.08.18-1) — Settings toont versie


## 2026-08-17 (3) — service worker: network-first ook in submappen

De vorige fix gold alleen voor bestanden direct onder de scope, dus utility-
submappen (vogelspotinus/, events/, kangaroo/, ...) bleven cache-first en
serveerden na een deploy nog de oude build. Nu geldt network-first voor alle
HTML/JS/CSS onder de scope; afbeeldingen, iconen en statische data-JSON blijven
cache-first. Cache dd-shell-v37 -> v38, sandbox v56 -> v57.

## 2026-08-17 (2) — Vogelspotinus module-herbouw geintegreerd (promoted)

- De standalone app is herbouwd naar ES-modules; boot.js injecteert nu een
  enkele module-entry na de Supabase-pull in plaats van zes losse scripts.
- Twee dataregressies gefixt die de herbouw stil zou hebben veroorzaakt:
  vogelspotinus.stats werd niet meer geschreven (streak/longest/dailyGoal), en
  recordAnswer wiste seen/correct/wrong/lastSeen bij het eerstvolgende antwoord.
- Statuskaart en de tegels Herhalen / Bekende vogels / Lastige vogels terug,
  nu als src/core/progress.js bovenop leitner.js.
- Live cache dd-shell-v36 -> v37.

## 2026-08-17 — Utilities launcher + morning loop verwijderd (promoted from sandbox)

- Utilities: de horizontale tabrij is vervangen door een launcher-grid met alle
  zes utility-apps; tikken opent de app in dezelfde iframe met een terug-knop.
  Slider (60-240px) voor het tegelformaat. `Finish →` verwijderd.
- Morning loop volledig weg: loop-kaart, done-kaart, streak, voortgangsring en
  de stap-markers. `loop.js` blijft bestaan — dat bestand bevat ook
  DigestNotes/DigestQueue/DigestSync, waar Triage en de vault-bridge op leunen.
- Home: twee smalle app-tegels (NoteSprint, ChordSprint) naast de weertegel, en
  een Events-tegel die alleen verschijnt als er ongeziene events zijn.
- Service worker: navigaties en shell-bestanden gaan nu network-first met
  cache-fallback (waren cache-first, waardoor een deploy pas bij de tweede keer
  openen zichtbaar werd). Live cache dd-shell-v35 -> v36.
- Promotie-runbook gecorrigeerd: `items-seed.json` en `manifest.json` moeten
  net als `feed.json` worden overgeslagen; de guard controleert nu ook of
  manifest.json geen SBX-branding bevat.

## 2026-08-16 (Event Tracker weekly catalogue refresh)
- Scheduled `event-tracker-catalog-refresh` run. Checked the Utrecht general/
  music/nature/museum/venue sources, the five film sources and the Dune: Part
  Three monitored-film sources. Dune: Part Three still verified at 18 December
  2026 on Legendary/IMAX — no Dutch release, ticket or format change, so
  `monitored-films.ts` is untouched.
- Added Nederlands Film Festival 2026 (46th edition, 25 Sep - 2 Oct 2026,
  official filmfestival.nl programme page): eight days of national premieres,
  Gouden Kalveren, Storyspace and free NFFx030 open-air screenings across the
  city; voorverkoop already open. Note: the NFF's own Slachtstraat venue page
  still carries a stale "20 t/m 27 september" line — the official festival
  page's 25 Sep - 2 Oct was taken as authoritative.
- Added two one-night Louis Hartlooper Q&A specials from the official LHC
  programme: The Desert Of The Real + Q&A (17 Aug, Luuk Bouwman on psychosis,
  director present) and Fragments Of Belonging + Q&A (31 Aug, Tatjana Bozic).
  Hartlooper snapshot record count 3 -> 5, `scrapedAt` moved to 2026-08-16.
- Considered and deliberately skipped: Springhaver's NT Live "The Playboy Of
  The Western World" (listed as Verwacht with no date at all — ambiguous, not
  guessed), Springhaver's weekly Summer Film Festival and LHC's Weekly Preview
  / filmcursussen (routine recurring programming), Kasteel de Haar's
  Septembertraditie and garden tours (routine annual), Centraal Museum's
  announced graffiti exhibition (no verifiable dates on the official site yet),
  and a secondary-source claim that Bioscoop 10-Daagse now has 180+ rather than
  150+ venues (no official basis, left as is). Kinepolis Utrecht remains
  client-rendered and stays flagged Warning with 0 records. Cache v34 -> v35
  (sandbox v51 -> v52).

## 2026-08-13 (Event Tracker weekly catalogue refresh)
- Scheduled `event-tracker-catalog-refresh` run. Checked all listed Utrecht
  sources (general/gemeente/ontdek, music, nature, museums, venues/film
  houses, Kinepolis coming-soon, NVPI premieres) plus the Dune: Part Three
  monitored-film sources; no changes to `sources[]` health or the film
  snapshot were warranted.
- Added three new core events, each independently source-verified:
  Festival Oude Muziek Utrecht 2026 "Giving Voice" (28 Aug - 6 Sep, official
  oudemuziek.nl), the Gerard van Honthorst retrospective at Centraal Museum
  (closes 13 Sep, first-ever Honthorst retrospective, official museum page),
  and Nacht van de Nacht 2026 (24 Oct, official nachtvandenacht.nl, 22nd
  edition dark-sky campaign with Utrecht-province activities).
- Considered and deliberately skipped: Pluk de Nacht (annual, already
  ending), two conflicting "Kastelentocht" events (cycling vs. carriage
  tour, ambiguous/overlapping sourcing), a "Dick Bruna 100 jaar" exhibition
  claim that couldn't be verified against the official museum site, and
  Jaarbeurs trade fairs (routine B2B programming, not this catalogue's
  flavor). Cache v33 -> v34 (sandbox v50 -> v51).

## 2026-08-13 (Event Tracker promoted to live)
- New `events/` Utilities app: personal event tracker (Discover/Inbox/Saved/
  Actions/Timeline/Sources/Archive/Settings), ported off a standalone
  Next.js/Cloudflare/D1 project onto a static bundle + Supabase persistence,
  matching the wine/kangaroo/notesprint/vogelspotinus pattern. Tracking state
  (save/dismiss/plan/booked, notes, manual events, source toggles, discovery
  preferences/regions) syncs via a new `eventtracker_state` table; the event
  catalogue itself ships baked into `bundle.js` and is not synced. Built and
  verified in sandbox first (Tinus confirmed save/dismiss/notes/reload work),
  then promoted surgically: new `events/` folder + tab button in index.html +
  `APPS.events` entry in practice.js. Cache v32 -> v33.

## 2026-08-09 (P1: satellite apps could wipe their own server data)
- WijnWijs, Kangaroo, NoteSprint and ChordSprint all shared the agenda bug that
  wiped the live agenda, in a second form. Their push deletes their own keys from
  the row and re-adds whatever is in localStorage — correct only if the pull
  populated it. But all four treated a FAILED pull as success (`cb()` on the error
  path), mounted the app on empty state, and the first write wiped the row.
- Fix 1: a failed pull is now fatal — the app does not mount and the storage shim
  is never armed, so no write (and therefore no push) can happen. The user gets a
  "couldn't load, reload" gate instead of a silently empty app.
- Fix 2: pushes are refused outright when local holds no data but the server does.
- Fix 3: wine/kangaroo gain a `primed` flag; pushNow is a no-op until a pull has
  actually succeeded (notesprint/ear-training already had `ready`, now only set on
  success). Cache v29 -> v30.
- Known trade-off: deliberately clearing ALL of an app's data no longer syncs that
  emptiness to the other devices. Losing a "delete everything" beats losing everything.

## 2026-08-09 (agenda recovery)
- One-time client-side restore of the wiped live agenda from the 2026-08-07 vault
  backup (8 open to-dos, 17 completed, 5 chores). agenda_state is read-only to the
  service_role by design, so the write happens in-app under the user's own auth,
  the same way items.js seeds. Runs only after the first pull, only once, and only
  when the local to-do list is genuinely empty, so it can never overwrite anything
  re-created since. Cache v28 -> v29.

## 2026-08-09 (HOTFIX: agenda sync could wipe the live agenda)
- ROOT CAUSE of the live agenda loss at 13:46Z. items.js seeded a new vault item
  via a blind `setTimeout(seedOnce, 8000)` fallback that fired BEFORE AgendaSync's
  first pull returned (the v27 cache bump forced a full shell refetch, slowing
  boot). seedOnce -> save() -> AgendaSync.pushNow() pushed a snapshot in which
  dd.todos/chores/history/workweek were still absent (null), and push() wrote
  those nulls over the good server row. Every device then pulled the nulls and
  applySnapshot() deleted them locally too.
- Fix 1: push() never writes an ABSENT local key (null) over existing server data.
  An explicit [] (you deleted everything) still syncs — only "not loaded yet" is
  blocked.
- Fix 2: applySnapshot() never deletes non-empty local data because the server
  says null, so a device holding the last surviving copy keeps it.
- Fix 3: AgendaSync is "primed" only after the first successful pull; pushNow /
  tick / pullNow refuse to push before that.
- Fix 4: items.js seedOnce waits for the first pull when a sync session is active
  instead of firing blind at 8s. Cache v27 -> v28.

## 2026-08-09 (WijnWijs topic-linking + calendar/capture/subtask fixes)
- WijnWijs: Onderwerpen are now derived from the real question bank and grouped by
  each question's topic; tapping an onderwerp starts a practice filtered to that
  topic. Topic progress bars and profile "Retentie" are computed from reviews
  instead of hardcoded 0%.
- Calendar all-day: tapping an all-day chip no longer fires the cell's
  drag-to-create editor over the item menu, so all-day items can be opened and
  deleted like normal tasks.
- Postpone/move/drag now shift a to-do's end date together with its start date,
  so postponing today->tomorrow no longer leaves the item stuck under "today".
- Quick capture: Task/Project create an in-app item directly (Task->To-do,
  Project->Idea) instead of a vault-inbox capture; Note still routes to the inbox.
- Item subtasks: the Tasks/Projects panel keeps its open state across edits (edit
  several subtasks without it snapping shut), and done subtasks sort to the bottom
  (item panel + detail sheet). Cache v26 -> v27.

## 2026-08-05 (NoteSprint local + sync for both games)
- NoteSprint is now a LOCAL copy behind goodmorning (/notesprint/) instead of the
  external github.io link (external site left untouched); Utilities tab repointed.
- NoteSprint and ChordSprint (ear-training) now sync their scores/settings to
  per-user Supabase rows (notesprint_state / chordsprint_state), env-namespaced
  (dd:/sbx:) behind the login gate, via a boot layer that defers each app's own
  script until after the pull. Daily digest backs both up to rolling vault files.
  Cache v25 -> v26.

## 2026-08-05 (WijnWijs greeting)
- Also removed the hardcoded "Goedemorgen, Martijn." greeting -> "Goedemorgen."
  No personal name remains in the app. Cache v24 -> v25.

## 2026-08-05 (WijnWijs profile)
- Replaced the hardcoded profile name "Martijn Mensink" (avatar MM) with a neutral
  "Wijnstudent" (avatar WS, kicker "Profiel"). Cache v23 -> v24.

## 2026-08-05 (WijnWijs level lock + hardcode cleanup)
- SDEN 3 / WSET 3 are now locked (greyed, "binnenkort") until they actually have
  content — a level unlocks automatically once it has non-starter approved
  questions. Applies to the Leren level-switch and the Settings dropdown.
- Removed the last hardcoded demo progress: the fake "Ga verder — Frankrijk: Loire,
  Les 4 van 7, 58%" card is now an honest "Aanbevolen" shortcut with no fake bar.
  Cache v22 -> v23.

## 2026-08-05 (WijnWijs lessons)
- Removed the hardcoded "Voltooid" state on the first two lessons of each topic
  (was faked via index<2, not tied to real progress and not resettable). Lessons
  now just show their number + duration. Cache v21 -> v22.

## 2026-08-05 (WijnWijs fixes)
- Quiz now shuffles the WHOLE active pool (all 210 incl. the 200), due-for-review
  first, instead of always serving the same front-of-list starter questions.
- Reset the demo/test data: xp/streak start at 0, learningTopics + mastery /
  retention / week-bar numbers zeroed, and a one-time state reset (version 2)
  clears any already-saved test progress. Cache v20 -> v21.

## 2026-08-05 (WijnWijs 200 questions)
- Bundled the full SDEN2 question bank into WijnWijs: the embed was shipping only
  the 10-question starter set, so the 200 imported questions (two 100-Q packages)
  weren't present. Baked all 200 into the app's base set (210 total, all pass the
  approved-question filter). Cache v19 -> v20.

## 2026-08-05 (WijnWijs)
- Added a 4th **Utilities** app: **WijnWijs** (wine trainer, SDEN2 quiz) as a
  self-contained static bundle, beside NoteSprint / ChordSprint / Kangaroo.
- Login-gated (valid Supabase session) with its progress (`wijnwijs-v1`) synced
  to a per-user `wine_state` row, env-namespaced (`dd:` live / `sbx:` sandbox) so
  sandbox testing can't touch live progress. Daily digest mirrors live progress
  to a rolling vault file. Cache v18 -> v19.

## 2026-08-05 (later)
- Promoted the remaining pending sandbox work to live: the **Supabase-primary
  items switch** (`items.js` one-time client-side seed migration, merges vault
  tasks/projects by id under the user's own auth, runs once), **item-card
  subtasks** on the home tiles (`home.js`), and smaller calendar / item-detail /
  agenda-sync / theme / fx tweaks. Env-identity files (manifest name+theme,
  sw cache name, index title) left as live. Cache v17 -> v18.

## 2026-08-05
- Renamed the **Practice** tab to **Utilities** and added a third app — the
  **Kangaroo Gym Tracker** (self-contained static bundle) — beside NoteSprint +
  ChordSprint. The morning loop still always opens the note game.
- Kangaroo is **login-gated** (needs a valid Supabase session) and its data syncs
  to a per-user `kangaroo_state` row, namespaced by environment (`dd:kangaroo-*`
  live / `sbx:kangaroo-*` sandbox) so sandbox testing can never touch live gym
  data. Daily digest mirrors the live data to a rolling vault file. Cache v16 -> v17.

## 2026-08-04
- Promoted phase-1 to live: unified task/project store (`items.js` + `dd.items`),
  Backlog list type (add/reorder/promote/schedule), and the 3-tile homepage.
  Seeded `items-seed.json` from the current vault (26 items). Calendar/agenda
  (`dd.todos/chores/workweek`) untouched. Emoji++ theme preserved. env.js added
  to the service-worker precache. Cache bumped v14 -> v15.
- New **Emoji++** theme: orange-forward, high-contrast evolution of Emoji+ (deep
  warm text on cream, vivid orange accent, stronger borders, more modern emoji
  accents across the home tiles). Selectable in Settings → Theme.

## 2026-08-04
- Runtime-namespace refactor: added `env.js` (sets `DD_ENV` + `k()` from the URL
  path). All `dd.*` / `sbx.*` storage-key literals across live and sandbox now go
  through `k("name")`, so the same code reads `dd.*` at `/` and `sbx.*` under
  `/sandbox/`. Title and the sandbox reset button are namespace-derived. This
  makes sandbox→live promotion safe: copied code self-corrects by path.
- Added `tools/check-live-clean.sh` + CI (`.github/workflows/guard.yml`) that
  fail any commit hardcoding a namespace, leaving "SBX" in the live title, or
  mounting the reset button unguarded.
- Hotfixes (commit 818ee07): live title `SBX · Daily Digest` → `Daily Digest`;
  path-guarded the reset button so it can never wipe live `dd.*` data.
- Incident: promoting the sandbox build to live blanked the calendar/work
  planning (live read `sbx.*` test keys). Rolled back; no data lost. Root cause
  and fix: see `40 Projects/2026-08-04-sandbox-live-promotion-safety-spec` in the vault.
