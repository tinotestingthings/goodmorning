// ---------------------------------------------------------------------------
// Shared progress / SRS data layer.
//
// One place that owns the Leitner store, the practice stats (streak, daily
// goal), and every "how am I doing" selector the UI reads. Study mode, the
// regular quiz, and the special practice games all funnel their answers
// through recordAnswer() so ALL practice counts toward progress -- not just
// the Overhoren drill like before.
//
// Loaded first (before app.js/quiz.js/study.js) so its globals exist by the
// time anything renders. Back-compatible with old {box,dueAt} entries: the
// extra fields (seen/correct/wrong/lastSeen) default to 0 when absent.
// ---------------------------------------------------------------------------

const LEITNER_BOX_COUNT = 5;
// Days until next review when a card moves INTO box N (index 0 unused;
// box 1 is always "due now" after a miss).
const LEITNER_INTERVALS_DAYS = [0, 0, 1, 3, 7, 30];

// Tunable thresholds (boxes 1..5).
const KNOWN_BOX = 2;     // "goed gehad" — answered right at least once
const LEARNED_BOX = 3;   // counts as "geleerd" on the status card
const MASTERED_BOX = 5;  // top box = beheerst
const WEAK_MIN_SEEN = 2; // need a couple of attempts before calling a bird "lastig"
const WEAK_ACCURACY = 0.6; // below this hit-rate => weak

const DAY_MS = 24 * 60 * 60 * 1000;

// ---- Leitner store -------------------------------------------------------

function getLeitnerState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.leitner) || "{}");
  } catch {
    return {};
  }
}

function saveLeitnerState(state) {
  localStorage.setItem(STORAGE_KEYS.leitner, JSON.stringify(state));
}

// Normalised entry with all fields present (old rows only had box+dueAt).
function getBoxInfo(bird, state) {
  const raw = (state || getLeitnerState())[bird.scientificName];
  return {
    box: raw && raw.box ? raw.box : 1,
    dueAt: raw && raw.dueAt ? raw.dueAt : 0,
    seen: raw && raw.seen ? raw.seen : 0,
    correct: raw && raw.correct ? raw.correct : 0,
    wrong: raw && raw.wrong ? raw.wrong : 0,
    lastSeen: raw && raw.lastSeen ? raw.lastSeen : 0,
    started: raw ? true : false,
  };
}

function birdTier(info) {
  if (!info.started) return "fresh";
  if (info.box >= MASTERED_BOX) return "mastered";
  if (info.box >= LEARNED_BOX) return "learned";
  return "learning";
}

// The one function every answer goes through. Updates the box, the review
// date, the per-bird tallies, and the daily streak. Returns an event so the
// caller can build a session summary.
function recordAnswer(bird, knew) {
  const state = getLeitnerState();
  const before = getBoxInfo(bird, state);
  const newBox = knew ? Math.min(LEITNER_BOX_COUNT, before.box + 1) : 1;
  const days = LEITNER_INTERVALS_DAYS[newBox];
  const entry = {
    box: newBox,
    dueAt: Date.now() + days * DAY_MS,
    seen: before.seen + 1,
    correct: before.correct + (knew ? 1 : 0),
    wrong: before.wrong + (knew ? 0 : 1),
    lastSeen: Date.now(),
  };
  state[bird.scientificName] = entry;
  saveLeitnerState(state);
  bumpDailyStat();

  const after = getBoxInfo(bird, state);
  let event = "none";
  if (birdTier(after) === "mastered" && birdTier(before) !== "mastered") event = "mastered";
  else if (after.box >= LEARNED_BOX && before.box < LEARNED_BOX) event = "learned";
  else if (!knew && before.box >= KNOWN_BOX && newBox < KNOWN_BOX) event = "dropped";
  return { before, after, event, knew };
}

// ---- Practice stats: streak + daily goal ---------------------------------

function defaultStats() {
  return { streak: 0, longest: 0, lastPracticeDate: null, today: { date: null, count: 0 }, dailyGoal: 10 };
}

function getStats() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEYS.stats) || "null");
    return Object.assign(defaultStats(), s || {});
  } catch {
    return defaultStats();
  }
}

function saveStats(s) {
  localStorage.setItem(STORAGE_KEYS.stats, JSON.stringify(s));
}

function todayKey(d) {
  const dt = d || new Date();
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
}

// Called once per answered card: advances the streak the first time you
// practise on a new day, and counts cards toward today's goal.
function bumpDailyStat() {
  const s = getStats();
  const today = todayKey();
  if (s.lastPracticeDate !== today) {
    const y = todayKey(new Date(Date.now() - DAY_MS));
    s.streak = s.lastPracticeDate === y ? s.streak + 1 : 1;
    s.longest = Math.max(s.longest || 0, s.streak);
    s.lastPracticeDate = today;
    s.today = { date: today, count: 0 };
  }
  if (!s.today || s.today.date !== today) s.today = { date: today, count: 0 };
  s.today.count += 1;
  saveStats(s);
  return s;
}

// Streak silently lapses if you skip a day; reflect that on read.
function currentStreak() {
  const s = getStats();
  if (!s.lastPracticeDate) return 0;
  const today = todayKey();
  const y = todayKey(new Date(Date.now() - DAY_MS));
  if (s.lastPracticeDate === today || s.lastPracticeDate === y) return s.streak;
  return 0;
}

// ---- Selectors the UI reads ----------------------------------------------

function collectionCounts() {
  const state = getLeitnerState();
  const total = allBirds.length;
  const boxes = [0, 0, 0, 0, 0]; // box 1..5
  let seen = 0, learned = 0, mastered = 0, fresh = 0;
  for (const bird of allBirds) {
    const info = getBoxInfo(bird, state);
    if (!info.started) { fresh += 1; continue; }
    seen += 1;
    boxes[Math.min(info.box, 5) - 1] += 1;
    if (info.box >= MASTERED_BOX) mastered += 1;
    else if (info.box >= LEARNED_BOX) learned += 1;
  }
  return { total, seen, fresh, learned: learned + mastered, mastered, boxes };
}

function dueBirds() {
  const state = getLeitnerState();
  const now = Date.now();
  return allBirds.filter((b) => {
    const info = getBoxInfo(b, state);
    return info.started && info.dueAt <= now && (b.imageUrl || b.imageThumbUrl);
  });
}

function knownPool() {
  const state = getLeitnerState();
  return allBirds.filter((b) => {
    const info = getBoxInfo(b, state);
    return info.started && info.box >= KNOWN_BOX && (b.imageUrl || b.imageThumbUrl);
  });
}

function weakPool() {
  const state = getLeitnerState();
  return allBirds.filter((b) => {
    const info = getBoxInfo(b, state);
    if (!info.started || !(b.imageUrl || b.imageThumbUrl)) return false;
    if (info.seen >= WEAK_MIN_SEEN && info.correct / info.seen < WEAK_ACCURACY) return true;
    if (info.box === 1 && info.wrong > 0) return true;
    return false;
  });
}
