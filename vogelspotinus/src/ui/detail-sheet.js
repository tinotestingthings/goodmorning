// ---------------------------------------------------------------------------
// The bird detail sheet.
//
// Note the favourite button: it patches its own icon. The old version called
// openDetail(bird) again to "re-render to flip the star", which rebuilt the
// entire sheet -- image, text, listeners -- to change one glyph.
// ---------------------------------------------------------------------------

import { h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { bilingual, primaryName } from "../core/birds.js";
import { groupHint, groupLabel } from "../data/fci-groups.js";
import { FILTER_DEFINITIONS, filterValueLabel } from "../core/filters.js";
import { isFavorite, toggleFavorite } from "../core/favorites.js";
import { stopSound } from "../core/sound.js";
import { openSheet, sheetBody } from "./sheet.js";
import { birdPhoto, soundButton } from "./bird-media.js";
import { nameLine } from "./bird-names.js";

function field(label, ...value) {
  return h(
    "div",
    { class: "field" },
    h("p", { class: "field-label" }, label),
    h("p", { class: "field-value" }, value)
  );
}

function externalLink(href, label) {
  return h("a", { href, target: "_blank", rel: "noopener noreferrer" }, label);
}

export function openBirdDetail(bird) {
  return openSheet({
    label: primaryName(bird),
    className: "sheet-detail",
    onClose: stopSound,
    build(dialog) {
      dialog.append(favoriteButton(bird));
      dialog.append(birdPhoto(bird, { fit: "cover" }));
      dialog.append(
        sheetBody(
          h("h2", {}, primaryName(bird)),
          nameLine(bird, { className: "names" }),
          ...detailFields(bird)
        )
      );
      const fab = soundButton(bird, { variant: "fab" });
      if (fab) {
        dialog.classList.add("sheet-has-sound"); // reserve room under the floating button
        dialog.append(fab);
      }
    },
  });
}

function favoriteButton(bird) {
  const button = h("button", {
    type: "button",
    class: "sheet-fav",
    "aria-pressed": String(isFavorite(bird)),
  });

  const sync = () => {
    const on = isFavorite(bird);
    button.replaceChildren(icon("star", on ? "icon-fill" : null));
    button.setAttribute("aria-pressed", String(on));
    button.setAttribute("aria-label", t(on ? "a11yRemoveFavorite" : "a11yAddFavorite"));
  };

  button.addEventListener("click", () => {
    toggleFavorite(bird);
    sync();
  });
  sync();
  return button;
}

function detailFields(bird) {
  const rows = [];

  // Origin and NL status are two separate facts, so they get two labelled
  // rows. Merging them meant the value repeated its own field label
  // ("HERKOMST" / "Herkomst: Siberië ...").
  const origin = bilingual(bird, "origin");
  if (origin) rows.push(field(t("origin"), origin));

  // De rasgroep zegt waar een hond VOOR is; dat is het interessantste feit dat
  // we over hem hebben, dus hij staat hoog en met zijn typering erbij.
  if (bird.tags?.fciGroup) {
    rows.push(
      field(t("fciGroupLabel"), `${groupLabel(bird.tags.fciGroup)} — ${groupHint(bird.tags.fciGroup)}`)
    );
  }

  // De enige rij die niet achter een waardecheck stond: bij vogels is nlStatus
  // altijd gevuld, dus dat viel nooit op. Een hondenras heeft geen status als
  // Nederlandse broedvogel, en toonde daardoor een rij met een leeg antwoord.
  if (bird.tags?.nlStatus) {
    const nlStatusDef = FILTER_DEFINITIONS.find((d) => d.key === "nlStatus");
    rows.push(field(t("statusInNl"), filterValueLabel(nlStatusDef, bird.tags.nlStatus)));
  }

  const habitat = bilingual(bird, "habitat");
  if (habitat) rows.push(field(t("habitat"), habitat));
  // Bij een vogel is dit de lengte van snavel tot staart; bij een hond meet je
  // de schofthoogte. Zelfde veld, ander woord -- anders klopt het bijschrift bij
  // een corgi van 30 cm gewoon niet.
  if (bird.lengthCm) {
    const label = bird.tags?.kind === "dog" ? t("heightAtWithers") : t("length");
    rows.push(field(label, `${bird.lengthCm} cm`));
  }

  const conservation = bilingual(bird, "conservationStatus");
  if (conservation) rows.push(field(t("conservationStatus"), conservation));

  const fact = bilingual(bird, "fact");
  if (fact) rows.push(field(t("fact"), fact));

  const links = [
    bird.wikipediaUrl && externalLink(bird.wikipediaUrl, t("wikipediaEn")),
    bird.dutchWikipediaUrl && externalLink(bird.dutchWikipediaUrl, t("wikipediaNl")),
    bird.xenoCantoUrl && externalLink(bird.xenoCantoUrl, t("listenXenoCanto")),
  ].filter(Boolean);

  if (links.length) {
    const separated = links.flatMap((link, i) => (i === 0 ? [link] : [" · ", link]));
    rows.push(field(t("moreInfo"), separated));
  }
  return rows;
}
