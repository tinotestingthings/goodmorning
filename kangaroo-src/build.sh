#!/usr/bin/env bash
# Rebuilds sandbox/kangaroo/bundle.js from kangaroo-src (promote copies it live).
# Usage: run from repo root: bash kangaroo-src/build.sh
# Requires: node + npm. Installs esbuild/react/react-dom into
# kangaroo-src/node_modules (gitignored) on first run.
set -euo pipefail
cd "$(dirname "$0")"
if [ ! -d node_modules/esbuild ]; then
  npm install --no-audit --no-fund
fi
./node_modules/.bin/esbuild main.tsx \
  --bundle --minify --format=iife \
  --jsx=automatic \
  --loader:.tsx=tsx --loader:.ts=ts \
  --outfile=../sandbox/kangaroo/bundle.js \
  --define:process.env.NODE_ENV='"production"'
echo "Built ../sandbox/kangaroo/bundle.js — test in sandbox, then promote."
