export interface DictionaryVariant {
  phonetic: string;
  partsOfSpeech: string[];
  definitions: string[];
}

interface DictionaryApiPhonetic {
  text?: string;
  audio?: string;
}

interface DictionaryApiDefinition {
  definition: string;
  example?: string;
}

interface DictionaryApiMeaning {
  partOfSpeech: string;
  definitions: DictionaryApiDefinition[];
}

interface DictionaryApiEntry {
  word: string;
  phonetic?: string;
  phonetics?: DictionaryApiPhonetic[];
  meanings?: DictionaryApiMeaning[];
}

const POS_LABEL_KO: Record<string, string> = {
  noun: '명사',
  verb: '동사',
  adjective: '형용사',
  adverb: '부사',
  pronoun: '대명사',
  preposition: '전치사',
  conjunction: '접속사',
  interjection: '감탄사',
  determiner: '한정사',
  exclamation: '감탄사',
  article: '관사',
  numeral: '수사',
};

export function posLabel(pos: string): string {
  return POS_LABEL_KO[pos.toLowerCase()] ?? pos;
}

/** Looks up an English word via the free dictionaryapi.dev API. Each array item returned by the API
 *  typically corresponds to a distinct pronunciation (useful for heteronyms like "record"). */
export async function lookupWord(word: string, signal?: AbortSignal): Promise<DictionaryVariant[]> {
  const query = word.trim().toLowerCase();
  if (!query) return [];

  const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`, { signal });
  if (res.status === 404) return [];
  if (!res.ok) throw new Error('사전 조회에 실패했어요.');

  const data: unknown = await res.json();
  if (!Array.isArray(data)) return [];

  const variants: DictionaryVariant[] = (data as DictionaryApiEntry[]).map((entry) => {
    const phoneticText = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || '';
    const posSet = new Set<string>();
    const definitions: string[] = [];
    for (const m of entry.meanings ?? []) {
      if (m.partOfSpeech) posSet.add(m.partOfSpeech);
      for (const d of m.definitions ?? []) {
        if (d.definition && definitions.length < 5) definitions.push(d.definition);
      }
    }
    return { phonetic: phoneticText, partsOfSpeech: Array.from(posSet), definitions };
  });

  return variants.filter((v) => v.phonetic || v.definitions.length > 0);
}
