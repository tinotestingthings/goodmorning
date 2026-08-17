// ---------------------------------------------------------------------------
// Screen registry and navigation.
//
// Each screen registers { mount, render }. mount() runs exactly once, the
// first time the screen is shown, and is where listeners are attached;
// render() runs on every entry and on every refresh. That contract replaced
// five hand-rolled `xInitialized` flags and the `typeof renderX === "function"`
// guards -- the core no longer knows which screens exist until they say so.
// ---------------------------------------------------------------------------

import { stopSound } from "./sound.js";

/** @type {Map<string, {mount?: Function, render?: Function, mounted: boolean}>} */
const screens = new Map();

let currentId = null;
/** Set when a saved custom game is launched: { filters, gameMode }. */
let context = null;

export function registerScreen(id, { mount, render } = {}) {
  screens.set(id, { mount, render, mounted: false });
}

export function currentScreenId() {
  return currentId;
}

/** The custom game a screen was entered for, or null for free navigation. */
export function gameContext() {
  return context;
}

export function showScreen(id, ctx = null) {
  if (!screens.has(id)) throw new Error(`[nav] unknown screen "${id}"`);
  stopSound();
  currentId = id;
  context = ctx;

  for (const section of document.querySelectorAll(".screen")) {
    section.hidden = section.id !== `screen-${id}`;
  }
  for (const btn of document.querySelectorAll(".nav-btn")) {
    const active = btn.dataset.screen === id;
    btn.classList.toggle("active", active);
    if (active) btn.setAttribute("aria-current", "page");
    else btn.removeAttribute("aria-current");
  }

  const screen = screens.get(id);
  if (!screen.mounted) {
    screen.mount?.();
    screen.mounted = true;
  }
  screen.render?.();
  document.querySelector(`#screen-${id} h1`)?.focus?.();
  window.scrollTo({ top: 0 });
}

/** Re-render whatever is on screen -- used after a language or data change. */
export function refreshScreen() {
  if (!currentId) return;
  screens.get(currentId)?.render?.();
}

/** Wire the bottom navigation. Called once at boot. */
export function initNav() {
  for (const btn of document.querySelectorAll(".nav-btn")) {
    btn.addEventListener("click", () => showScreen(btn.dataset.screen));
  }
}
