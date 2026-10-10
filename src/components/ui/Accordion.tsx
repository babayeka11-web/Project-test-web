// Native <details>/<summary> disclosure — works without JavaScript, searchable with Ctrl+F (Chromium opens matches),
// animated where ::details-content is supported. Items sharing a `name` behave as an exclusive group.
import type { ReactNode } from 'react';
import { cn } from './cn';

export type AccordionItemProps = {
  title: ReactNode;
  children: ReactNode;
  /** Items with the same name close each other (one open at a time). */
  name?: string;
  defaultOpen?: boolean;
  id?: string;
  /** lined = rows separated by hairlines · card = each item in its own rounded box. */
  variant?: 'lined' | 'card';
  className?: string;
};

export function AccordionItem({ title, children, name, defaultOpen, id, variant = 'lined', className }: AccordionItemProps) {
  return (
    <details
      id={id}
      name={name}
      open={defaultOpen}
      className={cn(
        'ui-accordion group',
        variant === 'lined' ? 'border-b border-line' : 'rounded-control border border-line bg-surface px-1 shadow-card',
        className,
      )}
    >
      <summary
        className={cn(
          'flex min-h-14 items-center justify-between gap-4 rounded-control py-4 text-[1.0625rem] font-semibold leading-snug text-ink',
          'transition-colors hover:text-brand',
          variant === 'card' && 'px-4',
        )}
      >
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
      <div className={cn('pb-5 pr-12 text-ink-2', variant === 'card' && 'px-4')}>{children}</div>
    </details>
  );
}

export type AccordionProps = {
  items: Array<{ id?: string; title: ReactNode; content: ReactNode; defaultOpen?: boolean }>;
  /** Exclusive group name (one item open at a time). Omit to let several stay open. */
  name?: string;
  variant?: 'lined' | 'card';
  className?: string;
};

/** A list of AccordionItems (FAQ, details). */
export function Accordion({ items, name, variant = 'lined', className }: AccordionProps) {
  return (
    <div className={cn(variant === 'lined' ? 'border-t border-line' : 'grid gap-3', className)}>
      {items.map((it, i) => (
        <AccordionItem key={it.id ?? i} id={it.id} title={it.title} name={name} defaultOpen={it.defaultOpen} variant={variant}>
          {it.content}
        </AccordionItem>
      ))}
    </div>
  );
}
