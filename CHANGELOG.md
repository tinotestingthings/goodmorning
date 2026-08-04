# Changelog

Newest first. One line per deploy to the live root.

## 2026-08-04
- Promoted phase-1 to live: unified task/project store (`items.js` + `dd.items`),
  Backlog list type (add/reorder/promote/schedule), and the 3-tile homepage.
  Seeded `items-seed.json` from the current vault (26 items). Calendar/agenda
  (`dd.todos/chores/workweek`) untouched. Emoji++ theme preserved. env.js added
  to the service-worker precache. Cache bumped v14 -> v15.
- New **Emoji++** theme: orange-forward, high-contrast evolution of Emoji+ (deep
  warm text on cream, vivid orange accent, stronger borders, more modern emoji
  accents across the home tiles). Selectable in Settings → Theme.

## 2026-08-04
- Runtime-namespace refactor: added `env.js` (sets `DD_ENV` + `k()` from the URL
  path). All `dd.*` / `sbx.*` storage-key literals across live and sandbox now go
  through `k("name")`, so the same code reads `dd.*` at `/` and `sbx.*` under
  `/sandbox/`. Title and the sandbox reset button are namespace-derived. This
  makes sandbox→live promotion safe: copied code self-corrects by path.
- Added `tools/check-live-clean.sh` + CI (`.github/workflows/guard.yml`) that
  fail any commit hardcoding a namespace, leaving "SBX" in the live title, or
  mounting the reset button unguarded.
- Hotfixes (commit 818ee07): live title `SBX · Daily Digest` → `Daily Digest`;
  path-guarded the reset button so it can never wipe live `dd.*` data.
- Incident: promoting the sandbox build to live blanked the calendar/work
  planning (live read `sbx.*` test keys). Rolled back; no data lost. Root cause
  and fix: see `40 Projects/2026-08-04-sandbox-live-promotion-safety-spec` in the vault.
