import type { AppSettings, AppState, ExamType, StudyLogEntry, Word } from '../types';
import { createInitialSrs } from './srs';

const STORAGE_KEY = 'voca-app-state-v1';

export const DEFAULT_DAILY_GOAL = 20;

const EXAM_TYPES: ExamType[] = ['TOEIC', 'TOEFL', '수능', '공무원', '일상회화', '기타'];

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

/**
 * Coerces one persisted/imported record into a valid Word.
 * The schema has grown over time (favorite, note, synonyms...), so payloads
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

function normalizeSettings(raw: unknown): AppSettings {
  const r = (typeof raw === 'object' && raw !== null ? raw : {}) as Record<string, unknown>;
  const goal = Math.round(num(r.dailyGoal, DEFAULT_DAILY_GOAL));
  return {
    darkMode: r.darkMode === true,
    flashcardFrontIsWord: r.flashcardFrontIsWord !== false,
    dailyGoal: Math.min(500, Math.max(1, goal)),
  };
}

export function normalizeState(raw: unknown): AppState | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const r = raw as Record<string, unknown>;
  if (!Array.isArray(r.words)) return null;

  return {
    words: r.words.map(normalizeWord).filter((w): w is Word => w !== null),
    log: Array.isArray(r.log) ? r.log.map(normalizeLogEntry).filter((l): l is StudyLogEntry => l !== null) : [],
    settings: normalizeSettings(r.settings),
  };
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

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage full or unavailable - ignore, app continues in-memory
  }
}
