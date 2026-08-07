import { useMemo, useState } from 'react';
import type { Screen } from './types';
import { useAppState } from './hooks/useAppState';
import { Icon, type IconName } from './components/Icon';
import { getDueWords } from './lib/srs';
import HomePage from './pages/HomePage';
import WordsPage from './pages/WordsPage';
import StudyPage from './pages/StudyPage';
import QuizPage from './pages/QuizPage';
import GamesPage from './pages/GamesPage';
import StatsPage from './pages/StatsPage';

const NAV_ITEMS: { screen: Screen; label: string; icon: IconName }[] = [
  { screen: 'home', label: '홈', icon: 'home' },
  { screen: 'words', label: '단어장', icon: 'book' },
  { screen: 'study', label: '학습', icon: 'cards' },
  { screen: 'quiz', label: '퀴즈', icon: 'quiz' },
  { screen: 'games', label: '게임', icon: 'game' },
  { screen: 'stats', label: '통계', icon: 'chart' },
];

export default function App() {
  const app = useAppState();
  const [screen, setScreen] = useState<Screen>('home');

  const dueCount = useMemo(() => getDueWords(app.state.words).length, [app.state.words]);

  return (
    <div className="flex min-h-screen w-full flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <button
          className="flex items-center gap-2 text-lg font-bold tracking-tight text-indigo-600 dark:text-indigo-400"
          onClick={() => setScreen('home')}
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-indigo-600 text-white dark:bg-indigo-500">
            <Icon name="cards" className="h-5 w-5" />
          </span>
          ASWQPP
        </button>
        <button
          aria-label="다크모드 전환"
          onClick={app.toggleDarkMode}
          className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Icon name={app.state.settings.darkMode ? 'sun' : 'moon'} className="h-5 w-5" />
        </button>
      </header>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 sm:sticky sm:bottom-auto sm:top-[57px] sm:border-b sm:border-t-0">
        <div className="mx-auto flex max-w-2xl items-stretch justify-between px-1">
          {NAV_ITEMS.map((item) => {
            const active = screen === item.screen;
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

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-24 pt-4 sm:pb-8">
        {screen === 'home' && <HomePage app={app} dueCount={dueCount} onNavigate={setScreen} />}
        {screen === 'words' && <WordsPage app={app} />}
        {screen === 'study' && <StudyPage app={app} onNavigate={setScreen} />}
        {screen === 'quiz' && <QuizPage app={app} onNavigate={setScreen} />}
        {screen === 'games' && <GamesPage app={app} onNavigate={setScreen} />}
        {screen === 'stats' && <StatsPage app={app} />}
      </main>
    </div>
  );
}
