// WijnWijs app-shell: navigatie (desktop-rail + mobiele tabbalk), router en
// toast. Elke actie rendert het actieve scherm opnieuw — geen framework, de
// schermen bouwen hun DOM met h() uit core/dom.js.

import { h, clear } from "./core/dom.js";
import { getState } from "./core/state.js";
import { readiness } from "./core/stats.js";
import { brand } from "./ui.js";
import { renderToday } from "./screens/today.js";
import { renderLearn } from "./screens/learn.js";
import { renderPractice } from "./screens/practice.js";
import { renderWinebook } from "./screens/winebook.js";
import { renderProfile } from "./screens/profile.js";

const PAGES = [
  { id: "today", label: "Vandaag", glyph: "⌂", render: renderToday },
  { id: "learn", label: "Leren", glyph: "◇", render: renderLearn },
  { id: "practice", label: "Oefenen", glyph: "✓", render: renderPractice },
  { id: "winebook", label: "Wijnboek", glyph: "◉", render: renderWinebook },
  { id: "profile", label: "Profiel", glyph: "●", render: renderProfile }
];

let currentPage = "today";
let toastMsg = "";
let toastTimer = null;

const root = document.getElementById("root");

const ctx = {
  go(page) {
    currentPage = page;
    window.scrollTo({ top: 0 });
    render();
  },
  rerender(opts) {
    render(opts);
  },
  toast(msg) {
    toastMsg = msg;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toastMsg = ""; render(); }, 2600);
    render();
  }
};

function navButtons(mobile) {
  return PAGES.map((p) => h("button", {
    class: currentPage === p.id ? "active" : "",
    onClick: () => ctx.go(p.id)
  },
    h("span", null, p.glyph),
    mobile ? h("small", null, p.label) : p.label
  ));
}

function render(opts) {
  const state = getState();
  clear(root);

  const main = h("main", { class: "main-content" },
    h("header", { class: "mobile-header" },
      brand(),
      h("button", {
        class: "xp-pill",
        onClick: () => ctx.go("profile"),
        "aria-label": `${state.xp} ervaringspunten`
      }, h("span", null, "✦"), `${state.xp} XP`)
    )
  );
  PAGES.find((p) => p.id === currentPage).render(main, ctx);

  root.appendChild(h("div", { class: "app-shell" },
    h("aside", { class: "desktop-rail" },
      brand(),
      h("nav", { "aria-label": "Hoofdnavigatie" }, navButtons(false)),
      h("div", { class: "rail-level" },
        h("span", null, "Actief leerpad"),
        h("strong", null, state.activeLevel),
        h("small", null, `${readiness(state)}% examen­gereed`)
      )
    ),
    main,
    h("nav", { class: "bottom-nav", "aria-label": "Mobiele navigatie" }, navButtons(true)),
    toastMsg && h("div", { class: "toast", role: "status" }, toastMsg)
  ));

  // Focus terugzetten na een rerender (bijv. de zoekbalk op Leren).
  if (opts && opts.focus) {
    const el = root.querySelector(opts.focus);
    if (el) {
      const v = el.value;
      el.focus();
      el.setSelectionRange(v.length, v.length);
    }
  }
}

render();
