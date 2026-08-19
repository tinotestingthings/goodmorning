// Kleine DOM-helper: h(tag, props, ...children). Zelfde patroon als
// vogelspotinus/src/core/dom.js — geen framework, gewone elementen.

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, val] of Object.entries(props)) {
      if (val == null || val === false) continue;
      if (key === "class") el.className = val;
      else if (key === "dataset") Object.assign(el.dataset, val);
      else if (key === "style" && typeof val === "object") {
        for (const [prop, v] of Object.entries(val)) {
          if (v == null) continue;
          if (prop.startsWith("--")) el.style.setProperty(prop, v);
          else el.style[prop] = v;
        }
      }
      else if (key.startsWith("on") && typeof val === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key in el && key !== "list" && typeof val !== "string") {
        el[key] = val;
      } else {
        el.setAttribute(key, val === true ? "" : val);
      }
    }
  }
  append(el, children);
  return el;
}

function append(el, child) {
  if (child == null || child === false) return;
  if (Array.isArray(child)) {
    for (const c of child) append(el, c);
  } else if (child instanceof Node) {
    el.appendChild(child);
  } else {
    el.appendChild(document.createTextNode(String(child)));
  }
}

export function clear(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}
