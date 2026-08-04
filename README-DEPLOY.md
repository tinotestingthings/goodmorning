# Deploying goodmorning

## Two builds, one repo
- **Live** = repo root, served at `/`. Reads the `dd.*` data namespace.
- **Sandbox** = `sandbox/`, served at `/sandbox/`. Reads `sbx.*`.

The namespace is chosen **at runtime** by `env.js` from the URL path — it is not
baked into the source. Every storage key goes through `k("name")`, so the same
file is correct at either URL. There is no `sed` transform anymore.

## Rules
1. **Never hardcode a storage key.** Use `k("todos")`, not `"dd.todos"`. The CI
   guard (`tools/check-live-clean.sh`) rejects hardcoded `dd.`/`sbx.` literals.
2. **`feed.json` at the root is LIVE DATA** (refreshed by the daily-digest task).
   Never overwrite it with the sandbox copy during a promotion.
3. The daily-digest scheduled task only ever writes `feed.json`. It must never
   copy app code.

## Promote sandbox → live
Because both builds use `k()`, promotion carries no namespace risk — the copied
code resolves to `dd.*` on the live URL automatically.
```
bash tools/check-live-clean.sh          # must pass first
# copy sandbox app files to root, EXCEPT feed.json:
for f in sandbox/*; do b=$(basename "$f"); [ "$b" = feed.json ] && continue
  if [ -d "$f" ]; then mkdir -p "$b"; cp -a "$f/." "$b/"; else cp -a "$f" "$b"; fi; done
bash tools/check-live-clean.sh          # must still pass
for f in *.js sandbox/*.js; do node --check "$f"; done
git commit -am "Promote sandbox -> live: <what>" && git push
```
Roll back a bad deploy with `git reset --hard <prev> && git push --force`.
Add a line to `CHANGELOG.md` for every live deploy.

## CI guard (manual one-time setup)
The push token can't create workflow files, so add this once via the GitHub web
UI (Actions → new workflow) as `.github/workflows/guard.yml`:
```yaml
name: live-clean guard
on:
  push: { branches: [main] }
  pull_request:
jobs:
  guard:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: bash tools/check-live-clean.sh
      - run: for f in *.js sandbox/*.js; do node --check "$f"; done
```
Until then, run `bash tools/check-live-clean.sh` locally before any promotion.
