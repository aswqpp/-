import type { DifficultyLevel, Word } from '../types';
import { deriveDifficulty } from './difficulty';

/** A saved "narrow this session" selection, shared by study / quiz / games. */
export interface Scope {
  category: string;
  levels: DifficultyLevel[];
  favoritesOnly: boolean;
}

export const EMPTY_SCOPE: Scope = { category: 'all', levels: [], favoritesOnly: false };

/** Applies a scope to a word list. An empty `levels` array means "any level". */
export function applyScope(words: Word[], scope: Scope): Word[] {
  return words.filter((w) => {
    if (scope.category !== 'all' && (w.category.trim() || '미분류') !== scope.category) return false;
    if (scope.favoritesOnly && !w.favorite) return false;
    if (scope.levels.length > 0 && !scope.levels.includes(deriveDifficulty(w.srs))) return false;
    return true;
  });
}
