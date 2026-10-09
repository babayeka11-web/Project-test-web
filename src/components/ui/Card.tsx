import Link from 'next/link';
import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';

export type CardTone = 'surface' | 'soft' | 'sky' | 'deep';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

const TONES: Record<CardTone, string> = {
  surface: 'bg-surface border-line shadow-card',
  soft: 'bg-surface-2 border-transparent',
  sky: 'bg-sky-soft border-transparent',
  deep: 'scheme-deep bg-air-deep border-transparent',
};

const PADDING: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-7',
  lg: 'p-6 sm:p-9',
};

export type CardProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  tone?: CardTone;
  padding?: CardPadding;
  /** Hover lift (pointer devices only). Use when the whole card is clickable. */
  interactive?: boolean;
  /** Makes the whole card a link (next/link). Keep the content short: it is read as one link. */
  href?: string;
  children?: ReactNode;
};

/** Rounded 24px surface. The basic building block for grouped content. */
export function Card({ as, tone = 'surface', padding = 'md', interactive, href, className, children, ...rest }: CardProps) {
  const classes = cn(
    'relative block rounded-card border text-ink',
    TONES[tone],
    PADDING[padding],
    (interactive || href) && 'lift',
    href && 'no-underline',
    className,
  );
  if (href) {
    return (
      <Link href={href} className={classes} {...(rest as HTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </Link>
    );
  }
  const Tag = as ?? 'div';
  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
