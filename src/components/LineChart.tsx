const WIDTH = 320;
const PAD_X = 8;
const PAD_Y = 10;

export interface LineSeries {
  label: string;
  /** One value per label; null leaves a gap instead of drawing through it. */
  values: (number | null)[];
  /** Tailwind stroke class, e.g. "stroke-indigo-500". */
  strokeClass: string;
  /** Tailwind fill class for the legend dot, e.g. "bg-indigo-500". */
  dotClass: string;
  /** Series on the same axis share a scale; separate axes scale independently. */
  axis?: 'left' | 'right';
  /** Formats the trailing value shown in the legend. */
  format?: (v: number) => string;
  /** Draws a soft fill under the line. */
  fillClass?: string;
}

function scaleOf(series: LineSeries[], axis: 'left' | 'right'): number {
  let max = 0;
  for (const s of series) {
    if ((s.axis ?? 'left') !== axis) continue;
    for (const v of s.values) if (v != null && v > max) max = v;
  }
  return max || 1;
}

/** Builds one path per unbroken run of values, so gaps stay gaps. */
function buildPaths(values: (number | null)[], max: number, plotW: number, plotH: number): string[] {
  const step = plotW / Math.max(1, values.length - 1);
  const segments: string[] = [];
  let current = '';

  values.forEach((v, i) => {
    if (v == null) {
      if (current) segments.push(current);
      current = '';
      return;
    }
    const x = PAD_X + i * step;
    const y = PAD_Y + plotH - (v / max) * plotH;
    current += current ? ` L${x},${y}` : `M${x},${y}`;
  });

  if (current) segments.push(current);
  return segments;
}

function areaPath(values: (number | null)[], max: number, plotW: number, plotH: number): string | null {
  const step = plotW / Math.max(1, values.length - 1);
  const points = values
    .map((v, i) => ({ v, i }))
    .filter((p): p is { v: number; i: number } => p.v != null);
  if (points.length < 2) return null;

  const baseline = PAD_Y + plotH;
  const line = points
    .map((p, k) => {
      const x = PAD_X + p.i * step;
      const y = PAD_Y + plotH - (p.v / max) * plotH;
      return `${k === 0 ? 'M' : 'L'}${x},${y}`;
    })
    .join(' ');

  const firstX = PAD_X + points[0].i * step;
  const lastX = PAD_X + points[points.length - 1].i * step;
  return `${line} L${lastX},${baseline} L${firstX},${baseline} Z`;
}

/**
 * Small multi-series line chart. Two independent axes are supported so a count and
 * a percentage can share the same x without one flattening the other.
 */
export function LineChart({
  labels,
  series,
  height = 130,
  emptyText = '아직 표시할 데이터가 없어요.',
  ariaLabel,
}: {
  labels: string[];
  series: LineSeries[];
  height?: number;
  emptyText?: string;
  ariaLabel?: string;
}) {
  const hasData = series.some((s) => s.values.some((v) => v != null));
  if (!hasData || labels.length === 0) {
    return <p className="py-6 text-center text-xs text-slate-400">{emptyText}</p>;
  }

  const plotW = WIDTH - PAD_X * 2;
  const plotH = height - PAD_Y * 2;
  const maxByAxis = { left: scaleOf(series, 'left'), right: scaleOf(series, 'right') };

  return (
    <div className="flex flex-col gap-2">
      <svg role="img" aria-label={ariaLabel ?? series.map((s) => s.label).join(', ')} width="100%" viewBox={`0 0 ${WIDTH} ${height}`} preserveAspectRatio="none">
        {[0, 0.5, 1].map((f) => {
          const y = PAD_Y + plotH - f * plotH;
          return (
            <line
              key={f}
              x1={PAD_X}
              x2={WIDTH - PAD_X}
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeWidth={1}
              className="text-slate-100 dark:text-slate-800"
            />
          );
        })}

        {series.map((s) => {
          const max = maxByAxis[s.axis ?? 'left'];
          const area = s.fillClass ? areaPath(s.values, max, plotW, plotH) : null;
          return (
            <g key={s.label}>
              {area && <path d={area} className={s.fillClass} stroke="none" />}
              {buildPaths(s.values, max, plotW, plotH).map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill="none"
                  className={s.strokeClass}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px] text-slate-400">
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {series.map((s) => {
            const last = [...s.values].reverse().find((v) => v != null);
            return (
              <span key={s.label} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${s.dotClass}`} />
                <span className="font-semibold text-slate-500 dark:text-slate-400">{s.label}</span>
                {last != null && <span className="tabular-nums">{s.format ? s.format(last) : last}</span>}
              </span>
            );
          })}
        </div>
        <span className="tabular-nums">
          {labels[0]} ~ {labels[labels.length - 1]}
        </span>
      </div>
    </div>
  );
}
