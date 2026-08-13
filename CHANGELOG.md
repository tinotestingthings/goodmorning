# Changelog

Newest first. One line per deploy to the live root.

## 2026-08-13 (Event Tracker weekly catalogue refresh)
- Scheduled `event-tracker-catalog-refresh` run. Checked all listed Utrecht
  sources (general/gemeente/ontdek, music, nature, museums, venues/film
  houses, Kinepolis coming-soon, NVPI premieres) plus the Dune: Part Three
  monitored-film sources; no changes to `sources[]` health or the film
  snapshot were warranted.
- Added three new core events, each independently source-verified:
  Festival Oude Muziek Utrecht 2026 "Giving Voice" (28 Aug - 6 Sep, official
  oudemuziek.nl), the Gerard van Honthorst retrospective at Centraal Museum
  (closes 13 Sep, first-ever Honthorst retrospective, official museum page),
  and Nacht van de Nacht 2026 (24 Oct, official nachtvandenacht.nl, 22nd
  edition dark-sky campaign with Utrecht-province activities).
- Considered and deliberately skipped: Pluk de Nacht (annual, already
  ending), two conflicting "Kastelentocht" events (cycling vs. carriage
  tour, ambiguous/overlapping sourcing), a "Dick Bruna 100 jaar" exhibition
  claim that couldn't be verified against the official museum site, and
  Jaarbeurs trade fairs (routine B2B programming, not this catalogue's
  flavor). Cache v33 -> v34 (sandbox v50 -> v51).

## 2026-08-13 (Event Tracker promoted to live)
- New `events/` Utilities app: personal event tracker (Discover/Inbox/Saved/
  Actions/Timeline/Sources/Archive/Settings), ported off a standalone
  Next.js/Cloudflare/D1 project onto a static bundle + Supabase persistence,
  matching the wine/kangaroo/notesprint/vogelspotinus pattern. Tracking state
  (save/dismiss/plan/booked, notes, manual events, source toggles, discovery
  preferences/regions) syncs via a new `eventtracker_state` table; the event
  catalogue itself ships baked into `bundle.js` and is not synced. Built and
  verified in sandbox first (Tinus confirmed save/dismiss/notes/reload work),
  then promoted surgically: new `events/` folder + tab button in index.html +
  `APPS.events` entry in practice.js. Cache v32 -> v33.

## 2026-08-09 (P1: satellite apps could wipe their own server data)
- WijnWijs, Kangaroo, NoteSprint and ChordSprint all shared the agenda bug that
  wiped the live agenda, in a second form. Their push deletes their own keys from
  the row and re-adds whatever is in localStorage — correct only if the pull
  populated it. But all four treated a FAILED pull as success (`cb()` on the error
  path), mounted the app on empty state, and the first write wiped the row.
- Fix 1: a failed pull is now fatal — the app does not mount and the storage shim
  is never armed, so no write (and therefore no push) can happen. The user gets a
  "couldn't load, reload" gate instead of a silently empty app.
- Fix 2: pushes are refused outright when local holds no data but the server does.
- Fix 3: wine/kangaroo gain a `primed` flag; pushNow is a no-op until a pull has
  actually succeeded (notesprint/ear-training already had `ready`, now only set on
  success). Cache v29 -> v30.
- Known trade-off: deliberately clearing ALL of an app's data no longer syncs that
  emptiness to the other devices. Losing a "delete everything" beats losing everything.

## 2026-08-09 (agenda recovery)
- One-time client-side restore of the wiped live agenda from the 2026-08-07 vault
  backup (8 open to-dos, 17 completed, 5 chores). agenda_state is read-only to the
  service_role by design, so the write happens in-app under the user's own auth,
  the same way items.js seeds. Runs only after the first pull, only once, and only
  when the local to-do list is genuinely empty, so it can never overwrite anything
  re-created since. Cache v28 -> v29.

## 2026-08-09 (HOTFIX: agenda sync could wipe the live agenda)
- ROOT CAUSE of the live agenda loss at 13:46Z. items.js seeded a new vault item
  via a blind `setTimeout(seedOnce, 8000)` fallback that fired BEFORE AgendaSync's
  first pull returned (the v27 cache bump forced a full shell refetch, slowing
  boot). seedOnce -> save() -> AgendaSync.pushNow() pushed a snapshot in which
  dd.todos/chores/history/workweek were still absent (null), and push() wrote
  those nulls over the good server row. Every device then pulled the nulls and
  applySnapshot() deleted them locally too.
- Fix 1: push() never writes an ABSENT local key (null) over existing server data.
  An explicit [] (you deleted everything) still syncs — only "not loaded yet" is
  blocked.
- Fix 2: applySnapshot() never deletes non-empty local data because the server
  says null, so a device holding the last surviving copy keeps it.
- Fix 3: AgendaSync is "primed" only after the first successful pull; pushNow /
  tick / pullNow refuse to push before that.
- Fix 4: items.js seedOnce waits for the first pull when a sync session is active
  instead of firing blind at 8s. Cache v27 -> v28.

## 2026-08-09 (WijnWijs topic-linking + calendar/capture/subtask fixes)
- WijnWijs: Onderwerpen are now derived from the real question bank and grouped by
  each question's topic; tapping an onderwerp starts a practice filtered to that
  topic. Topic progress bars and profile "Retentie" are computed from reviews
  instead of hardcoded 0%.
- Calendar all-day: tapping an all-day chip no longer fires the cell's
  drag-to-create editor over the item menu, so all-day items can be opened and
  deleted like normal tasks.
- Postpone/move/drag now shift a to-do's end date together with its start date,
  so postponing today->tomorrow no longer leaves the item stuck under "today".
- Quick capture: Task/Project create an in-app item directly (Task->To-do,
  Project->Idea) instead of a vault-inbox capture; Note still routes to the inbox.
- Item subtasks: the Tasks/Projects panel keeps its open state across edits (edit
  several subtasks without it snapping shut), and done subtasks sort to the bottom
  (item panel + detail sheet). Cache v26 -> v27.

## 2026-08-05 (NoteSprint local + sync for both games)
- NoteSprint is now a LOCAL copy behind goodmorning (/notesprint/) instead of the
  external github.io link (external site left untouched); Utilities tab repointed.
- NoteSprint and ChordSprint (ear-training) now sync their scores/settings to
  per-user Supabase rows (notesprint_state / chordsprint_state), env-namespaced
  (dd:/sbx:) behind the login gate, via a boot layer that defers each app's own
  script until after the pull. Daily digest backs both up to rolling vault files.
  Cache v25 -> v26.

## 2026-08-05 (WijnWijs greeting)
- Also removed the hardcoded "Goedemorgen, Martijn." greeting -> "Goedemorgen."
  No personal name remains in the app. Cache v24 -> v25.

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
