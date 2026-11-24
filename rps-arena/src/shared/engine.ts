/**
 * Pure, serializable match engine shared by SOLO (runs in the browser) and
 * ROOM (runs inside the room's Durable Object). No timers, no I/O: callers
 * drive it and decide when to call `resolveRound`.
 */
import { judge, type Result } from './judge.ts';
import { VARIANTS, type VariantN } from './variants.ts';

export type Phase = 'lobby' | 'pick' | 'reveal' | 'podium';
export type BotLevel = 'EASY' | 'NORMAL' | 'HARD';
export type Rng = () => number;

export const BOT_LEVELS: BotLevel[] = ['EASY', 'NORMAL', 'HARD'];
export const BOT_NAMES = ['KAI', 'SORA', 'MIRA', 'REN', 'TAO'];
export const ROUND_OPTIONS = [3, 5, 7];
export const TIMER_OPTIONS = [0, 15, 25, 45]; // 0 = no limit
export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;
export const NAME_MAX = 12;

export interface Config {
  variantN: VariantN;
  rounds: number;
  timerSec: number;
}

export interface Player {
  id: string;
  name: string;
  bot: BotLevel | null;
  score: number;
  w: number;
  d: number;
  l: number;
  /** Points gained in the latest resolved round. */
  delta: number;
  locked: boolean;
  pickId: number | null;
  /** The pick was made for this player because the timer ran out. */
  auto: boolean;
  /** Pressed NEXT on the reveal screen. */
  ready: boolean;
  /** Picks of earlier rounds, oldest first (bots read this). */
  history: number[];
}

export interface GameState {
  config: Config;
  phase: Phase;
  round: number;
  /** Epoch ms when the pick phase ends, or null for no limit. */
  deadline: number | null;
  players: Player[];
}

export interface Bout<P = Player> {
  left: P;
  right: P;
  /** From the left fighter's point of view. */
  res: Result;
}

export const DEFAULT_CONFIG: Config = { variantN: 15, rounds: 5, timerSec: 25 };

export function newGame(config: Config = DEFAULT_CONFIG): GameState {
  return { config: { ...config }, phase: 'lobby', round: 0, deadline: null, players: [] };
}

export function cleanName(raw: unknown, fallback = 'PLAYER'): string {
  const s = String(raw ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .toUpperCase()
    .slice(0, NAME_MAX);
  return s || fallback;
}

function blankPlayer(id: string, name: string, bot: BotLevel | null): Player {
  return {
    id, name, bot, score: 0, w: 0, d: 0, l: 0, delta: 0,
    locked: false, pickId: null, auto: false, ready: false, history: [],
  };
}

/** Make `name` unique among the players so two people never share a label. */
function uniqueName(s: GameState, name: string): string {
  const taken = new Set(s.players.map((p) => p.name));
  if (!taken.has(name)) return name;
  for (let i = 2; ; i++) {
    const suffix = String(i);
    const cand = name.slice(0, NAME_MAX - suffix.length) + suffix;
    if (!taken.has(cand)) return cand;
  }
}

export function addHuman(s: GameState, id: string, name: string): Player {
  const p = blankPlayer(id, uniqueName(s, cleanName(name)), null);
  s.players.push(p);
  return p;
}

export function addBot(s: GameState, level: BotLevel, id: string): Player | null {
  if (s.players.length >= MAX_PLAYERS) return null;
  const used = new Set(s.players.map((p) => p.name));
  const name = BOT_NAMES.find((n) => !used.has(n)) ?? uniqueName(s, 'BOT');
  const p = blankPlayer(id, name, level);
  s.players.push(p);
  return p;
}

export function removePlayer(s: GameState, id: string): void {
  s.players = s.players.filter((p) => p.id !== id);
}

export function startMatch(s: GameState, now: number): void {
  s.round = 0;
  for (const p of s.players) {
    Object.assign(p, { score: 0, w: 0, d: 0, l: 0, delta: 0, history: [] });
  }
  startRound(s, now);
}

function startRound(s: GameState, now: number): void {
  s.round += 1;
  s.phase = 'pick';
  s.deadline = s.config.timerSec > 0 ? now + s.config.timerSec * 1000 : null;
  for (const p of s.players) {
    p.locked = false;
    p.pickId = null;
    p.auto = false;
    p.ready = false;
    p.delta = 0;
  }
}

export function lock(s: GameState, id: string, pickId: number): boolean {
  if (s.phase !== 'pick') return false;
  const p = s.players.find((x) => x.id === id);
  if (!p || p.locked) return false;
  if (!Number.isInteger(pickId) || pickId < 0 || pickId >= s.config.variantN) return false;
  p.pickId = pickId;
  p.locked = true;
  return true;
}

export function allLocked(s: GameState): boolean {
  return s.phase === 'pick' && s.players.every((p) => p.locked);
}

export function computeBouts<P extends { pickId: number | null }>(players: P[], n: number): Bout<P>[] {
  const bouts: Bout<P>[] = [];
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const left = players[i];
      const right = players[j];
      if (left.pickId === null || right.pickId === null) continue;
      bouts.push({ left, right, res: judge(left.pickId, right.pickId, n) });
    }
  }
  return bouts;
}

/** Fill in missing picks at random, score every 1v1 pairing, go to reveal. */
export function resolveRound(s: GameState, rng: Rng = Math.random): void {
  if (s.phase !== 'pick') return;
  const n = s.config.variantN;
  for (const p of s.players) {
    if (!p.locked || p.pickId === null) {
      p.pickId = Math.floor(rng() * n);
      p.locked = true;
      p.auto = true;
    }
  }
  for (const b of computeBouts<Player>(s.players, n)) {
    if (b.res === 'WIN') {
      b.left.delta += 1; b.left.score += 1; b.left.w += 1; b.right.l += 1;
    } else if (b.res === 'LOSE') {
      b.right.delta += 1; b.right.score += 1; b.right.w += 1; b.left.l += 1;
    } else {
      b.left.d += 1; b.right.d += 1;
    }
  }
  for (const p of s.players) p.history.push(p.pickId as number);
  s.phase = 'reveal';
  s.deadline = null;
}

/** Move on from the reveal screen: next round, or the podium after the last. */
export function advance(s: GameState, now: number): void {
  if (s.phase !== 'reveal') return;
  if (s.round >= s.config.rounds) {
    s.phase = 'podium';
    s.deadline = null;
  } else {
    startRound(s, now);
  }
}

export function toLobby(s: GameState): void {
  s.phase = 'lobby';
  s.round = 0;
  s.deadline = null;
  for (const p of s.players) {
    Object.assign(p, {
      score: 0, w: 0, d: 0, l: 0, delta: 0,
      locked: false, pickId: null, auto: false, ready: false, history: [],
    });
  }
}

export function standings(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.score - a.score || b.w - a.w);
}

/* ------------------------------------------------------------------------- */
/* Bots                                                                       */
/* ------------------------------------------------------------------------- */

/**
 * EASY   — uniform random.
 * NORMAL — half the time random, otherwise a loose read of opponents.
 * HARD   — models each opponent's next pick from their (recency-weighted)
 *          history and plays the item expected to beat the most of them,
 *          sampled softly so it stays hard to counter.
 */
export function chooseBotPick(s: GameState, bot: Player, rng: Rng = Math.random): number {
  const n = s.config.variantN;
  const level = bot.bot ?? 'EASY';
  const opponents = s.players.filter((p) => p.id !== bot.id);
  const hasHistory = opponents.some((p) => p.history.length > 0);
  if (level === 'EASY' || !hasHistory || (level === 'NORMAL' && rng() < 0.5)) {
    return Math.floor(rng() * n);
  }

  // Expected number of opponents each candidate beats.
  const score = new Array<number>(n).fill(0);
  for (const o of opponents) {
    const dist = predict(o.history, n);
    for (let c = 0; c < n; c++) {
      let win = 0;
      for (let k = 0; k < n; k++) if (judge(c, k, n) === 'WIN') win += dist[k];
      score[c] += win;
    }
  }

  // Softmax sampling; HARD is sharper than NORMAL.
  const temp = (level === 'HARD' ? 0.12 : 0.35) * Math.max(1, opponents.length / 2);
  const max = Math.max(...score);
  const weights = score.map((v) => Math.exp((v - max) / temp));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let c = 0; c < n; c++) {
    r -= weights[c];
    if (r <= 0) return c;
  }
  return n - 1;
}

/** Probability of each item being picked next, from past picks. */
function predict(history: number[], n: number): number[] {
  const alpha = 0.6; // Laplace smoothing toward uniform
  const decay = 0.7; // older picks count less
  const dist = new Array<number>(n).fill(alpha);
  let w = 1;
  for (let i = history.length - 1; i >= 0; i--) {
    dist[history[i]] += w * 2;
    w *= decay;
  }
  const total = dist.reduce((a, b) => a + b, 0);
  return dist.map((v) => v / total);
}

export function variantOf(s: GameState) {
  return VARIANTS[s.config.variantN];
}
