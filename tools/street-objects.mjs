// Straatarcheologie — "wat is dat ding?" — de handgeschreven kern van het
// street-kind in Spotinus. tools/build-street.mjs leest dit bestand, haalt per
// object de foto's uit de genoemde Commons-categorieën en schrijft
// data/street.json + data/street-photos.json in het bestaande formaat.
//
// Dit bestand is INHOUD: de teksten zijn het waardevolle deel en zijn niet te
// scrapen. Scope is Utrecht ("voor nu alleen voor Utrecht", 29 aug 2026):
// waar een Utrechtse Commons-categorie bestaat staat die voorop; landelijke
// categorieën vullen aan voor objecten die overal hetzelfde zijn. De volgorde
// is didactisch en is de bladervolgorde: onder je voeten -> aan de gevel ->
// palen -> op straat, per groep van bekend naar obscuur.
//
//   cats   -- Commons-categorieën, volgorde = prioriteit (Utrecht eerst).
//             Tellingen geverifieerd 29 aug 2026 via de API.
//   group  -- vier groepen, als `tags.family` + familyName* in de dataset:
//             dat geeft het familiefilter, de familie-sortering én betere
//             afleiders (palen verwarren met palen) zonder één regel appcode.
//   nlWiki/enWiki -- OPTIONEEL: artikeltitels die afwijken van de objectnaam
//             ("Voetschraper", "Paddenstoel (wegwijzer)"). Ze gaan vóór de
//             naam zelf, want juist daarvoor staan ze er; het buildscript
//             checkt welke titel echt bestaat en linkt alleen die. Staat er
//             niets, dan is de objectnaam de kandidaat -- bij 14 van de 24.
//
// Een woord tussen haakjes in `nl` is een echte tweede naam ("Stolperstein
// (struikelsteen)"), geen Wikipedia-disambiguator: het buildscript zet hem als
// `aliases` in de dataset, zodat de typ-quiz hem goedrekent.

export const STREET_GROUPS = {
  "str-grond": { nl: "Onder je voeten", en: "Underfoot" },
  "str-gevel": { nl: "Aan de gevel", en: "On the facade" },
  "str-paal": { nl: "Palen en paaltjes", en: "Posts and bollards" },
  "str-straat": { nl: "Op straat", en: "Street furniture" },
};

export const STREET_OBJECTS = [
  // --- Onder je voeten ------------------------------------------------------
  {
    key: "werfkelder",
    cats: ["Wharf cellars in Utrecht"],
    nl: "Werfkelder",
    en: "Wharf cellar",
    period: "1200–1400",
    group: "str-grond",
    nlWiki: ["Werfkelder", "Werf (kade)"],
    featuresNl: [
      "kelderdeuren in de werfmuur, onder straatniveau",
      "alleen langs Oude- en Nieuwegracht",
      "de rijweg erboven is het dak",
      "eigen kade (werf) aan het water",
    ],
    featuresEn: [
      "cellar doors in the wharf wall, below street level",
      "only along Oudegracht and Nieuwegracht",
      "the roadway above is the roof",
      "its own quay (werf) at the water",
    ],
    factNl:
      "Alleen Utrecht heeft ze: kelders die vanuit het grachtenpand onder de straat door lopen en uitkomen op de lager gelegen werf aan het water. Schippers tilden hun vracht zo rechtstreeks van het schip de kelder in. Je loopt er dagelijks overheen zonder het te merken — de rijweg langs de gracht is letterlijk het dak van honderden middeleeuwse kelders.",
    factEn:
      "Unique to Utrecht: cellars running from the canal house underneath the street, opening onto the lower wharf at the water. Boatmen could lift cargo straight from ship to cellar. You walk over them every day without noticing — the road along the canal is literally the roof of hundreds of medieval cellars.",
  },
  {
    key: "stolperstein",
    cats: ["Stolpersteine in Utrecht (city)"],
    nl: "Stolperstein (struikelsteen)",
    en: "Stolperstein",
    period: "sinds 2007",
    group: "str-grond",
    nlWiki: ["Stolperstein"],
    featuresNl: [
      "messing plaatje van 10×10 cm tussen de stoeptegels",
      "begint met HIER WOONDE",
      "naam, geboortejaar, deportatie- en sterfdatum",
      "vaak meerdere naast elkaar: één gezin",
    ],
    featuresEn: [
      "10×10 cm brass plate set among the paving stones",
      "starts with HIER WOONDE (here lived)",
      "name, year of birth, deportation and death dates",
      "often several together: one family",
    ],
    factNl:
      "Messing steentjes van kunstenaar Gunter Demnig vóór het laatste zelfgekozen woonadres van slachtoffers van de Holocaust. Samen vormen ze het grootste gedecentraliseerde monument ter wereld; ook in Utrecht liggen er honderden. Dat je moet buigen om de tekst te lezen is de bedoeling: je maakt een kleine buiging voor wie hier woonde.",
    factEn:
      "Brass stones by artist Gunter Demnig set before the last freely chosen home of victims of the Holocaust. Together they form the largest decentralised monument in the world; Utrecht has hundreds. Having to bend down to read the text is intentional: you bow slightly to the person who lived here.",
  },
  {
    key: "putdeksel",
    cats: ["Manhole covers in the Netherlands", "Manhole covers in Amsterdam"],
    nl: "Putdeksel",
    en: "Manhole cover",
    period: "1850–heden",
    group: "str-grond",
    featuresNl: [
      "gietijzer, rond of vierkant, in het wegdek",
      "vaak stadswapen of naam van gieterij/nutsbedrijf",
      "ruitpatroon is antislip, geen versiering",
      "letters verklappen wat eronder zit",
    ],
    featuresEn: [
      "cast iron, round or square, set in the road surface",
      "often a city coat of arms or foundry/utility name",
      "the diamond pattern is anti-slip, not decoration",
      "letters reveal what lies beneath",
    ],
    factNl:
      "Gietijzeren deksels op riool-, water- en kabelputten, vaak met het stadswapen en de naam van de gieterij of het nutsbedrijf erin gegoten. Wie eenmaal naar beneden kijkt, leest de hele ondergrondse infrastructuur van de straat: riool, brandkraan, telefoon van de PTT. Verzamelaars fotograferen ze wereldwijd — elk stadsbestuur blijkt zijn eigen deksel te hebben.",
    factEn:
      "Cast-iron covers over sewer, water and cable access points, often bearing the city arms and the name of the foundry or utility. Once you start looking down, you can read the street's entire underground infrastructure: sewer, fire hydrant, PTT telephone ducts. Collectors photograph them worldwide — every city turns out to have its own design.",
  },
  {
    key: "voetenschraper",
    cats: ["Door scrapers"],
    nl: "Voetenschraper",
    en: "Boot scraper",
    period: "1700–1900",
    group: "str-grond",
    nlWiki: ["Voetenschraper", "Voetschraper"],
    featuresNl: [
      "smeedijzeren beugel of plaatje naast de voordeur",
      "op stoephoogte, soms in een eigen nisje",
      "krulwerk bij deftige huizen",
      "scherpe bovenrand: daar schraapte je de zool",
    ],
    featuresEn: [
      "wrought-iron bracket or blade beside the front door",
      "at pavement level, sometimes in its own niche",
      "scrollwork at grander houses",
      "sharp top edge: that is where the sole was scraped",
    ],
    factNl:
      "Een smeedijzeren beugel naast de voordeur om de modder van je zolen te schrapen, uit de tijd dat straten onverhard waren en er overal paardenmest lag. Bij deftige huizen kreeg de schraper een eigen nisje of sierlijk krulwerk. De straten zijn allang schoon, maar de schrapers zitten er nog — kijk maar eens naast oude voordeuren.",
    factEn:
      "A wrought-iron bracket beside the front door for scraping mud off your soles, from the days of unpaved streets and horse manure everywhere. At grander houses the scraper got its own niche or elegant scrollwork. The streets have long been clean, but the scrapers are still there — check beside old front doors.",
  },

  // --- Aan de gevel ---------------------------------------------------------
  {
    key: "gevelsteen",
    cats: ["Gable stones in Utrecht (city)"],
    nl: "Gevelsteen",
    en: "Gable stone",
    period: "1550–1800",
    group: "str-gevel",
    featuresNl: [
      "gebeeldhouwde, vaak beschilderde steen in de gevel",
      "dier, ambacht, heilige of woordspeling",
      "meestal met naam: 'In de...'",
      "boven de deur of tussen de verdiepingen",
    ],
    featuresEn: [
      "carved, often painted stone set into the facade",
      "an animal, trade, saint or pun",
      "usually named: 'In de...' (At the sign of...)",
      "above the door or between floors",
    ],
    factNl:
      "Vóór de huisnummers — ingevoerd rond 1800, in de Franse tijd — herkende je een huis aan zijn gevelsteen: een gebeeldhouwde en beschilderde steen met een dier, ambacht of heilige. 'In de vergulde valk' wás het adres. Veel stenen vertellen over het beroep van een bewoner van eeuwen geleden, en verhuisden soms gewoon mee naar een nieuw pand.",
    factEn:
      "Before house numbers — introduced around 1800, under French rule — you knew a house by its gable stone: a carved, painted stone showing an animal, trade or saint. 'At the gilded falcon' simply was the address. Many stones record the trade of a resident centuries ago, and some even moved along with their owners.",
  },
  {
    key: "muuranker",
    cats: ["Wall anchors in Utrecht (city)", "Wall anchors in Gelderland"],
    nl: "Muuranker",
    en: "Wall anchor",
    period: "1500–1900",
    group: "str-gevel",
    enWiki: ["Anchor plate"],
    featuresNl: [
      "smeedijzeren staaf, krul of lelie op de gevel",
      "in rijen ter hoogte van de verdiepingsvloeren",
      "soms samen een jaartal vormend",
      "constructie, geen versiering",
    ],
    featuresEn: [
      "wrought-iron bar, scroll or fleur-de-lis on the facade",
      "in rows at floor level of each storey",
      "sometimes spelling a year together",
      "structure, not decoration",
    ],
    factNl:
      "De smeedijzeren krul of staaf op oude gevels is constructie, geen versiering: het anker bindt de houten balklaag aan de bakstenen muur, zodat de gevel niet naar buiten kan wijken. Aan de rijen ankers lees je af waar de verdiepingen zitten. Soms vormen ze samen het bouwjaar — een jaartal, in ijzer op de gevel gespeld.",
    factEn:
      "The wrought-iron scroll or bar on old facades is structure, not ornament: the anchor ties the timber floor beams to the brick wall so the facade cannot lean outward. The rows of anchors show you exactly where the floors are. Sometimes they spell the building year together — a date written on the facade in iron.",
  },
  {
    key: "hijsbalk",
    cats: ["Lifting beams in the Netherlands"],
    nl: "Hijsbalk",
    en: "Hoisting beam",
    period: "1600–heden",
    group: "str-gevel",
    enWiki: ["Hoist (device)"],
    featuresNl: [
      "balk met haak, bovenin uit de gevel stekend",
      "onder de daklijst of in de geveltop",
      "vaak boven een rij zolderluiken",
      "gevel helt er soms iets voorover ('op vlucht')",
    ],
    featuresEn: [
      "beam with a hook protruding high on the facade",
      "under the eaves or in the gable top",
      "often above a row of loft shutters",
      "the facade sometimes leans slightly forward",
    ],
    factNl:
      "De balk met haak die bovenuit vrijwel elk oud stadshuis steekt. Trappen waren — en zijn — te smal voor kasten en piano's, dus alles ging buitenom aan een touw naar boven. Veel gevels hellen zelfs iets voorover ('op vlucht'), zodat de last vrij van de gevel hing. Verhuizers gebruiken de hijsbalk tot op de dag van vandaag.",
    factEn:
      "The beam with a hook protruding from the top of nearly every old Dutch townhouse. Stairs were — and are — too narrow for wardrobes and pianos, so everything went up outside on a rope. Many facades even lean slightly forward so the load would hang clear of the wall. Movers still use hoisting beams to this day.",
  },
  {
    key: "pothuis",
    cats: ["Pothuis"],
    nl: "Pothuis",
    en: "Pothuis (cellar porch)",
    period: "1600–1800",
    group: "str-gevel",
    enWiki: ["Pothuis"],
    featuresNl: [
      "laag uitbouwtje tegen de gevel, half onder de stoep",
      "eigen deurtje of raampje op kniehoogte",
      "schuin dakje tegen de gevel aan",
      "hoort bij een werk- of opslagkelder",
    ],
    featuresEn: [
      "low extension against the facade, half below the pavement",
      "its own little door or window at knee height",
      "small sloping roof against the wall",
      "belongs to a work or storage cellar",
    ],
    factNl:
      "Een laag uitbouwtje tegen de gevel, half onder straatniveau, met een eigen deurtje of raampje: de toegang en lichtinval van een kelderwerkplaats. Schoenmakers en andere ambachtslieden zaten er letterlijk onder de stoep te werken. Er zijn er nog maar enkele tientallen over, vooral in oude binnensteden — wie er een ziet, kijkt naar een verdwenen manier van werken.",
    factEn:
      "A low extension against the facade, half below street level, with its own little door or window: the entrance and daylight of a cellar workshop. Cobblers and other craftsmen literally worked below the pavement. Only a few dozen survive, mostly in old town centres — spotting one means looking at a vanished way of working.",
  },
  {
    key: "gaper",
    cats: ["Gaper"],
    nl: "Gaper",
    en: "Gaper",
    period: "1600–1900",
    group: "str-gevel",
    featuresNl: [
      "gebeeldhouwde kop met open mond boven de deur",
      "vaak exotisch gekleed: tulband of steek",
      "soms een pil op de uitgestoken tong",
      "hoort bij drogist of apotheek",
    ],
    featuresEn: [
      "carved head with open mouth above the door",
      "often exotically dressed: turban or tricorn",
      "sometimes a pill on the outstretched tongue",
      "marks a druggist or pharmacy",
    ],
    factNl:
      "De gebeeldhouwde kop met open mond boven de deur van een drogisterij, vaak een exotisch geklede figuur — soms met een pil op de tong. In een tijd waarin weinig mensen konden lezen wás het uithangteken de winkelnaam. En de open mond doet precies wat jij bij de drogist ook deed: medicijn innemen.",
    factEn:
      "The carved head with an open mouth above a druggist's door, often an exotically dressed figure — sometimes with a pill on its tongue. In an age when few people could read, the shop sign was the shop's name. And the open mouth does exactly what you did at the druggist's: take medicine.",
  },
  {
    key: "verzekeringsplaatje",
    cats: ["Fire insurance signs"],
    nl: "Brandverzekeringsplaatje",
    en: "Fire insurance mark",
    period: "1720–1900",
    group: "str-gevel",
    nlWiki: ["Verzekeringsplaatje", "Brandverzekering"],
    featuresNl: [
      "klein metalen plaatje hoog op de gevel",
      "embleem: feniks, zon, anker of wapen",
      "vaak met naam van de maatschappij",
      "geverfd of verguld blik, koper of lood",
    ],
    featuresEn: [
      "small metal plate high on the facade",
      "emblem: phoenix, sun, anchor or arms",
      "often with the company name",
      "painted or gilded tin, copper or lead",
    ],
    factNl:
      "Het metalen plaatje met een feniks, zon of ander embleem hoog op oude gevels is een brandverzekeringsteken uit de 18e en 19e eeuw: bewijs dat het pand verzekerd was, reclame voor de maatschappij, en herkenningsteken voor de spuitgasten die de verzekeraar er zelf op na hield. De feniks die uit zijn as herrijst was het populairste beeldmerk — het huis zou na brand immers herrijzen.",
    factEn:
      "The metal plate with a phoenix, sun or other emblem high on old facades is a fire insurance mark from the 18th and 19th centuries: proof the building was insured, advertising for the company, and a marker for the fire crews insurers kept themselves. The phoenix rising from its ashes was the favourite emblem — the house, too, would rise again after a fire.",
  },
  {
    key: "eerste-steen",
    cats: ["Foundation stones in the Netherlands"],
    nl: "Eerste steen",
    en: "Foundation stone",
    period: "1600–heden",
    group: "str-gevel",
    enWiki: ["Cornerstone"],
    featuresNl: [
      "gedenksteen laag in de gevel",
      "tekst: 'de eerste steen gelegd door...'",
      "naam en datum, vaak van een kind",
      "bij woonhuizen, scholen en kerken",
    ],
    featuresEn: [
      "memorial stone low in the facade",
      "text: 'the first stone laid by...'",
      "name and date, often of a child",
      "on houses, schools and churches",
    ],
    factNl:
      "'De eerste steen gelegd door...' — een gedenksteen onderin de gevel, vaak gelegd door een kind van de opdrachtgever, met naam en datum. Een bouwtraditie die nog steeds bestaat. Wie erop let vindt ze overal, van grachtenpand tot school, en leest in het voorbijgaan wie hier ooit trots stond te metselen.",
    factEn:
      "'The first stone laid by...' — a memorial stone low in the facade, often laid by a child of the client, with name and date. A building tradition that continues today. Once you look for them they are everywhere, from canal house to school, telling you in passing who once proudly stood here with a trowel.",
  },
  {
    key: "muurreclame",
    cats: [
      "Ghost signs in the Netherlands",
      "Advertisements on bricks in the Netherlands",
      "Wall painted advertising in the Netherlands",
    ],
    nl: "Muurreclame (spookreclame)",
    en: "Ghost sign",
    period: "1880–1960",
    group: "str-gevel",
    nlWiki: ["Muurreclame"],
    featuresNl: [
      "vervaagde geschilderde reclame op een zijgevel",
      "merken en winkels die niet meer bestaan",
      "sierletters, direct op de baksteen",
      "vaak hoog en op blinde muren",
    ],
    featuresEn: [
      "faded painted advert on a side wall",
      "brands and shops that no longer exist",
      "ornate lettering, straight onto the brick",
      "often high up on blind walls",
    ],
    factNl:
      "Vervaagde, direct op de baksteen geschilderde reclames voor allang verdwenen winkels en merken: 'spookreclames'. Reclameschilders zetten ze op zijgevels toen een blinde muur het grootste reclamebord van de buurt was. Elke regenbui vervagen ze verder; sommige gemeenten restaureren ze inmiddels als erfgoed.",
    factEn:
      "Faded adverts painted straight onto the brick for long-vanished shops and brands: 'ghost signs'. Sign painters put them on side walls when a blind wall was the biggest billboard in the neighbourhood. Every rain shower fades them further; some cities now restore them as heritage.",
  },
  {
    key: "deurklopper",
    cats: ["Door knockers in the Netherlands"],
    nl: "Deurklopper",
    en: "Door knocker",
    period: "1600–1900",
    group: "str-gevel",
    featuresNl: [
      "smeedijzeren of messing klopper op de voordeur",
      "leeuwenkop met ring is het klassieke model",
      "slijtplek of slagplaatje eronder",
      "hoe rijker de klopper, hoe rijker het huis",
    ],
    featuresEn: [
      "wrought-iron or brass knocker on the front door",
      "lion's head with ring is the classic model",
      "wear mark or strike plate beneath it",
      "the richer the knocker, the richer the house",
    ],
    factNl:
      "Vóór de elektrische bel klopte je aan — met de smeedijzeren of messing klopper op de voordeur. De leeuwenkop met ring is het klassieke model: de leeuw bewaakt het huis. Een zware, rijk bewerkte klopper was het visitekaartje van de deur; het belletje maakte hem overbodig, maar weghalen deed bijna niemand.",
    factEn:
      "Before the electric bell you knocked — with the wrought-iron or brass knocker on the front door. The lion's head with a ring is the classic model: the lion guards the house. A heavy, richly worked knocker was the door's calling card; the doorbell made it obsolete, but hardly anyone took theirs down.",
  },
  {
    key: "peilmerk",
    cats: ["Normaal Amsterdams Peil"],
    nl: "NAP-peilmerk",
    en: "NAP benchmark",
    period: "sinds 1818",
    group: "str-gevel",
    nlWiki: ["Normaal Amsterdams Peil"],
    enWiki: ["Amsterdam Ordnance Datum"],
    featuresNl: [
      "bronzen bout of peilschaal aan gevel, brug of sluis",
      "vaak met 'NAP' en een maatverdeling",
      "op ooghoogte of net boven het water",
      "hoort bij het landelijke hoogtemeetnet",
    ],
    featuresEn: [
      "bronze bolt or gauge board on a facade, bridge or lock",
      "often marked 'NAP' with a graduated scale",
      "at eye level or just above the water",
      "part of the national height survey network",
    ],
    factNl:
      "De bronzen bout of geschilderde peilschaal aan gevels, bruggen en sluizen is een officieel meetpunt van het Normaal Amsterdams Peil — de hoogte-nullijn van Nederland, en inmiddels het referentievlak van half Europa. Tienduizenden van die merken vormen samen het net waarmee verzakking en waterstand worden gevolgd. Eenmaal gezien, overal gezien.",
    factEn:
      "The bronze bolt or painted gauge board on facades, bridges and locks is an official benchmark of the Normaal Amsterdams Peil — the zero line for elevation in the Netherlands, and by now the reference for much of Europe. Tens of thousands of these marks form the network that tracks subsidence and water levels. Once seen, seen everywhere.",
  },
  {
    key: "lantaarnconsole",
    cats: ["Streetlight corbels in Utrecht (city)"],
    nl: "Lantaarnconsole",
    en: "Streetlight corbel",
    period: "sinds 1953",
    group: "str-gevel",
    enWiki: ["Corbel"],
    featuresNl: [
      "gebeeldhouwde console onder een grachtlantaarn",
      "elke console een eigen voorstelling",
      "ambachten, sagen, heiligen, stadsgeschiedenis",
      "alleen langs de Utrechtse grachten",
    ],
    featuresEn: [
      "sculpted corbel beneath a canal lantern",
      "every corbel a different scene",
      "trades, legends, saints, city history",
      "only along Utrecht's canals",
    ],
    factNl:
      "Onder honderden lantaarns langs de Utrechtse grachten zit een gebeeldhouwde console met elk een eigen voorstelling: ambachten, sagen, heiligen, stukjes stadsgeschiedenis. Beeldhouwers maken er sinds de restauratie van de grachten in de jaren vijftig steeds nieuwe bij — een gratis openluchtmuseum dat alleen Utrecht heeft. Loop met je hoofd omhoog.",
    factEn:
      "Beneath hundreds of lanterns along Utrecht's canals sits a sculpted corbel, each with its own scene: trades, legends, saints, bits of city history. Sculptors have kept adding new ones since the canal restorations of the 1950s — a free open-air museum only Utrecht has. Walk with your head up.",
  },

  // --- Palen en paaltjes ----------------------------------------------------
  {
    key: "amsterdammertje",
    cats: ["Amsterdammertjes"],
    nl: "Amsterdammertje",
    en: "Amsterdammertje",
    period: "1800–heden",
    group: "str-paal",
    featuresNl: [
      "roodbruin gietijzeren paaltje op de stoeprand",
      "drie andreaskruizen uit het stadswapen",
      "kegelvormig met verdikte kop",
      "scheidt stoep van rijweg",
    ],
    featuresEn: [
      "reddish-brown cast-iron post at the kerb",
      "three St Andrew's crosses from the city arms",
      "conical with a thickened head",
      "separates pavement from roadway",
    ],
    factNl:
      "Het roodbruine gietijzeren paaltje met de drie andreaskruizen dat de Amsterdamse stoep tegen auto's beschermt — zo beroemd dat het model naar de stad heet. Ironisch genoeg haalt Amsterdam ze zelf massaal weg om de stoepen leger te maken. Elke stad heeft intussen zijn eigen paaltje: let er maar eens op welk model jouw straat bewaakt.",
    factEn:
      "The reddish-brown cast-iron post with three St Andrew's crosses that protects Amsterdam's pavements from cars — so famous the model is named after the city. Ironically, Amsterdam itself is now removing them en masse to declutter its pavements. Every city has its own bollard by now: check which model guards your street.",
  },
  {
    key: "schamppaal",
    cats: ["Guard stones in the Netherlands", "Traffic bollards made from cannons"],
    nl: "Schamppaal",
    en: "Guard stone",
    period: "1600–1900",
    group: "str-paal",
    featuresNl: [
      "schuine stenen of ijzeren stomp op een hoek",
      "bij poorten, stegen en inritten",
      "soms een ingegraven kanonsloop",
      "slijtsporen van wagenwielen",
    ],
    featuresEn: [
      "sloping stone or iron stump on a corner",
      "at gates, alleys and entrances",
      "sometimes a buried cannon barrel",
      "wear marks from cart wheels",
    ],
    factNl:
      "De schuine stenen stomp op de hoek van poorten en stegen ving de wielnaven van karren op, zodat die de gevel niet kapot schuurden — verkeersschadebescherming van vóór de vangrail. Vaak werd er een afgedankte kanonsloop voor ingegraven: kijk goed en je herkent de verdikte monding nog.",
    factEn:
      "The sloping stone stump on the corner of gates and alleys caught the wheel hubs of carts before they could grind into the wall — collision protection from before the crash barrier. Often a decommissioned cannon barrel was buried for the job: look closely and you can still recognise the muzzle.",
  },
  {
    key: "grenspaal",
    cats: ["Boundary stones in the Netherlands"],
    nl: "Grenspaal",
    en: "Boundary marker",
    period: "1300–1900",
    group: "str-paal",
    featuresNl: [
      "stenen paal met wapen, letter of nummer",
      "langs oude wegen, dijken en gemeentegrenzen",
      "vaak in paren of reeksen",
      "hardsteen, soms met gebeeldhouwde kop",
    ],
    featuresEn: [
      "stone post with arms, a letter or a number",
      "along old roads, dykes and municipal borders",
      "often in pairs or series",
      "bluestone, sometimes with a carved top",
    ],
    factNl:
      "Stenen palen met wapens of letters markeerden waar het gezag wisselde: de stadsvrijheid, het rechtsgebied van een heer, de banpaal waarbuiten verbannen stedelingen moesten blijven. Buiten de oude stad staan ze nog langs wegen en weilanden. Wie er een vindt, staat precies op een middeleeuwse grens die op geen enkel bordje meer staat.",
    factEn:
      "Stone posts bearing arms or letters marked where authority changed: the city's jurisdiction, a lord's domain, the banishment post beyond which exiled citizens had to stay. Outside the old city they still stand along roads and meadows. Find one and you are standing exactly on a medieval border no sign mentions any more.",
  },
  {
    key: "paddenstoel",
    cats: ["Paddenstoel"],
    nl: "ANWB-paddenstoel",
    en: "ANWB mushroom signpost",
    period: "sinds 1919",
    group: "str-paal",
    nlWiki: ["Paddenstoel (wegwijzer)"],
    enWiki: ["Mushroom (signpost)"],
    featuresNl: [
      "lage betonnen wegwijzer op kniehoogte",
      "vier schuine vlakken met bestemmingen",
      "eigen nummer op de hoed",
      "op fietskruisingen in bos en buitengebied",
    ],
    featuresEn: [
      "low concrete signpost at knee height",
      "four sloping faces with destinations",
      "its own number on the cap",
      "at cycle junctions in woods and countryside",
    ],
    factNl:
      "De lage betonnen wegwijzer van de ANWB staat expres op kniehoogte: fietsers lezen hem zonder af te stappen. De eerste stond er in 1919, en elke paddenstoel heeft een eigen nummer waarmee hij in het netwerk terug te vinden is. Wie er op de Heuvelrug een tegenkomt, zit vrijwel zeker op een mooie route.",
    factEn:
      "The ANWB's low concrete signpost sits at knee height on purpose: cyclists can read it without dismounting. The first one appeared in 1919, and every 'mushroom' carries its own number by which it can be located in the network. Meet one on the Utrecht Hill Ridge and you are almost certainly on a good route.",
  },
  {
    key: "rolpaal",
    cats: ["Rolpalen"],
    nl: "Rolpaal",
    en: "Towing roller post",
    period: "1600–1900",
    group: "str-paal",
    enWiki: ["Towpath"],
    featuresNl: [
      "paal met verticale draaibare rol",
      "in bochten van oude vaarten",
      "aan het jaagpad, vlak bij het water",
      "hout of gietijzer",
    ],
    featuresEn: [
      "post with a vertical revolving roller",
      "on bends of old canals",
      "on the towpath, right by the water",
      "wood or cast iron",
    ],
    factNl:
      "Een paal met draaiende rol in de bochten van oude trekvaarten: de lijn waarmee het paard de trekschuit trok, gleed om de rol heen in plaats van in te korten door de bocht of stuk te slijten. Waar een rolpaal staat, liep dus ooit een jaagpad — de intercity van de zeventiende eeuw kwam hier voorbij.",
    factEn:
      "A post with a revolving roller on the bends of old towing canals: the line by which the horse pulled the barge slid around the roller instead of cutting the corner or wearing through. Where a roller post stands, a towpath once ran — the intercity of the seventeenth century passed right here.",
  },

  // --- Op straat ------------------------------------------------------------
  {
    key: "stadspomp",
    cats: [
      "Village pumps in Utrecht (city)",
      "Mariapomp (Utrecht)",
      "Pomp bij Geertekerk (Utrecht)",
      "Pomp bij Jacobikerk (Utrecht)",
      "Village pumps in the Netherlands",
    ],
    nl: "Stadspomp",
    en: "Town pump",
    period: "1600–1880",
    group: "str-straat",
    nlWiki: ["Stadspomp", "Dorpspomp"],
    enWiki: ["Hand pump"],
    featuresNl: [
      "sierlijke pompkast op straat of plein",
      "zwengel of zwengelgat en uitloop",
      "vaak stadswapen of bekroning",
      "bij kerken en op marktpleinen",
    ],
    featuresEn: [
      "ornate pump casing in a street or square",
      "handle (or its hole) and a spout",
      "often a coat of arms or finial",
      "near churches and on market squares",
    ],
    factNl:
      "Vóór de waterleiding — Utrecht kreeg die in 1883 — haalde de hele buurt haar water bij de publieke pomp op straat. Veel pompen waren pronkstukken met stadswapen en sierlijke bekroning. De meeste verdwenen toen de kraan kwam; wie er nog een ziet, zoals bij de Utrechtse Jacobikerk of Geertekerk, kijkt naar het complete waterleidingnet van vóór 1880 in één object.",
    factEn:
      "Before piped water — Utrecht got it in 1883 — the whole neighbourhood fetched its water at the public pump in the street. Many pumps were showpieces with city arms and ornate finials. Most vanished once the tap arrived; see one still standing, as by Utrecht's Jacobikerk or Geertekerk, and you are looking at the entire pre-1880 water supply in a single object.",
  },
  {
    key: "plaskrul",
    cats: ["Plaskrul", "Street urinals in the Netherlands"],
    nl: "Plaskrul",
    en: "Street urinal (krul)",
    period: "1870–1930",
    group: "str-straat",
    nlWiki: ["Plaskrul", "Urinoir"],
    enWiki: ["Pissoir"],
    featuresNl: [
      "krulvormig plaatstalen scherm op straat",
      "open boven- en onderkant",
      "donkergroen of grijs geverfd",
      "vaak aan gracht of brug",
    ],
    featuresEn: [
      "spiral sheet-metal screen in the street",
      "open at top and bottom",
      "painted dark green or grey",
      "often by a canal or bridge",
    ],
    factNl:
      "Het krulvormige stalen scherm op straat is een openbaar urinoir uit de late negentiende eeuw: de 'krul'. Je stapt de spiraal in en staat uit het zicht — meer privacy bood de stad een man niet. Amsterdam heeft er nog tientallen aan de grachten; elders zijn ze zeldzaam geworden en soms zelfs gemeentelijk monument.",
    factEn:
      "The spiral steel screen in the street is a public urinal from the late nineteenth century: the 'krul' (curl). You step into the spiral and stand out of sight — the city offered a man no more privacy than that. Amsterdam still has dozens along its canals; elsewhere they have become rare and sometimes even listed monuments.",
  },
  {
    key: "brievenbus",
    cats: ["Red post boxes in the Netherlands", "Orange post boxes in the Netherlands"],
    nl: "Straatbrievenbus",
    en: "Post box",
    period: "1850–heden",
    group: "str-straat",
    nlWiki: ["Brievenbus"],
    featuresNl: [
      "vrijstaande bus op paal of voet",
      "rood (PTT, tot ±1990) of oranje (daarna)",
      "gleuf met lichtingstijden",
      "steeds zeldzamer op straat",
    ],
    featuresEn: [
      "free-standing box on a post or base",
      "red (PTT, until ±1990) or orange (after)",
      "slot with collection times",
      "ever rarer in the streets",
    ],
    factNl:
      "De straatbrievenbus was generaties lang rood; oranje werd hij pas toen de PTT eind jaren tachtig werd geprivatiseerd. Ooit stond er op elke hoek een, nu verdwijnen er elk jaar honderden. De oude rode bussen die her en der bewaard bleven zijn stille getuigen van de tijd dat de post twee keer per dag kwam.",
    factEn:
      "The Dutch street post box was red for generations; it only turned orange when the state PTT was privatised in the late 1980s. There was one on every corner once; now hundreds disappear each year. The old red boxes still standing here and there are quiet witnesses to the days when post came twice a day.",
  },
  {
    key: "telefooncel",
    cats: ["Telephone booths in the Netherlands"],
    nl: "Telefooncel",
    en: "Telephone booth",
    period: "1931–2015",
    group: "str-straat",
    featuresNl: [
      "glazen of metalen cel met deur",
      "PTT-groen, later KPN-groen met glas",
      "telefoonhoorn-pictogram",
      "vrijwel verdwenen; enkele bewaard",
    ],
    featuresEn: [
      "glass or metal booth with a door",
      "PTT green, later KPN green and glass",
      "telephone handset pictogram",
      "nearly extinct; a few preserved",
    ],
    factNl:
      "Ooit onmisbaar straatmeubilair: de telefooncel, in Nederland decennialang PTT-groen. Met de mobiele telefoon verdween de reden van bestaan, en rond 2015 zijn de laatste openbare cellen opgeruimd. De paar exemplaren die bewaard bleven zijn nu liefhebbersobjecten — wie er een spot, fotografeert een uitgestorven soort.",
    factEn:
      "Once indispensable street furniture: the telephone booth, PTT green in the Netherlands for decades. The mobile phone removed its reason to exist, and around 2015 the last public booths were cleared away. The few surviving specimens are collectors' items now — spot one and you are photographing an extinct species.",
  },
];
