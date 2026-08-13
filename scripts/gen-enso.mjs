/**
 * Regenerates the ensō outline used by the beOm mark.
 *
 *   node scripts/gen-enso.mjs
 *
 * Paste the printed path into ENSO_PATH in src/components/Brand.tsx and into the
 * two SVGs in public/. Tune the constants below rather than the coordinates.
 */
const N = 84;
const R = 35;
const START = 108;      // degrees, opening at the top
const SWEEP = 322;      // degrees travelled, clockwise
const W_MAX = 11.5;
const rad = (d) => (d * Math.PI) / 180;

function width(t) {
  // Enters with weight, swells past the middle, lifts to a fine tail.
  const body = Math.sin(Math.PI * Math.min(1, t * 1.06)) ** 0.55;
  return W_MAX * (0.18 + 0.82 * body) * (1 - 0.35 * t ** 3);
}
function radius(t) {
  return R * (1 + 0.018 * Math.sin(Math.PI * 3.1 * t + 0.7));
}

const outer = [];
const inner = [];
for (let i = 0; i <= N; i++) {
  const t = i / N;
  const a = rad(START - SWEEP * t);
  const r = radius(t);
  const w = width(t) / 2;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  outer.push([50 + (r + w) * cos, 50 - (r + w) * sin]);
  inner.push([50 + (r - w) * cos, 50 - (r - w) * sin]);
}

const f = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const d =
  `M${f(outer[0])}` +
  outer.slice(1).map((p) => `L${f(p)}`).join('') +
  inner.reverse().map((p) => `L${f(p)}`).join('') +
  'Z';

console.log(d.length, 'chars');
console.log(d);
