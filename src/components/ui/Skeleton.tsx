import type { HTMLAttributes } from 'react';
import { cn } from './cn';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  /** Rounded pill (text lines, buttons) or card corners. */
  shape?: 'line' | 'pill' | 'card' | 'circle';
};

const SHAPES = { line: 'rounded-md', pill: 'rounded-full', card: 'rounded-card', circle: 'rounded-full aspect-square' } as const;

/** Placeholder shimmer while client data loads. Give it the size of the real content to avoid layout shift. */
export function Skeleton({ shape = 'line', className, ...rest }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'animate-shimmer bg-[length:200%_100%] bg-[linear-gradient(90deg,var(--color-surface-2)_25%,color-mix(in_oklab,var(--color-surface-2)_55%,var(--color-surface))_50%,var(--color-surface-2)_75%)]',
        SHAPES[shape],
        className,
      )}
      {...rest}
    />
  );
}

/** Several text lines; the last one shorter. */
export function SkeletonText({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div aria-hidden className={cn('grid gap-2.5', className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cn('h-4', i === lines - 1 && lines > 1 ? 'w-3/5' : 'w-full')} />
      ))}
    </div>
  );
}
