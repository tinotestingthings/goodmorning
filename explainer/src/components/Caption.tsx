import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../theme";

/** Headline text for a beat. Springs up from below, fades out at the end. */
export const Caption: React.FC<{
  children: React.ReactNode;
  sub?: React.ReactNode;
  delay?: number;
  outAt?: number;
  align?: "center" | "left";
  y?: number;
}> = ({ children, sub, delay = 0, outAt, align = "center", y = 96 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200, mass: 0.6 },
  });
  const exit =
    outAt === undefined
      ? 1
      : interpolate(frame, [outAt, outAt + 18], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

  return (
    <div
      style={{
        position: "absolute",
        top: y,
        left: 0,
        right: 0,
        textAlign: align,
        paddingLeft: align === "left" ? 140 : 0,
        fontFamily: FONT,
        opacity: enter * exit,
        transform: `translateY(${interpolate(enter, [0, 1], [26, 0])}px)`,
      }}
    >
      <div
        style={{
          color: C.text,
          fontSize: 58,
          fontWeight: 700,
          letterSpacing: -1.2,
          lineHeight: 1.15,
        }}
      >
        {children}
      </div>
      {sub ? (
        <div
          style={{
            color: C.dim,
            fontSize: 30,
            fontWeight: 500,
            marginTop: 14,
            letterSpacing: -0.3,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
};
