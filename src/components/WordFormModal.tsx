import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Difficulty, ExamType, Word } from '../types';
import { Button, Badge } from './ui';
import { Icon } from './Icon';
import { lookupWord, posLabel, type DictionaryVariant } from '../lib/dictionaryApi';
import { suggestEnglishWord, suggestKoreanMeanings } from '../lib/translateApi';

const EXAM_TYPES: ExamType[] = ['TOEIC', 'TOEFL', '수능', '공무원', '일상회화', '기타'];
const LOOKUP_TIMEOUT_MS = 8000;

export interface WordFormData {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  category: string;
  difficulty: Difficulty;
  examType: ExamType;
  favorite: boolean;
}

const emptyForm: WordFormData = {
  word: '',
  phonetic: '',
  partOfSpeech: '',
  meaning: '',
  example: '',
  exampleTranslation: '',
  category: '',
  difficulty: 'medium',
  examType: '기타',
  favorite: false,
};

type LookupStatus = 'idle' | 'loading' | 'error' | 'done';

export function WordFormModal({
  initial,
  defaultCategory,
  onClose,
  onSave,
}: {
  initial?: Word | null;
  defaultCategory?: string;
  onClose: () => void;
  onSave: (entries: WordFormData[]) => void;
}) {
  const [form, setForm] = useState<WordFormData>(
    initial
      ? {
          word: initial.word,
          phonetic: initial.phonetic,
          partOfSpeech: initial.partOfSpeech ?? '',
          meaning: initial.meaning,
          example: initial.example,
          exampleTranslation: initial.exampleTranslation ?? '',
          category: initial.category,
          difficulty: initial.difficulty,
          examType: initial.examType,
          favorite: initial.favorite,
        }
      : { ...emptyForm, category: defaultCategory ?? '' }
  );

  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [lookupError, setLookupError] = useState('');
  const [variants, setVariants] = useState<DictionaryVariant[]>([]);
  const [meaningCandidates, setMeaningCandidates] = useState<string[][]>([]);
  const [meaningLoading, setMeaningLoading] = useState<boolean[]>([]);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [splitByPos, setSplitByPos] = useState(false);
  const [splitMeanings, setSplitMeanings] = useState<string[]>([]);

  const [reverseLoading, setReverseLoading] = useState(false);
  const [reverseSuggestion, setReverseSuggestion] = useState<string | null>(null);

  const mountedRef = useRef(true);
  useEffect(() => {
    // Re-arm on every (re)mount — under StrictMode's dev-only phantom
    // unmount/remount, the ref itself persists, so only the cleanup
    // flipping this back to false would stick without this.
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const canSave = splitByPos
    ? form.word.trim() !== '' && variants.length > 1 && splitMeanings.some((m) => m.trim() !== '')
    : form.word.trim() !== '' && form.meaning.trim() !== '';

  function set<K extends keyof WordFormData>(key: K, value: WordFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function runForwardLookup() {
    const word = form.word.trim();
    if (!word) return;
    setLookupStatus('loading');
    setLookupError('');
    setSplitByPos(false);
    try {
      const found = await lookupWord(word, AbortSignal.timeout(LOOKUP_TIMEOUT_MS));
      if (!mountedRef.current) return;
      if (found.length === 0) {
        setLookupStatus('error');
        setLookupError('사전에서 결과를 찾지 못했어요. 직접 입력해주세요.');
        setVariants([]);
        return;
      }
      setVariants(found);
      setMeaningCandidates(found.map(() => []));
      setMeaningLoading(found.map(() => true));
      setSplitMeanings(found.map(() => ''));
      setSelectedVariant(0);
      setLookupStatus('done');

      found.forEach((variant, i) => {
        suggestKoreanMeanings(word, variant.definitions, AbortSignal.timeout(LOOKUP_TIMEOUT_MS))
          .then((candidates) => {
            if (!mountedRef.current) return;
            setMeaningCandidates((prev) => {
              const next = [...prev];
              next[i] = candidates;
              return next;
            });
          })
          .catch(() => {
            if (!mountedRef.current) return;
            setMeaningCandidates((prev) => {
              const next = [...prev];
              next[i] = [];
              return next;
            });
          })
          .finally(() => {
            if (!mountedRef.current) return;
            setMeaningLoading((prev) => {
              const next = [...prev];
              next[i] = false;
              return next;
            });
          });
      });
    } catch {
      if (!mountedRef.current) return;
      setLookupStatus('error');
      setLookupError('사전 조회 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    }
  }

  async function runReverseLookup() {
    const meaning = form.meaning.trim();
    if (!meaning) return;
    setReverseLoading(true);
    setReverseSuggestion(null);
    try {
      const suggestion = await suggestEnglishWord(meaning, AbortSignal.timeout(LOOKUP_TIMEOUT_MS));
      if (!mountedRef.current) return;
      if (suggestion) setReverseSuggestion(suggestion);
    } catch {
      // best-effort suggestion; silently ignore failures
    } finally {
      if (mountedRef.current) setReverseLoading(false);
    }
  }

  function applyVariant(index: number) {
    const v = variants[index];
    setSelectedVariant(index);
    set('phonetic', v.phonetic);
    set('partOfSpeech', v.partsOfSpeech.map(posLabel).join('/'));
  }

  function setSplitMeaning(index: number, value: string) {
    setSplitMeanings((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function handleSaveClick() {
    if (!initial && splitByPos && variants.length > 1) {
      const entries: WordFormData[] = variants
        .map((v, i) => ({
          ...form,
          phonetic: v.phonetic,
          partOfSpeech: v.partsOfSpeech.map(posLabel).join('/'),
          meaning: splitMeanings[i]?.trim() || meaningCandidates[i]?.[0] || '',
        }))
        .filter((entry) => entry.meaning.trim() !== '');
      onSave(entries);
    } else {
      onSave([form]);
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="animate-slide-up max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{initial ? '단어 수정' : '새 단어 추가'}</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="단어 *">
            <div className="flex gap-2">
              <input
                className="input flex-1"
                value={form.word}
                onChange={(e) => set('word', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && runForwardLookup()}
                placeholder="예: ambitious"
                autoFocus
              />
              <button
                type="button"
                onClick={runForwardLookup}
                disabled={!form.word.trim() || lookupStatus === 'loading'}
                title="사전에서 발음기호·뜻 자동완성"
                className="shrink-0 rounded-lg border border-indigo-200 px-3 text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-40 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
              >
                {lookupStatus === 'loading' ? (
                  <Icon name="refresh" className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon name="search" className="h-4 w-4" />
                )}
              </button>
            </div>
          </Field>

          {lookupStatus === 'error' && <p className="text-xs text-rose-500">{lookupError}</p>}

          {lookupStatus === 'done' && variants.length > 0 && (
            <div className="flex flex-col gap-2 rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 dark:border-indigo-900 dark:bg-indigo-950/30">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">사전 검색 결과</p>
                {variants.length > 1 && !initial && (
                  <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={splitByPos}
                      onChange={(e) => setSplitByPos(e.target.checked)}
                      className="h-3.5 w-3.5 accent-indigo-600"
                    />
                    품사별로 별도 카드 저장
                  </label>
                )}
              </div>

              {variants.map((v, i) => (
                <div
                  key={i}
                  className={`rounded-lg border p-2.5 ${
                    !splitByPos && selectedVariant === i
                      ? 'border-indigo-400 bg-white dark:bg-slate-900'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{v.phonetic || '발음기호 없음'}</span>
                      {v.partsOfSpeech.map((pos) => (
                        <Badge key={pos} tone="indigo">
                          {posLabel(pos)}
                        </Badge>
                      ))}
                    </div>
                    {!splitByPos && (
                      <button type="button" onClick={() => applyVariant(i)} className="shrink-0 text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                        이 발음 사용
                      </button>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {meaningLoading[i] ? (
                      <span className="text-[11px] text-slate-400">뜻 번역 중...</span>
                    ) : meaningCandidates[i]?.length ? (
                      meaningCandidates[i].map((cand) => (
                        <button
                          key={cand}
                          type="button"
                          onClick={() => (splitByPos ? setSplitMeaning(i, cand) : set('meaning', cand))}
                          className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-600 transition hover:border-indigo-300 hover:text-indigo-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          {cand}
                        </button>
                      ))
                    ) : (
                      <span className="text-[11px] text-slate-400">추천 뜻 없음</span>
                    )}
                  </div>

                  {splitByPos && (
                    <input
                      className="input mt-2 text-xs"
                      placeholder="이 품사의 뜻"
                      value={splitMeanings[i] ?? ''}
                      onChange={(e) => setSplitMeaning(i, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {!splitByPos && (
            <Field label="발음기호">
              <input className="input" value={form.phonetic} onChange={(e) => set('phonetic', e.target.value)} placeholder="예: /æmˈbɪʃəs/" />
            </Field>
          )}

          {!splitByPos && (
            <Field label="뜻 *">
              <div className="flex gap-2">
                <input className="input flex-1" value={form.meaning} onChange={(e) => set('meaning', e.target.value)} placeholder="예: 야심 있는" />
                <button
                  type="button"
                  onClick={runReverseLookup}
                  disabled={!form.meaning.trim() || reverseLoading}
                  title="뜻으로 단어 후보 찾기"
                  className="shrink-0 rounded-lg border border-indigo-200 px-3 text-indigo-600 transition hover:bg-indigo-50 disabled:opacity-40 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950"
                >
                  {reverseLoading ? <Icon name="refresh" className="h-4 w-4 animate-spin" /> : <Icon name="search" className="h-4 w-4" />}
                </button>
              </div>
              {reverseSuggestion && (
                <button
                  type="button"
                  onClick={() => {
                    set('word', reverseSuggestion);
                    setReverseSuggestion(null);
                  }}
                  className="mt-1 self-start text-[11px] font-semibold text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  추천 단어 "{reverseSuggestion}" 적용하기
                </button>
              )}
            </Field>
          )}

          <Field label="예문">
            <textarea
              className="input min-h-[60px] resize-none"
              value={form.example}
              onChange={(e) => set('example', e.target.value)}
              placeholder="예: She is an ambitious young manager."
            />
          </Field>
          <Field label="예문 해석">
            <input
              className="input"
              value={form.exampleTranslation}
              onChange={(e) => set('exampleTranslation', e.target.value)}
              placeholder="예: 그녀는 야심 찬 젊은 매니저이다."
            />
          </Field>
          <Field label="카테고리">
            <input className="input" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="예: 비즈니스" />
          </Field>
          <Field label="시험 종류">
            <select className="input" value={form.examType} onChange={(e) => set('examType', e.target.value as ExamType)}>
              {EXAM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-[11px] text-slate-400">난이도와 즐겨찾기는 단어장 목록이나 학습 화면에서 바로 조정할 수 있어요.</p>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" disabled={!canSave} onClick={handleSaveClick}>
            {splitByPos && variants.length > 1 ? `${splitMeanings.filter((m) => m.trim()).length || 0}개 카드 저장` : '저장'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
      {children}
    </label>
  );
}
