'use client';
// Full-height menu sheet for phones and tablets: every page, the booking action and how to reach the team.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { COMPANY } from '@/lib/domain/company';
import { NAV, NAV_MORE } from '@/lib/site';
import { Button } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { Icon } from '@/components/ui/Icon';
import { Sheet } from '@/components/ui/Sheet';
import { setMenuOpen, useMenuOpen } from './menu-store';
import { NAV_ICONS, isActive } from './nav-icons';

export function MobileMenu() {
  const open = useMenuOpen();
  const pathname = usePathname();
  const close = () => setMenuOpen(false);
  // a link inside was followed: focus its target (#book …) or the main content, not the menu button left behind
  const followed = useRef(false);
  const follow = () => {
    followed.current = true;
    setMenuOpen(false);
  };
  const returnFocus = () => {
    if (!followed.current) return null;
    followed.current = false;
    const id = decodeURIComponent(window.location.hash.slice(1));
    return (id && document.getElementById(id)) || document.getElementById('main');
  };

  // Close when the route changes (a link inside was followed).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onClose={close} returnFocus={returnFocus} title="เมนู" side="right" size="sm">
      <Button href="/cleaning/#book" fullWidth size="lg" icon="clean" onClick={follow} className="mb-6">
        จองล้างแอร์
      </Button>

      <nav aria-label="เมนูหลัก (มือถือ)">
        <ul className="grid gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={follow}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'pressable flex min-h-14 items-center gap-3.5 rounded-control px-3 py-2.5 no-underline',
                    active ? 'bg-sky-soft' : 'hover:bg-surface-2',
                  )}
                >
                  <span
                    className={cn(
                      'grid size-10 shrink-0 place-items-center rounded-full',
                      active ? 'bg-surface text-brand' : 'bg-surface-2 text-brand',
                    )}
                  >
                    <Icon name={NAV_ICONS[item.href] ?? 'arrow-right'} size={20} />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className={cn('text-[1.0625rem] font-semibold leading-snug', active ? 'text-brand' : 'text-ink')}>
                      {item.th}
                    </span>
                    {item.sub && <span className="truncate text-meta text-ink-3">{item.sub}</span>}
                  </span>
                  <Icon name="chevron-right" size={18} className="text-ink-3" />
                </Link>
              </li>
            );
          })}
        </ul>

        <hr className="air-rule my-5" />

        <ul className="grid grid-cols-2 gap-1">
          {NAV_MORE.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={follow}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'pressable flex min-h-11 items-center gap-2 rounded-control px-3 py-2 text-small font-medium no-underline',
                    active ? 'bg-sky-soft text-brand' : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
                  )}
                >
                  <Icon name={NAV_ICONS[item.href] ?? 'arrow-right'} size={18} className="text-ink-3" />
                  {item.th}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <section aria-label="ติดต่อทีมงาน" className="mt-6 rounded-card bg-surface-2 p-4">
        <p className="flex items-center gap-2 text-small font-semibold text-ink">
          <Icon name="clock" size={18} className="text-sky" />
          {COMPANY.hours}
        </p>
        <p className="mt-1 text-meta text-ink-3">{COMPANY.hoursNote}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button href={COMPANY.telHref} variant="secondary" size="sm" icon="phone">
            โทร
          </Button>
          <Button href={COMPANY.lineUrl} variant="ghost" size="sm" icon="chat">
            LINE
          </Button>
        </div>
        <a
          href={`mailto:${COMPANY.email}`}
          className="mt-3 flex min-h-11 items-center gap-2 break-all text-small text-ink-2 underline-offset-4 hover:text-brand hover:underline"
        >
          <Icon name="mail" size={18} className="shrink-0 text-ink-3" />
          {COMPANY.email}
        </a>
      </section>
    </Sheet>
  );
}
