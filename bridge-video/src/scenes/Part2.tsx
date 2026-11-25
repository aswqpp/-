import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C } from "../lib/theme";
import { easeInOut, lerp, prog } from "../lib/anim";
import { Line } from "../lib/timing";
import { SceneLayout, useCues } from "../components/Scene";
import { Appear, Card, CheckIcon, Legend, Pill } from "../components/ui";
import { TrussView } from "../components/TrussView";
import { archTruss, archY, finalDesign, flatTruss, prattDirs, withDeadLoad } from "../lib/truss";

const CH = "2부 · 다리를 이해하는 개념 7가지";
const svgAbs: React.CSSProperties = { position: "absolute", left: 0, top: 0 };
const T: React.FC<{ x: number; y: number; size?: number; color?: string; weight?: number; anchor?: "start" | "middle" | "end"; opacity?: number; children?: React.ReactNode }> = ({
  x,
  y,
  size = 28,
  color = C.ink,
  weight = 600,
  anchor = "middle",
  opacity = 1,
  children,
}) => (
  <text x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor} fontFamily="Pretendard" opacity={opacity}>
    {children}
  </text>
);

const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string; w?: number; opacity?: number }> = ({
  x1,
  y1,
  x2,
  y2,
  color = C.ink2,
  w = 4,
  opacity = 1,
}) => {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const h = 14;
  return (
    <g opacity={opacity}>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={w} strokeLinecap="round" />
      <path
        d={`M${x2 - h * Math.cos(a - 0.5)} ${y2 - h * Math.sin(a - 0.5)} L${x2} ${y2} L${x2 - h * Math.cos(a + 0.5)} ${y2 - h * Math.sin(a + 0.5)}`}
        fill="none"
        stroke={color}
        strokeWidth={w}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
};

/* ================= 개념 1: 트러스 ================= */
export const C1_LINES: Line[] = [
  "**트러스**는 곧은 막대를 이어 삼각형을 여러 개 붙인 구조예요.",
  "사각형은 모서리를 밀면 평행사변형으로 찌그러져요.",
  "하지만 삼각형은 세 변의 길이가 정해지면 모양이 바뀌지 않아요. 그래서 튼튼해요.",
  "위쪽을 따라 이어진 부재를 **윗선**, 아래쪽을 따라 이어진 부재를 **아래 현재**라고 불러요.",
  "위아래를 비스듬히 잇는 부재는 **사재**, 똑바로 세운 부재는 **수직재**예요.",
];

export const C1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(C1_LINES);
  const k = 80 * prog(frame, c[1] + 15, 30, easeInOut);
  const side = 190;
  const dyTop = side - Math.sqrt(side * side - k * k);
  const sx = 220;
  const sy = 260;
  const sq = [
    [sx, sy + side],
    [sx + side, sy + side],
    [sx + side + k, sy + dyTop],
    [sx + k, sy + dyTop],
  ];
  const tx = 740;
  const tri = [
    [tx, sy + side],
    [tx + 220, sy + side],
    [tx + 110, sy],
  ];
  const push2 = prog(frame, c[2] + 15, 20);
  const truss = flatTruss("pratt", 6, 4, 4);
  const s = 30;
  const ox = 1060;
  const oy = 470;
  const lab = (at: number) => prog(frame, at, 16);
  const showSquare = prog(frame, c[1], 16);
  const showTri = prog(frame, c[2], 16);
  return (
    <SceneLayout chapter={CH} title="① 트러스는 삼각형 뼈대다" lines={C1_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <g opacity={showSquare}>
          <polygon points={sq.map((p) => p.join(",")).join(" ")} fill="none" stroke={C.neutral} strokeWidth={8} strokeLinejoin="round" />
          {sq.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={8} fill={C.ink} />
          ))}
          <Arrow x1={sx - 120 + k} y1={sy + dyTop} x2={sx - 20 + k} y2={sy + dyTop} color={C.comp} w={5} />
          <T x={sx + side / 2 + 30} y={sy + side + 60} color={C.comp}>
            사각형: 찌그러진다
          </T>
        </g>
        <g opacity={showTri}>
          <polygon points={tri.map((p) => p.join(",")).join(" ")} fill="none" stroke={C.neutral} strokeWidth={8} strokeLinejoin="round" />
          {tri.map((p, i) => (
            <circle key={i} cx={p[0]} cy={p[1]} r={8} fill={C.ink} />
          ))}
          <Arrow x1={tx - 110 + 10 * push2} y1={sy} x2={tx + 90 + 10 * push2} y2={sy} color={C.comp} w={5} opacity={push2} />
          <T x={tx + 110} y={sy + side + 60} color={C.good}>
            삼각형: 모양 그대로
          </T>
        </g>
        <TrussView truss={truss} ox={ox} oy={oy} s={s} mode="neutral" widthOf={() => 6} progress={prog(frame, c[0], 40)} />
        {/* 이름표 */}
        <g opacity={lab(c[3])}>
          <line x1={ox + 4 * s} y1={oy - 4 * s - 6} x2={ox + 20 * s} y2={oy - 4 * s - 6} stroke={C.ink} strokeWidth={14} opacity={0.12} strokeLinecap="round" />
          <T x={ox + 12 * s} y={oy - 4 * s - 30}>윗선</T>
          <line x1={ox} y1={oy + 8} x2={ox + 24 * s} y2={oy + 8} stroke={C.ink} strokeWidth={14} opacity={0.12} strokeLinecap="round" />
          <T x={ox + 12 * s} y={oy + 56}>아래 현재</T>
        </g>
        <g opacity={lab(c[4])}>
          <circle cx={ox + 6 * s} cy={oy - 2 * s} r={22} fill="none" stroke={C.ink2} strokeWidth={3} />
          <line x1={ox + 6 * s - 18} y1={oy - 2 * s + 18} x2={ox + 3 * s} y2={oy + 120} stroke={C.ink2} strokeWidth={2.5} />
          <T x={ox + 3 * s} y={oy + 150}>사재</T>
          <circle cx={ox + 16 * s} cy={oy - 2 * s} r={22} fill="none" stroke={C.ink2} strokeWidth={3} />
          <line x1={ox + 16 * s} y1={oy - 2 * s + 22} x2={ox + 18 * s} y2={oy + 120} stroke={C.ink2} strokeWidth={2.5} />
          <T x={ox + 18 * s} y={oy + 150}>수직재</T>
        </g>
      </svg>
    </SceneLayout>
  );
};

/* ================= 개념 2: 눌림과 당김 ================= */
export const C2_LINES: Line[] = [
  "다리에 무게가 실리면 가운데가 아래로 처져요.",
  "숟가락 가운데를 누르면 바깥쪽이 늘어나는 것처럼, 아래쪽은 **당겨지고** 위쪽은 **눌려요**.",
  "그래서 아래 현재는 당기는 힘(**인장**), 윗선은 누르는 힘(**압축**)을 받아요.",
  "이 영상에서는 눌리는 부재를 **주황색**, 당겨지는 부재를 **파란색**으로 표시할게요.",
  "참고로 보고서 그림에서는 **진한 선**이 눌리는 부재, **연한 선**이 당겨지는 부재예요.",
];

export const C2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(C2_LINES);
  const sag = 46 * prog(frame, c[0] + 10, 30, easeInOut);
  const x0 = 260;
  const x1 = 1660;
  const yTop = 300;
  const th = 70;
  const mid = (x0 + x1) / 2;
  const edge = (dy: number) => `M${x0} ${yTop + dy} Q${mid} ${yTop + dy + 2 * sag} ${x1} ${yTop + dy}`;
  const arrowsP = prog(frame, c[1], 18);
  const truss = withDeadLoad(flatTruss("pratt", 8, 4, 4));
  const s = 30;
  const tox = 960 - 16 * s;
  const toy = 780;
  const colorize = prog(frame, c[3], 24);
  return (
    <SceneLayout chapter={CH} title="② 눌리는 부재와 당겨지는 부재" lines={C2_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        {/* 보(막대) */}
        <path d={`${edge(0)} L${x1} ${yTop + th} Q${mid} ${yTop + th + 2 * sag} ${x0} ${yTop + th} Z`} fill="#E3E6EA" stroke={C.neutral} strokeWidth={3} />
        <path d={`M${x0 - 30} ${yTop + th + 46} l30 -46 l30 46 Z`} fill="#A4AAB1" />
        <path d={`M${x1 - 30} ${yTop + th + 46} l30 -46 l30 46 Z`} fill="#A4AAB1" />
        <Arrow x1={mid} y1={yTop - 110} x2={mid} y2={yTop - 14 + sag} color={C.ink2} w={6} />
        <T x={mid + 20} y={yTop - 120} anchor="start" size={26} color={C.ink2}>
          무게
        </T>
        <g opacity={arrowsP}>
          {[-1, 1].map((d) => (
            <g key={d}>
              <Arrow x1={mid + d * 330} y1={yTop - 22 + sag * 0.7} x2={mid + d * 150} y2={yTop - 22 + sag * 0.9} color={C.comp} w={5} />
              <Arrow x1={mid + d * 150} y1={yTop + th + 34 + sag * 0.9} x2={mid + d * 330} y2={yTop + th + 34 + sag * 0.7} color={C.tens} w={5} />
            </g>
          ))}
          <T x={mid - 470} y={yTop - 14 + sag * 0.4} color={C.comp} size={30}>
            위쪽: 눌림
          </T>
          <T x={mid + 480} y={yTop + th + 52 + sag * 0.4} color={C.tens} size={30}>
            아래쪽: 당김
          </T>
        </g>
        <g opacity={prog(frame, c[2], 18)}>
          <TrussView
            truss={truss}
            ox={tox}
            oy={toy}
            s={s}
            progress={prog(frame, c[2], 40)}
            colorOf={(i) => {
              const m = truss.members[i];
              if (colorize >= 1) return undefined;
              if (m.role === "top" || m.role === "end") return C.comp;
              if (m.role === "bottom") return C.tens;
              return "#B9BEC5";
            }}
            widthOf={(i) => (truss.members[i].role === "top" || truss.members[i].role === "bottom" ? 9 : (truss.members[i].w ?? 6) * 0.7)}
          />
          <T x={tox - 30} y={toy - 4 * s + 10} anchor="end" color={C.comp} size={28}>
            윗선: 압축
          </T>
          <T x={tox - 30} y={toy + 10} anchor="end" color={C.tens} size={28}>
            아래 현재: 인장
          </T>
        </g>
      </svg>
      <Appear at={c[3]} style={{ left: 1500, top: 560 }}>
        <Legend style={{ position: "relative", flexDirection: "column", gap: 10 }} />
      </Appear>
      <Appear at={c[4]} style={{ left: 1500, top: 668, width: 300 }}>
        <Card style={{ padding: "16px 20px" }}>
          <div style={{ fontSize: 22, color: C.muted, fontWeight: 600, marginBottom: 8 }}>보고서 그림에서는</div>
          <Legend
            style={{ position: "relative", flexDirection: "column", gap: 6, fontSize: 24 }}
            items={[
              ["#333333", "진한 선 = 눌림"],
              ["#B8B8B8", "연한 선 = 당김"],
            ]}
          />
        </Card>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 개념 3: 좌굴 ================= */
export const C3_LINES: Line[] = [
  "당겨지는 부재는 끊어질 때까지 버텨요.",
  "눌리는 부재는 그보다 훨씬 먼저 옆으로 휘어 꺾여요. 긴 자를 세워 위에서 누르면 휘는 것과 같아요.",
  "이것을 **좌굴**이라고 해요.",
  "부재 길이가 두 배가 되면 버티는 힘은 약 **4분의 1**로 줄어요.",
  "그래서 눌리는 부재는 훨씬 굵어야 하고, 사재가 **당기는 힘**을 받게 배치하면 다리가 싸져요.",
];

export const C3Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(C3_LINES);
  const bow = 55 * prog(frame, c[1] + 20, 30, easeInOut);
  const top = 290;
  const bot = 640;
  const lx = 330;
  const rx = 640;
  const ratio = prog(frame, c[3] + 10, 30);
  return (
    <SceneLayout chapter={CH} title="③ 좌굴: 눌리는 부재의 약점" lines={C3_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <g opacity={prog(frame, c[0], 16)}>
          <line x1={lx} y1={top} x2={lx} y2={bot} stroke={C.tens} strokeWidth={14} strokeLinecap="round" />
          <Arrow x1={lx} y1={top - 10} x2={lx} y2={top - 80} color={C.tens} w={5} />
          <Arrow x1={lx} y1={bot + 10} x2={lx} y2={bot + 80} color={C.tens} w={5} />
          <T x={lx} y={bot + 130} color={C.tens}>
            당김: 끊어질 때까지 버팀
          </T>
        </g>
        <g opacity={prog(frame, c[1], 16)}>
          <path d={`M${rx} ${top} Q${rx + 2 * bow} ${(top + bot) / 2} ${rx} ${bot}`} fill="none" stroke={C.comp} strokeWidth={14} strokeLinecap="round" />
          <Arrow x1={rx} y1={top - 80} x2={rx} y2={top - 12} color={C.comp} w={5} />
          <Arrow x1={rx} y1={bot + 80} x2={rx} y2={bot + 12} color={C.comp} w={5} />
          <T x={rx} y={bot + 130} color={C.comp}>
            누름: 옆으로 휘어 꺾임
          </T>
        </g>
        <g opacity={prog(frame, c[2], 16)}>
          <T x={rx + 2 * bow / 2 + 60} y={(top + bot) / 2 + 16} anchor="start" size={52} weight={700} color={C.comp}>
            좌굴
          </T>
        </g>
        {/* 길이 2배 → 1/4 */}
        <g opacity={prog(frame, c[3], 18)}>
          <T x={1000} y={300} anchor="start" size={28} color={C.muted}>
            눌리는 부재의 길이와 버티는 힘
          </T>
          {[
            { y: 380, len: 260, label: "길이 L", strength: 1, txt: "버티는 힘 1" },
            { y: 520, len: 520, label: "길이 2L", strength: 0.25, txt: "약 1/4" },
          ].map((r, i) => (
            <g key={i}>
              <line x1={1000} y1={r.y} x2={1000 + r.len} y2={r.y} stroke={C.comp} strokeWidth={12} strokeLinecap="round" />
              <T x={1000} y={r.y + 50} anchor="start" size={26} color={C.ink2}>
                {r.label}
              </T>
              <rect x={1000} y={r.y + 70} width={lerp(520, 520 * r.strength, i === 1 ? ratio : 0)} height={26} rx={6} fill={C.compSoft} stroke={C.comp} strokeWidth={2} />
              <T x={1000 + lerp(520, 520 * r.strength, i === 1 ? ratio : 0) + 16} y={r.y + 92} anchor="start" size={26} weight={700} color={C.comp}>
                {r.txt}
              </T>
            </g>
          ))}
        </g>
      </svg>
      <Appear at={c[4]} style={{ left: 1000, top: 680, width: 760 }}>
        <Pill bg={C.tensSoft} color={C.tens} style={{ fontSize: 28 }}>
          사재가 당겨지게 배치하면 → 가는 부재로 충분 → 싸다
        </Pill>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 개념 4: 세장비 ================= */
export const C4_LINES: Line[] = [
  "**세장비**는 굵기에 비해 부재가 얼마나 가늘고 긴지를 나타내는 값이에요.",
  "프로그램은 모든 부재의 세장비가 **300 이하**이기를 요구해요. 당겨지는 부재도 예외가 아니에요.",
  "굵기로 바꾸면, 필요한 최소 굵기(mm)는 부재 길이(m)에 **11.547**을 곱한 값이에요.",
  "예를 들어 4미터 부재는 최소 **46밀리미터**가 필요해요.",
];

export const C4Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(C4_LINES);
  return (
    <SceneLayout chapter={CH} title="④ 세장비: 너무 가늘고 길면 안 된다" lines={C4_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <g opacity={prog(frame, c[0], 18)}>
          <rect x={160} y={300} width={760} height={30} rx={4} fill="#C3C9D0" />
          <line x1={160} y1={370} x2={920} y2={370} stroke={C.ink2} strokeWidth={2.5} />
          <line x1={160} y1={358} x2={160} y2={382} stroke={C.ink2} strokeWidth={2.5} />
          <line x1={920} y1={358} x2={920} y2={382} stroke={C.ink2} strokeWidth={2.5} />
          <T x={540} y={412} size={30}>
            길이 L
          </T>
          <rect x={980} y={285} width={60} height={60} rx={3} fill="#C3C9D0" />
          <T x={1010} y={400} size={30}>
            굵기 d
          </T>
          <T x={1010} y={270} size={22} color={C.muted}>
            단면
          </T>
        </g>
      </svg>
      <Appear at={c[0] + 20} style={{ left: 1140, top: 230, width: 640 }}>
        <Card>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>세장비</div>
          <div style={{ fontSize: 40, fontWeight: 700, marginTop: 8 }}>L(mm) × √12 ÷ d(mm)</div>
          <div style={{ fontSize: 22, color: C.muted, marginTop: 10 }}>√12: 정사각 단면이 휘어짐에 버티는 정도(회전반경 = d ÷ √12)에서 나온 값</div>
        </Card>
      </Appear>
      <Appear at={c[1]} style={{ left: 1140, top: 450, width: 640 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <Pill bg={C.compSoft} color={C.bad} style={{ fontSize: 34 }}>
            ≤ 300
          </Pill>
          <span style={{ fontSize: 28, color: C.ink2 }}>모든 부재 (당겨지는 부재 포함)</span>
        </div>
      </Appear>
      <Appear at={c[2]} style={{ left: 160, top: 500, width: 900 }}>
        <Card accent={C.ink2} style={{ padding: "26px 34px" }}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>바꿔 쓰면</div>
          <div style={{ fontSize: 46, fontWeight: 700, marginTop: 8 }}>
            최소 굵기(mm) = 길이(m) × <span style={{ color: C.tens }}>11.547</span>
          </div>
        </Card>
      </Appear>
      <Appear at={c[3]} style={{ left: 160, top: 700, width: 1500 }}>
        <div style={{ fontSize: 36, fontWeight: 600 }}>
          예: 4m × 11.547 = 46.2 → <b style={{ color: C.tens }}>최소 46mm</b>
        </div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 개념 5: 정정구조 ================= */
export const C5_LINES: Line[] = [
  "**정정구조**는 힘의 평형 식만으로 모든 부재의 힘이 정해지는 구조예요.",
  "최종 설계는 절점이 23개라서, 절점마다 가로·세로 두 개씩 식이 **46개** 나와요.",
  "모르는 값도 부재 43개와 받침 반력(받침이 떠받치는 힘) 3개를 합쳐 **46개**. 그래서 답이 딱 하나로 정해져요.",
  "덕분에 부재 굵기를 정확히 계산할 수 있었어요.",
  "대신 부재 하나가 끊어지면 힘이 돌아갈 길이 없어요. 이 이야기는 뒤에서 다시 나와요.",
];

export const C5Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(C5_LINES);
  const fd = finalDesign();
  const s = 24;
  const ox = 432;
  const oy = 520;
  const nodeP = prog(frame, c[1], 18);
  const memP = prog(frame, c[2], 18);
  const cut = 34; // 사재 하나 (아래 8번 – 위 19번 절점)
  const cutP = prog(frame, c[4] + 10, 20);
  return (
    <SceneLayout chapter={CH} title="⑤ 정정구조: 정확히 계산되지만 남는 부재가 없다" lines={C5_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        <TrussView
          truss={fd}
          ox={ox}
          oy={oy}
          s={s}
          mode="neutral"
          progress={prog(frame, c[0], 40)}
          widthOf={() => 5}
          colorOf={(i) => (i === cut && cutP > 0 ? C.bad : memP > 0 && nodeP > 0 ? undefined : undefined)}
          opacityOf={(i) => (i === cut ? 1 - cutP * 0.85 : 1)}
        />
        {fd.nodes.map((p, i) => (
          <circle key={i} cx={ox + p.x * s} cy={oy - p.y * s} r={13} fill="none" stroke={C.tens} strokeWidth={3} opacity={nodeP} />
        ))}
        <g opacity={cutP}>
          <T x={ox + 27 * s} y={oy - 7.2 * s} size={28} color={C.bad}>
            끊어지면? 대신 받아 줄 부재가 없다
          </T>
        </g>
      </svg>
      <Appear at={c[1]} style={{ left: 300, top: 600, width: 560 }}>
        <Card accent={C.tens}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>식의 개수</div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>절점 23개 × 2 = 46</div>
          <div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>절점마다 가로·세로 힘의 평형</div>
        </Card>
      </Appear>
      <Appear at={c[2]} style={{ left: 880, top: 640 }}>
        <div style={{ fontSize: 60, fontWeight: 700, color: C.muted }}>=</div>
      </Appear>
      <Appear at={c[2]} style={{ left: 960, top: 600, width: 660 }}>
        <Card accent={C.ink2}>
          <div style={{ fontSize: 26, color: C.muted, fontWeight: 600 }}>모르는 값의 개수</div>
          <div style={{ fontSize: 34, fontWeight: 700, marginTop: 6 }}>부재 43개 + 받침 반력 3개 = 46</div>
          <div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>식과 모르는 값의 수가 같다 → 답이 하나</div>
        </Card>
      </Appear>
      <Appear at={c[3]} style={{ left: 1650, top: 640 }}>
        <CheckIcon size={64} />
      </Appear>
    </SceneLayout>
  );
};

/* ================= 개념 6: Pratt, Howe, Warren ================= */
export const C6_LINES: Line[] = [
  "**Pratt**와 **Howe**는 수직재가 있는 같은 골격에서 사재 방향만 반대인 형식이에요.",
  "평평한 트러스에서 Pratt의 사재는 **당겨지고**, Howe의 사재는 **눌려요**.",
  "**Warren**은 윗선 절점을 아래 절점 사이에 두고, 수직재 없이 삼각형만으로 이루어진 형식이에요.",
  "사재 방향은 칸마다 두 가지라서, 9칸이면 2를 아홉 번 곱한 **512가지** 배치가 나와요.",
];

export const C6Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(C6_LINES);
  const rows = [
    { name: "Pratt", t: withDeadLoad(flatTruss("pratt", 6, 4, 4)), at: c[0], y: 360 },
    { name: "Howe", t: withDeadLoad(flatTruss("howe", 6, 4, 4)), at: c[0] + 20, y: 540 },
    { name: "Warren", t: withDeadLoad(flatTruss("warren", 6, 4, 4)), at: c[2], y: 720 },
  ];
  const s = 22;
  const ox = 360;
  const focus = prog(frame, c[1], 16);
  const flipStart = c[3] + 20;
  const counter = Math.max(0, Math.floor((frame - flipStart) / 4));
  const boxes = 9;
  return (
    <SceneLayout chapter={CH} title="⑥ Pratt, Howe, Warren" lines={C6_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        {rows.map((r) => (
          <g key={r.name} opacity={prog(frame, r.at, 16)}>
            <T x={ox - 40} y={r.y - 30} anchor="end" size={38} weight={700}>
              {r.name}
            </T>
            <TrussView
              truss={r.t}
              ox={ox}
              oy={r.y}
              s={s}
              progress={prog(frame, r.at, 36)}
              colorOf={(i) => (r.t.members[i].role === "diag" || r.name === "Warren" ? undefined : C.faint)}
              widthOf={(i) => (r.t.members[i].role === "diag" ? 8 : 5)}
              opacityOf={(i) => (r.t.members[i].role === "diag" || r.name === "Warren" ? 1 : 1 - 0.5 * focus)}
            />
          </g>
        ))}
        <g opacity={focus}>
          <T x={ox + 24 * s + 40} y={360 - 34} anchor="start" size={30} color={C.tens}>
            사재가 당겨짐
          </T>
          <T x={ox + 24 * s + 40} y={540 - 34} anchor="start" size={30} color={C.comp}>
            사재가 눌림
          </T>
        </g>
        <g opacity={prog(frame, c[2] + 10, 16)}>
          <T x={ox + 24 * s + 40} y={720 - 34} anchor="start" size={30} color={C.ink2}>
            수직재 없이 삼각형만
          </T>
        </g>
        {/* 512 */}
        <g opacity={prog(frame, c[3], 16)}>
          {Array.from({ length: boxes }, (_, k) => {
            const bit = (counter >> (boxes - 1 - k)) & 1;
            const bx = 1250 + (k % 3) * 120;
            const by = 300 + Math.floor(k / 3) * 120;
            return (
              <g key={k}>
                <rect x={bx} y={by} width={96} height={96} rx={10} fill={C.card} stroke={C.line} strokeWidth={2} />
                <line x1={bx + 18} y1={bit ? by + 78 : by + 18} x2={bx + 78} y2={bit ? by + 18 : by + 78} stroke={C.ink2} strokeWidth={8} strokeLinecap="round" />
              </g>
            );
          })}
          <T x={1430} y={740} size={34} weight={700}>
            2 × 2 × … × 2 (9번) = 512
          </T>
          <T x={1430} y={686} size={24} color={C.muted}>
            칸마다 두 방향 중 하나
          </T>
        </g>
      </svg>
      <Appear at={c[1] + 30} style={{ left: 120, top: 200 }}>
        <div style={{ fontSize: 24, color: C.muted }}>평평한 트러스에 바닥판 무게만 실었을 때</div>
      </Appear>
    </SceneLayout>
  );
};

/* ================= 개념 7: 포물선 ================= */
export const C7_LINES: Line[] = [
  "빨랫줄에 무게를 고르게 매달면 줄은 **포물선**으로 처져요.",
  "이 모양을 위아래로 뒤집으면, 고르게 퍼진 무게를 **누르는 힘만으로** 받치는 아치가 돼요.",
  "다리 윗선이 포물선이면 바닥판 무게를 위아래 현재만으로 받을 수 있어서, 사재의 힘이 거의 **0**이 돼요.",
  "이 탐구에서는 윗선 모양을 **곡선 모수**라는 수로 나타냈어요.",
  "곡선 모수가 **1**이면 뾰족한 삼각형, **2**면 포물선, 클수록 꼭대기가 평평해져요.",
];

export const C7Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const c = useCues(C7_LINES);
  const sag = 140 * prog(frame, c[0] + 10, 34, easeInOut);
  const x0 = 200;
  const x1 = 820;
  const y0 = 250;
  const yAt = (x: number) => y0 + sag * (1 - Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 2));
  const pts = Array.from({ length: 41 }, (_, i) => x0 + ((x1 - x0) * i) / 40);
  const hang = Array.from({ length: 7 }, (_, i) => x0 + ((x1 - x0) * (i + 1)) / 8);
  const archP = prog(frame, c[1], 24);
  const ay = 760;
  const archY0 = (x: number) => ay - 150 * (1 - Math.pow((x - (x0 + x1) / 2) / ((x1 - x0) / 2), 2));
  const para = withDeadLoad(archTruss(6, 2, prattDirs()), 3, 11, 0.02);
  const s = 15;
  const pox = 1080;
  const poy = 430;
  // 곡선 모수 바꾸기
  const nP = interpolate(frame, [c[4] + 10, c[4] + 50, c[4] + 80, c[4] + 120, c[4] + 150], [1, 1, 2, 2, 3.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeInOut,
  });
  const nShow = prog(frame, c[3], 16);
  const mx = 1000;
  const my = 790;
  const ms = 14;
  const curve = (n: number) =>
    Array.from({ length: 89 }, (_, i) => {
      const x = (44 * i) / 88;
      return `${i ? "L" : "M"}${mx + x * ms} ${my - archY0Dummy(x, n) * ms}`;
    }).join(" ");
  function archY0Dummy(x: number, n: number) {
    return archY(x, 8, n);
  }
  return (
    <SceneLayout chapter={CH} title="⑦ 포물선: 사재가 할 일이 없어지는 모양" lines={C7_LINES}>
      <svg width={1920} height={1080} style={svgAbs}>
        {/* 빨랫줄 */}
        <g opacity={prog(frame, c[0], 16)}>
          <line x1={x0} y1={y0 - 20} x2={x0} y2={y0 + 200} stroke="#A4AAB1" strokeWidth={8} />
          <line x1={x1} y1={y0 - 20} x2={x1} y2={y0 + 200} stroke="#A4AAB1" strokeWidth={8} />
          <path d={pts.map((x, i) => `${i ? "L" : "M"}${x} ${yAt(x)}`).join(" ")} fill="none" stroke={C.tens} strokeWidth={5} />
          {hang.map((x, i) => (
            <g key={i}>
              <line x1={x} y1={yAt(x)} x2={x} y2={yAt(x) + 34} stroke={C.ink2} strokeWidth={2} />
              <rect x={x - 12} y={yAt(x) + 34} width={24} height={22} rx={4} fill={C.ink2} />
            </g>
          ))}
          <T x={(x0 + x1) / 2} y={y0 - 40} size={26} color={C.tens}>
            줄: 당기는 힘만
          </T>
        </g>
        {/* 뒤집은 아치 */}
        <g opacity={archP}>
          <T x={(x0 + x1) / 2} y={ay - 250} size={26} color={C.muted}>
            ↕ 위아래로 뒤집으면
          </T>
          <path d={pts.map((x, i) => `${i ? "L" : "M"}${x} ${archY0(x)}`).join(" ")} fill="none" stroke={C.comp} strokeWidth={10} strokeLinecap="round" />
          {hang.map((x, i) => (
            <Arrow key={i} x1={x} y1={archY0(x) - 60} x2={x} y2={archY0(x) - 12} color={C.ink2} w={3} />
          ))}
          <T x={(x0 + x1) / 2} y={ay + 50} size={26} color={C.comp}>
            아치: 누르는 힘만
          </T>
        </g>
        {/* 포물선 윗선 트러스 */}
        <g opacity={prog(frame, c[2], 18)}>
          <TrussView truss={para} ox={pox} oy={poy} s={s} progress={prog(frame, c[2], 36)} />
          <T x={pox + 22 * s} y={poy + 50} size={26} color={C.ink2}>
            윗선이 포물선 → 사재(점선) 힘 ≈ 0
          </T>
        </g>
        {/* 곡선 모수 */}
        <g opacity={nShow}>
          {[1, 2, 3.5].map((n) => (
            <path key={n} d={curve(n)} fill="none" stroke={C.faint} strokeWidth={3} strokeDasharray="6 8" />
          ))}
          <line x1={mx} y1={my} x2={mx + 44 * ms} y2={my} stroke={C.ink2} strokeWidth={4} />
          <path d={curve(nP)} fill="none" stroke={C.ink} strokeWidth={6} strokeLinecap="round" />
          <T x={mx + 44 * ms + 30} y={my - 60} anchor="start" size={30} weight={700}>
            곡선 모수 {nP.toFixed(2)}
          </T>
          <T x={mx + 44 * ms + 30} y={my - 20} anchor="start" size={24} color={C.muted}>
            {nP < 1.5 ? "뾰족한 삼각형" : nP < 2.5 ? "포물선" : "꼭대기가 평평"}
          </T>
        </g>
      </svg>
      <Appear at={c[2] + 30} style={{ left: 1380, top: 210 }}>
        <Legend
          style={{ position: "relative", flexDirection: "column", gap: 6, fontSize: 22 }}
          items={[
            [C.comp, "눌림"],
            [C.tens, "당김"],
            ["#B4BAC1", "힘 거의 0", true],
          ]}
        />
      </Appear>
    </SceneLayout>
  );
};
