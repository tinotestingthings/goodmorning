import React from "react";
import { interpolate, spring, useVideoConfig } from "remotion";
import { C, FONT } from "../../theme";

/** Beat 0 — titelkaart, ~4 s. Alleen naam + één regel; Tinus praat live. */
export const W0Title: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const inTitle = spring({ frame: local - 6, fps, config: { damping: 200 } });
  const inSub = spring({ frame: local - 26, fps, config: { damping: 200 } });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 26,
        fontFamily: FONT,
      }}
    >
      <div
        style={{
          color: C.text,
          fontSize: 110,
          fontWeight: 800,
          letterSpacing: -3,
          opacity: inTitle,
          transform: `translateY(${interpolate(inTitle, [0, 1], [30, 0])}px)`,
        }}
      >
        goodmorning
      </div>
      <div
        style={{
          color: C.dim,
          fontSize: 38,
          fontWeight: 500,
          letterSpacing: -0.5,
          opacity: inSub,
          transform: `translateY(${interpolate(inSub, [0, 1], [20, 0])}px)`,
        }}
      >
        één systeem voor kennis, nieuws, taken en apps
      </div>
    </div>
  );
};
