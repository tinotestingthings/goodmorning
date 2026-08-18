import React from "react";
import { C, FONT } from "../theme";

/** A labelled funnel: wide mouth on the left, narrow spout on the right. */
export const Funnel: React.FC<{
  label: string;
  sub: string;
  progress: number;
}> = ({ label, sub, progress }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
    <svg width={210} height={150} viewBox="0 0 210 150">
      <path
        d="M6 8 L150 60 L204 60 L204 90 L150 90 L6 142 Z"
        fill={C.card}
        stroke={C.border}
        strokeWidth={2.5}
      />
      <path
        d="M6 8 L150 60 L204 60 L204 90 L150 90 L6 142 Z"
        fill="none"
        stroke={C.keep}
        strokeWidth={2.5}
        strokeDasharray={900}
        strokeDashoffset={900 - 900 * progress}
        opacity={0.8}
      />
    </svg>
    <div style={{ fontFamily: FONT }}>
      <div style={{ color: C.text, fontSize: 30, fontWeight: 700 }}>{label}</div>
      <div style={{ color: C.dim, fontSize: 22, fontWeight: 500, marginTop: 4 }}>
        {sub}
      </div>
    </div>
  </div>
);
