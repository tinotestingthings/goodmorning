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
import { allBirds } from "../core/birds.js";
import { GRIFTPARK_COURSE } from "./course-griftpark.js";

const NL_DOG_COUNT = 30;

/**
 * De honden die je in Nederland het vaakst tegenkomt -- bij benadering.
 *
 * WAT DIT WEL EN NIET IS. Er bestaat geen vrij beschikbare lijst van
 * hondenregistraties per ras in Nederland; de Raad van Beheer publiceert die
 * niet als open data. Wat we wél kunnen meten is hoe vaak elk rasartikel op de
 * NEDERLANDSTALIGE Wikipedia wordt bekeken (`nlPopularity`, 60 dagen). Dat is
 * belangstelling, geen telling -- maar het is Nederlandse belangstelling, en
 * dat scheelt: de lijst opent met beagle, Australische herder en cane corso,
 * en heeft het kooikerhondje op 9 en de stabij op 29 staan. Twee Nederlandse
 * rassen in de top 30 die in de Engelse cijfers nergens te bekennen zijn.
 *
 * Alleen door de FCI erkende rassen doen mee. Dat is geen willekeurige eis
 * maar precies de goede: hij haalt de dingo uit de lijst, die hoog scoort om
 * redenen die niets met Nederlandse straten te maken hebben.
 */
function popularDutchDogs() {
  return allBirds()
    .filter((s) => s.tags?.kind === "dog" && s.tags?.fciGroup)
    .sort((a, b) => (b.nlPopularity ?? 0) - (a.nlPopularity ?? 0))
    .slice(0, NL_DOG_COUNT)
    .map((s) => s.id);
}

/**
 * De seed wordt bij het opstarten opgebouwd, ná het laden van de data -- de
 * hondenlijst komt namelijk uit de dataset zelf. Bump `version` als je de
 * inhoud wijzigt; applySeed() voegt een spel alleen toe als het id nog niet
 * bestaat, dus zonder bump verandert er bij bestaande installaties niets.
 */
export function buildSeed() {
  return {
    // v4: honden erbij, dus een tweede seed-spel.
    version: "4",
    retire: ["griftpark-top20", "griftpark-all"],
    games: [
      {
        id: "griftpark-browse",
        name: "Griftpark · 100",
        gameMode: "browse",
        filters: {
          ...emptySelection(),
          specificIds: GRIFTPARK_COURSE.species.map(([sci]) => sci),
        },
      },
      {
        id: "honden-nl-top30",
        name: "Honden · NL top 30",
        // Meerkeuze en niet bladeren: dit is een lijst om te LEREN, niet om
        // door te scrollen. De Griftpark-tegel is het naslagwerk.
        gameMode: "quiz-choice",
        filters: {
          ...emptySelection(),
          specificIds: popularDutchDogs(),
        },
      },
    ],
  };
}
