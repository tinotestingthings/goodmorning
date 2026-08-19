// Profiel: eerlijke voortgang. Elke meter komt uit echte antwoorden en de
// toelichting benoemt de formule. De oude in-app vragen-CMS is vervallen: de
// bank leeft als broncode in de repo.

import { h } from "../core/dom.js";
import { getState, update, replaceState, resetState } from "../core/state.js";
import { coverage, mastery, retention, readiness, weekBars, answeredThisWeek, displayStreak } from "../core/stats.js";
import { QUESTIONS } from "../data/questions.js";
import { levelHasContent } from "../core/srs.js";
import { LEVELS } from "../data/content.js";
import { progressRing, miniIcon } from "../ui.js";
import { startSession } from "./practice.js";

export function renderProfile(root, ctx) {
  const state = getState();
  const ready = readiness(state);
  const bars = weekBars(state);
  const maxBar = Math.max(1, ...bars.map((b) => b.count));

  const el = h("section", { class: "page profile-page" },
    h("div", { class: "page-heading" },
      h("p", { class: "eyebrow" }, "Voortgang & voorkeuren"),
      h("h1", null, "Profiel"),
      h("p", null, "Zie wat je beheerst en bepaal waar je naartoe werkt.")
    ),
    h("div", { class: "profile-hero" },
      h("div", { class: "avatar" }, "WS"),
      h("div", null,
        h("span", { class: "card-kicker" }, "Profiel"),
        h("h2", null, "Wijnstudent"),
        h("p", null, `${state.activeLevel} · Level ${Math.floor(state.xp / 250) + 1}`)
      ),
      h("div", { class: "xp-total" },
        h("span", null, "✦"),
        h("strong", null, String(state.xp)),
        h("small", null, "totaal XP")
      )
    ),
    h("div", { class: "profile-grid" },
      h("article", { class: "panel readiness-panel" },
        h("div", { class: "panel-title" },
          h("div", null,
            h("span", { class: "card-kicker dark" }, "Examengereedheid"),
            h("h2", null, ready >= 75 ? "Je bent goed op weg" : "Bouw je basis verder uit")
          ),
          progressRing(ready)
        ),
        h("p", null, "Gewogen mix: 50% kennisbeheersing, 30% dekking, 20% retentie — allemaal uit je echte antwoorden."),
        h("div", { class: "readiness-list" },
          statBar("Kennisbeheersing", mastery(state)),
          statBar("Dekking leerstof", coverage(state)),
          statBar("Retentie", retention(state))
        )
      ),
      h("article", { class: "panel stats-panel" },
        h("span", { class: "card-kicker dark" }, "Deze week"),
        h("div", { class: "stat-pair" },
          h("span", null, h("b", null, String(answeredThisWeek(state))), h("small", null, "vragen")),
          h("span", null, h("b", null, String(displayStreak(state))), h("small", null, "dag streak"))
        ),
        h("div", { class: "week-bars" },
          bars.map((b) => h("span", null,
            h("i", {
              style: { height: `${Math.max(5, Math.round((b.count / maxBar) * 100))}%`, opacity: b.isToday ? 1 : 0.75 },
              title: `${b.count} ${b.count === 1 ? "vraag" : "vragen"}`
            }),
            h("small", { style: b.isToday ? { fontWeight: 700 } : null }, b.label)
          ))
        )
      )
    ),
    h("section", { class: "settings-section" },
      h("h2", null, "Jouw leertraject"),
      h("div", { class: "setting-card" },
        h("div", null,
          miniIcon("S2", "rose"),
          h("span", null,
            h("strong", null, "Actief niveau"),
            h("small", null, "Dit bepaalt je dagelijkse leerroute")
          )
        ),
        h("select", {
          onChange: (e) => { update((s) => ({ ...s, activeLevel: e.target.value })); ctx.rerender(); }
        },
          LEVELS.map((level) => {
            const available = level === "SDEN 2" || levelHasContent(level);
            return h("option", {
              value: level,
              selected: state.activeLevel === level,
              disabled: !available
            }, available ? level : `${level} — binnenkort`);
          })
        )
      ),
      h("div", { class: "setting-card" },
        h("div", null,
          miniIcon(String(state.dailyGoal), "gold"),
          h("span", null,
            h("strong", null, "Dagdoel"),
            h("small", null, "Vragen per dag die je wilt beantwoorden")
          )
        ),
        h("select", {
          onChange: (e) => { update((s) => ({ ...s, dailyGoal: Number(e.target.value) })); ctx.rerender(); }
        },
          [5, 10, 20].map((n) => h("option", { value: n, selected: state.dailyGoal === n }, `${n} vragen`))
        )
      )
    ),
    h("section", { class: "settings-section" },
      h("h2", null, "Vragenbank"),
      h("div", { class: "setting-card" },
        h("div", null,
          miniIcon("DB", "rose"),
          h("span", null,
            h("strong", null, "In de app gebundeld"),
            h("small", null, `${QUESTIONS.length} vragen · beheerd als broncode in de repo`)
          )
        )
      ),
      h("div", { class: "setting-card" },
        h("div", null,
          miniIcon("↺", "blue"),
          h("span", null,
            h("strong", null, "Opzijgezette vragen"),
            h("small", null, `${state.ignoredIds.length} ${state.ignoredIds.length === 1 ? "vraag blijft" : "vragen blijven"} veilig bewaard`)
          )
        ),
        h("div", { class: "inline-actions" },
          h("button", {
            disabled: !state.ignoredIds.length,
            onClick: () => startSession(ctx, { title: "Opzijgezette vragen", ids: state.ignoredIds, size: state.ignoredIds.length })
          }, "Oefenen"),
          h("button", {
            disabled: !state.ignoredIds.length,
            onClick: () => { update((s) => ({ ...s, ignoredIds: [] })); ctx.toast("Alle vragen zijn hersteld."); ctx.rerender(); }
          }, "Alles herstellen")
        )
      )
    ),
    h("section", { class: "settings-section" },
      h("h2", null, "Lokale gegevens"),
      h("div", { class: "backup-card" },
        h("div", null,
          h("strong", null, "Alles staat op dit apparaat"),
          h("p", null, "Download regelmatig een back-up. Je kunt deze later weer importeren.")
        ),
        h("div", { class: "inline-actions" },
          h("button", { onClick: () => exportJson(state) }, "Exporteer JSON"),
          h("button", { onClick: () => importInput.click() }, "Importeer"),
          h("button", {
            class: "danger",
            onClick: () => {
              if (window.confirm("Alle voortgang, XP en proefnotities wissen? Dit kan niet ongedaan worden gemaakt.")) {
                resetState();
                ctx.toast("Alles is gewist. Veel succes met je nieuwe start!");
                ctx.rerender();
              }
            }
          }, "Begin opnieuw")
        )
      )
    )
  );

  const importInput = h("input", {
    type: "file", accept: "application/json", hidden: true,
    onChange: (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(String(reader.result));
          if (!data || typeof data !== "object" || !data.version) throw new Error("bad");
          replaceState(data);
          ctx.toast("Back-up geïmporteerd.");
          ctx.rerender();
        } catch {
          ctx.toast("Dit bestand is geen geldige WijnWijs-back-up.");
        }
      };
      reader.readAsText(file);
    }
  });
  el.appendChild(importInput);
  root.appendChild(el);
}

function statBar(label, value) {
  return h("span", null,
    h("i", { style: { width: `${value}%` } }),
    h("b", null, `${label} ${value}%`)
  );
}

function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wijnwijs-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
