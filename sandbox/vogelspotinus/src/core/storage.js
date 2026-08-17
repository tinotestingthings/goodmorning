// ---------------------------------------------------------------------------
// The ONLY module in the app that is allowed to touch localStorage.
//
// Everything persisted goes through read()/write() so that swapping the
// backing store later (IndexedDB, a sync service) is a change to this file
// alone. The eslint config enforces this: `no-restricted-globals` rejects
// `localStorage` everywhere except here.
// ---------------------------------------------------------------------------

export const KEYS = {
  language: "vogelspotinus.language",
  favorites: "vogelspotinus.favorites",
  customGames: "vogelspotinus.customGames",
  theme: "vogelspotinus.theme",
  themeOverrides: "vogelspotinus.themeOverrides",
  leitner: "vogelspotinus.leitner",
  seededDefaults: "vogelspotinus.seededDefaults",
  stats: "vogelspotinus.stats",
};

/**
 * Read a JSON value, falling back to `fallback` on missing/corrupt data.
 *
 * Older builds stored `language`, `theme` and `seededDefaults` as bare strings
 * rather than JSON. Those parse as invalid JSON, so the catch returns the raw
 * string instead of the fallback -- an in-place migration that costs one line
 * and means nobody loses their settings on upgrade. The next write() stores
 * proper JSON and the legacy path stops being taken.
 */
export function read(key, fallback) {
  let raw;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback; // private mode / storage disabled
  }
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return typeof fallback === "string" ? raw : fallback;
  }
}

/** Persist a JSON-serialisable value. Failures (quota, private mode) are non-fatal. */
export function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.warn(`[storage] could not persist ${key}`, err);
    return false;
  }
}
