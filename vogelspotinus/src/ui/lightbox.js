// ---------------------------------------------------------------------------
// Fullscreen photo viewer. The one place photos are shown uncropped -- grids
// and cards crop to a consistent shape, and this is the escape hatch.
// ---------------------------------------------------------------------------

import { h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";

export function openLightbox(url, alt = "") {
  if (!url) return;
  const previouslyFocused = document.activeElement;

  const closeButton = h(
    "button",
    {
      class: "lightbox-close",
      type: "button",
      "aria-label": t("a11yCloseFullscreen"),
      onclick: () => close(),
    },
    icon("close")
  );

  const viewer = h(
    "div",
    {
      class: "lightbox",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": alt || t("a11yBirdPhoto"),
      onclick: (e) => {
        if (e.target !== closeButton) close();
      },
    },
    closeButton,
    h("img", { src: url, alt })
  );

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
    }
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeydown, true);
    viewer.remove();
    document.body.classList.remove("scroll-locked");
    previouslyFocused?.focus?.();
  }

  document.body.append(viewer);
  document.body.classList.add("scroll-locked");
  document.addEventListener("keydown", onKeydown, true);
  closeButton.focus();
}
