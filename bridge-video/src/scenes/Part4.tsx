import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../lib/theme";
import { lerp, prog } from "../lib/anim";
import { Line } from "../lib/timing";
import { SceneLayout, useCues } from "../components/Scene";
import { Appear, ArrowRight, Card, CheckIcon, CrossIcon, Pill, Stamp } from "../components/ui";
import { TrussView } from "../components/TrussView";
import { Truck } from "../components/Truck";
import { warrenArch } from "../lib/truss";

const CH = "4부 · 반전";
const svgAbs: React.CSSProperties = { position: "absolute", left: 0, top: 0 };

/* ================= 26.6% ================= */
export const TWIST_LINES: Line[] = [
  "처음 계산은 동아리 최종안보다 **26.6%**나 더 싸게 만들 수 있다고 했어요.",
  "손계산 예제와 비교하는 점검, 모든 절점에서 힘의 평형을 확인하는 점검도 모두 통과했어요.",
  "점검하면서 계산 오류 3개를 찾아 고치기도 했죠.",
  "그런데 이 답은 **실제 프로그램**에서 무너졌어요. 이 탐구에서 가장 중요한 전환점이에요.",
];

export const TwistScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(TWIST_LINES);
  const strike = prog(frame, c[3] + 6, 16);
  const checks = [
    { at: c[1], t: "손계산 예제와 비교" },
    { at: c[1] + 25, t: "모든 절점에서 힘의 평형 확인" },
    { at: c[2], t: "자체 점검으로 오류 3개 발견·수정", sub: "자중 2배 적용 · 규격 상향 후 자중 누락 · 마지막 위치 트럭 하중 절반" },
  ];
  return (
    <SceneLayout chapter={CH} title="26.6%라는 답은 틀렸다" lines={TWIST_LINES}>
      <Appear at={c[0]} style={{ left: 160, top: 250, width: 700 }}>
        <div style={{ fontSize: 30, color: C.muted, fontWeight: 600 }}>처음 계산의 주장 · 동아리 최종안보다</div>
        <div style={{ position: "relative", display: "inline-block" }}>
          <div style={{ fontSize: 170, fontWeight: 700, letterSpacing: "-0.04em", color: C.ink }}>26.6%</div>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: "52%",
              height: 10,
              width: `${strike * 100}%`,
              background: C.bad,
              borderRadius: 5,
            }}
          />
        </div>
        <div style={{ fontSize: 40, fontWeight: 600, color: C.ink2 }}>더 싸게 만들 수 있다?</div>
      </Appear>
      <Stamp at={c[3] + 10} ok={false} text="실제 프로그램: 탈락" style={{ left: 200, top: 640 }} />
      <div style={{ position: "absolute", left: 960, top: 250, width: 800 }}>
        {checks.map((k, i) => (
          <Appear key={i} at={k.at} dx={-16} dy={0} style={{ position: "relative", marginBottom: 22 }}>
            <Card style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
              <CheckIcon size={44} />
              <div>
                <div style={{ fontSize: 34, fontWeight: 600 }}>{k.t}</div>
                {k.sub ? <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>{k.sub}</div> : null}
              </div>
            </Card>
          </Appear>
        ))}
      </div>
    </SceneLayout>
  );
};

/* ================= 1차 시험 ================= */
export const TEST1_LINES: Line[] = [
  "**1차 시험.** 계산이 찾은 높이 10미터 아치를 프로그램에 직접 그려 넣었어요. 결과는 **탈락**.",
  "부재 43개 중 **16개**가 세장비 300을 넘었어요.",
  "가장 심한 것은 9.95미터 길이에 35밀리미터 굵기를 쓴 부재로, 세장비가 **985**였어요.",
  "'당겨지는 부재는 꺾이지 않으니 가늘어도 된다'고 생각했지만, 프로그램은 **모든 부재**에 세장비 제한을 두고 있었어요.",
  "학생은 화면에 나온 숫자로부터 최소 굵기 식(길이 × 11.547)을 **거꾸로** 찾아냈어요.",
];

export const Test1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(TEST1_LINES);
  const t = warrenArch(10, 2.2);
  const len = t.members.map((m) => Math.hypot(t.nodes[m.a].x - t.nodes[m.b].x, t.nodes[m.a].y - t.nodes[m.b].y));
  const fail = new Set(
    len
      .map((l, i) => ({ l, i }))
      .sort((a, b) => b.l - a.l)
      .slice(0, 16)
      .map((o) => o.i),
  );
  const hl = prog(frame, c[1], 16);
  const s = 19;
  const bar = prog(frame, c[2] + 10, 30);
  return (
    <SceneLayout chapter={CH} title="1차 시험: 세장비를 몰랐다" lines={TEST1_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <TrussView
          truss={t}
          ox={150}
          oy={740}
          s={s}
          progress={prog(frame, c[0], 36)}
          mode="neutral"
          widthOf={() => 4}
          colorOf={(i) => (fail.has(i) && hl > 0 ? C.bad : undefined)}
          opacityOf={(i) => (fail.has(i) ? 1 : 1 - 0.55 * hl)}
        />
        <g opacity={prog(frame, c[0] + 20, 16)}>
          <line x1={150 + 22 * s} y1={740} x2={150 + 22 * s} y2={740 - 10 * s} stroke={C.muted} strokeWidth={2} strokeDasharray="6 6" />
          <text x={150 + 22 * s} y={740 - 10 * s - 22} textAnchor="middle" fontSize={26} fill={C.ink2} fontFamily="Pretendard" fontWeight={600}>
            높이 10m
          </text>
        </g>
      </svg>
      <Stamp at={c[0] + 50} ok={false} text="탈락" style={{ left: 170, top: 250 }} />
      <Appear at={c[1]} style={{ left: 1100, top: 220, width: 660 }}>
        <div style={{ fontSize: 28, color: C.muted, fontWeight: 600 }}>세장비 300을 넘은 부재</div>
        <div style={{ fontSize: 72, fontWeight: 700, color: C.bad }}>
          16 <span style={{ fontSize: 40, color: C.ink2 }}>/ 43개</span>
        </div>
      </Appear>
      <Appear at={c[2]} style={{ left: 1100, top: 380, width: 660 }}>
        <Card>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>가장 심한 부재 · 길이 9.95m, 굵기 35mm</div>
          <svg width={600} height={110} style={{ marginTop: 10 }}>
            <rect x={0} y={20} width={lerp(0, 560, bar)} height={34} rx={6} fill={C.badSoft} stroke={C.bad} strokeWidth={2} />
            <line x1={(300 / 985) * 560} y1={8} x2={(300 / 985) * 560} y2={70} stroke={C.ink} strokeWidth={3} />
            <text x={(300 / 985) * 560} y={98} textAnchor="middle" fontSize={22} fill={C.ink} fontFamily="Pretendard" fontWeight={600}>
              한계 300
            </text>
            <text x={lerp(0, 560, bar) - 10} y={46} textAnchor="end" fontSize={24} fill={C.bad} fontFamily="Pretendard" fontWeight={700} opacity={bar}>
              세장비 985
            </text>
          </svg>
        </Card>
      </Appear>
      <Appear at={c[3]} style={{ left: 1100, top: 610, width: 680 }}>
        <Pill bg={C.tensSoft} color={C.tens} style={{ fontSize: 28 }}>
          당겨지는 부재도 세장비 300 이하!
        </Pill>
      </Appear>
      <Appear at={c[4]} style={{ left: 1100, top: 680, width: 680 }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>
          화면의 숫자 → <span style={{ color: C.tens }}>최소 굵기 = 길이 × 11.547</span>
        </div>
        <div style={{ fontSize: 22, color: C.muted, marginTop: 6 }}>이 시험으로 규격이 80mm 이상에서 10mm 간격이라는 것도 확인</div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 2차 시험 ================= */
export const TEST2_LINES: Line[] = [
  "**2차 시험.** 세장비를 지키도록 고친 높이 6미터 아치를 다시 넣었어요. 또 **탈락**.",
  "이번에는 가는 사재 **8개**가 누르는 힘을 견디지 못했어요.",
  "결정적인 단서가 있었어요. 좌우 대칭인 다리인데, 거울 위치에 있는 두 부재의 **압축비**가 1.18과 1.73으로 달랐어요.",
  "압축비는 부재가 받는 누르는 힘을 버틸 수 있는 힘으로 나눈 값이에요. **1을 넘으면 탈락**이에요.",
  "구조가 대칭인데 힘이 다르다면, **하중이 대칭이 아니라는** 뜻이에요.",
  "실제 트럭은 뒷바퀴가 앞바퀴보다 약 **2.5배** 무겁고, 한 방향으로 지나가요.",
];

export const Test2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(TEST2_LINES);
  const t = warrenArch(6, 2.5);
  const s = 19;
  const ox = 150;
  const oy = 700;
  // 사재 인덱스: 21 + 2j, 22 + 2j (j = 0..10). 가운데 근처 8개
  const failSet = new Set([25, 26, 28, 29, 34, 35, 37, 38]);
  const pairL = 26;
  const pairR = 37;
  const hl = prog(frame, c[1], 16);
  const pair = prog(frame, c[2], 16);
  const mid = (i: number) => {
    const m = t.members[i];
    return { x: ox + ((t.nodes[m.a].x + t.nodes[m.b].x) / 2) * s, y: oy - ((t.nodes[m.a].y + t.nodes[m.b].y) / 2) * s };
  };
  const L = mid(pairL);
  const R = mid(pairR);
  const truckP = interpolate(frame, [c[5] + 10, c[5] + 120], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <SceneLayout chapter={CH} title="2차 시험: 트럭의 앞뒤가 다르다는 것을 몰랐다" lines={TEST2_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <TrussView
          truss={t}
          ox={ox}
          oy={oy}
          s={s}
          progress={prog(frame, c[0], 36)}
          mode="neutral"
          widthOf={(i) => (failSet.has(i) ? 3.5 : 5)}
          colorOf={(i) => (failSet.has(i) && hl > 0 ? C.bad : undefined)}
          opacityOf={(i) => (failSet.has(i) ? 1 : 1 - 0.55 * hl)}
        />
        <g opacity={pair}>
          {[
            { p: L, v: "1.18", dx: -70 },
            { p: R, v: "1.73", dx: 70 },
          ].map((o, i) => (
            <g key={i}>
              <circle cx={o.p.x} cy={o.p.y} r={26} fill="none" stroke={C.ink} strokeWidth={3} />
              <line x1={o.p.x} y1={o.p.y - 26} x2={o.p.x + o.dx} y2={o.p.y - 150} stroke={C.ink} strokeWidth={2} />
              <rect x={o.p.x + o.dx - 80} y={o.p.y - 210} width={160} height={58} rx={12} fill={C.card} stroke={C.ink} strokeWidth={2} />
              <text x={o.p.x + o.dx} y={o.p.y - 170} textAnchor="middle" fontSize={34} fontWeight={700} fill={C.bad} fontFamily="Pretendard">
                {o.v}
              </text>
            </g>
          ))}
          <text x={ox + 22 * s} y={oy - 6 * s - 120} textAnchor="middle" fontSize={26} fill={C.ink2} fontFamily="Pretendard" fontWeight={600}>
            거울 위치인데 압축비가 다르다
          </text>
          <line x1={ox + 22 * s} y1={oy + 20} x2={ox + 22 * s} y2={oy - 6 * s - 100} stroke={C.muted} strokeWidth={2} strokeDasharray="8 8" />
        </g>
        {/* 트럭 */}
        <g opacity={prog(frame, c[5], 16)}>
          <line x1={1120} y1={790} x2={1780} y2={790} stroke={C.ink2} strokeWidth={4} />
          <Truck rx={lerp(1160, 1360, truckP)} by={790} s={40} labels labelOpacity={1} />
          <path d={`M1640 720 h110 m-18 -14 l18 14 -18 14`} fill="none" stroke={C.ink2} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <text x={1695} y={700} textAnchor="middle" fontSize={24} fill={C.ink2} fontFamily="Pretendard">
            한 방향
          </text>
        </g>
      </svg>
      <Stamp at={c[0] + 50} ok={false} text="또 탈락" style={{ left: 170, top: 250 }} />
      <Appear at={c[1]} style={{ left: 1120, top: 225, width: 640 }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>
          가는 사재 <span style={{ color: C.bad }}>8개</span>가 압축을 못 견딤
        </div>
      </Appear>
      <Appear at={c[3]} style={{ left: 1120, top: 290, width: 640 }}>
        <Card style={{ padding: "16px 22px" }}>
          <div style={{ fontSize: 26, fontWeight: 700 }}>압축비 = 받는 누르는 힘 ÷ 버틸 수 있는 힘</div>
          <div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>1을 넘으면 탈락 (당기는 쪽은 인장비)</div>
        </Card>
      </Appear>
      <Appear at={c[4]} style={{ left: 1120, top: 420, width: 640 }}>
        <Pill bg={C.compSoft} color={C.bad} style={{ fontSize: 28 }}>
          대칭 구조 + 다른 힘 → 하중이 비대칭
        </Pill>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 규칙 확정 ================= */
export const RULE_LINES: Line[] = [
  "시험 결과에 숫자를 맞춰서 트럭 무게를 추정해 볼 수도 있었어요.",
  "하지만 그건 **정답지를 보고 푸는 것**과 같다고 판단했어요. 다른 설계에서도 맞는다는 보장이 없으니까요.",
  "대신 **통과 조건 자체를 식으로 확정**하기로 했어요.",
  "이 프로그램은 소스 코드가 공개되어 있어서, **다른 AI 도구**로 소스 코드에서 규칙을 찾아왔어요.",
  "그리고 그 규칙을 그대로 믿지 않고, 앞선 두 시험의 실제 값 **258개**와 대조했어요.",
  "모두 소수 둘째 자리까지 맞았어요. 코드를 학생이 직접 읽은 것은 아니지만, 검증과 판단은 학생이 했어요.",
];

export const RuleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(RULE_LINES);
  const flow = [
    { t: "공개된 소스 코드", sub: "프로그램의 통과 조건", at: c[3] },
    { t: "다른 AI 도구", sub: "코드에서 규칙을 찾음", at: c[3] + 30 },
    { t: "그대로 믿지 않기", sub: "실제 시험값과 대조", at: c[4] },
    { t: "258개 모두 일치", sub: "부재 86개 × 3가지 값", at: c[5], ok: true },
  ];
  const dimWrong = prog(frame, c[1] + 30, 16);
  return (
    <SceneLayout chapter={CH} title="숫자를 맞추지 않고 규칙을 확정하다" lines={RULE_LINES}>
      <Appear at={c[0]} style={{ left: 160, top: 220, width: 760 }}>
        <Card style={{ height: 190, boxSizing: "border-box", opacity: 1 - 0.45 * dimWrong }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <CrossIcon size={46} />
            <div style={{ fontSize: 36, fontWeight: 700 }}>결과에 숫자 맞추기</div>
          </div>
          <div style={{ fontSize: 27, color: C.ink2, marginTop: 14, lineHeight: 1.45 }}>
            시험 결과에 맞춰 트럭 무게를 추정
            <br />→ 정답지를 보고 푸는 것과 같다
          </div>
        </Card>
      </Appear>
      <Appear at={c[2]} style={{ left: 1000, top: 220, width: 760 }}>
        <Card accent={C.good} style={{ height: 190, boxSizing: "border-box" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <CheckIcon size={46} />
            <div style={{ fontSize: 36, fontWeight: 700 }}>규칙(통과 조건) 확정하기</div>
          </div>
          <div style={{ fontSize: 27, color: C.ink2, marginTop: 14, lineHeight: 1.45 }}>
            통과 조건 자체를 식으로 정한다
            <br />→ 처음 보는 설계에도 쓸 수 있다
          </div>
        </Card>
      </Appear>
      {flow.map((f, i) => (
        <React.Fragment key={i}>
          <Appear at={f.at} style={{ left: 160 + i * 410, top: 480, width: 350 }}>
            <Card accent={f.ok ? C.good : undefined} style={{ height: 150, boxSizing: "border-box", textAlign: "center", padding: "26px 16px" }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: f.ok ? C.good : C.ink }}>{f.t}</div>
              <div style={{ fontSize: 24, color: C.muted, marginTop: 10 }}>{f.sub}</div>
            </Card>
          </Appear>
          {i < flow.length - 1 ? (
            <Appear at={flow[i + 1].at} dy={0} dx={-10} style={{ left: 160 + i * 410 + 356, top: 543 }}>
              <ArrowRight w={50} />
            </Appear>
          ) : null}
        </React.Fragment>
      ))}
      <Appear at={c[5] + 20} style={{ left: 160, top: 680, width: 1600 }}>
        <div style={{ fontSize: 26, color: C.muted, textAlign: "center" }}>
          258개 = 부재 86개(두 시험) × 압축비·인장비·세장비 · 소수 둘째 자리까지 일치
        </div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 3차 시험 ================= */
export const TEST3_LINES: Line[] = [
  "**3차 시험.** 확정한 규칙으로 최종 설계를 만든 뒤, 프로그램에 넣기 **전에** 부재 43개의 예측값을 먼저 적었어요.",
  "결과 보고서의 **215개** 값이 모두 맞았고, 판정도 예측대로 **통과**였어요.",
  "결과를 보고 맞춘 게 아니라, **미리 적은 예측이 맞는지** 확인한 거예요.",
  "앞의 258개까지 합하면, 실제 프로그램 값 **473개**와 일치한 셈이에요.",
];

export const Test3Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(TEST3_LINES);
  const rows = [
    ["세장비", "0.0049"],
    ["압축력", "0.0065kN"],
    ["압축 내력", "0.0047kN"],
    ["인장력", "0.0050kN"],
    ["인장 내력", "0.0025kN"],
  ];
  return (
    <SceneLayout chapter={CH} title="3차 시험: 예측을 먼저 적다" lines={TEST3_LINES}>
      <Appear at={c[0]} style={{ left: 160, top: 230, width: 460 }}>
        <Card style={{ height: 420, boxSizing: "border-box", background: "#FCFBF7" }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>① 시험 전에</div>
          <div style={{ fontSize: 38, fontWeight: 700, marginTop: 6 }}>예측값 먼저 기록</div>
          <div style={{ fontSize: 26, color: C.ink2, marginTop: 6 }}>부재 43개 × 5가지 값</div>
          <svg width={400} height={200} style={{ marginTop: 18 }}>
            {Array.from({ length: 6 }, (_, i) => (
              <line
                key={i}
                x1={0}
                y1={20 + i * 34}
                x2={lerp(0, 380 - (i % 3) * 60, prog(frame, c[0] + 20 + i * 8, 16))}
                y2={20 + i * 34}
                stroke="#B9BEC5"
                strokeWidth={6}
                strokeLinecap="round"
              />
            ))}
          </svg>
        </Card>
      </Appear>
      <Appear at={c[1]} dy={0} dx={-10} style={{ left: 640, top: 420 }}>
        <ArrowRight w={70} />
      </Appear>
      <Appear at={c[1]} style={{ left: 740, top: 230, width: 1020 }}>
        <Card style={{ height: 420, boxSizing: "border-box" }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>② 실제 프로그램 결과와 비교</div>
          <div style={{ display: "flex", fontSize: 24, color: C.muted, marginTop: 14, paddingBottom: 8, borderBottom: `1.5px solid ${C.line}` }}>
            <span style={{ width: 260 }}>항목</span>
            <span style={{ width: 200 }}>일치</span>
            <span>최대 오차</span>
          </div>
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                fontSize: 30,
                padding: "7px 0",
                borderBottom: `1.5px solid ${C.line}`,
                opacity: prog(frame, c[1] + 10 + i * 8, 12),
              }}
            >
              <span style={{ width: 260, fontWeight: 600 }}>{r[0]}</span>
              <span style={{ width: 200, display: "flex", alignItems: "center", gap: 10, fontWeight: 700, color: C.good }}>
                <CheckIcon size={30} /> 43 / 43
              </span>
              <span style={{ color: C.ink2 }}>{r[1]}</span>
            </div>
          ))}
          <div style={{ fontSize: 30, fontWeight: 700, marginTop: 12, opacity: prog(frame, c[1] + 60, 12) }}>
            215개 모두 일치 · 판정 <span style={{ color: C.good }}>통과 (예측과 동일)</span>
          </div>
        </Card>
      </Appear>
      <Appear at={c[3]} style={{ left: 0, right: 0, top: 700, textAlign: "center" }}>
        <div style={{ fontSize: 44, fontWeight: 700 }}>
          258 + 215 = <span style={{ color: C.good }}>473개</span> 일치
        </div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 교훈 ================= */
export const LESSON_LINES: Line[] = [
  "검증을 거친 뒤 26.6%는 **9.7%**가 되었어요.",
  "검증하지 않았다면 약 **세 배** 부풀려진 숫자를 결론으로 썼을 거예요.",
  "자체 점검은 **이미 아는 조건**만 확인할 수 있어요.",
  "모르는 조건은 실제 프로그램이라는 **바깥 기준**과 비교해야만 드러나요.",
];

export const LessonScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(LESSON_LINES);
  const p = prog(frame, c[0] + 10, 40);
  const maxW = 640;
  const unit = maxW / 26.6;
  return (
    <SceneLayout chapter={CH} title="자체 점검은 아는 조건만 확인한다" lines={LESSON_LINES}>
      <Appear at={c[0]} style={{ left: 160, top: 240, width: 820 }}>
        <div style={{ fontSize: 28, color: C.muted, fontWeight: 600 }}>동아리 최종안 대비 추가 절감</div>
        {[
          { label: "검증 전", v: 26.6, col: "#B9BEC5", w: 26.6 * unit },
          { label: "검증 후", v: 9.7, col: C.good, w: lerp(26.6, 9.7, p) * unit },
        ].map((b, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 26 }}>
            <div style={{ width: 120, fontSize: 30, fontWeight: 600 }}>{b.label}</div>
            <div style={{ width: b.w, height: 56, background: b.col, borderRadius: 8 }} />
            <div style={{ fontSize: 40, fontWeight: 700, color: i === 1 ? C.good : C.ink2 }}>
              {i === 0 ? "26.6%" : `${lerp(26.6, 9.7, p).toFixed(1)}%`}
            </div>
          </div>
        ))}
      </Appear>
      <Appear at={c[1]} style={{ left: 300, top: 520 }}>
        <Pill bg={C.compSoft} color={C.bad} style={{ fontSize: 30 }}>
          검증 없이는 약 3배 부풀려진 결론
        </Pill>
      </Appear>
      <svg width={1920} height={1080} style={svgAbs}>
        <g opacity={prog(frame, c[3], 18)}>
          <circle cx={1400} cy={500} r={290} fill="#EEF2F5" stroke={C.tens} strokeWidth={3} />
          <text x={1400} y={268} textAnchor="middle" fontSize={28} fill={C.tens} fontWeight={700} fontFamily="Pretendard">
            바깥 기준: 실제 프로그램
          </text>
        </g>
        <g opacity={prog(frame, c[2], 18)}>
          <circle cx={1400} cy={520} r={130} fill={C.card} stroke={C.ink2} strokeWidth={3} />
          <text x={1400} y={512} textAnchor="middle" fontSize={28} fill={C.ink} fontWeight={700} fontFamily="Pretendard">
            자체 점검
          </text>
          <text x={1400} y={550} textAnchor="middle" fontSize={22} fill={C.muted} fontFamily="Pretendard">
            아는 조건만
          </text>
        </g>
        <g opacity={prog(frame, c[3] + 25, 18)} fontFamily="Pretendard">
          {[
            { x: 1400, y: 330, t: "세장비 제한" },
            { x: 1215, y: 700, t: "트럭 앞뒤 바퀴" },
            { x: 1585, y: 700, t: "규격 목록" },
          ].map((o, i) => (
            <g key={i}>
              <rect x={o.x - 105} y={o.y - 30} width={210} height={46} rx={23} fill={C.tensSoft} />
              <text x={o.x} y={o.y + 2} textAnchor="middle" fontSize={24} fill={C.tens} fontWeight={700}>
                {o.t}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </SceneLayout>
  );
};
