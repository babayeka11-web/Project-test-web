import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

export type NoticeTone = 'info' | 'ok' | 'warn' | 'bad';

const TONES: Record<NoticeTone, { box: string; icon: string; name: IconName }> = {
  info: { box: 'bg-sky-soft border-sky/20', icon: 'text-brand', name: 'info' },
  ok: { box: 'bg-ok-soft border-ok/20', icon: 'text-ok', name: 'check' },
  warn: { box: 'bg-warn-soft border-warn/25', icon: 'text-warn', name: 'alert' },
  bad: { box: 'bg-bad-soft border-bad/25', icon: 'text-bad', name: 'alert' },
};

export type NoticeProps = Omit<HTMLAttributes<HTMLDivElement>, 'title'> & {
  tone?: NoticeTone;
  title?: ReactNode;
  /** Override the tone's icon. */
  icon?: IconName;
  /** Buttons/links under the text. */
  action?: ReactNode;
  /** Announce changes: 'polite' (role=status) for results, 'assertive' (role=alert) for blocking errors. */
  live?: 'polite' | 'assertive';
  size?: 'sm' | 'md';
  children?: ReactNode;
};

/** A short message in context — honest notes, conditions, results. Body text stays ink for readability. */
export function Notice({ tone = 'info', title, icon, action, live, size = 'md', className, children, ...rest }: NoticeProps) {
  const t = TONES[tone];
  return (
    <div
      role={live === 'assertive' ? 'alert' : live === 'polite' ? 'status' : undefined}
      className={cn(
        'flex gap-3 rounded-control border text-ink',
        size === 'sm' ? 'p-3 text-small' : 'p-4 sm:p-5',
        t.box,
        className,
      )}
      {...rest}
    >
      <Icon name={icon ?? t.name} size={size === 'sm' ? 18 : 22} className={cn('mt-0.5', t.icon)} strokeWidth={2} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {title && <p className="font-semibold text-ink">{title}</p>}
        {children && <div className={cn('text-ink-2', size === 'md' && 'text-small')}>{children}</div>}
        {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}
