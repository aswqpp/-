import { useEffect, useMemo, useRef } from 'react';
import type { Word } from '../types';
import { tryLookupPhonetic } from '../lib/dictionaryApi';

/** Words the dictionary already answered "no 발음기호" for, so they are not asked again on every visit. */
const TRIED_KEY = 'beom-phonetic-tried-v1';
const CONCURRENCY = 2;
/** Results are written in small batches, so a large deck does not re-render on every lookup. */
const FLUSH_EVERY = 8;

function loadTried(): Set<string> {
  try {
    const raw = localStorage.getItem(TRIED_KEY);
    const list: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((x): x is string => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveTried(tried: Set<string>) {
  try {
    localStorage.setItem(TRIED_KEY, JSON.stringify([...tried]));
  } catch {
    // Only a convenience: without it, those words are simply looked up again next time.
  }
}

/**
 * Fills in 발음기호 for words saved without one, quietly in the background.
 *
 * Words that already have a 발음기호 are left alone. A word the dictionary has nothing
 * for is remembered and skipped from then on; a failed lookup (offline, timeout) is
 * not, so it is tried again on a later visit.
 */
export function usePhoneticBackfill(words: Word[], fillPhonetics: (found: Map<string, string>) => void) {
  const triedRef = useRef<Set<string> | null>(null);
  const inFlight = useRef(new Set<string>());

  const missing = useMemo(() => {
    const keys = new Set<string>();
    for (const w of words) {
      const key = w.word.trim().toLowerCase();
      if (!w.phonetic.trim() && /^[a-z][a-z' -]*$/i.test(key)) keys.add(key);
    }
    return [...keys].sort();
  }, [words]);
  const missingKey = missing.join('|');

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    triedRef.current ??= loadTried();
    const tried = triedRef.current;
    const queue = missing.filter((k) => !tried.has(k) && !inFlight.current.has(k));
    if (queue.length === 0) return;

    let cancelled = false;
    let pending = new Map<string, string>();
    const flush = () => {
      if (pending.size > 0) fillPhonetics(pending);
      pending = new Map();
      saveTried(tried);
    };

    async function worker() {
      while (!cancelled && queue.length > 0) {
        const key = queue.shift()!;
        inFlight.current.add(key);
        const phonetic = await tryLookupPhonetic(key);
        inFlight.current.delete(key);
        if (phonetic === null) continue;
        if (phonetic) pending.set(key, phonetic);
        else tried.add(key);
        if (pending.size >= FLUSH_EVERY) flush();
      }
    }

    // Wait a moment so the first screen is not competing with the lookups.
    const timer = window.setTimeout(() => {
      void Promise.all(Array.from({ length: CONCURRENCY }, worker)).then(flush);
    }, 1500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      flush();
    };
    // `missing` is captured through its key so an unrelated edit to a word does not restart the queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, fillPhonetics]);
}
