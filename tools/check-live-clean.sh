#!/usr/bin/env bash
# live-clean guard — the safety net for sandbox/live separation.
# Fails if source hardcodes a data-namespace instead of going through the
# runtime helper k()/DD_ENV (env.js). This is exactly the class of bug that
# blanked the live calendar on 2026-08-04. Run in CI on every push to main,
# and locally before promoting sandbox -> live.
set -uo pipefail
fail=0

# 1) No quoted "dd.<key>" / "sbx.<key>" literals anywhere except env.js.
hits=$(grep -rnE "[\"'](dd|sbx)\.[A-Za-z]" --include=*.js . | grep -v "/env.js:" | grep -v "^\./env.js:" || true)
if [ -n "$hits" ]; then
  echo "✗ Hardcoded namespace key literal(s) found — use k(\"name\") instead:"
  echo "$hits"
  fail=1
fi

# 2) The live root PWA/title must never say SBX.
if grep -q "SBX" index.html; then
  echo "✗ index.html (live root) contains 'SBX' — the title must be namespace-derived (env.js)"
  fail=1
fi

# 2b) The live PWA manifest must never carry the sandbox name/branding.
#     Added 2026-08-17: a promotion copied sandbox/manifest.json over live,
#     which would have renamed the installed app to "SBX Digest" on the home
#     screen. index.html was checked, manifest.json was not.
if grep -q "SBX" manifest.json; then
  echo "✗ manifest.json (live root) contains 'SBX' — the installed PWA would be renamed"
  fail=1
fi

# 3) The data-wiping reset button must always be path-guarded (never mounts on live).
if grep -nE "^\s*document\.body\.appendChild\(renderSandboxReset\(\)\);" home.js sandbox/home.js >/dev/null 2>&1; then
  echo "✗ renderSandboxReset() is mounted without a /sandbox/ path guard"
  fail=1
fi

[ "$fail" -eq 0 ] && echo "✓ live-clean guard passed"
exit $fail
