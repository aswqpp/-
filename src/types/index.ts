export type ExamType = 'TOEIC' | 'TOEFL' | '수능' | '공무원' | '일상회화' | '기타';

/** The three measured levels. */
export type Difficulty = 'easy' | 'medium' | 'hard';

/**
 * What a word's difficulty chip can show. Not stored — computed from the review
 * record by `deriveDifficulty()` in lib/difficulty.ts. A word nobody has attempted
 * yet is `unrated` ("-"): unknown, which is not the same as measured-as-medium.
 */
export type DifficultyLevel = Difficulty | 'unrated';

export interface SrsData {
  /** SM-2 style ease factor, >= 1.3 */
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
}

export interface AppSettings {
  darkMode: boolean;
  flashcardFrontIsWord: boolean;
  /** Words per day the user is aiming for; drives the goal ring on the home screen. */
  dailyGoal: number;
}

export interface AppState {
  words: Word[];
  log: StudyLogEntry[];
  settings: AppSettings;
}

export type QuizType = 'multiple-choice' | 'spelling' | 'listening';

export type Screen =
  | 'home'
  | 'words'
  | 'study'
  | 'quiz'
  | 'games'
  | 'stats';
