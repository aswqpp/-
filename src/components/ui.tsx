import type { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from 'react';
import type { Difficulty } from '../types';
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

const DIFFICULTY_ORDER: Difficulty[] = ['easy', 'medium', 'hard'];
const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: '쉬움', medium: '보통', hard: '어려움' };

const DIFFICULTY_BUTTON_TONE: Record<Difficulty, string> = {
  easy: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300',
  medium: 'bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300',
  hard: 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300',
};

/** Tap-to-cycle difficulty control (easy → medium → hard → easy), replacing the old dropdown. */
export function DifficultyCycleBadge({
  value,
  onChange,
  className = '',
}: {
  value: Difficulty;
  onChange: (next: Difficulty) => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      title="탭해서 난이도 변경"
      onClick={(e) => {
        e.stopPropagation();
        const idx = DIFFICULTY_ORDER.indexOf(value);
        onChange(DIFFICULTY_ORDER[(idx + 1) % DIFFICULTY_ORDER.length]);
      }}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold transition active:scale-95 ${DIFFICULTY_BUTTON_TONE[value]} ${className}`}
    >
      {DIFFICULTY_LABEL[value]}
    </button>
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
