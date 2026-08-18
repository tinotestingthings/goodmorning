import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { UTILITY_APPS } from "../data";
import { C, FONT, W, H } from "../theme";

/**
 * Beat 6 — pull back and show the whole thing as one ring, with the return arrow
 * from `30 Tasks` back into the app (tasks live there too, so the loop closes).
 *
 * The utility apps hang off the app node as a named category only. They are
 * deliberately NOT explained — mentioning them signals the ecosystem is wider
 * than this one flow, without spending seconds we do not have.
 */

const NODES = [
  "Bronnen",
  "Scheduled tasks",
  "00 Inbox",
  "Goodmorning app",
  "Triage",
  "Vault",
];

const CX = W / 2;
const CY = 520;
const R = 285;

const pointAt = (i: number) => {
  const angle = (i / NODES.length) * Math.PI * 2 - Math.PI / 2;
  return { x: CX + Math.cos(angle) * R, y: CY + Math.sin(angle) * R };
};

export const Beat6Loop: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  const ringIn = spring({ frame: local, fps, config: { damping: 200 } });
  const sweep = interpolate(local, [24, 92], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const circumference = 2 * Math.PI * R;
  const appNode = pointAt(3);

  return (
    <>
      <svg
        width={W}
        height={H}
        style={{ position: "absolute", inset: 0, opacity: ringIn }}
      >
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={C.border}
          strokeWidth={3}
        />
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke={C.keep}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - circumference * sweep}
          transform={`rotate(-90 ${CX} ${CY})`}
        />
      </svg>

      {NODES.map((label, i) => {
        const p = pointAt(i);
        const s = spring({
          frame: local - 10 - i * 7,
          fps,
          config: { damping: 200 },
        });
        const isApp = i === 3;
        return (
          <div
            key={label}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              transform: `translate(-50%, -50%) scale(${interpolate(
                s,
                [0, 1],
                [0.7, 1]
              )})`,
              opacity: s,
              background: C.card,
              border: `2px solid ${isApp ? C.keep : C.border}`,
              borderRadius: 14,
              padding: "14px 24px",
              fontFamily: FONT,
              fontSize: 27,
              fontWeight: 700,
              color: isApp ? C.text : C.dim,
              whiteSpace: "nowrap",
            }}
          >
            {label}
          </div>
        );
      })}

      {/* Utility apps: named as a category, hanging off the app node. */}
      <div
        style={{
          position: "absolute",
          left: appNode.x + 210,
          top: appNode.y - 22,
          opacity: spring({
            frame: local - 46,
            fps,
            config: { damping: 200 },
          }),
          fontFamily: FONT,
        }}
      >
        <div
          style={{
            color: C.dim,
            fontSize: 22,
            fontWeight: 700,
            marginBottom: 10,
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
        >
          + utility apps
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, maxWidth: 330 }}>
          {UTILITY_APPS.map((a) => (
            <span
              key={a}
              style={{
                background: C.card,
                border: `1.5px solid ${C.border}`,
                borderRadius: 999,
                padding: "7px 15px",
                color: C.dim,
                fontSize: 19,
                fontWeight: 600,
              }}
            >
              {a}
            </span>
          ))}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 942,
          textAlign: "center",
          fontFamily: FONT,
          color: C.text,
          fontSize: 44,
          fontWeight: 700,
          letterSpacing: -0.8,
          opacity: spring({ frame: local - 58, fps, config: { damping: 200 } }),
        }}
      >
        Van ruim 60 bronnen naar één beslissing per kaart.
      </div>
    </>
  );
};
