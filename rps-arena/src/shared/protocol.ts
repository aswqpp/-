/** What the UI renders from, in both SOLO and ROOM mode. */
import type { BotLevel, Config, GameState, Phase, Player } from './engine.ts';

export interface PlayerView {
  id: string;
  name: string;
  bot: BotLevel | null;
  score: number;
  w: number;
  d: number;
  l: number;
  delta: number;
  locked: boolean;
  /** Hidden (null) for other players until the round is revealed. */
  pickId: number | null;
  auto: boolean;
  ready: boolean;
  connected: boolean;
}

export interface GameView {
  mode: 'solo' | 'room';
  code: string | null;
  youId: string;
  hostId: string | null;
  phase: Phase;
  round: number;
  config: Config;
  deadline: number | null;
  /** Server clock when the view was made, to correct client clock skew. */
  serverNow: number;
  players: PlayerView[];
}

export function toView(
  s: GameState,
  opts: {
    mode: 'solo' | 'room';
    code: string | null;
    youId: string;
    hostId: string | null;
    now: number;
    connected: (p: Player) => boolean;
  },
): GameView {
  const hidePicks = s.phase === 'pick';
  return {
    mode: opts.mode,
    code: opts.code,
    youId: opts.youId,
    hostId: opts.hostId,
    phase: s.phase,
    round: s.round,
    config: { ...s.config },
    deadline: s.deadline,
    serverNow: opts.now,
    players: s.players.map((p) => ({
      id: p.id,
      name: p.name,
      bot: p.bot,
      score: p.score,
      w: p.w,
      d: p.d,
      l: p.l,
      delta: p.delta,
      locked: p.locked,
      pickId: hidePicks && p.id !== opts.youId ? null : p.pickId,
      auto: p.auto,
      ready: p.ready,
      connected: p.bot !== null || opts.connected(p),
    })),
  };
}

/** Client → room messages. */
export type ClientMsg =
  | { t: 'config'; config: Partial<Config> }
  | { t: 'addBot'; level: BotLevel }
  | { t: 'removeBot'; id: string }
  | { t: 'start' }
  | { t: 'lock'; pickId: number }
  | { t: 'ready' }
  | { t: 'rematch' }
  | { t: 'toLobby' }
  | { t: 'leave' }
  | { t: 'ping' };

/** Room → client messages. */
export type ServerMsg =
  | { t: 'state'; view: GameView }
  | { t: 'error'; code: ErrorCode; msg: string }
  | { t: 'pong' };

export type ErrorCode = 'NOT_FOUND' | 'FULL' | 'IN_PROGRESS' | 'BAD_REQUEST' | 'NOT_HOST';

/** WebSocket close codes the room uses for final refusals. */
export const CLOSE_NOT_FOUND = 4004;
export const CLOSE_FULL = 4009;
export const CLOSE_IN_PROGRESS = 4010;
export const CLOSE_LEFT = 4000;

export const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 4;

export function normalizeCode(raw: string): string | null {
  const c = raw.trim().toUpperCase();
  if (c.length !== CODE_LENGTH) return null;
  for (const ch of c) if (!CODE_ALPHABET.includes(ch)) return null;
  return c;
}
