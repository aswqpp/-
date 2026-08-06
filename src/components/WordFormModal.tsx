import { useState, type ReactNode } from 'react';
import type { Difficulty, ExamType, Word } from '../types';
import { Button } from './ui';
import { Icon } from './Icon';

const EXAM_TYPES: ExamType[] = ['TOEIC', 'TOEFL', '수능', '공무원', '일상회화', '기타'];
const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: '쉬움' },
  { value: 'medium', label: '보통' },
  { value: 'hard', label: '어려움' },
];

export interface WordFormData {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  category: string;
  difficulty: Difficulty;
  examType: ExamType;
}

const emptyForm: WordFormData = {
  word: '',
  phonetic: '',
  meaning: '',
  example: '',
  exampleTranslation: '',
  category: '',
  difficulty: 'medium',
  examType: '기타',
};

export function WordFormModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: Word | null;
  onClose: () => void;
  onSave: (data: WordFormData) => void;
}) {
  const [form, setForm] = useState<WordFormData>(
    initial
      ? {
          word: initial.word,
          phonetic: initial.phonetic,
          meaning: initial.meaning,
          example: initial.example,
          exampleTranslation: initial.exampleTranslation ?? '',
          category: initial.category,
          difficulty: initial.difficulty,
          examType: initial.examType,
        }
      : emptyForm
  );

  const canSave = form.word.trim() !== '' && form.meaning.trim() !== '';

  function set<K extends keyof WordFormData>(key: K, value: WordFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="animate-slide-up max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 dark:bg-slate-900 sm:rounded-2xl"
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
            <input
              className="input"
              value={form.word}
              onChange={(e) => set('word', e.target.value)}
              placeholder="예: ambitious"
              autoFocus
            />
          </Field>
          <Field label="발음기호">
            <input className="input" value={form.phonetic} onChange={(e) => set('phonetic', e.target.value)} placeholder="예: /æmˈbɪʃəs/" />
          </Field>
          <Field label="뜻 *">
            <input className="input" value={form.meaning} onChange={(e) => set('meaning', e.target.value)} placeholder="예: 야심 있는" />
          </Field>
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
          <div className="grid grid-cols-2 gap-3">
            <Field label="난이도">
              <select className="input" value={form.difficulty} onChange={(e) => set('difficulty', e.target.value as Difficulty)}>
                {DIFFICULTIES.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
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
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            취소
          </Button>
          <Button className="flex-1" disabled={!canSave} onClick={() => onSave(form)}>
            저장
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
