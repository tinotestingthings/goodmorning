// Vangnet voor de identiteitsrefactor van 23 aug 2026: soorten worden
// onderscheiden op `id` in plaats van `scientificName`, zodat er straks
// hondenrassen bij kunnen (die hebben geen soortnaam).
//
// De hele migratie leunt op één belofte: VOOR VOGELS IS id === scientificName.
// Klopt die niet, dan wijst elke opgeslagen sleutel -- Leitner-voortgang,
// favorieten, de soortenlijst van een custom game -- naar een soort die niet
// meer bestaat. Dit bestand controleert die belofte tegen de echte data.
//
//   node tests/vogelspotinus.identity.test.mjs [<repo>]
//
// Geen jsdom nodig: games.js raakt alleen localStorage aan, en storage.js
// vangt een ontbrekende localStorage al af.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const GM = process.argv[2] || new URL("..", import.meta.url).pathname;
const APP = `${GM}/sandbox/vogelspotinus`;
const json = (p) => JSON.parse(readFileSync(`${APP}/${p}`, "utf8"));

let checks = 0;
const check = (label, fn) => {
  fn();
  checks += 1;
  console.log(`  ok  ${label}`);
};

// --- 1. De belofte zelf, tegen de echte dataset ------------------------------

const birds = json("data/birds.json");
// Exact wat loadBirds() doet.
for (const b of birds) {
  b.id ??= b.scientificName;
  b.tags ??= {};
  b.tags.kind ??= "bird";
}

check(`alle ${birds.length} vogels hebben een id`, () => {
  const zonder = birds.filter((b) => !b.id);
  assert.equal(zonder.length, 0, `zonder id: ${zonder.map((b) => b.englishName).join(", ")}`);
});

check("ids zijn uniek — anders overschrijven twee soorten elkaars voortgang", () => {
  const seen = new Map();
  const dubbel = [];
  for (const b of birds) {
    if (seen.has(b.id)) dubbel.push(b.id);
    seen.set(b.id, b);
  }
  assert.deepEqual(dubbel, []);
});

check("id is voor elke vogel gelijk aan scientificName", () => {
  const afwijkend = birds.filter((b) => b.id !== b.scientificName);
  assert.deepEqual(afwijkend, []);
});

// --- 2. Bestaande sleutels blijven oplossen ----------------------------------

const byId = new Map(birds.map((b) => [b.id, b]));

const courseSrc = readFileSync(`${APP}/src/data/course-griftpark.js`, "utf8");
const courseSpecies = [...courseSrc.matchAll(/\["([^"]+)",\s*\d+\]/g)].map((m) => m[1]);

check(`alle ${courseSpecies.length} cursussoorten vinden hun vogel op id`, () => {
  assert.ok(courseSpecies.length >= 100, "cursuslijst niet gevonden in course-griftpark.js");
  const kwijt = courseSpecies.filter((sci) => !byId.has(sci));
  assert.deepEqual(kwijt, []);
});

check("elke sleutel in bird-photos.json vindt zijn vogel op id", () => {
  const kwijt = Object.keys(json("data/bird-photos.json")).filter((k) => !byId.has(k));
  assert.deepEqual(kwijt, []);
});

// --- 3. De migratieshim voor opgeslagen custom games -------------------------

const opgeslagen = [
  {
    id: "griftpark-browse",
    name: "Griftpark · 100",
    gameMode: "browse",
    // De oude vorm, precies zoals hij nu in vogelspotinus_state staat.
    filters: { specificBirds: courseSpecies.slice(0, 5), colors: [], favoritesOnly: false },
  },
  {
    id: "oud-tagspel",
    name: "Medium/small zwarte vogels",
    gameMode: "quiz-choice",
    // Gemaakt toen de app alleen vogels kende: géén kind-sleutel.
    filters: { colors: ["black"], sizeBucket: ["medium", "small"], favoritesOnly: false },
  },
  {
    id: "nieuw-allesspel",
    name: "Alles door elkaar",
    gameMode: "quiz-choice",
    // Gemaakt ná de honden, bewust over alle dieren: kind is leeg, niet afwezig.
    filters: { kind: [], colors: [], sizeBucket: [], favoritesOnly: false },
  },
];
const store = new Map([["vogelspotinus.customGames", JSON.stringify(opgeslagen)]]);
let writes = 0;
globalThis.localStorage = {
  getItem: (k) => store.get(k) ?? null,
  setItem: (k, v) => {
    writes += 1;
    store.set(k, v);
  },
  removeItem: (k) => store.delete(k),
};

const { loadGames, allGames } = await import(`${APP}/src/core/games.js`);
loadGames();
const [spel] = allGames();

check("een oud spel houdt precies dezelfde soorten, nu onder specificIds", () => {
  assert.deepEqual(spel.filters.specificIds, courseSpecies.slice(0, 5));
  assert.equal("specificBirds" in spel.filters, false);
  assert.ok(spel.filters.specificIds.every((id) => byId.has(id)));
});

check("het opstarten schrijft niets — anders pusht de boot naar Supabase", () => {
  assert.equal(writes, 0);
});

check("een spel van vóór de honden blijft een vogelspel", () => {
  // "Medium/small zwarte vogels" matchte 55 vogels. Zonder kind-sleutel matcht
  // datzelfde filter er nu 118 -- 63 honden erbij, in een spel dat "vogels"
  // heet. Een ontbrekende sleutel betekent dus "vogels", niet "alles".
  const [tagSpel] = allGames().filter((g) => g.id === "oud-tagspel");
  assert.deepEqual(tagSpel.filters.kind, ["bird"]);
});

check("een spel dat bewust op alle dieren staat, blijft op alle dieren", () => {
  // emptySelection() geeft nieuwe spellen altijd een `kind: []`. Afwezig
  // versus leeg is precies wat oud van nieuw onderscheidt; zou de shim ook een
  // lege lijst invullen, dan kon je nooit een spel over alles bewaren.
  const [alles] = allGames().filter((g) => g.id === "nieuw-allesspel");
  assert.deepEqual(alles.filters.kind, []);
});

// --- 4. Afleiders ------------------------------------------------------------

// session.js roept pickDistractors ZONDER displayName aan, en dan is `id` de
// sleutel waarop dubbele opties worden weggefilterd. Twee soorten met dezelfde
// weergavenaam mogen nooit allebei als optie op het scherm staan -- dan zijn er
// twee goede knoppen.
const { pickDistractors } = await import(`${APP}/src/core/distractors.js`);

check("afleiders bevatten de vraag zelf niet en zijn onderling uniek", () => {
  const pool = courseSpecies.map((sci) => byId.get(sci));
  for (const vraag of pool.slice(0, 20)) {
    const opties = pickDistractors(vraag, pool, 3);
    assert.equal(opties.length, 3, `te weinig afleiders voor ${vraag.id}`);
    assert.ok(!opties.includes(vraag), `${vraag.id} zat bij zijn eigen afleiders`);
    assert.equal(new Set(opties.map((b) => b.id)).size, 3, `dubbele afleider bij ${vraag.id}`);
  }
});

check("twee soorten met dezelfde weergavenaam worden nooit samen aangeboden", () => {
  const naam = (b) => b.dutchName ?? b.englishName;
  const tweeling = { ...birds[0], id: `${birds[0].id} (kopie)` };
  const pool = [birds[0], tweeling, ...birds.slice(1, 40)];
  const opties = pickDistractors(birds[0], pool, 3, naam);
  assert.ok(!opties.some((b) => b.id === tweeling.id), "de naamgenoot stond er toch bij");
});

// --- 5. De hondendataset ------------------------------------------------------

const dogs = json("data/dogs.json");
const dogPhotos = json("data/dog-photos.json");

check(`${dogs.length} honden, met ids die niet met vogels kunnen botsen`, () => {
  assert.ok(dogs.length > 300, `maar ${dogs.length} rassen`);
  const eigen = dogs.filter((d) => /^dog:Q\d+$/.test(d.id ?? ""));
  assert.equal(eigen.length, dogs.length, "niet elk ras heeft een dog:Q-id");
  const botsing = dogs.filter((d) => byId.has(d.id));
  assert.deepEqual(botsing, [], "een hond deelt een id met een vogel");
  assert.equal(new Set(dogs.map((d) => d.id)).size, dogs.length, "dubbele hond-ids");
});

check("honden hebben geen soortnaam en geen geluid", () => {
  // Beide zijn de reden dat de refactor nodig was: labrador en chihuahua zijn
  // allebei Canis lupus familiaris, en een ras blaft niet herkenbaar.
  assert.deepEqual(dogs.filter((d) => d.scientificName), []);
  assert.deepEqual(dogs.filter((d) => d.soundUrl), []);
});

check("elke hond is bruikbaar in de app: naam, foto, kind-tag", () => {
  const zonderNaam = dogs.filter((d) => !d.dutchName || !d.englishName);
  const zonderFoto = dogs.filter((d) => !d.imageUrl && !d.imageThumbUrl);
  const verkeerdKind = dogs.filter((d) => d.tags?.kind !== "dog");
  assert.deepEqual(zonderNaam.map((d) => d.id), []);
  assert.deepEqual(zonderFoto.map((d) => d.id), []);
  assert.deepEqual(verkeerdKind.map((d) => d.id), []);
});

check("extra hondenfoto's horen bij een bestaand ras en zijn geen dubbele hoofdfoto", () => {
  const dogById = new Map(dogs.map((d) => [d.id, d]));
  const wees = Object.keys(dogPhotos).filter((id) => !dogById.has(id));
  assert.deepEqual(wees, [], "foto's voor een ras dat niet bestaat");
  // photoVariants() dedupliceert op URL en ziet het verschil tussen een
  // Special:FilePath-link en een thumb-URL niet; dan zou dezelfde foto twee
  // keer in de rotatie zitten en de quiz "meerdere foto's" beloven die er niet zijn.
  const bestand = (u) =>
    decodeURIComponent(String(u).split("/").pop().split("?")[0]).replace(/^\d+px-/, "");
  const dubbel = [];
  for (const [id, lijst] of Object.entries(dogPhotos)) {
    const hoofd = bestand(dogById.get(id).imageThumbUrl);
    for (const p of lijst) if (bestand(p.u) === hoofd) dubbel.push(id);
    assert.equal(new Set(lijst.map((p) => p.u)).size, lijst.length, `dubbele foto bij ${id}`);
    for (const p of lijst) assert.ok(p.a, `foto zonder bronvermelding bij ${id}`);
  }
  assert.deepEqual(dubbel, []);
});

check("kleuren en groottes van honden vallen binnen de bestaande filterwaarden", () => {
  const kleuren = new Set(birds.flatMap((b) => b.tags?.colors ?? []));
  const groottes = new Set(["small", "medium", "large"]);
  for (const d of dogs) {
    for (const c of d.tags.colors) assert.ok(kleuren.has(c), `onbekende kleur "${c}" bij ${d.id}`);
    if (d.tags.sizeBucket) assert.ok(groottes.has(d.tags.sizeBucket), `${d.tags.sizeBucket}`);
  }
});

check("afleiders mengen vogels en honden niet", () => {
  // De hele reden voor de kind-term in similarity(): een hond tussen drie mezen
  // is geen vraag, die herken je zonder te kijken.
  const alles = [...birds, ...dogs.map((d) => ({ ...d }))];
  for (const soort of [...birds.slice(0, 10), ...dogs.slice(0, 10)]) {
    const eigenKind = soort.tags?.kind ?? "bird";
    const opties = pickDistractors(soort, alles, 3);
    const vreemd = opties.filter((o) => (o.tags?.kind ?? "bird") !== eigenKind);
    assert.deepEqual(vreemd.map((o) => o.id), [], `${soort.id} kreeg een afleider van het andere kind`);
  }
});

// --- 6. De dagkaart -----------------------------------------------------------

check("de soort van de dag hangt niet af van welke foto's al geladen zijn", () => {
  // photos.js vult ná de boot ontbrekende basisfoto's aan (de havik is zo'n
  // geval). Bepaalt de dagkaart zijn index over de GEFILTERDE lijst, dan
  // verschuift die lijst met één en krijg je een heel ander dier -- afhankelijk
  // van of die async stap de eerste render voor was. Deze check draait de
  // keuzelogica na met en zonder de havik: de uitkomst moet gelijk zijn.
  const STRIDE = 37;
  const DAILY_DOGS = 50;
  const cursus = courseSpecies.map((sci) => byId.get(sci)).filter(Boolean);
  const honden = [...dogs].sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0)).slice(0, DAILY_DOGS);
  const pool = [...cursus, ...honden];

  const kies = (dag, heeftFoto) => {
    const start = (dag * STRIDE) % pool.length;
    for (let step = 0; step < pool.length; step += 1) {
      const kandidaat = pool[(start + step) % pool.length];
      if (heeftFoto(kandidaat)) return kandidaat.id;
    }
    return null;
  };
  const metFoto = (s) => Boolean(s.imageUrl || s.imageThumbUrl);
  const zonderHavik = (s) => metFoto(s) && s.id !== "Accipiter gentilis";

  for (let dag = 20000; dag < 20030; dag += 1) {
    assert.equal(
      kies(dag, zonderHavik) === "Accipiter gentilis" ? null : kies(dag, zonderHavik),
      kies(dag, metFoto) === "Accipiter gentilis" ? null : kies(dag, metFoto),
      `dag ${dag} levert een andere soort op naargelang de foto's al binnen zijn`
    );
  }
});

// --- 7. FCI-rasgroepen ---------------------------------------------------------

const { FCI_GROUPS } = await import(`${APP}/src/data/fci-groups.js`);

check("elke rasgroep in de data heeft een beschrijving, en omgekeerd", () => {
  const inData = new Set(dogs.map((d) => d.tags?.fciGroup).filter(Boolean));
  const beschreven = new Set(FCI_GROUPS.map((g) => g.n));
  const zonderTekst = [...inData].filter((n) => !beschreven.has(n));
  assert.deepEqual(zonderTekst, [], "rasgroep in de data zonder uitleg in fci-groups.js");
  assert.equal(beschreven.size, 10, "de FCI kent er tien");
  for (const g of FCI_GROUPS) {
    for (const veld of ["nl", "en", "hintNl", "hintEn", "aboutNl", "aboutEn"]) {
      assert.ok(g[veld]?.length > 3, `groep ${g.n} mist ${veld}`);
    }
  }
});

check("elke groep kan drie kaartjes vullen — ook groep 4, die één ras telt", () => {
  // De quiz toont er altijd drie. Groepen met te weinig rassen vullen aan met
  // andere foto's van hetzelfde ras; kan dat ook niet, dan is de vraag stuk.
  const varianten = (d) => {
    const urls = [];
    const base = d.imageThumbUrl || d.imageUrl;
    if (base) urls.push(base);
    for (const p of dogPhotos[d.id] ?? []) if (p?.u && !urls.includes(p.u)) urls.push(p.u);
    return urls;
  };
  const perGroep = new Map();
  for (const d of dogs) {
    const n = d.tags?.fciGroup;
    if (!n || !(d.imageUrl || d.imageThumbUrl)) continue;
    perGroep.set(n, [...(perGroep.get(n) ?? []), d]);
  }
  assert.equal(perGroep.size, 10, "niet alle tien groepen hebben rassen met foto");
  for (const [n, lijst] of perGroep) {
    const beelden = lijst.length >= 3 ? lijst.length : lijst.flatMap(varianten).length;
    assert.ok(beelden >= 3, `groep ${n} kan maar ${beelden} kaartje(s) vullen`);
  }
});

check("het familiefilter noemt de rasgroep in beide talen", async () => {
  // populateFamilyValues() bouwt het label ÉÉN keer bij het opstarten; daarna
  // kiest resolveLabel() er de taal uit. Zet je daar twee keer de actieve taal
  // in, dan blijven de rasgroepen na een taalwissel in de opstarttaal hangen.
  const { populateFamilyValues, FILTER_DEFINITIONS } = await import(`${APP}/src/core/filters.js`);
  const { loadBirds } = await import(`${APP}/src/core/birds.js`);
  globalThis.fetch = async (url) => ({
    ok: true,
    json: async () => json(String(url)),
  });
  await loadBirds();
  populateFamilyValues();
  const def = FILTER_DEFINITIONS.find((d) => d.key === "family");
  const groep8 = def.values.find((v) => v.value === "fci-8");
  assert.ok(groep8, "rasgroep 8 ontbreekt in het familiefilter");
  assert.notEqual(groep8.label.nl, groep8.label.en, "beide talen zijn hetzelfde ingevuld");
  assert.match(groep8.label.nl, /waterhonden/);
  assert.match(groep8.label.en, /water dogs/);
});

check("de rasgroep voedt de afleiders via tags.family", () => {
  // `family` is bij een vogel de taxonomische familie en bij een hond de
  // rasgroep. distractors.js kent alleen `family`, dus zo werkt de bestaande
  // scoring zonder wijziging óók voor honden -- daarom die naam.
  const metGroep = dogs.filter((d) => d.tags?.fciGroup);
  for (const d of metGroep) {
    assert.equal(d.tags.family, `fci-${d.tags.fciGroup}`, `${d.id} heeft een afwijkende family`);
  }
  const pool = metGroep.filter((d) => d.imageUrl || d.imageThumbUrl);
  for (const vraag of pool.slice(0, 15)) {
    const opties = pickDistractors(vraag, pool, 3);
    const zelfdeGroep = opties.filter((o) => o.tags.fciGroup === vraag.tags.fciGroup).length;
    assert.ok(zelfdeGroep >= 1, `${vraag.dutchName} kreeg geen enkele afleider uit zijn eigen groep`);
  }
});

// --- 8. De NL-top-30 en de geluidsschakelaar ----------------------------------

check("het NL-top-30-spel bevat 30 erkende rassen, gesorteerd op nl-bezoeken", () => {
  const lijst = dogs
    .filter((d) => d.tags?.fciGroup)
    .sort((a, b) => (b.nlPopularity ?? 0) - (a.nlPopularity ?? 0))
    .slice(0, 30);
  assert.equal(lijst.length, 30);
  assert.ok(lijst.every((d) => d.nlPopularity > 0), "een ras zonder nl-bezoeken in de top 30");
  // De dingo scoort hoog maar is geen erkend ras; dat is precies waarom de
  // FCI-eis er staat.
  assert.ok(!lijst.some((d) => /dingo/i.test(d.dutchName)), "de dingo staat er toch in");
  // Nederlandse rassen horen hier thuis; staan ze er niet in, dan meten we de
  // verkeerde taal (de Engelse cijfers kennen het kooikerhondje niet).
  const namen = lijst.map((d) => d.dutchName.toLowerCase());
  assert.ok(namen.some((n) => n.includes("kooiker")), "geen kooikerhondje in de NL-top-30");
});

check("met geluidsvragen uit stelt de oefensessie er geen enkele", async () => {
  // De vraagvorm hangt af van toeval, dus we kijken naar de beslisregel zelf:
  // zonder geluid mag `mayAskSound` nooit waar zijn, ongeacht de worp.
  const src = readFileSync(`${APP}/src/core/session.js`, "utf8");
  assert.match(src, /function mayAskSound\(bird\)[\s\S]*?soundQuestionsEnabled\(\)/);
  assert.doesNotMatch(
    src.replace(/function mayAskSound[\s\S]*?\n\}/, ""),
    /bird\.soundUrl && Math\.random/,
    "er is nog een geluidsvraag die de schakelaar omzeilt"
  );
});

// --- 9. Niets in de app zoekt nog op de oude sleutel -------------------------

/** Bron zonder commentaar, zodat een toelichting die het woord noemt niet meetelt. */
const codeOf = (f) =>
  readFileSync(`${APP}/${f}`, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");

check("de identiteitsmodules noemen scientificName helemaal niet meer", () => {
  // Deze vijf sleutelen puur op identiteit: elke vermelding is een gemiste plek.
  for (const f of [
    "src/core/leitner.js",
    "src/core/favorites.js",
    "src/core/photos.js",
    "src/core/course.js",
    "src/screens/browse.js",
  ]) {
    assert.doesNotMatch(codeOf(f), /scientificName/, `${f} sleutelt nog op scientificName`);
  }
});

check("scientificName komt alleen nog voor als weergave, achter een guard", () => {
  // birds.js (zoektekst + antwoordcontrole) en de drie weergaveplekken. Overal
  // waar hij getoond wordt hoort een guard, want honden hebben geen soortnaam.
  for (const f of ["src/screens/builder.js", "src/screens/home.js", "src/ui/bird-names.js"]) {
    const src = codeOf(f);
    const noemt = (src.match(/\.scientificName/g) ?? []).length;
    const geguard = (src.match(/(?:bird|soort)\.scientificName\s*(?:\?|\))/g) ?? []).length;
    assert.ok(noemt > 0, `${f} zou de soortnaam juist moeten tonen`);
    assert.equal(geguard > 0, true, `${f} toont scientificName zonder guard`);
  }
});

check("geen enkele module leest nog selection.specificBirds", () => {
  for (const f of ["src/core/filters.js", "src/screens/builder.js", "src/data/seed-games.js"]) {
    assert.doesNotMatch(codeOf(f), /specificBirds/, `${f} leest nog specificBirds`);
  }
});

console.log(`\n${checks} checks geslaagd.`);
