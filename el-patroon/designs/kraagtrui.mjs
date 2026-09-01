// Eigen design: Huey zonder capuchon, met een staande kraag.
//
// Dit is route 1 uit docs/eigen-designs.md -- een bestaand FreeSewing-design
// met één ding anders. Alle geometrie komt van Huey. Het enige eigen deel is
// een rechte kraagstrook, en de lengte daarvan meet Huey zelf al op: hun
// capuchon rekent met exact dezelfde twee opgeslagen waarden.
//
// Gewoon een FreeSewing-design: dit bestand draait ongewijzigd onder Node, in
// de browser (via de import map in index.html) en in `npx @freesewing/studio`.
import { Design } from '@freesewing/core';
import { back, front as hueyFront, sleeve, pocket, waistband, cuff } from '@freesewing/huey';

// Metadata voor de app-catalogus; `npm run assets` schrijft die naar eigen.json.
export const meta = {
  naam: 'Kraagtrui',
  omschrijving: 'Huey zonder capuchon, met een staande kraag. Eigen design op basis van Huey.',
  tags: ['tops'],
  technieken: ['hem', 'stretch'],
};

// Huey's voorpand meldt hoe lang je rits moet zijn en rekent daarvoor met de
// capuchon (`measurements.head * options.hoodClosure`). Allebei bestaan hier
// niet meer, dus die som wordt NaN. Eén regel erbij: de lengte van de
// voorrand vastleggen, zodat de kraag de melding kan overschrijven.
export const front = {
  name: 'kraagtrui.front',
  from: hueyFront,
  hide: { from: true },
  options: {
    // Hun voorpand leest deze optie van de capuchon. Een kaal getal is in
    // FreeSewing een constante (zoals Brian's collarFactor): de som blijft
    // rekenen, de gebruiker krijgt er geen knop bij.
    hoodClosure: 0,
  },
  draft: ({ store, points, part }) => {
    store.set('cfLengte', points.cfNeck.dist(points.cfHem));
    // De cutlist hangt aan het deel dat je knipt, en dat is nu dit deel.
    store.cutlist.setCut({ cut: 2, from: 'fabric' });

    return part;
  },
};

export const collar = {
  name: 'kraagtrui.collar',
  after: [front, back],
  options: {
    // Hoogte van de kraag zoals hij straks staat; de strook wordt dubbel zo
    // breed geknipt en dubbelgevouwen, net als Huey's boord en manchet.
    collarHeight: { mm: 60, min: 25, max: 120, menu: 'style' },
    // Boord knip je korter dan de halsopening, anders staat de kraag af.
    collarStretch: { pct: 8, min: 0, max: 20, menu: 'fit' },
  },
  draft: ({ store, points, paths, Point, Path, options, sa, macro, units, part }) => {
    // Voor- en achterpand zijn halve delen (front 2x, back op de vouw), dus de
    // hele halsopening is twee keer wat Huey opslaat.
    const halsopening = 2 * (store.get('frontNeckSeamLength') + store.get('backNeckSeamLength'));
    const lengte = halsopening * (1 - options.collarStretch);
    const breedte = options.collarHeight * 2;

    points.topLeft = new Point(0, 0);
    points.topRight = new Point(lengte, 0);
    points.bottomRight = new Point(lengte, breedte);
    points.bottomLeft = new Point(0, breedte);

    paths.seam = new Path()
      .move(points.topLeft)
      .line(points.topRight)
      .line(points.bottomRight)
      .line(points.bottomLeft)
      .line(points.topLeft)
      .close()
      .addClass('fabric');

    if (sa) paths.sa = paths.seam.offset(sa).addClass('fabric sa');

    store.cutlist.setCut({ cut: 1, from: 'fabric' });

    // Zelfde melding als Huey, nu met de kraag in plaats van de capuchon.
    // Vlaggen liggen op hun titel in de store, dus dit vervangt de oude.
    store.flag.note({
      msg: 'huey:zipperLength',
      replace: {
        length: units(
          options.collarHeight +
            store.get('cfLengte') +
            (options.ribbing ? store.get('ribbingHeight') : 0)
        ),
      },
    });

    points.title = new Point(lengte / 4, breedte / 2);
    macro('title', { at: points.title, nr: 5, title: 'collar' });
    macro('hd', {
      id: 'wFull',
      from: points.topLeft,
      to: points.topRight,
      y: points.topLeft.y - sa - 15,
    });
    macro('vd', {
      id: 'hFull',
      from: points.bottomRight,
      to: points.topRight,
      x: points.topRight.x + sa + 15,
    });

    return part;
  },
};

export const Kraagtrui = new Design({
  data: { id: 'kraagtrui', name: 'Kraagtrui', version: '1.0.0' },
  parts: [back, front, sleeve, pocket, waistband, cuff, collar],
});

export default Kraagtrui;
