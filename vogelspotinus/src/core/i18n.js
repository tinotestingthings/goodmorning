// ---------------------------------------------------------------------------
// Language selection and lookup.
//
// t(key)             -- static UI copy from strings.js
// resolveLabel(obj)  -- data-derived labels that cannot live in strings.js
//                       (bird family names, sourced from Wikipedia)
//
// Those two functions are the whole surface. Nothing else formats copy.
// ---------------------------------------------------------------------------

import { KEYS, read, write } from "./storage.js";
import { EVENTS, emit } from "./events.js";
import { LANGUAGES, STRINGS } from "./strings.js";

const DEFAULT_LANGUAGE = "nl";
const FALLBACK_LANGUAGE = "en";

let language = LANGUAGES.includes(read(KEYS.language, DEFAULT_LANGUAGE))
  ? read(KEYS.language, DEFAULT_LANGUAGE)
  : DEFAULT_LANGUAGE;

export function currentLanguage() {
  return language;
}

export function otherLanguage() {
  return language === "nl" ? "en" : "nl";
}

export function setLanguage(lang) {
  if (!LANGUAGES.includes(lang) || lang === language) return;
  language = lang;
  write(KEYS.language, lang);
  document.documentElement.lang = lang;
  applyStaticTranslations();
  emit(EVENTS.languageChanged, lang);
}

/** Look up static UI copy. Falls back to English, then to the key itself. */
export function t(key) {
  return STRINGS[language]?.[key] ?? STRINGS[FALLBACK_LANGUAGE][key] ?? key;
}

/**
 * Resolve a data-derived label of the shape { nl, en }. Used only for values
 * that come out of birds.json (family names) and therefore cannot be listed
 * in strings.js.
 */
export function resolveLabel(labels) {
  if (!labels) return "";
  return labels[language] || labels[FALLBACK_LANGUAGE] || "";
}

/** "123 matching birds" -- rendered in three places, formatted in one. */
export function matchCountText(n) {
  return `${n} ${t("matchingBirds")}`;
}

/**
 * Fill every element in the static HTML frame that declares a translation.
 * The frame (index.html) owns layout; JS owns dynamic content. Static copy is
 * marked up with data-i18n* attributes rather than being set from JS by id.
 */
export function applyStaticTranslations(root = document) {
  for (const el of root.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of root.querySelectorAll("[data-i18n-placeholder]")) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
  for (const el of root.querySelectorAll("[data-i18n-label]")) {
    el.setAttribute("aria-label", t(el.dataset.i18nLabel));
  }
}

/**
 * Dev-only guard against the two tables drifting apart. Missing keys used to
 * be invisible until a user switched language and saw a raw key on screen.
 */
export function assertStringTablesMatch() {
  const [base, ...rest] = LANGUAGES;
  const baseKeys = new Set(Object.keys(STRINGS[base]));
  for (const lang of rest) {
    const keys = new Set(Object.keys(STRINGS[lang]));
    const missing = [...baseKeys].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !baseKeys.has(k));
    if (missing.length || extra.length) {
      console.warn(`[i18n] "${lang}" drifted from "${base}"`, { missing, extra });
    }
  }
}
