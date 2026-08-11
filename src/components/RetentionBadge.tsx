import { AT_RISK_BELOW } from '../lib/memory';

/**
 * Predicted chance of recalling the word right now, from the forgetting curve.
 * Null means the word has never been reviewed, so there is no curve yet — shown as
 * "-" rather than 0%, which would read as "definitely forgotten".
 */
export function RetentionBadge({ value, className = '' }: { value: number | null; className?: string }) {
  if (value == null) {
    return (
      <span
        title="아직 복습 기록이 없어 예상 기억률을 계산할 수 없어요."
        className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-400 dark:bg-slate-800 ${className}`}
      >
        기억률 -
      </span>
    );
  }

  const pct = Math.round(value * 100);
  const tone =
    value < AT_RISK_BELOW
      ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300'
      : value < 0.9
        ? 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300'
        : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300';

  return (
    <span
      title="마지막 복습 이후 지난 시간과 현재 복습 간격으로 계산한 예상 기억률이에요."
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone} ${className}`}
    >
      기억률 {pct}%
    </span>
  );
}
