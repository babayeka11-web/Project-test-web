'use client';
// Today's date and time in Bangkok, on the client only: the server snapshot is null, so server HTML and the first
// client render match; the real value arrives right after hydration and refreshes every 30 seconds.
import { useSyncExternalStore } from 'react';
import { bkkNow, type BkkNow } from '@/lib/domain/queue';

let cached: BkkNow | null = null;
function snapshot(): BkkNow {
  const n = bkkNow();
  if (!cached || cached.date !== n.date || cached.min !== n.min) cached = n;
  return cached;
}
const subscribe = (cb: () => void) => {
  const id = window.setInterval(cb, 30_000);
  return () => window.clearInterval(id);
};

export const useBkkNow = (): BkkNow | null => useSyncExternalStore(subscribe, snapshot, () => null);

/** A valid placeholder clock (a Monday) for code that needs a BkkNow before the client clock exists; never shown. */
export const PLACEHOLDER_NOW: BkkNow = { date: '2000-01-03', min: 0 };
