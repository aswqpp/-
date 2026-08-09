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
  longestStreak,
  studyTotals,
  weekdayPattern,
  memoryStageDistribution,
} from '../lib/stats';
import { StudyHeatmap } from '../components/StudyHeatmap';
import { AccuracyTrendChart } from '../components/AccuracyTrendChart';
import { CategoryMasteryBars } from '../components/CategoryMasteryBars';
import { DifficultyDonut } from '../components/DifficultyDonut';
import { WeekdayPattern } from '../components/WeekdayPattern';
import { MemoryStageBar } from '../components/MemoryStageBar';
import { EASY_AT, HARD_AT } from '../lib/difficulty';

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
  const totals = useMemo(() => studyTotals(log), [log]);
  const bestStreak = useMemo(() => longestStreak(log), [log]);
  const weekday = useMemo(() => weekdayPattern(log), [log]);
  const stages = useMemo(() => memoryStageDistribution(words), [words]);
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
        <p className="mb-2 text-sm font-bold text-slate-700 dark:text-slate-200">누적 기록</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Metric label="최장 연속" value={`${bestStreak}일`} />
          <Metric label="학습한 날" value={`${totals.studyDays}일`} />
          <Metric label="누적 학습 단어" value={`${totals.totalStudied}개`} />
          <Metric label="누적 문제 풀이" value={`${totals.totalAttempts}회`} />
          <Metric label="학습일 평균" value={`${totals.avgPerStudyDay}개`} />
          <Metric
            label="최고 기록"
            value={totals.bestDayCount > 0 ? `${totals.bestDayCount}개` : '-'}
            sub={totals.bestDayDate ?? undefined}
          />
        </div>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">날짜별 학습량</p>
        <StudyHeatmap log={log} />
      </Card>

      <Card>
        <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">요일별 학습 패턴</p>
        <p className="mb-3 text-xs text-slate-400">어느 요일에 꾸준히 하고 있는지 보여줘요.</p>
        <WeekdayPattern data={weekday} />
      </Card>

      <Card>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">암기 단계 ({words.length}개)</p>
        <p className="mb-3 text-xs text-slate-400">간격 반복 알고리즘이 각 단어를 어디까지 밀어냈는지예요.</p>
        <MemoryStageBar data={stages} total={words.length} />
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
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">난이도별 분포 ({diffDist.total}개)</p>
        <p className="mb-3 text-xs text-slate-400">난이도는 직접 정하지 않고, 각 단어의 오답률로 자동 계산돼요.</p>
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

      <Card className="bg-slate-50 dark:bg-slate-900/60">
        <p className="mb-2 text-xs font-bold text-slate-600 dark:text-slate-300">난이도는 이렇게 계산돼요</p>
        <div className="overflow-x-auto">
          <code className="block whitespace-nowrap rounded-lg bg-white px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            보정 오답률 = (틀린 횟수 + 1) ÷ (전체 시도 + 2)
          </code>
        </div>
        <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <li>
            · <b className="text-rose-500">어려움</b> = {HARD_AT} 이상 &nbsp;
            · <b className="text-amber-500">보통</b> = {EASY_AT} 초과 {HARD_AT} 미만 &nbsp;
            · <b className="text-emerald-500">쉬움</b> = {EASY_AT} 이하
          </li>
          <li>· 한 번도 풀지 않은 단어는 <b>미평가 (-)</b>예요. 보통과 다르게, 아직 알 수 없다는 뜻이에요.</li>
          <li>
            · 분자·분모에 1과 2를 더하는 건 <b>보정</b>이에요. 그냥 나누면 한 번 틀렸을 때 곧바로 100%가 되어 난이도가
            튀기 때문에, 기록이 적을수록 중간값 쪽으로 당겨서 흔들림을 줄여요.
          </li>
          <li>· 예: 3번 맞고 3번 틀림 → (3+1)÷(6+2) = 0.50 → 보통 / 5번 맞고 0번 틀림 → 1÷7 ≈ 0.14 → 쉬움</li>
        </ul>
      </Card>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-right">
        <span className="font-bold tabular-nums text-slate-800 dark:text-slate-100">{value}</span>
        {sub && <span className="ml-1 text-[10px] text-slate-400">{sub}</span>}
      </span>
    </div>
  );
}
