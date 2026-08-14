import type { AppState } from '../types';
import { DEFAULT_AT_RISK_THRESHOLD, DEFAULT_DAILY_GOAL } from '../lib/storage';
import { DEFAULT_NEW_CAP, DEFAULT_REVIEW_CAP } from '../lib/scheduling';

function genId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * A fresh install starts empty — no sample vocabulary. Seeded words looked like
 * real progress the learner never made, and they polluted the stats and the
 * difficulty distribution from day one.
 */
export function buildInitialState(): AppState {
  return {
    words: [],
    log: [],
    legacyLog: [],
    settings: {
      darkMode:
        typeof window !== 'undefined' ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false) : false,
      flashcardFrontIsWord: true,
      dailyGoal: DEFAULT_DAILY_GOAL,
      autoSpeak: true,
      autoSpeakExample: false,
      atRiskThreshold: DEFAULT_AT_RISK_THRESHOLD,
      focusedReviewMode: 'flashcard',
      dailyReviewCap: DEFAULT_REVIEW_CAP,
      dailyNewCap: DEFAULT_NEW_CAP,
      lastBackupAt: null,
      backupSnoozeUntil: null,
    },
  };
}

export { genId };
