import type { StudyLogEntry } from '../types';
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

export function last7Days(log: StudyLogEntry[]): StudyLogEntry[] {
  const days: StudyLogEntry[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = addDays(todayIso(), -i);
    const found = log.find((l) => l.date === date);
    days.push(found ?? { date, studiedCount: 0, correctCount: 0, wrongCount: 0 });
  }
  return days;
}

export function overallAccuracy(log: StudyLogEntry[]): number {
  const totalCorrect = log.reduce((sum, l) => sum + l.correctCount, 0);
  const totalWrong = log.reduce((sum, l) => sum + l.wrongCount, 0);
  const total = totalCorrect + totalWrong;
  return total === 0 ? 0 : Math.round((totalCorrect / total) * 100);
}
