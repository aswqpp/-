import { useMemo, useState } from 'react';
import type { Screen } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Card, EmptyState, Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { ScopePicker } from '../components/ScopePicker';
import { applyScope, EMPTY_SCOPE, type Scope } from '../lib/scope';
import AnagramGame from '../components/games/AnagramGame';
import WordBuildGame from '../components/games/WordBuildGame';
import MatchGame from '../components/games/MatchGame';

type GameKey = 'menu' | 'anagram' | 'wordbuild' | 'match';

export default function GamesPage({ app }: { app: UseAppState; onNavigate: (s: Screen) => void }) {
  const [active, setActive] = useState<GameKey>('menu');
  const { words } = app.state;

  const [scope, setScope] = useState<Scope>(EMPTY_SCOPE);
  const scopedWords = useMemo(() => applyScope(words, scope), [words, scope]);

  if (words.length < 4) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">게임으로 복습</h1>
        <EmptyState title="게임을 하려면 단어가 더 필요해요" description="단어장에 최소 4개 이상의 단어를 등록해주세요." />
      </div>
    );
  }

  if (active === 'anagram') {
    return <AnagramGame app={app} pool={scopedWords} onExit={() => setActive('menu')} />;
  }
  if (active === 'wordbuild') {
    return <WordBuildGame app={app} pool={scopedWords} onExit={() => setActive('menu')} />;
  }
  if (active === 'match') {
    return <MatchGame app={app} pool={scopedWords} onExit={() => setActive('menu')} />;
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">게임으로 복습</h1>
      <p className="text-sm text-slate-500">게임에서 틀린 단어는 복습 우선순위가 올라가요.</p>

      <ScopePicker words={words} scope={scope} onChange={setScope} title="게임 범위 좁히기" />

      {scopedWords.length < 3 ? (
        <EmptyState title="이 범위엔 단어가 부족해요" description="카테고리나 난이도 필터를 넓혀보세요." />
      ) : (
        <>
          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
                <Icon name="game" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">애너그램 게임</p>
                <p className="mt-0.5 text-xs text-slate-400">섞인 철자를 보고 원래 단어를 맞춰보세요.</p>
              </div>
            </div>
            <Button className="mt-3 w-full" onClick={() => setActive('anagram')}>
              시작하기
            </Button>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400">
                <Icon name="clock" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">단어 조합 게임</p>
                <p className="mt-0.5 text-xs text-slate-400">주어진 알파벳으로 제한시간 내에 단어장 속 단어를 찾아보세요.</p>
              </div>
            </div>
            <Button className="mt-3 w-full" onClick={() => setActive('wordbuild')}>
              시작하기
            </Button>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <Icon name="grid" className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <p className="font-bold text-slate-800 dark:text-slate-100">카드 짝맞추기 게임</p>
                <p className="mt-0.5 text-xs text-slate-400">단어 카드와 뜻 카드의 짝을 맞춰보세요. 걸린 시간과 시도 횟수가 기록돼요.</p>
              </div>
            </div>
            <Button className="mt-3 w-full" onClick={() => setActive('match')}>
              시작하기
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
