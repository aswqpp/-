import type { Item } from './variants.ts';

export type Result = 'WIN' | 'LOSE' | 'DRAW';

/** O(1) circular judge, from a's point of view. */
export function judge(a: number, b: number, n: number): Result {
  if (a === b) return 'DRAW';
  const diff = (b - a + n) % n;
  return diff <= (n - 1) / 2 ? 'WIN' : 'LOSE';
}

/** Items `id` beats and loses to, in ring order. */
export function matchups<T>(items: T[], id: number): { beats: T[]; loses: T[] } {
  const n = items.length;
  const half = (n - 1) / 2;
  const beats: T[] = [];
  const loses: T[] = [];
  for (let s = 1; s <= half; s++) beats.push(items[(id + s) % n]);
  for (let s = half + 1; s < n; s++) loses.push(items[(id + s) % n]);
  return { beats, loses };
}

const EXACT_VERBS: Record<string, string> = {
  'Rock>Scissors': 'CRUSHES',
  'Rock>Lizard': 'CRUSHES',
  'Rock>Fire': 'POUNDS',
  'Paper>Rock': 'COVERS',
  'Paper>Spock': 'DISPROVES',
  'Scissors>Paper': 'CUTS',
  'Scissors>Lizard': 'SLICES',
  'Lizard>Spock': 'POISONS',
  'Lizard>Paper': 'EATS',
  'Spock>Scissors': 'SMASHES',
  'Spock>Rock': 'VAPORIZES',
  'Fire>Scissors': 'MELTS',
  'Fire>Paper': 'BURNS',
  'Fire>Tree': 'BURNS',
  'Fire>Sponge': 'BURNS',
  'Water>Fire': 'DOUSES',
  'Water>Rock': 'ERODES',
  'Air>Fire': 'BLOWS OUT',
  'Air>Water': 'EVAPORATES',
  'Sponge>Water': 'SOAKS',
  'Sponge>Paper': 'SOAKS',
  'Gun>Rock': 'SHATTERS',
  'Gun>Wolf': 'SHOOTS',
  'Gun>Human': 'SHOOTS',
  'Lightning>Tree': 'SPLITS',
  'Dragon>Devil': 'SCORCHES',
  'Nuke>Rock': 'OBLITERATES',
};

const FALLBACK_VERBS = ['CRUSHES', 'BEATS', 'BREAKS', 'SHATTERS', 'STRIKES', 'TOPPLES', 'OVERWHELMS'];

export function clashCallout(win: Item, lose: Item): string {
  const verb = EXACT_VERBS[`${win.name}>${lose.name}`]
    ?? FALLBACK_VERBS[(win.id * 7 + lose.id * 3) % FALLBACK_VERBS.length];
  return `${win.name} ${verb} ${lose.name}`.toUpperCase();
}

export function fmtId(id: number, n: number): string {
  return '#' + String(id).padStart(n >= 100 ? 3 : 2, '0');
}
