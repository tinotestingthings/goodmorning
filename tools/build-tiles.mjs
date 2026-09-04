// Bouwt de slanke datasets voor de dagelijkse fototegel op Today.
//
// Bron van waarheid is het register van Spotinus zelf (DATASETS in
// src/core/birds.js, labels via filters.js + strings.js): een soort die daar
// bijkomt, verschijnt vanzelf in de tegel en in Settings. De volledige
// databestanden (birds.json ~1 MB, dogs.json ~400 kB) zijn te zwaar voor een
// tegel van 92px; per soort schrijven we alleen id, naam en plaatje.
//
// Uitvoer, naast de bronbestanden in <app>/data/:
//   tiles.json            index: [{ kind, label, file }]
//   tiles-<kind>.json     [{ id, n, u }]
//
// Draaien na elke wijziging aan de databestanden:
//   node tools/build-tiles.mjs [sandbox/vogelspotinus]

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const APP = resolve(process.argv[2] || "sandbox/vogelspotinus");
const { DATASETS } = await import(pathToFileURL(resolve(APP, "src/core/birds.js")));
const { FILTER_DEFINITIONS } = await import(pathToFileURL(resolve(APP, "src/core/filters.js")));
const { STRINGS } = await import(pathToFileURL(resolve(APP, "src/core/strings.js")));

// 500 en niet 480: Wikimedia serveert alleen nog de breedtes van
// https://w.wiki/GHai; 480px gaf een 400 en de tegel viel elke dag terug op 960px.
const WIDTH = 500;

// Elke Wikimedia-vorm naar een 500px-thumb: een /thumb/-pad krijgt de breedte
// in het pad; een directe bestands-URL of Special:FilePath gaat via
// Special:FilePath?width= (zelf een /thumb/-pad bouwen gaf een HTML-foutpagina).
// Andere hosts (iNaturalist) blijven zoals ze zijn.
function shrink(raw) {
  const url = String(raw).trim();
  if (url.includes("/thumb/")) {
    const cut = url.lastIndexOf("/");
    return url.slice(0, cut + 1) + url.slice(cut + 1).replace(/\?.*$/, "").replace(/(^|-)\d+px-/, `$1${WIDTH}px-`);
  }
  const m = url.match(/^https:\/\/(?:upload\.wikimedia\.org\/wikipedia\/commons\/[0-9a-f]\/[0-9a-f]{2}\/|commons\.wikimedia\.org\/wiki\/Special:FilePath\/)([^?#]+)/);
  return m ? `https://commons.wikimedia.org/wiki/Special:FilePath/${m[1]}?width=${WIDTH}` : url;
}

// "Vink (vogel)" -> "Vink": een disambiguatiesuffix is ruis op 92px.
const cleanName = (s) => String(s || "").replace(/\s*\([^)]*\)\s*$/, "").trim();
// Geen fallback-URL meer: 500px is een gelijste breedte, en de oude `o` (het
// 960px-origineel) kostte de helft van het bestand voor een pad dat nooit
// meer gelopen werd. Faalt een plaatje, dan toont de tegel het icoon.
const entry = (id, name, url) => ({ id, n: cleanName(name), u: shrink(url) });

const kindLabel = Object.fromEntries(
  FILTER_DEFINITIONS.find((d) => d.key === "kind").values.map((v) => [v.value, STRINGS.nl[v.labelKey]])
);

const index = [];
for (const d of DATASETS) {
  const listPath = resolve(APP, d.url);
  if (!existsSync(listPath)) { console.warn(`${d.url} ontbreekt, overgeslagen`); continue; }
  const species = JSON.parse(readFileSync(listPath, "utf8"));
  const photosPath = resolve(APP, d.photos);
  const photos = existsSync(photosPath) ? JSON.parse(readFileSync(photosPath, "utf8")) : {};
  const idOf = (s) => s.id ?? s.scientificName;
  const nameOf = (s) => s.dutchName || s.englishName || s.scientificName;

  // Normaal is de soort het onderwerp, met haar basisfoto. Bij een dataset met
  // `tilesFromPhotos` (bouwstijlen) zijn de foto's zelf het onderwerp: de tegel
  // toont het gebouw (naam vóór " — " in de attributie, zoals build-arch.mjs
  // die schrijft) en de klik opent de stijl. De extra quizfoto's van de andere
  // soorten doen niet mee: die verdubbelen het bestand, en 561 vogels is al
  // anderhalf jaar zonder herhaling.
  const tiles = [];
  for (const s of species) {
    const id = idOf(s);
    if (!d.tilesFromPhotos) {
      if (s.imageThumbUrl) tiles.push(entry(id, nameOf(s), s.imageThumbUrl));
      continue;
    }
    for (const p of photos[id] || []) {
      const dash = String(p.a || "").indexOf(" — ");
      if (dash > 0) tiles.push(entry(id, p.a.slice(0, dash), p.u));
    }
  }
  const file = `tiles-${d.kind}.json`;
  writeFileSync(resolve(APP, "data", file), JSON.stringify(tiles), "utf8");
  index.push({ kind: d.kind, label: kindLabel[d.kind] || d.kind, file });
  console.log(`${d.kind}: ${tiles.length} tegels -> data/${file} (${(Buffer.byteLength(JSON.stringify(tiles)) / 1024).toFixed(0)} kB)`);
}
writeFileSync(resolve(APP, "data/tiles.json"), JSON.stringify(index), "utf8");
console.log(`index -> data/tiles.json: ${index.map((k) => k.kind + "=" + k.label).join(", ")}`);
