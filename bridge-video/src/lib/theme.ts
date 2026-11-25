// 차분한 색 팔레트 — 형광/진한 색 없이, 밝은 바탕에 부드러운 강조색
export const C = {
  bg: "#F6F5F1",
  card: "#FFFFFF",
  line: "#E4E1DA",
  ink: "#1F2429",
  ink2: "#4F565E",
  muted: "#8A9098",
  faint: "#C9CDD2",
  comp: "#C8664A", // 눌리는 부재 (압축)
  compSoft: "#F5E3DC",
  tens: "#3F7DBA", // 당겨지는 부재 (인장)
  tensSoft: "#DFE9F4",
  good: "#2E8B57", // 가장 좋은/싼 설계
  goodSoft: "#E0F0E6",
  bad: "#B4533A", // 탈락
  badSoft: "#F6E1DA",
  neutral: "#59616A", // 색 구분 없는 부재
  bar: "#C9CDD3",
  water: "#E4EDF5",
  ground: "#E7E2D7",
  mark: "#F2E7C6", // 형광펜 대신 쓰는 연한 강조
};

export const FONT = "Pretendard, 'Noto Sans KR', sans-serif";

export const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
