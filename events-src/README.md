# Event Tracker — source

Source for the `events/` (live) and `sandbox/events/` (sandbox) Utilities app.
Ported off a standalone Next.js/Cloudflare/D1 project (`Event tracker/` in
Tinus's vault-connected folders, which stays local-only per its own
AGENTS.md) onto a static bundle + Supabase persistence, matching the other
utility apps (wine, kangaroo, notesprint, ear-training, vogelspotinus).

## Layout

- `src/types.ts` — shared types (EventRecord, SourceRecord, etc.)
- `src/data.ts` — the event catalogue: hand-curated core events + re-exports
  from `film-snapshot.ts` and `monitored-films.ts`. **This is what the
  weekly event-catalog-refresh scheduled task edits.**
- `src/film-snapshot.ts` — dated snapshot of the five film-house/premiere
  sources (Hartlooper, Springhaver, Slachtstraat, Kinepolis, NVPI).
- `src/monitored-films.ts` — blockbusters being watched for Dutch release/
  ticket-sale/format changes (e.g. Dune: Part Three).
- `src/storage.ts` — logical-key localStorage read/write for personal
  tracking state (save/dismiss/notes/manual events/source toggles/
  preferences/regions). This is what syncs to Supabase via boot.js — the
  catalogue above does NOT sync, it ships baked into the bundle.
- `src/EventTracker.tsx` — the React UI (ported from the original app,
  `/api/user-state` fetches replaced with `storage.ts` calls).
- `src/entry.tsx` — mounts `<EventTracker>` into `#root`.

## Rebuilding

```bash
bash events-src/build.sh          # writes ../events/bundle.js (LIVE)
```

For a sandbox build, run the same command then copy the output:
```bash
bash events-src/build.sh
cp events/bundle.js sandbox/events/bundle.js
```

After rebuilding: run `bash tools/check-live-clean.sh` and
`node --check events/bundle.js` (and the sandbox copy) before committing.

## Updating the catalogue

Edit `src/data.ts` (core Utrecht events + sources array), `src/film-snapshot.ts`
(dated film-house scan) or `src/monitored-films.ts` (blockbuster watchlist),
then rebuild. Every event needs a real source URL — don't invent dates or
records; see the vault spec's date-verification rule (unverified/manual
entries are clearly labelled `dateStatus: "manual"` in the UI).

Full integration writeup: `40 Projects/2026-08-13-event-tracker-integration-and-backup-spec.md`
in the vault.
