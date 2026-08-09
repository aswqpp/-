import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import type { DifficultyLevel } from '../types';
import { DIFFICULTY_LABEL } from '../lib/difficulty';
import { Icon } from './Icon';

export function Card({
  children,
  className = '',
  padding = 'p-4',
}: PropsWithChildren<{ className?: string; padding?: string }>) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white ${padding} shadow-sm dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }: PropsWithChildren<{ action?: ReactNode }>) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">{children}</h2>
      {action}
    </div>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-300',
  secondary:
    'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
  ghost: 'bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
  danger: 'bg-rose-600 text-white hover:bg-rose-500 active:bg-rose-700 disabled:bg-rose-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-emerald-300',
};

export function Button({
  variant = 'primary',
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${variantClasses[variant]} ${className}`}
      {...rest}
    />
  );
}

export function ProgressBar({ value, max, className = '' }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800 ${className}`}>
      <div
        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-300 px-6 py-12 text-center dark:border-slate-700">
      <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">{title}</p>
      {description && <p className="text-xs text-slate-400">{description}</p>}
      {action}
    </div>
  );
}

export function Badge({ children, tone = 'slate' }: PropsWithChildren<{ tone?: 'slate' | 'indigo' | 'green' | 'amber' | 'rose' }>) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  );
}

type ChipTone = 'indigo' | 'amber' | 'rose' | 'green' | 'slate';

const CHIP_ACTIVE: Record<ChipTone, string> = {
  indigo: 'border-indigo-300 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-400',
  amber: 'border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  rose: 'border-rose-300 bg-rose-50 text-rose-600 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  green: 'border-emerald-300 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  slate: 'border-slate-400 bg-slate-100 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200',
};

const CHIP_IDLE =
  'border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700 dark:text-slate-400 dark:hover:border-slate-600';

/** Toggleable filter chip. `count` renders a trailing match count when provided. */
export function FilterChip({
  active,
  onToggle,
  tone = 'indigo',
  count,
  children,
}: PropsWithChildren<{ active: boolean; onToggle: () => void; tone?: ChipTone; count?: number }>) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onToggle}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition active:scale-95 ${
        active ? CHIP_ACTIVE[tone] : CHIP_IDLE
      }`}
    >
      {children}
      {count !== undefined && <span className={active ? 'opacity-70' : 'opacity-50'}>{count}</span>}
    </button>
  );
}

const DIFFICULTY_BUTTON_TONE: Record<DifficultyLevel, string> = {
  unrated: 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500',
  easy: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  hard: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
};

/**
 * Read-only difficulty chip. Difficulty is measured from the learner's own
 * accuracy, so there is nothing to set by hand — the tooltip says as much.
 */
export function DifficultyBadge({
  value,
  wrongRate,
  className = '',
}: {
  value: DifficultyLevel;
  /** Raw wrong rate 0-1, or null when the word has never been attempted. */
  wrongRate?: number | null;
  className?: string;
}) {
  const title =
    wrongRate === null || wrongRate === undefined
      ? '아직 풀어본 적이 없어 난이도를 알 수 없어요 (미평가)'
      : `오답률 ${Math.round(wrongRate * 100)}% · 난이도는 오답률로 자동 계산됩니다`;

  return (
    <span
      title={title}
      className={`inline-flex min-w-6 items-center justify-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${DIFFICULTY_BUTTON_TONE[value]} ${className}`}
    >
      {DIFFICULTY_LABEL[value]}
    </span>
  );
}

export function FavoriteStarButton({
  active,
  onToggle,
  className = '',
}: {
  active: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={active ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={`grid place-items-center rounded-full transition active:scale-90 ${
        active ? 'text-amber-400' : 'text-slate-300 hover:text-amber-300 dark:text-slate-600'
      } ${className}`}
    >
      <Icon name="star" className="h-full w-full" fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
