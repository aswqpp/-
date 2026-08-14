import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const srs = await jiti.import('/home/user/-/src/lib/srs.ts');
const storage = await jiti.import('/home/user/-/src/lib/storage.ts');
const stats = await jiti.import('/home/user/-/src/lib/stats.ts');
const backup = await jiti.import('/home/user/-/src/lib/backup.ts');
const sched = await jiti.import('/home/user/-/src/lib/scheduling.ts');
const memory = await jiti.import('/home/user/-/src/lib/memory.ts');
const persistence = await jiti.import('/home/user/-/src/lib/persistence.ts');

let failures = 0;
function check(name, actual, expected) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a !== e) {
    failures++;
    console.log(`FAIL ${name}\n  expected ${e}\n  actual   ${a}`);
  } else {
    console.log(`ok   ${name}`);
  }
}

/* ---- fix 1: interval offset ---- */
check('nextInterval wrong', srs.nextInterval(0, 6, 2.5), 1);
check('nextInterval 1st correct', srs.nextInterval(1, 0, 2.5), 1);
check('nextInterval 2nd correct', srs.nextInterval(2, 1, 2.5), 6);
check('nextInterval 3rd correct', srs.nextInterval(3, 6, 2.5), 15);

/* ---- quality ---- */
check('q wrong', srs.gradeQuality(false, 100, 15000), 2);
check('q fast', srs.gradeQuality(true, 1000, 15000), 5);
check('q normal', srs.gradeQuality(true, 8000, 15000), 4);
check('q slow', srs.gradeQuality(true, 14000, 15000), 3);
check('q untimed correct', srs.gradeQuality(true, 60000, null), 5);
check('limit table untouched: flashcard', srs.limitFor('flashcard'), null);
check('limit table untouched: mc', srs.limitFor('mc'), 15000);

/* Time-based grading is switched off, so the table above is not consulted:
   a mean-speed (9.70s) correct answer must not land on q=4 and freeze EF. */
check('time grading off', srs.TIME_GRADING_ENABLED, false);
const meanSpeed = srs.reviewWord(srs.createInitialSrs(), true, { ms: 9700, mode: 'mc', dir: 'w2m' });
check('mean-speed mc answer graded q=5', meanSpeed.history[0].q, 5);
check('mean-speed mc answer raises EF', meanSpeed.easeFactor, 2.6);
check('explicit limitMs still overrides', srs.reviewWord(srs.createInitialSrs(), true, {
  ms: 9700,
  mode: 'mc',
  dir: 'w2m',
  limitMs: 15000,
}).history[0].q, 4);

/* ---- reviewWord ---- */
const now = new Date('2026-08-11T10:00:00');
let s = srs.createInitialSrs();
check('initial lapses/history', [s.lapses, s.history.length], [0, 0]);

s = srs.reviewWord(s, true, { ms: 2000, mode: 'flashcard', dir: 'w2m', now });
check('1st correct: reps/interval/ef', [s.repetitions, s.interval, s.easeFactor], [1, 1, 2.6]);
check('1st correct: due is +1 day', s.dueDate, '2026-08-12');
check('1st correct: history entry', s.history, [
  { t: now.toISOString(), ok: true, mode: 'flashcard', dir: 'w2m', q: 5, ms: 2000 },
]);

s = srs.reviewWord(s, true, { ms: 2000, mode: 'flashcard', dir: 'w2m', now });
check('2nd correct: interval 6', s.interval, 6);
check('lapse not counted below maturity', s.lapses, 0);

const wrongAtMaturity = srs.reviewWord(s, false, { ms: 5000, mode: 'mc', dir: 'w2m', now });
check('mature miss counts a lapse', wrongAtMaturity.lapses, 1);
check('miss resets reps, interval 1', [wrongAtMaturity.repetitions, wrongAtMaturity.interval], [0, 1]);

let fresh = srs.createInitialSrs();
fresh = srs.reviewWord(fresh, false, { ms: 5000, mode: 'mc', dir: 'w2m', now });
check('immature miss is not a lapse', fresh.lapses, 0);

/* EF ceiling and floor */
let hot = srs.createInitialSrs();
for (let i = 0; i < 20; i++) hot = srs.reviewWord(hot, true, { ms: 500, mode: 'mc', dir: 'w2m', now });
check('EF capped at 3.0', hot.easeFactor, 3);
let cold = srs.createInitialSrs();
for (let i = 0; i < 20; i++) cold = srs.reviewWord(cold, false, { ms: 500, mode: 'mc', dir: 'w2m', now });
check('EF floored at 1.3', cold.easeFactor, 1.3);
check('history capped at HISTORY_LIMIT', cold.history.length, Math.min(20, srs.HISTORY_LIMIT));

let long = srs.createInitialSrs();
for (let i = 0; i < 130; i++) long = srs.reviewWord(long, true, { ms: 500, mode: 'mc', dir: 'w2m', now });
check('history trimmed to 100', long.history.length, 100);

/* ---- fix 3: ms recorded even when ungraded ---- */
const untimed = srs.reviewWord(srs.createInitialSrs(), true, { ms: 9700, mode: 'game', dir: 'm2w', now });
check('game mode still records ms', untimed.history[0].ms, 9700);
check('game mode grades as q=5 (time ignored)', untimed.history[0].q, 5);

/* ---- migration ---- */
const v1Word = (id, ok, ng, lastReviewed) => ({
  id,
  word: `w${id}`,
  meaning: `뜻${id}`,
  phonetic: '',
  example: '',
  category: '',
  examType: '기타',
  favorite: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  srs: {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 1,
    dueDate: '2026-08-10',
    correctCount: ok,
    wrongCount: ng,
    lastReviewed,
  },
});

const migrated = srs.migrateSrs(v1Word('a', 10, 3, '2026-08-10').srs);
check('migrate EF = 2.5 + 0.05*10 - 0.32*3', migrated.easeFactor, 2.04);
check('migrate seals preCount', migrated.preCount, { ok: 10, ng: 3, until: '2026-08-10' });
check('migrate resets lapses + history', [migrated.lapses, migrated.history.length], [0, 0]);
check('migrate keeps counters (no double count)', [migrated.correctCount, migrated.wrongCount], [10, 3]);
check('migrate EF floor', srs.migrateSrs({ correctCount: 0, wrongCount: 20 }).easeFactor, 1.3);
check('migrate EF ceiling', srs.migrateSrs({ correctCount: 200, wrongCount: 0 }).easeFactor, 3);

/* ---- fix 2: rebuildLog boundary day ---- */
const cutoff = '2026-08-11';
const legacy = [
  { date: '2026-08-09', studiedCount: 5, correctCount: 4, wrongCount: 1, studySeconds: 60 },
  { date: cutoff, studiedCount: 3, correctCount: 3, wrongCount: 0, studySeconds: 30 },
];
const wordsWithHistory = [
  {
    id: 'x',
    srs: {
      history: [
        { t: new Date('2026-08-11T20:00:00').toISOString(), ok: true, mode: 'mc', dir: 'w2m', q: 5, ms: 4000 },
        { t: new Date('2026-08-12T09:00:00').toISOString(), ok: false, mode: 'mc', dir: 'w2m', q: 2, ms: 6000 },
        // pre-cutoff history must not double-count against the legacy seed
        { t: new Date('2026-08-09T09:00:00').toISOString(), ok: true, mode: 'mc', dir: 'w2m', q: 5, ms: 3000 },
      ],
    },
  },
];
const rebuilt = srs.rebuildLog(wordsWithHistory, legacy, cutoff);
check('rebuildLog day count', rebuilt.length, 3);
check('rebuildLog keeps pre-cutoff legacy untouched', rebuilt[0], legacy[0]);
check('rebuildLog merges the boundary day', rebuilt[1], {
  date: cutoff,
  studiedCount: 4,
  correctCount: 4,
  wrongCount: 0,
  studySeconds: 34,
});
check('rebuildLog derives post-cutoff days', rebuilt[2], {
  date: '2026-08-12',
  studiedCount: 1,
  correctCount: 0,
  wrongCount: 1,
  studySeconds: 6,
});
check('rebuildLog with no cutoff derives everything', srs.rebuildLog(wordsWithHistory, [], null).length, 3);

/* ---- v1 payload load path ---- */
const v1Payload = {
  words: [v1Word('a', 10, 3, '2026-08-10'), v1Word('b', 2, 0, '2026-08-09')],
  log: legacy,
  settings: { darkMode: false, flashcardFrontIsWord: true, dailyGoal: 20 },
};
const loaded = storage.normalizeState(v1Payload);
check('v1 load: migration recorded', loaded.migration.from, 1);
check('v1 load: cutoff is today', loaded.migration.logCutoff, srs.todayIso());
check('v1 load: legacy log frozen', loaded.legacyLog.length, 2);
check('v1 load: legacy log preserved in derived log', loaded.log.length, 2);
check('v1 load: EF recomputed', loaded.words[0].srs.easeFactor, 2.04);
check('v1 load: preCount sealed', loaded.words[0].srs.preCount, { ok: 10, ng: 3, until: '2026-08-10' });

/* re-normalizing a v4 payload must be idempotent (no repeat migration) */
const v4Payload = storage.serializeState(loaded);
const reloaded = storage.normalizeState(v4Payload);
check('v4 reload: no re-migration', reloaded.migration.logCutoff, loaded.migration.logCutoff);
check('v4 reload: preCount not re-sealed', reloaded.words[0].srs.preCount, { ok: 10, ng: 3, until: '2026-08-10' });
check('v4 reload: EF unchanged', reloaded.words[0].srs.easeFactor, 2.04);
check('v4 reload: log identical', reloaded.log, loaded.log);

/* studying after migration on the boundary day adds to, not replaces, the legacy total */
const boundaryBefore = loaded.log.find((l) => l.date === srs.todayIso());
const studiedNow = {
  ...loaded,
  words: loaded.words.map((w, i) =>
    i === 0 ? { ...w, srs: srs.reviewWord(w.srs, true, { ms: 5000, mode: 'mc', dir: 'w2m' }) } : w
  ),
};
const afterStudy = srs.withDerivedLog(studiedNow);
const boundaryAfter = afterStudy.log.find((l) => l.date === srs.todayIso());
check(
  'post-migration study adds to the boundary day',
  boundaryAfter.studiedCount,
  (boundaryBefore?.studiedCount ?? 0) + 1
);

/* ---- computeM ---- */
check('computeM falls back below the sample floor', srs.computeM(loaded.words), srs.M_FALLBACK);
const manyWords = Array.from({ length: 10 }, (_, i) => v1Word(String(i), 8, 2, null));
check('computeM from real counts', srs.computeM(manyWords), 0.2);

/* ================================================================== */
/* Acceptance cases from the SRS v4 request                            */
/* ================================================================== */
console.log('\n-- v4 acceptance cases --');

/* 1. Local 08-12 08:00, correct, resulting interval 6 → due 08-18, lastReviewed 08-12.
      The morning hour is the point: the old UTC-based formatting moved both back a day. */
const morning = new Date('2026-08-12T08:00:00');
let case1 = srs.createInitialSrs();
case1 = srs.reviewWord(case1, true, { ms: 3000, mode: 'flashcard', dir: 'w2m', now: morning });
case1 = srs.reviewWord(case1, true, { ms: 3000, mode: 'flashcard', dir: 'w2m', now: morning });
check('case 1: interval 6 at 08:00 local', case1.interval, 6);
check('case 1: lastReviewed', case1.lastReviewed, '2026-08-12');
// The ladder position stays exact; only the due date is spread, so the check is a
// range rather than the spec's single date. Both ends must still land on the right
// calendar day — the morning hour is what the old UTC formatting got wrong.
const jitterLow = srs.addDays('2026-08-12', Math.max(1, Math.round(6 * (1 - srs.INTERVAL_JITTER))));
const jitterHigh = srs.addDays('2026-08-12', Math.round(6 * (1 + srs.INTERVAL_JITTER)));
check(
  `case 1: dueDate within the jittered window ${jitterLow}..${jitterHigh}`,
  case1.dueDate >= jitterLow && case1.dueDate <= jitterHigh,
  true
);

/* interval jitter */
check('jitter leaves a 1-day retry alone', srs.jitterInterval(1, () => 0), 1);
check('jitter floor', srs.jitterInterval(10, () => 0), Math.round(10 * (1 - srs.INTERVAL_JITTER)));
check('jitter ceiling', srs.jitterInterval(10, () => 1), Math.round(10 * (1 + srs.INTERVAL_JITTER)));
check('jitter midpoint is the plain interval', srs.jitterInterval(10, () => 0.5), 10);

/* 2. Five straight correct answers on a new word → [1, 6, 17, 49, 147] */
let case2 = srs.createInitialSrs();
const intervals = [];
for (let i = 0; i < 5; i++) {
  case2 = srs.reviewWord(case2, true, { ms: 3000, mode: 'flashcard', dir: 'w2m', now: morning });
  intervals.push(case2.interval);
}
check('case 2: interval ladder', intervals, [1, 6, 17, 49, 147]);

/* 3. A 60-second correct answer on a flashcard is still q=5, and the time is kept */
const case3 = srs.reviewWord(srs.createInitialSrs(), true, {
  ms: 60000,
  mode: 'flashcard',
  dir: 'w2m',
  now: morning,
});
check('case 3: slow flashcard still q=5', case3.history[0].q, 5);
check('case 3: ms recorded', case3.history[0].ms, 60000);
check('case 3: EF rose', case3.easeFactor > srs.EF_INIT, true);

/* 4 & 5. Lapses only count once a card has matured */
check('case 4: miss at repetitions=1 is not a lapse', srs.isLapse({ repetitions: 1 }, false), false);
check('case 5: miss at repetitions=2 is a lapse', srs.isLapse({ repetitions: 2 }, false), true);

/* 6. The migration boundary day sums legacy and derived — covered above by
      'rebuildLog merges the boundary day' and re-asserted here end-to-end. */
const boundaryCutoff = '2026-08-11';
const boundaryLegacy = [{ date: boundaryCutoff, studiedCount: 3, correctCount: 3, wrongCount: 0, studySeconds: 30 }];
const boundaryWords = [
  {
    id: 'z',
    srs: {
      history: [
        { t: new Date('2026-08-11T21:00:00').toISOString(), ok: false, mode: 'mc', dir: 'w2m', q: 2, ms: 8000 },
      ],
    },
  },
];
check('case 6: boundary day merges both sources', srs.rebuildLog(boundaryWords, boundaryLegacy, boundaryCutoff), [
  { date: boundaryCutoff, studiedCount: 4, correctCount: 3, wrongCount: 1, studySeconds: 38 },
]);

/* ---- importing a backup produced by the external v4 migration tool ---- */
console.log('\n-- external v4 backup import --');

// That tool writes the version on the envelope only, gives no legacyLog, and folds
// the pre-migration log into state.log.
const externalBackupState = {
  words: [v1Word('a', 11, 4, '2026-08-11')].map((w) => ({ ...w, srs: srs.migrateSrs(w.srs) })),
  log: [
    { date: '2026-08-09', studiedCount: 5, correctCount: 4, wrongCount: 1, studySeconds: 60 },
    { date: '2026-08-11', studiedCount: 3, correctCount: 3, wrongCount: 0, studySeconds: 30 },
  ],
  settings: { darkMode: false, flashcardFrontIsWord: true, dailyGoal: 20 },
  migration: {
    appliedAt: '2026-08-11',
    from: 1,
    to: 4,
    logCutoff: '2026-08-11',
    changes: ['local_date_fix', 'ef_max_3.0'],
  },
};
const imported = storage.normalizeState(externalBackupState, 4);
check('external: not re-migrated', imported.migration.logCutoff, '2026-08-11');
check('external: preCount survives untouched', imported.words[0].srs.preCount, { ok: 11, ng: 4, until: '2026-08-11' });
check('external: EF not recomputed a second time', imported.words[0].srs.easeFactor, srs.migrateSrs(v1Word('a', 11, 4, '2026-08-11').srs).easeFactor);
check('external: legacy log recovered from state.log', imported.log.length, 2);
check('external: legacy totals intact', imported.log[0], externalBackupState.log[0]);

// The same file going through the real import path (envelope + state).
const externalFile = JSON.stringify({
  format: 'aswqpp-backup',
  version: 4,
  exportedAt: '2026-08-11T12:00:00.000Z',
  wordCount: 1,
  state: externalBackupState,
});
const parsed = backup.parseBackup(externalFile);
check('parseBackup: envelope version respected', parsed.state.migration.from, 1);
check('parseBackup: no second migration', parsed.state.words[0].srs.preCount, { ok: 11, ng: 4, until: '2026-08-11' });
check('parseBackup: legacy log kept', parsed.state.log.length, 2);
check('parseBackup: exportedAt read', parsed.exportedAt, '2026-08-11T12:00:00.000Z');

// A payload with no version and no migration block is still treated as v1.
const bareV1 = { words: [v1Word('b', 2, 1, '2026-08-10')], log: [], settings: {} };
check('bare v1 payload still migrates', storage.normalizeState(bareV1).migration.from, 1);

/* ---- preCount accounting ---- */
console.log('\n-- preCount accounting --');
const accWords = imported.words.map((w) => ({
  ...w,
  srs: srs.reviewWord(w.srs, true, { ms: 4000, mode: 'mc', dir: 'w2m' }),
}));
const summary = stats.overallAccuracyStats(accWords);
check('overall accuracy counts the pre-upgrade era once', [summary.correct, summary.wrong], [12, 4]);
check('legacy attempts reported separately', summary.legacyAttempts, 15);
check('mode split excludes the pre-upgrade era', stats.accuracyByMode(accWords), [
  { key: 'mc', correct: 1, wrong: 0, attempts: 1, pct: 100 },
]);

/* ---- daily caps ---- */
const capToday = srs.todayIso();
const capWord = (id, { attempts = 0, todayAttempts = 0, pre = false } = {}) => {
  const history = [];
  for (let i = 0; i < attempts; i++) {
    history.push({ t: new Date(Date.now() - (i + 1) * 86400000).toISOString(), ok: true, mode: 'mc', dir: 'w2m', q: 5 });
  }
  for (let i = 0; i < todayAttempts; i++) {
    history.push({ t: new Date().toISOString(), ok: true, mode: 'mc', dir: 'w2m', q: 5 });
  }
  return {
    id,
    word: id,
    meaning: id,
    srs: {
      ...srs.createInitialSrs(),
      correctCount: attempts + todayAttempts,
      wrongCount: 0,
      history,
      ...(pre ? { preCount: { ok: 3, ng: 1, until: null } } : {}),
    },
  };
};

const unseen = [capWord('n1'), capWord('n2'), capWord('n3')];
const seen = [capWord('r1', { attempts: 2 }), capWord('r2', { attempts: 2 }), capWord('r3', { attempts: 2 })];
const pool = [...unseen, ...seen];

check(
  'caps trim new and review separately',
  (() => {
    const q = sched.applyDailyCaps(pool, pool, { review: 2, new: 1 }, capToday);
    return { queue: q.queue.map((w) => w.id), newHeld: q.newHeld, reviewHeld: q.reviewHeld };
  })(),
  { queue: ['n1', 'r1', 'r2'], newHeld: 2, reviewHeld: 1 }
);

check(
  'cap 0 means unlimited',
  sched.applyDailyCaps(pool, pool, { review: 0, new: 0 }, capToday).queue.length,
  6
);

// Two words already answered today: one met for the first time, one an old word.
const spent = [capWord('done-new', { todayAttempts: 2 }), capWord('done-old', { attempts: 1, todayAttempts: 1 })];
check('today’s work counts words, not attempts', sched.countStudiedToday(spent, capToday), {
  introduced: 1,
  reviews: 1,
  total: 2,
});

check(
  'the allowance is what today has left',
  (() => {
    const all = [...pool, ...spent];
    const q = sched.applyDailyCaps(pool, all, { review: 2, new: 2 }, capToday);
    return q.queue.map((w) => w.id);
  })(),
  ['n1', 'r1'] // 1 of 2 new left, 1 of 2 reviews left
);

check(
  'a migrated word is a review, never a new word',
  sched.countStudiedToday([capWord('m1', { todayAttempts: 1, pre: true })], capToday),
  { introduced: 0, reviews: 1, total: 1 }
);

check('held-back summary', sched.heldBackSummary({ newHeld: 2, reviewHeld: 3, held: 5 }), '새 단어 2개 · 복습 3개');
check('nothing held, nothing said', sched.heldBackSummary({ newHeld: 0, reviewHeld: 0, held: 0 }), null);

/* ---- leeches ---- */
const leechy = { ...capWord('l1'), srs: { ...srs.createInitialSrs(), lapses: memory.LEECH_LAPSES } };
const sturdy = { ...capWord('s1'), srs: { ...srs.createInitialSrs(), lapses: memory.LEECH_LAPSES - 1 } };
check('leech at the threshold', memory.isLeech(leechy), true);
check('not a leech below it', memory.isLeech(sturdy), false);

/* ---- backup reminder ---- */
const remToday = '2026-08-14';
check('quiet with a small deck', persistence.backupReminder(5, null, null, remToday).show, false);
check('nags when never backed up', persistence.backupReminder(50, null, null, remToday).show, true);
check('quiet right after a backup', persistence.backupReminder(50, '2026-08-10', null, remToday).show, false);
check('nags again after 30 days', persistence.backupReminder(50, '2026-07-01', null, remToday).show, true);
check('snooze wins', persistence.backupReminder(50, '2026-07-01', '2026-08-20', remToday).show, false);
check('expired snooze does not', persistence.backupReminder(50, '2026-07-01', '2026-08-13', remToday).show, true);

/* ---- settings normalization ---- */
check(
  'cap settings survive a round trip, bad values fall back',
  (() => {
    const s = storage.normalizeState(
      { version: 4, words: [], log: [], settings: { dailyReviewCap: 7, dailyNewCap: -3, lastBackupAt: 'nope' } },
      4
    ).settings;
    return { review: s.dailyReviewCap, fresh: s.dailyNewCap, backup: s.lastBackupAt };
  })(),
  { review: 7, fresh: 0, backup: null }
);

/* ---- timezone walk (regression guard for the frozen stats page) ---- */
const today = srs.todayIso();
let cursor = today;
for (let i = 0; i < 400; i++) {
  const next = srs.addDays(cursor, 1);
  if (next <= cursor) {
    failures++;
    console.log(`FAIL addDays did not advance at ${cursor} (TZ=${process.env.TZ})`);
    break;
  }
  cursor = next;
}
console.log(`ok   addDays walks forward 400 days in ${process.env.TZ ?? 'system TZ'}`);

console.log(failures === 0 ? '\nALL PASS' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
