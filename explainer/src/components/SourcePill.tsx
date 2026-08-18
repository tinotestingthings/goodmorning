import React from "react";
import { C, FONT } from "../theme";

export const SourcePill: React.FC<{
  label: string;
  x: number;
  y: number;
  opacity: number;
  scale: number;
  rotate?: number;
}> = ({ label, x, y, opacity, scale, rotate = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      opacity,
      transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
      background: C.card,
      border: `1.5px solid ${C.border}`,
      borderRadius: 999,
      padding: "10px 20px",
      color: C.dim,
      fontFamily: FONT,
      fontSize: 22,
      fontWeight: 600,
      whiteSpace: "nowrap",
    }}
  >
    {label}
  </div>
);
