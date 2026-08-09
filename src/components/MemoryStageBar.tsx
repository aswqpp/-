import { MEMORY_STAGE_LABEL, type MemoryStage } from '../lib/stats';

const STAGES: { key: MemoryStage; barClass: string; dotClass: string; hint: string }[] = [
  { key: 'new', barClass: 'bg-slate-300 dark:bg-slate-600', dotClass: 'bg-slate-300 dark:bg-slate-600', hint: '아직 한 번도 풀지 않음' },
  { key: 'learning', barClass: 'bg-amber-400', dotClass: 'bg-amber-400', hint: '이제 막 외우는 중' },
  { key: 'reviewing', barClass: 'bg-indigo-400', dotClass: 'bg-indigo-400', hint: '복습 주기가 늘어나는 중' },
  { key: 'mastered', barClass: 'bg-emerald-500', dotClass: 'bg-emerald-500', hint: '3주 이상 간격으로 안정됨' },
];

export function MemoryStageBar({ data, total }: { data: Record<MemoryStage, number>; total: number }) {
  if (total === 0) {
    return <p className="py-4 text-center text-xs text-slate-400">아직 단어가 없어요.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {STAGES.map((s) => {
          const pct = (data[s.key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={s.key}
              title={`${MEMORY_STAGE_LABEL[s.key]} ${data[s.key]}개`}
              className={`h-full ${s.barClass}`}
              // 2px of surface between segments so neighbours read apart without a stroke.
              style={{ width: `${pct}%`, marginRight: 2 }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
        {STAGES.map((s) => (
          <div key={s.key} className="flex items-baseline gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 translate-y-0.5 rounded-full ${s.dotClass}`} />
            <span className="font-semibold text-slate-600 dark:text-slate-300">{MEMORY_STAGE_LABEL[s.key]}</span>
            <span className="ml-auto tabular-nums text-slate-400">
              {data[s.key]} ({total ? Math.round((data[s.key] / total) * 100) : 0}%)
            </span>
          </div>
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-400">
        {STAGES.map((s) => `${MEMORY_STAGE_LABEL[s.key]}: ${s.hint}`).join(' · ')}
      </p>
    </div>
  );
}
