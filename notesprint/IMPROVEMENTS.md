# NoteSprint — improvement plan (2026-08-18, uitgevoerd 2026-08-20)

Alles uit het oorspronkelijke plan is doorgevoerd in `sandbox/notesprint/`.
Eén onderdeel is bewust blijven liggen — dat is een keuze aan jou, zie onderaan.

## Eerst: drie echte bugs (al gefixt vóór dit plan)
1. **Rush-resultaten misten je laatste antwoorden.** De score telt per noot, maar
   goed/fout/accuraatheid telden alleen *afgeronde* rijen van 5. Liep de tijd
   halverwege een rij af, dan verdwenen die antwoorden uit het resultaat.
2. **Time-out-feedback kon "/ undefined" tonen** (solfège opzoeken op `F#`) en
   liet ruwe `C#` zien in plaats van `C♯`.
3. **Thema-fallback was inconsistent** — `loadTheme()` viel in de catch terug op
   `"apple"` terwijl de default overal elders `"emoji"` is.

## 1. Sync verloor de laatste seconden van een sessie — opgelost
`pushNow()` is lees-dan-schrijf (twee round trips) en de browser breekt
lopende requests af bij unload, dus de laatste ~1,5 s aan wijzigingen (een verse
highscore, nieuwe fouten) kon stilletjes nooit aankomen. `pagehide` doet nu één
`fetch(..., { keepalive: true })` naar de REST-upsert, die de pagina mag
overleven. De merge gebeurt tegen de laatst bekende serverrij, zodat er niet
eerst gelezen hoeft te worden — de sleutels van de *andere* omgeving blijven
daarbij bewaard.

## 2. Smart practice vergat alles tussen sessies — opgelost
De weegfactoren die zwakke noten vaker laten terugkomen stonden alleen in
geheugen en werden bij elke start gewist. Ze staan nu in
`noteSprintLearningV1` (onder de `noteSprint`-prefix, dus de bootlaag synct ze
per gebruiker). Elke verstreken week halveert alle tellers, zodat een noot die
je maanden geleden fixte niet blijft domineren; de lijst is begrensd op 300
items (minst recent geoefend valt af) zodat de synclading klein blijft.

## 3. Rush-highscores waren niet vergelijkbaar — opgelost
De rush-presets zetten `accidentalMode`, `showSolfege` en `correctionTime` nu
expliciet terug, zodat "30s Rush · Normal" altijd dezelfde test is als waar de
highscore bij hoort. De cheat sheet is tijdens een test geblokkeerd (knop
uitgeschakeld én `openCheatSheet()` weigert), net als instellingen al waren.

## 4. De offline-belofte was niet waar — opgelost
Er is nu een `sw.js` per app-map: **network-first met cache-fallback**, dus een
promote komt altijd meteen door (geen stale-app-valkuil) maar zonder netwerk
komen `index.html`, `boot.js` én de Supabase-client uit cache. Een apparaat dat
was ingelogd en al gesyncte data heeft, mag offline oefenen. Offline schrijfacties
zetten een dirty-vlag (`gmOfflineDirty`, buiten de app-prefix dus nooit gesynct);
bij de volgende online load wordt lokaal dán als leidend behandeld en omhoog
geduwd in plaats van overschreven door de oudere serverkopie.

Het vangnet van 2026-08-09 blijft overeind: mislukte pull **zonder** lokale data
start de app niet. `tests/notesprint.boot.behaviour.mjs` bewaakt dit hele
beslisboompje (12 checks) — draaien met:

```bash
cd /tmp && npm i jsdom && node /Users/martijnmensink/Code/goodmorning/tests/notesprint.boot.behaviour.mjs /Users/martijnmensink/Code/goodmorning
```

## 5. Toetsenbord kon geen kruizen/mollen spelen — opgelost
Met kruizen/mollen aan leverden A–G gegarandeerd fout op. Nu is **Shift = kruis**
en **Alt/Option = mol**, beide vertaald naar de canonieke naam (⌥D = D♭ = C♯).
Omdat macOS `event.key` verhaspelt zodra Alt meedoet (⌥A geeft "å"), komt de
letter bij een modifier uit `event.code`. De hint in beeld zegt het er nu bij.

## 6. Dood gewicht in één groot bestand — grotendeels opgelost
Het bestand ging van **272 KB naar 246 KB**. Weggehaald:

- **18 KB**: dezelfde logo-PNG stond er twee keer base64 in; staat nu één keer in
  CSS (`.logo-mark`), gedeeld door header en homescherm.
- 13 `els`-verwijzingen naar elementen die niet meer bestaan, plus hun listeners
  (waaronder `testHomeBtn`/`rush60HomeBtn`, die ook nog naar niet-bestaande
  presets `rush30`/`rush60` wezen).
- De permanent verborgen instelkaarten (Keyboard input, Keybd display, MIDI
  display) met hun state, setters, listeners en markup; idem de verborgen
  Notes/Multiple/Chords- en Keybd/MIDI-knoppen.
- `renderMidiPanel()` + de 88-key MIDI-statusbalk (werden nooit gerenderd) en de
  bijbehorende CSS.
- Dubbel geregistreerde level-listeners, een dubbel init-blok in `startTest()`,
  twee `state.score += 0` no-ops, twee ternaries met identieke takken, en drie
  ongebruikte helpers (`noteFullDisplayName`, `removeMistake`, `cheatNoteName`).

### Wat ik bewust heb laten staan — jouw keuze
De actierij **Previous / Play again / Skip** staat nog in de code, verborgen door
één CSS-regel: `#actionsRow { display: none !important; }`. Daaraan hangt alle
noot-afspeelcode (`playNote`, `playChord`, `playAnyQuestionSound`, `frequency`,
`skip`, `state.previous`) — samen zo'n 80 regels.

Ik heb dit *niet* verwijderd omdat het geen kapotte code is maar een werkende
functie die alleen verborgen staat, en noten kunnen hóren is voor een
notenlees-trainer echt wat waard. Twee opties, allebei één ingreep:

- **Terugzetten:** verwijder die ene CSS-regel (regel ~562) → de knoppen komen
  terug en werken meteen.
- **Definitief weg:** zeg het en ik haal de rij plus de afspeelcode eruit.

### Kleine observatie, geen actie ondernomen
`removeMistake()` werd nergens aangeroepen: een fout goed oefenen haalt hem niet
uit de mistake-lijst (die loopt tot 80 en wordt alleen met "Clear mistakes"
geleegd). Dat kan bewust zijn (herhaling houdt hem in beeld). Wil je dat een
noot na twee keer goed vanzelf verdwijnt, dan is dat een klein losstaand klusje.
