// De rekenkern. Geen DOM, geen server, geen eigen patroonwiskunde:
// alles wat FreeSewing zelf kan, doet FreeSewing.
//
// Draait in de browser (designs komen van esm.sh) en onder Node (uit
// node_modules). Eén versienummer voor allebei.
export const FS_VERSION = '4.10.1';

// FreeSewing's eigen tegel-plugin. Lokaal omdat hun exports-map het pad
// blokkeert; zie tools/vendor.mjs.
import { tilerPlugin, sizes as PAPIERMATEN } from './vendor/plugin-tiler.mjs';
import { valideer } from './validator.mjs';

export { PAPIERMATEN };

const inBrowser = typeof document !== 'undefined';

// De enige plek waar een FreeSewing-pakket binnenkomt. In de browser lazy per
// pakket -- je haalt niet 74 designs op om er één te tekenen.
export const laadPakket = (naam) => inBrowser
  ? import(`https://esm.sh/@freesewing/${naam}@${FS_VERSION}`)
  : import(`@freesewing/${naam}`);

const cache = new Map();
// Een mislukte import (netwerk weg, esm.sh eruit) mag niet blijven plakken:
// zonder de catch is dat design de rest van de sessie stuk.
const eenmalig = (naam, fn) => {
  if (!cache.has(naam)) {
    cache.set(naam, Promise.resolve().then(fn).catch((e) => { cache.delete(naam); throw e; }));
  }
  return cache.get(naam);
};

// Eigen designs staan naast de app in app/designs/ in plaats van op npm; zie
// docs/eigen-designs.md. Het zijn gewone FreeSewing-modules -- alleen de
// vindplaats verschilt.
export const EIGEN_PREFIX = 'eigen/';

/** Het design zelf: `huey` -> de Huey-klasse, `eigen/kraagtrui` -> die module. */
export async function laadDesign(id) {
  return eenmalig(`design:${id}`, async () => {
    let mod;
    if (id.startsWith(EIGEN_PREFIX)) {
      const bestand = id.slice(EIGEN_PREFIX.length);
      // De naam komt uit de catalogus, maar hij eindigt in een pad: geen map
      // uit, geen ander bestandstype in.
      if (!/^[a-z0-9-]+$/.test(bestand)) throw new Error(`Ongeldige designnaam '${id}'.`);
      mod = await import(`./designs/${bestand}.mjs`);
    } else {
      mod = await laadPakket(id);
    }
    const naam = id.charAt(0).toUpperCase() + id.slice(1);
    const Design = mod[naam] ?? mod.default ?? Object.values(mod).find((v) => typeof v === 'function');
    if (!Design) throw new Error(`'${id}' bevat geen FreeSewing-design.`);
    return Design;
  });
}

const laadTheme = () => eenmalig('theme', () => laadPakket('plugin-theme'));

/** De maatsets van FreeSewing zelf (38 maten elk, in mm). */
const GROEP_NL = { Adult: '', Doll: 'pop ', Giant: 'reus ' };

export async function laadMaatsets() {
  return eenmalig('models', async () => {
    const m = await laadPakket('models');
    const sets = {};
    for (const [naam, waarde] of Object.entries(m)) {
      // Alleen de sets met een maat erin; cisMaleAdult zonder cijfer is de
      // groep-aggregatie, geen maatset.
      const [, geslacht, groep, maat] = naam.match(/^cis(Female|Male)(Adult|Doll|Giant)(\d+)$/) || [];
      if (!maat || !waarde || typeof waarde !== 'object') continue;
      sets[naam] = {
        label: `${geslacht === 'Male' ? 'Man' : 'Vrouw'} ${GROEP_NL[groep]}${maat}`,
        maten: waarde,
      };
    }
    return sets;
  });
}

/**
 * FreeSewing's eigen donkere palet (plugin-theme exporteert `darkColors`),
 * met een vangnet: hun interfacing-kleur bevat een typefout ('##d97706a3a3a3')
 * en zou anders als ongeldige CSS wegvallen.
 */
export async function donkereKleuren() {
  const { colors, darkColors } = await laadTheme();
  const geldig = (k) => /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(k);
  const uit = {};
  for (const [naam, kleur] of Object.entries(darkColors || {})) {
    uit[naam] = geldig(kleur) ? kleur : geldig(colors?.[naam]) ? colors[naam] : '#ccc';
  }
  return uit;
}

// -- opties ---------------------------------------------------------------
// Een design beschrijft zijn eigen opties. Een optie die geen object is, is
// een constante uit het ontwerp -- geen knop voor de gebruiker.
// De standaardwaarde zoals FreeSewing die intern hanteert (pct als fractie),
// want daarmee rekenen hun menu-functies hieronder.
const standaardWaarde = (o) => (typeof o === 'number' ? o
  : o.bool !== undefined ? o.bool
  : o.list !== undefined ? (o.dflt ?? o.list[0])
  : o.pct !== undefined ? o.pct / 100
  : o.mm ?? o.deg ?? o.count);

/**
 * De instelbare opties van een design.
 *
 * Een derde van alle opties heeft geen vaste `menu` maar een functie:
 * FreeSewing bepaalt daarmee zelf waar een optie hoort en of hij überhaupt
 * zichtbaar is (`huey.draftForHighBust` alleen als je een highBust-maat hebt,
 * `armholeDepth` alleen als de legacy-methode uit staat). Die functie krijgt
 * hier dezelfde twee argumenten als in hun eigen editor.
 *
 * `waarden` zijn de al ingestelde opties in FreeSewing's eigen eenheden (een
 * percentage dus als fractie). Ze horen erbij: 316 van de 332 menu-functies in
 * de collectie kijken naar een ándere optie ("deze mouwopties alleen bij
 * construction: set-in"). Zonder die waarden zou zo'n optie onbereikbaar zijn.
 */
export function optieVelden(Design, maten = {}, waarden = null) {
  const opties = Design.patternConfig?.options || {};
  const standaard = Object.fromEntries(
    Object.entries(opties).map(([naam, o]) => [naam, standaardWaarde(o)]));
  if (waarden) Object.assign(standaard, waarden);
  const instellingen = { measurements: maten };
  const velden = [];
  for (const [naam, o] of Object.entries(opties)) {
    if (!o || typeof o !== 'object') continue;
    const menu = typeof o.menu === 'function' ? o.menu(instellingen, standaard) : o.menu;
    // `false` = FreeSewing toont deze optie zelf ook niet.
    if (menu === false) continue;
    // Hun menu's zijn paden ('advanced.sleevecap', 'style.collar'); het eerste
    // stuk is de groep die de gebruiker herkent.
    const groep = typeof menu === 'string' ? menu.split('.')[0] : 'overig';
    if (o.bool !== undefined) velden.push({ naam, groep, soort: 'bool', standaard: o.bool });
    else if (o.list !== undefined) velden.push({ naam, groep, soort: 'lijst', keuzes: o.list, standaard: o.dflt ?? o.list[0] });
    else if (o.pct !== undefined) velden.push({ naam, groep, soort: 'pct', standaard: o.pct, min: o.min ?? 0, max: o.max ?? 100 });
    else if (o.mm !== undefined) velden.push({ naam, groep, soort: 'mm', standaard: o.mm, min: o.min ?? 0, max: o.max ?? 1000 });
    else if (o.deg !== undefined) velden.push({ naam, groep, soort: 'graden', standaard: o.deg, min: o.min ?? -90, max: o.max ?? 90 });
    else if (o.count !== undefined) velden.push({ naam, groep, soort: 'aantal', standaard: o.count, min: o.min ?? 0, max: o.max ?? 20 });
  }
  return velden;
}

/** Percentage-opties gaan als fractie naar FreeSewing (15% -> 0.15). */
export function optiesNaarFreeSewing(velden, waarden) {
  const uit = {};
  for (const v of velden) {
    const w = waarden[v.naam];
    if (w === undefined || w === '') continue;
    uit[v.naam] = v.soort === 'pct' ? Number(w) / 100
      : v.soort === 'bool' ? Boolean(w)
      : v.soort === 'lijst' ? w
      : Number(w);
  }
  return uit;
}

// -- materiaallijst -------------------------------------------------------
// FreeSewing houdt zelf bij wat je van welk materiaal knipt, op de vouw of op
// de schuine draad. Niets hier is een eigen berekening.
export function materiaallijst(pattern) {
  const store = pattern.setStores[0];
  const cutlist = store?.get('cutlist') || {};
  const titels = store?.get('partTitles') || {};
  const delen = pattern.parts[0] || {};
  const namen = deelNamen(Object.keys(delen), titels);
  const perMateriaal = {};
  for (const [deel, info] of Object.entries(cutlist)) {
    if (!info || typeof info !== 'object' || !info.materials) continue;
    // Alleen delen die daadwerkelijk getekend worden. Designs bouwen op
    // basisblokken (brian.back onder huey.back); die staan óók in de cutlist
    // maar zijn verborgen -- meenemen zou elk deel dubbel laten knippen, en
    // met de verkeerde aantallen.
    if (!delen[deel] || delen[deel].hidden) continue;
    const naam = namen.get(deel);
    for (const [materiaal, sneden] of Object.entries(info.materials)) {
      const rijen = (perMateriaal[materiaal] ||= []);
      for (const snede of sneden) {
        // Hun addCut plakt instructies achter elkaar in plaats van ze te
        // vervangen, dus meerdere regels voor hetzelfde deel tellen op.
        // Alleen regels met dezelfde eigenschappen mogen samen; "2 op de
        // vouw" en "2 los" blijven aparte regels.
        const opDeVouw = !!snede.onFold;
        const opSchuineDraad = !!snede.onBias;
        // Vergelijken op deel-id, niet op de naam: twee verschillende delen
        // met dezelfde titel zijn twee verschillende stukken stof.
        const bestaand = rijen.find((r) =>
          r.id === deel && r.opDeVouw === opDeVouw && r.opSchuineDraad === opSchuineDraad);
        if (bestaand) bestaand.aantal += snede.cut;
        else rijen.push({ id: deel, deel: naam, aantal: snede.cut, opDeVouw, opSchuineDraad });
      }
    }
  }
  return perMateriaal;
}

// FreeSewing prefixt deelnamen met het design ('huey.front',
// 'aaron:neckBinding'); dat zegt de naaier niets.
export const deelNaam = (id, titels = {}) => (titels[id] || id).replace(/^[^.:]*[.:]/, '');

// Hun titels zijn niet altijd uniek: trayvon noemt liningTail én liningTip
// allebei 'liningTip'. Twee regels met dezelfde naam zijn onbruikbaar -- je
// weet niet welk stuk je knipt -- dus dan valt de naam terug op de deel-id.
export function deelNamen(ids, titels = {}) {
  const namen = new Map(ids.map((id) => [id, deelNaam(id, titels)]));
  const telling = {};
  for (const naam of namen.values()) telling[naam] = (telling[naam] || 0) + 1;
  for (const [id, naam] of namen) {
    if (telling[naam] > 1) namen.set(id, id.replace(/^[^.:]*[.:]/, ''));
  }
  return namen;
}

// FreeSewing gooit GEEN exception bij een kapot onderdeel: draft() "slaagt" en
// de fout zit in store.logs.error. De validator leest dat logboek.
export function leesFouten(pattern) {
  return (pattern.setStores || [])
    .flatMap((s) => s?.logs?.error || [])
    .map((e) => (typeof e === 'string' ? e : e?.msg || JSON.stringify(e)));
}

// -- tekenen --------------------------------------------------------------
// Papiermarge: FreeSewing's tiler trekt dit van het vel af, want een printer
// kan niet tot de rand.
export const PRINTMARGE_MM = 10;

export async function teken({
  design,
  maten,
  opties = {},
  sa = 10,
  paperless = false,
  units = 'metric',
  scale = 1,
  margin,
  complete = true,
  papier = null, // 'a4' | 'a1' | 'a0' | ... | null (niet tegelen)
  only = null,   // lijst deelnamen ('huey.front', ...) of null = alles
} = {}) {
  const Design = await laadDesign(design);
  const { themePlugin } = await laadTheme();

  const ontbreekt = (Design.patternConfig?.measurements || []).filter((m) => !(m in maten));
  if (ontbreekt.length) throw new Error(`Maten ontbreken: ${ontbreekt.join(', ')}`);
  if (only && !only.length) throw new Error('Kies minstens één patroondeel.');

  const pattern = new Design({
    measurements: maten,
    options: opties,
    sa, paperless, units, scale, complete,
    ...(margin !== undefined ? { margin } : {}),
    ...(only ? { only: [...only] } : {}),
  });
  // plugin-theme = FreeSewing's eigen SVG-styling. Zonder deze plugin rendert
  // elk deel als een zwart vlak.
  pattern.use(themePlugin);
  if (papier) {
    if (!PAPIERMATEN[papier]) throw new Error(`Onbekend papierformaat '${papier}'.`);
    // Zelfde instellingen als FreeSewing's eigen PDF-export: dunne
    // pagina-omtrekken in plaats van gevulde vlakken, plus montagemarkeringen
    // en een liniaal van 10 cm per vel om de printerschaal te controleren.
    pattern.use(tilerPlugin({
      size: papier,
      orientation: 'portrait',
      margin: PRINTMARGE_MM,
      printStyle: true,
      renderBlanks: false,
      setPatternSize: true,
    }));
  }
  pattern.draft();

  // Het oordeel komt van de validator; ook een kapot patroon wordt getoond,
  // maar dan als GEBLOKKEERD. Niets gooien: de gebruiker moet zien wát er mis is.
  const validatie = await valideer({ pattern, Design, maten, laadPakket });

  let svg;
  try {
    svg = pattern.render();
  } catch (e) {
    throw new Error(`FreeSewing kon niet renderen: ${e.message}`);
  }

  const delen = pattern.parts[0] || {};
  const titels = pattern.setStores[0]?.get('partTitles') || {};
  return {
    // De XML-declaratie eraf: die hoort niet in innerHTML.
    svg: svg.replace(/^<\?xml[^>]*\?>/, ''),
    delen: (() => {
      const namen = deelNamen(Object.keys(delen), titels);
      return Object.keys(delen)
        .filter((k) => !delen[k].hidden && k !== 'pages')
        .map((id) => ({ id, naam: namen.get(id) }));
    })(),
    materiaal: materiaallijst(pattern),
    paginas: papier ? paginaraster(pattern, papier) : null,
    validatie,
  };
}

// De tiler tekent het raster op het patroon en legt in de store vast hoeveel
// pagina's er zijn en welke inhoud hebben. Het raster begint op de oorsprong
// van de SVG, dus één pagina = één viewBox -- geen eigen rekenwerk.
function paginaraster(pattern, papier) {
  const data = pattern.setStores[0]?.get('pages');
  if (!data) return null;
  const [vel_b, vel_h] = PAPIERMATEN[papier];
  const breedte = vel_b - PRINTMARGE_MM * 2;
  const hoogte = vel_h - PRINTMARGE_MM * 2;
  const vellen = [];
  for (let rij = 0; rij < data.rows; rij++) {
    for (let kol = 0; kol < data.cols; kol++) {
      if (!data.withContent?.[rij]?.[kol]) continue; // lege pagina's niet printen
      vellen.push({
        label: `${kolomLetter(kol + 1)}${rij + 1}`, // zelfde nummering als FreeSewing
        viewBox: `${kol * breedte} ${rij * hoogte} ${breedte} ${hoogte}`,
      });
    }
  }
  return { papier, kolommen: data.cols, rijen: data.rows, breedte, hoogte, vellen };
}

// A, B, ... Z, AA, AB, ... -- zoals indexStr in hun tiler.
function kolomLetter(i) {
  let uit = '';
  while (i > 0) {
    const rest = (i - 1) % 26;
    uit = String.fromCharCode(65 + rest) + uit;
    i = Math.floor((i - 1) / 26);
  }
  return uit;
}
