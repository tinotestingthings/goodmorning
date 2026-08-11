// ---------------------------------------------------------------------------
// Shared state: i18n, storage, data loading, generic filter engine, navigation.
// browse.js / quiz.js / custom-games.js build on top of what's defined here.
// ---------------------------------------------------------------------------

// Logical storage keys. When embedded as a goodmorning utility app, boot.js
// installs a Storage shim that maps these to environment-namespaced physical
// keys (dd:vogelspotinus.* live / sbx:vogelspotinus.* sandbox) and syncs them
// to the per-user vogelspotinus_state row — same pattern as the other utility
// apps. Standalone (no boot.js), these keys are used as-is. Keep them logical.
const STORAGE_KEYS = {
  language: "vogelspotinus.language",
  favorites: "vogelspotinus.favorites",
  customGames: "vogelspotinus.customGames",
  theme: "vogelspotinus.theme",
  themeOverrides: "vogelspotinus.themeOverrides",
  leitner: "vogelspotinus.leitner",
  stats: "vogelspotinus.stats",
  seededDefaults: "vogelspotinus.seededDefaults",
};

const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#dedad0"/><text x="50%" y="50%" font-size="18" fill="#5c6b5c" text-anchor="middle" dy=".3em">No photo</text></svg>'
  );

// Renders a reference into the shared <symbol> sprite defined in index.html --
// the single icon system used everywhere instead of emoji, see the sprite's
// comment for the full list. `cls` can add e.g. "icon-fill" for solid icons.
function icon(name, cls) {
  return `<svg class="icon ${cls || ""}"><use href="#icon-${name}"></use></svg>`;
}

// ---------------------------------------------------------------------------
// i18n
// ---------------------------------------------------------------------------

const STRINGS = {
  nl: {
    home: "Home",
    browse: "Bladeren",
    quiz: "Quiz",
    settings: "Instellingen",
    yourGames: "Jouw spellen",
    searchPlaceholder: "Zoek op Nederlandse, Engelse of wetenschappelijke naam...",
    noResults: "Geen vogels gevonden.",
    typeAnswer: "Typ het antwoord",
    multipleChoice: "Meerkeuze",
    playCall: "Speel geluid af",
    check: "Controleer",
    reveal: "Toon antwoord",
    nextBird: "Volgende vogel",
    customGame: "Eigen spel maken",
    gameMode: "Speltype",
    quizTypeAnswer: "Quiz - typ het antwoord",
    quizMultipleChoice: "Quiz - meerkeuze",
    gameName: "Naam van het spel",
    saveGame: "Opslaan",
    cancel: "Annuleren",
    language: "Taal",
    newCustomGame: "+ Nieuw spel",
    browseTile: "Bladeren",
    browseTileDesc: "Doorzoek alle vogels",
    quizTile: "Quiz",
    quizTileDesc: "Test jezelf",
    correct: "Goed!",
    wrong: "Helaas, niet goed.",
    scoreLabel: "Score",
    origin: "Herkomst",
    statusInNl: "Status in NL",
    habitat: "Leefgebied",
    length: "Lengte",
    conservationStatus: "IUCN-status",
    fact: "Wist je dat...",
    moreInfo: "Meer informatie",
    wikipediaEn: "Wikipedia (EN)",
    wikipediaNl: "Wikipedia (NL)",
    listenCommons: "Beluister (Wikimedia Commons)",
    listenXenoCanto: "Beluister (Xeno-canto)",
    matchingBirds: "overeenkomende vogels",
    deleteGame: "Verwijderen",
    edit: "Bewerken",
    favoritesOnly: "Alleen favorieten",
    noPhotoAvailable: "Geen foto beschikbaar",
    all: "Alles",
    clearSelection: "Wissen",
    options: "Opties",
    close: "Sluiten",
    study: "Overhoren",
    studyTileDesc: "Officieel overhoren met herhaling",
    knewIt: "Wist ik!",
    didntKnowIt: "Wist ik niet",
    tapToReveal: "Tik om het antwoord te tonen",
    studyNew: "nieuw",
    studyReviewing: "in herhaling",
    studyMastered: "geleerd",
    studyDone: "Niets meer te overhoren in deze selectie. Goed bezig!",
    statHeading: "Jouw voortgang",
    statLearnedOf: "geleerd",
    statOf: "van",
    statMastered: "beheerst",
    statStreak: "dagen op rij",
    statStreakOne: "dag",
    statDue: "te herhalen vandaag",
    statReviewNow: "Herhaal nu",
    statAllCaughtUp: "Niets te herhalen vandaag — top!",
    distNew: "nieuw",
    distMastered: "beheerst",
    tileReviewTitle: "Herhalen",
    tileReviewDesc: "Kaarten die vandaag terugkomen",
    tileMasteryTitle: "Goed gehad",
    tileMasteryDesc: "Oefen vogels die je al kent",
    tileWeakTitle: "Lastige vogels",
    tileWeakDesc: "Oefen wat je vaak fout had",
    sessSeen: "gezien",
    sessCorrect: "goed",
    sessLearned: "nieuw geleerd",
    sessMastered: "nieuw beheerst",
    sessDropped: "teruggezakt",
    sessDone: "Sessie klaar — goed bezig!",
    emptyPoolMsg: "Nog geen vogels hier — oefen eerst wat in de quiz.",
    badgeFresh: "nieuw",
    badgeLearning: "lerend",
    badgeLearned: "geleerd",
    badgeMastered: "beheerst",
    badgeDue: "te herhalen",
    filterByTags: "Filter op kenmerken",
    pickSpecificBirds: "Kies specifieke vogels",
    searchBirdsPlaceholder: "Zoek een vogel om toe te voegen...",
    birdsSelected: "geselecteerde vogels",
    theme: "Thema",
    themeStandard: "Standaard",
    themeNight: "Nacht",
    themePlayful: "Speels",
    themeBirder: "Vogelaar",
    stopSound: "Stop geluid",
    customizeTheme: "Pas thema aan",
    resetTheme: "Terugzetten naar standaard",
    itemsSelected: "geselecteerd",
    searchGeneric: "Zoeken...",
    themeVarBg: "Achtergrond",
    themeVarSurface: "Kaarten",
    themeVarText: "Tekst",
    themeVarMuted: "Gedempte tekst",
    themeVarAccent: "Accentkleur",
    "themeVarAccent-contrast": "Tekst op accent",
    themeVarBorder: "Randen",
  },
  en: {
    home: "Home",
    browse: "Browse",
    quiz: "Quiz",
    settings: "Settings",
    yourGames: "Your games",
    searchPlaceholder: "Search Dutch, English or scientific name...",
    noResults: "No birds match your search.",
    typeAnswer: "Type the answer",
    multipleChoice: "Multiple choice",
    playCall: "Play call",
    check: "Check",
    reveal: "Reveal",
    nextBird: "Next bird",
    customGame: "Custom Game Builder",
    gameMode: "Game mode",
    quizTypeAnswer: "Quiz - type the answer",
    quizMultipleChoice: "Quiz - multiple choice",
    gameName: "Game name",
    saveGame: "Save",
    cancel: "Cancel",
    language: "Language",
    newCustomGame: "+ New game",
    browseTile: "Browse",
    browseTileDesc: "Search all birds",
    quizTile: "Quiz",
    quizTileDesc: "Test yourself",
    correct: "Correct!",
    wrong: "Not quite.",
    scoreLabel: "Score",
    origin: "Origin",
    statusInNl: "Status in NL",
    habitat: "Habitat",
    length: "Length",
    conservationStatus: "IUCN status",
    fact: "Did you know...",
    moreInfo: "More info",
    wikipediaEn: "Wikipedia (EN)",
    wikipediaNl: "Wikipedia (NL)",
    listenCommons: "Listen (Wikimedia Commons)",
    listenXenoCanto: "Listen (Xeno-canto)",
    matchingBirds: "matching birds",
    deleteGame: "Delete",
    edit: "Edit",
    favoritesOnly: "Favorites only",
    noPhotoAvailable: "No photo available",
    all: "All",
    clearSelection: "Clear",
    options: "Options",
    close: "Close",
    study: "Study",
    studyTileDesc: "Official spaced-repetition drilling",
    knewIt: "Knew it!",
    didntKnowIt: "Didn't know it",
    tapToReveal: "Tap to reveal the answer",
    studyNew: "new",
    studyReviewing: "reviewing",
    studyMastered: "mastered",
    studyDone: "Nothing left to study in this selection. Nice work!",
    statHeading: "Your progress",
    statLearnedOf: "learned",
    statOf: "of",
    statMastered: "mastered",
    statStreak: "day streak",
    statStreakOne: "day streak",
    statDue: "due for review today",
    statReviewNow: "Review now",
    statAllCaughtUp: "Nothing due today — nice!",
    distNew: "new",
    distMastered: "mastered",
    tileReviewTitle: "Review",
    tileReviewDesc: "Cards that come back today",
    tileMasteryTitle: "Got right",
    tileMasteryDesc: "Practise birds you already know",
    tileWeakTitle: "Tricky birds",
    tileWeakDesc: "Drill the ones you keep missing",
    sessSeen: "seen",
    sessCorrect: "correct",
    sessLearned: "newly learned",
    sessMastered: "newly mastered",
    sessDropped: "dropped",
    sessDone: "Session done — nice work!",
    emptyPoolMsg: "No birds here yet — practise in the quiz first.",
    badgeFresh: "new",
    badgeLearning: "learning",
    badgeLearned: "learned",
    badgeMastered: "mastered",
    badgeDue: "due",
    filterByTags: "Filter by attributes",
    pickSpecificBirds: "Pick specific birds",
    searchBirdsPlaceholder: "Search a bird to add...",
    birdsSelected: "birds selected",
    theme: "Theme",
    themeStandard: "Standard",
    themeNight: "Night",
    themePlayful: "Playful",
    themeBirder: "Birder",
    stopSound: "Stop sound",
    customizeTheme: "Customize theme",
    resetTheme: "Reset to default",
    itemsSelected: "selected",
    searchGeneric: "Search...",
    themeVarBg: "Background",
    themeVarSurface: "Cards",
    themeVarText: "Text",
    themeVarMuted: "Muted text",
    themeVarAccent: "Accent color",
    "themeVarAccent-contrast": "Text on accent",
    themeVarBorder: "Borders",
  },
};

let currentLanguage = localStorage.getItem(STORAGE_KEYS.language) || "nl";

function t(key) {
  return (STRINGS[currentLanguage] && STRINGS[currentLanguage][key]) || STRINGS.en[key] || key;
}

function setLanguage(lang) {
  currentLanguage = lang;
  localStorage.setItem(STORAGE_KEYS.language, lang);
  document.documentElement.lang = lang;
  applyStaticTranslations();
  refreshCurrentScreen();
}

function applyStaticTranslations() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.placeholder = t(el.getAttribute("data-i18n-placeholder"));
  });
  document.getElementById("lang-nl").classList.toggle("active", currentLanguage === "nl");
  document.getElementById("lang-en").classList.toggle("active", currentLanguage === "en");
  renderThemeSwitch();
}

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

const THEMES = [
  { value: "standard", labelKey: "themeStandard" },
  { value: "night", labelKey: "themeNight" },
  { value: "playful", labelKey: "themePlayful" },
  { value: "birder", labelKey: "themeBirder" },
];

// The set of CSS custom properties a theme can be customized on. Plain
// get/set storage functions -- deliberately no localStorage specifics leak
// past these two, so swapping them for Supabase calls later is self-contained.
const THEMEABLE_VARS = ["bg", "surface", "text", "muted", "accent", "accent-contrast", "border"];

function currentThemeName() {
  return localStorage.getItem(STORAGE_KEYS.theme) || "standard";
}

function getThemeOverrides() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.themeOverrides) || "{}");
  } catch {
    return {};
  }
}

function saveThemeOverride(theme, cssVar, value) {
  const all = getThemeOverrides();
  all[theme] = { ...(all[theme] || {}), [cssVar]: value };
  localStorage.setItem(STORAGE_KEYS.themeOverrides, JSON.stringify(all));
  applyThemeOverrides(theme);
}

function resetThemeOverrides(theme) {
  const all = getThemeOverrides();
  delete all[theme];
  localStorage.setItem(STORAGE_KEYS.themeOverrides, JSON.stringify(all));
  applyThemeOverrides(theme);
  renderThemeCustomizer();
}

function applyThemeOverrides(theme) {
  for (const v of THEMEABLE_VARS) document.documentElement.style.removeProperty(`--${v}`);
  const overrides = getThemeOverrides()[theme] || {};
  for (const [v, value] of Object.entries(overrides)) {
    document.documentElement.style.setProperty(`--${v}`, value);
  }
}

function setTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.theme, theme);
  document.documentElement.dataset.theme = theme;
  applyThemeOverrides(theme);
  renderThemeSwitch();
}

function renderThemeSwitch() {
  const container = document.getElementById("theme-switch");
  if (!container) return;
  const current = currentThemeName();
  container.innerHTML = "";
  for (const theme of THEMES) {
    const btn = document.createElement("button");
    btn.className = "chip" + (theme.value === current ? " active" : "");
    btn.textContent = t(theme.labelKey);
    btn.addEventListener("click", () => setTheme(theme.value));
    container.appendChild(btn);
  }
  renderThemeCustomizer();
}

// Theme CSS variables are authored as plain #hex literals, so
// getComputedStyle on the custom property returns that literal string
// unresolved (unlike normal properties, which come back as rgb(...)) --
// only fall back to parsing rgb(...) if it's ever set that way instead.
function cssColorToHex(value) {
  const trimmed = (value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  const nums = trimmed.match(/\d+/g);
  if (!nums || nums.length < 3) return "#000000";
  return (
    "#" +
    nums
      .slice(0, 3)
      .map((n) => Math.max(0, Math.min(255, parseInt(n, 10))).toString(16).padStart(2, "0"))
      .join("")
  );
}

function renderThemeCustomizer() {
  const container = document.getElementById("theme-customizer");
  if (!container) return;
  const theme = currentThemeName();
  const overrides = getThemeOverrides()[theme] || {};
  container.innerHTML = "";

  for (const cssVar of THEMEABLE_VARS) {
    const row = document.createElement("div");
    row.className = "theme-var-row";
    const currentValue =
      overrides[cssVar] ||
      cssColorToHex(getComputedStyle(document.documentElement).getPropertyValue(`--${cssVar}`));
    const label = document.createElement("label");
    label.textContent = t(`themeVar${cssVar[0].toUpperCase()}${cssVar.slice(1)}`);
    const input = document.createElement("input");
    input.type = "color";
    input.value = currentValue;
    input.addEventListener("input", () => saveThemeOverride(theme, cssVar, input.value));
    row.appendChild(label);
    row.appendChild(input);
    container.appendChild(row);
  }

  const resetBtn = document.createElement("button");
  resetBtn.className = "secondary";
  resetBtn.textContent = t("resetTheme");
  resetBtn.addEventListener("click", () => resetThemeOverrides(theme));
  container.appendChild(resetBtn);
}

// Bilingual per-bird field, falling back to the other language rather than
// ever showing a blank when data exists in just one language.
function bf(bird, field) {
  const primary = bird[`${field}_${currentLanguage}`];
  if (primary) return primary;
  const other = currentLanguage === "nl" ? "en" : "nl";
  return bird[`${field}_${other}`] || null;
}

function displayDutchName(bird) {
  if (!bird.dutchName) return null;
  return bird.dutchName.replace(/\s*\((vogel|dier|geslacht)\)\s*$/i, "");
}

function primaryName(bird) {
  if (currentLanguage === "nl") return displayDutchName(bird) || bird.englishName;
  return bird.englishName || displayDutchName(bird);
}

function secondaryNames(bird) {
  const dutch = displayDutchName(bird);
  if (currentLanguage === "nl") return [bird.englishName].filter(Boolean);
  return [dutch].filter(Boolean);
}

// ---------------------------------------------------------------------------
// Storage helpers
// ---------------------------------------------------------------------------

function getFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEYS.favorites) || "[]"));
  } catch {
    return new Set();
  }
}

function isFavorite(bird) {
  return getFavorites().has(bird.scientificName);
}

function toggleFavorite(bird) {
  const favs = getFavorites();
  if (favs.has(bird.scientificName)) favs.delete(bird.scientificName);
  else favs.add(bird.scientificName);
  localStorage.setItem(STORAGE_KEYS.favorites, JSON.stringify([...favs]));
}

function getCustomGames() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.customGames) || "[]");
  } catch {
    return [];
  }
}

function saveCustomGame(game) {
  const games = getCustomGames();
  const idx = games.findIndex((g) => g.id === game.id);
  if (idx >= 0) games[idx] = game;
  else games.push(game);
  localStorage.setItem(STORAGE_KEYS.customGames, JSON.stringify(games));
}

function deleteCustomGame(id) {
  const games = getCustomGames().filter((g) => g.id !== id);
  localStorage.setItem(STORAGE_KEYS.customGames, JSON.stringify(games));
}

// Seeded custom game: every distinct bird appearing in either monthly
// luistervink.nl Griftpark top-list the user pasted in (deduplicated, order/
// counts ignored), checked against the dataset by Dutch name -- all 42 were
// already present (one, "Vink", only matched after stripping the Wikipedia
// "(vogel)" disambiguator the same way displayDutchName() does for display).
// Versioned so pushing an updated species list migrates existing users'
// already-seeded game instead of leaving it stale forever.
const SEEDED_DEFAULTS_VERSION = "2";
const GRIFTPARK_ALL = [
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

function seedDefaultGamesIfNeeded() {
  const seededVersion = localStorage.getItem(STORAGE_KEYS.seededDefaults);
  if (seededVersion === SEEDED_DEFAULTS_VERSION) return;

  if (!seededVersion) {
    // brand-new install: nothing to migrate away from
  } else if (Number(seededVersion) < 2) {
    deleteCustomGame("griftpark-top20"); // superseded by the full list below
  }

  const griftpark = {
    id: "griftpark-all",
    name: "Griftpark",
    gameMode: "quiz-choice",
    filters: { ...emptyFilterSelection(), specificBirds: [...GRIFTPARK_ALL] },
  };
  if (!getCustomGames().some((g) => g.id === griftpark.id)) {
    saveCustomGame(griftpark);
  }
  localStorage.setItem(STORAGE_KEYS.seededDefaults, SEEDED_DEFAULTS_VERSION);
}

// ---------------------------------------------------------------------------
// Generic filter/tag engine
//
// One declarative registry + one predicate function drives Browse's filter
// bar, Quiz's filter bar, and the Custom Game Builder -- add a dimension here
// (and, for data-derived ones, in build_data.py's `tags` object) and every
// surface that uses FILTER_DEFINITIONS picks it up automatically.
// ---------------------------------------------------------------------------

const FILTER_DEFINITIONS = [
  {
    key: "commonness",
    label: { nl: "Hoe vaak gezien", en: "Commonness" },
    type: "single-multi", // any number of values may be selected, OR'd together
    source: "tag",
    values: [
      { value: "very_common", label: { nl: "Zeer algemeen", en: "Very common" } },
      { value: "common", label: { nl: "Algemeen", en: "Common" } },
      { value: "uncommon", label: { nl: "Minder algemeen", en: "Uncommon" } },
      { value: "rare", label: { nl: "Zeldzaam / dwaalgast", en: "Rare / vagrant" } },
    ],
  },
  {
    key: "nlStatus",
    label: { nl: "Status in NL", en: "Status in NL" },
    type: "single-multi",
    source: "tag",
    values: [
      { value: "regular", label: { nl: "Regelmatig", en: "Regular" } },
      { value: "introduced", label: { nl: "Geïntroduceerd", en: "Introduced" } },
      { value: "accidental", label: { nl: "Dwaalgast", en: "Accidental" } },
      { value: "pre1800", label: { nl: "Voor 1800", en: "Before 1800" } },
    ],
  },
  {
    key: "colors",
    label: { nl: "Kleur", en: "Color" },
    type: "multi-array", // bird has an ARRAY of values; match if any overlap
    source: "tag",
    values: [
      { value: "black", label: { nl: "Zwart", en: "Black" } },
      { value: "white", label: { nl: "Wit", en: "White" } },
      { value: "grey", label: { nl: "Grijs", en: "Grey" } },
      { value: "brown", label: { nl: "Bruin", en: "Brown" } },
      { value: "red", label: { nl: "Rood", en: "Red" } },
      { value: "orange", label: { nl: "Oranje", en: "Orange" } },
      { value: "yellow", label: { nl: "Geel", en: "Yellow" } },
      { value: "green", label: { nl: "Groen", en: "Green" } },
      { value: "blue", label: { nl: "Blauw", en: "Blue" } },
      { value: "pink", label: { nl: "Roze", en: "Pink" } },
      { value: "purple", label: { nl: "Paars", en: "Purple" } },
      { value: "beige", label: { nl: "Beige", en: "Beige" } },
    ],
  },
  {
    key: "sizeBucket",
    label: { nl: "Grootte", en: "Size" },
    type: "single-multi",
    source: "tag",
    values: [
      { value: "small", label: { nl: "Klein (<20cm)", en: "Small (<20cm)" } },
      { value: "medium", label: { nl: "Middelgroot (20-50cm)", en: "Medium (20-50cm)" } },
      { value: "large", label: { nl: "Groot (>50cm)", en: "Large (>50cm)" } },
    ],
  },
  {
    key: "family",
    label: { nl: "Familie", en: "Family" },
    type: "single-multi",
    renderAs: "searchable-checklist",
    source: "tag",
    values: [], // populated from the data once loaded -- see populateFamilyFilterValues()
  },
  {
    key: "favoritesOnly",
    label: { nl: "Favorieten", en: "Favorites" },
    type: "boolean",
    source: "local",
  },
];

function populateFamilyFilterValues() {
  const familyDef = FILTER_DEFINITIONS.find((d) => d.key === "family");
  const seen = new Map();
  for (const b of allBirds) {
    const key = b.tags && b.tags.family;
    if (key && !seen.has(key)) {
      // familyNameNl is the REAL Dutch common name (resolved via nl.wikipedia
      // redirects in build_data.py -- e.g. "Eendachtigen"), not a translation.
      seen.set(key, { en: b.familyNameEn || key, nl: b.familyNameNl || b.familyNameEn || key });
    }
  }
  familyDef.values = [...seen.entries()]
    .sort((a, b) => a[1].nl.localeCompare(b[1].nl))
    .map(([value, label]) => ({ value, label }));
}

function filterLabel(def) {
  return def.label[currentLanguage] || def.label.en;
}

function filterValueLabel(def, value) {
  const found = def.values.find((v) => v.value === value);
  return found ? found.label[currentLanguage] || found.label.en : value;
}

// selection shape: { commonness: ["very_common","common"], colors: ["black"], favoritesOnly: true, ... }
// `specificBirds`, when present and non-empty, is a hand-picked list of exact
// scientific names from the Custom Game Builder and overrides every tag
// filter entirely (it's how a precise "just these species" game is made).
function matchesFilters(bird, selection) {
  if (!selection) return true;
  if (selection.specificBirds && selection.specificBirds.length) {
    return selection.specificBirds.includes(bird.scientificName);
  }
  for (const def of FILTER_DEFINITIONS) {
    const selected = selection[def.key];
    if (!selected || (Array.isArray(selected) && selected.length === 0)) continue;

    if (def.source === "local" && def.key === "favoritesOnly") {
      if (selected === true && !isFavorite(bird)) return false;
      continue;
    }

    const tagValue = bird.tags ? bird.tags[def.key] : undefined;
    if (def.type === "multi-array") {
      const birdValues = Array.isArray(tagValue) ? tagValue : [];
      if (!selected.some((v) => birdValues.includes(v))) return false;
    } else {
      if (!selected.includes(tagValue)) return false;
    }
  }
  return true;
}

function emptyFilterSelection() {
  const sel = { specificBirds: [] };
  for (const def of FILTER_DEFINITIONS) {
    sel[def.key] = def.type === "boolean" ? false : [];
  }
  return sel;
}

function describeFilterSelection(selection) {
  if (selection.specificBirds && selection.specificBirds.length) {
    return `${selection.specificBirds.length} ${t("birdsSelected")}`;
  }
  const parts = [];
  for (const def of FILTER_DEFINITIONS) {
    const selected = selection[def.key];
    if (def.type === "boolean") {
      if (selected) parts.push(filterLabel(def));
    } else if (selected && selected.length) {
      parts.push(selected.map((v) => filterValueLabel(def, v)).join("/"));
    }
  }
  return parts.join(" · ");
}

// Renders a generic filter bar into `container` for the given selection
// object, calling onChange(selection) whenever something is toggled. The bar
// re-renders itself on every change so the active/inactive state visibly
// tracks whatever was just clicked, regardless of what onChange itself does.
function renderFilterBar(container, selection, onChange) {
  const rerenderAndNotify = () => {
    renderFilterBar(container, selection, onChange);
    onChange(selection);
  };

  container.innerHTML = "";
  for (const def of FILTER_DEFINITIONS) {
    const group = document.createElement("div");
    group.className = "filter-group";
    const title = document.createElement("div");
    title.className = "filter-group-title";
    title.textContent = filterLabel(def);
    group.appendChild(title);

    if (def.type === "boolean") {
      const chipRow = document.createElement("div");
      chipRow.className = "chip-row";
      const chip = document.createElement("button");
      chip.className = "chip" + (selection[def.key] ? " active" : "");
      chip.innerHTML = icon("star") + " " + filterLabel(def);
      chip.addEventListener("click", () => {
        selection[def.key] = !selection[def.key];
        rerenderAndNotify();
      });
      chipRow.appendChild(chip);
      group.appendChild(chipRow);
    } else if (def.renderAs === "searchable-checklist") {
      // A search box over a scrollable checkbox list -- for high-cardinality
      // dimensions (e.g. ~80 bird families) where a chip row would be a wall
      // of buttons and a native <select multiple> is unfriendly on touch.
      // Checkboxes update their own visual state natively, so this branch
      // avoids the full-bar rerenderAndNotify() (which would wipe the search
      // text and scroll position on every click) and just patches the count.
      const wrap = document.createElement("div");
      wrap.className = "searchable-checklist";

      const summary = document.createElement("div");
      summary.className = "count-line";
      const updateSummary = () => {
        const n = (selection[def.key] || []).length;
        summary.textContent = n ? `${n} ${t("itemsSelected")}` : t("all");
      };
      updateSummary();
      wrap.appendChild(summary);

      const searchInput = document.createElement("input");
      searchInput.type = "text";
      searchInput.placeholder = t("searchGeneric");
      wrap.appendChild(searchInput);

      const list = document.createElement("div");
      list.className = "bird-pick-list";
      wrap.appendChild(list);

      const renderList = () => {
        const query = searchInput.value.trim().toLowerCase();
        list.innerHTML = "";
        for (const v of def.values) {
          const label = v.label[currentLanguage] || v.label.en;
          if (query && !label.toLowerCase().includes(query)) continue;
          const row = document.createElement("label");
          row.className = "bird-pick-row";
          const checked = (selection[def.key] || []).includes(v.value);
          row.innerHTML = `<input type="checkbox" ${checked ? "checked" : ""} /><span>${label}</span>`;
          row.querySelector("input").addEventListener("change", (e) => {
            const cur = selection[def.key] || [];
            selection[def.key] = e.target.checked ? [...cur, v.value] : cur.filter((x) => x !== v.value);
            updateSummary();
            onChange(selection);
          });
          list.appendChild(row);
        }
      };
      searchInput.addEventListener("input", renderList);
      renderList();
      group.appendChild(wrap);
    } else {
      const chipRow = document.createElement("div");
      chipRow.className = "chip-row";
      const current = selection[def.key] || [];

      const allChip = document.createElement("button");
      allChip.className = "chip" + (current.length === 0 ? " active" : "");
      allChip.textContent = t("all");
      allChip.addEventListener("click", () => {
        selection[def.key] = [];
        rerenderAndNotify();
      });
      chipRow.appendChild(allChip);

      for (const v of def.values) {
        const chip = document.createElement("button");
        const active = current.includes(v.value);
        chip.className = "chip" + (active ? " active" : "");
        chip.textContent = v.label[currentLanguage] || v.label.en;
        chip.addEventListener("click", () => {
          const cur = selection[def.key] || [];
          selection[def.key] = active ? cur.filter((x) => x !== v.value) : [...cur, v.value];
          rerenderAndNotify();
        });
        chipRow.appendChild(chip);
      }
      group.appendChild(chipRow);
    }
    container.appendChild(group);
  }
}

// ---------------------------------------------------------------------------
// Data loading
// ---------------------------------------------------------------------------

let allBirds = [];

async function loadBirds() {
  const res = await fetch("data/birds.json");
  allBirds = await res.json();
  populateFamilyFilterValues();
}

// ---------------------------------------------------------------------------
// Fullscreen photo viewer (shared by browse + quiz)
// ---------------------------------------------------------------------------

function openFullscreenImage(url) {
  if (!url) return;
  document.getElementById("fullscreen-image").src = url;
  document.getElementById("fullscreen-viewer").classList.remove("hidden");
}

function closeFullscreenImage() {
  document.getElementById("fullscreen-viewer").classList.add("hidden");
}

// ---------------------------------------------------------------------------
// Sound playback (shared) -- one active-sound owner around the single
// <audio> element, so any button anywhere can toggle play/stop and the
// previously-playing button (wherever it is) gets told to reset itself.
// ---------------------------------------------------------------------------

let activeSoundBird = null;
let activeSoundReset = null;

function stopBirdSound() {
  const player = document.getElementById("sound-player");
  player.pause();
  if (activeSoundReset) activeSoundReset();
  activeSoundBird = null;
  activeSoundReset = null;
}

// onStateChange(isPlaying) lets the caller flip its own button's icon/label.
function toggleBirdSound(bird, onStateChange) {
  if (!bird.soundUrl) return;
  const player = document.getElementById("sound-player");
  if (activeSoundBird === bird) {
    stopBirdSound();
    return;
  }
  stopBirdSound();
  player.src = bird.soundUrl;
  player.currentTime = 0;
  player.play().catch(() => {});
  activeSoundBird = bird;
  activeSoundReset = () => onStateChange(false);
  onStateChange(true);
}

// ---------------------------------------------------------------------------
// Navigation between screens
// ---------------------------------------------------------------------------

let currentScreen = "home";
let activeGameContext = null; // set when launching a custom game: {filters, gameMode}

function showScreen(screen, context) {
  stopBirdSound();
  currentScreen = screen;
  activeGameContext = context || null;
  document.querySelectorAll(".screen").forEach((el) => {
    el.style.display = el.id === `screen-${screen}` ? "block" : "none";
  });
  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.screen === screen);
  });
  refreshCurrentScreen();
}

function refreshCurrentScreen() {
  if (currentScreen === "home" && typeof renderHome === "function") renderHome();
  if (currentScreen === "browse" && typeof renderBrowseScreen === "function") renderBrowseScreen();
  if (currentScreen === "quiz" && typeof renderQuizScreen === "function") renderQuizScreen();
  if (currentScreen === "builder" && typeof renderBuilderScreen === "function") renderBuilderScreen();
}

// ---------------------------------------------------------------------------
// Home screen (built-in tiles are the only always-present ones -- custom
// game tiles come from custom-games.js)
// ---------------------------------------------------------------------------

function renderHome() {
  renderProgressCard();
  const tiles = document.getElementById("home-tiles");
  tiles.innerHTML = "";

  const browseTile = document.createElement("button");
  browseTile.className = "tile";
  browseTile.innerHTML = `<span class="tile-icon">${icon("book")}</span><span class="tile-title">${t("browseTile")}</span><span class="tile-desc">${t("browseTileDesc")}</span>`;
  browseTile.addEventListener("click", () => showScreen("browse"));

  const quizTile = document.createElement("button");
  quizTile.className = "tile";
  quizTile.innerHTML = `<span class="tile-icon">${icon("target")}</span><span class="tile-title">${t("quizTile")}</span><span class="tile-desc">${t("quizTileDesc")}</span>`;
  quizTile.addEventListener("click", () => showScreen("quiz"));

  const practiceDefs = [
    { icon: "list-check", title: t("tileReviewTitle"), desc: t("tileReviewDesc"), fn: startReviewDue },
    { icon: "check", title: t("tileMasteryTitle"), desc: t("tileMasteryDesc"), fn: startMastery },
    { icon: "target", title: t("tileWeakTitle"), desc: t("tileWeakDesc"), fn: startWeak },
  ];
  for (const d of practiceDefs) {
    const tile = document.createElement("button");
    tile.className = "tile";
    tile.innerHTML = `<span class="tile-icon">${icon(d.icon)}</span><span class="tile-title">${d.title}</span><span class="tile-desc">${d.desc}</span>`;
    tile.addEventListener("click", d.fn);
    tiles.appendChild(tile);
  }

  const newGameTile = document.createElement("button");
  newGameTile.className = "tile tile-new";
  newGameTile.innerHTML = `<span class="tile-icon">${icon("plus")}</span><span class="tile-title">${t("newCustomGame")}</span>`;
  newGameTile.addEventListener("click", () => openBuilder(null));

  tiles.appendChild(browseTile);
  tiles.appendChild(quizTile);
  tiles.appendChild(newGameTile);

  if (typeof renderCustomGameTiles === "function") renderCustomGameTiles();
}

// ---------------------------------------------------------------------------
// Progress card + practice-session launchers
// ---------------------------------------------------------------------------

function renderProgressCard() {
  const host = document.getElementById("home-progress");
  if (!host) return;
  if (typeof collectionCounts !== "function") { host.innerHTML = ""; return; }
  const c = collectionCounts();
  const streak = currentStreak();
  const due = dueBirds().length;

  const maxBox = Math.max(1, ...c.boxes);
  const bars = c.boxes.map((n, i) => {
    const h = Math.round((n / maxBox) * 100);
    return `<span class="dist-bar" title="box ${i + 1}: ${n}"><span class="dist-fill dist-b${i + 1}" style="height:${h}%"></span></span>`;
  }).join("");

  const streakLabel = streak === 1 ? t("statStreakOne") : t("statStreak");
  const dueRow = due > 0
    ? `<button class="stat-due" id="stat-review-btn"><span class="stat-due-n">${due}</span> <span>${t("statDue")}</span> <span class="stat-review-cta">${t("statReviewNow")} ${icon("arrow-right")}</span></button>`
    : `<p class="stat-due stat-due-empty">${t("statAllCaughtUp")}</p>`;

  host.innerHTML = `
    <div class="stat-card">
      <div class="stat-figures">
        <div class="stat-fig"><span class="stat-num">${c.learned}</span><span class="stat-lbl">${t("statLearnedOf")} <span class="stat-total">${t("statOf")} ${c.total}</span></span></div>
        <div class="stat-fig"><span class="stat-num">${c.mastered}</span><span class="stat-lbl">${t("statMastered")}</span></div>
        <div class="stat-fig"><span class="stat-num">${streak}</span><span class="stat-lbl">${streakLabel}</span></div>
      </div>
      <div class="stat-dist" aria-hidden="true">
        <div class="dist-bars">${bars}</div>
        <div class="dist-legend"><span>${t("distNew")}</span><span>${t("distMastered")}</span></div>
      </div>
      ${dueRow}
    </div>
  `;
  const reviewBtn = document.getElementById("stat-review-btn");
  if (reviewBtn) reviewBtn.addEventListener("click", startReviewDue);
}

function startReviewDue() {
  if (!dueBirds().length) { flashMsg(t("statAllCaughtUp")); return; }
  showScreen("quiz", { gameMode: "quiz-study", poolFn: dueBirds, title: t("tileReviewTitle") });
}

function startMastery() {
  if (!knownPool().length) { flashMsg(t("emptyPoolMsg")); return; }
  showScreen("quiz", { gameMode: "quiz-choice", poolFn: knownPool, title: t("tileMasteryTitle") });
}

function startWeak() {
  if (!weakPool().length) { flashMsg(t("emptyPoolMsg")); return; }
  showScreen("quiz", { gameMode: "quiz-choice", poolFn: weakPool, title: t("tileWeakTitle") });
}

let flashTimer = null;
function flashMsg(msg) {
  let el = document.getElementById("app-toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "app-toast";
    el.className = "app-toast";
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => el.classList.remove("show"), 2600);
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function init() {
  document.documentElement.lang = currentLanguage;
  const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
  applyThemeOverrides(savedTheme || "standard");
  applyStaticTranslations();

  document.querySelectorAll(".nav-btn").forEach((btn) => {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  });

  document.getElementById("lang-nl").addEventListener("click", () => setLanguage("nl"));
  document.getElementById("lang-en").addEventListener("click", () => setLanguage("en"));

  document.getElementById("fullscreen-viewer").addEventListener("click", closeFullscreenImage);

  document.getElementById("detail-overlay").addEventListener("click", (e) => {
    if (e.target === document.getElementById("detail-overlay")) closeDetail();
  });

  document.getElementById("sound-player").addEventListener("ended", () => stopBirdSound());

  await loadBirds();
  seedDefaultGamesIfNeeded();
  showScreen("home");

  // Service worker disabled: runs embedded as a goodmorning utility app
  // (iframe); the parent app owns the service worker.
  if (false && "serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

init();
