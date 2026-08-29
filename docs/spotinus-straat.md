# Spotinus — straatarcheologie ("wat is dat ding?")

Gebouwd 29 aug 2026, in de sandbox. Vierde categorie naast vogels, honden en
bouwstijlen: de kleine straatobjecten waar je dagelijks langs loopt zonder te
weten dat ze een naam en een verhaal hebben. **Scope: voor nu alleen Utrecht**
— waar een Utrechtse Commons-categorie bestaat (werfkelders, gevelstenen,
Stolpersteine, muurankers, lantaarnconsoles, stadspompen) staat die voorop;
landelijke categorieën vullen aan voor objecten die overal hetzelfde zijn.

## Het model: categorie als soort, groep als familie

Zelfde recept als de bouwstijlen (`docs/spotinus-architectuur.md`): één object
= één record met veel wisselende voorbeeldfoto's. Nieuw is dat de vier groepen
— onder je voeten / aan de gevel / palen en paaltjes / op straat — als
`tags.family` + `familyNameNl/En` in de data staan. Dat ene veld levert zonder
appcode het familiefilter, de familie-sortering én betere afleiders op
(similarity() geeft +4 voor dezelfde familie: een paal wordt met palen
verward, niet met een gaper).

De detailkaart hergebruikt de stijlkaartrijen: `period` → "Periode",
`features_*` → "Herkenbaar aan", `fact_*` → het verhaal. Nul nieuwe velden.

## De 24 objecten

- **Onder je voeten**: werfkelder · stolperstein · putdeksel · voetenschraper
- **Aan de gevel**: gevelsteen · muuranker · hijsbalk · pothuis · gaper ·
  brandverzekeringsplaatje · eerste steen · muurreclame · deurklopper ·
  NAP-peilmerk · lantaarnconsole
- **Palen en paaltjes**: amsterdammertje · schamppaal · grenspaal ·
  ANWB-paddenstoel · rolpaal
- **Op straat**: stadspomp · plaskrul · straatbrievenbus · telefooncel

Afgevallen bij de verkenning (geen bruikbare Commons-categorie): hijsbalk had
er wél een ("Lifting beams in the Netherlands"), maar transformatorhuisjes,
hoogwaterstenen, monumentenschildjes en straatnaamborden niet.

## Bestanden

- `tools/street-objects.mjs` — **handgeschreven**: 24 records met verhaal,
  kenmerken, periode, groep en Commons-categorieën. Dit is het waardevolle deel.
- `tools/build-street.mjs` — foto's uit de categorieën (categorymembers met
  `continue`, spreiding met vaste stap door alfabetische series, multi-object-
  weer, BAD_NAME-filter, licentie-check), verifieert de Wikipedia-links per
  taal, schrijft `data/street.json` + `data/street-photos.json`, contactvel
  `tools/street-photo-check.html`, curatie in `tools/street-photo-excludes.txt`.
- Record: id `street:<key>`, `tags.kind: "street"`, `scientificName`/`soundUrl`
  null. Seed-spel "Straatarcheologie · Utrecht" (browse, seed v6).
- De kind-schakelaar werd met vijf knoppen te breed voor een telefoon: de
  variant `.segmented-kind` scrolt horizontaal (de "bekende spanning" uit het
  architectuurplan).

## Later (niet nu)

Meer steden = extra categorieën per record vooraan zetten; het veld heet al
`cats`. Landelijke uitbreiding is één regel per object plus een rerun.
