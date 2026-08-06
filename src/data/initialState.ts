import type { AppState, Word } from '../types';
import { seedWords } from './seedWords';
import { createInitialSrs } from '../lib/srs';

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildInitialState(): AppState {
  const words: Word[] = seedWords.map((sw) => ({
    id: genId(),
    ...sw,
    createdAt: new Date().toISOString(),
    srs: createInitialSrs(),
  }));

  return {
    words,
    log: [],
    settings: {
      darkMode: typeof window !== 'undefined'
        ? window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false
        : false,
      flashcardFrontIsWord: true,
    },
  };
}

export { genId };
