import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppSettings, AppState, Word } from '../types';
import { loadState, saveState } from '../lib/storage';
import { mergeWords } from '../lib/backup';
import { buildInitialState, genId } from '../data/initialState';
import { reviewWord, todayIso } from '../lib/srs';

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState() ?? buildInitialState());
  const isFirstRun = useRef(true);

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      if (!loadState()) saveState(state);
      return;
    }
    saveState(state);
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.darkMode);
  }, [state.settings.darkMode]);

  const toggleDarkMode = useCallback(() => {
    setState((s) => ({ ...s, settings: { ...s.settings, darkMode: !s.settings.darkMode } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  /** Replaces everything with a restored backup. */
  const replaceState = useCallback((next: AppState) => {
    setState(next);
  }, []);

  /**
   * Adds only the words a backup has that this device doesn't, leaving current progress intact.
   * Computed from the current snapshot rather than inside the setState updater, so the caller
   * gets real counts back synchronously.
   */
  const mergeFromBackup = useCallback(
    (incoming: AppState) => {
      const merged = mergeWords(state.words, incoming.words);
      setState((s) => ({ ...s, words: merged.words }));
      return { added: merged.added, skipped: merged.skipped };
    },
    [state.words]
  );

  const addWord = useCallback((data: Omit<Word, 'id' | 'createdAt' | 'srs'>) => {
    setState((s) => {
      const newWord: Word = {
        ...data,
        id: genId(),
        createdAt: new Date().toISOString(),
        srs: {
          easeFactor: 2.5,
          interval: 0,
          repetitions: 0,
          dueDate: todayIso(),
          correctCount: 0,
          wrongCount: 0,
          lastReviewed: null,
        },
      };
      return { ...s, words: [newWord, ...s.words] };
    });
  }, []);

  const addWordsBulk = useCallback(
    (rows: Omit<Word, 'id' | 'createdAt' | 'srs'>[], options: { skipDuplicates: boolean }) => {
      const existing = new Set(state.words.map((w) => w.word.trim().toLowerCase()));
      const seenInBatch = new Set<string>();
      let added = 0;
      let skippedDuplicates = 0;
      const now = new Date().toISOString();

      const newWords: Word[] = [];
      for (const data of rows) {
        const key = data.word.trim().toLowerCase();
        const isDuplicate = existing.has(key) || seenInBatch.has(key);
        if (isDuplicate && options.skipDuplicates) {
          skippedDuplicates++;
          continue;
        }
        seenInBatch.add(key);
        added++;
        newWords.push({
          ...data,
          id: genId(),
          createdAt: now,
          srs: {
            easeFactor: 2.5,
            interval: 0,
            repetitions: 0,
            dueDate: todayIso(),
            correctCount: 0,
            wrongCount: 0,
            lastReviewed: null,
          },
        });
      }

      if (newWords.length > 0) {
        setState((s) => ({ ...s, words: [...newWords, ...s.words] }));
      }

      return { added, skippedDuplicates };
    },
    [state.words]
  );

  const updateWord = useCallback((id: string, data: Partial<Omit<Word, 'id' | 'srs'>>) => {
    setState((s) => ({
      ...s,
      words: s.words.map((w) => (w.id === id ? { ...w, ...data } : w)),
    }));
  }, []);

  const deleteWord = useCallback((id: string) => {
    setState((s) => ({ ...s, words: s.words.filter((w) => w.id !== id) }));
  }, []);

  const gradeWord = useCallback((id: string, quality: number) => {
    setState((s) => ({
      ...s,
      words: s.words.map((w) => (w.id === id ? { ...w, srs: reviewWord(w.srs, quality) } : w)),
    }));
  }, []);

  const logSession = useCallback((studied: number, correct: number, wrong: number, seconds = 0) => {
    setState((s) => {
      const today = todayIso();
      const idx = s.log.findIndex((l) => l.date === today);
      const log = [...s.log];
      if (idx >= 0) {
        log[idx] = {
          ...log[idx],
          studiedCount: log[idx].studiedCount + studied,
          correctCount: log[idx].correctCount + correct,
          wrongCount: log[idx].wrongCount + wrong,
          studySeconds: log[idx].studySeconds + Math.max(0, Math.round(seconds)),
        };
      } else {
        log.push({
          date: today,
          studiedCount: studied,
          correctCount: correct,
          wrongCount: wrong,
          studySeconds: Math.max(0, Math.round(seconds)),
        });
      }
      return { ...s, log };
    });
  }, []);

  /** Wipes every word and study log, keeping the user's settings. */
  const deleteAllWords = useCallback(() => {
    setState((s) => ({ ...s, words: [], log: [] }));
  }, []);

  /** Full factory reset, settings included. */
  const resetAllData = useCallback(() => {
    setState(buildInitialState());
  }, []);

  return {
    state,
    addWord,
    addWordsBulk,
    updateWord,
    deleteWord,
    gradeWord,
    logSession,
    toggleDarkMode,
    updateSettings,
    replaceState,
    mergeFromBackup,
    deleteAllWords,
    resetAllData,
  };
}

export type UseAppState = ReturnType<typeof useAppState>;
