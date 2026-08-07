import type { StudyLogEntry, Word } from '../types';
import { addDays, todayIso } from './srs';

export function getTodayEntry(log: StudyLogEntry[]): StudyLogEntry | undefined {
  return log.find((l) => l.date === todayIso());
}

export function computeStreak(log: StudyLogEntry[]): number {
  const studiedDates = new Set(log.filter((l) => l.studiedCount > 0).map((l) => l.date));
  if (studiedDates.size === 0) return 0;

  let streak = 0;
  let cursor = todayIso();

  if (!studiedDates.has(cursor)) {
    // allow streak to still count if yesterday was studied but today not yet
    const yesterday = addDays(cursor, -1);
    if (!studiedDates.has(yesterday)) return 0;
    cursor = yesterday;
  }

  while (studiedDates.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Returns the last `n` days (oldest first, today last) with log data filled in for missing days. */
export function lastNDays(log: StudyLogEntry[], n: number): StudyLogEntry[] {
  const byDate = new Map(log.map((l) => [l.date, l]));
  const today = todayIso();
  const days: StudyLogEntry[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = addDays(today, -i);
    days.push(byDate.get(date) ?? { date, studiedCount: 0, correctCount: 0, wrongCount: 0 });
  }
  return days;
}

export function overallAccuracy(log: StudyLogEntry[]): number {
  const totalCorrect = log.reduce((sum, l) => sum + l.correctCount, 0);
  const totalWrong = log.reduce((sum, l) => sum + l.wrongCount, 0);
  const total = totalCorrect + totalWrong;
  return total === 0 ? 0 : Math.round((totalCorrect / total) * 100);
}

/** A word counts as mastered once it has a solid consecutive streak and a review interval of 3+ weeks. */
export function isMastered(word: Word): boolean {
  return word.srs.repetitions >= 3 && word.srs.interval >= 21;
}

export interface CategoryMastery {
  category: string;
  total: number;
  mastered: number;
  pct: number;
}

export function categoryMastery(words: Word[]): CategoryMastery[] {
  const map = new Map<string, Word[]>();
  for (const w of words) {
    const key = w.category.trim() || '미분류';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(w);
  }
  return Array.from(map.entries())
    .map(([category, list]) => {
      const mastered = list.filter(isMastered).length;
      return { category, total: list.length, mastered, pct: list.length ? Math.round((mastered / list.length) * 100) : 0 };
    })
    .sort((a, b) => b.total - a.total);
}

export interface DifficultyDistribution {
  easy: number;
  medium: number;
  hard: number;
  total: number;
}

export function difficultyDistribution(words: Word[]): DifficultyDistribution {
  const dist = { easy: 0, medium: 0, hard: 0, total: words.length };
  for (const w of words) dist[w.difficulty]++;
  return dist;
}

export interface WeakWord {
  word: Word;
  attempts: number;
  wrongRate: number;
}

/** Top N words by wrong rate, among words that have been reviewed at least once. */
export function weakWords(words: Word[], topN: number): WeakWord[] {
  return words
    .map((word) => {
      const attempts = word.srs.correctCount + word.srs.wrongCount;
      return { word, attempts, wrongRate: attempts > 0 ? word.srs.wrongCount / attempts : 0 };
    })
    .filter((w) => w.attempts > 0 && w.wrongRate > 0)
    .sort((a, b) => b.wrongRate - a.wrongRate || b.attempts - a.attempts)
    .slice(0, topN);
}

export interface ReviewForecastDay {
  date: string;
  count: number;
}

export interface ReviewForecast {
  todayCount: number;
  weekCount: number;
  perDay: ReviewForecastDay[];
}

/**
 * Counts words due on each of the next 7 days (today + 6 more), based on current SRS due dates.
 * Anything already overdue rolls into today's bucket.
 */
export function reviewForecast(words: Word[]): ReviewForecast {
  const today = todayIso();
  const perDay: ReviewForecastDay[] = [];
  const indexByDate = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const date = addDays(today, i);
    indexByDate.set(date, i);
    perDay.push({ date, count: 0 });
  }

  let weekCount = 0;
  for (const w of words) {
    const due = w.srs.dueDate;
    if (due <= today) {
      perDay[0].count++;
      weekCount++;
      continue;
    }
    const idx = indexByDate.get(due);
    if (idx !== undefined) {
      perDay[idx].count++;
      weekCount++;
    }
  }

  return { todayCount: perDay[0].count, weekCount, perDay };
}
