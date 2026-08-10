import { useEffect, useRef, useState } from 'react';
import type { Word } from '../../types';
import type { UseAppState } from '../../hooks/useAppState';
import { Button, Card, Badge } from '../ui';
import { Icon } from '../Icon';
import { QUALITY_CORRECT, QUALITY_INCORRECT } from '../../lib/srs';
import { shuffleArray } from '../../lib/quiz';

const PAIR_COUNT = 5;
const MIN_PAIRS = 3;

interface CardItem {
  id: string;
  wordId: string;
  kind: 'word' | 'meaning';
  text: string;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MatchGame({ app, pool, onExit }: { app: UseAppState; pool: Word[]; onExit: () => void }) {
  const [pairWords] = useState<Word[]>(() => shuffleArray(pool).slice(0, Math.min(PAIR_COUNT, pool.length)));
  const [cards] = useState<CardItem[]>(() =>
    shuffleArray(
      pairWords.flatMap((w) => [
        { id: `${w.id}-word`, wordId: w.id, kind: 'word' as const, text: w.word },
        { id: `${w.id}-meaning`, wordId: w.id, kind: 'meaning' as const, text: w.meaning },
      ])
    )
  );

  const [flipped, setFlipped] = useState<string[]>([]);
  const [pendingResult, setPendingResult] = useState<'match' | 'mismatch' | null>(null);
  const [matchedWordIds, setMatchedWordIds] = useState<Set<string>>(new Set());
  const [wrongTouches, setWrongTouches] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finalElapsedMs, setFinalElapsedMs] = useState(0);
  const [tick, setTick] = useState(0);
  const startTimeRef = useRef(Date.now());
  const finishedRef = useRef(false);

  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [finished]);

  // `tick` forces a re-render each second so this stays live; it isn't read directly.
  void tick;
  const liveElapsedMs = Date.now() - startTimeRef.current;

  useEffect(() => {
    if (finishedRef.current) return;
    if (pairWords.length === 0 || matchedWordIds.size !== pairWords.length) return;
    finishedRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    let correctCount = 0;
    for (const w of pairWords) {
      const isClean = !wrongTouches[w.id];
      app.gradeWord(w.id, isClean ? QUALITY_CORRECT : QUALITY_INCORRECT);
      if (isClean) correctCount++;
    }
    app.logSession(pairWords.length, correctCount, pairWords.length - correctCount, elapsed / 1000);
    setFinalElapsedMs(elapsed);
    setFinished(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedWordIds]);

  function handleCardClick(card: CardItem) {
    if (locked || finished) return;
    if (matchedWordIds.has(card.wordId)) return;
    if (flipped.includes(card.id)) return;

    if (flipped.length === 0) {
      setFlipped([card.id]);
      return;
    }

    const firstCard = cards.find((c) => c.id === flipped[0])!;
    setFlipped([flipped[0], card.id]);
    setAttempts((a) => a + 1);
    setLocked(true);

    if (firstCard.wordId === card.wordId) {
      setPendingResult('match');
      setTimeout(() => {
        setMatchedWordIds((prev) => new Set(prev).add(card.wordId));
        setFlipped([]);
        setPendingResult(null);
        setLocked(false);
      }, 500);
    } else {
      setPendingResult('mismatch');
      const nextWrongTouches = {
        ...wrongTouches,
        [firstCard.wordId]: (wrongTouches[firstCard.wordId] ?? 0) + 1,
        [card.wordId]: (wrongTouches[card.wordId] ?? 0) + 1,
      };
      setWrongTouches(nextWrongTouches);
      setTimeout(() => {
        setFlipped([]);
        setPendingResult(null);
        setLocked(false);
      }, 800);
    }
  }

  if (pairWords.length < MIN_PAIRS) {
    return (
      <Card>
        <p className="text-sm text-slate-500">카드 짝맞추기 게임을 하기에 단어가 부족해요. 단어를 더 추가해보세요.</p>
        <Button className="mt-3" onClick={onExit}>
          돌아가기
        </Button>
      </Card>
    );
  }

  if (finished) {
    const cleanCount = pairWords.filter((w) => !wrongTouches[w.id]).length;
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950">
          <Icon name="grid" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">카드 짝맞추기 완료!</h2>
        <div className="flex gap-3 text-sm">
          <Badge tone="indigo">걸린 시간 {formatElapsed(finalElapsedMs)}</Badge>
          <Badge tone="amber">시도 {attempts}회</Badge>
        </div>
        <p className="text-sm text-slate-500">
          {pairWords.length}쌍 중 {cleanCount}쌍을 한 번에 맞췄어요.
        </p>
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
        <p className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <span className="flex items-center gap-1">
            <Icon name="clock" className="h-4 w-4" /> {formatElapsed(liveElapsedMs)}
          </span>
          <span>시도 {attempts}회</span>
        </p>
      </div>

      <p className="text-center text-xs text-slate-400">
        단어와 뜻 카드를 짝지어보세요 ({matchedWordIds.size}/{pairWords.length})
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {cards.map((card) => {
          const isMatched = matchedWordIds.has(card.wordId);
          const isFlipped = flipped.includes(card.id) || isMatched;
          const isMismatchShown = pendingResult === 'mismatch' && flipped.includes(card.id) && !isMatched;
          return (
            <button
              key={card.id}
              onClick={() => handleCardClick(card)}
              disabled={isMatched}
              className={`flex min-h-20 items-center justify-center rounded-xl border-2 p-2 text-center text-sm font-semibold transition ${
                isMatched
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-500 opacity-60 dark:border-emerald-800 dark:bg-emerald-950'
                  : isMismatchShown
                    ? 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : isFlipped
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700 dark:border-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                      : 'border-slate-200 bg-white text-transparent dark:border-slate-700 dark:bg-slate-900'
              }`}
            >
              {isFlipped ? <span className="line-clamp-3">{card.text}</span> : <Icon name="grid" className="h-5 w-5 text-slate-300 dark:text-slate-700" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
