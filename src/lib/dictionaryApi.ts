export interface DictionaryVariant {
  phonetic: string;
  partsOfSpeech: string[];
  definitions: string[];
  /** Often empty — this API only carries them for a subset of entries. */
  synonyms: string[];
  antonyms: string[];
}

interface DictionaryApiPhonetic {
  text?: string;
  audio?: string;
}

interface DictionaryApiDefinition {
  definition: string;
  example?: string;
  synonyms?: string[];
  antonyms?: string[];
}

interface DictionaryApiMeaning {
  partOfSpeech: string;
  definitions: DictionaryApiDefinition[];
  /** The API reports these at both the meaning and the definition level. */
  synonyms?: string[];
  antonyms?: string[];
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

/** Cap on synonyms/antonyms kept per entry — some words return dozens. */
const MAX_RELATED = 8;

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
    const synonyms = new Set<string>();
    const antonyms = new Set<string>();

    for (const m of entry.meanings ?? []) {
      if (m.partOfSpeech) posSet.add(m.partOfSpeech);
      for (const s of m.synonyms ?? []) synonyms.add(s);
      for (const a of m.antonyms ?? []) antonyms.add(a);
      for (const d of m.definitions ?? []) {
        if (d.definition && definitions.length < 5) definitions.push(d.definition);
        for (const s of d.synonyms ?? []) synonyms.add(s);
        for (const a of d.antonyms ?? []) antonyms.add(a);
      }
    }

    return {
      phonetic: phoneticText,
      partsOfSpeech: Array.from(posSet),
      definitions,
      synonyms: Array.from(synonyms).slice(0, MAX_RELATED),
      antonyms: Array.from(antonyms).slice(0, MAX_RELATED),
    };
  });

  return variants.filter((v) => v.phonetic || v.definitions.length > 0);
}
