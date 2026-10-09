import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type StatProps = HTMLAttributes<HTMLDivElement> & {
  /** The figure, already formatted ("30+", "705", "฿4,500"). */
  value: ReactNode;
  /** What the figure means, in customer words. */
  label: ReactNode;
  /** Optional small print under the label (source, condition). */
  hint?: ReactNode;
  size?: 'md' | 'lg';
};

/** A figure with its meaning. Always inside <StatGroup> (a <dl>). */
export function Stat({ value, label, hint, size = 'md', className, ...rest }: StatProps) {
  return (
    <div className={cn('flex flex-col gap-1', className)} {...rest}>
      <dt className="order-2 text-small text-ink-2">{label}</dt>
      <dd
        className={cn(
          'order-1 font-display font-bold leading-[1.15] text-ink tabular-nums',
          size === 'lg' ? 'text-[clamp(2.25rem,1.8rem+1.8vw,3rem)]' : 'text-[clamp(1.75rem,1.5rem+1vw,2.25rem)]',
        )}
      >
        {value}
      </dd>
      {hint && <dd className="order-3 text-meta text-ink-3">{hint}</dd>}
    </div>
  );
}

/** The <dl> wrapper Stat needs. Default: 2 columns on phones, `columns` from md. */
export function StatGroup({
  columns = 4,
  className,
  ...rest
}: HTMLAttributes<HTMLDListElement> & { columns?: 2 | 3 | 4 }) {
  const cols = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-4' }[columns];
  return <dl className={cn('grid grid-cols-2 gap-x-6 gap-y-8', cols, className)} {...rest} />;
}
