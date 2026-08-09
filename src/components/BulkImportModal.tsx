import { useMemo, useState, type ChangeEvent, type DragEvent } from 'react';
import type { ExamType, Word } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Button, Badge } from './ui';
import { Icon } from './Icon';
import { parseImportFile } from '../lib/importParsers';
import {
  FIELD_LABELS,
  FIELD_ORDER,
  REQUIRED_FIELDS,
  detectMapping,
  looksLikeHeaderRow,
  buildImportedRow,
  columnLabel,
  type FieldMapping,
  type ImportDefaults,
  type ImportedRow,
  type MappableField,
} from '../lib/importMapping';

type Step = 'select' | 'parsing' | 'mapping' | 'result' | 'error';

const EXAM_TYPES: ExamType[] = ['TOEIC', 'TOEFL', '수능', '공무원', '일상회화', '기타'];
const OPTIONAL_DEFAULTABLE: MappableField[] = ['category', 'examType'];

export function BulkImportModal({ app, onClose }: { app: UseAppState; onClose: () => void }) {
  const [step, setStep] = useState<Step>('select');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<string[][]>([]);
  const [hasHeader, setHasHeader] = useState(true);
  const [mapping, setMapping] = useState<FieldMapping>(() => detectMapping([]));
  const [defaults, setDefaults] = useState<ImportDefaults>({ category: '가져온 단어', examType: '기타' });
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<{ added: number; skippedDuplicates: number; invalid: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFile(file: File) {
    setStep('parsing');
    setFileName(file.name);
    try {
      const parsed = await parseImportFile(file);
      if (parsed.rows.length === 0) {
        setErrorMsg('파일에서 데이터를 찾을 수 없어요. 표 형식의 단어 목록이 포함된 파일인지 확인해주세요.');
        setStep('error');
        return;
      }
      const guessHeader = looksLikeHeaderRow(parsed.rows[0]);
      const initialMapping = guessHeader
        ? detectMapping(parsed.rows[0])
        : { ...detectMapping([]), word: 0, meaning: parsed.rows[0].length > 1 ? 1 : null };
      setRows(parsed.rows);
      setHasHeader(guessHeader);
      setMapping(initialMapping);
      setStep('mapping');
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : '파일을 읽는 중 오류가 발생했어요.');
      setStep('error');
    }
  }

  function onFileInputChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function toggleHasHeader(next: boolean) {
    setHasHeader(next);
    if (rows.length === 0) return;
    const guess = next
      ? detectMapping(rows[0])
      : { ...detectMapping([]), word: 0, meaning: rows[0].length > 1 ? 1 : null };
    setMapping(guess);
  }

  const headerRow = hasHeader ? rows[0] : null;
  const dataRows = useMemo(() => (hasHeader ? rows.slice(1) : rows), [rows, hasHeader]);

  const importedRows: ImportedRow[] = useMemo(
    () => dataRows.map((row, i) => buildImportedRow(row, mapping, defaults, i)),
    [dataRows, mapping, defaults]
  );

  const validRows = importedRows.filter((r) => r.valid);
  const invalidCount = importedRows.length - validRows.length;

  const existingWordSet = useMemo(() => new Set(app.state.words.map((w) => w.word.trim().toLowerCase())), [app.state.words]);
  const duplicateCount = useMemo(() => {
    const seen = new Set<string>();
    let dup = 0;
    for (const r of validRows) {
      const key = r.word.trim().toLowerCase();
      if (existingWordSet.has(key) || seen.has(key)) dup++;
      seen.add(key);
    }
    return dup;
  }, [validRows, existingWordSet]);

  const requiredMapped = REQUIRED_FIELDS.every((f) => mapping[f] !== null);

  function runImport() {
    const rowsToAdd: Omit<Word, 'id' | 'createdAt' | 'srs'>[] = validRows.map((r) => ({
      word: r.word,
      phonetic: r.phonetic,
      meaning: r.meaning,
      example: r.example,
      exampleTranslation: r.exampleTranslation,
      category: r.category,
      examType: r.examType,
      favorite: false,
    }));
    const { added, skippedDuplicates } = app.addWordsBulk(rowsToAdd, { skipDuplicates });
    setResult({ added, skippedDuplicates, invalid: invalidCount });
    setStep('result');
  }

  function setFieldMapping(field: MappableField, value: string) {
    setMapping((m) => ({ ...m, [field]: value === '' ? null : Number(value) }));
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        data-testid="bulk-import-modal"
        className="animate-slide-up max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-5 dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">파일로 단어 가져오기</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        {step === 'select' && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-slate-500">
              Excel(.xlsx) 또는 CSV(.csv), Word(.docx) 파일을 업로드하면 단어 목록을 한 번에 불러올 수 있어요. 파일에 "단어 / 뜻 / 예문" 형식의 열이 있으면 자동으로 인식하고, 다르면 직접 매칭할 수 있어요.
            </p>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              className={`flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition ${
                dragOver ? 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950' : 'border-slate-300 dark:border-slate-700'
              }`}
            >
              <span className="grid h-11 w-11 place-items-center rounded-full bg-indigo-50 text-indigo-500 dark:bg-indigo-950 dark:text-indigo-400">
                <Icon name="plus" className="h-5 w-5" />
              </span>
              <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">파일을 선택하거나 여기로 드래그하세요</span>
              <span className="text-xs text-slate-400">.xlsx · .csv · .docx</span>
              <input type="file" accept=".xlsx,.xls,.csv,.docx" className="hidden" onChange={onFileInputChange} />
            </label>
          </div>
        )}

        {step === 'parsing' && (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Icon name="refresh" className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="text-sm text-slate-500">{fileName} 파일을 분석하고 있어요...</p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-rose-50 text-rose-500 dark:bg-rose-950">
              <Icon name="x" className="h-6 w-6" />
            </span>
            <p className="text-sm text-rose-500">{errorMsg}</p>
            <Button variant="secondary" onClick={() => setStep('select')}>
              다시 시도
            </Button>
          </div>
        )}

        {step === 'mapping' && (
          <div className="flex flex-col gap-4">
            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">첫 번째 행은 제목(헤더) 행이에요</span>
              <input
                type="checkbox"
                checked={hasHeader}
                onChange={(e) => toggleHasHeader(e.target.checked)}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>

            <div className="flex flex-col gap-2.5">
              <p className="text-xs font-semibold text-slate-500">열 매칭 ({fileName})</p>
              {FIELD_ORDER.map((field) => (
                <div key={field} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    {FIELD_LABELS[field]}
                    {REQUIRED_FIELDS.includes(field) && <span className="text-rose-500"> *</span>}
                  </span>
                  <select
                    className="input flex-1"
                    value={mapping[field] ?? ''}
                    onChange={(e) => setFieldMapping(field, e.target.value)}
                  >
                    <option value="">사용 안 함</option>
                    {rows[0]?.map((_, idx) => (
                      <option key={idx} value={idx}>
                        {columnLabel(idx, headerRow)}
                      </option>
                    ))}
                  </select>
                  {OPTIONAL_DEFAULTABLE.includes(field) && mapping[field] === null && (
                    <DefaultValueControl field={field} defaults={defaults} setDefaults={setDefaults} />
                  )}
                </div>
              ))}
            </div>

            <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5 text-sm dark:border-slate-800">
              <span className="text-slate-600 dark:text-slate-300">이미 등록된 단어는 건너뛰기</span>
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="h-5 w-5 accent-indigo-600"
              />
            </label>

            <div>
              <p className="mb-2 text-xs font-semibold text-slate-500">
                미리보기 · 총 {importedRows.length}행 · 유효 {validRows.length}개
                {invalidCount > 0 && <span className="text-rose-500"> · 형식 오류 {invalidCount}개</span>}
                {skipDuplicates && duplicateCount > 0 && <span className="text-amber-500"> · 중복 {duplicateCount}개 건너뜀</span>}
              </p>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-2 py-1.5 font-semibold text-slate-500">단어</th>
                      <th className="px-2 py-1.5 font-semibold text-slate-500">뜻</th>
                      <th className="px-2 py-1.5 font-semibold text-slate-500">예문</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importedRows.slice(0, 30).map((r, i) => (
                      <tr key={i} className={`border-t border-slate-100 dark:border-slate-800 ${!r.valid ? 'bg-rose-50 dark:bg-rose-950/40' : ''}`}>
                        <td className="px-2 py-1.5 font-medium text-slate-700 dark:text-slate-200">{r.word || <em className="text-rose-400">누락</em>}</td>
                        <td className="px-2 py-1.5 text-slate-500">{r.meaning || <em className="text-rose-400">누락</em>}</td>
                        <td className="max-w-[120px] truncate px-2 py-1.5 text-slate-400">{r.example}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {importedRows.length > 30 && <p className="mt-1 text-[11px] text-slate-400">처음 30개 행만 미리 보여드려요.</p>}
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setStep('select')}>
                다른 파일 선택
              </Button>
              <Button className="flex-1" disabled={!requiredMapped || validRows.length === 0} onClick={runImport}>
                {validRows.length}개 단어 가져오기
              </Button>
            </div>
            {!requiredMapped && <p className="text-center text-xs text-rose-500">단어와 뜻 열을 매칭해주세요.</p>}
          </div>
        )}

        {step === 'result' && result && (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-500 dark:bg-emerald-950">
              <Icon name="check" className="h-7 w-7" />
            </span>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{result.added}개 단어를 가져왔어요</p>
            <div className="flex flex-wrap justify-center gap-2 text-xs">
              {result.skippedDuplicates > 0 && <Badge tone="amber">중복 {result.skippedDuplicates}개 건너뜀</Badge>}
              {result.invalid > 0 && <Badge tone="rose">형식 오류 {result.invalid}개 제외</Badge>}
            </div>
            <Button className="mt-2 w-full" onClick={onClose}>
              확인
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function DefaultValueControl({
  field,
  defaults,
  setDefaults,
}: {
  field: MappableField;
  defaults: ImportDefaults;
  setDefaults: (updater: (d: ImportDefaults) => ImportDefaults) => void;
}) {
  if (field === 'category') {
    return (
      <input
        className="input w-28 shrink-0 text-xs"
        placeholder="기본 카테고리"
        value={defaults.category}
        onChange={(e) => setDefaults((d) => ({ ...d, category: e.target.value }))}
      />
    );
  }
  return (
    <select
      className="input w-24 shrink-0 text-xs"
      value={defaults.examType}
      onChange={(e) => setDefaults((d) => ({ ...d, examType: e.target.value as ExamType }))}
    >
      {EXAM_TYPES.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}
