import { useState } from 'react';
import type { StudyLogEntry } from '../types';
import { lastNDays } from '../lib/stats';

const WIDTH = 320;
const HEIGHT = 120;
const PAD = 8;

interface Point {
  date: string;
  pct: number | null; // null = no attempts that day, rendered as a gap
}

function toPoints(days: StudyLogEntry[]): Point[] {
  return days.map((d) => {
    const total = d.correctCount + d.wrongCount;
    return { date: d.date, pct: total > 0 ? Math.round((d.correctCount / total) * 100) : null };
  });
}

function buildPath(points: Point[], plotW: number, plotH: number): string[] {
  const segments: string[] = [];
  let current = '';
  points.forEach((p, i) => {
    if (p.pct === null) {
      if (current) segments.push(current);
      current = '';
      return;
    }
    const x = PAD + (i / Math.max(1, points.length - 1)) * plotW;
    const y = PAD + plotH - (p.pct / 100) * plotH;
    current += current ? ` L${x},${y}` : `M${x},${y}`;
  });
  if (current) segments.push(current);
  return segments;
}

export function AccuracyTrendChart({ log }: { log: StudyLogEntry[] }) {
  const [range, setRange] = useState<7 | 30>(7);
  const days = lastNDays(log, range);
  const points = toPoints(days);
  const plotW = WIDTH - PAD * 2;
  const plotH = HEIGHT - PAD * 2;
  const pathSegments = buildPath(points, plotW, plotH);

  const lastValid = [...points].reverse().find((p) => p.pct !== null);
  const lastValidIndex = lastValid ? points.lastIndexOf(lastValid) : -1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end gap-1.5">
        {([7, 30] as const).map((n) => (
          <button
            key={n}
            onClick={() => setRange(n)}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
              range === n
                ? 'border-indigo-500 bg-indigo-600 text-white'
                : 'border-slate-200 text-slate-500 hover:border-indigo-300 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            {n}일
          </button>
        ))}
      </div>

      {lastValid === undefined ? (
        <p className="py-6 text-center text-xs text-slate-400">아직 정답률 데이터가 없어요.</p>
      ) : (
        <svg
          role="img"
          aria-label={`최근 ${range}일 정답률 추이, 최근값 ${lastValid.pct}%`}
          width="100%"
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
        >
          {[0, 50, 100].map((v) => {
            const y = PAD + plotH - (v / 100) * plotH;
            return (
              <line
                key={v}
                x1={PAD}
                x2={WIDTH - PAD}
                y1={y}
                y2={y}
                stroke="currentColor"
                strokeWidth={1}
                className="text-slate-100 dark:text-slate-800"
              />
            );
          })}
          {pathSegments.map((d, i) => (
            <path key={i} d={d} fill="none" className="stroke-indigo-500" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {lastValidIndex >= 0 && (
            <circle
              cx={PAD + (lastValidIndex / Math.max(1, points.length - 1)) * plotW}
              cy={PAD + plotH - ((lastValid.pct ?? 0) / 100) * plotH}
              r={4}
              className="fill-indigo-500 stroke-white dark:stroke-slate-900"
              strokeWidth={2}
            />
          )}
          {lastValidIndex >= 0 && (
            <text
              x={PAD + (lastValidIndex / Math.max(1, points.length - 1)) * plotW}
              y={Math.max(10, PAD + plotH - ((lastValid.pct ?? 0) / 100) * plotH - 8)}
              textAnchor="end"
              className="fill-indigo-600 text-[10px] font-bold dark:fill-indigo-400"
            >
              {lastValid.pct}%
            </text>
          )}
        </svg>
      )}
    </div>
  );
}
