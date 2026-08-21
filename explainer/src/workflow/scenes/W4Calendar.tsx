import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../../components/Caption";
import { PhoneFrame } from "../../components/PhoneFrame";
import { C, FONT } from "../../theme";

/**
 * Beat 4 — de agenda-app: taken, projecten en klusjes in huis op één plek.
 * Regels schuiven binnen; één klusje wordt live afgevinkt.
 */

const ROWS = [
  { time: "09:00", text: "Sprint review", tag: "werk", accent: C.skip, check: false },
  { time: "12:30", text: "Dakgoot nabellen", tag: "klusje", accent: C.dismiss, check: true },
  { time: "15:00", text: "Event-redesign", tag: "project", accent: C.keep, check: false },
  { time: "17:30", text: "Sportschool", tag: "gewoonte", accent: C.skip, check: false },
  { time: "20:00", text: "Plantjes water geven", tag: "klusje", accent: C.dismiss, check: false },
];

const CHECK_AT = 170;

export const W4Calendar: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const phoneIn = spring({ frame: local, fps, config: { damping: 200 } });

  return (
    <>
      <Caption delay={4} sub="taken, projecten en klusjes in huis" outAt={272}>
        Eén agenda voor alles
      </Caption>

      <div
        style={{
          position: "absolute",
          left: "50%",
          top: 262,
          transform: `translateX(-50%) scale(${interpolate(
            phoneIn,
            [0, 1],
            [0.9, 1]
          )})`,
          opacity: phoneIn,
        }}
      >
        <PhoneFrame width={400}>
          <div style={{ padding: "16px 24px", fontFamily: FONT }}>
            <div
              style={{
                color: C.text,
                fontSize: 26,
                fontWeight: 800,
                letterSpacing: -0.4,
                marginBottom: 16,
              }}
            >
              Woensdag 19 aug
            </div>
            {ROWS.map((row, i) => {
              const s = spring({
                frame: local - 30 - i * 13,
                fps,
                config: { damping: 200 },
              });
              const checked =
                row.check &&
                interpolate(local, [CHECK_AT, CHECK_AT + 12], [0, 1], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                });
              return (
                <div
                  key={row.text}
                  style={{
                    opacity: s,
                    transform: `translateX(${interpolate(s, [0, 1], [40, 0])}px)`,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: C.card,
                    border: `1.5px solid ${C.border}`,
                    borderRadius: 16,
                    padding: "13px 14px",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 8,
                      border: `2px solid ${checked ? C.keep : C.border}`,
                      background: checked ? C.keep : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: C.bg,
                      fontSize: 15,
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {checked ? "✓" : ""}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        color: C.text,
                        fontSize: 19,
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        textDecoration: checked ? "line-through" : "none",
                        opacity: checked ? 0.55 : 1,
                      }}
                    >
                      {row.text}
                    </div>
                    <div style={{ color: C.dim, fontSize: 15, marginTop: 3 }}>
                      {row.time}
                    </div>
                  </div>
                  <span
                    style={{
                      color: row.accent,
                      border: `1.5px solid ${row.accent}`,
                      background: `${row.accent}18`,
                      borderRadius: 999,
                      padding: "4px 11px",
                      fontSize: 14,
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {row.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </PhoneFrame>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 952,
          textAlign: "center",
          fontFamily: FONT,
          color: C.dim,
          fontSize: 30,
          fontWeight: 600,
          opacity: spring({ frame: local - 200, fps, config: { damping: 200 } }),
        }}
      >
        gesynct — telefoon, iPad en laptop zien hetzelfde
      </div>
    </>
  );
};
