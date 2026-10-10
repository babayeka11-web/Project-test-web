// Signature decoration: soft lines of cool air flowing across a panel. Purely decorative (aria-hidden).
// Colour comes from `currentColor` — set it with text-sky / text-brand / text-sky-on-deep on the element.
import { useId, type SVGProps } from 'react';
import { cn } from './cn';

const LINES = [
  { d: 'M-20 210C90 170 170 250 300 205S500 130 660 165', w: 1.75, o: 0.9 },
  { d: 'M-20 240C110 205 200 275 330 235S520 170 660 195', w: 1.25, o: 0.6 },
  { d: 'M-20 180C80 140 160 215 290 175S480 95 660 130', w: 1.25, o: 0.55 },
  { d: 'M-20 270C130 245 230 300 360 265S540 215 660 228', w: 1, o: 0.35 },
  { d: 'M-20 150C70 115 150 180 270 148S460 70 660 100', w: 1, o: 0.3 },
];

export type AirLinesProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  /** Draw the lines in once on first paint (off under reduced motion). */
  animate?: boolean;
  /** Fewer lines for small panels. */
  lines?: 3 | 5;
};

export function AirLines({ animate = false, lines = 5, className, ...rest }: AirLinesProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  return (
    <svg
      viewBox="0 0 640 320"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden
      focusable="false"
      className={cn('pointer-events-none', className)}
      {...rest}
    >
      <defs>
        <linearGradient id={`air-${id}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="currentColor" stopOpacity="0" />
          <stop offset=".35" stopColor="currentColor" />
          <stop offset=".8" stopColor="currentColor" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      {LINES.slice(0, lines).map((l, i) => (
        <path
          key={i}
          d={l.d}
          stroke={`url(#air-${id})`}
          strokeWidth={l.w}
          strokeLinecap="round"
          opacity={l.o}
          vectorEffect="non-scaling-stroke"
          {...(animate
            ? { pathLength: 1, strokeDasharray: 1, className: 'animate-air-draw', style: { animationDelay: `${i * 140}ms` } }
            : null)}
        />
      ))}
    </svg>
  );
}
