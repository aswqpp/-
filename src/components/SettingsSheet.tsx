import { useRef, useState, type ChangeEvent } from 'react';
import type { AppState } from '../types';
import type { UseAppState } from '../hooks/useAppState';
import { Button, Badge } from './ui';
import { Icon } from './Icon';
import { downloadBackup, parseBackup } from '../lib/backup';

type Notice = { tone: 'ok' | 'error'; text: string } | null;

export function SettingsSheet({ app, onClose }: { app: UseAppState; onClose: () => void }) {
  const { settings, words } = app.state;
  const [goalInput, setGoalInput] = useState(String(settings.dailyGoal));
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState<{ state: AppState; exportedAt: string | null } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function commitGoal(raw: string) {
    const parsed = Number.parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? Math.min(500, Math.max(1, parsed)) : settings.dailyGoal;
    setGoalInput(String(next));
    app.updateSettings({ dailyGoal: next });
  }

  function handleExport() {
    try {
      const name = downloadBackup(app.state);
      setNotice({ tone: 'ok', text: `${name} 파일로 내보냈어요. 안전한 곳에 보관해주세요.` });
    } catch {
      setNotice({ tone: 'error', text: '내보내기에 실패했어요.' });
    }
  }

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking the same file
    if (!file) return;
    setNotice(null);
    try {
      const parsed = parseBackup(await file.text());
      setPending(parsed);
    } catch (err) {
      setPending(null);
      setNotice({ tone: 'error', text: err instanceof Error ? err.message : '가져오기에 실패했어요.' });
    }
  }

  function confirmMerge() {
    if (!pending) return;
    const { added, skipped } = app.mergeFromBackup(pending.state);
    setPending(null);
    setNotice({
      tone: 'ok',
      text: `${added}개 단어를 추가했어요.${skipped > 0 ? ` 이미 있는 ${skipped}개는 건너뛰었어요.` : ''}`,
    });
  }

  function handleDeleteAll() {
    if (words.length === 0) return;
    // Two-step on purpose: this is unrecoverable and sits next to harmless controls.
    if (!confirm(`단어 ${words.length}개와 학습 기록을 모두 삭제할까요? 되돌릴 수 없어요.`)) return;
    if (!confirm('정말 삭제할까요? 마지막 확인이에요.')) return;
    app.deleteAllWords();
    setPending(null);
    setNotice({ tone: 'ok', text: '모든 단어와 학습 기록을 삭제했어요.' });
  }

  function confirmReplace() {
    if (!pending) return;
    if (!confirm(`현재 단어 ${words.length}개와 학습 기록이 모두 사라지고 백업 내용으로 대체돼요. 계속할까요?`)) return;
    const count = pending.state.words.length;
    app.replaceState(pending.state);
    setPending(null);
    setNotice({ tone: 'ok', text: `백업을 복원했어요. 단어 ${count}개.` });
  }

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        data-testid="settings-sheet"
        className="animate-slide-up max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">설정</h3>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <Icon name="x" className="h-4 w-4" />
          </button>
        </div>

        <section className="mb-5">
          <p className="mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400">하루 학습 목표</p>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={500}
              className="input w-24"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              onBlur={(e) => commitGoal(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitGoal((e.target as HTMLInputElement).value)}
            />
            <span className="text-sm text-slate-500">개 / 일</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">홈 화면에 오늘 진행률로 표시돼요.</p>
        </section>

        <section className="border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">데이터 백업</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            단어와 학습 기록은 이 브라우저에만 저장돼요. 브라우저 데이터를 지우거나 기기를 바꾸면 사라지니,
            가끔 파일로 내보내 두시는 걸 권해요.
          </p>

          <div className="mt-3 flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={handleExport}>
              <Icon name="chevron-right" className="h-4 w-4 rotate-90" /> 내보내기
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => fileRef.current?.click()}>
              <Icon name="chevron-left" className="h-4 w-4 rotate-90" /> 가져오기
            </Button>
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFile} />
          </div>

          <p className="mt-2 text-[11px] text-slate-400">
            현재 단어 {words.length}개 · 학습 기록 {app.state.log.length}일치
          </p>
        </section>

        {pending && (
          <div className="animate-pop-in mt-4 rounded-xl border border-indigo-200 bg-indigo-50 p-3 dark:border-indigo-900 dark:bg-indigo-950/40">
            <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              백업 파일에 단어 {pending.state.words.length}개
            </p>
            {pending.exportedAt && (
              <p className="mt-0.5 text-[11px] text-slate-400">내보낸 날짜: {pending.exportedAt.slice(0, 10)}</p>
            )}
            <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">어떻게 가져올까요?</p>
            <div className="mt-2 flex gap-2">
              <Button className="flex-1" onClick={confirmMerge}>
                합치기
              </Button>
              <Button variant="danger" className="flex-1" onClick={confirmReplace}>
                덮어쓰기
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              합치기는 없는 단어만 추가하고 현재 학습 기록을 유지해요. 덮어쓰기는 전부 백업 내용으로 대체해요.
            </p>
            <button onClick={() => setPending(null)} className="mt-2 text-[11px] font-semibold text-slate-400 hover:text-slate-600">
              취소
            </button>
          </div>
        )}

        {notice && (
          <p className={`mt-4 text-xs ${notice.tone === 'ok' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
            {notice.text}
          </p>
        )}

        <section className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-xs font-semibold text-rose-500">위험 구역</p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
            단어 {words.length}개와 모든 학습 기록이 지워져요. 되돌릴 수 없으니, 필요하면 먼저 내보내 두세요.
          </p>
          <Button variant="danger" className="mt-2 w-full" onClick={handleDeleteAll} disabled={words.length === 0}>
            <Icon name="trash" className="h-4 w-4" /> 모든 단어 삭제
          </Button>
        </section>

        <section className="mt-5 border-t border-slate-100 pt-4 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">앱 정보</p>
              <p className="mt-0.5 text-[11px] text-slate-400">ASWQPP · 오프라인 사용 가능</p>
            </div>
            <Badge tone="indigo">PWA</Badge>
          </div>
        </section>
      </div>
    </div>
  );
}
