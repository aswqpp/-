import React from "react";
import { useCurrentFrame } from "remotion";
import { C, fmt } from "../lib/theme";
import { lerp, prog } from "../lib/anim";

export const Appear: React.FC<{
  at: number;
  dur?: number;
  dy?: number;
  dx?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ at, dur = 18, dy = 18, dx = 0, style, children }) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, dur);
  return (
    <div style={{ position: "absolute", ...style, opacity: p, translate: `${(1 - p) * dx}px ${(1 - p) * dy}px` }}>
      {children}
    </div>
  );
};

export const Card: React.FC<{
  style?: React.CSSProperties;
  accent?: string;
  children?: React.ReactNode;
}> = ({ style, accent, children }) => (
  <div
    style={{
      background: C.card,
      border: `1.5px solid ${accent ?? C.line}`,
      borderRadius: 20,
      padding: "22px 26px",
      boxShadow: "0 4px 18px rgba(30,36,41,0.045)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Pill: React.FC<{ color?: string; bg?: string; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  color = C.ink2,
  bg = "#ECEAE4",
  style,
  children,
}) => (
  <span
    style={{
      display: "inline-block",
      padding: "6px 16px",
      borderRadius: 999,
      background: bg,
      color,
      fontSize: 26,
      fontWeight: 600,
      ...style,
    }}
  >
    {children}
  </span>
);

export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({ size = 34, color = C.good }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <circle cx={12} cy={12} r={11} fill={color} opacity={0.14} />
    <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CrossIcon: React.FC<{ size?: number; color?: string }> = ({ size = 34, color = C.bad }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ flex: "none" }}>
    <circle cx={12} cy={12} r={11} fill={color} opacity={0.14} />
    <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </svg>
);

export const ArrowRight: React.FC<{ w?: number; color?: string; style?: React.CSSProperties }> = ({
  w = 60,
  color = C.muted,
  style,
}) => (
  <svg width={w} height={24} viewBox={`0 0 ${w} 24`} style={style}>
    <path d={`M2 12H${w - 6}M${w - 16} 4l10 8-10 8`} fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const CountUp: React.FC<{
  from: number;
  to: number;
  at: number;
  dur?: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}> = ({ from, to, at, dur = 40, suffix = "", prefix = "", decimals = 0 }) => {
  const frame = useCurrentFrame();
  const v = lerp(from, to, prog(frame, at, dur));
  return (
    <>
      {prefix}
      {decimals ? v.toFixed(decimals) : fmt(v)}
      {suffix}
    </>
  );
};

/** 스탬프: 통과 / 탈락 */
export const Stamp: React.FC<{ at: number; ok: boolean; text: string; style?: React.CSSProperties; size?: number }> = ({
  at,
  ok,
  text,
  style,
  size = 44,
}) => {
  const frame = useCurrentFrame();
  const p = prog(frame, at, 14);
  const col = ok ? C.good : C.bad;
  return (
    <div
      style={{
        position: "absolute",
        ...style,
        opacity: p,
        scale: `${lerp(1.25, 1, p)}`,
        rotate: "-4deg",
        border: `4px solid ${col}`,
        color: col,
        borderRadius: 14,
        padding: "6px 22px",
        fontSize: size,
        fontWeight: 700,
        background: "rgba(255,255,255,0.85)",
      }}
    >
      {text}
    </div>
  );
};

export const Legend: React.FC<{ style?: React.CSSProperties; items?: [string, string, boolean?][] }> = ({
  style,
  items = [
    [C.comp, "눌리는 부재 (압축)"],
    [C.tens, "당겨지는 부재 (인장)"],
  ],
}) => (
  <div style={{ position: "absolute", display: "flex", gap: 34, fontSize: 26, color: C.ink2, fontWeight: 500, ...style }}>
    {items.map(([col, label, dashed]) => (
      <div key={label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <svg width={46} height={14}>
          <line
            x1={3}
            y1={7}
            x2={43}
            y2={7}
            stroke={col}
            strokeWidth={dashed ? 3 : 8}
            strokeLinecap="round"
            strokeDasharray={dashed ? "6 6" : undefined}
          />
        </svg>
        {label}
      </div>
    ))}
  </div>
);
