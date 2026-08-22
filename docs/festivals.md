# Festivals-tab — terugkerende festivals, eigen tab + inbox voor je regio's

Status: **fase 1 gebouwd (22 aug 2026)**, fase 2 = landelijk via de weektaak, fase 3 geparkeerd.
Doel: álle niet-zeldzame, terugkerende festivals in de Event Tracker op een eigen tab,
filterbaar op regio (provincie/stad), grootte, genre en maand — "ik heb een weekend vrij,
wat is er?". Festivals in je thuisregio's (Utrecht + wat je in Settings toevoegt, nu
Amsterdam) komen óók in de inbox; de rest staat alleen op de tab.

## Hoe het werkt

- **Data:** `events-src/src/festivals.ts` — één `Festival`-record per festival, jaar na
  jaar (`id`, `name`, `city`, `province`, `size`, `genres`, `month`, `when`, `url`,
  `blurb`, optioneel `venue`/`price`/`free`/`next`). Dit verving de jaarkalender in
  `SOURCES.md`. 27 records: Utrecht (stad + provincie) en Amsterdam.
- **Inbox:** bij het laden maakt `festivalEvents(["Utrecht", ...regions], eventStates, today)`
  van elk festival met een lopende `next`-editie in een thuisregio — óf waar je al een
  staat voor hebt (bewaard/afgewezen) — een gewoon `EventRecord` (`id = <festival-id>-<jaar>`,
  `state: "unseen"`). `mergeEvents` legt je bewaarde/afgewezen staten er meteen overheen,
  dus dismissen blijft dismissen. Regio toevoegen in Settings (keuzelijst met de regio's
  uit de catalogus) → die festivals komen er direct bij; regio verwijderen haalt ze weer
  weg, behalve wat je bewaard/afgewezen hebt.
- **Tab:** `Festivals` (desktop na Inbox, mobiel 3e tab). Eén chronologische lijst; vier
  native `<select>`-filters: Region · Size · Genre · Month. Kaart: datum (of "usual
  month" + jaar als de editie nog niet is aangekondigd), genre · grootte, naam, locatie,
  stad · provincie, blurb, **Save**, **Official site**. Kaart openen = detailpaneel
  (alleen als er een datum is).
- **Save:** staat in de hoofdlijst → dezelfde toggle als in de inbox. Nog niet in de lijst
  (andere regio) → `setEventState(id, saved)` + record erbij; bij de volgende load wordt
  het festival opnieuw afgeleid omdat zijn id een staat heeft. Geen kopie in
  `manualEvents`, dus datums blijven `festivals.ts` volgen. Geen `next` → knop uit
  ("Date TBA"); detailpaneel alleen voor records in de hoofdlijst.
- **Validator:** `events-src/check-festivals.mjs`, draait in `build.sh` vóór esbuild.
  Unieke ids, provincie/genre/grootte uit de vaste lijsten, `month` 1–12, `https`-url,
  `next.start ≤ next.end`. De weektaak schrijft het bestand, dus rommel breekt de build
  i.p.v. stilletjes live te gaan.
- **Verhuisd uit `data.ts`:** de 14 jaarlijkse festivals/events die daar als event
  stonden (Parade, Oude Muziek, Fortenfestival, Gaudeamus, NFF, Bockbier ×2, Nacht van
  de Nacht, Le Guess Who?, Smartlappen, ADE, Museumnacht, IDFA, Light Festival). Zelfde
  event-ids (`le-guess-who` via een jaar-specifieke `legacyIds`-map), dus bewaarde staten
  blijven werken.
  `data.ts` houdt alleen zeldzaam/eenmalig (eclipsen, Honthorst, Open Monumentendag).

## Beslissingen

1. Eigen bestand + slank type, geen `EventRecord` in de catalogus: festivals vallen niet
   na hun einddatum uit de lijst en hebben geen relevance/rarity/whyNow nodig.
2. Grootte = bezoekers per editie, indicatief: small < 5k · medium 5–30k · large > 30k.
   De weektaak schat, jij corrigeert in `festivals.ts`.
3. Genre = vaste lijst van 10 (`GENRES`): Pop/rock · Dance · Jazz/classical · Theatre ·
   Film · Food & drink · Art & light · Heritage & tradition (Koningsdag, Pride, Sint
   Maarten, Museumnacht) · Literature · Nature & outdoors. Max 3 per festival.
4. Regio = `city` + `province` (12 provincies, vaste spelling in `PROVINCES`). De
   Region-filter toont Utrecht, Amsterdam en elke provincie die festivals heeft.
5. `month` + `when` + optioneel `next = { start, end, verifiedAt }`. `verifiedAt` alleen
   bij een datum van de officiële site; zonder `next` sorteert het festival op de
   gebruikelijke maand (vanaf de 15e van die maand: volgend jaar).
6. UI-taal Engels, zoals de rest van de app. Geen badge op de tab: het is naslag, geen
   wachtrij. Geen kaartweergave, geen eigen Supabase-tabel.

## Fases

**Fase 1 — gebouwd.** Tab, datamodel, 27 festivals Utrecht + Amsterdam (16 met
geverifieerde datum), inbox-koppeling via regio's, validator, SOURCES.md § Festivals,
APPS.md-regel. App heet in de UI nu **Eventino** (Utilities-tegel blijft "Events").
Na `/code-review medium`: festivalstaat alleen via `eventStates`, één `nextIsLive`,
regio toevoegen/verwijderen symmetrisch, één genre-tabel, scores afgeleid (urgentie uit
nabijheid, voorbereiding uit tickets) i.p.v. vaste getallen.

**Fase 2 — landelijk (weektaak + één seed-sessie).** Eén sessie zaait de ~100 bekende
landelijke festivals (Lowlands, Pinkpop, Best Kept Secret, Down the Rabbit Hole, Zwarte
Cross, Into the Great Wide Open, Oerol, Noorderzon, North Sea Jazz, Welcome to the
Village, Grasnapolsky, Paaspop, Dekmantel, Milkshake, Mysteryland, Awakenings…), met
`size`/`genres` geschat en `next` waar de site het geeft. Daarna houdt de weektaak het
bij volgens `SOURCES.md` § Festivals: `next` verversen, nieuwe festivals per provincie,
gestopte verwijderen. **Tinus:** één regel in de Cowork-taakprompt (Automations.md rij
4): "houd ook `src/festivals.ts` bij volgens SOURCES.md § Festivals".

**Fase 3 — geparkeerd.** "Vrij weekend": festivals markeren op weekenden zonder
agenda-items (`agenda-*.json` zit al in het digest). Pas als fase 1–2 in gebruik zijn.
