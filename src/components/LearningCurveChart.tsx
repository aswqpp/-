import type { Word } from '../types';
import { learningCurve } from '../lib/stats';
import { LineChart } from './LineChart';

/**
 * Vocabulary growth against how hard the material felt on the way.
 * Both series come from the per-word attempt history, so the curve starts where
 * that history starts rather than at the very first day the app was used.
 */
export function LearningCurveChart({ words }: { words: Word[] }) {
  const points = learningCurve(words);

  return (
    <LineChart
      labels={points.map((p) => p.date)}
      height={140}
      ariaLabel="누적 학습 단어 수와 그날의 오답률"
      emptyText="학습을 시작하면 여기에 누적 곡선이 그려져요."
      series={[
        {
          label: '누적 학습 단어',
          values: points.map((p) => p.cumulativeWords),
          strokeClass: 'stroke-indigo-500',
          dotClass: 'bg-indigo-500',
          fillClass: 'fill-indigo-500/10',
          format: (v) => `${v}개`,
        },
        {
          label: '그날의 오답률',
          values: points.map((p) => Math.round(p.wrongRate * 100)),
          strokeClass: 'stroke-rose-400',
          dotClass: 'bg-rose-400',
          axis: 'right',
          format: (v) => `${v}%`,
        },
      ]}
    />
  );
}
