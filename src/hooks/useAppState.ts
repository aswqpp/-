import { useCallback, useEffect, useRef, useState } from 'react';
import type { AppState, Word } from '../types';
import { loadState, saveState } from '../lib/storage';
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

  const logSession = useCallback((studied: number, correct: number, wrong: number) => {
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
        };
      } else {
        log.push({ date: today, studiedCount: studied, correctCount: correct, wrongCount: wrong });
      }
      return { ...s, log };
    });
  }, []);

  const resetAllData = useCallback(() => {
    const fresh = buildInitialState();
    setState(fresh);
  }, []);

  return {
    state,
    addWord,
    updateWord,
    deleteWord,
    gradeWord,
    logSession,
    toggleDarkMode,
    resetAllData,
  };
}

export type UseAppState = ReturnType<typeof useAppState>;
