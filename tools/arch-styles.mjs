// De 24 Nederlandse bouwstromingen — de handgeschreven kern van het
// architectuur-kind in Spotinus. tools/build-arch.mjs leest dit bestand, haalt
// er per stroming de gebouwenfoto's bij (Wikidata P149 + de losse `buildings`)
// en schrijft data/arch.json + data/arch-photos.json in het bestaande formaat.
//
// Dit bestand is INHOUD: de teksten zijn het waardevolle deel en zijn niet te
// scrapen. De volgorde is chronologisch en dat is betekenis, geen toeval — de
// cursuslijn ís de tijdlijn, en elke stroming wordt neergezet als reactie op
// wat ervoor kwam. `startYear` stuurt de sortering, `era` de afleiders en het
// periodefilter (zelfde bucket = verwarrende tijdgenoot).
//
//   qids      -- Wikidata-stijlen: gebouwen gevonden via P149 (bouwstijl)
//   buildings -- losse gebouw-Q-ids, voor stromingen die P149 amper dekt
//                (De Stijl, Superdutch) of ter aanvulling van een dunne lijst
//
// Era-buckets: medieval / early-modern (1500-1800) / s19 / s1900 / postwar.

export const ARCH_STYLES = [
  {
    key: "romaans",
    qids: ["Q46261"],
    buildings: [],
    nl: "Romaans",
    en: "Romanesque",
    period: "1000–1250",
    startYear: 1000,
    era: "medieval",
    architects: [],
    featuresNl: ["rondbogen", "dikke muren, kleine vensters", "zware ronde torens", "tufsteen en veldkeien"],
    featuresEn: ["round arches", "thick walls, small windows", "heavy round towers", "tuff and fieldstone"],
    factNl:
      "De oudste stijl die je in Nederland nog tegenkomt, vooral in kerken in Limburg, Groningen en langs de grote rivieren. Bouwen was stapelen: dikke muren dragen alles, dus vensters bleven klein en bogen rond. Massief, aards en donker — het licht komt pas met de gotiek.",
    factEn:
      "The oldest style still standing in the Netherlands, mainly in churches in Limburg, Groningen and along the great rivers. Building meant stacking: thick walls carry everything, so windows stayed small and arches round. Massive, earthbound and dark — the light only arrives with the Gothic.",
  },
  {
    key: "gotiek",
    qids: ["Q176483", "Q695863", "Q10924220"],
    buildings: [],
    nl: "Gotiek",
    en: "Gothic",
    period: "1250–1550",
    startYear: 1250,
    era: "medieval",
    architects: [],
    featuresNl: ["spitsbogen", "hoge vensters met maaswerk", "steunberen en luchtbogen", "verticaal: alles wijst omhoog"],
    featuresEn: ["pointed arches", "tall traceried windows", "buttresses and flying buttresses", "vertical: everything points up"],
    factNl:
      "Het antwoord op de zware romaanse muur: de spitsboog en de steunbeer dragen het gewicht, dus de muur kan open. Hoge vensters, veel licht, alles verticaal. In Nederland vooral baksteengotiek — natuursteen was er nauwelijks, dus de Dom, de Sint-Jan en talloze stadskerken zijn van klei.",
    factEn:
      "The answer to the heavy Romanesque wall: pointed arches and buttresses carry the load, so the wall can open up. Tall windows, floods of light, everything vertical. In the Netherlands mostly brick Gothic — natural stone was scarce, so the Dom, St. John's and countless town churches are made of clay.",
  },
  {
    key: "hollandse-renaissance",
    qids: ["Q236122"],
    buildings: [],
    nl: "Hollandse renaissance",
    en: "Dutch Renaissance",
    period: "1560–1660",
    startYear: 1560,
    era: "early-modern",
    architects: ["Hendrick de Keyser", "Lieven de Key"],
    featuresNl: ["trapgevels", "speklagen: rood baksteen met witte banden", "ornament rond vensters en ingang", "krullen en obelisken op de gevel"],
    featuresEn: ["stepped gables", "brick with white stone bands", "ornament around windows and entrance", "scrolls and obelisks on the gable"],
    factNl:
      "De stijl van de vroege Gouden Eeuw, geleend uit Italië maar vertaald naar baksteen en smalle grachtenpanden. Herkenbaarste trek: rode gevels met witte natuurstenen 'speklagen' en rijk versierde trapgevels. Vleeshal Haarlem, Westerkerk, en zo ongeveer elk decor dat 'oud-Hollands' moet ogen.",
    factEn:
      "The style of the early Golden Age, borrowed from Italy but translated into brick and narrow canal-house plots. Most recognisable trait: red facades with white stone bands and richly decorated stepped gables. The Haarlem meat hall, the Westerkerk, and virtually every backdrop meant to look 'typically Dutch'.",
  },
  {
    key: "hollands-classicisme",
    qids: ["Q2300756"],
    buildings: [],
    nl: "Hollands classicisme",
    en: "Dutch Classicism",
    period: "1625–1700",
    startYear: 1625,
    era: "early-modern",
    architects: ["Jacob van Campen", "Pieter Post", "Philips Vingboons"],
    featuresNl: ["strenge symmetrie", "pilasters over de hele gevelhoogte", "driehoekig fronton", "sober: kalm tegenover de drukke renaissance"],
    featuresEn: ["strict symmetry", "pilasters spanning the facade", "triangular pediment", "sober: calm after the busy Renaissance"],
    factNl:
      "De reactie op de krullen van de renaissance: terug naar de regels van de klassieke oudheid. Symmetrie, pilasters, een fronton — deftig en beheerst. Het Paleis op de Dam is het hoogtepunt; de statige grachtenpanden met rechte kroonlijsten zijn de gewone versie.",
    factEn:
      "The reaction to Renaissance frills: back to the rules of classical antiquity. Symmetry, pilasters, a pediment — stately and restrained. The Royal Palace on Dam Square is the summit; the dignified canal houses with straight cornices are the everyday version.",
  },
  {
    key: "lodewijkstijlen",
    qids: ["Q1517921", "Q945693", "Q388587"],
    buildings: [],
    nl: "Lodewijkstijlen",
    en: "Louis styles",
    period: "1700–1800",
    startYear: 1700,
    era: "early-modern",
    architects: ["Daniel Marot"],
    featuresNl: ["Franse sier op Hollandse panden", "klokgevels en rijke lijstgevels", "asymmetrische rocaille-krullen (Lodewijk XV)", "strakker en rechter naarmate de eeuw vordert (XVI)"],
    featuresEn: ["French ornament on Dutch houses", "bell gables and rich cornice gables", "asymmetric rocaille scrolls (Louis XV)", "straighter and stricter as the century advances (XVI)"],
    factNl:
      "De achttiende eeuw kijkt naar Versailles. Drie golven Franse mode — Lodewijk XIV statig, XV speels met asymmetrische krullen (rococo), XVI weer strak — vooral zichtbaar in deurpartijen, gevelbekroningen en interieurs. Veel grachtenpanden kregen in deze eeuw hun huidige lijst- of klokgevel als modieuze verbouwing.",
    factEn:
      "The eighteenth century looks to Versailles. Three waves of French fashion — Louis XIV stately, XV playful with asymmetric scrolls (rococo), XVI strict again — mostly visible in doorways, gable tops and interiors. Many canal houses got their present bell or cornice gable in this century as a fashionable renovation.",
  },
  {
    key: "neoclassicisme",
    qids: ["Q54111", "Q14378"],
    buildings: [],
    nl: "Neoclassicisme",
    en: "Neoclassicism",
    period: "1770–1850",
    startYear: 1770,
    era: "s19",
    architects: ["Jan de Greef", "Tieleman Franciscus Suys"],
    featuresNl: ["tempelfront met zuilen", "gepleisterde, witte of grijze gevels", "strenge symmetrie, weinig ornament", "koepel of fronton als bekroning"],
    featuresEn: ["temple front with columns", "plastered white or grey facades", "strict symmetry, little ornament", "dome or pediment on top"],
    factNl:
      "Na de rococo-krullen opnieuw de tucht van de oudheid, nu letterlijker dan ooit: complete tempelfronten voor kerken, rechtbanken en beurzen. Herkenbaar aan pleisterwerk — de baksteen werd weggewerkt omdat steen 'klassieker' oogde. Veel witte dorpskerken met zuilenportiek zijn uit deze tijd.",
    factEn:
      "After the rococo scrolls, antique discipline returns, more literal than ever: full temple fronts for churches, courts and exchanges. Recognisable by plasterwork — brick was covered up because stone looked more 'classical'. Many white village churches with columned porticos date from this period.",
  },
  {
    key: "neogotiek",
    qids: ["Q186363"],
    buildings: [],
    nl: "Neogotiek",
    en: "Gothic Revival",
    period: "1840–1900",
    startYear: 1840,
    era: "s19",
    architects: ["Pierre Cuypers", "Alfred Tepe"],
    featuresNl: ["spitsbogen, maar machinaal strak", "rijk gedetailleerde baksteen", "pinakels, torentjes, traceerwerk", "vooral katholieke kerken na 1853"],
    featuresEn: ["pointed arches, but machine-crisp", "richly detailed brickwork", "pinnacles, turrets, tracery", "mainly Catholic churches after 1853"],
    factNl:
      "De middeleeuwen als ideaal, herboren met fabrieksbaksteen en spoorwegstaal. Toen katholieken in 1853 weer bisdommen mochten stichten, explodeerde de kerkbouw — Cuypers bouwde er tientallen, plus het Rijksmuseum en het Centraal Station, die protestants Amsterdam prompt 'te rooms' vond.",
    factEn:
      "The Middle Ages as an ideal, reborn with factory brick and railway steel. When Catholics were allowed dioceses again in 1853, church building exploded — Cuypers built dozens, plus the Rijksmuseum and Central Station, which Protestant Amsterdam promptly judged 'too Roman'.",
  },
  {
    key: "eclecticisme",
    qids: ["Q2479493"],
    buildings: [],
    nl: "Eclecticisme",
    en: "Eclecticism",
    period: "1850–1900",
    startYear: 1850,
    era: "s19",
    architects: ["Cornelis Outshoorn", "A.L. van Gendt"],
    featuresNl: ["stijlen vrij gemengd op één gevel", "gepleisterde sier naast baksteen", "balkons, consoles, gietijzer", "de standaard herenhuisstraat van ±1875"],
    featuresEn: ["styles freely mixed on one facade", "plaster ornament next to brick", "balconies, consoles, cast iron", "the standard 1875 townhouse street"],
    factNl:
      "Waarom kiezen? De negentiende-eeuwse bouwmarkt plukte uit alle stijlen tegelijk: een classicistisch fronton, renaissancekrullen en een gotisch boogje op dezelfde gevel. Het Concertgebouw en het Amstel Hotel zijn de deftige top; de gemiddelde herenhuisstraat uit 1875 de dagelijkse praktijk.",
    factEn:
      "Why choose? The nineteenth-century building market picked from every style at once: a classical pediment, Renaissance scrolls and a Gothic arch on the same facade. The Concertgebouw and the Amstel Hotel are the grand end; the average 1875 townhouse street the daily practice.",
  },
  {
    key: "neorenaissance",
    qids: ["Q502163"],
    buildings: [],
    nl: "Neorenaissance",
    en: "Neo-Renaissance",
    period: "1870–1915",
    startYear: 1870,
    era: "s19",
    architects: ["Constantijn Muysken", "Jan Springer"],
    featuresNl: ["trapgevels en speklagen, maar dan XL", "nationale trots: de Gouden Eeuw herhaald", "rijk ornament, torentjes, erkers", "scholen, postkantoren, stations"],
    featuresEn: ["stepped gables and stone bands, super-sized", "national pride: the Golden Age replayed", "rich ornament, turrets, bay windows", "schools, post offices, stations"],
    factNl:
      "Het jonge koninkrijk zocht een eigen gezicht en vond het in de eigen Gouden Eeuw: trapgevels en rood-witte speklagen keerden terug op scholen, postkantoren en herenhuizen, maar dan groter en drukker dan ooit. De 'vaderlandse stijl' van de late negentiende eeuw.",
    factEn:
      "The young kingdom wanted a face of its own and found it in its own Golden Age: stepped gables and red-and-white stone bands returned on schools, post offices and mansions, bigger and busier than ever. The 'national style' of the late nineteenth century.",
  },
  {
    key: "chaletstijl",
    qids: ["Q2256729"],
    buildings: [],
    nl: "Chaletstijl",
    en: "Chalet style",
    period: "1880–1920",
    startYear: 1880,
    era: "s19",
    architects: [],
    featuresNl: ["ver overstekende daken", "houten sierlijsten en windveren", "balkons en veranda's", "villa's, stations en badplaatsen"],
    featuresEn: ["deep overhanging roofs", "decorative bargeboards", "balconies and verandas", "villas, stations and seaside resorts"],
    factNl:
      "Zwitserland als vakantiedroom, meegenomen naar villaparken en badplaatsen: diepe daken, houtsnijwerk, balkons. De stijl van gezondheid en buitenlucht — sanatoria, stationnetjes en de eerste forensenvilla's langs de spoorlijn.",
    factEn:
      "Switzerland as a holiday dream, brought home to villa parks and seaside resorts: deep roofs, carved wood, balconies. The style of health and fresh air — sanatoria, small stations and the first commuter villas along the railway.",
  },
  {
    key: "jugendstil",
    qids: ["Q1295040"],
    buildings: [],
    nl: "Jugendstil",
    en: "Art Nouveau",
    period: "1895–1915",
    startYear: 1895,
    era: "s19",
    architects: ["Gerrit van Arkel"],
    featuresNl: ["zweepslaglijnen en plantmotieven", "tegeltableaus in de gevel", "smeedijzer met krullen", "asymmetrische vensters"],
    featuresEn: ["whiplash lines and plant motifs", "tile tableaux in the facade", "curling wrought iron", "asymmetric windows"],
    factNl:
      "De eerste stijl die níét terugkeek: geen zuilen of trapgevels maar zwierige lijnen uit de natuur. In Nederland braaf vergeleken met Brussel of Parijs — vooral winkelpuien, verzekeringskantoren en tegeltableaus. Kijk omhoog boven winkelstraten: daar zit hij nog.",
    factEn:
      "The first style that did not look back: no columns or stepped gables but sweeping lines from nature. Tame in the Netherlands compared to Brussels or Paris — mostly shopfronts, insurance offices and tile tableaux. Look up above shopping streets: it is still there.",
  },
  {
    key: "rationalisme",
    qids: ["Q2535546"],
    buildings: ["Q851200"],
    nl: "Rationalisme (Berlage)",
    en: "Rationalism (Berlage)",
    period: "1895–1920",
    startYear: 1895,
    era: "s1900",
    architects: ["H.P. Berlage", "K.P.C. de Bazel"],
    featuresNl: ["eerlijke baksteen, constructie in het zicht", "ornament alleen waar het iets doet", "vlakke gevels, zware plinten", "romaanse rondbogen als stil citaat"],
    featuresEn: ["honest brick, structure in plain sight", "ornament only where it works", "flat facades, heavy plinths", "Romanesque arches as a quiet quote"],
    factNl:
      "Berlages afrekening met de neostijlen en het eclectische 'behang': een gebouw moet tonen hoe het gemaakt is. De Beurs van Berlage is het manifest — vlakke baksteen, constructie in het zicht, ornament dat meewerkt in plaats van versiert. Hier begint de moderne Nederlandse architectuur.",
    factEn:
      "Berlage's reckoning with the neo-styles and eclectic 'wallpaper': a building must show how it is made. The Beurs van Berlage is the manifesto — plain brick, visible structure, ornament that works instead of decorates. Modern Dutch architecture starts here.",
  },
  {
    key: "amsterdamse-school",
    qids: ["Q478742"],
    buildings: [],
    nl: "Amsterdamse School",
    en: "Amsterdam School",
    period: "1912–1935",
    startYear: 1912,
    era: "s1900",
    architects: ["Michel de Klerk", "Piet Kramer", "J.M. van der Mey"],
    featuresNl: ["golvend, plastisch metselwerk", "laddervensters", "decoratief smeedwerk en beeldhouwwerk", "gevel als sculptuur, hoeken als accent"],
    featuresEn: ["undulating, sculptural brickwork", "ladder windows", "decorative ironwork and carving", "the facade as sculpture, corners as accents"],
    factNl:
      "De expressionistische opstand tegen Berlages strengheid: baksteen mag wél zingen. Golvende gevels, laddervensters, torentjes zonder functie — gebouwd als volkshuisvesting, dus arbeiders kregen paleizen. Het Schip van De Klerk is het icoon; hele buurten in Amsterdam-Zuid de dagelijkse versie.",
    factEn:
      "The expressionist revolt against Berlage's rigour: brick is allowed to sing after all. Undulating facades, ladder windows, purposeless turrets — built as social housing, so workers got palaces. De Klerk's Het Schip is the icon; whole neighbourhoods of Amsterdam-Zuid the everyday version.",
  },
  {
    key: "nieuwe-haagse-school",
    qids: ["Q2314870"],
    buildings: [],
    nl: "Nieuwe Haagse School",
    en: "New Hague School",
    period: "1915–1935",
    startYear: 1915,
    era: "s1900",
    architects: ["Jan Wils", "Co Brandes"],
    featuresNl: ["blokkige, kubistische volumes", "horizontale lijnen, platte daken", "strakke baksteen met betonbanden", "Wright als voorbeeld, niet De Klerk"],
    featuresEn: ["blocky cubist volumes", "horizontal lines, flat roofs", "taut brick with concrete bands", "Wright as the model, not De Klerk"],
    factNl:
      "Het Haagse antwoord op de Amsterdamse School: dezelfde baksteen, maar beheerst en hoekig in plaats van zwierig. Geïnspireerd op Frank Lloyd Wright — horizontale daklijsten, blokvolumes, symmetrie. Vergelijk een Haagse straat uit 1925 met een Amsterdamse en je ziet twee temperamenten.",
    factEn:
      "The Hague's answer to the Amsterdam School: the same brick, but controlled and angular instead of exuberant. Inspired by Frank Lloyd Wright — horizontal roof lines, block volumes, symmetry. Compare a 1925 Hague street with an Amsterdam one and you see two temperaments.",
  },
  {
    key: "de-stijl",
    qids: ["Q380211"],
    buildings: ["Q914231", "Q4989606", "Q1829447"],
    nl: "De Stijl",
    en: "De Stijl",
    period: "1917–1931",
    startYear: 1917,
    era: "s1900",
    architects: ["Gerrit Rietveld", "J.J.P. Oud", "Jan Wils"],
    featuresNl: ["vlakken in rood, geel, blauw, wit, zwart", "geen symmetrie, wel evenwicht", "lijnen en vlakken schuiven langs elkaar", "binnen en buiten lopen door"],
    featuresEn: ["planes in red, yellow, blue, white, black", "no symmetry, but balance", "lines and planes sliding past each other", "inside and outside flow together"],
    factNl:
      "De radicaalste van allemaal: architectuur als abstract schilderij van Mondriaan, in drie dimensies. Nauwelijks gebouwd — het Rietveld Schröderhuis is zo'n beetje de hele oogst — maar wereldberoemd en eindeloos invloedrijk. Meer manifest dan bouwpraktijk, en juist daarom onsterfelijk.",
    factEn:
      "The most radical of them all: architecture as an abstract Mondrian painting, in three dimensions. Barely built — the Rietveld Schröder House is nearly the entire harvest — yet world-famous and endlessly influential. More manifesto than building practice, and immortal for exactly that reason.",
  },
  {
    key: "nieuwe-bouwen",
    qids: ["Q11784483", "Q47942", "Q17104714"],
    buildings: ["Q2328849", "Q2743329"],
    nl: "Nieuwe Bouwen",
    en: "Functionalism",
    period: "1920–1940",
    startYear: 1920,
    era: "s1900",
    architects: ["J.A. Brinkman & L.C. van der Vlugt", "Johannes Duiker", "J.J.P. Oud"],
    featuresNl: ["staal, glas en beton, geen ornament", "witte vlakken, lange vensterstroken", "licht, lucht en ruimte als programma", "fabrieken, sanatoria, witte woonwijken"],
    featuresEn: ["steel, glass and concrete, zero ornament", "white planes, long window strips", "light, air and space as the programme", "factories, sanatoria, white housing estates"],
    factNl:
      "Weg met de baksteenromantiek: bouwen is een rationeel antwoord op licht, lucht en hygiëne. Staalskelet, glasgevels, witte vlakken — de Van Nellefabriek en sanatorium Zonnestraal zijn er wereldberoemd om. De vorm volgt de functie; versiering is verdacht.",
    factEn:
      "Away with brick romanticism: building is a rational answer to light, air and hygiene. Steel frame, glass walls, white planes — the Van Nelle Factory and Zonnestraal sanatorium are world-famous for it. Form follows function; decoration is suspect.",
  },
  {
    key: "art-deco",
    qids: ["Q12720942"],
    buildings: [],
    nl: "Art deco",
    en: "Art Deco",
    period: "1920–1940",
    startYear: 1920,
    era: "s1900",
    architects: ["Hijman Louis de Jong"],
    featuresNl: ["geometrisch ornament: zigzag, waaier, zonnestraal", "luxe materialen en verguldsel", "verticale accenten", "theaters, bioscopen, warenhuizen"],
    featuresEn: ["geometric ornament: zigzags, fans, sunbursts", "luxurious materials and gilding", "vertical accents", "theatres, cinemas, department stores"],
    factNl:
      "Het mondaine zusje van het interbellum: ornament mocht weer, maar dan machinaal en geometrisch. Nederland deed bescheiden mee — theater Tuschinski is de uitbundige uitzondering die iedereen kent. Zoek zigzagranden en waaiervormen boven etalages en bioscoopingangen.",
    factEn:
      "The glamorous sibling of the interwar years: ornament allowed again, but machine-made and geometric. The Netherlands joined modestly — the Tuschinski theatre is the exuberant exception everyone knows. Look for zigzag borders and fan shapes above shopfronts and cinema entrances.",
  },
  {
    key: "delftse-school",
    qids: ["Q2748747", "Q1289482"],
    buildings: [],
    nl: "Delftse School",
    en: "Delft School",
    period: "1925–1955",
    startYear: 1925,
    era: "s1900",
    architects: ["M.J. Granpré Molière", "A.J. Kropholler"],
    featuresNl: ["ambachtelijke baksteen, zadeldaken", "kleine vensters met luiken", "dorps en tijdloos bedoeld", "kerken, raadhuizen, wederopbouwdorpen"],
    featuresEn: ["craftsman brick, saddle roofs", "small shuttered windows", "meant to feel village-like and timeless", "churches, town halls, rebuilt villages"],
    factNl:
      "De tegenbeweging tegen het Nieuwe Bouwen, geleid vanuit Delft: geen staal en glas maar ambacht, baksteen en het dorpse verleden. Traditionalistisch en katholiek-degelijk; na 1945 kregen verwoeste dorpen vaak een Delftse-School-hart. De eeuwige tegenpool van Van Nelle.",
    factEn:
      "The counter-movement to Functionalism, led from Delft: no steel and glass but craft, brick and the village past. Traditionalist and solidly Catholic; after 1945, destroyed villages often got a Delft School heart. The eternal opposite of Van Nelle.",
  },
  {
    key: "wederopbouw",
    qids: ["Q3282723"],
    buildings: [],
    nl: "Wederopbouw",
    en: "Post-war reconstruction",
    period: "1945–1965",
    startYear: 1945,
    era: "postwar",
    architects: ["J.H. van den Broek & J.B. Bakema", "W.M. Dudok"],
    featuresNl: ["licht, lucht en herhaling: stempelwijken", "beton, baksteen en glas gemengd", "kunst aan de gevel: reliëfs en mozaïeken", "flats in het groen, brede straten"],
    featuresEn: ["light, air and repetition: stamp-plan estates", "concrete, brick and glass combined", "art on the facade: reliefs and mosaics", "slabs in green space, wide streets"],
    factNl:
      "Na de oorlog moest álles tegelijk: snel, veel en optimistisch. Het Nieuwe Bouwen werd volwassen beleid — flats in stempels, winkelpromenades (de Lijnbaan was de eerste van Europa), en overal gevelkunst. Decennia ondergewaardeerd, nu herontdekt als eigen stijl.",
    factEn:
      "After the war everything had to happen at once: fast, plentiful and optimistic. Functionalism became official policy — housing blocks in repeated 'stamps', pedestrian shopping streets (the Lijnbaan was Europe's first), and facade art everywhere. Undervalued for decades, now rediscovered as a style of its own.",
  },
  {
    key: "bossche-school",
    qids: ["Q2130795"],
    buildings: [],
    nl: "Bossche School",
    en: "Bossche School",
    period: "1946–1975",
    startYear: 1946,
    era: "postwar",
    architects: ["Dom Hans van der Laan"],
    featuresNl: ["het 'plastisch getal': vaste maatverhoudingen", "grijze en bruine baksteen, diepe neggen", "kloosterlijke soberheid", "vierkante kolommen, open galerijen"],
    featuresEn: ["the 'plastic number': fixed proportions", "grey and brown brick, deep reveals", "monastic austerity", "square columns, open galleries"],
    factNl:
      "De strengste Nederlandse stroming, ontstaan uit een cursus kerkbouw in Den Bosch. Benedictijner monnik Dom van der Laan bouwde alles op één maatstelsel, het 'plastisch getal' — architectuur als contemplatie. Sober grijs metselwerk, diepe vensternissen, volmaakte rust.",
    factEn:
      "The most austere Dutch movement, born from a church-building course in Den Bosch. Benedictine monk Dom van der Laan built everything on one system of proportion, the 'plastic number' — architecture as contemplation. Sober grey brickwork, deep window reveals, perfect calm.",
  },
  {
    key: "brutalisme",
    qids: ["Q994776"],
    buildings: [],
    nl: "Brutalisme",
    en: "Brutalism",
    period: "1960–1980",
    startYear: 1960,
    era: "postwar",
    architects: ["Marius Duintjer", "Frank van Klingeren"],
    featuresNl: ["ruw zichtbeton (béton brut)", "zware, gesloten volumes", "constructie uitvergroot tot vorm", "universiteiten, kantoren, kerken"],
    featuresEn: ["raw exposed concrete (béton brut)", "heavy closed volumes", "structure enlarged into form", "universities, offices, churches"],
    factNl:
      "Beton zonder make-up: ruw, zwaar en eerlijk tot op het bot — de bekisting laat haar afdruk gewoon zitten. In Nederland zachter gedoseerd dan in Engeland, maar universiteitsgebouwen, kerken en kantoren uit de jaren zestig dragen het volop. Je haat het of je houdt ervan; steeds meer mensen houden ervan.",
    factEn:
      "Concrete without make-up: raw, heavy and honest to the bone — the formwork leaves its imprint in plain sight. Dosed more gently in the Netherlands than in England, but 1960s university buildings, churches and offices carry it in abundance. You hate it or you love it; ever more people love it.",
  },
  {
    key: "structuralisme",
    qids: ["Q1667680"],
    buildings: ["Q2200376", "Q42153772"],
    nl: "Structuralisme",
    en: "Structuralism",
    period: "1960–1985",
    startYear: 1960,
    era: "postwar",
    architects: ["Aldo van Eyck", "Herman Hertzberger", "Piet Blom"],
    featuresNl: ["kleine eenheden, eindeloos herhaald", "gebouw als dorp: straatjes en pleintjes binnen", "beton en betonsteen, menselijke maat", "uitbreidbaar raster zonder hoofdingang"],
    featuresEn: ["small units endlessly repeated", "the building as a village: internal streets and squares", "concrete and block, human scale", "an extendable grid without a grand entrance"],
    factNl:
      "Het Nederlandse antwoord op de kille systeembouw: bouw een gebouw zoals een dorp groeit. Van Eycks Burgerweeshuis en Hertzbergers Centraal Beheer zijn rasters van kleine, gelijke eenheden waarin mensen hun eigen plek maken; Bloms kubuswoningen de speelse extreme. Wereldwijd bekend als typisch Nederlands.",
    factEn:
      "The Dutch answer to cold system building: make a building the way a village grows. Van Eyck's orphanage and Hertzberger's Centraal Beheer are grids of small equal units where people make their own place; Blom's cube houses the playful extreme. Known worldwide as typically Dutch.",
  },
  {
    key: "postmodernisme",
    qids: ["Q595448"],
    buildings: ["Q1542668"],
    nl: "Postmodernisme",
    en: "Postmodernism",
    period: "1975–1995",
    startYear: 1975,
    era: "postwar",
    architects: ["Alessandro Mendini (Groningen)", "Rob Krier (Den Haag)"],
    featuresNl: ["citaat en knipoog: zuiltje, boogje, felle kleur", "collage van vormen en materialen", "de straatwand en het ornament terug", "kantoren en musea met een grap"],
    featuresEn: ["quotation and wink: a column, an arch, a loud colour", "a collage of shapes and materials", "the street wall and ornament return", "offices and museums with a joke"],
    factNl:
      "De opstand tegen de ernst van het modernisme: ornament, kleur en historische citaten mochten weer, het liefst met ironie. Nederland bleef er nuchter onder — het Groninger Museum van Mendini is de kleurrijke uitzondering, Haagse stadsvernieuwing de bravere regel.",
    factEn:
      "The revolt against modernist earnestness: ornament, colour and historical quotation allowed again, preferably with irony. The Netherlands stayed sober about it — Mendini's Groninger Museum is the colourful exception, The Hague's urban renewal the better-behaved rule.",
  },
  {
    key: "superdutch",
    qids: [],
    buildings: ["Q3327230", "Q41061028", "Q1538389", "Q2741526", "Q1348188", "Q21836423"],
    nl: "Superdutch",
    en: "Superdutch",
    period: "1990–nu",
    startYear: 1990,
    era: "postwar",
    architects: ["Rem Koolhaas (OMA)", "MVRDV", "Ben van Berkel (UNStudio)"],
    featuresNl: ["één groot concept per gebouw", "gestapelde of gekantelde volumes", "diagram wordt letterlijk gebouw", "iconen: Markthal, Depot, EYE"],
    featuresEn: ["one big concept per building", "stacked or tilted volumes", "the diagram literally becomes the building", "icons: Markthal, Depot, EYE"],
    factNl:
      "Het exportsucces van de jaren negentig en later: Nederlandse bureaus (OMA, MVRDV, UNStudio) werden wereldberoemd met gebouwen die één helder concept letterlijk uitvoeren — een woonboog over een markt, een spiegelende kom, gestapelde dozen. Slim, brutaal en fotogeniek.",
    factEn:
      "The Dutch export hit of the nineties and after: offices like OMA, MVRDV and UNStudio became world-famous with buildings that execute one clear concept literally — a housing arch over a market, a mirrored bowl, stacked boxes. Clever, bold and photogenic.",
  },
];
