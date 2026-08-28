// Bouwt het architectuur-kind voor Spotinus: `arch.json` + `arch-photos.json`,
// in exact hetzelfde formaat als birds/dogs, zodat de app er niets nieuws voor
// hoeft te kennen. De inhoud (24 stromingen, teksten, kenmerken) leeft in
// tools/arch-styles.mjs — dit script haalt er alleen de gebouwenfoto's bij.
//
//   node tools/build-arch.mjs sandbox/vogelspotinus
//   node tools/build-arch.mjs sandbox/vogelspotinus --exclude tools/arch-photo-excludes.txt
//
// Foto's per stroming, uit twee bronnen:
//   1. Wikidata P149 (bouwstijl): Nederlandse gebouwen met foto, gerankt op
//      sitelinks — hoe meer taalversies, hoe bekender het gebouw, hoe groter
//      de kans dat je het herkent én dat de stijltoewijzing klopt.
//   2. `buildings` in arch-styles.mjs: losse gebouw-Q-ids voor stromingen die
//      P149 amper dekt (De Stijl is drie gebouwen, Superdutch bestaat niet als
//      Wikidata-stijl).
//
// Zelfde spelregels als build-dogs.mjs: elke run haalt alles opnieuw op en
// overschrijft, ≥1,3 s tussen calls, en het contactvel
// (tools/arch-photo-check.html) is de menselijke eindcontrole — wat daar niet
// deugt gaat in het exclude-bestand en de run draait opnieuw.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { ARCH_STYLES } from "./arch-styles.mjs";

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1]?.startsWith("--") ? true : args[i + 1]) : null;
};
const APP_DIR = args.find((a) => !a.startsWith("--") && !args[args.indexOf(a) - 1]?.startsWith("--"))
  || "sandbox/vogelspotinus";
const EXCLUDE_FILE = flag("exclude");

const OUT_ARCH = `${APP_DIR}/data/arch.json`;
const OUT_PHOTOS = `${APP_DIR}/data/arch-photos.json`;
const OUT_SHEET = "tools/arch-photo-check.html";

const UA = "goodmorning-spotinus/1.0 (personal learning PWA; dubbolbiutifu@gmail.com)";
const PAUSE_MS = 1300;
const BATCH = 50;
const PHOTOS_PER_STYLE = 8; // stijlen zijn breder dan rassen: meer variatie nodig
const CANDIDATES_PER_STYLE = 14; // ruim boven 8, zodat het licentie-/naamfilter kan snoeien
const THUMB_WIDTH = 960;
const FULL_WIDTH = 1600;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chunk = (arr, n) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));
let calls = 0;

/**
 * De query-service telt rekentijd per client per minuut en gooit 429 als je te
 * snel achter elkaar vraagt -- ook bij lichte queries. Respecteer Retry-After
 * en probeer een paar keer opnieuw; pas daarna is het echt een fout.
 */
async function sparql(query) {
  for (let poging = 0; ; poging += 1) {
    const url = new URL("https://query.wikidata.org/sparql");
    url.searchParams.set("query", query);
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/sparql-results+json" } });
    calls += 1;
    if ((res.status === 429 || res.status >= 500) && poging < 5) {
      const wacht = Number(res.headers.get("retry-after")) || 15;
      process.stdout.write(`\r  (${res.status}: ${wacht}s wachten)   `);
      await sleep(wacht * 1000);
      continue;
    }
    await sleep(PAUSE_MS * 2);
    if (!res.ok) throw new Error(`Wikidata SPARQL gaf ${res.status}`);
    return (await res.json()).results.bindings;
  }
}

async function commons(params) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  for (const [k, v] of Object.entries({ format: "json", formatversion: "2", ...params })) {
    url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  const text = await res.text();
  calls += 1;
  await sleep(PAUSE_MS);
  const json = JSON.parse(text);
  if (json.error) throw new Error(`commons: ${json.error.info}`);
  return json;
}

/** Bestandsnaam uit een Commons-URL of File:-titel, genormaliseerd. */
const fileNameOf = (s) =>
  decodeURIComponent(String(s).replace(/^File:/, "").split("/").pop().split("?")[0]).replace(/_/g, " ");

/** Beelden die geen gevelfoto zijn: plattegronden, interieurs, kaarten, wapens. */
const BAD_NAME =
  /plattegrond|floor ?plan|grondplan|interieur|interior|orgel|organ|altaar|altar|preekstoel|kansel|glas[- ]in[- ]lood|stained|raam\b|window|kaart|map\b|diagram|logo|wapen|coat[ _]of[ _]arms|bouwtekening|drawing|tekening|maquette|model|detail\b|deur\b|door\b|portaal|luchtfoto|luchtopname|aerial|gedenkzuil|stormvloedkering|zendmast/i;

// --- 1. Kandidaat-gebouwen verzamelen ---------------------------------------

/**
 * Per stroming de Nederlandse gebouwen met foto via P149, gerankt op
 * sitelinks. Eén query PER STROMING met ORDER BY + LIMIT: de bulk-variant over
 * alle stijlen tegelijk sleepte 1,9 MB aan eclecticisme-gebouwen mee en werd
 * door de query-service halverwege afgekapt. Kleine queries zijn saai en
 * betrouwbaar; de ranking doet de server.
 */
async function fetchStyleBuildings() {
  const perKey = new Map();
  for (const style of ARCH_STYLES) {
    if (!style.qids.length) {
      perKey.set(style.key, []);
      continue;
    }
    const rows = await sparql(`
      SELECT ?g ?gLabel ?img ?links WHERE {
        VALUES ?stijl { ${style.qids.map((q) => "wd:" + q).join(" ")} }
        ?g wdt:P149 ?stijl ; wdt:P17 wd:Q55 ; wdt:P18 ?img ; wikibase:sitelinks ?links .
        SERVICE wikibase:label { bd:serviceParam wikibase:language "nl,en". }
      } ORDER BY DESC(?links) LIMIT ${CANDIDATES_PER_STYLE * 2}`);
    const seen = new Map();
    for (const row of rows) {
      const gid = row.g.value.split("/").pop();
      if (!seen.has(gid)) {
        seen.set(gid, {
          gid,
          naam: row.gLabel?.value ?? gid,
          img: row.img.value,
          links: Number(row.links?.value ?? 0),
        });
      }
    }
    perKey.set(style.key, [...seen.values()]);
    process.stdout.write(`\r  gebouwen: ${style.nl.padEnd(26)} ${seen.size}   `);
  }
  process.stdout.write("\n");
  return perKey;
}

/** De handmatig aangewezen gebouwen: label + foto + sitelinks per Q-id. */
async function fetchManualBuildings() {
  const gids = [...new Set(ARCH_STYLES.flatMap((s) => s.buildings))];
  if (!gids.length) return new Map();
  const rows = await sparql(`
    SELECT ?g ?gLabel ?img ?links WHERE {
      VALUES ?g { ${gids.map((q) => "wd:" + q).join(" ")} }
      ?g wdt:P18 ?img ; wikibase:sitelinks ?links .
      SERVICE wikibase:label { bd:serviceParam wikibase:language "nl,en". }
    }`);
  const byGid = new Map();
  for (const row of rows) {
    const gid = row.g.value.split("/").pop();
    if (!byGid.has(gid)) {
      byGid.set(gid, {
        gid,
        naam: row.gLabel?.value ?? gid,
        img: row.img.value,
        links: Number(row.links?.value ?? 0),
      });
    }
  }
  return byGid;
}

/** Wikipedia-artikelen (nl + en) van de stijl zelf, voor "Meer informatie". */
async function fetchStyleArticles() {
  const qids = ARCH_STYLES.map((s) => s.qids[0]).filter(Boolean);
  const rows = await sparql(`
    SELECT ?stijl ?nlwiki ?enwiki WHERE {
      VALUES ?stijl { ${qids.map((q) => "wd:" + q).join(" ")} }
      OPTIONAL { ?nlwiki schema:about ?stijl ; schema:isPartOf <https://nl.wikipedia.org/> }
      OPTIONAL { ?enwiki schema:about ?stijl ; schema:isPartOf <https://en.wikipedia.org/> }
    }`);
  const byQid = new Map();
  for (const row of rows) {
    const qid = row.stijl.value.split("/").pop();
    const cur = byQid.get(qid) ?? {};
    cur.nl ??= row.nlwiki?.value;
    cur.en ??= row.enwiki?.value;
    byQid.set(qid, cur);
  }
  return byQid;
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

function attribution(ii, gebouwNaam) {
  const meta = ii.extmetadata ?? {};
  const artist = (meta.Artist?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  const license = meta.LicenseShortName?.value ?? "";
  return [gebouwNaam, [artist, license].filter(Boolean).join(", ")].filter(Boolean).join(" — ");
}

// --- 3. Samenstellen --------------------------------------------------------

async function main() {
  console.log(`Spotinus architectuur -> ${APP_DIR}\n`);

  const excluded = new Set(
    EXCLUDE_FILE && existsSync(EXCLUDE_FILE)
      ? readFileSync(EXCLUDE_FILE, "utf8")
          .split("\n")
          .map((l) => l.replace(/#.*$/, "").trim())
          .filter(Boolean)
      : []
  );
  if (excluded.size) console.log(`  ${excluded.size} foto's uitgesloten via ${EXCLUDE_FILE}\n`);

  const [perStijlQid, manual, articles] = [
    await fetchStyleBuildings(),
    await fetchManualBuildings(),
    await fetchStyleArticles(),
  ];

  // Een gebouw dat bij MEERDERE stromingen opduikt is als quizfoto onbruikbaar:
  // welke stijl is dan het goede antwoord? Wikidata geeft zulke gebouwen
  // gewoon twee P149-waarden (het Binnenhof telt er drie), en omdat juist de
  // beroemde gebouwen dat hebben, ranken ze overal bovenaan -- de eerste run
  // had het Binnenhof als hoofdfoto van gotiek ÉN Hollandse renaissance.
  // Regel: via `buildings` handmatig toegewezen wint (die curatie is de bron);
  // alles wat daarna nog bij twee stromingen hoort, vervalt overal.
  const claimedBy = new Map();
  for (const style of ARCH_STYLES) for (const gid of style.buildings) claimedBy.set(gid, style.key);
  const seenIn = new Map();
  for (const [key, lijst] of perStijlQid) {
    for (const b of lijst) {
      if (!seenIn.has(b.gid)) seenIn.set(b.gid, new Set());
      seenIn.get(b.gid).add(key);
    }
  }
  let geweerd = 0;
  for (const [key, lijst] of perStijlQid) {
    perStijlQid.set(
      key,
      lijst.filter((b) => {
        const claim = claimedBy.get(b.gid);
        if (claim) return claim === key; // curatie wint, ook over P149 elders
        if ((seenIn.get(b.gid)?.size ?? 0) > 1) {
          geweerd += 1;
          return false;
        }
        return true;
      })
    );
  }
  if (geweerd) console.log(`  ${geweerd} gebouwen geweerd (meerdere stijlen tegelijk)`);

  // Kandidaten per stroming: handmatige gebouwen eerst (die zijn gekozen),
  // daarna P149-gebouwen op bekendheid. Dedup op gebouw én op bestandsnaam.
  const perStyle = new Map();
  for (const style of ARCH_STYLES) {
    const seenGid = new Set();
    const seenFile = new Set();
    const kandidaten = [];
    const push = (b) => {
      const file = fileNameOf(b.img);
      if (seenGid.has(b.gid) || seenFile.has(file)) return;
      if (BAD_NAME.test(file) || excluded.has(file)) return;
      seenGid.add(b.gid);
      seenFile.add(file);
      kandidaten.push({ ...b, file });
    };
    for (const gid of style.buildings) {
      const b = manual.get(gid);
      if (b) push(b);
      else console.log(`  LET OP: ${style.nl} — gebouw ${gid} heeft geen foto op Wikidata`);
    }
    const viaP149 = [...(perStijlQid.get(style.key) ?? [])].sort((a, b) => b.links - a.links);
    for (const b of viaP149) {
      if (kandidaten.length >= CANDIDATES_PER_STYLE) break;
      push(b);
    }
    perStyle.set(style.key, kandidaten);
  }

  const alleBestanden = [...new Set([...perStyle.values()].flat().map((k) => k.file))];
  console.log(`  ${alleBestanden.length} kandidaat-foto's, licenties ophalen...`);
  const info = await fetchImageInfo(alleBestanden);

  const styles = [];
  const photosOut = {};
  // Chronologisch, wat de volgorde in de module ook is: de datasetvolgorde is
  // de tijdlijn die Bladeren toont, dus die moet uit de jaartallen komen en
  // niet uit hoe het bronbestand toevallig geordend staat.
  const chronologisch = [...ARCH_STYLES].sort((a, b) => a.startYear - b.startYear);
  for (const style of chronologisch) {
    const gekozen = (perStyle.get(style.key) ?? [])
      .filter((k) => usable(info.get(k.file)))
      .slice(0, PHOTOS_PER_STYLE);

    const id = `arch:${style.key}`;
    const hoofd = gekozen[0] ?? null;
    const hoofdInfo = hoofd ? info.get(hoofd.file) : null;
    const artikel = articles.get(style.qids[0]) ?? {};

    styles.push({
      id,
      englishName: style.en,
      dutchName: style.nl,
      scientificName: null,
      fact_nl: style.factNl,
      fact_en: style.factEn,
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
      wikipediaUrl: artikel.en ?? null,
      dutchWikipediaUrl: artikel.nl ?? null,
      soundUrl: null,
      period: style.period,
      startYear: style.startYear,
      architects: style.architects,
      features_nl: style.featuresNl,
      features_en: style.featuresEn,
      tags: { kind: "architecture", era: style.era },
    });

    // Alle gekozen foto's (inclusief de hoofdfoto? Nee — zelfde regel als bij
    // de honden: de hoofdfoto niet dubbel, photoVariants() plakt hem er zelf
    // voor) met gebouwnaam in de bronvermelding, zodat je op de dagkaart ziet
    // wélk gebouw je bekijkt.
    const extra = gekozen.slice(1).map((k) => ({
      u: info.get(k.file).thumburl ?? info.get(k.file).url,
      a: attribution(info.get(k.file), k.naam),
    }));
    if (extra.length) photosOut[id] = extra;

    const status = gekozen.length < 3 ? "  << TE DUN, vul buildings aan" : "";
    console.log(`  ${style.nl.padEnd(24)} ${String(gekozen.length).padStart(2)} foto's${status}`);
  }

  for (const file of [OUT_ARCH, OUT_PHOTOS, OUT_SHEET]) mkdirSync(dirname(file), { recursive: true });
  writeFileSync(OUT_ARCH, JSON.stringify(styles, null, 0));
  writeFileSync(OUT_PHOTOS, JSON.stringify(photosOut, null, 0));
  writeFileSync(OUT_SHEET, contactSheet(perStyle, info));

  const totaal = styles.filter((s) => s.imageThumbUrl).length;
  console.log(`
${styles.length} stromingen -> ${OUT_ARCH} (${totaal} met hoofdfoto)
${Object.values(photosOut).reduce((n, p) => n + p.length, 0)} extra foto's -> ${OUT_PHOTOS}
${calls} API-calls.

NU JIJ: open ${OUT_SHEET}, scroll er één keer doorheen, en zet wat er niet
hoort (interieur, verkeerd gebouw, steiger voor de gevel) in een
exclude-bestand. Daarna:
  node tools/build-arch.mjs ${APP_DIR} --exclude tools/arch-photo-excludes.txt`);
}

function contactSheet(perStyle, info) {
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const secties = ARCH_STYLES.map((style) => {
    const rows = (perStyle.get(style.key) ?? [])
      .filter((k) => usable(info.get(k.file)))
      .slice(0, PHOTOS_PER_STYLE)
      .map(
        (k) =>
          `<figure><img loading="lazy" src="${esc(info.get(k.file).thumburl)}" alt="">` +
          `<figcaption><b>${esc(k.naam)}</b><br>${esc(k.file)}</figcaption></figure>`
      )
      .join("");
    return `<section><h2>${esc(style.nl)} <small>${esc(style.period)}</small></h2><div class="row">${rows || '<p class="none">geen foto\'s</p>'}</div></section>`;
  }).join("\n");
  return `<!doctype html><meta charset="utf-8"><title>Spotinus — stijlfoto's nakijken</title>
<style>
  body{font:15px/1.5 system-ui,sans-serif;margin:0;padding:2rem;background:#f5f6f8;color:#1a1d24}
  h1{font-size:1.4rem} p.intro{max-width:44rem;color:#5a6270}
  section{border-top:1px solid #dde1e6;padding:1rem 0}
  h2{font-size:1rem;margin:0 0 .6rem} h2 small{font-weight:400;color:#5a6270}
  .row{display:flex;gap:.75rem;flex-wrap:wrap}
  figure{margin:0;width:210px}
  img{width:210px;height:150px;object-fit:cover;border-radius:4px;background:#e7eaee}
  figcaption{font:11px/1.4 ui-monospace,monospace;color:#5a6270;word-break:break-all;margin-top:.3rem}
  b{color:#1a1d24}
  .none{color:#a83f3b;font-size:.85rem;margin:0}
  @media (prefers-color-scheme:dark){body{background:#0f1115;color:#eef0f3}
    section{border-color:#2a2e37} h2 small,figcaption,p.intro{color:#a5acb8} img{background:#1d212a} b{color:#eef0f3}}
</style>
<h1>Stijlfoto's nakijken — ${ARCH_STYLES.length} stromingen</h1>
<p class="intro">Per stroming de gekozen gebouwen, bekendste eerst. Wat geen goede
stijlfoto is: bestandsnaam in <code>tools/arch-photo-excludes.txt</code>, één per
regel, en het script opnieuw draaien.</p>
${secties}`;
}

main().catch((err) => {
  console.error(`\nAfgebroken: ${err.message}`);
  console.error("Er is niets weggeschreven; draai opnieuw.");
  process.exit(1);
});
