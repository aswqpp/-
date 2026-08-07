import type { QuizType, Word } from '../types';

export type McDirection = 'word-to-meaning' | 'meaning-to-word';

export interface QuizQuestion {
  word: Word;
  type: QuizType;
  options?: string[]; // for multiple-choice / listening
  direction?: McDirection; // only set for multiple-choice
}

export interface McSettings {
  direction: McDirection;
  optionCount: number; // 3-5
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function answerField(w: Word, direction: McDirection): string {
  return direction === 'word-to-meaning' ? w.meaning : w.word;
}

export function promptField(w: Word, direction: McDirection): string {
  return direction === 'word-to-meaning' ? w.word : w.meaning;
}

function buildOptions(target: Word, pool: Word[], direction: McDirection, optionCount: number): string[] {
  const targetAnswer = answerField(target, direction);
  const distractors = shuffleArray(
    pool.filter((w) => w.id !== target.id && answerField(w, direction) !== targetAnswer)
  )
    .slice(0, Math.max(0, optionCount - 1))
    .map((w) => answerField(w, direction));
  return shuffleArray([targetAnswer, ...distractors]);
}

export function buildQuiz(words: Word[], pool: Word[], types: QuizType[], mc: McSettings): QuizQuestion[] {
  return words.map((word) => {
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === 'spelling') return { word, type };
    if (type === 'listening') {
      return { word, type, options: buildOptions(word, pool.length >= 4 ? pool : words, 'word-to-meaning', 4) };
    }
    return {
      word,
      type,
      direction: mc.direction,
      options: buildOptions(word, pool.length >= mc.optionCount ? pool : words, mc.direction, mc.optionCount),
    };
  });
}

export function normalizeSpelling(input: string): string {
  return input.trim().toLowerCase();
}
