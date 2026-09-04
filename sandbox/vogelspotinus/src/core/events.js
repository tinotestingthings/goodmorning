// ---------------------------------------------------------------------------
// Tiny synchronous event bus.
//
// Exists so core modules never have to call into screens. When favorites or
// the language change, core emits; whoever cares subscribes. This is what
// replaced the old `typeof renderX === "function"` guards, which only existed
// because app.js reached forward into files it should not have known about.
// ---------------------------------------------------------------------------

/** @type {Map<string, Set<Function>>} */
const listeners = new Map();

export const EVENTS = {
  languageChanged: "language-changed",
  themeChanged: "theme-changed",
  favoritesChanged: "favorites-changed",
  gamesChanged: "games-changed",
  courseChanged: "course-changed",
};

/** Subscribe to `name`. Returns an unsubscribe function. */
export function on(name, handler) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(handler);
  return () => listeners.get(name)?.delete(handler);
}

/** Notify every subscriber of `name`. Listener errors never break the emitter. */
export function emit(name, payload) {
  for (const handler of listeners.get(name) ?? []) {
    try {
      handler(payload);
    } catch (err) {
      console.error(`[events] listener for "${name}" threw`, err);
    }
  }
}
