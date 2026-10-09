'use client';
// Header link to the quote (ใบเสนอราคา) with the live line count from the client cart store.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCartCount } from '@/lib/cart';
import { CountBubble } from '@/components/ui/Button';
import { cn } from '@/components/ui/cn';
import { Icon } from '@/components/ui/Icon';

export function CartButton({ showLabel = 'xl', className }: { showLabel?: 'always' | 'xl' | 'never'; className?: string }) {
  const count = useCartCount();
  const pathname = usePathname();
  const active = pathname?.startsWith('/quote');
  const label = count > 0 ? `ใบเสนอราคา มี ${count} รายการ` : 'ใบเสนอราคา ยังไม่มีรายการ';
  return (
    <Link
      href="/quote/"
      aria-label={label}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'pressable relative inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-line bg-surface/70 px-3 text-small font-semibold text-ink no-underline hover:border-brand/40 hover:text-brand',
        active && 'border-brand/40 text-brand',
        className,
      )}
    >
      <Icon name="quote" size={20} />
      {showLabel !== 'never' && (
        <span className={cn(showLabel === 'xl' && 'hidden xl:inline')}>ใบเสนอราคา</span>
      )}
      {count > 0 ? (
        <CountBubble count={count} className={cn(showLabel === 'always' ? '' : 'absolute -right-1 -top-1 xl:static')} />
      ) : (
        showLabel !== 'never' && (
          <span className={cn('tabular-nums text-ink-3', showLabel === 'xl' && 'hidden xl:inline')}>0</span>
        )
      )}
    </Link>
  );
}
