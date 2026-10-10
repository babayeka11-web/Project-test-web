// A price as customers read it: "เริ่ม ฿700 / เครื่อง · ก่อน VAT". Formatting comes from the domain layer so every
// number on the site is grouped the same way. Amounts must come from src/lib/domain/* — never typed into a page.
import type { HTMLAttributes, ReactNode } from 'react';
import { baht, EX_TH } from '@/lib/domain/format';
import { cn } from './cn';

export type PriceSize = 'sm' | 'md' | 'lg' | 'xl';

const AMOUNT: Record<PriceSize, string> = {
  sm: 'text-body font-semibold',
  md: 'text-[1.25rem] font-semibold',
  lg: 'font-display text-[1.75rem] font-bold leading-tight',
  xl: 'font-display text-[clamp(2.5rem,1.9rem+2.6vw,3.5rem)] font-bold leading-[1.1]',
};

const META: Record<PriceSize, string> = {
  sm: 'text-meta',
  md: 'text-meta',
  lg: 'text-small',
  xl: 'text-small',
};

export type PriceProps = Omit<HTMLAttributes<HTMLSpanElement>, 'prefix'> & {
  /** Baht before VAT. null → the fallback text (no standard rate). */
  amount: number | null;
  /** Text before the amount, e.g. "เริ่ม". */
  prefix?: ReactNode;
  /** Text after the amount, e.g. "/ เครื่อง". */
  unit?: ReactNode;
  /** 'ex' (default) adds "ก่อน VAT" · 'inc' adds "รวม VAT" · false shows no VAT note (only inside a labelled total). */
  vat?: 'ex' | 'inc' | false;
  size?: PriceSize;
  /** Colour of the amount. */
  tone?: 'ink' | 'brand' | 'sky';
  /** Shown when amount is null. */
  fallback?: ReactNode;
  /** Put the VAT note on its own line under the amount. */
  stacked?: boolean;
};

const TONE = { ink: 'text-ink', brand: 'text-brand', sky: 'text-sky' } as const;

export function Price({
  amount,
  prefix,
  unit,
  vat = 'ex',
  size = 'md',
  tone = 'ink',
  fallback = 'ประเมินหน้างาน',
  stacked,
  className,
  ...rest
}: PriceProps) {
  if (amount == null) {
    return (
      <span className={cn('font-medium text-ink-2', META[size === 'xl' || size === 'lg' ? 'lg' : 'md'], className)} {...rest}>
        {fallback}
      </span>
    );
  }
  const vatText = vat === 'ex' ? EX_TH : vat === 'inc' ? 'รวม VAT' : null;
  return (
    <span className={cn('inline-flex flex-wrap items-baseline gap-x-1.5', stacked && 'flex-col gap-y-0.5', className)} {...rest}>
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
        {prefix && <span className={cn('text-ink-2', META[size])}>{prefix}</span>}
        <data value={amount} className={cn('tabular-nums', AMOUNT[size], TONE[tone])}>
          {baht(amount)}
        </data>
        {unit && <span className={cn('text-ink-2', META[size])}>{unit}</span>}
      </span>
      {vatText && <span className={cn('whitespace-nowrap text-ink-3', META[size])}>{vatText}</span>}
    </span>
  );
}
