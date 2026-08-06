import { useMemo, useState } from 'react';
import type { Word } from '../../types';
import type { UseAppState } from '../../hooks/useAppState';
import { Button, Card, ProgressBar } from '../ui';
import { Icon } from '../Icon';
import { QUALITY_CORRECT, QUALITY_INCORRECT } from '../../lib/srs';
import { pickAnagramWords, scrambleWord } from '../../lib/games';

type RoundState = 'playing' | 'correct' | 'revealed';

export default function AnagramGame({ app, pool, onExit }: { app: UseAppState; pool: Word[]; onExit: () => void }) {
  const [rounds] = useState<Word[]>(() => pickAnagramWords(pool, 8));
  const [index, setIndex] = useState(0);
  const [scrambled, setScrambled] = useState(() => scrambleWord(rounds[0]?.word ?? ''));
  const [input, setInput] = useState('');
  const [roundState, setRoundState] = useState<RoundState>('playing');
  const [score, setScore] = useState(0);
  const [misses, setMisses] = useState(0);

  const word = rounds[index];
  const done = index >= rounds.length;

  const finalSummary = useMemo(() => ({ score, misses, total: rounds.length }), [score, misses, rounds.length]);

  function checkAnswer() {
    if (roundState !== 'playing') return;
    if (input.trim().toLowerCase() === word.word.toLowerCase()) {
      app.gradeWord(word.id, QUALITY_CORRECT);
      setScore((s) => s + 1);
      setRoundState('correct');
    } else {
      setMisses((m) => m + 1);
    }
  }

  function reveal() {
    if (roundState !== 'playing') return;
    app.gradeWord(word.id, QUALITY_INCORRECT);
    setMisses((m) => m + 1);
    setRoundState('revealed');
  }

  function nextRound() {
    const next = index + 1;
    setIndex(next);
    setInput('');
    setRoundState('playing');
    if (rounds[next]) setScrambled(scrambleWord(rounds[next].word));
  }

  if (rounds.length === 0) {
    return (
      <Card>
        <p className="text-sm text-slate-500">애너그램 게임을 하기에 적합한 단어가 부족해요. 단어를 더 추가해보세요.</p>
        <Button className="mt-3" onClick={onExit}>
          돌아가기
        </Button>
      </Card>
    );
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950">
          <Icon name="game" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">애너그램 게임 완료!</h2>
        <p className="text-sm text-slate-500">
          {finalSummary.total}문제 중 {finalSummary.score}개 성공
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
        <p className="text-sm font-semibold text-slate-500">
          {index + 1} / {rounds.length} · 점수 {score}
        </p>
      </div>
      <ProgressBar value={index} max={rounds.length} />

      <Card className="flex flex-col items-center gap-4 py-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">철자를 맞춰보세요</p>
        <div className="flex flex-wrap justify-center gap-2">
          {scrambled.split('').map((ch, i) => (
            <span
              key={i}
              className="grid h-11 w-11 place-items-center rounded-xl border-2 border-indigo-200 bg-indigo-50 text-xl font-extrabold uppercase text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
            >
              {ch}
            </span>
          ))}
        </div>
        <p className="text-sm text-slate-400">힌트: {word.meaning}</p>

        <div className="w-full max-w-xs">
          <input
            className="input text-center text-lg"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
            placeholder="정답 입력"
            disabled={roundState !== 'playing'}
            autoFocus
          />
        </div>

        {roundState === 'playing' && (
          <div className="flex w-full max-w-xs gap-2">
            <Button variant="secondary" className="flex-1" onClick={reveal}>
              포기
            </Button>
            <Button className="flex-1" onClick={checkAnswer} disabled={!input.trim()}>
              확인
            </Button>
          </div>
        )}

        {roundState === 'correct' && (
          <div className="flex flex-col items-center gap-2 animate-pop-in">
            <p className="font-semibold text-emerald-500">정답이에요! 🎉</p>
            <Button onClick={nextRound}>다음 문제</Button>
          </div>
        )}

        {roundState === 'revealed' && (
          <div className="flex flex-col items-center gap-2 animate-pop-in">
            <p className="text-sm text-slate-500">
              정답은 <span className="font-bold text-slate-700 dark:text-slate-200">{word.word}</span> 이었어요
            </p>
            <Button onClick={nextRound}>다음 문제</Button>
          </div>
        )}
      </Card>
    </div>
  );
}
