'use client';
// false while the server HTML is hydrated, true afterwards (and on every client-side render after that).
// The quote lives in localStorage, so the server and the first client render show a skeleton, never an empty quote.
import { useSyncExternalStore } from 'react';

const noop = () => () => {};

export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
