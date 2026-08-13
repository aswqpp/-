import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface SelectOption {
  value: string;
  label: string;
  /** Small muted text on the right of the row — counts, hints. */
  hint?: string;
}

interface Position {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
}

const MAX_LIST_HEIGHT = 288;
const VIEWPORT_MARGIN = 8;

/**
 * Dropdown that replaces the native `<select>`.
 *
 * A native select opens an operating-system menu that ignores the page entirely:
 * on a dark theme it drops a white list with a system-blue highlight, in the
 * platform font, at the platform size. This renders the list itself so it stays in
 * the app's palette, and so a long list of categories can be scanned comfortably.
 *
 * The list goes through a portal and is positioned in viewport coordinates. Two of
 * these live inside modals whose bodies scroll, and an absolutely-positioned popover
 * would simply be cut off at the modal's edge. It flips above the trigger when the
 * space below is too tight, and closes on any scroll rather than drifting away from
 * the control it belongs to.
 */
export function Select({
  value,
  options,
  onChange,
  className = '',
  ariaLabel,
  placeholder = '선택',
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [active, setActive] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  useLayoutEffect(() => {
    if (!open) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const above = rect.top - VIEWPORT_MARGIN;
    const flip = below < Math.min(MAX_LIST_HEIGHT, above) && above > below;

    setPosition({
      left: rect.left,
      width: rect.width,
      ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
    setActive(selectedIndex >= 0 ? selectedIndex : 0);
  }, [open, selectedIndex]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // The list is portalled, so "outside" has to consider both elements.
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  function choose(index: number) {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (open) e.stopPropagation(); // don't also dismiss the surrounding modal
      setOpen(false);
      return;
    }
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(options.length - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  }

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
          open
            ? 'border-indigo-400 bg-white ring-2 ring-indigo-100 dark:border-indigo-500 dark:bg-slate-800 dark:ring-indigo-950'
            : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600'
        }`}
      >
        <span className={`truncate ${selected ? 'text-slate-800 dark:text-slate-100' : 'text-slate-400'}`}>
          {selected?.label ?? placeholder}
        </span>
        <Icon
          name="chevron-right"
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${open ? '-rotate-90' : 'rotate-90'}`}
        />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            id={listId}
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            onKeyDown={onKeyDown}
            style={{
              position: 'fixed',
              left: position.left,
              width: position.width,
              top: position.top,
              bottom: position.bottom,
              maxHeight: MAX_LIST_HEIGHT,
            }}
            className="animate-pop-in z-50 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            {options.map((option, i) => {
              const isSelected = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-active={i === active}
                  onPointerEnter={() => setActive(i)}
                  onClick={() => choose(i)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    i === active ? 'bg-slate-100 dark:bg-slate-700' : ''
                  } ${isSelected ? 'font-semibold text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}
                >
                  <Icon
                    name="check"
                    className={`h-3.5 w-3.5 shrink-0 ${isSelected ? 'text-indigo-600 dark:text-indigo-400' : 'invisible'}`}
                  />
                  <span className="flex-1 truncate">{option.label}</span>
                  {option.hint && (
                    <span className="shrink-0 text-[11px] tabular-nums text-slate-400">{option.hint}</span>
                  )}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
