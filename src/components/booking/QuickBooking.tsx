'use client';
// Quick booking — the most important interaction of the site: 3 short steps (air-cons · how to clean · where and when)
// and a live price summary. All numbers come from cleaningQuote() (domain layer) over the CleanRateTable prop; the
// booking itself only writes to the quote store (src/lib/cart.ts) and opens the request form on /quote/.
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Icon, Price } from '@/components/ui';
import { cart, useCart } from '@/lib/cart';
import {
  cleaningQuote,
  cleaningSummary,
  defaultSelection,
  MAX_UNITS_PER_TYPE,
  type CleanLevel,
  type CleanPkgId,
  type CleanRateTable,
  type CleanSelection,
  type QuickType,
} from '@/lib/domain/cleaning';
import { lineMessageUrl } from '@/lib/domain/company';
import { SLOTS, type SlotId } from '@/lib/domain/queue';
import { AirconStep, MethodStep, WhenStep } from './BookingSteps';
import { BookingSummary } from './BookingSummary';
import { PLACEHOLDER_NOW, useBkkNow } from './use-bkk-now';

export function QuickBooking({ table }: { table: CleanRateTable }) {
  const router = useRouter();
  const { zone, zoneInput } = useCart();
  const now = useBkkNow();
  const [sel, setSel] = useState<CleanSelection>(defaultSelection);
  const [date, setDate] = useState('');
  const [slotPick, setSlotPick] = useState<SlotId | ''>('');

  const q = useMemo(() => cleaningQuote(sel, table, zone, { date, now: now ?? PLACEHOLDER_NOW }), [sel, table, zone, date, now]);

  // a date in the past is not a booking date; the slot in effect is the picked one when it fits, else the first that fits
  const dateOk = date && q.when.kind !== 'none' && q.when.kind !== 'past' ? date : '';
  const slots = q.when.slots;
  const slot: SlotId | '' = dateOk ? (slots.includes(slotPick as SlotId) ? (slotPick as SlotId) : slots[0] ?? '') : '';
  const slotLabel = slot ? SLOTS[slot].th : '';

  const setCount = (t: QuickType, n: number) => setSel(s => ({ ...s, n: { ...s.n, [t]: n } }));
  const setSize = (t: QuickType, id: number) => setSel(s => ({ ...s, size: { ...s.size, [t]: id } }));
  const addOne = (t: QuickType) => setSel(s => ({ ...s, n: { ...s.n, [t]: Math.min(MAX_UNITS_PER_TYPE, (s.n[t] ?? 0) + 1) } }));

  const lineUrl = lineMessageUrl(cleaningSummary(sel, q, { zoneText: zoneInput || zone?.match || '', date: dateOk, slot }));

  const book = () => {
    if (!q.lines.length) return;
    cart.replaceSource('qc', q.lines);
    cart.setPref(dateOk, slotLabel);
    cart.syncRush(dateOk, now ?? undefined);
    router.push('/quote/#request');
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-10">
      <div className="grid min-w-0 grid-cols-1 gap-6">
        {q.units > 0 && (
          <a
            href="#qb-summary"
            className="glass sticky top-[calc(var(--header-h)+0.5rem)] z-20 flex min-h-11 items-center justify-between gap-3 rounded-full border border-line px-5 py-2 text-small shadow-card lg:hidden"
          >
            <span className="text-ink-2">
              ยอดรวมตอนนี้ <Price amount={q.totals.inc} vat="inc" size="sm" tone="brand" />
            </span>
            <span className="flex shrink-0 items-center gap-1 font-medium text-brand">
              ดูสรุป <Icon name="chevron-down" size={16} />
            </span>
          </a>
        )}
        <AirconStep table={table} sel={sel} units={q.units} onCount={setCount} onSize={setSize} />
        <MethodStep
          table={table}
          sel={sel}
          onLevel={(level: CleanLevel) => setSel(s => ({ ...s, level }))}
          onPkg={(pkg: CleanPkgId) => setSel(s => ({ ...s, pkg }))}
        />
        <WhenStep now={now} date={date} slot={slot} q={q} onDate={setDate} onSlot={setSlotPick} />
      </div>
      <aside aria-label="สรุปราคาจอง" className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
        <BookingSummary
          q={q}
          sel={sel}
          zone={zone}
          minBill={table.minBill}
          date={dateOk}
          slotLabel={slotLabel}
          lineUrl={lineUrl}
          onBook={book}
          onAddOne={addOne}
        />
      </aside>
    </div>
  );
}
