import { useEffect, useRef, useState } from 'react';
import { GAP_DEGREES, GOLD_DAYS, streakProgress } from '../lib/streak';

/**
 * The streak, drawn as the O becoming itself.
 *
 * A flame counts days; this draws them. The mark starts as the ensō's centre dot —
 * the point of awareness, nothing around it yet — and the ring grows around it as the
 * streak holds, reaching its full sweep at FULL_DAYS.
 *
 * It never closes. The brand mark is an ensō and the gap is the whole point ("열린
 * 자리가 아직 되어가는 중인 부분"), so a streak cannot draw a finished circle; the
 * last stretch of arc is the one the learner is still walking. That is also the
 * honest reading of a study streak: 30 days is not the end of learning a language.
 *
 * The sweep is continuous rather than five fixed stages — see lib/streak.ts for why,
 * and for the day → sweep curve.
 */

const R = 8.2;
const CIRCUMFERENCE = 2 * Math.PI * R;
const MAX_ARC = CIRCUMFERENCE * ((360 - GAP_DEGREES) / 360);

export function StreakOm({
  days,
  from,
  className = 'h-4 w-4',
}: {
  days: number;
  /**
   * What the learner last saw. Only used when it is larger than `days`: the mark then
   * animates *down* to the current streak instead of drawing in, so a broken streak
   * reads as a pause rather than a failure. There is no other way to show it — once
   * the streak resets, the number it fell from is gone unless it was remembered.
   */
  from?: number;
  className?: string;
}) {
  // Starts empty so the ring draws itself in on open; starts full when a streak was
  // just lost, so the animation runs the other way.
  const initial = useRef(from != null && from > days ? from : 0);
  const [shown, setShown] = useState(initial.current);

  useEffect(() => {
    // One frame late, so the browser has a value to transition from.
    const id = requestAnimationFrame(() => setShown(days));
    return () => cancelAnimationFrame(id);
  }, [days]);

  const arc = MAX_ARC * streakProgress(shown);
  const gold = days >= GOLD_DAYS;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      role="presentation"
      aria-hidden
      // The streak the ring is currently drawn at — mid-animation this is the value
      // being left behind. Read by the browser tests.
      data-om-days={shown}
    >
      {/* Grows clockwise from the top. */}
      <circle
        cx="12"
        cy="12"
        r={R}
        className="om-arc"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={CIRCUMFERENCE - arc}
        transform="rotate(-90 12 12)"
      />
      {/* The seed: day one is this dot alone. */}
      <circle cx="12" cy="12" r={gold ? 2.6 : 2.1} fill="currentColor" stroke="none" className="om-dot" />
    </svg>
  );
}
