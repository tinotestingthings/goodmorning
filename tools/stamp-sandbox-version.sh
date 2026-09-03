#!/bin/sh
# Stamps sandbox/env.js with "sbx <date> <time>" whenever sandbox files are
# staged, so the SANDBOX badge and Settings show exactly which build is
# deployed. Installed as the git pre-commit hook (see README-DEPLOY.md):
#   ln -sf ../../tools/stamp-sandbox-version.sh .git/hooks/pre-commit
# promote.sh re-stamps the live env.js with the release tag, same pattern.
cd "$(git rev-parse --show-toplevel)" || exit 0
git diff --cached --name-only | grep -q '^sandbox/' || exit 0
stamp="sbx $(date '+%Y-%m-%d %H:%M')"
perl -pi -e "s|(titlePrefix: isSandbox \? \"SBX · \" : \"\")(,\s*version: \"[^\"]*\")?|\1, version: \"$stamp\"|" sandbox/env.js
git add sandbox/env.js
