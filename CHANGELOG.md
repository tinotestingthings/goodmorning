# Changelog

Newest first. One line per deploy to the live root.

## 2026-08-05 (WijnWijs profile)
- Replaced the hardcoded profile name "Martijn Mensink" (avatar MM) with a neutral
  "Wijnstudent" (avatar WS, kicker "Profiel"). Cache v23 -> v24.

## 2026-08-05 (WijnWijs level lock + hardcode cleanup)
- SDEN 3 / WSET 3 are now locked (greyed, "binnenkort") until they actually have
  content — a level unlocks automatically once it has non-starter approved
  questions. Applies to the Leren level-switch and the Settings dropdown.
- Removed the last hardcoded demo progress: the fake "Ga verder — Frankrijk: Loire,
  Les 4 van 7, 58%" card is now an honest "Aanbevolen" shortcut with no fake bar.
  Cache v22 -> v23.

## 2026-08-05 (WijnWijs lessons)
- Removed the hardcoded "Voltooid" state on the first two lessons of each topic
  (was faked via index<2, not tied to real progress and not resettable). Lessons
  now just show their number + duration. Cache v21 -> v22.

## 2026-08-05 (WijnWijs fixes)
- Quiz now shuffles the WHOLE active pool (all 210 incl. the 200), due-for-review
  first, instead of always serving the same front-of-list starter questions.
- Reset the demo/test data: xp/streak start at 0, learningTopics + mastery /
  retention / week-bar numbers zeroed, and a one-time state reset (version 2)
  clears any already-saved test progress. Cache v20 -> v21.

## 2026-08-05 (WijnWijs 200 questions)
- Bundled the full SDEN2 question bank into WijnWijs: the embed was shipping only
  the 10-question starter set, so the 200 imported questions (two 100-Q packages)
  weren't present. Baked all 200 into the app's base set (210 total, all pass the
  approved-question filter). Cache v19 -> v20.

## 2026-08-05 (WijnWijs)
- Added a 4th **Utilities** app: **WijnWijs** (wine trainer, SDEN2 quiz) as a
  self-contained static bundle, beside NoteSprint / ChordSprint / Kangaroo.
- Login-gated (valid Supabase session) with its progress (`wijnwijs-v1`) synced
  to a per-user `wine_state` row, env-namespaced (`dd:` live / `sbx:` sandbox) so
  sandbox testing can't touch live progress. Daily digest mirrors live progress
  to a rolling vault file. Cache v18 -> v19.

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
