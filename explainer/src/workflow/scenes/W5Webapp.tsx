import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../../components/Caption";
import { C, FONT } from "../../theme";

/**
 * Beat 5 — alles komt samen in één web-app. Vijf chips (de vorige beats)
 * vliegen naar het midden, één browserkaart "goodmorning" blijft over.
 */

const PARTS = [
  { label: "second brain", from: { x: 320, y: 300 } },
  { label: "nieuws-scraper", from: { x: 1600, y: 300 } },
  { label: "leer-apps", from: { x: 250, y: 800 } },
  { label: "agenda", from: { x: 1670, y: 800 } },
  { label: "compliance", from: { x: 960, y: 190 } },
];

const CX = 960;
const CY = 600;

export const W5Webapp: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const appIn = spring({ frame: local - 80, fps, config: { damping: 200 } });

  return (
    <>
      <Caption delay={4} sub="één plek, één ochtendritueel" outAt={212}>
        Eén web-app brengt het samen
      </Caption>

      {PARTS.map((p, i) => {
        const t = spring({
          frame: local - 26 - i * 7,
          fps,
          config: { damping: 60, mass: 0.8 },
        });
        const x = interpolate(t, [0, 1], [p.from.x, CX]);
        const y = interpolate(t, [0, 1], [p.from.y, CY]);
        return (
          <div
            key={p.label}
            style={{
              position: "absolute",
              left: x,
              top: y,
              transform: "translate(-50%, -50%)",
              opacity: interpolate(t, [0, 0.1, 0.85, 1], [0, 1, 1, 0]),
              background: C.card,
              border: `1.5px solid ${C.border}`,
              borderRadius: 999,
              padding: "12px 26px",
              fontFamily: FONT,
              color: C.dim,
              fontSize: 26,
              fontWeight: 600,
              whiteSpace: "nowrap",
            }}
          >
            {p.label}
          </div>
        );
      })}

      {/* Browserkaart */}
      <div
        style={{
          position: "absolute",
          left: CX,
          top: CY,
          transform: `translate(-50%, -50%) scale(${interpolate(
            appIn,
            [0, 1],
            [0.7, 1]
          )})`,
          opacity: appIn,
          width: 760,
          background: C.card,
          border: `2.5px solid ${C.keep}`,
          borderRadius: 26,
          overflow: "hidden",
          fontFamily: FONT,
          boxShadow: `0 30px 90px rgba(0,0,0,0.55), 0 0 80px ${C.keep}18`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "16px 22px",
            borderBottom: `1.5px solid ${C.border}`,
          }}
        >
          {[C.dismiss, "#d9a441", C.keep].map((c) => (
            <span
              key={c}
              style={{ width: 14, height: 14, borderRadius: 999, background: c }}
            />
          ))}
          <span
            style={{
              marginLeft: 14,
              color: C.dim,
              fontSize: 20,
              fontWeight: 600,
            }}
          >
            goodmorning — daily digest
          </span>
        </div>
        <div style={{ padding: "30px 34px 36px", textAlign: "center" }}>
          <div
            style={{
              color: C.text,
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: -1.4,
            }}
          >
            goodmorning
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 12,
              marginTop: 24,
              flexWrap: "wrap",
            }}
          >
            {["digest", "agenda", "radar", "apps"].map((tab, i) => (
              <span
                key={tab}
                style={{
                  background: i === 0 ? `${C.keep}1c` : "transparent",
                  border: `1.5px solid ${i === 0 ? C.keep : C.border}`,
                  color: i === 0 ? C.keep : C.dim,
                  borderRadius: 999,
                  padding: "9px 24px",
                  fontSize: 23,
                  fontWeight: 700,
                }}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
