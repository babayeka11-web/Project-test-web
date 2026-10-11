import Link from 'next/link';
import type { ReactNode } from 'react';
import { SITE_URL } from '@/lib/site';
import { cn } from './cn';
import { Icon } from './Icon';

export type Crumb = { label: string; href?: string };

export type BreadcrumbsProps = {
  /** From the home page to the current page. The last item is the current page. */
  items: Crumb[];
  className?: string;
  /** Also print schema.org BreadcrumbList JSON-LD (default true). */
  jsonLd?: boolean;
};

// The text stays small; an invisible ::after widens the tap target to 44px tall without moving the line.
const crumbLink =
  "relative inline-flex min-h-6 items-center rounded-md px-0.5 underline-offset-4 after:absolute after:-inset-x-1 after:-inset-y-2.5 after:content-[''] hover:text-brand hover:underline";

/** One crumb link. Only the parent crumb is prefetched — the others are rarely followed; "#…" stays a native anchor. */
function CrumbLink({ href, prefetch, children }: { href: string; prefetch?: false; children: ReactNode }) {
  if (href.startsWith('#')) {
    return (
      <a href={href} className={crumbLink}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} prefetch={prefetch} className={crumbLink}>
      {children}
    </Link>
  );
}

/** "หน้าแรก › ล้างแอร์". Every inner page shows one, inside PageHeader. */
export function Breadcrumbs({ items, className, jsonLd = true }: BreadcrumbsProps) {
  const last = items.length - 1;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: SITE_URL + c.href } : null),
    })),
  };
  return (
    <nav aria-label="เส้นทางหน้า" className={className}>
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-small text-ink-3">
        {items.map((c, i) => (
          <li key={i} className="inline-flex min-w-0 items-center gap-1">
            {i > 0 && <Icon name="chevron-right" size={14} className="opacity-60" />}
            {c.href && i !== last ? (
              <CrumbLink href={c.href} prefetch={i === last - 1 ? undefined : false}>
                {c.label}
              </CrumbLink>
            ) : (
              <span aria-current={i === last ? 'page' : undefined} className={cn('px-0.5', i === last && 'text-ink-2')}>
                {c.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
        />
      )}
    </nav>
  );
}
