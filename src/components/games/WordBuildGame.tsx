import { useEffect, useMemo, useRef, useState } from 'react';
import type { Word } from '../../types';
import type { UseAppState } from '../../hooks/useAppState';
import { Button, Card, ProgressBar, Badge } from '../ui';
import { Icon } from '../Icon';
import { buildLetterPool } from '../../lib/games';

const TIME_LIMIT = 60;

export default function WordBuildGame({ app, pool, onExit }: { app: UseAppState; pool: Word[]; onExit: () => void }) {
  const [{ targetWords, letters }] = useState(() => buildLetterPool(pool, 6));
  const [found, setFound] = useState<Set<string>>(new Set());
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [ended, setEnded] = useState(false);
  const [shake, setShake] = useState(false);
  const finishedRef = useRef(false);

  const targetWordSet = useMemo(() => new Set(targetWords.map((w) => w.word.toLowerCase())), [targetWords]);

  useEffect(() => {
    if (ended || targetWords.length === 0) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          setEnded(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [ended, targetWords.length]);

  useEffect(() => {
    if (ended && !finishedRef.current) {
      finishedRef.current = true;
      // The round is played against one shared clock, so the elapsed time is split
      // evenly across the words it covered. It never affects grading (mode 'game'
      // disables time-based quality) — it only feeds the study-time statistic.
      const msPerWord = Math.round(((TIME_LIMIT - timeLeft) * 1000) / targetWords.length);
      app.gradeWords(
        targetWords.map((w) => ({
          id: w.id,
          correct: found.has(w.word.toLowerCase()),
          opts: { mode: 'game' as const, dir: 'm2w' as const, ms: msPerWord },
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ended]);

  function submitGuess() {
    const guess = input.trim().toLowerCase();
    if (!guess) return;
    setInput('');
    if (found.has(guess)) return;
    if (targetWordSet.has(guess)) {
      setFound((prev) => new Set(prev).add(guess));
      if (found.size + 1 >= targetWords.length) {
        setEnded(true);
      }
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  }

  if (targetWords.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">단어 조합 게임을 하기에 단어가 부족해요. 단어를 더 추가해보세요.</p>
        <Button className="mt-3" onClick={onExit}>
          돌아가기
        </Button>
      </Card>
    );
  }

  if (ended) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950">
          <Icon name="game" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">단어 조합 게임 완료!</h2>
        <p className="text-sm text-slate-500">
          {targetWords.length}개 중 {found.size}개 단어를 찾았어요
        </p>
        <div className="flex w-full max-w-sm flex-wrap justify-center gap-2">
          {targetWords.map((w) => (
            <Badge key={w.id} tone={found.has(w.word.toLowerCase()) ? 'green' : 'rose'}>
              {w.word}
            </Badge>
          ))}
        </div>
        <Button onClick={onExit}>게임 목록으로</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={onExit} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Icon name="chevron-left" className="h-4 w-4" /> 종료
        </button>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
          <Icon name="clock" className="h-4 w-4" /> {timeLeft}초
        </p>
      </div>
      <ProgressBar value={TIME_LIMIT - timeLeft} max={TIME_LIMIT} />

      <Card className="flex flex-col items-center gap-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          이 글자들로 단어장 속 단어를 만들어보세요 ({found.size}/{targetWords.length})
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {letters.map((ch, i) => (
            <span
              key={i}
              className="grid h-10 w-10 place-items-center rounded-lg border-2 border-amber-200 bg-amber-50 text-lg font-extrabold uppercase text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300"
            >
              {ch}
            </span>
          ))}
        </div>

        <div className={`w-full max-w-xs ${shake ? 'animate-[wiggle_0.4s]' : ''}`}>
          <input
            className="input text-center text-lg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
            placeholder="단어 입력 후 Enter"
            autoFocus
          />
        </div>
        <Button onClick={submitGuess} disabled={!input.trim()}>
          제출
        </Button>

        <div className="flex flex-wrap justify-center gap-2">
          {targetWords.map((w) => {
            const isFound = found.has(w.word.toLowerCase());
            return (
              <span
                key={w.id}
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isFound
                    ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
                }`}
              >
                {isFound ? w.word : `${w.word[0]}${'•'.repeat(w.word.length - 1)}`}
              </span>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
