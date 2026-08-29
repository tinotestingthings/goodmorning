// ---------------------------------------------------------------------------
// The filter registry: one declarative definition list plus one predicate,
// driving Browse's filter bar, the Quiz filter bar and the Custom Game Builder.
//
// To add a dimension: add an entry here (plus, for data-derived ones, a `tags`
// field in build_data.py) and every surface picks it up. Labels are string
// keys resolved through i18n -- the registry no longer carries its own inline
// { nl, en } objects, which used to be a second, competing i18n system.
// ---------------------------------------------------------------------------

import { resolveLabel, t } from "./i18n.js";
import { allBirds } from "./birds.js";
import { isFavorite } from "./favorites.js";
import { groupByNumber } from "../data/fci-groups.js";

/**
 * type:
 *   "single-multi" -- bird has ONE tag value; any number may be selected (OR)
 *   "multi-array"  -- bird has an ARRAY of values; match on any overlap
 *   "boolean"      -- an on/off switch backed by local state, not by tag data
 */
export const FILTER_DEFINITIONS = [
  {
    // Welk soort dier. Staat als gewone dimensie in de registry, zodat de
    // custom-game-builder hem gratis krijgt -- maar de schakelaar zelf hoort
    // niet weggestopt in het Opties-blad, dus Bladeren en Quiz zetten hem er
    // groot boven (zie kindSwitch in ui/filter-bar.js). Eén selectie, twee
    // plekken om hem te bedienen.
    key: "kind",
    labelKey: "filterKind",
    type: "single-multi",
    source: "tag",
    values: [
      { value: "bird", labelKey: "kindBird" },
      { value: "dog", labelKey: "kindDog" },
      { value: "architecture", labelKey: "kindArchitecture" },
      { value: "street", labelKey: "kindStreet" },
    ],
  },
  {
    // Alleen bouwstijlen dragen een era-tag, dus deze dimensie verschijnt
    // vanzelf alleen daar (availableFilters kijkt naar de pool). De buckets
    // zijn bewust grof: het gaat om "tijdgenoten herkennen", niet om jaartallen.
    key: "era",
    labelKey: "filterEra",
    type: "single-multi",
    source: "tag",
    values: [
      { value: "medieval", labelKey: "eraMedieval" },
      { value: "early-modern", labelKey: "eraEarlyModern" },
      { value: "s19", labelKey: "era19th" },
      { value: "s1900", labelKey: "era1900" },
      { value: "postwar", labelKey: "eraPostwar" },
    ],
  },
  {
    key: "commonness",
    labelKey: "filterCommonness",
    type: "single-multi",
    source: "tag",
    values: [
      { value: "very_common", labelKey: "commonnessVeryCommon" },
      { value: "common", labelKey: "commonnessCommon" },
      { value: "uncommon", labelKey: "commonnessUncommon" },
      { value: "rare", labelKey: "commonnessRare" },
    ],
  },
  {
    key: "nlStatus",
    labelKey: "filterNlStatus",
    type: "single-multi",
    source: "tag",
    values: [
      { value: "regular", labelKey: "statusRegular" },
      { value: "introduced", labelKey: "statusIntroduced" },
      { value: "accidental", labelKey: "statusAccidental" },
      { value: "pre1800", labelKey: "statusPre1800" },
    ],
  },
  {
    key: "colors",
    labelKey: "filterColor",
    type: "multi-array",
    source: "tag",
    // Swatches make a 12-chip row scannable at a glance instead of a wall of words.
    values: [
      { value: "black", labelKey: "colorBlack", swatch: "#2b2b2b" },
      { value: "white", labelKey: "colorWhite", swatch: "#f6f5f1" },
      { value: "grey", labelKey: "colorGrey", swatch: "#9aa1a1" },
      { value: "brown", labelKey: "colorBrown", swatch: "#8a5a3b" },
      { value: "red", labelKey: "colorRed", swatch: "#c0392b" },
      { value: "orange", labelKey: "colorOrange", swatch: "#e07b2a" },
      { value: "yellow", labelKey: "colorYellow", swatch: "#e6c239" },
      { value: "green", labelKey: "colorGreen", swatch: "#4a8c4a" },
      { value: "blue", labelKey: "colorBlue", swatch: "#3b6fb8" },
      { value: "pink", labelKey: "colorPink", swatch: "#e28fb5" },
      { value: "purple", labelKey: "colorPurple", swatch: "#8055a8" },
      { value: "beige", labelKey: "colorBeige", swatch: "#d9c9a8" },
    ],
  },
  {
    key: "sizeBucket",
    labelKey: "filterSize",
    type: "single-multi",
    source: "tag",
    values: [
      { value: "small", labelKey: "sizeSmall" },
      { value: "medium", labelKey: "sizeMedium" },
      { value: "large", labelKey: "sizeLarge" },
    ],
  },
  {
    key: "family",
    labelKey: "filterFamily",
    type: "single-multi",
    renderAs: "searchable-checklist", // ~80 values: chips would be a wall of buttons
    source: "tag",
    values: [], // filled by populateFamilyValues() once the data has loaded
  },
  {
    key: "favoritesOnly",
    labelKey: "filterFavorites",
    type: "boolean",
    source: "local",
  },
];

/**
 * Family labels come from the data (familyNameNl is the real Dutch common name
 * resolved via nl.wikipedia redirects in build_data.py, not a translation), so
 * they are the one place a { nl, en } label object is legitimate.
 */
export function populateFamilyValues() {
  const def = FILTER_DEFINITIONS.find((d) => d.key === "family");
  const seen = new Map();
  for (const bird of allBirds()) {
    const key = bird.tags?.family;
    if (!key || seen.has(key)) continue;
    // Honden dragen hun FCI-rasgroep als familie ("fci-8"). Die naam staat in
    // data/fci-groups.js en niet in de dataset, want anders zou het
    // buildscript diezelfde tien namen nog een keer moeten kennen.
    const fci = /^fci-(\d{1,2})$/.exec(key);
    if (fci) {
      // Allebei de talen apart, niet twee keer de huidige: dit label wordt één
      // keer bij het opstarten gebouwd en daarna door resolveLabel() gelezen.
      // Zou hier de actieve taal in beide velden staan, dan bleven de
      // rasgroepen na een taalwissel in de opstarttaal hangen.
      const groep = groupByNumber.get(Number(fci[1]));
      seen.set(key, { en: groep?.en ?? key, nl: groep?.nl ?? key });
      continue;
    }
    seen.set(key, {
      en: bird.familyNameEn || key,
      nl: bird.familyNameNl || bird.familyNameEn || key,
    });
  }
  def.values = [...seen.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => resolveLabel(a.label).localeCompare(resolveLabel(b.label)));
}

export function filterLabel(def) {
  return t(def.labelKey);
}

/**
 * De pool waartegen de filterbalk zichzelf samenstelt: alle soorten van het
 * gekozen dier.
 *
 * Alleen op `kind` filteren, niet op de hele selectie. Zou de balk zich naar de
 * volledige selectie voegen, dan verdwijnt elke chip die je net hebt aangevinkt
 * zodra hij de enige overgebleven waarde is -- en kom je er niet meer vanaf.
 * De kind-schakelaar staat er los boven, dus terug kan altijd.
 */
export function kindPool(selection) {
  const kinds = selection?.kind ?? [];
  return kinds.length ? allBirds().filter((b) => kinds.includes(b.tags?.kind)) : allBirds();
}

/**
 * Welke dimensies en waarden zinvol zijn voor `pool`.
 *
 * `nlStatus`, `commonness` en `family` zijn vogelbegrippen; groen en paars zijn
 * geen hondenkleur. In plaats van bij elke dimensie bij te houden voor welk
 * dier hij geldt, kijken we gewoon of ook maar één soort in de huidige pool die
 * waarde heeft. Dat klopt vanzelf voor elk dier dat er later bij komt, en het
 * verbergt ook lege chips binnen een dimensie die verder wel gevuld is.
 *
 * De `kind`-dimensie zelf en boolean-schakelaars blijven altijd staan: die
 * hangen niet aan de pool, en `kind` is juist hoe je de pool verandert.
 */
export function availableFilters(pool) {
  const present = new Map();
  for (const bird of pool) {
    for (const def of FILTER_DEFINITIONS) {
      if (def.type === "boolean") continue;
      const value = bird.tags?.[def.key];
      if (value == null) continue;
      if (!present.has(def.key)) present.set(def.key, new Set());
      const bucket = present.get(def.key);
      if (Array.isArray(value)) value.forEach((v) => bucket.add(v));
      else bucket.add(value);
    }
  }
  return FILTER_DEFINITIONS.filter(
    (def) => def.type === "boolean" || def.key === "kind" || present.has(def.key)
  ).map((def) => {
    if (def.type === "boolean" || def.key === "kind") return def;
    const seen = present.get(def.key);
    return { ...def, values: def.values.filter((v) => seen.has(v.value)) };
  });
}

export function filterValueLabel(def, value) {
  const entry = def.values.find((v) => v.value === value);
  if (!entry) return value;
  return entry.labelKey ? t(entry.labelKey) : resolveLabel(entry.label);
}

// --- Selections -------------------------------------------------------------

/**
 * Selection shape:
 *   { commonness: ["common"], colors: ["black"], favoritesOnly: true,
 *     specificIds: ["Parus major", ...] }
 *
 * `specificIds`, when non-empty, is a hand-picked list from the Custom Game
 * Builder and overrides every tag filter -- it is how a precise "just these
 * species" game is made. Heette `specificBirds` en bevatte soortnamen; die
 * zijn voor vogels gelijk aan het id, dus opgeslagen spellen migreren zonder
 * verlies (de shim staat in games.js).
 */
export function emptySelection() {
  const selection = { specificIds: [] };
  for (const def of FILTER_DEFINITIONS) {
    selection[def.key] = def.type === "boolean" ? false : [];
  }
  return selection;
}

export function cloneSelection(selection) {
  return structuredClone(selection);
}

export function matchesFilters(bird, selection) {
  if (!selection) return true;
  if (selection.specificIds?.length) {
    return selection.specificIds.includes(bird.id);
  }

  for (const def of FILTER_DEFINITIONS) {
    const selected = selection[def.key];
    if (!selected || (Array.isArray(selected) && selected.length === 0)) continue;

    if (def.type === "boolean") {
      if (def.key === "favoritesOnly" && selected === true && !isFavorite(bird)) return false;
      continue;
    }

    const tagValue = bird.tags?.[def.key];
    if (def.type === "multi-array") {
      const values = Array.isArray(tagValue) ? tagValue : [];
      if (!selected.some((v) => values.includes(v))) return false;
    } else if (!selected.includes(tagValue)) {
      return false;
    }
  }
  return true;
}

export function filterBirds(pool, selection) {
  return pool.filter((bird) => matchesFilters(bird, selection));
}

/** Human-readable summary, used to auto-name custom games. */
export function describeSelection(selection) {
  if (selection.specificIds?.length) {
    return `${selection.specificIds.length} ${t("birdsSelected")}`;
  }
  const parts = [];
  for (const def of FILTER_DEFINITIONS) {
    const selected = selection[def.key];
    if (def.type === "boolean") {
      if (selected) parts.push(filterLabel(def));
    } else if (selected?.length) {
      parts.push(selected.map((v) => filterValueLabel(def, v)).join("/"));
    }
  }
  return parts.join(" · ");
}
