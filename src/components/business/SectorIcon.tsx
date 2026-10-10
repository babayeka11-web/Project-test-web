// Line icons for the seven sectors (same 24px grid, round joins as the site's Icon set). Decorative: always beside text.
import type { SectorId } from './sectors';

const PATHS: Record<SectorId, string> = {
  office: 'M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16M15 9h4a1 1 0 0 1 1 1v11M8 8h3M8 12h3M8 16h3M3 21h18',
  chain: 'M3 10h18l-1.5-5h-15L3 10zM5 10v10h14V10M9 20v-5h6v5M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0',
  condo: 'M6 21V3h12v18M10 7h1M13 7h1M10 11h1M13 11h1M10 15h1M13 15h1M3 21h18',
  hospital: 'M4 21V7l8-4 8 4v14M12 8v6M9 11h6M9 21v-4h6v4M3 21h18',
  school: 'M2 9l10-5 10 5-10 5L2 9zM6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5M22 9v6',
  hotel: 'M3 21V8h18v13M3 13h18M7 13v-2h4v2M3 21h18M7 8V5h10v3',
  factory: 'M3 21V11l5 3v-3l5 3v-3l5 3V5h3v16H3zM7 18h2M11 18h2M15 18h2',
};

export function SectorIcon({ id, size = 22, className }: { id: SectorId; size?: number; className?: string }) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d={PATHS[id]} />
    </svg>
  );
}
