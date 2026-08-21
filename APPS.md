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
| Vogelspotinus (bird ID trainer) | `vogelspotinus/` | `vogelspotinus_state` | this repo (`src/` ES modules) | `tools/build-bird-tiles.mjs` for tiles; `tools/fetch-bird-photos.mjs` for the extra quiz photos (`data/bird-photos.json`, iNaturalist CC). Leerdoel: Griftpark-100-cursus (`src/data/course-griftpark.js`, uit luistervink.nl) |
| NoteSprint | `notesprint/` | `notesprint_state` | this repo (`boot.js` loads the app) | none |
| Ear training / ChordSprint | `ear-training/` | `chordsprint_state` | this repo | none |
| WijnWijs (wine) | `wine/` | `wine_state` | this repo (`src/` ES modules) | none; tests: `node tests/wijnwijs.core.test.mjs` |
| Event Tracker | `events/` | `eventtracker_state` (personal state only; catalogue is baked in) | `events-src/` in this repo | `bash events-src/build.sh` → `events/bundle.js`; catalogue edited by the **event-catalog-refresh** task |
| Trainerinus (oefencoach over de trainer-apps) | `trainerinus/` | `trainerinus_state` (tabel moet nog aangemaakt — SQL in `trainerinus/README.md`; app draait zonder tabel lokaal) | this repo | none; leest read-only de state-tabellen van vogelspotinus/chordsprint/notesprint/kangaroo |
| Attentinus (verjaardagen + cadeau-ideeën) | `attentinus/` | `attentinus_state` (tabel moet nog aangemaakt — SQL in `attentinus/README.md`; app draait zonder tabel lokaal) | this repo | none; digest-home: vaste herotegel + rij bij een datum binnen 21 dagen; import/export client-side |
| Luisterinus (digest-podcasts) | `luisterinus/` | leest `podcast_queue` + bucket `digest-audio` (geen eigen state-tabel) | this repo | none; Utilities-tegel met wachtrij-badge (practice.js), Today-tile als er een podcast klaarstaat (home.js), knop op de digest-kaart (triage.js). Spec: `docs/luisterinus.md` |
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
| Supabase `service_role` | agenda backup, capture-bridge sync (daily-digest task) | macOS Keychain `gm-supabase-service-role` + `~/Code/goodmorning/.env` |
| GitHub fine-grained PAT (`goodmorning` only, Contents: rw) | daily-digest task pushing `feed.json` | macOS Keychain `gm-github-pat` |
| Human git/gh access | you + Claude Code | `gh auth login` (keychain), no token anywhere |

## Scheduled tasks touching this repo
See `Mijn Wiki/90 System/Automations.md` for the full list (schedule, secret, what it writes). Rule: a task may write **only** `feed.json` (daily-digest) or `events-src/src/*.ts` (event-catalog-refresh) — never app code.
