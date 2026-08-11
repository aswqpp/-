import type { Word } from '../types';
import { todayIso } from './srs';

/**
 * Forgetting-curve model.
 *
 * SM-2 picks its intervals so that recall has decayed to about 90% by the time a
 * word comes due. Reading that backwards gives a stability constant for the plain
 * exponential curve R(t) = e^(-t/S): at t = interval we want R = 0.9, so
 * S = interval / -ln(0.9). Anything past its due date keeps decaying from there,
 * which is exactly the "haven't seen this in ages" signal worth surfacing.
 */
export const TARGET_RETENTION = 0.9;
const DECAY = -Math.log(TARGET_RETENTION); // ≈ 0.1054

/** Below this predicted recall a word is treated as at risk of being forgotten. */
export const AT_RISK_BELOW = 0.8;

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + 'T00:00:00').getTime();
  const to = new Date(toIso + 'T00:00:00').getTime();
  return Math.round((to - from) / 86400000);
}

/**
 * Estimated probability of recalling this word right now, 0–1.
 * Null for a word that has never been reviewed — there is no curve to sit on yet.
 */
export function predictedRetention(word: Word, today: string = todayIso()): number | null {
  const { lastReviewed, interval } = word.srs;
  if (!lastReviewed) return null;

  const elapsed = Math.max(0, daysBetween(lastReviewed, today));
  const stability = Math.max(1, interval) / DECAY;
  return Math.exp(-elapsed / stability);
}

/**
 * How overdue a word is, 0–1. Never-reviewed words sit at the top: they are the
 * ones with no memory trace at all.
 */
export function reviewUrgency(word: Word, today: string = todayIso()): number {
  const r = predictedRetention(word, today);
  return r == null ? 1 : 1 - r;
}

export function isAtRisk(word: Word, today: string = todayIso()): boolean {
  const r = predictedRetention(word, today);
  return r != null && r < AT_RISK_BELOW;
}

/** Most-faded first. */
export function orderByUrgency(words: Word[], today: string = todayIso()): Word[] {
  return [...words].sort((a, b) => reviewUrgency(b, today) - reviewUrgency(a, today));
}

/**
 * Picks `count` words at random, but biased toward the ones that have gone longest
 * without a review. The floor keeps freshly-reviewed words in the running — a pure
 * urgency ranking would show the same handful of stale words over and over.
 */
export function weightedSample(words: Word[], count: number, today: string = todayIso()): Word[] {
  const pool = words.map((word) => ({ word, weight: 0.25 + reviewUrgency(word, today) }));
  const picked: Word[] = [];

  let total = pool.reduce((sum, p) => sum + p.weight, 0);
  const target = Math.min(count, pool.length);

  while (picked.length < target && total > 0) {
    let r = Math.random() * total;
    let idx = pool.length - 1;
    for (let i = 0; i < pool.length; i++) {
      r -= pool[i].weight;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    picked.push(pool[idx].word);
    total -= pool[idx].weight;
    pool.splice(idx, 1);
  }

  return picked;
}

export type MemoryStage = 'new' | 'learning' | 'reviewing' | 'mastered' | 'atRisk';

/** Display order: the pipeline in sequence, with the risk bucket pulled out at the end. */
export const MEMORY_STAGES: MemoryStage[] = ['new', 'learning', 'reviewing', 'mastered', 'atRisk'];

export const MEMORY_STAGE_LABEL: Record<MemoryStage, string> = {
  new: '미학습',
  learning: '학습 중',
  reviewing: '복습 중',
  mastered: '암기 완료',
  atRisk: '망각 위험군',
};

export const MEMORY_STAGE_DESC: Record<MemoryStage, string> = {
  new: '아직 한 번도 풀지 않은 단어',
  learning: '이제 막 익히기 시작한 단어',
  reviewing: '연속 정답이 쌓여 복습 주기가 늘어나는 중',
  mastered: '복습 간격이 3주 이상까지 벌어진 단어',
  atRisk: `마지막 복습 이후 시간이 지나 예상 기억률이 ${Math.round(AT_RISK_BELOW * 100)}% 아래로 떨어진 단어`,
};

/** A word counts as 암기 완료 once it has a solid streak and a 3-week-plus interval. */
export function isMastered(word: Word): boolean {
  return word.srs.repetitions >= 3 && word.srs.interval >= 21;
}

/**
 * Where a word sits in the pipeline. Distinct from difficulty: difficulty says how
 * often it is missed, this says how far the scheduler has pushed it out — and
 * whether the memory has since faded past the point of being reliable.
 */
export function memoryStage(word: Word, today: string = todayIso()): MemoryStage {
  const { repetitions, correctCount, wrongCount } = word.srs;
  if (correctCount + wrongCount === 0) return 'new';
  if (isAtRisk(word, today)) return 'atRisk';
  if (isMastered(word)) return 'mastered';
  if (repetitions >= MEMORY_REVIEWING_REPS) return 'reviewing';
  return 'learning';
}

const MEMORY_REVIEWING_REPS = 2;

export function memoryStageDistribution(words: Word[]): Record<MemoryStage, number> {
  const today = todayIso();
  const dist: Record<MemoryStage, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0, atRisk: 0 };
  for (const w of words) dist[memoryStage(w, today)]++;
  return dist;
}

/** Words most in danger of being lost, worst first. */
export function atRiskWords(words: Word[], topN?: number): Word[] {
  const today = todayIso();
  const risky = words.filter((w) => memoryStage(w, today) === 'atRisk');
  const sorted = orderByUrgency(risky, today);
  return topN ? sorted.slice(0, topN) : sorted;
}
