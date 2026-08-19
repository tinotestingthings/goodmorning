// ---------------------------------------------------------------------------
// De cursusvoortgang als balk + regel, gedeeld door Home en het sessie-einde.
//
// Drie segmenten: beheerst (vol), geleerd (half) en gestart (vaag). Dat derde
// segment bestaat omdat de eerste dagen ALLES nog in box 1-2 zit: zonder
// "onderweg" leek de balk leeg en de tekst statisch ("0 van 100 geleerd"),
// terwijl je net vijf nieuwe vogels had gedaan.
// ---------------------------------------------------------------------------

import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { courseProgress } from "../core/course.js";

/** [trackEl, lineEl] -- de aanroeper bepaalt de wrapper. */
export function courseTrackAndLine() {
  const c = courseProgress();
  const pct = (n) => `${(n / c.total) * 100}%`;
  const inProgress = c.started - c.learned;

  const track = h(
    "div",
    { class: "course-track", "aria-hidden": "true" },
    h("span", { class: "course-fill course-fill-mastered", style: { width: pct(c.mastered) } }),
    h("span", { class: "course-fill", style: { width: pct(c.learned - c.mastered) } }),
    h("span", { class: "course-fill course-fill-started", style: { width: pct(inProgress) } })
  );

  const parts = [`${c.learned} ${t("statOf")} ${c.total} ${t("statLearnedOf")}`];
  if (c.mastered > 0) parts.push(`${c.mastered} ${t("statMastered")}`);
  if (inProgress > 0) parts.push(`${inProgress} ${t("statInProgress")}`);
  const line = h("p", { class: "course-line" }, parts.join(" · "));

  return [track, line];
}
