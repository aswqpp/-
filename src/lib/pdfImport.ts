import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { parseVocabPages, type PdfPage, type PdfVocabResult } from './pdfVocab';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/** Reads every page's text pieces with their positions, then finds the word list in them. */
export async function parsePdfVocab(file: File): Promise<PdfVocabResult> {
  const task = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const doc = await task.promise;
  try {
    const pages: PdfPage[] = [];
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      const items = content.items.flatMap((it) =>
        'str' in it && it.str.trim() !== ''
          ? [{ str: it.str, x: it.transform[4], y: it.transform[5], width: it.width, height: it.height || Math.abs(it.transform[3]) }]
          : []
      );
      pages.push({ items, width: page.getViewport({ scale: 1 }).width });
    }
    if (pages.every((p) => p.items.length === 0)) {
      throw new Error('이 PDF에는 글자 정보가 없어요. 스캔하거나 사진으로 만든 PDF는 아직 읽을 수 없어요.');
    }
    return parseVocabPages(pages);
  } finally {
    void task.destroy();
  }
}
