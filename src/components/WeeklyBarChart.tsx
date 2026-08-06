import type { StudyLogEntry } from '../types';

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export function WeeklyBarChart({ data }: { data: StudyLogEntry[] }) {
  const max = Math.max(1, ...data.map((d) => d.studiedCount));
  const barW = 28;
  const gap = 14;
  const chartH = 120;
  const width = data.length * (barW + gap);

  return (
    <div className="viz-root overflow-x-auto">
      <svg
        role="img"
        aria-label={`최근 7일 학습 단어 수: ${data.map((d) => `${d.date} ${d.studiedCount}개`).join(', ')}`}
        width={width}
        height={chartH + 34}
        viewBox={`0 0 ${width} ${chartH + 34}`}
      >
        <line
          x1={0}
          y1={chartH + 0.5}
          x2={width}
          y2={chartH + 0.5}
          stroke="currentColor"
          className="text-slate-200 dark:text-slate-700"
          strokeWidth={1}
        />
        {data.map((d, i) => {
          const h = Math.max(2, Math.round((d.studiedCount / max) * (chartH - 8)));
          const x = i * (barW + gap) + gap / 2;
          const y = chartH - h;
          const date = new Date(d.date + 'T00:00:00');
          const isToday = i === data.length - 1;
          return (
            <g key={d.date}>
              {d.studiedCount > 0 && (
                <text
                  x={x + barW / 2}
                  y={y - 6}
                  textAnchor="middle"
                  className="fill-slate-500 text-[10px] font-semibold dark:fill-slate-400"
                >
                  {d.studiedCount}
                </text>
              )}
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx={4}
                className={isToday ? 'fill-indigo-500' : 'fill-indigo-300 dark:fill-indigo-800'}
              />
              <text
                x={x + barW / 2}
                y={chartH + 18}
                textAnchor="middle"
                className={`text-[10px] font-medium ${isToday ? 'fill-indigo-600 dark:fill-indigo-400' : 'fill-slate-400'}`}
              >
                {DAY_LABEL[date.getDay()]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
