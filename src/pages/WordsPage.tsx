import { useMemo, useState } from 'react';
import type { Word } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Button, Card, EmptyState, Badge } from '../components/ui';
import { Icon } from '../components/Icon';
import { WordFormModal, type WordFormData } from '../components/WordFormModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { useTts } from '../hooks/useTts';
import { isDue } from '../lib/srs';

const difficultyTone: Record<Word['difficulty'], 'green' | 'amber' | 'rose'> = {
  easy: 'green',
  medium: 'amber',
  hard: 'rose',
};
const difficultyLabel: Record<Word['difficulty'], string> = { easy: '쉬움', medium: '보통', hard: '어려움' };

export default function WordsPage({ app }: { app: UseAppState }) {
  const { words } = app.state;
  const { speak, supported } = useTts();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [examType, setExamType] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const categories = useMemo(() => Array.from(new Set(words.map((w) => w.category))).sort(), [words]);
  const examTypes = useMemo(() => Array.from(new Set(words.map((w) => w.examType))).sort(), [words]);

  const filtered = useMemo(() => {
    return words.filter((w) => {
      if (category !== 'all' && w.category !== category) return false;
      if (examType !== 'all' && w.examType !== examType) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (!w.word.toLowerCase().includes(q) && !w.meaning.includes(q)) return false;
      }
      return true;
    });
  }, [words, category, examType, search]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(w: Word) {
    setEditing(w);
    setModalOpen(true);
  }
  function handleSave(data: WordFormData) {
    if (editing) {
      app.updateWord(editing.id, data);
    } else {
      app.addWord(data);
    }
    setModalOpen(false);
  }
  function handleDelete(id: string) {
    if (confirm('이 단어를 삭제할까요?')) app.deleteWord(id);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">단어장 ({words.length})</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setImportOpen(true)}>
            <Icon name="book" className="h-4 w-4" /> 파일로 가져오기
          </Button>
          <Button onClick={openAdd}>
            <Icon name="plus" className="h-4 w-4" /> 단어 추가
          </Button>
        </div>
      </div>

      <input
        className="input"
        placeholder="단어 또는 뜻 검색..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="flex gap-2 overflow-x-auto pb-1">
        <select className="input w-auto shrink-0" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">전체 카테고리</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="input w-auto shrink-0" value={examType} onChange={(e) => setExamType(e.target.value)}>
          <option value="all">전체 시험 종류</option>
          {examTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="조건에 맞는 단어가 없어요"
          description="검색어나 필터를 변경하거나 새 단어를 추가해보세요."
          action={
            <Button onClick={openAdd}>
              <Icon name="plus" className="h-4 w-4" /> 단어 추가
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((w) => (
            <Card key={w.id} padding="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-800 dark:text-slate-100">{w.word}</span>
                    {w.phonetic && <span className="text-xs text-slate-400">{w.phonetic}</span>}
                    {supported && (
                      <button
                        onClick={() => speak(w.word)}
                        aria-label="발음 듣기"
                        className="grid h-6 w-6 place-items-center rounded-full text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950"
                      >
                        <Icon name="speaker" className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{w.meaning}</p>
                  {w.example && <p className="mt-1 text-xs italic text-slate-400">"{w.example}"</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge tone={difficultyTone[w.difficulty]}>{difficultyLabel[w.difficulty]}</Badge>
                    <Badge tone="indigo">{w.category || '미분류'}</Badge>
                    <Badge>{w.examType}</Badge>
                    {isDue(w) && <Badge tone="rose">복습 필요</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => openEdit(w)}
                    aria-label="수정"
                    className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Icon name="edit" className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(w.id)}
                    aria-label="삭제"
                    className="grid h-8 w-8 place-items-center rounded-lg text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && <WordFormModal initial={editing} onClose={() => setModalOpen(false)} onSave={handleSave} />}
      {importOpen && <BulkImportModal app={app} onClose={() => setImportOpen(false)} />}
    </div>
  );
}
