#!/usr/bin/env bash
# Zet de nieuwste Utrecht Toen-data (uit ~/Code/utrecht-in-beeld) in sandbox én live, tagt en pusht.
# Gerichte promote: alleen utrecht-toen/data.json gaat mee, zodat andermans sandbox-werk blijft liggen.
#   bash tools/promote-utrecht-toen.sh [pad-naar-utrecht-in-beeld]
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
[ "$(git branch --show-current)" = "main" ] || { echo "✗ alleen vanaf main"; exit 1; }
git pull -q --rebase --autostash origin main
node tools/build-utrecht-toen.mjs "${1:-$HOME/Code/utrecht-in-beeld}"
if git diff --quiet -- sandbox/utrecht-toen/data.json; then echo "Geen datawijziging; niets te promoten."; exit 0; fi
n=$(node -e 'console.log(require("./sandbox/utrecht-toen/data.json").photos.length)')
cp -a sandbox/utrecht-toen/data.json utrecht-toen/data.json
bash tools/check-live-clean.sh
tag="v$(date +%Y.%m.%d)"; i=1; while git rev-parse -q --verify "refs/tags/$tag-$i" >/dev/null; do i=$((i+1)); done; tag="$tag-$i"
perl -pi -e "s|(titlePrefix: isSandbox \? \"SBX · \" : \"\")(,\s*version: \"[^\"]*\")?|\1, version: \"$tag\"|" env.js
msg="Utrecht Toen: $n foto's (data bijgewerkt uit utrecht-in-beeld)"
printf '\n## %s (%s) — %s\n\n' "$(date +%Y-%m-%d)" "$tag" "$msg" > /tmp/gm-changelog-entry
{ head -3 CHANGELOG.md; cat /tmp/gm-changelog-entry; tail -n +4 CHANGELOG.md; } > /tmp/gm-changelog && mv /tmp/gm-changelog CHANGELOG.md
git add sandbox/utrecht-toen/data.json utrecht-toen/data.json env.js CHANGELOG.md
git commit -q -m "Promote (gericht) sandbox -> live ($tag): $msg"
git tag -a "$tag" -m "$msg"
git push origin main && git push origin "$tag"
echo "✓ $tag live met $n foto's — controleer over een minuut: https://tinotestingthings.github.io/goodmorning/utrecht-toen/"
