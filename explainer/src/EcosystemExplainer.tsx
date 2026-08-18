import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { BEATS, C, W, H } from "./theme";
import { Beat1Sources } from "./scenes/Beat1Sources";
import { Beat2Tasks } from "./scenes/Beat2Tasks";
import { Beat3Inbox } from "./scenes/Beat3Inbox";
import { Beat4Triage } from "./scenes/Beat4Triage";
import { Beat5Vault } from "./scenes/Beat5Vault";
import { Beat6Loop } from "./scenes/Beat6Loop";

const SCENES = [
  Beat1Sources,
  Beat2Tasks,
  Beat3Inbox,
  Beat4Triage,
  Beat5Vault,
  Beat6Loop,
];

/** Frames spent gliding from one panel to the next. */
const PAN = 26;

/**
 * All six beats live side by side on one wide strip; the "camera" is a single
 * translateX. That is what makes this read as one continuous move instead of a
 * sequence of cuts — nothing ever hard-cuts.
 */
export const EcosystemExplainer: React.FC = () => {
  const frame = useCurrentFrame();

  // Build the pan keyframes: hold on a panel, then glide to the next.
  const inputs: number[] = [0];
  const outputs: number[] = [0];
  BEATS.forEach((beat, i) => {
    if (i === 0) return;
    inputs.push(beat.start, beat.start + PAN);
    outputs.push(-(i - 1) * W, -i * W);
  });

  const x = interpolate(frame, inputs, outputs, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          width: W * BEATS.length,
          height: H,
          transform: `translateX(${x}px)`,
        }}
      >
        {BEATS.map((beat, i) => {
          const Scene = SCENES[i];
          const local = frame - beat.start;
          // Skip the work for panels far off-screen.
          const visible = local > -PAN - 4 && local < beat.duration + PAN + 4;
          return (
            <div
              key={beat.id}
              style={{
                position: "absolute",
                left: i * W,
                top: 0,
                width: W,
                height: H,
              }}
            >
              {visible ? <Scene local={local} /> : null}
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
