import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../../components/Caption";
import { C, FONT, W, H } from "../../theme";

/**
 * Beat 6 — het slotstuk (44 s). Twee fasen:
 *   A (0–420): het diagram bouwt zichzelf "zonder praten" op —
 *              Claude · Vault · GitHub · Supabase · Webapp, met de echte pijlen.
 *   B (420–1320): drie flows lichten één voor één op terwijl Tinus ze
 *              live naloopt: nieuws, compliance, events in Utrecht.
 */

const AMBER = "#d9a441";

type Pt = { x: number; y: number };

const NODES: Record<string, Pt & { label: string; sub?: string; accent?: string }> = {
  bronnen: { x: 270, y: 590, label: "Bronnen", sub: "nieuws · events" },
  claude: { x: 760, y: 590, label: "Claude", sub: "scheduled tasks", accent: C.keep },
  vault: { x: 760, y: 290, label: "Vault", sub: "second brain" },
  github: { x: 1245, y: 400, label: "GitHub", sub: "code + feed.json" },
  supabase: { x: 1245, y: 800, label: "Supabase", sub: "state + acties" },
  webapp: { x: 1620, y: 590, label: "Webapp", sub: "goodmorning", accent: C.keep },
};

// [van, naar, tweerichting, gestippeld]
const EDGES: [string, string, boolean, boolean][] = [
  ["bronnen", "claude", false, false],
  ["vault", "claude", true, false],
  ["claude", "github", false, false],
  ["github", "webapp", false, false],
  ["webapp", "supabase", true, false],
  ["supabase", "claude", false, true],
];

// Na de nieuws-flow lopen compliance en events vrijwel tegelijk — het is
// dezelfde loop, dus dat verdient geen aparte "slides". De events-lijn krijgt
// een kleine dy zodat amber en blauw naast elkaar zichtbaar blijven.
const FLOWS = [
  {
    name: "Nieuws",
    colour: C.keep,
    path: ["bronnen", "claude", "github", "webapp", "supabase", "claude", "vault"],
    tagAt: "webapp",
    tag: "swipe → taak",
    tagDy: 0,
    dy: 0,
    start: 450,
  },
  {
    name: "Compliance",
    colour: C.skip,
    path: ["bronnen", "claude", "github", "webapp"],
    tagAt: "webapp",
    tag: "timeline",
    tagDy: 0,
    dy: -7,
    start: 750,
  },
  {
    name: "Events in Utrecht",
    colour: AMBER,
    path: ["bronnen", "claude", "github", "webapp", "supabase"],
    tagAt: "webapp",
    tag: "Event Tracker",
    tagDy: -62,
    dy: 7,
    start: 770,
  },
];

// Onderschriften: één voor nieuws, één gecombineerd voor de andere twee.
const LABELS = [
  {
    start: 450,
    end: 734,
    parts: [{ text: "Nieuws", colour: C.keep }],
    rest: "scrapen → app → swipen → taak → opslag in de vault",
  },
  {
    start: 750,
    end: 1054,
    parts: [
      { text: "Compliance", colour: C.skip },
      { text: " & ", colour: C.dim },
      { text: "events in Utrecht", colour: AMBER },
    ],
    rest: "zelfde loop — timeline · Event Tracker",
  },
];

const FLOW_DRAW = 170; // frames waarin één flow zijn pad aflegt
const FLOW_HOLD = 90; // daarna blijft hij nog even staan

/** Punt op afstand-fractie t (0..1) langs een polyline. */
const along = (pts: Pt[], t: number): Pt => {
  const lens: number[] = [];
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    const l = Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    lens.push(l);
    total += l;
  }
  let d = t * total;
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const f = lens[i] === 0 ? 0 : d / lens[i];
      return {
        x: pts[i].x + (pts[i + 1].x - pts[i].x) * f,
        y: pts[i].y + (pts[i + 1].y - pts[i].y) * f,
      };
    }
    d -= lens[i];
  }
  return pts[pts.length - 1];
};

const polyLength = (pts: Pt[]) => {
  let total = 0;
  for (let i = 1; i < pts.length; i++) {
    total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  }
  return total;
};

export const W6Architecture: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      <Caption delay={8} sub="Claude · Vault · GitHub · Supabase · Webapp" y={70}>
        Zo hangt het samen
      </Caption>

      {/* Vaste pijlen (fase A) */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX={8}
            refY={5}
            markerWidth={7}
            markerHeight={7}
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill={C.dim} />
          </marker>
        </defs>
        {EDGES.map(([from, to, both, dashed], i) => {
          const a = NODES[from];
          const b = NODES[to];
          const len = Math.hypot(b.x - a.x, b.y - a.y);
          const draw = interpolate(
            local,
            [70 + i * 34, 130 + i * 34],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          // Lijn iets inkorten zodat de pijlpunt niet onder de node ligt.
          const trim = 92 / len;
          const ax = a.x + (b.x - a.x) * trim;
          const ay = a.y + (b.y - a.y) * trim;
          const bx = a.x + (b.x - a.x) * (1 - trim);
          const by = a.y + (b.y - a.y) * (1 - trim);
          const drawn = len * (1 - 2 * trim) * draw;
          return (
            <line
              key={`${from}-${to}`}
              x1={ax}
              y1={ay}
              x2={bx}
              y2={by}
              stroke={C.dim}
              strokeWidth={3}
              strokeDasharray={
                dashed ? "10 10" : `${len} ${len}`
              }
              strokeDashoffset={dashed ? 0 : len - drawn}
              opacity={dashed ? draw * 0.7 : 0.7}
              markerEnd={draw > 0.95 ? "url(#arrow)" : undefined}
              markerStart={both && draw > 0.95 ? "url(#arrow)" : undefined}
            />
          );
        })}

        {/* Fase B: oplichtende flows */}
        {FLOWS.map((flow) => {
          const t = interpolate(
            local,
            [flow.start, flow.start + FLOW_DRAW],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const fade = interpolate(
            local,
            [
              flow.start + FLOW_DRAW + FLOW_HOLD,
              flow.start + FLOW_DRAW + FLOW_HOLD + 24,
            ],
            [1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          if (t === 0 || fade === 0) return null;
          const pts = flow.path.map((n) => ({
            x: NODES[n].x,
            y: NODES[n].y + flow.dy,
          }));
          const total = polyLength(pts);
          const head = along(pts, t);
          const points = pts.map((p) => `${p.x},${p.y}`).join(" ");
          return (
            <g key={flow.name} opacity={fade}>
              <polyline
                points={points}
                fill="none"
                stroke={flow.colour}
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={total}
                strokeDashoffset={total - total * t}
                opacity={0.9}
              />
              <circle cx={head.x} cy={head.y} r={13} fill={flow.colour} />
              <circle
                cx={head.x}
                cy={head.y}
                r={26}
                fill="none"
                stroke={flow.colour}
                strokeWidth={2.5}
                opacity={0.5}
              />
            </g>
          );
        })}
      </svg>

      {/* Nodes bovenop de lijnen */}
      {Object.entries(NODES).map(([id, node], i) => {
        const s = spring({
          frame: local - 8 - i * 9,
          fps,
          config: { damping: 200 },
        });
        // Node licht mee op met de flow die er nu doorheen loopt.
        const activeFlow = FLOWS.find(
          (f) =>
            f.path.includes(id) &&
            local > f.start &&
            local < f.start + FLOW_DRAW + FLOW_HOLD + 24
        );
        const border = activeFlow
          ? activeFlow.colour
          : node.accent ?? C.border;
        return (
          <div
            key={id}
            style={{
              position: "absolute",
              left: node.x,
              top: node.y,
              transform: `translate(-50%, -50%) scale(${interpolate(
                s,
                [0, 1],
                [0.75, 1]
              )})`,
              opacity: s,
              background: C.card,
              border: `2.5px solid ${border}`,
              borderRadius: 18,
              padding: "16px 30px",
              fontFamily: FONT,
              textAlign: "center",
              boxShadow: activeFlow
                ? `0 0 44px ${activeFlow.colour}33`
                : "0 14px 40px rgba(0,0,0,0.4)",
            }}
          >
            <div style={{ color: C.text, fontSize: 30, fontWeight: 800 }}>
              {node.label}
            </div>
            {node.sub ? (
              <div
                style={{
                  color: C.dim,
                  fontSize: 19,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                {node.sub}
              </div>
            ) : null}
          </div>
        );
      })}

      {/* Tag bij de webapp zodra de flow daar aankomt */}
      {FLOWS.map((flow) => {
        const arrive = flow.start + FLOW_DRAW * 0.72;
        const s = spring({
          frame: local - arrive,
          fps,
          config: { damping: 200 },
        });
        const fade = interpolate(
          local,
          [
            flow.start + FLOW_DRAW + FLOW_HOLD,
            flow.start + FLOW_DRAW + FLOW_HOLD + 24,
          ],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (local < arrive || fade === 0) return null;
        const at = NODES[flow.tagAt];
        return (
          <div
            key={flow.name}
            style={{
              position: "absolute",
              left: at.x,
              top: at.y - 108 + flow.tagDy,
              transform: `translate(-50%, 0) translateY(${interpolate(
                s,
                [0, 1],
                [14, 0]
              )}px)`,
              opacity: s * fade,
              background: C.bg,
              border: `2px solid ${flow.colour}`,
              color: flow.colour,
              borderRadius: 999,
              padding: "10px 24px",
              fontFamily: FONT,
              fontSize: 24,
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {flow.tag}
          </div>
        );
      })}

      {/* Flow-label onderin */}
      {LABELS.map((label, li) => {
        const s = spring({
          frame: local - label.start,
          fps,
          config: { damping: 200 },
        });
        const fade = interpolate(
          local,
          [label.end - 24, label.end],
          [1, 0],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
        );
        if (local < label.start || fade === 0) return null;
        return (
          <div
            key={li}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 950,
              textAlign: "center",
              fontFamily: FONT,
              opacity: s * fade,
              transform: `translateY(${interpolate(s, [0, 1], [18, 0])}px)`,
            }}
          >
            {label.parts.map((p, pi) => (
              <span
                key={pi}
                style={{
                  color: p.colour,
                  fontSize: 40,
                  fontWeight: 800,
                  letterSpacing: -0.6,
                }}
              >
                {p.text}
              </span>
            ))}
            <span
              style={{
                color: C.dim,
                fontSize: 32,
                fontWeight: 600,
                marginLeft: 22,
              }}
            >
              {label.rest}
            </span>
          </div>
        );
      })}
    </>
  );
};
