import { useEffect, useMemo, useState } from 'react';
import type { Difficulty, Screen, Word } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Button, Card, EmptyState, ProgressBar, DifficultyCycleBadge, FavoriteStarButton, Badge } from '../components/ui';
import { Icon } from '../components/Icon';
import { useTts } from '../hooks/useTts';
import { getDueWords, QUALITY_CORRECT, QUALITY_INCORRECT } from '../lib/srs';

type Phase = 'setup' | 'active' | 'done';

export default function StudyPage({
  app,
  onNavigate,
  pendingWordIds,
  onConsumePending,
}: {
  app: UseAppState;
  onNavigate: (s: Screen) => void;
  pendingWordIds?: string[] | null;
  onConsumePending?: () => void;
}) {
  const { words } = app.state;
  const { speak, supported } = useTts();

  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
  const [phase, setPhase] = useState<Phase>('setup');
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [frontIsWord, setFrontIsWord] = useState(app.state.settings.flashcardFrontIsWord);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [focusedReview, setFocusedReview] = useState(false);

  const categories = useMemo(() => Array.from(new Set(words.map((w) => w.category || '미분류'))).sort(), [words]);

  const scopedWords = useMemo(
    () =>
      words.filter((w) => {
        if (category !== 'all' && (w.category || '미분류') !== category) return false;
        if (difficulty !== 'all' && w.difficulty !== difficulty) return false;
        return true;
      }),
    [words, category, difficulty]
  );
  const dueWords = useMemo(() => getDueWords(scopedWords), [scopedWords]);

  function start(list: Word[], focused = false) {
    if (list.length === 0) return;
    setQueue(list);
    setIndex(0);
    setFlipped(false);
    setCorrect(0);
    setWrong(0);
    setFocusedReview(focused);
    setPhase('active');
  }

  useEffect(() => {
    if (!pendingWordIds || pendingWordIds.length === 0) return;
    const idSet = new Set(pendingWordIds);
    const targeted = words.filter((w) => idSet.has(w.id));
    onConsumePending?.();
    start(targeted, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingWordIds]);

  function grade(know: boolean) {
    const word = queue[index];
    app.gradeWord(word.id, know ? QUALITY_CORRECT : QUALITY_INCORRECT);
    if (know) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);

    const next = index + 1;
    if (next >= queue.length) {
      app.logSession(queue.length, correct + (know ? 1 : 0), wrong + (know ? 0 : 1));
      setPhase('done');
    } else {
      setIndex(next);
      setFlipped(false);
    }
  }

  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">플래시카드 학습</h1>

        {words.length === 0 ? (
          <EmptyState title="등록된 단어가 없어요" description="단어장에서 먼저 단어를 추가해주세요." />
        ) : (
          <>
            <Card>
              <p className="mb-2 text-xs font-semibold text-slate-500">학습 범위 좁히기</p>
              <div className="flex gap-2">
                <select className="input flex-1" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="all">전체 카테고리</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select className="input flex-1" value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | 'all')}>
                  <option value="all">전체 난이도</option>
                  <option value="easy">쉬움</option>
                  <option value="medium">보통</option>
                  <option value="hard">어려움</option>
                </select>
              </div>
            </Card>

            <Card>
              <p className="text-sm text-slate-500">오늘 복습할 단어</p>
              <p className="mt-1 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{dueWords.length}개</p>
              <Button className="mt-3 w-full" onClick={() => start(dueWords)} disabled={dueWords.length === 0}>
                <Icon name="cards" className="h-4 w-4" /> 오늘의 복습 시작
              </Button>
            </Card>

            <Card>
              <p className="text-sm text-slate-500">범위 내 전체 단어로 자유 학습</p>
              <p className="mt-1 text-xs text-slate-400">복습 예정과 상관없이 {scopedWords.length}개 단어를 학습해요.</p>
              <Button variant="secondary" className="mt-3 w-full" onClick={() => start(shuffle(scopedWords))} disabled={scopedWords.length === 0}>
                자유 학습 시작
              </Button>
            </Card>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">카드 앞면에 단어 표시</span>
              <input
                type="checkbox"
                checked={frontIsWord}
                onChange={(e) => setFrontIsWord(e.target.checked)}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>
          </>
        )}
      </div>
    );
  }

  if (phase === 'done') {
    const total = correct + wrong;
    const acc = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950">
          <Icon name="check" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">학습 완료!</h2>
        <p className="text-sm text-slate-500">{queue.length}개 단어를 학습했어요. 정답률 {acc}%</p>
        <div className="flex gap-3 text-sm">
          <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            안다 {correct}
          </span>
          <span className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-600 dark:bg-rose-950 dark:text-rose-400">
            모른다 {wrong}
          </span>
        </div>
        <div className="mt-2 flex w-full max-w-xs gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setPhase('setup')}>
            다시 학습
          </Button>
          <Button className="flex-1" onClick={() => onNavigate('quiz')}>
            퀴즈로 확인
          </Button>
        </div>
      </div>
    );
  }

  const queuedWord = queue[index];
  const word = words.find((w) => w.id === queuedWord.id) ?? queuedWord;
  const frontText = frontIsWord ? word.word : word.meaning;
  const backText = frontIsWord ? word.meaning : word.word;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setPhase('setup')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Icon name="chevron-left" className="h-4 w-4" /> 종료
        </button>
        <p className="text-sm font-semibold text-slate-500">
          {index + 1} / {queue.length} 완료
        </p>
      </div>
      <ProgressBar value={index} max={queue.length} />

      {focusedReview && (
        <div className="flex justify-center">
          <Badge tone="rose">취약 단어 집중 복습</Badge>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <FavoriteStarButton active={word.favorite} onToggle={() => app.updateWord(word.id, { favorite: !word.favorite })} className="h-5 w-5" />
        <DifficultyCycleBadge value={word.difficulty} onChange={(d) => app.updateWord(word.id, { difficulty: d })} />
      </div>

      <div className="flip-scene mt-1">
        <div
          className={`flip-card relative h-72 w-full cursor-pointer select-none ${flipped ? 'flipped' : ''}`}
          onClick={() => setFlipped((f) => !f)}
        >
          <div className="flip-face absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-md dark:border-slate-800 dark:bg-slate-900">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100">{frontText}</span>
            {frontIsWord && word.phonetic && <span className="text-sm text-slate-400">{word.phonetic}</span>}
            {frontIsWord && supported && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  speak(word.word);
                }}
                className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
              >
                <Icon name="speaker" className="h-4 w-4" />
              </button>
            )}
            <span className="mt-2 text-xs text-slate-300">탭하여 뒤집기</span>
          </div>
          <div className="flip-face flip-face-back absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-3xl border border-indigo-200 bg-indigo-50 p-6 text-center shadow-md dark:border-indigo-900 dark:bg-indigo-950">
            <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{backText}</span>
            {word.example && (
              <div className="mt-2 space-y-1">
                <p className="text-sm italic text-slate-500 dark:text-slate-400">"{word.example}"</p>
                {word.exampleTranslation && <p className="text-xs text-slate-400">{word.exampleTranslation}</p>}
              </div>
            )}
          </div>
        </div>
      </div>

      {flipped ? (
        <div className="mt-2 flex gap-3">
          <Button variant="danger" className="flex-1 py-3.5" onClick={() => grade(false)}>
            <Icon name="x" className="h-5 w-5" /> 모른다
          </Button>
          <Button variant="success" className="flex-1 py-3.5" onClick={() => grade(true)}>
            <Icon name="check" className="h-5 w-5" /> 안다
          </Button>
        </div>
      ) : (
        <p className="mt-2 text-center text-xs text-slate-400">카드를 탭해서 뜻을 확인하세요</p>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
