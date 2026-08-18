import React from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { Funnel } from "../components/Funnel";
import { C, FONT, W } from "../theme";

/**
 * Beat 2 — the two scheduled tasks. Everything from beat 1 gets pulled through
 * two funnels; a counter makes the reduction concrete.
 */
export const Beat2Tasks: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  const funnelIn = spring({ frame: local - 10, fps, config: { damping: 200 } });
  const flow = interpolate(local, [40, 190], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  // 60+ -> 4. Counts down as the flow runs.
  const count = Math.round(
    interpolate(flow, [0.15, 0.9], [62, 4], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );

  const cardsIn = spring({ frame: local - 150, fps, config: { damping: 200 } });

  return (
    <>
      <Caption delay={4} outAt={268} sub="lezen elke ochtend mee">
        Twee scheduled tasks
      </Caption>

      <div
        style={{
          position: "absolute",
          left: 150,
          top: 330,
          display: "flex",
          flexDirection: "column",
          gap: 60,
          opacity: funnelIn,
          transform: `translateX(${interpolate(funnelIn, [0, 1], [-60, 0])}px)`,
        }}
      >
        <Funnel
          label="Privacy Watch"
          sub="dagelijks 06:30"
          progress={interpolate(flow, [0, 0.75], [0, 1], {
            extrapolateRight: "clamp",
          })}
        />
        <Funnel
          label="Compliance Radar"
          sub="ma & do 06:30"
          progress={interpolate(flow, [0.15, 0.9], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          })}
        />
      </div>

      {/* counter */}
      <div
        style={{
          position: "absolute",
          left: 880,
          top: 452,
          fontFamily: FONT,
          opacity: interpolate(flow, [0.05, 0.2], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span
            style={{
              color: C.dim,
              fontSize: 76,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: -2,
            }}
          >
            {count}
          </span>
          <span style={{ color: C.dim, fontSize: 30, fontWeight: 600 }}>
            bronnen gelezen
          </span>
        </div>
        <div style={{ color: C.dim, fontSize: 40, margin: "6px 0 4px" }}>↓</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <span
            style={{
              color: C.keep,
              fontSize: 76,
              fontWeight: 800,
              fontVariantNumeric: "tabular-nums",
              letterSpacing: -2,
            }}
          >
            4
          </span>
          <span style={{ color: C.text, fontSize: 30, fontWeight: 600 }}>
            kaarten overgehouden
          </span>
        </div>
      </div>

      {/* the surviving cards */}
      <div
        style={{
          position: "absolute",
          left: W - 470,
          top: 372,
          display: "flex",
          flexDirection: "column",
          gap: 18,
        }}
      >
        {[0, 1, 2, 3].map((i) => {
          const s = spring({
            frame: local - 150 - i * 12,
            fps,
            config: { damping: 200 },
          });
          return (
            <div
              key={i}
              style={{
                width: 320,
                height: 76,
                borderRadius: 16,
                background: C.card,
                border: `1.5px solid ${C.border}`,
                opacity: s * cardsIn,
                transform: `translateX(${interpolate(s, [0, 1], [70, 0])}px)`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 9,
                padding: "0 20px",
              }}
            >
              <div
                style={{
                  height: 10,
                  width: "78%",
                  borderRadius: 999,
                  background: C.border,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: "52%",
                  borderRadius: 999,
                  background: C.border,
                }}
              />
            </div>
          );
        })}
      </div>
    </>
  );
};
