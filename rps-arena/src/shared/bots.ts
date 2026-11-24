/**
 * Bot personalities. Rock-paper-scissors has no "skill" against a random
 * player, so bots differ by habit instead of difficulty. Every match deals
 * each bot a random persona (kept secret until the podium); spotting a
 * habit is how you beat it.
 */
import type { GameState, Player, Rng } from './engine.ts';
import { judge } from './judge.ts';
import { VARIANTS, type Category } from './variants.ts';

export type PersonaId =
  | 'RANDOM' | 'STUBBORN' | 'COPYCAT' | 'READER' | 'MIRROR'
  | 'STREAKER' | 'COUNTER' | 'CYCLER' | 'DRIFTER' | 'FAN';

export interface Persona {
  id: PersonaId;
  /** Per-match quirks rolled when the persona is dealt. */
  fav?: number[];
  step?: number;
  cat?: Category;
  target?: string;
}

/** What the podium shows once the match is over. */
export interface PersonaReveal {
  id: PersonaId;
  emoji: string;
  title: string;
  detail: string;
}

const META: Record<PersonaId, { emoji: string; title: string }> = {
  RANDOM: { emoji: '🎲', title: 'THE WILDCARD' },
  STUBBORN: { emoji: '🪨', title: 'THE STUBBORN' },
  COPYCAT: { emoji: '🦜', title: 'THE COPYCAT' },
  READER: { emoji: '🔍', title: 'THE READER' },
  MIRROR: { emoji: '🪞', title: 'THE SHADOW' },
  STREAKER: { emoji: '🔥', title: 'THE STREAKER' },
  COUNTER: { emoji: '⚔️', title: 'THE CONTRARIAN' },
  CYCLER: { emoji: '🔄', title: 'THE CLOCKWORK' },
  DRIFTER: { emoji: '🌊', title: 'THE DRIFTER' },
  FAN: { emoji: '⭐', title: 'THE SUPERFAN' },
};

export const PERSONA_IDS = Object.keys(META) as PersonaId[];

const randInt = (rng: Rng, n: number) => Math.floor(rng() * n);

function shuffle<T>(arr: T[], rng: Rng): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Deal a different persona to each bot where possible, with fresh quirks. */
export function dealPersonas(s: GameState, rng: Rng = Math.random): void {
  const n = s.config.variantN;
  const items = VARIANTS[s.config.variantN].items;
  const cats = [...new Set(items.map((it) => it.cat))].filter(
    (c) => items.filter((it) => it.cat === c).length >= 2,
  );
  // FAN needs categories worth loving; tiny variants have none.
  const pool = PERSONA_IDS.filter((id) => id !== 'FAN' || (n >= 15 && cats.length > 0));
  let deck: PersonaId[] = [];
  for (const bot of s.players.filter((p) => p.bot)) {
    if (deck.length === 0) deck = shuffle(pool, rng);
    const id = deck.pop() as PersonaId;
    const others = s.players.filter((p) => p.id !== bot.id);
    const persona: Persona = { id };
    if (id === 'STUBBORN') {
      const a = randInt(rng, n);
      persona.fav = n > 3 && rng() < 0.6 ? [a, (a + 1 + randInt(rng, n - 1)) % n] : [a];
    }
    if (id === 'CYCLER') persona.step = 1 + randInt(rng, n - 1);
    if (id === 'FAN') persona.cat = cats[randInt(rng, cats.length)];
    if (id === 'MIRROR') persona.target = others[randInt(rng, others.length)]?.id;
    bot.persona = persona;
  }
}

export function revealPersona(s: GameState, p: Player): PersonaReveal | null {
  const persona = p.persona;
  if (!p.bot || !persona) return null;
  const items = VARIANTS[s.config.variantN].items;
  const name = (id: number) => items[id]?.name.toUpperCase() ?? '?';
  let detail = '';
  switch (persona.id) {
    case 'RANDOM': detail = 'Pure chaos. No pattern to find.'; break;
    case 'STUBBORN': detail = `Kept coming back to ${(persona.fav ?? []).map(name).join(' & ')}.`; break;
    case 'COPYCAT': detail = 'Copied whoever won the previous round.'; break;
    case 'READER': detail = "Studied everyone's habits and threw the counter."; break;
    case 'MIRROR': {
      const t = s.players.find((x) => x.id === persona.target);
      detail = `Shadowed ${t ? t.name : 'a rival'}: repeated their last pick.`;
      break;
    }
    case 'STREAKER': detail = 'Win → throw it again. Lose → switch it up.'; break;
    case 'COUNTER': detail = "Threw whatever beat last round's most popular pick."; break;
    case 'CYCLER': detail = `Walked the ring ${persona.step} step${persona.step === 1 ? '' : 's'} at a time.`; break;
    case 'DRIFTER': detail = 'Drifted to a neighbour of its last pick.'; break;
    case 'FAN': detail = `Only had eyes for ${(persona.cat ?? '').toUpperCase()}.`; break;
  }
  return { id: persona.id, ...META[persona.id], detail };
}

/* ------------------------------------------------------------------------- */

const last = (p: Player): number | undefined => p.history[p.history.length - 1];

/** Wins each player scored in the previous round, rebuilt from histories. */
function lastRoundWins(s: GameState): Map<string, { w: number; l: number }> {
  const n = s.config.variantN;
  const out = new Map(s.players.map((p) => [p.id, { w: 0, l: 0 }]));
  const ps = s.players.filter((p) => last(p) !== undefined);
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const r = judge(last(ps[i])!, last(ps[j])!, n);
      if (r === 'WIN') { out.get(ps[i].id)!.w++; out.get(ps[j].id)!.l++; }
      if (r === 'LOSE') { out.get(ps[j].id)!.w++; out.get(ps[i].id)!.l++; }
    }
  }
  return out;
}

/** Most common previous-round pick among the others (ties broken at random). */
function popularLastPick(s: GameState, bot: Player, rng: Rng): number | undefined {
  const counts = new Map<number, number>();
  for (const p of s.players) {
    const x = last(p);
    if (p.id !== bot.id && x !== undefined) counts.set(x, (counts.get(x) ?? 0) + 1);
  }
  if (counts.size === 0) return undefined;
  const max = Math.max(...counts.values());
  const top = [...counts].filter(([, c]) => c === max).map(([k]) => k);
  return top[randInt(rng, top.length)];
}

/** An item that beats `b`, chosen among the ones that do. */
function beaterOf(b: number, n: number, rng: Rng): number {
  const k = 1 + randInt(rng, (n - 1) / 2);
  return (b - k + n) % n;
}

export function chooseBotPick(s: GameState, bot: Player, rng: Rng = Math.random): number {
  const n = s.config.variantN;
  const random = () => randInt(rng, n);
  const persona = bot.persona ?? { id: 'RANDOM' as const };
  const mine = last(bot);
  // A little noise keeps every habit beatable but not perfectly scripted.
  if (persona.id !== 'RANDOM' && rng() < 0.12) return random();

  switch (persona.id) {
    case 'RANDOM':
      return random();

    case 'STUBBORN': {
      const fav = persona.fav ?? [random()];
      return rng() < 0.85 ? fav[randInt(rng, fav.length)] : random();
    }

    case 'COPYCAT': {
      const wins = lastRoundWins(s);
      let best: Player[] = [];
      let bestW = -1;
      for (const p of s.players) {
        if (p.id === bot.id || last(p) === undefined) continue;
        const w = wins.get(p.id)!.w;
        if (w > bestW) { bestW = w; best = [p]; } else if (w === bestW) best.push(p);
      }
      return best.length ? last(best[randInt(rng, best.length)])! : random();
    }

    case 'MIRROR': {
      const t = s.players.find((p) => p.id === persona.target);
      return t && last(t) !== undefined ? last(t)! : random();
    }

    case 'STREAKER': {
      if (mine === undefined) return random();
      const r = lastRoundWins(s).get(bot.id)!;
      if (r.w >= r.l) return mine;
      return (mine + 1 + randInt(rng, n - 1)) % n;
    }

    case 'COUNTER': {
      const pop = popularLastPick(s, bot, rng);
      return pop === undefined ? random() : beaterOf(pop, n, rng);
    }

    case 'CYCLER':
      return mine === undefined ? random() : (mine + (persona.step ?? 1)) % n;

    case 'DRIFTER': {
      if (mine === undefined) return random();
      const span = Math.max(1, Math.round(n / 12));
      const off = 1 + randInt(rng, span);
      return (mine + (rng() < 0.5 ? off : -off) + n) % n;
    }

    case 'FAN': {
      const items = VARIANTS[s.config.variantN].items.filter((it) => it.cat === persona.cat);
      return items.length ? items[randInt(rng, items.length)].id : random();
    }

    case 'READER':
      return readerPick(s, bot, rng);
  }
}

/**
 * Model each opponent's next pick from their recency-weighted history and
 * throw the item expected to beat the most of them (soft-sampled).
 */
function readerPick(s: GameState, bot: Player, rng: Rng): number {
  const n = s.config.variantN;
  const opponents = s.players.filter((p) => p.id !== bot.id);
  if (!opponents.some((p) => p.history.length > 0)) return randInt(rng, n);

  const score = new Array<number>(n).fill(0);
  for (const o of opponents) {
    const dist = predict(o.history, n);
    for (let c = 0; c < n; c++) {
      let win = 0;
      for (let k = 0; k < n; k++) if (judge(c, k, n) === 'WIN') win += dist[k];
      score[c] += win;
    }
  }
  const temp = 0.12 * Math.max(1, opponents.length / 2);
  const max = Math.max(...score);
  const weights = score.map((v) => Math.exp((v - max) / temp));
  let r = rng() * weights.reduce((a, b) => a + b, 0);
  for (let c = 0; c < n; c++) {
    r -= weights[c];
    if (r <= 0) return c;
  }
  return n - 1;
}

function predict(history: number[], n: number): number[] {
  const dist = new Array<number>(n).fill(0.6);
  let w = 1;
  for (let i = history.length - 1; i >= 0; i--) {
    dist[history[i]] += w * 2;
    w *= 0.7;
  }
  const total = dist.reduce((a, b) => a + b, 0);
  return dist.map((v) => v / total);
}
