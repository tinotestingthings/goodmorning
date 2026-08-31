# Kangaroo — fysio-audit van de spiergroepen en de kleurcode

Plan (31 aug 2026). **Status: fase 1 en 2 gebouwd op 31 aug 2026** (twee
herstelprofielen + rustsignaal bij hamstrings); fase 3 (onderarm/grijp) en 4
(voet) bewust open — zeg het als je ze wilt. Drie vragen van
Tinus: (1) is er wetenschappelijk bewijs dat je bepaalde spieren veel vaker moet
doen dan andere, (2) is een kleurcode *per spiergroep* een goed idee, (3) mist er
een spiergroep die onmisbaar is. Hieronder per vraag het antwoord, wat het bewijs
wél en niet draagt, en pas daarna een plan.

Wat de app doet: veertien spiergroepen (sinds 31 aug incl. Heup) en een kleur
per groep op basis van hoe lang geleden je hem trainde. De datum komt van een
afgevinkte oefening of van "Mark trained".

---

## 1. Moet je sommige spieren veel vaker trainen dan andere?

**Nee — niet om te groeien of sterker te worden.** De norm is voor élke grote
spiergroep hetzelfde: minimaal 2× per week ([WHO 2020][who], sterke aanbeveling,
matige zekerheid). En binnen die norm blijkt frequentie zelf nauwelijks iets toe
te voegen: in de meta-analyse van [Schoenfeld e.a. (25 studies)][freq] verdwijnt
het verschil tussen 1×, 2× en 3+× per week zodra het *totale weekvolume* gelijk
is. Frequentie is dus een verdeelinstrument, geen aparte prikkel.

**Wat wél per spiergroep verschilt is het herstel** — en dat zet een *ondergrens*
(hoe kort mag de pauze zijn), niet een bovengrens. Twee dingen sturen dat:

- **Vezeltype.** Langzame, uithoudingsgerichte spieren raken minder vermoeid en
  zijn sneller weer inzetbaar; de soleus (diepe kuitspier) is bijna volledig
  langzaam-vezelig. Snelle-vezelspieren als de hamstrings zijn dat niet.
- **Excentrische schade.** Na sportspecifiek hamstringwerk is 72 uur nog niet
  genoeg om structuur én functie te herstellen (["Hamstrings on focus: are 72 hours sufficient…", 2024][ham]);
  quadriceps zijn na eenzelfde belasting doorgaans binnen 24–48 uur terug
  ([herstelstudie quadriceps, 2023][quad]).

Conclusie voor de app: geen enkele spiergroep hoort structureel véél vaker. Wel
kunnen sommige groepen kortere pauzes hebben (en dus makkelijk 3×/week halen),
terwijl andere na een zware sessie echt 48–72 uur nodig hebben.

## 2. Kleurcode per spiergroep?

**Deels, en veel grover dan je zou denken.** De huidige drempels zijn eigenlijk
al goed geijkt: 2×/week betekent gemiddeld 3,5 dag tussenruimte, dus "5+ dagen =
rood" is precies het punt waarop je de WHO-norm niet meer haalt. Die drempel
verschillend maken voor veertien groepen is schijnprecisie — het bewijs is
daar niet fijnmazig genoeg voor.

Wat het bewijs wél draagt is **twee herstelprofielen**, plus één extra signaal:

| Profiel | Groepen | Kleur | Waarom |
|---|---|---|---|
| **kort** | Core, Kuiten, Schenen, Heup, Knieën | groen 0–1, oranje 2–3, rood 4+ | Langzaam-vezelig of pees-/houdingswerk: weinig schade, verdraagt om-de-dag, en de winst zit juist in regelmaat |
| **normaal** | Schouders, Borst, Biceps, Triceps, Boven-/Onderrug, Bilspieren, Quadriceps, Hamstrings | groen 0–2, oranje 3–4, rood 5+ (ongewijzigd) | Geijkt op de 2×/week-norm |

Plus een **"te vroeg"-signaal** (geen kleur, een zinnetje) bij Hamstrings —
de enige groep waarvoor het bewijs voor een echte minimumrust concreet genoeg is.
Let op de korrel: de opgeslagen datum heeft geen bruikbare kloktijd (handmatig
markeren zet 12:00), dus dit rekent in kalenderdagen. "Vandaag of gisteren" is
het beste wat de data toelaat; echte 48-uursprecisie zou een kloktijd in
`kangaroo-history` vragen en dat is de moeite niet waard.

Let op: Knieën en Schenen zijn strikt genomen geen spiergroepen maar regio's.
De belasting daar is vooral pees (patellapees, tibialis anterior), en pezen
reageren goed op regelmatige matige belasting — dat is het argument om ze in het
korte profiel te zetten, niet in het normale.

## 3. Ontbreekt er een onmisbare spiergroep?

Van de vier kandidaten haalt er één de lat.

**Onderarm / grijpkracht — ja, toevoegen.** Grijpkracht is een van de sterkste
losse voorspellers van sterfte en hart- en vaatziekten die er zijn: in de
[PURE-studie][pure] (bijna 140.000 deelnemers, 17 landen) voorspelde hij
sterfte beter dán systolische bloeddruk, en een [meta-analyse van 42 studies][grip]
komt op HR 1,41 (alle oorzaken) en 1,63 (hart- en vaatziekten) voor de laagste
versus hoogste groep. **Eerlijk erbij**: dat is een *marker*, geen bewezen
causaal doel — harder knijpen laat je niet aantoonbaar langer leven. Maar de app
traint nu nergens gericht grijp- of hangbelasting, terwijl het meten ervan
gratis is en de oefeningen (dead hang, farmer's carry) niets kosten.

**Nek — nee, nog niet.** Het bewijs komt vooral uit contactsport (hoofd- en
nekletsel) en uit revalidatie bij nekklachten. Zonder klachten of contactsport
is er geen reden om er een vaste vijftiende tegel voor te maken.

**Voet (intrinsieke voetspieren) — optioneel, als sub van Schenen.** Past bij een
programma dat duidelijk om kuit, scheen en knie draait, maar het bewijs is
matig; niet als aparte tegel.

**Adductoren (binnenkant bovenbeen) — al opgelost.** Die zaten nergens in en
vallen sinds 31 aug onder de nieuwe groep Heup, samen met de heupbuigers en de
abductoren. Dat was de echte gap: zwakke heupabductoren hangen samen met naar
binnen vallende knieën bij eenbenige taken ([systematic review 2021][hip]) — en juist
eenbenige taken zijn waar Knieën als aparte regio in de app over gaat.

---

## Plan (nog niet uitgevoerd)

Alles zit in `kangaroo-src/workout-app.tsx`; bouwen met `bash kangaroo-src/build.sh`.

1. ~~**Herstelprofielen.**~~ **Gedaan 31 aug.** `shortRecovery` + `profileFor()`,
   en `getRecoveryStatus(value, profile)` kreeg het profiel als tweede argument;
   `recoveryLabels` werd `recoveryLabel(status, profile)` zodat de badge de juiste
   dagen noemt. Raakt `recoveryClass` en `AnatomyCanvas.statusFor`; Cardio houdt
   het normale profiel. De legenda boven de body map toont de normale band plus
   één regel voor de korte groepen — de body map kleurt namelijk álle groepen
   tegelijk, dus alleen de geselecteerde band tonen zou misleiden.
2. ~~**"Te vroeg" bij hamstrings.**~~ **Gedaan 31 aug.** `minRestDays` +
   `restWarning()`, één amberkleurig zinnetje in het spiergroep-paneel. Geen
   kleurstatus, geen blokkade.
3. **Onderarm / grijp als vijftiende groep.** Type + lijst + maskers (voorkant:
   onderarm links/rechts; achterkant idem) + een `formChecks`-regel. Zelfde
   patroon als Heup op 31 aug. *Klein, maar de maskers kosten het meeste werk.*
4. **Voet.** Alleen als Tinus het wil; anders laten.

Migratie is triviaal: `migrateHistory` gooit onbekende sleutels weg en nieuwe
groepen beginnen op "Not trained yet". Geen datamigratie nodig.

## Geparkeerd: AI-vormcontrole met beeld

Het oorspronkelijke idee — de telefooncamera laten meekijken en per oefening
zeggen of de houding klopt (tegen de muur bij een squat, waar je het hoort te
voelen) — is bewust *niet* gebouwd. De tekstversie staat sinds 31 aug achter de
(?)-knopjes in de coach-kaart en in het spiergroep-paneel, en die dekt de vraag
"doe ik het goed?" voor 90% zonder camera, zonder model en zonder dat er beeld
van Tinus ergens heen gaat. Als het ooit wél moet: een poserings-model dat
lokaal in de browser draait (geen upload) is de enige variant die bij deze repo
past.

---

## Bronnen

- [WHO 2020 guidelines on physical activity and sedentary behaviour][who] — ≥2 dagen per week spierversterkend, alle grote spiergroepen
- [Schoenfeld, Grgic & Krieger (2019), *J Sports Sci*][freq] — frequentie doet er niet toe bij gelijk volume (25 studies)
- ["Hamstrings on focus: are 72 hours sufficient for recovery after a football match?" (2024)][ham] — nee
- ["Different time course recovery of muscle edema within the quadriceps femoris…" (2023)][quad] — quadriceps: 24–48 uur
- [Leong e.a. (2015), *The Lancet* — PURE][pure] — grijpkracht voorspelt sterfte beter dan systolische bloeddruk
- ["Association of Grip Strength With Risk of All-Cause Mortality, Cardiovascular Diseases, and Cancer" (2017)][grip] — meta-analyse, 42 cohorten, HR 1,41 / 1,63
- ["Is Hip Muscle Strength Associated with Dynamic Knee Valgus in a Healthy Adult Population?" (2021)][hip] — alleen bij eenbenige taken

[who]: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7719906/
[freq]: https://pubmed.ncbi.nlm.nih.gov/30558493/
[ham]: https://pubmed.ncbi.nlm.nih.gov/39087576/
[quad]: https://www.ncbi.nlm.nih.gov/pmc/articles/PMC10286608/
[pure]: https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(14)62000-6/abstract
[grip]: https://pubmed.ncbi.nlm.nih.gov/28549705/
[hip]: https://pmc.ncbi.nlm.nih.gov/articles/PMC8304771/
