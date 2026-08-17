// ---------------------------------------------------------------------------
// One modal implementation, used by the bird detail sheet and both options
// sheets. Previously each of the three was a separate hand-wired overlay in
// index.html with its own open/close functions, none of which were reachable
// by keyboard or announced as a dialog.
//
// Provides: role="dialog" + aria-modal, focus moved in and restored on close,
// a Tab focus trap, Escape to close, click-outside to close, body scroll lock.
// ---------------------------------------------------------------------------

import { h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

let openCount = 0;

/**
 * @param {object}   options
 * @param {string}   options.label      accessible name for the dialog
 * @param {Function} options.build      build(dialogEl, { close }) fills the dialog
 * @param {string}  [options.className] extra class on the dialog element
 * @param {Function}[options.onClose]
 * @returns {{ close: () => void, dialog: HTMLElement }}
 */
export function openSheet({ label, build, className, onClose }) {
  const previouslyFocused = document.activeElement;

  const dialog = h("div", {
    class: className ? `sheet ${className}` : "sheet",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": label,
  });

  const overlay = h(
    "div",
    {
      class: "overlay",
      onclick: (e) => {
        if (e.target === overlay) close();
      },
    },
    dialog
  );

  const closeButton = h(
    "button",
    { class: "sheet-close", type: "button", "aria-label": t("close"), onclick: () => close() },
    icon("close")
  );
  dialog.append(closeButton);

  function onKeydown(e) {
    if (e.key === "Escape") {
      e.stopPropagation();
      close();
      return;
    }
    if (e.key !== "Tab") return;
    const focusable = [...dialog.querySelectorAll(FOCUSABLE)].filter(
      (el) => el.offsetParent !== null
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  let closed = false;
  function close() {
    if (closed) return;
    closed = true;
    document.removeEventListener("keydown", onKeydown, true);
    overlay.remove();
    openCount -= 1;
    if (openCount === 0) document.body.classList.remove("scroll-locked");
    previouslyFocused?.focus?.();
    onClose?.();
  }

  build(dialog, { close });

  document.body.append(overlay);
  openCount += 1;
  document.body.classList.add("scroll-locked");
  document.addEventListener("keydown", onKeydown, true);
  (dialog.querySelector(FOCUSABLE) ?? dialog).focus?.();

  return { close, dialog };
}

/** The usual padded content region inside a sheet. */
export function sheetBody(...children) {
  return h("div", { class: "sheet-body" }, children);
}
