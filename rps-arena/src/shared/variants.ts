/**
 * Variant datasets. Every variant is a circle of N (odd) items:
 *   diff = (b - a + N) % N;  a beats b when 1 <= diff <= (N - 1) / 2
 */
export type Category = 'Nature' | 'Animals' | 'War' | 'People' | 'Tech' | 'Myth';

export interface Item {
  id: number;
  name: string;
  cat: Category;
  emoji: string;
}

export interface Variant {
  n: number;
  label: string;
  sub: string;
  items: Item[];
}

type RawItem = Omit<Item, 'id'>;

const RPS_101_LIST: RawItem[] = [
  { name: 'Dynamite', cat: 'War', emoji: '🧨' },
  { name: 'Tornado', cat: 'Nature', emoji: '🌪️' },
  { name: 'Quicksand', cat: 'Nature', emoji: '🏜️' },
  { name: 'Pit', cat: 'War', emoji: '🕳️' },
  { name: 'Chain', cat: 'War', emoji: '⛓️' },
  { name: 'Gun', cat: 'War', emoji: '🔫' },
  { name: 'Law', cat: 'People', emoji: '⚖️' },
  { name: 'Whip', cat: 'War', emoji: '🪢' },
  { name: 'Sword', cat: 'War', emoji: '⚔️' },
  { name: 'Rock', cat: 'Nature', emoji: '🪨' },
  { name: 'Death', cat: 'Myth', emoji: '💀' },
  { name: 'Wall', cat: 'Tech', emoji: '🧱' },
  { name: 'Sun', cat: 'Nature', emoji: '☀️' },
  { name: 'Camera', cat: 'Tech', emoji: '📷' },
  { name: 'Fire', cat: 'Nature', emoji: '🔥' },
  { name: 'Chainsaw', cat: 'War', emoji: '🪚' },
  { name: 'School', cat: 'People', emoji: '🏫' },
  { name: 'Scissors', cat: 'Tech', emoji: '✂️' },
  { name: 'Poison', cat: 'War', emoji: '🧪' },
  { name: 'Cage', cat: 'War', emoji: '🔒' },
  { name: 'Axe', cat: 'War', emoji: '🪓' },
  { name: 'Peace', cat: 'Myth', emoji: '🕊️' },
  { name: 'Computer', cat: 'Tech', emoji: '💻' },
  { name: 'Castle', cat: 'People', emoji: '🏰' },
  { name: 'Snake', cat: 'Animals', emoji: '🐍' },
  { name: 'Blood', cat: 'Nature', emoji: '🩸' },
  { name: 'Porcupine', cat: 'Animals', emoji: '🦔' },
  { name: 'Vulture', cat: 'Animals', emoji: '🦅' },
  { name: 'Monkey', cat: 'Animals', emoji: '🐒' },
  { name: 'King', cat: 'People', emoji: '👑' },
  { name: 'Queen', cat: 'People', emoji: '👸' },
  { name: 'Prince', cat: 'People', emoji: '🤴' },
  { name: 'Princess', cat: 'People', emoji: '💃' },
  { name: 'Police', cat: 'People', emoji: '👮' },
  { name: 'Woman', cat: 'People', emoji: '👩' },
  { name: 'Baby', cat: 'People', emoji: '👶' },
  { name: 'Man', cat: 'People', emoji: '👨' },
  { name: 'Home', cat: 'People', emoji: '🏠' },
  { name: 'Train', cat: 'Tech', emoji: '🚆' },
  { name: 'Car', cat: 'Tech', emoji: '🚗' },
  { name: 'Noise', cat: 'Myth', emoji: '📢' },
  { name: 'Bicycle', cat: 'Tech', emoji: '🚲' },
  { name: 'Tree', cat: 'Nature', emoji: '🌳' },
  { name: 'Turnip', cat: 'Nature', emoji: '🧅' },
  { name: 'Duck', cat: 'Animals', emoji: '🦆' },
  { name: 'Wolf', cat: 'Animals', emoji: '🐺' },
  { name: 'Cat', cat: 'Animals', emoji: '🐱' },
  { name: 'Bird', cat: 'Animals', emoji: '🐦' },
  { name: 'Fish', cat: 'Animals', emoji: '🐟' },
  { name: 'Spider', cat: 'Animals', emoji: '🕷️' },
  { name: 'Cockroach', cat: 'Animals', emoji: '🪳' },
  { name: 'Brain', cat: 'People', emoji: '🧠' },
  { name: 'Community', cat: 'People', emoji: '👥' },
  { name: 'Cross', cat: 'Myth', emoji: '✝️' },
  { name: 'Money', cat: 'People', emoji: '💰' },
  { name: 'Vampire', cat: 'Myth', emoji: '🧛' },
  { name: 'Sponge', cat: 'Tech', emoji: '🧽' },
  { name: 'Church', cat: 'People', emoji: '⛪' },
  { name: 'Butter', cat: 'Tech', emoji: '🧈' },
  { name: 'Book', cat: 'Tech', emoji: '📖' },
  { name: 'Paper', cat: 'Tech', emoji: '📄' },
  { name: 'Cloud', cat: 'Nature', emoji: '☁️' },
  { name: 'Airplane', cat: 'Tech', emoji: '✈️' },
  { name: 'Moon', cat: 'Nature', emoji: '🌙' },
  { name: 'Grass', cat: 'Nature', emoji: '🌿' },
  { name: 'Film', cat: 'Tech', emoji: '🎞️' },
  { name: 'Toilet', cat: 'Tech', emoji: '🚽' },
  { name: 'Air', cat: 'Nature', emoji: '💨' },
  { name: 'Planet', cat: 'Nature', emoji: '🪐' },
  { name: 'Guitar', cat: 'Tech', emoji: '🎸' },
  { name: 'Bowl', cat: 'Tech', emoji: '🥣' },
  { name: 'Cup', cat: 'Tech', emoji: '☕' },
  { name: 'Beer', cat: 'Tech', emoji: '🍺' },
  { name: 'Rain', cat: 'Nature', emoji: '🌧️' },
  { name: 'Water', cat: 'Nature', emoji: '💧' },
  { name: 'TV', cat: 'Tech', emoji: '📺' },
  { name: 'Rainbow', cat: 'Nature', emoji: '🌈' },
  { name: 'UFO', cat: 'Myth', emoji: '🛸' },
  { name: 'Alien', cat: 'Myth', emoji: '👽' },
  { name: 'Prayer', cat: 'Myth', emoji: '🙏' },
  { name: 'Mountain', cat: 'Nature', emoji: '⛰️' },
  { name: 'Satan', cat: 'Myth', emoji: '😈' },
  { name: 'Dragon', cat: 'Myth', emoji: '🐉' },
  { name: 'Diamond', cat: 'Tech', emoji: '💎' },
  { name: 'Platinum', cat: 'Tech', emoji: '🥈' },
  { name: 'Gold', cat: 'Tech', emoji: '🥇' },
  { name: 'Devil', cat: 'Myth', emoji: '👹' },
  { name: 'Fence', cat: 'Tech', emoji: '🚧' },
  { name: 'Video Game', cat: 'Tech', emoji: '🎮' },
  { name: 'Math', cat: 'Myth', emoji: '🧮' },
  { name: 'Robot', cat: 'Tech', emoji: '🤖' },
  { name: 'Heart', cat: 'People', emoji: '❤️' },
  { name: 'Electricity', cat: 'Nature', emoji: '⚡' },
  { name: 'Lightning', cat: 'Nature', emoji: '🌩️' },
  { name: 'Meditate', cat: 'Myth', emoji: '🧘' },
  { name: 'Power', cat: 'Myth', emoji: '💪' },
  { name: 'Laser', cat: 'War', emoji: '💥' },
  { name: 'Nuke', cat: 'War', emoji: '☢️' },
  { name: 'Sky', cat: 'Nature', emoji: '🌌' },
  { name: 'Tank', cat: 'War', emoji: '🛡️' },
  { name: 'Helicopter', cat: 'War', emoji: '🚁' }
];

const ITEM_LOOKUP: Record<string, RawItem> = {};
RPS_101_LIST.forEach((it) => { ITEM_LOOKUP[it.name] = it; });
ITEM_LOOKUP['Lizard'] = { name: 'Lizard', cat: 'Animals', emoji: '🦎' };
ITEM_LOOKUP['Spock'] = { name: 'Spock', cat: 'People', emoji: '🖖' };
ITEM_LOOKUP['Human'] = { name: 'Human', cat: 'People', emoji: '🧑' };

function buildVariantItems(names: string[]): Item[] {
  return names.map((name, id) => {
    const ref = ITEM_LOOKUP[name] ?? { name, cat: 'Tech' as const, emoji: '●' };
    return { id, name: ref.name, cat: ref.cat, emoji: ref.emoji };
  });
}

export const VARIANT_KEYS = [3, 5, 7, 15, 25, 101] as const;
export type VariantN = (typeof VARIANT_KEYS)[number];

export const VARIANTS: Record<VariantN, Variant> = {
  3: { n: 3, label: 'RPS-3', sub: '3 · 1W', items: buildVariantItems(['Rock', 'Scissors', 'Paper']) },
  5: { n: 5, label: 'RPS-5', sub: '5 · 2W', items: buildVariantItems(['Rock', 'Scissors', 'Lizard', 'Paper', 'Spock']) },
  7: {
    n: 7, label: 'RPS-7', sub: '7 · 3W',
    items: buildVariantItems(['Rock', 'Fire', 'Scissors', 'Sponge', 'Paper', 'Air', 'Water']),
  },
  15: {
    n: 15, label: 'RPS-15', sub: '15 · 7W',
    items: buildVariantItems([
      'Rock', 'Fire', 'Scissors', 'Snake', 'Human', 'Tree', 'Wolf',
      'Sponge', 'Paper', 'Air', 'Water', 'Dragon', 'Devil', 'Lightning', 'Gun',
    ]),
  },
  25: {
    n: 25, label: 'RPS-25', sub: '25 · 12W',
    items: buildVariantItems([
      'Rock', 'Sun', 'Fire', 'Scissors', 'Axe', 'Snake', 'Monkey', 'Woman',
      'Man', 'Tree', 'Cockroach', 'Wolf', 'Sponge', 'Paper', 'Moon', 'Air',
      'Bowl', 'Water', 'Alien', 'Dragon', 'Devil', 'Lightning', 'Nuke',
      'Dynamite', 'Gun',
    ]),
  },
  101: { n: 101, label: 'RPS-101', sub: '101 · 50W', items: RPS_101_LIST.map((it, id) => ({ id, ...it })) },
};

export function isVariantN(n: unknown): n is VariantN {
  return typeof n === 'number' && (VARIANT_KEYS as readonly number[]).includes(n);
}

export const CATEGORIES = ['All', 'Nature', 'Animals', 'War', 'People', 'Tech', 'Myth'] as const;
