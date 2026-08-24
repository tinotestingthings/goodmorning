# Spotinus — van vogels naar meer dieren (honden eerst)

Plan (23 aug 2026). **Status: fase 1, 2 en 3 gebouwd op 23 aug, staan in
`sandbox/vogelspotinus/` — nog niet gepromoot.** Fase 4 bewust open gelaten.
Vogelspotinus wordt Spotinus:
dezelfde app, dezelfde leermethode, maar de dataset is niet langer "vogels" maar
"soorten", met per soort een `kind`. Eerste extra kind: honden(rassen).

Uitgangspunt: **de app hoeft nauwelijks te veranderen.** Ik heb de codebase
nagelopen en het meeste is al soort-agnostisch — de Leitner-planning, de
detailkaart, het geluid, de quizmodi. Wat wél moet, is precies aan te wijzen.

---

## Wat er nu staat (nagelopen, niet gegokt)

| Onderdeel | Stand van zaken |
|---|---|
| `vogelspotinus/src/` | 47 ES-modules, ~5000 regels, strakke laagindeling (`core/` ← `ui/` ← `screens/`) |
| `data/birds.json` | 566 vogels, 1 MB, 22 velden per soort |
| Identiteit | `scientificName` is overal de sleutel: 31 plekken in 12 bestanden |
| Opslag | `vogelspotinus.*` in localStorage → `vogelspotinus_state` in Supabase, via `boot.js` |
| `data/bird-tiles.json` | wordt **niet** door de app gebruikt, maar door de Digest-home (`home.js:355`) en `sw.js:37` |
| Live vs sandbox | `diff -rq vogelspotinus sandbox/vogelspotinus` is leeg — schone start |

Drie dingen die het werk kleiner maken dan verwacht:

1. **Geluid is al afgevangen.** `session.js:51/54`, `sound.js:37` en
   `bird-media.js:92` kijken allemaal naar `bird.soundUrl`. Een hond met
   `soundUrl: null` krijgt vanzelf nooit een luistervraag en nooit een
   speaker-knop. **Nul regels werk.**
2. **De detailkaart is al veldgestuurd.** Elke rij in `detail-sheet.js:84-101`
   staat achter een `if (waarde)`. Een hond zonder habitat of IUCN-status toont
   die rijen simpelweg niet. **Nul regels werk.**
3. **`scientificName` is bijna overal identiteit, niet weergave.** Van de 31
   plekken zijn er maar 3 weergave (`bird-names.js:21`, `home.js:69`,
   `builder.js:122`). De rest is een sleutel in een Map, een Set of een
   state-object. Dat maakt de refactor mechanisch.

---

## Beslissingen (default gekozen — zeg het als je het anders wilt)

### 1. Map, tabel en opslagprefix blijven `vogelspotinus` — alleen de naam op het scherm wordt Spotinus ✅ *bevestigd*

Dit is de belangrijkste beslissing en ook de saaiste. `vogelspotinus_state` in
Supabase en de `vogelspotinus.`-sleutels in localStorage bevatten je hele
Leitner-voortgang. Die hernoemen is een migratie met een datarisico, voor exact
nul functionele winst. Regel 2 uit `CLAUDE.md` gaat hier over.

Wat wél verandert: `<title>`, de `<h1>`, `manifest.json` (naam + short_name),
het icoon en alle UI-teksten. De app *heet* Spotinus.

**Als je de URL óók wilt** (`/spotinus/` in plaats van `/vogelspotinus/`): dat
kan veilig, mits `TABLE` en `PREFIXES` in `boot.js` onaangeroerd blijven — dan
verhuist alleen het pad, niet de identiteit van de data. Kosten: `home.js:355`,
`sw.js:37`, `APPS.md`, `tools/*.mjs` en een `vogelspotinus/index.html` met een
redirect voor de PWA die je op je telefoon hebt geïnstalleerd. Dat is een aparte
fase, geen bijvangst. Ik doe het niet tenzij je het zegt.

### 2. Identiteit wordt `id`, met `id === scientificName` voor vogels

Een hondenras heeft geen soortnaam — een Labrador en een Chihuahua zijn allebei
*Canis lupus familiaris*. Dus:

- Elk record krijgt `id`.
- Vogels: `id = scientificName`. **Daardoor blijft alle bestaande state geldig**
  — de sleutels in `vogelspotinus.leitner`, `.favorites` en de custom games
  veranderen niet.
- Honden: `id = "dog:" + wikidataId` (bv. `dog:Q38571`). Stabiel, uniek, en te
  herleiden naar de bron.
- `scientificName` blijft bestaan als *weergaveveld* en is `null` voor honden.
  De cursieve regel onder de naam verdwijnt dan gewoon (zoals de andere
  detailrijen dat al doen).

Hernoemen: `byScientificName` → `byId`, `birdByScientificName()` → `speciesById()`,
en `specificBirds` in de filterselectie → `specificIds` (met een migratie-shim
die de oude sleutel leest, want die staat in opgeslagen custom games).

### 3. `kind` wordt een gewone tag, met één prominente schakelaar erboven

`tags.kind` = `"bird"` of `"dog"`. Daarmee werkt `matchesFilters()` ongewijzigd
en krijgt de custom-game-builder het gratis. Maar de schakelaar zelf hoort niet
weggestopt in het Opties-blad: bovenaan Bladeren én Quiz komt een segmented
control **Alles · Vogels · Honden**, die op dezelfde selectie schrijft.

Default bij eerste start na de update: **Alles**. Je huidige quiz mengt dan
vogels en honden — wat verrassend goed werkt, want de afleiders komen uit dezelfde
pool en een hond tussen de mezen is meteen fout te herkennen. Wil je liever dat
hij op **Vogels** start (geen verandering voor bestaande gebruikers), zeg het.

### 4. Filters die niet bij het kind passen verdwijnen vanzelf

`nlStatus`, `commonness` en `family` zijn vogelbegrippen. In plaats van per
filter een `kinds: ["bird"]`-lijstje bij te houden, verbergt de filterbalk elke
dimensie waarvan **geen enkele soort in de huidige pool** een waarde heeft. Zes
regels in `filter-bar.js`, en het klopt automatisch voor elk kind dat er later
bij komt. Geen registry-onderhoud.

### 5. "Familie" voor honden = land van herkomst

De afleiders in `distractors.js` scoren op familie (4 punten), grootte (1) en
kleuroverlap (1). Zonder groep wordt "Labrador of Chihuahua?" — precies de
te-makkelijke vraag waarvoor die module geschreven is.

Ik heb gekeken of de FCI-groep te halen is: **nee.** De moderne
`{{Infobox dog breed}}` op en.wikipedia heeft geen `fcigroup` meer (gecheckt op
5 rassen: leeg bij alle vijf), en Wikidata's `P279 subclass of` dekt maar 199
van de 555 rassen, waarvan 111 letterlijk "dog". FCI-groepen scrapen van
fci.be is een eigen project.

Wat wél in de data zit: **land van herkomst** (`P495`, 468 van de 555). Dat
vult het bestaande `origin_en/origin_nl`-veld dat vogels ook hebben, is meteen
een leuke filterdimensie ("Nederlandse rassen"), en geeft de afleiders een echt
signaal — herdershonden uit hetzelfde land lijken op elkaar. Samen met
grootte en kleur is dat genoeg. `similarity()` krijgt één extra regel:
`origin` telt 3 punten als `family` ontbreekt.

### 6. Populariteit uit Wikipedia-pageviews

`browse.js:30` sorteert "meest voorkomend" op `gbifOccurrenceCount`. Honden
staan niet in GBIF. Ik vul voor honden `popularity` met het aantal
en.wikipedia-pageviews over 12 maanden (Wikimedia REST API, één call per ras in
het buildscript). Dat is de beste beschikbare proxy voor "ras dat je herkent",
en het levert gratis de volgorde op voor een eventuele hondencursus (fase 4).
De sorteerfunctie valt terug: `b.gbifOccurrenceCount ?? b.popularity ?? 0`.

### 7. Teksten worden neutraal, niet kind-afhankelijk

Ongeveer 30 strings in `strings.js` zeggen "vogel". Die worden "dier" / "soort":
"Dier van vandaag", "Zoek een dier…", "Volgende dier", "Geen dieren gevonden".
Per-kind teksten ("Welke hond is dit?") betekenen een tweede stringtabel-as en
lossen niets op wat "Welk dier hoor je?" niet ook oplost.

Twee uitzonderingen die wel kind-afhankelijk moeten:
- `length` → voor honden is 30 cm geen lengte maar **schofthoogte**.
- Het thema `Vogelaar` blijft `Vogelaar` heten (het is een kleurenpalet, geen
  claim over de inhoud).

### 8. De Griftpark-cursus blijft van vogels

`course.js` en de oefensessie op Home draaien op de Griftpark-100. Die blijft
zoals hij is — vogels. Honden krijgen in fase 4 eventueel een eigen lijst
("de 50 rassen die je in het park tegenkomt", op pageviews), maar de app werkt
prima met één cursus en een vrije quiz over de rest.

### 9. Meerdere foto's per ras, uit het Wikipedia-artikel ✅ *bevestigd*

Honden krijgen net als cursusvogels vier foto's, zodat je op het ras traint en
niet op de foto. Bron: **de foto's die in het Wikipedia-artikel zelf staan**,
niet de Commons-categorie.

Dat onderscheid is belangrijk en getest. De Commons-categorie van een ras bevat
alles wat ooit "hierbij hoort": de eerste vier bestanden in
`Category:Labrador Retriever` bevatten een röntgenfoto van heupdysplasie, en
`Category:Keeshond` een foto van een muzikant. De artikelfoto's zijn door
redacteuren gekozen en dus wél van de hond. Gemeten over 4 rassen:
**gemiddeld 12,3 bruikbare foto's per ras, 4 van de 4 rassen haalden er ≥ 3.**

Twee filters bovenop, want ook artikelen bevatten schilderijen en close-ups:

- **Licentie als datumfilter.** Moderne foto's zijn CC BY / CC BY-SA; 19e-eeuwse
  schilderijen zijn PD-old / PD-art. Alles wat PD-old-achtig is, valt af — dat
  ving in de test "Buccleuch Avon (1885).png" en "Adolf Eberle Dackelfamilie.jpg"
  precies goed op.
- **Trefwoorden in de bestandsnaam** (röntgen, schedel, diagram, logo, postzegel,
  vlag, standbeeld) en een jaartal < 1990 in de naam.

Wat daarna nog doorglipt is het type "BC eye.jpg" — een close-up van een oog.
Niet fout, wel nutteloos als quizfoto. Daarvoor schrijft het script een
**contactvel** (`dogs-photo-check.html`): één pagina met alle gekozen foto's, vier
per ras, naam eronder. Eén keer doorscrollen, de rotte eruit noteren, script
opnieuw draaien met `--exclude`. Dat is de enige menselijke stap in de pipeline,
en hij is nodig: automatisch fout materiaal leert je het ras verkeerd aan.

Formaat: `data/dog-photos.json`, exact hetzelfde als `bird-photos.json`
(`{ "<id>": [{ u, a }] }`), zodat `photos.js` alleen een tweede bestand hoeft in
te lezen en de rest van de app niets merkt.

---

## Waar de honden vandaan komen (getest, geen aanname)

Wikidata SPARQL, `?item wdt:P31 wd:Q39367` (hondenras). Gemeten vandaag:

| Filter | Aantal |
|---|---|
| Alle items "hondenras" | 1143 |
| Met foto (`P18`) + en.wikipedia-artikel | **555** |
| …waarvan met Nederlandse naam | 425 |
| …waarvan met nl.wikipedia-artikel | 361 |
| …met land van herkomst (`P495`) | 468 |
| …met schofthoogte (`P2048`) | 329 |

**Voorstel voor de set: de 361 met een nl.wikipedia-artikel.** Dat is de eis die
ook voor vogels gold (de Nederlandse naam komt uit de artikeltitel, niet uit een
Wikidata-label — dat scheelt fouten: Wikidata gaf bij een steekproef "dashond"
als nl-label voor "basset"). 361 tegenover 566 vogels is een gezonde verhouding.

Per ras haalt het buildscript:

| Veld in `dogs.json` | Bron |
|---|---|
| `id` | `dog:` + Wikidata Q-id |
| `englishName` | en.wikipedia-artikeltitel |
| `dutchName` | nl.wikipedia-artikeltitel (suffix `(hond)` gestript, zoals `(vogel)` nu) |
| `scientificName` | `null` |
| `fact_en` / `fact_nl` | `…/api/rest_v1/page/summary/<titel>` — `extract` |
| `origin_en` / `origin_nl` | Wikidata `P495`, beide labels |
| `lengthCm` | Wikidata `P2048` (schofthoogte) |
| `imageUrl` / `imageThumbUrl` | Wikidata `P18` → Commons `Special:FilePath`, met `?width=` |
| `popularity` | Wikimedia pageviews-API, 12 maanden en.wikipedia |
| `wikipediaUrl` / `dutchWikipediaUrl` | uit de SPARQL |
| `tags.kind` | `"dog"` |
| `tags.colors` | trefwoordmatch op het `colour`-veld uit `{{Infobox dog breed}}` → dezelfde 12 emmers als vogels |
| `tags.sizeBucket` | uit `lengthCm`: <35 cm klein, 35–55 midden, >55 groot |
| `tags.family` | afwezig (zie beslissing 5) |
| `soundUrl` | `null` |

De `colour`-parse is een trefwoordmatch en dus niet perfect ("fawn", "brindle",
"merle" zijn geen van de 12 kleuren). Het script schrijft een
`dogs-colour-report.txt` met wat het niet kon plaatsen, zodat je in één keer
kunt zien of het klopt. Kleuren zijn een filter, geen quiz-antwoord — een gemiste
match kost niets, een foute match wel. Bij twijfel: leeg laten.

Licenties: Wikidata is CC0, Wikipedia-tekst CC BY-SA, Commons-foto's variëren
maar zijn vrij, met bronvermelding uit `extmetadata`. Zelfde regime als de
vogels. Geen iNaturalist-stap voor honden — dat kent alleen *Canis familiaris*,
geen rassen; de extra foto's komen uit de Wikipedia-artikelen (beslissing 9).

**Let op de rate limit.** De Wikimedia-API blokkeerde tijdens het testen al na
~10 snelle calls ("You are making too many requests"). Het script houdt daarom
≥ 1,2 s tussen calls aan, met een `User-Agent` die contact bevat — zoals
`fetch-bird-photos.mjs` ook doet. Dat maakt de looptijd lang (zie fase 2), niet
onbetrouwbaar.

---

## Fasering

Elke fase is los af te maken, los te reviewen en los te promoten. Alles gebeurt
in `sandbox/vogelspotinus/`; root verandert alleen via `bash tools/promote.sh`.

### Fase 1 — `id`-refactor (geen gedragsverandering) — **gebouwd 23 aug, staat in `sandbox/`**

Puur mechanisch, in `sandbox/`, met de vogeldata ongewijzigd. Na deze fase doet
de app exact hetzelfde als nu.

Afwijkingen van wat hieronder gepland stond, na het echte werk:

- `birds.js:38` en `:101` (nu `:49`/`:113`) zijn **niet** omgezet. Die bouwen de
  zoektekst en controleren een getypt antwoord — dat is naamvergelijking, geen
  identiteit, en moet dus `scientificName` blijven. Beide doen al
  `.filter(Boolean)`, dus een lege soortnaam bij een hond valt vanzelf weg.
  Netto 26 identiteitsplekken in plaats van 28.
- `loadBirds()` throwt nu bij een ontbrekend of dubbel id (uit `/code-review`).
  Zonder die check delen twee soorten stilzwijgend één Leitner-sleutel — en die
  Map wordt load-bearing zodra fase 3 `dogs.json` erbij zet.
- `tests/vogelspotinus.identity.test.mjs` toegevoegd: 12 checks tegen de echte
  data en de migratieshim. Draaien met `node tests/vogelspotinus.identity.test.mjs`.

1. `loadBirds()`: `bird.id ??= bird.scientificName` bij het inlezen, `byId`-Map.
2. De 28 identiteitsplekken om naar `.id`:
   `course.js:35,40` · `birds.js:34,38,101` · `photos.js:47,57,75,80,86` ·
   `distractors.js:31,35` · `filters.js:151` · `favorites.js:22,31` ·
   `leitner.js:28,37,56,92` · `browse.js:66,69,174` · `home.js:162` ·
   `builder.js:89,108,111,112`
3. De 3 weergaveplekken (`bird-names.js:21`, `home.js:69`, `builder.js:122`)
   krijgen een `if (soort.scientificName)`.
4. `specificBirds` → `specificIds`, met shim in `games.js`/`filters.js` die een
   opgeslagen `specificBirds` bij het inlezen omzet. **Testen met een echte
   opgeslagen custom game**, niet alleen met een verse.
5. `data/bird-photos.json` blijft op `scientificName` staan — dat is identiek
   aan `id` voor vogels, dus `photos.js` hoeft alleen de veldnaam te wisselen.

Check: `node --check` op elk aangeraakt bestand, daarna de app in de browser met
je echte state (favorieten, Leitner-voortgang, custom games moeten er nog zijn).

### Fase 2 — `tools/build-dogs.mjs` — **gebouwd 23 aug**

Afwijkingen van wat hieronder gepland stond:

- **Looptijd 3 minuten in plaats van 45**, en `--resume` is daarmee vervallen.
  Bijna alles bleek te batchen (50 titels per call), inclusief wikitext: 112
  API-calls in plaats van ~2200. Een vlag voor het hervatten van een run van
  drie minuten is code voor een probleem dat niet bestaat.
- **`prop=extracts` en `prop=pageviews` hebben stille limieten.** De eerste
  volledige run leverde 150 van de 361 teksten op, zonder foutmelding: je vraagt
  50 titels en krijgt er 20. Opgelost door `continue` te volgen in plaats van
  per prop een limiet uit de documentatie over te typen — MediaWiki zegt zelf
  wanneer een query niet af is.
- **Foto's die bij méér dan één ras horen worden geweerd.** Eén labradorfoto
  stond bij 23 rassen en een foto van een ELAND bij 12: dat zijn beelden uit
  navigatiesjablonen, niet van het ras. Kost 39 van de 894 foto's.
- Teksten worden op twee zinnen afgekapt (max 480 tekens). `exintro` gaf bij
  honden 394 tekens gemiddeld tegen 205 bij de vogels; dat scheelde 190 KB in
  een bestand dat bij het opstarten binnenkomt.

Wat het opleverde: **361 rassen**, 360 met Nederlandse tekst, 326 met land van
herkomst, 312 met schofthoogte, 190 met minstens één kleur. **866 foto's**,
243 rassen met 2 of meer, 60 met alleen hun hoofdfoto.

#### Oorspronkelijke opzet

Eén nieuw script naast `build-bird-tiles.mjs` en `fetch-bird-photos.mjs`, zelfde
stijl: idempotent, elke run verifieert opnieuw, ≥ 1,2 s tussen calls, draait
offline en schrijft zijn bestanden pas aan het eind. Ongeveer 500 regels.

Per ras zes calls (SPARQL is één bulk-call vooraf): nl-summary, en-wikitext voor
het `colour`-veld, pageviews, artikelfoto's, `imageinfo` voor die foto's, en één
reserve. **361 rassen × 6 × 1,2 s ≈ 45 minuten.** Het script schrijft voortgang
weg en kan met `--resume` verder, zodat een afgebroken run niet opnieuw hoeft.

Levert:
- `sandbox/vogelspotinus/data/dogs.json` (~250 KB verwacht)
- `sandbox/vogelspotinus/data/dog-photos.json` (~120 KB, 4 foto's per ras)
- `dogs-colour-report.txt` — kleuren die niet in een emmer pasten
- `dogs-photo-check.html` — het contactvel om één keer door te scrollen

De app raakt in deze fase nog niets aan. Je kunt beide datasets bekijken
voordat er iets mee gebeurt; het contactvel is de go/no-go voor fase 3.

### Fase 3 — honden ín de app — **gebouwd 23 aug**

Afwijkingen:

- `birds.js` is **niet** hernoemd naar `species.js`. De hernoeming van de
  accessors (`speciesById`) draagt de betekenis al; het bestand verplaatsen
  kost een diff over 20 imports zonder dat er iets van werkt of leest.
- De verbergregel uit beslissing 4 werkt **ook binnen een dimensie**: bij honden
  blijven 7 van de 12 kleurchips over, niet alleen "Familie" verdwijnt.
- `distractors.js` kreeg een tweede term erbij: zelfde diersoort weegt 6 punten.
  Zonder dat kan een hond tussen drie mezen belanden, en dat is geen vraag.

#### Oorspronkelijke opzet

1. `birds.js` → hernoemen naar `species.js`; `loadBirds()` haalt `birds.json` en
   `dogs.json` op met `Promise.all` en concat. `dogs.json` mag falen zonder de
   app te breken (zoals `bird-photos.json` nu) — dan is het weer een vogel-app.
   `photos.js` leest `dog-photos.json` er als tweede bestand bij in en voegt het
   samen in dezelfde `extra`-map; de sleutel is `id`, dus verder verandert niets.
2. `tags.kind` toevoegen aan de vogeldata: één regel in de loader
   (`b.tags.kind ??= "bird"`), niet 566 regels in het JSON-bestand.
3. Filterregistry: `kind` erbij als `single-multi`.
4. `filter-bar.js`: dimensies zonder waarden in de pool verbergen (beslissing 4).
5. Segmented control **Alles · Vogels · Honden** boven Bladeren en Quiz.
6. `distractors.js`: `origin` als score-term (beslissing 5).
7. `browse.js:30`: sortering met `popularity`-terugval.
8. `daily.js`: `birdOfTheDay()` → `speciesOfTheDay()`, pool = cursus óf, als je
   op Honden staat, de honden. (Klein; het is nu hardgecodeerd op de cursus.)
9. Strings neutraliseren (~30 sleutels × 2 talen) + `schofthoogte` voor honden.
10. Rebrand: `<title>`, `<h1>`, `manifest.json`, `description`. Icoon: het
    `#icon-bird`-symbool in `index.html` wordt een verrekijker — dat dekt beide
    en past bij "spotten". `icons/icon-192.png` en `-512.png` opnieuw maken.

### Fase 4 — drie wensen van Tinus, **gebouwd 23 aug**

1. **Spel "Honden · NL top 30".** Er is geen open lijst van hondenregistraties
   in Nederland (de Raad van Beheer publiceert die niet), dus de maat is het
   aantal bezoeken aan het rasartikel op de NEDERLANDSTALIGE Wikipedia. Dat is
   belangstelling, geen telling — maar wel Nederlandse belangstelling: de lijst
   opent met beagle, Australische herder en cane corso, met het kooikerhondje
   op 9 en de stabij op 29. Alleen FCI-erkende rassen, wat de dingo eruit haalt.
2. **Quizmodus "Rasgroepen".** Drie honden uit dezelfde FCI-groep, kies de
   groep, krijg daarna de uitleg. De drie kaartjes zijn *de kaart uit Bladeren*
   (`birdCard`), alleen kleiner — eerst waren het losse `<img>`'s, en een tweede
   kaartontwerp gaat uit de pas lopen met het eerste. Ze zijn pas aan te tikken
   ná het antwoord: het detailblad noemt de rasgroep, dus daarvoor zou dat de
   vraag weggeven. De groepsindeling bleek wél te halen — niet
   uit de Engelse infobox (die heeft `fcigroup` niet meer) maar uit de
   NEDERLANDSE Wikipedia, op twee onafhankelijke plekken die het in nul van de
   328 overlappende gevallen oneens zijn: het `classificatie`-veld en het
   sjabloon `{{Navigatie FCI-groepN}}`. **340 van de 361 rassen.** De groep
   staat als `tags.family = "fci-N"`, zodat `distractors.js` en het
   familiefilter er zonder wijziging op werken. Uitleg per groep staat in
   `src/data/fci-groups.js`.
3. **Geluidsvragen uit.** Schakelaar in Instellingen. "Welk dier hoor je?" is
   onbeantwoordbaar zonder geluid, en een fout antwoord zet je Leitner-kaart
   terug — dus het is geen oefening maar een blokkade. Zet alleen de VRAGEN uit;
   de speelknop op een kaart blijft, want die druk je zelf in.

### Fase 5 (was fase 4) — optioneel, nog niet gebouwd

- Hondencursus op pageviews (top 50), naast Griftpark. Vraagt een keuzemenu op
  Home dat er nu niet is — echt werk, geen bijvangst.
- Tegel op de Digest-home: `bird-tiles.json` → `species-tiles.json` met honden
  erbij. Raakt `home.js:355` en `sw.js:37` in de hoofdapp.
- URL-hernoeming naar `/spotinus/` (beslissing 1).

### Fase 5 — review en promotie

`/code-review medium` over alles wat fase 1–3 aanraakte (verplicht per
`CLAUDE.md`: Vogelspotinus heeft geen tests, de review is het enige vangnet).
Fase 1 is groot genoeg om `/code-review ultra` te overwegen — die start jij.
Daarna `bash tools/promote.sh`, `diff -rq vogelspotinus sandbox/vogelspotinus`
moet leeg zijn, `sw.js` één keer bumpen, `APPS.md` en `CHANGELOG.md` bij.

---

## Risico's

| Risico | Waar | Afdekking |
|---|---|---|
| Voortgang kwijt door sleutelwijziging | fase 1 | `id === scientificName` voor vogels; de `specificBirds`-shim is het enige echte migratiepunt en wordt met een bestaande game getest |
| `dogs.json` breekt de boot | fase 3 | apart ophalen, falen is toegestaan, app valt terug op vogels |
| Verkeerd ras bij de foto | fase 2 | zelfde les als `fetch-bird-photos.mjs`: matchen op Q-id, nooit op fuzzy naamzoek |
| Röntgenfoto/schilderij/close-up als quizfoto | fase 2 | artikelfoto's i.p.v. categorie, PD-old-filter, en het contactvel als menselijke eindcontrole |
| Wikimedia-rate-limit breekt de run af | fase 2 | 1,2 s tussen calls, `--resume` |
| Kleurentags fout | fase 2 | rapportbestand, bij twijfel leeg |
| Grote diff, geen tests | fase 5 | `/code-review` vóór promote, fasen los promoten |

## Wat ik expres niet doe

- **Geen FCI-groepen scrapen.** Land van herkomst dekt de afleiders; fci.be
  parsen is een eigen project voor een marginale winst.
- **Geen ruwe Commons-categorieën uitlezen.** Getest en afgekeurd: te veel
  röntgenfoto's, logo's en mensen. Artikelfoto's leveren er al 12 per ras.
- **Geen automatische beeldherkenning om close-ups eruit te filteren.** Het
  contactvel kost je één keer scrollen en is betrouwbaarder.
- **Geen derde diersoort voorbereiden.** De `kind`-tag maakt een derde soort
  goedkoop; er nu al abstracties voor bouwen niet.
- **Geen aparte hondenmodus met eigen schermen.** Eén app, één pool, één filter.
- **Geen map-, tabel- of prefixhernoeming**, tenzij je erom vraagt.

## Grofweg wat het kost

| Fase | Omvang |
|---|---|
| 1 — `id`-refactor | ~35 kleine wijzigingen in 12 bestanden, 1 sessie |
| 2 — buildscript + data | 520 regels, 3 min looptijd, 1× contactvel nalopen |
| 3 — honden in de app | ~11 wijzigingen, 1 sessie |
| 4 — optioneel | per onderdeel 1 sessie |
| 5 — review + promotie | binnen de sessie van fase 3 |
