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
    // Vogel van vandaag + dagplan
    birdOfTheDay: "Dier van vandaag",
    plannedCards: "kaarten vandaag",
    plannedReviews: "herhalingen",
    plannedNew: "nieuwe dieren",
    and: "en",
    localeTag: "nl-NL",

    // Cursus + oefensessie
    courseGriftpark: "Griftpark · 100 vogels",
    startSession: "Start oefensessie",
    sessionTitle: "Oefenen",
    closeSession: "Sessie sluiten",
    sessionPreviewReview: "herhalen",
    sessionPreviewNew: "nieuw",
    newBirdBadge: "Nieuw dier",
    introNext: "Ik heb hem bekeken",
    whichBirdDoYouHear: "Welk dier hoor je?",
    whichPhotoIs: "Welke foto is de",
    heardInGriftpark: "gehoord in het Griftpark",
    sessionDoneTitle: "Klaar voor vandaag!",
    sessionScore: "goed beantwoord",
    sessionNewBirds: "nieuwe dieren geleerd",
    sessionMissed: "Nog even naar kijken",
    sessionEmptyTitle: "Alles gedaan voor vandaag",
    sessionEmptyBody:
      "Geen herhalingen meer en het dagbudget nieuwe dieren is op. Morgen staan de volgende klaar.",
    freePractice: "Vrij oefenen",
    backHome: "Naar home",

    // Bladeren: sorteren
    sortLabel: "Sorteren",
    sortCommon: "Meest gezien",
    sortAZ: "A–Z",
    sortTaxo: "Familie",

    // Statuskaart + oefensessies
    statLearnedOf: "geleerd",
    statOf: "van",
    statMastered: "beheerst",
    statInProgress: "onderweg",
    statStreak: "dagen op rij",
    statStreakOne: "dag op rij",
    statAllCaughtUp: "Niets te herhalen vandaag",
    // Navigation & screens
    home: "Home",
    browse: "Bladeren",
    quiz: "Quiz",
    settings: "Instellingen",
    yourGames: "Jouw spellen",

    // Home tiles
    browseTile: "Bladeren",
    newCustomGame: "Nieuw spel",

    // Browse
    searchPlaceholder: "Zoeken...",
    noResults: "Niets gevonden.",
    matchingBirds: "resultaten",
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
    heightAtWithers: "Schofthoogte",
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
    nextBird: "Volgende",
    correct: "Goed!",
    wrong: "Helaas, niet goed.",
    scoreLabel: "Score",

    // Study (Leitner)
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
    pickSpecificBirds: "Kies specifieke dieren",
    searchBirdsPlaceholder: "Zoek een dier om toe te voegen...",
    birdsSelected: "geselecteerd",

    // Filter dimensions
    fciGroupMode: "Rasgroepen",
    whichGroup: "Welke rasgroep zie je hier?",
    fciGroupShort: "Groep",
    fciGroupLabel: "Rasgroep (FCI)",
    nextQuestion: "Volgende vraag",
    practice: "Oefenen",
    soundQuestions: "Vragen met geluid",
    soundQuestionsOn: "Aan",
    soundQuestionsOff: "Uit — ik hoor niets",
    soundQuestionsHint: "Staat dit uit, dan slaat de oefensessie \"Welk dier hoor je?\" over.",
    filterKind: "Categorie",
    kindBird: "Vogels",
    kindDog: "Honden",
    kindArchitecture: "Stijlen",
    kindStreet: "Straat",
    filterEra: "Periode",
    eraMedieval: "Middeleeuwen",
    eraEarlyModern: "1500–1800",
    era19th: "19e eeuw",
    era1900: "1900–1945",
    eraPostwar: "Na 1945",
    stylePeriod: "Periode",
    styleFeatures: "Herkenbaar aan",
    styleArchitects: "Architecten",
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
    loading: "Dieren laden...",
    loadFailedTitle: "Laden mislukt",
    loadFailedBody: "De diergegevens konden niet worden geladen. Controleer je verbinding.",
    retry: "Opnieuw proberen",

    // Accessibility labels (never shown, read aloud)
    a11yAddFavorite: "Aan favorieten toevoegen",
    a11yRemoveFavorite: "Uit favorieten verwijderen",
    a11yViewPhotoFullscreen: "Foto op volledig scherm bekijken",
    a11yCloseFullscreen: "Volledig scherm sluiten",
    a11yBirdPhoto: "Foto van het dier",
    a11yQuizPhoto: "Foto van het te raden dier",
    a11yLoading: "Bezig met laden",
  },

  en: {
    // Bird of the day + today's plan
    birdOfTheDay: "Animal of the day",
    plannedCards: "cards today",
    plannedReviews: "reviews",
    plannedNew: "new animals",
    and: "and",
    localeTag: "en-GB",

    // Course + practice session
    courseGriftpark: "Griftpark · 100 birds",
    startSession: "Start practice session",
    sessionTitle: "Practice",
    closeSession: "Close session",
    sessionPreviewReview: "to review",
    sessionPreviewNew: "new",
    newBirdBadge: "New animal",
    introNext: "Got it",
    whichBirdDoYouHear: "Which animal do you hear?",
    whichPhotoIs: "Which photo is the",
    heardInGriftpark: "heard in the Griftpark",
    sessionDoneTitle: "Done for today!",
    sessionScore: "answered correctly",
    sessionNewBirds: "new animals learned",
    sessionMissed: "Worth another look",
    sessionEmptyTitle: "All done for today",
    sessionEmptyBody:
      "No reviews left and today's budget of new animals is used up. The next ones are ready tomorrow.",
    freePractice: "Free practice",
    backHome: "Back to home",

    // Browse: sorting
    sortLabel: "Sort",
    sortCommon: "Most seen",
    sortAZ: "A–Z",
    sortTaxo: "Family",

    // Status card + practice sessions
    statLearnedOf: "learned",
    statOf: "of",
    statMastered: "mastered",
    statInProgress: "in progress",
    statStreak: "day streak",
    statStreakOne: "day streak",
    statAllCaughtUp: "Nothing due today",
    // Navigation & screens
    home: "Home",
    browse: "Browse",
    quiz: "Quiz",
    settings: "Settings",
    yourGames: "Your games",

    // Home tiles
    browseTile: "Browse",
    newCustomGame: "New game",

    // Browse
    searchPlaceholder: "Search...",
    noResults: "Nothing matches your search.",
    matchingBirds: "results",
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
    heightAtWithers: "Height at withers",
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
    nextBird: "Next",
    correct: "Correct!",
    wrong: "Not quite.",
    scoreLabel: "Score",

    // Study (Leitner)
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
    pickSpecificBirds: "Pick specific animals",
    searchBirdsPlaceholder: "Search an animal to add...",
    birdsSelected: "selected",

    // Filter dimensions
    fciGroupMode: "Breed groups",
    whichGroup: "Which breed group is this?",
    fciGroupShort: "Group",
    fciGroupLabel: "Breed group (FCI)",
    nextQuestion: "Next question",
    practice: "Practice",
    soundQuestions: "Questions with sound",
    soundQuestionsOn: "On",
    soundQuestionsOff: "Off — I can't hear",
    soundQuestionsHint: "With this off, the practice session skips \"Which animal do you hear?\".",
    filterKind: "Category",
    kindBird: "Birds",
    kindDog: "Dogs",
    kindArchitecture: "Styles",
    kindStreet: "Street",
    filterEra: "Period",
    eraMedieval: "Middle Ages",
    eraEarlyModern: "1500–1800",
    era19th: "19th century",
    era1900: "1900–1945",
    eraPostwar: "After 1945",
    stylePeriod: "Period",
    styleFeatures: "How to spot it",
    styleArchitects: "Architects",
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
    loading: "Loading animals...",
    loadFailedTitle: "Could not load",
    loadFailedBody: "The animal data could not be loaded. Check your connection.",
    retry: "Try again",

    // Accessibility labels (never shown, read aloud)
    a11yAddFavorite: "Add to favorites",
    a11yRemoveFavorite: "Remove from favorites",
    a11yViewPhotoFullscreen: "View photo fullscreen",
    a11yCloseFullscreen: "Close fullscreen view",
    a11yBirdPhoto: "Photo of the animal",
    a11yQuizPhoto: "Photo of the animal to identify",
    a11yLoading: "Loading",
  },
};

export const LANGUAGES = /** @type {const} */ (["nl", "en"]);
