// A page section: one purpose, one primary action (ARCHITECTURE §1.2). Owns vertical rhythm (py-section), the
// heading block (eyebrow · h2 · lead · actions) and the background tone.
import type { HTMLAttributes, ReactNode } from 'react';
import { AirLines } from './AirLines';
import { cn } from './cn';
import { Container } from './Container';

export type SectionTone = 'plain' | 'soft' | 'brand';

export type SectionProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  /** Anchor id (also used to label the section by its heading). */
  id?: string;
  /** Short topic line above the title — sentence case, no all-caps. */
  eyebrow?: ReactNode;
  /** Section heading, rendered as <h2>. */
  title?: ReactNode;
  /** One or two sentences under the title. */
  lead?: ReactNode;
  /** Buttons/links shown beside the heading on desktop and under it on phones. */
  actions?: ReactNode;
  /** plain = page background · soft = pale blue panel · brand = navy panel (everything inside re-themes). */
  tone?: SectionTone;
  /** Heading alignment. Centre only for short, symmetric sections. */
  align?: 'start' | 'center';
  /** Vertical padding: default section rhythm, or compact (half). */
  spacing?: 'default' | 'compact' | 'none';
  /** Container width for the content. */
  width?: 'page' | 'text' | 'wide';
  children?: ReactNode;
};

const TONES: Record<SectionTone, string> = {
  plain: '',
  soft: 'bg-air-soft',
  brand: 'scheme-deep bg-air-deep',
};

const SPACING = {
  default: 'py-section',
  compact: 'py-[calc(var(--spacing-section)*0.55)]',
  none: '',
} as const;

export function Section({
  id,
  eyebrow,
  title,
  lead,
  actions,
  tone = 'plain',
  align = 'start',
  spacing = 'default',
  width = 'page',
  className,
  children,
  ...rest
}: SectionProps) {
  const headingId = id && title ? `${id}-title` : undefined;
  const hasHead = eyebrow || title || lead || actions;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn('relative isolate scroll-mt-header', TONES[tone], SPACING[spacing], className)}
      {...rest}
    >
      {tone === 'brand' && (
        <AirLines className="absolute inset-x-0 top-0 -z-10 h-full w-full text-sky-on-deep opacity-35" lines={5} />
      )}
      <Container size={width}>
        {hasHead && (
          <SectionHeading
            id={headingId}
            eyebrow={eyebrow}
            title={title}
            lead={lead}
            actions={actions}
            align={align}
            className={children ? 'mb-10 md:mb-12' : undefined}
          />
        )}
        {children}
      </Container>
    </section>
  );
}

export type SectionHeadingProps = {
  id?: string;
  eyebrow?: ReactNode;
  title?: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  align?: 'start' | 'center';
  /** Heading level — h2 by default; h3 for a block inside a section. */
  as?: 'h2' | 'h3';
  className?: string;
};

/** The heading block on its own, for custom layouts (e.g. a two-column section). */
export function SectionHeading({ id, eyebrow, title, lead, actions, align = 'start', as: H = 'h2', className }: SectionHeadingProps) {
  const center = align === 'center';
  return (
    <div
      className={cn(
        'flex flex-col gap-6',
        center ? 'items-center text-center' : 'md:flex-row md:items-end md:justify-between md:gap-10',
        className,
      )}
    >
      <div className={cn('flex max-w-[44rem] flex-col gap-3', center && 'items-center')}>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        {title && (
          <H id={id} className={H === 'h2' ? 'text-h2' : 'text-h3'}>
            {title}
          </H>
        )}
        {lead && <p className="text-lead text-ink-2">{lead}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
    </div>
  );
}

/** Small topic line above a heading, with the air-line mark. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('inline-flex items-center gap-2.5 text-small font-semibold text-sky', className)}>
      <svg aria-hidden width="22" height="8" viewBox="0 0 22 8" fill="none" className="shrink-0">
        <path d="M1 5.5C4.5 2 7.5 7 11 4s6.5-2.5 10-1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
      </svg>
      {children}
    </p>
  );
}
