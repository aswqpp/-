import type { McDirection, QuizType, Word } from '../types';

export type { McDirection };

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

/** Character bigrams, with singles kept so one- and two-letter strings still compare. */
function bigrams(text: string): Set<string> {
  const clean = text.toLowerCase().replace(/[\s.,·~()[\]'"-]/g, '');
  const set = new Set<string>();
  if (clean.length === 0) return set;
  if (clean.length === 1) {
    set.add(clean);
    return set;
  }
  for (let i = 0; i < clean.length - 1; i++) set.add(clean.slice(i, i + 2));
  return set;
}

/** Dice coefficient over character bigrams: 0 = nothing shared, 1 = identical. */
function textSimilarity(a: string, b: string): number {
  const setA = bigrams(a);
  const setB = bigrams(b);
  if (setA.size === 0 || setB.size === 0) return 0;

  let shared = 0;
  for (const g of setA) if (setB.has(g)) shared++;
  return (2 * shared) / (setA.size + setB.size);
}

/**
 * How plausible `candidate` is as a wrong answer next to `target`.
 *
 * Random distractors make a multiple-choice question a reading test: the answer is
 * the only one in the right semantic neighbourhood. Meanings that read alike, share
 * a part of speech or come from the same category force an actual recall instead.
 */
function distractorScore(target: Word, candidate: Word, direction: McDirection): number {
  let score = textSimilarity(answerField(target, direction), answerField(candidate, direction)) * 3;
  if (target.partOfSpeech && candidate.partOfSpeech === target.partOfSpeech) score += 0.8;
  if (target.category && candidate.category === target.category) score += 0.4;
  // The dictionary sometimes hands us actual synonyms — the most confusable option there is.
  if (target.synonyms?.some((s) => s.toLowerCase() === candidate.word.toLowerCase())) score += 1.5;
  // A little noise so the same three distractors don't follow a word around forever.
  return score + Math.random() * 0.35;
}

function buildOptions(target: Word, pool: Word[], direction: McDirection, optionCount: number): string[] {
  const targetAnswer = answerField(target, direction);

  const seen = new Set([targetAnswer]);
  const candidates: Word[] = [];
  for (const w of pool) {
    if (w.id === target.id) continue;
    const answer = answerField(w, direction);
    if (seen.has(answer)) continue; // duplicate meanings would make two options both correct
    seen.add(answer);
    candidates.push(w);
  }

  const distractors = candidates
    .map((w) => ({ w, score: distractorScore(target, w, direction) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(0, optionCount - 1))
    .map((c) => answerField(c.w, direction));

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
