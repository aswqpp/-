import { useMemo } from 'react';
import type { UseAppState } from '../hooks/useAppState';
import { Card, Badge, Button } from '../components/ui';
import { Icon } from '../components/Icon';
import {
  computeStreak,
  overallAccuracy,
  getTodayEntry,
  categoryMastery,
  difficultyDistribution,
  weakWords,
  reviewForecast,
} from '../lib/stats';
import { StudyHeatmap } from '../components/StudyHeatmap';
import { AccuracyTrendChart } from '../components/AccuracyTrendChart';
import { CategoryMasteryBars } from '../components/CategoryMasteryBars';
import { DifficultyDonut } from '../components/DifficultyDonut';

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const WEAK_WORDS_TOP_N = 5;

export default function StatsPage({ app, onStartReview }: { app: UseAppState; onStartReview: (wordIds: string[]) => void }) {
  const { words, log } = app.state;
  const streak = computeStreak(log);
  const accuracy = overallAccuracy(log);
  const todayStudied = getTodayEntry(log)?.studiedCount ?? 0;

  const catMastery = useMemo(() => categoryMastery(words), [words]);
  const diffDist = useMemo(() => difficultyDistribution(words), [words]);
  const weak = useMemo(() => weakWords(words, WEAK_WORDS_TOP_N), [words]);
  const forecast = useMemo(() => reviewForecast(words), [words]);
  const forecastMax = Math.max(1, ...forecast.perDay.map((d) => d.count));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">학습 통계</h1>

      <div className="grid grid-cols-3 gap-2.5">
        <Card padding="p-3" className="flex flex-col items-center text-center">
          <Icon name="flame" className="h-5 w-5 text-orange-500" />
          <p className="mt-1.5 text-lg font-extrabold text-slate-800 dark:text-slate-100">{streak}일</p>
          <p className="text-[11px] text-slate-400">연속 학습</p>
        </Card>
        <Card padding="p-3" className="flex flex-col items-center text-center">
          <Icon name="cards" className="h-5 w-5 text-indigo-500" />
          <p className="mt-1.5 text-lg font-extrabold text-slate-800 dark:text-slate-100">{todayStudied}</p>
          <p className="text-[11px] text-slate-400">오늘 학습 단어</p>
        </Card>
        <Card padding="p-3" className="flex flex-col items-center text-center">
          <Icon name="check" className="h-5 w-5 text-emerald-500" />
          <p className="mt-1.5 text-lg font-extrabold text-slate-800 dark:text-slate-100">{accuracy}%</p>
          <p className="text-[11px] text-slate-400">전체 정답률</p>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">날짜별 학습량</p>
        <StudyHeatmap log={log} />
      </Card>

      <Card>
        <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">정답률 추이</p>
        <AccuracyTrendChart log={log} />
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">카테고리별 숙련도</p>
        <CategoryMasteryBars data={catMastery} />
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">난이도별 분포 ({diffDist.total}개)</p>
        <DifficultyDonut data={diffDist} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">취약 단어 Top {WEAK_WORDS_TOP_N}</p>
          {weak.length > 0 && (
            <button
              onClick={() => onStartReview(weak.map((w) => w.word.id))}
              className="text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
            >
              전체 복습하기
            </button>
          )}
        </div>
        {weak.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">아직 오답 데이터가 없어요.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {weak.map((w) => (
              <div key={w.word.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 px-3 py-2 dark:border-slate-800">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">{w.word.word}</p>
                  <p className="truncate text-xs text-slate-400">{w.word.meaning}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge tone="rose">오답률 {Math.round(w.wrongRate * 100)}%</Badge>
                  <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => onStartReview([w.word.id])}>
                    복습
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">복습 예정</p>
        <p className="mb-3 text-xs text-slate-400">
          오늘 <span className="font-bold text-indigo-600 dark:text-indigo-400">{forecast.todayCount}개</span> · 이번 주{' '}
          <span className="font-bold text-indigo-600 dark:text-indigo-400">{forecast.weekCount}개</span> 복습 예정이에요.
        </p>
        <div className="flex items-end gap-2">
          {forecast.perDay.map((d, i) => {
            const h = Math.max(3, Math.round((d.count / forecastMax) * 36));
            const dow = new Date(d.date + 'T00:00:00').getDay();
            return (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] font-semibold text-slate-500">{d.count}</span>
                <div className="flex h-9 w-full items-end">
                  <div
                    className={`w-full rounded-t ${i === 0 ? 'bg-indigo-500' : 'bg-indigo-200 dark:bg-indigo-900'}`}
                    style={{ height: h }}
                  />
                </div>
                <span className={`text-[10px] ${i === 0 ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>
                  {i === 0 ? '오늘' : DAY_LABEL[dow]}
                </span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
