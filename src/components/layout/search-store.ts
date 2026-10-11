'use client';
// Shared open/closed state of the site search (opened from the Header button and with Ctrl/⌘ K anywhere).
import { useSyncExternalStore } from 'react';

let open = false;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export function setSearchOpen(next: boolean) {
  if (open === next) return;
  open = next;
  subs.forEach((f) => f());
}

export function useSearchOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
