// Alleen DOM-werk. Patroonlogica: patroon.mjs. Beoordeling: validator.mjs.
// Eigen maten: profielen.mjs. Meetinstructies: maten.json (FreeSewing) +
// maten-nl.mjs (vertaling).
import {
  FS_VERSION, PAPIERMATEN, PRINTMARGE_MM,
  laadDesign, laadMaatsets, optieVelden, optiesNaarFreeSewing, teken, donkereKleuren,
} from './patroon.mjs';
import {
  laadProfielen, bewaarProfiel, verwijderProfiel, ontbrekend, exporteer, importeer, naarMm, naarCm,
} from './profielen.mjs';
import { MATEN_NL, BEGRIPPEN_NL } from './maten-nl.mjs';

const $ = (id) => document.getElementById(id);

function maak(tag, props = {}, kinderen = []) {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of kinderen) n.append(k);
  return n;
}

let catalogus = null;
let matenInfo = null;    // app/maten.json: FreeSewing's meetinstructies
let gekozen = null;      // design-id
let velden = [];         // optievelden van het gekozen design
let huidigDesign = null; // de designklasse zelf, om opties opnieuw te bepalen
let optieWaarden = {};   // wat de gebruiker heeft ingesteld, in UI-eenheden
let maatsets = {};       // FreeSewing's voorbeeldmaten
let profielen = {};      // eigen maten (localStorage)
let laatste = null;      // resultaat van de laatste generatie
let alleDelen = [];      // [{id, naam}] van het gekozen design, volledig getekend
const weggelaten = new Set(); // deel-id's die de gebruiker niet wil
let model = 'tim';       // wiens foto bij de meetinstructies: 'tim' | 'sarah'

const ALLE_MATEN = () => Object.keys(matenInfo.maten);
const labelNl = (m) => MATEN_NL[m]?.titel || matenInfo.maten[m]?.titel || m;

// -- designkiezer ---------------------------------------------------------
function zichtbareDesigns() {
  const zoek = $('zoek').value.trim().toLowerCase();
  const tag = $('tag').value;
  const techniek = $('techniek').value;
  const alleenTekening = $('alleentekening').checked;
  return Object.entries(catalogus.designs)
    .filter(([id, d]) =>
      (!zoek || id.includes(zoek) || d.naam.toLowerCase().includes(zoek) || d.omschrijving.toLowerCase().includes(zoek)) &&
      (!tag || d.tags.includes(tag)) &&
      (!techniek || d.technieken.includes(techniek)) &&
      (!alleenTekening || d.tekening))
    .sort((a, b) => a[1].naam.localeCompare(b[1].naam));
}

// De tekeningen komen van FreeSewing zelf (zie tools/linedrawings.mjs). Ze
// tekenen met stroke="currentColor", maar in een <img> is dat altijd zwart;
// de CSS draait ze om in donkere modus.
function tekeningNode(id, d, klasse) {
  if (!d.tekening) return maak('div', { className: `${klasse} geen`, title: 'geen tekening beschikbaar' });
  return maak('img', {
    className: klasse, src: `./linedrawings/${id}.svg`, alt: `Lijntekening van ${d.naam}`,
    loading: klasse === 'duim' ? 'lazy' : 'eager',
    decoding: 'async',
  });
}

function tekenLijst() {
  const lijst = $('lijst');
  lijst.replaceChildren();
  const rijen = zichtbareDesigns();
  if (!rijen.length) {
    lijst.append(maak('li', {}, [maak('div', { className: 'meta', style: 'padding:.6rem', textContent: 'Niets gevonden.' })]));
    return;
  }
  for (const [id, d] of rijen) {
    const knop = maak('button', { type: 'button' }, [
      tekeningNode(id, d, 'duim'),
      maak('div', { className: 'tekst' }, [
        maak('div', { className: 'naam', textContent: d.naam }),
        maak('div', {
          className: 'meta',
          textContent: `${'●'.repeat(d.moeilijkheid || 1)}${'○'.repeat(Math.max(0, 5 - (d.moeilijkheid || 1)))} · ${d.tags.join(', ') || 'geen categorie'} · ${d.opties} opties`,
        }),
      ]),
    ]);
    knop.setAttribute('aria-current', String(id === gekozen));
    knop.addEventListener('click', () => kiesDesign(id));
    lijst.append(maak('li', {}, [knop]));
  }
}

// -- gekozen design -------------------------------------------------------
async function kiesDesign(id) {
  gekozen = id;
  weggelaten.clear();
  alleDelen = [];
  wisResultaat({ status: 'Klik op “Genereer patroon”.' });
  tekenLijst();
  const d = catalogus.designs[id];
  $('gekozenTekening').replaceChildren(tekeningNode(id, d, 'groot'));
  $('gekozenNaam').textContent = d.naam;
  $('gekozenOmschrijving').textContent = d.omschrijving;
  // FreeSewing's eigen documentatie: stofbehoefte, naaiinstructies, opties.
  const links = $('gekozenLinks');
  links.replaceChildren();
  if (d.docs?.pagina) links.append(maak('a', { href: d.docs.pagina, target: '_blank', rel: 'noopener', textContent: 'Over dit design' }));
  if (d.docs?.instructies) links.append(maak('a', { href: d.docs.instructies, target: '_blank', rel: 'noopener', textContent: 'Naaiinstructies' }));
  toonMatenUitleg();
  $('opties').replaceChildren(maak('p', { className: 'meta', textContent: 'Design laden…' }));
  $('delen').replaceChildren();
  // Het laden gaat over het netwerk; klik je snel door de lijst, dan mag een
  // eerder gestarte load de opties van het nu gekozen design niet overschrijven.
  const mijn = ++designKeuze;
  let Design;
  try {
    Design = await laadDesign(id);
  } catch (e) {
    if (mijn !== designKeuze) return;
    $('opties').replaceChildren(maak('p', { className: 'meta', textContent: `Laden mislukt: ${e.message}` }));
    return;
  }
  if (mijn !== designKeuze) return;
  huidigDesign = Design;
  optieWaarden = {};
  velden = optieVelden(Design, huidigeMaten());
  tekenOpties();
}
let designKeuze = 0;

function toonMatenUitleg() {
  const d = catalogus.designs[gekozen];
  const doel = $('matenuitleg');
  doel.replaceChildren();
  doel.append(document.createTextNode(`${d.naam} gebruikt ${d.maten.length} maten: `));
  d.maten.forEach((m, i) => {
    if (i) doel.append(document.createTextNode(', '));
    doel.append(maak('span', { textContent: labelNl(m), title: m }));
  });
  doel.append(document.createTextNode('.'));
  const tekort = ontbrekendeMaten();
  if (tekort.length) {
    doel.append(document.createTextNode(' '));
    doel.append(maak('strong', { className: 'waarschuwing', textContent: `Nog niet ingevuld: ${tekort.map(labelNl).join(', ')}.` }));
  }
}

function tekenOpties() {
  const doel = $('opties');
  doel.replaceChildren();
  if (!velden.length) {
    doel.append(maak('p', { className: 'meta', textContent: 'Dit design heeft geen instelbare opties.' }));
    return;
  }
  const groepen = {};
  for (const v of velden) (groepen[v.groep] ||= []).push(v);
  for (const groep of Object.keys(groepen).sort(volgorde)) {
    const rij = maak('div', { className: 'rij' });
    for (const v of groepen[groep]) rij.append(veldNode(v));
    // 'advanced' is bij FreeSewing het bakje met de rekenknoppen van het blok
    // (26 stuks bij een hoodie). Dichtgeklapt, want daar begin je niet.
    const dicht = groep === 'advanced' || groep === 'overig';
    doel.append(maak('details', { className: 'optiegroep', open: !dicht }, [
      maak('summary', { textContent: `${groep} (${groepen[groep].length})` }),
      rij,
    ]));
  }
}

// Waar je begint staat bovenaan, waar je zelden komt onderaan.
const GROEPVOLGORDE = ['style', 'fit'];
function volgorde(a, b) {
  const rang = (g) => {
    const i = GROEPVOLGORDE.indexOf(g);
    if (i >= 0) return i;
    return g === 'overig' ? 98 : g === 'advanced' ? 99 : 50;
  };
  return rang(a) - rang(b) || a.localeCompare(b);
}

// FreeSewing bepaalt zelf welke opties bij welke keuzes horen: kies je een
// andere constructie of mouw, dan hoort daar een andere set knoppen bij. Die
// functies rekenen met de ingestelde waarden, dus na elke wijziging opnieuw.
function herbouwOpties() {
  const focus = document.activeElement?.id;
  for (const v of velden) {
    const n = $(`opt-${v.naam}`);
    if (n) optieWaarden[v.naam] = v.soort === 'bool' ? n.checked : n.value;
  }
  velden = optieVelden(huidigDesign, huidigeMaten(), optiesNaarFreeSewing(velden, optieWaarden));
  tekenOpties();
  if (focus) $(focus)?.focus();
}

// Een optie kan patroondelen toevoegen of weghalen (een zak, een tailleband).
// De lijst met delen die je kunt aan- en uitvinken is dus verouderd zodra je
// een optie wijzigt: hield je die vast, dan bleef `only` de nieuwe delen
// weren en verschenen ze nergens meer om aan te zetten.
function optieGewijzigd() {
  herbouwOpties();
  if (!weggelaten.size && !alleDelen.length) return;
  weggelaten.clear();
  alleDelen = [];
  tekenDelen();
}

function veldNode(v) {
  const id = `opt-${v.naam}`;
  const label = leesbaar(v.naam);
  if (v.soort === 'bool') {
    const vink = maak('input', { id, type: 'checkbox', checked: Boolean(optieWaarden[v.naam] ?? v.standaard) });
    vink.addEventListener('change', optieGewijzigd);
    return maak('label', { className: 'vink' }, [vink, document.createTextNode(' ' + label)]);
  }
  if (v.soort === 'lijst') {
    const sel = maak('select', { id });
    const nu = optieWaarden[v.naam] ?? v.standaard;
    for (const keuze of v.keuzes) sel.append(new Option(keuze, keuze, keuze === v.standaard, keuze === nu));
    sel.addEventListener('change', optieGewijzigd);
    return maak('label', {}, [document.createTextNode(label), sel]);
  }
  // Een pct-optie declareert 15 (procent) maar FreeSewing rekent intern met
  // 0.15. Hier tonen we procenten; optiesNaarFreeSewing deelt door 100 --
  // net zoals core zelf doet met de standaardwaarde.
  const eenheid = { pct: '%', mm: 'mm', graden: '°', aantal: '' }[v.soort];
  const invoer = maak('input', { id, type: 'number', value: optieWaarden[v.naam] ?? v.standaard, min: v.min, max: v.max, step: v.soort === 'aantal' ? 1 : 'any' });
  invoer.addEventListener('change', optieGewijzigd);
  return maak('label', {}, [
    document.createTextNode(`${label}${eenheid ? ` (${eenheid})` : ''}`),
    invoer,
  ]);
}

const leesbaar = (s) => s.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();

function huidigeOpties() {
  const waarden = {};
  for (const v of velden) {
    const n = $(`opt-${v.naam}`);
    if (!n) continue;
    waarden[v.naam] = v.soort === 'bool' ? n.checked : n.value;
  }
  return optiesNaarFreeSewing(velden, waarden);
}

// -- maten: voorbeeldsets + eigen profielen --------------------------------
function vulMaatsets(kies) {
  const sel = $('maatset');
  const huidig = kies || sel.value;
  sel.replaceChildren();
  const eigen = maak('optgroup', { label: 'Eigen maten' });
  for (const [id, p] of Object.entries(profielen).sort((a, b) => a[1].naam.localeCompare(b[1].naam))) {
    eigen.append(new Option(p.naam, `eigen:${id}`));
  }
  if (!eigen.children.length) eigen.append(new Option('(nog geen — klik op "Eigen maten invoeren")', '', false, false));
  sel.append(eigen);
  const voorbeeld = maak('optgroup', { label: 'Voorbeeldmaten van FreeSewing' });
  for (const [key, s] of Object.entries(maatsets)) voorbeeld.append(new Option(s.label, key));
  sel.append(voorbeeld);
  sel.value = [...sel.options].some((o) => o.value === huidig && o.value) ? huidig : 'cisMaleAdult40';
  $('bewerkknop').hidden = !sel.value.startsWith('eigen:');
}

function huidigProfielId() {
  const v = $('maatset').value;
  return v.startsWith('eigen:') ? v.slice(6) : null;
}

function huidigeMaten() {
  const id = huidigProfielId();
  if (id) return profielen[id]?.maten || {};
  return maatsets[$('maatset').value]?.maten || {};
}

function ontbrekendeMaten() {
  if (!gekozen) return [];
  return ontbrekend({ maten: huidigeMaten() }, catalogus.designs[gekozen].maten);
}

// -- de maten-dialoog ------------------------------------------------------
// Eén rij per maat. De uitleg en de foto komen van FreeSewing; de vertaling
// is van ons, met het origineel ernaast zodat je altijd terug kunt naar de
// bron.
function openMatenDialoog(profielId = null) {
  const dlg = $('matendialoog');
  const bestaand = profielId ? profielen[profielId] : null;
  $('profielnaam').value = bestaand?.naam || '';
  $('profielnotitie').value = bestaand?.notitie || '';
  dlg.dataset.profielId = profielId || '';
  $('verwijderknop').hidden = !bestaand;
  $('modelkeuze').value = model;
  $('dialoogfout').textContent = ''; // niet de fout van de vorige keer tonen
  // Referentie: wat het profiel eerder koos, anders de voorbeeldset die nu
  // in de hoofdkeuze staat, anders Man 40.
  const ref = $('referentiekeuze');
  if (!ref.options.length) for (const [key, s] of Object.entries(maatsets)) ref.add(new Option(s.label, key));
  const huidig = huidigProfielId() ? null : $('maatset').value;
  ref.value = maatsets[bestaand?.referentie] ? bestaand.referentie : maatsets[huidig] ? huidig : 'cisMaleAdult40';

  const d = gekozen ? catalogus.designs[gekozen] : null;
  const nodig = d?.maten || [];
  const optioneel = d?.matenOptioneel || [];
  const rest = ALLE_MATEN().filter((m) => !nodig.includes(m) && !optioneel.includes(m));

  const doel = $('matenrijen');
  doel.replaceChildren();
  const groep = (titel, lijst, open) => {
    if (!lijst.length) return;
    const det = maak('details', { open });
    det.append(maak('summary', { textContent: `${titel} (${lijst.length})` }));
    for (const m of lijst) det.append(maatRij(m, bestaand?.maten?.[m]));
    doel.append(det);
  };
  groep(d ? `Nodig voor ${d.naam}` : 'Maten', nodig, true);
  groep(d ? `Optioneel voor ${d.naam}` : 'Optioneel', optioneel, true);
  groep('Overige maten', rest, !d);
  werkReferentieBij();
  dlg.showModal();
}

// Waarde van een maat zoals de gebruiker hem ziet: cm, of graden voor de
// schouderhelling.
const toon = (m, mm) => (matenInfo.maten[m].graden ? mm : naarCm(mm));
const eenheidVan = (m) => (matenInfo.maten[m].graden ? '°' : 'cm');

// De gekozen standaardmaat naast elke maat, met het verschil. Zo zie je of
// jouw maat kán kloppen: 3 cm meer borst dan Man 40 is een lichaam, 30 cm is
// een typefout.
function werkReferentieBij() {
  const set = maatsets[$('referentiekeuze').value];
  $('refuitleg').textContent = set ? `${set.label} is een voorbeeldset van FreeSewing, geen norm.` : '';
  for (const m of ALLE_MATEN()) {
    const refMm = set?.maten?.[m];
    const refDoel = $(`ref-${m}`);
    const deltaDoel = $(`delta-${m}`);
    if (!refDoel) continue;
    const heeftRef = Number.isFinite(refMm);
    refDoel.firstChild.textContent = heeftRef ? `${toon(m, refMm)} ${eenheidVan(m)}` : '—';
    refDoel.lastChild.hidden = !heeftRef;
    const eigen = Number($(`maat-${m}`).value);
    if (!heeftRef || !($(`maat-${m}`).value !== '' && Number.isFinite(eigen))) { deltaDoel.textContent = ''; deltaDoel.className = 'delta'; continue; }
    const verschil = Math.round((eigen - toon(m, refMm)) * 10) / 10;
    deltaDoel.textContent = verschil === 0 ? '= standaard' : `${verschil > 0 ? '+' : '−'}${Math.abs(verschil)} ${eenheidVan(m)}`;
    deltaDoel.className = `delta ${verschil === 0 ? 'gelijk' : verschil > 0 ? 'plus' : 'min'}`;
  }
}

// Overnemen: alleen de lege velden, zodat wat je al gemeten hebt blijft
// staan en je daarna alleen aanpast wat bij jou echt afwijkt.
function neemReferentieOver(alleenLeeg = true) {
  const set = maatsets[$('referentiekeuze').value];
  if (!set) return;
  let n = 0;
  for (const m of ALLE_MATEN()) {
    const invoer = $(`maat-${m}`);
    const refMm = set.maten[m];
    if (!invoer || !Number.isFinite(refMm)) continue;
    if (alleenLeeg && invoer.value !== '') continue;
    invoer.value = toon(m, refMm);
    n++;
  }
  werkReferentieBij();
  $('dialoogfout').textContent = n ? '' : 'Alle velden waren al ingevuld; gebruik “overnemen” bij een losse maat om die te vervangen.';
}

function maatRij(m, waardeMm) {
  const info = matenInfo.maten[m];
  const graden = !!info?.graden;
  const invoer = maak('input', {
    id: `maat-${m}`, type: 'number', step: graden ? 1 : 0.1, min: 0, inputMode: 'decimal',
    value: Number.isFinite(waardeMm) ? (graden ? waardeMm : naarCm(waardeMm)) : '',
  });
  invoer.addEventListener('input', werkReferentieBij);

  // Per maat: de standaardwaarde en een knop om precies die ene over te nemen.
  const overneem = maak('button', { type: 'button', className: 'stil', textContent: 'overnemen', title: 'Vervang jouw waarde door deze standaardmaat' });
  overneem.addEventListener('click', () => {
    const refMm = maatsets[$('referentiekeuze').value]?.maten?.[m];
    if (Number.isFinite(refMm)) { invoer.value = toon(m, refMm); werkReferentieBij(); }
  });
  const referentie = maak('div', { className: 'referentie', id: `ref-${m}` }, [document.createTextNode('—'), overneem]);

  const uitleg = maak('div', { className: 'uitleg', hidden: true });
  const infoknop = maak('button', { type: 'button', className: 'stil klein', textContent: 'hoe meet ik dit?' });
  infoknop.setAttribute('aria-expanded', 'false');
  infoknop.addEventListener('click', () => {
    if (!uitleg.children.length) uitleg.append(...uitlegInhoud(m));
    uitleg.hidden = !uitleg.hidden;
    infoknop.setAttribute('aria-expanded', String(!uitleg.hidden));
  });

  return maak('div', { className: 'maatrij' }, [
    maak('div', { className: 'maatkop' }, [
      maak('label', { htmlFor: `maat-${m}` }, [
        maak('span', { className: 'maatnaam', textContent: labelNl(m) }),
        maak('span', { className: 'meta', textContent: ` ${info?.titel || m}` }),
      ]),
      maak('div', { className: 'maatinvoer' }, [
        invoer,
        maak('span', { className: 'eenheid', textContent: graden ? '°' : 'cm' }),
        maak('span', { className: 'delta', id: `delta-${m}` }),
      ]),
      referentie,
      infoknop,
    ]),
    uitleg,
  ]);
}

function uitlegInhoud(m) {
  const info = matenInfo.maten[m];
  const nl = MATEN_NL[m];
  const laag = m.toLowerCase();
  const foto = maak('img', {
    className: 'meetfoto', alt: `Hoe je ${labelNl(m)} meet (model: ${model})`,
    src: `./maten/${model}/${laag}.svg`,
    style: `background-image:url(./maten/${model}-${info.houding}.jpg)`,
  });
  const delen = [
    foto,
    ...(nl?.tekst || info.tekst).split('\n\n').map((al) => maak('p', { textContent: al })),
  ];
  // De HPS-uitleg hoort bij de drie hps-maten.
  if (/^hps/.test(m)) {
    const b = BEGRIPPEN_NL.hps;
    delen.push(maak('p', { className: 'begrip' }, [maak('strong', { textContent: b.titel + ': ' }), document.createTextNode(b.tekst.replace(/\n\n/g, ' '))]));
  }
  if (nl) {
    delen.push(maak('details', {}, [
      maak('summary', { textContent: 'Origineel (Engels)' }),
      ...info.tekst.split('\n\n').map((al) => maak('p', { textContent: al })),
    ]));
  }
  delen.push(maak('p', { className: 'meta' }, [
    document.createTextNode('Bron: '),
    maak('a', { href: info.bron, target: '_blank', rel: 'noopener', textContent: info.bron.replace('https://', '') }),
    document.createTextNode(' (FreeSewing, MIT). Vertaling: el-patroon.'),
  ]));
  return delen;
}

function bewaarDialoog() {
  const dlg = $('matendialoog');
  const maten = {};
  for (const m of ALLE_MATEN()) {
    const v = $(`maat-${m}`)?.value;
    if (v === '' || v === undefined) continue;
    maten[m] = matenInfo.maten[m].graden ? Number(v) : naarMm(v);
  }
  try {
    const id = bewaarProfiel(localStorage, {
      id: dlg.dataset.profielId || undefined,
      naam: $('profielnaam').value,
      notitie: $('profielnotitie').value,
      referentie: $('referentiekeuze').value, // zodat de vergelijking de volgende keer klaarstaat
      maten,
    }, ALLE_MATEN());
    profielen = laadProfielen(localStorage);
    vulMaatsets(`eigen:${id}`);
    dlg.close();
    toonMatenUitleg();
    genereer();
  } catch (e) {
    $('dialoogfout').textContent = e.message;
  }
}

function verwijderDialoog() {
  const id = $('matendialoog').dataset.profielId;
  if (!id || !confirm(`Profiel "${profielen[id]?.naam}" verwijderen?`)) return;
  verwijderProfiel(localStorage, id);
  profielen = laadProfielen(localStorage);
  vulMaatsets('cisMaleAdult40');
  $('matendialoog').close();
  toonMatenUitleg();
}

function exporteerProfielen() {
  const blob = new Blob([exporteer(profielen)], { type: 'application/json' });
  const a = maak('a', { href: URL.createObjectURL(blob), download: 'el-patroon-maten.json' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function importeerProfielen(bestand) {
  try {
    const nieuw = importeer(await bestand.text(), ALLE_MATEN());
    for (const p of Object.values(nieuw)) bewaarProfiel(localStorage, p, ALLE_MATEN());
    profielen = laadProfielen(localStorage);
    const eerste = Object.keys(nieuw)[0];
    vulMaatsets(eerste ? `eigen:${eerste}` : undefined);
    toonMatenUitleg();
    $('status').textContent = `${Object.keys(nieuw).length} profiel(en) geïmporteerd.`;
    $('status').className = 'ok';
  } catch (e) {
    $('status').textContent = `Importeren mislukt: ${e.message}`;
    $('status').className = 'fout';
  }
}

// -- delen kiezen ---------------------------------------------------------
function tekenDelen() {
  const doel = $('delen');
  doel.replaceChildren();
  if (!alleDelen.length) return;
  const rij = maak('div', { className: 'rij' });
  for (const deel of alleDelen) {
    const vink = maak('input', { id: `deel-${deel.id}`, type: 'checkbox', checked: !weggelaten.has(deel.id) });
    vink.addEventListener('change', () => {
      if (vink.checked) weggelaten.delete(deel.id); else weggelaten.add(deel.id);
      genereer();
    });
    rij.append(maak('label', { className: 'vink' }, [vink, document.createTextNode(' ' + deel.naam)]));
  }
  doel.append(maak('fieldset', {}, [maak('legend', { textContent: 'delen' }), rij]));
}

// -- genereren ------------------------------------------------------------
// Alles wat bij een gemaakt patroon hoort in één keer weg. Zonder dit bleef
// na het wisselen van design de vorige tekening, materiaallijst en het vorige
// oordeel staan -- met de knoppen actief, zodat Print en Download het oude
// patroon onder de nieuwe naam uitleverden.
function wisResultaat({ status = '' } = {}) {
  laatste = null;
  $('tekening').innerHTML = '';
  $('materiaal').replaceChildren();
  $('validatie').replaceChildren();
  $('validatie').removeAttribute('data-status');
  $('print').replaceChildren();
  $('printknop').hidden = true;
  $('downloadknop').hidden = true;
  // Ook de statusregel: die bleef anders melden dat er een patroon getekend
  // was terwijl er niets meer stond.
  $('status').textContent = status;
  $('status').className = '';
}

// Volgnummer van de laatste generatie. Tekenen duurt honderden ms en de
// vinkjes bij de delen starten hun eigen ronde; zonder dit kon een oudere
// ronde als laatste binnenkomen en de tekening laten afwijken van de vinkjes.
let generatie = 0;

async function genereer() {
  if (!gekozen) return;
  const status = $('status');
  const mijn = ++generatie;
  const tekort = ontbrekendeMaten();
  if (tekort.length) {
    wisResultaat();
    status.replaceChildren(
      document.createTextNode(`Dit profiel mist ${tekort.length} maat/maten voor ${catalogus.designs[gekozen].naam}: ${tekort.map(labelNl).join(', ')}. `),
      maak('button', { type: 'button', className: 'stil klein', textContent: 'Aanvullen' }),
    );
    status.lastChild.addEventListener('click', () => openMatenDialoog(huidigProfielId()));
    status.className = 'fout';
    return;
  }
  status.textContent = 'Tekenen…';
  status.className = 'bezig';
  $('go').disabled = true;
  await new Promise((r) => setTimeout(r, 0)); // niet rAF: vuurt niet in een verborgen tab
  try {
    const papier = $('papier').value || null;
    const only = weggelaten.size ? alleDelen.map((d) => d.id).filter((id) => !weggelaten.has(id)) : null;
    const resultaat = await teken({
      design: gekozen,
      maten: huidigeMaten(),
      opties: huidigeOpties(),
      sa: naadtoeslagMm(),
      paperless: $('paperless').checked,
      units: $('units').value,
      papier,
      only,
    });
    if (mijn !== generatie) return; // een nieuwere ronde is begonnen
    laatste = resultaat;
    if (!only) alleDelen = laatste.delen;
    tekenDelen();
    $('tekening').innerHTML = laatste.svg;
    toonMateriaal(laatste.materiaal);
    toonValidatie(laatste.validatie);
    $('print').replaceChildren();
    $('printknop').hidden = !laatste.paginas;
    $('downloadknop').hidden = false;
    status.textContent = `${catalogus.designs[gekozen].naam}: ${laatste.delen.length} delen getekend`
      + (laatste.paginas ? ` — ${laatste.paginas.vellen.length} vellen ${laatste.paginas.papier.toUpperCase()}.` : '.');
    status.className = 'ok';
  } catch (e) {
    if (mijn !== generatie) return;
    wisResultaat();
    status.textContent = `Mislukt: ${e.message}`;
    status.className = 'fout';
  } finally {
    if (mijn === generatie) $('go').disabled = false;
  }
}

// Een leeggemaakt invoerveld geeft '' en Number('') is 0 -- dat zou zonder
// naadtoeslag tekenen en toch "klaar om te knippen" melden. Leeg betekent
// hier: gebruik de standaard.
function naadtoeslagMm() {
  const v = $('sa').value;
  return v === '' ? 10 : Number(v);
}

// -- validatie ------------------------------------------------------------
const STATUS_TEKST = {
  KLAAR: 'Klaar om te knippen',
  CONTROLEER: 'Controleer eerst',
  GEBLOKKEERD: 'Geblokkeerd — niet bruikbaar',
};

function toonValidatie({ status, meldingen }) {
  const doel = $('validatie');
  doel.replaceChildren();
  doel.dataset.status = status;
  doel.append(maak('div', { className: 'vstatus', textContent: STATUS_TEKST[status] || status }));
  if (!meldingen.length) {
    doel.append(maak('div', { className: 'meta', textContent: 'Geen fouten in FreeSewing’s logboek, geen vlaggen van de ontwerper, maten plausibel, kniplijnen raken zichzelf niet.' }));
    return;
  }
  const volgorde = { fout: 0, 'let-op': 1, info: 2 };
  const lijst = maak('ul', { className: 'meldingen' });
  for (const m of [...meldingen].sort((a, b) => volgorde[a.ernst] - volgorde[b.ernst])) {
    const tekst = m.maat ? m.tekst.replace(m.maat, labelNl(m.maat)) : m.tekst;
    lijst.append(maak('li', { className: m.ernst, textContent: tekst, title: m.code }));
  }
  doel.append(lijst);
}

// -- printen op ware grootte --------------------------------------------
// Elk vel is een eigen, complete SVG: <use> naar één gedeelde tekening maakt
// een shadow-tree waar FreeSewing's stijlregels niet doorheen matchen. Pas
// opgebouwd als je op Print klikt.
function bouwPrint() {
  const doel = $('print');
  doel.replaceChildren();
  if (!laatste?.paginas) return;
  const { svg, paginas } = laatste;
  // Géén 'portrait' achter de maten: dat keyword mag alleen bij een benoemd
  // formaat en maakt de hele regel anders ongeldig, waarna de browser
  // stilletjes op Letter/A4 print.
  const [vel_b, vel_h] = PAPIERMATEN[paginas.papier];
  doel.append(maak('style', { textContent: `@page { size: ${vel_b}mm ${vel_h}mm; margin: ${PRINTMARGE_MM}mm; }` }));
  const opening = svg.match(/^<svg[^>]*>/)[0];
  const sjabloonTekst = `<svg xmlns="http://www.w3.org/2000/svg" class="freesewing velsvg"`
    + ` width="${paginas.breedte}mm" height="${paginas.hoogte}mm">${svg.slice(opening.length)}`;
  const sjabloon = maak('div', { innerHTML: sjabloonTekst }).firstElementChild;
  const naam = catalogus.designs[gekozen].naam;
  paginas.vellen.forEach((vel, i) => {
    const velSvg = sjabloon.cloneNode(true);
    velSvg.setAttribute('viewBox', vel.viewBox);
    if (i > 0) velSvg.querySelectorAll('style').forEach((s) => s.remove());
    doel.append(maak('div', { className: 'vel' }, [
      maak('div', { className: 'vellabel', textContent: `${naam} — vel ${vel.label} van ${paginas.vellen.length}` }),
      velSvg,
    ]));
  });
}

function downloadSvg() {
  if (!laatste) return;
  const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + laatste.svg], { type: 'image/svg+xml' });
  const a = maak('a', {
    href: URL.createObjectURL(blob),
    download: `${gekozen}-${($('maatset').selectedOptions[0]?.textContent || 'maten').replace(/[^\w-]+/g, '_')}${laatste.paginas ? '-' + laatste.paginas.papier : ''}.svg`,
  });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function toonMateriaal(materiaal) {
  const doel = $('materiaal');
  doel.replaceChildren();
  for (const [naam, sneden] of Object.entries(materiaal)) {
    const rijen = sneden.map((s) => maak('tr', {}, [
      maak('td', { textContent: s.deel }),
      maak('td', { textContent: `${s.aantal}×` }),
      maak('td', { textContent: [s.opDeVouw ? 'op de vouw' : '', s.opSchuineDraad ? 'schuine draad' : ''].filter(Boolean).join(', ') }),
    ]));
    doel.append(maak('table', {}, [maak('caption', { textContent: `Knippen uit ${naam}` }), maak('tbody', {}, rijen)]));
  }
}

// -- donkere modus voor het patroon ---------------------------------------
// De hoofdapp heeft meer dan één donker thema (dark, nova, carbon, slate, ...)
// en zonder keuze volgt design.css het systeem. Een lijst themanamen loopt
// altijd achter; de achtergrondkleur die er uiteindelijk uitkomt niet. Meten
// dus, via een proefelement -- getComputedStyle geeft daar altijd een rgb().
function isDonkerThema() {
  const proef = maak('div', { style: 'background: var(--bg); display: none' });
  document.body.append(proef);
  const kleur = getComputedStyle(proef).backgroundColor;
  proef.remove();
  const [r, g, b] = (kleur.match(/\d+(\.\d+)?/g) || []).map(Number);
  if ([r, g, b].some((n) => !Number.isFinite(n))) {
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  // Relatieve helderheid volgens de WCAG-weging; onder de helft is donker.
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 < 0.5;
}

async function installeerDonkerPalet() {
  if (!isDonkerThema()) return;
  document.documentElement.classList.add('donker');
  const k = await donkereKleuren();
  const regels = [
    `#tekening { background: #161616; }`,
    `#tekening svg.freesewing path, #tekening svg.freesewing circle { stroke: ${k.base || '#fff'}; }`,
    `#tekening svg.freesewing text { fill: ${k.base || '#fff'}; }`,
    ...Object.entries(k).filter(([naam]) => naam !== 'base').flatMap(([naam, kleur]) => [
      `#tekening svg.freesewing .${naam} { stroke: ${kleur}; }`,
      `#tekening svg.freesewing .fill-${naam} { fill: ${kleur}; }`,
    ]),
  ];
  // Alleen op het scherm: op papier moet het patroon zwart op wit blijven.
  document.head.append(maak('style', { textContent: `@media screen {\n${regels.join('\n')}\n}` }));
}

// -- opstarten ------------------------------------------------------------
async function start() {
  $('fsversie').textContent = FS_VERSION;
  [catalogus, matenInfo] = await Promise.all([
    fetch('./catalogus.json').then((r) => r.json()),
    fetch('./maten.json').then((r) => r.json()),
  ]);

  const tags = [...new Set(Object.values(catalogus.designs).flatMap((d) => d.tags))].sort();
  const techn = [...new Set(Object.values(catalogus.designs).flatMap((d) => d.technieken))].sort();
  $('tag').add(new Option('alle', ''));
  for (const t of tags) $('tag').add(new Option(t, t));
  $('techniek').add(new Option('alle', ''));
  for (const t of techn) $('techniek').add(new Option(t, t));

  maatsets = await laadMaatsets();
  profielen = laadProfielen(localStorage);
  vulMaatsets(Object.keys(profielen).length ? `eigen:${Object.keys(profielen)[0]}` : 'cisMaleAdult40');

  for (const [key, [b, h]] of Object.entries(PAPIERMATEN)) $('papier').add(new Option(`${key.toUpperCase()} (${b}×${h} mm)`, key));
  $('papier').value = 'a4';

  for (const id of ['zoek', 'tag', 'techniek', 'alleentekening']) $(id).addEventListener('input', tekenLijst);
  $('maatset').addEventListener('change', () => {
    $('bewerkknop').hidden = !huidigProfielId();
    toonMatenUitleg();
    // Sommige opties hangen aan een maat (highBust), dus de lijst kan wijzigen.
    if (huidigDesign) herbouwOpties();
  });
  $('nieuwknop').addEventListener('click', () => openMatenDialoog(null));
  $('bewerkknop').addEventListener('click', () => openMatenDialoog(huidigProfielId()));
  $('exportknop').addEventListener('click', exporteerProfielen);
  $('importbestand').addEventListener('change', (e) => { if (e.target.files[0]) importeerProfielen(e.target.files[0]); e.target.value = ''; });
  $('opslaanknop').addEventListener('click', bewaarDialoog);
  $('verwijderknop').addEventListener('click', verwijderDialoog);
  $('sluitknop').addEventListener('click', () => $('matendialoog').close());
  $('referentiekeuze').addEventListener('change', werkReferentieBij);
  $('overneemknop').addEventListener('click', () => neemReferentieOver(true));
  $('modelkeuze').addEventListener('change', (e) => {
    model = e.target.value;
    // Álle uitlegblokken leegmaken, niet alleen de open. Een dichtgeklapt
    // blok werd anders nooit meer opnieuw gevuld (de vul-guard kijkt of er al
    // inhoud is), en toonde bij heropenen voor altijd het vorige model.
    document.querySelectorAll('#matenrijen .uitleg').forEach((u) => {
      if (!u.children.length) return;
      const m = u.previousElementSibling.querySelector('input').id.replace('maat-', '');
      if (u.hidden) u.replaceChildren(); // vult zich bij de volgende klik
      else u.replaceChildren(...uitlegInhoud(m));
    });
  });
  $('go').addEventListener('click', genereer);
  $('printknop').addEventListener('click', () => { bouwPrint(); window.print(); });
  $('downloadknop').addEventListener('click', downloadSvg);

  installeerDonkerPalet().catch(() => {});
  toonSyncmelding();
  tekenLijst();
  await kiesDesign('huey');
  await genereer();
}

// De boot-gate zet sync uit als de Supabase-tabel er nog niet is. Dan werkt
// alles, maar staan je maten alleen in deze browser -- dat hoor je te weten
// voordat je ze invoert.
function toonSyncmelding() {
  const H = window.__gmPatroon;
  if (!H || !H.syncOff) return;
  const p = $('syncmelding');
  p.textContent = H.syncReason === 'grant'
    ? 'Sync staat uit: de tabel elpatroon_state bestaat, maar de app mag er niet bij. Je maten blijven op dit apparaat — exporteer ze als back-up. De SQL staat in README.md.'
    : 'Sync staat uit: de tabel elpatroon_state bestaat nog niet. Je maten blijven op dit apparaat — exporteer ze als back-up. De SQL staat in README.md.';
  p.hidden = false;
}

start().catch((e) => {
  $('status').textContent = `Opstarten mislukt: ${e.message}`;
  $('status').className = 'fout';
});
