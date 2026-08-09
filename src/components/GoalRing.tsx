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
          <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" strokeWidth={STROKE} className="stroke-white/25" />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            className={complete ? 'stroke-emerald-300' : 'stroke-white'}
            style={{ transition: 'stroke-dasharray 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="text-sm font-extrabold text-white">{pct}%</span>
        </div>
      </div>
      <div className="leading-tight">
        <p className="text-xs text-indigo-100">오늘 목표</p>
        <p className="text-sm font-bold text-white">
          {done} / {goal}개
        </p>
        {complete && <p className="mt-0.5 text-[11px] font-semibold text-emerald-200">목표 달성! 🎉</p>}
      </div>
    </div>
  );
}
