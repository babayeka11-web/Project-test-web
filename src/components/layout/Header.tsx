'use client';
// Sticky site header: transparent over the page at the top, frosted glass once the page scrolls under it.
// Fixed height (no layout shift); desktop menu from 1024px, menu sheet below that (and behind "เพิ่มเติม" above it).
// "จองล้างแอร์" is orange only while the page shows no orange action of its own (one orange action per view).
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { COMPANY } from '@/lib/domain/company';
import { NAV } from '@/lib/site';
import { Button, IconButton, buttonClass } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';
import { CartButton } from './CartButton';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';
import { setMenuOpen, useMenuOpen } from './menu-store';
import { bookingHref, isActive } from './nav-icons';
import { usePageCtaVisible } from './use-page-cta-visible';

export function Header() {
  const pathname = usePathname();
  const menuOpen = useMenuOpen();
  const pageCta = usePageCtaVisible();
  const sentinel = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setStuck(!entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinel} aria-hidden className="h-px w-full" style={{ marginBottom: -1 }} />
      <header
        className={cn(
          'sticky top-0 z-40 h-header border-b transition-[background-color,border-color,box-shadow,backdrop-filter] duration-250 ease-air',
          stuck ? 'glass border-line shadow-[0_10px_30px_-22px_rgba(0,40,100,0.45)]' : 'border-transparent',
        )}
      >
        <Container className="flex h-full items-center gap-3 lg:gap-4 xl:gap-6">
          <Logo priority />
          <nav aria-label="เมนูหลัก" className="hidden flex-1 justify-center lg:flex">
            <ul className="flex items-center gap-0.5 xl:gap-1">
              {NAV.map((item) => {
                const active = isActive(pathname, item.href);
                const exact = active && (pathname === item.href || pathname === item.href.slice(0, -1));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={exact ? 'page' : active ? 'true' : undefined}
                      className={cn(
                        'pressable inline-flex min-h-11 items-center whitespace-nowrap rounded-full px-3 text-small font-medium no-underline xl:px-3.5',
                        active ? 'bg-sky-soft font-semibold text-brand' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                      )}
                    >
                      {item.th}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            {/* icon + count only: the row also holds เพิ่มเติม and the phone number within the 1136px container */}
            <div className="hidden md:block">
              <CartButton showLabel="never" />
            </div>
            <Button
              variant="quiet"
              size="sm"
              icon="menu"
              aria-haspopup="dialog"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
              className="whitespace-nowrap px-3.5 max-lg:hidden"
            >
              เพิ่มเติม
            </Button>
            <a
              href={COMPANY.telHref}
              className={buttonClass({ variant: 'quiet', size: 'sm', className: 'whitespace-nowrap px-3.5 tabular-nums max-xl:hidden' })}
            >
              <Icon name="phone" size={18} />
              <span className="sr-only">โทร </span>
              {COMPANY.tel}
            </a>
            {/* same size and label in both variants, so the swap never shifts the row */}
            <Button
              href={bookingHref(pathname)}
              variant={pathname?.startsWith('/quote') || pageCta ? 'soft' : 'primary'}
              size="sm"
              icon={<Icon name="clean" size={18} className="hidden sm:block" />}
              className="whitespace-nowrap px-4"
            >
              จองล้างแอร์
            </Button>
            <IconButton
              icon="menu"
              label="เปิดเมนู"
              aria-expanded={menuOpen}
              aria-haspopup="dialog"
              onClick={() => setMenuOpen(true)}
              className="-mr-1.5 lg:hidden"
            />
          </div>
        </Container>
      </header>
      <MobileMenu />
    </>
  );
}
