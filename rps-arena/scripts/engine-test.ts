// Sanity checks for the shared engine: run with `npm test`.
import assert from 'node:assert/strict';
import {
  addBot, addHuman, advance, allLocked, lock, newGame, resolveRound, startMatch, toLobby, type GameState,
} from '../src/shared/engine.ts';
import { PERSONA_IDS, chooseBotPick, revealPersona, type PersonaId } from '../src/shared/bots.ts';
import { judge, matchups } from '../src/shared/judge.ts';
import { toView } from '../src/shared/protocol.ts';
import { VARIANTS, VARIANT_KEYS } from '../src/shared/variants.ts';

// Every variant is a fair circle: each item beats exactly half the others.
for (const k of VARIANT_KEYS) {
  const v = VARIANTS[k];
  assert.equal(v.items.length, k, `RPS-${k} size`);
  assert.equal(new Set(v.items.map((i) => i.name)).size, k, `RPS-${k} unique names`);
  for (let a = 0; a < k; a++) {
    let wins = 0;
    for (let b = 0; b < k; b++) {
      if (a === b) continue;
      const r = judge(a, b, k);
      assert.equal(judge(b, a, k), r === 'WIN' ? 'LOSE' : 'WIN', 'antisymmetric');
      if (r === 'WIN') wins++;
    }
    assert.equal(wins, (k - 1) / 2);
    assert.equal(matchups(v.items, a).beats.length, (k - 1) / 2);
  }
}
assert.equal(judge(0, 1, 3), 'WIN'); // Rock beats Scissors
assert.equal(judge(2, 0, 3), 'WIN'); // Paper beats Rock

// A 3-player round: scores, W/D/L and auto-pick on timeout.
const g = newGame({ variantN: 3, rounds: 2, timerSec: 25 });
addHuman(g, 'a', 'ann');
addHuman(g, 'b', 'ANN'); // duplicate name gets a suffix
addBot(g, 'c');
assert.deepEqual(g.players.map((p) => p.name), ['ANN', 'ANN2', 'KAI']);
startMatch(g, 1000);
assert.equal(g.phase, 'pick');
assert.equal(g.deadline, 26000);
assert.ok(lock(g, 'a', 0)); // Rock
assert.ok(!lock(g, 'a', 1), 'cannot relock');
assert.ok(!lock(g, 'b', 7), 'out of range');
assert.ok(lock(g, 'b', 1)); // Scissors

const hidden = toView(g, { mode: 'room', code: 'ABCD', youId: 'a', hostId: 'a', now: 0, connected: () => true });
assert.equal(hidden.players[0].pickId, 0, 'own pick visible');
assert.equal(hidden.players[1].pickId, null, 'other picks hidden during pick');

assert.ok(!allLocked(g));
resolveRound(g, () => 0.9); // bot times out → Paper
assert.equal(g.phase, 'reveal');
const [a, b, c] = g.players;
assert.equal(c.pickId, 2);
assert.ok(c.auto);
// Rock>Scissors, Scissors>Paper, Paper>Rock: everyone 1W 1L
for (const p of [a, b, c]) assert.deepEqual([p.score, p.w, p.d, p.l], [1, 1, 0, 1]);
assert.deepEqual(a.history, [0]);
advance(g, 2000);
assert.equal(g.round, 2);
assert.equal(g.phase, 'pick');
assert.equal(a.pickId, null);
resolveRound(g, () => 0);
advance(g, 3000);
assert.equal(g.phase, 'podium');
toLobby(g);
assert.equal(g.players[0].score, 0);

// Personas: dealt at start, distinct, secret until the podium, and each has a real habit.
const pg = newGame({ variantN: 101, rounds: 3, timerSec: 0 });
addHuman(pg, 'me', 'ME');
for (let i = 0; i < 5; i++) addBot(pg, `b${i}`);
startMatch(pg, 0);
const dealt = pg.players.filter((p) => p.bot).map((p) => p.persona!.id);
assert.equal(new Set(dealt).size, 5, 'personas are distinct within a match');
const midView = toView(pg, { mode: 'solo', code: null, youId: 'me', hostId: 'me', now: 0, connected: () => true });
assert.ok(midView.players.every((p) => p.persona === null), 'personas hidden mid-match');
while (pg.phase !== 'podium') {
  for (const p of pg.players) lock(pg, p.id, p.bot ? chooseBotPick(pg, p) : 0);
  resolveRound(pg);
  advance(pg, 0);
}
const endView = toView(pg, { mode: 'solo', code: null, youId: 'me', hostId: 'me', now: 0, connected: () => true });
assert.ok(endView.players.filter((p) => p.bot).every((p) => p.persona && p.persona.detail.length > 0), 'revealed on podium');

/** Play `rounds` rounds of one persona bot vs a human who always throws `human`. */
function habit(id: PersonaId, n: 3 | 15, human = 0, rounds = 200): GameState {
  const g = newGame({ variantN: n, rounds, timerSec: 0 });
  addHuman(g, 'me', 'ME');
  const b = addBot(g, 'bot')!;
  startMatch(g, 0);
  b.persona = { id, fav: [4], step: 3, cat: 'Nature', target: 'me' };
  for (let r = 0; r < rounds; r++) {
    lock(g, 'me', human);
    lock(g, 'bot', chooseBotPick(g, b));
    resolveRound(g);
    advance(g, 0);
  }
  return g;
}
const share = (xs: number[], f: (x: number, i: number) => boolean) => xs.filter(f).length / xs.length;
const botHist = (g: GameState) => g.players[1].history;
assert.ok(share(botHist(habit('STUBBORN', 15)), (x) => x === 4) > 0.65, 'STUBBORN repeats its favourite');
assert.ok(share(botHist(habit('MIRROR', 15, 6)).slice(1), (x) => x === 6) > 0.75, 'MIRROR copies its target');
assert.ok(share(botHist(habit('COPYCAT', 15, 6)).slice(1), (x) => x === 6) > 0.75, 'COPYCAT copies the winner');
assert.ok(share(botHist(habit('READER', 3)).slice(3), (x) => x === 2) > 0.7, 'READER counters a Rock spammer');
const cyc = botHist(habit('CYCLER', 15));
assert.ok(share(cyc.slice(1), (x, i) => x === (cyc[i] + 3) % 15) > 0.75, 'CYCLER steps around the ring');
const fan = botHist(habit('FAN', 15));
assert.ok(share(fan, (x) => ['Nature'].includes(['Rock', 'Fire', 'Scissors', 'Snake', 'Human', 'Tree', 'Wolf', 'Sponge', 'Paper', 'Air', 'Water', 'Dragon', 'Devil', 'Lightning', 'Gun'].map((nm) => ({ Rock: 'Nature', Fire: 'Nature', Tree: 'Nature', Water: 'Nature', Air: 'Nature', Lightning: 'Nature' } as Record<string, string>)[nm] ?? '')[x])) > 0.8, 'FAN sticks to its category');
for (const id of PERSONA_IDS) {
  const g = habit(id, 15, 0, 5);
  assert.ok(revealPersona(g, g.players[1])?.detail, `${id} has a reveal line`);
}

console.log('engine: all checks passed');
