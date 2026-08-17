// ---------------------------------------------------------------------------
// Bird photos and call playback -- the two pieces of media UI that every
// screen needs, built once here instead of being re-templated per screen.
// ---------------------------------------------------------------------------

import { h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { photoUrl, primaryName } from "../core/birds.js";
import { toggleSound } from "../core/sound.js";
import { openLightbox } from "./lightbox.js";

export const PLACEHOLDER_IMG =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">' +
      '<rect width="100%" height="100%" fill="#dedad0"/>' +
      '<text x="50%" y="50%" font-family="sans-serif" font-size="18" fill="#5c6b5c" ' +
      'text-anchor="middle" dy=".3em">No photo</text></svg>'
  );

/**
 * A framed bird photo.
 *
 * `fit` defaults to "cover": Wikipedia photos arrive in wildly different
 * aspect ratios, and letterboxing every one of them (the old behaviour) made
 * the browse grid a field of grey bars. The uncropped image is one tap away in
 * the lightbox, which is the only place "contain" is right.
 *
 * @param {object} bird
 * @param {object} [options]
 * @param {"cover"|"contain"} [options.fit]
 * @param {boolean} [options.zoomable] attach click/Enter to open the lightbox
 * @param {string}  [options.alt]      pass "" for quiz photos, where the name is the answer
 */
export function birdPhoto(bird, { fit = "cover", zoomable = true, alt } = {}) {
  const src = photoUrl(bird) ?? PLACEHOLDER_IMG;
  const altText = alt ?? primaryName(bird) ?? t("a11yBirdPhoto");

  const img = h("img", { src, alt: altText, loading: "lazy", decoding: "async" });
  const frame = h("div", { class: `photo photo-${fit}` }, img);

  if (zoomable && photoUrl(bird)) {
    frame.classList.add("photo-zoomable");
    frame.tabIndex = 0;
    frame.setAttribute("role", "button");
    frame.setAttribute("aria-label", t("a11yViewPhotoFullscreen"));
    const open = () => openLightbox(photoUrl(bird, { full: true }), altText);
    frame.addEventListener("click", open);
    frame.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        open();
      }
    });
  }
  return frame;
}

/**
 * A play/stop button for a bird's call. Returns null when no recording exists,
 * so callers can drop it straight into a child list.
 *
 * @param {object} bird
 * @param {object} [options]
 * @param {"button"|"fab"} [options.variant]
 */
export function soundButton(bird, { variant = "button" } = {}) {
  if (!bird?.soundUrl) return null;

  const label = h("span", {}, t("playCall"));
  const button = h(
    "button",
    {
      type: "button",
      class: variant === "fab" ? "sound-fab" : "secondary sound-button",
      "aria-label": t("playCall"),
    },
    icon("speaker"),
    variant === "fab" ? null : label
  );

  const setState = (playing) => {
    button.classList.toggle("playing", playing);
    const text = playing ? t("stopSound") : t("playCall");
    button.setAttribute("aria-label", text);
    button.replaceChildren(icon(playing ? "stop" : "speaker"));
    if (variant !== "fab") button.append(h("span", {}, text));
  };

  button.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleSound(bird, setState);
  });
  return button;
}
