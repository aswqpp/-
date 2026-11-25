import React from "react";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { SCENES } from "./registry";
import { FADE } from "./lib/timing";

export const BridgeVideo: React.FC = () => (
  <TransitionSeries>
    {SCENES.flatMap((s, i) => {
      const seq = (
        <TransitionSeries.Sequence key={s.id} name={s.id} durationInFrames={s.frames}>
          <s.Comp />
        </TransitionSeries.Sequence>
      );
      return i === 0
        ? [seq]
        : [<TransitionSeries.Transition key={`${s.id}-t`} presentation={fade()} timing={linearTiming({ durationInFrames: FADE })} />, seq];
    })}
  </TransitionSeries>
);
