/**
 * How items are drawn: the RPS-101 hand symbols (default) or emoji.
 * Chosen in SETTINGS and remembered per browser.
 */
import type { Item } from '../shared/variants';
import { HAND_FILES } from './hand-files';

export type IconStyle = 'HAND' | 'EMOJI';
export const ICON_STYLES: IconStyle[] = ['HAND', 'EMOJI'];

const KEY = 'rps.icons';

function load(): IconStyle {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'EMOJI' ? 'EMOJI' : 'HAND';
  } catch {
    return 'HAND';
  }
}

let style: IconStyle = load();

export function iconStyle(): IconStyle {
  return style;
}

export function setIconStyle(next: IconStyle): void {
  style = next;
  try {
    localStorage.setItem(KEY, next);
  } catch {
    /* private mode: the choice lasts for this visit */
  }
}

/** URL of the hand symbol for `item`, or null when emoji should be used. */
export function handUrl(item: Pick<Item, 'name'>): string | null {
  if (style !== 'HAND') return null;
  const file = HAND_FILES[item.name];
  return file ? `/hands/${file}` : null;
}

/**
 * HTML for an item's icon in a `px`-sized box. Hand symbols are decorative
 * (the item name is always printed next to them), so alt is empty.
 */
export function iconHtml(item: Item | null | undefined, px: number): string {
  if (!item) return `<span class="inline-block text-ink/40" style="font-size:${Math.round(px * 0.7)}px;line-height:1">·</span>`;
  const url = handUrl(item);
  if (url) {
    return `<img src="${url}" alt="" width="${px}" height="${px}" draggable="false" loading="lazy" decoding="async" class="inline-block align-middle shrink-0 select-none pointer-events-none" style="width:${px}px;height:${px}px">`;
  }
  return `<span class="inline-block align-middle select-none leading-none" style="font-size:${Math.round(px * 0.72)}px">${item.emoji}</span>`;
}
