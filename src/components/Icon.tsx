import type { ReactElement, SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'book'
  | 'cards'
  | 'quiz'
  | 'game'
  | 'chart'
  | 'sun'
  | 'moon'
  | 'plus'
  | 'edit'
  | 'trash'
  | 'check'
  | 'x'
  | 'speaker'
  | 'flame'
  | 'chevron-left'
  | 'chevron-right'
  | 'refresh'
  | 'clock';

const paths: Record<IconName, ReactElement> = {
  home: <path d="M3 11.5 12 4l9 7.5M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />,
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5V5.5ZM4 20.5A2.5 2.5 0 0 1 6.5 18H20" />,
  cards: (
    <>
      <rect x="5" y="7" width="14" height="12" rx="2" />
      <path d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H17" />
    </>
  ),
  quiz: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.2a2.5 2.5 0 1 1 3.6 2.25c-.7.37-1.1.9-1.1 1.55v.3" />
      <circle cx="12" cy="16.5" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  game: (
    <>
      <rect x="3" y="8" width="18" height="9" rx="4" />
      <path d="M7.5 10.5v4M5.5 12.5h4" />
      <circle cx="15.5" cy="11.5" r="0.8" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="13.5" r="0.8" fill="currentColor" stroke="none" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M4 20h16" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <path d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3ZM14 6l3 3" />,
  trash: <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7h10ZM10 11v6M14 11v6" />,
  check: <path d="m5 13 4 4 10-10" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  speaker: (
    <>
      <path d="M4 9v6h4l5 4V5L8 9H4Z" />
      <path d="M17 8a5 5 0 0 1 0 8M19.5 5.5a9 9 0 0 1 0 13" />
    </>
  ),
  flame: <path d="M12 2s5 4.5 5 9.5a5 5 0 1 1-10 0c0-1 .5-2 1-2.5.2 1 1 1.5 1 1.5-.5-2 0-4 3-6.5-.3 1.5 0 2.3 1 2.5.8-1.5-1-2.7-1-4Z" />,
  'chevron-left': <path d="M15 5l-7 7 7 7" />,
  'chevron-right': <path d="M9 5l7 7-7 7" />,
  refresh: <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M4 4v5h5M20 20v-5h-5" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </>
  ),
};

export function Icon({
  name,
  className,
  strokeWidth = 1.8,
  ...rest
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...rest}
    >
      {paths[name]}
    </svg>
  );
}
