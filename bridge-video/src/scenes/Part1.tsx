import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT, fmt } from "../lib/theme";
import { ease, lerp, prog } from "../lib/anim";
import { Line } from "../lib/timing";
import { Captions, SceneLayout, useCues } from "../components/Scene";
import { Appear, ArrowRight, Card, CountUp, Pill } from "../components/ui";
import { TrussView } from "../components/TrussView";
import { Truck } from "../components/Truck";
import { clubDesign, finalDesign } from "../lib/truss";

/* ================= 제목 ================= */
export const TITLE_LINES: Line[] = [
  "이 영상은 '강 트러스교 비용 최소화' 탐구 보고서를 처음부터 끝까지 정리한 거예요.",
  "탐구의 흐름, 핵심 개념, 숫자의 뜻을 차례로 따라가 볼게요.",
];

export const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fd = finalDesign();
  const s = 26;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.ink }}>
      <Appear at={4} style={{ left: 0, right: 0, top: 150, textAlign: "center" }}>
        <div style={{ fontSize: 30, color: C.muted, fontWeight: 600 }}>운호고등학교 블루프린트 · 개인 탐구 · 2512 민성범</div>
      </Appear>
      <Appear at={10} style={{ left: 0, right: 0, top: 205, textAlign: "center" }}>
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: "-0.03em" }}>다리를 가장 싸게 만드는 법</div>
      </Appear>
      <Appear at={18} style={{ left: 0, right: 0, top: 340, textAlign: "center" }}>
        <div style={{ fontSize: 40, color: C.ink2, fontWeight: 500 }}>강 트러스교 비용 최소화 탐구 · AI 계산을 실제 프로그램으로 검증하기</div>
      </Appear>
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        <TrussView truss={fd} ox={388} oy={790} s={s} progress={prog(frame, 20, 70)} widthOf={(i) => (fd.mm[i] / 150) * 11} />
      </svg>
      <Captions lines={TITLE_LINES} />
    </AbsoluteFill>
  );
};

/* ================= 1부: 무대 ================= */
export const STAGE_LINES: Line[] = [
  "동아리에서 조원들과 **ASCE Bridge Designer**라는 교량 설계 프로그램으로 강철 트러스 다리를 설계했어요.",
  "과제는 **트럭이 안전하게 지나가는 다리 중에서 가장 싼 다리**를 찾는 것이었어요.",
  "다리 길이는 **44미터**. 4미터 간격의 칸 **11개**로 나뉘어요.",
  "다리를 이루는 막대 하나하나를 **부재**라고 해요. 부재는 탄소강 정사각 막대이고, 굵기는 정해진 규격 목록에서 골라요.",
  "다리에 실리는 무게(**하중**)는 바닥판 무게, 부재 자신의 무게, 그리고 지나가는 트럭이에요.",
  "프로그램으로 하중 시험을 돌리면 결과는 **통과** 또는 **탈락**으로 나와요.",
];

const InfoCard: React.FC<{ label: string; value: string; sub?: string; at: number; left: number }> = ({
  label,
  value,
  sub,
  at,
  left,
}) => (
  <Appear at={at} style={{ left, top: 205, width: 380 }}>
    <Card style={{ height: 150, boxSizing: "border-box" }}>
      <div style={{ fontSize: 24, color: C.muted, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 33, fontWeight: 700, marginTop: 6, letterSpacing: "-0.02em" }}>{value}</div>
      {sub ? <div style={{ fontSize: 24, color: C.ink2, marginTop: 4 }}>{sub}</div> : null}
    </Card>
  </Appear>
);

export const StageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(STAGE_LINES);
  const s = 24;
  const ox = 432;
  const oy = 680;
  const club = clubDesign();
  const truckX = interpolate(frame, [c[1] + 10, c[2] + 20], [ox - 7 * s, ox + 47 * s], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const truckOp = interpolate(frame, [c[1], c[1] + 10, c[2] + 20, c[2] + 30], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dim = prog(frame, c[2], 20);
  return (
    <SceneLayout chapter="1부 · 무대" title="동아리에서 한 일" lines={STAGE_LINES}>
      <InfoCard at={c[2]} left={164} label="다리 길이" value="44m" sub="4m 간격의 칸 11개" />
      <InfoCard at={c[3]} left={568} label="부재" value="탄소강 정사각 막대" sub="굵기는 규격 목록에서 고름" />
      <InfoCard at={c[4]} left={972} label="하중" value="바닥판 + 부재 + 트럭" sub="다리에 실리는 무게" />
      <InfoCard at={c[5]} left={1376} label="판정" value="통과 또는 탈락" sub="프로그램의 하중 시험" />
      <svg width={1920} height={1080} style={{ position: "absolute" }}>
        {/* 강과 둑 */}
        <rect x={0} y={oy + 6} width={1920} height={140} fill={C.water} />
        <path d={`M0 ${oy} H${ox + 8} L${ox + 70} ${oy + 146} H0 Z`} fill={C.ground} />
        <path d={`M1920 ${oy} H${ox + 44 * s - 8} L${ox + 44 * s - 70} ${oy + 146} H1920 Z`} fill={C.ground} />
        <TrussView truss={club} ox={ox} oy={oy} s={s} mode="neutral" widthOf={() => 5} progress={prog(frame, 4, 50)} />
        {/* 치수 */}
        <g opacity={dim}>
          <line x1={ox} y1={oy + 56} x2={ox + 44 * s} y2={oy + 56} stroke={C.ink2} strokeWidth={2.5} />
          {Array.from({ length: 12 }, (_, i) => (
            <line key={i} x1={ox + i * 4 * s} y1={oy + 46} x2={ox + i * 4 * s} y2={oy + 66} stroke={C.ink2} strokeWidth={2.5} />
          ))}
          <rect x={ox + 22 * s - 70} y={oy + 36} width={140} height={42} rx={10} fill={C.card} />
          <text x={ox + 22 * s} y={oy + 67} textAnchor="middle" fontSize={32} fontWeight={700} fill={C.ink} fontFamily="Pretendard">
            44m
          </text>
          <text x={ox + 2 * s} y={oy + 98} textAnchor="middle" fontSize={24} fill={C.ink2} fontFamily="Pretendard">
            4m
          </text>
        </g>
        <g opacity={truckOp}>
          <Truck rx={truckX} by={oy} s={s} />
        </g>
      </svg>
    </SceneLayout>
  );
};

/* ================= 비용 네 가지 ================= */
export const COST_LINES: Line[] = [
  "다리의 총비용은 네 가지 비용을 더한 값이에요.",
  "**재료비**: 강철 1킬로그램당 4.30달러. 강철을 적게 쓸수록 싸요.",
  "**연결비**: 부재가 만나는 점(**절점**) 하나당 800달러. 구조가 단순할수록 싸요.",
  "**제품비**: 부재 규격 한 종류당 1,000달러. 규격을 통일할수록 싸요.",
  "**부지비**: 67,600달러로 고정이에요. 그래서 설계로 줄일 수 있는 건 앞의 세 가지뿐이에요.",
];

const CostIcon: React.FC<{ kind: number }> = ({ kind }) => {
  if (kind === 0)
    return (
      <svg width={150} height={110}>
        {[0, 1, 2].map((i) => (
          <rect key={i} x={20 + i * 8} y={70 - i * 22} width={110 - i * 16} height={18} rx={4} fill="#AEB5BD" />
        ))}
        <text x={120} y={30} fontSize={24} fontWeight={700} fill={C.ink2} fontFamily="Pretendard">
          kg
        </text>
      </svg>
    );
  if (kind === 1)
    return (
      <svg width={150} height={110}>
        {[
          [-60, 30],
          [60, 30],
          [-35, -40],
          [35, -40],
          [0, -48],
        ].map(([dx, dy], i) => (
          <line key={i} x1={75} y1={70} x2={75 + dx} y2={70 + dy} stroke="#AEB5BD" strokeWidth={9} strokeLinecap="round" />
        ))}
        <circle cx={75} cy={70} r={13} fill={C.ink} />
      </svg>
    );
  if (kind === 2)
    return (
      <svg width={150} height={110}>
        {[
          [18, 22, "65"],
          [58, 30, "90"],
          [104, 40, "150"],
        ].map(([x, w, t], i) => (
          <g key={i}>
            <rect x={Number(x) - 4} y={84 - Number(w)} width={Number(w)} height={Number(w)} rx={3} fill="#AEB5BD" />
            <text x={Number(x) - 4 + Number(w) / 2} y={104} textAnchor="middle" fontSize={18} fill={C.ink2} fontFamily="Pretendard">
              {t}
            </text>
          </g>
        ))}
      </svg>
    );
  return (
    <svg width={150} height={110}>
      <rect x={0} y={78} width={150} height={26} fill={C.water} />
      <path d="M0 60 H40 L58 104 H0 Z" fill="#D6CFC0" />
      <path d="M150 60 H110 L92 104 H150 Z" fill="#D6CFC0" />
      <rect x={52} y={18} width={46} height={36} rx={6} fill="none" stroke={C.muted} strokeWidth={4} />
      <path d="M61 18 v-8 a14 14 0 0 1 28 0 v8" fill="none" stroke={C.muted} strokeWidth={4} />
    </svg>
  );
};

export const CostScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(COST_LINES);
  const items = [
    { name: "재료비", price: "강철 1kg당 4.30달러", tip: "강철이 적을수록 유리" },
    { name: "연결비", price: "절점 1개당 800달러", tip: "구조가 단순할수록 유리" },
    { name: "제품비", price: "규격 1종류당 1,000달러", tip: "규격을 통일할수록 유리" },
    { name: "부지비", price: "67,600달러 고정", tip: "설계와 무관" },
  ];
  return (
    <SceneLayout chapter="1부 · 무대" title="다리 비용은 네 가지로 이루어진다" lines={COST_LINES}>
      {items.map((it, i) => {
        const at = c[i + 1];
        const active = frame >= at && (i === 3 || frame < c[i + 2]);
        const fixed = i === 3;
        return (
          <Appear key={i} at={at} style={{ left: 164 + i * 404, top: 220, width: 380 }}>
            <Card
              accent={active ? (fixed ? C.muted : C.ink2) : undefined}
              style={{
                height: 400,
                boxSizing: "border-box",
                background: fixed ? "#F1F0EC" : C.card,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                gap: 10,
                paddingTop: 30,
              }}
            >
              <CostIcon kind={i} />
              <div style={{ fontSize: 44, fontWeight: 700, color: fixed ? C.muted : C.ink }}>{it.name}</div>
              <div style={{ fontSize: 30, fontWeight: 600, color: fixed ? C.muted : C.ink }}>{it.price}</div>
              <div style={{ fontSize: 26, color: C.muted }}>{it.tip}</div>
            </Card>
          </Appear>
        );
      })}
      <Appear at={c[0] + 6} style={{ left: 0, right: 0, top: 660, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 600, color: C.ink2 }}>
          총비용 = 재료비 + 연결비 + 제품비 + <span style={{ color: C.muted }}>부지비(고정)</span>
        </div>
      </Appear>
      <Appear at={c[4] + 40} style={{ left: 164, top: 720, width: 1192 }}>
        <div
          style={{
            border: `3px solid ${C.good}`,
            borderTop: "none",
            height: 34,
            borderRadius: "0 0 16px 16px",
          }}
        />
        <div style={{ textAlign: "center", fontSize: 28, color: C.good, fontWeight: 700, marginTop: 8 }}>
          설계로 줄일 수 있는 비용
        </div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 43번의 수정 ================= */
export const CLUB_LINES: Line[] = [
  "조원들과 함께 다리를 **43번** 고쳐서 683,105달러를 255,865달러로 줄였어요. **62%** 절감이에요.",
  "그런데 이해되지 않는 일이 두 가지 있었어요.",
  "① 부재를 **얇게** 바꿨는데, 총비용이 오히려 **올라갔다**.",
  "② 더 **튼튼해 보이는** 모양이 더 **비쌌다**.",
  "이 의문이 개인 탐구의 출발점이에요. 43번의 반복은 조 활동이고, 개인 탐구는 그 이후의 일이에요.",
];

export const ClubScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(CLUB_LINES);
  const p = prog(frame, c[0] + 20, 70, ease);
  const w = lerp(700, 700 * (255865 / 683105), p);
  return (
    <SceneLayout chapter="1부 · 무대" title="43번 고쳐서 62%를 줄였다" lines={CLUB_LINES}>
      <Appear at={c[0]} style={{ left: 160, top: 240, width: 760 }}>
        <Pill>조원과 함께 43번 수정</Pill>
        <div style={{ fontSize: 30, color: C.muted, marginTop: 30, fontWeight: 600 }}>총비용</div>
        <div style={{ fontSize: 92, fontWeight: 700, letterSpacing: "-0.03em", marginTop: 4 }}>
          <CountUp from={683105} to={255865} at={c[0] + 20} dur={70} />
          <span style={{ fontSize: 44, marginLeft: 10 }}>달러</span>
        </div>
        <div style={{ position: "relative", height: 46, marginTop: 24 }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: 700, height: 46, borderRadius: 10, background: "#E6E4DE" }} />
          <div style={{ position: "absolute", left: 0, top: 0, width: w, height: 46, borderRadius: 10, background: C.good, opacity: 0.85 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", width: 700, marginTop: 12, fontSize: 26, color: C.muted }}>
          <span>처음 {fmt(683105)}달러</span>
          <span style={{ color: C.good, fontWeight: 700, opacity: p }}>−62%</span>
        </div>
      </Appear>
      {[
        { at: c[2], n: "①", a: "부재를 얇게 바꿨는데", b: "총비용이 올라갔다" },
        { at: c[3], n: "②", a: "더 튼튼해 보이는 모양이", b: "더 비쌌다" },
      ].map((q, i) => (
        <Appear key={i} at={q.at} style={{ left: 1020, top: 240 + i * 190, width: 740 }}>
          <Card style={{ display: "flex", alignItems: "center", gap: 26, height: 160, boxSizing: "border-box" }}>
            <div style={{ fontSize: 64, fontWeight: 700, color: C.comp }}>?</div>
            <div>
              <div style={{ fontSize: 34, fontWeight: 600 }}>
                {q.n} {q.a}
              </div>
              <div style={{ fontSize: 38, fontWeight: 700, color: C.comp, marginTop: 6 }}>{q.b}</div>
            </div>
          </Card>
        </Appear>
      ))}
      <Appear at={c[1]} style={{ left: 1020, top: 200 }}>
        <div style={{ fontSize: 28, color: C.muted, fontWeight: 600, marginTop: -6 }}>이해되지 않은 두 가지</div>
      </Appear>
      <Appear at={c[4]} style={{ left: 1020, top: 640, width: 740 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 32, fontWeight: 700, color: C.ink }}>
          <ArrowRight w={70} color={C.ink2} />
          개인 탐구의 출발점
        </div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 10 }}>43번 반복 = 조 활동 · 개인 탐구 = 그 이후</div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 첫 번째 의문의 답 ================= */
export const Q1_LINES: Line[] = [
  "첫 번째 의문의 답은 **제품비**에 있었어요.",
  "부재를 얇게 바꾸면 강철이 줄어서 재료비가 조금 줄어요.",
  "그런데 그 굵기가 **새로운 규격**이면, 제품비 **1,000달러**가 더 붙어요.",
  "강철로 아낀 돈보다 1,000달러가 더 크면, 얇게 바꿨는데도 **오히려 비싸지는** 거예요.",
  "두 번째 의문은 **다리 모양**과 관련이 있어요. 모양이 비용을 얼마나 바꾸는지는 뒤의 결과에서 볼게요.",
];

export const Q1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(Q1_LINES);
  const shrink = prog(frame, c[1], 30);
  const big = 90 * 2.6;
  const small = lerp(big, 80 * 2.6, shrink);
  const row = (at: number, label: string, val: string, note: string, col: string) => (
    <Appear at={at} dx={-20} dy={0} style={{ position: "relative" }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 24, padding: "16px 0", borderBottom: `1.5px solid ${C.line}` }}>
        <div style={{ width: 130, fontSize: 34, fontWeight: 700 }}>{label}</div>
        <div style={{ width: 280, fontSize: 40, fontWeight: 700, color: col, textAlign: "right" }}>{val}</div>
        <div style={{ fontSize: 26, color: C.muted }}>{note}</div>
      </div>
    </Appear>
  );
  return (
    <SceneLayout chapter="1부 · 무대" title="첫 번째 의문의 답: 제품비" lines={Q1_LINES}>
      <Appear at={c[0]} style={{ left: 160, top: 220, width: 620 }}>
        <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>예시 계산 · 길이 4m 부재 하나</div>
        <svg width={620} height={340} style={{ marginTop: 10 }}>
          <rect x={20} y={300 - big} width={big} height={big} rx={6} fill="#C3C9D0" />
          <text x={20 + big / 2} y={330} textAnchor="middle" fontSize={28} fontWeight={700} fill={C.ink2} fontFamily="Pretendard">
            90mm
          </text>
          <g opacity={shrink}>
            <path d="M282 170 h46 m-14 -12 l14 12 -14 12" fill="none" stroke={C.muted} strokeWidth={4} strokeLinecap="round" />
            <rect x={350} y={300 - small} width={small} height={small} rx={6} fill={C.tensSoft} stroke={C.tens} strokeWidth={3} />
            <text x={350 + small / 2} y={330} textAnchor="middle" fontSize={28} fontWeight={700} fill={C.tens} fontFamily="Pretendard">
              80mm (새 규격)
            </text>
          </g>
        </svg>
      </Appear>
      <div style={{ position: "absolute", left: 860, top: 250, width: 900 }}>
        {row(c[1], "재료비", "− 약 230달러", "강철 약 53kg 감소", C.good)}
        {row(c[2], "제품비", "+ 1,000달러", "규격 종류가 하나 늘어남", C.comp)}
        {row(c[3], "합계", "+ 약 770달러", "얇게 했는데 더 비싸짐", C.comp)}
      </div>
      <Appear at={c[3] + 20} style={{ left: 860, top: 560, width: 900 }}>
        <div style={{ fontSize: 26, color: C.muted, lineHeight: 1.5 }}>
          계산: (0.09² − 0.08²)m² × 4m × 7,850kg/m³ ≈ 53kg → 53kg × 4.30달러 ≈ 230달러
        </div>
      </Appear>
      <Appear at={c[4]} style={{ left: 860, top: 690, width: 900 }}>
        <Pill bg={C.tensSoft} color={C.tens}>
          두 번째 의문 → 다리 모양 (5부 결과)
        </Pill>
      </Appear>
    </SceneLayout>
  );
};
