// De validator: het enige stuk dat FreeSewing bewust níét doet -- het
// resultaat nameten en een oordeel geven vóór je gaat knippen.
//
// Drie standen, geen verzonnen foutpercentage:
//   KLAAR       alle harde controles slagen
//   CONTROLEER  niets kapot, wel iets om zelf na te kijken
//   GEBLOKKEERD technische fout; dit patroon is niet bruikbaar
//
// Wat hier gebeurt, gebeurt op FreeSewing's eigen geometrie (hun Path-ops en
// hun snijpunt-utils) en hun eigen maatschatter. Alleen de drempels en het
// oordeel zijn van ons.
import { neckstimate, measurements as SCHATBAAR } from './vendor/neckstimate.mjs';

const EPS_MM = 0.05; // een snijpunt op een gedeeld eindpunt is geen snijding

// Boven deze afmeting is een patroondeel vrijwel zeker het gevolg van
// verkeerde invoer. Ruim genomen: FreeSewing's grootste reuzenmaatset blijft
// er ver onder.
const MAX_DEEL_MM = 3000;

// Meldingen uit FreeSewing's logboek die intern geruis zijn, geen oordeel
// over het patroon: delen die store-waarden van andere delen lezen vóór die
// gezet zijn, en macro's die op (0,0) terugvallen.
const RUIS = [/^Store\.get\(key\)/, /^Title macro called without/, /^Part \*\*.*relies on these values/];

export async function valideer({ pattern, Design, maten, laadPakket }) {
  const meldingen = [];
  const store = pattern.setStores?.[0];

  // 1. FreeSewing's eigen logboek. draft() gooit geen exception bij een kapot
  //    onderdeel; de fout staat hier. Dit niet lezen = een half patroon als
  //    "klaar" tonen.
  for (const e of store?.logs?.error || []) {
    meldingen.push({ ernst: 'fout', code: 'FREESEWING_FOUT', tekst: tekstVan(e) });
  }
  for (const w of store?.logs?.warn || []) {
    const tekst = tekstVan(w);
    if (RUIS.some((r) => r.test(tekst))) continue;
    // Wat overblijft zijn controles van de ontwerper zelf, zoals "front
    // outseam is longer than back by 7.35 mm".
    meldingen.push({ ernst: 'let-op', code: 'FREESEWING_WAARSCHUWING', tekst });
  }

  // 2. Vlaggen van de ontwerper (store.flag.warn/error/note). Rechtstreeks
  //    uit het store-object, niet via store.get(): die logt een waarschuwing
  //    als de sleutel ontbreekt en vervuilt dan stap 1.
  //    Een 'error'-vlag blokkeert niet: ontwerpers gebruiken hem voor "het
  //    armsgat is niet optimaal, let op" -- ook bij standaardmaten (Toni,
  //    Tina). Het patroon is dan wel te knippen, maar je moet het weten.
  const vlaggen = store?.plugins?.['plugin-annotations']?.flags || {};
  const ERNST = { error: 'let-op', warn: 'let-op', fixme: 'let-op', note: 'info', info: 'info' };
  const items = Object.entries(vlaggen).flatMap(([type, perId]) =>
    ERNST[type] ? Object.values(perId).map((v) => ({ type, ...v })) : []);
  if (items.length) {
    const i18n = await laadPakket('i18n').catch(() => null);
    for (const v of items) {
      meldingen.push({
        ernst: ERNST[v.type],
        code: 'ONTWERPER_' + v.type.toUpperCase(),
        tekst: [vertaal(i18n, v.title, v.replace), vertaal(i18n, v.desc, v.replace)].filter(Boolean).join(' — '),
      });
    }
  }

  // 3. Maten plausibel? Zie maatMeldingen hieronder.
  meldingen.push(...await maatMeldingen(maten, Design, laadPakket));

  // 4. Geometrie: het getekende resultaat zelf, onafhankelijk van de formules.
  const core = await laadPakket('core');
  const delen = pattern.parts?.[0] || {};
  for (const [naam, deel] of Object.entries(delen)) {
    if (deel.hidden || naam === 'pages') continue;
    const label = naam.replace(/^[^.:]*[.:]/, '');
    for (const [padNaam, pad] of Object.entries(deel.paths || {})) {
      if (pad.hidden) continue;
      const klasse = String(pad.attributes?.get?.('class') || '');
      if (/\bhidden\b/.test(klasse)) continue;

      if (pad.ops.some((op) => [op.to, op.cp1, op.cp2].some((p) => p && !(Number.isFinite(p.x) && Number.isFinite(p.y))))) {
        meldingen.push({ ernst: 'fout', code: 'GEOMETRIE_NAN', deel: label,
          tekst: `${label}: pad '${padNaam}' bevat een ongeldige coördinaat (NaN).` });
        continue;
      }

      const isKniplijn = /\bsa\b/.test(klasse);
      const isStoflijn = /\b(fabric|lining|interfacing|canvas)\b/.test(klasse) && !/\b(dashed|dotted|help|note|mark)\b/.test(klasse);
      const gesloten = pad.ops.at(-1)?.type === 'close';
      if (!(isKniplijn || (isStoflijn && gesloten))) continue;

      // Een kniplijn is een offset van de naadlijn. FreeSewing laat op elke
      // binnenhoek de twee verschoven segmenten gewoon kruisen (het
      // "visgraatje" dat elke patroonmaker kent en wegknipt). Dat zit in 49
      // van de 74 designs en is geen fout; alleen een kruising tussen
      // segmenten vér uit elkaar betekent dat de kniplijn echt over een
      // ander deel van de contour valt. Bij een naadlijn is élke kruising
      // een fout.
      const snijpunt = zelfsnijding(pad, core, { negeerBuren: isKniplijn ? 3 : 1 });
      if (!snijpunt) continue;
      const waar = `bij (${snijpunt.x.toFixed(0)}, ${snijpunt.y.toFixed(0)}) mm`;
      if (isKniplijn) {
        meldingen.push({ ernst: 'let-op', code: 'KNIPLIJN_SNIJDT_ZICHZELF', deel: label,
          tekst: `${label}: de kniplijn loopt over zichzelf heen ${waar}. Controleer dit deel visueel of verklein de naadtoeslag.` });
      } else {
        meldingen.push({ ernst: 'fout', code: 'NAADLIJN_SNIJDT_ZICHZELF', deel: label,
          tekst: `${label}: de naadlijn '${padNaam}' snijdt zichzelf ${waar}.` });
      }
    }

    // Ontaard deel: praktisch geen oppervlak.
    const b = deel.bottomRight, t = deel.topLeft;
    if (b && t && (b.x - t.x < 1 || b.y - t.y < 1)) {
      meldingen.push({ ernst: 'fout', code: 'DEEL_ONTAARD', deel: label,
        tekst: `${label}: het deel heeft geen oppervlak (${(b.x - t.x).toFixed(1)} × ${(b.y - t.y).toFixed(1)} mm).` });
    } else if (b && t && (b.x - t.x > MAX_DEEL_MM || b.y - t.y > MAX_DEEL_MM)) {
      // Bovengrens, niet alleen een ondergrens: een deel van meters kost
      // honderden printvellen en komt vrijwel altijd uit verkeerde invoer.
      meldingen.push({ ernst: 'let-op', code: 'DEEL_ONGEBRUIKELIJK_GROOT', deel: label,
        tekst: `${label} is ${Math.round((b.x - t.x) / 10)} × ${Math.round((b.y - t.y) / 10)} cm — ongebruikelijk groot. Controleer de invoer voordat je print.` });
    }
  }

  const status = meldingen.some((m) => m.ernst === 'fout') ? 'GEBLOKKEERD'
    : meldingen.some((m) => m.ernst === 'let-op') ? 'CONTROLEER'
    : 'KLAAR';
  return { status, meldingen };
}

// -- maten toetsen --------------------------------------------------------
//
// FreeSewing's eigen schatter (neckstimate) zegt wat elke maat is bij een
// gegeven nekomvang, en die relatie is lineair. Dus je kunt hem omkeren: uit
// elke opgegeven maat volgt een "impliciete nekomvang". Bij een kloppende set
// liggen die dicht bij elkaar en is de mediaan de maat van het lichaam; één
// waarde die er ver naast ligt is de verdachte.
//
// Waarom niet gewoon neckstimate(maten.neck, ...): dan toets je alles tegen
// één maat die zelf nooit getoetst wordt. Een typefout in de nekomvang gaf
// dan acht valse meldingen over maten die wél klopten, en de echte fout bleef
// buiten schot. Bovendien vragen 39 van de 74 designs helemaal geen
// nekomvang, en die kregen zo geen enkele controle.
const GRADEN_MAAT = 'shoulderSlope'; // graden; schaalt niet mee met de hals

// Twee peilingen leggen de lijn van neckstimate exact vast.
function nekLijn(maat, lichaam) {
  const v1 = neckstimate(300, maat, lichaam, true);
  const v2 = neckstimate(400, maat, lichaam, true);
  if (!Number.isFinite(v1) || !Number.isFinite(v2) || v1 === v2) return null;
  const a = (v2 - v1) / 100;
  return { a, b: v1 - a * 300 };
}
const voorspel = (lijn, nek) => lijn.a * nek + lijn.b;
const impliciteNek = (lijn, waarde) => (waarde - lijn.b) / lijn.a;

function mediaan(getallen) {
  const s = [...getallen].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// Het bereik van nekomvangen dat FreeSewing zelf kent (pop tot reus). Buiten
// dat bereik is de hele set verdacht -- een gemiste komma of millimeters in
// een centimeterveld. Uit hun data, niet uit een eigen tabel.
let nekBereik = null;
async function laadNekBereik(laadPakket) {
  if (nekBereik) return nekBereik;
  try {
    const models = await laadPakket('models');
    const nekken = Object.entries(models)
      .filter(([naam, set]) => /^cis(Female|Male)(Adult|Doll|Giant)\d+$/.test(naam) && Number.isFinite(set?.neck))
      .map(([, set]) => set.neck);
    nekBereik = nekken.length ? { min: Math.min(...nekken) * 0.8, max: Math.max(...nekken) * 1.2 } : { min: 0, max: Infinity };
  } catch {
    nekBereik = { min: 0, max: Infinity }; // geen models = geen oordeel
  }
  return nekBereik;
}

export async function maatMeldingen(maten, Design, laadPakket) {
  const gevraagd = [
    ...(Design?.patternConfig?.measurements || []),
    ...(Design?.patternConfig?.optionalMeasurements || []),
  ];
  const bruikbaar = gevraagd.filter((m) =>
    SCHATBAAR.includes(m) && m !== GRADEN_MAAT && Number.isFinite(maten?.[m]));
  // Onder de drie maten is er geen consensus om een uitschieter tegen af te
  // zetten; dan liever niets zeggen dan iets verzinnen.
  if (bruikbaar.length < 3) return [];

  // FreeSewing heeft twee referentielichamen; het lichaam dat het beste bij
  // deze set past, telt.
  const kandidaten = [0, 1].map((lichaam) => {
    const lijnen = new Map();
    for (const m of bruikbaar) {
      const lijn = nekLijn(m, lichaam);
      if (lijn) lijnen.set(m, lijn);
    }
    const nek = mediaan([...lijnen].map(([m, lijn]) => impliciteNek(lijn, maten[m])));
    const afwijkingen = [...lijnen].map(([m, lijn]) => {
      const verwacht = voorspel(lijn, nek);
      return { maat: m, verwacht, rel: verwacht ? Math.abs(maten[m] - verwacht) / Math.abs(verwacht) : 0 };
    });
    return { nek, afwijkingen, totaal: afwijkingen.reduce((s, a) => s + a.rel, 0) };
  }).filter((k) => Number.isFinite(k.nek));
  if (!kandidaten.length) return [];
  const beste = kandidaten.reduce((a, b) => (a.totaal <= b.totaal ? a : b));

  const meldingen = [];
  const { min, max } = await laadNekBereik(laadPakket);
  if (beste.nek < min || beste.nek > max) {
    meldingen.push({ ernst: 'let-op', code: 'MAATSET_BUITEN_BEREIK',
      tekst: `Deze maten passen bij een hals van ${(beste.nek / 10).toFixed(0)} cm — buiten alles wat FreeSewing kent (${(min / 10).toFixed(0)}–${(max / 10).toFixed(0)} cm). Staan ze in centimeters?` });
  }

  // ponytail: eigen drempels (25% / 60%), niet van FreeSewing. Bijstellen
  // zodra echte maatsets laten zien waar de grens ligt.
  for (const { maat, verwacht, rel } of beste.afwijkingen) {
    const cm = (maten[maat] / 10).toFixed(1);
    const verwachtCm = (verwacht / 10).toFixed(1);
    if (rel > 0.6) {
      meldingen.push({ ernst: 'let-op', code: 'MAAT_CONTROLEER', maat,
        tekst: `${maat} (${cm} cm) wijkt ${Math.round(rel * 100)}% af van wat bij je andere maten past (${verwachtCm} cm) — typefout of verkeerde eenheid?` });
    } else if (rel > 0.25) {
      meldingen.push({ ernst: 'info', code: 'MAAT_ONGEBRUIKELIJK', maat,
        tekst: `${maat} (${cm} cm) is ongebruikelijk naast je andere maten (verwacht ~${verwachtCm} cm). Kan kloppen; even nameten.` });
    }
  }
  return meldingen;
}

// -- hulpfuncties ---------------------------------------------------------

const tekstVan = (e) => (typeof e === 'string' ? e : e?.msg || e?.message || JSON.stringify(e));

// Sleutels als 'huey:zipperLength.t' of 'flag:expandIsOn.t' -> tekst uit
// @freesewing/i18n (Engels; Nederlandse vertalingen hebben ze niet).
// Plaatshouders zijn mustache-stijl: "{{ length }}".
function vertaal(i18n, sleutel, vervang) {
  if (!sleutel) return '';
  let tekst = sleutel;
  const [ns, rest] = sleutel.split(':');
  if (i18n && rest) {
    if (ns === 'flag') tekst = i18n.flags?.[rest] || sleutel;
    else {
      const s = i18n.designs?.[ns]?.s;
      const [id, veld] = rest.split('.');
      tekst = s?.[id]?.[veld] || s?.[rest] || sleutel;
    }
  }
  return tekst.replace(/\{\{?\s*(\w+)\s*\}?\}/g, (_, k) => vervang?.[k] ?? `{${k}}`);
}

// Een FreeSewing-pad als lijst segmenten (lijn of kubische curve), zonder
// lege segmenten. 'close' wordt een lijn terug naar het beginpunt.
export function segmenten(pad) {
  const uit = [];
  let start = null, huidig = null;
  for (const op of pad.ops) {
    if (op.type === 'move') { start = op.to; huidig = op.to; continue; }
    const tot = op.type === 'close' ? start : op.to;
    if (!huidig || !tot) continue;
    if (op.type === 'curve') uit.push({ soort: 'curve', van: huidig, cp1: op.cp1, cp2: op.cp2, tot });
    else if (afstand(huidig, tot) > EPS_MM) uit.push({ soort: 'lijn', van: huidig, tot });
    huidig = tot;
  }
  return uit;
}

/**
 * Eerste echte zelfsnijding van een pad, of null.
 * negeerBuren: kruisingen tussen segmenten die (rond de contour gerekend)
 * hooguit zo ver uit elkaar liggen tellen niet mee. 1 = alleen directe buren
 * (die delen per definitie een punt); 3 = ook het visgraatje op binnenhoeken
 * van een offset.
 */
export function zelfsnijding(pad, { linesIntersect, lineIntersectsCurve, curvesIntersect }, { negeerBuren = 1 } = {}) {
  const segs = segmenten(pad);
  const n = segs.length;
  const gesloten = pad.ops.at(-1)?.type === 'close';
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const afst = gesloten ? Math.min(j - i, n - (j - i)) : j - i;
      if (afst <= negeerBuren) continue;
      const A = segs[i], B = segs[j];
      let r;
      if (A.soort === 'lijn' && B.soort === 'lijn') r = linesIntersect(A.van, A.tot, B.van, B.tot);
      else if (A.soort === 'lijn') r = lineIntersectsCurve(A.van, A.tot, B.van, B.cp1, B.cp2, B.tot);
      else if (B.soort === 'lijn') r = lineIntersectsCurve(B.van, B.tot, A.van, A.cp1, A.cp2, A.tot);
      else r = curvesIntersect(A.van, A.cp1, A.cp2, A.tot, B.van, B.cp1, B.cp2, B.tot);
      const punten = Array.isArray(r) ? r : r ? [r] : [];
      for (const p of punten) {
        // Segmenten die een eindpunt delen (pad dat precies terugkomt op
        // zijn begin) snijden elkaar niet -- ze raken.
        if (opEindpunt(p, A) || opEindpunt(p, B)) continue;
        return p;
      }
    }
  }
  return null;
}

const afstand = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const opEindpunt = (p, s) => afstand(p, s.van) < EPS_MM || afstand(p, s.tot) < EPS_MM;
