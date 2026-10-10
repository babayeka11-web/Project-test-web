// A card-style <details> (same look as the design-system Accordion) whose content can use the full card width —
// the price list needs room for a name, a price and a button on one row. Works without JavaScript.
import type { ReactNode } from 'react';
import { cn } from '@/components/ui';

export function Disclosure({
  title,
  children,
  defaultOpen,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
}) {
  return (
    <details open={defaultOpen} className={cn('ui-accordion group rounded-control border border-line bg-surface shadow-card', className)}>
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-4 rounded-control px-4 py-4 text-[1.0625rem] font-semibold leading-snug text-ink transition-colors hover:text-brand">
        <span className="min-w-0 text-pretty">{title}</span>
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 transition-colors group-open:bg-sky-soft group-open:text-brand"
        >
          <svg data-accordion-icon width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
      </summary>
      <div className="px-4 pb-4">{children}</div>
    </details>
  );
}
