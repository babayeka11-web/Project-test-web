'use client';
// Shared open/closed state of the mobile menu sheet (opened from the Header and from the MobileBar).
import { useSyncExternalStore } from 'react';

let open = false;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};

export function setMenuOpen(next: boolean) {
  if (open === next) return;
  open = next;
  subs.forEach((f) => f());
}

export function useMenuOpen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => open,
    () => false,
  );
}
