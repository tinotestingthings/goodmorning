// WijnWijs statische content naast de vragenbank: quick facts, topic-metadata
// en de vergelijkingsmodule. Topics verwijzen naar de genormaliseerde namen
// uit questions.js.

export const LEVELS = ["SDEN 2", "SDEN 3", "WSET 3"];

// Eén fact per dag, deterministisch op datum gekozen (zie today.js).
export const FACTS = [
  {
    id: "fact-1",
    kicker: "Aroma & klimaat",
    title: "Koel klimaat, frisse stijl",
    body: "Druiven uit een koel klimaat behouden meestal meer zuren en ontwikkelen vaker aroma’s van groen fruit, citrus en bloemen.",
    topic: "Wijnbouw",
    level: "SDEN 2"
  },
  {
    id: "fact-2",
    kicker: "Druif van de dag",
    title: "Riesling verraadt zijn herkomst",
    body: "Riesling heeft van nature hoge zuren. In een koel klimaat proef je vaak limoen en groene appel; met rijping kunnen tonen van honing en petroleum ontstaan.",
    topic: "De druif",
    level: "SDEN 2"
  },
  {
    id: "fact-3",
    kicker: "Wijn maken",
    title: "Schilcontact geeft meer dan kleur",
    body: "Tijdens schilcontact komen naast kleurstoffen ook tannines en aroma’s vrij. Daarom vergisten rode wijnen meestal mét de schillen.",
    topic: "Wijnbereiding",
    level: "SDEN 2"
  },
  {
    id: "fact-4",
    kicker: "Frankrijk",
    title: "Sancerre is een plaats, geen druif",
    body: "Witte Sancerre uit de Loire wordt hoofdzakelijk gemaakt van Sauvignon Blanc. Europese etiketten noemen vaak de herkomst in plaats van de druif.",
    topic: "Wijngebieden: Frankrijk",
    level: "SDEN 2"
  },
  {
    id: "fact-5",
    kicker: "Wijn & spijs",
    title: "Zuur zoekt zuur",
    body: "Bij een gerecht met veel zuren past vaak een wijn met minstens evenveel zuur. Anders kan de wijn vlak en futloos smaken.",
    topic: "Proeven en behandelen van wijn",
    level: "SDEN 2"
  },
  {
    id: "fact-6",
    kicker: "Bubbels",
    title: "Tweede gisting maakt het verschil",
    body: "Bij de traditionele methode ontstaat de mousse door een tweede gisting in de fles. Rijping op gistcellen kan brood- en briochetonen geven.",
    topic: "Wijnbereiding",
    level: "SDEN 2"
  },
  {
    id: "fact-7",
    kicker: "Bodem & wijnstok",
    title: "Waterstress kan nuttig zijn — tot op zekere hoogte",
    body: "Een beperkte hoeveelheid waterstress remt de bladgroei en kan kleine, geconcentreerde druiven geven. Te veel stress stopt de rijping.",
    topic: "Wijnbouw",
    level: "SDEN 2"
  }
];

// Vaste volgorde, korte iconlabels en kaartkleuren voor de 11 SDEN-2-topics.
export const TOPIC_META = [
  { topic: "De druif", icon: "DR", color: "gold" },
  { topic: "Wijnbouw", icon: "WB", color: "green" },
  { topic: "Wijnbereiding", icon: "WM", color: "purple" },
  { topic: "Wijngebieden: Frankrijk", icon: "FR", color: "rose" },
  { topic: "Wijngebieden: Italië", icon: "IT", color: "orange" },
  { topic: "Wijngebieden: Spanje en Portugal", icon: "ES", color: "gold" },
  { topic: "Wijngebieden: Duitsland, Oostenrijk en overig Europa", icon: "DE", color: "blue" },
  { topic: "Wijngebieden: Noord- en Zuid-Amerika", icon: "AM", color: "green" },
  { topic: "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland", icon: "ZA", color: "purple" },
  { topic: "Wet- en regelgeving", icon: "WR", color: "blue" },
  { topic: "Proeven en behandelen van wijn", icon: "PR", color: "rose" }
];

export function topicMeta(topic) {
  return (
    TOPIC_META.find((t) => t.topic === topic) || { topic, icon: "WW", color: "rose" }
  );
}

// Vergelijkmodus. De oefenknop verwijst naar échte Chardonnay/Chenin-vragen
// uit de bank (de oude app quizte hier over Riesling en klimaat).
export const COMPARISON = {
  heading: "Twee witte alleskunners",
  sub: "Zie de verschillen naast elkaar en onthoud ze sneller.",
  quizIds: [
    "q-sden2-022", // Chablis = Chardonnay
    "q-sden2-126", // Côte de Beaune = witte Chardonnay
    "q-sden2-176", // Chardonnay in Californië
    "q-sden2-028", // Anjou = Chenin Blanc
    "q-sden2-130", // Anjou-stijlen van Chenin
    "q-sden2-083"  // Chenin in Zuid-Afrika
  ],
  left: {
    title: "Chardonnay",
    eyebrow: "Veelzijdige kameleon",
    rows: [
      ["Zuur", "gemiddeld — hoog"],
      ["Fruit", "appel, citrus, perzik"],
      ["Hout", "vaak mogelijk"],
      ["Klassiek", "Bourgogne, Champagne"]
    ]
  },
  right: {
    title: "Chenin Blanc",
    eyebrow: "Zuurgedreven alleskunner",
    rows: [
      ["Zuur", "hoog"],
      ["Fruit", "appel, kweepeer, honing"],
      ["Hout", "soms"],
      ["Klassiek", "Loire, Zuid-Afrika"]
    ]
  }
};
