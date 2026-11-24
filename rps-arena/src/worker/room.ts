/**
 * One Durable Object per room code. It owns the authoritative GameState,
 * keeps other players' picks hidden until the reveal, runs the pick timer
 * with an alarm, and plays the bot seats. WebSockets use the hibernation
 * API, so an idle room costs nothing between messages.
 */
import { DurableObject } from 'cloudflare:workers';
import {
  BOT_LEVELS, MAX_PLAYERS, MIN_PLAYERS, ROUND_OPTIONS, TIMER_OPTIONS,
  addBot, addHuman, advance, allLocked, chooseBotPick, lock, newGame,
  removePlayer, resolveRound, startMatch, toLobby,
  type BotLevel, type GameState,
} from '../shared/engine';
import {
  CLOSE_FULL, CLOSE_IN_PROGRESS, CLOSE_LEFT, CLOSE_NOT_FOUND,
  toView, type ClientMsg, type ErrorCode, type ServerMsg,
} from '../shared/protocol';
import { isVariantN } from '../shared/variants';

/** How long an empty room is kept before it is wiped. */
const EMPTY_TTL_MS = 10 * 60 * 1000;
/** Small grace so a lock sent right at 0s still counts. */
const DEADLINE_GRACE_MS = 400;

interface RoomData {
  code: string;
  game: GameState;
  hostId: string | null;
  /** Secret reconnect token → public seat id. */
  seats: Record<string, string>;
  nextId: number;
  cleanupAt: number | null;
}

interface Attachment {
  token: string;
  seatId: string;
}

export class Room extends DurableObject<Env> {
  private data: RoomData | null = null;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.data = (await ctx.storage.get<RoomData>('room')) ?? null;
    });
  }

  /** Called once by the Worker right after it picks a fresh code. */
  async init(code: string): Promise<boolean> {
    if (this.data) return false;
    this.data = {
      code,
      game: newGame(),
      hostId: null,
      seats: {},
      nextId: 1,
      cleanupAt: Date.now() + EMPTY_TTL_MS,
    };
    await this.save();
    return true;
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get('Upgrade') !== 'websocket') {
      return new Response('Expected WebSocket', { status: 426 });
    }
    const url = new URL(request.url);
    const token = (url.searchParams.get('token') ?? '').slice(0, 64);
    const name = url.searchParams.get('name') ?? '';

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    const refuse = (code: ErrorCode, msg: string, close: number) => {
      server.accept();
      server.send(JSON.stringify({ t: 'error', code, msg } satisfies ServerMsg));
      server.close(close, msg);
      return new Response(null, { status: 101, webSocket: client });
    };

    const d = this.data;
    if (!d) return refuse('NOT_FOUND', 'ROOM NOT FOUND', CLOSE_NOT_FOUND);
    if (token.length < 16) return refuse('BAD_REQUEST', 'BAD TOKEN', CLOSE_NOT_FOUND);

    let seatId = d.seats[token];
    if (seatId && !d.game.players.some((p) => p.id === seatId)) {
      delete d.seats[token];
      seatId = undefined as unknown as string;
    }
    if (!seatId) {
      if (d.game.phase !== 'lobby') return refuse('IN_PROGRESS', 'MATCH IN PROGRESS', CLOSE_IN_PROGRESS);
      if (d.game.players.length >= MAX_PLAYERS) return refuse('FULL', 'ROOM IS FULL', CLOSE_FULL);
      seatId = `p${d.nextId++}`;
      addHuman(d.game, seatId, name);
      d.seats[token] = seatId;
    }

    // One live socket per seat: a new tab takes the seat over.
    for (const ws of this.socketsFor(seatId)) ws.close(CLOSE_LEFT, 'OPENED ELSEWHERE');

    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ token, seatId } satisfies Attachment);

    await this.commit();
    return new Response(null, { status: 101, webSocket: client });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer): Promise<void> {
    const d = this.data;
    const att = ws.deserializeAttachment() as Attachment | null;
    if (!d || !att) return;
    let msg: ClientMsg;
    try {
      msg = JSON.parse(typeof raw === 'string' ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    const me = att.seatId;
    const g = d.game;
    const isHost = d.hostId === me;
    const err = (code: ErrorCode, m: string) => this.send(ws, { t: 'error', code, msg: m });
    const now = Date.now();

    switch (msg.t) {
      case 'ping':
        this.send(ws, { t: 'pong' });
        return;

      case 'config': {
        if (!isHost) return err('NOT_HOST', 'HOST ONLY');
        if (g.phase !== 'lobby') return;
        const c = msg.config ?? {};
        if (isVariantN(c.variantN)) g.config.variantN = c.variantN;
        if (typeof c.rounds === 'number' && ROUND_OPTIONS.includes(c.rounds)) g.config.rounds = c.rounds;
        if (typeof c.timerSec === 'number' && TIMER_OPTIONS.includes(c.timerSec)) g.config.timerSec = c.timerSec;
        break;
      }

      case 'addBot':
        if (!isHost) return err('NOT_HOST', 'HOST ONLY');
        if (g.phase !== 'lobby') return;
        if (!BOT_LEVELS.includes(msg.level as BotLevel)) return;
        if (!addBot(g, msg.level, `b${d.nextId++}`)) return err('FULL', 'ROOM IS FULL');
        break;

      case 'removeBot':
        if (!isHost) return err('NOT_HOST', 'HOST ONLY');
        if (g.phase !== 'lobby') return;
        if (!g.players.some((p) => p.id === msg.id && p.bot)) return;
        removePlayer(g, msg.id);
        break;

      case 'start':
        if (!isHost) return err('NOT_HOST', 'HOST ONLY');
        if (g.phase !== 'lobby') return;
        if (g.players.length < MIN_PLAYERS) return err('BAD_REQUEST', `NEED ${MIN_PLAYERS}+ PLAYERS`);
        startMatch(g, now);
        this.botsPick();
        break;

      case 'lock':
        if (!lock(g, me, Number(msg.pickId))) return;
        break;

      case 'ready': {
        if (g.phase !== 'reveal') return;
        const p = g.players.find((x) => x.id === me);
        if (p) p.ready = true;
        this.maybeAdvance(now);
        break;
      }

      case 'rematch':
        if (!isHost) return err('NOT_HOST', 'HOST ONLY');
        if (g.phase !== 'podium') return;
        this.dropOfflineHumans();
        if (g.players.length < MIN_PLAYERS) {
          toLobby(g);
          break;
        }
        startMatch(g, now);
        this.botsPick();
        break;

      case 'toLobby':
        if (!isHost) return err('NOT_HOST', 'HOST ONLY');
        if (g.phase !== 'podium') return;
        toLobby(g);
        this.dropOfflineHumans();
        break;

      case 'leave':
        this.leave(me, att.token);
        ws.close(CLOSE_LEFT, 'LEFT');
        break;

      default:
        return;
    }

    if (allLocked(g)) resolveRound(g);
    await this.commit();
  }

  async webSocketClose(ws: WebSocket): Promise<void> {
    try {
      ws.close(1000, 'BYE');
    } catch {
      /* already closed */
    }
    const att = ws.deserializeAttachment() as Attachment | null;
    const d = this.data;
    if (!d || !att) return;
    if (this.socketsFor(att.seatId, ws).length > 0) return; // still open in another tab
    // In the lobby a closed tab gives the seat up; mid-match the seat is kept
    // so a refresh can reclaim it (the timer auto-picks meanwhile).
    if (d.game.phase === 'lobby') this.leave(att.seatId, att.token);
    else this.maybeAdvance(Date.now());
    await this.commit(ws);
  }

  async webSocketError(ws: WebSocket): Promise<void> {
    await this.webSocketClose(ws);
  }

  async alarm(): Promise<void> {
    const d = this.data;
    if (!d) return;
    const now = Date.now();
    const g = d.game;
    if (g.phase === 'pick' && g.deadline !== null && now >= g.deadline) {
      resolveRound(g);
    }
    if (d.cleanupAt !== null && now >= d.cleanupAt && this.ctx.getWebSockets().length === 0) {
      this.data = null;
      await this.ctx.storage.deleteAlarm();
      await this.ctx.storage.deleteAll();
      return;
    }
    await this.commit();
  }

  /* ----------------------------------------------------------------------- */

  private leave(seatId: string, token: string): void {
    const d = this.data;
    if (!d) return;
    const g = d.game;
    if (g.phase === 'lobby' || g.phase === 'podium') {
      removePlayer(g, seatId);
      delete d.seats[token];
    }
    if (g.phase === 'podium' && g.players.filter((p) => !p.bot).length === 0) toLobby(g);
  }

  private dropOfflineHumans(): void {
    const d = this.data!;
    for (const p of [...d.game.players]) {
      if (!p.bot && !this.isConnected(p.id)) {
        removePlayer(d.game, p.id);
        for (const [t, s] of Object.entries(d.seats)) if (s === p.id) delete d.seats[t];
      }
    }
  }

  /** Next round once every connected human has pressed NEXT. */
  private maybeAdvance(now: number): void {
    const g = this.data!.game;
    if (g.phase !== 'reveal') return;
    const waiting = g.players.filter((p) => !p.bot && this.isConnected(p.id) && !p.ready);
    const anyone = g.players.some((p) => !p.bot && this.isConnected(p.id));
    if (anyone && waiting.length === 0) {
      advance(g, now);
      this.botsPick();
    }
  }

  private botsPick(): void {
    const g = this.data!.game;
    if (g.phase !== 'pick') return;
    for (const p of g.players) if (p.bot) lock(g, p.id, chooseBotPick(g, p));
  }

  private socketsFor(seatId: string, except?: WebSocket): WebSocket[] {
    return this.ctx.getWebSockets().filter((ws) => {
      if (ws === except || ws.readyState !== WebSocket.OPEN) return false;
      const a = ws.deserializeAttachment() as Attachment | null;
      return a?.seatId === seatId;
    });
  }

  private isConnected(seatId: string, except?: WebSocket): boolean {
    return this.socketsFor(seatId, except).length > 0;
  }

  /** Fix the host, schedule the alarm, persist and broadcast. */
  private async commit(closing?: WebSocket): Promise<void> {
    const d = this.data;
    if (!d) return;
    const g = d.game;
    const humans = g.players.filter((p) => !p.bot);
    const online = humans.filter((p) => this.isConnected(p.id, closing));

    if (!d.hostId || !online.some((p) => p.id === d.hostId)) {
      d.hostId = online[0]?.id ?? humans[0]?.id ?? null;
    }
    if (online.length === 0) {
      d.cleanupAt ??= Date.now() + EMPTY_TTL_MS;
    } else {
      d.cleanupAt = null;
    }

    const due = [
      g.phase === 'pick' && g.deadline !== null ? g.deadline + DEADLINE_GRACE_MS : null,
      d.cleanupAt,
    ].filter((x): x is number => x !== null);
    if (due.length) await this.ctx.storage.setAlarm(Math.min(...due));
    else await this.ctx.storage.deleteAlarm();

    await this.save();
    this.broadcast(closing);
  }

  private async save(): Promise<void> {
    if (this.data) await this.ctx.storage.put('room', this.data);
  }

  private broadcast(except?: WebSocket): void {
    const d = this.data;
    if (!d) return;
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except || ws.readyState !== WebSocket.OPEN) continue;
      const att = ws.deserializeAttachment() as Attachment | null;
      if (!att) continue;
      const view = toView(d.game, {
        mode: 'room',
        code: d.code,
        youId: att.seatId,
        hostId: d.hostId,
        now,
        connected: (p) => this.isConnected(p.id, except),
      });
      this.send(ws, { t: 'state', view });
    }
  }

  private send(ws: WebSocket, msg: ServerMsg): void {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
      /* socket already gone */
    }
  }
}
