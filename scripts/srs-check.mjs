import { createJiti } from 'jiti';

const jiti = createJiti(import.meta.url);
const srs = await jiti.import('/home/user/-/src/lib/srs.ts');
const storage = await jiti.import('/home/user/-/src/lib/storage.ts');

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
check('limit flashcard', srs.limitFor('flashcard'), null);
check('limit mc', srs.limitFor('mc'), 15000);

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
