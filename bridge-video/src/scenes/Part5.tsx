import React from "react";
import { useCurrentFrame } from "remotion";
import { C, fmt } from "../lib/theme";
import { lerp, prog } from "../lib/anim";
import { Line } from "../lib/timing";
import { SceneLayout, useCues } from "../components/Scene";
import { Appear, Card, Legend, Pill } from "../components/ui";
import { TrussView } from "../components/TrussView";
import {
  archTruss,
  archY,
  clubDesign,
  clubSkeleton,
  deckLoads,
  finalDesign,
  howeDirs,
  prattDirs,
  solveForces,
  tensionDirs,
  withDeadLoad,
} from "../lib/truss";

const CH = "5부 · 결과";
const svgAbs: React.CSSProperties = { position: "absolute", left: 0, top: 0 };
const T: React.FC<{ x: number; y: number; size?: number; color?: string; weight?: number; anchor?: "start" | "middle" | "end"; children?: React.ReactNode }> = ({
  x,
  y,
  size = 26,
  color = C.ink,
  weight = 600,
  anchor = "middle",
  children,
}) => (
  <text x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor} fontFamily="Pretendard">
    {children}
  </text>
);

/* ================= 결과 1: 2.6배 ================= */
// 보고서 그림 2의 막대 높이를 읽은 값 (구간 80개, 167.5~441.3천 달러)
const HIST = [
  26, 43, 103, 446, 2402, 2960, 3474, 2248, 2076, 2316, 2548, 1441, 1964, 1844, 1235, 1450, 944, 781, 703, 1467, 841, 455, 326, 249, 172, 163, 472, 429,
  618, 532, 420, 377, 257, 283, 395, 300, 266, 326, 566, 377, 352, 249, 232, 275, 317, 420, 249, 266, 214, 292, 326, 283, 292, 309, 240, 214, 189, 180,
  146, 180, 112, 137, 86, 112, 137, 120, 120, 69, 120, 129, 94, 94, 94, 69, 60, 43, 43, 34, 0, 0,
];
const LO = 167.513;
const HI = 441.301;

export const R1_LINES: Line[] = [
  "같은 골격에서 설계 **44,544개**의 비용을 비교했어요. 여기서 비용은 고정된 부지비를 뺀 **구조비용**이에요.",
  "가장 싼 설계는 **167,513달러**, 가장 비싼 설계는 **441,301달러**예요.",
  "다리 길이와 하중이 같아도, 모양과 사재 배치에 따라 **2.6배** 차이가 나요.",
  "낮고 완만한 다리(가운데 높이 5m)가 가장 쌌고, 높은 다리(13m)가 가장 비쌌어요.",
  "설계의 절반은 193,500~262,302달러 사이에 모여 있어요. 설계 선택이 비용을 크게 좌우한다는 뜻이에요.",
];

export const R1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(R1_LINES);
  const x0 = 250;
  const x1 = 1690;
  const k0 = 150;
  const k1 = 450;
  const X = (k: number) => x0 + ((k - k0) / (k1 - k0)) * (x1 - x0);
  const base = 770;
  const hMax = 250;
  const Y = (v: number) => base - (v / 3500) * hMax;
  const bw = (HI - LO) / HIST.length;
  const grow = prog(frame, c[0], 40);
  const cheap = withDeadLoad(archTruss(5, 3, prattDirs()), 2.5, 9);
  const exp = withDeadLoad(archTruss(13, 2.6, howeDirs()), 2.5, 9);
  const bs = 11.5;
  const showBridges = prog(frame, c[3], 18);
  return (
    <SceneLayout chapter={CH} title="결과 1 · 같은 조건에서도 비용은 2.6배 차이 난다" lines={R1_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        {/* 절반 구간 */}
        <g opacity={prog(frame, c[4], 18)}>
          <rect x={X(193.5)} y={Y(3500)} width={X(262.302) - X(193.5)} height={base - Y(3500)} fill="#ECEAE4" />
          <T x={(X(193.5) + X(262.302)) / 2} y={Y(2900)} size={22} color={C.ink2}>
            설계의 절반
          </T>
        </g>
        {HIST.map((v, i) => {
          const k = LO + i * bw;
          const h = (base - Y(v)) * grow;
          return <rect key={i} x={X(k) + 1} y={base - h} width={X(k + bw) - X(k) - 2} height={h} fill={C.bar} />;
        })}
        <line x1={x0} y1={base} x2={x1} y2={base} stroke={C.ink2} strokeWidth={2} />
        {[200, 250, 300, 350, 400, 450].map((k) => (
          <T key={k} x={X(k)} y={base + 34} size={22} color={C.muted} weight={500}>
            {k}
          </T>
        ))}
        <T x={(x0 + x1) / 2} y={base + 70} size={22} color={C.muted} weight={500}>
          다리 한 개의 구조비용 (천 달러, 부지비 제외) · 막대 높이 = 그 비용대의 설계 수
        </T>
        {/* 양 끝 */}
        <g opacity={prog(frame, c[1], 16)}>
          <line x1={X(LO)} y1={base} x2={X(LO)} y2={Y(3500) - 40} stroke={C.good} strokeWidth={4} />
          <T x={X(LO) + 12} y={Y(3500) - 18} anchor="start" color={C.good} size={24} weight={700}>
            가장 쌈 167,513
          </T>
          <line x1={X(HI)} y1={base} x2={X(HI)} y2={Y(3500) - 40} stroke={C.ink2} strokeWidth={4} />
          <T x={X(HI) - 12} y={Y(3500) - 18} anchor="end" color={C.ink2} size={24} weight={700}>
            가장 비쌈 441,301
          </T>
        </g>
        <g opacity={prog(frame, c[2], 16)}>
          <line x1={X(LO) + 8} y1={Y(2200)} x2={X(HI) - 8} y2={Y(2200)} stroke={C.ink} strokeWidth={3} />
          <path d={`M${X(LO) + 22} ${Y(2200) - 10} l-14 10 14 10 M${X(HI) - 22} ${Y(2200) - 10} l14 10 -14 10`} fill="none" stroke={C.ink} strokeWidth={3} />
          <rect x={(X(LO) + X(HI)) / 2 - 80} y={Y(2200) - 30} width={160} height={56} rx={12} fill={C.bg} />
          <T x={(X(LO) + X(HI)) / 2} y={Y(2200) + 12} size={40} weight={700}>
            2.6배
          </T>
        </g>
        {/* 두 다리 */}
        <g opacity={showBridges}>
          <T x={300 + 22 * bs} y={248} color={C.good} size={26} weight={700}>
            가장 싼 설계 · 가운데 높이 5m
          </T>
          <TrussView truss={cheap} ox={300} oy={410} s={bs} nodes={false} />
          <T x={1110 + 22 * bs} y={248} color={C.ink2} size={26} weight={700}>
            가장 비싼 설계 · 가운데 높이 13m
          </T>
          <TrussView truss={exp} ox={1110} oy={410} s={bs} nodes={false} />
        </g>
      </svg>
      <Appear at={c[0]} style={{ left: 120, top: 200 }}>
        <div style={{ fontSize: 24, color: C.muted, opacity: 1 - showBridges }}>보고서 그림 2의 분포를 옮겨 그림</div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 결과 2: 규격 6종 ================= */
export const R2_LINES: Line[] = [
  "부재 규격의 종류 수를 1종부터 9종까지 바꿔 가며 구조비용을 계산했어요. (최종 설계의 모양 기준)",
  "모든 부재를 한 규격으로 통일하면, 가장 굵은 **160mm**에 맞춰야 해서 강철이 2.3배가 돼요. 6종보다 **106%** 비싸요.",
  "반대로 종류를 너무 늘리면 강철은 거의 줄지 않고, 규격마다 **1,000달러**가 붙어요.",
  "**6종**에서 둘이 균형을 이뤄요. 이것이 동아리에서 느낀 첫 번째 의문의 답이에요.",
];

export const R2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(R2_LINES);
  const vals = [337, 218, 175, 169, 165, 163, 164, 164, 165];
  const base = 760;
  const top = 300;
  const H = (v: number) => (v / 350) * (base - top);
  const x0 = 300;
  const gap = 150;
  const w = 104;
  return (
    <SceneLayout chapter={CH} title="결과 2 · 규격은 6종일 때 가장 싸다" lines={R2_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <line x1={x0 - 60} y1={base} x2={x0 + 8 * gap + w + 40} y2={base} stroke={C.ink2} strokeWidth={2} />
        {vals.map((v, i) => {
          const g = prog(frame, c[0] + i * 4, 24);
          const h = H(v) * g;
          const x = x0 + i * gap;
          const col = i === 5 ? C.good : i === 0 ? "#7C848D" : C.bar;
          return (
            <g key={i}>
              <rect x={x} y={base - h} width={w} height={h} rx={4} fill={col} />
              <T x={x + w / 2} y={base - h - 14} size={28} weight={700} color={i === 5 ? C.good : C.ink2}>
                {g > 0.6 ? v : ""}
              </T>
              <T x={x + w / 2} y={base + 38} size={28} color={C.ink2}>
                {i + 1}종
              </T>
            </g>
          );
        })}
        <T x={x0 - 70} y={top - 26} size={22} color={C.muted} anchor="start" weight={500}>
          구조비용 (천 달러)
        </T>
        <T x={x0 + 4 * gap + w / 2} y={base + 80} size={22} color={C.muted} weight={500}>
          다리에 쓴 부재 규격의 종류 수
        </T>
        <g opacity={prog(frame, c[1], 16)}>
          <T x={x0 + w + 30} y={base - H(337) + 30} anchor="start" size={26} color={C.ink}>
            모두 160mm로 통일 → 강재 2.3배
          </T>
          <T x={x0 + w + 30} y={base - H(337) + 66} anchor="start" size={26} color={C.bad} weight={700}>
            6종보다 +106%
          </T>
        </g>
        <g opacity={prog(frame, c[2], 16)}>
          <T x={x0 + 7 * gap + w / 2} y={base - H(165) - 110} size={26} color={C.ink}>
            강재는 거의 그대로,
          </T>
          <T x={x0 + 7 * gap + w / 2} y={base - H(165) - 76} size={26} color={C.ink}>
            규격 하나당 +1,000달러
          </T>
        </g>
        <g opacity={prog(frame, c[3], 16)}>
          <T x={x0 + 5 * gap + w / 2} y={base - H(163) - 60} size={30} color={C.good} weight={700}>
            가장 쌈
          </T>
        </g>
      </svg>
    </SceneLayout>
  );
};

/* ================= 결과 3: 같이 정하기 ================= */
export const R3_LINES: Line[] = [
  "가운데 높이 6미터 다리로 실험했어요. 먼저 사재를 **Pratt**으로 고정하고 윗선 모양만 골랐어요.",
  "그러면 곡선 모수 **1.75**에서 더 나아지지 않고 멈춰요. 180,307달러.",
  "그 모양에서 사재 방향을 어떻게 바꿔도 비용은 **한 푼도** 줄지 않았어요.",
  "그런데 처음부터 모양과 사재를 **같이** 바꾸면, 곡선 모수 3.0에서 **4.0%** 더 싼 설계(173,182달러)가 나와요.",
  "하나씩 차례로 정하면 **넘을 수 없는 문턱**이 있다는 뜻이에요.",
];

export const R3Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(R3_LINES);
  const a = archTruss(6, 1.75, howeDirs());
  const b = clubSkeleton((x) => archY(x, 6, 3), tensionDirs((x) => archY(x, 6, 3)));
  const s = 16;
  const bars = [
    { label: "① 모양을 먼저 정하면", v: 180307, at: c[1], col: C.bar, note: "" },
    { label: "그 모양에서 사재를 바꿔도", v: 180307, at: c[2], col: C.bar, note: "변화 없음" },
    { label: "② 처음부터 같이 정하면", v: 173182, at: c[3], col: C.good, note: "−4.0%" },
  ];
  const maxV = 190000;
  return (
    <SceneLayout chapter={CH} title="결과 3 · 모양과 사재는 같이 정해야 한다" lines={R3_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <g opacity={prog(frame, c[0], 16)}>
          <T x={150} y={250} anchor="start" size={28} weight={700}>
            ① 차례로 정하기: 사재 고정 → 모양만 고름
          </T>
          <TrussView truss={a} ox={150} oy={420} s={s} mode="neutral" widthOf={() => 4} progress={prog(frame, c[0], 30)} />
          <T x={150 + 22 * s} y={460} size={24} color={C.muted}>
            곡선 모수 1.75에서 멈춤
          </T>
        </g>
        <g opacity={prog(frame, c[3], 16)}>
          <T x={150} y={560} anchor="start" size={28} weight={700} color={C.good}>
            ② 같이 정하기: 모양과 사재 방향을 함께 바꿈
          </T>
          <TrussView truss={b} ox={150} oy={730} s={s} mode="neutral" widthOf={() => 4} progress={prog(frame, c[3], 30)} />
          <T x={150 + 22 * s} y={770} size={24} color={C.muted}>
            곡선 모수 3.0
          </T>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 1000, top: 290, width: 780 }}>
        {bars.map((br, i) => {
          const p = prog(frame, br.at, 30);
          return (
            <Appear key={i} at={br.at} style={{ position: "relative", marginBottom: 40 }}>
              <div style={{ fontSize: 28, fontWeight: 600, color: i === 2 ? C.good : C.ink }}>{br.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 10 }}>
                <div style={{ width: lerp(0, (br.v / maxV) * 420, p), height: 46, background: br.col, borderRadius: 8, flex: "none" }} />
                <div style={{ fontSize: 30, fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(br.v)}달러</div>
                {br.note ? <div style={{ fontSize: 26, fontWeight: 700, whiteSpace: "nowrap", color: i === 2 ? C.good : C.muted }}>{br.note}</div> : null}
              </div>
            </Appear>
          );
        })}
      </div>
      <Appear at={c[4]} style={{ left: 1000, top: 690, width: 780 }}>
        <Pill bg="#E6E9ED" color={C.ink} style={{ fontSize: 28 }}>
          하나씩 차례로 정하면 넘을 수 없는 문턱이 있다
        </Pill>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 결과 4: 포물선 경계 ================= */
export const R4_LINES: Line[] = [
  "사재 방향을 고정해 두고, 바닥판 무게만 실었을 때 윗선 모양에 따라 사재의 힘이 어떻게 변하는지 봤어요.",
  "윗선이 포물선이면 사재의 힘은 아래 현재 힘의 **0.4%**로 거의 사라져요.",
  "사재 힘이 정확히 0이 되는 곡선 모수는 높이 6미터에서 **1.988**. 포물선(2)과 거의 같아요.",
  "이 경계를 넘으면 사재의 힘이 **당김에서 누름으로** 뒤집혀요.",
  "보고서는 이 결과를 '포물선보다 뾰족하면 **Pratt**, 평평하면 **Howe**가 유리'로 정리했어요.",
  "사재가 당겨지는 배치는 좌굴 걱정이 없어서 가는 부재로 충분하기 때문이에요.",
  "다만 승패가 바뀌는 곳은 정확히 2가 아니라 그 **근처**(곡선 모수 1.75~2.5)예요.",
  "이 결과는 하중 규칙을 세 번 고치는 동안 한 번도 흔들리지 않은, 이 탐구에서 **가장 튼튼한 결과**예요.",
  "87가지 모양 각각에서 가장 싼 배치를 찾았더니 **71%**가 Howe 또는 Pratt였어요.",
  "교량에 오래 쓰여 온 형식에는 **이유가 있었던** 거예요.",
];

const diagForce = (n: number) => {
  const t = archTruss(6, n, howeDirs());
  const F = solveForces(t, deckLoads(t));
  const di = t.members.findIndex((m) => m.role === "diag");
  return F[di];
};

export const R4Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(R4_LINES);
  const shapes = [
    { n: 1.5, name: "뾰족한 아치 (곡선 모수 1.5)", res: "사재가 당겨진다", col: C.tens },
    { n: 2, name: "포물선 (곡선 모수 2)", res: "사재 힘 거의 0", col: C.muted },
    { n: 2.5, name: "평평한 아치 (곡선 모수 2.5)", res: "사재가 눌린다", col: C.comp },
  ];
  const s = 11.5;
  // 그래프
  const gx0 = 230;
  const gx1 = 1020;
  const gy0 = 520;
  const gy1 = 790;
  const ns = Array.from({ length: 81 }, (_, i) => 1.4 + (1.6 * i) / 80);
  const fs = ns.map(diagForce);
  const fMax = Math.max(...fs.map(Math.abs));
  const GX = (n: number) => gx0 + ((n - 1.4) / 1.6) * (gx1 - gx0);
  const zeroY = (gy0 + gy1) / 2;
  const GY = (f: number) => zeroY - (f / fMax) * ((gy1 - gy0) / 2 - 10);
  const drawP = prog(frame, c[0] + 30, 50);
  const nDraw = Math.max(2, Math.floor(drawP * ns.length));
  const path = ns
    .slice(0, nDraw)
    .map((n, i) => `${i ? "L" : "M"}${GX(n)} ${GY(fs[i])}`)
    .join(" ");
  return (
    <SceneLayout chapter={CH} title="결과 4 · 포물선을 경계로 사재의 힘이 뒤집힌다" lines={R4_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        {shapes.map((sh, i) => {
          const t = withDeadLoad(archTruss(6, sh.n, howeDirs()), 2, 12, 0.03);
          const ox = 150 + i * 580;
          const at = c[0] + i * 12;
          return (
            <g key={i} opacity={prog(frame, at, 16)}>
              <T x={ox + 22 * s} y={240} size={24} weight={700}>
                {sh.name}
              </T>
              <TrussView
                truss={t}
                ox={ox}
                oy={360}
                s={s}
                nodes={false}
                supports={false}
                colorOf={(k) => (t.members[k].role === "diag" ? undefined : "#D5D8DC")}
                widthOf={(k) => (t.members[k].role === "diag" ? t.members[k].w ?? 3 : 3)}
              />
              <T x={ox + 22 * s} y={402} size={24} color={sh.col}>
                {sh.res}
              </T>
            </g>
          );
        })}
        {/* 그래프 */}
        <g opacity={prog(frame, c[0] + 20, 16)}>
          <rect x={gx0} y={gy0} width={GX(1.988) - gx0} height={gy1 - gy0} fill={C.tensSoft} opacity={0.55} />
          <rect x={GX(1.988)} y={gy0} width={gx1 - GX(1.988)} height={gy1 - gy0} fill={C.compSoft} opacity={0.55} />
          <line x1={gx0} y1={zeroY} x2={gx1} y2={zeroY} stroke={C.ink2} strokeWidth={2} />
          <line x1={gx0} y1={gy0} x2={gx0} y2={gy1} stroke={C.ink2} strokeWidth={2} />
          {[1.5, 2.0, 2.5, 3.0].map((n) => (
            <T key={n} x={GX(n)} y={gy1 + 30} size={22} color={C.muted} weight={500}>
              {n.toFixed(1)}
            </T>
          ))}
          <T x={(gx0 + gx1) / 2} y={gy1 + 62} size={22} color={C.muted} weight={500}>
            윗선 모양 (곡선 모수)
          </T>
          <T x={gx0 - 14} y={gy0 + 26} size={22} color={C.tens} anchor="end">
            당김
          </T>
          <T x={gx0 - 14} y={gy1 - 10} size={22} color={C.comp} anchor="end">
            누름
          </T>
          <T x={gx0 - 14} y={zeroY + 8} size={22} color={C.muted} anchor="end" weight={500}>
            0
          </T>
          <T x={gx0 + 8} y={gy0 - 14} size={22} color={C.muted} anchor="start" weight={500}>
            사재의 힘 (바닥판 무게만)
          </T>
          <path d={path} fill="none" stroke={C.ink} strokeWidth={5} strokeLinecap="round" />
        </g>
        <g opacity={prog(frame, c[2], 16)}>
          <circle cx={GX(1.988)} cy={zeroY} r={10} fill={C.ink} />
          <line x1={GX(1.988)} y1={gy0} x2={GX(1.988)} y2={gy1} stroke={C.ink} strokeWidth={2} strokeDasharray="6 6" />
          <rect x={GX(1.988) + 14} y={zeroY - 64} width={190} height={44} rx={10} fill={C.card} stroke={C.line} strokeWidth={2} />
          <T x={GX(1.988) + 109} y={zeroY - 33} size={24} weight={700}>
            0이 되는 점 1.988
          </T>
        </g>
        <g opacity={prog(frame, c[4], 16)}>
          <T x={(gx0 + GX(1.988)) / 2} y={gy0 + 36} size={26} color={C.tens} weight={700}>
            Pratt 유리
          </T>
          <T x={(GX(1.988) + gx1) / 2} y={gy1 - 22} size={26} color={C.comp} weight={700}>
            Howe 유리
          </T>
        </g>
      </svg>
      <Appear at={c[0] + 30} style={{ left: 1110, top: 470 }}>
        <Legend
          style={{ position: "relative", gap: 24, fontSize: 22 }}
          items={[
            [C.tens, "당김"],
            [C.comp, "누름"],
            ["#B4BAC1", "거의 0", true],
          ]}
        />
        <div style={{ fontSize: 20, color: C.muted, marginTop: 6 }}>선 굵기 = 사재가 받는 힘의 크기 · 보고서 그림 5와 같은 사재 방향</div>
      </Appear>
      <Appear at={c[7]} style={{ left: 1110, top: 560, width: 660 }}>
        <Pill bg="#E6E9ED" color={C.ink} style={{ fontSize: 26 }}>
          하중 규칙을 3번 고치는 동안 변하지 않음
        </Pill>
      </Appear>
      <Appear at={c[8]} style={{ left: 1110, top: 630, width: 660 }}>
        <Card style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <div style={{ fontSize: 72, fontWeight: 700, color: C.good }}>71%</div>
          <div style={{ fontSize: 26, lineHeight: 1.4 }}>
            87가지 모양별 가장 싼 배치 중
            <br />
            <b>Howe 또는 Pratt</b>인 비율
          </div>
        </Card>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 결과 5: 세 다리 비교 ================= */
export const R5_LINES: Line[] = [
  "동아리 최종안과 계산으로 찾은 설계를 비교해 봤어요.",
  "동아리 최종안은 높이가 낮고 윗선이 평평해서, 윗선에 큰 압축력이 모이고 굵은 부재가 많아요.",
  "최종 설계는 **Warren** 형식, 가운데 높이 5.75미터의 완만한 아치예요. 230,997달러로 **9.7%** 더 싸요.",
  "윗선을 중간에서 받친 형식은 강재가 가장 적지만, 절점이 10개 늘어 연결비가 커져서 Warren보다 비싸요.",
  "**강재를 줄이는 것**과 **비용을 줄이는 것**은 달라요.",
  "최종 설계는 실제 프로그램에서 압축비 0.974, 인장비 0.969, 세장비 287.0으로 **통과**했어요.",
];

export const R5Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(R5_LINES);
  const club = clubDesign();
  const fd = finalDesign();
  const s = 19;
  const rows = [
    { name: "동아리 최종안 (조원과 43회)", cost: "255,865달러", d: "", meta: "절점 22 · 강재 36,434kg · 규격 14종", at: c[1], col: C.ink },
    { name: "최종 설계: Warren", cost: "230,997달러", d: "−9.7%", meta: "절점 23 · 강재 32,325kg · 규격 6종", at: c[2], col: C.good },
    { name: "윗선을 중간에서 받친 형식", cost: "234,681달러", d: "−8.3%", meta: "절점 33 · 강재 30,624kg(가장 적음) · 규격 9종", at: c[3], col: C.ink },
  ];
  return (
    <SceneLayout chapter={CH} title="결과 5 · 세 다리 비교" lines={R5_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <g opacity={prog(frame, c[0], 16)}>
          <T x={140} y={250} anchor="start" size={26} weight={700}>
            동아리 최종안
          </T>
          <TrussView truss={club} ox={150} oy={420} s={s} progress={prog(frame, c[0], 30)} />
        </g>
        <g opacity={prog(frame, c[2], 16)}>
          <T x={140} y={530} anchor="start" size={26} weight={700} color={C.good}>
            최종 설계 (Warren, 실제 프로그램 통과)
          </T>
          <TrussView truss={fd} ox={150} oy={740} s={s} widthOf={(i) => (fd.mm[i] / 150) * 11} progress={prog(frame, c[2], 30)} />
        </g>
      </svg>
      <div style={{ position: "absolute", left: 1090, top: 215, width: 690 }}>
        {rows.map((r, i) => (
          <Appear key={i} at={r.at} style={{ position: "relative", marginBottom: 16 }}>
            <Card accent={i === 1 ? C.good : undefined} style={{ padding: "16px 22px" }}>
              <div style={{ fontSize: 26, fontWeight: 700, color: r.col }}>{r.name}</div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 4 }}>
                <span style={{ fontSize: 38, fontWeight: 700 }}>{r.cost}</span>
                <span style={{ fontSize: 28, fontWeight: 700, color: C.good }}>{r.d}</span>
              </div>
              <div style={{ fontSize: 22, color: C.muted, marginTop: 2 }}>{r.meta}</div>
            </Card>
          </Appear>
        ))}
      </div>
      <Appear at={c[4]} style={{ left: 1090, top: 720, width: 690 }}>
        <Pill bg="#E6E9ED" color={C.ink} style={{ fontSize: 28 }}>
          강재 최소 ≠ 비용 최소
        </Pill>
      </Appear>
      <Appear at={c[5]} style={{ left: 150, top: 800, width: 900 }}>
        <div style={{ fontSize: 24, color: C.ink2 }}>
          실제 프로그램 최대값: 압축비 0.974 · 인장비 0.969 · 세장비 287.0 → <b style={{ color: C.good }}>통과</b>
        </div>
      </Appear>
      <Appear at={c[0]} style={{ left: 600, top: 232 }}>
        <Legend style={{ position: "relative", fontSize: 22, gap: 24 }} items={[[C.comp, "눌림"], [C.tens, "당김"], [C.muted, "선 굵기 = 부재 굵기"]]} />
      </Appear>
    </SceneLayout>
  );
};
