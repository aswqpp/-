import { useMemo } from 'react';
import type { DifficultyLevel, Word } from '../types';
import { Card, FilterChip } from './ui';
import { Icon } from './Icon';
import { DIFFICULTY_ORDER, DIFFICULTY_LONG_LABEL, deriveDifficulty } from '../lib/difficulty';
import { applyScope, EMPTY_SCOPE, type Scope } from '../lib/scope';
import { Select } from './Select';

const LEVEL_TONE: Record<DifficultyLevel, 'slate' | 'green' | 'amber' | 'rose'> = {
  unrated: 'slate',
  easy: 'green',
  medium: 'amber',
  hard: 'rose',
};

/**
 * Shared "narrow the session" control for study / quiz / games, so the three
 * screens stay in step instead of each growing their own filter row.
 */
export function ScopePicker({
  words,
  scope,
  onChange,
  title,
}: {
  words: Word[];
  scope: Scope;
  onChange: (next: Scope) => void;
  title: string;
}) {
  // Each row carries its own size, so picking a folder is an informed choice
  // rather than a guess followed by a look at the count underneath.
  const categoryOptions = useMemo(() => {
    const sizes = new Map<string, number>();
    for (const w of words) {
      const key = w.category.trim() || '미분류';
      sizes.set(key, (sizes.get(key) ?? 0) + 1);
    }
    return [
      { value: 'all', label: '전체 카테고리', hint: `${words.length}개` },
      ...[...sizes.entries()]
        .sort((a, b) => a[0].localeCompare(b[0], 'ko'))
        .map(([name, count]) => ({ value: name, label: name, hint: `${count}개` })),
    ];
  }, [words]);

  const counts = useMemo(() => {
    // Counted against the category alone, so each chip shows what it would select
    // rather than a number that collapses to 0 once other chips are on.
    const base = applyScope(words, { category: scope.category, levels: [], favoritesOnly: false });
    const byLevel: Record<DifficultyLevel, number> = { unrated: 0, easy: 0, medium: 0, hard: 0 };
    let favorite = 0;
    for (const w of base) {
      byLevel[deriveDifficulty(w.srs)]++;
      if (w.favorite) favorite++;
    }
    return { byLevel, favorite };
  }, [words, scope.category]);

  const inScope = applyScope(words, scope).length;
  const active = scope.category !== 'all' || scope.levels.length > 0 || scope.favoritesOnly;

  function toggleLevel(level: DifficultyLevel) {
    const next = scope.levels.includes(level)
      ? scope.levels.filter((l) => l !== level)
      : [...scope.levels, level];
    onChange({ ...scope, levels: next });
  }

  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500">
          {title} <span className="font-normal text-slate-400">· 범위 내 {inScope}개</span>
        </p>
        {active && (
          <button
            onClick={() => onChange(EMPTY_SCOPE)}
            className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            <Icon name="refresh" className="h-3 w-3" /> 초기화
          </button>
        )}
      </div>

      <Select
        ariaLabel="카테고리"
        value={scope.category}
        options={categoryOptions}
        onChange={(category) => onChange({ ...scope, category })}
      />

      <div className="mt-2 flex flex-wrap gap-2">
        <FilterChip
          active={scope.favoritesOnly}
          onToggle={() => onChange({ ...scope, favoritesOnly: !scope.favoritesOnly })}
          tone="amber"
          count={counts.favorite}
        >
          <Icon name="star" className="h-3.5 w-3.5" fill={scope.favoritesOnly ? 'currentColor' : 'none'} />
          즐겨찾기
        </FilterChip>
        {DIFFICULTY_ORDER.map((level) => (
          <FilterChip
            key={level}
            active={scope.levels.includes(level)}
            onToggle={() => toggleLevel(level)}
            tone={LEVEL_TONE[level]}
            count={counts.byLevel[level]}
          >
            {DIFFICULTY_LONG_LABEL[level]}
          </FilterChip>
        ))}
      </div>
    </Card>
  );
}
