import type { AppSettings, Word } from '../types';
import { getDueWords, toLocalDate, todayIso } from './srs';
import { orderByUrgency } from './memory';
import type { DeckModel } from './halflife';

/**
 * Daily workload caps.
 *
 * Spaced repetition falls apart on volume, not on scheduling. Importing 500 words
 * makes all 500 due at once, and skipping that day rolls the pile into the next —
 * which is how a review queue becomes something you avoid opening. Capping the day
 * turns an unbounded backlog into a fixed, finishable amount of work; the words that
 * do not fit simply stay due and come back tomorrow, in urgency order.
 *
 * 0 means no limit.
 */
export const DEFAULT_REVIEW_CAP = 100;
export const DEFAULT_NEW_CAP = 20;

export interface DailyCaps {
  /** Cap on words that have been answered at least once before. */
  review: number;
  /** Cap on words being met for the first time. */
  new: number;
}

/** Never answered — the deck has no memory trace for it yet. */
export function isNewWord(word: Word): boolean {
  return (word.srs.correctCount ?? 0) + (word.srs.wrongCount ?? 0) === 0;
}

export interface TodayCounts {
  /** Words met for the first time today. */
  introduced: number;
  /** Words that already had a history and were answered again today. */
  reviews: number;
  total: number;
}

/**
 * What today has already used up, counted in words rather than attempts: answering
 * the same word twice in one session is one word's worth of the day's quota.
 *
 * A word counts as introduced today only if it had nothing before today — no earlier
 * history and no sealed pre-migration counters.
 */
export function countStudiedToday(words: Word[], today: string = todayIso()): TodayCounts {
  let introduced = 0;
  let reviews = 0;

  for (const w of words) {
    let todayCount = 0;
    let earlier = 0;
    for (const e of w.srs.history ?? []) {
      const date = toLocalDate(new Date(e.t));
      if (date === today) todayCount++;
      else if (date < today) earlier++;
    }
    if (todayCount === 0) continue;
    if (earlier === 0 && !w.srs.preCount) introduced++;
    else reviews++;
  }

  return { introduced, reviews, total: introduced + reviews };
}

export interface DueQueue {
  /** What to study now, in the order it was handed in. */
  queue: Word[];
  /** Due words the caps pushed to tomorrow. */
  newHeld: number;
  reviewHeld: number;
  held: number;
}

/**
 * Trims an already-ordered due list down to what is left of today's allowance.
 *
 * `allWords` is the whole vocabulary on purpose — the day's quota is spent globally,
 * so studying 50 words inside one category has to count against a session started in
 * another. `due` is expected to be scoped and sorted already (most faded first), and
 * its order is preserved.
 */
export function applyDailyCaps(
  due: Word[],
  allWords: Word[],
  caps: DailyCaps,
  today: string = todayIso()
): DueQueue {
  const done = countStudiedToday(allWords, today);
  const newAllowance = caps.new > 0 ? Math.max(0, caps.new - done.introduced) : Infinity;
  const reviewAllowance = caps.review > 0 ? Math.max(0, caps.review - done.reviews) : Infinity;

  const queue: Word[] = [];
  let newTaken = 0;
  let reviewTaken = 0;
  let newHeld = 0;
  let reviewHeld = 0;

  for (const w of due) {
    if (isNewWord(w)) {
      if (newTaken < newAllowance) {
        queue.push(w);
        newTaken++;
      } else newHeld++;
    } else if (reviewTaken < reviewAllowance) {
      queue.push(w);
      reviewTaken++;
    } else reviewHeld++;
  }

  return { queue, newHeld, reviewHeld, held: newHeld + reviewHeld };
}

export function capsFrom(settings: AppSettings): DailyCaps {
  return { review: settings.dailyReviewCap, new: settings.dailyNewCap };
}

/**
 * The whole pipeline for one screen: what is due inside `scoped`, most faded first,
 * trimmed to what today's allowance still permits.
 */
export function dueQueueFor(
  scoped: Word[],
  allWords: Word[],
  settings: AppSettings,
  model?: DeckModel,
  today: string = todayIso()
): DueQueue {
  const due = orderByUrgency(getDueWords(scoped), today, model);
  return applyDailyCaps(due, allWords, capsFrom(settings), today);
}

/** "새 단어 12개 · 복습 40개" — the held-back breakdown, or null when nothing was held. */
export function heldBackSummary(q: DueQueue): string | null {
  if (q.held === 0) return null;
  const parts: string[] = [];
  if (q.newHeld > 0) parts.push(`새 단어 ${q.newHeld}개`);
  if (q.reviewHeld > 0) parts.push(`복습 ${q.reviewHeld}개`);
  return parts.join(' · ');
}
