// Vandaag: begroeting op tijdstip, echte streak, dagdoel uit het oefenlogboek,
// quick fact van de dag en een eerlijke vervolg-suggestie (laagste dekking).
// Zwakke plekken verschijnen pas wanneer er genoeg antwoorden zijn om iets te
// betekenen.

import { h } from "../core/dom.js";
import { getState, formatLongDate, todayKey } from "../core/state.js";
import { answeredToday, displayStreak, weakTopics, nextTopic, coverage } from "../core/stats.js";
import { FACTS } from "../data/content.js";
import { topicMeta } from "../data/content.js";
import { topicStats } from "../core/stats.js";
import { progressRing, greeting } from "../ui.js";
import { startSession } from "./practice.js";

function hashCode(str) {
  let n = 0;
  for (let i = 0; i < str.length; i++) n = (n * 31 + str.charCodeAt(i)) >>> 0;
  return n;
}

export function renderToday(root, ctx) {
  const state = getState();
  const done = answeredToday(state);
  const goalPct = Math.min(100, Math.round((done / state.dailyGoal) * 100));
  const streak = displayStreak(state);

  const facts = FACTS.filter((f) => f.level === state.activeLevel || f.level === "SDEN 2");
  const fact = facts[hashCode(`${todayKey()}-${state.activeLevel}`) % facts.length] || FACTS[0];

  const weak = weakTopics(state);
  const next = nextTopic(state);

  const el = h("section", { class: "page today-page" },
    h("div", { class: "page-heading split-heading" },
      h("div", null,
        h("p", { class: "eyebrow" }, formatLongDate()),
        h("h1", null, greeting()),
        h("p", null, "Een paar minuten wijnwijsheid maakt vandaag al verschil.")
      ),
      h("div", { class: "streak-card" },
        h("span", { class: "flame" }, "◆"),
        h("strong", null, String(streak)),
        h("small", null, streak === 1 ? "dag op rij" : "dagen op rij")
      )
    ),
    h("aside", { class: "fact-line" },
      h("p", null,
        h("strong", null, fact.title + ". "),
        fact.body
      ),
      h("button", {
        class: "text-button",
        onClick: () => startSession(ctx, {
          title: `Test: ${fact.kicker}`,
          ids: topicStats(state).find((t) => t.topic === fact.topic)?.ids || [],
          size: 6
        })
      }, "Oefen ", fact.kicker.toLowerCase(), " ", h("span", null, "→"))
    ),
    h("div", { class: "dashboard-grid" },
      h("article", { class: "panel daily-panel" },
        h("div", { class: "panel-title" },
          h("div", null,
            h("span", { class: "card-kicker dark" }, "Jouw dagdoel"),
            h("h2", null, done >= state.dailyGoal ? "Dagdoel gehaald" : "Blijf in je ritme")
          ),
          progressRing(goalPct)
        ),
        h("div", { class: "goal-row" },
          h("span", null, h("b", null, String(done)), ` van ${state.dailyGoal} vragen vandaag`),
          h("span", null, `${Math.max(0, state.dailyGoal - done)} te gaan`)
        ),
        h("div", { class: "bar" }, h("i", { style: { width: `${goalPct}%` } })),
        h("button", {
          class: "button primary wide",
          onClick: () => startSession(ctx, { title: "Dagelijkse herhaling", size: 6 })
        }, "Start je sessie ", h("span", null, "→"))
      ),
      next && h("article", { class: "panel continue-panel" },
        (() => { const m = topicMeta(next.topic); return h("div", { class: `mini-icon ${m.color}` }, m.icon); })(),
        h("span", { class: "card-kicker dark" }, "Minste dekking"),
        h("h2", null, next.topic),
        h("p", null, `${next.answered} van ${next.total} vragen gezien (${next.coverage}%)`),
        h("button", {
          class: "text-button",
          onClick: () => startSession(ctx, { title: `Onderwerp: ${next.topic}`, ids: next.ids, size: 6 })
        }, "Oefen dit onderwerp ", h("span", null, "→"))
      )
    ),
    weak.length > 0 && h("section", { class: "section-block" },
      h("div", { class: "section-heading" },
        h("div", null,
          h("span", { class: "card-kicker dark" }, "Uit je eigen antwoorden"),
          h("h2", null, "Hier valt winst te halen")
        ),
        h("button", { class: "text-button", onClick: () => ctx.go("profile") }, "Bekijk analyse")
      ),
      h("div", { class: "weak-grid" },
        weak.map((t) => {
          const m = topicMeta(t.topic);
          return h("button", {
            class: "weak-card",
            onClick: () => startSession(ctx, { title: `Focus: ${t.topic}`, ids: t.ids, size: 6 })
          },
            h("span", { class: `mini-icon ${m.color}` }, m.icon),
            h("span", null,
              h("strong", null, t.topic),
              h("small", null, `${t.accuracy}% goed beantwoord`)
            ),
            h("span", { class: "weak-arrow" }, "→")
          );
        })
      )
    ),
    coverage(state) === 0 && h("section", { class: "section-block" },
      h("div", { class: "section-heading" },
        h("div", null,
          h("span", { class: "card-kicker dark" }, "Nieuw hier"),
          h("h2", null, "Begin met je eerste sessie")
        )
      ),
      h("p", { class: "muted" }, "Na je eerste antwoorden verschijnen hier je zwakke plekken en persoonlijke voortgang — gebaseerd op wat je écht doet.")
    )
  );
  root.appendChild(el);
}
