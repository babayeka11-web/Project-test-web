// What the customer picked in the quick booking, kept for this tab (sessionStorage 'sbp-qb') so going to /quote/ and
// back, or between / and /cleaning/, keeps it. Everything read back is checked against the rate table and the clock;
// anything unknown falls back to the default selection. Storage access stays in the caller (it may throw).
import {
  cleaningQuote,
  defaultSelection,
  LEVEL_TH,
  MAX_UNITS_PER_TYPE,
  QUICK_PKGS,
  QUICK_TYPES,
  sizesFor,
  type CleanLevel,
  type CleanPkgId,
  type CleanRateTable,
  type CleanSelection,
} from '@/lib/domain/cleaning';
import { SLOTS, type BkkNow, type SlotId } from '@/lib/domain/queue';

export const SAVED_BOOKING_KEY = 'sbp-qb';
export type SavedBooking = { sel: CleanSelection; date: string; slotPick: SlotId | '' };

const has = (o: object, k: unknown): boolean => typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k);
const isInt = (x: unknown): x is number => Number.isInteger(x);

/** Parse a stored booking. null when there is nothing usable; otherwise every field is valid (or the default). */
export function parseSavedBooking(raw: string | null, table: CleanRateTable, now: BkkNow): SavedBooking | null {
  let j: { sel?: Partial<CleanSelection>; date?: unknown; slotPick?: unknown } | null;
  try {
    j = JSON.parse(raw || 'null');
  } catch {
    return null;
  }
  if (!j || typeof j !== 'object' || !j.sel || typeof j.sel !== 'object') return null;
  const base = defaultSelection();
  const n = { ...base.n };
  const size = { ...base.size };
  QUICK_TYPES.forEach(({ id }) => {
    const c = j.sel?.n?.[id];
    if (isInt(c) && c >= 0 && c <= MAX_UNITS_PER_TYPE) n[id] = c;
    const z = j.sel?.size?.[id];
    if (isInt(z) && sizesFor(table, id).some(b => b.id === z)) size[id] = z;
  });
  const level = has(LEVEL_TH, j.sel.level) ? (j.sel.level as CleanLevel) : base.level;
  const pkg = QUICK_PKGS.includes(j.sel.pkg as CleanPkgId) ? (j.sel.pkg as CleanPkgId) : base.pkg;
  const sel: CleanSelection = { n, size, level, pkg };
  // a date that has passed is not a booking date any more
  let date = typeof j.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(j.date) ? j.date : '';
  if (date && cleaningQuote(sel, table, null, { date, now }).when.kind === 'past') date = '';
  const slotPick = has(SLOTS, j.slotPick) ? (j.slotPick as SlotId) : '';
  return { sel, date, slotPick };
}

export const serializeSavedBooking = (b: SavedBooking): string => JSON.stringify(b);
