'use client';
// STUB — the domain foundation agent replaces the internals (keep these export names and signatures).
// Client-side quote store ("ใบเสนอราคาเบื้องต้น"), persisted in localStorage, read with useSyncExternalStore.
import { useSyncExternalStore } from 'react';

export type CartLine = {
  id: string;
  key: string;
  kind: 'product' | 'service' | 'addon' | 'contract' | 'survey';
  group: 'product' | 'clean' | 'install' | 'repair' | 'addon' | 'contract' | 'survey';
  name: string;
  detail?: string;
  unitEx: number | null; // before VAT; null = "ประเมินหน้างาน"
  qty: number;
  units?: number;
};

type State = { lines: CartLine[] };
let state: State = { lines: [] };
const EMPTY: State = { lines: [] };
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());
const subscribe = (f: () => void) => (subs.add(f), () => subs.delete(f));

export const cart = {
  get: () => state,
  add(line: Omit<CartLine, 'id' | 'qty'> & { qty?: number }) {
    state = { lines: [...state.lines, { id: Math.random().toString(36).slice(2, 9), qty: 1, ...line }] };
    emit();
  },
};

export function useCart() {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

export function useCartCount(): number {
  const s = useCart();
  return s.lines.reduce((n, l) => n + (l.kind === 'survey' ? 0 : l.qty), 0);
}
