// ---------------------------------------------------------------------------
// The "other name · other name · Scientific name" line, rendered identically
// on cards, in the detail sheet, in the quiz answer and in study mode.
// ---------------------------------------------------------------------------

import { h } from "../core/dom.js";
import { secondaryNameLang, secondaryNames } from "../core/birds.js";

/**
 * The secondary names carry a lang attribute so a screen reader switches
 * pronunciation instead of reading English names with a Dutch voice.
 */
export function nameLine(bird, { className = "sub-names" } = {}) {
  const others = secondaryNames(bird);
  const parts = [];
  for (const name of others) {
    if (parts.length) parts.push(" · ");
    parts.push(h("span", { lang: secondaryNameLang() }, name));
  }
  if (parts.length) parts.push(" · ");
  parts.push(h("em", { lang: "la" }, bird.scientificName));
  return h("p", { class: className }, parts);
}
