// ---------------------------------------------------------------------------
// Theme selection and per-theme colour overrides.
//
// "auto" follows the OS light/dark setting and is the default. It exists
// because the old default ("standard", but with data-theme never actually set
// on a fresh install) meant a phone in dark mode rendered the dark palette
// while Settings highlighted "Standaard" -- the app and its own settings
// screen disagreed. Now the boot path always sets data-theme, and "auto" is a
// real, selectable option rather than dead CSS.
// ---------------------------------------------------------------------------

import { KEYS, read, write } from "./storage.js";
import { EVENTS, emit } from "./events.js";

export const THEMES = [
  { value: "auto", labelKey: "themeAuto" },
  { value: "standard", labelKey: "themeStandard" },
  { value: "night", labelKey: "themeNight" },
  { value: "playful", labelKey: "themePlayful" },
  { value: "birder", labelKey: "themeBirder" },
];

const DEFAULT_THEME = "auto";

/**
 * The CSS custom properties a theme may be customised on. `--shadow` is
 * deliberately absent: every theme derives its shadow from `--shadow-color`,
 * so overriding the background no longer leaves light-theme shadows behind.
 */
export const THEMEABLE_VARS = [
  { cssVar: "bg", labelKey: "themeVarBg" },
  { cssVar: "surface", labelKey: "themeVarSurface" },
  { cssVar: "text", labelKey: "themeVarText" },
  { cssVar: "muted", labelKey: "themeVarMuted" },
  { cssVar: "accent", labelKey: "themeVarAccent" },
  { cssVar: "accent-contrast", labelKey: "themeVarAccentContrast" },
  { cssVar: "border", labelKey: "themeVarBorder" },
  { cssVar: "danger", labelKey: "themeVarDanger" },
];

export function currentTheme() {
  const stored = read(KEYS.theme, DEFAULT_THEME);
  return THEMES.some((th) => th.value === stored) ? stored : DEFAULT_THEME;
}

function allOverrides() {
  const stored = read(KEYS.themeOverrides, {});
  return stored && typeof stored === "object" ? stored : {};
}

export function overridesFor(theme) {
  return allOverrides()[theme] ?? {};
}

export function applyTheme(theme = currentTheme()) {
  document.documentElement.dataset.theme = theme;
  for (const { cssVar } of THEMEABLE_VARS) {
    document.documentElement.style.removeProperty(`--${cssVar}`);
  }
  for (const [cssVar, value] of Object.entries(overridesFor(theme))) {
    document.documentElement.style.setProperty(`--${cssVar}`, value);
  }
  syncBrowserThemeColor();
}

export function setTheme(theme) {
  write(KEYS.theme, theme);
  applyTheme(theme);
  emit(EVENTS.themeChanged, theme);
}

export function setThemeOverride(theme, cssVar, value) {
  const all = allOverrides();
  all[theme] = { ...(all[theme] ?? {}), [cssVar]: value };
  write(KEYS.themeOverrides, all);
  applyTheme(theme);
  emit(EVENTS.themeChanged, theme);
}

export function resetThemeOverrides(theme) {
  const all = allOverrides();
  delete all[theme];
  write(KEYS.themeOverrides, all);
  applyTheme(theme);
  emit(EVENTS.themeChanged, theme);
}

/** Keep the OS status-bar / PWA chrome colour in step with the active theme. */
function syncBrowserThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) return;
  meta.content = readCssVar("--bg");
}

export function readCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * Theme variables are authored as plain #hex literals, so getComputedStyle on
 * a custom property returns that literal unresolved (unlike normal properties,
 * which come back as rgb(...)). Parse rgb() only as a fallback.
 */
export function cssColorToHex(value) {
  const trimmed = (value || "").trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed.toLowerCase();
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${[...trimmed.slice(1)].map((c) => c + c).join("")}`.toLowerCase();
  }
  const nums = trimmed.match(/\d+/g);
  if (!nums || nums.length < 3) return "#000000";
  return `#${nums
    .slice(0, 3)
    .map((n) =>
      Math.min(255, Math.max(0, Number(n)))
        .toString(16)
        .padStart(2, "0")
    )
    .join("")}`;
}

/** Re-apply on OS light/dark change so the "auto" theme actually tracks it. */
export function watchSystemColorScheme() {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (currentTheme() === "auto") syncBrowserThemeColor();
  });
}
