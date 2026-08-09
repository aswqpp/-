import type { Screen } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Card, Button, Badge } from '../components/ui';
import { Icon } from '../components/Icon';
import { computeStreak, getTodayEntry } from '../lib/stats';
import { GoalRing } from '../components/GoalRing';

export default function HomePage({
  app,
  dueCount,
  onNavigate,
}: {
  app: UseAppState;
  dueCount: number;
  onNavigate: (s: Screen) => void;
}) {
  const { words, log } = app.state;
  const streak = computeStreak(log);
  const today = getTodayEntry(log);
  const studiedToday = today?.studiedCount ?? 0;
  const correctToday = today?.correctCount ?? 0;
  const wrongToday = today?.wrongCount ?? 0;
  const accuracyToday = correctToday + wrongToday > 0 ? Math.round((correctToday / (correctToday + wrongToday)) * 100) : null;

  return (
    <div className="flex flex-col gap-4">
      <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-indigo-100">오늘도 단어 학습 시작해볼까요?</p>
            <p className="mt-1 text-2xl font-bold">복습할 단어 {dueCount}개</p>
          </div>
          <div className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold">
            <Icon name="flame" className="h-4 w-4 text-orange-300" />
            {streak}일 연속
          </div>
        </div>
        <div className="mt-4 border-t border-white/20 pt-3">
          <GoalRing done={studiedToday} goal={app.state.settings.dailyGoal} />
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            variant="secondary"
            className="flex-1 bg-white text-indigo-700 hover:bg-indigo-50"
            onClick={() => onNavigate('study')}
            disabled={dueCount === 0 && words.length === 0}
          >
            <Icon name="cards" className="h-4 w-4" /> 학습 시작
          </Button>
          <Button variant="secondary" className="flex-1 bg-white/15 text-white hover:bg-white/25" onClick={() => onNavigate('quiz')}>
            <Icon name="quiz" className="h-4 w-4" /> 퀴즈
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="text-center">
          <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">{studiedToday}</p>
          <p className="mt-1 text-xs text-slate-400">오늘 학습 단어</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-extrabold text-emerald-500">{accuracyToday === null ? '-' : `${accuracyToday}%`}</p>
          <p className="mt-1 text-xs text-slate-400">오늘 정답률</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-extrabold text-slate-700 dark:text-slate-200">{words.length}</p>
          <p className="mt-1 text-xs text-slate-400">전체 단어 수</p>
        </Card>
      </div>

      <Card>
        <p className="mb-3 text-sm font-bold text-slate-700 dark:text-slate-200">빠른 이동</p>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction icon="book" label="단어장 관리" onClick={() => onNavigate('words')} />
          <QuickAction icon="game" label="게임으로 복습" onClick={() => onNavigate('games')} />
          <QuickAction icon="chart" label="학습 통계" onClick={() => onNavigate('stats')} />
          <QuickAction icon="quiz" label="퀴즈 풀기" onClick={() => onNavigate('quiz')} />
        </div>
      </Card>

      {words.length === 0 && (
        <Card className="flex flex-col items-center gap-2 text-center">
          <Badge tone="indigo">시작하기</Badge>
          <p className="text-sm text-slate-500">아직 등록된 단어가 없어요. 단어장에서 단어를 추가해보세요!</p>
          <Button onClick={() => onNavigate('words')}>
            <Icon name="plus" className="h-4 w-4" /> 단어 추가하기
          </Button>
        </Card>
      )}
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: 'book' | 'game' | 'chart' | 'quiz'; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl border border-slate-200 px-3 py-3 text-left text-sm font-semibold text-slate-600 transition hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-700 dark:text-slate-300 dark:hover:border-indigo-700 dark:hover:bg-indigo-950"
    >
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
        <Icon name={icon} className="h-4 w-4" />
      </span>
      {label}
    </button>
  );
}
