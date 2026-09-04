// ---------------------------------------------------------------------------
// Seeded custom games -- content, not infrastructure, which is why it lives in
// data/ rather than in the core (it used to sit in app.js next to the storage
// and navigation code).
//
// Griftpark: every distinct bird appearing in either monthly luistervink.nl
// Griftpark top-list (deduplicated, order and counts ignored), checked against
// the dataset by Dutch name -- all 42 were already present (one, "Vink", only
// matched after stripping the Wikipedia "(vogel)" disambiguator the same way
// dutchName() does for display).
//
// Bump `version` when the species list changes so existing installs migrate.
// ---------------------------------------------------------------------------

import { emptySelection } from "../core/filters.js";
import { GRIFTPARK_COURSE } from "./course-griftpark.js";
// Dezelfde lijsten als de cursussen, zodat een blader-tegel en de cursus met
// dezelfde naam niet uit elkaar kunnen lopen.
import { idsVanKind, popularDutchDogs } from "./courses.js";

/**
 * Eén seed-spel. Alle vier volgen hetzelfde stramien -- een handgekozen
 * soortenlijst bovenop een lege selectie -- en dat is ook de aanname waarop
 * applySeed() leunt: een seed-spel is altijd een specificIds-spel.
 */
const spel = (id, name, gameMode, specificIds) => ({
  id,
  name,
  gameMode,
  filters: { ...emptySelection(), specificIds },
});

/**
 * De seed wordt bij het opstarten opgebouwd, ná het laden van de data -- de
 * honden-, stijlen- en straatlijst komen namelijk uit de dataset zelf. Bump
 * `version` als je de inhoud wijzigt; applySeed() voegt een spel alleen toe als
 * het id nog niet bestaat, dus zonder bump verandert er bij bestaande
 * installaties niets.
 */
export function buildSeed() {
  return {
    // v6: straatarcheologie erbij, dus een vierde seed-spel.
    version: "6",
    retire: ["griftpark-top20", "griftpark-all"],
    games: [
      spel("griftpark-browse", "Griftpark · 100", "browse",
        GRIFTPARK_COURSE.species.map(([sci]) => sci)),
      spel("stromingen-tijdlijn", "Bouwstijlen · tijdlijn", "browse",
        idsVanKind("architecture")),
      spel("straat-utrecht", "Straatarcheologie · Utrecht", "browse",
        idsVanKind("street")),
      // Meerkeuze en niet bladeren: dit is een lijst om te LEREN, niet om
      // door te scrollen. De Griftpark-tegel is het naslagwerk.
      spel("honden-nl-top30", "Honden · NL top 30", "quiz-choice",
        popularDutchDogs()),
    ],
  };
}
