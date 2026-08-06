import type { QuizType, Word } from '../types';

export interface QuizQuestion {
  word: Word;
  type: QuizType;
  options?: string[]; // for multiple-choice / listening
}

export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function buildOptions(target: Word, pool: Word[]): string[] {
  const distractors = shuffleArray(pool.filter((w) => w.id !== target.id && w.meaning !== target.meaning))
    .slice(0, 3)
    .map((w) => w.meaning);
  return shuffleArray([target.meaning, ...distractors]);
}

export function buildQuiz(words: Word[], pool: Word[], types: QuizType[]): QuizQuestion[] {
  return words.map((word) => {
    const type = types[Math.floor(Math.random() * types.length)];
    if (type === 'spelling') return { word, type };
    return { word, type, options: buildOptions(word, pool.length >= 4 ? pool : words) };
  });
}

export function normalizeSpelling(input: string): string {
  return input.trim().toLowerCase();
}
