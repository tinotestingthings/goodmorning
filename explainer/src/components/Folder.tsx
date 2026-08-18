import React from "react";
import { C, FONT } from "../theme";

export const Folder: React.FC<{
  label: string;
  accent: string;
  scale?: number;
  dim?: boolean;
  icon?: string;
}> = ({ label, accent, scale = 1, dim = false, icon }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 16,
      transform: `scale(${scale})`,
      opacity: dim ? 0.55 : 1,
    }}
  >
    <div
      style={{
        width: 190,
        height: 140,
        borderRadius: 18,
        background: C.card,
        border: `2px solid ${accent}`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -12,
          left: 22,
          width: 66,
          height: 14,
          borderRadius: "8px 8px 0 0",
          background: accent,
          opacity: 0.85,
        }}
      />
      {icon ? (
        <span style={{ fontSize: 46, color: accent, fontWeight: 700 }}>
          {icon}
        </span>
      ) : null}
    </div>
    <div
      style={{
        fontFamily: FONT,
        fontSize: 26,
        fontWeight: 600,
        color: C.text,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </div>
  </div>
);
