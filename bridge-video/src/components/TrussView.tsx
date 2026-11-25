import React from "react";
import { C } from "../lib/theme";
import { Kind, Truss } from "../lib/truss";

export const kindColor = (k?: Kind) =>
  k === "c" ? C.comp : k === "t" ? C.tens : k === "z" ? "#B4BAC1" : C.neutral;

/**
 * SVG <g> 안에서 트러스를 그린다. 좌표는 미터, (ox, oy)는 왼쪽 받침의 화면 위치.
 * progress: 0→1 동안 왼쪽부터 차례로 그려진다.
 */
export const TrussView: React.FC<{
  truss: Truss;
  ox: number;
  oy: number;
  s: number;
  progress?: number;
  mode?: "kind" | "neutral" | "soft";
  widthOf?: (i: number) => number;
  colorOf?: (i: number) => string | undefined;
  opacityOf?: (i: number) => number;
  nodes?: boolean;
  supports?: boolean;
  defaultW?: number;
}> = ({
  truss,
  ox,
  oy,
  s,
  progress = 1,
  mode = "kind",
  widthOf,
  colorOf,
  opacityOf,
  nodes = true,
  supports = true,
  defaultW = 5,
}) => {
  const X = (x: number) => ox + x * s;
  const Y = (y: number) => oy - y * s;
  const order = truss.members
    .map((m, i) => ({ i, mid: (truss.nodes[m.a].x + truss.nodes[m.b].x) / 2 }))
    .sort((a, b) => a.mid - b.mid)
    .map((o) => o.i);
  const rank = new Array(order.length);
  order.forEach((i, r) => (rank[i] = r));
  const M = truss.members.length;
  const local = (i: number) => {
    const start = (rank[i] / M) * 0.7;
    return Math.max(0, Math.min(1, (progress - start) / 0.3));
  };
  const last = truss.nodes.reduce((acc, p, i) => (p.y === 0 && p.x > truss.nodes[acc].x ? i : acc), 0);
  const sp = Math.max(0, Math.min(1, progress * 3));
  return (
    <g>
      {supports
        ? [truss.nodes[0], truss.nodes[last]].map((p, k) => (
            <path
              key={k}
              d={`M${X(p.x)} ${Y(p.y) + 4} l${-0.75 * s - 6} ${1.1 * s + 10} h${1.5 * s + 12} Z`}
              fill="#A4AAB1"
              opacity={sp}
            />
          ))
        : null}
      {truss.members.map((m, i) => {
        const t = local(i);
        if (t <= 0) return null;
        const a = truss.nodes[m.a];
        const b = truss.nodes[m.b];
        const flip = a.x > b.x || (a.x === b.x && a.y > b.y);
        const p0 = flip ? b : a;
        const p1 = flip ? a : b;
        const col =
          colorOf?.(i) ?? (mode === "neutral" ? C.neutral : mode === "soft" ? "#9AA1A9" : kindColor(m.k));
        const w = widthOf ? widthOf(i) : m.w ?? defaultW;
        return (
          <line
            key={i}
            x1={X(p0.x)}
            y1={Y(p0.y)}
            x2={X(p0.x + (p1.x - p0.x) * t)}
            y2={Y(p0.y + (p1.y - p0.y) * t)}
            stroke={col}
            strokeWidth={w}
            strokeLinecap="round"
            strokeDasharray={m.k === "z" && mode === "kind" && !colorOf?.(i) ? "7 7" : undefined}
            opacity={opacityOf ? opacityOf(i) : 1}
          />
        );
      })}
      {nodes
        ? truss.nodes.map((p, i) => (
            <circle key={i} cx={X(p.x)} cy={Y(p.y)} r={Math.max(3, s * 0.12)} fill={C.ink} opacity={0.8 * sp} />
          ))
        : null}
    </g>
  );
};
