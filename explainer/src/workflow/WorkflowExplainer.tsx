import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { C, W, H } from "../theme";
import { WBEATS } from "./beats";
import { W0Title } from "./scenes/W0Title";
import { W1SecondBrain } from "./scenes/W1SecondBrain";
import { W2Scraper } from "./scenes/W2Scraper";
import { W3Apps } from "./scenes/W3Apps";
import { W4Calendar } from "./scenes/W4Calendar";
import { W5Webapp } from "./scenes/W5Webapp";
import { W6Architecture } from "./scenes/W6Architecture";

const SCENES = [
  W0Title,
  W1SecondBrain,
  W2Scraper,
  W3Apps,
  W4Calendar,
  W5Webapp,
  W6Architecture,
];

/** Frames spent gliding from one panel to the next. */
const PAN = 26;

/**
 * Zelfde continue-strip-camera als EcosystemExplainer: alle beats staan naast
 * elkaar, de camera glijdt — nergens een harde cut.
 */
export const WorkflowExplainer: React.FC = () => {
  const frame = useCurrentFrame();

  const inputs: number[] = [0];
  const outputs: number[] = [0];
  WBEATS.forEach((beat, i) => {
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
          width: W * WBEATS.length,
          height: H,
          transform: `translateX(${x}px)`,
        }}
      >
        {WBEATS.map((beat, i) => {
          const Scene = SCENES[i];
          const local = frame - beat.start;
          // De Sequence maakt useCurrentFrame() binnen de scène beat-lokaal
          // (nodig voor Caption) en unmount panelen buiten beeld.
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
              <Sequence
                from={beat.start}
                durationInFrames={beat.duration + PAN + 8}
                layout="none"
              >
                <Scene local={local} />
              </Sequence>
            </div>
          );
        })}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
