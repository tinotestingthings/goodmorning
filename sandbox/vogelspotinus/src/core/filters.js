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

/**
 * type:
 *   "single-multi" -- bird has ONE tag value; any number may be selected (OR)
 *   "multi-array"  -- bird has an ARRAY of values; match on any overlap
 *   "boolean"      -- an on/off switch backed by local state, not by tag data
 */
export const FILTER_DEFINITIONS = [
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

export function filterValueLabel(def, value) {
  const entry = def.values.find((v) => v.value === value);
  if (!entry) return value;
  return entry.labelKey ? t(entry.labelKey) : resolveLabel(entry.label);
}

// --- Selections -------------------------------------------------------------

/**
 * Selection shape:
 *   { commonness: ["common"], colors: ["black"], favoritesOnly: true,
 *     specificBirds: ["Parus major", ...] }
 *
 * `specificBirds`, when non-empty, is a hand-picked list from the Custom Game
 * Builder and overrides every tag filter -- it is how a precise "just these
 * species" game is made.
 */
export function emptySelection() {
  const selection = { specificBirds: [] };
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
  if (selection.specificBirds?.length) {
    return selection.specificBirds.includes(bird.scientificName);
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
  if (selection.specificBirds?.length) {
    return `${selection.specificBirds.length} ${t("birdsSelected")}`;
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
