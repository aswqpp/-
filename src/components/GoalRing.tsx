const SIZE = 72;
const STROKE = 7;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

export function GoalRing({ done, goal }: { done: number; goal: number }) {
  const ratio = goal > 0 ? Math.min(1, done / goal) : 0;
  const pct = Math.round(ratio * 100);
  const complete = goal > 0 && done >= goal;

  return (
    <div
      className="flex shrink-0 items-center gap-3"
      role="img"
      aria-label={`오늘 목표 ${goal}개 중 ${done}개 완료, ${pct}%`}
    >
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            className="stroke-slate-100 dark:stroke-slate-700"
          />
          {/* Omitted entirely at zero: a round cap on a zero-length dash still paints
              a dot, which reads as a sliver of progress that isn't there. */}
          {ratio > 0 && (
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={R}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              className={complete ? 'stroke-amber-500 dark:stroke-amber-400' : 'stroke-indigo-600 dark:stroke-indigo-400'}
              style={{ transition: 'stroke-dasharray 0.4s ease' }}
            />
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-sm font-extrabold text-slate-800 dark:text-slate-100">{pct}%</span>
        </div>
      </div>
      <div className="leading-tight">
        <p className="text-xs text-slate-400">오늘 목표</p>
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {done} / {goal}개
        </p>
        {/* The gold is 깨달음 — reserved for the moment the goal is actually reached. */}
        {complete && <p className="mt-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">목표 달성</p>}
      </div>
    </div>
  );
}
