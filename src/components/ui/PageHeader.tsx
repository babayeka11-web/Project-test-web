// Inner-page hero: breadcrumbs, eyebrow, the page's only <h1>, a short lead, actions and an optional aside
// (a price card, a quick fact list). Sits on the soft "air" wash with flowing lines.
import type { ReactNode } from 'react';
import { AirLines } from './AirLines';
import { Breadcrumbs, type Crumb } from './Breadcrumbs';
import { cn } from './cn';
import { Container } from './Container';
import { Eyebrow } from './Section';

export type PageHeaderProps = {
  /** Path from หน้าแรก to this page; the last crumb is this page. */
  breadcrumbs?: Crumb[];
  eyebrow?: ReactNode;
  /** The page title — rendered as the page's single <h1>. */
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
  /** Right column on desktop, below the text on phones (e.g. a Card with a starting price). */
  aside?: ReactNode;
  /** 'hide' drops the aside below 1024px when the page repeats it further down (keeps the phone hero short). */
  asideOnPhone?: 'show' | 'hide';
  /** Small print under the actions (e.g. "ราคามาตรฐานจาก Pricebook 2569 ก่อน VAT"). */
  meta?: ReactNode;
  className?: string;
  children?: ReactNode;
};

export function PageHeader({
  breadcrumbs,
  eyebrow,
  title,
  lead,
  actions,
  aside,
  asideOnPhone = 'show',
  meta,
  className,
  children,
}: PageHeaderProps) {
  return (
    <header className={cn('relative isolate -mt-header overflow-hidden bg-air pt-header', className)}>
      <AirLines
        animate
        className="absolute -right-40 top-4 -z-10 h-56 w-[40rem] max-w-none text-sky opacity-45 md:-right-10 md:top-10 md:h-[24rem] md:w-[52rem] lg:h-[28rem] lg:w-[64rem]"
      />
      <Container className="pb-8 pt-4 sm:pt-8 md:pb-16 lg:pb-20">
        {breadcrumbs && <Breadcrumbs items={breadcrumbs} className="mb-5 md:mb-10" />}
        <div className={cn('grid gap-10', aside && 'lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)] lg:items-end lg:gap-14')}>
          <div className="flex max-w-[46rem] flex-col gap-4 md:gap-5">
            {/* on phones the breadcrumb already names the topic, so the eyebrow would only repeat it */}
            {eyebrow && <Eyebrow className={breadcrumbs ? 'max-md:hidden' : undefined}>{eyebrow}</Eyebrow>}
            <h1 className="text-h1">{title}</h1>
            {lead && <p className="max-w-[40rem] text-lead text-ink-2">{lead}</p>}
            {/* data-page-cta: while this orange action is on screen the header's "จองล้างแอร์" steps back (UI.md §2) */}
            {actions && (
              <div data-page-cta className="mt-2 flex flex-wrap gap-3">
                {actions}
              </div>
            )}
            {meta && <p className="text-meta text-ink-3">{meta}</p>}
          </div>
          {aside && <div className={cn('min-w-0', asideOnPhone === 'hide' && 'hidden lg:block')}>{aside}</div>}
        </div>
        {children}
      </Container>
    </header>
  );
}
