import { useMemo, useState } from 'react';
import type { DifficultyLevel, Word } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import {
  Button,
  Card,
  EmptyState,
  Badge,
  DifficultyBadge,
  FavoriteStarButton,
  FilterChip,
} from '../components/ui';
import { DIFFICULTY_LONG_LABEL, DIFFICULTY_ORDER, deriveDifficulty, wrongRateDisplay } from '../lib/difficulty';
import { Icon } from '../components/Icon';
import { WordFormModal, type WordFormData } from '../components/WordFormModal';
import { BulkImportModal } from '../components/BulkImportModal';
import { useTts } from '../hooks/useTts';
import { isDue } from '../lib/srs';

const UNCATEGORIZED = '미분류';
const ALL = '__all__';

export default function WordsPage({ app }: { app: UseAppState }) {
  const { words } = app.state;
  const { speak, supported } = useTts();
  const [search, setSearch] = useState('');
  const [examType, setExamType] = useState('all');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [dueOnly, setDueOnly] = useState(false);
  const [difficulties, setDifficulties] = useState<DifficultyLevel[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Word | null>(null);
  const [importOpen, setImportOpen] = useState(false);

  const folders = useMemo(() => {
    const map = new Map<string, Word[]>();
    for (const w of words) {
      const key = w.category.trim() || UNCATEGORIZED;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(w);
    }
    return Array.from(map.entries())
      .map(([name, list]) => ({ name, count: list.length }))
      .sort((a, b) => a.name.localeCompare(b.name, 'ko'));
  }, [words]);

  const examTypes = useMemo(() => Array.from(new Set(words.map((w) => w.examType))).sort(), [words]);

  const searching = search.trim() !== '';
  const scope: string | null = searching ? null : selectedFolder;

  /** Words in the current folder/search scope, before the chip filters are applied. */
  const scoped = useMemo(() => {
    return words.filter((w) => {
      if (scope !== null && scope !== ALL) {
        const key = w.category.trim() || UNCATEGORIZED;
        if (key !== scope) return false;
      }
      if (searching) {
        const q = search.trim().toLowerCase();
        if (!w.word.toLowerCase().includes(q) && !w.meaning.includes(q)) return false;
      }
      return true;
    });
  }, [words, scope, search, searching]);

  const filtered = useMemo(() => {
    return scoped.filter((w) => {
      if (examType !== 'all' && w.examType !== examType) return false;
      if (favoritesOnly && !w.favorite) return false;
      if (dueOnly && !isDue(w)) return false;
      if (difficulties.length > 0 && !difficulties.includes(deriveDifficulty(w.srs))) return false;
      return true;
    });
  }, [scoped, examType, favoritesOnly, dueOnly, difficulties]);

  // Counts shown on the chips reflect the current scope, so they stay meaningful inside a folder.
  const scopedCounts = useMemo(() => {
    const byDifficulty: Record<DifficultyLevel, number> = { unrated: 0, easy: 0, medium: 0, hard: 0 };
    let due = 0;
    let favorite = 0;
    for (const w of scoped) {
      byDifficulty[deriveDifficulty(w.srs)]++;
      if (isDue(w)) due++;
      if (w.favorite) favorite++;
    }
    return { byDifficulty, due, favorite };
  }, [scoped]);

  const filtersActive = favoritesOnly || dueOnly || difficulties.length > 0 || examType !== 'all';

  function toggleDifficulty(d: DifficultyLevel) {
    setDifficulties((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  }

  function resetFilters() {
    setFavoritesOnly(false);
    setDueOnly(false);
    setDifficulties([]);
    setExamType('all');
  }

  const showingFolders = !searching && selectedFolder === null;

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(w: Word) {
    setEditing(w);
    setModalOpen(true);
  }
  function handleSave(entries: WordFormData[]) {
    if (editing) {
      app.updateWord(editing.id, entries[0]);
    } else {
      for (const entry of entries) app.addWord(entry);
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
        placeholder="단어 또는 뜻 검색... (전체 단어장에서 검색돼요)"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {showingFolders ? (
        <>
          {words.length === 0 ? (
            <EmptyState
              title="아직 등록된 단어가 없어요"
              description="새 단어를 추가하거나 파일로 가져와보세요."
              action={
                <Button onClick={openAdd}>
                  <Icon name="plus" className="h-4 w-4" /> 단어 추가하기
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setSelectedFolder(ALL)}
                className="flex flex-col items-start gap-2 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-left transition hover:border-indigo-300 dark:border-indigo-800 dark:bg-indigo-950"
              >
                <Icon name="grid" className="h-6 w-6 text-indigo-500" />
                <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">전체 단어</span>
                <span className="text-xs text-indigo-400">{words.length}개</span>
              </button>
              {folders.map((f) => (
                <button
                  key={f.name}
                  onClick={() => setSelectedFolder(f.name)}
                  className="flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-indigo-300 dark:border-slate-800 dark:bg-slate-900"
                >
                  <Icon name="folder" className="h-6 w-6 text-slate-400" />
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{f.name}</span>
                  <span className="text-xs text-slate-400">{f.count}개</span>
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            {!searching && (
              <button
                onClick={() => setSelectedFolder(null)}
                className="flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-indigo-600 dark:text-slate-400"
              >
                <Icon name="chevron-left" className="h-4 w-4" /> 폴더로
              </button>
            )}
            <h2 className="text-sm font-bold text-slate-600 dark:text-slate-300">
              {searching ? `"${search}" 검색 결과` : selectedFolder === ALL ? '전체 단어' : selectedFolder}
              <span className="ml-1 font-normal text-slate-400">({filtered.length})</span>
            </h2>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <select className="input w-auto shrink-0" value={examType} onChange={(e) => setExamType(e.target.value)}>
                <option value="all">전체 시험 종류</option>
                {examTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {filtersActive && (
                <button
                  onClick={resetFilters}
                  className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
                >
                  <Icon name="refresh" className="h-3.5 w-3.5" /> 필터 초기화
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <FilterChip active={dueOnly} onToggle={() => setDueOnly((v) => !v)} tone="rose" count={scopedCounts.due}>
                복습 필요
              </FilterChip>
              <FilterChip active={favoritesOnly} onToggle={() => setFavoritesOnly((v) => !v)} tone="amber" count={scopedCounts.favorite}>
                <Icon name="star" className="h-3.5 w-3.5" fill={favoritesOnly ? 'currentColor' : 'none'} />
                즐겨찾기
              </FilterChip>
              {DIFFICULTY_ORDER.map((d) => (
                <FilterChip
                  key={d}
                  active={difficulties.includes(d)}
                  onToggle={() => toggleDifficulty(d)}
                  tone={d === 'unrated' ? 'slate' : d === 'easy' ? 'green' : d === 'medium' ? 'amber' : 'rose'}
                  count={scopedCounts.byDifficulty[d]}
                >
                  {DIFFICULTY_LONG_LABEL[d]}
                </FilterChip>
              ))}
            </div>
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
                        <FavoriteStarButton
                          active={w.favorite}
                          onToggle={() => app.updateWord(w.id, { favorite: !w.favorite })}
                          className="h-4 w-4"
                        />
                        <span className="font-bold text-slate-800 dark:text-slate-100">{w.word}</span>
                        {w.partOfSpeech && <Badge tone="indigo">{w.partOfSpeech}</Badge>}
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
                      {(w.synonyms?.length || w.antonyms?.length) && (
                        <p className="mt-1 text-[11px] text-slate-400">
                          {w.synonyms?.length ? <span className="text-emerald-600 dark:text-emerald-400">동의 </span> : null}
                          {w.synonyms?.slice(0, 3).join(', ')}
                          {w.synonyms?.length && w.antonyms?.length ? ' · ' : ''}
                          {w.antonyms?.length ? <span className="text-rose-600 dark:text-rose-400">반의 </span> : null}
                          {w.antonyms?.slice(0, 3).join(', ')}
                        </p>
                      )}
                      {w.note && (
                        <p className="mt-1 flex items-start gap-1 text-[11px] text-amber-600 dark:text-amber-400">
                          <Icon name="note" className="mt-px h-3 w-3 shrink-0" />
                          {w.note}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <DifficultyBadge value={deriveDifficulty(w.srs)} wrongRate={wrongRateDisplay(w.srs)} />
                        <Badge tone="indigo">{w.category || UNCATEGORIZED}</Badge>
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
        </>
      )}

      {modalOpen && (
        <WordFormModal
          initial={editing}
          defaultCategory={
            !editing && selectedFolder && selectedFolder !== ALL && selectedFolder !== UNCATEGORIZED
              ? selectedFolder
              : undefined
          }
          knownCategories={folders.map((f) => f.name).filter((n) => n !== UNCATEGORIZED)}
          onClose={() => setModalOpen(false)}
          onSave={handleSave}
        />
      )}
      {importOpen && <BulkImportModal app={app} onClose={() => setImportOpen(false)} />}
    </div>
  );
}
