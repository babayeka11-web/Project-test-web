'use client';
// The quote at a glance in the page hero, for phones and tablets: how many lines, the grand total and the one next step
// (name and phone in #request), so the first screen answers "how much" and "what now". Below 1024px the totals card sits
// under the lines, two or three screens down; from 1024px the sticky totals card does this job, so this hides there.
// Renders nothing before the quote is read from storage and while it is empty (the empty state below takes over).
import { Button, Price } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { useHydrated } from './use-hydrated';

export function QuoteGlance() {
  const hydrated = useHydrated();
  const { lines, totals: t } = useCart();
  if (!hydrated || lines.length === 0) return null;
  // only survey requests: no standard price to add up yet (same rule as the totals card)
  const onlySurveys = t.totalEx === 0;

  return (
    <div className="mt-6 flex flex-col gap-4 rounded-card border border-line bg-surface/85 p-5 shadow-card lg:hidden print:hidden">
      <p aria-live="polite" aria-atomic="true" className="text-ink-2">
        <span className="whitespace-nowrap font-semibold text-ink">{lines.length} รายการ</span> ·{' '}
        {onlySurveys ? (
          'ทีมประเมินราคาหน้างาน'
        ) : (
          <>
            รวมทั้งสิ้น <Price amount={t.inc} vat="inc" size="lg" tone="brand" />
          </>
        )}
      </p>
      {/* the page's one orange action on this screen (UI.md §2) */}
      <div data-page-cta className="flex flex-col gap-2.5">
        <Button href="#request" icon="send" fullWidth className="sm:w-auto sm:self-start">
          กรอกชื่อและเบอร์ เพื่อส่งให้ทีม
        </Button>
        <p className="text-meta text-ink-3">
          <span aria-hidden>① เลือกรายการ ✓ · ② ตรวจยอดและพื้นที่ · ③ ส่งสรุปให้ทีม</span>
          <span className="sr-only">ขั้นที่ 1 เลือกรายการ เสร็จแล้ว · ขั้นที่ 2 ตรวจยอดและพื้นที่ · ขั้นที่ 3 ส่งสรุปให้ทีม</span>
        </p>
      </div>
    </div>
  );
}
