var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/shared/judge.ts
function judge(a, b, n) {
  if (a === b) return "DRAW";
  const diff = (b - a + n) % n;
  return diff <= (n - 1) / 2 ? "WIN" : "LOSE";
}
__name(judge, "judge");

// src/shared/variants.ts
var RPS_101_LIST = [
  { name: "Dynamite", cat: "War", emoji: "\u{1F9E8}" },
  { name: "Tornado", cat: "Nature", emoji: "\u{1F32A}\uFE0F" },
  { name: "Quicksand", cat: "Nature", emoji: "\u{1F3DC}\uFE0F" },
  { name: "Pit", cat: "War", emoji: "\u{1F573}\uFE0F" },
  { name: "Chain", cat: "War", emoji: "\u26D3\uFE0F" },
  { name: "Gun", cat: "War", emoji: "\u{1F52B}" },
  { name: "Law", cat: "People", emoji: "\u2696\uFE0F" },
  { name: "Whip", cat: "War", emoji: "\u{1FAA2}" },
  { name: "Sword", cat: "War", emoji: "\u2694\uFE0F" },
  { name: "Rock", cat: "Nature", emoji: "\u{1FAA8}" },
  { name: "Death", cat: "Myth", emoji: "\u{1F480}" },
  { name: "Wall", cat: "Tech", emoji: "\u{1F9F1}" },
  { name: "Sun", cat: "Nature", emoji: "\u2600\uFE0F" },
  { name: "Camera", cat: "Tech", emoji: "\u{1F4F7}" },
  { name: "Fire", cat: "Nature", emoji: "\u{1F525}" },
  { name: "Chainsaw", cat: "War", emoji: "\u{1FA9A}" },
  { name: "School", cat: "People", emoji: "\u{1F3EB}" },
  { name: "Scissors", cat: "Tech", emoji: "\u2702\uFE0F" },
  { name: "Poison", cat: "War", emoji: "\u{1F9EA}" },
  { name: "Cage", cat: "War", emoji: "\u{1F512}" },
  { name: "Axe", cat: "War", emoji: "\u{1FA93}" },
  { name: "Peace", cat: "Myth", emoji: "\u{1F54A}\uFE0F" },
  { name: "Computer", cat: "Tech", emoji: "\u{1F4BB}" },
  { name: "Castle", cat: "People", emoji: "\u{1F3F0}" },
  { name: "Snake", cat: "Animals", emoji: "\u{1F40D}" },
  { name: "Blood", cat: "Nature", emoji: "\u{1FA78}" },
  { name: "Porcupine", cat: "Animals", emoji: "\u{1F994}" },
  { name: "Vulture", cat: "Animals", emoji: "\u{1F985}" },
  { name: "Monkey", cat: "Animals", emoji: "\u{1F412}" },
  { name: "King", cat: "People", emoji: "\u{1F451}" },
  { name: "Queen", cat: "People", emoji: "\u{1F478}" },
  { name: "Prince", cat: "People", emoji: "\u{1F934}" },
  { name: "Princess", cat: "People", emoji: "\u{1F483}" },
  { name: "Police", cat: "People", emoji: "\u{1F46E}" },
  { name: "Woman", cat: "People", emoji: "\u{1F469}" },
  { name: "Baby", cat: "People", emoji: "\u{1F476}" },
  { name: "Man", cat: "People", emoji: "\u{1F468}" },
  { name: "Home", cat: "People", emoji: "\u{1F3E0}" },
  { name: "Train", cat: "Tech", emoji: "\u{1F686}" },
  { name: "Car", cat: "Tech", emoji: "\u{1F697}" },
  { name: "Noise", cat: "Myth", emoji: "\u{1F4E2}" },
  { name: "Bicycle", cat: "Tech", emoji: "\u{1F6B2}" },
  { name: "Tree", cat: "Nature", emoji: "\u{1F333}" },
  { name: "Turnip", cat: "Nature", emoji: "\u{1F9C5}" },
  { name: "Duck", cat: "Animals", emoji: "\u{1F986}" },
  { name: "Wolf", cat: "Animals", emoji: "\u{1F43A}" },
  { name: "Cat", cat: "Animals", emoji: "\u{1F431}" },
  { name: "Bird", cat: "Animals", emoji: "\u{1F426}" },
  { name: "Fish", cat: "Animals", emoji: "\u{1F41F}" },
  { name: "Spider", cat: "Animals", emoji: "\u{1F577}\uFE0F" },
  { name: "Cockroach", cat: "Animals", emoji: "\u{1FAB3}" },
  { name: "Brain", cat: "People", emoji: "\u{1F9E0}" },
  { name: "Community", cat: "People", emoji: "\u{1F465}" },
  { name: "Cross", cat: "Myth", emoji: "\u271D\uFE0F" },
  { name: "Money", cat: "People", emoji: "\u{1F4B0}" },
  { name: "Vampire", cat: "Myth", emoji: "\u{1F9DB}" },
  { name: "Sponge", cat: "Tech", emoji: "\u{1F9FD}" },
  { name: "Church", cat: "People", emoji: "\u26EA" },
  { name: "Butter", cat: "Tech", emoji: "\u{1F9C8}" },
  { name: "Book", cat: "Tech", emoji: "\u{1F4D6}" },
  { name: "Paper", cat: "Tech", emoji: "\u{1F4C4}" },
  { name: "Cloud", cat: "Nature", emoji: "\u2601\uFE0F" },
  { name: "Airplane", cat: "Tech", emoji: "\u2708\uFE0F" },
  { name: "Moon", cat: "Nature", emoji: "\u{1F319}" },
  { name: "Grass", cat: "Nature", emoji: "\u{1F33F}" },
  { name: "Film", cat: "Tech", emoji: "\u{1F39E}\uFE0F" },
  { name: "Toilet", cat: "Tech", emoji: "\u{1F6BD}" },
  { name: "Air", cat: "Nature", emoji: "\u{1F4A8}" },
  { name: "Planet", cat: "Nature", emoji: "\u{1FA90}" },
  { name: "Guitar", cat: "Tech", emoji: "\u{1F3B8}" },
  { name: "Bowl", cat: "Tech", emoji: "\u{1F963}" },
  { name: "Cup", cat: "Tech", emoji: "\u2615" },
  { name: "Beer", cat: "Tech", emoji: "\u{1F37A}" },
  { name: "Rain", cat: "Nature", emoji: "\u{1F327}\uFE0F" },
  { name: "Water", cat: "Nature", emoji: "\u{1F4A7}" },
  { name: "TV", cat: "Tech", emoji: "\u{1F4FA}" },
  { name: "Rainbow", cat: "Nature", emoji: "\u{1F308}" },
  { name: "UFO", cat: "Myth", emoji: "\u{1F6F8}" },
  { name: "Alien", cat: "Myth", emoji: "\u{1F47D}" },
  { name: "Prayer", cat: "Myth", emoji: "\u{1F64F}" },
  { name: "Mountain", cat: "Nature", emoji: "\u26F0\uFE0F" },
  { name: "Satan", cat: "Myth", emoji: "\u{1F608}" },
  { name: "Dragon", cat: "Myth", emoji: "\u{1F409}" },
  { name: "Diamond", cat: "Tech", emoji: "\u{1F48E}" },
  { name: "Platinum", cat: "Tech", emoji: "\u{1F948}" },
  { name: "Gold", cat: "Tech", emoji: "\u{1F947}" },
  { name: "Devil", cat: "Myth", emoji: "\u{1F479}" },
  { name: "Fence", cat: "Tech", emoji: "\u{1F6A7}" },
  { name: "Video Game", cat: "Tech", emoji: "\u{1F3AE}" },
  { name: "Math", cat: "Myth", emoji: "\u{1F9EE}" },
  { name: "Robot", cat: "Tech", emoji: "\u{1F916}" },
  { name: "Heart", cat: "People", emoji: "\u2764\uFE0F" },
  { name: "Electricity", cat: "Nature", emoji: "\u26A1" },
  { name: "Lightning", cat: "Nature", emoji: "\u{1F329}\uFE0F" },
  { name: "Meditate", cat: "Myth", emoji: "\u{1F9D8}" },
  { name: "Power", cat: "Myth", emoji: "\u{1F4AA}" },
  { name: "Laser", cat: "War", emoji: "\u{1F4A5}" },
  { name: "Nuke", cat: "War", emoji: "\u2622\uFE0F" },
  { name: "Sky", cat: "Nature", emoji: "\u{1F30C}" },
  { name: "Tank", cat: "War", emoji: "\u{1F6E1}\uFE0F" },
  { name: "Helicopter", cat: "War", emoji: "\u{1F681}" }
];
var ITEM_LOOKUP = {};
RPS_101_LIST.forEach((it) => {
  ITEM_LOOKUP[it.name] = it;
});
ITEM_LOOKUP["Lizard"] = { name: "Lizard", cat: "Animals", emoji: "\u{1F98E}" };
ITEM_LOOKUP["Spock"] = { name: "Spock", cat: "People", emoji: "\u{1F596}" };
ITEM_LOOKUP["Human"] = { name: "Human", cat: "People", emoji: "\u{1F9D1}" };
function buildVariantItems(names) {
  return names.map((name, id) => {
    const ref = ITEM_LOOKUP[name] ?? { name, cat: "Tech", emoji: "\u25CF" };
    return { id, name: ref.name, cat: ref.cat, emoji: ref.emoji };
  });
}
__name(buildVariantItems, "buildVariantItems");
var VARIANT_KEYS = [3, 5, 7, 15, 25, 101];
var VARIANTS = {
  3: { n: 3, label: "RPS-3", sub: "3 \xB7 1W", items: buildVariantItems(["Rock", "Scissors", "Paper"]) },
  5: { n: 5, label: "RPS-5", sub: "5 \xB7 2W", items: buildVariantItems(["Rock", "Scissors", "Lizard", "Paper", "Spock"]) },
  7: {
    n: 7,
    label: "RPS-7",
    sub: "7 \xB7 3W",
    items: buildVariantItems(["Rock", "Fire", "Scissors", "Sponge", "Paper", "Air", "Water"])
  },
  15: {
    n: 15,
    label: "RPS-15",
    sub: "15 \xB7 7W",
    items: buildVariantItems([
      "Rock",
      "Fire",
      "Scissors",
      "Snake",
      "Human",
      "Tree",
      "Wolf",
      "Sponge",
      "Paper",
      "Air",
      "Water",
      "Dragon",
      "Devil",
      "Lightning",
      "Gun"
    ])
  },
  25: {
    n: 25,
    label: "RPS-25",
    sub: "25 \xB7 12W",
    items: buildVariantItems([
      "Rock",
      "Sun",
      "Fire",
      "Scissors",
      "Axe",
      "Snake",
      "Monkey",
      "Woman",
      "Man",
      "Tree",
      "Cockroach",
      "Wolf",
      "Sponge",
      "Paper",
      "Moon",
      "Air",
      "Bowl",
      "Water",
      "Alien",
      "Dragon",
      "Devil",
      "Lightning",
      "Nuke",
      "Dynamite",
      "Gun"
    ])
  },
  101: { n: 101, label: "RPS-101", sub: "101 \xB7 50W", items: RPS_101_LIST.map((it, id) => ({ id, ...it })) }
};
function isVariantN(n) {
  return typeof n === "number" && VARIANT_KEYS.includes(n);
}
__name(isVariantN, "isVariantN");

// src/shared/bots.ts
var META = {
  RANDOM: { emoji: "\u{1F3B2}", title: "THE WILDCARD" },
  STUBBORN: { emoji: "\u{1FAA8}", title: "THE STUBBORN" },
  COPYCAT: { emoji: "\u{1F99C}", title: "THE COPYCAT" },
  READER: { emoji: "\u{1F50D}", title: "THE READER" },
  MIRROR: { emoji: "\u{1FA9E}", title: "THE SHADOW" },
  STREAKER: { emoji: "\u{1F525}", title: "THE STREAKER" },
  COUNTER: { emoji: "\u2694\uFE0F", title: "THE CONTRARIAN" },
  CYCLER: { emoji: "\u{1F504}", title: "THE CLOCKWORK" },
  DRIFTER: { emoji: "\u{1F30A}", title: "THE DRIFTER" },
  FAN: { emoji: "\u2B50", title: "THE SUPERFAN" }
};
var PERSONA_IDS = Object.keys(META);
var randInt = /* @__PURE__ */ __name((rng, n) => Math.floor(rng() * n), "randInt");
function shuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
__name(shuffle, "shuffle");
function dealPersonas(s, rng = Math.random) {
  const n = s.config.variantN;
  const items = VARIANTS[s.config.variantN].items;
  const cats = [...new Set(items.map((it) => it.cat))].filter(
    (c) => items.filter((it) => it.cat === c).length >= 2
  );
  const pool = PERSONA_IDS.filter((id) => id !== "FAN" || n >= 15 && cats.length > 0);
  let deck = [];
  for (const bot of s.players.filter((p) => p.bot)) {
    if (deck.length === 0) deck = shuffle(pool, rng);
    const id = deck.pop();
    const others = s.players.filter((p) => p.id !== bot.id);
    const persona = { id };
    if (id === "STUBBORN") {
      const a = randInt(rng, n);
      persona.fav = n > 3 && rng() < 0.6 ? [a, (a + 1 + randInt(rng, n - 1)) % n] : [a];
    }
    if (id === "CYCLER") persona.step = 1 + randInt(rng, n - 1);
    if (id === "FAN") persona.cat = cats[randInt(rng, cats.length)];
    if (id === "MIRROR") persona.target = others[randInt(rng, others.length)]?.id;
    bot.persona = persona;
  }
}
__name(dealPersonas, "dealPersonas");
function revealPersona(s, p) {
  const persona = p.persona;
  if (!p.bot || !persona) return null;
  const items = VARIANTS[s.config.variantN].items;
  const name = /* @__PURE__ */ __name((id) => items[id]?.name.toUpperCase() ?? "?", "name");
  let detail = "";
  switch (persona.id) {
    case "RANDOM":
      detail = "Pure chaos. No pattern to find.";
      break;
    case "STUBBORN":
      detail = `Kept coming back to ${(persona.fav ?? []).map(name).join(" & ")}.`;
      break;
    case "COPYCAT":
      detail = "Copied whoever won the previous round.";
      break;
    case "READER":
      detail = "Studied everyone's habits and threw the counter.";
      break;
    case "MIRROR": {
      const t = s.players.find((x) => x.id === persona.target);
      detail = `Shadowed ${t ? t.name : "a rival"}: repeated their last pick.`;
      break;
    }
    case "STREAKER":
      detail = "Win \u2192 throw it again. Lose \u2192 switch it up.";
      break;
    case "COUNTER":
      detail = "Threw whatever beat last round's most popular pick.";
      break;
    case "CYCLER":
      detail = `Walked the ring ${persona.step} step${persona.step === 1 ? "" : "s"} at a time.`;
      break;
    case "DRIFTER":
      detail = "Drifted to a neighbour of its last pick.";
      break;
    case "FAN":
      detail = `Only had eyes for ${(persona.cat ?? "").toUpperCase()}.`;
      break;
  }
  return { id: persona.id, ...META[persona.id], detail };
}
__name(revealPersona, "revealPersona");
var last = /* @__PURE__ */ __name((p) => p.history[p.history.length - 1], "last");
function lastRoundWins(s) {
  const n = s.config.variantN;
  const out = new Map(s.players.map((p) => [p.id, { w: 0, l: 0 }]));
  const ps = s.players.filter((p) => last(p) !== void 0);
  for (let i = 0; i < ps.length; i++) {
    for (let j = i + 1; j < ps.length; j++) {
      const r = judge(last(ps[i]), last(ps[j]), n);
      if (r === "WIN") {
        out.get(ps[i].id).w++;
        out.get(ps[j].id).l++;
      }
      if (r === "LOSE") {
        out.get(ps[j].id).w++;
        out.get(ps[i].id).l++;
      }
    }
  }
  return out;
}
__name(lastRoundWins, "lastRoundWins");
function popularLastPick(s, bot, rng) {
  const counts = /* @__PURE__ */ new Map();
  for (const p of s.players) {
    const x = last(p);
    if (p.id !== bot.id && x !== void 0) counts.set(x, (counts.get(x) ?? 0) + 1);
  }
  if (counts.size === 0) return void 0;
  const max = Math.max(...counts.values());
  const top = [...counts].filter(([, c]) => c === max).map(([k]) => k);
  return top[randInt(rng, top.length)];
}
__name(popularLastPick, "popularLastPick");
function beaterOf(b, n, rng) {
  const k = 1 + randInt(rng, (n - 1) / 2);
  return (b - k + n) % n;
}
__name(beaterOf, "beaterOf");
function chooseBotPick(s, bot, rng = Math.random) {
  const n = s.config.variantN;
  const random = /* @__PURE__ */ __name(() => randInt(rng, n), "random");
  const persona = bot.persona ?? { id: "RANDOM" };
  const mine = last(bot);
  if (persona.id !== "RANDOM" && rng() < 0.12) return random();
  switch (persona.id) {
    case "RANDOM":
      return random();
    case "STUBBORN": {
      const fav = persona.fav ?? [random()];
      return rng() < 0.85 ? fav[randInt(rng, fav.length)] : random();
    }
    case "COPYCAT": {
      const wins = lastRoundWins(s);
      let best = [];
      let bestW = -1;
      for (const p of s.players) {
        if (p.id === bot.id || last(p) === void 0) continue;
        const w = wins.get(p.id).w;
        if (w > bestW) {
          bestW = w;
          best = [p];
        } else if (w === bestW) best.push(p);
      }
      return best.length ? last(best[randInt(rng, best.length)]) : random();
    }
    case "MIRROR": {
      const t = s.players.find((p) => p.id === persona.target);
      return t && last(t) !== void 0 ? last(t) : random();
    }
    case "STREAKER": {
      if (mine === void 0) return random();
      const r = lastRoundWins(s).get(bot.id);
      if (r.w >= r.l) return mine;
      return (mine + 1 + randInt(rng, n - 1)) % n;
    }
    case "COUNTER": {
      const pop = popularLastPick(s, bot, rng);
      return pop === void 0 ? random() : beaterOf(pop, n, rng);
    }
    case "CYCLER":
      return mine === void 0 ? random() : (mine + (persona.step ?? 1)) % n;
    case "DRIFTER": {
      if (mine === void 0) return random();
      const span = Math.max(1, Math.round(n / 12));
      const off = 1 + randInt(rng, span);
      return (mine + (rng() < 0.5 ? off : -off) + n) % n;
    }
    case "FAN": {
      const items = VARIANTS[s.config.variantN].items.filter((it) => it.cat === persona.cat);
      return items.length ? items[randInt(rng, items.length)].id : random();
    }
    case "READER":
      return readerPick(s, bot, rng);
  }
}
__name(chooseBotPick, "chooseBotPick");
function readerPick(s, bot, rng) {
  const n = s.config.variantN;
  const opponents = s.players.filter((p) => p.id !== bot.id);
  if (!opponents.some((p) => p.history.length > 0)) return randInt(rng, n);
  const score = new Array(n).fill(0);
  for (const o of opponents) {
    const dist = predict(o.history, n);
    for (let c = 0; c < n; c++) {
      let win = 0;
      for (let k = 0; k < n; k++) if (judge(c, k, n) === "WIN") win += dist[k];
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
__name(readerPick, "readerPick");
function predict(history, n) {
  const dist = new Array(n).fill(0.6);
  let w = 1;
  for (let i = history.length - 1; i >= 0; i--) {
    dist[history[i]] += w * 2;
    w *= 0.7;
  }
  const total = dist.reduce((a, b) => a + b, 0);
  return dist.map((v) => v / total);
}
__name(predict, "predict");

// src/shared/protocol.ts
function toView(s, opts) {
  const hidePicks = s.phase === "pick";
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
      persona: s.phase === "podium" ? revealPersona(s, p) : null,
      score: p.score,
      w: p.w,
      d: p.d,
      l: p.l,
      delta: p.delta,
      locked: p.locked,
      pickId: hidePicks && p.id !== opts.youId ? null : p.pickId,
      auto: p.auto,
      ready: p.ready,
      connected: p.bot || opts.connected(p)
    }))
  };
}
__name(toView, "toView");
var CLOSE_NOT_FOUND = 4004;
var CLOSE_FULL = 4009;
var CLOSE_IN_PROGRESS = 4010;
var CLOSE_LEFT = 4e3;
var CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
var CODE_LENGTH = 4;
function normalizeCode(raw) {
  const c = raw.trim().toUpperCase();
  if (c.length !== CODE_LENGTH) return null;
  for (const ch of c) if (!CODE_ALPHABET.includes(ch)) return null;
  return c;
}
__name(normalizeCode, "normalizeCode");

// src/worker/room.ts
import { DurableObject } from "cloudflare:workers";

// src/shared/engine.ts
var BOT_NAMES = ["KAI", "SORA", "MIRA", "REN", "TAO"];
var ROUND_OPTIONS = [3, 5, 7];
var TIMER_OPTIONS = [0, 15, 25, 45];
var MIN_PLAYERS = 2;
var MAX_PLAYERS = 6;
var NAME_MAX = 12;
var DEFAULT_CONFIG = { variantN: 15, rounds: 5, timerSec: 25 };
function newGame(config = DEFAULT_CONFIG) {
  return { config: { ...config }, phase: "lobby", round: 0, deadline: null, players: [] };
}
__name(newGame, "newGame");
function cleanName(raw, fallback = "PLAYER") {
  const s = String(raw ?? "").replace(/[\u0000-\u001f\u007f]/g, "").trim().toUpperCase().slice(0, NAME_MAX);
  return s || fallback;
}
__name(cleanName, "cleanName");
function blankPlayer(id, name, bot) {
  return {
    id,
    name,
    bot,
    persona: null,
    score: 0,
    w: 0,
    d: 0,
    l: 0,
    delta: 0,
    locked: false,
    pickId: null,
    auto: false,
    ready: false,
    history: []
  };
}
__name(blankPlayer, "blankPlayer");
function uniqueName(s, name) {
  const taken = new Set(s.players.map((p) => p.name));
  if (!taken.has(name)) return name;
  for (let i = 2; ; i++) {
    const suffix = String(i);
    const cand = name.slice(0, NAME_MAX - suffix.length) + suffix;
    if (!taken.has(cand)) return cand;
  }
}
__name(uniqueName, "uniqueName");
function addHuman(s, id, name) {
  const p = blankPlayer(id, uniqueName(s, cleanName(name)), false);
  s.players.push(p);
  return p;
}
__name(addHuman, "addHuman");
function addBot(s, id) {
  if (s.players.length >= MAX_PLAYERS) return null;
  const used = new Set(s.players.map((p2) => p2.name));
  const name = BOT_NAMES.find((n) => !used.has(n)) ?? uniqueName(s, "BOT");
  const p = blankPlayer(id, name, true);
  s.players.push(p);
  return p;
}
__name(addBot, "addBot");
function removePlayer(s, id) {
  s.players = s.players.filter((p) => p.id !== id);
}
__name(removePlayer, "removePlayer");
function startMatch(s, now, rng = Math.random) {
  s.round = 0;
  for (const p of s.players) {
    Object.assign(p, { score: 0, w: 0, d: 0, l: 0, delta: 0, history: [], persona: null });
  }
  dealPersonas(s, rng);
  startRound(s, now);
}
__name(startMatch, "startMatch");
function startRound(s, now) {
  s.round += 1;
  s.phase = "pick";
  s.deadline = s.config.timerSec > 0 ? now + s.config.timerSec * 1e3 : null;
  for (const p of s.players) {
    p.locked = false;
    p.pickId = null;
    p.auto = false;
    p.ready = false;
    p.delta = 0;
  }
}
__name(startRound, "startRound");
function lock(s, id, pickId) {
  if (s.phase !== "pick") return false;
  const p = s.players.find((x) => x.id === id);
  if (!p || p.locked) return false;
  if (!Number.isInteger(pickId) || pickId < 0 || pickId >= s.config.variantN) return false;
  p.pickId = pickId;
  p.locked = true;
  return true;
}
__name(lock, "lock");
function allLocked(s) {
  return s.phase === "pick" && s.players.every((p) => p.locked);
}
__name(allLocked, "allLocked");
function computeBouts(players, n) {
  const bouts = [];
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
__name(computeBouts, "computeBouts");
function resolveRound(s, rng = Math.random) {
  if (s.phase !== "pick") return;
  const n = s.config.variantN;
  for (const p of s.players) {
    if (!p.locked || p.pickId === null) {
      p.pickId = Math.floor(rng() * n);
      p.locked = true;
      p.auto = true;
    }
  }
  for (const b of computeBouts(s.players, n)) {
    if (b.res === "WIN") {
      b.left.delta += 1;
      b.left.score += 1;
      b.left.w += 1;
      b.right.l += 1;
    } else if (b.res === "LOSE") {
      b.right.delta += 1;
      b.right.score += 1;
      b.right.w += 1;
      b.left.l += 1;
    } else {
      b.left.d += 1;
      b.right.d += 1;
    }
  }
  for (const p of s.players) p.history.push(p.pickId);
  s.phase = "reveal";
  s.deadline = null;
}
__name(resolveRound, "resolveRound");
function advance(s, now) {
  if (s.phase !== "reveal") return;
  if (s.round >= s.config.rounds) {
    s.phase = "podium";
    s.deadline = null;
  } else {
    startRound(s, now);
  }
}
__name(advance, "advance");
function toLobby(s) {
  s.phase = "lobby";
  s.round = 0;
  s.deadline = null;
  for (const p of s.players) {
    Object.assign(p, {
      score: 0,
      w: 0,
      d: 0,
      l: 0,
      delta: 0,
      locked: false,
      pickId: null,
      auto: false,
      ready: false,
      history: [],
      persona: null
    });
  }
}
__name(toLobby, "toLobby");

// src/worker/room.ts
var EMPTY_TTL_MS = 10 * 60 * 1e3;
var DEADLINE_GRACE_MS = 400;
var Room = class extends DurableObject {
  static {
    __name(this, "Room");
  }
  data = null;
  constructor(ctx, env) {
    super(ctx, env);
    ctx.blockConcurrencyWhile(async () => {
      this.data = await ctx.storage.get("room") ?? null;
    });
  }
  /** Called once by the Worker right after it picks a fresh code. */
  async init(code) {
    if (this.data) return false;
    this.data = {
      code,
      game: newGame(),
      hostId: null,
      seats: {},
      nextId: 1,
      cleanupAt: Date.now() + EMPTY_TTL_MS
    };
    await this.save();
    return true;
  }
  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 426 });
    }
    const url = new URL(request.url);
    const token = (url.searchParams.get("token") ?? "").slice(0, 64);
    const name = url.searchParams.get("name") ?? "";
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];
    const refuse = /* @__PURE__ */ __name((code, msg, close) => {
      server.accept();
      server.send(JSON.stringify({ t: "error", code, msg }));
      server.close(close, msg);
      return new Response(null, { status: 101, webSocket: client });
    }, "refuse");
    const d = this.data;
    if (!d) return refuse("NOT_FOUND", "ROOM NOT FOUND", CLOSE_NOT_FOUND);
    if (token.length < 16) return refuse("BAD_REQUEST", "BAD TOKEN", CLOSE_NOT_FOUND);
    let seatId = d.seats[token];
    if (seatId && !d.game.players.some((p) => p.id === seatId)) {
      delete d.seats[token];
      seatId = void 0;
    }
    if (!seatId) {
      if (d.game.phase !== "lobby") return refuse("IN_PROGRESS", "MATCH IN PROGRESS", CLOSE_IN_PROGRESS);
      if (d.game.players.length >= MAX_PLAYERS) return refuse("FULL", "ROOM IS FULL", CLOSE_FULL);
      seatId = `p${d.nextId++}`;
      addHuman(d.game, seatId, name);
      d.seats[token] = seatId;
    }
    for (const ws of this.socketsFor(seatId)) ws.close(CLOSE_LEFT, "OPENED ELSEWHERE");
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ token, seatId });
    await this.commit();
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, raw) {
    const d = this.data;
    const att = ws.deserializeAttachment();
    if (!d || !att) return;
    let msg;
    try {
      msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    } catch {
      return;
    }
    const me = att.seatId;
    const g = d.game;
    const isHost = d.hostId === me;
    const err = /* @__PURE__ */ __name((code, m) => this.send(ws, { t: "error", code, msg: m }), "err");
    const now = Date.now();
    switch (msg.t) {
      case "ping":
        this.send(ws, { t: "pong" });
        return;
      case "config": {
        if (!isHost) return err("NOT_HOST", "HOST ONLY");
        if (g.phase !== "lobby") return;
        const c = msg.config ?? {};
        if (isVariantN(c.variantN)) g.config.variantN = c.variantN;
        if (typeof c.rounds === "number" && ROUND_OPTIONS.includes(c.rounds)) g.config.rounds = c.rounds;
        if (typeof c.timerSec === "number" && TIMER_OPTIONS.includes(c.timerSec)) g.config.timerSec = c.timerSec;
        break;
      }
      case "addBot":
        if (!isHost) return err("NOT_HOST", "HOST ONLY");
        if (g.phase !== "lobby") return;
        if (!addBot(g, `b${d.nextId++}`)) return err("FULL", "ROOM IS FULL");
        break;
      case "removeBot":
        if (!isHost) return err("NOT_HOST", "HOST ONLY");
        if (g.phase !== "lobby") return;
        if (!g.players.some((p) => p.id === msg.id && p.bot)) return;
        removePlayer(g, msg.id);
        break;
      case "start":
        if (!isHost) return err("NOT_HOST", "HOST ONLY");
        if (g.phase !== "lobby") return;
        if (g.players.length < MIN_PLAYERS) return err("BAD_REQUEST", `NEED ${MIN_PLAYERS}+ PLAYERS`);
        startMatch(g, now);
        this.botsPick();
        break;
      case "lock":
        if (!lock(g, me, Number(msg.pickId))) return;
        break;
      case "ready": {
        if (g.phase !== "reveal") return;
        const p = g.players.find((x) => x.id === me);
        if (p) p.ready = true;
        this.maybeAdvance(now);
        break;
      }
      case "rematch":
        if (!isHost) return err("NOT_HOST", "HOST ONLY");
        if (g.phase !== "podium") return;
        this.dropOfflineHumans();
        if (g.players.length < MIN_PLAYERS) {
          toLobby(g);
          break;
        }
        startMatch(g, now);
        this.botsPick();
        break;
      case "toLobby":
        if (!isHost) return err("NOT_HOST", "HOST ONLY");
        if (g.phase !== "podium") return;
        toLobby(g);
        this.dropOfflineHumans();
        break;
      case "leave":
        this.leave(me, att.token);
        ws.close(CLOSE_LEFT, "LEFT");
        break;
      default:
        return;
    }
    if (allLocked(g)) resolveRound(g);
    await this.commit();
  }
  async webSocketClose(ws) {
    try {
      ws.close(1e3, "BYE");
    } catch {
    }
    const att = ws.deserializeAttachment();
    const d = this.data;
    if (!d || !att) return;
    if (this.socketsFor(att.seatId, ws).length > 0) return;
    if (d.game.phase === "lobby") this.leave(att.seatId, att.token);
    else this.maybeAdvance(Date.now());
    await this.commit(ws);
  }
  async webSocketError(ws) {
    await this.webSocketClose(ws);
  }
  async alarm() {
    const d = this.data;
    if (!d) return;
    const now = Date.now();
    const g = d.game;
    if (g.phase === "pick" && g.deadline !== null && now >= g.deadline) {
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
  leave(seatId, token) {
    const d = this.data;
    if (!d) return;
    const g = d.game;
    if (g.phase === "lobby" || g.phase === "podium") {
      removePlayer(g, seatId);
      delete d.seats[token];
    }
    if (g.phase === "podium" && g.players.filter((p) => !p.bot).length === 0) toLobby(g);
  }
  dropOfflineHumans() {
    const d = this.data;
    for (const p of [...d.game.players]) {
      if (!p.bot && !this.isConnected(p.id)) {
        removePlayer(d.game, p.id);
        for (const [t, s] of Object.entries(d.seats)) if (s === p.id) delete d.seats[t];
      }
    }
  }
  /** Next round once every connected human has pressed NEXT. */
  maybeAdvance(now) {
    const g = this.data.game;
    if (g.phase !== "reveal") return;
    const waiting = g.players.filter((p) => !p.bot && this.isConnected(p.id) && !p.ready);
    const anyone = g.players.some((p) => !p.bot && this.isConnected(p.id));
    if (anyone && waiting.length === 0) {
      advance(g, now);
      this.botsPick();
    }
  }
  botsPick() {
    const g = this.data.game;
    if (g.phase !== "pick") return;
    for (const p of g.players) if (p.bot) lock(g, p.id, chooseBotPick(g, p));
  }
  socketsFor(seatId, except) {
    return this.ctx.getWebSockets().filter((ws) => {
      if (ws === except || ws.readyState !== WebSocket.OPEN) return false;
      const a = ws.deserializeAttachment();
      return a?.seatId === seatId;
    });
  }
  isConnected(seatId, except) {
    return this.socketsFor(seatId, except).length > 0;
  }
  /** Fix the host, schedule the alarm, persist and broadcast. */
  async commit(closing) {
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
      g.phase === "pick" && g.deadline !== null ? g.deadline + DEADLINE_GRACE_MS : null,
      d.cleanupAt
    ].filter((x) => x !== null);
    if (due.length) await this.ctx.storage.setAlarm(Math.min(...due));
    else await this.ctx.storage.deleteAlarm();
    await this.save();
    this.broadcast(closing);
  }
  async save() {
    if (this.data) await this.ctx.storage.put("room", this.data);
  }
  broadcast(except) {
    const d = this.data;
    if (!d) return;
    const now = Date.now();
    for (const ws of this.ctx.getWebSockets()) {
      if (ws === except || ws.readyState !== WebSocket.OPEN) continue;
      const att = ws.deserializeAttachment();
      if (!att) continue;
      const view = toView(d.game, {
        mode: "room",
        code: d.code,
        youId: att.seatId,
        hostId: d.hostId,
        now,
        connected: /* @__PURE__ */ __name((p) => this.isConnected(p.id, except), "connected")
      });
      this.send(ws, { t: "state", view });
    }
  }
  send(ws, msg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
    }
  }
};

// src/worker/index.ts
function randomCode() {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let out = "";
  for (const b of bytes) out += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return out;
}
__name(randomCode, "randomCode");
var json = /* @__PURE__ */ __name((body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json", "cache-control": "no-store" }
}), "json");
var index_default = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (path === "/api/rooms" && request.method === "POST") {
      for (let attempt = 0; attempt < 8; attempt++) {
        const code = randomCode();
        const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
        if (await stub.init(code)) return json({ code });
      }
      return json({ error: "NO FREE CODE, TRY AGAIN" }, 503);
    }
    const m = path.match(/^\/api\/rooms\/([^/]+)\/ws$/);
    if (m) {
      const code = normalizeCode(decodeURIComponent(m[1]));
      if (!code) return json({ error: "BAD CODE" }, 400);
      if (request.headers.get("Upgrade") !== "websocket") return json({ error: "EXPECTED WEBSOCKET" }, 426);
      const stub = env.ROOMS.get(env.ROOMS.idFromName(code));
      return stub.fetch(request);
    }
    if (path.startsWith("/api/")) return json({ error: "NOT FOUND" }, 404);
    return env.ASSETS.fetch(request);
  }
};
export {
  Room,
  index_default as default
};
//# sourceMappingURL=index.js.map
