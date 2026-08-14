/**
 * True when a keystroke belongs to whatever the user is typing into.
 *
 * Session shortcuts are single letters and digits, which are also perfectly ordinary
 * things to type into the spelling box. Every shortcut handler checks this first.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  const tag = el.tagName.toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable === true;
}

/** True when the keystroke carries a modifier — those belong to the browser or the OS. */
export function hasModifier(e: KeyboardEvent): boolean {
  return e.ctrlKey || e.metaKey || e.altKey;
}
