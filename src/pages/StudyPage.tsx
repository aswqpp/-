import { useEffect, useMemo, useRef, useState } from 'react';
import type { PendingReview, Word } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Button, Card, EmptyState, ProgressBar, DifficultyBadge, FavoriteStarButton, Badge } from '../components/ui';
import { Icon } from '../components/Icon';
import { difficultyVerdict, wrongRateDisplay } from '../lib/difficulty';
import { ScopePicker } from '../components/ScopePicker';
import { applyScope, EMPTY_SCOPE, type Scope } from '../lib/scope';
import { useTts } from '../hooks/useTts';
import { isLeech, LEECH_REST_DAYS, predictedRetention, weightedSample } from '../lib/memory';
import { hasModifier, isTypingTarget } from '../lib/keyboard';
import { todayIso } from '../lib/srs';
import { dueQueueFor, heldBackSummary } from '../lib/scheduling';
import { RetentionBadge } from '../components/RetentionBadge';

type Phase = 'setup' | 'active' | 'done';

export default function StudyPage({
  app,
  onOpenQuiz,
  onSessionActiveChange,
  pending,
  onConsumePending,
}: {
  app: UseAppState;
  onOpenQuiz: () => void;
  /** Lets the parent hide its tab strip while a session is in progress. */
  onSessionActiveChange?: (active: boolean) => void;
  pending?: PendingReview | null;
  onConsumePending?: () => void;
}) {
  const { words } = app.state;
  const { speak, supported } = useTts();

  const [scope, setScope] = useState<Scope>(EMPTY_SCOPE);
  const [phase, setPhase] = useState<Phase>('setup');
  const [queue, setQueue] = useState<Word[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [frontIsWord, setFrontIsWord] = useState(app.state.settings.flashcardFrontIsWord);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  /** Banner text for a handed-in session ("망각 위험군 집중 복습"), null for a normal one. */
  const [focusLabel, setFocusLabel] = useState<string | null>(null);
  /** Cards graded in this session, so 되돌리기 knows where to step back to. */
  const [graded, setGraded] = useState<{ index: number; correct: boolean }[]>([]);
  /** When the current card was put on screen — the response time recorded for it. */
  const cardShownRef = useRef(Date.now());

  const scopedWords = useMemo(() => applyScope(words, scope), [words, scope]);
  // Most-faded first, then trimmed to what today's caps still allow.
  const due = useMemo(
    () => dueQueueFor(scopedWords, words, app.state.settings, app.model),
    [scopedWords, words, app.state.settings, app.model]
  );
  const dueWords = due.queue;

  function start(list: Word[], label: string | null = null) {
    if (list.length === 0) return;
    cardShownRef.current = Date.now();
    setQueue(list);
    setIndex(0);
    setFlipped(false);
    setCorrect(0);
    setWrong(0);
    setGraded([]);
    setFocusLabel(label);
    setPhase('active');
  }

  useEffect(() => {
    onSessionActiveChange?.(phase === 'active');
  }, [phase, onSessionActiveChange]);

  useEffect(() => {
    if (!pending || pending.ids.length === 0) return;
    // Keyed off the ids so the caller's ordering (most faded first) survives.
    const byId = new Map(words.map((w) => [w.id, w]));
    const targeted = pending.ids.map((id) => byId.get(id)).filter((w): w is Word => w !== undefined);
    onConsumePending?.();
    start(targeted, pending.label);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  const activeWord = phase === 'active' ? queue[index] : undefined;
  const { autoSpeak, autoSpeakExample } = app.state.settings;

  // Reads the prompt aloud when a new card appears — but only when the prompt is the
  // English word. With the meaning on the front, speaking would hand over the answer.
  useEffect(() => {
    if (!activeWord || !supported || !autoSpeak || !frontIsWord) return;
    speak(activeWord.word);
  }, [activeWord, supported, autoSpeak, frontIsWord, speak]);

  // Once the card is flipped the answer is already visible, so anything goes.
  useEffect(() => {
    if (!flipped || !activeWord || !supported || !autoSpeak) return;
    const parts = [
      frontIsWord ? null : activeWord.word,
      autoSpeakExample && activeWord.example ? activeWord.example : null,
    ].filter((p): p is string => !!p);
    if (parts.length > 0) speak(parts.join('. '));
  }, [flipped, activeWord, supported, autoSpeak, autoSpeakExample, frontIsWord, speak]);

  function grade(know: boolean) {
    const word = queue[index];
    // Self-graded, so the elapsed time never affects the score — but it is still
    // recorded, because the study-time statistic is derived from it.
    app.gradeWord(word.id, know, {
      ms: Date.now() - cardShownRef.current,
      mode: 'flashcard',
      dir: frontIsWord ? 'w2m' : 'm2w',
    });
    if (know) setCorrect((c) => c + 1);
    else setWrong((w) => w + 1);
    setGraded((g) => [...g, { index, correct: know }]);

    const next = index + 1;
    if (next >= queue.length) {
      setPhase('done');
    } else {
      cardShownRef.current = Date.now();
      setIndex(next);
      setFlipped(false);
    }
  }

  /**
   * Takes back the last answer — the card comes up again, face turned, and its SRS
   * record goes back to what it was. One mis-tapped "안다" otherwise pushes a word
   * weeks out with no way to say so.
   */
  function undoGrade() {
    const last = graded[graded.length - 1];
    if (!last || !app.undoLastGrade()) return;
    setGraded((g) => g.slice(0, -1));
    if (last.correct) setCorrect((c) => c - 1);
    else setWrong((w) => w - 1);
    setIndex(last.index);
    setFlipped(true);
    setPhase('active');
    cardShownRef.current = Date.now();
  }

  /**
   * Sets the current word aside without grading it: the schedule moves, the memory
   * record does not. The card stays in this session's queue so the progress count
   * keeps its meaning — it just will not come back for a week.
   */
  function restCurrent() {
    const word = queue[index];
    if (!word) return;
    app.restWord(word.id, LEECH_REST_DAYS);
    const next = index + 1;
    if (next >= queue.length) {
      setPhase('done');
    } else {
      cardShownRef.current = Date.now();
      setIndex(next);
      setFlipped(false);
    }
  }

  /**
   * Keyboard control on desktop: space flips, then ← / → grade, Z takes it back.
   * Bound to the window rather than a focused element so it works without the user
   * having to click the card first.
   */
  useEffect(() => {
    if (phase !== 'active') return;
    const onKey = (e: KeyboardEvent) => {
      if (hasModifier(e) || isTypingTarget(e.target)) return;
      const key = e.key;
      if (key === ' ' || key === 'Enter') {
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (flipped && (key === 'ArrowLeft' || key === '1')) {
        e.preventDefault();
        grade(false);
      } else if (flipped && (key === 'ArrowRight' || key === '2')) {
        e.preventDefault();
        grade(true);
      } else if (key === 'z' || key === 'Z') {
        e.preventDefault();
        undoGrade();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // No dependency array on purpose: the handler closes over the card index and the
    // flip state, and rebinding one listener per render is cheaper than the bugs a
    // stale closure causes here.
  });

  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">플래시카드 학습</h1>

        {words.length === 0 ? (
          <EmptyState title="등록된 단어가 없어요" description="단어장에서 먼저 단어를 추가해주세요." />
        ) : (
          <>
            <ScopePicker words={words} scope={scope} onChange={setScope} title="학습 범위 좁히기" />

            <Card>
              <p className="text-sm text-slate-500">오늘 복습할 단어</p>
              <p className="mt-1 text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{dueWords.length}개</p>
              {heldBackSummary(due) && (
                <p className="mt-1 text-[11px] text-slate-400">
                  하루 상한에 걸린 {heldBackSummary(due)}는 내일로 미뤄뒀어요. 설정 → 학습 설정에서 조절할 수 있어요.
                </p>
              )}
              <Button className="mt-3 w-full" onClick={() => start(dueWords)} disabled={dueWords.length === 0}>
                <Icon name="cards" className="h-4 w-4" /> 오늘의 복습 시작
              </Button>
            </Card>

            <Card>
              <p className="text-sm text-slate-500">범위 내 전체 단어로 자유 학습</p>
              <p className="mt-1 text-xs text-slate-400">
                복습 예정과 상관없이 {scopedWords.length}개 단어를 학습해요. 오래 안 본 단어가 먼저 나올 확률이 높아요.
              </p>
              <Button
                variant="secondary"
                className="mt-3 w-full"
                onClick={() => start(weightedSample(scopedWords, scopedWords.length, todayIso(), app.model))}
                disabled={scopedWords.length === 0}
              >
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
        <p className="text-sm text-slate-500">{total}개 단어를 학습했어요. 정답률 {acc}%</p>
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
          <Button className="flex-1" onClick={onOpenQuiz}>
            퀴즈로 확인
          </Button>
        </div>
        {graded.length > 0 && (
          <button onClick={undoGrade} className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <Icon name="refresh" className="mr-1 inline h-3.5 w-3.5" />
            마지막 채점 되돌리기
          </button>
        )}
      </div>
    );
  }

  const queuedWord = queue[index];
  const word = words.find((w) => w.id === queuedWord.id) ?? queuedWord;
  const verdict = difficultyVerdict(word, app.model);
  const frontText = frontIsWord ? word.word : word.meaning;
  const backText = frontIsWord ? word.meaning : word.word;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setPhase('setup')} className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <Icon name="chevron-left" className="h-4 w-4" /> 종료
        </button>
        <div className="flex items-center gap-3">
          {graded.length > 0 && (
            <button
              onClick={undoGrade}
              className="flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <Icon name="refresh" className="h-3.5 w-3.5" /> 되돌리기
            </button>
          )}
          <p className="text-sm font-semibold text-slate-500">
            {index + 1} / {queue.length} 완료
          </p>
        </div>
      </div>
      <ProgressBar value={index} max={queue.length} />

      {focusLabel && (
        <div className="flex justify-center">
          <Badge tone="rose">{focusLabel}</Badge>
        </div>
      )}

      <div className="flex items-center justify-center gap-2">
        <FavoriteStarButton active={word.favorite} onToggle={() => app.updateWord(word.id, { favorite: !word.favorite })} className="h-5 w-5" />
        <DifficultyBadge
          value={verdict.level}
          wrongRate={wrongRateDisplay(word.srs)}
          provisional={verdict.provisional}
          confidence={verdict.confidence}
          halfLifeDays={verdict.halfLifeDays}
        />
        <RetentionBadge value={predictedRetention(word, todayIso(), app.model)} />
      </div>

      {isLeech(word) && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-300">
          <span className="font-bold">누수 단어</span> — 외웠다가 다시 무너진 게 {word.srs.lapses}번이에요. 더 자주
          묻는 것보다, 이 단어를 다르게 적어두는 편이 잘 들어요.
          <span className="mt-1.5 flex gap-2">
            <button
              onClick={restCurrent}
              className="rounded-full border border-amber-300 px-2.5 py-1 font-semibold hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/50"
            >
              {LEECH_REST_DAYS}일 쉬어가기
            </button>
            <span className="self-center text-amber-600/80 dark:text-amber-400/80">
              (기억 상태는 그대로 두고 다음 복습만 미뤄요)
            </span>
          </span>
        </div>
      )}

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
          <div className="flip-face flip-face-back absolute inset-0 flex flex-col items-center justify-center gap-2 overflow-y-auto rounded-3xl border border-indigo-200 bg-indigo-50 p-6 text-center shadow-md dark:border-indigo-900 dark:bg-indigo-950">
            <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{backText}</span>
            {word.example && (
              <div className="mt-1 space-y-1">
                <p className="text-sm italic text-slate-500 dark:text-slate-400">"{word.example}"</p>
                {word.exampleTranslation && <p className="text-xs text-slate-400">{word.exampleTranslation}</p>}
              </div>
            )}
            {(word.synonyms?.length || word.antonyms?.length) && (
              <div className="mt-1 space-y-0.5 text-[11px]">
                {word.synonyms?.length ? (
                  <p className="text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">동의어</span> {word.synonyms.slice(0, 4).join(', ')}
                  </p>
                ) : null}
                {word.antonyms?.length ? (
                  <p className="text-slate-500 dark:text-slate-400">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">반의어</span> {word.antonyms.slice(0, 4).join(', ')}
                  </p>
                ) : null}
              </div>
            )}
            {word.note && (
              <p className="mt-1 flex items-start gap-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-left text-[11px] text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                <Icon name="note" className="mt-px h-3 w-3 shrink-0" />
                {word.note}
              </p>
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

      {/* Pointer-based devices only: a phone has no keys to press. */}
      <p className="hidden text-center text-[11px] text-slate-300 dark:text-slate-600 sm:block">
        스페이스 뒤집기 · ← 모른다 · → 안다 · Z 되돌리기
      </p>
    </div>
  );
}

