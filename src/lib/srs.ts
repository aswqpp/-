import type {
  AppState,
  MigrationInfo,
  ReviewDirection,
  ReviewEvent,
  ReviewMode,
  SrsData,
  StudyLogEntry,
  Word,
} from '../types';

/**
 * SM-2 review scheduling (revision v4).
 *
 * Changes against v3
 *   1. nextInterval offset — a first correct answer used to skip the 1-day step
 *      and jump straight to 6 days
 *   2. rebuildLog boundary day — the migration day's studying vanished entirely
 *   3. ms always recorded — unused for grading in some modes, but studySeconds needs it
 *   4. CORRECT_STEP 0.05 — past correct answers are no longer back-dated as instant (q=5)
 *   5. history capped at 100 — 200 overflowed localStorage
 *   + computeM comment/code mismatch fixed, M_FALLBACK 0.30 → 0.22
 *
 * Carried over from v3
 *   toLocalDate (UTC drift fix) / EF_MAX 3.0 / per-mode limitMs / lapses maturity
 *   definition / the `dir` field on history / log derived from history with a legacy cutover
 *
 * Measured on real v1 data (2026-08-11 backup, 400 words, 907 attempts)
 *   wrong answers moved EF by -0.54 (q=1), correct ones by exactly 0 (q=4), so EF was
 *   only ever a restatement of min(wrongCount, 3) — four observed values, no exceptions.
 *   Mean wrong rate 0.176, mean response 9.70s, 82% of words had 2 attempts or fewer.
 */

export const EF_MIN = 1.3;
export const EF_MAX = 3.0;
export const EF_INIT = 2.5;

/** [fix 5] 400 words x 100 x ~85B ~= 3.4MB. 200 would be 6.8MB, past the 5MB budget. */
export const HISTORY_LIMIT = 100;

/** Standard SM-2 ease update. q: 0 (blank) … 5 (instant recall). */
export function efDelta(q: number): number {
  return 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
}
// q=0:-0.80  q=1:-0.54  q=2:-0.32  q=3:-0.14  q=4:0.00  q=5:+0.10

/* ------------------------------------------------------------------ */
/* Local dates                                                         */
/* ------------------------------------------------------------------ */

/**
 * Date → 'YYYY-MM-DD' using LOCAL calendar fields.
 *
 * `toISOString()` converts to UTC first, so mixing it with the local
 * setDate/getDate family moves the date a day back before 9am in UTC+9.
 * It reproduces intermittently, which makes it painful to find.
 */
export function toLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayIso(): string {
  return toLocalDate(new Date());
}

export function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

/* ------------------------------------------------------------------ */
/* Per-mode time limits                                                */
/* ------------------------------------------------------------------ */

/**
 * null = time-based grading off.
 *
 * The default is null on purpose: if a caller forgets to pass a mode, a stray
 * 15-second yardstick would shave EF off every flashcard "안다". It fails safe.
 */
export const LIMIT_MS: Record<ReviewMode, number | null> = {
  mc: 15000, // multiple choice
  listening: 20000, // listen-and-pick (includes playback)
  spelling: 30000, // typed spelling (includes typing)
  flashcard: null, // self-graded — timing it means nothing
  game: null, // clashes with the game's own clock
};

export function limitFor(mode: ReviewMode): number | null {
  return Object.prototype.hasOwnProperty.call(LIMIT_MS, mode) ? LIMIT_MS[mode] : null;
}

/**
 * Master switch for response-time grading. OFF.
 *
 * The table above is kept exactly as specified, but it is not consulted while this
 * is false — `ms` is recorded and nothing more. The reason is the headline bug:
 * measured mean response is 9.70s, so a 15s limit puts a typical correct answer at
 * ratio 0.65 → q=4 → EF delta of exactly 0, which is how ease stopped recovering in
 * the first place. Turning it on before the thresholds are re-derived from measured
 * percentiles would reintroduce that.
 *
 * Flipping this to true is all it takes to enable the per-mode table again.
 */
export const TIME_GRADING_ENABLED = false;

/** Attempt → SM-2 quality. With limitMs null, time is ignored and a correct answer is q=5. */
export function gradeQuality(correct: boolean, ms: number | null = null, limitMs: number | null = null): number {
  if (!correct) return 2; // wrong: -0.32

  if (ms != null && limitMs != null && limitMs > 0) {
    const ratio = ms / limitMs;
    if (ratio > 0.7) return 3; // slow but correct: -0.14
    if (ratio > 0.3) return 4; // normal: +-0.00
  }
  return 5; // instant, or untimed: +0.10
}

/* ------------------------------------------------------------------ */
/* [fix 1] Review interval                                             */
/* ------------------------------------------------------------------ */

/**
 * @param repetitions consecutive correct answers *including* this attempt
 *
 * Up to v3 the already-incremented value was checked against 0/1, so the first
 * correct answer skipped the 1-day step and went straight to 6 days. Getting a
 * brand-new word right once meant not seeing it again for a week, which wrecks
 * the initial consolidation.
 */
export function nextInterval(repetitions: number, prevInterval: number, ef: number): number {
  if (repetitions <= 0) return 1; // wrong → retry tomorrow
  if (repetitions === 1) return 1; // first correct
  if (repetitions === 2) return 6; // second correct
  return Math.max(1, Math.round(prevInterval * ef));
}

/* ------------------------------------------------------------------ */
/* Lapse detection                                                     */
/* ------------------------------------------------------------------ */

/** repetitions >= 2 counts as "mature". */
export const MATURE_REPS = 2;

/**
 * A lapse is only a card that had already matured falling over. In v2 the trigger
 * was identical to wrongCount's, so lapses always equalled wrongCount — two fields
 * holding the same number carry zero extra information.
 */
export function isLapse(srs: Partial<SrsData>, correct: boolean): boolean {
  return !correct && (srs.repetitions ?? 0) >= MATURE_REPS;
}

/* ------------------------------------------------------------------ */
/* Recording an attempt                                                */
/* ------------------------------------------------------------------ */

export interface ReviewOptions {
  /** Response time in ms. [fix 3] Pass it even when the mode ignores it for grading. */
  ms?: number | null;
  mode: ReviewMode;
  dir: ReviewDirection;
  /** Options on screen, for multiple-choice and listening — sets the guessing floor. */
  optionCount?: number;
  /** Overrides the per-mode table. null disables time-based grading. */
  limitMs?: number | null;
  now?: Date;
}

/**
 * Random spread applied to each scheduled interval.
 *
 * Without it, the gap before a review is a deterministic function of that word's own
 * past answers: hard words are only ever tested after a day, easy ones only after a
 * month. Nothing then separates "fades quickly" from "was asked again quickly", and
 * the forgetting curve cannot be estimated from the review log — the schedule has to
 * vary on its own for the data to carry that information. It also stops whole
 * batches of words from coming due on the same day.
 */
export const INTERVAL_JITTER = 0.25;

export function jitterInterval(interval: number, random: () => number = Math.random): number {
  if (interval <= 1) return interval; // a 1-day retry has nowhere to go but up
  const factor = 1 + (random() * 2 - 1) * INTERVAL_JITTER;
  return Math.max(1, Math.round(interval * factor));
}

/** Applies one attempt to a word's SRS record. Pure — returns a new object. */
export function reviewWord(srs: SrsData, correct: boolean, opts: ReviewOptions): SrsData {
  const { ms = null, mode, dir, now = new Date() } = opts;

  const limitMs =
    opts.limitMs !== undefined ? opts.limitMs : TIME_GRADING_ENABLED ? limitFor(mode) : null;
  const q = gradeQuality(correct, ms, limitMs);

  const ef = Math.min(EF_MAX, Math.max(EF_MIN, (srs.easeFactor ?? EF_INIT) + efDelta(q)));
  const lapsed = isLapse(srs, correct);

  const repetitions = correct ? (srs.repetitions ?? 0) + 1 : 0;
  const interval = nextInterval(repetitions, srs.interval ?? 1, ef);

  // The ladder position is stored unjittered; only the due date is spread out, so
  // the noise does not compound across reviews.
  const due = new Date(now);
  due.setDate(due.getDate() + jitterInterval(interval));

  // [fix 3] ms goes in regardless of whether it was graded: the derived log's
  // studySeconds reads nothing else, so dropping it freezes the study-time stat.
  const entry: ReviewEvent = { t: now.toISOString(), ok: correct, mode, dir, q };
  if (ms != null) entry.ms = ms;
  if (opts.optionCount != null && opts.optionCount >= 2) entry.opt = opts.optionCount;

  // Trimming the oldest entries can shrink the derived counts for long-past days
  // on a word drilled more than HISTORY_LIMIT times. Accepted: the alternative is
  // an unbounded history that blows the storage budget.
  const history = [...(srs.history ?? []), entry].slice(-HISTORY_LIMIT);

  return {
    ...srs,
    easeFactor: Math.round(ef * 100) / 100,
    repetitions,
    interval,
    dueDate: toLocalDate(due),
    lastReviewed: toLocalDate(now),
    correctCount: (srs.correctCount ?? 0) + (correct ? 1 : 0),
    wrongCount: (srs.wrongCount ?? 0) + (correct ? 0 : 1),
    lapses: (srs.lapses ?? 0) + (lapsed ? 1 : 0),
    history,
  };
}

export function createInitialSrs(): SrsData {
  return {
    easeFactor: EF_INIT,
    interval: 0,
    repetitions: 0,
    dueDate: todayIso(),
    correctCount: 0,
    wrongCount: 0,
    lastReviewed: null,
    lapses: 0,
    history: [],
  };
}

/* ------------------------------------------------------------------ */
/* Mean wrong rate m — cold start                                      */
/* ------------------------------------------------------------------ */

/** Measured 0.176. 0.30 was unfairly harsh on brand-new users. */
export const M_FALLBACK = 0.22;
export const M_MIN_SAMPLE = 30;

/**
 * correctCount / wrongCount already include the pre-migration attempts, so adding
 * preCount here would count them twice. Don't.
 */
export function computeM(words: Word[]): number {
  let ok = 0;
  let ng = 0;
  for (const w of words) {
    ok += w.srs?.correctCount ?? 0;
    ng += w.srs?.wrongCount ?? 0;
  }
  const n = ok + ng;
  return n < M_MIN_SAMPLE ? M_FALLBACK : ng / n;
}

/* ------------------------------------------------------------------ */
/* [fix 2] Rebuilding the log — legacy cutover + history               */
/* ------------------------------------------------------------------ */

function blankEntry(date: string): StudyLogEntry {
  return { date, studiedCount: 0, correctCount: 0, wrongCount: 0, studySeconds: 0 };
}

/**
 * Migrated words have no history — their past timestamps are unrecoverable — so
 * everything on or before the cutoff keeps its legacy totals instead of dropping
 * the heatmap and streaks to zero.
 *
 * v3 bug: legacy was kept for `date <= cutoff` while the derived pass *also* skipped
 * `date <= cutoff`, so anything studied after the migration on that same day fell
 * through both. The boundary day now seeds from legacy and accumulates on top.
 *
 * Known limit: in the 2026-08-11 backup, word counters held 907 attempts but the log
 * only had 509. The missing 398 have no history and can never be recovered, so the
 * historical undercount stays.
 */
export function rebuildLog(
  words: Word[],
  legacyLog: StudyLogEntry[] = [],
  cutoff: string | null = null
): StudyLogEntry[] {
  const byDate = new Map<string, StudyLogEntry>();

  // Seed with legacy up to and including the boundary day.
  for (const e of legacyLog) {
    if (cutoff && e.date > cutoff) continue;
    byDate.set(e.date, { ...blankEntry(e.date), ...e });
  }

  // Accumulate the derived side on top. The boundary day adds to its legacy seed.
  for (const w of words) {
    for (const h of w.srs?.history ?? []) {
      const date = toLocalDate(new Date(h.t));
      if (cutoff && date < cutoff) continue; // skip strictly *before* the boundary

      let e = byDate.get(date);
      if (!e) {
        e = blankEntry(date);
        byDate.set(date, e);
      }

      e.studiedCount += 1;
      if (h.ok) e.correctCount += 1;
      else e.wrongCount += 1;
      if (h.ms != null) e.studySeconds += Math.round(h.ms / 1000);
    }
  }

  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Recomputes `state.log` from the current words. The only place `log` is written. */
export function withDerivedLog(state: AppState): AppState {
  return { ...state, log: rebuildLog(state.words, state.legacyLog, state.migration?.logCutoff ?? null) };
}

/* ------------------------------------------------------------------ */
/* [fix 4] Migration (v1 → v4)                                         */
/* ------------------------------------------------------------------ */

export const STATE_VERSION = 4;

/** Real-time correct answers move EF by 0.10 (q=5); back-dated ones get half. */
export const CORRECT_STEP = 0.05;
/** q=2. The v1 data measured 0.54, recomputed here for the new rule. */
export const WRONG_STEP = 0.32;

/**
 * Treating every past correct answer as instant recall (q=5) would be far too
 * generous. The measured mean response was 9.70s, so plenty of them were really
 * q=4 (no change) — hence crediting only half.
 *
 * Known limit: the order of attempts is unrecoverable, so path dependence remains
 * (10 correct then 3 wrong lands lower when replayed in sequence). This is an
 * approximation by construction.
 */
export function migrateSrs(srs: Partial<SrsData> = {}): SrsData {
  const ok = srs.correctCount ?? 0;
  const ng = srs.wrongCount ?? 0;

  const raw = EF_INIT + CORRECT_STEP * ok - WRONG_STEP * ng;
  const ef = Math.min(EF_MAX, Math.max(EF_MIN, raw));

  return {
    ...createInitialSrs(),
    ...srs,
    easeFactor: Math.round(ef * 100) / 100,
    // The old repetitions trajectory is unknown, so there is no way to say how many
    // mature cards collapsed. Start at 0 and count from v4 onward; the past totals
    // stay readable through preCount.ng.
    lapses: 0,
    preCount: { ok, ng, until: srs.lastReviewed ?? null },
    history: [],
  };
}

export const MIGRATION_CHANGES = [
  'local_date_fix',
  'ef_max_3.0',
  'ef_recalc_with_correct_half',
  'interval_offset_fix',
  'log_boundary_merge',
  'mode_limit_table',
  'lapses_maturity_def',
  'history_dir_field',
  'precount_seal',
];

/**
 * Upgrades a whole state object read from localStorage or a backup file.
 * Freezes the old log as `legacyLog` and pins the cutoff at the migration day.
 */
export function migrateState(state: AppState, fromVersion: number, now: Date = new Date()): AppState {
  const appliedAt = toLocalDate(now);
  const words = state.words.map((w) => ({ ...w, srs: migrateSrs(w.srs) }));
  const migration: MigrationInfo = {
    appliedAt,
    from: fromVersion,
    to: STATE_VERSION,
    logCutoff: appliedAt,
    changes: MIGRATION_CHANGES,
  };

  return withDerivedLog({
    ...state,
    words,
    legacyLog: state.log,
    migration,
  });
}

/* ------------------------------------------------------------------ */
/* Scheduling queries                                                  */
/* ------------------------------------------------------------------ */

export function isDue(word: Word, onDate: string = todayIso()): boolean {
  return word.srs.dueDate <= onDate;
}

export function getDueWords(words: Word[], limit?: number): Word[] {
  const due = words.filter((w) => isDue(w));
  due.sort((a, b) => a.srs.dueDate.localeCompare(b.srs.dueDate));
  return limit ? due.slice(0, limit) : due;
}
