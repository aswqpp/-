import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT } from "../lib/theme";
import { prog } from "../lib/anim";

export const CHAPTER_FRAMES = 100;

export const ChapterCard: React.FC<{ num: string; title: string; sub: string }> = ({ num, title, sub }) => {
  const frame = useCurrentFrame();
  const a = prog(frame, 4, 20);
  const b = prog(frame, 12, 22);
  const line = prog(frame, 8, 30);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.ink, justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 600, color: C.muted, opacity: a, translate: `0px ${(1 - a) * 12}px` }}>{num}</div>
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 12, opacity: b, translate: `0px ${(1 - b) * 16}px` }}>
          {title}
        </div>
        <div style={{ width: 120 * line, height: 4, background: C.ink2, margin: "34px auto", borderRadius: 2 }} />
        <div style={{ fontSize: 36, color: C.ink2, opacity: b }}>{sub}</div>
      </div>
    </AbsoluteFill>
  );
};
