import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../lib/theme";
import { lerp, prog } from "../lib/anim";
import { Line } from "../lib/timing";
import { Captions, Marked, SceneLayout, useCues } from "../components/Scene";
import { Appear, Card, Pill } from "../components/ui";
import { TrussView } from "../components/TrussView";
import { Truck } from "../components/Truck";
import { finalDesign } from "../lib/truss";

const CH = "6부 · 더 생각해 볼 점";
const svgAbs: React.CSSProperties = { position: "absolute", left: 0, top: 0 };

/* ================= 양방향 통행 ================= */
export const TWOWAY_LINES: Line[] = [
  "프로그램의 하중 시험에서 트럭은 **왼쪽에서 오른쪽으로만** 지나가요.",
  "이 조건으로만 최적화한 설계는 230,454달러였지만, 트럭을 반대로 보내면 내력비가 **1.100**으로 한계를 넘었어요.",
  "**내력비**는 받는 힘을 버틸 수 있는 힘으로 나눈 값(압축비·인장비)이에요. 1을 넘으면 탈락이에요.",
  "시험은 통과해도, 실제 다리라면 **반대 차로**에서 위험하죠.",
  "그래서 반대 방향 트럭도 계산 조건에 넣어 **좌우 대칭** 설계를 만들었고, 비용은 **543달러**만 늘었어요.",
  "동아리 최종안도 시험 방향은 0.985로 통과했지만, 반대 방향은 1.042였어요.",
  "동아리 설계가 틀린 것은 아니에요. **주어진 시험에서는 통과한** 설계예요.",
];

export const TwoWayScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(TWOWAY_LINES);
  const fd = finalDesign();
  const s = 17;
  const ox = 150;
  const oy = 560;
  const fwd = interpolate(frame, [c[0] + 10, c[0] + 120], [ox - 3 * s, ox + 44 * s], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const back = interpolate(frame, [c[1] + 40, c[1] + 160], [ox + 47 * s, ox + 6 * s], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const showBack = prog(frame, c[1] + 30, 12);
  return (
    <SceneLayout chapter={CH} title="양방향 통행과 대칭 설계" lines={TWOWAY_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <TrussView truss={fd} ox={ox} oy={oy} s={s} mode="neutral" widthOf={() => 4} />
        <g opacity={1 - showBack}>
          <Truck rx={fwd} by={oy} s={s} />
        </g>
        <g opacity={showBack}>
          <Truck rx={back} by={oy} s={s} flip />
        </g>
        <g opacity={prog(frame, c[0], 16)} fontFamily="Pretendard">
          <path d={`M${ox + 12 * s} ${oy + 60} h${20 * s} m-18 -14 l18 14 -18 14`} fill="none" stroke={C.ink2} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <text x={ox + 22 * s} y={oy + 112} textAnchor="middle" fontSize={26} fill={C.ink2} fontWeight={600}>
            프로그램 시험: 한 방향
          </text>
        </g>
        <g opacity={showBack} fontFamily="Pretendard">
          <path d={`M${ox + 32 * s} ${oy + 150} h${-20 * s} m18 -14 l-18 14 18 14`} fill="none" stroke={C.comp} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
          <text x={ox + 22 * s} y={oy + 202} textAnchor="middle" fontSize={26} fill={C.comp} fontWeight={600}>
            실제 다리: 반대 방향도 지나간다
          </text>
        </g>
      </svg>
      <div style={{ position: "absolute", left: 1050, top: 215, width: 730 }}>
        <Appear at={c[1]} style={{ position: "relative", marginBottom: 16 }}>
          <Card style={{ padding: "16px 22px" }}>
            <div style={{ fontSize: 24, color: C.muted, fontWeight: 600 }}>한 방향만 최적화</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>
              230,454달러 · 반대 방향 내력비 <span style={{ color: C.bad }}>1.100 (초과)</span>
            </div>
          </Card>
        </Appear>
        <Appear at={c[4]} style={{ position: "relative", marginBottom: 16 }}>
          <Card accent={C.good} style={{ padding: "16px 22px" }}>
            <div style={{ fontSize: 24, color: C.muted, fontWeight: 600 }}>양방향 조건 · 좌우 대칭 설계</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>
              +543달러 → <span style={{ color: C.good }}>230,997달러</span>
            </div>
          </Card>
        </Appear>
        <Appear at={c[5]} style={{ position: "relative", marginBottom: 16 }}>
          <Card style={{ padding: "16px 22px" }}>
            <div style={{ fontSize: 24, color: C.muted, fontWeight: 600 }}>동아리 최종안</div>
            <div style={{ fontSize: 30, fontWeight: 700, marginTop: 4 }}>
              시험 방향 <span style={{ color: C.good }}>0.985 통과</span> · 반대 방향 <span style={{ color: C.bad }}>1.042</span>
            </div>
          </Card>
        </Appear>
      </div>
      <Appear at={c[2]} style={{ left: 1050, top: 690, width: 730 }}>
        <div style={{ fontSize: 22, color: C.muted }}>내력비 = 받는 힘 ÷ 버틸 수 있는 힘 · 1을 넘으면 탈락</div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 43번의 반복은 어디까지 ================= */
export const REACH_LINES: Line[] = [
  "처음 설계 683,105달러에서 최종 설계까지, 줄일 수 있는 돈은 모두 **452,108달러**예요.",
  "조원과 함께 한 43번의 반복은 그중 427,240달러, 즉 **94.5%**를 이미 찾아냈어요.",
  "그럼 남은 차이는 어디서 왔을까요?",
  "동아리 최종안의 모양은 그대로 두고 굵기와 규격만 최적화하면 **1,955달러**밖에 줄지 않아요.",
  "나머지 **23,455달러**는 모양을 바꿔야 줄어요. 남은 차이의 **92%**가 모양에서 나온 거예요.",
  "43번의 반복은 부재를 거의 최선으로 다듬었고, 놓친 것은 **다리 모양 자체**였어요.",
];

export const ReachScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(REACH_LINES);
  const W = 1500;
  const x0 = 210;
  const fill = prog(frame, c[1], 40);
  const split = prog(frame, c[3], 30);
  const shape = prog(frame, c[4], 30);
  const zoomW = 1500;
  return (
    <SceneLayout chapter={CH} title="43번의 반복은 어디까지 왔나" lines={REACH_LINES}>
      <Appear at={c[0]} style={{ left: x0, top: 240, width: W }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 26, color: C.ink2, fontWeight: 600 }}>
          <span>처음 설계 683,105달러</span>
          <span>최종 설계 230,997달러</span>
        </div>
        <div style={{ position: "relative", height: 60, marginTop: 12, background: "#E6E4DE", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: 60, width: W * 0.945 * fill, background: C.good, opacity: 0.85 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12 }}>
          <span style={{ fontSize: 30, fontWeight: 700, color: C.good, opacity: fill }}>43번 반복이 찾은 절감 427,240달러 = 94.5%</span>
          <span style={{ fontSize: 26, color: C.muted, opacity: prog(frame, c[2], 16) }}>남은 차이 →</span>
        </div>
        <div style={{ fontSize: 24, color: C.muted, marginTop: 6 }}>줄일 수 있는 돈 전체 452,108달러</div>
      </Appear>
      <Appear at={c[2]} style={{ left: x0, top: 480, width: zoomW }}>
        <div style={{ fontSize: 26, color: C.ink2, fontWeight: 600 }}>남은 차이 확대 (한 방향 기준 25,410달러)</div>
        <div style={{ position: "relative", height: 70, marginTop: 12, background: "#E6E4DE", borderRadius: 10, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, height: 70, width: zoomW * (1955 / 25410) * split, background: "#8F969E" }} />
          <div
            style={{
              position: "absolute",
              left: zoomW * (1955 / 25410) + 3,
              top: 0,
              height: 70,
              width: (zoomW * (23455 / 25410) - 3) * shape,
              background: C.tens,
              opacity: 0.8,
            }}
          />
        </div>
        <div style={{ position: "relative", height: 90, marginTop: 12 }}>
          <div style={{ position: "absolute", left: 0, top: 0, opacity: split, fontSize: 24, color: C.ink2 }}>
            <b>1,955달러</b> · 굵기·규격만
          </div>
          <div style={{ position: "absolute", left: zoomW * 0.35, top: 0, opacity: shape, fontSize: 30, color: C.tens, fontWeight: 700 }}>
            23,455달러 · 모양을 바꿔야 줄어듦 = 92%
          </div>
        </div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 가장 싼 다리는 가장 약한 다리 ================= */
export const WEAK_LINES: Line[] = [
  "최종 설계에서 부재를 하나씩 없애 보았어요.",
  "43개 중 어느 하나가 빠져도, **43번 모두** 무너졌어요. 정정구조라서 남는 부재가 없기 때문이에요.",
  "1994년 성수대교 붕괴는 한 곳이 끊어졌을 때 그 힘을 나눠 받을 길이 없었다는 점에서 이 결과와 닮았어요.",
  "구조적 성격이 닮았다는 뜻이지, 같은 사고라는 뜻은 아니에요.",
  "부재를 더 넣어 힘이 돌아갈 길을 만들면 비용은 늘지만 버틸 수 있어요. **안전은 설계 단계에서 값을 치르고 사는 것**이에요.",
];

export const WeakScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(WEAK_LINES);
  const fd = finalDesign();
  const s = 26;
  const ox = 388;
  const oy = 560;
  const start = c[0] + 20;
  const step = 5;
  const idx = Math.floor((frame - start) / step);
  const count = Math.max(0, Math.min(43, idx + 1));
  const running = frame >= start && idx < 43;
  return (
    <SceneLayout chapter={CH} title="가장 싼 다리는 가장 약한 다리다" lines={WEAK_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <TrussView
          truss={fd}
          ox={ox}
          oy={oy}
          s={s}
          widthOf={(i) => (fd.mm[i] / 150) * 10}
          mode="neutral"
          colorOf={(i) => (running && i === idx ? C.bad : undefined)}
          opacityOf={(i) => (running && i === idx ? 0.35 : 1)}
        />
      </svg>
      <Appear at={c[0] + 10} style={{ left: 0, right: 0, top: 620, textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700 }}>
          부재 하나를 뺐을 때 무너진 경우: <span style={{ color: C.bad }}>{count} / 43</span>
        </div>
      </Appear>
      <Appear at={c[2]} style={{ left: 160, top: 220, width: 640 }}>
        <Card style={{ padding: "16px 22px" }}>
          <div style={{ fontSize: 24, color: C.muted, fontWeight: 600 }}>1994년 성수대교 붕괴</div>
          <div style={{ fontSize: 26, fontWeight: 600, marginTop: 4 }}>한 곳이 끊어졌을 때 힘을 나눠 받을 길이 부족</div>
          <div style={{ fontSize: 22, color: C.muted, marginTop: 4, opacity: prog(frame, c[3], 14) }}>구조적 성격이 닮았을 뿐, 같은 사고는 아니다</div>
        </Card>
      </Appear>
      <Appear at={c[4]} style={{ left: 0, right: 0, top: 700, textAlign: "center" }}>
        <Pill bg={C.goodSoft} color={C.good} style={{ fontSize: 30 }}>
          여유 부재 추가 → 비용 ↑, 하나가 끊어져도 버팀
        </Pill>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 배운 것 ================= */
export const LEARNED_LINES: Line[] = [
  "이 탐구에서 배운 것을 네 가지로 정리해 볼게요.",
  "첫째, 비용 항목들은 서로 맞바뀐다. 부재를 딱 맞게 깎는 것이 가장 싼 답은 아니에요.",
  "둘째, 좋은 모양에는 구조적인 이유가 있다. 포물선과 오래 쓰여 온 형식이 계산으로 다시 나타났어요.",
  "셋째, 계산은 실제로 검증한 만큼만 믿을 수 있다. AI는 계산을 빠르게 해 줬지만, 빠진 것은 알려 주지 않았어요.",
  "빠진 것을 찾아낸 건 실제 시험이었고, 시험을 설계하고 결과를 판단한 건 **학생**이었어요.",
  "넷째, 가장 싼 설계와 가장 좋은 설계는 다르다. 도로와 교량 같은 기반 시설에서는 비용과 안전 사이의 판단이 중요해요.",
];

export const LearnedScene: React.FC = () => {
  const c = useCues(LEARNED_LINES);
  const items = [
    { n: "1", t: "비용 항목들은 서로 맞바뀐다", d: "딱 맞게 깎은 부재 ≠ 가장 싼 답 (규격 6종)", at: c[1] },
    { n: "2", t: "좋은 모양에는 구조적 이유가 있다", d: "포물선 · 오래 쓰여 온 형식(71%)", at: c[2] },
    { n: "3", t: "계산은 검증한 만큼만 믿는다", d: "AI는 빨랐지만 빠진 조건은 실제 시험이 찾았다", at: c[3] },
    { n: "4", t: "가장 싼 설계 ≠ 가장 좋은 설계", d: "비용과 안전 사이의 판단 (43 / 43 붕괴)", at: c[5] },
  ];
  return (
    <SceneLayout chapter={CH} title="이 탐구에서 배운 것" lines={LEARNED_LINES}>
      {items.map((it, i) => (
        <Appear key={i} at={it.at} style={{ left: 160 + (i % 2) * 820, top: 230 + Math.floor(i / 2) * 290, width: 780 }}>
          <Card style={{ height: 250, boxSizing: "border-box", padding: "28px 32px" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: C.muted }}>{it.n}</div>
            <div style={{ fontSize: 40, fontWeight: 700, marginTop: 8, letterSpacing: "-0.02em" }}>{it.t}</div>
            <div style={{ fontSize: 27, color: C.ink2, marginTop: 14 }}>{it.d}</div>
          </Card>
        </Appear>
      ))}
    </SceneLayout>
  );
};

/* ================= 한 문장 정리 + 숫자 ================= */
export const SUMMARY_LINES: Line[] = [
  "마지막으로 이야기 전체를 한 문장으로 정리하면 이래요.",
  { t: "손으로 43번 고친 다리는 가능한 절감의 **94.5%**에 이미 닿아 있었고, 남은 **9.7%**는 다리 모양에서 나왔다.", s: 7.5 },
  { t: "그리고 이 사실은 AI로 만든 계산을 **실제 프로그램으로 세 번 시험**한 뒤에야 알 수 있었다.", s: 7 },
  "화면의 숫자들이 무엇을 뜻하는지 하나씩 다시 짚어 보세요.",
];

export const SummaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(SUMMARY_LINES);
  const tiles = [
    ["683,105 → 255,865", "조원과 43회 반복 (62% 절감)"],
    ["44,544개", "비교한 설계 (모양 87 × 배치 512)"],
    ["26.6% → 9.7%", "검증 전 주장 → 검증 후 실제 절감"],
    ["16개 · 985", "1차 시험: 세장비 초과 부재 · 최대 세장비"],
    ["1.18 · 1.73", "2차 시험: 거울 위치 두 부재의 압축비"],
    ["258 + 215 = 473", "규칙 대조 + 미리 적은 예측 = 일치한 값"],
    ["6종 · 106%", "가장 싼 규격 수 · 1종일 때 늘어나는 비율"],
    ["1.988 · 0.4%", "사재 힘이 0인 곡선 모수 · 포물선에서 사재 힘"],
    ["71%", "Howe나 Pratt이 가장 싼 모양의 비율"],
    ["230,997달러", "최종 설계 (Warren, 대칭, 통과)"],
    ["543달러", "양방향 통행을 위한 대칭 설계 비용"],
    ["94.5% · 92%", "43회 반복이 찾은 절감 · 남은 차이 중 모양 몫"],
  ];
  const showTiles = prog(frame, c[3], 20);
  const quote = prog(frame, c[1], 20) * (1 - showTiles);
  return (
    <SceneLayout chapter="정리" title="한 문장으로, 그리고 숫자로" lines={SUMMARY_LINES}>
      <div style={{ position: "absolute", left: 220, right: 220, top: 300, opacity: quote, textAlign: "center" }}>
        <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.6, wordBreak: "keep-all" }}>
          <Marked text="손으로 43번 고친 다리는 가능한 절감의 **94.5%**에 이미 닿아 있었고, 남은 **9.7%**는 다리 모양에서 나왔다." />
        </div>
        <div style={{ fontSize: 48, fontWeight: 600, lineHeight: 1.6, marginTop: 30, opacity: prog(frame, c[2], 20), wordBreak: "keep-all" }}>
          <Marked text="이 사실은 AI로 만든 계산을 **실제 프로그램으로 세 번 시험**한 뒤에야 알 수 있었다." />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          left: 120,
          right: 120,
          top: 200,
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          opacity: showTiles,
        }}
      >
        {tiles.map(([n, d], i) => (
          <div key={i} style={{ background: C.card, border: `1.5px solid ${C.line}`, borderRadius: 16, padding: "16px 18px", height: 172, boxSizing: "border-box", opacity: prog(frame, c[3] + i * 4, 14) }}>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: "-0.02em" }}>{n}</div>
            <div style={{ fontSize: 22, color: C.ink2, marginTop: 8, lineHeight: 1.4, wordBreak: "keep-all" }}>{d}</div>
          </div>
        ))}
      </div>
    </SceneLayout>
  );
};

/* ================= 정확하게 말해야 할 점 ================= */
export const PRECISE_LINES: Line[] = [
  "이 탐구를 설명할 때 정확하게 말해야 할 점도 짚고 갈게요.",
  "43회 반복은 조원과 함께 한 조 활동이에요. 개인 탐구는 그 이후의 일이에요.",
  "계산 프로그램은 AI의 도움으로, 소스 코드 속 규칙은 다른 AI 도구로 찾았어요. 검증·판단·시험은 학생이 했어요.",
  "최종 설계가 가장 싸다는 것은 여러 방법으로 확인한 **강한 근거**이지, 수학적 증명은 아니에요.",
  "Pratt과 Howe의 승패는 정확히 포물선에서가 아니라 포물선 **근처**(곡선 모수 1.75~2.5)에서 바뀌어요.",
  "성수대교와는 구조적 성격만 닮았을 뿐 같은 사고가 아니고, 동아리 최종안은 주어진 시험을 통과한 설계예요.",
];

export const PreciseScene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(PRECISE_LINES);
  const items = [
    "43회 반복 = 조원과 함께 한 조 활동, 개인 탐구는 그 이후",
    "계산 프로그램: AI의 도움 · 코드 속 규칙: 다른 AI 도구 · 검증·판단·시험: 학생",
    "최종 설계가 가장 싸다 = 강한 근거 (수학적 증명은 아님)",
    "Pratt / Howe 승패는 포물선 '근처'(곡선 모수 1.75~2.5)에서 바뀜",
    "성수대교와는 구조적 성격만 닮음 · 동아리 최종안은 시험을 통과한 설계",
  ];
  return (
    <SceneLayout chapter="정리" title="정확하게 말해야 할 점" lines={PRECISE_LINES}>
      <div style={{ position: "absolute", left: 160, top: 220, width: 1600 }}>
        {items.map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 22,
              fontSize: 34,
              fontWeight: 600,
              padding: "16px 0",
              borderBottom: `1.5px solid ${C.line}`,
              opacity: prog(frame, c[i + 1], 16),
              color: frame >= c[i + 1] && (i === 4 || frame < c[i + 2]) ? C.ink : C.ink2,
            }}
          >
            <span style={{ width: 44, height: 44, borderRadius: 22, background: "#E6E9ED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700, flex: "none" }}>
              {i + 1}
            </span>
            {t}
          </div>
        ))}
      </div>
    </SceneLayout>
  );
};

/* ================= 끝 ================= */
export const END_LINES: Line[] = [{ t: "끝까지 봐 줘서 고마워요. 이제 보고서를 다시 펼쳐 보면 흐름이 보일 거예요.", s: 5.5 }];

export const EndScene: React.FC = () => {
  const frame = useCurrentFrame();
  const fd = finalDesign();
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.ink }}>
      <div style={{ position: "absolute", left: 0, right: 0, top: 230, textAlign: "center", opacity: prog(frame, 4, 20) }}>
        <div style={{ fontSize: 80, fontWeight: 700, letterSpacing: "-0.03em" }}>다리를 가장 싸게 만드는 법</div>
        <div style={{ fontSize: 34, color: C.ink2, marginTop: 18 }}>검증한 만큼만 믿는다 · 가장 싼 설계와 가장 좋은 설계는 다르다</div>
      </div>
      <svg width={1920} height={1080} style={svgAbs}>
        <TrussView truss={fd} ox={388} oy={760} s={26} widthOf={(i) => (fd.mm[i] / 150) * 11} progress={lerp(1, 1, 1)} />
      </svg>
      <Captions lines={END_LINES} />
    </AbsoluteFill>
  );
};
