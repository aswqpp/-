import React from "react";
import { C } from "../lib/theme";

/**
 * 오른쪽으로 달리는 트럭. rx = 뒷바퀴의 화면 x, by = 바닥(도로) 높이, s = px/m
 * 뒷바퀴와 앞바퀴 사이는 4m (인접한 두 절점)
 */
export const Truck: React.FC<{
  rx: number;
  by: number;
  s: number;
  labels?: boolean;
  labelOpacity?: number;
  flip?: boolean;
}> = ({ rx, by, s, labels = false, labelOpacity = 1, flip = false }) => {
  const r = 0.55 * s;
  const fx = rx + (flip ? -4 : 4) * s;
  const d = flip ? -1 : 1;
  const L = (x: number) => rx + d * x * s; // 뒷바퀴 기준 거리(m) → 화면 x
  const box = (x0: number, x1: number, y0: number, y1: number) => {
    const a = L(x0);
    const b = L(x1);
    return { x: Math.min(a, b), w: Math.abs(b - a), y: by - y1 * s, h: (y1 - y0) * s };
  };
  const trailer = box(-1.3, 3.0, 0.75, 3.0);
  const cab = box(3.15, 5.0, 0.75, 2.5);
  const win = box(3.9, 4.75, 1.55, 2.25);
  return (
    <g>
      <rect x={trailer.x} y={trailer.y} width={trailer.w} height={trailer.h} rx={0.25 * s} fill="#E9ECEF" stroke="#7A828B" strokeWidth={2.5} />
      <rect x={cab.x} y={cab.y} width={cab.w} height={cab.h} rx={0.3 * s} fill="#CBD4DD" stroke="#7A828B" strokeWidth={2.5} />
      <rect x={win.x} y={win.y} width={win.w} height={win.h} rx={0.12 * s} fill="#F7F9FB" stroke="#7A828B" strokeWidth={1.5} />
      {[rx, fx].map((x, i) => (
        <g key={i}>
          <circle cx={x} cy={by - r} r={r} fill="#4B5259" />
          <circle cx={x} cy={by - r} r={r * 0.4} fill="#C9CED4" />
        </g>
      ))}
      {labels ? (
        <g opacity={labelOpacity} fontFamily="Pretendard" fontWeight={700}>
          {[
            { x: rx, t: "뒷바퀴 421kN", big: true },
            { x: fx, t: "앞바퀴 165kN", big: false },
          ].map((o, i) => (
            <g key={i}>
              <line x1={o.x} y1={by - 3.9 * s - (o.big ? 1.4 * s : 0.5 * s)} x2={o.x} y2={by - 3.25 * s} stroke={C.ink2} strokeWidth={o.big ? 6 : 3} strokeLinecap="round" />
              <path d={`M${o.x - 9} ${by - 3.25 * s - 10} L${o.x} ${by - 3.25 * s + 2} L${o.x + 9} ${by - 3.25 * s - 10}`} fill="none" stroke={C.ink2} strokeWidth={o.big ? 5 : 3} strokeLinecap="round" strokeLinejoin="round" />
              <text x={o.x} y={by - 3.9 * s - (o.big ? 1.4 * s : 0.5 * s) - 14} textAnchor="middle" fontSize={28} fill={C.ink}>
                {o.t}
              </text>
            </g>
          ))}
        </g>
      ) : null}
    </g>
  );
};
