'use client';
// Phone-only bottom bar: โทร · LINE · ใบเสนอราคา · เมนู. Respects the iPhone home indicator (safe-area-inset-bottom);
// the body gets matching bottom padding in globals.css (--mobilebar-h) so nothing hides behind it.
// "เมนู" is a link to the footer's page list (#site-map), so a tap before the script loads still goes somewhere; once
// hydrated it opens the menu sheet instead.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { COMPANY } from '@/lib/domain/company';
import { useCartCount } from '@/lib/cart';
import { CountBubble } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { Icon, type IconName } from '@/components/ui/Icon';
import { setMenuOpen, useMenuOpen } from './menu-store';

const item =
  'pressable relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-control text-meta font-semibold leading-tight no-underline';

function ItemBody({ icon, label, badge }: { icon: IconName; label: string; badge?: ReactNode }) {
  return (
    <>
      <span className="relative">
        <Icon name={icon} size={22} />
        {badge}
      </span>
      <span className="truncate">{label}</span>
    </>
  );
}

export function MobileBar() {
  const count = useCartCount();
  const pathname = usePathname();
  const menuOpen = useMenuOpen();
  const onQuote = pathname?.startsWith('/quote');

  return (
    <nav
      aria-label="ทางลัด"
      className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line shadow-[0_-10px_30px_-24px_rgba(0,40,100,0.5)] md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-xl items-stretch gap-1 px-2 py-1.5">
        <a href={COMPANY.telHref} className={cn(item, 'text-ink-2 hover:text-ink')}>
          <ItemBody icon="phone" label="โทร" />
          <span className="sr-only"> {COMPANY.tel}</span>
        </a>
        <a href={COMPANY.lineUrl} target="_blank" rel="noopener noreferrer" className={cn(item, 'text-ink-2 hover:text-ink')}>
          <ItemBody icon="chat" label="LINE" />
          <span className="sr-only"> {COMPANY.line} (เปิดหน้าต่างใหม่)</span>
        </a>
        <Link
          href="/quote/"
          prefetch={false}
          aria-current={onQuote ? 'page' : undefined}
          className={cn(item, onQuote ? 'bg-sky-soft text-brand' : 'text-ink-2 hover:text-ink')}
        >
          <ItemBody
            icon="quote"
            label="ใบเสนอราคา"
            badge={count > 0 ? <CountBubble count={count} className="absolute -right-3 -top-1.5" /> : undefined}
          />
          <span className="sr-only">{count > 0 ? ` มี ${count} รายการ` : ' ยังไม่มีรายการ'}</span>
        </Link>
        <a
          href="#site-map"
          role="button"
          aria-haspopup="dialog"
          aria-expanded={menuOpen}
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen(true);
          }}
          onKeyDown={(e) => {
            // a link only answers Enter; role="button" promises Space too
            if (e.key === ' ') {
              e.preventDefault();
              setMenuOpen(true);
            }
          }}
          className={cn(item, 'text-ink-2 hover:text-ink')}
        >
          <ItemBody icon="menu" label="เมนู" />
        </a>
      </div>
    </nav>
  );
}
