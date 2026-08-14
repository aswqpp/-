export type ExamType = 'TOEIC' | 'TOEFL' | '수능' | '공무원' | '일상회화' | '기타';

/** The three measured levels. */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * What a word's difficulty chip can show. Not stored — computed from the review
 * record by `deriveDifficulty()` in lib/difficulty.ts. A word nobody has attempted
 * yet is `unrated` ("-"): unknown, which is not the same as measured-as-medium.
 */
export type DifficultyLevel = Difficulty | 'unrated';

/** Where an attempt came from. Decides whether response time is graded at all. */
export type ReviewMode = 'mc' | 'listening' | 'spelling' | 'flashcard' | 'game';

/** Which way the word was asked: word→meaning or meaning→word. */
export type ReviewDirection = 'w2m' | 'm2w';

/** One recorded attempt. The study log is derived from these. */
export interface ReviewEvent {
  /** ISO timestamp of the attempt */
  t: string;
  ok: boolean;
  mode: ReviewMode;
  dir: ReviewDirection;
  /** SM-2 quality the attempt was graded with (2 = wrong, 3/4/5 = correct) */
  q: number;
  /** Response time in ms. Recorded even for modes that ignore it when grading. */
  ms?: number;
  /**
   * Number of options on screen, for multiple-choice and listening attempts.
   * Sets the guessing floor in the half-life model: a 1-in-3 answer is weaker
   * evidence of memory than a 1-in-5 one. Absent on attempts recorded before
   * this field existed, which fall back to four.
   */
  opt?: number;
}

/**
 * Attempt counts sealed at v1 → v4 migration time. `correctCount`/`wrongCount`
 * still include these, so never add preCount on top of them — that double-counts.
 */
export interface PreCount {
  ok: number;
  ng: number;
  /** last review date known before the migration */
  until: string | null;
}

export interface SrsData {
  /** SM-2 style ease factor, clamped to [1.3, 3.0] */
  easeFactor: number;
  /** current interval in days */
  interval: number;
  /** number of consecutive correct repetitions */
  repetitions: number;
  /** ISO date string (yyyy-mm-dd) the word is next due */
  dueDate: string;
  correctCount: number;
  wrongCount: number;
  lastReviewed: string | null;
  /** Times a *mature* card (repetitions >= 2) was missed. Not the same as wrongCount. */
  lapses: number;
  /** Most recent attempts, newest last, capped at HISTORY_LIMIT. */
  history: ReviewEvent[];
  /** Present only on words carried over from the pre-history schema. */
  preCount?: PreCount;
}

export interface Word {
  id: string;
  word: string;
  phonetic: string;
  /** e.g. "동사", "명사" — set when the word was split out of a multi-part-of-speech dictionary entry */
  partOfSpeech?: string;
  meaning: string;
  example: string;
  exampleTranslation?: string;
  category: string;
  examType: ExamType;
  favorite: boolean;
  /** User's own mnemonic / memory hook for this word. */
  note?: string;
  /** Filled from the dictionary lookup when the entry provides them; often empty. */
  synonyms?: string[];
  antonyms?: string[];
  createdAt: string;
  srs: SrsData;
}

export interface StudyLogEntry {
  date: string; // yyyy-mm-dd
  studiedCount: number;
  correctCount: number;
  wrongCount: number;
  /** Wall-clock seconds spent in sessions that day. Absent in pre-existing data, so treated as 0. */
  studySeconds: number;
}

/** How a focused review (망각 위험군 알림, 취약 단어) opens. */
export type FocusedReviewMode = 'flashcard' | 'quiz';

/** A session handed to 학습 from elsewhere: exactly these words, under this banner. */
export interface PendingReview {
  ids: string[];
  label: string;
}

export interface AppSettings {
  darkMode: boolean;
  flashcardFrontIsWord: boolean;
  /** Words per day the user is aiming for; drives the goal ring on the home screen. */
  dailyGoal: number;
  /** Read the prompt word aloud as soon as a card or question appears. */
  autoSpeak: boolean;
  /** Also read the example sentence, once the answer is on screen. */
  autoSpeakExample: boolean;
  /**
   * Predicted recall below which a word is called 망각 위험군, 0–1.
   * 0 turns the group off entirely — the stage disappears and the home banner
   * with it, for learners who would rather not be nagged.
   */
  atRiskThreshold: number;
  /**
   * Whether the home screen's 망각 위험군 / 취약 단어 buttons start a flashcard
   * session or a quiz over those same words.
   */
  focusedReviewMode: FocusedReviewMode;
  /**
   * How a focused review is quizzed. Kept separate from the quiz tab's own controls:
   * the focused session skips the setup screen, so it needs its own answer.
   * Never empty.
   */
  focusedQuizTypes: QuizType[];
  focusedQuizDirection: McDirection;
  focusedQuizOptionCount: number;
  /** Most words with a history to put up for review in one day. 0 = 무제한. */
  dailyReviewCap: number;
  /** Most never-seen words to introduce in one day. 0 = 무제한. */
  dailyNewCap: number;
  /** Local date of the last backup export, or null if there has never been one. */
  lastBackupAt: string | null;
  /** The backup reminder stays quiet until this local date. */
  backupSnoozeUntil: string | null;
  /**
   * The streak the learner last had on screen. Kept only so a broken streak can be
   * shown falling back rather than appearing already reset.
   */
  lastSeenStreak: number;
}

/** Record of the one-way v1 → v4 upgrade, kept so the log cutoff survives reloads. */
export interface MigrationInfo {
  appliedAt: string;
  from: number;
  to: number;
  /** Days on or before this date keep their pre-migration totals. */
  logCutoff: string;
  changes: string[];
}

export interface AppState {
  words: Word[];
  /**
   * Derived — rebuilt from `words[].srs.history` plus `legacyLog`. Never written
   * to directly; `rebuildLog()` in lib/srs.ts is the single writer.
   */
  log: StudyLogEntry[];
  /**
   * Frozen pre-migration totals. Migrated words have no history, so without this
   * the heatmap and streaks would reset to zero on upgrade.
   */
  legacyLog: StudyLogEntry[];
  migration?: MigrationInfo;
  settings: AppSettings;
}

export type QuizType = 'multiple-choice' | 'spelling' | 'listening';

/** Which way a multiple-choice question is asked. */
export type McDirection = 'word-to-meaning' | 'meaning-to-word';

export type Screen =
  | 'home'
  | 'words'
  | 'study'
  | 'quiz'
  | 'games'
  | 'stats'
  /** Category mastery, split out of stats so a long category list stays readable. */
  | 'categories';
