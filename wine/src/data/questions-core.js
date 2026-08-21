// WijnWijs vragenbank — 210 vragen SDEN 2 (10 starters + 200 uit de AI-bank,
// peer-reviewed aug 2026). Bron van waarheid: dit bestand. Topics zijn
// genormaliseerd naar de 11-delige SDEN-2-structuur (aug 2026, route B-herbouw).
// Velden: id, topic, level[], type (multiple|truefalse), prompt, options[],
// answer (index), explanation, misconception, tags[]?.

export const QUESTIONS_CORE = [
  {
    "id": "q-sancerre",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Van welk druivenras wordt witte Sancerre hoofdzakelijk gemaakt?",
    "options": [
      "Chardonnay",
      "Sauvignon Blanc",
      "Chenin Blanc",
      "Riesling"
    ],
    "answer": 1,
    "explanation": "Sancerre ligt in de Loire en witte Sancerre wordt hoofdzakelijk gemaakt van Sauvignon Blanc.",
    "misconception": "Chenin Blanc is óók belangrijk in de Loire, maar vooral rond Vouvray, Saumur en Anjou."
  },
  {
    "id": "q-tannin",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Waar komt het grootste deel van de tannine in rode wijn vandaan?",
    "options": [
      "Druivensap",
      "Schillen, pitten en steeltjes",
      "Gistcellen",
      "Wijnsteenzuur"
    ],
    "answer": 1,
    "explanation": "Tannine wordt tijdens de vergisting en inweking vooral aan schillen, pitten en eventueel steeltjes onttrokken. Hout kan later extra tannine toevoegen.",
    "misconception": "Druivensap bevat zuren en suikers, maar nauwelijks de fenolische stoffen die voor de drogende structuur zorgen."
  },
  {
    "id": "q-riesling-acid",
    "topic": "De druif",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "truefalse",
    "prompt": "Riesling heeft doorgaans van nature hoge zuren.",
    "options": [
      "Waar",
      "Niet waar"
    ],
    "answer": 0,
    "explanation": "Hoge natuurlijke zuren zijn een van de belangrijkste kenmerken van Riesling, ook wanneer de wijn restzoet bevat.",
    "misconception": "Zoetheid kan de zuren zachter laten lijken, maar vermindert de werkelijke zuurgraad niet automatisch."
  },
  {
    "id": "q-bordeaux-bank",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Welke druif domineert vaak in rode wijnen van de linkeroever van Bordeaux?",
    "options": [
      "Merlot",
      "Pinot Noir",
      "Cabernet Sauvignon",
      "Syrah"
    ],
    "answer": 2,
    "explanation": "De goed drainerende kiezelbodems van de Médoc en Graves passen goed bij de laatrijpende Cabernet Sauvignon.",
    "misconception": "Merlot domineert vaker op de klei- en kalkrijke bodems van de rechteroever, zoals Saint-Émilion en Pomerol."
  },
  {
    "id": "q-alcohol",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Wat zet gist tijdens de alcoholische vergisting voornamelijk om?",
    "options": [
      "Zuur in tannine",
      "Suiker in alcohol en koolzuurgas",
      "Alcohol in suiker",
      "Water in zuurstof"
    ],
    "answer": 1,
    "explanation": "Gist verbruikt suiker en produceert daarbij vooral ethanol, koolzuurgas en warmte.",
    "misconception": "Zuren en tannines beïnvloeden de smaak, maar zijn niet de primaire brandstof voor gist."
  },
  {
    "id": "q-cool-climate",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Welk smaakprofiel past het best bij een koel klimaat?",
    "options": [
      "Lager zuur, meer alcohol",
      "Hoger zuur, frisser fruit",
      "Altijd zoet",
      "Altijd veel tannine"
    ],
    "answer": 1,
    "explanation": "Een koel klimaat vertraagt de suikerrijping en helpt zuren behouden, wat vaak een frissere stijl oplevert.",
    "misconception": "Tannine hangt vooral samen met druif, schilrijpheid en vinificatie; klimaat alleen bepaalt dit niet."
  },
  {
    "id": "q-rioja",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Welke blauwe druif is het belangrijkst voor veel rode Rioja?",
    "options": [
      "Tempranillo",
      "Sangiovese",
      "Malbec",
      "Nebbiolo"
    ],
    "answer": 0,
    "explanation": "Tempranillo vormt de ruggengraat van veel rode Rioja en wordt vaak aangevuld met Garnacha, Graciano of Mazuelo.",
    "misconception": "Sangiovese hoort vooral bij Midden-Italië; Nebbiolo bij Piemonte en Malbec bij Cahors en Argentinië."
  },
  {
    "id": "q-prosecco",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Met welke methode wordt de meeste Prosecco mousserend gemaakt?",
    "options": [
      "Traditionele methode",
      "Tankmethode",
      "Koolzuurinjectie uitsluitend",
      "Appassimento"
    ],
    "answer": 1,
    "explanation": "De tankmethode bewaart het frisse, fruitige en bloemige karakter van de Glera-druif.",
    "misconception": "De traditionele methode wordt onder meer gebruikt voor Champagne en Cava en geeft vaker autolytische tonen."
  },
  {
    "id": "q-sweet-pairing",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "truefalse",
    "prompt": "Een dessertwijn hoort idealiter minstens zo zoet te zijn als het dessert.",
    "options": [
      "Waar",
      "Niet waar"
    ],
    "answer": 0,
    "explanation": "Is het gerecht zoeter dan de wijn, dan kan de wijn dun, zuur en bitter overkomen.",
    "misconception": "Contrast kan bij wijn-spijs goed werken, maar onvoldoende zoetheid in de wijn is bij desserts meestal ongunstig."
  },
  {
    "id": "q-chianti",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2",
      "SDEN 3",
      "WSET 3"
    ],
    "type": "multiple",
    "prompt": "Welke druif vormt de basis van Chianti Classico?",
    "options": [
      "Nebbiolo",
      "Corvina",
      "Sangiovese",
      "Montepulciano"
    ],
    "answer": 2,
    "explanation": "Chianti Classico uit Toscane is hoofdzakelijk gebaseerd op Sangiovese.",
    "misconception": "Nebbiolo hoort bij Piemonte, Corvina bij Valpolicella en Montepulciano vooral bij Abruzzo."
  },
  {
    "id": "q-sden2-001",
    "topic": "De druif",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke druivensoort wordt wereldwijd het meest gebruikt voor de productie van kwaliteitswijn?",
    "options": [
      "Vitis riparia",
      "Vitis vinifera",
      "Vitis labrusca",
      "Vitis rotundifolia"
    ],
    "answer": 1,
    "explanation": "Vitis vinifera is de Europese druivensoort waartoe vrijwel alle bekende wijndruivenrassen behoren.",
    "misconception": "Amerikaanse druivensoorten worden veel als onderstam gebruikt, maar leveren niet de meeste klassieke kwaliteitswijnen.",
    "tags": [
      "sden-1.2",
      "druivensoort",
      "vitis-vinifera"
    ]
  },
  {
    "id": "q-sden2-002",
    "topic": "De druif",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke twee namen verwijzen naar hetzelfde blauwe druivenras?",
    "options": [
      "Merlot en Malbec",
      "Pinot Noir en Pinotage",
      "Syrah en Shiraz",
      "Grenache en Gamay"
    ],
    "answer": 2,
    "explanation": "Syrah en Shiraz zijn twee namen voor hetzelfde druivenras; Shiraz is vooral gangbaar in Australië.",
    "misconception": "Pinotage bevat wel het woord Pinot, maar is een Zuid-Afrikaanse kruising en geen synoniem van Pinot Noir.",
    "tags": [
      "sden-1.2",
      "syrah",
      "shiraz"
    ]
  },
  {
    "id": "q-sden2-003",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welke fase van de jaarlijkse cyclus vindt wintersnoei normaal plaats?",
    "options": [
      "Tijdens de winterrust",
      "Tijdens de bloei",
      "Tijdens de kleuromslag",
      "Vlak voor de vruchtzetting"
    ],
    "answer": 0,
    "explanation": "Wintersnoei vindt plaats wanneer de wijnstok in rust is en bepaalt mede hoeveel knoppen voor het nieuwe seizoen overblijven.",
    "misconception": "Snoei in het groeiseizoen heet groene snoei en heeft een ander moment en doel dan wintersnoei.",
    "tags": [
      "sden-2a.2",
      "wintersnoei",
      "jaarcyclus"
    ]
  },
  {
    "id": "q-sden2-004",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is een belangrijk doel van groene snoei in de zomer?",
    "options": [
      "De wijn laten gisten",
      "De bodem zuurder maken",
      "De wortels op een onderstam enten",
      "Het bladerdek en de scheuten beheersen"
    ],
    "answer": 3,
    "explanation": "Met groene snoei beheert de wijnbouwer scheuten en bladeren, zodat licht en lucht beter bij de druiven kunnen komen.",
    "misconception": "Groene snoei is werk aan bovengrondse groene delen van de wijnstok en geen kelder- of bodemhandeling.",
    "tags": [
      "sden-2a.2",
      "groene-snoei",
      "bladerdek"
    ]
  },
  {
    "id": "q-sden2-005",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke volgorde van ontwikkelingsfasen van de wijnstok is juist?",
    "options": [
      "Bloei, uitbotten, kleuromslag, vruchtzetting",
      "Vruchtzetting, bloei, uitbotten, rijping",
      "Uitbotten, bloei, vruchtzetting, kleuromslag",
      "Kleuromslag, uitbotten, bloei, vruchtzetting"
    ],
    "answer": 2,
    "explanation": "Na het uitbotten volgt de bloei, daarna de vruchtzetting en later de kleuromslag aan het begin van de rijping.",
    "misconception": "Vruchtzetting kan pas na de bloei plaatsvinden; kleuromslag komt weer later in het groeiseizoen.",
    "tags": [
      "sden-2a.2",
      "jaarcyclus",
      "kleuromslag"
    ]
  },
  {
    "id": "q-sden2-006",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat gebeurt er bij een geslaagde vruchtzetting na de bloei?",
    "options": [
      "De bladeren vallen af",
      "Bevruchte bloemen ontwikkelen zich tot kleine druiven",
      "De druiven worden direct volledig rijp",
      "De wijnstok gaat in winterrust"
    ],
    "answer": 1,
    "explanation": "Bij de vruchtzetting ontwikkelen bevruchte bloemen zich tot kleine druiven die daarna verder groeien en rijpen.",
    "misconception": "Vruchtzetting is het begin van de ontwikkeling van de bes en niet het moment waarop de druif al rijp is.",
    "tags": [
      "sden-2a.2",
      "vruchtzetting",
      "bloei"
    ]
  },
  {
    "id": "q-sden2-007",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat wordt bedoeld met de kleuromslag, ook wel véraison genoemd?",
    "options": [
      "De druiven beginnen van kleur te veranderen en zachter te worden",
      "De bladeren worden door vorst bruin",
      "De wijn wordt tijdens lagering donkerder",
      "De wijnstok wordt op een onderstam geënt"
    ],
    "answer": 0,
    "explanation": "Bij de kleuromslag veranderen de bessen van kleur, worden ze zachter en begint de eigenlijke rijpingsfase duidelijk zichtbaar.",
    "misconception": "Véraison is een fase in de ontwikkeling van de druif en geen kleurverandering van wijn tijdens de bereiding.",
    "tags": [
      "sden-2a.2",
      "veraison",
      "rijping"
    ]
  },
  {
    "id": "q-sden2-008",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk deel van de wijnstok wordt vooral aangetast door druifluis, oftewel phylloxera?",
    "options": [
      "Alleen de bloesem",
      "Alleen rijpe druiven",
      "De houten vaten",
      "Vooral de wortels"
    ],
    "answer": 3,
    "explanation": "De schadelijkste vorm van phylloxera tast de wortels van vatbare Europese wijnstokken aan en kan de plant doden.",
    "misconception": "Phylloxera is een insectenplaag van de wijnstok en geen schimmel op druiven of een probleem in de kelder.",
    "tags": [
      "sden-2b.2",
      "phylloxera",
      "wijnstokziekte"
    ]
  },
  {
    "id": "q-sden2-009",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wanneer kan Botrytis cinerea als edelrot juist gewenst zijn?",
    "options": [
      "Wanneer alle druiven volledig wegrotten",
      "Wanneer de wijn al gebotteld is",
      "Wanneer gecontroleerde aantasting de druiven voor zoete wijn concentreert",
      "Wanneer een rode wijn meer koolzuur nodig heeft"
    ],
    "answer": 2,
    "explanation": "Onder gunstige omstandigheden laat edelrot water uit de druif verdampen, waardoor suiker, zuren en smaken geconcentreerd raken.",
    "misconception": "Dezelfde schimmel kan bij ongunstige omstandigheden grijze rot geven; niet elke aantasting is dus edelrot.",
    "tags": [
      "sden-2b.2",
      "edelrot",
      "botrytis"
    ]
  },
  {
    "id": "q-sden2-010",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke verandering vindt normaal plaats terwijl wijndruiven rijpen?",
    "options": [
      "Suiker neemt af en zuur neemt toe",
      "Suiker neemt toe en zuur neemt af",
      "Suiker en zuur verdwijnen volledig",
      "Alleen de pitten worden groter"
    ],
    "answer": 1,
    "explanation": "Tijdens de rijping neemt het suikergehalte doorgaans toe en daalt het zuurgehalte, terwijl kleur en tannine verder ontwikkelen.",
    "misconception": "Rijping draait niet alleen om zoetheid; ook zuren, kleurstoffen, aroma's en tannines veranderen.",
    "tags": [
      "sden-2b.2",
      "rijping",
      "suiker",
      "zuren"
    ]
  },
  {
    "id": "q-sden2-011",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is in het algemeen een kenmerk van druiven uit een koel klimaat?",
    "options": [
      "Meer behoud van zuren en een lager potentieel alcoholgehalte",
      "Altijd meer suiker en minder zuur",
      "Altijd edelrot",
      "Geen verschil met een warm klimaat"
    ],
    "answer": 0,
    "explanation": "In een koel klimaat rijpen druiven langzamer en behouden ze doorgaans meer zuur, met gemiddeld minder suikervorming.",
    "misconception": "Een koel klimaat maakt wijn niet automatisch beter of slechter; het beïnvloedt vooral rijping en wijnstijl.",
    "tags": [
      "sden-2c.2",
      "koel-klimaat",
      "zuren"
    ]
  },
  {
    "id": "q-sden2-012",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is het directe doel van irrigatie in een droge wijngaard?",
    "options": [
      "Meer alcohol aan de wijn toevoegen",
      "Gistresten uit de fles verwijderen",
      "De wijnstok van water voorzien",
      "De druiven machinaal kneuzen"
    ],
    "answer": 2,
    "explanation": "Irrigatie vult een tekort aan neerslag aan en voorziet de wijnstok van water tijdens droge omstandigheden.",
    "misconception": "Irrigatie is een wijngaardhandeling en heeft niets te maken met alcohol toevoegen of kelderwerk.",
    "tags": [
      "sden-2c.2",
      "irrigatie",
      "droogte"
    ]
  },
  {
    "id": "q-sden2-013",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waar komt bij de meeste rode wijn de kleur voornamelijk vandaan?",
    "options": [
      "Uit helder druivensap",
      "Uit de gist",
      "Uit het houten vat",
      "Uit contact van het sap met de druivenschillen"
    ],
    "answer": 3,
    "explanation": "De kleurstoffen zitten vooral in de schillen van blauwe druiven en worden tijdens schilcontact aan het sap afgegeven.",
    "misconception": "Het vruchtvlees en sap van veel blauwe druiven zijn vrijwel kleurloos; de schil levert de rode kleur.",
    "tags": [
      "sden-3a.2",
      "rode-wijn",
      "schilcontact"
    ]
  },
  {
    "id": "q-sden2-014",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke werkwijze is kenmerkend voor de meeste witte wijn?",
    "options": [
      "Weken met blauwe schillen na botteling",
      "De druiven persen vóór de alcoholische gisting",
      "Altijd jarenlange vatrijping",
      "Alcohol toevoegen vóór het persen"
    ],
    "answer": 1,
    "explanation": "Voor de meeste witte wijn wordt het sap vóór de gisting van de schillen gescheiden door de druiven te persen.",
    "misconception": "Witte wijn hoeft niet van witte druiven te komen, maar langdurig schilcontact wordt doorgaans vermeden.",
    "tags": [
      "sden-3a.2",
      "witte-wijn",
      "persen"
    ]
  },
  {
    "id": "q-sden2-015",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Hoe krijgt een rosé volgens de meest gebruikelijke methode zijn roze kleur?",
    "options": [
      "Door kort contact met de schillen van blauwe druiven",
      "Door altijd rode en witte wijn te mengen",
      "Door rijping in nieuwe houten vaten",
      "Door extra gist toe te voegen"
    ],
    "answer": 0,
    "explanation": "Bij de meest gebruikte methode geven blauwe schillen tijdens een kort schilcontact een beperkte hoeveelheid kleur af.",
    "misconception": "Rosé wordt meestal niet gemaakt door afgewerkte rode en witte wijn te mengen; kort schilcontact is gebruikelijker.",
    "tags": [
      "sden-3a.2",
      "rose",
      "schilcontact"
    ]
  },
  {
    "id": "q-sden2-016",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat doet gist tijdens de alcoholische gisting?",
    "options": [
      "Zet alcohol om in suiker",
      "Verwijdert alle zuren",
      "Zet suiker om in alcohol en koolzuurgas",
      "Voegt tannine uit eikenhout toe"
    ],
    "answer": 2,
    "explanation": "Gist verbruikt druivensuiker en produceert daarbij vooral alcohol, koolzuurgas en warmte.",
    "misconception": "Gist maakt geen suiker; het gebruikt aanwezige suiker als grondstof voor de alcoholische gisting.",
    "tags": [
      "sden-3a.2",
      "gisting",
      "gist"
    ]
  },
  {
    "id": "q-sden2-017",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waar vindt de tweede gisting plaats bij de traditionele methode voor mousserende wijn?",
    "options": [
      "In een open kuip",
      "In de fles",
      "In de wijngaard",
      "Pas in het glas"
    ],
    "answer": 1,
    "explanation": "Bij de traditionele methode ontstaat het koolzuur door een tweede alcoholische gisting in de uiteindelijke fles.",
    "misconception": "Bij de tankmethode vindt de tweede gisting in een druktank plaats; dat is niet de traditionele methode.",
    "tags": [
      "sden-3b.2",
      "mousserend",
      "traditionele-methode"
    ]
  },
  {
    "id": "q-sden2-018",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke handeling maakt van een gewone wijn een versterkte wijn?",
    "options": [
      "De wijn sterker filteren",
      "Alle zuren verwijderen",
      "Koolzuur in de wijn pompen",
      "Alcohol van wijnbouwkundige oorsprong toevoegen"
    ],
    "answer": 3,
    "explanation": "Versterkte wijn krijgt een hoger alcoholgehalte doordat wijnalcohol of druivendistillaat wordt toegevoegd tijdens of na de gisting.",
    "misconception": "Het woord versterkt verwijst naar toegevoegd alcohol en niet naar extra filtering, hout of koolzuur.",
    "tags": [
      "sden-3b.2",
      "versterkte-wijn",
      "alcohol"
    ]
  },
  {
    "id": "q-sden2-019",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke drie druivenrassen worden het meest gebruikt voor Champagne?",
    "options": [
      "Riesling, Gewürztraminer en Pinot Blanc",
      "Chenin Blanc, Sauvignon Blanc en Sémillon",
      "Chardonnay, Pinot Noir en Meunier",
      "Gamay, Grenache en Syrah"
    ],
    "answer": 2,
    "explanation": "Chardonnay, Pinot Noir en Meunier zijn de drie veruit meest gebruikte druivenrassen binnen de appellatie Champagne.",
    "misconception": "Champagne kan witte wijn bevatten uit blauwe druiven, omdat snel persen langdurig schilcontact voorkomt.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "champagne"
    ]
  },
  {
    "id": "q-sden2-020",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Met welke Franse wijnstreek wordt Gewürztraminer vooral geassocieerd?",
    "options": [
      "Elzas",
      "Bordeaux",
      "Beaujolais",
      "Muscadet"
    ],
    "answer": 0,
    "explanation": "Gewürztraminer is een karakteristiek aromatisch druivenras van de Elzas in het noordoosten van Frankrijk.",
    "misconception": "Gewürztraminer klinkt Duits, maar is voor SDEN 2 juist een belangrijke koppeling met de Franse Elzas.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "elzas",
      "gewurztraminer"
    ]
  },
  {
    "id": "q-sden2-021",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke druif hoort bij de typische witte wijnen van de Elzas?",
    "options": [
      "Tempranillo",
      "Pinot Blanc",
      "Carmenère",
      "Gamay"
    ],
    "answer": 1,
    "explanation": "Pinot Blanc is een van de bekende witte druiven van de Elzas en staat ook op de SDEN-2-proeflijst.",
    "misconception": "Pinot Blanc is een wit druivenras; Pinot Noir is een ander ras en levert doorgaans rode wijn.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "elzas",
      "pinot-blanc"
    ]
  },
  {
    "id": "q-sden2-022",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Van welk druivenras wordt witte Chablis gemaakt?",
    "options": [
      "Sauvignon Blanc",
      "Chenin Blanc",
      "Riesling",
      "Chardonnay"
    ],
    "answer": 3,
    "explanation": "Chablis ligt in Bourgogne en de witte wijn van deze appellatie wordt van Chardonnay gemaakt.",
    "misconception": "De frisse stijl van Chablis kan aan Sauvignon Blanc doen denken, maar het druivenras is Chardonnay.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "chablis",
      "chardonnay"
    ]
  },
  {
    "id": "q-sden2-023",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras is kenmerkend voor rode wijn uit de Côte de Nuits?",
    "options": [
      "Cabernet Sauvignon",
      "Gamay",
      "Pinot Noir",
      "Grenache"
    ],
    "answer": 2,
    "explanation": "De Côte de Nuits in Bourgogne is vooral bekend om rode kwaliteitswijnen van Pinot Noir.",
    "misconception": "Gamay hoort vooral bij Beaujolais; de klassieke rode druif van de Côte de Nuits is Pinot Noir.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bourgogne",
      "cote-de-nuits"
    ]
  },
  {
    "id": "q-sden2-024",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Uit welke twee belangrijke delen bestaat de Côte d'Or in Bourgogne?",
    "options": [
      "Côte de Nuits en Côte de Beaune",
      "Chablis en Beaujolais",
      "Médoc en Graves",
      "Anjou en Muscadet"
    ],
    "answer": 0,
    "explanation": "De Côte d'Or wordt gevormd door de noordelijke Côte de Nuits en de zuidelijker gelegen Côte de Beaune.",
    "misconception": "Chablis en Beaujolais worden vaak met Bourgogne verbonden, maar vormen samen niet de Côte d'Or.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bourgogne",
      "cote-dor"
    ]
  },
  {
    "id": "q-sden2-025",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras vormt de basis van rode Beaujolais?",
    "options": [
      "Merlot",
      "Gamay",
      "Syrah",
      "Tempranillo"
    ],
    "answer": 1,
    "explanation": "Rode Beaujolais wordt gemaakt van Gamay, een druif die vaak fruitige wijnen met weinig tannine geeft.",
    "misconception": "Pinot Noir domineert veel rode Bourgogne, maar Beaujolais wordt juist met Gamay geassocieerd.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "beaujolais",
      "gamay"
    ]
  },
  {
    "id": "q-sden2-026",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Bij welke Franse wijnstreek hoort Muscadet?",
    "options": [
      "Rhône",
      "Bordeaux",
      "Loire",
      "Elzas"
    ],
    "answer": 2,
    "explanation": "Muscadet ligt in het westelijke deel van het Loiregebied, rond de monding van de rivier bij Nantes.",
    "misconception": "Muscadet is een herkomstnaam uit de Loire en moet niet worden verward met het druivenras Muscat.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "loire",
      "muscadet"
    ]
  },
  {
    "id": "q-sden2-027",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke twee appellaties horen allebei bij het Loiregebied?",
    "options": [
      "Pomerol en Sauternes",
      "Barolo en Soave",
      "Chablis en Côte-Rôtie",
      "Muscadet en Sancerre"
    ],
    "answer": 3,
    "explanation": "Muscadet ligt in het westen van de Loire en Sancerre veel verder oostelijk, maar beide horen bij dezelfde wijnstreek.",
    "misconception": "De Loire is lang en omvat ver uit elkaar liggende subregio's; afstand betekent niet dat ze tot andere hoofdstreken behoren.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "loire",
      "sancerre"
    ]
  },
  {
    "id": "q-sden2-028",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke druif is belangrijk voor witte en zoete wijnen uit Anjou in de Loire?",
    "options": [
      "Chardonnay",
      "Gewürztraminer",
      "Chenin Blanc",
      "Pinot Blanc"
    ],
    "answer": 2,
    "explanation": "Chenin Blanc is een belangrijke Loiredruif en wordt in en rond Anjou gebruikt voor droge, mousserende en zoete wijnstijlen.",
    "misconception": "Sauvignon Blanc is belangrijk in andere delen van de Loire, maar Anjou wordt sterk met Chenin Blanc verbonden.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "loire",
      "anjou",
      "chenin-blanc"
    ]
  },
  {
    "id": "q-sden2-029",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk blauw druivenras is doorgaans het belangrijkst in Pomerol?",
    "options": [
      "Pinot Noir",
      "Syrah",
      "Merlot",
      "Gamay"
    ],
    "answer": 2,
    "explanation": "Pomerol ligt op de rechteroever van Bordeaux, waar Merlot doorgaans de belangrijkste druif in rode blends is.",
    "misconception": "Cabernet Sauvignon is zeer belangrijk in Bordeaux, maar domineert vaker op de linkeroever dan in Pomerol.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "pomerol",
      "merlot"
    ]
  },
  {
    "id": "q-sden2-030",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Aan welke kant van Bordeaux ligt Saint-Émilion?",
    "options": [
      "Op de rechteroever",
      "Op de linkeroever in Haut-Médoc",
      "In de Loirevallei",
      "In de noordelijke Rhône"
    ],
    "answer": 0,
    "explanation": "Saint-Émilion ligt op de rechteroever van Bordeaux en wordt vooral met Merlot en Cabernet Franc geassocieerd.",
    "misconception": "Haut-Médoc ligt op de linkeroever; Saint-Émilion en Pomerol liggen aan de rechterzijde van het Bordeauxgebied.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "saint-emilion"
    ]
  },
  {
    "id": "q-sden2-031",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omschrijving past het beste bij Sauternes?",
    "options": [
      "Droge rode wijn van Gamay",
      "Mousserende wijn van alleen Pinot Noir",
      "Droge witte wijn uit Chablis",
      "Zoete witte Bordeauxwijn, vaak met invloed van edelrot"
    ],
    "answer": 3,
    "explanation": "Sauternes is een appellatie in Bordeaux voor zoete witte wijn, vaak gemaakt met door edelrot geconcentreerde druiven.",
    "misconception": "Sauternes ligt wel in Bordeaux, maar de klassieke stijl is zoet en wit in plaats van droog en rood.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "sauternes"
    ]
  },
  {
    "id": "q-sden2-032",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waar ligt Haut-Médoc binnen Bordeaux?",
    "options": [
      "Op de rechteroever bij Pomerol",
      "Op de linkeroever",
      "Ten zuiden van de Rhône",
      "In de Elzas"
    ],
    "answer": 1,
    "explanation": "Haut-Médoc is een appellatie op de linkeroever van Bordeaux, waar Cabernet Sauvignon een belangrijke rol speelt.",
    "misconception": "Pomerol en Saint-Émilion zijn rechteroevergebieden; Haut-Médoc hoort bij de linkeroever.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "haut-medoc"
    ]
  },
  {
    "id": "q-sden2-033",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk blauw druivenras is de basis voor klassieke rode wijn uit de noordelijke Rhône?",
    "options": [
      "Gamay",
      "Merlot",
      "Syrah",
      "Tempranillo"
    ],
    "answer": 2,
    "explanation": "Syrah is het kenmerkende blauwe druivenras van de noordelijke Rhône, onder meer in Côte-Rôtie en Hermitage.",
    "misconception": "Grenache domineert veel blends in de zuidelijke Rhône, maar de noordelijke Rhône draait voor rood om Syrah.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "noord-rhone",
      "syrah"
    ]
  },
  {
    "id": "q-sden2-034",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk deel van de Rhône ligt Côte-Rôtie?",
    "options": [
      "In de noordelijke Rhône",
      "In de zuidelijke Rhône",
      "In de Provence",
      "In de Loire"
    ],
    "answer": 0,
    "explanation": "Côte-Rôtie is een appellatie in de noordelijke Rhône en staat vooral bekend om rode wijn van Syrah.",
    "misconception": "Châteauneuf-du-Pape ligt in de zuidelijke Rhône; Côte-Rôtie ligt duidelijk noordelijker.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "rhone",
      "cote-rotie"
    ]
  },
  {
    "id": "q-sden2-035",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke appellatie hoort bij de noordelijke Rhône?",
    "options": [
      "Muscadet",
      "Pomerol",
      "Sancerre",
      "Hermitage"
    ],
    "answer": 3,
    "explanation": "Hermitage ligt in de noordelijke Rhône en is vooral beroemd om rode Syrahwijnen, naast een kleinere hoeveelheid witte wijn.",
    "misconception": "Muscadet en Sancerre liggen in de Loire en Pomerol ligt in Bordeaux; alleen Hermitage hoort bij de Rhône.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "rhone",
      "hermitage"
    ]
  },
  {
    "id": "q-sden2-036",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk deel van de Rhône ligt Châteauneuf-du-Pape?",
    "options": [
      "In de noordelijke Rhône",
      "In de zuidelijke Rhône",
      "In de Bourgogne",
      "In de Elzas"
    ],
    "answer": 1,
    "explanation": "Châteauneuf-du-Pape ligt in de zuidelijke Rhône en staat bekend om blends waarin Grenache vaak belangrijk is.",
    "misconception": "Côte-Rôtie en Hermitage zijn noordelijke appellaties; Châteauneuf-du-Pape ligt in het warmere zuiden.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "rhone",
      "chateauneuf-du-pape"
    ]
  },
  {
    "id": "q-sden2-037",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke druif speelt vaak een hoofdrol in rode blends uit de zuidelijke Rhône?",
    "options": [
      "Riesling",
      "Pinot Blanc",
      "Grenache",
      "Sauvignon Blanc"
    ],
    "answer": 2,
    "explanation": "Grenache is een sleuteldruif in veel rode blends uit de zuidelijke Rhône, vaak samen met Syrah en Mourvèdre.",
    "misconception": "Syrah is belangrijk in blends, maar Grenache vormt in veel zuidelijke Rhôneblends de grootste component.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "zuid-rhone",
      "grenache"
    ]
  },
  {
    "id": "q-sden2-038",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waar ligt Languedoc-Roussillon binnen Frankrijk?",
    "options": [
      "In het mediterrane zuiden",
      "Aan de noordgrens met België",
      "In het hart van Champagne",
      "Ten oosten van de Elzas"
    ],
    "answer": 0,
    "explanation": "Languedoc-Roussillon ligt langs de Middellandse Zee in Zuid-Frankrijk en heeft overwegend een warm klimaat.",
    "misconception": "De streek is zeer groot, maar ligt niet in Noord-Frankrijk; de mediterrane ligging is bepalend.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "languedoc-roussillon"
    ]
  },
  {
    "id": "q-sden2-039",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is Crémant in de Franse wijncontext?",
    "options": [
      "Een zoete rode wijn uit Bordeaux",
      "Een oud druivenras uit de Elzas",
      "Een stille rosé uit de zuidelijke Rhône",
      "Een Franse mousserende wijn van buiten de Champagne"
    ],
    "answer": 3,
    "explanation": "Crémant is de benaming voor mousserende wijn uit verschillende Franse appellaties buiten Champagne, doorgaans via flesgisting.",
    "misconception": "Crémant is geen goedkope categorie Champagne; het komt uit andere officieel afgebakende herkomstgebieden.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "cremant",
      "mousserend"
    ]
  },
  {
    "id": "q-sden2-040",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras is het belangrijkst voor klassieke rode Bourgogne?",
    "options": [
      "Cabernet Sauvignon",
      "Pinot Noir",
      "Tempranillo",
      "Carmenère"
    ],
    "answer": 1,
    "explanation": "Pinot Noir is het kenmerkende ras voor de beroemde rode wijnen van Bourgogne.",
    "misconception": "Gamay groeit ook in Bourgogne en is dominant in Beaujolais, maar klassieke rode Bourgogne draait om Pinot Noir.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bourgogne",
      "pinot-noir"
    ]
  },
  {
    "id": "q-sden2-041",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welke Italiaanse regio ligt Barolo?",
    "options": [
      "Veneto",
      "Toscane",
      "Piemonte",
      "Sicilië"
    ],
    "answer": 2,
    "explanation": "Barolo is een beroemde herkomstbenaming in Piemonte, in het noordwesten van Italië.",
    "misconception": "Chianti en Brunello horen bij Toscane; Barolo ligt noordelijker in Piemonte.",
    "tags": [
      "sden-4.2",
      "italie",
      "piemonte",
      "barolo"
    ]
  },
  {
    "id": "q-sden2-042",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Van welk druivenras wordt Barolo gemaakt?",
    "options": [
      "Nebbiolo",
      "Sangiovese",
      "Corvina",
      "Garganega"
    ],
    "answer": 0,
    "explanation": "Barolo wordt gemaakt van Nebbiolo, een ras dat wijnen met veel zuur en tannine kan opleveren.",
    "misconception": "Sangiovese hoort bij veel Toscaanse wijnen; Barolo uit Piemonte wordt van Nebbiolo gemaakt.",
    "tags": [
      "sden-4.2",
      "italie",
      "barolo",
      "nebbiolo"
    ]
  },
  {
    "id": "q-sden2-043",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welke Italiaanse regio wordt Bardolino geproduceerd?",
    "options": [
      "Piemonte",
      "Toscane",
      "Umbrië",
      "Veneto"
    ],
    "answer": 3,
    "explanation": "Bardolino komt uit Veneto, uit het gebied aan de oostkant van het Gardameer.",
    "misconception": "Bardolino is geen druivenras; het is een herkomstbenaming in Veneto.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "bardolino"
    ]
  },
  {
    "id": "q-sden2-044",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke kleur heeft een klassieke Valpolicella?",
    "options": [
      "Wit",
      "Rood",
      "Alleen rosé",
      "Alleen mousserend"
    ],
    "answer": 1,
    "explanation": "Valpolicella is een rode wijn uit Veneto, doorgaans gebaseerd op lokale blauwe rassen zoals Corvina.",
    "misconception": "Soave komt eveneens uit Veneto maar is wit; Valpolicella is de bekende rode tegenhanger.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "valpolicella"
    ]
  },
  {
    "id": "q-sden2-045",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke wijn is een bekende witte wijn uit Veneto?",
    "options": [
      "Barolo",
      "Brunello di Montalcino",
      "Soave",
      "Chianti"
    ],
    "answer": 2,
    "explanation": "Soave is een witte wijn uit Veneto, voornamelijk gemaakt van het druivenras Garganega.",
    "misconception": "Barolo, Brunello en Chianti zijn rode wijnen uit andere Italiaanse regio's.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "soave"
    ]
  },
  {
    "id": "q-sden2-046",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welke Italiaanse regio ligt het wijngebied Chianti?",
    "options": [
      "Toscane",
      "Piemonte",
      "Veneto",
      "Puglia"
    ],
    "answer": 0,
    "explanation": "Chianti ligt in Toscane in Midden-Italië en de rode wijn is voornamelijk gebaseerd op Sangiovese.",
    "misconception": "Barolo ligt in Piemonte en Soave in Veneto; Chianti hoort bij Toscane.",
    "tags": [
      "sden-4.2",
      "italie",
      "toscane",
      "chianti"
    ]
  },
  {
    "id": "q-sden2-047",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke druif vormt de basis van Brunello di Montalcino?",
    "options": [
      "Nebbiolo",
      "Corvina",
      "Barbera",
      "Sangiovese"
    ],
    "answer": 3,
    "explanation": "Brunello di Montalcino wordt gemaakt van Sangiovese, lokaal traditioneel Brunello genoemd.",
    "misconception": "Nebbiolo hoort bij Barolo in Piemonte; Brunello di Montalcino is een Toscaanse Sangiovesewijn.",
    "tags": [
      "sden-4.2",
      "italie",
      "toscane",
      "brunello-di-montalcino"
    ]
  },
  {
    "id": "q-sden2-048",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke drie wijnen komen allemaal uit Veneto?",
    "options": [
      "Barolo, Chianti en Soave",
      "Bardolino, Valpolicella en Soave",
      "Chianti, Brunello en Barolo",
      "Soave, Barolo en Brunello"
    ],
    "answer": 1,
    "explanation": "Bardolino, Valpolicella en Soave zijn alle drie bekende herkomstbenamingen in de Noord-Italiaanse regio Veneto.",
    "misconception": "Barolo komt uit Piemonte; Chianti en Brunello di Montalcino komen uit Toscane.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto"
    ]
  },
  {
    "id": "q-sden2-049",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke twee wijngebieden liggen beide in Toscane?",
    "options": [
      "Barolo en Bardolino",
      "Soave en Valpolicella",
      "Chianti en Brunello di Montalcino",
      "Barolo en Soave"
    ],
    "answer": 2,
    "explanation": "Chianti en Brunello di Montalcino zijn beide Toscaanse herkomsten en zijn sterk verbonden met Sangiovese.",
    "misconception": "Soave, Bardolino en Valpolicella liggen in Veneto; Barolo ligt in Piemonte.",
    "tags": [
      "sden-4.2",
      "italie",
      "toscane"
    ]
  },
  {
    "id": "q-sden2-050",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waar in Italië ligt Piemonte?",
    "options": [
      "In het noordwesten",
      "Op Sicilië",
      "In het uiterste zuidoosten",
      "Aan de Adriatische kust ten zuiden van Puglia"
    ],
    "answer": 0,
    "explanation": "Piemonte ligt in het noordwesten van Italië, tegen de Alpen en de grenzen met Frankrijk en Zwitserland.",
    "misconception": "De naam Piemonte verwijst naar de ligging aan de voet van de bergen en niet naar Zuid-Italië.",
    "tags": [
      "sden-4.2",
      "italie",
      "piemonte"
    ]
  },
  {
    "id": "q-sden2-051",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke Spaanse streek is beroemd om rode wijnen met de rijpingstermen Crianza en Reserva?",
    "options": [
      "Rueda",
      "Rioja",
      "Jerez",
      "Rías Baixas"
    ],
    "answer": 1,
    "explanation": "Rioja is sterk verbonden met op hout en fles gerijpte rode wijnen die onder meer als Crianza en Reserva worden verkocht.",
    "misconception": "Rueda is vooral bekend om witte wijn en Jerez om sherry; Rioja is hier de klassieke rode herkomst.",
    "tags": [
      "sden-4.2",
      "spanje",
      "rioja",
      "crianza",
      "reserva"
    ]
  },
  {
    "id": "q-sden2-052",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk wit druivenras is kenmerkend voor Rueda?",
    "options": [
      "Albariño",
      "Macabeo",
      "Palomino",
      "Verdejo"
    ],
    "answer": 3,
    "explanation": "Rueda is vooral bekend om frisse witte wijnen van Verdejo, soms aangevuld met andere witte rassen.",
    "misconception": "Palomino hoort vooral bij sherry uit Jerez; Verdejo is de klassieke koppeling met Rueda.",
    "tags": [
      "sden-4.2",
      "spanje",
      "rueda",
      "verdejo"
    ]
  },
  {
    "id": "q-sden2-053",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waar ligt het Spaanse wijngebied La Mancha?",
    "options": [
      "Op de centrale hoogvlakte",
      "Aan de Duitse grens",
      "Op de Canarische Eilanden",
      "In het uiterste noordwesten aan de Atlantische Oceaan"
    ],
    "answer": 0,
    "explanation": "La Mancha ligt op de warme, droge centrale hoogvlakte van Spanje en is een zeer groot wijnbouwgebied.",
    "misconception": "La Mancha is geen kleine kuststreek; het ligt landinwaarts op de Spaanse Meseta.",
    "tags": [
      "sden-4.2",
      "spanje",
      "la-mancha"
    ]
  },
  {
    "id": "q-sden2-054",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Uit welk Spaans gebied komt sherry?",
    "options": [
      "Rioja",
      "Rueda",
      "Jerez",
      "Priorat"
    ],
    "answer": 2,
    "explanation": "Sherry komt uit het afgebakende gebied rond Jerez de la Frontera in Andalusië.",
    "misconception": "Sherry is een wijnstijl met een beschermde Spaanse herkomst en is geen algemene naam voor alle versterkte wijn.",
    "tags": [
      "sden-4.2",
      "spanje",
      "jerez",
      "sherry"
    ]
  },
  {
    "id": "q-sden2-055",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke Rioja heeft volgens de rijpingscategorie meer verplichte rijping gehad: Joven of Crianza?",
    "options": [
      "Joven",
      "Crianza",
      "Beide categorieën zijn altijd even oud",
      "Geen van beide mag rijpen"
    ],
    "answer": 1,
    "explanation": "Crianza is een officiële rijpingscategorie met minimumduur; Joven of generieke wijn is bedoeld voor jongere consumptie.",
    "misconception": "Joven betekent jong en is niet de categorie met langere verplichte hout- en flesrijping.",
    "tags": [
      "sden-4.2",
      "spanje",
      "rioja",
      "joven",
      "crianza"
    ]
  },
  {
    "id": "q-sden2-056",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke Spaanse rijpingsterm staat boven Crianza en vraagt doorgaans langere rijping?",
    "options": [
      "Blanco",
      "Seco",
      "Joven",
      "Reserva"
    ],
    "answer": 3,
    "explanation": "Reserva is een hogere rijpingscategorie dan Crianza en vereist een langere combinatie van vat- en flesrijping.",
    "misconception": "Seco zegt iets over droogtegraad en Joven over jonge stijl; geen van beide is een hogere rijpingscategorie.",
    "tags": [
      "sden-4.2",
      "spanje",
      "crianza",
      "reserva"
    ]
  },
  {
    "id": "q-sden2-057",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omschrijving past het beste bij een Spaanse wijn met de term Joven?",
    "options": [
      "Een jonge wijn met weinig of geen verplichte houtrijping",
      "Een wijn die altijd minimaal tien jaar oud is",
      "Een uitsluitend zoete versterkte wijn",
      "Een mousserende wijn met flesgisting"
    ],
    "answer": 0,
    "explanation": "Joven betekent jong en wordt gebruikt voor wijnen die vroeg worden uitgebracht en weinig of geen verplichte houtrijping hebben.",
    "misconception": "Joven is geen kwaliteitsafwijzing; het beschrijft vooral een jongere, fruitgerichte rijpingsstijl.",
    "tags": [
      "sden-4.2",
      "spanje",
      "joven",
      "etikettering"
    ]
  },
  {
    "id": "q-sden2-058",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Uit welk Portugees wijngebied komt port?",
    "options": [
      "Vinho Verde",
      "Alentejo",
      "Douro",
      "Dão"
    ],
    "answer": 2,
    "explanation": "Port wordt geproduceerd van druiven uit het afgebakende Dourogebied in het noorden van Portugal.",
    "misconception": "De wijn wordt naar Porto genoemd en daar traditioneel verhandeld, maar de druiven komen uit de Douro.",
    "tags": [
      "sden-4.2",
      "portugal",
      "douro",
      "port"
    ]
  },
  {
    "id": "q-sden2-059",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omschrijving past het beste bij Ruby Port?",
    "options": [
      "Bleek, zeer droog en onder flor gerijpt",
      "Fruitig, zoet en dieprood van stijl",
      "Mousserend en laag in alcohol",
      "Lang oxidatief gerijpt met vooral notige aroma's"
    ],
    "answer": 1,
    "explanation": "Ruby Port wordt relatief beschermd tegen zuurstof gerijpt en behoudt daardoor een diepe kleur en uitgesproken fruitigheid.",
    "misconception": "Notige, oxidatieve aroma's en een taankleurige tint zijn eerder kenmerkend voor Tawny Port.",
    "tags": [
      "sden-4.2",
      "portugal",
      "port",
      "ruby"
    ]
  },
  {
    "id": "q-sden2-060",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke aroma's passen het best bij een gerijpte Tawny Port?",
    "options": [
      "Alleen vers gras en groene paprika",
      "Banaan en kauwgom",
      "Verse gist en citrus zonder oxidatie",
      "Noten, gedroogd fruit en karamel"
    ],
    "answer": 3,
    "explanation": "Tawny Port ontwikkelt door oxidatieve vatrijping vaak aroma's van noten, gedroogd fruit, karamel en specerijen.",
    "misconception": "Tawny verwijst naar een door rijping verkregen taankleurige stijl en niet simpelweg naar een lichtere Ruby.",
    "tags": [
      "sden-4.2",
      "portugal",
      "port",
      "tawny"
    ]
  },
  {
    "id": "q-sden2-061",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omschrijving past bij Fino Sherry?",
    "options": [
      "Droog, bleek en biologisch gerijpt onder flor",
      "Zoet, donker en gemaakt van ingedroogde PX-druiven",
      "Rood en mousserend",
      "Fruitig rood en gemaakt in Rioja"
    ],
    "answer": 0,
    "explanation": "Fino is een droge, bleke sherry die onder een beschermende laag flor biologisch rijpt.",
    "misconception": "Niet alle sherry is zoet; Fino is juist een klassiek voorbeeld van een zeer droge stijl.",
    "tags": [
      "sden-4.2",
      "spanje",
      "sherry",
      "fino"
    ]
  },
  {
    "id": "q-sden2-062",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omschrijving past bij PX Sherry?",
    "options": [
      "Altijd droog en kleurloos",
      "Licht mousserend en friszuur",
      "Zeer zoet, donker en rozijnachtig",
      "Rood, tanninerijk en gemaakt van Tempranillo"
    ],
    "answer": 2,
    "explanation": "PX van Pedro Ximénez is doorgaans zeer zoet, donker en geconcentreerd, met aroma's van rozijnen en gedroogd fruit.",
    "misconception": "De droge reputatie van Fino geldt niet voor alle sherry; PX vormt juist een uitgesproken zoete stijl.",
    "tags": [
      "sden-4.2",
      "spanje",
      "sherry",
      "px"
    ]
  },
  {
    "id": "q-sden2-063",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras is het sterkst verbonden met de Mosel?",
    "options": [
      "Grüner Veltliner",
      "Riesling",
      "Sangiovese",
      "Chenin Blanc"
    ],
    "answer": 1,
    "explanation": "De Mosel is een koel Duits wijngebied dat internationaal vooral bekendstaat om Riesling met hoge zuren.",
    "misconception": "Grüner Veltliner is vooral Oostenrijks; Riesling is de klassieke druif van de Mosel.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "mosel",
      "riesling"
    ]
  },
  {
    "id": "q-sden2-064",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk land ligt het wijngebied Rheingau?",
    "options": [
      "Oostenrijk",
      "Hongarije",
      "Frankrijk",
      "Duitsland"
    ],
    "answer": 3,
    "explanation": "Rheingau is een Duits wijngebied langs de Rijn en staat vooral bekend om Riesling.",
    "misconception": "De naam verwijst naar de Rijn; Rheingau is niet hetzelfde als het Oostenrijkse Wachau.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "rheingau"
    ]
  },
  {
    "id": "q-sden2-065",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke van deze namen is een Duits wijngebied?",
    "options": [
      "Rheinhessen",
      "Mendoza",
      "Stellenbosch",
      "Marlborough"
    ],
    "answer": 0,
    "explanation": "Rheinhessen is het grootste Duitse wijngebied gemeten naar wijngaardoppervlak.",
    "misconception": "Mendoza ligt in Argentinië, Stellenbosch in Zuid-Afrika en Marlborough in Nieuw-Zeeland.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "rheinhessen"
    ]
  },
  {
    "id": "q-sden2-066",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke combinatie van wijngebied en land is juist?",
    "options": [
      "Pfalz — Oostenrijk",
      "Pfalz — Hongarije",
      "Pfalz — Duitsland",
      "Pfalz — Portugal"
    ],
    "answer": 2,
    "explanation": "Pfalz is een belangrijk Duits wijngebied waar onder andere veel Riesling wordt verbouwd.",
    "misconception": "Pfalz klinkt niet als een druivenras; het is een geografisch wijngebied in Duitsland.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "pfalz"
    ]
  },
  {
    "id": "q-sden2-067",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk land ligt het wijngebied Baden?",
    "options": [
      "Frankrijk",
      "Duitsland",
      "Spanje",
      "Portugal"
    ],
    "answer": 1,
    "explanation": "Baden is een langgerekt Duits wijngebied in het zuidwesten van het land.",
    "misconception": "Baden ligt dicht bij Frankrijk en Zwitserland, maar is officieel een Duits wijngebied.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "baden"
    ]
  },
  {
    "id": "q-sden2-068",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat betekent trocken op het etiket van een Duitse wijn?",
    "options": [
      "Mousserend",
      "Versterkt",
      "Zoet",
      "Droog"
    ],
    "answer": 3,
    "explanation": "Trocken is de Duitse officiële smaakaanduiding voor een droge wijn binnen vastgelegde grenswaarden.",
    "misconception": "Trocken zegt iets over de droogtegraad en niet over kwaliteit, druivenras of het gebruik van hout.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "trocken",
      "etikettering"
    ]
  },
  {
    "id": "q-sden2-069",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke algemene smaakstijl duidt halbtrocken op een Duits wijnetiket aan?",
    "options": [
      "Halfdroog",
      "Zeer zoet",
      "Mousserend",
      "Versterkt"
    ],
    "answer": 0,
    "explanation": "Halbtrocken betekent halfdroog en duidt doorgaans op iets meer restsuiker dan trocken.",
    "misconception": "Halbtrocken is geen druivenras of kwaliteitsniveau; het is een aanduiding van de smaakstijl.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "halbtrocken",
      "etikettering"
    ]
  },
  {
    "id": "q-sden2-070",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Met welk land wordt Grüner Veltliner het sterkst geassocieerd?",
    "options": [
      "Spanje",
      "Chili",
      "Oostenrijk",
      "Zuid-Afrika"
    ],
    "answer": 2,
    "explanation": "Grüner Veltliner is het kenmerkende witte druivenras van Oostenrijk.",
    "misconception": "De Duitstalige naam betekent niet dat de druif vooral Duits is; Oostenrijk is de klassieke herkomst.",
    "tags": [
      "sden-4.2",
      "oostenrijk",
      "gruner-veltliner"
    ]
  },
  {
    "id": "q-sden2-071",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welke Oostenrijkse deelstaat ligt het wijngebied Wachau?",
    "options": [
      "Burgenland",
      "Steiermark",
      "Niederösterreich",
      "Wenen"
    ],
    "answer": 2,
    "explanation": "Wachau ligt langs de Donau in Niederösterreich, de grootste wijnbouwdeelstaat van Oostenrijk.",
    "misconception": "Wachau is een wijngebied binnen Niederösterreich en niet een zelfstandig land of druivenras.",
    "tags": [
      "sden-4.2",
      "oostenrijk",
      "wachau",
      "niederosterreich"
    ]
  },
  {
    "id": "q-sden2-072",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke wijnstreek ligt in Hongarije?",
    "options": [
      "Tokaj",
      "Mosel",
      "Rueda",
      "Barossa Valley"
    ],
    "answer": 0,
    "explanation": "Tokaj ligt in het noordoosten van Hongarije en is een van de bekendste wijnstreken van het land.",
    "misconception": "Mosel ligt in Duitsland, Rueda in Spanje en Barossa Valley in Australië.",
    "tags": [
      "sden-4.2",
      "hongarije",
      "tokaj"
    ]
  },
  {
    "id": "q-sden2-073",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Om welke wijnstijl is Tokaj traditioneel beroemd?",
    "options": [
      "Tanninerijke rode wijn van Cabernet Sauvignon",
      "Zoete witte wijn van geconcentreerde druiven",
      "Droge versterkte wijn onder flor",
      "Mousserende rosé via de tankmethode"
    ],
    "answer": 1,
    "explanation": "Tokaj is historisch beroemd om zoete witte wijnen, vaak van druiven die door edelrot zijn geconcentreerd.",
    "misconception": "Tokaj is een herkomst en geen druivenras; de beroemde klassieke stijl is zoet en wit.",
    "tags": [
      "sden-4.2",
      "hongarije",
      "tokaj",
      "zoete-wijn"
    ]
  },
  {
    "id": "q-sden2-074",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk smaakkenmerk is typisch voor Riesling uit een koel Duits wijngebied?",
    "options": [
      "Zeer lage zuren",
      "Hoge zuren",
      "Altijd zware tannine",
      "Altijd hoog alcohol"
    ],
    "answer": 1,
    "explanation": "Riesling behoudt in koele Duitse gebieden doorgaans hoge zuren, ook wanneer de wijn wat restsuiker bevat.",
    "misconception": "Zoetheid en zuur zijn afzonderlijke eigenschappen; een wijn met restsuiker kan tegelijk hoge zuren hebben.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "riesling",
      "zuren"
    ]
  },
  {
    "id": "q-sden2-075",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welke Amerikaanse staat ligt Napa Valley?",
    "options": [
      "Oregon",
      "Washington",
      "Californië",
      "New York"
    ],
    "answer": 2,
    "explanation": "Napa Valley is een bekend wijngebied in Californië, ten noorden van San Francisco.",
    "misconception": "Ook Oregon en Washington produceren wijn, maar Napa Valley ligt in Californië.",
    "tags": [
      "sden-4.2",
      "verenigde-staten",
      "californie",
      "napa-valley"
    ]
  },
  {
    "id": "q-sden2-076",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk blauw druivenras is zeer belangrijk voor rode kwaliteitswijn uit Napa Valley?",
    "options": [
      "Cabernet Sauvignon",
      "Gamay",
      "Nebbiolo",
      "Pinotage"
    ],
    "answer": 0,
    "explanation": "Napa Valley is internationaal sterk verbonden met rijpe, geconcentreerde Cabernet Sauvignon.",
    "misconception": "Pinotage hoort vooral bij Zuid-Afrika en Gamay bij Beaujolais; Napa is klassiek Cabernetgebied.",
    "tags": [
      "sden-4.2",
      "verenigde-staten",
      "napa-valley",
      "cabernet-sauvignon"
    ]
  },
  {
    "id": "q-sden2-077",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk Zuid-Amerikaans land ligt het wijngebied Central Valley?",
    "options": [
      "Argentinië",
      "Brazilië",
      "Uruguay",
      "Chili"
    ],
    "answer": 3,
    "explanation": "Central Valley is een omvangrijke wijnzone in Chili en omvat meerdere belangrijke subregio's.",
    "misconception": "Mendoza ligt aan de andere kant van de Andes in Argentinië; Central Valley hoort bij Chili.",
    "tags": [
      "sden-4.2",
      "chili",
      "central-valley"
    ]
  },
  {
    "id": "q-sden2-078",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Met welk land wordt het druivenras Carmenère het sterkst geassocieerd?",
    "options": [
      "Duitsland",
      "Chili",
      "Nieuw-Zeeland",
      "Portugal"
    ],
    "answer": 1,
    "explanation": "Carmenère is de onderscheidende blauwe druif van Chili, hoewel het ras historisch uit Bordeaux afkomstig is.",
    "misconception": "De Franse oorsprong maakt Carmenère nog niet de belangrijkste moderne Franse specialiteit; Chili is de kernassociatie.",
    "tags": [
      "sden-4.2",
      "chili",
      "carmenere"
    ]
  },
  {
    "id": "q-sden2-079",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk land ligt het wijngebied Mendoza?",
    "options": [
      "Argentinië",
      "Chili",
      "Peru",
      "Mexico"
    ],
    "answer": 0,
    "explanation": "Mendoza ligt in het westen van Argentinië aan de voet van de Andes en is het belangrijkste wijnbouwgebied van het land.",
    "misconception": "Mendoza ligt dicht bij Chili, maar bevindt zich aan de Argentijnse zijde van de Andes.",
    "tags": [
      "sden-4.2",
      "argentinie",
      "mendoza"
    ]
  },
  {
    "id": "q-sden2-080",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk blauw druivenras is kenmerkend voor Mendoza?",
    "options": [
      "Pinotage",
      "Gamay",
      "Malbec",
      "Sangiovese"
    ],
    "answer": 2,
    "explanation": "Mendoza is wereldwijd bekend om krachtige, fruitrijke rode wijnen van Malbec.",
    "misconception": "Pinotage hoort vooral bij Zuid-Afrika; Malbec is de kenmerkende Argentijnse koppeling.",
    "tags": [
      "sden-4.2",
      "argentinie",
      "mendoza",
      "malbec"
    ]
  },
  {
    "id": "q-sden2-081",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk land ligt de wijnregio Coastal Region?",
    "options": [
      "Australië",
      "Zuid-Afrika",
      "Nieuw-Zeeland",
      "Chili"
    ],
    "answer": 1,
    "explanation": "Coastal Region is een grote Zuid-Afrikaanse wijnregio waarin onder andere Stellenbosch ligt.",
    "misconception": "De Engelse naam klinkt algemeen, maar Coastal Region is een officiële Zuid-Afrikaanse geografische aanduiding.",
    "tags": [
      "sden-4.2",
      "zuid-afrika",
      "coastal-region"
    ]
  },
  {
    "id": "q-sden2-082",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke wijnstreek ligt in Zuid-Afrika?",
    "options": [
      "Marlborough",
      "Barossa Valley",
      "Napa Valley",
      "Stellenbosch"
    ],
    "answer": 3,
    "explanation": "Stellenbosch is een vooraanstaand Zuid-Afrikaans wijngebied binnen de Coastal Region.",
    "misconception": "Marlborough ligt in Nieuw-Zeeland, Barossa in Australië en Napa Valley in de Verenigde Staten.",
    "tags": [
      "sden-4.2",
      "zuid-afrika",
      "stellenbosch"
    ]
  },
  {
    "id": "q-sden2-083",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk wit druivenras is bijzonder belangrijk in Zuid-Afrika?",
    "options": [
      "Chenin Blanc",
      "Verdejo",
      "Furmint",
      "Garganega"
    ],
    "answer": 0,
    "explanation": "Chenin Blanc is het meest aangeplante witte druivenras van Zuid-Afrika en levert uiteenlopende wijnstijlen.",
    "misconception": "Verdejo hoort vooral bij Rueda, Furmint bij Tokaj en Garganega bij Soave.",
    "tags": [
      "sden-4.2",
      "zuid-afrika",
      "chenin-blanc"
    ]
  },
  {
    "id": "q-sden2-084",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke combinatie van wijngebied en druif is klassiek voor Australië?",
    "options": [
      "Marlborough — Sauvignon Blanc",
      "Mendoza — Malbec",
      "Barossa Valley — Shiraz",
      "Mosel — Riesling"
    ],
    "answer": 2,
    "explanation": "Barossa Valley in Zuid-Australië is beroemd om volle, rijpe rode wijn van Shiraz.",
    "misconception": "De andere combinaties zijn inhoudelijk juist, maar horen respectievelijk bij Nieuw-Zeeland, Argentinië en Duitsland.",
    "tags": [
      "sden-4.2",
      "australie",
      "barossa-valley",
      "shiraz"
    ]
  },
  {
    "id": "q-sden2-085",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke combinatie hoort bij Nieuw-Zeeland?",
    "options": [
      "Stellenbosch — Chenin Blanc",
      "Marlborough — Sauvignon Blanc",
      "Napa Valley — Cabernet Sauvignon",
      "Douro — Port"
    ],
    "answer": 1,
    "explanation": "Marlborough zette Nieuw-Zeeland internationaal op de kaart met uitgesproken aromatische Sauvignon Blanc.",
    "misconception": "De andere koppelingen kloppen op zichzelf, maar liggen in Zuid-Afrika, de Verenigde Staten en Portugal.",
    "tags": [
      "sden-4.2",
      "nieuw-zeeland",
      "marlborough",
      "sauvignon-blanc"
    ]
  },
  {
    "id": "q-sden2-086",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras wordt in Australië veel gebruikt voor witte wijn en staat op de SDEN-2-proeflijst?",
    "options": [
      "Nebbiolo",
      "Carmenère",
      "Tempranillo",
      "Chardonnay"
    ],
    "answer": 3,
    "explanation": "Australische Chardonnay is een van de herkenbare witte wijnstijlen op de officiële SDEN-2-proeflijst.",
    "misconception": "Shiraz is zeer belangrijk in Australië, maar is een blauw druivenras en geeft rode wijn.",
    "tags": [
      "sden-4.2",
      "australie",
      "chardonnay",
      "proeflijst"
    ]
  },
  {
    "id": "q-sden2-087",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke informatie is volgens de SDEN-2-leerstof verplicht op een wijnetiket?",
    "options": [
      "De naam van het druivenras",
      "Een proefnotitie",
      "Het alcoholgehalte",
      "Een wijn-spijsadvies"
    ],
    "answer": 2,
    "explanation": "Het alcoholgehalte behoort tot de verplichte etiketinformatie; druivenras en proefnotitie zijn niet algemeen verplicht.",
    "misconception": "Veel producenten vermelden het druivenras vrijwillig, maar dat maakt het nog geen algemene wettelijke verplichting.",
    "tags": [
      "sden-5a.2",
      "etikettering",
      "alcoholgehalte"
    ]
  },
  {
    "id": "q-sden2-088",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke aanduiding is volgens de SDEN-2-basisstof meestal niet verplicht op een wijnetiket?",
    "options": [
      "Het oogstjaar",
      "De inhoud van de fles",
      "Het alcoholgehalte",
      "De producent of bottelaar"
    ],
    "answer": 0,
    "explanation": "Het oogstjaar is doorgaans een vrijwillige aanduiding, terwijl inhoud, alcoholgehalte en producent of bottelaar verplicht zijn.",
    "misconception": "Dat een oogstjaar vaak prominent op het etiket staat, betekent niet dat iedere wijn er een moet vermelden.",
    "tags": [
      "sden-5a.2",
      "etikettering",
      "oogstjaar"
    ]
  },
  {
    "id": "q-sden2-089",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is de veiligste keuze wanneer je nog moet autorijden?",
    "options": [
      "Alleen rode wijn drinken",
      "Koffie drinken na de wijn",
      "De laatste wijn snel opdrinken",
      "Geen alcohol drinken"
    ],
    "answer": 3,
    "explanation": "Alcohol kan het reactievermogen al in kleine hoeveelheden beïnvloeden; voor verkeer is niet drinken de veiligste keuze.",
    "misconception": "Koffie, eten of een bepaald type wijn maakt iemand niet direct nuchter en herstelt het reactievermogen niet.",
    "tags": [
      "sden-5b.2",
      "verantwoord-alcoholgebruik",
      "verkeer"
    ]
  },
  {
    "id": "q-sden2-090",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk effect kan alcohol hebben op iemand die aan het verkeer deelneemt?",
    "options": [
      "Het maakt de reacties altijd sneller",
      "Het kan de reactiesnelheid verlagen",
      "Het neutraliseert vermoeidheid",
      "Het verbetert de spiercontrole"
    ],
    "answer": 1,
    "explanation": "Alcohol heeft een verdovende werking en kan reacties vertragen en de controle over bewegingen verminderen.",
    "misconception": "Een subjectief gevoel van zelfvertrouwen betekent niet dat reactievermogen en motoriek daadwerkelijk verbeteren.",
    "tags": [
      "sden-5b.2",
      "verantwoord-alcoholgebruik",
      "reactievermogen"
    ]
  },
  {
    "id": "q-sden2-091",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat betekent droog wanneer je de smaak van een wijn beschrijft?",
    "options": [
      "De wijn bevat geen water",
      "De wijn heeft altijd veel tannine",
      "De wijn smaakt niet of nauwelijks zoet",
      "De wijn heeft altijd op hout gerijpt"
    ],
    "answer": 2,
    "explanation": "Een droge wijn bevat zo weinig waarneembare restsuiker dat hij niet of nauwelijks zoet smaakt.",
    "misconception": "Droog gaat over zoetheidsindruk en niet over tannine, houtgebruik of een tekort aan vloeistof.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "droog"
    ]
  },
  {
    "id": "q-sden2-092",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waardoor herken je een mousserende wijn direct in het glas?",
    "options": [
      "Door belletjes van opgelost koolzuurgas",
      "Door een bruine kleur",
      "Door bezinksel van kurk",
      "Door een olieachtige laag"
    ],
    "answer": 0,
    "explanation": "Mousserende wijn bevat opgelost koolzuurgas dat na openen zichtbaar wordt als een stroom van belletjes.",
    "misconception": "Bezinksel of een diepe kleur zegt niets over mousserendheid; het kenmerk is de aanwezigheid van koolzuur.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "mousserend"
    ]
  },
  {
    "id": "q-sden2-093",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is de logische basisvolgorde bij het systematisch proeven van wijn?",
    "options": [
      "Proeven, ruiken, kijken",
      "Ruiken, inschenken, etiket lezen",
      "Kijken, doorslikken, openen",
      "Kijken, ruiken, proeven"
    ],
    "answer": 3,
    "explanation": "Een eenvoudige proefnotitie begint met het uiterlijk, daarna volgen de geur en ten slotte de smaak.",
    "misconception": "Direct proeven slaat nuttige informatie over kleur, helderheid, intensiteit en geur over.",
    "tags": [
      "sden-6a.2",
      "sden-6b.2",
      "proefnotitie"
    ]
  },
  {
    "id": "q-sden2-094",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke mondsensatie wijst meestal op een wijn met hoge zuren?",
    "options": [
      "Een branderig gevoel door koolzuur",
      "De mond maakt extra speeksel aan",
      "De tong wordt gevoelloos",
      "De wijn voelt altijd zoet"
    ],
    "answer": 1,
    "explanation": "Hoge zuren geven een frisse, strakke indruk en stimuleren de aanmaak van speeksel.",
    "misconception": "Zoetheid kan zuur in balans brengen, maar hoge zuren zelf veroorzaken juist een mondwaterende reactie.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "zuren"
    ]
  },
  {
    "id": "q-sden2-095",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke mondsensatie hoort vooral bij tannine in rode wijn?",
    "options": [
      "Een uitgesproken zoete smaak",
      "Een bruisend gevoel",
      "Een drogend en stroef gevoel",
      "Een zoute nasmaak"
    ],
    "answer": 2,
    "explanation": "Tannine bindt zich aan eiwitten in speeksel en geeft daardoor een drogend, stroef of samentrekkend mondgevoel.",
    "misconception": "Tannine is geen aroma en geen vorm van koolzuur; het wordt vooral als structuur en stroefheid ervaren.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "tannine"
    ]
  },
  {
    "id": "q-sden2-096",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom kan een wijn met frisse zuren goed passen bij een vet gerecht?",
    "options": [
      "De zuren kunnen het mondgevoel verfrissen",
      "De wijn wordt daardoor automatisch zoeter",
      "De wijn verliest alle aroma's",
      "Het gerecht maakt de wijn mousserend"
    ],
    "answer": 0,
    "explanation": "Frisse zuren kunnen na een vette hap voor een schoner, verfrissend mondgevoel zorgen.",
    "misconception": "Zuur verwijdert het vet niet letterlijk en maakt de wijn niet zoet; het verandert vooral de smaakbalans en sensatie.",
    "tags": [
      "sden-6b.2",
      "wijn-spijs",
      "zuren",
      "vet"
    ]
  },
  {
    "id": "q-sden2-097",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke combinatie geldt als een klassieke regionale wijn-spijscombinatie?",
    "options": [
      "Tawny Port met rauwe oesters",
      "Sancerre met geitenkaas",
      "Zware Cabernet met citroensorbet",
      "Fino Sherry met chocoladetaart"
    ],
    "answer": 1,
    "explanation": "Sancerre van Sauvignon Blanc en geitenkaas uit de Loire vormen een bekende combinatie door frisse zuren en regionale aansluiting.",
    "misconception": "Een bekende wijn hoeft niet bij elk bekend gerecht te passen; intensiteit, zoetheid en smaakstructuur moeten aansluiten.",
    "tags": [
      "sden-6b.2",
      "wijn-spijs",
      "sancerre",
      "geitenkaas"
    ]
  },
  {
    "id": "q-sden2-098",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omstandigheden zijn het best voor het langdurig bewaren van wijn?",
    "options": [
      "Warm, licht en met sterke temperatuurschommelingen",
      "Naast een radiator in de keuken",
      "Koel, donker en met een stabiele temperatuur",
      "In direct zonlicht zodat de fles opwarmt"
    ],
    "answer": 2,
    "explanation": "Een koele, donkere plek met een zo constant mogelijke temperatuur helpt vroegtijdige veroudering en schade te beperken.",
    "misconception": "Een gewone huiskamer kan prettig aanvoelen, maar warmte, licht en schommelingen versnellen de ontwikkeling van wijn.",
    "tags": [
      "sden-6b.2",
      "bewaren",
      "temperatuur"
    ]
  },
  {
    "id": "q-sden2-099",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is een belangrijk doel van het decanteren van een oudere rode wijn?",
    "options": [
      "De heldere wijn van bezinksel scheiden",
      "Extra koolzuur toevoegen",
      "Het alcoholgehalte verhogen",
      "De wijn zoeter maken"
    ],
    "answer": 0,
    "explanation": "Door voorzichtig te decanteren kan de heldere wijn van het bezinksel worden gescheiden dat tijdens flesrijping is ontstaan.",
    "misconception": "Beluchten kan een neveneffect zijn, maar bij een oude wijn is het verwijderen van depot een belangrijk hoofddoel.",
    "tags": [
      "sden-6b.2",
      "decanteren",
      "bezinksel"
    ]
  },
  {
    "id": "q-sden2-100",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke geur is kenmerkend voor de wijnfout die vaak 'kurk' wordt genoemd?",
    "options": [
      "Verse citrus en bloemen",
      "Rijp rood fruit",
      "Vanille van nieuw eikenhout",
      "Muffe kelder of nat karton"
    ],
    "answer": 3,
    "explanation": "Kurkfout, vaak veroorzaakt door TCA, geeft typische muffe geuren zoals nat karton en onderdrukt het fruit van de wijn.",
    "misconception": "Losse kurkdeeltjes in het glas bewijzen geen kurkfout; de afwijking wordt vooral aan geur en gedempt fruit herkend.",
    "tags": [
      "sden-6b.2",
      "wijnfout",
      "kurk",
      "tca"
    ]
  },
  {
    "id": "q-sden2-101",
    "topic": "De druif",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke eigenschap van Cabernet Sauvignon draagt vaak bij aan veel kleur en tannine in de wijn?",
    "options": [
      "Zeer dunne, kleurloze schillen",
      "Een natuurlijk hoog koolzuurgehalte",
      "Kleine druiven met relatief dikke schillen",
      "Het ontbreken van pitten"
    ],
    "answer": 2,
    "explanation": "Cabernet Sauvignon heeft kleine bessen met relatief dikke schillen, waardoor tijdens schilcontact veel kleur en tannine kan worden gewonnen.",
    "misconception": "Kleur en tannine komen niet door koolzuur of pitloze druiven, maar vooral door vaste druivendelen zoals schillen.",
    "tags": [
      "sden-1.2",
      "cabernet-sauvignon",
      "tannine"
    ]
  },
  {
    "id": "q-sden2-102",
    "topic": "De druif",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk aromatisch wit druivenras wordt in de SDEN-2-stof met Frankrijk verbonden?",
    "options": [
      "Airén",
      "Garganega",
      "Palomino",
      "Viognier"
    ],
    "answer": 3,
    "explanation": "Viognier is een aromatisch wit druivenras dat in de SDEN-2-toetstermen aan Frankrijk wordt gekoppeld.",
    "misconception": "Airén, Garganega en Palomino zijn witte druiven, maar hun klassieke koppelingen liggen respectievelijk in Spanje en Italië.",
    "tags": [
      "sden-1.2",
      "viognier",
      "frankrijk"
    ]
  },
  {
    "id": "q-sden2-103",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is een belangrijk voordeel van handmatig oogsten?",
    "options": [
      "De druiven gisten al tijdens het plukken",
      "Plukkers kunnen trossen selecteren",
      "De wijnstok heeft geen snoei meer nodig",
      "Regen vormt geen enkel risico meer"
    ],
    "answer": 1,
    "explanation": "Bij handmatige oogst kunnen plukkers ongezonde of onrijpe trossen laten hangen en kwetsbare druiven voorzichtig behandelen.",
    "misconception": "Handpluk voorkomt niet alle problemen in de wijngaard en vervangt geen snoei, maar maakt selectie tijdens de oogst mogelijk.",
    "tags": [
      "sden-2a.2",
      "handmatige-oogst",
      "selectie"
    ]
  },
  {
    "id": "q-sden2-104",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is een belangrijk praktisch voordeel van machinaal oogsten?",
    "options": [
      "Elke druif wordt afzonderlijk geproefd",
      "De druiven krijgen automatisch meer zuur",
      "De wijn hoeft niet meer te gisten",
      "Een groot oppervlak kan snel worden geoogst"
    ],
    "answer": 3,
    "explanation": "Een oogstmachine kan grote wijngaardoppervlakken snel verwerken, wat nuttig is wanneer rijpheid of weersomstandigheden om snelheid vragen.",
    "misconception": "Machinale oogst verandert de chemische samenstelling van druiven niet automatisch en vervangt de alcoholische gisting niet.",
    "tags": [
      "sden-2a.2",
      "machinale-oogst",
      "oogst"
    ]
  },
  {
    "id": "q-sden2-105",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is meestal het gevolg wanneer gezonde druiven langer blijven hangen voor een late oogst?",
    "options": [
      "Meer suiker en rijpere aroma's in de druiven",
      "De druiven worden automatisch mousserend",
      "Alle zuren verdwijnen onmiddellijk",
      "De schillen verliezen altijd hun kleur"
    ],
    "answer": 0,
    "explanation": "Bij een late oogst kunnen druiven verder rijpen en meer suiker en rijpe aroma's opbouwen, zolang weer en gezondheid gunstig blijven.",
    "misconception": "Langer hangen garandeert geen kwaliteit: regen, rot en verlies van zuren blijven belangrijke risico's.",
    "tags": [
      "sden-2a.2",
      "late-oogst",
      "rijping"
    ]
  },
  {
    "id": "q-sden2-106",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom is nachtvorst in het voorjaar gevaarlijk voor een wijngaard?",
    "options": [
      "Hij verhoogt het alcoholgehalte in de fles",
      "Hij maakt houten vaten lek",
      "Jonge knoppen en scheuten kunnen beschadigen",
      "Hij laat rijpe wijn oxideren"
    ],
    "answer": 2,
    "explanation": "Na het uitbotten zijn jonge knoppen en scheuten kwetsbaar; voorjaarsvorst kan ze beschadigen en zo de toekomstige oogst verkleinen.",
    "misconception": "Voorjaarsvorst is een wijngaardrisico tijdens de groei en geen probleem dat pas in de wijnkelder ontstaat.",
    "tags": [
      "sden-2b.2",
      "vorst",
      "uitbotten"
    ]
  },
  {
    "id": "q-sden2-107",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke directe schade kan een zware hagelbui in de wijngaard veroorzaken?",
    "options": [
      "De wijn wordt zoeter in de fles",
      "Bladeren, scheuten en druiven kunnen worden stukgeslagen",
      "De bodem krijgt automatisch meer voeding",
      "De druiven worden tegen schimmel beschermd"
    ],
    "answer": 1,
    "explanation": "Hagel kan bladeren, jonge scheuten en druiven fysiek beschadigen, waardoor opbrengst daalt en wondjes vatbaar worden voor rot.",
    "misconception": "Hagel is geen nuttige vorm van irrigatie; de harde ijsstenen kunnen de wijnstok en de oogst ernstig beschadigen.",
    "tags": [
      "sden-2b.2",
      "hagel",
      "oogstkwaliteit"
    ]
  },
  {
    "id": "q-sden2-108",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Onder welke omstandigheden is de kans op ongewenste grijze rot het grootst?",
    "options": [
      "Bij permanent droge lucht en perfecte ventilatie",
      "Alleen na botteling",
      "Uitsluitend tijdens winterrust",
      "Bij vochtige omstandigheden en beschadigde of dicht opeengepakte druiven"
    ],
    "answer": 3,
    "explanation": "Vocht en slechte ventilatie bevorderen Botrytis; bij ongecontroleerde aantasting ontstaat grijze rot die de druivenkwaliteit verlaagt.",
    "misconception": "Botrytis is niet altijd edelrot: zonder de juiste afwisseling van vocht en droogte ontstaat eerder schadelijke grijze rot.",
    "tags": [
      "sden-2b.2",
      "grijze-rot",
      "botrytis"
    ]
  },
  {
    "id": "q-sden2-109",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom worden veel Europese druivenrassen op Amerikaanse onderstammen geënt?",
    "options": [
      "Om de wortels beter bestand te maken tegen phylloxera",
      "Om elke wijn mousserend te maken",
      "Om de oogst zonder zon te laten rijpen",
      "Om alcoholische gisting te voorkomen"
    ],
    "answer": 0,
    "explanation": "Amerikaanse onderstammen hebben weerstand tegen phylloxera en beschermen zo de wortels van daarop geënte Vitis-viniferarassen.",
    "misconception": "De onderstam beschermt vooral de wortels; hij bepaalt niet rechtstreeks of een wijn stil, zoet of mousserend wordt.",
    "tags": [
      "sden-2b.2",
      "phylloxera",
      "onderstam",
      "enten"
    ]
  },
  {
    "id": "q-sden2-110",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom kan de ligging van een wijngaardhelling belangrijk zijn in een koel klimaat?",
    "options": [
      "Een helling maakt gist overbodig",
      "Alle hellingen krijgen evenveel zon",
      "Een gunstige expositie kan meer zonlicht en warmte geven",
      "Een helling verhoogt automatisch het alcoholgehalte na botteling"
    ],
    "answer": 2,
    "explanation": "Een naar de zon gerichte helling kan meer licht en warmte ontvangen, waardoor druiven in een koel klimaat beter kunnen rijpen.",
    "misconception": "Niet iedere helling is automatisch gunstig; richting, steilte, hoogte en lokale omstandigheden bepalen het effect.",
    "tags": [
      "sden-2c.2",
      "helling",
      "zonlicht",
      "koel-klimaat"
    ]
  },
  {
    "id": "q-sden2-111",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom is een goed drainerende bodem vaak gunstig voor wijnstokken?",
    "options": [
      "Hij maakt alle druiven zoet",
      "Hij beperkt langdurig water rond de wortels",
      "Hij voorkomt iedere vorm van droogte",
      "Hij voegt alcohol toe aan de druif"
    ],
    "answer": 1,
    "explanation": "Goede drainage voert overtollig water af en helpt voorkomen dat wortels langdurig in een te natte, zuurstofarme bodem staan.",
    "misconception": "Drainage betekent niet dat de wijnstok nooit waterstress krijgt; zij gaat vooral over het afvoeren van een overschot.",
    "tags": [
      "sden-2c.2",
      "bodem",
      "drainage",
      "water"
    ]
  },
  {
    "id": "q-sden2-112",
    "topic": "Wijnbouw",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk risico brengt veel regen vlak voor de oogst mee?",
    "options": [
      "De wijn wordt al in de wijngaard gefilterd",
      "De druiven krijgen gegarandeerd meer tannine",
      "De wijnstok gaat direct in winterrust",
      "Druiven kunnen opzwellen, verdunnen of gaan rotten"
    ],
    "answer": 3,
    "explanation": "Veel regen voor de pluk kan druiven water laten opnemen en de kans op barsten, verdunning en schimmelrot verhogen.",
    "misconception": "Regen is tijdens het seizoen nodig, maar vlak voor de oogst kan een grote hoeveelheid de kwaliteit juist bedreigen.",
    "tags": [
      "sden-2c.2",
      "regen",
      "oogst",
      "rot"
    ]
  },
  {
    "id": "q-sden2-113",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is het beoogde effect van chaptalisatie van druivenmost?",
    "options": [
      "Meer kleur uit de schillen halen",
      "De wijn direct mousserend maken",
      "Het potentiële alcoholgehalte verhogen",
      "Een kurkfout uit de wijn verwijderen"
    ],
    "answer": 2,
    "explanation": "Bij chaptalisatie wordt vóór of tijdens de gisting suiker aan de most toegevoegd zodat gist meer alcohol kan vormen.",
    "misconception": "Chaptalisatie is bedoeld om alcohol te verhogen en niet om een afgewerkte wijn simpelweg zoeter te laten smaken.",
    "tags": [
      "sden-3a.2",
      "chaptalisatie",
      "alcohol"
    ]
  },
  {
    "id": "q-sden2-114",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom kiest een wijnmaker voor rijping in roestvrijstalen tanks?",
    "options": [
      "Om fruitige aroma's te behouden zonder houtsmaak toe te voegen",
      "Om de wijn altijd zoet te maken",
      "Om automatisch tannine uit eiken te krijgen",
      "Om de druiven later te kunnen oogsten"
    ],
    "answer": 0,
    "explanation": "Roestvrij staal is neutraal en kan zuurstofcontact beperken, waardoor frisse fruitaroma's zonder smaak van eikenhout behouden blijven.",
    "misconception": "Een tank is niet per definitie beter dan hout; het is een stijlkeuze met andere effecten op aroma en rijping.",
    "tags": [
      "sden-3a.2",
      "tankrijping",
      "roestvrij-staal"
    ]
  },
  {
    "id": "q-sden2-115",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk effect kan rijping in een houten vat op wijn hebben?",
    "options": [
      "De wijn verliest altijd alle fruit",
      "Het vat zet alcohol terug om in suiker",
      "De wijn wordt vanzelf mousserend",
      "De wijn kan houtaroma's en geleidelijke zuurstofinvloed krijgen"
    ],
    "answer": 3,
    "explanation": "Houten vaten kunnen aroma's zoals vanille en specerijen afgeven en laten kleine hoeveelheden zuurstof bij de wijn.",
    "misconception": "Houtrijping maakt een wijn niet automatisch beter en hoeft fruit niet volledig te verbergen; vat en duur bepalen het effect.",
    "tags": [
      "sden-3a.2",
      "houtrijping",
      "zuurstof"
    ]
  },
  {
    "id": "q-sden2-116",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is een belangrijk doel van filtratie vóór het bottelen?",
    "options": [
      "De druiven aan de stok laten rijpen",
      "Ongewenste deeltjes en eventueel micro-organismen uit de wijn verwijderen",
      "Het alcoholgehalte verdubbelen",
      "Meer kleur uit druivenschillen halen"
    ],
    "answer": 1,
    "explanation": "Filtratie kan zwevende deeltjes en bepaalde micro-organismen verwijderen en zo bijdragen aan helderheid en stabiliteit.",
    "misconception": "Filtratie is een kelderhandeling voor helderheid en stabiliteit en verandert de oogstdatum of het druivenras niet.",
    "tags": [
      "sden-3a.2",
      "filtratie",
      "bottelen"
    ]
  },
  {
    "id": "q-sden2-117",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waar vindt de tweede gisting plaats bij de tankmethode, ook cuve close genoemd?",
    "options": [
      "In elk afzonderlijk wijnglas",
      "In een open houten vat zonder druk",
      "In een afgesloten druktank",
      "Aan de wijnstok vóór de oogst"
    ],
    "answer": 2,
    "explanation": "Bij de tankmethode vindt de tweede gisting plaats in een afgesloten druktank, waarna de mousserende wijn onder druk wordt gebotteld.",
    "misconception": "Flesgisting hoort bij de traditionele methode; cuve close gebruikt juist één grote afgesloten tank.",
    "tags": [
      "sden-3b.2",
      "tankmethode",
      "cuve-close",
      "mousserend"
    ]
  },
  {
    "id": "q-sden2-118",
    "topic": "Wijnbereiding",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Hoe kan een versterkte wijn toch volledig droog zijn?",
    "options": [
      "De alcohol wordt toegevoegd nadat de gist vrijwel alle suiker heeft vergist",
      "Versterkte wijn bevat nooit druivensuiker",
      "Toegevoegde alcohol smaakt altijd zuur",
      "De wijn wordt vóór de oogst gefilterd"
    ],
    "answer": 0,
    "explanation": "Wanneer versterking na een volledige alcoholische gisting plaatsvindt, is weinig restsuiker over en kan de wijn droog blijven, zoals bij droge sherry.",
    "misconception": "Versterkt betekent alleen dat alcohol is toegevoegd; het zegt niet automatisch dat de wijn zoet is.",
    "tags": [
      "sden-3b.2",
      "versterkte-wijn",
      "droog"
    ]
  },
  {
    "id": "q-sden2-119",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom zijn hoge zuren belangrijk in basiswijn voor Champagne?",
    "options": [
      "Ze maken een tweede gisting onmogelijk",
      "Ze geven frisheid en balans aan de uiteindelijke mousserende wijn",
      "Ze kleuren de wijn rood",
      "Ze vervangen de druk in de fles"
    ],
    "answer": 1,
    "explanation": "Het koele klimaat van Champagne helpt zuren behouden; die geven frisheid en balans na tweede gisting en rijping.",
    "misconception": "Zuur zorgt niet voor de belletjes; koolzuur ontstaat door de tweede gisting, terwijl zuur de smaakstructuur levert.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "champagne",
      "zuren"
    ]
  },
  {
    "id": "q-sden2-120",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke Champagne smaakt volgens de officiële dosagecategorie zoeter: Brut of Demi-Sec?",
    "options": [
      "Brut",
      "Ze zijn altijd even zoet",
      "Geen van beide bevat suiker",
      "Demi-Sec"
    ],
    "answer": 3,
    "explanation": "Demi-Sec bevat volgens de officiële categorie meer suiker dan Brut en smaakt daardoor duidelijk zoeter.",
    "misconception": "De term Sec klinkt als droog, maar bij Champagne is Demi-Sec aanzienlijk zoeter dan Brut.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "champagne",
      "brut",
      "demi-sec"
    ]
  },
  {
    "id": "q-sden2-121",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat betekent het wanneer een Champagne een oogstjaar op het etiket draagt?",
    "options": [
      "De wijn is uitsluitend gemaakt van druiven uit dat genoemde jaar",
      "De wijn is altijd zoet",
      "De wijn bevat alleen Chardonnay",
      "De wijn heeft geen tweede gisting gehad"
    ],
    "answer": 0,
    "explanation": "Een vintage- of millésime-Champagne wordt gemaakt van druiven die in het op het etiket vermelde jaar zijn geoogst.",
    "misconception": "Een oogstjaar zegt niets automatisch over zoetheid of druivenras; het duidt de gebruikte jaargang aan.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "champagne",
      "vintage"
    ]
  },
  {
    "id": "q-sden2-122",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom kan een non-vintage Champagne wijnen uit meerdere oogstjaren bevatten?",
    "options": [
      "Omdat een jaartal wettelijk verplicht is",
      "Omdat Champagne geen druiven gebruikt",
      "Om door assemblage een herkenbare huisstijl te bewaren",
      "Om de tweede gisting over te slaan"
    ],
    "answer": 2,
    "explanation": "Producenten kunnen basis- en reservewijnen uit verschillende jaren mengen om een consistente huisstijl te maken.",
    "misconception": "Non-vintage betekent niet dat de wijn geen herkomst of kwaliteit heeft; alleen één specifiek oogstjaar staat niet centraal.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "champagne",
      "non-vintage",
      "assemblage"
    ]
  },
  {
    "id": "q-sden2-123",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke informatie staat bij veel Elzaswijnen opvallend op het etiket?",
    "options": [
      "Alleen de naam Bordeaux",
      "De naam van het druivenras",
      "Een Spaanse rijpingsterm",
      "Het woord Port"
    ],
    "answer": 1,
    "explanation": "Veel Elzaswijnen vermelden het druivenras duidelijk op het etiket, bijvoorbeeld Riesling, Gewürztraminer of Pinot Blanc.",
    "misconception": "In veel Franse gebieden staat vooral de herkomst centraal, maar de Elzas vermeldt vaak ook expliciet het druivenras.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "elzas",
      "etikettering"
    ]
  },
  {
    "id": "q-sden2-124",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk aromaprofiel past het beste bij Gewürztraminer uit de Elzas?",
    "options": [
      "Uitsluitend groene paprika en zwarte bes",
      "Alleen neutrale aroma's",
      "Teer en rozen met zware tannine",
      "Rozen, lychee en rijp exotisch fruit"
    ],
    "answer": 3,
    "explanation": "Gewürztraminer is zeer aromatisch en wordt vaak herkend aan geuren van rozen, lychee, specerijen en rijp exotisch fruit.",
    "misconception": "Het rozenaroma betekent niet dat de wijn van blauwe druiven is gemaakt; Gewürztraminer is een wit wijndruivenras.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "elzas",
      "gewurztraminer",
      "aroma"
    ]
  },
  {
    "id": "q-sden2-125",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk smaakprofiel past het beste bij een typische jonge Chablis?",
    "options": [
      "Droog, fris en hoog in zuren met citrusachtig fruit",
      "Zeer zoet, versterkt en rozijnachtig",
      "Vol rood met veel tannine",
      "Mousserend en geparfumeerd naar rozen"
    ],
    "answer": 0,
    "explanation": "Door het koele klimaat is jonge Chablis doorgaans droog, fris en zuurgedreven, met citrus- en groenfruitaroma's.",
    "misconception": "Chablis is Chardonnay, maar hoeft niet de rijpe, tropische en sterk houtgerijpte stijl te hebben die elders voorkomt.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "chablis",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-126",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Om welke wijnstijl is de Côte de Beaune bijzonder bekend?",
    "options": [
      "Zoete versterkte wijn van Pedro Ximénez",
      "Lichte rode wijn van Gamay als enige specialiteit",
      "Witte kwaliteitswijn van Chardonnay",
      "Mousserende wijn via uitsluitend de tankmethode"
    ],
    "answer": 2,
    "explanation": "De Côte de Beaune in Bourgogne is bijzonder beroemd om grote witte wijnen van Chardonnay, naast rode Pinot Noir.",
    "misconception": "De Côte de Beaune produceert ook rood, maar haar internationale reputatie voor witte Chardonnay is essentieel.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bourgogne",
      "cote-de-beaune"
    ]
  },
  {
    "id": "q-sden2-127",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke proefomschrijving past doorgaans bij een jonge rode Beaujolais?",
    "options": [
      "Zwaar, zeer tanninerijk en altijd lang houtgerijpt",
      "Licht tot middelvol, fruitig en laag in tannine",
      "Zoet en versterkt tot ongeveer twintig procent alcohol",
      "Wit, strak en citrusachtig"
    ],
    "answer": 1,
    "explanation": "Jonge Beaujolais van Gamay is doorgaans sappig en fruitig, met een lichte tot middelvolle body en weinig tannine.",
    "misconception": "De rode kleur betekent niet automatisch veel tannine; Gamay kan juist zachte, gemakkelijk drinkbare rode wijn geven.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "beaujolais",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-128",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omschrijving past het beste bij een typische Muscadet?",
    "options": [
      "Krachtig rood met veel hout en tannine",
      "Zoet en versterkt met rozijnaroma's",
      "Aromatisch zoet met lychee",
      "Droog, licht en fris met hoge zuren"
    ],
    "answer": 3,
    "explanation": "Muscadet is doorgaans een droge, lichte witte Loirewijn met frisse zuren en een stijl die goed bij schaal- en schelpdieren past.",
    "misconception": "Muscadet klinkt als Muscat, maar is geen geparfumeerde zoete Muscatwijn.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "loire",
      "muscadet",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-129",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk proefprofiel past het beste bij een typische jonge witte Sancerre?",
    "options": [
      "Droog, friszuur en citrus- of groenfruitig",
      "Zoet, donker en notig",
      "Vol rood met veel rijpe tannine",
      "Laag in zuur en altijd zwaar houtgerijpt"
    ],
    "answer": 0,
    "explanation": "Witte Sancerre van Sauvignon Blanc is doorgaans droog en fris, met hoge zuren en citrus-, groenfruit- of kruidige aroma's.",
    "misconception": "Sancerre is een herkomstnaam; de bekende witte stijl is geen zoete of versterkte wijn.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "loire",
      "sancerre",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-130",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke Loire-subregio kan uiteenlopende stijlen van Chenin Blanc voortbrengen?",
    "options": [
      "Haut-Médoc",
      "Côte-Rôtie",
      "Anjou",
      "Chablis"
    ],
    "answer": 2,
    "explanation": "In Anjou wordt Chenin Blanc gebruikt voor uiteenlopende stijlen, waaronder droge, mousserende en zoete witte wijn.",
    "misconception": "Haut-Médoc, Côte-Rôtie en Chablis liggen niet in de Loire en zijn niet de gevraagde Chenin-herkomst.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "loire",
      "anjou",
      "chenin-blanc"
    ]
  },
  {
    "id": "q-sden2-131",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is kenmerkend voor veel rode Bordeauxwijnen?",
    "options": [
      "Ze worden altijd van alleen Gamay gemaakt",
      "Ze zijn vaak een blend van meerdere druivenrassen",
      "Ze zijn per definitie mousserend",
      "Ze bevatten nooit Cabernet Sauvignon"
    ],
    "answer": 1,
    "explanation": "Rode Bordeaux is vaak een assemblage van onder meer Merlot, Cabernet Sauvignon en Cabernet Franc.",
    "misconception": "Een Bordeauxblend hoeft niet alle toegestane rassen te bevatten en kan per oever, producent en jaar verschillen.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "blend"
    ]
  },
  {
    "id": "q-sden2-132",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke vergelijking tussen Cabernet Sauvignon en Merlot in Bordeaux is doorgaans juist?",
    "options": [
      "Merlot heeft altijd meer tannine dan Cabernet Sauvignon",
      "Beide druiven geven uitsluitend witte wijn",
      "Cabernet Sauvignon rijpt altijd eerder",
      "Cabernet Sauvignon geeft vaak meer tannine en structuur"
    ],
    "answer": 3,
    "explanation": "Cabernet Sauvignon levert doorgaans meer tannine en stevige structuur, terwijl Merlot vaak ronder en zachter overkomt.",
    "misconception": "De uiteindelijke stijl hangt ook van herkomst en vinificatie af, maar de druiven hebben herkenbare algemene verschillen.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-133",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom is Merlot belangrijk in koelere delen van Bordeaux?",
    "options": [
      "Merlot rijpt relatief vroeg en geeft vaak ronde, zachte wijn",
      "Merlot heeft geen zonlicht nodig",
      "Merlot kan niet met andere druiven worden gemengd",
      "Merlot geeft uitsluitend zoete witte wijn"
    ],
    "answer": 0,
    "explanation": "Merlot rijpt eerder dan Cabernet Sauvignon en kan daardoor in koelere delen betrouwbare, ronde rode wijn leveren.",
    "misconception": "Vroege rijping betekent niet dat Merlot zonder warmte of zon kan groeien; het is een relatief verschil met latere rassen.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "merlot"
    ]
  },
  {
    "id": "q-sden2-134",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk bodemtype past in Bordeaux vaak goed bij Merlot?",
    "options": [
      "Uitsluitend droge woestijnzandduinen",
      "Permanente permafrost",
      "Klei- en kalkrijke bodems",
      "Alleen verse vulkanische lava"
    ],
    "answer": 2,
    "explanation": "Merlot doet het in Bordeaux vaak goed op klei- en kalkrijke bodems, zoals in delen van de rechteroever.",
    "misconception": "Bodem alleen bepaalt de wijn niet; klimaat, ligging, druivenmateriaal en wijnbouw blijven eveneens belangrijk.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "merlot",
      "bodem"
    ]
  },
  {
    "id": "q-sden2-135",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke witte druiven zijn belangrijk voor de zoete wijnen van Sauternes?",
    "options": [
      "Sémillon en Sauvignon Blanc",
      "Gamay en Pinot Noir",
      "Syrah en Grenache",
      "Tempranillo en Garnacha"
    ],
    "answer": 0,
    "explanation": "Sémillon en Sauvignon Blanc zijn belangrijke rassen voor Sauternes; vooral Sémillon is zeer geschikt voor edelrot.",
    "misconception": "De blauwe druiven in de andere antwoorden worden niet gebruikt als basis voor klassieke witte Sauternes.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "bordeaux",
      "sauternes",
      "semillon"
    ]
  },
  {
    "id": "q-sden2-136",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke twee appellaties zijn beide klassieke herkomsten voor Syrah in de noordelijke Rhône?",
    "options": [
      "Muscadet en Sancerre",
      "Côte-Rôtie en Hermitage",
      "Pomerol en Sauternes",
      "Chablis en Beaujolais"
    ],
    "answer": 1,
    "explanation": "Côte-Rôtie en Hermitage zijn noordelijke Rhône-appellaties die beroemd zijn om rode wijn op basis van Syrah.",
    "misconception": "De andere paren horen bij Loire, Bordeaux of Bourgogne en zijn geen klassieke noordelijke Syrah-herkomsten.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "noord-rhone",
      "syrah",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-137",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk wit druivenras is een specialiteit van de noordelijke Rhône?",
    "options": [
      "Verdejo",
      "Viognier",
      "Garganega",
      "Pinotage"
    ],
    "answer": 1,
    "explanation": "Viognier is een aromatisch wit druivenras met een klassieke thuisbasis in de noordelijke Rhône.",
    "misconception": "De noordelijke Rhône is beroemd om rode Syrah, maar produceert daarnaast ook kenmerkende witte wijn.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "noord-rhone",
      "viognier"
    ]
  },
  {
    "id": "q-sden2-138",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke stijl verwacht je eerder van een rode wijn uit de warme zuidelijke Rhône?",
    "options": [
      "Zeer licht, laag in alcohol en uitsluitend van Riesling",
      "Bleek wit en scherpzuur zonder rijp fruit",
      "Altijd zoet en versterkt",
      "Rijp fruit, vollere body en vaak relatief veel alcohol"
    ],
    "answer": 3,
    "explanation": "Het warme mediterrane klimaat helpt druiven goed rijpen en geeft vaak rode wijnen met rijp fruit, body en hoger alcoholgehalte.",
    "misconception": "Warm klimaat garandeert geen zware wijn, maar verschuift de algemene stijl wel richting rijper fruit en meer alcohol.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "zuid-rhone",
      "warm-klimaat"
    ]
  },
  {
    "id": "q-sden2-139",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarvoor staat de afkorting GSM bij een zuidelijke Rhôneblend?",
    "options": [
      "Grenache, Syrah en Mourvèdre",
      "Gamay, Sémillon en Merlot",
      "Gewürztraminer, Sauvignon en Muscat",
      "Grüner Veltliner, Sangiovese en Malbec"
    ],
    "answer": 0,
    "explanation": "GSM staat voor Grenache, Syrah en Mourvèdre, drie veelgebruikte blauwe druiven in zuidelijke Rhôneblends.",
    "misconception": "GSM is geen kwaliteitscategorie of productiemethode, maar een afkorting van drie druivenrassen.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "zuid-rhone",
      "gsm"
    ]
  },
  {
    "id": "q-sden2-140",
    "topic": "Wijngebieden: Frankrijk",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Met welk grote Zuid-Franse wijngebied wordt Pays d'Oc IGP verbonden?",
    "options": [
      "Champagne",
      "Bourgogne",
      "Languedoc-Roussillon",
      "Elzas"
    ],
    "answer": 2,
    "explanation": "Pays d'Oc IGP omvat een groot deel van Languedoc-Roussillon en staat vaak druivenrasvermelding op het etiket toe.",
    "misconception": "Pays d'Oc is geen afzonderlijk land en ligt niet in de noordelijke klassieke wijngebieden van Frankrijk.",
    "tags": [
      "sden-4.2",
      "frankrijk",
      "languedoc-roussillon",
      "pays-doc"
    ]
  },
  {
    "id": "q-sden2-141",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk proefprofiel past het beste bij een jonge Barolo?",
    "options": [
      "Laag zuur, geen tannine en tropisch fruit",
      "Hoge zuren en tannine met rood fruit en florale tonen",
      "Zoet, mousserend en laag in alcohol",
      "Licht wit met citrus en zonder structuur"
    ],
    "answer": 1,
    "explanation": "Barolo van Nebbiolo heeft doorgaans hoge zuren en veel tannine, met rood fruit, rozen en bij ontwikkeling aardse tonen.",
    "misconception": "De relatief lichte kleur van Nebbiolo betekent niet dat de wijn weinig tannine of structuur heeft.",
    "tags": [
      "sden-4.2",
      "italie",
      "barolo",
      "nebbiolo",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-142",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom kan een goede Barolo lang rijpen?",
    "options": [
      "Omdat hij geen zuur of tannine bevat",
      "Omdat hij altijd versterkt is",
      "Omdat hij in een drukvat wordt gebotteld",
      "Omdat hoge zuren en tannine structuur voor ontwikkeling geven"
    ],
    "answer": 3,
    "explanation": "De combinatie van hoge zuren, veel tannine en voldoende fruitconcentratie geeft Barolo structuur om zich in de fles te ontwikkelen.",
    "misconception": "Lang kunnen rijpen komt niet alleen door alcohol of hout; balans tussen fruit, zuur en tannine is belangrijk.",
    "tags": [
      "sden-4.2",
      "italie",
      "barolo",
      "rijping"
    ]
  },
  {
    "id": "q-sden2-143",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke stijl past het beste bij een klassieke Bardolino?",
    "options": [
      "Lichtrode, fruitige wijn met bescheiden tannine",
      "Zeer zoete witte wijn van edelrot",
      "Krachtige versterkte wijn",
      "Witte mousserende wijn van alleen Chardonnay"
    ],
    "answer": 0,
    "explanation": "Bardolino uit Veneto is doorgaans een lichte, frisse en fruitige rode wijn met zachte tannine.",
    "misconception": "Niet iedere Italiaanse rode wijn is krachtig en zwaar; Bardolino staat juist bekend om een lichtere stijl.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "bardolino",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-144",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk blauw druivenras is belangrijk voor zowel Valpolicella als Bardolino?",
    "options": [
      "Nebbiolo",
      "Sangiovese",
      "Corvina",
      "Tempranillo"
    ],
    "answer": 2,
    "explanation": "Corvina is een belangrijke blauwe druif in de blends van zowel Valpolicella als Bardolino in Veneto.",
    "misconception": "Nebbiolo hoort bij Piemonte en Sangiovese vooral bij Toscane; Corvina is de Venetokoppeling.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "corvina"
    ]
  },
  {
    "id": "q-sden2-145",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras vormt doorgaans de basis van Soave?",
    "options": [
      "Chenin Blanc",
      "Riesling",
      "Sauvignon Blanc",
      "Garganega"
    ],
    "answer": 3,
    "explanation": "Garganega is het belangrijkste witte druivenras voor Soave uit de Italiaanse regio Veneto.",
    "misconception": "Soave is een herkomstnaam en geen druivenras; Garganega is de belangrijkste druif erachter.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "soave",
      "garganega"
    ]
  },
  {
    "id": "q-sden2-146",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom past Chianti vaak goed bij gerechten met tomaat?",
    "options": [
      "De frisse zuren in de wijn sluiten aan bij de zuren in tomaat",
      "Chianti is altijd zoeter dan het gerecht",
      "Chianti bevat koolzuur dat tomaat neutraliseert",
      "De wijn heeft geen aroma's"
    ],
    "answer": 0,
    "explanation": "Sangiovese geeft Chianti doorgaans frisse zuren, waardoor de wijn goed kan aansluiten bij de zuren in tomatenrijke gerechten.",
    "misconception": "De combinatie werkt niet omdat Chianti zoet is; de gedeelde frisse zuurgraad zorgt juist voor balans.",
    "tags": [
      "sden-4.2",
      "italie",
      "chianti",
      "wijn-spijs"
    ]
  },
  {
    "id": "q-sden2-147",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke uitspraak over Brunello di Montalcino is juist?",
    "options": [
      "Het is witte wijn van Garganega",
      "Het is Portugees en versterkt",
      "Het is mousserend en gemaakt via cuve close",
      "Het is een Toscaanse rode wijn die volledig van Sangiovese wordt gemaakt"
    ],
    "answer": 3,
    "explanation": "Brunello di Montalcino is een Toscaanse rode appellatiewijn die volgens de regels volledig uit Sangiovese bestaat.",
    "misconception": "Brunello is de lokale naam voor de gebruikte Sangiovesedruif en niet een afzonderlijk internationaal druivenras.",
    "tags": [
      "sden-4.2",
      "italie",
      "toscane",
      "brunello-di-montalcino"
    ]
  },
  {
    "id": "q-sden2-148",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke wijn heeft doorgaans meer structuur en rijpingspotentieel: een eenvoudige Chianti of Brunello di Montalcino?",
    "options": [
      "Altijd de eenvoudige Chianti",
      "Brunello di Montalcino",
      "Beide zijn witte wijn en niet vergelijkbaar",
      "Geen van beide kan rijpen"
    ],
    "answer": 1,
    "explanation": "Brunello di Montalcino is doorgaans geconcentreerder en heeft strengere rijpingseisen dan een eenvoudige Chianti.",
    "misconception": "Beide gebruiken Sangiovese, maar herkomstregels en productiestijl kunnen duidelijk verschillende structuren opleveren.",
    "tags": [
      "sden-4.2",
      "italie",
      "toscane",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-149",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke kleurindeling van drie bekende Venetowijnen is juist?",
    "options": [
      "Bardolino wit, Valpolicella wit, Soave rood",
      "Alle drie zijn uitsluitend mousserend",
      "Bardolino en Valpolicella rood, Soave wit",
      "Alle drie zijn versterkte rode wijn"
    ],
    "answer": 2,
    "explanation": "Bardolino en Valpolicella zijn bekende rode wijnen uit Veneto; Soave is een bekende witte wijn uit dezelfde regio.",
    "misconception": "De gedeelde regio betekent niet dat de wijnen dezelfde kleur of druivensamenstelling hebben.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-150",
    "topic": "Wijngebieden: Italië",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke wijn hoort niet bij Veneto?",
    "options": [
      "Barolo",
      "Bardolino",
      "Valpolicella",
      "Soave"
    ],
    "answer": 0,
    "explanation": "Barolo komt uit Piemonte; Bardolino, Valpolicella en Soave komen alle drie uit Veneto.",
    "misconception": "Alle vier zijn Italiaanse herkomstnamen, maar ze liggen niet allemaal in dezelfde regio.",
    "tags": [
      "sden-4.2",
      "italie",
      "veneto",
      "piemonte"
    ]
  },
  {
    "id": "q-sden2-151",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk aroma kan Tempranillo uit Rioja door rijping in eikenhout ontwikkelen?",
    "options": [
      "Alleen verse gist",
      "Vanille en specerijen",
      "Uitsluitend lychee",
      "Alleen groene appel zonder houtinvloed"
    ],
    "answer": 1,
    "explanation": "Naast rood en zwart fruit kan houtgerijpte Tempranillo aroma's van vanille, specerijen, kokos of cacao ontwikkelen.",
    "misconception": "Vanille is geen primair druivenaroma; het ontstaat meestal door contact met eikenhout.",
    "tags": [
      "sden-4.2",
      "spanje",
      "rioja",
      "tempranillo",
      "houtrijping"
    ]
  },
  {
    "id": "q-sden2-152",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk deel van Spanje ligt Rioja in grote lijnen?",
    "options": [
      "Op de zuidkust bij Málaga",
      "Op de Canarische Eilanden",
      "In het noorden rond de rivier de Ebro",
      "In Portugal langs de Douro"
    ],
    "answer": 2,
    "explanation": "Rioja ligt in Noord-Spanje rond de rivier de Ebro en bestaat uit Rioja Alta, Rioja Alavesa en Rioja Oriental.",
    "misconception": "De Spaanse en Portugese rivieren Ebro en Douro zijn niet hetzelfde; Rioja ligt rond de Ebro.",
    "tags": [
      "sden-4.2",
      "spanje",
      "rioja",
      "ebro"
    ]
  },
  {
    "id": "q-sden2-153",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk smaakprofiel past het beste bij een typische jonge Verdejo uit Rueda?",
    "options": [
      "Vol rood met zware tannine",
      "Zoet en oxidatief met notenaroma's",
      "Versterkt en donker",
      "Droog, fris en aromatisch met citrus en kruiden"
    ],
    "answer": 3,
    "explanation": "Jonge Rueda Verdejo is meestal droog, fris en aromatisch, met citrus, groen fruit en soms kruidige tonen.",
    "misconception": "Rueda is vooral een wittewijngebied; de typische Verdejostijl is niet rood of versterkt.",
    "tags": [
      "sden-4.2",
      "spanje",
      "rueda",
      "verdejo",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-154",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk wit druivenras is traditioneel veel aangeplant in La Mancha?",
    "options": [
      "Airén",
      "Riesling",
      "Chenin Blanc",
      "Gewürztraminer"
    ],
    "answer": 0,
    "explanation": "Airén is een hitte- en droogtetolerant wit ras dat traditioneel op grote schaal in La Mancha wordt aangeplant.",
    "misconception": "La Mancha produceert ook rode wijn, maar de grote traditionele witte aanplant is sterk met Airén verbonden.",
    "tags": [
      "sden-4.2",
      "spanje",
      "la-mancha",
      "airen"
    ]
  },
  {
    "id": "q-sden2-155",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "In welk deel van Spanje ligt het sherrygebied rond Jerez?",
    "options": [
      "In het noordoosten bij de Pyreneeën",
      "In het noordwesten bij Galicië",
      "Op de centrale hoogvlakte",
      "In Andalusië in het zuidwesten"
    ],
    "answer": 3,
    "explanation": "Jerez en de sherrydriehoek liggen in Andalusië in het zuidwesten van Spanje, dicht bij de Atlantische kust.",
    "misconception": "Sherry is Spaans, maar komt niet uit Rioja of de centrale hoogvlakte; de beschermde herkomst is rond Jerez.",
    "tags": [
      "sden-4.2",
      "spanje",
      "jerez",
      "andalusie"
    ]
  },
  {
    "id": "q-sden2-156",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras vormt de basis voor droge sherrystijlen zoals Fino en Oloroso?",
    "options": [
      "Pedro Ximénez",
      "Palomino",
      "Tempranillo",
      "Verdejo"
    ],
    "answer": 1,
    "explanation": "Palomino is de belangrijkste druif voor droge sherry en vormt de basis van onder meer Fino en Oloroso.",
    "misconception": "Pedro Ximénez wordt vooral met zeer zoete sherry verbonden; droge Fino en Oloroso beginnen doorgaans met Palomino.",
    "tags": [
      "sden-4.2",
      "spanje",
      "sherry",
      "palomino"
    ]
  },
  {
    "id": "q-sden2-157",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke functie heeft flor tijdens de rijping van Fino Sherry?",
    "options": [
      "De gistlaag beschermt de wijn grotendeels tegen zuurstof",
      "Flor maakt de wijn rood",
      "Flor verhoogt het alcoholgehalte tot veertig procent",
      "Flor is bezinksel van de kurk"
    ],
    "answer": 0,
    "explanation": "Flor is een levende gistlaag op de wijn die zuurstofcontact beperkt en de kenmerkende biologische rijpingsaroma's van Fino vormt.",
    "misconception": "Flor is geen fout of bezinksel; het is een gewenste gistlaag tijdens de rijping van bepaalde sherrystijlen.",
    "tags": [
      "sden-4.2",
      "spanje",
      "sherry",
      "fino",
      "flor"
    ]
  },
  {
    "id": "q-sden2-158",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke omschrijving past het beste bij een droge Oloroso Sherry?",
    "options": [
      "Bleek en volledig onder flor gerijpt",
      "Mousserend en laag in alcohol",
      "Vol, oxidatief gerijpt en vaak notig",
      "Zoet wit met lychee"
    ],
    "answer": 2,
    "explanation": "Oloroso rijpt oxidatief zonder een blijvende florlaag en is doorgaans voller en donkerder, met notige en kruidige aroma's.",
    "misconception": "Oloroso kan in gezoete blends voorkomen, maar de klassieke droge Oloroso is niet vanzelf zoet.",
    "tags": [
      "sden-4.2",
      "spanje",
      "sherry",
      "oloroso"
    ]
  },
  {
    "id": "q-sden2-159",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom blijft de meeste rode Port zoet na de alcoholische gisting?",
    "options": [
      "Omdat alle Port na botteling suiker krijgt",
      "Omdat de druiven geen gist bevatten",
      "Omdat hout suiker aan de wijn afgeeft",
      "Omdat toevoeging van druivenalcohol de gisting stopt voordat alle suiker is vergist"
    ],
    "answer": 3,
    "explanation": "Bij Port wordt tijdens de gisting druivenalcohol toegevoegd; de gist stopt en een deel van de natuurlijke druivensuiker blijft over.",
    "misconception": "De klassieke zoetheid van Port komt vooral van onvergiste druivensuiker en niet simpelweg van later toegevoegde tafelsuiker.",
    "tags": [
      "sden-4.2",
      "portugal",
      "port",
      "gisting"
    ]
  },
  {
    "id": "q-sden2-160",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk landschap is kenmerkend voor veel wijngaarden in de Douro?",
    "options": [
      "Vlakke polders onder zeeniveau",
      "Steile hellingen en terrassen langs de rivier",
      "Tropisch regenwoud zonder hellingen",
      "Toendra met permanente sneeuw"
    ],
    "answer": 1,
    "explanation": "Veel Dourowijngaarden liggen op steile, vaak terrasvormige hellingen langs de Douro en haar zijrivieren.",
    "misconception": "De Douro is warm en droog, maar het landschap is niet vlak; steile rivierhellingen zijn juist karakteristiek.",
    "tags": [
      "sden-4.2",
      "portugal",
      "douro",
      "terrassen"
    ]
  },
  {
    "id": "q-sden2-161",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Hoe helpt de rijpingswijze van Ruby Port zijn fruitige karakter te bewaren?",
    "options": [
      "Door de wijn langdurig in kleine, poreuze vaten te oxideren",
      "Door de wijn altijd onder flor te laten rijpen",
      "Door zuurstofinvloed tijdens rijping relatief te beperken",
      "Door alle kleurstoffen eruit te filteren"
    ],
    "answer": 2,
    "explanation": "Ruby Port wordt zo gerijpt dat oxidatie relatief beperkt blijft, waardoor diepe kleur en vers rood of zwart fruit behouden worden.",
    "misconception": "Langdurige oxidatieve rijping is kenmerkender voor Tawny; Ruby is gericht op behoud van kleur en fruit.",
    "tags": [
      "sden-4.2",
      "portugal",
      "port",
      "ruby",
      "rijping"
    ]
  },
  {
    "id": "q-sden2-162",
    "topic": "Wijngebieden: Spanje en Portugal",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke productiekeuze onderscheidt Tawny Port doorgaans van Ruby Port?",
    "options": [
      "Tawny krijgt meer oxidatieve rijping in hout",
      "Tawny heeft nooit alcohol",
      "Ruby wordt altijd mousserend gemaakt",
      "Ruby wordt uitsluitend van witte druiven gemaakt"
    ],
    "answer": 0,
    "explanation": "Tawny krijgt doorgaans meer oxidatieve houtrijping, waardoor kleur lichter wordt en notige, gedroogde-fruitaroma's ontstaan.",
    "misconception": "Beide zijn versterkte Portstijlen; het verschil zit vooral in de manier en duur van rijping en zuurstofinvloed.",
    "tags": [
      "sden-4.2",
      "portugal",
      "port",
      "tawny",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-163",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom zijn steile, zonnige hellingen belangrijk in de Mosel?",
    "options": [
      "Ze maken irrigatie overal verplicht",
      "Ze helpen in het koele klimaat meer zon en warmte op te vangen",
      "Ze voorkomen dat druiven zuren vormen",
      "Ze maken wijn zonder gisting mogelijk"
    ],
    "answer": 1,
    "explanation": "Gunstig gelegen steile hellingen vangen meer zon en warmte, wat de rijping van Riesling in het koele Moselklimaat ondersteunt.",
    "misconception": "Steilte alleen is niet voldoende; ligging ten opzichte van zon en rivier bepaalt hoeveel warmte een perceel ontvangt.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "mosel",
      "helling"
    ]
  },
  {
    "id": "q-sden2-164",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk profiel past vaak bij een Riesling uit de koele Mosel?",
    "options": [
      "Zware tannine en zeer diepe rode kleur",
      "Altijd versterkt en oxidatief",
      "Volledig zuurloos en zeer alcoholrijk",
      "Lichte body, hoge zuren en vaak bescheiden alcohol"
    ],
    "answer": 3,
    "explanation": "Mosel-Riesling is vaak licht van body, uitgesproken zuur en relatief laag in alcohol, soms met wat restsuiker voor balans.",
    "misconception": "Restzoet betekent niet automatisch veel alcohol; onvergiste suiker kan juist samengaan met een lager alcoholgehalte.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "mosel",
      "riesling",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-165",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Langs welke grote rivier ligt het wijngebied Rheingau?",
    "options": [
      "De Rijn",
      "De Douro",
      "De Loire",
      "De Ebro"
    ],
    "answer": 0,
    "explanation": "Rheingau ligt langs een bijzonder oost-west lopend deel van de Rijn en is sterk gericht op Riesling.",
    "misconception": "De naam Rheingau verwijst naar de Rijn; de andere rivieren horen bij Portugal, Frankrijk en Spanje.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "rheingau",
      "rijn"
    ]
  },
  {
    "id": "q-sden2-166",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke Duitse wijnstreek omvat wijngaarden langs de Moezel en zijrivieren zoals Saar en Ruwer?",
    "options": [
      "Rheingau",
      "Mosel",
      "Baden",
      "Pfalz"
    ],
    "answer": 1,
    "explanation": "Het wijngebied Mosel omvat wijngaarden langs de Moezel en haar zijrivieren Saar en Ruwer.",
    "misconception": "Rheingau ligt aan de Rijn; Saar en Ruwer behoren binnen de kwaliteitswijnindeling tot het Moselgebied.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "mosel",
      "saar",
      "ruwer"
    ]
  },
  {
    "id": "q-sden2-167",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Hoe verschilt het klimaat van Pfalz in grote lijnen van dat van de koelere Mosel?",
    "options": [
      "Pfalz is veel kouder en natter",
      "Pfalz is relatief warmer en droger",
      "Pfalz heeft een tropisch klimaat",
      "Er bestaat nooit klimaatverschil binnen Duitsland"
    ],
    "answer": 1,
    "explanation": "Pfalz is relatief warm en droog voor Duitsland, waardoor druiven vaak rijper worden dan in de koelere Mosel.",
    "misconception": "Duitsland is overwegend koel, maar regionale ligging en beschutting zorgen wel degelijk voor stijlverschillen.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "pfalz",
      "mosel",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-168",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk blauw druivenras is belangrijk in het relatief warme Duitse Baden?",
    "options": [
      "Tempranillo",
      "Carmenère",
      "Pinotage",
      "Spätburgunder, oftewel Pinot Noir"
    ],
    "answer": 3,
    "explanation": "Baden is relatief warm en heeft veel aanplant van Spätburgunder, de Duitse naam voor Pinot Noir.",
    "misconception": "Een Duits wijngebied produceert niet alleen wit; het warmere Baden is belangrijk voor rode Spätburgunder.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "baden",
      "spatburgunder"
    ]
  },
  {
    "id": "q-sden2-169",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Hoe kan een Duitse Riesling tegelijk wat restzoet en relatief laag in alcohol zijn?",
    "options": [
      "Door tannine in suiker om te zetten",
      "Door de gisting te stoppen voordat alle suiker is vergist",
      "Door na botteling water te laten verdampen",
      "Door de wijn als Port te versterken"
    ],
    "answer": 1,
    "explanation": "Wanneer de gisting stopt voordat alle druivensuiker is omgezet, blijft restsuiker over en wordt minder alcohol gevormd.",
    "misconception": "Zoetheid hoeft niet samen te gaan met veel alcohol; beide hangen mede af van hoeveel suiker de gist omzet.",
    "tags": [
      "sden-4.2",
      "duitsland",
      "riesling",
      "restsuiker",
      "gisting"
    ]
  },
  {
    "id": "q-sden2-170",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Langs welke rivier liggen veel wijngaarden van Wachau?",
    "options": [
      "De Rhône",
      "De Rijn",
      "De Donau",
      "De Ebro"
    ],
    "answer": 2,
    "explanation": "Wachau ligt in Oostenrijk langs de Donau, met veel wijngaarden op terrassen aan weerszijden van de rivier.",
    "misconception": "De Rijn hoort onder meer bij Duitse gebieden; de Wachau wordt geografisch door de Donau bepaald.",
    "tags": [
      "sden-4.2",
      "oostenrijk",
      "wachau",
      "donau"
    ]
  },
  {
    "id": "q-sden2-171",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke twee namen horen beide bij de Oostenrijkse wijnbouw?",
    "options": [
      "Niederösterreich en Wachau",
      "Rioja en Rueda",
      "Mendoza en Central Valley",
      "Barolo en Chianti"
    ],
    "answer": 0,
    "explanation": "Wachau is een wijngebied binnen de Oostenrijkse deelstaat en wijnregio Niederösterreich.",
    "misconception": "De andere paren horen bij Spanje, Zuid-Amerika of Italië en niet bij Oostenrijk.",
    "tags": [
      "sden-4.2",
      "oostenrijk",
      "wachau",
      "niederosterreich"
    ]
  },
  {
    "id": "q-sden2-172",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk proefprofiel past vaak bij Grüner Veltliner uit Oostenrijk?",
    "options": [
      "Zeer tanninerijk rood met zwarte bes",
      "Donkerzoet met rozijnen",
      "Friszuur wit met citrus, groen fruit en soms witte peper",
      "Laag in zuur en uitsluitend vanille"
    ],
    "answer": 2,
    "explanation": "Grüner Veltliner is doorgaans een frisse witte wijn met citrus, groen fruit en een kenmerkende peperige kruidigheid.",
    "misconception": "Witte peper is een aromabeschrijving en betekent niet dat peper aan de wijn wordt toegevoegd.",
    "tags": [
      "sden-4.2",
      "oostenrijk",
      "gruner-veltliner",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-173",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke natuurlijke aantasting speelt vaak een positieve rol bij klassieke Tokaji Aszú?",
    "options": [
      "Phylloxera aan de wortels",
      "Edelrot op de druiven",
      "Kurkfout in de fles",
      "Hagelschade aan de bladeren"
    ],
    "answer": 1,
    "explanation": "Edelrot concentreert suiker, zuur en smaak in druiven en is belangrijk voor de klassieke zoete stijl van Tokaji Aszú.",
    "misconception": "Phylloxera, kurkfout en hagel zijn schadelijk; alleen gecontroleerde edelrot kan hier gewenst zijn.",
    "tags": [
      "sden-4.2",
      "hongarije",
      "tokaj",
      "aszú",
      "edelrot"
    ]
  },
  {
    "id": "q-sden2-174",
    "topic": "Wijngebieden: Duitsland, Oostenrijk en overig Europa",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk druivenras is het belangrijkst voor veel wijnen uit Tokaj?",
    "options": [
      "Furmint",
      "Gamay",
      "Corvina",
      "Carmenère"
    ],
    "answer": 0,
    "explanation": "Furmint is het belangrijkste druivenras van Tokaj en levert door zijn hoge zuren zowel droge als beroemde zoete wijnen.",
    "misconception": "Tokaj is de regio en Furmint is het druivenras; die twee namen zijn niet uitwisselbaar.",
    "tags": [
      "sden-4.2",
      "hongarije",
      "tokaj",
      "furmint"
    ]
  },
  {
    "id": "q-sden2-175",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom kan Cabernet Sauvignon goed rijpen in veel delen van Napa Valley?",
    "options": [
      "Omdat de regio geen zon krijgt",
      "Omdat alle wijngaarden permanent bevroren zijn",
      "Omdat voldoende warmte en zon de laatrijpende druif helpen rijpen",
      "Omdat Cabernet Sauvignon een witte druif is"
    ],
    "answer": 2,
    "explanation": "Veel Napa-locaties bieden voldoende warmte en zon om laatrijpende Cabernet Sauvignon rijp fruit en rijpe tannine te laten ontwikkelen.",
    "misconception": "Napa heeft verschillende microklimaten; voldoende warmte betekent niet dat elk perceel of elk jaar identiek is.",
    "tags": [
      "sden-4.2",
      "verenigde-staten",
      "napa-valley",
      "cabernet-sauvignon"
    ]
  },
  {
    "id": "q-sden2-176",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk wit druivenras is op grote schaal in Californië aangeplant?",
    "options": [
      "Chardonnay",
      "Nebbiolo",
      "Pinotage",
      "Touriga Nacional"
    ],
    "answer": 0,
    "explanation": "Chardonnay is een belangrijk wit druivenras in Californië en wordt er in frisse tot rijke, houtgerijpte stijlen gemaakt.",
    "misconception": "Californië produceert meer dan rode Cabernet; Chardonnay is er eveneens een belangrijk internationaal ras.",
    "tags": [
      "sden-4.2",
      "verenigde-staten",
      "californie",
      "chardonnay"
    ]
  },
  {
    "id": "q-sden2-177",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke natuurlijke barrière beïnvloedt veel Chileense wijngebieden sterk?",
    "options": [
      "De Alpen",
      "De Andes",
      "De Himalaya",
      "De Oeral"
    ],
    "answer": 1,
    "explanation": "De Andes vormen de oostelijke grens van Chili en leveren onder meer smeltwater voor irrigatie in droge wijngebieden.",
    "misconception": "De Andes liggen in Zuid-Amerika; de andere gebergten liggen op andere continenten.",
    "tags": [
      "sden-4.2",
      "chili",
      "andes",
      "irrigatie"
    ]
  },
  {
    "id": "q-sden2-178",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke smaak kan onrijpe Carmenère duidelijk vertonen?",
    "options": [
      "Alleen honing en rozijnen",
      "Uitsluitend vanille van de druif",
      "Zout door zeewater in de bes",
      "Groene, kruidige tonen naast donker fruit"
    ],
    "answer": 3,
    "explanation": "Carmenère is laatrijpend en kan bij onvoldoende rijpheid uitgesproken groene of kruidige tonen naast fruit laten zien.",
    "misconception": "Vanille komt meestal van hout en niet rechtstreeks van de Carmenèredruif.",
    "tags": [
      "sden-4.2",
      "chili",
      "carmenere",
      "rijpheid"
    ]
  },
  {
    "id": "q-sden2-179",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke combinatie van omstandigheden is kenmerkend voor veel wijngaarden in Mendoza?",
    "options": [
      "Hoge ligging, droog klimaat en irrigatiewater uit de Andes",
      "Zeespiegel, tropische regen en geen zon",
      "Permanent bevroren bodem zonder irrigatie",
      "Laaggelegen moeras met dagelijkse overstroming"
    ],
    "answer": 0,
    "explanation": "Veel Mendozawijngaarden liggen hoog en droog aan de voet van de Andes en zijn afhankelijk van smeltwater voor irrigatie.",
    "misconception": "De hoge ligging kan koele nachten geven, maar Mendoza is geen koud of nat poolgebied.",
    "tags": [
      "sden-4.2",
      "argentinie",
      "mendoza",
      "hoogte",
      "irrigatie"
    ]
  },
  {
    "id": "q-sden2-180",
    "topic": "Wijngebieden: Noord- en Zuid-Amerika",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk proefprofiel past vaak bij Argentijnse Malbec uit Mendoza?",
    "options": [
      "Bleek wit, licht en zonder tannine",
      "Mousserend met groene appel",
      "Diepgekleurd rood met donker fruit en duidelijke tannine",
      "Zeer zoet en oxidatief als Tawny"
    ],
    "answer": 2,
    "explanation": "Mendoza Malbec is vaak diep van kleur en vol van smaak, met pruim, braam en een duidelijke tanninestructuur.",
    "misconception": "Malbec is een blauw druivenras; een bleke witte of mousserende stijl is niet de klassieke examenkoppeling.",
    "tags": [
      "sden-4.2",
      "argentinie",
      "mendoza",
      "malbec",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-181",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk blauw druivenras is speciaal met Zuid-Afrika verbonden?",
    "options": [
      "Nebbiolo",
      "Pinotage",
      "Tempranillo",
      "Gamay"
    ],
    "answer": 1,
    "explanation": "Pinotage is een Zuid-Afrikaanse kruising van Pinot Noir en Cinsault en geldt als een kenmerkend blauw ras van het land.",
    "misconception": "De naam lijkt op Pinot Noir, maar Pinotage is een afzonderlijk druivenras met een Zuid-Afrikaanse geschiedenis.",
    "tags": [
      "sden-4.2",
      "zuid-afrika",
      "pinotage"
    ]
  },
  {
    "id": "q-sden2-182",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke uitspraak over Zuid-Afrikaanse Chenin Blanc is juist?",
    "options": [
      "Hij wordt uitsluitend als zoete versterkte wijn gemaakt",
      "Hij heeft nooit zuren",
      "Hij is altijd rood",
      "Hij kan uiteenlopen van fris en droog tot rijk of zoet"
    ],
    "answer": 3,
    "explanation": "Zuid-Afrikaanse Chenin Blanc is veelzijdig en kan droog, fris, rijk, houtgerijpt of zoet worden gemaakt.",
    "misconception": "Eén druivenras levert niet automatisch één wijnstijl; klimaat, rijpheid en vinificatie maken veel variatie mogelijk.",
    "tags": [
      "sden-4.2",
      "zuid-afrika",
      "chenin-blanc",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-183",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke rode druif en wijnstijl zijn belangrijk in Stellenbosch?",
    "options": [
      "Cabernet Sauvignon en Bordeauxachtige rode blends",
      "Gamay voor lichte Beaujolais",
      "Nebbiolo voor Barolo",
      "Tempranillo voor Rioja Reserva"
    ],
    "answer": 0,
    "explanation": "Stellenbosch is onder meer bekend om Cabernet Sauvignon en rode blends die door Bordeaux zijn geïnspireerd.",
    "misconception": "De andere combinaties horen bij specifieke Europese regio's en niet bij de klassieke Stellenboschassociatie.",
    "tags": [
      "sden-4.2",
      "zuid-afrika",
      "stellenbosch",
      "cabernet-sauvignon"
    ]
  },
  {
    "id": "q-sden2-184",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk profiel past het beste bij klassieke Shiraz uit de warme Barossa Valley?",
    "options": [
      "Licht wit met zeer laag alcohol",
      "Zoet en versterkt met flor",
      "Vol rood met rijp donker fruit en vaak veel alcohol",
      "Neutraal mousserend zonder fruit"
    ],
    "answer": 2,
    "explanation": "Barossa Shiraz is doorgaans vol en krachtig, met rijp donker fruit, specerijen en vaak een relatief hoog alcoholgehalte.",
    "misconception": "Shiraz kan elders koeler en slanker zijn; deze rijpe krachtige stijl hoort specifiek bij het warme Barossa.",
    "tags": [
      "sden-4.2",
      "australie",
      "barossa-valley",
      "shiraz",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-185",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke twee stijlen kan Australische Chardonnay aannemen?",
    "options": [
      "Alleen rood en tanninerijk",
      "Zowel fris en zonder houtsmaak als rijk en houtgerijpt",
      "Alleen zoet en versterkt",
      "Uitsluitend mousserend"
    ],
    "answer": 1,
    "explanation": "Australische Chardonnay kan koel en strak of juist rijp, vol en houtgerijpt zijn, afhankelijk van regio en wijnbereiding.",
    "misconception": "Het land of druivenras bepaalt niet alleen de stijl; klimaat, oogstmoment en kelderkeuzes zijn eveneens belangrijk.",
    "tags": [
      "sden-4.2",
      "australie",
      "chardonnay",
      "wijnstijl"
    ]
  },
  {
    "id": "q-sden2-186",
    "topic": "Wijngebieden: Zuid-Afrika, Australië en Nieuw-Zeeland",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welk aromaprofiel past vaak bij Sauvignon Blanc uit Marlborough?",
    "options": [
      "Muffe kelder en nat karton",
      "Donkere chocolade en zware tannine",
      "Noten en karamel door lange oxidatie",
      "Intens citrus, tropisch fruit en groene kruidigheid"
    ],
    "answer": 3,
    "explanation": "Marlborough Sauvignon Blanc is vaak intens aromatisch, met citrus, passievrucht en groene of kruidige tonen naast hoge zuren.",
    "misconception": "Muffe kelder is een wijnfout en noten of karamel wijzen eerder op oxidatieve rijping dan op jonge Sauvignon Blanc.",
    "tags": [
      "sden-4.2",
      "nieuw-zeeland",
      "marlborough",
      "sauvignon-blanc",
      "aroma"
    ]
  },
  {
    "id": "q-sden2-187",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke EU-herkomstcategorie heeft de sterkste verplichte band tussen product en afgebakend gebied?",
    "options": [
      "BOB",
      "BGA",
      "Wijn zonder geografische aanduiding",
      "Een vrijwillige fantasienaam"
    ],
    "answer": 0,
    "explanation": "Bij BOB, Beschermde Oorsprongsbenaming, moeten druiven en productie sterker aan het afgebakende gebied verbonden zijn dan bij BGA.",
    "misconception": "BGA beschermt ook een geografische band, maar de herkomst- en productievoorwaarden zijn ruimer dan bij BOB.",
    "tags": [
      "sden-5a.2",
      "bob",
      "bga",
      "herkomst"
    ]
  },
  {
    "id": "q-sden2-188",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke Franse term komt overeen met een beschermde oorsprongsbenaming voor wijn?",
    "options": [
      "Joven",
      "Trocken",
      "AOP",
      "Tawny"
    ],
    "answer": 2,
    "explanation": "AOP, Appellation d'Origine Protégée, is de Franse benaming binnen de Europese categorie van beschermde oorsprong.",
    "misconception": "Joven, Trocken en Tawny beschrijven leeftijd of stijl en zijn geen Franse oorsprongscategorieën.",
    "tags": [
      "sden-5a.2",
      "aop",
      "bob",
      "frankrijk"
    ]
  },
  {
    "id": "q-sden2-189",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke methode versnelt de afbraak van alcohol in het lichaam aantoonbaar?",
    "options": [
      "Sterke koffie",
      "Een koude douche",
      "Een zware maaltijd na het drinken",
      "Geen van deze; het lichaam heeft vooral tijd nodig"
    ],
    "answer": 3,
    "explanation": "Koffie, douchen of eten kan het gevoel beïnvloeden, maar versnelt de afbraak van alcohol door de lever niet aantoonbaar.",
    "misconception": "Je wakkerder voelen is niet hetzelfde als nuchter zijn; het alcoholgehalte daalt daardoor niet sneller.",
    "tags": [
      "sden-5b.2",
      "verantwoord-alcoholgebruik",
      "afbraak"
    ]
  },
  {
    "id": "q-sden2-190",
    "topic": "Wet- en regelgeving",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat hebben correcte Nederlandse standaardglazen bier, wijn en sterke drank met elkaar gemeen?",
    "options": [
      "Ze bevatten ongeveer evenveel pure alcohol",
      "Ze hebben hetzelfde volume",
      "Ze hebben hetzelfde alcoholpercentage",
      "Ze zijn allemaal precies 250 milliliter"
    ],
    "answer": 0,
    "explanation": "Een correct standaardglas van elke dranksoort bevat in Nederland ongeveer tien gram pure alcohol, ondanks verschillende volumes en percentages.",
    "misconception": "Een standaardglas vergelijkt de hoeveelheid pure alcohol en niet de hoeveelheid vloeistof of het alcoholpercentage.",
    "tags": [
      "sden-5b.2",
      "verantwoord-alcoholgebruik",
      "standaardglas"
    ]
  },
  {
    "id": "q-sden2-191",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat beschrijf je met de kleurintensiteit van een wijn?",
    "options": [
      "Of de wijn droog of zoet smaakt",
      "Of de kleur bleek, middel of diep is",
      "Hoeveel alcohol op het etiket staat",
      "Hoe luid de kurk knalt"
    ],
    "answer": 1,
    "explanation": "Kleurintensiteit beschrijft hoe bleek of diep de kleur oogt en is onderdeel van de visuele beoordeling van wijn.",
    "misconception": "Kleurintensiteit kan aanwijzingen geven, maar bepaalt niet rechtstreeks zoetheid, alcohol of kwaliteit.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "uiterlijk",
      "kleurintensiteit"
    ]
  },
  {
    "id": "q-sden2-192",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke beschrijving hoort in het onderdeel geur van een eenvoudige proefnotitie?",
    "options": [
      "De fles bevat 750 milliliter",
      "De wijn kost twintig euro",
      "Aroma's van appel, citrus en bloemen",
      "De kurk is vijf centimeter lang"
    ],
    "answer": 2,
    "explanation": "Een geurbeschrijving benoemt waarneembare aroma's, bijvoorbeeld fruit, bloemen, kruiden, hout of ontwikkeling.",
    "misconception": "Prijs, flesinhoud en kurklengte kunnen productinformatie zijn, maar beschrijven niet wat je ruikt.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "geur",
      "proefnotitie"
    ]
  },
  {
    "id": "q-sden2-193",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Een droge wijn ruikt sterk naar rijpe perzik. Wat kun je daaruit over zoetheid concluderen?",
    "options": [
      "De wijn moet wettelijk zoet zijn",
      "Perzikgeur is hetzelfde als restsuiker",
      "De wijn kan droog zijn ondanks een rijp fruitaroma",
      "De wijn is automatisch versterkt"
    ],
    "answer": 2,
    "explanation": "Fruitige aroma's en zoetheid zijn verschillende waarnemingen; een droge wijn kan zeer rijp en fruitig ruiken.",
    "misconception": "De hersenen kunnen rijp fruit met zoet associëren, maar echte zoetheid beoordeel je op de smaak van restsuiker.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "fruitigheid",
      "zoetheid"
    ]
  },
  {
    "id": "q-sden2-194",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Welke mondsensatie kan wijzen op een relatief hoog alcoholgehalte?",
    "options": [
      "Warmte of branderigheid in de afdronk",
      "Een muffe geur van nat karton",
      "Belletjes door koolzuur",
      "Een bleke kleur zonder smaak"
    ],
    "answer": 0,
    "explanation": "Een hoger alcoholgehalte kan een warm of licht branderig gevoel geven en bijdragen aan een vollere indruk.",
    "misconception": "Koolzuurprikkeling en kurkgeur hebben andere oorzaken en zijn geen directe maat voor alcoholgehalte.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "alcohol",
      "mondgevoel"
    ]
  },
  {
    "id": "q-sden2-195",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat bedoel je met de body van een wijn?",
    "options": [
      "De vorm van de fles",
      "De hoeveelheid bezinksel",
      "Alleen het suikergehalte",
      "Hoe licht of vol de wijn in de mond aanvoelt"
    ],
    "answer": 3,
    "explanation": "Body beschrijft het algemene gewicht en de volheid van de wijn in de mond, van licht tot vol.",
    "misconception": "Body wordt door meerdere factoren beïnvloed, zoals alcohol, extract en suiker, maar is niet identiek aan één daarvan.",
    "tags": [
      "sden-6a.2",
      "proeven",
      "body",
      "mondgevoel"
    ]
  },
  {
    "id": "q-sden2-196",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom wordt een frisse witte wijn doorgaans koeler geserveerd dan een volle rode wijn?",
    "options": [
      "Koelte ondersteunt frisheid, terwijl te koud serveren aroma's en structuur kan dempen",
      "Witte wijn bevriest anders direct",
      "Rode wijn bevat geen zuren",
      "Alle rode wijn moet warm worden geserveerd"
    ],
    "answer": 0,
    "explanation": "Koel serveren benadrukt frisheid in witte wijn; een volle rode wijn krijgt iets warmer meer ruimte voor aroma en structuur.",
    "misconception": "Kamertemperatuur betekent niet heet en witte wijn hoeft niet ijskoud; beide extremen kunnen de smaak verstoren.",
    "tags": [
      "sden-6b.2",
      "serveren",
      "temperatuur",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-197",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is een veilige manier om een fles mousserende wijn te openen?",
    "options": [
      "De fles eerst krachtig schudden",
      "De kurk op mensen richten",
      "De kurk vasthouden en de fles rustig draaien",
      "De kurk met een kurkentrekker doorboren"
    ],
    "answer": 2,
    "explanation": "Houd de kurk onder controle, richt de fles veilig weg en draai rustig de fles zodat de kurk gecontroleerd loskomt.",
    "misconception": "Een harde knal is niet het doel; gecontroleerd openen beperkt gevaar en verlies van wijn en koolzuur.",
    "tags": [
      "sden-6b.2",
      "openen",
      "mousserend",
      "veiligheid"
    ]
  },
  {
    "id": "q-sden2-198",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is bij een jonge, gesloten wijn meestal het doel van karafferen?",
    "options": [
      "De wijn van oud bezinksel scheiden",
      "De wijn contact met zuurstof geven zodat aroma's zich openen",
      "Het alcoholgehalte verlagen tot nul",
      "De wijn mousserend maken"
    ],
    "answer": 1,
    "explanation": "Een jonge gesloten wijn kan worden gekaraffeerd om meer zuurstofcontact te krijgen en aroma's sneller vrij te laten komen.",
    "misconception": "Bij een oude wijn draait overhevelen vaak om depot; bij jonge wijn is beluchting doorgaans het hoofddoel.",
    "tags": [
      "sden-6b.2",
      "karafferen",
      "beluchten",
      "vergelijkmodus"
    ]
  },
  {
    "id": "q-sden2-199",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Waarom toon je in de horeca het etiket vóór het openen aan de gast?",
    "options": [
      "Om de wijn sneller te laten rijpen",
      "Om de wijn op temperatuur te brengen",
      "Om te bevestigen dat dit de bestelde wijn is",
      "Om de kurk alvast vochtig te maken"
    ],
    "answer": 2,
    "explanation": "Het tonen van het etiket geeft de gast gelegenheid herkomst, producent en eventueel oogstjaar vóór opening te bevestigen.",
    "misconception": "Presenteren is geen proefritueel zonder functie; het voorkomt dat de verkeerde fles ongeopend onopgemerkt blijft.",
    "tags": [
      "sden-6b.2",
      "presenteren",
      "etiket",
      "horeca"
    ]
  },
  {
    "id": "q-sden2-200",
    "topic": "Proeven en behandelen van wijn",
    "level": [
      "SDEN 2"
    ],
    "type": "multiple",
    "prompt": "Wat is een belangrijk kenmerk van een geschikt wijnglas?",
    "options": [
      "Het glas is schoon, geurvrij en biedt ruimte om te ruiken",
      "Het glas ruikt sterk naar afwasmiddel",
      "Het glas is tot de rand gevuld",
      "Het glas heeft altijd een gekleurde kom"
    ],
    "answer": 0,
    "explanation": "Een schoon, geurvrij glas met voldoende ruimte boven de wijn maakt kijken, walsen en ruiken mogelijk.",
    "misconception": "Een groot glas hoeft niet vol; juist lege ruimte boven de wijn helpt aroma's verzamelen en beoordelen.",
    "tags": [
      "sden-6b.2",
      "glaswerk",
      "serveren",
      "proeven"
    ]
  }
];
