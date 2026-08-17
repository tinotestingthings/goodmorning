// ---------------------------------------------------------------------------
// The one rendering convention.
//
// Rule for the whole codebase: the static app frame lives in index.html; every
// piece of dynamic content is built with h(). There is no innerHTML anywhere
// outside this file, which is why the app no longer needs an escapeHtml()
// helper -- text goes in as textContent and cannot be interpreted as markup.
// ---------------------------------------------------------------------------

const SVG_NS = "http://www.w3.org/2000/svg";

/**
 * Create an element.
 *
 *   h("p", { class: "count-line" }, "12 birds")
 *   h("button", { class: "chip", onclick: fn, "aria-pressed": true }, label)
 *   h("div", {}, [nodeA, nodeB], maybeNullNode)
 *
 * Props: `class`, `dataset` and `style` take objects/strings; `on...` keys
 * become listeners; anything else is set as a DOM property when one exists,
 * and as an attribute otherwise (so aria attributes, role and href all work).
 * null/undefined/false props and children are skipped, so `cond && node` is
 * safe to write inline.
 */
export function h(tag, props = {}, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value == null || value === false) continue;
    if (key === "class") el.className = value;
    else if (key === "dataset") Object.assign(el.dataset, value);
    else if (key === "style") Object.assign(el.style, value);
    else if (key.startsWith("on") && typeof value === "function") {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key in el && key !== "list" && key !== "form") {
      el[key] = value;
    } else {
      el.setAttribute(key, value === true ? "" : value);
    }
  }
  append(el, children);
  return el;
}

/** Append strings/nodes/arrays, skipping null/undefined/false. */
export function append(parent, children) {
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    parent.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return parent;
}

/**
 * Reference into the shared <symbol> sprite in index.html -- the single icon
 * system, inheriting currentColor so it matches whatever it sits in.
 */
export function icon(name, cls) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("class", cls ? `icon ${cls}` : "icon");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS(SVG_NS, "use");
  use.setAttribute("href", `#icon-${name}`);
  svg.append(use);
  return svg;
}

/** Replace an element's children in one shot (reuses existing nodes if passed back). */
export function fill(parent, ...children) {
  parent.replaceChildren();
  return append(parent, children);
}

/** document.getElementById with a loud failure instead of a silent null. */
export function byId(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`[dom] no element with id "${id}"`);
  return el;
}

/** Trailing-edge debounce -- used to keep the browse grid off the keystroke path. */
export function debounce(fn, ms = 120) {
  let timer = null;
  const debounced = (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

/** Fisher-Yates. Mutates and returns `arr`. */
export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
