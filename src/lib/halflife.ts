import type { ReviewDirection, ReviewEvent, ReviewMode, Word } from '../types';

/**
 * Half-life difficulty model.
 *
 * Replaces "how often was this missed" with "how fast does this fade", which is the
 * question difficulty is actually asking. A word missed after a 40-day gap is not
 * the same as a word missed the next day, and a wrong-rate cannot tell them apart.
 *
 *   P(recall | Δt days) = g + (1 − g) · 2^(−Δt / h)
 *   log₂ h_ij = μ + xᵀβ + b_i        b_i ~ N(0, σ²)
 *
 * `b_i` is the word's own effect; everything shared across words — the practice
 * effect, how hard each mode is, which direction it was asked in — lives in β and
 * is estimated from the whole deck. That matters: a word carries a handful of
 * attempts, so fitting it from scratch is hopeless, while fitting a small residual
 * on top of deck-wide structure is not.
 *
 * `g` is the guessing floor. Multiple choice has one (1/options) and open recall
 * does not. Ignoring it makes lucky guesses at long gaps look like real memory:
 * in simulation it inflated the estimated population half-life by ~70%.
 */

const LN2 = Math.log(2);
const DAY_MS = 86400000;

/** Observations closer together than this carry no forgetting information. */
const MIN_GAP_DAYS = 1 / 24;

/** Recency half-life for observation weights: skill drifts, old evidence decays. */
export const WEIGHT_HALFLIFE_DAYS = 180;

/** Practice effect is capped — the ladder stops teaching us anything new past this. */
const MAX_PRIOR_CORRECT = 6;

export const SIGMA_MIN = 0.5;
export const SIGMA_MAX = 2.5;

/** Bounds the cost of a fit on a large, heavily drilled deck. */
const MAX_OBS_PER_WORD = 40;

/**
 * How far from the deck average a word must sit to earn a label, in units of σ.
 * Relative rather than absolute: fixed day thresholds would tag a struggling
 * learner's entire deck 어려움 and a strong learner's entire deck 쉬움.
 */
export const VERDICT_MARGIN_SIGMA = 0.5;

/** Posterior probability required before a word is labelled rather than left open. */
export const VERDICT_CONFIDENCE = 0.75;

export type Verdict = 'hard' | 'easy' | 'unsure' | 'unrated';

/* ------------------------------------------------------------------ */
/* Observations                                                        */
/* ------------------------------------------------------------------ */

interface Obs {
  /** Days since the previous review of this word. */
  dt: number;
  ok: boolean;
  /** Recency weight, 1 for today. */
  w: number;
  /** Guessing floor for the mode this attempt used. */
  g: number;
  mode: ReviewMode;
  dir: ReviewDirection;
  /** Consecutive correct answers before this attempt, capped. */
  priorCorrect: number;
}

/**
 * Chance of being right without knowing the word. Multiple-choice attempts record
 * how many options were on screen; older ones predate that field and assume four.
 */
function guessFloor(event: ReviewEvent): number {
  if (event.mode !== 'mc' && event.mode !== 'listening') return 0;
  const options = event.opt && event.opt >= 2 ? event.opt : 4;
  return 1 / options;
}

/**
 * Turns one word's attempt history into gap/outcome pairs.
 *
 * The gap for an attempt is the time since the previous one, so the first recorded
 * attempt has no gap unless the pre-upgrade era left a last-reviewed date behind.
 */
function observationsFor(word: Word, now: number): Obs[] {
  const history = word.srs.history;
  if (history.length === 0) return [];

  const seed = word.srs.preCount?.until;
  let prev = seed ? new Date(seed + 'T12:00:00').getTime() : null;
  let priorCorrect = 0;

  const out: Obs[] = [];
  for (const event of history) {
    const at = new Date(event.t).getTime();
    if (!Number.isNaN(at) && prev !== null) {
      const dt = (at - prev) / DAY_MS;
      if (dt >= MIN_GAP_DAYS) {
        out.push({
          dt,
          ok: event.ok,
          w: 0.5 ** Math.max(0, (now - at) / DAY_MS / WEIGHT_HALFLIFE_DAYS),
          g: guessFloor(event),
          mode: event.mode,
          dir: event.dir,
          priorCorrect: Math.min(MAX_PRIOR_CORRECT, priorCorrect),
        });
      }
    }
    if (!Number.isNaN(at)) prev = at;
    priorCorrect = event.ok ? priorCorrect + 1 : 0;
  }

  return out.length > MAX_OBS_PER_WORD ? out.slice(-MAX_OBS_PER_WORD) : out;
}

/* ------------------------------------------------------------------ */
/* Design matrix                                                       */
/* ------------------------------------------------------------------ */

/** Flashcard and w2m are the reference levels, folded into the intercept. */
const MODE_TERMS: ReviewMode[] = ['mc', 'listening', 'spelling', 'game'];
const N_TERMS = 1 + 1 + MODE_TERMS.length + 1; // intercept, practice, modes, direction

/**
 * @param practiceCenter mean practice level, subtracted so the intercept means
 *   "average half-life at typical practice" rather than "at zero practice".
 *   Uncentred, the intercept and the practice slope are strongly correlated —
 *   practice rises in lockstep with the review gap — and the fit trades one off
 *   against the other, landing on a low intercept and an inflated slope.
 */
function designRow(o: Obs, practiceCenter: number): number[] {
  const x = new Array<number>(N_TERMS).fill(0);
  x[0] = 1;
  x[1] = o.priorCorrect - practiceCenter;
  const modeIndex = MODE_TERMS.indexOf(o.mode);
  if (modeIndex >= 0) x[2 + modeIndex] = 1;
  x[2 + MODE_TERMS.length] = o.dir === 'm2w' ? 1 : 0;
  return x;
}

/* ------------------------------------------------------------------ */
/* Likelihood pieces                                                   */
/* ------------------------------------------------------------------ */

interface Point {
  p: number;
  /** dp/dθ, θ being log₂ of the half-life. */
  dp: number;
}

function evaluate(theta: number, o: Obs): Point {
  const u = o.dt * 2 ** -theta;
  const q = Math.exp(-u * LN2);
  const p = Math.min(1 - 1e-9, Math.max(1e-9, o.g + (1 - o.g) * q));
  // d/dθ of 2^(−Δt·2^(−θ)) works out to q · u · (ln2)².
  return { p, dp: (1 - o.g) * q * u * LN2 * LN2 };
}

/** Fisher information per unit weight — always positive, which keeps Newton stable. */
function infoBase(pt: Point): number {
  return (pt.dp * pt.dp) / (pt.p * (1 - pt.p));
}

/* ------------------------------------------------------------------ */
/* Linear solve (small dense system)                                   */
/* ------------------------------------------------------------------ */

function solve(a: number[][], b: number[]): number[] | null {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    if (Math.abs(m[pivot][col]) < 1e-10) return null;
    [m[col], m[pivot]] = [m[pivot], m[col]];

    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const f = m[r][col] / m[col][col];
      for (let c = col; c <= n; c++) m[r][c] -= f * m[col][c];
    }
  }

  return m.map((row, i) => row[n] / m[i][i]);
}

/* ------------------------------------------------------------------ */
/* Per-word estimate                                                   */
/* ------------------------------------------------------------------ */

export interface WordEstimate {
  wordId: string;
  /** The word's own effect, in log₂ days. Negative = fades faster than the deck. */
  b: number;
  /** Posterior standard error of `b`. */
  se: number;
  /** Half-life in days at this word's current practice level. */
  halfLifeDays: number;
  observations: number;
  /** Posterior probability the word is meaningfully harder / easier than the deck. */
  pHard: number;
  pEasy: number;
  verdict: Verdict;
  /** Confidence behind a hard/easy verdict, 0–1. */
  confidence: number;
}

/**
 * Maximises the penalised weighted log-likelihood in `b`.
 *
 * Coarse scan first, then Newton: the likelihood is not guaranteed concave — a run
 * of correct answers at short gaps pushes it flat — and a bad start would wander.
 */
function fitWord(obs: Obs[], base: number[], sigma: number, warmStart?: number): { b: number; se: number } {
  const priorPrecision = 1 / (sigma * sigma);

  const penalised = (b: number) => {
    let ll = 0;
    for (let i = 0; i < obs.length; i++) {
      const { p } = evaluate(base[i] + b, obs[i]);
      ll += obs[i].w * (obs[i].ok ? Math.log(p) : Math.log(1 - p));
    }
    return ll - (b * b * priorPrecision) / 2;
  };

  // The full scan only runs on the first pass. After that the previous estimate is a
  // good start, and rescanning the whole range every pass dominated the fit's cost.
  const centre = warmStart ?? 0;
  const span = warmStart === undefined ? 6 : 0.75;
  const stride = warmStart === undefined ? 0.25 : 0.15;

  let b = centre;
  let best = penalised(centre);
  for (let cand = centre - span; cand <= centre + span; cand += stride) {
    const v = penalised(cand);
    if (v > best) {
      best = v;
      b = cand;
    }
  }

  for (let iter = 0; iter < 8; iter++) {
    let score = -b * priorPrecision;
    let curvature = priorPrecision;
    for (let i = 0; i < obs.length; i++) {
      const o = obs[i];
      const pt = evaluate(base[i] + b, o);
      score += (o.w * ((o.ok ? 1 : 0) - pt.p) * pt.dp) / (pt.p * (1 - pt.p));
      curvature += o.w * infoBase(pt);
    }
    const step = score / curvature;
    b += Math.max(-1, Math.min(1, step));
    if (Math.abs(step) < 1e-6) break;
  }

  // Sandwich variance. With weights below 1 the plain inverse curvature is too wide
  // — uniformly halving every weight must not double the variance — so the score
  // variance goes in the middle. It collapses to the usual form when all w = 1.
  let bread = priorPrecision;
  let meat = priorPrecision;
  for (let i = 0; i < obs.length; i++) {
    const o = obs[i];
    const information = infoBase(evaluate(base[i] + b, o));
    bread += o.w * information;
    meat += o.w * o.w * information;
  }
  const variance = meat / (bread * bread);

  return { b, se: Math.sqrt(Math.max(variance, 1e-6)) };
}

/* ------------------------------------------------------------------ */
/* Deck fit                                                            */
/* ------------------------------------------------------------------ */

export interface DeckModel {
  /** Deck-average log₂ half-life for a fresh, self-graded review. */
  mu: number;
  sigma: number;
  /** Fixed effects, aligned with the design row. */
  beta: number[];
  /** Practice level the intercept is centred on. */
  practiceCenter: number;
  estimates: Map<string, WordEstimate>;
  totalObservations: number;
  /** Words carrying at least one usable gap. */
  ratedWords: number;
  /** Median half-life across rated words, in days. */
  medianHalfLife: number;
}

export const EMPTY_MODEL: DeckModel = {
  mu: Math.log2(7),
  sigma: 1,
  beta: new Array<number>(N_TERMS).fill(0),
  practiceCenter: 0,
  estimates: new Map(),
  totalObservations: 0,
  ratedWords: 0,
  medianHalfLife: 7,
};

function normalCdf(z: number): number {
  // Abramowitz & Stegun 7.1.26 on erf, accurate to ~1e-7 — ample for a label.
  const t = 1 / (1 + 0.3275911 * Math.abs(z) * Math.SQRT1_2);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp((-z * z) / 2);
  return z >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/**
 * Fits the whole deck by backfitting: global terms with the word effects held fixed,
 * then each word effect with the global terms held fixed, then σ, and around again.
 *
 * σ uses the EM update `σ² = mean(b̂² + var)`. Taking `sd(b̂)` instead — the obvious
 * thing — reads the spread of *shrunk* estimates as if it were the spread of the
 * truth, so σ falls, which shrinks harder, which lowers the spread again. In
 * simulation that collapses onto the clamp floor within two iterations and every
 * word ends up pinned to the deck average.
 */
export function fitDeck(words: Word[], now: number = Date.now(), iterations = 8): DeckModel {
  const collected: { word: Word; obs: Obs[] }[] = [];
  let total = 0;
  let practiceSum = 0;

  for (const word of words) {
    const obs = observationsFor(word, now);
    if (obs.length === 0) continue;
    collected.push({ word, obs });
    total += obs.length;
    for (const o of obs) practiceSum += o.priorCorrect;
  }

  if (total === 0) return EMPTY_MODEL;

  const practiceCenter = practiceSum / total;
  const perWord = collected.map((entry) => ({
    ...entry,
    rows: entry.obs.map((o) => designRow(o, practiceCenter)),
  }));

  const beta = new Array<number>(N_TERMS).fill(0);
  beta[0] = Math.log2(7); // a week is a reasonable place to start looking
  let sigma = 1;
  let effects = new Map<string, { b: number; se: number }>();

  for (let iter = 0; iter < iterations; iter++) {
    // ---- global terms, one damped Newton step ----
    const grad = new Array<number>(N_TERMS).fill(0);
    const hess: number[][] = Array.from({ length: N_TERMS }, () => new Array<number>(N_TERMS).fill(0));

    for (const entry of perWord) {
      const b = effects.get(entry.word.id)?.b ?? 0;
      for (let i = 0; i < entry.obs.length; i++) {
        const o = entry.obs[i];
        const x = entry.rows[i];
        let theta = b;
        for (let k = 0; k < N_TERMS; k++) theta += beta[k] * x[k];

        const pt = evaluate(theta, o);
        const s = (o.w * ((o.ok ? 1 : 0) - pt.p) * pt.dp) / (pt.p * (1 - pt.p));
        const info = o.w * infoBase(pt);

        for (let k = 0; k < N_TERMS; k++) {
          if (x[k] === 0) continue;
          grad[k] += s * x[k];
          for (let l = 0; l < N_TERMS; l++) {
            if (x[l] === 0) continue;
            hess[k][l] += info * x[k] * x[l];
          }
        }
      }
    }

    // Ridge on the diagonal: a mode nobody has used leaves its column empty.
    for (let k = 0; k < N_TERMS; k++) hess[k][k] += 1e-4;
    const step = solve(hess, grad);
    if (step) {
      for (let k = 0; k < N_TERMS; k++) beta[k] += Math.max(-1.5, Math.min(1.5, step[k]));
    }

    // ---- word effects ----
    const next = new Map<string, { b: number; se: number }>();
    for (const entry of perWord) {
      const base = entry.rows.map((x) => {
        let theta = 0;
        for (let k = 0; k < N_TERMS; k++) theta += beta[k] * x[k];
        return theta;
      });
      next.set(entry.word.id, fitWord(entry.obs, base, sigma, effects.get(entry.word.id)?.b));
    }
    effects = next;

    // ---- centre the effects on zero, then σ ----
    const all = [...effects.values()];
    const meanB = all.reduce((s, e) => s + e.b, 0) / all.length;
    beta[0] += meanB;
    for (const e of effects.values()) e.b -= meanB;

    const varSum = all.reduce((s, e) => s + e.b * e.b + e.se * e.se, 0) / all.length;
    sigma = Math.min(SIGMA_MAX, Math.max(SIGMA_MIN, Math.sqrt(varSum)));
  }

  // ---- final per-word summary ----
  const margin = VERDICT_MARGIN_SIGMA * sigma;
  const estimates = new Map<string, WordEstimate>();
  const halfLives: number[] = [];

  for (const entry of perWord) {
    const e = effects.get(entry.word.id)!;
    // Reported at the word's current practice level, which is what a learner is
    // looking at right now — not at the deck's reference conditions.
    const last = entry.rows[entry.rows.length - 1];
    let theta = e.b;
    for (let k = 0; k < N_TERMS; k++) theta += beta[k] * last[k];

    const pHard = normalCdf((-margin - e.b) / e.se);
    const pEasy = 1 - normalCdf((margin - e.b) / e.se);

    let verdict: Verdict = 'unsure';
    if (pHard >= VERDICT_CONFIDENCE) verdict = 'hard';
    else if (pEasy >= VERDICT_CONFIDENCE) verdict = 'easy';

    const halfLifeDays = 2 ** theta;
    halfLives.push(halfLifeDays);

    estimates.set(entry.word.id, {
      wordId: entry.word.id,
      b: e.b,
      se: e.se,
      halfLifeDays,
      observations: entry.obs.length,
      pHard,
      pEasy,
      verdict,
      confidence: Math.max(pHard, pEasy),
    });
  }

  halfLives.sort((a, b) => a - b);

  return {
    mu: beta[0],
    sigma,
    beta,
    practiceCenter,
    estimates,
    totalObservations: total,
    ratedWords: perWord.length,
    medianHalfLife: halfLives[Math.floor(halfLives.length / 2)] ?? 7,
  };
}

/**
 * Recall probability right now, from the fitted half-life.
 * Null when the deck has nothing to say about this word yet.
 */
export function modelRetention(word: Word, model: DeckModel, today: number = Date.now()): number | null {
  const est = model.estimates.get(word.id);
  if (!est) return null;

  const last = word.srs.history[word.srs.history.length - 1];
  const lastAt = last ? new Date(last.t).getTime() : null;
  if (lastAt === null || Number.isNaN(lastAt)) return null;

  const elapsed = Math.max(0, (today - lastAt) / DAY_MS);
  return 2 ** (-elapsed / est.halfLifeDays);
}

/** Labels for the fixed effects, for the stats explainer. */
export const FIXED_EFFECT_LABELS: string[] = [
  '기준(플래시카드 · 단어→뜻)',
  '연속 정답 1회당',
  '객관식',
  '듣고 뜻 맞추기',
  '스펠링 입력',
  '게임',
  '뜻 → 단어',
];
