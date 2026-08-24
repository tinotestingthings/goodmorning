// ---------------------------------------------------------------------------
// Settings: language, theme, per-theme colour overrides.
// ---------------------------------------------------------------------------

import { byId, h } from "../core/dom.js";
import { currentLanguage, setLanguage, t } from "../core/i18n.js";
import { LANGUAGES } from "../core/strings.js";
import { setSoundQuestions, soundQuestionsEnabled } from "../core/sound.js";
import { EVENTS, on } from "../core/events.js";
import { registerScreen, currentScreenId, refreshScreen } from "../core/nav.js";
import {
  THEMEABLE_VARS,
  THEMES,
  cssColorToHex,
  currentTheme,
  overridesFor,
  readCssVar,
  resetThemeOverrides,
  setTheme,
  setThemeOverride,
} from "../core/theme.js";

const LANGUAGE_LABELS = { nl: "🇳🇱 Nederlands", en: "🇬🇧 English" };

function renderLanguageSwitch() {
  byId("language-switch").replaceChildren(
    ...LANGUAGES.map((lang) =>
      h(
        "button",
        {
          type: "button",
          class: lang === currentLanguage() ? "active" : "",
          "aria-pressed": String(lang === currentLanguage()),
          lang,
          onclick: () => setLanguage(lang),
        },
        LANGUAGE_LABELS[lang]
      )
    )
  );
}

/**
 * Geluidsvragen aan/uit. Staat bij Instellingen en niet in het Opties-blad van
 * de quiz, omdat het over je omstandigheden gaat (koptelefoon, trein, telefoon
 * op stil) en niet over wat je wilt oefenen -- je zet hem één keer om.
 */
function renderSoundSwitch() {
  const opties = [
    { on: true, labelKey: "soundQuestionsOn" },
    { on: false, labelKey: "soundQuestionsOff" },
  ];
  const knoppen = opties.map(({ on, labelKey }) => {
    const knop = h("button", { type: "button" }, t(labelKey));
    knop.addEventListener("click", () => {
      setSoundQuestions(on);
      sync();
    });
    return { on, knop };
  });
  function sync() {
    for (const { on, knop } of knoppen) {
      const actief = on === soundQuestionsEnabled();
      knop.classList.toggle("active", actief);
      knop.setAttribute("aria-pressed", String(actief));
    }
  }
  byId("sound-switch").replaceChildren(...knoppen.map((k) => k.knop));
  sync();
}

function renderThemeSwitch() {
  const active = currentTheme();
  byId("theme-switch").replaceChildren(
    ...THEMES.map((theme) =>
      h(
        "button",
        {
          type: "button",
          class: theme.value === active ? "chip active" : "chip",
          "aria-pressed": String(theme.value === active),
          onclick: () => {
            setTheme(theme.value);
            renderThemeSwitch();
            renderThemeCustomizer();
          },
        },
        t(theme.labelKey)
      )
    )
  );
}

function renderThemeCustomizer() {
  const theme = currentTheme();
  const overrides = overridesFor(theme);

  const rows = THEMEABLE_VARS.map(({ cssVar, labelKey }) => {
    const id = `theme-var-${cssVar}`;
    const value = overrides[cssVar] ?? cssColorToHex(readCssVar(`--${cssVar}`));
    const input = h("input", { type: "color", id, value });
    input.addEventListener("input", () => setThemeOverride(theme, cssVar, input.value));
    return h("div", { class: "theme-var-row" }, h("label", { for: id }, t(labelKey)), input);
  });

  const reset = h(
    "button",
    {
      type: "button",
      class: "secondary",
      onclick: () => {
        resetThemeOverrides(theme);
        renderThemeCustomizer();
      },
    },
    t("resetTheme")
  );

  byId("theme-customizer").replaceChildren(...rows, reset);
}

function render() {
  renderLanguageSwitch();
  renderSoundSwitch();
  renderThemeSwitch();
  renderThemeCustomizer();
}

export function registerSettingsScreen() {
  registerScreen("settings", { render });
  // Only language re-renders the whole screen. Theme changes patch the two
  // controls they affect -- a full re-render would replace the <input
  // type="color"> the user is currently dragging.
  on(EVENTS.languageChanged, () => {
    if (currentScreenId() === "settings") refreshScreen();
  });
}
