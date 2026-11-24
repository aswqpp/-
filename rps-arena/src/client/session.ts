/**
 * A Session is "the match you are in". SOLO runs the shared engine right
 * here with bot timers; ROOM talks to the room's Durable Object over a
 * WebSocket. Both hand the UI the same GameView.
 */
import {
  addBot, addHuman, advance, lock, newGame, resolveRound, startMatch,
  type Config, type GameState,
} from '../shared/engine';
import { chooseBotPick } from '../shared/bots';
import {
  CLOSE_FULL, CLOSE_IN_PROGRESS, CLOSE_LEFT, CLOSE_NOT_FOUND,
  toView, type ClientMsg, type GameView, type ServerMsg,
} from '../shared/protocol';

export type NetStatus = 'connecting' | 'open' | 'reconnecting';

export interface SessionEvents {
  view: (view: GameView) => void;
  /** Connection state changes (ROOM only). */
  status?: (status: NetStatus) => void;
  /** A server-side refusal for one action, e.g. "HOST ONLY". */
  notice?: (msg: string) => void;
  /** The session is over for good (left, room gone, kicked by another tab). */
  ended?: (msg: string | null) => void;
}

export interface Session {
  readonly kind: 'solo' | 'room';
  readonly code: string | null;
  lock(pickId: number): void;
  ready(): void;
  rematch(): void;
  toLobby(): void;
  leave(): void;
  // Room lobby controls (host only on the server side).
  config(patch: Partial<Config>): void;
  addBot(): void;
  removeBot(id: string): void;
  start(): void;
}

/* ------------------------------------------------------------------------- */

export interface SoloSetup {
  config: Config;
  name: string;
  bots: number;
}

export class SoloSession implements Session {
  readonly kind = 'solo';
  readonly code = null;
  private g: GameState;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor(setup: SoloSetup, private ev: SessionEvents) {
    this.g = newGame(setup.config);
    addHuman(this.g, 'me', setup.name);
    for (let i = 0; i < setup.bots; i++) addBot(this.g, `bot-${i}`);
  }

  start(): void {
    startMatch(this.g, Date.now());
    this.schedule();
    this.emit();
  }

  lock(pickId: number): void {
    if (!lock(this.g, 'me', pickId)) return;
    // Like the original: your lock closes the round; unlocked bots pick now.
    for (const p of this.g.players) if (p.bot && !p.locked) lock(this.g, p.id, chooseBotPick(this.g, p));
    this.clear();
    resolveRound(this.g);
    this.emit();
  }

  ready(): void {
    advance(this.g, Date.now());
    this.schedule();
    this.emit();
  }

  rematch(): void {
    this.start();
  }

  toLobby(): void {
    this.leave();
  }

  leave(): void {
    this.clear();
    this.ev.ended?.(null);
  }

  config(): void {}
  addBot(): void {}
  removeBot(): void {}

  /** Bots "think" for a moment; the timer resolves the round if you stall. */
  private schedule(): void {
    this.clear();
    if (this.g.phase !== 'pick') return;
    this.g.players.filter((p) => p.bot).forEach((bot, idx) => {
      const delay = 750 + Math.floor(Math.random() * 2300) + idx * 280;
      this.timers.push(setTimeout(() => {
        if (lock(this.g, bot.id, chooseBotPick(this.g, bot))) this.emit();
      }, delay));
    });
    if (this.g.deadline !== null) {
      this.timers.push(setTimeout(() => {
        resolveRound(this.g);
        this.clear();
        this.emit();
      }, Math.max(0, this.g.deadline - Date.now())));
    }
  }

  private clear(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
  }

  private emit(): void {
    this.ev.view(toView(this.g, {
      mode: 'solo', code: null, youId: 'me', hostId: 'me', now: Date.now(), connected: () => true,
    }));
  }
}

/* ------------------------------------------------------------------------- */

const TOKEN_KEY = (code: string) => `rps.token.${code}`;

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function tokenFor(code: string): string {
  const store = safeStorage();
  const existing = store?.getItem(TOKEN_KEY(code));
  if (existing && existing.length >= 16) return existing;
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const t = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  try {
    store?.setItem(TOKEN_KEY(code), t);
  } catch {
    /* private mode: the seat just won't survive a reload */
  }
  return t;
}

export function hasSeatToken(code: string): boolean {
  return !!safeStorage()?.getItem(TOKEN_KEY(code));
}

function forgetToken(code: string): void {
  try {
    safeStorage()?.removeItem(TOKEN_KEY(code));
  } catch {
    /* ignore */
  }
}

export async function createRoom(): Promise<string> {
  const res = await fetch('/api/rooms', { method: 'POST' });
  const body = (await res.json().catch(() => ({}))) as { code?: string; error?: string };
  if (!res.ok || !body.code) throw new Error(body.error ?? `HTTP ${res.status}`);
  return body.code;
}

export class RoomSession implements Session {
  readonly kind = 'room';
  private ws: WebSocket | null = null;
  private token: string;
  private retry = 0;
  private done = false;
  private gotState = false;
  private lastError: string | null = null;
  private ping: ReturnType<typeof setInterval> | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly code: string, private name: string, private ev: SessionEvents) {
    this.token = tokenFor(code);
    this.connect();
  }

  private connect(): void {
    this.ev.status?.(this.retry === 0 ? 'connecting' : 'reconnecting');
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const qs = new URLSearchParams({ token: this.token, name: this.name });
    const ws = new WebSocket(`${proto}://${location.host}/api/rooms/${this.code}/ws?${qs}`);
    this.ws = ws;

    ws.onmessage = (e) => {
      let msg: ServerMsg;
      try {
        msg = JSON.parse(String(e.data));
      } catch {
        return;
      }
      if (msg.t === 'state') {
        this.retry = 0;
        this.gotState = true;
        this.ev.status?.('open');
        this.ev.view(msg.view);
      } else if (msg.t === 'error') {
        this.lastError = msg.msg;
        // Refusals that end the session are reported once, by `ended`.
        const fatal = msg.code === 'NOT_FOUND' || msg.code === 'FULL' || msg.code === 'IN_PROGRESS';
        if (!fatal) this.ev.notice?.(msg.msg);
      }
    };

    ws.onclose = (e) => {
      if (this.ws !== ws) return;
      this.stopPing();
      if (this.done) return;
      const fatal = [CLOSE_NOT_FOUND, CLOSE_FULL, CLOSE_IN_PROGRESS, CLOSE_LEFT].includes(e.code);
      if (fatal) {
        if (e.code !== CLOSE_LEFT) forgetToken(this.code);
        this.finish(this.lastError ?? (e.reason || 'DISCONNECTED'));
        return;
      }
      // Never reached the room at all a few times in a row: give up.
      if (!this.gotState && this.retry >= 3) {
        this.finish('COULD NOT REACH ROOM');
        return;
      }
      this.retry += 1;
      this.ev.status?.('reconnecting');
      const wait = Math.min(1000 * 2 ** (this.retry - 1), 8000);
      this.retryTimer = setTimeout(() => this.connect(), wait);
    };

    ws.onopen = () => {
      this.stopPing();
      this.ping = setInterval(() => this.send({ t: 'ping' }), 25_000);
    };
  }

  private stopPing(): void {
    if (this.ping) clearInterval(this.ping);
    this.ping = null;
  }

  private finish(msg: string | null): void {
    this.done = true;
    this.stopPing();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.ev.ended?.(msg);
  }

  private send(msg: ClientMsg): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  lock(pickId: number): void { this.send({ t: 'lock', pickId }); }
  ready(): void { this.send({ t: 'ready' }); }
  rematch(): void { this.send({ t: 'rematch' }); }
  toLobby(): void { this.send({ t: 'toLobby' }); }
  config(patch: Partial<Config>): void { this.send({ t: 'config', config: patch }); }
  addBot(): void { this.send({ t: 'addBot' }); }
  removeBot(id: string): void { this.send({ t: 'removeBot', id }); }
  start(): void { this.send({ t: 'start' }); }

  leave(): void {
    this.send({ t: 'leave' });
    forgetToken(this.code);
    this.done = true;
    this.stopPing();
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const ws = this.ws;
    setTimeout(() => ws?.close(1000), 50);
    this.ev.ended?.(null);
  }
}
