/**
 * Turns the text pieces of a PDF word list into word/meaning rows.
 *
 * Pure layout logic — no pdf.js here — so it can be checked against real files
 * from Node. Coordinates are PDF points with y growing upwards, as pdf.js reports.
 *
 * Two layouts are handled:
 *  - Numbered lists (the common 단어장 export: "1 assume  취하다", in 1–4 columns).
 *    Each number anchors an entry; text below it in the same column, until the
 *    next number, is its continuation (wrapped meanings, "compound / interest").
 *  - Anything else: each line is split where English stops and Korean starts.
 */

export interface PdfTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfPage {
  items: PdfTextItem[];
  width: number;
}

export interface PdfVocabEntry {
  number: number | null;
  word: string;
  meaning: string;
  phonetic: string;
}

export interface PdfVocabResult {
  entries: PdfVocabEntry[];
  /** File-level problems a person should look at, e.g. numbers that never showed up. */
  warnings: string[];
}

const HANGUL = /[ᄀ-ᇿ㄰-㆏가-힣]/;
const NUMBER_ONLY = /^\(?(\d{1,4})[.)]?$/;
const NUMBER_PREFIX = /^\(?(\d{1,4})[.)]?\s+(.+)$/;
/** Lines that are page furniture rather than words. */
const NOISE = [/^page\s*\d+\s*(\/|of)\s*\d+$/i, /^-?\s*\d+\s*-?$/, /^name\s*:?$/i];

export function hasHangul(s: string): boolean {
  return HANGUL.test(s);
}

/**
 * Splits "equip ~ with ... ~에게 …을 갖추게 하다" into its English and Korean halves.
 * The cut goes where Korean starts, pulled back over the "~", "(" or "[" that opens it.
 */
export function splitAtHangul(text: string): [string, string] {
  const first = text.search(HANGUL);
  if (first === -1) return [text.trim(), ''];
  let cut = first;
  while (cut > 0 && /[~([（〈<·…'"‘“-]/.test(text[cut - 1])) cut--;
  // "apple - 사과", "apple: 사과" — the separator belongs to neither half.
  return [text.slice(0, cut).replace(/\s*[-–—:|=,]+\s*$/, '').trim(), text.slice(cut).trim()];
}

/** "apple [ǽpl]" → word "apple", phonetic "[ǽpl]". Only brackets that look like 발음기호 are taken. */
export function pullPhonetic(word: string): { word: string; phonetic: string } {
  const m = word.match(/(\[[^\]\s][^\]]*\]|\/[^/\s][^/]*\/)/);
  if (!m) return { word, phonetic: '' };
  const inner = m[1].slice(1, -1);
  const looksPhonetic = /[ˈˌəɪʊæɑɔʌθðʃʒŋːɛɜɒ]|[àáâäèéêëìíîïòóôöùúûüǽ]/.test(inner) || /^[a-z:ˈ'.-]+$/i.test(inner);
  if (!looksPhonetic || hasHangul(inner)) return { word, phonetic: '' };
  return { word: (word.slice(0, m.index) + word.slice((m.index ?? 0) + m[1].length)).replace(/\s+/g, ' ').trim(), phonetic: m[1] };
}

/** Joins wrapped meaning lines: Korean broken mid-word ("확실" + "한") closes up, the rest gets a space. */
function joinMeaningLines(lines: string[]): string {
  let out = '';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    if (!out) {
      out = line;
      continue;
    }
    const prev = out[out.length - 1];
    const next = line[0];
    const closeUp = (hasHangul(prev) || /[)\]]/.test(prev)) && (hasHangul(next) || /[)\][(]/.test(next));
    out += closeUp && !/[,;]/.test(prev) ? line : ` ${line}`;
  }
  return out;
}

/** Same-line pieces joined, with a space only where the PDF left a visible gap. */
function joinLine(items: PdfTextItem[]): string {
  const sorted = [...items].sort((a, b) => a.x - b.x);
  let out = '';
  let end = -Infinity;
  for (const it of sorted) {
    const gap = it.x - end;
    out += out && gap > Math.max(1, it.height * 0.15) ? ` ${it.str}` : it.str;
    end = it.x + it.width;
  }
  return out.replace(/\s+/g, ' ').trim();
}

/** Groups items into lines, top of the page first. */
function toLines(items: PdfTextItem[]): PdfTextItem[][] {
  const sorted = [...items].sort((a, b) => b.y - a.y || a.x - b.x);
  const lines: PdfTextItem[][] = [];
  for (const it of sorted) {
    const last = lines[lines.length - 1];
    const tol = Math.max(2, it.height * 0.4);
    if (last && Math.abs(last[0].y - it.y) <= tol) last.push(it);
    else lines.push([it]);
  }
  return lines;
}

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

function isNoise(s: string): boolean {
  const t = s.trim();
  return t === '' || NOISE.some((r) => r.test(t));
}

/** Splits "12 assume" pieces into a number piece and a text piece, so both layouts look alike. */
function explodeNumberPrefixes(items: PdfTextItem[]): PdfTextItem[] {
  const out: PdfTextItem[] = [];
  for (const it of items) {
    const m = it.str.trim().match(NUMBER_PREFIX);
    if (m && !NUMBER_ONLY.test(it.str.trim())) {
      const charW = it.width / Math.max(1, it.str.length);
      const numW = charW * (it.str.indexOf(m[2]) || m[1].length);
      out.push({ ...it, str: m[1], width: charW * m[1].length });
      out.push({ ...it, str: m[2], x: it.x + numW, width: Math.max(0, it.width - numW) });
    } else {
      out.push(it);
    }
  }
  return out;
}

interface Anchor {
  number: number;
  item: PdfTextItem;
}

/**
 * Number pieces that start entries: a number with text right beside it on the same line.
 * Page numbers and stray digits have nothing there and drop out.
 */
function findAnchors(items: PdfTextItem[]): Anchor[] {
  const anchors: Anchor[] = [];
  for (const it of items) {
    const m = it.str.trim().match(NUMBER_ONLY);
    if (!m) continue;
    const right = it.x + it.width;
    const neighbour = items.some(
      (o) => o !== it && !NUMBER_ONLY.test(o.str.trim()) && o.x >= right - 1 && o.x - right < 25 && Math.abs(o.y - it.y) <= Math.max(3, o.height * 0.6)
    );
    if (neighbour) anchors.push({ number: Number(m[1]), item: it });
  }
  return anchors;
}

/** Column starts, from where the numbers sit (1-, 2- and 3-digit numbers shift a little). */
function columnStarts(anchors: Anchor[]): number[] {
  const xs = anchors.map((a) => a.item.x).sort((a, b) => a - b);
  const starts: number[] = [];
  for (const x of xs) {
    if (starts.length === 0 || x - starts[starts.length - 1] > 40) starts.push(x);
  }
  return starts;
}

function parseNumberedPage(page: PdfPage, anchors: Anchor[]): PdfVocabEntry[] {
  const starts = columnStarts(anchors);
  const lineH = median(page.items.filter((i) => !NUMBER_ONLY.test(i.str.trim())).map((i) => i.height)) || 8;
  const entries: PdfVocabEntry[] = [];

  starts.forEach((start, c) => {
    const left = start - 3;
    const right = c + 1 < starts.length ? starts[c + 1] - 3 : page.width + 1;
    const inCol = (x: number) => x >= left && x < right;
    const colAnchors = anchors.filter((a) => inCol(a.item.x)).sort((a, b) => b.item.y - a.item.y);
    const anchorSet = new Set(colAnchors.map((a) => a.item));
    const colItems = page.items.filter((it) => inCol(it.x) && !anchorSet.has(it) && !isNoise(it.str));

    // Where meanings begin in this column: the usual x of the Korean pieces.
    const meaningX = median(colItems.filter((i) => hasHangul(i.str)).map((i) => i.x));

    colAnchors.forEach((anchor, k) => {
      const top = anchor.item.y + Math.max(3, lineH * 0.6);
      const nextAnchor = colAnchors[k + 1];
      const bottom = nextAnchor ? nextAnchor.item.y + Math.max(3, lineH * 0.6) : -Infinity;
      // A wrap sits one line under its entry; anything further is page furniture.
      const reach = anchor.item.y - lineH * 3.2;
      const own = colItems.filter((it) => it.y <= top && it.y > bottom && it.y >= reach);

      const wordLines: string[] = [];
      const meaningLines: string[] = [];
      for (const line of toLines(own)) {
        const wordPart: PdfTextItem[] = [];
        const meaningPart: PdfTextItem[] = [];
        for (const it of line) {
          // Korean-led pieces, and anything where meanings start, are meaning; "bet 내기" in one piece is split below.
          const isMeaning = (meaningX > 0 && it.x >= meaningX - 2) || (hasHangul(it.str) && splitAtHangul(it.str)[0] === '');
          (isMeaning ? meaningPart : wordPart).push(it);
        }
        // A piece that holds both ("prolonged장기간의") is split where Korean starts.
        const [w, m0] = splitAtHangul(joinLine(wordPart));
        if (w) wordLines.push(w);
        const m = [m0, joinLine(meaningPart)].filter(Boolean).join(' ');
        if (m) meaningLines.push(m);
      }

      const { word, phonetic } = pullPhonetic(wordLines.join(' ').replace(/\s+/g, ' ').trim());
      entries.push({ number: anchor.number, word, meaning: joinMeaningLines(meaningLines), phonetic });
    });
  });

  return entries;
}

/** Unnumbered lists: every line is "English … Korean", wrapped Korean lines join the entry above. */
function parseFreePage(page: PdfPage): PdfVocabEntry[] {
  const entries: PdfVocabEntry[] = [];
  for (const line of toLines(page.items)) {
    const text = joinLine(line).replace(/^[①-⑳]\s*/, '').replace(/^\(?\d{1,4}[.)]?\s+/, '');
    if (isNoise(text)) continue;
    const [rawWord, meaning] = splitAtHangul(text);
    if (rawWord && /[a-z]/i.test(rawWord)) {
      const { word, phonetic } = pullPhonetic(rawWord);
      entries.push({ number: null, word, meaning, phonetic });
    } else if (!rawWord && meaning && entries.length > 0) {
      const prev = entries[entries.length - 1];
      prev.meaning = joinMeaningLines([prev.meaning, meaning]);
    }
  }
  return entries;
}

/** Collapses a run of numbers into "3, 7~9" for a warning. */
function describeNumbers(ns: number[]): string {
  const parts: string[] = [];
  let i = 0;
  while (i < ns.length) {
    let j = i;
    while (j + 1 < ns.length && ns[j + 1] === ns[j] + 1) j++;
    parts.push(i === j ? `${ns[i]}` : `${ns[i]}~${ns[j]}`);
    i = j + 1;
  }
  return parts.join(', ');
}

export function parseVocabPages(pages: PdfPage[]): PdfVocabResult {
  const warnings: string[] = [];
  const prepared = pages.map((p) => ({ ...p, items: explodeNumberPrefixes(p.items.filter((i) => i.str.trim() !== '')) }));
  const anchorsByPage = prepared.map((p) => findAnchors(p.items));
  const anchorTotal = anchorsByPage.reduce((n, a) => n + a.length, 0);

  let entries: PdfVocabEntry[];
  if (anchorTotal >= 5) {
    entries = prepared.flatMap((p, i) => (anchorsByPage[i].length > 0 ? parseNumberedPage(p, anchorsByPage[i]) : parseFreePage(p)));

    const numbers = entries.map((e) => e.number).filter((n): n is number => n !== null);
    const seen = new Set<number>();
    const dup = new Set<number>();
    for (const n of numbers) (seen.has(n) ? dup : seen).add(n);
    const lo = Math.min(...numbers);
    const hi = Math.max(...numbers);
    const missing: number[] = [];
    for (let n = lo; n <= hi; n++) if (!seen.has(n)) missing.push(n);
    if (missing.length > 0) warnings.push(`번호 ${describeNumbers(missing)}번을 찾지 못했어요. 원본과 비교해 확인해주세요.`);
    if (dup.size > 0) warnings.push(`번호 ${describeNumbers([...dup].sort((a, b) => a - b))}번이 두 번 나와요.`);
    entries.sort((a, b) => (a.number ?? 0) - (b.number ?? 0));
  } else {
    entries = prepared.flatMap(parseFreePage);
  }

  return { entries: entries.filter((e) => e.word || e.meaning), warnings };
}
