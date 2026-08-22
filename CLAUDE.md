# goodmorning — CLAUDE.md (read first, every session)

Static PWA "Daily Digest" + utility apps, deployed by GitHub Pages from `main`.
No bundler for the main app; every `.js` in the root is loaded by `index.html` in order.
Map of everything: `APPS.md`. Deploy rules: `README-DEPLOY.md`. History: `CHANGELOG.md`.

## The two rules that have caused real data loss
1. Root = live (`dd.*`), `sandbox/` = staging (`sbx.*`). The namespace comes from `env.js` at runtime.
   **Never hardcode `"dd.…"` or `"sbx.…"`** — always `k("name")`. `tools/check-live-clean.sh` enforces this.
2. Only a *successful* server pull makes local state authoritative. Never write a guard that treats
   "empty" as "safe to overwrite". One-off migration/restore scripts are deleted the moment they've run.

## Workflow
- Work in `sandbox/` (or a worktree branch). Root files change only via `bash tools/promote.sh "msg"`.
- Before any push that touches `agendasync.js`, `home.js`, `calendar.js`, `capture.js`:
  `cd /tmp && npm i jsdom && node <repo>/tests/agendasync.behaviour.mjs <repo>` — must pass.
- Before promoting: run `/code-review medium` first and fix what it finds — it never runs by itself. Applies to
  the files above *and* to a new or reworked utility app: only `notesprint` and `wine` have tests, so for every
  other app the review is the only safety net there is. Big changes: suggest `/code-review ultra` (Tinus starts it, it's billed).
- Syntax-check what you touched: `node --check file.js`. Bump the service-worker cache (`sw.js`) at most once per session.
- Parallel work: one git worktree per task (`claude --worktree <name>`), merge to `main`, promote from `main`.
- Never edit `feed.json`, `items-seed.json`, `manifest.json` in the root by hand — they're live data/branding.
- Secrets: none in this repo. `.env` is gitignored; see APPS.md → Secrets. Don't ask Tinus to paste keys.

## Token hygiene (this repo has big files)
- **Locate before you read**: `graphify-out/graph.json` maps every function with line numbers and call edges.
  `~/.local/bin/graphify explain "<functienaam>"` geeft locatie + callers/callees zonder één bestand te lezen
  (live vs sandbox: id-prefix `home_` vs `sandbox_home_`). Stays fresh via git post-commit hook.
- `home.js` (~99 KB) and `calendar.js` (~93 KB): find the function via graphify (or grep as fallback), read only that range. Never cat them whole.
- `feed.json`, `items-seed.json`, `agenda-*.json` are data — don't read unless the task is about them.
- Specs live in the vault (`Mijn Wiki/40 Projects/…`); reference the path, don't inline them.

## Utility apps
Each subfolder = one app with `index.html` + `boot.js` and its own Supabase `<app>_state` table.
`events/` is built from `events-src/` (`bash events-src/build.sh`); the rest have no build step.
Live and sandbox copies of a utility app must be identical after a promote (`diff -rq app sandbox/app`).

## UI-werk
Alleen bij UI/CSS-taken: lees `DESIGN.md` (stijlregels + tokens); de tokens zelf staan in `design.css`, gelinkt door elke app.
Plan en besluiten: `docs/ux-ui-plan.md`.

## Language
Tinus is Dutch; commit messages and CHANGELOG entries may be Dutch or English — match the surrounding text.
