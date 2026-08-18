import React from "react";
import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import { Caption } from "../components/Caption";
import { Folder } from "../components/Folder";
import { C, FONT } from "../theme";

/**
 * Beat 5 — every swipe becomes a row in Supabase `actions`, and the next
 * morning's digest writes it back into the vault as a source, an archive entry
 * or a task. A kept card lands as a full source note, not a bookmark.
 */

const ROWS = [
  { type: "keep", colour: C.keep, target: 0 },
  { type: "dismiss", colour: C.dismiss, target: 1 },
  { type: "task", colour: C.skip, target: 2 },
];

const FOLDER_X = [1120, 1420, 1720];

export const Beat5Vault: React.FC<{ local: number }> = ({ local }) => {
  const { fps } = useVideoConfig();
  const tableIn = spring({ frame: local - 4, fps, config: { damping: 200 } });

  return (
    <>
      <Caption delay={2} outAt={212} sub="de digest schrijft mijn keuze terug">
        Supabase · actions
      </Caption>

      <div
        style={{
          position: "absolute",
          left: 190,
          top: 400,
          opacity: tableIn,
          transform: `translateX(${interpolate(tableIn, [0, 1], [-50, 0])}px)`,
        }}
      >
        {ROWS.map((r, i) => {
          const fly = interpolate(local, [70 + i * 18, 150 + i * 18], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.inOut(Easing.cubic),
          });
          const dx = fly * (FOLDER_X[r.target] - 300);
          const dy = fly * (i === 0 ? -40 : i === 1 ? 10 : 60);

          return (
            <div
              key={r.type}
              style={{
                width: 300,
                marginBottom: 18,
                borderRadius: 14,
                background: C.card,
                border: `1.5px solid ${r.colour}`,
                padding: "16px 22px",
                fontFamily: FONT,
                fontSize: 26,
                fontWeight: 700,
                color: r.colour,
                transform: `translate(${dx}px, ${dy}px) scale(${interpolate(
                  fly,
                  [0, 1],
                  [1, 0.55]
                )})`,
                opacity: interpolate(fly, [0, 0.75, 1], [1, 1, 0]),
              }}
            >
              {r.type}
            </div>
          );
        })}
      </div>

      <div
        style={{
          position: "absolute",
          left: 1010,
          top: 430,
          display: "flex",
          gap: 110,
        }}
      >
        {[
          { label: "20 Sources", accent: C.keep, icon: "✓", dim: false },
          { label: "99 Archive", accent: C.dismiss, icon: "×", dim: true },
          { label: "30 Tasks", accent: C.skip, icon: "☑", dim: false },
        ].map((f, i) => {
          const pop = spring({
            frame: local - 150 - i * 18,
            fps,
            config: { damping: 11, mass: 0.5 },
          });
          return (
            <Folder
              key={f.label}
              label={f.label}
              accent={f.accent}
              icon={f.icon}
              dim={f.dim}
              scale={interpolate(pop, [0, 0.5, 1], [1, 1.08, 1])}
            />
          );
        })}
      </div>
    </>
  );
};
