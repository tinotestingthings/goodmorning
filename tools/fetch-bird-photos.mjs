// Haalt per cursussoort extra foto's op bij iNaturalist, zodat de quiz niet
// telkens dezelfde ene Wikipedia-foto toont (dan onthoud je de foto in plaats
// van de vogel). Alleen CC-gelicenseerde taxonfoto's, met bronvermelding.
//
// Schrijft vogelspotinus/data/bird-photos.json:
//   { "<scientificName>": [ { "u": mediumUrl, "a": attribution }, ... ] }
//
// Draaien (duurt enkele minuten, ~1 request/s uit beleefdheid voor de API):
//   node tools/fetch-bird-photos.mjs sandbox/vogelspotinus
//
// De app werkt ook zonder dit bestand (valt terug op de ene Wikipedia-foto);
// het is verrijking, geen dependency.

import { readFileSync, writeFileSync, existsSync } from "node:fs";

const APP_DIR = process.argv[2] || "vogelspotinus";
const COURSE_FILE = `${APP_DIR}/src/data/course-griftpark.js`;
const OUT = `${APP_DIR}/data/bird-photos.json`;
const PHOTOS_PER_SPECIES = 4;
const UA = "goodmorning-vogelspotinus/1.0 (personal bird-learning PWA)";
const API = "https://api.inaturalist.org/v1";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getJson(url) {
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

// De cursuslijst is een ES-module; importeren i.p.v. parsen.
const { GRIFTPARK_COURSE } = await import(`../${COURSE_FILE}`);
const species = GRIFTPARK_COURSE.species.map(([sci]) => sci);

// Incrementeel: bestaande output hergebruiken zodat een afgebroken run niet
// alles opnieuw hoeft en een re-run alleen de gaten vult.
const out = existsSync(OUT) ? JSON.parse(readFileSync(OUT, "utf8")) : {};

// iNat square-thumb -> medium (~500px). Standaard URL-patroon van hun CDN.
const mediumUrl = (photo) =>
  (photo.medium_url || photo.url || "").replace(/\/square(\.[a-z]+)/i, "/medium$1");

let done = 0;
for (const sci of species) {
  done += 1;
  if (Array.isArray(out[sci]) && out[sci].length > 0) continue;
  try {
    const search = await getJson(
      `${API}/taxa?q=${encodeURIComponent(sci)}&rank=species&per_page=1`
    );
    const hit = search.results?.[0];
    if (!hit) {
      console.warn(`geen taxon: ${sci}`);
      continue;
    }
    await sleep(1100);
    const detail = await getJson(`${API}/taxa/${hit.id}`);
    const taxon = detail.results?.[0];
    const photos = (taxon?.taxon_photos ?? [])
      .map((tp) => tp.photo)
      // Alleen foto's met een CC-licentie; license_code null = all rights reserved.
      .filter((p) => p && p.license_code && mediumUrl(p))
      .slice(0, PHOTOS_PER_SPECIES)
      .map((p) => ({ u: mediumUrl(p), a: p.attribution || "" }));
    if (photos.length) out[sci] = photos;
    console.log(`[${done}/${species.length}] ${sci}: ${photos.length} foto's`);
    // Tussentijds wegschrijven: een crash halverwege kost dan geen werk.
    writeFileSync(OUT, JSON.stringify(out));
  } catch (err) {
    console.warn(`fout bij ${sci}: ${err.message}`);
  }
  await sleep(1100);
}

writeFileSync(OUT, JSON.stringify(out));
const total = Object.values(out).reduce((s, a) => s + a.length, 0);
console.log(`klaar: ${Object.keys(out).length} soorten, ${total} foto's -> ${OUT}`);
