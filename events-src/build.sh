#!/usr/bin/env bash
# Rebuilds events/bundle.js (live) from events-src/src.
# Usage: run from repo root: bash events-src/build.sh
# Requires: node + npm. Installs esbuild/react/react-dom into events-src/node_modules
# (gitignored) on first run.
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d node_modules/esbuild ]; then
  npm install --no-audit --no-fund
fi
node check-festivals.mjs
./node_modules/.bin/esbuild src/entry.tsx \
  --bundle --minify --format=iife \
  --jsx=automatic \
  --loader:.tsx=tsx --loader:.ts=ts \
  --outfile=../events/bundle.js \
  --define:process.env.NODE_ENV='"production"'
echo "Built ../events/bundle.js"
