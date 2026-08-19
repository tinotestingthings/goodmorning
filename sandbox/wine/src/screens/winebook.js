// Wijnboek: proefnotities (snel of WSET-structuur) en échte contextuele
// oefening — de gekoppelde vragen worden op trefwoorden uit druif, streek en
// naam gezocht. Te weinig treffers? Dan zegt de knop dat eerlijk en start hij
// een gewone sessie.

import { h } from "../core/dom.js";
import { getState, update } from "../core/state.js";
import { QUESTIONS } from "../data/questions.js";
import { startSession } from "./practice.js";

let modalOpen = false;
let wsetMode = false;

// Trefwoorden (≥4 tekens) uit de ingevulde velden van een proefnotitie.
function keywords(tasting) {
  const src = `${tasting.grape || ""} ${tasting.region || ""} ${tasting.name || ""}`;
  return [...new Set(
    src.toLowerCase().split(/[^a-zà-ÿ]+/i).filter((w) => w.length >= 4)
  )];
}

// Vragen die echt over deze wijn gaan. Elk trefwoord weegt omgekeerd met hoe
// vaak het in de bank voorkomt: "chablis" (3 treffers) telt zwaar, "frankrijk"
// (45 treffers) nauwelijks. Zonder minstens één specifiek trefwoord (≤25
// treffers) beschouwen we de wijn als niet-koppelbaar — dan valt de knop
// eerlijk terug op een gemengde sessie.
export function matchedQuestionIds(state, tasting) {
  const words = keywords(tasting);
  if (!words.length) return [];
  const pool = QUESTIONS.filter((q) => q.level.includes(state.activeLevel));
  // Alleen prompt, het juiste antwoord, uitleg en tags — de foute opties niet,
  // anders koppelt elke vraag met "Chablis" als afleider ook aan een Chablis.
  const hays = new Map(pool.map((q) => [q.id,
    `${q.prompt} ${q.options[q.answer]} ${q.explanation} ${(q.tags || []).join(" ")}`.toLowerCase()
  ]));
  const hits = new Map(words.map((w) => [w, pool.filter((q) => hays.get(q.id).includes(w)).length]));
  const scored = pool
    .map((q) => {
      let score = 0;
      let specific = false;
      for (const w of words) {
        if (!hays.get(q.id).includes(w)) continue;
        const n = hits.get(w);
        if (n > 0) score += 1 / n;
        if (n > 0 && n <= 25) specific = true;
      }
      return { q, score, specific };
    })
    .filter((x) => x.specific)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, 8).map((x) => x.q.id);
}

export function renderWinebook(root, ctx) {
  const state = getState();

  const el = h("section", { class: "page winebook-page" },
    h("div", { class: "page-heading split-heading" },
      h("div", null,
        h("p", { class: "eyebrow" }, "Proef & onthoud"),
        h("h1", null, "Mijn wijnboek"),
        h("p", null, "Jouw persoonlijke bibliotheek van gedronken wijnen.")
      ),
      h("button", { class: "button primary", onClick: () => { modalOpen = true; ctx.rerender(); } }, "+ Wijn toevoegen")
    ),
    state.tastings.length === 0
      ? h("article", { class: "empty-winebook" },
          h("div", { class: "bottle-shape" }, h("i"), h("span", null, "01")),
          h("span", { class: "card-kicker dark" }, "Je eerste hoofdstuk"),
          h("h2", null, "Welke wijn heb je laatst gedronken?"),
          h("p", null, "Leg in minder dan een minuut vast wat je proefde en wat je ervan vond."),
          h("button", { class: "button primary", onClick: () => { modalOpen = true; ctx.rerender(); } }, "Voeg je eerste wijn toe")
        )
      : h("div", { class: "tasting-grid" },
          state.tastings.map((t) => tastingCard(ctx, state, t))
        )
  );
  root.appendChild(el);
  if (modalOpen) root.appendChild(wineModal(ctx));
}

function tastingCard(ctx, state, t) {
  const matches = matchedQuestionIds(state, t);
  const enough = matches.length >= 3;
  return h("article", { class: "tasting-card" },
    h("div", { class: "wine-monogram" }, (t.name || "??").slice(0, 2).toUpperCase()),
    h("div", { class: "tasting-main" },
      h("span", { class: "card-kicker dark" },
        `${t.region || "Eigen proefnotitie"}${t.vintage ? ` · ${t.vintage}` : ""}`),
      h("h2", null, t.name),
      h("p", null, t.producer || t.grape || "Producent niet ingevuld"),
      h("div", { class: "rating", "aria-label": `${t.rating} van 5 sterren` },
        "★".repeat(t.rating) + "☆".repeat(Math.max(0, 5 - t.rating))),
      h("blockquote", null, t.notes || t.palate || "Geen notitie toegevoegd."),
      h("div", { class: "inline-actions" },
        h("button", {
          class: "text-button",
          onClick: () => startSession(ctx, enough
            ? { title: `Bij deze wijn: ${t.grape || t.region || t.name}`, ids: matches, size: Math.min(6, matches.length) }
            : { title: "Gemengde sessie", size: 6 })
        }, enough
          ? `Oefen ${Math.min(6, matches.length)} gekoppelde vragen →`
          : "Geen gekoppelde vragen — oefen gemengd →"),
        h("button", {
          class: "text-button danger",
          onClick: () => {
            update((s) => ({ ...s, tastings: s.tastings.filter((x) => x.id !== t.id) }));
            ctx.toast("Proefnotitie verwijderd.");
            ctx.rerender();
          }
        }, "Verwijder")
      )
    )
  );
}

function wineModal(ctx) {
  const field = (label, name, placeholder, opts = {}) =>
    h("label", { class: opts.full ? "full" : null },
      h("span", null, label),
      opts.textarea
        ? h("textarea", { name, placeholder })
        : h("input", { name, placeholder, inputMode: opts.numeric ? "numeric" : null, required: opts.required })
    );

  const form = h("form", {
    onSubmit: (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      const t = {
        id: `t-${Date.now()}`,
        date: new Date().toISOString().slice(0, 10),
        name: (data.get("name") || "").trim(),
        producer: (data.get("producer") || "").trim(),
        vintage: (data.get("vintage") || "").trim(),
        region: (data.get("region") || "").trim(),
        grape: (data.get("grape") || "").trim(),
        rating: Number(data.get("rating") || 0),
        notes: (data.get("notes") || "").trim(),
        appearance: (data.get("appearance") || "").trim(),
        nose: (data.get("nose") || "").trim(),
        palate: (data.get("palate") || "").trim(),
        conclusion: (data.get("conclusion") || "").trim()
      };
      if (!t.name) return;
      update((s) => ({ ...s, tastings: [t, ...s.tastings] }));
      modalOpen = false;
      ctx.toast("Proefnotitie bewaard.");
      ctx.rerender();
    }
  },
    field("Wijnnaam *", "name", "Bijv. Sancerre Les Baronnes", { full: true, required: true }),
    field("Producent", "producer", "Henri Bourgeois"),
    field("Jaargang", "vintage", "2023", { numeric: true }),
    field("Streek", "region", "Loire, Frankrijk"),
    field("Druif", "grape", "Sauvignon Blanc"),
    h("label", { class: "full" },
      h("span", null, "Beoordeling"),
      h("select", { name: "rating" },
        [["5", "★★★★★ · bijzonder"], ["4", "★★★★☆ · heel goed"], ["3", "★★★☆☆ · goed"],
         ["2", "★★☆☆☆ · matig"], ["1", "★☆☆☆☆ · niet mijn smaak"]]
          .map(([v, txt]) => h("option", { value: v, selected: v === "4" }, txt))
      )
    ),
    !wsetMode && field("Wat vond je ervan?", "notes", "Aroma’s, smaak, moment — schrijf wat je wilt onthouden.", { full: true, textarea: true }),
    wsetMode && [
      field("Uiterlijk", "appearance", "Helderheid, intensiteit, kleur…", { full: true, textarea: true }),
      field("Neus", "nose", "Conditie, intensiteit, aroma’s, ontwikkeling…", { full: true, textarea: true }),
      field("Smaak", "palate", "Zoetheid, zuur, alcohol, body, aroma’s, afdronk…", { full: true, textarea: true }),
      field("Conclusie", "conclusion", "Kwaliteit, drinkbaarheid en persoonlijke indruk…", { full: true, textarea: true })
    ],
    h("div", { class: "modal-actions" },
      h("button", { type: "button", class: "aside-button", onClick: () => { modalOpen = false; ctx.rerender(); } }, "Annuleren"),
      h("button", { class: "button primary", type: "submit" }, "Bewaar proefnotitie")
    )
  );

  return h("div", { class: "modal-backdrop", role: "presentation" },
    h("section", { class: "wine-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "wine-form-title" },
      h("div", { class: "modal-heading" },
        h("div", null,
          h("span", { class: "card-kicker dark" }, "Nieuw proefmoment"),
          h("h2", { id: "wine-form-title" }, "Voeg een wijn toe")
        ),
        h("button", { "aria-label": "Sluiten", onClick: () => { modalOpen = false; ctx.rerender(); } }, "×")
      ),
      h("div", { class: "form-mode" },
        h("button", { class: wsetMode ? "" : "active", onClick: () => { wsetMode = false; ctx.rerender(); } }, "Snel"),
        h("button", { class: wsetMode ? "active" : "", onClick: () => { wsetMode = true; ctx.rerender(); } }, "WSET-structuur")
      ),
      form
    )
  );
}
