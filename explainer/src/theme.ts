// Colour tokens copied verbatim from the goodmorning app's style.css (dark
// theme), so the video and the app read as one thing.
export const C = {
  bg: "#0f1115",
  card: "#1a1d24",
  text: "#eef0f3",
  dim: "#9aa1ac",
  border: "#2a2e37",
  keep: "#2fae66",
  dismiss: "#d9534f",
  skip: "#4a90d9",
} as const;

export const FONT =
  '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif';

// One panel per beat; the whole strip pans horizontally.
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const BEATS = [
  { id: "sources", start: 0, duration: 240 },
  { id: "tasks", start: 240, duration: 300 },
  { id: "inbox", start: 540, duration: 240 },
  { id: "triage", start: 780, duration: 420 },
  { id: "vault", start: 1200, duration: 240 },
  { id: "loop", start: 1440, duration: 120 },
] as const;

export const TOTAL = 1560;
