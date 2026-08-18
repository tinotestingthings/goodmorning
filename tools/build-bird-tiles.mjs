// Bouwt de slanke dataset voor de dagelijkse vogeltegel op het homescreen.
//
// `vogelspotinus/data/birds.json` is ~1 MB en bevat per vogel teksten, geluid
// en tags. Het homescreen heeft daar niets aan: het toont één naam en één
// plaatje. Deze generator schrijft daarom een klein bestand met alleen die twee
// velden, en verkleint de Wikimedia-thumb van 960px naar 240px — een tegel is
// 92px breed, dus 960px binnenhalen is puur verspilling.
//
// Draaien na elke wijziging aan birds.json:
//   node tools/build-bird-tiles.mjs

import { readFileSync, writeFileSync } from "node:fs";

const SRC = process.argv[2] || "vogelspotinus/data/birds.json";
const OUT = SRC.replace(/birds\.json$/, "bird-tiles.json");
const THUMB_WIDTH = 240;

const birds = JSON.parse(readFileSync(SRC, "utf8"));

// Wikimedia levert drie vormen aan, en alle drie moeten naar een 240px-thumb:
//   1. .../commons/thumb/a/a1/Naam.jpg/960px-Naam.jpg      -> breedte vervangen
//   2. .../commons/thumb/a/ab/Naam.tif/lossy-page1-960px-Naam.tif.jpg
//                                                          -> idem, maar de
//      breedte staat niet direct achter een slash
//   3. .../commons/0/0b/Naam.jpg                           -> geen thumb; die
//      moeten we zelf opbouwen
// Vorm 3 bouwen we alleen om voor jpg en png, waar de thumb dezelfde extensie
// houdt. Bij tif/svg/gif verzint Commons een andere extensie en zouden we een
// dode URL construeren; die laten we dan liever ongemoeid (groter, maar heel).
const shrink = (raw) => {
  const url = raw.trim().replace(/\?.*$/, "");

  if (url.includes("/thumb/")) {
    const cut = url.lastIndexOf("/");
    const head = url.slice(0, cut + 1);
    const tail = url.slice(cut + 1).replace(/(^|-)\d+px-/, `$1${THUMB_WIDTH}px-`);
    return head + tail;
  }

  const m = url.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/([0-9a-f])\/([0-9a-f]{2})\/(.+\.(?:jpg|jpeg|png))$/i);
  if (m) {
    const [, base, a, ab, file] = m;
    return `${base}/thumb/${a}/${ab}/${file}/${THUMB_WIDTH}px-${file}`;
  }

  return url;
};

// Nederlandse Wikipedia-namen dragen soms een disambiguatiesuffix ("Vink
// (vogel)"). Op een tegel van 92px is dat pure ruis.
const cleanName = (name) =>
  String(name).replace(/\s*\([^)]*\)\s*$/, "").trim();

const tiles = birds
  .filter((b) => b.imageThumbUrl)
  .map((b) => ({
    n: cleanName(b.dutchName || b.englishName || b.scientificName),
    u: shrink(b.imageThumbUrl),
  }))
  .filter((b) => b.n && b.u);

writeFileSync(OUT, JSON.stringify(tiles), "utf8");

const bytes = Buffer.byteLength(JSON.stringify(tiles));
console.log(`${tiles.length} vogels -> ${OUT} (${(bytes / 1024).toFixed(0)} kB)`);
