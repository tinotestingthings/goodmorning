// Validates src/festivals.ts before every build. The weekly catalog task writes
// that file unattended, so bad data must fail the build instead of going live.
// Run from events-src/: node check-festivals.mjs   (Node ≥ 22.18: imports .ts directly)
import { festivals, PROVINCES, SIZES, GENRES } from "./src/festivals.ts";

const isoDay = /^\d{4}-\d{2}-\d{2}$/;
const errors = [];
const ids = new Set();
for (const f of festivals) {
  const bad = (msg) => errors.push(`${f.id ?? "?"}: ${msg}`);
  if (!f.id || ids.has(f.id)) bad("missing or duplicate id");
  ids.add(f.id);
  for (const key of ["name", "city", "when", "blurb"]) if (!f[key]) bad(`missing ${key}`);
  if (!PROVINCES.includes(f.province)) bad(`bad province "${f.province}"`);
  if (!SIZES.includes(f.size)) bad(`bad size "${f.size}"`);
  if (!Array.isArray(f.genres) || !f.genres.length || f.genres.length > 3 || f.genres.some((g) => !(g in GENRES))) bad(`bad genres ${JSON.stringify(f.genres)}`);
  if (!(Number.isInteger(f.month) && f.month >= 1 && f.month <= 12)) bad(`bad month ${f.month}`);
  if (!/^https:\/\//.test(f.url ?? "")) bad(`bad url "${f.url}"`);
  if (f.next) {
    if (!isoDay.test(f.next.start) || !isoDay.test(f.next.end) || f.next.start > f.next.end) bad(`bad next ${f.next.start}..${f.next.end}`);
    if (f.next.verifiedAt && !isoDay.test(f.next.verifiedAt)) bad(`bad verifiedAt "${f.next.verifiedAt}"`);
  }
}
if (errors.length) {
  console.error(`✗ src/festivals.ts — ${errors.length} problem(s):\n  ${errors.join("\n  ")}`);
  process.exit(1);
}
// Not an error — the next edition simply hasn't been announced yet. But a stale
// `next` makes the tab advertise an edition that is over, so say which ones.
const today = new Date().toISOString().slice(0, 10);
const stale = festivals.filter((f) => f.next && f.next.end < today).map((f) => `${f.id} (ended ${f.next.end})`);
console.log(`✓ src/festivals.ts: ${festivals.length} festivals valid`);
if (stale.length) console.log(`! next edition is over, needs new dates or removal: ${stale.join(", ")}`);
