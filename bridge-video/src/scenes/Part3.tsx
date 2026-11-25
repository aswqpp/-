import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../lib/theme";
import { prog } from "../lib/anim";
import { Line } from "../lib/timing";
import { SceneLayout, useCues } from "../components/Scene";
import { Appear, Card, Pill } from "../components/ui";
import { TrussView } from "../components/TrussView";
import { finalDesign } from "../lib/truss";

export const PROGRAM_LINES: Line[] = [
  "설계 수만 개를 손으로 비교할 수는 없어서, **AI의 도움**을 받아 계산 프로그램을 만들었어요.",
  "무엇을 계산하고 무엇을 비교할지는 **학생이 직접** 정했어요.",
  "① 다리 모양을 정한다. 윗선 높이와 사재 방향을 고른다.",
  "② 하중을 싣는다. 바닥판 무게와 함께, 트럭을 한 칸씩 옮기며 싣는다.",
  "트럭은 뒷바퀴 **421kN**, 앞바퀴 **165kN**이에요. (1kN은 약 100kg의 무게, 안전 배수를 곱한 값)",
  "③ 부재마다 힘을 구한다.",
  "④ 세장비·좌굴·인장 조건을 모두 만족하는 **가장 가는 굵기**를 구한다.",
  "⑤ 비슷한 굵기를 묶어 규격 종류를 줄인다. 강철은 조금 늘지만 규격 하나당 1,000달러가 준다.",
  "⑥ 네 가지 비용을 더한다.",
  "이 과정을 모양 **87가지** × 사재 배치 **512가지**, 모두 **44,544개** 설계에 반복했어요.",
];

const STEP_W = 500;
const STEP_H = 250;

export const ProgramScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(PROGRAM_LINES);
  const fd = finalDesign();
  const roles = prog(frame, c[0], 18) * (1 - prog(frame, c[2] - 12, 12));
  const s = 9.6;
  const mini = (k: number) => {
    const ox = 18;
    const oy = 120;
    if (k === 0)
      return (
        <svg width={460} height={140}>
          <TrussView truss={fd} ox={ox} oy={oy} s={s} mode="soft" widthOf={() => 2.5} nodes={false} />
          <line x1={ox + 22 * s} y1={oy} x2={ox + 22 * s} y2={oy - 5.75 * s} stroke={C.tens} strokeWidth={3} />
          <path d={`M${ox + 22 * s - 7} ${oy - 5.75 * s + 9} l7 -9 l7 9`} fill="none" stroke={C.tens} strokeWidth={3} />
        </svg>
      );
    if (k === 1)
      return (
        <svg width={460} height={140}>
          <TrussView truss={fd} ox={ox} oy={oy} s={s} mode="soft" widthOf={() => 2.5} nodes={false} />
          {Array.from({ length: 10 }, (_, i) => (
            <line key={i} x1={ox + (4 + 4 * i) * s} y1={oy + 2} x2={ox + (4 + 4 * i) * s} y2={oy + 16} stroke={C.ink2} strokeWidth={2.5} />
          ))}
          <rect x={ox + 14 * s} y={oy - 20} width={6 * s} height={14} rx={3} fill={C.ink2} />
          <circle cx={ox + 15 * s} cy={oy - 4} r={4} fill={C.ink2} />
          <circle cx={ox + 19 * s} cy={oy - 4} r={4} fill={C.ink2} />
        </svg>
      );
    if (k === 2)
      return (
        <svg width={460} height={140}>
          <TrussView truss={fd} ox={ox} oy={oy} s={s} widthOf={() => 3.5} nodes={false} />
        </svg>
      );
    if (k === 3)
      return (
        <svg width={460} height={140}>
          <TrussView truss={fd} ox={ox} oy={oy} s={s} widthOf={(i) => (fd.mm[i] / 150) * 7} nodes={false} />
        </svg>
      );
    if (k === 4)
      return (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, width: 440, marginTop: 6 }}>
          {[65, 80, 90, 110, 120, 150].map((mm) => (
            <span key={mm} style={{ fontSize: 22, padding: "4px 12px", borderRadius: 8, background: "#ECEAE4", color: C.ink2, fontWeight: 600 }}>
              {mm}mm
            </span>
          ))}
          <div style={{ fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 6 }}>9종 → 6종으로 묶음</div>
        </div>
      );
    const parts = [
      { v: 138997, col: "#9AA3AD", t: "재료비" },
      { v: 18400, col: "#6E7883", t: "연결비" },
      { v: 6000, col: "#3F4850", t: "제품비" },
      { v: 67600, col: "#D9D6CE", t: "부지비" },
    ];
    const total = parts.reduce((a, p) => a + p.v, 0);
    let x = 0;
    return (
      <div style={{ width: 440, marginTop: 4 }}>
        <svg width={440} height={40}>
          {parts.map((p, i) => {
            const w = (p.v / total) * 440;
            const el = <rect key={i} x={x + 1} y={4} width={Math.max(2, w - 2)} height={30} rx={4} fill={p.col} />;
            x += w;
            return el;
          })}
        </svg>
        <div style={{ fontSize: 19, color: C.ink2, lineHeight: 1.45 }}>
          재료비 138,997 · 연결비 18,400 · 제품비 6,000 · 부지비 67,600
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.good, marginTop: 2 }}>합계 230,997달러 (최종 설계)</div>
      </div>
    );
  };
  const steps = [
    { n: "①", t: "다리 모양을 정한다", sub: "윗선 높이 · 사재 방향", at: c[2] },
    { n: "②", t: "하중을 싣는다", sub: "바닥판 + 트럭(한 칸씩 이동)", at: c[3] },
    { n: "③", t: "부재마다 힘을 구한다", sub: "눌림 / 당김", at: c[5] },
    { n: "④", t: "가장 가는 굵기를 구한다", sub: "세장비 · 좌굴 · 인장 조건", at: c[6] },
    { n: "⑤", t: "비슷한 굵기를 묶는다", sub: "규격 종류 줄이기", at: c[7] },
    { n: "⑥", t: "비용을 더한다", sub: "네 가지 비용의 합", at: c[8] },
  ];
  const activeIdx = [c[2], c[3], c[5], c[6], c[7], c[8]].reduce((acc, f, i) => (frame >= f ? i : acc), -1);
  return (
    <SceneLayout chapter="3부 · 계산 프로그램" title="계산 프로그램은 다리 하나를 이렇게 평가한다" lines={PROGRAM_LINES}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 330, display: "flex", justifyContent: "center", gap: 60, opacity: roles }}>
        <Card style={{ width: 620, textAlign: "center", padding: "34px 30px" }}>
          <div style={{ fontSize: 30, color: C.muted, fontWeight: 600 }}>AI의 도움</div>
          <div style={{ fontSize: 42, fontWeight: 700, marginTop: 10 }}>계산 프로그램 작성</div>
        </Card>
        <Card accent={C.ink2} style={{ width: 620, textAlign: "center", padding: "34px 30px", opacity: prog(frame, c[1], 16) }}>
          <div style={{ fontSize: 30, color: C.muted, fontWeight: 600 }}>학생이 직접</div>
          <div style={{ fontSize: 42, fontWeight: 700, marginTop: 10 }}>무엇을 계산·비교할지 결정</div>
        </Card>
      </div>
      {steps.map((st, k) => (
        <Appear key={k} at={st.at} style={{ left: 160 + (k % 3) * (STEP_W + 50), top: 205 + Math.floor(k / 3) * (STEP_H + 22), width: STEP_W }}>
          <Card
            accent={activeIdx === k ? C.ink2 : undefined}
            style={{ height: STEP_H, boxSizing: "border-box", padding: "18px 22px", opacity: activeIdx === k || frame >= c[9] ? 1 : 0.62 }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 32, fontWeight: 700 }}>{st.n}</span>
              <span style={{ fontSize: 30, fontWeight: 700 }}>{st.t}</span>
            </div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 2 }}>{st.sub}</div>
            <div style={{ marginTop: 6 }}>{mini(k)}</div>
          </Card>
        </Appear>
      ))}
      <Appear at={c[9]} style={{ left: 0, right: 0, top: 752, textAlign: "center" }}>
        <Pill bg="#E6E9ED" color={C.ink} style={{ fontSize: 34, padding: "10px 30px" }}>
          ①~⑥ 반복 · 모양 87가지 × 사재 배치 512가지 = <b>44,544개</b>
        </Pill>
      </Appear>
    </SceneLayout>
  );
};
