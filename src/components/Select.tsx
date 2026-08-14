import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
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
  maxHeight: number;
}

const MAX_LIST_HEIGHT = 320;
const MIN_LIST_HEIGHT = 180;
const VIEWPORT_MARGIN = 12;

/** Above this many options the list gets a filter field — twenty folders is a lot to scroll. */
const FILTER_THRESHOLD = 8;

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
 * space below is tight, and sizes itself to the room actually available.
 */
export function Select({
  value,
  options,
  onChange,
  className = '',
  ariaLabel,
  placeholder = '선택',
  filterPlaceholder = '검색',
}: {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
  filterPlaceholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const [active, setActive] = useState(0);
  const [query, setQuery] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);
  const showFilter = options.length > FILTER_THRESHOLD;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  /** Pins the portalled list to the trigger, in viewport coordinates. */
  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const below = window.innerHeight - rect.bottom - VIEWPORT_MARGIN;
    const above = rect.top - VIEWPORT_MARGIN;
    // Flip only when going up genuinely buys room worth having.
    const flip = below < MIN_LIST_HEIGHT && above > below;
    const room = flip ? above : below;

    setPosition({
      left: rect.left,
      width: rect.width,
      maxHeight: Math.max(MIN_LIST_HEIGHT, Math.min(MAX_LIST_HEIGHT, room)),
      ...(flip ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // Opening starts on the current value; typing a filter restarts at the top.
  useEffect(() => {
    if (!open) return;
    const index = visible.findIndex((o) => o.value === value);
    setActive(index >= 0 ? index : 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      // The list is portalled, so "outside" has to consider both elements.
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = (e: Event) => {
      // Scrolling the list itself is not a reason to close it. Scroll events do not
      // bubble, but they do reach window in the capture phase, so without this the
      // popover shut the moment it was scrolled and only the first screenful of
      // options could ever be reached.
      if (listRef.current?.contains(e.target as Node)) return;

      // Any other scroll moves the trigger, and the list is positioned in viewport
      // coordinates — so follow it rather than closing. Closing on the surrounding
      // scroll used to lose the list to a momentum scroll still settling under the
      // tap that opened it. It only shuts once the trigger is off screen.
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) {
        setOpen(false);
        return;
      }
      place();
    };
    const onResize = () => setOpen(false);

    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  useEffect(() => {
    if (open && showFilter) inputRef.current?.focus();
  }, [open, showFilter]);

  function toggle() {
    setQuery('');
    setOpen((v) => !v);
  }

  function choose(index: number) {
    const option = visible[index];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (open) e.stopPropagation(); // don't also dismiss the surrounding modal
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        toggle();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(visible.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'PageDown') {
      e.preventDefault();
      setActive((i) => Math.min(visible.length - 1, i + 5));
    } else if (e.key === 'PageUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 5));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(visible.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(active);
    } else if (e.key === ' ' && !showFilter) {
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
        onClick={toggle}
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
            ref={listRef}
            onKeyDown={onKeyDown}
            style={{
              position: 'fixed',
              left: position.left,
              width: position.width,
              top: position.top,
              bottom: position.bottom,
              maxHeight: position.maxHeight,
            }}
            className="animate-pop-in z-50 flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-800"
          >
            {showFilter && (
              <div className="border-b border-slate-100 p-1.5 dark:border-slate-700">
                <div className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2 dark:bg-slate-900">
                  <Icon name="search" className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={filterPlaceholder}
                    aria-label={filterPlaceholder}
                    className="w-full bg-transparent py-1.5 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-slate-100"
                  />
                </div>
              </div>
            )}

            <div id={listId} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1">
              {visible.length === 0 ? (
                <p className="px-2.5 py-4 text-center text-xs text-slate-400">일치하는 항목이 없어요.</p>
              ) : (
                visible.map((option, i) => {
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
                })
              )}
            </div>

            {showFilter && (
              <p className="border-t border-slate-100 px-2.5 py-1.5 text-[11px] text-slate-400 dark:border-slate-700">
                {query.trim() ? `${visible.length} / ${options.length}개` : `${options.length}개`}
              </p>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
