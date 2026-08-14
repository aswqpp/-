/**
 * How a streak maps onto the growing O.
 *
 * Kept apart from the component so the numbers can be checked without a browser —
 * and so the two screens that colour themselves by streak length read the same
 * threshold rather than each carrying its own.
 */

/** Days to the full sweep. */
export const FULL_DAYS = 30;

/** Past this the mark takes the brand's gold — the one colour kept for rare things. */
export const GOLD_DAYS = 100;

/** Degrees left open. The ensō's gap, kept at every size and at every streak. */
export const GAP_DEGREES = 60;

/**
 * 0 at day 0, 1 at FULL_DAYS. Fast at the start, gentle at the end.
 *
 * Five fixed stages would mean a fortnight of an icon that never moves, and the days
 * when a habit is still fragile are exactly the days worth showing progress on. The
 * square root grows quickly early and slows down, landing near the ●/◜/◐/◕ milestones:
 *
 *   1일 ≈ 18%   3일 ≈ 32%   7일 ≈ 48%   14일 ≈ 68%   30일 = 100%
 */
export function streakProgress(days: number): number {
  if (!Number.isFinite(days) || days <= 0) return 0;
  return Math.sqrt(Math.min(days, FULL_DAYS) / FULL_DAYS);
}
