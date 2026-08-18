import React from "react";
import { interpolate, random, spring, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { SourcePill } from "../components/SourcePill";
import { SOURCES } from "../data";
import { W, H } from "../theme";

/**
 * Beat 1 — the noise. Source names drift in from every edge until the frame is
 * uncomfortably full. That discomfort is the point: it sets up the problem.
 */
export const Beat1Sources: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();

  return (
    <>
      <Caption delay={6} outAt={208}>
        Ruim 60 bronnen. Elke dag.
      </Caption>

      {SOURCES.map((name, i) => {
        const seed = `src-${i}`;
        const delay = 26 + i * 2.6;
        const enter = spring({
          frame: local - delay,
          fps,
          config: { damping: 200, mass: 0.9 },
        });

        // Final resting place: a loose grid with jitter, avoiding the caption band.
        const cols = 7;
        const col = i % cols;
        const row = Math.floor(i / cols);
        const jitterX = (random(seed + "x") - 0.5) * 130;
        const jitterY = (random(seed + "y") - 0.5) * 60;
        const targetX = 190 + col * ((W - 380) / (cols - 1)) + jitterX;
        const targetY = 300 + row * 92 + jitterY;

        // Start position: pushed far outside the nearest edge.
        const fromX = targetX + (random(seed + "fx") - 0.5) * 2400;
        const fromY = targetY + (random(seed + "fy") - 0.5) * 1600;

        return (
          <SourcePill
            key={name}
            label={name}
            x={interpolate(enter, [0, 1], [fromX, targetX])}
            y={interpolate(enter, [0, 1], [fromY, targetY])}
            opacity={enter * interpolate(local, [200, 236], [1, 0.25], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            })}
            scale={interpolate(enter, [0, 1], [0.7, 1])}
            rotate={(random(seed + "r") - 0.5) * 6}
          />
        );
      })}
    </>
  );
};
