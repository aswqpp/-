import { useMemo, useState } from 'react';
import type { UseAppState } from '../hooks/useAppState';
import { Card, EmptyState } from '../components/ui';
import { Icon } from '../components/Icon';
import { categoryMastery } from '../lib/stats';
import { MEMORY_STAGE_LABEL, memoryStage, type MemoryStage } from '../lib/memory';
import { CategoryMasteryBars } from '../components/CategoryMasteryBars';

type SortKey = 'total' | 'pct' | 'name';

const SORT_LABEL: Record<SortKey, string> = {
  total: '단어 많은 순',
  pct: '숙련도 높은 순',
  name: '이름순',
};

/**
 * Category mastery on its own screen. It used to sit in the dashboard, where a
 * learner with a dozen categories had to scroll past all of them to reach anything else.
 */
export default function CategoryMasteryPage({ app, onBack }: { app: UseAppState; onBack: () => void }) {
  const { words } = app.state;
  const [sort, setSort] = useState<SortKey>('total');

  const rows = useMemo(() => {
    const base = categoryMastery(words);
    const byCategory = new Map<string, Record<MemoryStage, number>>();
    for (const w of words) {
      const key = w.category.trim() || '미분류';
      let dist = byCategory.get(key);
      if (!dist) {
        dist = { new: 0, learning: 0, reviewing: 0, mastered: 0, atRisk: 0 };
        byCategory.set(key, dist);
      }
      dist[memoryStage(w)]++;
    }

    const sorted = [...base].sort((a, b) => {
      if (sort === 'name') return a.category.localeCompare(b.category);
      if (sort === 'pct') return b.pct - a.pct || b.total - a.total;
      return b.total - a.total;
    });

    return sorted.map((c) => ({ ...c, stages: byCategory.get(c.category)! }));
  }, [words, sort]);

  const overall = useMemo(() => {
    const mastered = rows.reduce((sum, r) => sum + r.mastered, 0);
    return { mastered, total: words.length, pct: words.length ? Math.round((mastered / words.length) * 100) : 0 };
  }, [rows, words.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
          <Icon name="chevron-left" className="h-4 w-4" /> 통계
        </button>
      </div>
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">카테고리별 숙련도</h1>

      {words.length === 0 ? (
        <EmptyState title="아직 단어가 없어요" description="단어를 추가하면 카테고리별 숙련도가 여기에 쌓여요." />
      ) : (
        <>
          <Card>
            <p className="text-sm text-slate-500">전체 숙련도</p>
            <p className="mt-1 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{overall.pct}%</p>
            <p className="mt-0.5 text-xs text-slate-400">
              암기 완료 {overall.mastered}개 / 전체 {overall.total}개 · 복습 간격이 3주 이상으로 벌어진 단어를 셉니다.
            </p>
          </Card>

          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(SORT_LABEL) as SortKey[]).map((key) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  sort === key
                    ? 'border-indigo-500 bg-indigo-600 text-white'
                    : 'border-slate-200 text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                {SORT_LABEL[key]}
              </button>
            ))}
          </div>

          <Card>
            <CategoryMasteryBars data={rows} />
          </Card>

          <Card>
            <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">카테고리별 암기 단계</p>
            <div className="flex flex-col gap-3">
              {rows.map((r) => (
                <div key={r.category} className="rounded-xl border border-slate-100 px-3 py-2.5 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-300">{r.category}</span>
                    <span className="text-slate-400">{r.total}개</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    {(Object.keys(r.stages) as MemoryStage[])
                      .filter((s) => r.stages[s] > 0)
                      .map((s) => (
                        <span key={s}>
                          {MEMORY_STAGE_LABEL[s]} <span className="font-semibold tabular-nums">{r.stages[s]}</span>
                        </span>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
