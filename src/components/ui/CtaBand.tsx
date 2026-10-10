// Closing call to action: a navy panel with flowing air lines. One per page, usually last before the footer.
import type { ReactNode } from 'react';
import { AirLines } from './AirLines';
import { cn } from './cn';
import { Container } from './Container';

export type CtaBandProps = {
  title: ReactNode;
  lead?: ReactNode;
  /** Buttons — one primary (orange) plus at most one secondary. */
  actions?: ReactNode;
  /** Small right-hand column on desktop (hours, phone number, a short checklist). */
  aside?: ReactNode;
  /** Heading level; h2 unless the band is inside another section. */
  as?: 'h2' | 'h3';
  id?: string;
  className?: string;
};

export function CtaBand({ title, lead, actions, aside, as: H = 'h2', id, className }: CtaBandProps) {
  const headingId = id ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={headingId} className={cn('py-[calc(var(--spacing-section)*0.6)]', className)}>
      <Container>
        <div className="scheme-deep bg-air-deep relative isolate overflow-hidden rounded-panel px-6 py-10 shadow-pop sm:px-10 sm:py-14 lg:px-16">
          <AirLines className="absolute -bottom-10 -right-20 -z-10 h-64 w-[44rem] max-w-none text-sky-on-deep opacity-60 sm:h-80" />
          <div className={cn('grid gap-8', aside && 'lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-16')}>
            <div className="flex max-w-[40rem] flex-col gap-4">
              <H id={headingId} className="text-h2">
                {title}
              </H>
              {lead && <p className="text-lead text-ink-2">{lead}</p>}
              {actions && <div className="mt-3 flex flex-wrap gap-3">{actions}</div>}
            </div>
            {aside && <div className="min-w-0 text-ink-2">{aside}</div>}
          </div>
        </div>
      </Container>
    </section>
  );
}
