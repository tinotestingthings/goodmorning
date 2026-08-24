// ---------------------------------------------------------------------------
// De tien rasgroepen van de Fédération Cynologique Internationale.
//
// Dit is inhoud, geen infrastructuur -- vandaar data/ en niet core/, net als
// course-griftpark.js. De indeling is niet willekeurig: de FCI groepeert op
// WAAR EEN RAS VOOR GEFOKT IS, en dat is precies wat de groep leerbaar maakt.
// Een hond die schapen drijft is anders gebouwd dan een hond die dassen uit
// een pijp haalt, en dat zie je terug in oren, vacht, bouw en formaat.
//
// De `n` (groepsnummer) komt uit de data: tools/build-dogs.mjs leest hem van
// nl.wikipedia en schrijft hem als `tags.fciGroup`. De teksten hieronder zijn
// een samenvatting van de FCI-nomenclatuur in eigen woorden; ze zijn bedoeld
// om te leren waar een groep voor staat, niet als officieel citaat.
//
// Groep 4 telt in deze dataset precies één ras. Dat is geen fout: groep 4 IS
// de teckel, in al zijn maten en haarsoorten.
// ---------------------------------------------------------------------------

import { currentLanguage, t } from "../core/i18n.js";

export const FCI_GROUPS = [
  {
    n: 1,
    nl: "Herders en veedrijvers",
    en: "Sheepdogs and cattledogs",
    hintNl: "Drijven vee bij elkaar",
    hintEn: "Move and gather livestock",
    aboutNl:
      "Gefokt om kudden bij elkaar te houden en te verplaatsen. Werken op afstand van de baas en moeten zelf blijven nadenken, dus het zijn de sterkste denkers van het stel. Middelgroot, wendbaar, en meestal met een vacht die weer en wind aankan.",
    aboutEn:
      "Bred to gather and move livestock. They work at a distance from the handler and have to keep thinking for themselves, which makes them the sharpest workers of the lot. Medium-sized, agile, usually with a weatherproof coat.",
  },
  {
    n: 2,
    nl: "Pinschers, schnauzers, molossers en sennenhonden",
    en: "Pinschers, schnauzers, molossoids and mountain dogs",
    hintNl: "Bewaken erf, vee en huis",
    hintEn: "Guard the yard, the herd and the house",
    aboutNl:
      "De bewakers. Van stevige boerderijhonden tot zware molossers die vee tegen wolven verdedigden. Zwaar gebouwd, brede kop, vaak imposant van formaat — bewaken werkt door aanwezigheid, niet door snelheid.",
    aboutEn:
      "The guardians. From solid farm dogs to heavy molossoids that defended livestock against wolves. Heavily built, broad-headed, often imposing — guarding works through presence, not speed.",
  },
  {
    n: 3,
    nl: "Terriërs",
    en: "Terriers",
    hintNl: "Jagen op ongedierte, ook ondergronds",
    hintEn: "Hunt vermin, underground too",
    aboutNl:
      "Genoemd naar het Latijnse terra, aarde: gefokt om ratten, vossen en dassen ondergronds op te zoeken. Klein tot middelgroot, compact, en met een karakter dat bij het werk hoort — je gaat een dassenburcht niet in als je twijfelt. Vaak ruwharig.",
    aboutEn:
      "Named for the Latin terra, earth: bred to go after rats, foxes and badgers underground. Small to medium, compact, with the temperament the job demands — you do not enter a badger sett if you hesitate. Often wire-haired.",
  },
  {
    n: 4,
    nl: "Teckels",
    en: "Dachshunds",
    hintNl: "Eén ras, in negen varianten",
    hintEn: "One breed, in nine varieties",
    aboutNl:
      "De kleinste groep: hij bestaat uit één ras. De teckel doet hetzelfde werk als een terriër — de pijp in achter das en vos — maar is een lopende hond met een eigen bouw: lange rug, korte poten. Komt in drie maten en drie haarsoorten.",
    aboutEn:
      "The smallest group: it contains a single breed. The dachshund does the same job as a terrier — down the burrow after badger and fox — but is a hound with its own build: long back, short legs. Comes in three sizes and three coats.",
  },
  {
    n: 5,
    nl: "Spitsen en oertypen",
    en: "Spitz and primitive types",
    hintNl: "Staan het dichtst bij de wolf",
    hintEn: "Closest to the wolf",
    aboutNl:
      "De oudste vormen: puntige rechtopstaande oren, krulstaart, dikke dubbele vacht. Sledehonden uit het noorden, jachthonden uit Japan, en oertypen die nooit voor één taak zijn doorgefokt. Zelfstandig van karakter.",
    aboutEn:
      "The oldest shapes: pricked ears, curled tail, thick double coat. Sled dogs from the north, hunting dogs from Japan, and primitive types never bred toward a single task. Independent by nature.",
  },
  {
    n: 6,
    nl: "Lopende honden en zweethonden",
    en: "Scenthounds and related breeds",
    hintNl: "Volgen een spoor met de neus",
    hintEn: "Follow a trail by scent",
    aboutNl:
      "De neuzen. Gefokt om urenlang een geurspoor te volgen en de jager met hun stem te melden waar ze zijn. Hangoren die geur naar de neus waaieren, en een uithoudingsvermogen dat het van snelheid wint. De grootste groep.",
    aboutEn:
      "The noses. Bred to follow a scent trail for hours and to tell the hunter where they are by voice. Drop ears that waft scent toward the nose, and stamina that beats speed. The largest group.",
  },
  {
    n: 7,
    nl: "Staande honden",
    en: "Pointing dogs",
    hintNl: "Verstijven als ze wild ruiken",
    hintEn: "Freeze when they scent game",
    aboutNl:
      "Blijven roerloos staan zodra ze wild ruiken en wijzen zo waar het zit — vandaar de naam. Werken vóór het schot, in open veld, en zijn daarop gebouwd: atletisch, langbenig, met een fijne neus.",
    aboutEn:
      "They freeze the moment they scent game, pointing out where it sits — hence the name. They work before the shot, in open country, and are built for it: athletic, long-legged, with a fine nose.",
  },
  {
    n: 8,
    nl: "Retrievers, spaniëls en waterhonden",
    en: "Retrievers, flushing dogs and water dogs",
    hintNl: "Halen geschoten wild op, ook uit water",
    hintEn: "Retrieve shot game, water included",
    aboutNl:
      "Werken ná het schot: opzoeken, oppakken, brengen. Een zachte bek is een fokdoel — het wild mag niet beschadigd raken. Vaak waterdicht behaard, met zwemvliezen tussen de tenen. Meegaand van karakter, want ze werken dicht bij de baas.",
    aboutEn:
      "They work after the shot: find it, pick it up, bring it back. A soft mouth is a breeding goal — the game must not be damaged. Often water-resistant coats with webbed toes. Biddable, because they work close to the handler.",
  },
  {
    n: 9,
    nl: "Gezelschapshonden",
    en: "Companion and toy dogs",
    hintNl: "Gefokt voor het gezelschap zelf",
    hintEn: "Bred for company itself",
    aboutNl:
      "De enige groep zonder werktaak: gezelschap ís de taak. Meestal klein, want ze moesten op schoot passen. Veel van deze rassen komen uit hoven — Chinese, Japanse en Europese — waar ze eeuwenlang alleen op uiterlijk en gezelligheid zijn gefokt.",
    aboutEn:
      "The one group without a job: company is the job. Usually small, because they had to fit on a lap. Many come from royal courts — Chinese, Japanese and European — where they were bred for looks and companionship alone.",
  },
  {
    n: 10,
    nl: "Windhonden",
    en: "Sighthounds",
    hintNl: "Jagen op zicht, en op snelheid",
    hintEn: "Hunt by sight, and by speed",
    aboutNl:
      "Jagen met hun ogen in plaats van hun neus, en halen het wild in met pure snelheid. Diepe borst voor hart en longen, ingesnoerde buik, lange dunne poten — de bouw is de functie. De kleinste groep na de teckels.",
    aboutEn:
      "They hunt with their eyes rather than their nose and run their quarry down. Deep chest for heart and lungs, tucked-up belly, long thin legs — the build is the function. The smallest group after the dachshunds.",
  },
];

export const groupByNumber = new Map(FCI_GROUPS.map((g) => [g.n, g]));

const inTaal = (group, veld) => group[currentLanguage() === "nl" ? veld.nl : veld.en];

/** De naam van een groep in de taal van de lezer. */
export function groupName(n) {
  const group = groupByNumber.get(n);
  return group ? inTaal(group, { nl: "nl", en: "en" }) : null;
}

/** "Groep 8 · Retrievers, spaniëls en waterhonden", voor de detailkaart. */
export function groupLabel(n) {
  const naam = groupName(n);
  return naam ? `${t("fciGroupShort")} ${n} · ${naam}` : null;
}

/** De korte typering ("Halen geschoten wild op, ook uit water"). */
export function groupHint(n) {
  const group = groupByNumber.get(n);
  return group ? inTaal(group, { nl: "hintNl", en: "hintEn" }) : null;
}

/** De volledige uitleg over waar de groep voor staat. */
export function groupAbout(n) {
  const group = groupByNumber.get(n);
  return group ? inTaal(group, { nl: "aboutNl", en: "aboutEn" }) : null;
}
