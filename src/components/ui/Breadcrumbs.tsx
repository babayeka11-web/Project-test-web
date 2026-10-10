import Link from 'next/link';
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
              <Link
                href={c.href}
                className="inline-flex min-h-6 items-center rounded-md px-0.5 underline-offset-4 hover:text-brand hover:underline"
              >
                {c.label}
              </Link>
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
