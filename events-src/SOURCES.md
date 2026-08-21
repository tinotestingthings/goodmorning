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
- Drop events whose end date has passed; keep the catalogue ±6 months ahead.
- Region field must be exactly `"Utrecht"` or `"Amsterdam"` (UI filter matches
  on string).

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

## Year calendar — recurring events to (re)add each year

**Utrecht:** Bevrijdingsfestival (5 mei) · SPRING Performing Arts (mei) ·
Utrecht Marathon (eind mei/voorjaar) · Soenda (eind mei) · Verknipt (begin
juni) · Utrecht Pride / Canal Pride (begin juni) · Tweetakt (juni) · UIT
introweek (medio aug) · Festival Oude Muziek (eind aug–begin sep) · Gaudeamus
Muziekweek (medio sep) · Utrechts Uitfeest (sep) · Nederlands Film Festival
(eind sep) · Bockbier Festival Utrecht, Janskerkhof (medio okt) · Nacht van de
Nacht (eind okt) · Le Guess Who? (begin nov) · Sint Maarten Parade (za rond
11 nov) · Smartlappenfestival (medio nov) · De Parade (aug, afsluitende stad).

**Amsterdam:** Koningsdag/-nacht (26–27 apr) · Holland Festival (juni) · Pride
Amsterdam (eind jul–begin aug; 2026 eenmalig WorldPride) · Grachtenfestival
(medio aug) · PINT Bockbierfestival, De Hallen (begin okt — **verhuisd uit
Utrecht**) · Cinekid (herfstvakantie) · ADE (eind okt) · Museumnacht (1e za
nov) · IDFA (medio nov) · Amsterdam Light Festival (eind nov–medio jan).

## Bestaat niet meer — niet opnieuw toevoegen

- **Culturele Zondagen Utrecht** — gestopt per 2026 (subsidie weg); alleen het
  Uitfeest resteert.
- **Uitmarkt Amsterdam** — laatste editie 2022; opvolger "DE OPENING" heeft een
  wisselende gaststad (2026: Eindhoven) en is geen vast Amsterdam-item.
- **Trajectum Lumen** — nu "Utrecht Lumen", een permanente route, geen
  kalender-event.
