import type { CategoryMastery } from '../lib/stats';

export function CategoryMasteryBars({ data }: { data: CategoryMastery[] }) {
  if (data.length === 0) {
    return <p className="py-4 text-center text-xs text-slate-400">아직 단어가 없어요.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {data.map((c) => (
        <div key={c.category}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-600 dark:text-slate-300">{c.category}</span>
            <span className="text-slate-400">
              {c.mastered}/{c.total} · {c.pct}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-indigo-500 transition-all duration-300" style={{ width: `${c.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}
