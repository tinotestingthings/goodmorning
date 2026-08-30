# APPS.md — the map

One row per thing that runs. If it isn't here, it doesn't exist. Update this file in the same commit that adds/moves an app.

Live site: https://tinotestingthings.github.io/goodmorning/  ·  Sandbox: https://tinotestingthings.github.io/goodmorning/sandbox/
Deploy: GitHub Pages serves `main`. Root = live (`dd.*` data), `sandbox/` = staging (`sbx.*` data), chosen at runtime by `env.js`.
Promote: `bash tools/promote.sh "what changed"` (guards + copy + tag + push). Never copy files by hand.

## Main app

| App | Path | Storage / Supabase | Fed by | Notes |
|---|---|---|---|---|
| Daily Digest (goodmorning) | `/` and `/sandbox/` | localStorage via `k()`, Supabase `agenda_state`, `captures`, `actions`, `podcast_queue` + Storage-bucket `digest-audio` (privé; Luisterinus, zie `docs/luisterinus.md`) | `feed.json` written by the **daily-digest** scheduled task (Cowork, Mac) | PWA, no build step. Tests: `tests/agendasync.behaviour.mjs`. Version tag shown from `DD_ENV.version` |

## Utility apps (each: `index.html` + `boot.js`, state synced to its own Supabase table)

| App | Path | Supabase table | Source of truth | Build |
|---|---|---|---|---|
| Kangaroo Gym | `kangaroo/` | `kangaroo_state` | this repo (`kangaroo-src/` TSX) | `bash kangaroo-src/build.sh` -> `sandbox/kangaroo/bundle.js`, then promote |
| Spotinus (dier-ID trainer: vogels + hondenrassen) | `vogelspotinus/` | `vogelspotinus_state` | this repo (`src/` ES modules) | `tools/build-bird-tiles.mjs` for tiles; `tools/fetch-bird-photos.mjs` (`data/bird-photos.json`, iNaturalist CC); `tools/build-dogs.mjs` (`data/dogs.json` + `data/dog-photos.json`, Wikidata/Wikipedia/Commons); `tools/build-arch.mjs` + `tools/arch-styles.mjs` (`data/arch.json` + `data/arch-photos.json`, 24 bouwstromingen, teksten handgeschreven); `tools/build-street.mjs` + `tools/street-objects.mjs` (`data/street.json` + `data/street-photos.json`, 24 straatobjecten Utrecht-eerst, teksten handgeschreven — zie `docs/spotinus-straat.md`). Map en tabel houden bewust hun oude naam: daar hangt alle Leitner-voortgang aan. Identiteit is `id` (vogels: soortnaam, honden: `dog:Q…`), diersoort in `tags.kind`. Rasgroepen (FCI) uit nl.wikipedia in `tags.fciGroup`, uitleg in `src/data/fci-groups.js`. Leerdoel: Griftpark-100-cursus (`src/data/course-griftpark.js`, uit luistervink.nl). Test: `node tests/vogelspotinus.identity.test.mjs` |
| NoteSprint | `notesprint/` | `notesprint_state` | this repo (`boot.js` loads the app) | none |
| Ear training / ChordSprint | `ear-training/` | `chordsprint_state` | this repo | none; leent `clipinus/segue.js` (YouTube-fragmenten: Clip lab + ▶ Clip in de oefening); fragmenten/keuzes in `cpt_clipLab`, synct mee. Test engine: `node tests/segue.codec.test.mjs`. Eigen fragmenten: `tools/chordsprint-snippets.py --watch` (LaunchAgent `tools/chordsprint-clips.launchagent.plist`) knipt met yt-dlp+ffmpeg naar bucket `chordsprint-clips`; index in de Supabase-rij onder `<ns>helper`, bewust buiten de cpt_-sleutels |
| WijnWijs (wine) | `wine/` | `wine_state` | this repo (`src/` ES modules) | none; tests: `node tests/wijnwijs.core.test.mjs` |
| Event Tracker | `events/` | `eventtracker_state` (personal state only; catalogue is baked in) | `events-src/` in this repo | `bash events-src/build.sh` → `events/bundle.js`; catalogue edited by the **event-catalog-refresh** task; Festivals tab from `events-src/src/festivals.ts` (recurring festivals; home-region ones also feed the inbox; validator `check-festivals.mjs`). Spec: `docs/festivals.md` |
| Trainerinus (oefencoach over de trainer-apps) | `trainerinus/` | `trainerinus_state` (tabel moet nog aangemaakt — SQL in `trainerinus/README.md`; app draait zonder tabel lokaal) | this repo | none; leest read-only de state-tabellen van vogelspotinus/chordsprint/notesprint/kangaroo |
| Attentinus (verjaardagen, feestdagen + cadeau-ideeën) | `attentinus/` | `attentinus_state` (SQL in `attentinus/README.md`) | this repo | none; `attentinus/dates.js` is de gedeelde datumlogica (ook geladen door de hoofd-app: home-tile + agenda-chips via `k("attentCache")`); tests: `tests/attentinus.dates.test.mjs`, `tests/attentinus.boot.behaviour.mjs`; plan: `docs/attentinus-v3.md` |
| Luisterinus (digest-podcasts) | `luisterinus/` | leest `podcast_queue` + bucket `digest-audio` (geen eigen state-tabel) | this repo | none; Utilities-tegel met badge (practice.js; klaar én ongehoord), knop op de digest-kaart (triage.js). Geen Today-tegel meer (UX-plan 22 aug). Verwerkscript `tools/luisterinus-worker.py` (notebooklm-py, handmatig draaien in fase 2). Spec: `docs/luisterinus.md` |
| Clipinus (YouTube-fragmenten aan elkaar) | `clipinus/` | geen tabel — de link *is* de staat | this repo | none; `clipinus/segue.js` is de engine (codec + speler, ook los te laden door de hoofdapp, zoals `attentinus/dates.js`). Payload gelijk aan segue.video, dus `clipinus/index.html#<base64>` en `segue.video/watch#<base64>` spelen hetzelfde rijtje. Test: `node tests/segue.codec.test.mjs` |
| Ecosystem explainer (video) | `explainer/` | — | this repo | Remotion; not served by the PWA |

## Not in this repo (on purpose)

| Thing | Where | Why |
|---|---|---|
| Mijn Wiki (second brain / vault) | iCloud Drive `Mijn Wiki/` | Notes, specs, agenda backups (`50 Agenda/`), automation specs (`90 System/`). Never app code. |
| SPO Website Scanner | `~/Code/spo-website-scanner` (private repo) | Local-hosted work tool, Python |
| Event tracker (original Next.js/Cloudflare) | archived zip | Ported into `events/`; kept for history only |
| Standalone Vogelspotinus / Kangaroo copy / 3 Learning | archived zips | Superseded by the folders above |

## Secrets (never in this repo, never in a prompt)

| Secret | Used by | Lives in |
|---|---|---|
| Supabase publishable key + URL | the app (`supabase.js`) | public by design; RLS does the access control |
| Supabase `service_role` | agenda backup, capture-bridge sync (daily-digest task), `tools/luisterinus-worker.py` | `Mijn Wiki/.secrets.nosync/goodmorning.env` als `SUPABASE_SERVICE_ROLE_KEY` (iCloud-vrij; symlink `~/Code/secrets/goodmorning.env` voor lokale scripts) — zie `90 System/Automations.md`. Niet (meer) onder die naam in de Keychain |
| GitHub fine-grained PAT (`goodmorning` only, Contents: rw) | daily-digest task pushing `feed.json` | macOS Keychain `gm-github-pat` |
| Human git/gh access | you + Claude Code | `gh auth login` (keychain), no token anywhere |

## Scheduled tasks touching this repo
See `Mijn Wiki/90 System/Automations.md` for the full list (schedule, secret, what it writes). Rule: a task may write **only** `feed.json` (daily-digest) or `events-src/src/*.ts` (event-catalog-refresh) — never app code.
