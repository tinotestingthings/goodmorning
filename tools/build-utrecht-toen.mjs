#!/usr/bin/env node
// Bouwt sandbox/utrecht-toen/data.json uit de bronrepo ~/Code/utrecht-in-beeld
// (Next.js/D1-app "Utrecht Toen"). De publiekskaart daar leest twee JSON-
// snapshots + D1; hier voegen we alleen de twee snapshots samen met dezelfde
// dedup-regel als lib/photo-repository.ts (id, bron:bronrecord, image_url) en
// hangen de link-only contextbijdragen per foto eraan. Geen beelden of teksten
// van contextproviders — alleen titel, link en matchbewijs.
//
//   node tools/build-utrecht-toen.mjs [pad-naar-utrecht-in-beeld]
//
// Daarna promote zoals elke utility-app. De invariantcontroles onderaan komen
// uit CLAUDE.md van de bronrepo; faalt er één, dan is de bron veranderd en moet
// het handboek daar eerst bijgewerkt.
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const src = process.argv[2] || join(homedir(), "Code", "utrecht-in-beeld");
const read = (f) => JSON.parse(readFileSync(join(src, "data", f), "utf8"));

const base = read("photos.json");
const cities = read("cities.json");
const published = read("published-review-photos.json");
const providers = read("context-providers.json").filter((p) => p.enabled);
const contributions = read("context-contributions.json");

const seenIds = new Set(), seenRecords = new Set(), seenImages = new Set();
const photos = [];
for (const photo of [...base, ...published]) {
  const record = `${photo.source}:${photo.source_record_id}`;
  if (seenIds.has(photo.id) || seenRecords.has(record) || seenImages.has(photo.image_url)) continue;
  seenIds.add(photo.id); seenRecords.add(record); seenImages.add(photo.image_url);
  photos.push(photo);
}

const providerName = new Map(providers.map((p) => [p.id, p.name]));
for (const photo of photos) {
  photo.context_contributions = contributions.flatMap((c) => {
    const match = providerName.has(c.provider_id) && c.matches.find((m) => m.photo_id === photo.id);
    if (!match) return [];
    const { matches, ...link } = c;
    return [{ ...link, provider_name: providerName.get(c.provider_id),
      match: { method: match.method, confidence: match.confidence, evidence: match.evidence } }];
  });
}
photos.sort((a, b) => a.id.localeCompare(b.id));

const assert = (ok, msg) => { if (!ok) { console.error("✗ " + msg); process.exit(1); } };
// Elke basis- en reviewfoto precies één keer: dubbels horen al in de bron te zijn opgelost.
assert(photos.length === base.length + published.length, `verwacht ${base.length + published.length} foto's (basis + review), kreeg ${photos.length}`);
assert(photos.filter((p) => p.location_revision?.status === "newly_established").length === 21, "verwacht 21 nieuw vastgestelde locaties");
assert(photos.every((p) => p.bearing == null || p.bearing_method), "bearing zonder methode");

const out = join(import.meta.dirname, "..", "sandbox", "utrecht-toen", "data.json");
writeFileSync(out, JSON.stringify({ cities, providers, photos }));
console.log(`✓ ${photos.length} foto's, ${providers.length} providers → ${out}`);
