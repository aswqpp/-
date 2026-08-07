interface MyMemoryResponse {
  responseData?: { translatedText?: string };
}

/** Translates via the free, keyless MyMemory API. Best-effort — quality varies and quota is limited. */
export async function translateText(text: string, from: 'en' | 'ko', to: 'en' | 'ko', signal?: AbortSignal): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed)}&langpair=${from}|${to}`;
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error('번역 요청에 실패했어요.');

  const data = (await res.json()) as MyMemoryResponse;
  const translated = data.responseData?.translatedText;
  if (typeof translated !== 'string' || translated.toUpperCase().includes('MYMEMORY WARNING')) {
    throw new Error('번역 결과를 가져오지 못했어요.');
  }
  return translated;
}

/** Suggests Korean meaning candidates by translating the word itself plus a few English definitions. */
export async function suggestKoreanMeanings(word: string, definitions: string[], signal?: AbortSignal): Promise<string[]> {
  const inputs = [word, ...definitions.slice(0, 2)];
  const results = await Promise.allSettled(inputs.map((t) => translateText(t, 'en', 'ko', signal)));
  const candidates = new Set<string>();
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value) candidates.add(r.value);
  }
  return Array.from(candidates);
}

/** Suggests an English word candidate from a Korean meaning (translation-based, not a true dictionary lookup). */
export async function suggestEnglishWord(meaning: string, signal?: AbortSignal): Promise<string> {
  return translateText(meaning, 'ko', 'en', signal);
}
