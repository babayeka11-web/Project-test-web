// Buttons and button-styled links. One orange primary (CTA) per view; everything else is secondary/ghost/soft.
// `href` renders next/link for site pages and a plain <a> for http(s)/tel/mailto/line links.
import Link from 'next/link';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'soft' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-cta text-on-cta shadow-cta hover:bg-cta-hover',
  secondary: 'bg-brand text-on-brand hover:bg-brand-hover',
  ghost: 'border border-line-strong/70 bg-surface/60 text-ink hover:border-brand hover:bg-surface hover:text-brand',
  soft: 'bg-sky-soft text-brand hover:bg-[color-mix(in_oklab,var(--color-sky-soft)_82%,var(--color-sky))]',
  quiet: 'text-ink-2 hover:bg-surface-2 hover:text-ink',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'min-h-11 gap-1.5 px-4 text-small',
  md: 'min-h-12 gap-2 px-6 text-body',
  lg: 'min-h-14 gap-2.5 px-7 text-[1.0625rem]',
};

const ICON_SIZES: Record<ButtonSize, number> = { sm: 18, md: 20, lg: 22 };

/** Class string for anything that should look like a button (e.g. a <label> or <summary>). */
export function buttonClass({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; fullWidth?: boolean; className?: string } = {}) {
  return cn(
    'pressable relative inline-flex select-none items-center justify-center rounded-full font-semibold leading-tight no-underline',
    'disabled:opacity-50 aria-disabled:opacity-50',
    VARIANTS[variant],
    SIZES[size],
    fullWidth && 'w-full',
    className,
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Leading icon: an icon name or any node. */
  icon?: IconName | ReactNode;
  /** Trailing icon (e.g. 'external'). Never use an arrow "→" as decoration. */
  iconEnd?: IconName | ReactNode;
  fullWidth?: boolean;
  /** Shows a spinner, sets aria-busy and blocks clicks. Keep the label (e.g. "กำลังส่ง…"). */
  loading?: boolean;
  className?: string;
  children?: ReactNode;
};

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: undefined };
type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string;
    /** Force a new-tab external link (auto for http/https URLs). */
    external?: boolean;
    prefetch?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

const isExternalHref = (href: string) => /^(https?:|mailto:|tel:|sms:|line:)/i.test(href);

function renderIcon(icon: IconName | ReactNode, size: number) {
  if (typeof icon === 'string') return <Icon name={icon as IconName} size={size} />;
  return icon;
}

function Spinner({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 animate-spin">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity=".25" strokeWidth="2.5" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  fullWidth,
  loading,
  className,
  children,
  ...rest
}: ButtonProps) {
  const iconSize = ICON_SIZES[size];
  const classes = buttonClass({ variant, size, fullWidth, className });
  const content = (
    <>
      {loading ? <Spinner size={iconSize} /> : icon ? renderIcon(icon, iconSize) : null}
      {children != null && <span className="min-w-0">{children}</span>}
      {iconEnd ? renderIcon(iconEnd, iconSize) : null}
    </>
  );

  if (typeof rest.href === 'string') {
    const { href, external, prefetch, ...anchor } = rest as Omit<ButtonAsLink, keyof CommonProps>;
    if (external || isExternalHref(href)) {
      const newTab = external || /^https?:/i.test(href);
      return (
        <a href={href} className={classes} {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : null)} {...anchor}>
          {content}
          {newTab && <span className="sr-only"> (เปิดหน้าต่างใหม่)</span>}
        </a>
      );
    }
    return (
      <Link href={href} prefetch={prefetch} className={classes} {...anchor}>
        {content}
      </Link>
    );
  }

  const { type = 'button', onClick, ...button } = rest as Omit<ButtonAsButton, keyof CommonProps>;
  return (
    <button
      type={type}
      className={classes}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      {...button}
    >
      {content}
    </button>
  );
}

export type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> & {
  icon: IconName;
  /** Accessible name — required because there is no visible text. */
  label: string;
  variant?: 'quiet' | 'ghost' | 'soft' | 'secondary' | 'primary';
  size?: 'sm' | 'md';
  /** Small count bubble (e.g. quote lines). Hidden when 0 or undefined. */
  badge?: number;
};

/** Round icon-only button with a 44px (sm) or 48px (md) target. */
export function IconButton({
  icon,
  label,
  variant = 'quiet',
  size = 'sm',
  badge,
  className,
  type = 'button',
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      title={label}
      className={cn(
        'pressable relative inline-grid shrink-0 place-items-center rounded-full disabled:opacity-50',
        size === 'sm' ? 'size-11' : 'size-12',
        VARIANTS[variant],
        variant === 'quiet' && 'text-ink',
        className,
      )}
      {...rest}
    >
      <Icon name={icon} size={size === 'sm' ? 22 : 24} />
      <span className="sr-only">
        {label}
        {badge ? ` ${badge}` : ''}
      </span>
      {badge ? <CountBubble count={badge} className="absolute -right-0.5 -top-0.5" /> : null}
    </button>
  );
}

/** Small round count used on icon buttons and tabs. Re-keys on change so the bump animation replays. */
export function CountBubble({ count, className }: { count: number; className?: string }) {
  return (
    <span
      key={count}
      aria-hidden
      className={cn(
        'inline-grid h-5 min-w-5 place-items-center rounded-full bg-cta px-1.5 text-[11px] font-semibold leading-none text-on-cta tabular-nums motion-safe:animate-bump',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}
