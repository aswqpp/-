import type { AppState, Word } from '../types';
import { normalizeState } from './storage';

const BACKUP_FORMAT = 'aswqpp-backup';
const BACKUP_VERSION = 1;

interface BackupFile {
  format: string;
  version: number;
  exportedAt: string;
  wordCount: number;
  state: AppState;
}

export function buildBackup(state: AppState): BackupFile {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    wordCount: state.words.length,
    state,
  };
}

/** Triggers a download of the whole app state as a JSON file. */
export function downloadBackup(state: AppState): string {
  const fileName = `aswqpp-backup-${new Date().toISOString().slice(0, 10)}.json`;
  const blob = new Blob([JSON.stringify(buildBackup(state), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click has definitely been dispatched.
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return fileName;
}

export interface ParsedBackup {
  state: AppState;
  exportedAt: string | null;
}

/**
 * Accepts either a full backup file or a bare AppState object, so a slightly
 * hand-edited or older file still restores instead of hard-failing.
 */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error('JSON 형식이 아니에요. 내보내기로 저장한 파일이 맞는지 확인해주세요.');
  }

  const container = raw as Record<string, unknown> | null;
  const candidate =
    container && typeof container === 'object' && 'state' in container ? container.state : raw;

  const state = normalizeState(candidate);
  if (!state) {
    throw new Error('백업 파일을 읽을 수 없어요. 이 앱에서 내보낸 파일인지 확인해주세요.');
  }
  if (state.words.length === 0) {
    throw new Error('파일에 복원할 단어가 없어요.');
  }

  const exportedAt =
    container && typeof container.exportedAt === 'string' ? container.exportedAt : null;
  return { state, exportedAt };
}

export interface MergeResult {
  words: Word[];
  added: number;
  skipped: number;
}

/** Merges imported words into the existing list, skipping ones already present (by spelling + meaning). */
export function mergeWords(existing: Word[], incoming: Word[]): MergeResult {
  const seen = new Set(existing.map((w) => `${w.word.trim().toLowerCase()}|${w.meaning.trim()}`));
  const existingIds = new Set(existing.map((w) => w.id));

  const added: Word[] = [];
  let skipped = 0;
  for (const w of incoming) {
    const key = `${w.word.trim().toLowerCase()}|${w.meaning.trim()}`;
    if (seen.has(key)) {
      skipped++;
      continue;
    }
    seen.add(key);
    // Imported records can collide with existing ids (e.g. restoring a backup
    // into a device that already holds part of it); re-key those.
    const id = existingIds.has(w.id) ? `${w.id}-${Math.random().toString(36).slice(2, 8)}` : w.id;
    existingIds.add(id);
    added.push({ ...w, id });
  }

  return { words: [...added, ...existing], added: added.length, skipped };
}
