import type { DifficultyDistribution } from '../lib/stats';

const SIZE = 140;
const STROKE = 20;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const GAP_PX = 2.5;

const SEGMENTS: { key: keyof Omit<DifficultyDistribution, 'total'>; label: string; strokeClass: string; dotClass: string }[] = [
  { key: 'easy', label: '쉬움', strokeClass: 'stroke-emerald-500 dark:stroke-emerald-400', dotClass: 'bg-emerald-500 dark:bg-emerald-400' },
  { key: 'medium', label: '보통', strokeClass: 'stroke-amber-500 dark:stroke-amber-400', dotClass: 'bg-amber-500 dark:bg-amber-400' },
  { key: 'hard', label: '어려움', strokeClass: 'stroke-rose-500 dark:stroke-rose-400', dotClass: 'bg-rose-500 dark:bg-rose-400' },
  // Kept last and grey: "not measured yet" is the absence of a rating, not a fourth level.
  { key: 'unrated', label: '미평가 (-)', strokeClass: 'stroke-slate-300 dark:stroke-slate-600', dotClass: 'bg-slate-300 dark:bg-slate-600' },
];

export function DifficultyDonut({ data }: { data: DifficultyDistribution }) {
  if (data.total === 0) {
    return <p className="py-4 text-center text-xs text-slate-400">아직 단어가 없어요.</p>;
  }

  let offset = 0;
  const arcs = SEGMENTS.map((seg) => {
    const value = data[seg.key];
    const length = (value / data.total) * CIRCUMFERENCE;
    const dash = Math.max(0, length - GAP_PX);
    const arc = { ...seg, value, pct: Math.round((value / data.total) * 100), dashArray: `${dash} ${CIRCUMFERENCE - dash}`, dashOffset: -offset };
    offset += length;
    return arc;
  }).filter((a) => a.value > 0);

  return (
    <div className="flex items-center gap-5">
      <svg
        role="img"
        aria-label={`난이도별 분포: ${SEGMENTS.map((s) => `${s.label} ${data[s.key]}개`).join(', ')}`}
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="shrink-0 -rotate-90"
      >
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-slate-100 dark:stroke-slate-800" />
        {arcs.map((a) => (
          <circle
            key={a.key}
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeDasharray={a.dashArray}
            strokeDashoffset={a.dashOffset}
            strokeLinecap="round"
            className={a.strokeClass}
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5">
        {SEGMENTS.map((seg) => (
          <div key={seg.key} className="flex items-center gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${seg.dotClass}`} />
            <span className="font-semibold text-slate-600 dark:text-slate-300">{seg.label}</span>
            <span className="text-slate-400">
              {data[seg.key]}개 ({data.total ? Math.round((data[seg.key] / data.total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
