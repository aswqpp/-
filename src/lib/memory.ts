import type { Word } from '../types';
import { modelRetention, type DeckModel } from './halflife';
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

/**
 * Default recall below which a word is treated as at risk of being forgotten.
 * The learner can move it — or switch the group off — in settings.
 */
export const AT_RISK_BELOW = 0.8;

export function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + 'T00:00:00').getTime();
  const to = new Date(toIso + 'T00:00:00').getTime();
  return Math.round((to - from) / 86400000);
}

/**
 * Estimated probability of recalling this word right now, 0–1.
 * Null for a word that has never been reviewed — there is no curve to sit on yet.
 *
 * The fitted half-life is used when the deck model has one for this word: it is
 * measured from that word's own gaps rather than inferred from the scheduler's
 * interval, and in simulation it roughly halved the error (mean absolute error
 * 0.083 against 0.160). The interval-derived curve stays as the fallback for words
 * the model has nothing to say about.
 */
export function predictedRetention(word: Word, today: string = todayIso(), model?: DeckModel): number | null {
  if (model) {
    const fromModel = modelRetention(word, model);
    if (fromModel !== null) return fromModel;
  }

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
export function reviewUrgency(word: Word, today: string = todayIso(), model?: DeckModel): number {
  const r = predictedRetention(word, today, model);
  return r == null ? 1 : 1 - r;
}

export function isAtRisk(
  word: Word,
  today: string = todayIso(),
  model?: DeckModel,
  threshold: number = AT_RISK_BELOW
): boolean {
  if (threshold <= 0) return false; // the group is switched off
  const r = predictedRetention(word, today, model);
  return r != null && r < threshold;
}

/** Most-faded first. */
export function orderByUrgency(words: Word[], today: string = todayIso(), model?: DeckModel): Word[] {
  return [...words].sort((a, b) => reviewUrgency(b, today, model) - reviewUrgency(a, today, model));
}

/**
 * Picks `count` words at random, but biased toward the ones that have gone longest
 * without a review. The floor keeps freshly-reviewed words in the running — a pure
 * urgency ranking would show the same handful of stale words over and over.
 */
export function weightedSample(words: Word[], count: number, today: string = todayIso(), model?: DeckModel): Word[] {
  const pool = words.map((word) => ({ word, weight: 0.25 + reviewUrgency(word, today, model) }));
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
  atRisk: `마지막 복습 이후 시간이 지나 예상 기억률이 설정한 기준 아래로 떨어진 단어`,
};

/** The at-risk line, spelled out with the learner's own threshold. */
export function atRiskDescription(threshold: number): string {
  if (threshold <= 0) return '사용하지 않도록 설정되어 있어요';
  return `마지막 복습 이후 시간이 지나 예상 기억률이 ${Math.round(threshold * 100)}% 아래로 떨어진 단어`;
}

/**
 * Lapses before a word is called a 누수 단어 ("leech").
 *
 * A lapse is a *mature* card falling over, so these are words that had already been
 * learned and were lost again — five of those means the card itself is the problem,
 * not the schedule. Drilling it harder mostly buys more failures; what helps is
 * rewriting it (a mnemonic, a narrower meaning, splitting a homonym) or setting it
 * aside for a while. Anki uses 8 against its own lapse definition; ours only counts
 * post-upgrade collapses, so the bar sits lower.
 */
export const LEECH_LAPSES = 5;

export function isLeech(word: Word): boolean {
  return (word.srs.lapses ?? 0) >= LEECH_LAPSES;
}

export function leechWords(words: Word[]): Word[] {
  return words.filter(isLeech).sort((a, b) => (b.srs.lapses ?? 0) - (a.srs.lapses ?? 0));
}

/** How long 쉬어가기 pushes a word out. Long enough to break the failure loop. */
export const LEECH_REST_DAYS = 7;

/** A word counts as 암기 완료 once it has a solid streak and a 3-week-plus interval. */
export function isMastered(word: Word): boolean {
  return word.srs.repetitions >= 3 && word.srs.interval >= 21;
}

/**
 * Where a word sits in the pipeline. Distinct from difficulty: difficulty says how
 * often it is missed, this says how far the scheduler has pushed it out — and
 * whether the memory has since faded past the point of being reliable.
 */
export function memoryStage(
  word: Word,
  today: string = todayIso(),
  model?: DeckModel,
  threshold: number = AT_RISK_BELOW
): MemoryStage {
  const { repetitions, correctCount, wrongCount } = word.srs;
  if (correctCount + wrongCount === 0) return 'new';
  if (isAtRisk(word, today, model, threshold)) return 'atRisk';
  if (isMastered(word)) return 'mastered';
  if (repetitions >= MEMORY_REVIEWING_REPS) return 'reviewing';
  return 'learning';
}

const MEMORY_REVIEWING_REPS = 2;

export function memoryStageDistribution(
  words: Word[],
  model?: DeckModel,
  threshold: number = AT_RISK_BELOW
): Record<MemoryStage, number> {
  const today = todayIso();
  const dist: Record<MemoryStage, number> = { new: 0, learning: 0, reviewing: 0, mastered: 0, atRisk: 0 };
  for (const w of words) dist[memoryStage(w, today, model, threshold)]++;
  return dist;
}

/** Words most in danger of being lost, worst first. */
export function atRiskWords(
  words: Word[],
  topN?: number,
  model?: DeckModel,
  threshold: number = AT_RISK_BELOW
): Word[] {
  const today = todayIso();
  const risky = words.filter((w) => memoryStage(w, today, model, threshold) === 'atRisk');
  const sorted = orderByUrgency(risky, today, model);
  return topN ? sorted.slice(0, topN) : sorted;
}
