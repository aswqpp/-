import { useMemo, useState, type ReactNode } from 'react';
import type { Difficulty, QuizType, Screen } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Button, Card, EmptyState, ProgressBar, Badge, DifficultyCycleBadge, FavoriteStarButton } from '../components/ui';
import { Icon } from '../components/Icon';
import { useTts } from '../hooks/useTts';
import { getDueWords, QUALITY_CORRECT, QUALITY_INCORRECT } from '../lib/srs';
import {
  buildQuiz,
  normalizeSpelling,
  shuffleArray,
  answerField,
  promptField,
  type QuizQuestion,
  type McDirection,
} from '../lib/quiz';

type Phase = 'setup' | 'active' | 'done';

const QUIZ_TYPE_LABEL: Record<QuizType, string> = {
  'multiple-choice': '객관식 암기 모드',
  spelling: '스펠링 입력',
  listening: '듣고 뜻 맞추기',
};

const OPTION_COUNTS = [3, 4, 5];

function correctAnswerFor(q: QuizQuestion): string {
  if (q.type === 'listening') return q.word.meaning;
  if (q.type === 'multiple-choice') return answerField(q.word, q.direction ?? 'word-to-meaning');
  return q.word.word;
}

function promptFor(q: QuizQuestion): string {
  return promptField(q.word, q.direction ?? 'word-to-meaning');
}

export default function QuizPage({ app, onNavigate }: { app: UseAppState; onNavigate: (s: Screen) => void }) {
  const { words } = app.state;
  const { speak, supported } = useTts();

  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState<Difficulty | 'all'>('all');
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

  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>(['multiple-choice', 'listening']);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [index, setIndex] = useState(0);
  const [spellingInput, setSpellingInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [mcDirection, setMcDirection] = useState<McDirection>('word-to-meaning');
  const [mcOptionCount, setMcOptionCount] = useState(4);

  function toggleType(t: QuizType) {
    setSelectedTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function start(pool: typeof words) {
    if (pool.length === 0 || selectedTypes.length === 0) return;
    const list = shuffleArray(pool).slice(0, Math.min(10, pool.length));
    setQuestions(buildQuiz(list, scopedWords, selectedTypes, { direction: mcDirection, optionCount: mcOptionCount }));
    setIndex(0);
    setCorrect(0);
    setWrong(0);
    setAnswered(false);
    setSelectedOption(null);
    setSpellingInput('');
    setPhase('active');
  }

  const current = questions[index];

  function submitAnswer(isCorrect: boolean) {
    if (answered) return;
    setAnswered(true);
    app.gradeWord(current.word.id, isCorrect ? QUALITY_CORRECT : QUALITY_INCORRECT);
    if (isCorrect) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
  }

  function nextQuestion() {
    const next = index + 1;
    if (next >= questions.length) {
      app.logSession(questions.length, correct, wrong);
      setPhase('done');
    } else {
      setIndex(next);
      setAnswered(false);
      setSelectedOption(null);
      setSpellingInput('');
    }
  }

  function checkSpelling() {
    if (answered) return;
    const ok = normalizeSpelling(spellingInput) === normalizeSpelling(current.word.word);
    submitAnswer(ok);
  }

  function chooseOption(opt: string) {
    if (answered) return;
    setSelectedOption(opt);
    submitAnswer(opt === correctAnswerFor(current));
  }

  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">퀴즈 모드</h1>

        {words.length < 2 ? (
          <EmptyState title="단어가 부족해요" description="퀴즈를 풀려면 최소 2개 이상의 단어가 필요해요." />
        ) : (
          <>
            <Card>
              <p className="mb-2 text-xs font-semibold text-slate-500">출제 범위 좁히기</p>
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
              <p className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-300">퀴즈 유형 선택</p>
              <div className="flex flex-col gap-2">
                {(Object.keys(QUIZ_TYPE_LABEL) as QuizType[]).map((t) => (
                  <label
                    key={t}
                    className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-800"
                  >
                    <span className="text-slate-600 dark:text-slate-300">{QUIZ_TYPE_LABEL[t]}</span>
                    <input
                      type="checkbox"
                      checked={selectedTypes.includes(t)}
                      onChange={() => toggleType(t)}
                      className="h-5 w-5 accent-indigo-600"
                    />
                  </label>
                ))}
              </div>

              {selectedTypes.includes('multiple-choice') && (
                <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">객관식 방향</p>
                    <div className="flex gap-2">
                      <PillButton active={mcDirection === 'word-to-meaning'} onClick={() => setMcDirection('word-to-meaning')}>
                        단어 → 뜻
                      </PillButton>
                      <PillButton active={mcDirection === 'meaning-to-word'} onClick={() => setMcDirection('meaning-to-word')}>
                        뜻 → 단어
                      </PillButton>
                    </div>
                  </div>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-slate-500">선택지 개수</p>
                    <div className="flex gap-2">
                      {OPTION_COUNTS.map((n) => (
                        <PillButton key={n} active={mcOptionCount === n} onClick={() => setMcOptionCount(n)}>
                          {n}개
                        </PillButton>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card>
              <p className="text-sm text-slate-500">복습 예정 단어로 퀴즈 ({dueWords.length}개)</p>
              <Button className="mt-3 w-full" onClick={() => start(dueWords)} disabled={dueWords.length === 0 || selectedTypes.length === 0}>
                <Icon name="quiz" className="h-4 w-4" /> 복습 단어로 시작
              </Button>
            </Card>
            <Card>
              <p className="text-sm text-slate-500">범위 내 무작위 출제 ({scopedWords.length}개)</p>
              <Button variant="secondary" className="mt-3 w-full" onClick={() => start(scopedWords)} disabled={scopedWords.length === 0 || selectedTypes.length === 0}>
                무작위 퀴즈 시작
              </Button>
            </Card>
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
        <div className="grid h-16 w-16 place-items-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950">
          <Icon name="quiz" className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">퀴즈 완료!</h2>
        <p className="text-sm text-slate-500">
          {total}문제 중 {correct}개 정답 ({acc}%)
        </p>
        <div className="mt-2 flex w-full max-w-xs gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setPhase('setup')}>
            다시 풀기
          </Button>
          <Button className="flex-1" onClick={() => onNavigate('games')}>
            게임 하러 가기
          </Button>
        </div>
      </div>
    );
  }

  const liveWord = words.find((w) => w.id === current.word.id) ?? current.word;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setPhase('setup')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Icon name="chevron-left" className="h-4 w-4" /> 종료
        </button>
        <p className="text-sm font-semibold text-slate-500">
          {index + 1} / {questions.length}
        </p>
      </div>
      <ProgressBar value={index} max={questions.length} />

      <Card>
        <div className="flex items-center justify-between">
          <Badge tone="indigo">{QUIZ_TYPE_LABEL[current.type]}</Badge>
          <div className="flex items-center gap-2">
            <DifficultyCycleBadge value={liveWord.difficulty} onChange={(d) => app.updateWord(liveWord.id, { difficulty: d })} />
            <FavoriteStarButton active={liveWord.favorite} onToggle={() => app.updateWord(liveWord.id, { favorite: !liveWord.favorite })} className="h-4 w-4" />
          </div>
        </div>

        {current.type === 'listening' && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              onClick={() => speak(current.word.word)}
              className="grid h-16 w-16 place-items-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500"
            >
              <Icon name="speaker" className="h-7 w-7" />
            </button>
            <p className="text-xs text-slate-400">{supported ? '버튼을 눌러 발음을 들어보세요' : '이 브라우저는 음성 재생을 지원하지 않아요'}</p>
          </div>
        )}

        {current.type === 'multiple-choice' && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-center text-2xl font-bold text-slate-800 dark:text-slate-100">{promptFor(current)}</p>
            {current.direction === 'word-to-meaning' && current.word.phonetic && (
              <p className="text-xs text-slate-400">{current.word.phonetic}</p>
            )}
            {current.direction === 'word-to-meaning' && supported && (
              <button
                onClick={() => speak(current.word.word)}
                className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400"
              >
                <Icon name="speaker" className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {current.type === 'spelling' && (
          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-center text-lg font-semibold text-slate-700 dark:text-slate-200">{current.word.meaning}</p>
            {current.word.phonetic && <p className="text-xs text-slate-400">{current.word.phonetic}</p>}
          </div>
        )}

        <div className="mt-5">
          {(current.type === 'multiple-choice' || current.type === 'listening') && current.options && (
            <div className="flex flex-col gap-2">
              {current.options.map((opt) => {
                const isCorrectOpt = opt === correctAnswerFor(current);
                const isSelected = opt === selectedOption;
                let style = 'border-slate-200 dark:border-slate-700';
                if (answered && isCorrectOpt) style = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950';
                else if (answered && isSelected && !isCorrectOpt) style = 'border-rose-400 bg-rose-50 dark:bg-rose-950';
                return (
                  <button
                    key={opt}
                    onClick={() => chooseOption(opt)}
                    disabled={answered}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-medium text-slate-700 transition dark:text-slate-200 ${style}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === 'spelling' && (
            <div className="flex flex-col gap-2">
              <input
                className="input text-center text-lg"
                placeholder="철자를 입력하세요"
                value={spellingInput}
                onChange={(e) => setSpellingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && checkSpelling()}
                disabled={answered}
                autoFocus
              />
              {!answered ? (
                <Button onClick={checkSpelling} disabled={!spellingInput.trim()}>
                  정답 확인
                </Button>
              ) : (
                <p className={`text-center text-sm font-semibold ${normalizeSpelling(spellingInput) === normalizeSpelling(current.word.word) ? 'text-emerald-500' : 'text-rose-500'}`}>
                  정답: {current.word.word}
                </p>
              )}
            </div>
          )}
        </div>

        {answered && (
          <div className="mt-4 flex flex-col items-center gap-2 animate-pop-in">
            {current.word.example && <p className="text-center text-xs italic text-slate-400">"{current.word.example}"</p>}
            <Button className="mt-1 w-full" onClick={nextQuestion}>
              {index + 1 >= questions.length ? '결과 보기' : '다음 문제'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        active
          ? 'border-indigo-500 bg-indigo-600 text-white'
          : 'border-slate-200 text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400'
      }`}
    >
      {children}
    </button>
  );
}
