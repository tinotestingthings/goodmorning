// ---------------------------------------------------------------------------
// Oefenstatistieken: streak, langste streak, dagdoel en dagteller.
//
// Overgezet uit de losse `progress.js` van de goodmorning-integratie, die op
// de globale STORAGE_KEYS uit de oude app.js leunde. Die global bestaat niet
// meer sinds de herbouw naar modules, waardoor deze sleutel stilzwijgend niet
// meer geschreven werd -- de streak zou bevriezen terwijl de dagelijkse backup
// gewoon groen bleef melden. Nu via storage.js, net als al het andere.
// ---------------------------------------------------------------------------

import { KEYS, read, write } from "./storage.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function defaultStats() {
  return { streak: 0, longest: 0, lastPracticeDate: null, today: { date: null, count: 0, newCount: 0 }, dailyGoal: 10 };
}

export function getStats() {
  const stored = read(KEYS.stats, null);
  return Object.assign(defaultStats(), (stored && typeof stored === "object") ? stored : {});
}

function todayKey(d) {
  const dt = d || new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

/**
 * Eén keer per beantwoorde kaart. Verhoogt de streak de eerste keer dat er op
 * een nieuwe dag geoefend wordt, en telt kaarten mee voor het dagdoel.
 */
export function bumpDailyStat() {
  const s = getStats();
  const today = todayKey();
  if (s.lastPracticeDate !== today) {
    const yesterday = todayKey(new Date(Date.now() - DAY_MS));
    s.streak = s.lastPracticeDate === yesterday ? s.streak + 1 : 1;
    s.longest = Math.max(s.longest || 0, s.streak);
    s.lastPracticeDate = today;
    // s.today wordt hieronder pas ververst, en alleen als het echt een andere
    // dag is: een introkaart (bumpNewToday) kan s.today al op vandaag gezet
    // hebben voordat het eerste antwoord valt, en dat mag de streak-tak niet
    // terug naar nul vegen.
  }
  if (!s.today || s.today.date !== today) s.today = { date: today, count: 0, newCount: 0 };
  s.today.count += 1;
  write(KEYS.stats, s);
  return s;
}

/**
 * Teller voor "nieuwe vogels vandaag geintroduceerd", zodat het dagbudget
 * (session.js) over sessies heen standhoudt: twee sessies op een dag geven
 * samen niet meer nieuwe vogels dan het budget.
 */
export function bumpNewToday() {
  const s = getStats();
  const today = todayKey();
  if (!s.today || s.today.date !== today) s.today = { date: today, count: 0, newCount: 0 };
  s.today.newCount = (s.today.newCount || 0) + 1;
  write(KEYS.stats, s);
}

export function newTodayCount() {
  const s = getStats();
  return s.today && s.today.date === todayKey() ? s.today.newCount || 0 : 0;
}

/** De streak vervalt stil als er een dag wordt overgeslagen; dat hier weerspiegelen. */
export function currentStreak() {
  const s = getStats();
  if (!s.lastPracticeDate) return 0;
  const today = todayKey();
  const yesterday = todayKey(new Date(Date.now() - DAY_MS));
  return (s.lastPracticeDate === today || s.lastPracticeDate === yesterday) ? s.streak : 0;
}
