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

// v3: het losse Griftpark-quizspel is vervangen door de cursus + oefensessie
// op Home (die de Leitner-planning WEL voedt; het oude meerkeuzespel deed dat
// niet). Wat blijft is een blader-spel over dezelfde honderd soorten, nu in
// de volgorde en omvang van de cursuslijst i.p.v. de oude 42 uit de maandtop.
export const SEED = {
  version: "3",
  retire: ["griftpark-top20", "griftpark-all"],
  games: [
    {
      id: "griftpark-browse",
      name: "Griftpark · 100",
      gameMode: "browse",
      filters: {
        ...emptySelection(),
        specificBirds: GRIFTPARK_COURSE.species.map(([sci]) => sci),
      },
    },
  ],
};
