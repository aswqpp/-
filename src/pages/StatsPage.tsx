import { useMemo } from 'react';
import type { UseAppState } from '../hooks/useAppState';
import { Card, Badge } from '../components/ui';
import { Icon } from '../components/Icon';
import { computeStreak, last7Days, overallAccuracy } from '../lib/stats';
import { WeeklyBarChart } from '../components/WeeklyBarChart';

export default function StatsPage({ app }: { app: UseAppState }) {
  const { words, log } = app.state;
  const streak = computeStreak(log);
  const weekly = useMemo(() => last7Days(log), [log]);
  const accuracy = overallAccuracy(log);

  const totalStudied = log.reduce((sum, l) => sum + l.studiedCount, 0);

  const mastery = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    let untouched = 0;
    for (const w of words) {
      if (w.srs.repetitions === 0 && w.srs.correctCount === 0 && w.srs.wrongCount === 0) untouched++;
      else if (w.srs.repetitions >= 3 && w.srs.interval >= 21) mastered++;
      else learning++;
    }
    return { mastered, learning, untouched, total: words.length };
  }, [words]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">학습 통계</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-orange-50 text-orange-500 dark:bg-orange-950">
            <Icon name="flame" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{streak}일</p>
            <p className="text-xs text-slate-400">연속 학습</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950">
            <Icon name="check" className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{accuracy}%</p>
            <p className="text-xs text-slate-400">전체 정답률</p>
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">최근 7일 학습 추이</p>
        <p className="mb-3 text-xs text-slate-400">누적 {totalStudied}개 단어 학습</p>
        <WeeklyBarChart data={weekly} />
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">단어 숙련도 ({mastery.total}개)</p>
        <div className="flex flex-col gap-2.5">
          <MasteryRow label="마스터" tone="green" count={mastery.mastered} total={mastery.total} />
          <MasteryRow label="학습 중" tone="amber" count={mastery.learning} total={mastery.total} />
          <MasteryRow label="미학습" tone="slate" count={mastery.untouched} total={mastery.total} />
        </div>
      </Card>
    </div>
  );
}

function MasteryRow({
  label,
  tone,
  count,
  total,
}: {
  label: string;
  tone: 'green' | 'amber' | 'slate';
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const barTone: Record<string, string> = {
    green: 'bg-emerald-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400',
  };
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <Badge tone={tone}>{label}</Badge>
        <span className="font-semibold text-slate-500">{count}개 ({pct}%)</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className={`h-full rounded-full ${barTone[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
