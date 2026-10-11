import type { IconName } from '@/components/ui/Icon';

/** Icon for each site section (menu rows, footer). Keys are NAV / NAV_MORE hrefs from src/lib/site.ts. */
export const NAV_ICONS: Record<string, IconName> = {
  '/cleaning/': 'clean',
  '/installation/': 'install',
  '/repair/': 'repair',
  '/products/': 'ac',
  '/business/': 'building',
  '/prices/': 'tag',
  '/area/': 'pin',
  '/knowledge/': 'thermometer',
  '/faq/': 'info',
  '/contact/': 'phone',
  '/trade-in/': 'ac',
  '/quote/': 'quote',
};

/** True when `pathname` is the section `href` or a page inside it (e.g. /products/xyz/ → /products/). */
export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const p = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return href === '/' ? p === '/' : p.startsWith(href);
}

/** Where "จองล้างแอร์" goes: the booking on this page when it has one (/ and /cleaning/ — what was picked stays), else
 *  the cleaning page's booking. */
export function bookingHref(pathname: string | null): string {
  const p = pathname && !pathname.endsWith('/') ? `${pathname}/` : pathname;
  return p === '/' || p === '/cleaning/' ? '#book' : '/cleaning/#book';
}
