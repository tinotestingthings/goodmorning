// ---------------------------------------------------------------------------
// De cursussen: geordende leerlijsten waar de app er één van als "actief"
// aanhoudt. De volgorde binnen een lijst IS de leervolgorde.
//
// Tot nu toe was er één cursus, en die was hardgecodeerd als vogellijst: de
// oefensessie haalde nieuwe soorten alleen uit het Griftpark en de dagkaart uit
// Griftpark plus wat honden. Bouwstijlen en straatobjecten waren daardoor
// alleen naslagwerk -- je kon ze bekijken, maar niet leren. Hier staan alle
// vier de leerlijsten naast elkaar, in dezelfde vorm.
//
// Drie van de vier worden AFGELEID uit de dataset, zodat ze niet los kunnen
// lopen van de data:
//   - stijlen: chronologisch, want zo levert arch.json ze aan (de tijdlijn is
//     het verhaal)
//   - straat: per groep (onder je voeten, gevel, palen, op straat)
//   - honden: de dertig die je in Nederland het vaakst tegenkomt
// Alleen Griftpark is een handgeschreven lijst, met per soort het aantal
// waarnemingen -- dat getal bestaat nergens anders en hoort bij die ene cursus.
//
// De lijsten worden ook door src/data/seed-games.js gebruikt voor de
// blader-tegels: dezelfde inhoud, dus de tegel "Bouwstijlen · tijdlijn" en de
// cursus "Bouwstijlen" kunnen niet uit elkaar lopen.
// ---------------------------------------------------------------------------

import { allBirds } from "../core/birds.js";
import { GRIFTPARK_COURSE } from "./course-griftpark.js";

const NL_DOG_COUNT = 30;

/**
 * De honden die je in Nederland het vaakst tegenkomt -- bij benadering.
 *
 * Er bestaat geen vrij beschikbare lijst van hondenregistraties per ras; wat we
 * wél kunnen meten is hoe vaak elk rasartikel op de NEDERLANDSTALIGE Wikipedia
 * wordt bekeken (`nlPopularity`, 60 dagen). Dat is belangstelling, geen
 * telling -- maar het is Nederlandse belangstelling, en dat scheelt: het
 * kooikerhondje staat op 9 en de stabij op 29, allebei onzichtbaar in de
 * Engelse cijfers. Alleen door de FCI erkende rassen doen mee; dat haalt de
 * dingo eruit, die hoog scoort om redenen die niets met Nederlandse straten te
 * maken hebben.
 */
export function popularDutchDogs() {
  return allBirds()
    .filter((s) => s.tags?.kind === "dog" && s.tags?.fciGroup)
    .sort((a, b) => (b.nlPopularity ?? 0) - (a.nlPopularity ?? 0))
    .slice(0, NL_DOG_COUNT)
    .map((s) => s.id);
}

/** Alle ids van één categorie, in datasetvolgorde -- die volgorde is de les. */
export function idsVanKind(kind) {
  return allBirds()
    .filter((s) => s.tags?.kind === kind)
    .map((s) => s.id);
}

/**
 * De cursussen, in de volgorde waarin ze op Home staan. Wordt ná het laden van
 * de data opgebouwd, want drie van de vier lezen de dataset.
 *
 * `detections` is optioneel: alleen Griftpark weet hoe vaak een soort gehoord
 * is. Een cursus zonder ids (dataset niet geladen) valt in course.js weg, zodat
 * er nooit een lege cursus te kiezen is.
 */
export function buildCourses() {
  return [
    {
      id: "griftpark",
      nameKey: "courseGriftpark",
      ids: GRIFTPARK_COURSE.species.map(([id]) => id),
      detections: new Map(GRIFTPARK_COURSE.species),
    },
    { id: "stijlen", nameKey: "courseStyles", ids: idsVanKind("architecture") },
    { id: "straat", nameKey: "courseStreet", ids: idsVanKind("street") },
    { id: "honden", nameKey: "courseDogs", ids: popularDutchDogs() },
  ];
}
