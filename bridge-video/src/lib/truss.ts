// 트러스 모양 만들기 + 힘의 평형으로 부재 힘 구하기 (정정 트러스)
export type P = { x: number; y: number };
export type Kind = "c" | "t" | "z" | "n";
export type Role = "top" | "bottom" | "diag" | "vert" | "end";
export type M = { a: number; b: number; w?: number; k?: Kind; role: Role };
export type Truss = { nodes: P[]; members: M[]; pin: number; roller: number };

export const SPAN = 44;

/** 곡선 모수 n: 1 = 뾰족한 삼각형, 2 = 포물선, 클수록 꼭대기가 평평 */
export const archY = (x: number, H: number, n: number, span = SPAN) => {
  const u = Math.abs((x - span / 2) / (span / 2));
  return H * (1 - Math.pow(u, n));
};

export type Dir = "dr" | "dl"; // dr: 위 바깥 → 아래 안쪽(왼쪽 절반 기준 "\"), dl: 반대 "/"

/** 왼쪽 절반에서 "\" 방향(가운데로 내려가는) 사재 = Pratt, 반대 = Howe */
export const prattDirs = (panels = 9): Dir[] =>
  Array.from({ length: panels }, (_, k) => (k < Math.floor(panels / 2) ? "dr" : k > Math.floor(panels / 2) ? "dl" : "dr"));
export const howeDirs = (panels = 9): Dir[] =>
  prattDirs(panels).map((d) => (d === "dr" ? "dl" : "dr"));

/**
 * 동아리 골격(절점 22개): 아래 절점 12개(x=0..44), 윗선 절점 10개(x=4..40)
 * 사재는 9칸 → 2^9 = 512가지 배치
 */
export const clubSkeleton = (topY: (x: number) => number, dirs: Dir[], xMid = false): Truss => {
  const nodes: P[] = [];
  for (let i = 0; i < 12; i++) nodes.push({ x: 4 * i, y: 0 });
  for (let j = 0; j < 10; j++) nodes.push({ x: 4 + 4 * j, y: topY(4 + 4 * j) });
  const B = (i: number) => i;
  const T = (j: number) => 12 + j;
  const members: M[] = [];
  for (let i = 0; i < 11; i++) members.push({ a: B(i), b: B(i + 1), role: "bottom" });
  for (let j = 0; j < 9; j++) members.push({ a: T(j), b: T(j + 1), role: "top" });
  members.push({ a: B(0), b: T(0), role: "end" });
  members.push({ a: B(11), b: T(9), role: "end" });
  for (let j = 0; j < 10; j++) members.push({ a: B(j + 1), b: T(j), role: "vert" });
  for (let k = 0; k < 9; k++) {
    if (xMid && k === 4) {
      members.push({ a: T(k), b: B(k + 2), role: "diag" });
      members.push({ a: T(k + 1), b: B(k + 1), role: "diag" });
    } else if (dirs[k] === "dr") members.push({ a: T(k), b: B(k + 2), role: "diag" });
    else members.push({ a: T(k + 1), b: B(k + 1), role: "diag" });
  }
  return { nodes, members, pin: 0, roller: 11 };
};

export const archTruss = (H: number, n: number, dirs: Dir[]) =>
  clubSkeleton((x) => archY(x, H, n), dirs);

/** Warren 골격(절점 23개, 부재 43개): 윗선 절점 11개가 아래 절점 사이(x=2..42)에 놓인다 */
export const warrenSkeleton = (ys: number[]): Truss => {
  const nodes: P[] = [];
  for (let i = 0; i < 12; i++) nodes.push({ x: 4 * i, y: 0 });
  ys.forEach((y, j) => nodes.push({ x: 2 + 4 * j, y }));
  const members: M[] = [];
  for (let i = 0; i < 11; i++) members.push({ a: i, b: i + 1, role: "bottom" });
  for (let j = 0; j < 10; j++) members.push({ a: 12 + j, b: 13 + j, role: "top" });
  for (let j = 0; j < 11; j++) {
    members.push({ a: j, b: 12 + j, role: j === 0 ? "end" : "diag" });
    members.push({ a: j + 1, b: 12 + j, role: j === 10 ? "end" : "diag" });
  }
  return { nodes, members, pin: 0, roller: 11 };
};

export const warrenArch = (H: number, n: number) =>
  warrenSkeleton(Array.from({ length: 11 }, (_, j) => archY(2 + 4 * j, H, n)));

/* ---------- 최종 설계 (보고서 부록: 실제 프로그램 통과) ---------- */
const FINAL_Y = [1.5, 2.75, 4.0, 5.0, 5.5, 5.75, 5.5, 5.0, 4.0, 2.75, 1.5];
// 1-based 절점 번호: 아래 1..12, 위 13..23
const SIZE_LIST: [number, string][] = [
  [65, "2-13 3-14 3-15 4-16 9-20 10-21 10-22 11-23"],
  [80, "4-15 5-16 5-17 6-18 7-18 8-19 8-20 9-21"],
  [90, "1-2 2-14 6-17 7-19 11-12 11-22"],
  [110, "2-3 3-4 4-5 5-6 6-7 7-8 8-9 9-10 10-11"],
  [120, "1-13 12-23"],
  [150, "13-14 14-15 15-16 16-17 17-18 18-19 19-20 20-21 21-22 22-23"],
];
// 보고서 그림 6에서 진한 선(눌리는 부재)인 사재
const FINAL_COMP_DIAG = ["2-14", "4-15", "9-21", "11-22", "1-13", "12-23"];

const key = (a: number, b: number) => (a < b ? `${a}-${b}` : `${b}-${a}`);

export const finalDesign = (): Truss & { mm: number[] } => {
  const t = warrenSkeleton(FINAL_Y);
  const sizeOf = new Map<string, number>();
  SIZE_LIST.forEach(([mm, list]) =>
    list.split(" ").forEach((p) => {
      const [a, b] = p.split("-").map(Number);
      sizeOf.set(key(a, b), mm);
    }),
  );
  const mm: number[] = [];
  t.members.forEach((m) => {
    const k = key(m.a + 1, m.b + 1);
    mm.push(sizeOf.get(k) ?? 0);
    m.k = m.role === "top" || FINAL_COMP_DIAG.includes(k) ? "c" : "t";
  });
  return { ...t, mm };
};

/** 동아리 최종안(조원과 43회 반복): 윗선 높이 4m의 평평한 Pratt형, 가운데 칸은 X자 → 부재 42개 */
export const clubDesign = (): Truss => {
  const t = clubSkeleton(() => 4, prattDirs(9), true);
  t.members.forEach((m) => {
    const ax = t.nodes[m.a].x;
    const bx = t.nodes[m.b].x;
    if (m.role === "top" || m.role === "end") {
      m.k = "c";
      m.w = 10;
    } else if (m.role === "bottom") {
      m.k = "t";
      m.w = 6;
    } else if (m.role === "vert") {
      const edge = ax === 4 || ax === 40 || bx === 4 || bx === 40;
      m.k = edge ? "t" : "c";
      m.w = edge ? 4 : 7;
    } else {
      m.k = "t";
      m.w = 6;
    }
  });
  return t;
};

/* ---------- 힘의 평형으로 부재 힘 구하기 ---------- */
const gauss = (A: number[][], b: number[]) => {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c];
    if (Math.abs(d) < 1e-12) continue;
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / d;
      if (f === 0) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => row[n] / row[i]);
};

/** 인장 +, 압축 − */
export const solveForces = (t: Truss, loads: { node: number; fy: number }[]) => {
  const N = t.nodes.length;
  const m = t.members.length;
  const U = m + 3;
  const A = Array.from({ length: 2 * N }, () => new Array(U).fill(0));
  const rhs = new Array(2 * N).fill(0);
  t.members.forEach((mem, i) => {
    const pa = t.nodes[mem.a];
    const pb = t.nodes[mem.b];
    const L = Math.hypot(pb.x - pa.x, pb.y - pa.y);
    const ux = (pb.x - pa.x) / L;
    const uy = (pb.y - pa.y) / L;
    A[2 * mem.a][i] += ux;
    A[2 * mem.a + 1][i] += uy;
    A[2 * mem.b][i] -= ux;
    A[2 * mem.b + 1][i] -= uy;
  });
  A[2 * t.pin][m] = 1;
  A[2 * t.pin + 1][m + 1] = 1;
  A[2 * t.roller + 1][m + 2] = 1;
  loads.forEach((l) => {
    rhs[2 * l.node + 1] -= l.fy;
  });
  return gauss(A, rhs).slice(0, m);
};

/** 바닥판 무게처럼 아래 절점에 고르게 실린 하중 */
export const deckLoads = (t: Truss) =>
  t.nodes
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.y === 0)
    .map(({ p, i }) => ({ node: i, fy: p.x === 0 || p.x === SPAN ? -0.5 : -1 }));

/** 고른 하중에서 힘을 구해 색(k)과 굵기(w)를 채운다 */
export const withDeadLoad = (t: Truss, minW = 3, maxW = 13, zeroTol = 0.04): Truss & { F: number[] } => {
  const F = solveForces(t, deckLoads(t));
  const max = Math.max(...F.map(Math.abs));
  const members = t.members.map((m, i) => {
    const r = Math.abs(F[i]) / max;
    const k: Kind = r < zeroTol ? "z" : F[i] > 0 ? "t" : "c";
    return { ...m, k, w: k === "z" ? 2.5 : minW + (maxW - minW) * Math.sqrt(r) };
  });
  return { ...t, members, F };
};

/** 각 칸에서 사재가 당겨지도록 방향을 고른다 (정정 트러스는 칸마다 따로 정해진다) */
export const tensionDirs = (topY: (x: number) => number): Dir[] =>
  Array.from({ length: 9 }, (_, k) => {
    const dirs = prattDirs(9);
    const t = clubSkeleton(topY, dirs);
    const F = solveForces(t, deckLoads(t));
    const diagIdx = t.members.findIndex(
      (m, i) => m.role === "diag" && t.members.slice(0, i).filter((q) => q.role === "diag").length === k,
    );
    const isTension = F[diagIdx] > 0;
    return isTension ? dirs[k] : dirs[k] === "dr" ? "dl" : "dr";
  });

/** 평평한 트러스 (개념 설명용) */
export const flatTruss = (type: "pratt" | "howe" | "warren", panels = 6, h = 4, p = 4): Truss => {
  const nodes: P[] = [];
  const members: M[] = [];
  for (let i = 0; i <= panels; i++) nodes.push({ x: p * i, y: 0 });
  if (type === "warren") {
    for (let j = 0; j < panels; j++) nodes.push({ x: p * j + p / 2, y: h });
    const T = (j: number) => panels + 1 + j;
    for (let i = 0; i < panels; i++) members.push({ a: i, b: i + 1, role: "bottom" });
    for (let j = 0; j < panels - 1; j++) members.push({ a: T(j), b: T(j + 1), role: "top" });
    for (let j = 0; j < panels; j++) {
      members.push({ a: j, b: T(j), role: j === 0 ? "end" : "diag" });
      members.push({ a: j + 1, b: T(j), role: j === panels - 1 ? "end" : "diag" });
    }
    return { nodes, members, pin: 0, roller: panels };
  }
  for (let j = 1; j < panels; j++) nodes.push({ x: p * j, y: h });
  const T = (j: number) => panels + j; // j = 1..panels-1
  for (let i = 0; i < panels; i++) members.push({ a: i, b: i + 1, role: "bottom" });
  for (let j = 1; j < panels - 1; j++) members.push({ a: T(j), b: T(j + 1), role: "top" });
  members.push({ a: 0, b: T(1), role: "end" });
  members.push({ a: panels, b: T(panels - 1), role: "end" });
  for (let j = 1; j < panels; j++) members.push({ a: j, b: T(j), role: "vert" });
  const half = panels / 2;
  for (let k = 1; k < panels - 1; k++) {
    // 칸 k: 윗선 T(k)..T(k+1), 아래 k..k+1
    const left = k < half;
    const pratt = left ? { a: T(k), b: k + 1 } : { a: T(k + 1), b: k };
    const howe = left ? { a: k, b: T(k + 1) } : { a: k + 1, b: T(k) };
    members.push({ ...(type === "pratt" ? pratt : howe), role: "diag" });
  }
  return { nodes, members, pin: 0, roller: panels };
};
