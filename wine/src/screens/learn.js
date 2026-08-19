// Leren: onderwerpengrid met echte voortgang (dekking per topic), zoekfilter,
// niveauswitch en de vergelijkmodus. Geen neplessen meer: een onderwerp openen
// start een oefensessie over precies dat onderwerp.

import { h } from "../core/dom.js";
import { getState, update } from "../core/state.js";
import { topicStats } from "../core/stats.js";
import { levelHasContent } from "../core/srs.js";
import { LEVELS, COMPARISON, topicMeta } from "../data/content.js";
import { startSession } from "./practice.js";

let query = "";
let comparing = false;

export function renderLearn(root, ctx) {
  const state = getState();

  if (comparing) {
    root.appendChild(comparisonView(ctx));
    return;
  }

  const topics = topicStats(state)
    .filter((t) => `${t.topic}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => a.topic.localeCompare(b.topic, "nl"));

  const el = h("section", { class: "page learn-page" },
    h("div", { class: "page-heading" },
      h("p", { class: "eyebrow" }, "Ontdek & begrijp"),
      h("h1", null, "Leren"),
      h("p", null, "Bouw je kennis op van druif tot appellatie.")
    ),
    h("div", { class: "level-switch", role: "group", "aria-label": "Kies leertraject" },
      LEVELS.map((level) => {
        const available = level === "SDEN 2" || levelHasContent(level);
        return h("button", {
          disabled: !available,
          title: available ? null : "Binnenkort beschikbaar",
          style: available ? null : { opacity: 0.4, cursor: "not-allowed" },
          class: state.activeLevel === level ? "active" : "",
          onClick: () => {
            if (!available) return;
            update((s) => ({ ...s, activeLevel: level }));
            ctx.rerender();
          }
        }, level, level !== "SDEN 2" && h("small", null, available ? "verdieping" : "binnenkort"));
      })
    ),
    h("label", { class: "search-box" },
      h("span", null, "⌕"),
      h("input", {
        value: query,
        placeholder: "Zoek een onderwerp…",
        onInput: (e) => {
          query = e.target.value;
          ctx.rerender({ focus: ".search-box input" });
        }
      })
    ),
    h("article", { class: "compare-banner" },
      h("div", null,
        h("span", { class: "card-kicker" }, "Vergelijk & onthoud"),
        h("h2", null, "Chardonnay of Chenin Blanc?"),
        h("p", null, "Leg aroma, zuur, klimaat en klassieke herkomst naast elkaar."),
        h("button", { class: "button light", onClick: () => { comparing = true; ctx.rerender(); } },
          "Start vergelijking ", h("span", null, "→"))
      ),
      h("div", { class: "glass-pair", "aria-hidden": "true" }, h("span", null, "Ch"), h("span", null, "Cb"))
    ),
    h("div", { class: "section-heading" },
      h("div", null,
        h("span", { class: "card-kicker dark" }, "Jouw leerpad"),
        h("h2", null, "Onderwerpen")
      ),
      h("span", { class: "muted" }, state.activeLevel)
    ),
    h("div", { class: "topic-grid" },
      topics.map((t) => {
        const m = topicMeta(t.topic);
        return h("button", {
          class: "topic-card",
          onClick: () => startSession(ctx, { title: `Onderwerp: ${t.topic}`, ids: t.ids, size: 6 })
        },
          h("span", { class: `mini-icon ${m.color}` }, m.icon),
          h("span", { class: "topic-copy" },
            h("strong", null, t.topic),
            h("small", null, `${t.total} ${t.total === 1 ? "vraag" : "vragen"} · ${t.answered} gezien`),
            h("span", { class: "bar slim" }, h("i", { style: { width: `${t.coverage}%` } }))
          ),
          h("b", null, `${t.coverage}%`)
        );
      })
    )
  );
  root.appendChild(el);
}

function comparisonView(ctx) {
  return h("section", { class: "comparison-view" },
    h("button", { class: "back-button", onClick: () => { comparing = false; ctx.rerender(); } }, "← Terug naar leren"),
    h("div", { class: "comparison-heading" },
      h("span", { class: "card-kicker dark" }, "Vergelijkmodus"),
      h("h2", null, COMPARISON.heading),
      h("p", null, COMPARISON.sub)
    ),
    h("div", { class: "comparison-grid" },
      [COMPARISON.left, COMPARISON.right].map((side, i) =>
        h("article", { class: `comparison-card ${i ? "green-top" : "gold-top"}` },
          h("span", { class: "comparison-number" }, `0${i + 1}`),
          h("small", null, side.eyebrow),
          h("h3", null, side.title),
          side.rows.map(([label, value]) =>
            h("div", { class: "compare-row" }, h("span", null, label), h("strong", null, value))
          )
        )
      )
    ),
    h("button", {
      class: "button primary",
      onClick: () => {
        comparing = false;
        startSession(ctx, { title: "Vergelijkquiz: Chardonnay & Chenin", ids: COMPARISON.quizIds, size: COMPARISON.quizIds.length });
      }
    }, "Oefen het verschil")
  );
}
