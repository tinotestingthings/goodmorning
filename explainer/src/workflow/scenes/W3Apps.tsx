import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../../components/Caption";
import { C, FONT } from "../../theme";

/**
 * Beat 3 — de utility apps: zelfgebouwde appjes om dingen te leren en bij te
 * houden. Tegels springen één voor één binnen; de namen zijn de echte apps.
 */

export const APP_TILES = [
  { name: "NoteSprint", what: "noten leren lezen", icon: "𝄞" },
  { name: "Kangaroo Gym", what: "sportschool bijhouden", icon: "◆" },
  { name: "Vogelspotinus", what: "vogels herkennen", icon: "❋" },
  { name: "ChordSprint", what: "akkoorden trainen", icon: "♪" },
  { name: "WijnWijs", what: "wijn onthouden", icon: "◗" },
  { name: "Event Tracker", what: "uitjes plannen", icon: "✦" },
];

const ACCENTS = [C.skip, C.keep, C.dismiss, C.skip, C.dismiss, C.keep];

export const W3Apps: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      <Caption delay={4} sub="zelf gebouwd, elk met eigen opslag" outAt={272}>
        Apps om te leren en bij te houden
      </Caption>

      <div
        style={{
          position: "absolute",
          top: 330,
          left: 0,
          right: 0,
          display: "grid",
          gridTemplateColumns: "repeat(3, 420px)",
          justifyContent: "center",
          gap: 44,
        }}
      >
        {APP_TILES.map((app, i) => {
          const s = spring({
            frame: local - 24 - i * 14,
            fps,
            config: { damping: 200 },
          });
          const accent = ACCENTS[i];
          return (
            <div
              key={app.name}
              style={{
                opacity: s,
                transform: `translateY(${interpolate(
                  s,
                  [0, 1],
                  [46, 0]
                )}px) scale(${interpolate(s, [0, 1], [0.92, 1])})`,
                background: C.card,
                border: `2px solid ${C.border}`,
                borderRadius: 24,
                padding: "34px 34px 30px",
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: 20,
                  background: `${accent}1c`,
                  border: `2px solid ${accent}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 38,
                  color: accent,
                  fontWeight: 700,
                }}
              >
                {app.icon}
              </div>
              <div
                style={{
                  color: C.text,
                  fontSize: 33,
                  fontWeight: 800,
                  letterSpacing: -0.5,
                  marginTop: 22,
                }}
              >
                {app.name}
              </div>
              <div
                style={{
                  color: C.dim,
                  fontSize: 24,
                  fontWeight: 500,
                  marginTop: 8,
                }}
              >
                {app.what}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};
