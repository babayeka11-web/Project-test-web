import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

export type BadgeTone = 'neutral' | 'sky' | 'brand' | 'ok' | 'warn' | 'bad' | 'cta' | 'outline';

const TONES: Record<BadgeTone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  sky: 'bg-sky-soft text-brand',
  brand: 'bg-brand text-on-brand',
  ok: 'bg-ok-soft text-ok',
  warn: 'bg-warn-soft text-warn',
  bad: 'bg-bad-soft text-bad',
  cta: 'bg-cta-soft text-cta',
  outline: 'border border-line bg-surface text-ink-2',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: 'sm' | 'md';
  icon?: IconName;
  /** Small status dot before the text (uses the current text colour). */
  dot?: boolean;
  /** Keep to one line and cut with "…" instead of wrapping (only for a known-short label in a tight row). */
  truncate?: boolean;
  children: ReactNode;
};

/** Static label: status, category, "ก่อน VAT", "แบบจำลองเพื่ออธิบาย". Not clickable — use Chip for filters.
 *  A long label wraps onto a second line (at 320px or 200% zoom) rather than being cut off; one-line badges keep their
 *  pill shape because the corner radius is half the one-line height. */
export function Badge({ tone = 'neutral', size = 'sm', icon, dot, truncate, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-1.5 font-medium',
        truncate ? 'whitespace-nowrap leading-none' : 'whitespace-normal leading-snug [overflow-wrap:anywhere]',
        size === 'sm' ? 'min-h-7 rounded-[0.875rem] px-2.5 py-1 text-meta' : 'min-h-8 rounded-2xl px-3 py-1 text-small',
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />}
      {icon && <Icon name={icon} size={size === 'sm' ? 14 : 16} />}
      <span className={truncate ? 'truncate' : 'min-w-0'}>{children}</span>
    </span>
  );
}

export type ChipProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  /** Toggled state — rendered as aria-pressed. */
  selected?: boolean;
  icon?: IconName;
  /** Optional count after the label (e.g. number of models). */
  count?: number;
  /** What the count counts, for screen readers ("รุ่น" → "ติดผนัง 351 รุ่น"); visually the number stands alone. */
  countLabel?: string;
  children: ReactNode;
};

/** Toggle chip for filters and quick choices. 44px tall, wraps in rows (flex-wrap gap-2). */
export function Chip({ selected = false, icon, count, countLabel, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'pressable inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-small font-medium',
        selected
          ? 'border-brand bg-brand text-on-brand'
          : 'border-line-strong/50 bg-surface text-ink-2 hover:border-brand hover:text-brand',
        className,
      )}
      {...rest}
    >
      {icon && <Icon name={icon} size={18} />}
      {selected && !icon && <Icon name="check" size={16} strokeWidth={2.25} />}
      <span>{children}</span>
      {count != null && (
        <span className={cn('tabular-nums text-meta', selected ? 'opacity-80' : 'text-ink-3')}>
          {count.toLocaleString('en-US')}
          {countLabel && <span className="sr-only"> {countLabel}</span>}
        </span>
      )}
    </button>
  );
}
