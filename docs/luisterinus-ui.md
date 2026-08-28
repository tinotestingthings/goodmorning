# Luisterinus fase 4 — luister-UX (plan, 28 aug 2026)

Doel: van "lijst met een speler" naar "podcast-app-gevoel": afleveringen ná
elkaar, minder tikken, eerlijke voortgang. Alleen `luisterinus/` (boot.js +
index.html + wat CSS langs DESIGN.md-tokens); tabel en worker blijven zoals ze
zijn. Sandbox eerst, `/code-review medium`, gerichte promote (`diff -rq` moet
daarna schoon zijn).

## 4a — Doorspelen (kern, ±½ sessie)

- **Auto-advance**: in de bestaande `ended`-handler (die al "gehoord" zet) de
  volgende ongehoorde ready-rij in lijstvolgorde opzoeken en `play()`-en.
  iOS-vangnet bestaat al: lukt autoplay niet, dan staat de speler klaar met de
  bestaande "Tik op ▶"-melding. Signed URL wordt per aflevering vers gehaald.
- **"▶ Speel alles"** naast Ververs in de kop: start de bovenste ongehoorde;
  de rest volgt vanzelf via auto-advance.
- **Media Session API** (feature-detect, ~15 regels): titel + bron op het
  lockscreen, play/pauze/volgende via oordopjes en lockscreen-knoppen —
  zonder dit voelt doorspelen op de telefoon half af.

## 4b — Minder tikken, verder waar je was (±½ sessie)

- **Directe ▶ op de rij** voor ready-afleveringen (rechts in de rij, grote
  tap-target); uitklappen blijft voor Gehoord/Taak/Bron/Verwijderen.
- **Hervatten**: positie per aflevering in localStorage; bij >95% uitgeluisterd
  opnieuw vanaf 0. Let op gedeelde origin live/sandbox: prefix afleiden uit
  `location.pathname` (`/sandbox/` → `sbx`), nooit hardcoden — bestanden moeten
  identiek blijven na promote.
- **Snelheid** (klein, optioneel): één knopje 1× → 1,25× → 1,5× (`playbackRate`);
  iOS' inline audio-controls hebben zelf geen snelheidsmenu.

## 4c — Eerlijke voortgang (±15 min)

- "In de maak…" krijgt de aanvraagtijd erbij ("sinds 13:35"); staat een rij er
  na >24 uur nog, dan eerlijk: "wacht al N dagen — de worker heeft nog niet
  gedraaid". Dat was precies de klacht van 28 aug: de tekst suggereerde
  activiteit die er niet was.

## Bewust niet

- **RSS-feed voor een echte podcast-app**: bucket is privé en signed URLs
  verlopen na een uur — een feed vergt publieke hosting of een URL-vernieuwer,
  een nieuw systeem voor iets dat 4a al oplost.
- Offline/download (SW-cache van MB's audio), transcripties, wachtrij
  herordenen, artwork genereren.

Klaar-criteria: op telefoon, iPad en laptop drie afleveringen achter elkaar
zonder de app aan te raken; lockscreen toont titel en knoppen werken;
half-geluisterde aflevering gaat verder waar hij was.
