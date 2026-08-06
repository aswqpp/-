import type { SrsData, Word } from '../types';

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function createInitialSrs(): SrsData {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
    dueDate: todayIso(),
    correctCount: 0,
    wrongCount: 0,
    lastReviewed: null,
  };
}

/**
 * quality: 0-5 like SM-2, but we mainly use two buckets:
 *  - correct: quality 4
 *  - incorrect: quality 1
 * Games/quizzes can pass finer-grained quality.
 */
export function reviewWord(srs: SrsData, quality: number): SrsData {
  const today = todayIso();
  let { easeFactor, interval, repetitions } = srs;

  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) interval = 1;
    else if (repetitions === 2) interval = 6;
    else interval = Math.round(interval * easeFactor);
  }

  easeFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  return {
    easeFactor,
    interval,
    repetitions,
    dueDate: addDays(today, interval),
    correctCount: srs.correctCount + (quality >= 3 ? 1 : 0),
    wrongCount: srs.wrongCount + (quality < 3 ? 1 : 0),
    lastReviewed: today,
  };
}

export const QUALITY_CORRECT = 4;
export const QUALITY_INCORRECT = 1;
export const QUALITY_HARD_CORRECT = 3;

export function isDue(word: Word, onDate: string = todayIso()): boolean {
  return word.srs.dueDate <= onDate;
}

export function getDueWords(words: Word[], limit?: number): Word[] {
  const due = words.filter((w) => isDue(w));
  due.sort((a, b) => a.srs.dueDate.localeCompare(b.srs.dueDate));
  return limit ? due.slice(0, limit) : due;
}

/** Raises review priority by making a word due immediately (used when games get it wrong). */
export function bumpPriority(srs: SrsData): SrsData {
  return {
    ...srs,
    dueDate: todayIso(),
    repetitions: Math.max(0, srs.repetitions - 1),
  };
}
