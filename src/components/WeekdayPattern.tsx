import type { WeekdayStat } from '../lib/stats';

const DAY_LABEL = ['일', '월', '화', '수', '목', '금', '토'];

export function WeekdayPattern({ data }: { data: WeekdayStat[] }) {
  const max = Math.max(1, ...data.map((d) => d.studied));
  const total = data.reduce((sum, d) => sum + d.studied, 0);

  if (total === 0) {
    return <p className="py-4 text-center text-xs text-slate-400">아직 학습 기록이 없어요.</p>;
  }

  const busiest = data.reduce((acc, d) => (d.studied > acc.studied ? d : acc), data[0]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-1.5">
        {data.map((d) => {
          const h = Math.max(3, Math.round((d.studied / max) * 64));
          const isBusiest = d.dow === busiest.dow && d.studied > 0;
          return (
            <div key={d.dow} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-slate-500">{d.studied || ''}</span>
              <div className="flex h-16 w-full items-end">
                <div
                  title={`${DAY_LABEL[d.dow]}요일 · ${d.days}일 학습 · 누적 ${d.studied}개`}
                  className={`w-full rounded-t ${isBusiest ? 'bg-indigo-500' : 'bg-indigo-200 dark:bg-indigo-900'}`}
                  style={{ height: h }}
                />
              </div>
              <span
                className={`text-[10px] ${
                  isBusiest ? 'font-bold text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                }`}
              >
                {DAY_LABEL[d.dow]}
              </span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-slate-400">
        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{DAY_LABEL[busiest.dow]}요일</span>에 가장 많이
        학습했어요 (누적 {busiest.studied}개).
      </p>
    </div>
  );
}
