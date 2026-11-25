import React from "react";
import { Composition, Folder } from "remotion";
import "./lib/fonts";
import { BridgeVideo } from "./Video";
import { SCENES, TOTAL_FRAMES } from "./registry";

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="BridgeExplainer" component={BridgeVideo} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
    <Folder name="Scenes">
      {SCENES.map((s) => (
        <Composition key={s.id} id={s.id} component={s.Comp} durationInFrames={s.frames} fps={30} width={1920} height={1080} />
      ))}
    </Folder>
  </>
);
