// Gedeelde UI-bouwstenen.

import { h } from "./core/dom.js";

export function progressRing(value, size = 82) {
  return h("div", {
    class: "progress-ring",
    style: { "--progress": `${value * 3.6}deg`, width: `${size}px`, height: `${size}px` }
  }, h("span", null, `${value}%`));
}

export function brand() {
  return h("div", { class: "brand", "aria-label": "WijnWijs" },
    h("span", { class: "brand-mark" }, h("i"), h("i"), h("i")),
    h("strong", null, "WijnWijs")
  );
}

export function miniIcon(icon, color, extra = "") {
  return h("span", { class: `mini-icon ${color}${extra ? ` ${extra}` : ""}` }, icon);
}

// Begroeting op basis van het tijdstip (de oude app zei altijd "Goedemorgen.").
export function greeting(d = new Date()) {
  const hour = d.getHours();
  if (hour < 6) return "Goedenacht.";
  if (hour < 12) return "Goedemorgen.";
  if (hour < 18) return "Goedemiddag.";
  return "Goedenavond.";
}
