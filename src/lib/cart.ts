'use client';
// Client-side quote store ("ใบเสนอราคาเบื้องต้น"): lines + picked area, persisted in localStorage under 'sbp-web-quote-v1',
// read with useSyncExternalStore (server snapshot = empty cart → no hydration mismatch; storage is read on the first client
// subscribe). Every storage access is wrapped in try/catch — the cart works for the session without storage.
// Port of the reference commerce.cart (add merges by key, setQty 1..999, totals via quote.ts quoteTotals).
import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { loadAddressBook, zoneOf, type AddrPick } from './domain/address';
import { MIN_BILL } from './domain/constants';
import { hasVisitWork, quoteCount, quoteTotals, rushLine, type QuoteLine, type QuoteTotals } from './domain/quote';
import { bkkNow, judge, type BkkNow } from './domain/queue';
import { ZONE_RULES_V, type Zone } from './domain/travel';

export type CartLine = QuoteLine & { id: string };
/** What callers pass to add(): a quote line without the store id; qty defaults to 1. */
export type CartLineInput = Omit<QuoteLine, 'qty'> & { qty?: number };

export type CartState = {
  lines: CartLine[];
  /** picked address (postal-style), or null */
  addr: AddrPick | null;
  /** zone of the picked address / typed area, or null when not given */
  zone: Zone | null;
  /** the area text shown in the area field */
  zoneInput: string;
  /** preferred visit date (YYYY-MM-DD) and slot label carried from a booking tool */
  pref: { date: string; slot: string };
};

export const STORAGE_KEY = 'sbp-web-quote-v1';
const STORE_V = 1;
export const MAX_QTY = 999;

const EMPTY: CartState = Object.freeze({ lines: [], addr: null, zone: null, zoneInput: '', pref: { date: '', slot: '' } }) as CartState;

let state: CartState = EMPTY;
let loaded = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach(f => f());

const newId = () => Math.random().toString(36).slice(2, 9);
const clampQty = (q: number) => Math.max(1, Math.min(MAX_QTY, Math.round(Number(q) || 1)));

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/* ---------- persistence ---------- */

type Stored = { v: number; zv: number; lines: CartLine[]; addr: AddrPick | null; zone: Zone | null; zoneInput: string; pref?: { date: string; slot: string } };

const isLine = (l: unknown): l is CartLine => {
  const x = l as Partial<CartLine> | null;
  return !!x && typeof x.key === 'string' && typeof x.name === 'string' && typeof x.kind === 'string' && typeof x.group === 'string' && typeof x.qty === 'number' && (x.unitEx === null || typeof x.unitEx === 'number');
};

function read(): CartState {
  const st = storage();
  if (!st) return EMPTY;
  try {
    const j = JSON.parse(st.getItem(STORAGE_KEY) || 'null') as Partial<Stored> | null;
    if (!j || j.v !== STORE_V) return EMPTY;
    const lines = (Array.isArray(j.lines) ? j.lines : []).filter(isLine).map(l => ({ ...l, id: typeof l.id === 'string' ? l.id : newId(), qty: clampQty(l.qty) }));
    const addr = j.addr && typeof j.addr.p === 'string' ? j.addr : null;
    const zone = j.zone && typeof j.zone.tier === 'string' ? j.zone : null;
    const pref = j.pref && typeof j.pref.date === 'string' && j.pref.date >= bkkNow().date ? { date: j.pref.date, slot: String(j.pref.slot || '') } : { date: '', slot: '' };
    if (addr && j.zv !== ZONE_RULES_V) recomputeZone(addr);
    return { lines, addr, zone, zoneInput: typeof j.zoneInput === 'string' ? j.zoneInput : '', pref };
  } catch {
    return EMPTY;
  }
}

function write(s: CartState) {
  const st = storage();
  if (!st) return;
  try {
    const out: Stored = { v: STORE_V, zv: ZONE_RULES_V, lines: s.lines, addr: s.addr, zone: s.zone, zoneInput: s.zoneInput, pref: s.pref };
    st.setItem(STORAGE_KEY, JSON.stringify(out));
  } catch {
    /* storage full / blocked: keep the session copy */
  }
}

function ensureLoaded() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  state = read();
  try {
    window.addEventListener('storage', e => {
      if (e.key !== STORAGE_KEY) return;
      state = read();
      emit();
    });
  } catch {
    /* no window events */
  }
}

function set(next: Partial<CartState>) {
  ensureLoaded();
  state = { ...state, ...next };
  write(state);
  emit();
}

/** Recompute the zone of a pick with the (lazy) address book; ignored when the pick changed meanwhile. */
function recomputeZone(addr: AddrPick) {
  loadAddressBook()
    .then(book => {
      if (state.addr !== addr && JSON.stringify(state.addr) !== JSON.stringify(addr)) return;
      set({ zone: zoneOf(book, addr) });
    })
    .catch(() => {
      /* address chunk unavailable: keep the stored zone */
    });
}

const subscribe = (f: () => void) => {
  ensureLoaded();
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
const getSnapshot = () => state;
const getServerSnapshot = () => EMPTY;

/* ---------- store API (usable outside React, e.g. in event handlers) ---------- */

export const cart = {
  get(): CartState {
    ensureLoaded();
    return state;
  },
  subscribe,
  /** Add a line; a line with the same key adds its qty to the existing one (a survey request is kept once). Returns its id. */
  add(line: CartLineInput): string {
    ensureLoaded();
    const qty = line.qty == null ? 1 : clampQty(line.qty);
    const same = state.lines.find(i => i.key && i.key === line.key);
    if (same) {
      if (line.kind !== 'survey') set({ lines: state.lines.map(i => (i === same ? { ...i, qty: clampQty(i.qty + qty) } : i)) });
      return same.id;
    }
    const id = newId();
    set({ lines: [...state.lines, { ...line, id, qty }] });
    return id;
  },
  addMany(lines: readonly CartLineInput[]): void {
    lines.forEach(l => cart.add(l));
  },
  /** Replace every line a tool added (by `src`, e.g. 'qc' for the quick booking) with new lines. */
  replaceSource(src: string, lines: readonly CartLineInput[]): void {
    ensureLoaded();
    state = { ...state, lines: state.lines.filter(i => i.src !== src) };
    lines.forEach(l => cart.add({ ...l, src }));
    if (!lines.length) set({});
  },
  setQty(id: string, q: number): void {
    ensureLoaded();
    if (!state.lines.some(i => i.id === id)) return;
    set({ lines: state.lines.map(i => (i.id === id ? { ...i, qty: clampQty(q) } : i)) });
  },
  remove(id: string): void {
    ensureLoaded();
    set({ lines: state.lines.filter(i => i.id !== id) });
  },
  clear(): void {
    set({ lines: [] });
  },
  /** Set the picked address. Pass the zone when you have it (picker with the book loaded); otherwise it is computed
   *  asynchronously from the lazy address book. `text` = what the area field shows (defaults to the pick's name). */
  setAddress(addr: AddrPick | null, zone?: Zone | null, text?: string): void {
    if (!addr) {
      set({ addr: null, zone: zone ?? null, zoneInput: text ?? '' });
      return;
    }
    set({ addr, zone: zone === undefined ? state.zone : zone, zoneInput: text ?? zoneInputOf(addr) });
    if (zone === undefined) recomputeZone(addr);
  },
  /** Set a zone directly (e.g. from typed text resolved by checkZone), clearing the pick. */
  setZone(zone: Zone | null, text = ''): void {
    set({ addr: null, zone, zoneInput: text || zone?.match || '' });
  },
  /** Preferred visit date / slot label from a booking tool ('' clears). */
  setPref(date: string, slot = ''): void {
    set({ pref: { date, slot } });
  },
  /** Keep exactly one คิวด่วน line when `date` is inside the rush window and the quote has a crew visit. */
  syncRush(date: string, now: BkkNow = bkkNow()): void {
    ensureLoaded();
    const need = !!date && judge(date, [], 'C1', now).rush && hasVisitWork(state.lines);
    const has = state.lines.some(i => i.group === 'rush');
    if (need && !has) set({ lines: [...state.lines, { ...rushLine(), id: newId() }] });
    if (!need && has) set({ lines: state.lines.filter(i => i.group !== 'rush') });
  },
  count(): number {
    return quoteCount(cart.get().lines);
  },
  totals(): QuoteTotals {
    const s = cart.get();
    return quoteTotals(s.lines, s.zone, MIN_BILL);
  },
};

function zoneInputOf(a: AddrPick): string {
  // same text as address.addrTh, inlined to keep this module light
  const bkk = a.p === 'กรุงเทพมหานคร';
  return bkk
    ? `${a.s ? 'แขวง' + a.s + ' ' : ''}${a.d ? 'เขต' + a.d + ' ' : ''}กรุงเทพฯ${a.z ? ' ' + a.z : ''}`
    : `${a.s ? 'ต.' + a.s + ' ' : ''}${a.d ? 'อ.' + a.d + ' ' : ''}จ.${a.p}${a.z ? ' ' + a.z : ''}`;
}

/* ---------- hooks ---------- */

export type UseCart = CartState & {
  count: number;
  totals: QuoteTotals;
  add: typeof cart.add;
  addMany: typeof cart.addMany;
  replaceSource: typeof cart.replaceSource;
  setQty: typeof cart.setQty;
  remove: typeof cart.remove;
  clear: typeof cart.clear;
  setAddress: typeof cart.setAddress;
  setZone: typeof cart.setZone;
  setPref: typeof cart.setPref;
  syncRush: typeof cart.syncRush;
};

/** The quote: lines, area, count, totals (VAT, travel, minimums) and the actions. */
export function useCart(): UseCart {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const totals = useMemo(() => quoteTotals(s.lines, s.zone, MIN_BILL), [s.lines, s.zone]);
  const count = useMemo(() => quoteCount(s.lines), [s.lines]);
  return {
    ...s,
    count,
    totals,
    add: cart.add,
    addMany: cart.addMany,
    replaceSource: cart.replaceSource,
    setQty: cart.setQty,
    remove: cart.remove,
    clear: cart.clear,
    setAddress: cart.setAddress,
    setZone: cart.setZone,
    setPref: cart.setPref,
    syncRush: cart.syncRush,
  };
}

/** Number for the cart badge (Σ qty of non-survey lines); 0 on the server and before storage is read. */
export function useCartCount(): number {
  return useSyncExternalStore(subscribe, () => quoteCount(state.lines), () => 0);
}

/* ---------- "open the quote drawer" request ---------- */

const openSubs = new Set<() => void>();

/** Ask the site-wide quote drawer to open (e.g. after "ใส่ใบเสนอราคา"). No-op when no drawer is mounted. */
export function requestQuoteOpen(): void {
  openSubs.forEach(f => f());
}

/** The drawer listens with this hook; cb runs on every requestQuoteOpen(). */
export function useQuoteOpenRequest(cb: () => void): void {
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  }, [cb]);
  useEffect(() => {
    const f = () => ref.current();
    openSubs.add(f);
    return () => {
      openSubs.delete(f);
    };
  }, []);
}

/** Test helper: forget the in-memory state so the next access reads storage again. */
export function __resetCartForTests(): void {
  state = EMPTY;
  loaded = false;
  subs.clear();
  openSubs.clear();
}
