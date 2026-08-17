// ---------------------------------------------------------------------------
// A single bird card in the browse grid.
//
// Cards are built once per bird and cached by the browse screen, then shown or
// hidden as filters change -- the old code rebuilt all 566 of them on every
// keystroke. Hence setCardFavorite(): the star is patched in place rather than
// by re-rendering the card.
// ---------------------------------------------------------------------------

import { h, icon } from "../core/dom.js";
import { primaryName } from "../core/birds.js";
import { isFavorite } from "../core/favorites.js";
import { birdPhoto } from "./bird-media.js";
import { nameLine } from "./bird-names.js";

export function birdCard(bird, { onOpen }) {
  const badge = h(
    "span",
    { class: "fav-badge", hidden: !isFavorite(bird) },
    icon("star", "icon-fill")
  );

  const card = h(
    "button",
    {
      type: "button",
      class: "card",
      onclick: () => onOpen(bird),
    },
    h("div", { class: "card-media" }, birdPhoto(bird, { zoomable: false, fit: "cover" }), badge),
    h(
      "div",
      { class: "card-body" },
      h("p", { class: "card-name" }, primaryName(bird)),
      nameLine(bird)
    )
  );
  card._favBadge = badge;
  return card;
}

export function setCardFavorite(card, favorite) {
  if (card?._favBadge) card._favBadge.hidden = !favorite;
}
