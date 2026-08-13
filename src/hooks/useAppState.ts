import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, AppState, Word } from '../types';
import { loadState, saveState } from '../lib/storage';
import { mergeWords } from '../lib/backup';
import { buildInitialState, genId } from '../data/initialState';
import { createInitialSrs, reviewWord, withDerivedLog, type ReviewOptions } from '../lib/srs';
import { EMPTY_MODEL, fitDeck, type DeckModel } from '../lib/halflife';

/** One attempt to record, as handed in by a game finishing several words at once. */
export interface GradeInput {
  id: string;
  correct: boolean;
  opts: ReviewOptions;
}

export function useAppState() {
  const [state, setState] = useState<AppState>(() => loadState() ?? buildInitialState());
  const [storageError, setStorageError] = useState<string | null>(null);

  // Writes on every change, including the very first render: a load that ran the
  // v1 → v4 migration has to be persisted right away, or the migration (and its
  // log cutoff) is recomputed from scratch on each reload until something is saved.
  useEffect(() => {
    const outcome = saveState(state);
    setStorageError(outcome.ok ? null : (outcome.error ?? null));
  }, [state]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.darkMode);
  }, [state.settings.darkMode]);

  /**
   * Half-life fit over the whole deck.
   *
   * Deliberately off the critical path. Words change on every graded answer, and on a
   * large deck the fit takes long enough to be felt as lag on the tap that triggered
   * it. So the previous model stays on screen and a refit is scheduled once the
   * browser is idle — difficulty labels are in no hurry, and the debounce also
   * collapses the burst of updates a game produces when it grades a whole board.
   */
  const [model, setModel] = useState<DeckModel>(EMPTY_MODEL);

  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (!cancelled) setModel(fitDeck(state.words));
    };

    const idle = window.requestIdleCallback;
    let idleHandle: number | undefined;
    const timer = window.setTimeout(() => {
      if (idle) idleHandle = idle(run, { timeout: 3000 });
      else run();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      if (idleHandle !== undefined) window.cancelIdleCallback?.(idleHandle);
    };
  }, [state.words]);

  /**
   * Applies a change that touches `words`, then rebuilds the derived study log.
   * Every write to `words` goes through here so `log` can never drift out of sync.
   */
  const updateWords = useCallback((fn: (s: AppState) => AppState) => {
    setState((s) => withDerivedLog(fn(s)));
  }, []);

  const toggleDarkMode = useCallback(() => {
    setState((s) => ({ ...s, settings: { ...s.settings, darkMode: !s.settings.darkMode } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  /** Replaces everything with a restored backup. */
  const replaceState = useCallback(
    (next: AppState) => {
      updateWords(() => next);
    },
    [updateWords]
  );

  /**
   * Adds only the words a backup has that this device doesn't, leaving current progress intact.
   * Computed from the current snapshot rather than inside the setState updater, so the caller
   * gets real counts back synchronously.
   */
  const mergeFromBackup = useCallback(
    (incoming: AppState) => {
      const merged = mergeWords(state.words, incoming.words);
      updateWords((s) => ({ ...s, words: merged.words }));
      return { added: merged.added, skipped: merged.skipped };
    },
    [state.words, updateWords]
  );

  const addWord = useCallback(
    (data: Omit<Word, 'id' | 'createdAt' | 'srs'>) => {
      updateWords((s) => {
        const newWord: Word = {
          ...data,
          id: genId(),
          createdAt: new Date().toISOString(),
          srs: createInitialSrs(),
        };
        return { ...s, words: [newWord, ...s.words] };
      });
    },
    [updateWords]
  );

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
        newWords.push({ ...data, id: genId(), createdAt: now, srs: createInitialSrs() });
      }

      if (newWords.length > 0) {
        updateWords((s) => ({ ...s, words: [...newWords, ...s.words] }));
      }

      return { added, skippedDuplicates };
    },
    [state.words, updateWords]
  );

  const updateWord = useCallback((id: string, data: Partial<Omit<Word, 'id' | 'srs'>>) => {
    setState((s) => ({
      ...s,
      words: s.words.map((w) => (w.id === id ? { ...w, ...data } : w)),
    }));
  }, []);

  const deleteWord = useCallback(
    (id: string) => {
      updateWords((s) => ({ ...s, words: s.words.filter((w) => w.id !== id) }));
    },
    [updateWords]
  );

  /** Deletes a whole selection in one update, so the list repaints once. */
  const deleteWords = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return;
      const doomed = new Set(ids);
      updateWords((s) => ({ ...s, words: s.words.filter((w) => !doomed.has(w.id)) }));
    },
    [updateWords]
  );

  /**
   * Records one attempt. `opts.mode` decides whether the response time is graded,
   * and `opts.ms` should be passed even for modes that ignore it — the study-time
   * statistic is derived from nothing else.
   */
  const gradeWord = useCallback(
    (id: string, correct: boolean, opts: ReviewOptions) => {
      updateWords((s) => ({
        ...s,
        words: s.words.map((w) => (w.id === id ? { ...w, srs: reviewWord(w.srs, correct, opts) } : w)),
      }));
    },
    [updateWords]
  );

  /** Records several attempts as one update — games grade a whole board at once. */
  const gradeWords = useCallback(
    (entries: GradeInput[]) => {
      if (entries.length === 0) return;
      updateWords((s) => {
        const byId = new Map<string, GradeInput[]>();
        for (const e of entries) {
          const list = byId.get(e.id);
          if (list) list.push(e);
          else byId.set(e.id, [e]);
        }
        return {
          ...s,
          words: s.words.map((w) => {
            const list = byId.get(w.id);
            if (!list) return w;
            let srs = w.srs;
            for (const e of list) srs = reviewWord(srs, e.correct, e.opts);
            return { ...w, srs };
          }),
        };
      });
    },
    [updateWords]
  );

  /** Wipes every word and study log, keeping the user's settings. */
  const deleteAllWords = useCallback(() => {
    updateWords((s) => ({ ...s, words: [], legacyLog: [], migration: undefined }));
  }, [updateWords]);

  /** Full factory reset, settings included. */
  const resetAllData = useCallback(() => {
    setState(buildInitialState());
  }, []);

  return {
    state,
    model,
    storageError,
    addWord,
    addWordsBulk,
    updateWord,
    deleteWord,
    deleteWords,
    gradeWord,
    gradeWords,
    toggleDarkMode,
    updateSettings,
    replaceState,
    mergeFromBackup,
    deleteAllWords,
    resetAllData,
  };
}

export type UseAppState = ReturnType<typeof useAppState>;
