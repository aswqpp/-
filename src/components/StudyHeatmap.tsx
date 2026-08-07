import { useMemo } from 'react';
import type { StudyLogEntry } from '../types';
import { addDays, todayIso } from '../lib/srs';

const NUM_WEEKS = 14;
const CELL = 11;
const GAP = 3;

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];
const MONTH_LABELS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

interface HeatCell {
  date: string;
  count: number;
  future: boolean;
}

const TOTAL_DAYS = NUM_WEEKS * 7;

function buildWeeks(log: StudyLogEntry[]): HeatCell[][] {
  const today = todayIso();
  const todayDow = new Date(today + 'T00:00:00').getDay();
  const end = addDays(today, 6 - todayDow);
  const start = addDays(end, -(TOTAL_DAYS - 1));
  const logMap = new Map(log.map((l) => [l.date, l.studiedCount]));

  // Bounded by a fixed count rather than `while (cursor <= end)`: a date helper
  // that fails to advance must not be able to hang the tab.
  const days: HeatCell[] = [];
  let cursor = start;
  for (let i = 0; i < TOTAL_DAYS; i++) {
    days.push({ date: cursor, count: logMap.get(cursor) ?? 0, future: cursor > today });
    cursor = addDays(cursor, 1);
  }

  const weeks: HeatCell[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

function levelOf(count: number): number {
  if (count <= 0) return 0;
  if (count <= 3) return 1;
  if (count <= 7) return 2;
  if (count <= 14) return 3;
  return 4;
}

const LEVEL_CLASS = [
  'fill-slate-100 dark:fill-slate-800',
  'fill-indigo-200 dark:fill-indigo-900',
  'fill-indigo-400 dark:fill-indigo-700',
  'fill-indigo-600 dark:fill-indigo-500',
  'fill-indigo-800 dark:fill-indigo-300',
];

export function StudyHeatmap({ log }: { log: StudyLogEntry[] }) {
  const { weeks, monthTicks } = useMemo(() => {
    const built = buildWeeks(log);
    const ticks: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    built.forEach((week, i) => {
      const month = new Date(week[0].date + 'T00:00:00').getMonth();
      if (month !== lastMonth) {
        ticks.push({ weekIndex: i, label: MONTH_LABELS[month] });
        lastMonth = month;
      }
    });
    return { weeks: built, monthTicks: ticks };
  }, [log]);

  const width = weeks.length * (CELL + GAP);
  const height = 7 * (CELL + GAP);

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <div style={{ width: width + 24 }}>
          <svg
            role="img"
            aria-label="최근 14주 일별 학습량 히트맵"
            width={width + 24}
            height={height + 16}
            viewBox={`0 0 ${width + 24} ${height + 16}`}
          >
            <g transform="translate(24, 16)">
              {monthTicks.map((t) => (
                <text
                  key={t.weekIndex}
                  x={t.weekIndex * (CELL + GAP)}
                  y={-4}
                  className="fill-slate-400 text-[9px]"
                >
                  {t.label}
                </text>
              ))}
              {[1, 3, 5].map((dow) => (
                <text key={dow} x={-6} y={dow * (CELL + GAP) + CELL - 1} textAnchor="end" className="fill-slate-400 text-[9px]">
                  {DAY_LABELS[dow]}
                </text>
              ))}
              {weeks.map((week, wi) =>
                week.map((day, di) =>
                  day.future ? null : (
                    <rect
                      key={day.date}
                      x={wi * (CELL + GAP)}
                      y={di * (CELL + GAP)}
                      width={CELL}
                      height={CELL}
                      rx={2}
                      className={LEVEL_CLASS[levelOf(day.count)]}
                    >
                      <title>
                        {day.date} · {day.count}개 학습
                      </title>
                    </rect>
                  )
                )
              )}
            </g>
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <span>적음</span>
        {LEVEL_CLASS.map((cls, i) => (
          <svg key={i} width={10} height={10}>
            <rect width={10} height={10} rx={2} className={cls} />
          </svg>
        ))}
        <span>많음</span>
      </div>
    </div>
  );
}
