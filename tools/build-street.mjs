// Bouwt het street-kind voor Spotinus: `street.json` + `street-photos.json`,
// in exact hetzelfde formaat als birds/dogs/arch, zodat de app er niets nieuws
// voor hoeft te kennen. De inhoud (24 straatobjecten, teksten, groepen) leeft
// in tools/street-objects.mjs — dit script haalt er alleen de foto's bij.
//
//   node tools/build-street.mjs sandbox/vogelspotinus
//   node tools/build-street.mjs sandbox/vogelspotinus --exclude tools/street-photo-excludes.txt
//
// Anders dan bij arch komen de foto's niet via Wikidata maar rechtstreeks uit
// Commons-CATEGORIEËN (`cats` per object, Utrecht eerst). Een gevelsteen heeft
// geen Q-id met sitelinks; de categorie ís de curatie. Binnen een categorie
// leveren we spreiding met een vaste stap door de alfabetische lijst, zodat
// niet veertien foto's van hetzelfde adres (Stolpersteine-series!) de
// kandidatenlijst vullen. Zelfde spelregels als build-arch.mjs verder: elke
// run haalt alles opnieuw op, en het contactvel (tools/street-photo-check.html)
// is de menselijke eindcontrole — wat daar niet deugt gaat in het
// exclude-bestand en de run draait opnieuw.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { STREET_OBJECTS, STREET_GROUPS } from "./street-objects.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1]?.startsWith("--") ? true : args[i + 1]) : null;
};
const APP_DIR = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"))
  || "sandbox/vogelspotinus";
const EXCLUDE_FILE = flag("exclude");

const OUT_STREET = `${APP_DIR}/data/street.json`;
const OUT_PHOTOS = `${APP_DIR}/data/street-photos.json`;
const OUT_SHEET = "tools/street-photo-check.html";

const UA = "goodmorning-spotinus/1.0 (personal learning PWA; dubbolbiutifu@gmail.com)";
const PAUSE_MS = 1300;
const BATCH = 50;
const PHOTOS_PER_OBJECT = 8;
const CANDIDATES_PER_OBJECT = 14; // ruim boven 8, zodat het licentie-/naamfilter kan snoeien
const THUMB_WIDTH = 960;
const FULL_WIDTH = 1600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
let calls = 0;

async function mwApi(host, params) {
  for (let poging = 0; ; poging += 1) {
    const url = new URL(`https://${host}/w/api.php`);
    for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) {
      url.searchParams.set(k, String(v));
    }
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    calls += 1;
    if ((res.status === 429 || res.status >= 500) && poging < 5) {
      const wacht = Number(res.headers.get("retry-after")) || 15;
      process.stdout.write(`\r  (${res.status}: ${wacht}s wachten)   `);
      await sleep(wacht * 1000);
      continue;
    }
    const text = await res.text();
    await sleep(PAUSE_MS);
    const json = JSON.parse(text);
    if (json.error) throw new Error(`${host}: ${json.error.info}`);
    return json;
  }
}
const commons = (params) => mwApi("commons.wikimedia.org", params);

/**
 * Bestandsnaam uit een File:-titel. Anders dan bij build-arch komt hier ALLES
 * als kale MediaWiki-titel binnen (categorymembers en imageinfo geven titels,
 * geen URL's), dus decodeURIComponent hoort hier niet: een titel met een losse
 * "%" zou de hele run met een URIError afbreken, en "?" is in titels legaal.
 */
const fileNameOf = (s) => String(s).replace(/^File:/, "").replace(/_/g, " ");

/** Beelden die het object niet tonen: kaarten, documenten, tekeningen, borden. */
const BAD_NAME =
  /kaart|map\b|plattegrond|tekening|drawing|bouwtekening|diagram|logo|document|krant|newspaper|boek\b|book\b|scan\b|portret|portrait|collage|montage|informatiebord|infobord|information (board|sign)|plaquette voor|bidprentje|advertentie in|artikel|monument voor de gevallenen|oorlogsmonument|interieur|interior|zerk\b|grafsteen|tombstone|NGA \d|objectnr|chinese tuin|blz\./i;

// --- 1. Kandidaat-bestanden per object uit de categorieën -------------------

/** Alle bestanden in één categorie, `continue` volgend (stille limieten!). */
async function categoryFiles(cat) {
  const files = [];
  let cont = {};
  for (let guard = 0; guard < 10; guard += 1) {
    const json = await commons({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${cat}`,
      cmtype: "file",
      cmlimit: 500,
      ...cont,
    });
    for (const m of json.query?.categorymembers ?? []) files.push(fileNameOf(m.title));
    if (!json.continue) break;
    cont = json.continue;
  }
  return files;
}

async function fetchObjectCandidates(excluded) {
  // Fase 1: per object de VOLLEDIGE categorielijsten ophalen (dedup binnen
  // het object). Volledig, want het multi-object-weer hieronder moet alles
  // zien: een bestand dat in de categorieën van TWEE objecten zit (een
  // kanon-schamppaal in een paaltjes-categorie) is als quizfoto onbruikbaar,
  // en dat zie je alleen op de complete lijsten -- een steekproef mist hem.
  const volledige = new Map(); // key -> [[files cat1], [files cat2], ...]
  for (const obj of STREET_OBJECTS) {
    const seen = new Set();
    const catLijsten = [];
    for (const cat of obj.cats) {
      catLijsten.push((await categoryFiles(cat)).filter((f) => !seen.has(f) && (seen.add(f), true)));
      process.stdout.write(
        `\r  ${obj.nl.padEnd(28)} ${String(seen.size).padStart(3)} bestanden   `
      );
    }
    volledige.set(obj.key, catLijsten);
  }
  process.stdout.write("\n");

  const eigenaren = new Map(); // file -> bij hoeveel objecten hij hoort
  for (const [, catLijsten] of volledige) {
    for (const f of new Set(catLijsten.flat())) eigenaren.set(f, (eigenaren.get(f) ?? 0) + 1);
  }

  // Fase 2: filteren op de volledige lijsten, en pas daarná spreiden met een
  // vaste stap door de (alfabetische) rest: series van hetzelfde adres staan
  // bij elkaar, en zonder spreiding wordt de kandidatenlijst één straat
  // (Stolpersteine!). Math.ceil, niet floor: bij 15-27 bruikbare bestanden
  // moet de stap al 2 zijn, anders houdt de cap alsnog de alfabetische kop.
  // De stap is per categorie, zodat een kleine aanvulcategorie niet door een
  // grote hoofdcategorie wordt weggedrukt; de categorievolgorde (Utrecht
  // eerst) blijft de prioriteit.
  let geweerd = 0;
  const perObject = new Map(); // key -> kandidaten, max CANDIDATES_PER_OBJECT
  for (const obj of STREET_OBJECTS) {
    const kandidaten = [];
    for (const files of volledige.get(obj.key)) {
      const bruikbaar = files.filter((f) => {
        if (eigenaren.get(f) > 1) {
          geweerd += 1;
          return false;
        }
        return !BAD_NAME.test(f) && !excluded.has(f);
      });
      const stride = Math.max(1, Math.ceil(bruikbaar.length / CANDIDATES_PER_OBJECT));
      for (let i = 0; i < bruikbaar.length && kandidaten.length < CANDIDATES_PER_OBJECT; i += stride) {
        kandidaten.push(bruikbaar[i]);
      }
    }
    perObject.set(obj.key, kandidaten);
  }
  if (geweerd) console.log(`  ${geweerd} bestanden geweerd (bij meerdere objecten tegelijk)`);
  return perObject;
}

// --- 2. Licentie en thumb per gekozen bestand -------------------------------

async function fetchImageInfo(fileNames) {
  const info = new Map();
  for (const group of chunk(fileNames, BATCH)) {
    let cont = {};
    for (let guard = 0; guard < 10; guard += 1) {
      const json = await commons({
        action: "query",
        titles: group.map((n) => `File:${n}`).join("|"),
        prop: "imageinfo",
        iiprop: "url|extmetadata|mime|size",
        iiurlwidth: THUMB_WIDTH,
        ...cont,
      });
      for (const page of json.query?.pages ?? []) {
        const ii = page.imageinfo?.[0];
        if (!ii) continue;
        info.set(fileNameOf(page.title), ii);
      }
      if (!json.continue) break;
      cont = json.continue;
    }
  }
  return info;
}

function usable(ii) {
  if (!ii) return false;
  if (!/^image\/(jpeg|png)$/.test(ii.mime ?? "")) return false;
  if ((ii.width ?? 0) < 500) return false;
  const license = ii.extmetadata?.LicenseShortName?.value ?? "";
  if (!license) return false;
  return true;
}

function attribution(ii) {
  const meta = ii.extmetadata ?? {};
  const artist = (meta.Artist?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const license = meta.LicenseShortName?.value ?? "";
  return [artist, license].filter(Boolean).join(", ") || null;
}

// --- 3. Wikipedia-links verifiëren ------------------------------------------

/**
 * Per taal één batch-call: welke kandidaat-titels bestaan echt (redirects
 * volgen we, dan linken we meteen naar het doelartikel). Zo staat er nooit een
 * dode link op een kaart omdat "Plaskrul" toch onder "Urinoir" bleek te staan.
 */
async function verifyWikiLinks(lang, kandidaten) {
  const titels = [...new Set(kandidaten.flat())];
  if (!titels.length) return new Map();
  const bestaat = new Map(); // opgegeven titel -> definitieve titel
  for (const group of chunk(titels, BATCH)) {
    const json = await mwApi(`${lang}.wikipedia.org`, {
      action: "query",
      titles: group.join("|"),
      redirects: 1,
    });
    const redirect = new Map((json.query?.redirects ?? []).map((r) => [r.from, r.to]));
    const norm = new Map((json.query?.normalized ?? []).map((n) => [n.from, n.to]));
    const missing = new Set(
      (json.query?.pages ?? []).filter((p) => p.missing || p.invalid).map((p) => p.title)
    );
    for (const t of group) {
      let doel = norm.get(t) ?? t;
      doel = redirect.get(doel) ?? doel;
      if (!missing.has(doel)) bestaat.set(t, doel);
    }
  }
  return bestaat;
}

const wikiUrl = (lang, titel) =>
  titel ? `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(titel.replace(/ /g, "_"))}` : null;

// --- 4. Samenstellen --------------------------------------------------------

async function main() {
  console.log(`Spotinus straatarcheologie -> ${APP_DIR}\n`);

  // Een tikfout in het pad mag niet stil "geen excludes" betekenen: dan
  // stroomt alle handmatig afgekeurde rommel geruisloos terug in de dataset.
  if (EXCLUDE_FILE && (EXCLUDE_FILE === true || !existsSync(EXCLUDE_FILE))) {
    throw new Error(`--exclude ${EXCLUDE_FILE === true ? "(zonder pad)" : EXCLUDE_FILE} bestaat niet`);
  }
  const excluded = new Set(
    EXCLUDE_FILE
      ? readFileSync(EXCLUDE_FILE, "utf8")
          .split("\n")
          .map((l) => l.replace(/#.*$/, "").trim())
          .filter(Boolean)
      : []
  );
  if (excluded.size) console.log(`  ${excluded.size} foto's uitgesloten via ${EXCLUDE_FILE}\n`);

  const perObject = await fetchObjectCandidates(excluded);

  const alleBestanden = [...new Set([...perObject.values()].flat())];
  console.log(`  ${alleBestanden.length} kandidaat-foto's, licenties ophalen...`);
  const info = await fetchImageInfo(alleBestanden);

  const nlLinks = await verifyWikiLinks("nl", STREET_OBJECTS.map((o) => o.nlWiki ?? []));
  const enLinks = await verifyWikiLinks("en", STREET_OBJECTS.map((o) => o.enWiki ?? []));
  const eersteLink = (bestaat, kandidaten) => {
    for (const t of kandidaten ?? []) if (bestaat.has(t)) return bestaat.get(t);
    return null;
  };

  const objecten = [];
  const photosOut = {};
  // Eén selectie, hier bepaald en ook aan het contactvel gegeven: het vel is
  // de menselijke eindcontrole en moet dus exact tonen wat street.json krijgt.
  const gekozenPer = new Map();
  for (const obj of STREET_OBJECTS) {
    const gekozen = (perObject.get(obj.key) ?? [])
      .filter((f) => usable(info.get(f)))
      .slice(0, PHOTOS_PER_OBJECT);
    gekozenPer.set(obj.key, gekozen);

    const id = `street:${obj.key}`;
    const hoofd = gekozen[0] ?? null;
    const hoofdInfo = hoofd ? info.get(hoofd) : null;
    const groep = STREET_GROUPS[obj.group];

    objecten.push({
      id,
      englishName: obj.en,
      dutchName: obj.nl,
      scientificName: null,
      fact_nl: obj.factNl,
      fact_en: obj.factEn,
      origin_en: null,
      origin_nl: null,
      lengthCm: null,
      popularity: 0,
      imageUrl: hoofdInfo
        ? (hoofdInfo.width ?? 0) > FULL_WIDTH
          ? (hoofdInfo.thumburl ?? hoofdInfo.url).replace(`/${THUMB_WIDTH}px-`, `/${FULL_WIDTH}px-`)
          : hoofdInfo.url
        : null,
      imageThumbUrl: hoofdInfo ? hoofdInfo.thumburl ?? hoofdInfo.url : null,
      wikipediaUrl: wikiUrl("en", eersteLink(enLinks, obj.enWiki)),
      dutchWikipediaUrl: wikiUrl("nl", eersteLink(nlLinks, obj.nlWiki)),
      soundUrl: null,
      period: obj.period,
      features_nl: obj.featuresNl,
      features_en: obj.featuresEn,
      familyNameNl: groep.nl,
      familyNameEn: groep.en,
      tags: { kind: "street", family: obj.group },
    });

    // Zelfde regel als bij honden en stijlen: de hoofdfoto niet dubbel in de
    // extra's, photoVariants() plakt hem er zelf voor.
    const extra = gekozen.slice(1).map((f) => ({
      u: info.get(f).thumburl ?? info.get(f).url,
      a: attribution(info.get(f)),
    }));
    if (extra.length) photosOut[id] = extra;

    const status = gekozen.length < 3 ? "  << TE DUN, vul cats aan" : "";
    console.log(`  ${obj.nl.padEnd(28)} ${String(gekozen.length).padStart(2)} foto's${status}`);
  }

  for (const file of [OUT_STREET, OUT_PHOTOS, OUT_SHEET]) mkdirSync(dirname(file), { recursive: true });
  writeFileSync(OUT_STREET, JSON.stringify(objecten, null, 0));
  writeFileSync(OUT_PHOTOS, JSON.stringify(photosOut, null, 0));
  writeFileSync(OUT_SHEET, contactSheet(gekozenPer, info));

  const totaal = objecten.filter((s) => s.imageThumbUrl).length;
  const zonderNl = objecten.filter((s) => !s.dutchWikipediaUrl).map((s) => s.id);
  console.log(`
${objecten.length} objecten -> ${OUT_STREET} (${totaal} met hoofdfoto)
${Object.values(photosOut).reduce((n, p) => n + p.length, 0)} extra foto's -> ${OUT_PHOTOS}
${calls} API-calls.${zonderNl.length ? `\nGeen nl-artikel gevonden voor: ${zonderNl.join(", ")}` : ""}

NU JIJ: open ${OUT_SHEET}, scroll er één keer doorheen, en zet wat er niet
hoort (verkeerd object, onherkenbaar detail, document) in het exclude-bestand.
Daarna:
  node tools/build-street.mjs ${APP_DIR} --exclude tools/street-photo-excludes.txt`);
}

function contactSheet(gekozenPer, info) {
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const secties = STREET_OBJECTS.map((obj) => {
    const rows = (gekozenPer.get(obj.key) ?? [])
      .map(
        (f) =>
          `<figure><img loading="lazy" src="${esc(info.get(f).thumburl)}" alt="">` +
          `<figcaption>${esc(f)}</figcaption></figure>`
      )
      .join("");
    return `<section><h2>${esc(obj.nl)} <small>${esc(obj.period)}</small></h2><div class="row">${rows || '<p class="none">geen foto\'s</p>'}</div></section>`;
  }).join("\n");
  return `<!doctype html><meta charset="utf-8"><title>Spotinus — straatfoto's nakijken</title>
<style>
  body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:2rem;background:#f5f6f8;color:#1a1d24}
  h1{font-size:1.4rem} p.intro{max-width:44rem;color:#5a6270}
  section{border-top:1px solid #dde1e6;padding:1rem 0}
  h2{font-size:1rem;margin:0 0 .6rem} h2 small{font-weight:400;color:#5a6270}
  .row{display:flex;gap:.75rem;flex-wrap:wrap}
  figure{margin:0;width:210px}
  img{width:210px;height:150px;object-fit:cover;border-radius:4px;background:#e7eaee}
  figcaption{font:11px/1.4 ui-monospace,monospace;color:#5a6270;word-break:break-all;margin-top:.3rem}
  .none{color:#a83f3b;font-size:.85rem;margin:0}
  @media (prefers-color-scheme:dark){body{background:#0f1115;color:#eef0f3}
    section{border-color:#2a2e37} h2 small,figcaption,p.intro{color:#a5acb8} img{background:#1d212a}}
</style>
<h1>Straatfoto's nakijken — ${STREET_OBJECTS.length} objecten</h1>
<p class="intro">Per object de gekozen foto's (Utrechtse categorieën eerst). Wat geen
goede objectfoto is: bestandsnaam in <code>tools/street-photo-excludes.txt</code>,
één per regel, en het script opnieuw draaien.</p>
${secties}`;
}

main().catch((err) => {
  console.error(`\nAfgebroken: ${err.message}`);
  console.error("Er is niets weggeschreven; draai opnieuw.");
  process.exit(1);
});
