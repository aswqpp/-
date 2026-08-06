export interface ParsedTable {
  rows: string[][];
}

function cellToString(v: unknown): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function normalizeRows(rows: unknown[][]): string[][] {
  const stringRows = rows.map((row) => row.map(cellToString));
  // drop fully-empty trailing rows
  while (stringRows.length > 0 && stringRows[stringRows.length - 1].every((c) => c === '')) {
    stringRows.pop();
  }
  return stringRows;
}

export function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, ''); // strip BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\r') {
      // ignore, \n handles line breaks
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += ch;
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return normalizeRows(rows);
}

async function parseXlsx(file: File): Promise<string[][]> {
  const { readSheet } = await import('read-excel-file/browser');
  const rows = await readSheet(file);
  return normalizeRows(rows);
}

/** Extracts the first table found in a .docx file; falls back to splitting raw text lines by tab/delimiter. */
async function parseDocx(file: File): Promise<string[][]> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const { value: html } = await mammoth.convertToHtml({ arrayBuffer });

  const doc = new DOMParser().parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (table) {
    const rows: string[][] = [];
    for (const tr of Array.from(table.querySelectorAll('tr'))) {
      const cells = Array.from(tr.querySelectorAll('td, th')).map((c) => (c.textContent ?? '').trim());
      if (cells.some((c) => c !== '')) rows.push(cells);
    }
    if (rows.length > 0) return normalizeRows(rows);
  }

  // No table: treat each paragraph as a row, splitting by tab or common separators.
  const { value: text } = await mammoth.extractRawText({ arrayBuffer });
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l !== '');
  const rows = lines.map((line) => {
    if (line.includes('\t')) return line.split('\t').map((c) => c.trim());
    const sepMatch = line.split(/\s*[-–—:|]\s+|,\s+/);
    if (sepMatch.length > 1) return sepMatch.map((c) => c.trim());
    return [line];
  });
  return normalizeRows(rows);
}

export async function parseImportFile(file: File): Promise<ParsedTable> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.csv')) {
    const text = await file.text();
    return { rows: parseCsvText(text) };
  }
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    return { rows: await parseXlsx(file) };
  }
  if (name.endsWith('.docx')) {
    return { rows: await parseDocx(file) };
  }

  throw new Error('지원하지 않는 파일 형식이에요. .xlsx, .csv, .docx 파일을 업로드해주세요.');
}
