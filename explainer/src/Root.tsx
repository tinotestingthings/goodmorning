import React from "react";
import { Composition } from "remotion";
import { EcosystemExplainer } from "./EcosystemExplainer";
import { WorkflowExplainer } from "./workflow/WorkflowExplainer";
import { WTOTAL } from "./workflow/beats";
import { FPS, H, TOTAL, W } from "./theme";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition
      id="EcosystemExplainer"
      component={EcosystemExplainer}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
    />
    <Composition
      id="WorkflowExplainer"
      component={WorkflowExplainer}
      durationInFrames={WTOTAL}
      fps={FPS}
      width={W}
      height={H}
    />
  </>
);
