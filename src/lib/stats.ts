import type { DifficultyLevel, ExamType, StudyLogEntry, Word } from '../types';
import { deriveDifficulty } from './difficulty';
import { addDays, computeM, M_MIN_SAMPLE, todayIso } from './srs';

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
    days.push(byDate.get(date) ?? { date, studiedCount: 0, correctCount: 0, wrongCount: 0, studySeconds: 0 });
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

export type DifficultyDistribution = Record<DifficultyLevel, number> & { total: number };

export function difficultyDistribution(words: Word[]): DifficultyDistribution {
  const dist: DifficultyDistribution = { unrated: 0, easy: 0, medium: 0, hard: 0, total: words.length };
  for (const w of words) dist[deriveDifficulty(w.srs)]++;
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

/** Longest run of consecutive studied days anywhere in the log, not just the current one. */
export function longestStreak(log: StudyLogEntry[]): number {
  const dates = log.filter((l) => l.studiedCount > 0).map((l) => l.date).sort();
  if (dates.length === 0) return 0;

  let best = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    if (addDays(dates[i - 1], 1) === dates[i]) run++;
    else run = 1;
    if (run > best) best = run;
  }
  return best;
}

export interface StudyTotals {
  studyDays: number;
  totalStudied: number;
  totalAttempts: number;
  avgPerStudyDay: number;
  bestDayCount: number;
  bestDayDate: string | null;
  totalSeconds: number;
  avgSecondsPerStudyDay: number;
}

export function studyTotals(log: StudyLogEntry[]): StudyTotals {
  const active = log.filter((l) => l.studiedCount > 0);
  const totalStudied = active.reduce((sum, l) => sum + l.studiedCount, 0);
  const totalAttempts = log.reduce((sum, l) => sum + l.correctCount + l.wrongCount, 0);
  const best = active.reduce<StudyLogEntry | null>((acc, l) => (!acc || l.studiedCount > acc.studiedCount ? l : acc), null);

  const totalSeconds = log.reduce((sum, l) => sum + (l.studySeconds ?? 0), 0);

  return {
    studyDays: active.length,
    totalStudied,
    totalAttempts,
    avgPerStudyDay: active.length ? Math.round((totalStudied / active.length) * 10) / 10 : 0,
    bestDayCount: best?.studiedCount ?? 0,
    bestDayDate: best?.date ?? null,
    totalSeconds,
    avgSecondsPerStudyDay: active.length ? Math.round(totalSeconds / active.length) : 0,
  };
}

/** "1시간 24분" / "7분 30초" / "45초" — omits units that would read as 0. */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0분';
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const sec = totalSeconds % 60;
  if (h > 0) return m > 0 ? `${h}시간 ${m}분` : `${h}시간`;
  if (m > 0) return `${m}분`;
  return `${sec}초`;
}

export interface WeekdayStat {
  /** 0 = Sunday */
  dow: number;
  studied: number;
  days: number;
}

/** Which weekdays the learner actually studies on — reveals the real routine. */
export function weekdayPattern(log: StudyLogEntry[]): WeekdayStat[] {
  const stats: WeekdayStat[] = Array.from({ length: 7 }, (_, dow) => ({ dow, studied: 0, days: 0 }));
  for (const l of log) {
    if (l.studiedCount <= 0) continue;
    const dow = new Date(l.date + 'T00:00:00').getDay();
    stats[dow].studied += l.studiedCount;
    stats[dow].days += 1;
  }
  return stats;
}

export type MemoryStage = 'new' | 'learning' | 'reviewing' | 'mastered';

export const MEMORY_STAGE_LABEL: Record<MemoryStage, string> = {
  new: '미학습',
  learning: '학습 중',
  reviewing: '복습 중',
  mastered: '장기 기억',
};

/**
 * Where each word sits in the SM-2 pipeline. Distinct from difficulty: difficulty
 * says how often it is missed, this says how far the scheduler has pushed it out.
 */
export function memoryStage(word: Word): MemoryStage {
  const { repetitions, interval, correctCount, wrongCount } = word.srs;
  if (correctCount + wrongCount === 0) return 'new';
  if (interval >= 21 && repetitions >= 3) return 'mastered';
  if (repetitions >= 2) return 'reviewing';
  return 'learning';
}

export function memoryStageDistribution(words: Word[]): Record<MemoryStage, number> {
  const dist: Record<MemoryStage, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0 };
  for (const w of words) dist[memoryStage(w)]++;
  return dist;
}

export interface RetentionStats {
  /** Mean wrong rate across the whole deck. */
  meanWrongRate: number;
  /** True while the deck has too few attempts for the mean to mean anything. */
  isEstimate: boolean;
  /** Times a word that had already matured (2+ correct in a row) was missed again. */
  lapses: number;
  /** Words currently carrying at least one lapse. */
  lapsedWords: number;
  /** Mean response time over the attempts that recorded one, in ms. Null if none did. */
  avgResponseMs: number | null;
}

/**
 * How well the deck is actually holding. Accuracy says how often answers are right;
 * this says how often *settled* words come loose again, which is the thing worth
 * reacting to — a lapse means the schedule pushed that word out too far.
 */
export function retentionStats(words: Word[]): RetentionStats {
  let lapses = 0;
  let lapsedWords = 0;
  let attempts = 0;
  let msTotal = 0;
  let msCount = 0;

  for (const w of words) {
    lapses += w.srs.lapses;
    if (w.srs.lapses > 0) lapsedWords++;
    attempts += w.srs.correctCount + w.srs.wrongCount;
    for (const h of w.srs.history) {
      if (h.ms == null) continue;
      msTotal += h.ms;
      msCount++;
    }
  }

  return {
    meanWrongRate: computeM(words),
    isEstimate: attempts < M_MIN_SAMPLE,
    lapses,
    lapsedWords,
    avgResponseMs: msCount > 0 ? Math.round(msTotal / msCount) : null,
  };
}

export interface ExamTypeMastery {
  examType: ExamType;
  total: number;
  mastered: number;
  pct: number;
}

/**
 * Same shape as categoryMastery, but grouped by the exam each word is being studied for.
 * Categories are user-invented; exam type is a fixed axis, so "수능 80% / TOEIC 40%" is
 * comparable in a way category names are not.
 */
export function examTypeMastery(words: Word[]): ExamTypeMastery[] {
  const map = new Map<ExamType, Word[]>();
  for (const w of words) {
    if (!map.has(w.examType)) map.set(w.examType, []);
    map.get(w.examType)!.push(w);
  }
  return Array.from(map.entries())
    .map(([examType, list]) => {
      const mastered = list.filter(isMastered).length;
      return { examType, total: list.length, mastered, pct: list.length ? Math.round((mastered / list.length) * 100) : 0 };
    })
    .sort((a, b) => b.total - a.total);
}
