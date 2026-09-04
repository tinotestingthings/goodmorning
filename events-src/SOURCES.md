# Event catalog — regions, sources & year calendar

Spec for the weekly **Event tracker catalog refresh** task (Automations.md row 4).
The task reads this file and keeps `src/data.ts` covered accordingly. Last full
source review: 2026-08-21.

## Regions

1. **Utrecht** (stad + provincie) — primary, always covered.
2. **Amsterdam** — added 2026-08-21. Cover the big recurring festivals and
   anything rare/one-off worth the train ride; skip routine club nights.

## Rules (unchanged)

- Every event needs a real source URL; never invent dates. Unverifiable dates
  get `dateStatus: "manual"`, verified ones `dateStatus: "verified"` +
  `dateVerifiedAt`.
- Region field must be exactly `"Utrecht"` or `"Amsterdam"` (UI filter matches
  on string).
- Never invent counts or scan times. The Sources page derives every number from
  the catalogue itself; `SourceRecord` deliberately has no stats fields.

## Every run, before adding anything

1. **Delete events that have ended** (`endAt`, or `startAt` when there is no
   `endAt`, before today) from `src/data.ts` **and** `src/film-snapshot.ts`.
   The app hides them from the inbox, but a catalogue full of last month's
   screenings hides what is actually coming.
2. **Bump `catalogueRefreshedAt`** in `src/data.ts` to the run date — the
   Sources page shows it as "last catalogue refresh", and "added in the last
   refresh" counts events whose `discoveredAt` matches it. So set
   `discoveredAt` on everything you add to that same date.
3. Keep the catalogue ±6 months ahead; recurring festivals go to
   `src/festivals.ts` (see below), not here.

## Structural sources — Utrecht (check weekly)

| Bron | URL | Dekt |
|---|---|---|
| UITagenda Utrecht | https://www.uitagendautrecht.nl/ | cultuur breed (officieel) |
| DUIC agenda | https://www.duic.nl/agenda/ | stadsagenda, buurt-events |
| TivoliVredenburg | https://www.tivolivredenburg.nl/agenda/ | concerten alle genres |
| Ontdek Utrecht | https://www.ontdek-utrecht.nl/ | grote publieksevenementen |
| Werkspoorkathedraal | https://dewerkspoorkathedraal.nl/agenda/ | festivals/food/beurzen |
| Jaarbeurs | https://www.jaarbeurs.nl/agenda | beurzen, grote events |
| EKKO | https://ekko.nl/ | pop/alternatief (mist in grote agenda's) |
| Festivalinfo (filter Utrecht) | https://www.festivalinfo.nl/ | festival-/dancekalender |

## Structural sources — Amsterdam (check weekly)

| Bron | URL | Dekt |
|---|---|---|
| I amsterdam uitagenda | https://www.iamsterdam.com/uit/agenda | breedste dekking (officieel) |
| Paradiso | https://www.paradiso.nl/ | pop/rock/club |
| Melkweg | https://www.melkweg.nl/agenda/ | pop, hiphop, club, film, expo |
| Ziggo Dome / AFAS Live | https://www.ziggodome.nl/agenda + https://www.afaslive.nl/agenda | arena-concerten |
| Carré | https://carre.nl/ | theater, cabaret, circus |
| Concertgebouw / Muziekgebouw | https://www.concertgebouw.nl/ + https://www.muziekgebouw.nl/ | klassiek/jazz/hedendaags |
| Festivalinfo (filter Amsterdam) | https://www.festivalinfo.nl/ | festivalkalender |

## Festivals — `src/festivals.ts` (recurring events, the year calendar)

Every recurring festival/event in the covered regions lives here as one record,
year after year — this replaced the old "re-add each year" list. The Festivals
tab shows them all; only the ones in the home regions (Utrecht + regions added
in Settings) also become inbox events, derived at runtime. Spec: `docs/festivals.md`.

Per record: `id` (stable slug, never changes), `name`, `city`, `province`
(exact spelling from `PROVINCES`), `size` (`small` < 5,000 · `medium`
5,000–30,000 · `large` > 30,000 visitors per edition, indicative), `genres`
(1–3 keys from `GENRES`), `month` (usual start month), `when` (short text),
`url` (official site, https), `blurb` (one sentence, English), optional
`venue`, `price`, `free` and `next`.

Weekly:
- Set `addedAt` (today's date) on a festival you add. Without it, re-verifying
  an existing festival's dates counts as "added in the last refresh" on the
  Sources page. Derived festival events cite source id `festivals`, so they roll
  up into the "Festival calendar" row — keep that row in `data.ts`.
- `next = { start, end, verifiedAt }` for the next edition as soon as the
  official site publishes dates (ISO `YYYY-MM-DD`; `verifiedAt` = the day you
  saw it there). Never guess; without dates leave `next` out — the tab then
  shows the usual month. Remove `next` once that edition has ended and no new
  dates are known.
- Add festivals that are missing (festivalinfo.nl per province, podiuminfo,
  official sites); remove ones that stopped and list them under "Bestaat niet
  meer". Next step after Utrecht + Amsterdam: the big national ones (Lowlands,
  Pinkpop, Best Kept Secret, Down the Rabbit Hole, Zwarte Cross, Into the Great
  Wide Open, Oerol, Noorderzon, North Sea Jazz, Dekmantel, Mysteryland…).
- Inbox rule: a recurring festival is a `festivals.ts` record, not a `data.ts`
  event. `data.ts` is for rare/one-off/last-chance events, or a special
  edition worth its own card (lustrum, final edition, WorldPride).
- `node check-festivals.mjs` (also run by build.sh) validates the file; fix
  what it reports before committing.

## Bestaat niet meer — niet opnieuw toevoegen

- **Culturele Zondagen Utrecht** — gestopt per 2026 (subsidie weg); alleen het
  Uitfeest resteert.
- **Uitmarkt Amsterdam** — laatste editie 2022; opvolger "DE OPENING" heeft een
  wisselende gaststad (2026: Eindhoven) en is geen vast Amsterdam-item.
- **Trajectum Lumen** — nu "Utrecht Lumen", een permanente route, geen
  kalender-event.
