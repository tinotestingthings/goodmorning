# Trein in de digest — NS-reisinfo op agenda, digest en Eventino

Plan (25 aug 2026). **Status: vastgelegd, nog niet gebouwd — wacht op NS-API-key
van Tinus** (gratis aanmaken op https://apiportal.ns.nl, product "Reisinformatie
API" + "Places API"; 5 minuten handwerk, account op eigen naam). Context: Tinus
reist per trein (geen auto), thuisbasis Utrecht. Drie onderdelen uit één
ideeënronde: (1) reisadvies op agenda-items, (2) laatste-trein-badge op
avondevents in Eventino, (3) storingsregel in de ochtenddigest.

## Het principe waar alles aan hangt

Dit is een statische PWA: **de NS-key mag nooit in de client** (zelfde regel als
alle secrets). Alle NS-calls gebeuren in de twee Mac-taken die er al zijn — de
dagelijkse **daily-digest** en de wekelijkse **event-catalog-refresh** — en die
schrijven alleen wat ze nu al mogen schrijven: `feed.json` respectievelijk
`events-src/src/*.ts` (de taak-schrijfregel uit APPS.md blijft dus intact). De
client rendert gebakken data en linkt voor realtime door naar de NS-reisplanner
(deeplink, geen key nodig). De gebakken tijden zijn dienstregeling van die
ochtend; de deeplink is de realtime-waarheid en daarom hét tap-doel.

Secret: `NS_API_KEY` in `Mijn Wiki/.secrets.nosync/goodmorning.env`, naast de
Supabase-key (bestaand patroon). Bij bouw: secrets-tabel in APPS.md en
`90 System/Automations.md` bijwerken.

Privacy: alleen de plaatsnaam (`place`) gaat naar de NS-API — nooit de titel of
andere inhoud van een agenda-item.

## Fase 1 — reisregel op agenda-items

- Een afspraak is een to-do met `startTime`; die krijgt één **optioneel veld
  `place`** ("Amsterdam", "TivoliVredenburg") in de bestaande to-do-editor
  (`calendar.js`). Synct gratis mee — `todos` zit al in de agendasync-KEYS.
- De ochtendtaak leest `agenda_state` (doet hij al voor de backup), pakt de
  to-do's van vandaag met `place` + starttijd, resolvet plaats → station
  (NS stations-API, fuzzy; **geen eenduidige match → geen regel tonen, nooit
  gokken**), plant de reis vanaf Utrecht Centraal met aankomstmarge en bakt in
  `feed.json`:

  ```
  today.travel: [{ todoId, leave: "17:42", from: "Utrecht C.",
                   to: "Amsterdam Zuid", mins: 26, ovfiets: 140, nsUrl }]
  ```

- `home.js`/`calendar.js` tonen bij dat item één regel —
  `🚆 vertrek 17:42 · 26 min · OV-fiets ✓` — tik = NS-planner met de reis
  voorgevuld. OV-fietsbeschikbaarheid komt uit de Places-API (zelfde run);
  alleen tonen als er een voorraadgetal is.
- Thuisstation = één constante in de taakconfig ("Utrecht Centraal").

## Fase 3 — storingsregel (lift mee in dezelfde ochtendrun)

- Tweede API-call (disruptions), agressief gefilterd zodat hij bijna altijd
  onzichtbaar is: alleen storingen/werkzaamheden die (a) een fase-1-reis van
  vandaag raken, of (b) het traject thuis↔kantoor op een dag waarop **WorkWeek**
  (zit al in `agenda_state`) zegt dat het een kantoordag is. Kantoorstation =
  tweede constante.
- Resultaat: `today.disruptions: [{ title, impact, url }]`; de digest rendert
  die regel alleen als de array niet leeg is. De werkagenda is niet koppelbaar,
  maar dat hoeft ook niet — WorkWeek kent de kantoordagen al.

## Fase 2 — laatste-trein-badge in Eventino (losstaand van 1 en 3)

- De weektaak genereert een extra databestand `events-src/src/travel.ts`: per
  unieke `city` in de catalogus het station, de reistijd vanaf Utrecht C. en de
  laatste bruikbare trein terug per dagtype (ma–do / vr / za / zo — die
  verschillen echt). Wekelijks vers is ruim genoeg; de grote wissel is de
  dienstregeling in december.
- Eventino toont op avondevents buiten Utrecht:
  `🚆 ±26 min · laatste trein terug 00:52` + NS-deeplink.
- Validator naast `check-festivals.mjs`: elke catalogus-city heeft een
  travel-entry.

## Bouwvolgorde en checkpunten

1 → 3 (zelfde motor in de dagtaak) → 2 (weektaak + Eventino). Alles eerst in
`sandbox/`, agendasync-test draaien (home/calendar geraakt), `/code-review
medium`, dan promote.

- [ ] NS-key aangevraagd door Tinus (blokkeert alles)
- [ ] Deeplink-formaat van de NS-reisplanner verifiëren tijdens de bouw
- [ ] `place`-veld + editor (fase 1, client-kant kan alvast zonder key)
- [ ] Dagtaak: stations-resolve + trips + OV-fiets → `today.travel`
- [ ] Digest/agenda-render van de reisregel
- [ ] Disruptions-filter + `today.disruptions` + render (fase 3)
- [ ] Weektaak `travel.ts` + validator + Eventino-badge (fase 2)
- [ ] APPS.md secrets-tabel + Automations.md bijwerken
