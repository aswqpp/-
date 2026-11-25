import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT } from "../lib/theme";
import { ease, prog } from "../lib/anim";
import { Line, cuesOf, lineFrames, lineText } from "../lib/timing";

/** **굵게** 표시를 강조 글씨로 바꾼다 */
export const Marked: React.FC<{ text: string; color?: string }> = ({ text, color = C.ink }) => {
  const parts = text.split("**");
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1 ? (
          <span
            key={i}
            style={{
              fontWeight: 700,
              color,
              backgroundImage: `linear-gradient(transparent 62%, ${C.mark} 62%)`,
              padding: "0 2px",
            }}
          >
            {p}
          </span>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
};

export const Captions: React.FC<{ lines: Line[] }> = ({ lines }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const cues = cuesOf(lines);
  let idx = -1;
  cues.forEach((c, i) => {
    if (frame >= c) idx = i;
  });
  if (idx < 0) return null;
  const start = cues[idx];
  const end = idx < lines.length - 1 ? cues[idx] + lineFrames(lines[idx]) : durationInFrames;
  const opacity = interpolate(frame, [start, start + 8, end - 5, end], [0, 1, 1, idx < lines.length - 1 ? 0 : 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dy = interpolate(frame, [start, start + 12], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 180,
        right: 180,
        bottom: 46,
        minHeight: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.card,
        border: `1.5px solid ${C.line}`,
        borderRadius: 22,
        padding: "22px 48px",
        boxShadow: "0 6px 24px rgba(30,36,41,0.05)",
      }}
    >
      <div
        style={{
          opacity,
          translate: `0px ${dy}px`,
          fontSize: 42,
          lineHeight: 1.45,
          fontWeight: 500,
          color: C.ink,
          textAlign: "center",
          wordBreak: "keep-all",
          letterSpacing: "-0.01em",
        }}
      >
        <Marked text={lineText(lines[idx])} />
      </div>
    </div>
  );
};

export const SceneLayout: React.FC<{
  chapter: string;
  title: string;
  lines: Line[];
  children?: React.ReactNode;
}> = ({ chapter, title, lines, children }) => {
  const frame = useCurrentFrame();
  const head = prog(frame, 0, 22);
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.ink }}>
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 60,
          opacity: head,
          translate: `0px ${(1 - head) * 14}px`,
        }}
      >
        <div style={{ fontSize: 28, fontWeight: 600, color: C.muted, letterSpacing: "0.02em" }}>{chapter}</div>
        <div style={{ fontSize: 58, fontWeight: 700, marginTop: 6, letterSpacing: "-0.02em" }}>{title}</div>
      </div>
      <AbsoluteFill>{children}</AbsoluteFill>
      <Captions lines={lines} />
    </AbsoluteFill>
  );
};

export const useCues = (lines: Line[]) => cuesOf(lines);
