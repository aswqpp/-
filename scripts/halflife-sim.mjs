/**
 * Simulation harness for the half-life difficulty model.
 *
 * Imports the module the app actually ships, generates review logs from a known
 * truth under the app's own scheduler, and reports how much of that truth comes
 * back out. Run it after touching lib/halflife.ts or the scheduler.
 *
 *   npm run check:halflife
 */
import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const hl = await jiti.import(new URL('../src/lib/halflife.ts', import.meta.url).pathname);
const srs = await jiti.import(new URL('../src/lib/srs.ts', import.meta.url).pathname);

const DAY_MS = 86400000;
const MU_TRUE = Math.log2(20); // deck-average half-life of 20 days
const SIGMA_TRUE = 1.2; // log2 units
const PRACTICE_TRUE = 0.35; // each consecutive correct answer stretches the half-life

let seed = 987654321;
function rand() {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
}
function randn() {
  return Math.sqrt(-2 * Math.log(rand() + 1e-12)) * Math.cos(2 * Math.PI * rand());
}

function nextInterval(reps, prev, ef) {
  if (reps <= 0) return 1;
  if (reps === 1) return 1;
  if (reps === 2) return 6;
  return Math.max(1, Math.round(prev * ef));
}

/**
 * Runs a deck through the app's ladder. `mode` decides the guessing floor actually
 * present in the generated data; `jitter` is the spread applied to due dates.
 */
function simulate({
  words = 400,
  days = 400,
  perDay = 40,
  jitter = srs.INTERVAL_JITTER,
  mode = 'mc',
  options = 4,
  /** Share of reviews deliberately pushed out to `probeStretch` times the interval. */
  probeRate = 0,
  probeStretch = 2.5,
}) {
  const start = Date.now() - days * DAY_MS;
  const guess = mode === 'mc' || mode === 'listening' ? 1 / options : 0;

  const deck = Array.from({ length: words }, (_, i) => ({
    id: `w${i}`,
    trueB: randn() * SIGMA_TRUE,
    ef: 2.5,
    reps: 0,
    interval: 0,
    due: 0,
    last: null,
    history: [],
  }));

  for (let day = 0; day < days; day++) {
    for (const w of deck.filter((x) => x.due <= day).slice(0, perDay)) {
      const dt = w.last === null ? 1 : day - w.last;
      const h = 2 ** (MU_TRUE + w.trueB + PRACTICE_TRUE * Math.min(6, w.reps));
      const p = guess + (1 - guess) * 2 ** (-Math.max(dt, 0.01) / h);
      const ok = rand() < p;

      w.history.push({
        t: new Date(start + day * DAY_MS).toISOString(),
        ok,
        mode,
        dir: 'w2m',
        q: ok ? 5 : 2,
        ms: 8000,
        ...(guess > 0 ? { opt: options } : {}),
      });

      w.ef = Math.min(3, Math.max(1.3, w.ef + (ok ? 0.1 : -0.32)));
      w.reps = ok ? w.reps + 1 : 0;
      w.interval = nextInterval(w.reps, w.interval || 1, w.ef);
      let scheduled = jitter ? w.interval * (1 + (rand() * 2 - 1) * jitter) : w.interval;
      if (probeRate && w.reps >= 3 && rand() < probeRate) scheduled *= probeStretch;
      w.due = day + Math.max(1, Math.round(scheduled));
      w.last = day;
      w.intervals = w.intervals ?? [];
      w.intervals.push(w.interval);
    }
  }

  return deck.map((w) => ({
    id: w.id,
    word: w.id,
    meaning: w.id,
    trueB: w.trueB,
    intervals: w.intervals ?? [],
    srs: {
      easeFactor: w.ef,
      interval: w.interval,
      repetitions: w.reps,
      dueDate: '2026-01-01',
      correctCount: w.history.filter((h) => h.ok).length,
      wrongCount: w.history.filter((h) => !h.ok).length,
      lastReviewed: null,
      lapses: 0,
      history: w.history,
    },
  }));
}

function correlation(pairs) {
  if (pairs.length < 3) return 0;
  const mx = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
  const my = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (const [x, y] of pairs) {
    sxy += (x - mx) * (y - my);
    sxx += (x - mx) ** 2;
    syy += (y - my) ** 2;
  }
  return sxy / Math.sqrt(sxx * syy || 1);
}

function report(label, deck, model) {
  const pairs = [];
  let hard = 0;
  let easy = 0;
  let unsure = 0;
  let unrated = 0;
  let wrongCalls = 0;
  let calls = 0;

  for (const w of deck) {
    const est = model.estimates.get(w.id);
    if (!est) {
      unrated++;
      continue;
    }
    pairs.push([w.trueB, est.b]);

    if (est.verdict === 'hard') {
      hard++;
      calls++;
      if (w.trueB > 0) wrongCalls++; // called hard, actually above average
    } else if (est.verdict === 'easy') {
      easy++;
      calls++;
      if (w.trueB < 0) wrongCalls++;
    } else unsure++;
  }

  const decided = hard + easy;
  console.log(
    `${label.padEnd(30)} 판정 ${String(decided).padStart(3)}/${deck.length} ` +
      `(${((decided / deck.length) * 100).toFixed(0).padStart(2)}%)  ` +
      `어려움 ${String(hard).padStart(3)} 쉬움 ${String(easy).padStart(3)} ` +
      `미확정 ${String(unsure).padStart(3)} 미평가 ${String(unrated).padStart(3)} | ` +
      `오분류 ${calls ? ((wrongCalls / calls) * 100).toFixed(1) : '0.0'}% | ` +
      `corr ${correlation(pairs).toFixed(2)} | ` +
      `μ̂ ${model.mu.toFixed(2)} σ̂ ${model.sigma.toFixed(2)} 연습효과 ${model.beta[1].toFixed(2)}`
  );
  return { decided, corr: correlation(pairs) };
}

console.log(
  `참값: μ ${MU_TRUE.toFixed(2)} (반감기 20일) · σ ${SIGMA_TRUE} · 연습효과 ${PRACTICE_TRUE}\n` +
    `판정 기준: |b| > ${hl.VERDICT_MARGIN_SIGMA}σ 를 사후확률 ${hl.VERDICT_CONFIDENCE} 이상으로 확신할 때\n`
);

console.log('── 1. 데이터가 쌓이는 정도에 따라 ──');
for (const [label, cfg] of [
  ['갓 시작 (~2회/단어)', { days: 60, perDay: 12 }],
  ['몇 달 사용 (~8회/단어)', { days: 200, perDay: 25 }],
  ['성숙 (~25회/단어)', { days: 700, perDay: 45 }],
]) {
  const deck = simulate(cfg);
  const obs = deck.reduce((s, w) => s + w.srs.history.length, 0);
  const model = hl.fitDeck(deck);
  report(`${label} [${obs}시도]`, deck, model);
}

console.log('\n── 2. 간격 흔들기(jitter)의 효과 ──');
for (const j of [0, 0.15, 0.25, 0.4]) {
  const deck = simulate({ days: 700, perDay: 45, jitter: j });
  report(`jitter ±${(j * 100).toFixed(0)}%`, deck, hl.fitDeck(deck));
}

console.log('\n── 3. 찍기 하한 (4지선다 g=0.25) ──');
{
  const deck = simulate({ days: 700, perDay: 45, mode: 'mc', options: 4 });
  report('opt 기록됨 (모형 반영)', deck, hl.fitDeck(deck));

  // Same data with the option count stripped, as pre-upgrade attempts will look.
  const stripped = deck.map((w) => ({
    ...w,
    srs: { ...w.srs, history: w.srs.history.map(({ opt: _opt, ...rest }) => rest) },
  }));
  report('opt 없음 (4로 가정)', stripped, hl.fitDeck(stripped));

  const openRecall = simulate({ days: 700, perDay: 45, mode: 'spelling' });
  report('스펠링 (찍기 불가)', openRecall, hl.fitDeck(openRecall));
}

console.log('\n── 4. σ 갱신 방식 ──');
{
  const deck = simulate({ days: 700, perDay: 45 });
  const model = hl.fitDeck(deck);
  console.log(
    `   EM 갱신 σ² = mean(b̂² + var) → σ̂ ${model.sigma.toFixed(2)} (참값 ${SIGMA_TRUE})` +
      `${model.sigma <= hl.SIGMA_MIN + 1e-9 ? '  ⚠ 하한에 붙음' : ''}`
  );
  const spread = [...model.estimates.values()].map((e) => e.b);
  const mean = spread.reduce((s, b) => s + b, 0) / spread.length;
  const sd = Math.sqrt(spread.reduce((s, b) => s + (b - mean) ** 2, 0) / spread.length);
  console.log(`   참고: sd(b̂)만 쓰면 ${sd.toFixed(2)} — 축소된 추정치라 참값보다 작다`);
}

console.log('\n── 5. b̂ 분포와 관측 수의 비대칭 ──');
{
  const deck = simulate({ days: 700, perDay: 45 });
  const model = hl.fitDeck(deck);
  const margin = hl.VERDICT_MARGIN_SIGMA * model.sigma;
  const rows = deck
    .map((w) => ({ w, e: model.estimates.get(w.id) }))
    .filter((r) => r.e)
    .sort((a, b) => a.w.trueB - b.w.trueB);

  const slice = (from, to) => rows.slice(Math.floor(rows.length * from), Math.floor(rows.length * to));
  for (const [label, from, to] of [
    ['가장 어려운 20%', 0, 0.2],
    ['중간 20%', 0.4, 0.6],
    ['가장 쉬운 20%', 0.8, 1],
  ]) {
    const part = slice(from, to);
    const obs = part.reduce((s, r) => s + r.e.observations, 0) / part.length;
    const se = part.reduce((s, r) => s + r.e.se, 0) / part.length;
    const b = part.reduce((s, r) => s + r.e.b, 0) / part.length;
    const called = part.filter((r) => r.e.verdict !== 'unsure').length;
    console.log(
      `   ${label.padEnd(12)} 참b ${(part.reduce((s, r) => s + r.w.trueB, 0) / part.length)
        .toFixed(2)
        .padStart(5)} → b̂ ${b.toFixed(2).padStart(5)} | 관측 ${obs.toFixed(1).padStart(5)}회 | se ${se.toFixed(2)} | 판정 ${called}/${part.length}`
    );
  }
  console.log(`   판정 문턱: |b̂| > ${margin.toFixed(2)} 를 확신해야 함`);
}

console.log('\n── 6. 확신도 문턱을 낮추면 ──');
{
  const deck = simulate({ days: 700, perDay: 45 });
  const model = hl.fitDeck(deck);
  for (const conf of [0.6, 0.7, 0.75, 0.85]) {
    let called = 0;
    let wrong = 0;
    for (const w of deck) {
      const e = model.estimates.get(w.id);
      if (!e) continue;
      const hard = e.pHard >= conf;
      const easy = e.pEasy >= conf;
      if (!hard && !easy) continue;
      called++;
      if (hard && w.trueB > 0) wrong++;
      if (easy && w.trueB < 0) wrong++;
    }
    console.log(
      `   확신도 ≥ ${conf} → 판정 ${String(called).padStart(3)}/400 (${((called / 400) * 100).toFixed(0)}%), ` +
        `오분류 ${called ? ((wrong / called) * 100).toFixed(1) : '0.0'}%`
    );
  }
}

console.log('\n── 7. 예상 기억률의 보정 ──');
{
  const deck = simulate({ days: 700, perDay: 45 });
  const model = hl.fitDeck(deck);
  // Replay each word's last observation and compare the predicted recall to reality.
  const buckets = new Map();
  for (const w of deck) {
    const est = model.estimates.get(w.id);
    if (!est) continue;
    const h = w.srs.history;
    for (let i = 1; i < h.length; i++) {
      const dt = (new Date(h[i].t) - new Date(h[i - 1].t)) / DAY_MS;
      if (dt < 1 / 24) continue;
      const pred = 2 ** (-dt / est.halfLifeDays);
      const key = Math.min(9, Math.floor(pred * 10));
      const b = buckets.get(key) ?? { n: 0, ok: 0, pred: 0 };
      b.n++;
      b.pred += pred;
      if (h[i].ok) b.ok++;
      buckets.set(key, b);
    }
  }
  for (const key of [...buckets.keys()].sort((a, b) => a - b)) {
    const b = buckets.get(key);
    if (b.n < 30) continue;
    console.log(
      `   예측 ${((b.pred / b.n) * 100).toFixed(0).padStart(3)}% → 실제 ${((b.ok / b.n) * 100)
        .toFixed(0)
        .padStart(3)}%  (${b.n}회)`
    );
  }
}

console.log('\n── 8. 가끔 일부러 늦게 물어보면 (긴 간격 탐침) ──');
for (const [rate, stretch] of [
  [0, 1],
  [0.05, 2.5],
  [0.1, 2.5],
  [0.1, 4],
]) {
  const deck = simulate({ days: 700, perDay: 45, probeRate: rate, probeStretch: stretch });
  const model = hl.fitDeck(deck);
  const rows = deck.map((w) => ({ w, e: model.estimates.get(w.id) })).filter((r) => r.e);
  const easiest = rows.sort((a, b) => b.w.trueB - a.w.trueB).slice(0, 80);
  const meanBEasy = easiest.reduce((s, r) => s + r.e.b, 0) / easiest.length;
  const accuracy = deck.reduce((s, w) => s + w.srs.correctCount, 0) /
    deck.reduce((s, w) => s + w.srs.correctCount + w.srs.wrongCount, 0);
  const label = rate === 0 ? '탐침 없음' : `${(rate * 100).toFixed(0)}%를 ${stretch}배로`;
  report(label.padEnd(18), deck, model);
  console.log(
    `      └ 가장 쉬운 20%의 b̂ 평균 ${meanBEasy.toFixed(2)} (참값 +1.50) · 전체 정답률 ${(accuracy * 100).toFixed(1)}%`
  );
}

console.log('\n── 9. 예상 기억률: 반감기 모형 vs 현재 SM-2 간격 방식 ──');
{
  const deck = simulate({ days: 700, perDay: 45 });
  const model = hl.fitDeck(deck);
  const DECAY = -Math.log(0.9);
  let mAbs = 0;
  let sAbs = 0;
  let n = 0;
  for (const w of deck) {
    const est = model.estimates.get(w.id);
    if (!est) continue;
    const h = w.srs.history;
    for (let i = 1; i < h.length; i++) {
      const dt = (new Date(h[i].t) - new Date(h[i - 1].t)) / DAY_MS;
      if (dt < 1 / 24) continue;
      const trueP = 2 ** (-dt / 2 ** (MU_TRUE + w.trueB + PRACTICE_TRUE * Math.min(6, i)));
      const pModel = 2 ** (-dt / est.halfLifeDays);
      const pSrs = Math.exp((-dt * DECAY) / Math.max(1, w.intervals[i - 1] ?? 1));
      mAbs += Math.abs(pModel - trueP);
      sAbs += Math.abs(pSrs - trueP);
      n++;
    }
  }
  console.log(`   반감기 모형 평균 절대 오차 ${(mAbs / n).toFixed(3)}`);
  console.log(`   현재 SM-2 방식  평균 절대 오차 ${(sAbs / n).toFixed(3)}   (${n}회 비교)`);
}

console.log('\n── 10. 보정 (판정된 단어가 실제로 그런가) ──');
{
  const deck = simulate({ days: 700, perDay: 45 });
  const model = hl.fitDeck(deck);
  const buckets = [
    [0.75, 0.85],
    [0.85, 0.95],
    [0.95, 1.01],
  ];
  for (const [lo, hi] of buckets) {
    let n = 0;
    let right = 0;
    for (const w of deck) {
      const est = model.estimates.get(w.id);
      if (!est || est.verdict === 'unsure') continue;
      if (est.confidence < lo || est.confidence >= hi) continue;
      n++;
      const truthHard = w.trueB < 0;
      if ((est.verdict === 'hard') === truthHard) right++;
    }
    console.log(
      `   확신도 ${(lo * 100).toFixed(0)}–${(hi * 100).toFixed(0)}% → 실제 적중 ` +
        `${n ? ((right / n) * 100).toFixed(0) : '-'}% (${n}개)`
    );
  }
}
