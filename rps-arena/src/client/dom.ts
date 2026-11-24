export function $<T extends HTMLElement = HTMLElement>(id: string): T {
  const el = document.getElementById(id);
  if (!el) throw new Error(`#${id} missing`);
  return el as T;
}

export function esc(str: unknown): string {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[m] as string));
}

export function toast(msg: string): void {
  const box = $('toast-box');
  const el = document.createElement('div');
  el.className = 'pointer-events-auto px-3.5 py-2 bg-ink text-stock border-[1.5px] border-ink rounded-[3px] font-mono text-xs font-bold uppercase shadow-[3px_3px_0_#5C7057]';
  el.textContent = msg;
  box.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.18s ease';
    setTimeout(() => el.remove(), 200);
  }, 1700);
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const tmp = document.createElement('textarea');
    tmp.value = text;
    tmp.style.position = 'fixed';
    tmp.style.opacity = '0';
    document.body.appendChild(tmp);
    tmp.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch {
      ok = false;
    }
    tmp.remove();
    return ok;
  }
}

/**
 * Fill `el` with one tactile button per option. `onPick` is skipped when
 * `disabled` (non-host players see the room settings read-only).
 */
export function optionGrid<T extends string | number>(
  el: HTMLElement,
  options: readonly T[],
  active: T,
  opts: {
    label?: (v: T) => string;
    sub?: (v: T) => string;
    onPick: (v: T) => void;
    disabled?: boolean;
    tone?: 'ink' | 'deep';
    size?: 'sm' | 'lg';
  },
): void {
  const { label = String, sub, onPick, disabled = false, tone = 'ink', size = 'sm' } = opts;
  const on = tone === 'deep' ? 'bg-deep text-stock' : 'bg-ink text-stock';
  el.innerHTML = options.map((v, i) => {
    const act = v === active;
    const cls = size === 'lg'
      ? 'py-2.5 px-2 flex flex-col items-center justify-center'
      : 'h-9 font-mono text-xs font-bold';
    return `
      <button type="button" data-opt="${i}" ${disabled ? 'disabled' : ''} aria-pressed="${act}"
        class="btn ${cls} ${act ? on : 'bg-stock text-ink'}">
        ${size === 'lg'
          ? `<span class="font-sans font-bold text-sm leading-tight">${esc(label(v))}</span>
             ${sub ? `<span class="font-mono text-[10px] font-semibold mt-0.5 ${act ? 'text-paper' : 'text-ink/65'}">${esc(sub(v))}</span>` : ''}`
          : esc(label(v))}
      </button>`;
  }).join('');
  if (disabled) return;
  el.querySelectorAll<HTMLButtonElement>('[data-opt]').forEach((btn) => {
    btn.addEventListener('click', () => onPick(options[Number(btn.dataset.opt)]));
  });
}

export function segTabClass(active: boolean, first: boolean): string {
  return `h-8 px-4 font-mono text-[11px] font-bold uppercase tracking-wider transition ${first ? '' : 'border-l-[1.5px] border-ink '}${
    active ? 'bg-ink text-stock' : 'bg-stock text-ink hover:bg-paper'
  }`;
}
