// Sanity checks for the shared engine: run with `npm test`.
import assert from 'node:assert/strict';
import {
  addBot, addHuman, advance, allLocked, chooseBotPick, lock, newGame, resolveRound, startMatch, toLobby,
} from '../src/shared/engine.ts';
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
addBot(g, 'EASY', 'c');
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

// HARD bot punishes a player who always throws Rock.
const h = newGame({ variantN: 3, rounds: 20, timerSec: 0 });
addHuman(h, 'me', 'ME');
const bot = addBot(h, 'HARD', 'bot')!;
startMatch(h, 0);
let botWins = 0;
for (let r = 0; r < 20; r++) {
  lock(h, 'me', 0);
  lock(h, 'bot', chooseBotPick(h, bot));
  resolveRound(h);
  if (r >= 3 && h.players[1].pickId === 2) botWins++;
  advance(h, 0);
}
assert.ok(botWins >= 14, `HARD bot should read a Rock spammer (won ${botWins}/17)`);

console.log('engine: all checks passed');
