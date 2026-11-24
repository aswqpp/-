/** App-wide state: what the server/engine says (view) + local UI state. */
import type { Bout, BotLevel, Config } from '../shared/engine';
import type { GameView, PlayerView } from '../shared/protocol';
import { VARIANTS, type Variant, type VariantN } from '../shared/variants';
import type { NetStatus, Session } from './session';

export type Tab = 'PLAY' | 'RING';
export type LobbyMode = 'SOLO' | 'ROOM';
export type Screen = 'lobby' | 'room' | 'pick' | 'reveal' | 'podium' | 'ring';

export const app = {
  tab: 'PLAY' as Tab,
  lobbyMode: 'SOLO' as LobbyMode,
  name: '',
  solo: { variantN: 15 as VariantN, rounds: 5, timerSec: 25, bots: 3, level: 'NORMAL' as BotLevel },
  session: null as Session | null,
  view: null as GameView | null,
  /** serverNow - Date.now() at the last view, to read deadlines correctly. */
  clockOffset: 0,
  net: 'open' as NetStatus,
  busy: false,
};

export const ui = {
  // pick
  selectedId: null as number | null,
  wlOverlay: true,
  pickCategory: 'All',
  pickSearch: '',
  inspTab: 'BEATS' as 'BEATS' | 'LOSES',
  // reveal
  allBouts: [] as Bout<PlayerView>[],
  myBouts: [] as Bout<PlayerView>[],
  stripMode: 'MINE' as 'MINE' | 'ALL',
  activeBoutIndex: 0,
  isAutoPlaying: false,
  choreoTimers: [] as ReturnType<typeof setTimeout>[],
  // ring atlas
  ringVariantN: 15 as VariantN,
  ringSelectedId: 0,
  ringHoverId: null as number | null,
  ringSideTab: 'BEATS' as 'BEATS' | 'LOSES',
  /** `${phase}:${round}` of the last view, to spot phase changes. */
  phaseKey: '',
};

export function currentScreen(): Screen {
  if (app.tab === 'RING') return 'ring';
  if (!app.session) return 'lobby';
  const phase = app.view?.phase ?? 'lobby';
  return phase === 'lobby' ? 'room' : phase;
}

export function me(): PlayerView | undefined {
  return app.view?.players.find((p) => p.id === app.view?.youId);
}

export function isMe(p: { id: string }): boolean {
  return p.id === app.view?.youId;
}

export function isHost(): boolean {
  return !!app.view && app.view.hostId === app.view.youId;
}

export function activeConfig(): Config {
  return app.view?.config ?? app.solo;
}

export function activeVariant(): Variant {
  return VARIANTS[activeConfig().variantN];
}

/** Score desc, then wins, then you first (matches the original tiebreak). */
export function sortedPlayers(): PlayerView[] {
  const ps = app.view?.players ?? [];
  return [...ps].sort((a, b) => b.score - a.score || b.w - a.w || (isMe(a) ? -1 : isMe(b) ? 1 : 0));
}

export function clearChoreoTimers(): void {
  ui.choreoTimers.forEach(clearTimeout);
  ui.choreoTimers = [];
}

let renderer: () => void = () => {};
export function setRenderer(fn: () => void): void {
  renderer = fn;
}
/** Re-render the whole current screen. */
export function render(): void {
  renderer();
}

export function botTag(level: BotLevel | null): string {
  return level ? `BOT · ${level}` : '';
}
