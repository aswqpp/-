import { useEffect, useState } from 'react';
import type { PendingReview, Screen } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Icon, type IconName } from '../components/Icon';
import StudyPage from './StudyPage';
import QuizPage from './QuizPage';

export type LearnTab = 'flashcard' | 'quiz';

const TABS: { key: LearnTab; label: string; icon: IconName }[] = [
  { key: 'flashcard', label: '플래시카드', icon: 'cards' },
  { key: 'quiz', label: '퀴즈', icon: 'quiz' },
];

/**
 * Flashcards and quizzes are two ways of doing the same thing — reviewing the words
 * that are due — so they share one screen instead of two bottom-nav slots.
 *
 * The tab strip hides while a session is running: switching tabs unmounts the page
 * and would throw away a half-finished session with no warning.
 */
export default function LearnPage({
  app,
  tab,
  onTabChange,
  onNavigate,
  pending,
  onConsumePending,
}: {
  app: UseAppState;
  tab: LearnTab;
  onTabChange: (t: LearnTab) => void;
  onNavigate: (s: Screen) => void;
  pending?: PendingReview | null;
  onConsumePending?: () => void;
}) {
  const [sessionActive, setSessionActive] = useState(false);

  // A tab switch always lands on that tab's setup screen, so the flag starts clean.
  useEffect(() => setSessionActive(false), [tab]);

  return (
    <div className="flex flex-col gap-4">
      {!sessionActive && (
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              aria-current={tab === t.key}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === t.key
                  ? 'bg-white text-indigo-600 shadow-sm dark:bg-slate-900 dark:text-indigo-400'
                  : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon name={t.icon} className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      )}

      {tab === 'flashcard' ? (
        <StudyPage
          app={app}
          onOpenQuiz={() => onTabChange('quiz')}
          onSessionActiveChange={setSessionActive}
          pending={pending}
          onConsumePending={onConsumePending}
        />
      ) : (
        <QuizPage
          app={app}
          onNavigate={onNavigate}
          onSessionActiveChange={setSessionActive}
          pending={pending}
          onConsumePending={onConsumePending}
        />
      )}
    </div>
  );
}
