import type { Word } from '../types';

export function scrambleWord(word: string): string {
  const letters = word.split('');
  let scrambled = word;
  let attempts = 0;
  while (scrambled.toLowerCase() === word.toLowerCase() && attempts < 20) {
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    scrambled = letters.join('');
    attempts++;
  }
  return scrambled;
}

export function pickAnagramWords(words: Word[], count: number): Word[] {
  const eligible = words.filter((w) => w.word.replace(/[^a-zA-Z]/g, '').length >= 3 && w.word.length <= 12);
  return shuffle(eligible).slice(0, Math.min(count, eligible.length));
}

interface LetterPoolResult {
  targetWords: Word[];
  letters: string[];
}

/** Builds a letter pool from a set of target words plus some noise letters. */
export function buildLetterPool(words: Word[], wordCount: number): LetterPoolResult {
  const eligible = shuffle(words.filter((w) => /^[a-zA-Z]+$/.test(w.word) && w.word.length <= 8));
  const targetWords = eligible.slice(0, Math.min(wordCount, eligible.length));

  const counts: Record<string, number> = {};
  for (const w of targetWords) {
    const letterCounts: Record<string, number> = {};
    for (const ch of w.word.toLowerCase()) {
      letterCounts[ch] = (letterCounts[ch] ?? 0) + 1;
    }
    for (const [ch, n] of Object.entries(letterCounts)) {
      counts[ch] = Math.max(counts[ch] ?? 0, n);
    }
  }

  const letters: string[] = [];
  for (const [ch, n] of Object.entries(counts)) {
    for (let i = 0; i < n; i++) letters.push(ch);
  }

  const noiseAlphabet = 'abcdefghijklmnopqrstuvwxyz';
  const noiseCount = Math.max(2, Math.floor(letters.length * 0.3));
  for (let i = 0; i < noiseCount; i++) {
    letters.push(noiseAlphabet[Math.floor(Math.random() * noiseAlphabet.length)]);
  }

  return { targetWords, letters: shuffle(letters) };
}

export function canFormFromPool(word: string, pool: string[]): boolean {
  const available = [...pool];
  for (const ch of word.toLowerCase()) {
    const idx = available.indexOf(ch);
    if (idx === -1) return false;
    available.splice(idx, 1);
  }
  return true;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
