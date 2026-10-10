import type { ElementType, HTMLAttributes } from 'react';

export type VisuallyHiddenProps = HTMLAttributes<HTMLElement> & {
  as?: ElementType;
  /** Show the content when it receives keyboard focus (skip links). */
  focusable?: boolean;
};

/** Text for screen readers only (e.g. "(เปิดหน้าต่างใหม่)", table captions, live announcements). */
export function VisuallyHidden({ as: Tag = 'span', focusable, className, ...rest }: VisuallyHiddenProps) {
  return <Tag className={[focusable ? 'sr-only focus:not-sr-only' : 'sr-only', className].filter(Boolean).join(' ')} {...rest} />;
}
