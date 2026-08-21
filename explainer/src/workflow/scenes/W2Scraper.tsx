import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../../components/Caption";
import { SourcePill } from "../../components/SourcePill";
import { SOURCES } from "../../data";
import { C, FONT, H } from "../../theme";

/**
 * Beat 2 — de scraper in Claude. Bronnen stromen links een Claude-node in;
 * rechts komen er kaarten uit met samenvatting + relevantiescore.
 */

const IN_PILLS = SOURCES.slice(0, 14);

const OUT_CARDS = [
  { title: "ATT-toezeggingen bindend verklaard", score: 9, hot: true },
  { title: "3,64 mln records uit Entra-tenants", score: 8, hot: true },
  { title: "Stripe koopt OpenRouter", score: 4, hot: false },
];

const CLAUDE_X = 880;
const CLAUDE_Y = 560;

export const W2Scraper: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const nodeIn = spring({ frame: local - 10, fps, config: { damping: 200 } });

  return (
    <>
      <Caption delay={4} sub="scrapet, vat samen, beoordeelt op relevantie" outAt={332}>
        Een scraper, gebouwd in Claude
      </Caption>

      {/* Bronnen die naar binnen drijven */}
      {IN_PILLS.map((label, i) => {
        const start = 30 + i * 9;
        const t = interpolate(local, [start, start + 70], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const lane = i % 5;
        const y0 = 300 + lane * 110 + (i % 3) * 24;
        const x = interpolate(t, [0, 1], [140 + (i % 4) * 60, CLAUDE_X - 60]);
        const y = interpolate(t, [0, 1], [y0, CLAUDE_Y]);
        const opacity =
          t === 0 ? 0 : interpolate(t, [0, 0.12, 0.82, 1], [0, 1, 1, 0]);
        return (
          <SourcePill
            key={label}
            label={label}
            x={x}
            y={y}
            opacity={opacity}
            scale={interpolate(t, [0, 1], [1, 0.55])}
          />
        );
      })}

      {/* Claude-node */}
      <div
        style={{
          position: "absolute",
          left: CLAUDE_X,
          top: CLAUDE_Y,
          transform: `translate(-50%, -50%) scale(${interpolate(
            nodeIn,
            [0, 1],
            [0.8, 1]
          )})`,
          opacity: nodeIn,
          background: C.card,
          border: `2.5px solid ${C.keep}`,
          borderRadius: 26,
          padding: "30px 44px",
          fontFamily: FONT,
          textAlign: "center",
          boxShadow: `0 0 60px ${C.keep}22`,
        }}
      >
        <div style={{ color: C.keep, fontSize: 40, fontWeight: 800 }}>✳</div>
        <div style={{ color: C.text, fontSize: 34, fontWeight: 800, marginTop: 4 }}>
          Claude
        </div>
        <div style={{ color: C.dim, fontSize: 21, fontWeight: 600, marginTop: 6 }}>
          scheduled task
        </div>
      </div>

      {/* Beoordeelde kaarten eruit */}
      {OUT_CARDS.map((card, i) => {
        const start = 140 + i * 45;
        const s = spring({ frame: local - start, fps, config: { damping: 200 } });
        const y = 330 + i * 160;
        return (
          <div
            key={card.title}
            style={{
              position: "absolute",
              left: interpolate(s, [0, 1], [CLAUDE_X + 40, 1210]),
              top: y,
              width: 520,
              opacity: s,
              background: C.card,
              border: `2px solid ${card.hot ? C.keep : C.border}`,
              borderRadius: 20,
              padding: "20px 26px",
              fontFamily: FONT,
              display: "flex",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  color: C.text,
                  fontSize: 24,
                  fontWeight: 700,
                  lineHeight: 1.25,
                }}
              >
                {card.title}
              </div>
              <div
                style={{
                  height: 8,
                  width: "70%",
                  borderRadius: 999,
                  background: C.border,
                  marginTop: 12,
                }}
              />
            </div>
            <div
              style={{
                minWidth: 96,
                textAlign: "center",
                background: card.hot ? `${C.keep}1c` : "transparent",
                border: `1.5px solid ${card.hot ? C.keep : C.border}`,
                borderRadius: 14,
                padding: "10px 12px",
              }}
            >
              <div
                style={{
                  color: card.hot ? C.keep : C.dim,
                  fontSize: 30,
                  fontWeight: 800,
                }}
              >
                {card.score}
              </div>
              <div style={{ color: C.dim, fontSize: 16, fontWeight: 600 }}>
                relevantie
              </div>
            </div>
          </div>
        );
      })}

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: H - 150,
          textAlign: "center",
          fontFamily: FONT,
          color: C.dim,
          fontSize: 30,
          fontWeight: 600,
          opacity: spring({ frame: local - 250, fps, config: { damping: 200 } }),
        }}
      >
        elke ochtend automatisch, vóór het ontbijt
      </div>
    </>
  );
};
