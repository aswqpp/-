import { MEMORY_STAGES, MEMORY_STAGE_DESC, MEMORY_STAGE_LABEL, type MemoryStage } from '../lib/memory';

const STAGE_COLOR: Record<MemoryStage, { bar: string; dot: string }> = {
  new: { bar: 'bg-slate-300 dark:bg-slate-600', dot: 'bg-slate-300 dark:bg-slate-600' },
  learning: { bar: 'bg-amber-400', dot: 'bg-amber-400' },
  reviewing: { bar: 'bg-indigo-400', dot: 'bg-indigo-400' },
  mastered: { bar: 'bg-emerald-500', dot: 'bg-emerald-500' },
  atRisk: { bar: 'bg-rose-500', dot: 'bg-rose-500' },
};

export function MemoryStageBar({ data, total }: { data: Record<MemoryStage, number>; total: number }) {
  if (total === 0) {
    return <p className="py-4 text-center text-xs text-slate-400">아직 단어가 없어요.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {MEMORY_STAGES.map((key) => {
          const pct = (data[key] / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={key}
              title={`${MEMORY_STAGE_LABEL[key]} ${data[key]}개`}
              className={`h-full ${STAGE_COLOR[key].bar}`}
              // 2px of surface between segments so neighbours read apart without a stroke.
              style={{ width: `${pct}%`, marginRight: 2 }}
            />
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {MEMORY_STAGES.map((key) => (
          <div key={key} className="flex items-baseline gap-2 text-xs">
            <span className={`h-2.5 w-2.5 shrink-0 translate-y-0.5 rounded-full ${STAGE_COLOR[key].dot}`} />
            <span className="font-semibold text-slate-600 dark:text-slate-300">{MEMORY_STAGE_LABEL[key]}</span>
            <span className="ml-auto tabular-nums text-slate-400">
              {data[key]} ({Math.round((data[key] / total) * 100)}%)
            </span>
          </div>
        ))}
      </div>

      <ul className="space-y-0.5 text-[11px] leading-relaxed text-slate-400">
        {MEMORY_STAGES.map((key) => (
          <li key={key}>
            · <span className="font-semibold">{MEMORY_STAGE_LABEL[key]}</span> — {MEMORY_STAGE_DESC[key]}
          </li>
        ))}
      </ul>
    </div>
  );
}
