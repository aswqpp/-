import type { Difficulty, SrsData } from '../types';

export const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

/**
 * Difficulty is measured, not declared: it comes from how often the learner
 * actually gets the word wrong.
 *
 * The rate is Laplace-smoothed — (wrong + 1) / (attempts + 2) — rather than raw
 * wrong/attempts, because a raw rate is 100% after a single slip and would fling
 * a word straight to 어려움 (and back again on the next try). Smoothing also gives
 * an untouched word a neutral 0.5, so "no data yet" naturally reads as 보통 with
 * no special case.
 */
export function wrongRateSmoothed(srs: SrsData): number {
  const attempts = srs.correctCount + srs.wrongCount;
  return (srs.wrongCount + 1) / (attempts + 2);
}

const HARD_AT = 0.55;
const EASY_AT = 0.3;

export function deriveDifficulty(srs: SrsData): Difficulty {
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
