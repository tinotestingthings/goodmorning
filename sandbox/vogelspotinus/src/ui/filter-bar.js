// ---------------------------------------------------------------------------
// The filter bar, generated from FILTER_DEFINITIONS. One implementation serves
// Browse, Quiz and the Custom Game Builder.
//
// Toggling a chip patches that group in place rather than rebuilding the whole
// bar (which is what the old version did on every click, throwing away the
// family search box's text, its scroll position and the user's focus).
// ---------------------------------------------------------------------------

import { h, icon } from "../core/dom.js";
import { t } from "../core/i18n.js";
import {
  FILTER_DEFINITIONS,
  availableFilters,
  filterLabel,
  filterValueLabel,
} from "../core/filters.js";

/**
 * @param {HTMLElement} container
 * @param {object} selection mutated in place; the caller owns it
 * @param {(opts: {rebuildBar?: boolean}) => void} onChange wordt met
 *   `rebuildBar: true` aangeroepen als de diersoort wisselde -- dan klopt de
 *   rest van de balk niet meer en moet hij opnieuw opgebouwd worden.
 * @param {Array<object>} [pool] alle soorten; dimensies en waarden die hierin
 *   nergens voorkomen worden weggelaten. Zonder pool tonen we alles.
 */
export function renderFilterBar(container, selection, onChange, pool) {
  container.replaceChildren();
  container.classList.add("filter-bar");
  const defs = pool ? availableFilters(pool) : FILTER_DEFINITIONS;
  for (const def of defs) {
    container.append(buildGroup(def, selection, onChange));
  }
}

/**
 * De diersoortschakelaar, als segmented control voor bovenaan een scherm.
 *
 * Schrijft op dezelfde `selection.kind` als de gewone filterdimensie -- dit is
 * een tweede bedieningsplek, geen tweede stuk state. "Alles" is een lege
 * selectie, precies zoals bij elke andere dimensie.
 */
export function renderKindSwitch(container, selection, onChange) {
  const def = FILTER_DEFINITIONS.find((d) => d.key === "kind");
  const options = [{ value: null, labelKey: "all" }, ...def.values];
  const buttons = options.map((option) => {
    const button = h(
      "button",
      { type: "button" },
      option.value ? filterValueLabel(def, option.value) : t(option.labelKey)
    );
    button.addEventListener("click", () => {
      selection.kind = option.value ? [option.value] : [];
      sync();
      onChange({ rebuildBar: true });
    });
    return { option, button };
  });

  function sync() {
    const selected = selection.kind ?? [];
    for (const { option, button } of buttons) {
      const on = option.value ? selected.includes(option.value) : selected.length === 0;
      button.classList.toggle("active", on);
      button.setAttribute("aria-pressed", String(on));
    }
  }

  container.classList.add("segmented");
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", filterLabel(def));
  container.replaceChildren(...buttons.map((b) => b.button));
  sync();
}

function buildGroup(def, selection, onChange) {
  const title = h(
    "h3",
    { class: "filter-group-title", id: `filter-title-${def.key}` },
    filterLabel(def)
  );
  const body =
    def.type === "boolean"
      ? booleanControl(def, selection, onChange)
      : def.renderAs === "searchable-checklist"
        ? checklistControl(def, selection, onChange)
        : chipControl(def, selection, onChange);

  return h(
    "section",
    { class: "filter-group", "aria-labelledby": `filter-title-${def.key}` },
    title,
    body
  );
}

// --- boolean (favorites) ----------------------------------------------------

function booleanControl(def, selection, onChange) {
  const chip = h(
    "button",
    { type: "button", class: "chip", "aria-pressed": String(Boolean(selection[def.key])) },
    icon("star", selection[def.key] ? "icon-fill" : null),
    h("span", {}, filterLabel(def))
  );
  chip.classList.toggle("active", Boolean(selection[def.key]));
  chip.addEventListener("click", () => {
    selection[def.key] = !selection[def.key];
    const on = Boolean(selection[def.key]);
    chip.classList.toggle("active", on);
    chip.setAttribute("aria-pressed", String(on));
    chip.replaceChildren(icon("star", on ? "icon-fill" : null), h("span", {}, filterLabel(def)));
    onChange({});
  });
  return h("div", { class: "chip-row" }, chip);
}

// --- chip rows (commonness, status, colour, size) ---------------------------

function chipControl(def, selection, onChange) {
  const row = h("div", { class: "chip-row", role: "group" });
  const chips = new Map();

  const allChip = h("button", { type: "button", class: "chip" }, t("all"));
  row.append(allChip);

  for (const entry of def.values) {
    const chip = h(
      "button",
      { type: "button", class: "chip" },
      entry.swatch
        ? h("span", { class: "chip-swatch", style: { background: entry.swatch } })
        : null,
      h("span", {}, filterValueLabel(def, entry.value))
    );
    chips.set(entry.value, chip);
    row.append(chip);
  }

  const sync = () => {
    const selected = selection[def.key] ?? [];
    allChip.classList.toggle("active", selected.length === 0);
    allChip.setAttribute("aria-pressed", String(selected.length === 0));
    for (const [value, chip] of chips) {
      const on = selected.includes(value);
      chip.classList.toggle("active", on);
      chip.setAttribute("aria-pressed", String(on));
    }
  };

  allChip.addEventListener("click", () => {
    selection[def.key] = [];
    sync();
    onChange({ rebuildBar: def.key === "kind" });
  });
  for (const [value, chip] of chips) {
    chip.addEventListener("click", () => {
      const selected = selection[def.key] ?? [];
      selection[def.key] = selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value];
      sync();
      onChange({ rebuildBar: def.key === "kind" });
    });
  }

  sync();
  return row;
}

// --- searchable checklist (family: ~80 values) ------------------------------

function checklistControl(def, selection, onChange) {
  const summary = h("p", { class: "count-line" });
  const search = h("input", {
    type: "search",
    class: "checklist-search",
    placeholder: t("searchGeneric"),
    "aria-label": `${filterLabel(def)} — ${t("searchGeneric")}`,
  });
  const list = h("div", { class: "pick-list" });

  const updateSummary = () => {
    const n = (selection[def.key] ?? []).length;
    summary.textContent = n ? `${n} ${t("itemsSelected")}` : t("all");
  };

  const renderList = () => {
    const query = search.value.trim().toLowerCase();
    const selected = selection[def.key] ?? [];
    const rows = def.values
      .map((entry) => ({ entry, label: filterValueLabel(def, entry.value) }))
      .filter(({ label }) => !query || label.toLowerCase().includes(query))
      .map(({ entry, label }) => {
        const box = h("input", { type: "checkbox", checked: selected.includes(entry.value) });
        box.addEventListener("change", () => {
          const current = selection[def.key] ?? [];
          selection[def.key] = box.checked
            ? [...current, entry.value]
            : current.filter((v) => v !== entry.value);
          updateSummary();
          onChange({});
        });
        return h("label", { class: "pick-row" }, box, h("span", {}, label));
      });
    list.replaceChildren(...rows);
  };

  search.addEventListener("input", renderList);
  updateSummary();
  renderList();
  return h("div", { class: "checklist" }, summary, search, list);
}
