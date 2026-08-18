import React from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { PhoneFrame } from "../components/PhoneFrame";
import { C, FONT } from "../theme";

/**
 * Beat 3 — landing in `00 Inbox`, then the daily digest publishing feed.json.
 * The "wacht op mij" badge is the most important frame in the whole video: it
 * is what separates this from an RSS reader. Nothing files itself.
 */
export const Beat3Inbox: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  const lockIn = spring({ frame: local - 74, fps, config: { damping: 14, mass: 0.7 } });
  const travel = interpolate(local, [126, 196], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const phoneIn = spring({ frame: local - 120, fps, config: { damping: 200 } });

  const pathX = interpolate(travel, [0, 1], [640, 1360]);
  const pathY = interpolate(travel, [0, 0.5, 1], [520, 400, 560]);

  return (
    <>
      <Caption delay={4} outAt={212} sub="niets wordt automatisch gearchiveerd">
        De kandidaten landen in mijn inbox
      </Caption>

      {/* inbox tray with stacked cards */}
      <div style={{ position: "absolute", left: 250, top: 380 }}>
        <div
          style={{
            width: 420,
            height: 300,
            borderRadius: 22,
            background: C.card,
            border: `2px solid ${C.border}`,
            position: "relative",
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const s = spring({
              frame: local - 16 - i * 11,
              fps,
              config: { damping: 200 },
            });
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: 34,
                  top: 210 - i * 42,
                  width: 352,
                  height: 34,
                  borderRadius: 10,
                  background: C.bg,
                  border: `1.5px solid ${C.border}`,
                  opacity: s,
                  transform: `translateY(${interpolate(s, [0, 1], [-150, 0])}px)`,
                }}
              />
            );
          })}
        </div>
        <div
          style={{
            fontFamily: FONT,
            color: C.text,
            fontSize: 30,
            fontWeight: 700,
            marginTop: 18,
            textAlign: "center",
          }}
        >
          00 Inbox
        </div>

        {/* the badge that carries the argument */}
        <div
          style={{
            position: "absolute",
            right: -80,
            top: -34,
            opacity: lockIn,
            transform: `scale(${interpolate(lockIn, [0, 1], [0.6, 1])}) rotate(-6deg)`,
            background: C.bg,
            border: `2px solid ${C.skip}`,
            color: C.skip,
            borderRadius: 999,
            padding: "12px 22px",
            fontFamily: FONT,
            fontSize: 25,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          wacht op mij
        </div>
      </div>

      {/* feed.json travelling to the phone */}
      <div
        style={{
          position: "absolute",
          left: pathX,
          top: pathY,
          opacity: interpolate(travel, [0, 0.08, 0.9, 1], [0, 1, 1, 0]),
          transform: "translate(-50%, -50%)",
          background: C.card,
          border: `1.5px solid ${C.keep}`,
          color: C.keep,
          borderRadius: 12,
          padding: "12px 20px",
          fontFamily: FONT,
          fontSize: 25,
          fontWeight: 700,
        }}
      >
        feed.json
      </div>

      <div
        style={{
          position: "absolute",
          left: 1420,
          top: 300,
          opacity: phoneIn,
          transform: `translateY(${interpolate(phoneIn, [0, 1], [70, 0])}px)`,
        }}
      >
        <PhoneFrame width={230}>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  height: 92,
                  borderRadius: 14,
                  background: C.card,
                  border: `1.5px solid ${C.border}`,
                }}
              />
            ))}
          </div>
        </PhoneFrame>
      </div>

      <div
        style={{
          position: "absolute",
          left: 760,
          top: 690,
          fontFamily: FONT,
          color: C.dim,
          fontSize: 26,
          fontWeight: 600,
          opacity: interpolate(local, [110, 140], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Daily digest · 06:45
      </div>
    </>
  );
};
