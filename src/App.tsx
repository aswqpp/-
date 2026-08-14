import { useMemo, useState } from 'react';
import type { PendingReview, Screen } from './types';
import { useAppState } from './hooks/useAppState';
import { Icon, type IconName } from './components/Icon';
import { dueQueueFor } from './lib/scheduling';
import HomePage from './pages/HomePage';
import WordsPage from './pages/WordsPage';
import LearnPage, { type LearnTab } from './pages/LearnPage';
import GamesPage from './pages/GamesPage';
import StatsPage from './pages/StatsPage';
import CategoryMasteryPage from './pages/CategoryMasteryPage';
import { SettingsSheet } from './components/SettingsSheet';
import { Wordmark } from './components/Brand';

const NAV_ITEMS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'home', label: '홈', icon: 'home' },
  { screen: 'words', label: '단어장', icon: 'book' },
  // Quizzes live inside 학습 as a tab: same job, one nav slot.
  { screen: 'study', label: '학습', icon: 'cap' },
  { screen: 'games', label: '게임', icon: 'game' },
  { screen: 'stats', label: '통계', icon: 'chart' },
];

export default function App() {
  const app = useAppState();
  const [screen, setScreen] = useState<Screen>('home');
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [learnTab, setLearnTab] = useState<LearnTab>('flashcard');

  // What is actually offered today: due words minus whatever the daily caps hold back.
  const dueQueue = useMemo(
    () => dueQueueFor(app.state.words, app.state.words, app.state.settings, app.model),
    [app.state.words, app.state.settings, app.model]
  );
  const dueCount = dueQueue.queue.length;

  /**
   * Opens a session over exactly these words. Whether that is a flashcard run or a
   * quiz is the learner's choice (설정 → 학습 설정), except that a quiz needs other
   * words to draw distractors from — with one word in the app it falls back to cards.
   */
  function startFocusedReview(review: PendingReview) {
    const asQuiz = app.state.settings.focusedReviewMode === 'quiz' && app.state.words.length >= 2;
    setPendingReview(review);
    setLearnTab(asQuiz ? 'quiz' : 'flashcard');
    setScreen('study');
  }

  /** `quiz` is no longer its own screen — it opens 학습 with the quiz tab selected. */
  function navigate(next: Screen) {
    if (next === 'quiz') {
      setLearnTab('quiz');
      setScreen('study');
      return;
    }
    setScreen(next);
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <button className="flex items-center" onClick={() => setScreen('home')} aria-label="홈으로">
          <Wordmark />
        </button>
        {/* Dark mode lives in the settings sheet now — it is a preference you set once,
            not something worth a permanent slot in the header. */}
        <button
          aria-label="설정"
          onClick={() => setSettingsOpen(true)}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name="settings" className="h-5 w-5" />
        </button>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:sticky sm:bottom-auto sm:top-[57px] sm:border-b sm:border-t-0">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-1">
          {NAV_ITEMS.map((item) => {
            // The category screen is reached from stats, so it keeps that tab lit.
            const active = screen === item.screen || (item.screen === 'stats' && screen === 'categories');
            return (
              <button
                key={item.screen}
                onClick={() => setScreen(item.screen)}
                className={`relative flex flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-medium transition sm:flex-row sm:justify-center sm:gap-1.5 sm:py-3 sm:text-sm ${
                  active
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
                }`}
              >
                <Icon name={item.icon} className="h-5 w-5 sm:h-4 sm:w-4" />
                <span>{item.label}</span>
                {item.screen === 'study' && dueCount > 0 && (
                  <span className="absolute right-2 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white sm:static sm:ml-1">
                    {dueCount}
                  </span>
                )}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px hidden h-0.5 rounded-full bg-indigo-500 sm:block" />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {app.storageError && (
        <div className="mx-auto w-full max-w-2xl px-4 pt-4">
          <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-300">
            <Icon name="x" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{app.storageError}</p>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4 sm:pb-8">
        {screen === 'home' && (
          <HomePage
            app={app}
            dueCount={dueCount}
            heldBack={dueQueue.held}
            onNavigate={navigate}
            onStartReview={startFocusedReview}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        )}
        {screen === 'words' && <WordsPage app={app} />}
        {screen === 'study' && (
          <LearnPage
            app={app}
            tab={learnTab}
            onTabChange={setLearnTab}
            onNavigate={navigate}
            pending={pendingReview}
            onConsumePending={() => setPendingReview(null)}
          />
        )}
        {screen === 'games' && <GamesPage app={app} onNavigate={navigate} />}
        {screen === 'stats' && <StatsPage app={app} onNavigate={navigate} />}
        {screen === 'categories' && <CategoryMasteryPage app={app} onBack={() => setScreen('stats')} />}
      </main>

      {settingsOpen && <SettingsSheet app={app} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
