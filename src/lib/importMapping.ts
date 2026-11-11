import type { ExamType } from '../types';
import { hasHangul } from './pdfVocab';

export type MappableField =
  | 'word'
  | 'meaning'
  | 'example'
  | 'exampleTranslation'
  | 'phonetic'
  | 'category'
  | 'examType';

export const REQUIRED_FIELDS: MappableField[] = ['word', 'meaning'];

export const FIELD_LABELS: Record<MappableField, string> = {
  word: '단어',
  meaning: '뜻',
  example: '예문',
  exampleTranslation: '예문 해석',
  phonetic: '발음기호',
  category: '카테고리',
  examType: '시험 종류',
};

export const FIELD_ORDER: MappableField[] = [
  'word',
  'meaning',
  'example',
  'exampleTranslation',
  'phonetic',
  'category',
  'examType',
];

const HEADER_KEYWORDS: Record<MappableField, string[]> = {
  word: ['단어', '영단어', 'word', 'spelling', 'term'],
  meaning: ['뜻', '의미', '뜻풀이', '한글뜻', 'meaning', 'definition'],
  example: ['예문', '예시문장', 'example', 'sentence'],
  exampleTranslation: ['예문해석', '예문뜻', '해석', 'translation'],
  phonetic: ['발음기호', '발음', 'phonetic', 'pronunciation', 'ipa'],
  category: ['카테고리', '분류', '주제', 'category', 'topic'],
  examType: ['시험종류', '시험', 'examtype', 'exam', 'test'],
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '');
}

export type FieldMapping = Record<MappableField, number | null>;

export function detectMapping(headerRow: string[]): FieldMapping {
  const mapping = FIELD_ORDER.reduce((acc, f) => {
    acc[f] = null;
    return acc;
  }, {} as FieldMapping);

  const normalized = headerRow.map(normalizeHeader);

  for (const field of FIELD_ORDER) {
    const keywords = HEADER_KEYWORDS[field].map(normalizeHeader);
    const idx = normalized.findIndex((h) => h !== '' && keywords.some((k) => h === k || h.includes(k)));
    if (idx !== -1) mapping[field] = idx;
  }

  return mapping;
}

/** Heuristic: treat the first row as a header if most of its cells match a known field keyword. */
export function looksLikeHeaderRow(row: string[]): boolean {
  if (row.length === 0) return false;
  const mapping = detectMapping(row);
  const matches = Object.values(mapping).filter((v) => v !== null).length;
  return matches >= 2;
}

const EXAM_TYPES: ExamType[] = ['TOEIC', 'TOEFL', '수능', '공무원', '일상회화', '기타'];

export function normalizeExamType(raw: string, fallback: ExamType): ExamType {
  const v = raw.trim();
  if (!v) return fallback;
  const match = EXAM_TYPES.find((t) => t.toLowerCase() === v.toLowerCase());
  return match ?? fallback;
}

export interface ImportDefaults {
  category: string;
  examType: ExamType;
}

export interface ImportedRow {
  word: string;
  phonetic: string;
  meaning: string;
  example: string;
  exampleTranslation: string;
  category: string;
  examType: ExamType;
  valid: boolean;
  /** Why this row is worth a second look before importing; empty when it looks fine. */
  issues: string[];
  sourceRowIndex: number;
}

/** A hand correction made in the import preview. */
export interface RowEdit {
  word?: string;
  meaning?: string;
}

/** What looks off about a word/meaning pair. A word list is English words with Korean meanings. */
export function rowIssues(word: string, meaning: string): string[] {
  const issues: string[] = [];
  if (!word) issues.push('단어가 비어 있어요');
  if (!meaning) issues.push('뜻이 비어 있어요');
  if (word && hasHangul(word)) issues.push('단어에 한글이 섞여 있어요');
  else if (word && !/[a-z]/i.test(word)) issues.push('단어에 영어가 없어요');
  if (word && /\d/.test(word)) issues.push('단어에 숫자가 있어요');
  if (word.length > 40) issues.push('단어가 너무 길어요 (두 줄이 합쳐졌을 수 있어요)');
  if (meaning && !hasHangul(meaning)) issues.push('뜻에 한글이 없어요');
  return issues;
}

/** Applies a preview correction and re-checks the row. */
export function applyRowEdit(row: ImportedRow, edit: RowEdit | undefined): ImportedRow {
  if (!edit) return row;
  const word = (edit.word ?? row.word).trim();
  const meaning = (edit.meaning ?? row.meaning).trim();
  return { ...row, word, meaning, valid: word !== '' && meaning !== '', issues: rowIssues(word, meaning) };
}

export function cell(row: string[], colIndex: number | null): string {
  if (colIndex === null) return '';
  return (row[colIndex] ?? '').trim();
}

export function buildImportedRow(row: string[], mapping: FieldMapping, defaults: ImportDefaults, sourceRowIndex: number): ImportedRow {
  const word = cell(row, mapping.word);
  const meaning = cell(row, mapping.meaning);
  const rawExamType = cell(row, mapping.examType);
  const category = mapping.category !== null ? cell(row, mapping.category) : defaults.category;

  return {
    word,
    meaning,
    example: cell(row, mapping.example),
    exampleTranslation: cell(row, mapping.exampleTranslation),
    phonetic: cell(row, mapping.phonetic),
    category: category || defaults.category,
    examType: mapping.examType !== null ? normalizeExamType(rawExamType, defaults.examType) : defaults.examType,
    valid: word !== '' && meaning !== '',
    issues: rowIssues(word, meaning),
    sourceRowIndex,
  };
}

export function columnLabel(index: number, headerRow: string[] | null): string {
  if (headerRow && headerRow[index]) return headerRow[index];
  return `${index + 1}번째 열`;
}
