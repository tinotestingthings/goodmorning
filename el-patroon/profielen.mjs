// Eigen maatprofielen: opslaan, laden, in- en uitvoeren. Geen DOM, zodat
// check.mjs dit onder Node kan testen met een nep-storage.
//
// Maten staan intern in millimeter (wat FreeSewing wil); de gebruiker typt
// centimeters. shoulderSlope is de uitzondering: graden, geen lengte.
export const SLEUTEL = 'elpatroon.profielen.v1';
export const FORMAAT = 'el-patroon-profielen';

export const naarMm = (cm) => Math.round(Number(cm) * 10);
export const naarCm = (mm) => Math.round(mm) / 10;

export function laadProfielen(storage) {
  try {
    const p = JSON.parse(storage.getItem(SLEUTEL) || '{}');
    return p && typeof p === 'object' && !Array.isArray(p) ? p : {};
  } catch {
    return {};
  }
}

export function bewaarProfiel(storage, profiel, geldigeMaten) {
  const schoon = controleer(profiel, geldigeMaten);
  const alle = laadProfielen(storage);
  const id = schoon.id || `eigen-${slug(schoon.naam)}-${Date.now().toString(36)}`;
  alle[id] = { ...schoon, id, bijgewerkt: new Date().toISOString() };
  storage.setItem(SLEUTEL, JSON.stringify(alle));
  return id;
}

export function verwijderProfiel(storage, id) {
  const alle = laadProfielen(storage);
  delete alle[id];
  storage.setItem(SLEUTEL, JSON.stringify(alle));
}

/** Welke van de gevraagde maten ontbreken in dit profiel. */
export const ontbrekend = (profiel, nodig) => nodig.filter((m) => !Number.isFinite(profiel?.maten?.[m]));

export function exporteer(profielen) {
  return JSON.stringify({ formaat: FORMAAT, versie: 1, eenheid: 'mm', profielen }, null, 1);
}

/**
 * Leest een eerder geëxporteerd bestand. Weigert alles wat niet klopt, in
 * plaats van stil rommel op te slaan: een verkeerd bestand mag je maten niet
 * overschrijven.
 */
export function importeer(tekst, geldigeMaten) {
  let data;
  try { data = JSON.parse(tekst); } catch { throw new Error('Dit is geen JSON-bestand.'); }
  if (data?.formaat !== FORMAAT) throw new Error('Dit is geen el-patroon-profielenbestand.');
  if (!data.profielen || typeof data.profielen !== 'object') throw new Error('Bestand bevat geen profielen.');
  const uit = {};
  for (const [id, p] of Object.entries(data.profielen)) {
    uit[id] = { ...controleer(p, geldigeMaten), id };
  }
  return uit;
}

// Een profiel is een naam plus maten in mm, allemaal eindige positieve
// getallen met een bekende maatnaam. Onbekende sleutels gaan eruit; een
// ongeldige waarde is een fout.
function controleer(profiel, geldigeMaten) {
  const naam = String(profiel?.naam || '').trim();
  if (!naam) throw new Error('Een profiel heeft een naam nodig.');
  const maten = {};
  for (const [k, v] of Object.entries(profiel?.maten || {})) {
    if (geldigeMaten && !geldigeMaten.includes(k)) continue;
    if (v === '' || v === null || v === undefined) continue;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) throw new Error(`Ongeldige waarde voor ${k}: ${v}`);
    maten[k] = n;
  }
  return {
    id: profiel?.id,
    naam,
    maten,
    notitie: String(profiel?.notitie || ''),
    // Met welke voorbeeldset van FreeSewing dit profiel vergeleken wordt.
    referentie: String(profiel?.referentie || ''),
  };
}

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24) || 'profiel';
