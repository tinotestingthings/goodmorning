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
// 480 in plaats van 240: de tegel is 92px, maar we zoomen in de CSS in en
// op een retina-scherm is 92px al 184 device-pixels. Met 240px bron werd dat
// zichtbaar zacht zodra de zoom omhoog ging.
const THUMB_WIDTH = 480;

const birds = JSON.parse(readFileSync(SRC, "utf8"));

// Wikimedia-thumbnails verkleinen we van 960px naar 480px. Dat doen we ALLEEN bij URL's die al een geldige /thumb/-vorm hebben:
// daar is de breedte simpelweg een segment in het pad en is vervangen veilig.
//
// Bij een directe bestands-URL (.../commons/3/33/Naam.jpg) zelf een thumb-pad
// construeren bleek FOUT: Wikimedia gaf een HTML-foutpagina terug, die Chrome
// vervolgens tegenhield met CORB, en de tegel bleef leeg. Zulke URL's laten we
// dus met rust — liever een groter plaatje dan geen plaatje.
//
// Voor de zekerheid schrijven we de originele URL mee als `o`. Faalt de
// geoptimaliseerde variant alsnog, dan valt de tegel daarop terug.
const shrink = (raw) => {
  const url = raw.trim();
  if (!url.includes("/thumb/")) return url;

  const cut = url.lastIndexOf("/");
  const head = url.slice(0, cut + 1);
  const tail = url
    .slice(cut + 1)
    .replace(/\?.*$/, "")
    .replace(/(^|-)\d+px-/, `$1${THUMB_WIDTH}px-`);
  return head + tail;
};

// Nederlandse Wikipedia-namen dragen soms een disambiguatiesuffix ("Vink
// (vogel)"). Op een tegel van 92px is dat pure ruis.
const cleanName = (name) =>
  String(name).replace(/\s*\([^)]*\)\s*$/, "").trim();

const tiles = birds
  .filter((b) => b.imageThumbUrl)
  .map((b) => {
    const original = b.imageThumbUrl.trim();
    const optimised = shrink(original);
    const tile = {
      n: cleanName(b.dutchName || b.englishName || b.scientificName),
      u: optimised,
    };
    if (optimised !== original) tile.o = original;
    return tile;
  })
  .filter((b) => b.n && b.u);

writeFileSync(OUT, JSON.stringify(tiles), "utf8");

const bytes = Buffer.byteLength(JSON.stringify(tiles));
console.log(`${tiles.length} vogels -> ${OUT} (${(bytes / 1024).toFixed(0)} kB)`);
