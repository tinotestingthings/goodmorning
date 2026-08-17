// ---------------------------------------------------------------------------
// Every piece of translatable UI copy in the app, in one place.
//
// One convention: UI text lives here under a key and is read with t(key).
// Nothing else in the codebase carries an inline { nl: "...", en: "..." }
// object -- the filter registry used to, which meant there were two competing
// i18n systems. Data-derived labels (bird family names, which come from
// Wikipedia and cannot live in a static table) are the single exception and go
// through resolveLabel() in i18n.js.
//
// The two tables are asserted to have identical key sets at boot in dev.
// ---------------------------------------------------------------------------

export const STRINGS = {
  nl: {
    // Statuskaart + oefensessies
    tileReviewTitle: "Herhalen",
    tileReviewDesc: "Kaarten die vandaag terugkomen",
    tileMasteryTitle: "Bekende vogels",
    tileMasteryDesc: "Oefen vogels die je al kent",
    tileWeakTitle: "Lastige vogels",
    tileWeakDesc: "Oefen wat je vaak fout had",
    statLearnedOf: "geleerd",
    statOf: "van",
    statMastered: "beheerst",
    statStreak: "dagen op rij",
    statStreakOne: "dag op rij",
    statDue: "te herhalen vandaag",
    statReviewNow: "Nu oefenen",
    statAllCaughtUp: "Niets te herhalen vandaag",
    emptyPoolMsg: "Nog te weinig geoefend voor deze sessie",
    distNew: "nieuw",
    distMastered: "beheerst",
    // Navigation & screens
    home: "Home",
    browse: "Bladeren",
    quiz: "Quiz",
    settings: "Instellingen",
    yourGames: "Jouw spellen",

    // Home tiles
    browseTile: "Bladeren",
    browseTileDesc: "Doorzoek alle vogels",
    quizTile: "Quiz",
    quizTileDesc: "Test jezelf",
    newCustomGame: "Nieuw spel",

    // Browse
    searchPlaceholder: "Zoek een vogel...",
    noResults: "Geen vogels gevonden.",
    matchingBirds: "overeenkomende vogels",
    options: "Opties",
    close: "Sluiten",
    all: "Alles",
    itemsSelected: "geselecteerd",
    searchGeneric: "Zoeken...",

    // Detail sheet
    origin: "Herkomst",
    statusInNl: "Status in NL",
    habitat: "Leefgebied",
    length: "Lengte",
    conservationStatus: "IUCN-status",
    fact: "Wist je dat...",
    moreInfo: "Meer informatie",
    wikipediaEn: "Wikipedia (EN)",
    wikipediaNl: "Wikipedia (NL)",
    listenXenoCanto: "Beluister (Xeno-canto)",
    playCall: "Speel geluid af",
    stopSound: "Stop geluid",

    // Quiz
    typeAnswer: "Typ het antwoord",
    multipleChoice: "Meerkeuze",
    study: "Overhoren",
    check: "Controleer",
    reveal: "Toon antwoord",
    nextBird: "Volgende vogel",
    correct: "Goed!",
    wrong: "Helaas, niet goed.",
    scoreLabel: "Score",

    // Study (Leitner)
    studyTileDesc: "Officieel overhoren met herhaling",
    knewIt: "Wist ik!",
    didntKnowIt: "Wist ik niet",
    tapToReveal: "Tik om het antwoord te tonen",
    studyNew: "nieuw",
    studyReviewing: "in herhaling",
    studyMastered: "geleerd",
    studyDone: "Niets meer te overhoren in deze selectie. Goed bezig!",

    // Custom game builder
    customGame: "Eigen spel maken",
    gameMode: "Speltype",
    quizTypeAnswer: "Quiz - typ het antwoord",
    quizMultipleChoice: "Quiz - meerkeuze",
    gameName: "Naam van het spel",
    saveGame: "Opslaan",
    cancel: "Annuleren",
    edit: "Bewerken",
    deleteGame: "Verwijderen",
    filterByTags: "Filter op kenmerken",
    pickSpecificBirds: "Kies specifieke vogels",
    searchBirdsPlaceholder: "Zoek een vogel om toe te voegen...",
    birdsSelected: "geselecteerde vogels",

    // Filter dimensions
    filterCommonness: "Hoe vaak gezien",
    filterNlStatus: "Status in NL",
    filterColor: "Kleur",
    filterSize: "Grootte",
    filterFamily: "Familie",
    filterFavorites: "Alleen favorieten",

    // Filter values -- commonness
    commonnessVeryCommon: "Zeer algemeen",
    commonnessCommon: "Algemeen",
    commonnessUncommon: "Minder algemeen",
    commonnessRare: "Zeldzaam / dwaalgast",

    // Filter values -- status in NL
    statusRegular: "Regelmatig",
    statusIntroduced: "Geïntroduceerd",
    statusAccidental: "Dwaalgast",
    statusPre1800: "Voor 1800",

    // Filter values -- colour
    colorBlack: "Zwart",
    colorWhite: "Wit",
    colorGrey: "Grijs",
    colorBrown: "Bruin",
    colorRed: "Rood",
    colorOrange: "Oranje",
    colorYellow: "Geel",
    colorGreen: "Groen",
    colorBlue: "Blauw",
    colorPink: "Roze",
    colorPurple: "Paars",
    colorBeige: "Beige",

    // Filter values -- size
    sizeSmall: "Klein (<20cm)",
    sizeMedium: "Middelgroot (20-50cm)",
    sizeLarge: "Groot (>50cm)",

    // Settings
    language: "Taal",
    theme: "Thema",
    themeAuto: "Automatisch",
    themeStandard: "Standaard",
    themeNight: "Nacht",
    themePlayful: "Speels",
    themeBirder: "Vogelaar",
    customizeTheme: "Pas thema aan",
    resetTheme: "Terugzetten naar standaard",
    themeVarBg: "Achtergrond",
    themeVarSurface: "Kaarten",
    themeVarText: "Tekst",
    themeVarMuted: "Gedempte tekst",
    themeVarAccent: "Accentkleur",
    themeVarAccentContrast: "Tekst op accent",
    themeVarBorder: "Randen",
    themeVarDanger: "Foutkleur",

    // Loading & errors
    loading: "Vogels laden...",
    loadFailedTitle: "Laden mislukt",
    loadFailedBody: "De vogelgegevens konden niet worden geladen. Controleer je verbinding.",
    retry: "Opnieuw proberen",

    // Accessibility labels (never shown, read aloud)
    a11yAddFavorite: "Aan favorieten toevoegen",
    a11yRemoveFavorite: "Uit favorieten verwijderen",
    a11yViewPhotoFullscreen: "Foto op volledig scherm bekijken",
    a11yCloseFullscreen: "Volledig scherm sluiten",
    a11yBirdPhoto: "Foto van de vogel",
    a11yQuizPhoto: "Foto van de te raden vogel",
    a11yLoading: "Bezig met laden",
  },

  en: {
    // Status card + practice sessions
    tileReviewTitle: "Review",
    tileReviewDesc: "Cards that come back today",
    tileMasteryTitle: "Known birds",
    tileMasteryDesc: "Practise birds you already know",
    tileWeakTitle: "Tricky birds",
    tileWeakDesc: "Drill the ones you keep missing",
    statLearnedOf: "learned",
    statOf: "of",
    statMastered: "mastered",
    statStreak: "day streak",
    statStreakOne: "day streak",
    statDue: "due today",
    statReviewNow: "Practise now",
    statAllCaughtUp: "Nothing due today",
    emptyPoolMsg: "Not enough practice yet for this session",
    distNew: "new",
    distMastered: "mastered",
    // Navigation & screens
    home: "Home",
    browse: "Browse",
    quiz: "Quiz",
    settings: "Settings",
    yourGames: "Your games",

    // Home tiles
    browseTile: "Browse",
    browseTileDesc: "Search all birds",
    quizTile: "Quiz",
    quizTileDesc: "Test yourself",
    newCustomGame: "New game",

    // Browse
    searchPlaceholder: "Search for a bird...",
    noResults: "No birds match your search.",
    matchingBirds: "matching birds",
    options: "Options",
    close: "Close",
    all: "All",
    itemsSelected: "selected",
    searchGeneric: "Search...",

    // Detail sheet
    origin: "Origin",
    statusInNl: "Status in NL",
    habitat: "Habitat",
    length: "Length",
    conservationStatus: "IUCN status",
    fact: "Did you know...",
    moreInfo: "More info",
    wikipediaEn: "Wikipedia (EN)",
    wikipediaNl: "Wikipedia (NL)",
    listenXenoCanto: "Listen (Xeno-canto)",
    playCall: "Play call",
    stopSound: "Stop sound",

    // Quiz
    typeAnswer: "Type the answer",
    multipleChoice: "Multiple choice",
    study: "Study",
    check: "Check",
    reveal: "Reveal",
    nextBird: "Next bird",
    correct: "Correct!",
    wrong: "Not quite.",
    scoreLabel: "Score",

    // Study (Leitner)
    studyTileDesc: "Official spaced-repetition drilling",
    knewIt: "Knew it!",
    didntKnowIt: "Didn't know it",
    tapToReveal: "Tap to reveal the answer",
    studyNew: "new",
    studyReviewing: "reviewing",
    studyMastered: "mastered",
    studyDone: "Nothing left to study in this selection. Nice work!",

    // Custom game builder
    customGame: "Custom Game Builder",
    gameMode: "Game mode",
    quizTypeAnswer: "Quiz - type the answer",
    quizMultipleChoice: "Quiz - multiple choice",
    gameName: "Game name",
    saveGame: "Save",
    cancel: "Cancel",
    edit: "Edit",
    deleteGame: "Delete",
    filterByTags: "Filter by attributes",
    pickSpecificBirds: "Pick specific birds",
    searchBirdsPlaceholder: "Search a bird to add...",
    birdsSelected: "birds selected",

    // Filter dimensions
    filterCommonness: "Commonness",
    filterNlStatus: "Status in NL",
    filterColor: "Colour",
    filterSize: "Size",
    filterFamily: "Family",
    filterFavorites: "Favorites only",

    // Filter values -- commonness
    commonnessVeryCommon: "Very common",
    commonnessCommon: "Common",
    commonnessUncommon: "Uncommon",
    commonnessRare: "Rare / vagrant",

    // Filter values -- status in NL
    statusRegular: "Regular",
    statusIntroduced: "Introduced",
    statusAccidental: "Accidental",
    statusPre1800: "Before 1800",

    // Filter values -- colour
    colorBlack: "Black",
    colorWhite: "White",
    colorGrey: "Grey",
    colorBrown: "Brown",
    colorRed: "Red",
    colorOrange: "Orange",
    colorYellow: "Yellow",
    colorGreen: "Green",
    colorBlue: "Blue",
    colorPink: "Pink",
    colorPurple: "Purple",
    colorBeige: "Beige",

    // Filter values -- size
    sizeSmall: "Small (<20cm)",
    sizeMedium: "Medium (20-50cm)",
    sizeLarge: "Large (>50cm)",

    // Settings
    language: "Language",
    theme: "Theme",
    themeAuto: "Automatic",
    themeStandard: "Standard",
    themeNight: "Night",
    themePlayful: "Playful",
    themeBirder: "Birder",
    customizeTheme: "Customize theme",
    resetTheme: "Reset to default",
    themeVarBg: "Background",
    themeVarSurface: "Cards",
    themeVarText: "Text",
    themeVarMuted: "Muted text",
    themeVarAccent: "Accent colour",
    themeVarAccentContrast: "Text on accent",
    themeVarBorder: "Borders",
    themeVarDanger: "Error colour",

    // Loading & errors
    loading: "Loading birds...",
    loadFailedTitle: "Could not load",
    loadFailedBody: "The bird data could not be loaded. Check your connection.",
    retry: "Try again",

    // Accessibility labels (never shown, read aloud)
    a11yAddFavorite: "Add to favorites",
    a11yRemoveFavorite: "Remove from favorites",
    a11yViewPhotoFullscreen: "View photo fullscreen",
    a11yCloseFullscreen: "Close fullscreen view",
    a11yBirdPhoto: "Photo of the bird",
    a11yQuizPhoto: "Photo of the bird to identify",
    a11yLoading: "Loading",
  },
};

export const LANGUAGES = /** @type {const} */ (["nl", "en"]);
