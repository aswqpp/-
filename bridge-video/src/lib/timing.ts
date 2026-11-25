// 자막(내레이션 문장) 길이로 장면 길이를 정한다.
export const FPS = 30;
export const LEAD = 14; // 장면 시작 후 첫 자막까지
export const TAIL = 24; // 마지막 자막 뒤 여유
export const FADE = 14; // 장면 전환 길이

export type Line = string | { t: string; s: number };

export const lineText = (l: Line) => (typeof l === "string" ? l : l.t);

export const lineFrames = (l: Line) => {
  if (typeof l !== "string") return Math.round(l.s * FPS);
  const plain = l.replace(/\*\*/g, "").replace(/\s/g, "");
  const sec = Math.max(3.2, 1.5 + plain.length * 0.105);
  return Math.round(sec * FPS);
};

export const cuesOf = (lines: Line[]) => {
  let f = LEAD;
  return lines.map((l) => {
    const s = f;
    f += lineFrames(l);
    return s;
  });
};

export const sceneFrames = (lines: Line[], extra = 0) =>
  LEAD + lines.reduce((a, l) => a + lineFrames(l), 0) + TAIL + extra;
