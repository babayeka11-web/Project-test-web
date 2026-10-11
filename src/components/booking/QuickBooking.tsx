'use client';
// Quick booking — the most important interaction of the site: 3 short steps (air-cons · how to clean · where and when)
// and a live price summary. All numbers come from cleaningQuote() (domain layer) over the CleanRateTable prop; the
// booking itself only writes to the quote store (src/lib/cart.ts) and opens the request form on /quote/.
// On phones an ActionDock keeps the total and "จองล้างแอร์" in thumb reach while the steps scroll. What the customer
// picked is kept for this tab (sessionStorage) so going to /quote/ and back, or between / and /cleaning/, keeps it.
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActionDock } from '@/components/shared/ActionDock';
import { Button, Price } from '@/components/ui';
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
import { bkkNow, SLOTS, type SlotId } from '@/lib/domain/queue';
import { AirconStep, MethodStep, WhenStep } from './BookingSteps';
import { BookingSummary } from './BookingSummary';
import { parseSavedBooking, SAVED_BOOKING_KEY, serializeSavedBooking, type SavedBooking } from './saved-booking';
import { PLACEHOLDER_NOW, useBkkNow } from './use-bkk-now';

export function QuickBooking({ table }: { table: CleanRateTable }) {
  const router = useRouter();
  const { zone, zoneInput } = useCart();
  const now = useBkkNow();
  const [sel, setSel] = useState<CleanSelection>(defaultSelection);
  const [date, setDate] = useState('');
  const [slotPick, setSlotPick] = useState<SlotId | ''>('');
  const [restored, setRestored] = useState(false);
  const toolRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  // after hydration: bring back what was picked in this tab (the server HTML always shows the default selection)
  useEffect(() => {
    let saved: SavedBooking | null = null;
    try {
      saved = parseSavedBooking(window.sessionStorage.getItem(SAVED_BOOKING_KEY), table, bkkNow());
    } catch {
      /* storage blocked: start from the default */
    }
    if (saved) {
      setSel(saved.sel);
      setDate(saved.date);
      setSlotPick(saved.slotPick);
    }
    setRestored(true);
  }, [table]);

  // keep it for this tab — only once restored, so the defaults of the first render never overwrite it
  useEffect(() => {
    if (!restored) return;
    try {
      window.sessionStorage.setItem(SAVED_BOOKING_KEY, serializeSavedBooking({ sel, date, slotPick }));
    } catch {
      /* storage blocked: the booking still works for this page */
    }
  }, [restored, sel, date, slotPick]);

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
    <div ref={toolRef} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_26rem] xl:gap-10">
      <div className="grid min-w-0 grid-cols-1 gap-6">
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
          ctaRef={ctaRef}
        />
      </aside>
      {q.units > 0 && (
        <ActionDock
          watch={toolRef}
          hideWhen={ctaRef}
          label="ยอดรวมและจองล้างแอร์"
          summary={
            <span className="flex flex-col">
              <span className="text-meta text-ink-3">ยอดรวม</span>
              <Price amount={q.totals.inc} vat="inc" size="sm" tone="brand" />
            </span>
          }
          action={
            <Button size="sm" icon="clean" onClick={book} aria-disabled={!q.lines.length || undefined} aria-describedby="qb-book-note">
              จองล้างแอร์
            </Button>
          }
        />
      )}
    </div>
  );
}
