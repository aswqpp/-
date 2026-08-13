import { useMemo, useState } from 'react';
import type { ReviewDirection, ReviewMode, Screen } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Card } from '../components/ui';
import { Icon } from '../components/Icon';
import {
  computeStreak,
  overallAccuracyStats,
  accuracyByMode,
  accuracyByDirection,
  getTodayEntry,
  categoryMastery,
  difficultyDistribution,
  reviewForecast,
  longestStreak,
  studyTotals,
  weekdayPattern,
  formatDuration,
  retentionStats,
} from '../lib/stats';
import { memoryStageDistribution } from '../lib/memory';
import { StudyVolumeChart } from '../components/StudyVolumeChart';
import { LearningCurveChart } from '../components/LearningCurveChart';
import { AccuracyTrendChart } from '../components/AccuracyTrendChart';
import { CategoryMasteryBars } from '../components/CategoryMasteryBars';
import { DifficultyDonut } from '../components/DifficultyDonut';
import { WeekdayPattern } from '../components/WeekdayPattern';
import { MemoryStageBar } from '../components/MemoryStageBar';
import { EASY_AT, HARD_AT } from '../lib/difficulty';
import { VERDICT_CONFIDENCE, VERDICT_MARGIN_SIGMA } from '../lib/halflife';

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];
const CATEGORY_PREVIEW_COUNT = 3;

const REVIEW_MODE_LABEL: Record<ReviewMode, string> = {
  mc: '객관식',
  listening: '듣고 뜻 맞추기',
  spelling: '스펠링 입력',
  flashcard: '플래시카드',
  game: '게임',
};

const REVIEW_DIRECTION_LABEL: Record<ReviewDirection, string> = {
  w2m: '단어 → 뜻',
  m2w: '뜻 → 단어',
};

export default function StatsPage({ app, onNavigate }: { app: UseAppState; onNavigate: (s: Screen) => void }) {
  const { words, log, migration } = app.state;
  const streak = computeStreak(log);
  const accuracy = useMemo(() => overallAccuracyStats(words), [words]);
  const byMode = useMemo(() => accuracyByMode(words), [words]);
  const byDirection = useMemo(() => accuracyByDirection(words), [words]);
  const todayStudied = getTodayEntry(log)?.studiedCount ?? 0;

  const catMastery = useMemo(() => categoryMastery(words), [words]);
  const diffDist = useMemo(() => difficultyDistribution(words), [words]);
  const forecast = useMemo(() => reviewForecast(words), [words]);
  const totals = useMemo(() => studyTotals(log), [log]);
  const bestStreak = useMemo(() => longestStreak(log), [log]);
  const weekday = useMemo(() => weekdayPattern(log), [log]);
  const stages = useMemo(() => memoryStageDistribution(words, app.model), [words, app.model]);
  const retention = useMemo(() => retentionStats(words), [words]);
  const forecastMax = Math.max(1, ...forecast.perDay.map((d) => d.count));
  const [formulaOpen, setFormulaOpen] = useState(false);

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
          <p className="mt-1.5 text-lg font-extrabold text-slate-800 dark:text-slate-100">{accuracy.pct}%</p>
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
          <Metric label="총 학습 시간" value={formatDuration(totals.totalSeconds)} />
          <Metric label="학습일 평균 시간" value={formatDuration(totals.avgSecondsPerStudyDay)} />
        </div>
        {totals.totalSeconds === 0 && totals.studyDays > 0 && (
          <p className="mt-2 text-[11px] text-slate-400">
            학습 시간은 이번 업데이트부터 기록돼요. 이전 기록에는 시간이 없어 0으로 표시됩니다.
          </p>
        )}
      </Card>

      <Card>
        <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">날짜별 학습량</p>
        <StudyVolumeChart log={log} />
      </Card>

      <Card>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">누적 학습 곡선</p>
        <p className="mb-3 text-xs text-slate-400">
          단어가 쌓이는 속도와, 그날 문제가 얼마나 어렵게 느껴졌는지를 함께 봐요.
        </p>
        <LearningCurveChart words={words} />
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
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">모드별 · 방향별 정확도</p>
        <p className="mb-3 text-xs text-slate-400">
          어떤 방식으로 물었을 때 잘 맞히는지 비교해요. 전체 정답률 {accuracy.pct}% ({accuracy.correct}/{accuracy.attempts}회)
        </p>

        {byMode.length === 0 ? (
          <p className="py-4 text-center text-xs text-slate-400">
            아직 모드별 기록이 없어요. 이번 업데이트 이후의 학습부터 쌓여요.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              {byMode.map((m) => (
                <AccuracyRow key={m.key} label={REVIEW_MODE_LABEL[m.key]} pct={m.pct} attempts={m.attempts} />
              ))}
            </div>
            <div className="flex flex-col gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
              {byDirection.map((d) => (
                <AccuracyRow key={d.key} label={REVIEW_DIRECTION_LABEL[d.key]} pct={d.pct} attempts={d.attempts} tone="violet" />
              ))}
            </div>
          </div>
        )}

        {accuracy.legacyAttempts > 0 && (
          <p className="mt-3 text-[11px] leading-relaxed text-slate-400">
            전체 정답률에는 이전 기록 {accuracy.legacyAttempts}회가 포함돼 있어요. 다만 그 기록에는 어떤 모드·방향으로
            풀었는지가 남아 있지 않아, 위 모드별·방향별 집계에서는 빠져 있습니다.
          </p>
        )}
      </Card>

      <Card>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">기억 유지력</p>
        <p className="mb-3 text-xs text-slate-400">
          정답률이 "얼마나 맞히는가"라면, 이건 "자리잡은 단어가 얼마나 다시 무너지는가"예요.
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
          <Metric
            label="평균 오답률"
            value={`${Math.round(retention.meanWrongRate * 100)}%`}
            sub={retention.isEstimate ? '표본 부족 — 기본값' : undefined}
          />
          <Metric
            label="평균 응답 시간"
            value={retention.avgResponseMs == null ? '-' : `${(retention.avgResponseMs / 1000).toFixed(1)}초`}
          />
          <Metric label="복습 붕괴" value={`${retention.lapses}회`} sub="자리잡은 뒤 다시 틀린 횟수" />
          <Metric label="붕괴한 단어" value={`${retention.lapsedWords}개`} />
        </div>
        {migration && (
          <p className="mt-2 text-[11px] text-slate-400">
            {migration.logCutoff} 이전 기록은 상세 이력이 없어 복습 붕괴·응답 시간 집계에서 빠져 있어요.
          </p>
        )}
      </Card>

      <Card>
        <p className="mb-1 text-sm font-bold text-slate-700 dark:text-slate-200">정답률 추이</p>
        <AccuracyTrendChart log={log} />
      </Card>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">카테고리별 숙련도</p>
          <button
            onClick={() => onNavigate('categories')}
            className="flex items-center gap-0.5 text-xs font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            전체 보기 <Icon name="chevron-right" className="h-3.5 w-3.5" />
          </button>
        </div>
        <CategoryMasteryBars data={catMastery.slice(0, CATEGORY_PREVIEW_COUNT)} />
        {catMastery.length > CATEGORY_PREVIEW_COUNT && (
          <p className="mt-2 text-[11px] text-slate-400">
            단어가 많은 {CATEGORY_PREVIEW_COUNT}개만 보여주고 있어요. 나머지 {catMastery.length - CATEGORY_PREVIEW_COUNT}개는
            전체 보기에서 확인하세요.
          </p>
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

      <Card>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">난이도별 분포 ({diffDist.total}개)</p>
        <p className="mb-3 text-xs text-slate-400">난이도는 직접 정하지 않고, 각 단어의 오답률로 자동 계산돼요.</p>
        <DifficultyDonut data={diffDist} />
      </Card>

      <Card className="bg-slate-50 dark:bg-slate-900/60">
        <button
          onClick={() => setFormulaOpen((v) => !v)}
          aria-expanded={formulaOpen}
          className="flex w-full items-center gap-2 text-left"
        >
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300">
            <Icon name="formula" className="h-4 w-4" />
          </span>
          <span className="flex-1 text-sm font-bold text-slate-700 dark:text-slate-200">난이도 계산 방식</span>
          <Icon
            name="chevron-right"
            className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${formulaOpen ? 'rotate-90' : ''}`}
          />
        </button>
        {!formulaOpen && <p className="mt-1.5 pl-9 text-[11px] text-slate-400">수식과 기준을 펼쳐서 볼 수 있어요.</p>}

        <div className={formulaOpen ? 'animate-pop-in' : 'hidden'}>
        <p className="mt-2 text-xs font-bold text-slate-600 dark:text-slate-300">① 확정 판정 — 잊는 속도로 재기</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          몇 번 틀렸는지만 세면, 40일 만에 다시 보고 틀린 단어와 하루 만에 다시 보고 틀린 단어를 구분할 수 없다.
          그래서 각 단어가 <b>얼마나 빨리 흐려지는지</b>를 직접 잰다.
        </p>
        <div className="mt-2 overflow-x-auto">
          <code className="block whitespace-nowrap rounded-lg bg-white px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            맞힐 확률 = 찍기 확률 + (1 − 찍기 확률) × 2^(−지난 일수 ÷ 반감기)
          </code>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          복습 사이의 간격과 정답 여부를 모아 단어별 <b>반감기</b>(기억이 절반으로 떨어지는 데 걸리는 일수)를 추정한다.
          연습을 쌓을수록 반감기가 늘어나는 정도, 모드별·방향별 난이도 차이는 단어장 전체에서 함께 추정해 빼낸다.
          객관식은 찍어서 맞을 수 있으므로 선택지 수만큼의 찍기 확률을 빼고 계산한다.
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          단어장 평균보다 {VERDICT_MARGIN_SIGMA}σ 이상 빠르거나 느리다고 <b>{Math.round(VERDICT_CONFIDENCE * 100)}% 이상</b>{' '}
          확신할 때만 어려움·쉬움을 확정한다. 확신이 부족하면 판정하지 않는다 — 근거 없이 이름표를 붙이지 않기 위해서다.
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          한계: <b>쉬움 확정은 거의 나오지 않는다.</b> 쉬운 단어일수록 복습 간격이 길어져 관측 자체가 드물고, 간격이
          반감기보다 훨씬 짧으면 "아직 안 잊었다"는 사실에서 얻을 정보가 거의 없다. 반대로 어려운 단어는 자주
          출제되므로 확정이 잘 된다.
        </p>

        <p className="mt-4 text-xs font-bold text-slate-600 dark:text-slate-300">② 잠정 판정(○) — 보정 오답률</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          ①이 아직 확신하지 못하는 단어는 오답률로 임시 표시하고, 칩에 작은 ○을 붙인다.
        </p>
        <div className="mt-2 overflow-x-auto">
          <code className="block whitespace-nowrap rounded-lg bg-white px-3 py-2 text-[11px] text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            보정 오답률 = (틀린 횟수 + 1) ÷ (전체 시도 횟수 + 2)
          </code>
        </div>
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          이 값을 기준으로 난이도를 다음과 같이 구분한다.
        </p>

        <dl className="mt-2 space-y-1 text-[11px] leading-relaxed">
          <Rule term="어려움" tone="text-rose-500" desc={`${HARD_AT} 이상`} />
          <Rule term="보통" tone="text-amber-500" desc={`${EASY_AT} 초과 ~ ${HARD_AT} 미만`} />
          <Rule term="쉬움" tone="text-emerald-500" desc={`${EASY_AT} 이하`} />
          <Rule
            term="미평가(-)"
            tone="text-slate-400"
            desc="한 번도 풀지 않은 단어. '보통'이 아니라 '아직 판단할 데이터가 없음'을 의미함."
          />
        </dl>

        <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">왜 +1, +2를 더하는가</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          시도 횟수가 적을 때 결과가 극단적으로 튀는 것을 막기 위한 보정이다. 단순히 (틀린 횟수 ÷ 전체 시도)로
          계산하면, 딱 한 번 풀고 틀린 단어는 곧바로 오답률 100%가 되어버린다. 데이터가 거의 없는데도 "가장 어려운
          단어"로 분류되는 셈이다.
        </p>
        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          그래서 분자에 1, 분모에 2를 더해 계산 결과를 중간값(0.5) 쪽으로 당긴다. 시도 횟수가 적을수록 이 보정의
          영향이 크고, 시도 횟수가 많아질수록 실제 정답률에 가까워진다.
        </p>

        <p className="mt-3 text-xs font-bold text-slate-600 dark:text-slate-300">예시</p>
        <ul className="mt-1 space-y-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
          <li>· 3번 맞고 3번 틀림 → (3+1) ÷ (6+2) = 0.50 → <b className="text-amber-500">보통</b></li>
          <li>· 5번 맞고 0번 틀림 → (0+1) ÷ (5+2) ≈ 0.14 → <b className="text-emerald-500">쉬움</b></li>
        </ul>

        {app.model.ratedWords > 0 && (
          <p className="mt-3 rounded-lg bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            지금 단어장: 반감기를 잰 단어 <b>{app.model.ratedWords}개</b> (복습 간격 기록 {app.model.totalObservations}건) ·
            중앙 반감기 <b>{Math.round(app.model.medianHalfLife)}일</b> · 단어 간 편차 σ {app.model.sigma.toFixed(2)} ·
            연속 정답 1회당 반감기 ×{(2 ** app.model.beta[1]).toFixed(2)}
          </p>
        )}
        </div>
      </Card>
    </div>
  );
}

function AccuracyRow({
  label,
  pct,
  attempts,
  tone = 'indigo',
}: {
  label: string;
  pct: number;
  attempts: number;
  tone?: 'indigo' | 'violet';
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-600 dark:text-slate-300">{label}</span>
        <span className="tabular-nums text-slate-400">
          {pct}% · {attempts}회
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${tone === 'violet' ? 'bg-violet-500' : 'bg-indigo-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function Rule({ term, tone, desc }: { term: string; tone: string; desc: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className={`shrink-0 font-bold ${tone}`}>{term}:</dt>
      <dd className="text-slate-500 dark:text-slate-400">{desc}</dd>
    </div>
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className="shrink-0 font-bold tabular-nums text-slate-800 dark:text-slate-100">{value}</span>
      </div>
      {/* On its own line: a long note squeezed onto the value line pushed the label into a wrap. */}
      {sub && <p className="mt-0.5 text-right text-[10px] leading-snug text-slate-400">{sub}</p>}
    </div>
  );
}
