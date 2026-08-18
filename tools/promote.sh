#!/usr/bin/env bash
# Promote sandbox/ -> live root, safely, and tag the release.
# Usage:  bash tools/promote.sh "what changed"
# Encodes README-DEPLOY.md: guard first, copy everything except the three
# live-only data/branding files, guard again, syntax-check, commit, tag, push.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
msg="${1:-}"; [ -n "$msg" ] || { echo "usage: bash tools/promote.sh \"what changed\""; exit 1; }
[ "$(git branch --show-current)" = "main" ] || { echo "✗ promote only from main"; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "✗ working tree not clean — commit or stash first"; exit 1; }

bash tools/check-live-clean.sh
for f in sandbox/*; do b=$(basename "$f")
  case "$b" in feed.json|items-seed.json|manifest.json|.DS_Store) continue;; esac
  if [ -d "$f" ]; then mkdir -p "$b"; cp -a "$f/." "$b/"; else cp -a "$f" "$b"; fi
done
bash tools/check-live-clean.sh
for f in *.js sandbox/*.js; do node --check "$f"; done

tag="v$(date +%Y.%m.%d)"; n=1
while git rev-parse -q --verify "refs/tags/$tag-$n" >/dev/null; do n=$((n+1)); done; tag="$tag-$n"
# stamp the version into the live env.js so Settings can show it
perl -pi -e "s|(titlePrefix: isSandbox \? \"SBX · \" : \"\")(,\s*version: \"[^\"]*\")?|\1, version: \"$tag\"|" env.js
grep -q "version: \"$tag\"" env.js || echo "(note: could not stamp version into env.js — pattern changed; continuing)"

printf '\n## %s (%s) — %s\n\n' "$(date +%Y-%m-%d)" "$tag" "$msg" > /tmp/gm-changelog-entry
{ head -3 CHANGELOG.md; cat /tmp/gm-changelog-entry; tail -n +4 CHANGELOG.md; } > /tmp/gm-changelog && mv /tmp/gm-changelog CHANGELOG.md

git add -A
git commit -m "Promote sandbox -> live ($tag): $msg"
git tag -a "$tag" -m "$msg"
git push && git push --tags
echo "✓ promoted and tagged $tag"
echo "  roll back: git revert HEAD && git push   (or: git reset --hard <prev-tag> && git push --force)"
