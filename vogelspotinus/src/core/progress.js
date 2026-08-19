// ---------------------------------------------------------------------------
// Selector voor de herhaalwachtrij. De overige selectors die hier stonden
// (collectionCounts, knownPool, weakPool) verdwenen met de oude statuskaart:
// de cursusvoortgang komt nu uit course.js en "lastige vogels" worden binnen
// de sessie zelf herkanst (session.js) in plaats van via een aparte pool.
// ---------------------------------------------------------------------------

import { allBirds, hasPhoto } from "./birds.js";
import { boxInfo } from "./leitner.js";

/** Alle gestarte kaarten die nu vervallen zijn -- cursus of niet: wat je ooit
 *  bent gaan leren, blijft in de herhaalcyclus. */
export function dueBirds() {
  const now = Date.now();
  return allBirds().filter((b) => {
    const info = boxInfo(b);
    return info.started && info.dueAt <= now && hasPhoto(b);
  });
}
