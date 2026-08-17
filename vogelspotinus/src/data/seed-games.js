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

const GRIFTPARK_SPECIES = [
  "Columba palumbus", "Psittacula krameri", "Corvus monedula", "Pica pica",
  "Cyanistes caeruleus", "Fulica atra", "Aegithalos caudatus", "Troglodytes troglodytes",
  "Certhia brachydactyla", "Chroicocephalus ridibundus", "Sylvia atricapilla",
  "Phylloscopus collybita", "Garrulus glandarius", "Podiceps cristatus", "Turdus merula",
  "Alcedo atthis", "Dendrocopos major", "Larus argentatus", "Parus major", "Gallinula chloropus",
  "Erithacus rubecula", "Turdus iliacus", "Coccothraustes coccothraustes", "Anser albifrons",
  "Anas platyrhynchos", "Streptopelia decaocto", "Turdus philomelos", "Fringilla coelebs",
  "Strix aluco", "Prunella modularis", "Chloris chloris", "Regulus ignicapilla",
  "Regulus regulus", "Ardea cinerea", "Phylloscopus inornatus", "Muscicapa striata",
  "Apus apus", "Carduelis carduelis", "Anser anser", "Turdus viscivorus",
  "Sitta europaea", "Botaurus stellaris",
];

export const SEED = {
  version: "2",
  retire: ["griftpark-top20"], // superseded by the full list
  games: [
    {
      id: "griftpark-all",
      name: "Griftpark",
      gameMode: "quiz-choice",
      filters: { ...emptySelection(), specificBirds: [...GRIFTPARK_SPECIES] },
    },
  ],
};
