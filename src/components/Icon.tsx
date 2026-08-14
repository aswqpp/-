import type { ReactElement, SVGProps } from 'react';

/**
 * Icon set in the beOm drawing language.
 *
 * Every glyph is an open line: rounded caps, nothing closed that does not have to
 * be, and a single filled dot near the opening. It is the ensō again at small size
 * — the circle that stops just short, with the point of awareness beside it.
 *
 * Two rules keep the set coherent:
 *   - Rings are arcs with a gap, never full circles.
 *   - The dot is the accent and appears once per glyph, at the gap or at the end of
 *     the stroke, so the eye is led to where the shape stops.
 */

export type IconName =
  | 'home'
  | 'book'
  | 'cards'
  | 'cap'
  | 'quiz'
  | 'game'
  | 'chart'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'check'
  | 'x'
  | 'speaker'
  | 'flame'
  | 'chevron-left'
  | 'chevron-right'
  | 'refresh'
  | 'clock'
  | 'grid'
  | 'search'
  | 'star'
  | 'folder'
  | 'settings'
  | 'note'
  | 'formula'
  | 'brain';

/** The accent dot. Filled, and never outlined, so it reads as a point rather than a ring. */
function Dot({ cx, cy, r = 1.45 }: { cx: number; cy: number; r?: number }) {
  return <circle cx={cx} cy={cy} r={r} fill="currentColor" stroke="none" />;
}

const paths: Record<IconName, ReactElement> = {
  // House left open at the eaves, with the dot resting at the foot of the wall.
  home: (
    <>
      <path d="M3.8 11.3 12 4.4l8.2 6.9" />
      <path d="M6.2 10.4v8.2a1 1 0 0 0 1 1h9.6a1 1 0 0 0 1-1v-8.2" />
      <Dot cx={18.9} cy={19.4} r={1.3} />
    </>
  ),
  // 단어장: the ensō read as a page turning — an open ring, opening to the right.
  book: (
    <>
      <path d="M16.6 5.6A8 8 0 1 0 16.6 18.4" />
      <Dot cx={18.6} cy={16.6} r={1.3} />
    </>
  ),
  // Two cards, the front one lifted off the back.
  cards: (
    <>
      <rect x="3.6" y="7.4" width="11" height="12" rx="2.6" />
      <path d="M8 5.6A2.2 2.2 0 0 1 10.2 4h7.6A2.2 2.2 0 0 1 20 6.2v7.6a2.2 2.2 0 0 1-1.7 2.14" />
      <Dot cx={13.4} cy={17.6} r={1.3} />
    </>
  ),
  // 학습: a graduation cap, brim open at the right.
  cap: (
    <>
      <path d="M2.8 9.3 12 5.2l9.2 4.1-9.2 4.1z" />
      <path d="M6.6 11.1v4.4c0 1.6 2.4 2.9 5.4 2.9 1.9 0 3.6-.5 4.6-1.3" />
      <Dot cx={18.6} cy={15.4} r={1.3} />
    </>
  ),
  quiz: (
    <>
      <path d="M18.4 6.3A9 9 0 1 0 20.7 13" />
      <path d="M9.6 9.3a2.5 2.5 0 1 1 3.6 2.25c-.7.37-1.1.9-1.1 1.55v.3" />
      <Dot cx={12} cy={16.6} r={1.2} />
    </>
  ),
  // Gamepad, with the dot standing in for the second face button.
  game: (
    <>
      <path d="M8.6 8h6.8a5 5 0 0 1 0 10 4.6 4.6 0 0 1-3-1.1h-3.6a4.6 4.6 0 0 1-3 1.1 5 5 0 0 1 0-10Z" />
      <path d="M7.4 11.6v2.8M6 13h2.8" />
      <Dot cx={16.2} cy={11.9} r={1.2} />
      <Dot cx={17.6} cy={14.4} r={1.2} />
    </>
  ),
  // 통계: rising bars, the tallest capped with the dot.
  chart: (
    <>
      <path d="M4.6 19.4v-5.2M10 19.4V9.6M15.4 19.4v-7.4" />
      <path d="M20.4 17.2V6.4" />
      <Dot cx={20.4} cy={20} r={1.3} />
    </>
  ),
  sun: (
    <>
      <path d="M15.5 8.5a5 5 0 1 0-3.9 8.4" />
      <path d="M12 2.6v2M12 19.4v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2.6 12h2M19.4 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      <Dot cx={15.6} cy={15.6} r={1.3} />
    </>
  ),
  moon: (
    <>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
      <Dot cx={16.4} cy={7.4} r={1.1} />
    </>
  ),
  plus: <path d="M12 5.2v13.6M5.2 12h13.6" />,
  edit: (
    <>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14 6l3 3" />
      <Dot cx={19.6} cy={19.6} r={1.2} />
    </>
  ),
  trash: <path d="M4.4 7h15.2M9 7V5.2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V7m1.6 0v11.8a1 1 0 0 1-1 1H8.4a1 1 0 0 1-1-1V7M10.2 11v5.2M13.8 11v5.2" />,
  // 정답률: the tick closing an open ring, with the dot where the ring stops.
  check: <path d="m5 12.6 4.4 4.4L19 7.4" />,
  x: <path d="M6.2 6.2 17.8 17.8M17.8 6.2 6.2 17.8" />,
  speaker: (
    <>
      <path d="M4 9.2v5.6h3.8l4.6 3.6V5.6L7.8 9.2H4Z" />
      <path d="M15.8 9.4a4 4 0 0 1 0 5.2" />
      <path d="M18.4 7a7.4 7.4 0 0 1 0 10" />
    </>
  ),
  // 연속 학습: a flame drawn as one open stroke, the dot as the ember beside it.
  flame: (
    <>
      <path d="M13.4 3.2c.4 2.2-1.2 3.3-2.6 4.6-1.8 1.7-3.4 3.4-3.4 6a5.6 5.6 0 0 0 8.4 4.9" />
      <path d="M15.6 7.6c1.6 1.8 2.4 3.7 2.4 5.6a5.7 5.7 0 0 1-1.3 3.6" />
      <Dot cx={16.4} cy={19} r={1.4} />
    </>
  ),
  'chevron-left': <path d="M15 5.2 8.2 12 15 18.8" />,
  'chevron-right': <path d="M9 5.2 15.8 12 9 18.8" />,
  // 복습: the cycle, open, with the dot marking where it begins again.
  refresh: (
    <>
      <path d="M19.4 12a7.4 7.4 0 0 1-12.6 5.2" />
      <path d="M4.6 12A7.4 7.4 0 0 1 17.2 6.8" />
      <path d="M17.4 3.4v3.6h-3.6M6.6 20.6V17h3.6" />
      <Dot cx={19.6} cy={18.6} r={1.3} />
    </>
  ),
  clock: (
    <>
      <path d="M18.9 7.4A9 9 0 1 0 21 12" />
      <path d="M12 7.2V12l3.2 1.9" />
      <Dot cx={19.4} cy={18.4} r={1.3} />
    </>
  ),
  grid: (
    <>
      <rect x="3.6" y="3.6" width="7" height="7" rx="2" />
      <rect x="13.4" y="3.6" width="7" height="7" rx="2" />
      <rect x="3.6" y="13.4" width="7" height="7" rx="2" />
      <path d="M13.4 17a3.5 3.5 0 1 0 3.5-3.5" />
      <Dot cx={19.6} cy={19.6} r={1.3} />
    </>
  ),
  // 검색: the lens as an open ring, the handle running out to the dot.
  search: (
    <>
      <path d="M15.4 6.4a6.2 6.2 0 1 0 1 7.6" />
      <path d="m16.4 15.4 3 3" />
      <Dot cx={20.4} cy={19.8} r={1.3} />
    </>
  ),
  star: (
    <path d="M12 3.6l2.5 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.1 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z" />
  ),
  folder: (
    <>
      <path d="M3.6 6.6A1.6 1.6 0 0 1 5.2 5h4.3l2 2.5h7.3A1.6 1.6 0 0 1 20.4 9v8a1.6 1.6 0 0 1-1.6 1.6H5.2A1.6 1.6 0 0 1 3.6 17V6.6Z" />
    </>
  ),
  /*
   * 설정: sliders rather than a gear. A gear at 20px needs teeth, and teeth drawn
   * as short round-capped strokes turn into a ring of dots — which reads as a sun,
   * a shape this set already uses. Rails and knobs stay legible at any size.
   */
  settings: (
    <>
      <path d="M4 7.4h6.4M14.6 7.4H20M4 16.6h4.4M12.6 16.6H20M4 12h11" />
      <circle cx="12.5" cy="7.4" r="2.1" />
      <circle cx="10.5" cy="16.6" r="2.1" />
      <Dot cx={18} cy={12} r={2} />
    </>
  ),
  note: (
    <>
      <path d="M6 3.6h8.6L19.4 8.2v11.2a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1Z" />
      <path d="M14.2 3.8v4.4h4.4M8.6 12.4h6.8M8.6 16h4.2" />
    </>
  ),
  // Divider bar with a dot above and below — reads as "a formula".
  formula: (
    <>
      <path d="M4.8 12h14.4" />
      <Dot cx={12} cy={7.4} r={1.7} />
      <Dot cx={12} cy={16.6} r={1.7} />
    </>
  ),
  brain: (
    <>
      <path d="M12 5.6v12.8" />
      <path d="M12 7a3 3 0 0 0-5.5 1.7A2.6 2.6 0 0 0 5 11a2.6 2.6 0 0 0 1.2 2.2A3 3 0 0 0 12 16" />
      <path d="M12 7a3 3 0 0 1 5.5 1.7A2.6 2.6 0 0 1 19 11a2.6 2.6 0 0 1-1.2 2.2A3 3 0 0 1 12 16" />
    </>
  ),
};

export function Icon({
  name,
  className,
  strokeWidth = 1.7,
  ...rest
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
