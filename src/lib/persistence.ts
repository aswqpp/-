import { daysBetween } from './memory';
import { todayIso } from './srs';

/**
 * Storage durability.
 *
 * Everything this app knows lives in one browser's localStorage. Browsers are
 * allowed to evict that: Safari clears storage for sites left unvisited for seven
 * days, and every engine can drop "best-effort" storage under disk pressure. The
 * Storage API lets a site ask to be exempt — `persist()` — and lets it read how much
 * room is left. Neither is a substitute for a backup file, so both are paired with
 * a reminder to export one.
 */

export interface StorageStatus {
  /** null when the browser has no Storage API to ask. */
  persisted: boolean | null;
  usage: number | null;
  quota: number | null;
}

export const UNKNOWN_STORAGE: StorageStatus = { persisted: null, usage: null, quota: null };

export async function readStorageStatus(): Promise<StorageStatus> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage) return UNKNOWN_STORAGE;

  const [persisted, estimate] = await Promise.all([
    storage.persisted ? storage.persisted().catch(() => null) : Promise.resolve(null),
    storage.estimate ? storage.estimate().catch(() => null) : Promise.resolve(null),
  ]);

  return {
    persisted,
    usage: estimate?.usage ?? null,
    quota: estimate?.quota ?? null,
  };
}

/**
 * Asks the browser to exempt this site from automatic eviction.
 *
 * Only ever called from a button press. Chrome decides silently from engagement
 * heuristics, but Firefox raises a permission prompt — and a permission prompt
 * nobody asked for, at startup, is how people learn to dismiss prompts.
 */
export async function requestPersistence(): Promise<boolean | null> {
  const storage = typeof navigator !== 'undefined' ? navigator.storage : undefined;
  if (!storage?.persist) return null;
  return storage.persist().catch(() => null);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`;
}

/** How stale a backup has to get before the home screen mentions it. */
export const BACKUP_REMINDER_DAYS = 30;
/** How long "나중에" keeps it quiet. */
export const BACKUP_SNOOZE_DAYS = 7;
/** Below this, there is not enough in the deck to be worth nagging about. */
export const BACKUP_REMINDER_MIN_WORDS = 10;

export interface BackupReminder {
  show: boolean;
  /** Days since the last export, or null if there has never been one. */
  daysSince: number | null;
}

export function backupReminder(
  wordCount: number,
  lastBackupAt: string | null,
  snoozeUntil: string | null,
  today: string = todayIso()
): BackupReminder {
  const daysSince = lastBackupAt ? Math.max(0, daysBetween(lastBackupAt, today)) : null;
  if (wordCount < BACKUP_REMINDER_MIN_WORDS) return { show: false, daysSince };
  if (snoozeUntil && snoozeUntil > today) return { show: false, daysSince };
  return { show: daysSince === null || daysSince >= BACKUP_REMINDER_DAYS, daysSince };
}
