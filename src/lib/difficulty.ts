import type { DifficultyLevel, SrsData } from '../types';

/** Display order: unknown first, then easiest → hardest. */
export const DIFFICULTY_ORDER: DifficultyLevel[] = ['unrated', 'easy', 'medium', 'hard'];

/** Compact label for the chip on a word. */
export const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  unrated: '-',
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

/** Spelled-out label for filters, legends and selects, where "-" alone would be cryptic. */
export const DIFFICULTY_LONG_LABEL: Record<DifficultyLevel, string> = {
  unrated: '미평가',
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

export const HARD_AT = 0.55;
export const EASY_AT = 0.3;

/**
 * Laplace-smoothed wrong rate — (wrong + 1) / (attempts + 2).
 *
 * A raw wrong/attempts reads 100% after a single slip, which would fling a word
 * to 어려움 and back again on the next answer. Smoothing pulls low-evidence words
 * toward the middle so the level settles as real evidence accumulates.
 */
export function wrongRateSmoothed(srs: SrsData): number {
  const attempts = srs.correctCount + srs.wrongCount;
  return (srs.wrongCount + 1) / (attempts + 2);
}

/**
 * A word with no attempts is `unrated`, not `medium` — the app genuinely does not
 * know yet, and saying "보통" would be inventing evidence.
 */
export function deriveDifficulty(srs: SrsData): DifficultyLevel {
  if (srs.correctCount + srs.wrongCount === 0) return 'unrated';
  const rate = wrongRateSmoothed(srs);
  if (rate >= HARD_AT) return 'hard';
  if (rate <= EASY_AT) return 'easy';
  return 'medium';
}

/** Raw wrong rate for display; null when the word has never been attempted. */
export function wrongRateDisplay(srs: SrsData): number | null {
  const attempts = srs.correctCount + srs.wrongCount;
  return attempts === 0 ? null : srs.wrongCount / attempts;
}
