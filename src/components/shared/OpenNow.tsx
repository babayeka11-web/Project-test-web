'use client';
// Live "เปิดอยู่ตอนนี้ / ปิดอยู่ · เปิดอีกครั้ง …" status. Computed in the browser in Bangkok time (never at build time) from the
// company's opening hours, so it is right for a visitor in any time zone and never stale in the static HTML.
// Shared by the contact page (CompanyCard) and the request hand-off (HandoffBox), which also reads useOpenStatus() to
// step the phone action back while the office is closed.
import { useSyncExternalStore } from 'react';
import { Badge } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { addDays, bkkNow, isOpen, type BkkNow } from '@/lib/domain/queue';

const mins = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const weekday = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('th-TH', { timeZone: 'UTC', weekday: 'long' });

/** Status for one Bangkok moment. */
export function openStatus(now: BkkNow): { open: boolean; text: string } {
  const from = mins(COMPANY.open.from);
  const to = mins(COMPANY.open.to);
  if (isOpen(now.date) && now.min >= from && now.min < to) return { open: true, text: `เปิดอยู่ตอนนี้ · ปิด ${COMPANY.open.to} น.` };
  let when = 'วันนี้';
  if (!(isOpen(now.date) && now.min < from)) {
    let i = 1;
    while (i < 8 && !isOpen(addDays(now.date, i))) i++;
    when = i === 1 ? 'พรุ่งนี้' : weekday(addDays(now.date, i));
  }
  return { open: false, text: `ปิดอยู่ · เปิดอีกครั้ง${when} ${COMPANY.open.from} น.` };
}

// One snapshot per minute: a string, so the store value is stable between ticks. '' on the server and before hydration.
const subscribe = (cb: () => void) => {
  const id = window.setInterval(cb, 15_000);
  return () => window.clearInterval(id);
};
const snapshot = () => {
  const n = bkkNow();
  return `${n.date}|${n.min}`;
};

/** The live status, or null on the server and before hydration. */
export function useOpenStatus(): { open: boolean; text: string } | null {
  const stamp = useSyncExternalStore(subscribe, snapshot, () => '');
  if (!stamp) return null;
  const [date, min] = stamp.split('|');
  return openStatus({ date, min: Number(min) });
}

export function OpenNow({ className }: { className?: string }) {
  const s = useOpenStatus();
  if (!s) return <span aria-hidden className={`inline-block h-8 w-56 max-w-full rounded-full bg-surface-2 ${className ?? ''}`} />;
  return (
    <span role="status" className={className}>
      <Badge tone={s.open ? 'ok' : 'neutral'} dot size="md">
        {s.text}
      </Badge>
    </span>
  );
}
