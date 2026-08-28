# Spotinus — architectuurstromingen

Beknopt plan (24 aug 2026). **Status: LIVE sinds 25 aug (v2026.08.25-1).** De teksten leven in
`tools/arch-styles.mjs`; `tools/build-arch.mjs` haalt de gebouwenfoto's erbij
(Wikidata P149, contactvel `tools/arch-photo-check.html`, excludes in
`tools/arch-photo-excludes.txt`). Gebouwen die bij méérdere stromingen horen
weert het script zelf — het Binnenhof stond anders als hoofdfoto bij gotiek én
Hollandse renaissance. Curatie-excludes: Nieuwe Kerk niet als neogotiek-gezicht,
Concertgebouw niet als neoclassicisme, Olympisch Stadion niet als Amsterdamse
School. Doel: de ~24
Nederlandse bouwstromingen leren herkennen — met tijdlijn en verhaal, geen
1000 gebouwen.

## Het concept: de stijl is de soort

Bij vogels is de eenheid het individu; hier is de eenheid de **stroming**, en
gebouwen zijn alleen de foto's waarmee je haar leert zien. Dat past vrijwel
1-op-1 op wat er staat: een stijl = één record met véél foto's (zoals een hond
met vier), `quizPhotoUrl()` roteert al, Leitner is gratis, en de groepenquiz
("3 kaartjes, welke groep?") is al gebouwd voor FCI.

Getest op 24 aug: Wikidata `P149` (bouwstijl) × Nederland × foto levert 46
stijlen met ≥8 gebouwen — Amsterdamse School 332, neorenaissance 389,
wederopbouw 208, Delftse School 52, Bossche School 13.

## Wat architectuur anders maakt (en dus nieuw is)

1. **De tijdlijn is de cursus.** Geen frequentievolgorde maar chronologie:
   elke stijl wordt geïntroduceerd als reactie op de vorige (neostijlen →
   Berlage breekt ermee → Amsterdamse School → De Stijl/Nieuwe Bouwen als
   tegenreactie → Delftse School als tegen-tegenreactie → …). Dat verhaal is
   wat het memorabel maakt.
2. **Detailkaart wordt een stijlkaart**: periode (bv. 1910–1935), 3–5
   herkenkenmerken in gewone taal ("laddervensters, golvend metselwerk"),
   sleutelfiguren, en één regel *"kwam als reactie op …"*. Bestaande kaart +
   drie extra veldrijen; rijen zonder waarde verdwijnen al vanzelf.
3. **Afleiders = buren in de tijd.** De echte verwarring is neogotiek vs
   neorenaissance vs eclecticisme (allemaal ~1850–1900). `similarity()` krijgt
   een era-afstandsterm in plaats van familie — zelfde plek als de
   origin-term bij honden.

## De lijst (~24, curatie — mijn voorstel, jij strept)

Romaans · Gotiek · Hollandse renaissance · Hollands classicisme ·
Lodewijkstijlen (samengevouwen) · Neoclassicisme · Neogotiek · Neorenaissance ·
Eclecticisme · Chaletstijl · Jugendstil · Berlage/rationalisme · Amsterdamse
School · Nieuwe Haagse School · De Stijl · Nieuwe Bouwen/functionalisme ·
Art deco · Delftse School · Bossche School · Wederopbouw · Brutalisme ·
Structuralisme · Postmodernisme · Superdutch/hedendaags.

Twijfelgevallen: jaren-30-revival (wat je in elke nieuwbouwwijk ziet — leuk,
maar geen P149-data, dus handmatige foto's) en overgangsarchitectuur.

## Data

- `src/data/arch-styles.js` — **handgeschreven**, zoals `fci-groups.js`: 24
  records met periode, kenmerken, verhaal, architecten. Dit is het echte werk
  en het waardevolle deel; niet te scrapen.
- `tools/build-arch.mjs` — per stijl via P149 de NL-gebouwen met foto,
  contactvel + exclude-bestand (zelfde werkwijze als de honden) →
  `data/arch.json` + `data/arch-photos.json` in het bestaande formaat.
  Eclecticisme heeft 822 kandidaten; we cappen op ~8 goede per stijl.
- Record: id `arch:Q…`, `tags.kind: "architecture"`, `tags.era` (bucket voor
  filter + afleiders), `scientificName`/`soundUrl` null — geluid en de
  cursiefregel vallen dan vanzelf weg, dat is al zo gebouwd.

## Fasen

| | | |
|---|---|---|
| 1 | Stijlenlijst + teksten schrijven (`arch-styles.js`), jij reviewt de lijst | 1 sessie |
| 2 | `build-arch.mjs` + contactvel doorlopen | 1 sessie |
| 3 | In de app: kind erbij, era-afleiders, stijlkaart-velden, chronologische cursus "Stromingen · 24" | 1 sessie |
| 4 | Optioneel later: tijdlijn-ordeningsvraag ("zet deze drie op volgorde") | apart |

## Bekende spanning

De Alles/Vogels/Honden-schakelaar wordt met een derde kind een rij van vier.
Dat past nog nét; bij een vierde categorie moet hij anders (was al voorzien in
het hondenplan). Geen werk nu.
