// WijnWijs state: één object onder localStorage-sleutel "wijnwijs-v1".
// boot.js mapt die logische sleutel naar dd:/sbx:-namespaces en synct naar
// Supabase — dit bestand weet daar niets van en praat gewoon met localStorage.
//
// Versie 3 (route B-herbouw, aug 2026). Migratie vanaf v2 behoudt xp, reviews,
// tastings, ignoredIds, dagdoel en niveau. contentQuestions (de oude in-app
// CMS) vervalt: de bank leeft nu als broncode in src/data/questions.js.

const KEY = "wijnwijs-v1";
const VERSION = 3;

const DEFAULTS = {
  version: VERSION,
  activeLevel: "SDEN 2",
  xp: 0,
  streak: 0,
  lastPracticeDate: "",
  dailyGoal: 10,
  reviews: {},      // qid -> {repetitions, interval, ease, due, correct, wrong}
  ignoredIds: [],
  tastings: [],
  practiceLog: {}   // "YYYY-MM-DD" -> aantal beantwoorde vragen die dag
};

let state = load();
const listeners = new Set();
// Een gemigreerde (of kapotte) oude staat meteen wegschrijven, zodat opslag en
// sync-laag nooit een verouderd formaat blijven doorgeven.
if (state.version === VERSION) {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || JSON.parse(raw).version !== VERSION) persist();
  } catch {
    persist();
  }
}

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    const stored = JSON.parse(raw);
    if (!stored || typeof stored !== "object") return { ...DEFAULTS };
    if (stored.version === VERSION) return { ...DEFAULTS, ...stored };
    if (stored.version === 2) return migrateV2(stored);
    return { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

function migrateV2(old) {
  return {
    ...DEFAULTS,
    activeLevel: old.activeLevel === "SDEN 3" || old.activeLevel === "WSET 3"
      ? old.activeLevel : "SDEN 2",
    xp: Number(old.xp) || 0,
    dailyGoal: Number(old.dailyGoal) || 10,
    reviews: old.reviews && typeof old.reviews === "object" ? old.reviews : {},
    ignoredIds: Array.isArray(old.ignoredIds) ? old.ignoredIds : [],
    tastings: Array.isArray(old.tastings) ? old.tastings : [],
    lastPracticeDate: old.lastPracticeDate || ""
    // streak start op 0: de oude teller werd nooit bijgehouden, dus er is
    // geen betrouwbare waarde om over te nemen.
  };
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* opslag vol of geblokkeerd; de app blijft gewoon werken in-memory */
  }
}

export function getState() {
  return state;
}

export function update(fn) {
  state = fn(state) || state;
  persist();
  for (const l of listeners) l(state);
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function replaceState(next) {
  state = { ...DEFAULTS, ...next, version: VERSION };
  persist();
  for (const l of listeners) l(state);
}

export function resetState() {
  replaceState({});
}

// ---- datumhelpers (gedeeld door srs/stats/screens) ----

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function shiftDays(key, delta) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d, 12);
  date.setDate(date.getDate() + delta);
  return todayKey(date);
}

export function formatLongDate(d = new Date()) {
  return new Intl.DateTimeFormat("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(d);
}
