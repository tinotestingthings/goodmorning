// The source names that flood beat 1. Drawn from the real Privacy Watch list
// in `90 System/Automation - privacy blog watch.md` (68 unique entries — the
// on-screen counter says "60+" rather than an exact number on purpose).
export const SOURCES = [
  "Autoriteit Persoonsgegevens", "EDPB", "EDPS", "noyb", "Bits of Freedom",
  "ICTRecht", "Ius Mentis", "IAPP", "Stibbe", "AKD", "Pels Rijcken",
  "De Brauw", "Nysingh", "Clairfort", "Louwers IP&Tech",
  "artificialintelligenceact.eu", "EUR-Lex", "Council of the EU",
  "European Parliament", "EC Digital Strategy", "Security.NL", "404 Media",
  "BleepingComputer", "TechCrunch", "The Verge", "Ars Technica",
  "Mick Beer", "Privacy Company", "De Functionaris", "AVG Juristen",
  "CookieCode", "GDPRhub", "Enforcement Tracker", "Privacynieuws.nl",
  "GDPRtoday", "Netkwesties", "Bert Hubert", "SURF PEC", "Rathenau",
  "AG Connect", "Pointer", "Considerati", "IB&P", "Nictiz",
  "Big Brother Watch", "Future of Privacy Forum", "IT Governance",
  "PwC NL", "PwC BE", "de Volkskrant", "Binnenlands Bestuur",
  "Cybercrimeinfo.nl", "Risk & Compliance Platform", "Data & Privacyweb",
];

// The card shown in the triage beat is a real one from the 2026-08-18 feed.
export const TRIAGE_CARDS = [
  {
    title:
      "Bundeskartellamt verklaart Apple-toezeggingen over App Tracking Transparency bindend",
    source: "Bundeskartellamt",
    date: "17 aug 2026",
    action: "keep" as const,
    label: "Bewaren",
  },
  {
    title:
      "Stripe koopt OpenRouter voor ruim $7 miljard — de AI-routinglaag",
    source: "TechCrunch",
    date: "16 aug 2026",
    action: "dismiss" as const,
    label: "Archiveren",
  },
  {
    title:
      "3,64 miljoen werknemersrecords uit gecompromitteerde Azure/Entra-tenants",
    source: "BleepingComputer",
    date: "17 aug 2026",
    action: "task" as const,
    label: "Maak er een taak van",
  },
];

// Named as a category in the closing ring — deliberately not explained.
export const UTILITY_APPS = [
  "Kangaroo", "WijnWijs", "NoteSprint", "ChordSprint", "Vogelspotinus",
];
