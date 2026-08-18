# APPS.md — the map

One row per thing that runs. If it isn't here, it doesn't exist. Update this file in the same commit that adds/moves an app.

Live site: https://tinotestingthings.github.io/goodmorning/  ·  Sandbox: https://tinotestingthings.github.io/goodmorning/sandbox/
Deploy: GitHub Pages serves `main`. Root = live (`dd.*` data), `sandbox/` = staging (`sbx.*` data), chosen at runtime by `env.js`.
Promote: `bash tools/promote.sh "what changed"` (guards + copy + tag + push). Never copy files by hand.

## Main app

| App | Path | Storage / Supabase | Fed by | Notes |
|---|---|---|---|---|
| Daily Digest (goodmorning) | `/` and `/sandbox/` | localStorage via `k()`, Supabase `agenda_state`, `captures`, `actions` | `feed.json` written by the **daily-digest** scheduled task (Cowork, Mac) | PWA, no build step. Tests: `tests/agendasync.behaviour.mjs`. Version tag shown from `DD_ENV.version` |

## Utility apps (each: `index.html` + `boot.js`, state synced to its own Supabase table)

| App | Path | Supabase table | Source of truth | Build |
|---|---|---|---|---|
| Kangaroo Gym | `kangaroo/` | `kangaroo_state` | this repo (`bundle.js` prebuilt) | none |
| Vogelspotinus (bird ID trainer) | `vogelspotinus/` | `vogelspotinus_state` | this repo (`src/` ES modules) | `tools/build-bird-tiles.mjs` for tiles only |
| NoteSprint | `notesprint/` | `notesprint_state` | this repo (`boot.js` loads the app) | none |
| Ear training / ChordSprint | `ear-training/` | `chordsprint_state` | this repo | none |
| WijnWijs (wine) | `wine/` | `wine_state` | this repo (`bundle.js` prebuilt) | none |
| Event Tracker | `events/` | `eventtracker_state` (personal state only; catalogue is baked in) | `events-src/` in this repo | `bash events-src/build.sh` → `events/bundle.js`; catalogue edited by the **event-catalog-refresh** task |
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
