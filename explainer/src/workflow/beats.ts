// Timing for the WorkflowExplainer composition (the "hele workflow" video,
// gemaakt voor de presentatie van 2026-08; Tinus praat er live overheen).
// Zelfde strip-principe als EcosystemExplainer: één paneel per beat, de
// camera is één translateX.

export const WBEATS = [
  { id: "title", start: 0, duration: 120 },
  { id: "brain", start: 120, duration: 420 },
  { id: "scraper", start: 540, duration: 360 },
  { id: "apps", start: 900, duration: 300 },
  { id: "calendar", start: 1200, duration: 300 },
  { id: "webapp", start: 1500, duration: 240 },
  { id: "arch", start: 1740, duration: 1060 },
] as const;

export const WTOTAL = 2800; // ~93 s @ 30 fps — moet de som van de durations zijn
