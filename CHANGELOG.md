# Changelog

Newest first. One line per deploy to the live root.

## 2026-08-05 (later)
- Promoted the remaining pending sandbox work to live: the **Supabase-primary
  items switch** (`items.js` one-time client-side seed migration, merges vault
  tasks/projects by id under the user's own auth, runs once), **item-card
  subtasks** on the home tiles (`home.js`), and smaller calendar / item-detail /
  agenda-sync / theme / fx tweaks. Env-identity files (manifest name+theme,
  sw cache name, index title) left as live. Cache v17 -> v18.

## 2026-08-05
- Renamed the **Practice** tab to **Utilities** and added a third app — the
  **Kangaroo Gym Tracker** (self-contained static bundle) — beside NoteSprint +
  ChordSprint. The morning loop still always opens the note game.
- Kangaroo is **login-gated** (needs a valid Supabase session) and its data syncs
  to a per-user `kangaroo_state` row, namespaced by environment (`dd:kangaroo-*`
  live / `sbx:kangaroo-*` sandbox) so sandbox testing can never touch live gym
  data. Daily digest mirrors the live data to a rolling vault file. Cache v16 -> v17.

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
