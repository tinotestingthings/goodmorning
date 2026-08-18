import React from "react";
import { C, FONT } from "../theme";

export const TriageCard: React.FC<{
  title: string;
  source: string;
  date: string;
  style?: React.CSSProperties;
  /** 0 = neutral, -1 = fully left (dismiss), 1 = fully right (keep) */
  swipe?: number;
}> = ({ title, source, date, style, swipe = 0 }) => {
  const tint =
    swipe > 0.02 ? C.keep : swipe < -0.02 ? C.dismiss : C.border;
  const tintStrength = Math.min(Math.abs(swipe), 1);

  return (
    <div
      style={{
        background: C.card,
        border: `2px solid ${tint}`,
        borderRadius: 26,
        padding: "26px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        fontFamily: FONT,
        boxShadow: `0 18px 50px rgba(0,0,0,0.45), inset 0 0 0 1000px ${tint}${Math.round(
          tintStrength * 22
        )
          .toString(16)
          .padStart(2, "0")}`,
        ...style,
      }}
    >
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: 999,
            background: C.skip,
          }}
        />
        <span style={{ color: C.dim, fontSize: 20, fontWeight: 600 }}>
          {source} · {date}
        </span>
      </div>
      <div
        style={{
          color: C.text,
          fontSize: 30,
          fontWeight: 700,
          lineHeight: 1.24,
          letterSpacing: -0.4,
        }}
      >
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 4 }}>
        {[1, 0.94, 0.88, 0.55].map((w, i) => (
          <div
            key={i}
            style={{
              height: 9,
              width: `${w * 100}%`,
              borderRadius: 999,
              background: C.border,
            }}
          />
        ))}
      </div>
    </div>
  );
};
