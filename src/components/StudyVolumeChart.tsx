import { useState } from 'react';
import type { StudyLogEntry } from '../types';
import { lastNDays } from '../lib/stats';
import { LineChart } from './LineChart';

const RANGES = [30, 90] as const;

/** Words studied per day. Replaces the heatmap — a line reads the trend directly. */
export function StudyVolumeChart({ log }: { log: StudyLogEntry[] }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>(30);
  const days = lastNDays(log, range);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end gap-1.5">
        {RANGES.map((n) => (
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

      <LineChart
        labels={days.map((d) => d.date)}
        ariaLabel={`최근 ${range}일 날짜별 학습량`}
        emptyText="아직 학습 기록이 없어요."
        series={[
          {
            label: '학습 단어',
            values: days.map((d) => d.studiedCount),
            strokeClass: 'stroke-indigo-500',
            dotClass: 'bg-indigo-500',
            fillClass: 'fill-indigo-500/10',
            format: (v) => `${v}개`,
          },
        ]}
      />
    </div>
  );
}
