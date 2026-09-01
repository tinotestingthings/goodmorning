# ChordSprint — de phrases kloppen niet. Wat er aan de hand is en wat ik wil doen

Plan, 1 sep 2026. **Nog niets aan gebouwd — dit ligt voor ter goedkeuring.**

## Wat je zag

Bij "4↓" toonde de app het verjaardagsliedje. Jij zei: dat is een reine kwart
omlaag die op de V uitkomt. Klopt. De app dacht dat het een reine **kwint** was.

Dat komt doordat er twee talen door elkaar lopen. In de in-key-oefening betekent
"4↓" *een kwart omlaag* — een afstand. In de phrase-bibliotheek betekent `-4`
*omlaag naar graad 4* — een bestemming. Dat is niet hetzelfde, en de code zet het
ene klakkeloos om in het andere.

## Wat er misgaat

**1. Alle dalende in-key moves pakken de verkeerde phrase.** Precies gespiegeld.
Nagerekend en in de draaiende app bevestigd:

| jij hoort | app pakt de phrase van | je ziet |
|---|---|---|
| 2↓ (halve toon) | septiem omlaag | Watermelon Man |
| 3↓ (kleine terts) | kleine sext omlaag | Love Story Theme |
| **4↓ (kwart)** | **kwint omlaag** | **Lang zal ze leven** ← jouw geval |
| 5↓ (kwint) | kwart omlaag | Eine kleine Nachtmusik |
| 6↓ (kleine sext) | kleine terts omlaag | Hey Jude |
| 7↓ (septiem) | halve toon omlaag | Joy to the World |

Stijgend klopt alles — daar vallen de twee talen toevallig samen.

**2. In mineur klopt de helft niet.** De phrases zijn op de majeurladder
uitgerekend en staan hard in de data. In mineur klinken 6 van de 12
move-targets (en dezelfde 6 akkoord-targets) een ander interval dan de phrase
belooft — en dan speelt ook het verkeerde fragment.

**3. De startgraad telt niet mee.** In-key begin je op elke graad, maar de phrase
gaat er altijd van uit dat je op 1 begint. Een terts omhoog is vanaf 1 groot en
vanaf 2 klein. Over alles gerekend: **32 van de 84 combinaties (38%) klinken
anders dan de phrase belooft.**

**4. De liedjes zelf vielen mee.** Alle 96 gecontroleerd. Eén echte fout:
**"Lang zal ze leven" staat onder de kwint maar is zelf een kwart omlaag.** Bij
jouw geval stapelden dus twee fouten op elkaar. Verder zes cue-teksten die naar
het verkeerde moment in het liedje wijzen (Shave and a Haircut wijst naar de
"two bits"-staart in plaats van de opening; die van Kumbaya *verklapt* het
antwoord) en zeven liedjes die kloppen maar slechte ezelsbruggetjes zijn.

## Wat ik wil doen

Eén verandering, die 1, 2 en 3 tegelijk oplost:

> **Zoek de phrase op bij het interval dat je hóórt, niet bij het label van de
> toonladdergraad.**

De app kent de exacte noten al bij elke vraag. Er komt één functie bij die uit
die twee noten het interval meet, en de drie plekken die nu via de graad zoeken
gaan daar doorheen. Alle drie de fouten zijn namelijk hetzelfde probleem: er
wordt een etiket gelezen waar een klank gemeten had moeten worden.

**Er hoeft geen enkele phrase bij.** Ik heb alle 168 in-key-combinaties en alle
move/akkoord-targets in beide toonaarden doorgerekend: ze vallen allemaal binnen
de 24 interval-phrases die er al zijn. De bibliotheek is compleet, hij werd
alleen verkeerd bevraagd. Bijvangst: de fragmenten uit het Clip lab zijn al op
interval geïndexeerd, dus tekst én geluid gaan in één klap goed.

**Wat je kwijtraakt:** de `move_*` en `chord_*` targets leveren straks alleen nog
hun melodietje achter ▶, niet meer de tekst. Als je daar ooit een liedje bij hebt
gekozen, vervalt die keuze. Op de interval-phrases blijft alles staan. Jij zei
dat je nog niet aan de gekozen liedjes hecht — zeg het als dat toch niet zo is.

## In stappen

1. **De omzetting fixen** — de nieuwe zoekfunctie en de drie aanroepplekken.
   Fouten 1, 2 en 3 weg. Klein, ~25 regels.
2. **Een zelftest** — loopt over alle combinaties en controleert dat de
   opgezochte phrase hetzelfde interval heeft als wat er klinkt. ChordSprint
   heeft nu geen enkele test; dit is precies zo'n fout die stil terugkomt.
3. **De liedjes corrigeren** — "Lang zal ze leven" verhuist naar de kwart, de zes
   cue-teksten herschrijven. De zeven zwakke ezelsbruggetjes alleen als je wilt
   (voorstellen liggen klaar).

**Wat ik bewust niet doe:** geen aparte phrases per startgraad (84 in plaats van
24, terwijl het muzikaal hetzelfde interval is), en geen aparte mineur-bibliotheek
(de toonaard bepaalt alleen wélk interval klinkt, en dat lost stap 1 al op).

---

<details>
<summary>Verantwoording — hoe ik dit heb gecontroleerd</summary>

- De omzettingsfout is zowel narekend als in de draaiende app opgevraagd; de
  tabel hierboven komt uit de app zelf.
- De 38% en de mineur-telling komen uit een doorrekening over alle combinaties
  van startgraad × move × toonaard.
- De 96 liedjeclaims zijn beoordeeld met tegenspraak: elke markering is door twee
  onafhankelijke controleurs nagerekend, één die alleen uit de noten werkt en één
  die de markering juist probeerde te weerleggen. Van de 16 markeringen bleef er
  na die tegenspraak 1 overeind als echte intervalfout.
- Vier targets (grote septiem en octaaf) liepen op een contentfilter stuk; die
  veertien claims heb ik zelf tegen de gangbare interval-referentietabellen
  gelegd. Twee ("Ceora", NL en EN) kreeg ik niet geverifieerd — meteen ook het
  meest obscure liedje in de lijst.
- Technische details: `inKeyMoveToScaleMove()` is de omzetting die de fout maakt;
  `phraseIdForChoice()`, `phraseIdForCurrentAnswer()` en `revealInKeyHint()` zijn
  de drie aanroepplekken; `cpt_phraseOverrides` bewaart jouw eigen keuzes.

</details>
