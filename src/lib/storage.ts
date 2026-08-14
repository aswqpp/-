import type {
  AppSettings,
  AppState,
  ExamType,
  MigrationInfo,
  PreCount,
  ReviewDirection,
  ReviewEvent,
  ReviewMode,
  StudyLogEntry,
  Word,
} from '../types';
import { createInitialSrs, HISTORY_LIMIT, migrateState, STATE_VERSION, withDerivedLog } from './srs';

const STORAGE_KEY = 'voca-app-state-v1';

export const DEFAULT_DAILY_GOAL = 20;
export const DEFAULT_AT_RISK_THRESHOLD = 0.8;

const EXAM_TYPES: ExamType[] = ['TOEIC', 'TOEFL', '수능', '공무원', '일상회화', '기타'];
const REVIEW_MODES: ReviewMode[] = ['mc', 'listening', 'spelling', 'flashcard', 'game'];
const REVIEW_DIRECTIONS: ReviewDirection[] = ['w2m', 'm2w'];

function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : fallback;
}

function num(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}

function strArray(v: unknown): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  const items = v.filter((x): x is string => typeof x === 'string' && x.trim() !== '');
  return items.length > 0 ? items : undefined;
}

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** One recorded attempt. Entries without a usable timestamp are dropped — the log is keyed on it. */
function normalizeReviewEvent(raw: unknown): ReviewEvent | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const t = str(r.t);
  if (!t || Number.isNaN(new Date(t).getTime())) return null;

  const event: ReviewEvent = {
    t,
    ok: r.ok === true,
    mode: REVIEW_MODES.includes(r.mode as ReviewMode) ? (r.mode as ReviewMode) : 'flashcard',
    dir: REVIEW_DIRECTIONS.includes(r.dir as ReviewDirection) ? (r.dir as ReviewDirection) : 'w2m',
    q: num(r.q, r.ok === true ? 5 : 2),
  };
  if (typeof r.ms === 'number' && Number.isFinite(r.ms) && r.ms >= 0) event.ms = r.ms;
  if (typeof r.opt === 'number' && Number.isFinite(r.opt) && r.opt >= 2) event.opt = Math.round(r.opt);
  return event;
}

function normalizePreCount(raw: unknown): PreCount | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  return {
    ok: Math.max(0, num(r.ok, 0)),
    ng: Math.max(0, num(r.ng, 0)),
    until: typeof r.until === 'string' ? r.until : null,
  };
}

/**
 * Coerces one persisted/imported record into a valid Word.
 * The schema has grown over time (favorite, note, synonyms, history...), so payloads
 * written by older builds — or hand-edited backup files — are missing fields.
 * Returns null for records too malformed to be useful.
 */
export function normalizeWord(raw: unknown): Word | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;

  const word = str(r.word).trim();
  const meaning = str(r.meaning).trim();
  if (!word || !meaning) return null;

  const rawSrs = (typeof r.srs === 'object' && r.srs !== null ? r.srs : {}) as Record<string, unknown>;
  const base = createInitialSrs();

  const history = Array.isArray(rawSrs.history)
    ? rawSrs.history
        .map(normalizeReviewEvent)
        .filter((e): e is ReviewEvent => e !== null)
        .slice(-HISTORY_LIMIT)
    : [];

  return {
    id: str(r.id) || genId(),
    word,
    phonetic: str(r.phonetic),
    partOfSpeech: str(r.partOfSpeech) || undefined,
    meaning,
    example: str(r.example),
    exampleTranslation: str(r.exampleTranslation) || undefined,
    category: str(r.category),
    examType: EXAM_TYPES.includes(r.examType as ExamType) ? (r.examType as ExamType) : '기타',
    favorite: r.favorite === true,
    note: str(r.note) || undefined,
    synonyms: strArray(r.synonyms),
    antonyms: strArray(r.antonyms),
    createdAt: str(r.createdAt) || new Date().toISOString(),
    srs: {
      easeFactor: num(rawSrs.easeFactor, base.easeFactor),
      interval: num(rawSrs.interval, base.interval),
      repetitions: num(rawSrs.repetitions, base.repetitions),
      dueDate: str(rawSrs.dueDate) || base.dueDate,
      correctCount: num(rawSrs.correctCount, 0),
      wrongCount: num(rawSrs.wrongCount, 0),
      lastReviewed: typeof rawSrs.lastReviewed === 'string' ? rawSrs.lastReviewed : null,
      lapses: Math.max(0, num(rawSrs.lapses, 0)),
      history,
      preCount: normalizePreCount(rawSrs.preCount),
    },
  };
}

function normalizeLogEntry(raw: unknown): StudyLogEntry | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const date = str(r.date);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  return {
    date,
    studiedCount: num(r.studiedCount, 0),
    correctCount: num(r.correctCount, 0),
    wrongCount: num(r.wrongCount, 0),
    studySeconds: Math.max(0, Math.round(num(r.studySeconds, 0))),
  };
}

function normalizeLog(raw: unknown): StudyLogEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeLogEntry).filter((l): l is StudyLogEntry => l !== null);
}

function normalizeSettings(raw: unknown): AppSettings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const goal = Math.round(num(r.dailyGoal, DEFAULT_DAILY_GOAL));
  return {
    darkMode: r.darkMode === true,
    flashcardFrontIsWord: r.flashcardFrontIsWord !== false,
    dailyGoal: Math.min(500, Math.max(1, goal)),
    autoSpeak: r.autoSpeak !== false,
    autoSpeakExample: r.autoSpeakExample === true,
    atRiskThreshold: Math.min(0.95, Math.max(0, num(r.atRiskThreshold, DEFAULT_AT_RISK_THRESHOLD))),
  };
}

function normalizeMigration(raw: unknown): MigrationInfo | undefined {
  if (typeof raw !== 'object' || raw === null) return undefined;
  const r = raw as Record<string, unknown>;
  const logCutoff = str(r.logCutoff);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logCutoff)) return undefined;
  return {
    appliedAt: str(r.appliedAt) || logCutoff,
    from: num(r.from, 1),
    to: num(r.to, STATE_VERSION),
    logCutoff,
    changes: strArray(r.changes) ?? [],
  };
}

/**
 * Reads any state payload this app has ever written and returns a current one.
 * Anything below STATE_VERSION goes through the one-way v1 → v4 migration, which
 * freezes the old log so the heatmap and streaks survive the upgrade.
 *
 * `fallbackVersion` covers backup files that carry the schema version on the file
 * envelope rather than inside `state` — without it a v4 file would be read as v1
 * and migrated a second time, resealing preCount over the real counters.
 */
export function normalizeState(raw: unknown, fallbackVersion?: number): AppState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.words)) return null;

  const migration = normalizeMigration(r.migration);
  // A payload carrying a migration block has already been through the upgrade,
  // whatever its envelope claims.
  const version = num(r.version, migration ? migration.to : (fallbackVersion ?? 1));

  const log = normalizeLog(r.log);
  const state: AppState = {
    words: r.words.map(normalizeWord).filter((w): w is Word => w !== null),
    log,
    // Migrated externally (no legacyLog field): its `log` *is* the frozen legacy
    // record, since migrated words have no history to derive anything from.
    // rebuildLog drops anything past the cutoff, so nothing gets counted twice.
    legacyLog: Array.isArray(r.legacyLog) ? normalizeLog(r.legacyLog) : migration ? log : [],
    migration,
    settings: normalizeSettings(r.settings),
  };

  if (version < STATE_VERSION) return migrateState(state, version);
  return withDerivedLog(state);
}

/** The on-disk / in-file shape: the state plus the schema version that wrote it. */
export function serializeState(state: AppState): Record<string, unknown> {
  return { version: STATE_VERSION, ...state };
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export interface SaveOutcome {
  ok: boolean;
  /** User-facing reason, set only when the write failed. */
  error?: string;
}

/**
 * Persists the state, reporting failure instead of swallowing it.
 *
 * Review history made overflow a real possibility (~3.4MB of history at 400 words
 * against a ~5MB budget), and a silent failure looks exactly like a working app
 * right up until the tab is closed and the day's studying is gone.
 */
export function saveState(state: AppState): SaveOutcome {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializeState(state)));
    return { ok: true };
  } catch (err) {
    const quota =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED');
    return {
      ok: false,
      error: quota
        ? '저장 공간이 가득 차서 방금 학습한 내용이 저장되지 않았어요. 설정 → 데이터 백업에서 파일로 내보낸 뒤, 안 쓰는 단어를 정리해주세요.'
        : '이 브라우저에 데이터를 저장할 수 없어요. 시크릿 모드이거나 저장소가 차단된 상태일 수 있어요. 지금 학습한 내용은 창을 닫으면 사라집니다.',
    };
  }
}
