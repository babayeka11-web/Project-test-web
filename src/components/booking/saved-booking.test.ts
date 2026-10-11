import { describe, expect, it } from 'vitest';
import { defaultSelection, MAX_UNITS_PER_TYPE, QUICK_PKGS } from '@/lib/domain/cleaning';
import { getCleanRateTable } from '@/lib/domain/pricebook';
import { parseSavedBooking, serializeSavedBooking, type SavedBooking } from './saved-booking';

const table = getCleanRateTable(QUICK_PKGS);
const now = { date: '2026-10-11', min: 634 };

describe('saved quick booking (sessionStorage)', () => {
  it('round-trips a valid booking', () => {
    const b: SavedBooking = {
      sel: { n: { wall: 2, ceiling: 1, cassette: 0, floor: 0 }, size: { wall: 1, ceiling: 0, cassette: 0, floor: 0 }, level: 'C2', pkg: 'Standard Care' },
      date: '2026-10-14',
      slotPick: 'pm',
    };
    expect(parseSavedBooking(serializeSavedBooking(b), table, now)).toEqual(b);
  });

  it('nothing stored, or not JSON → null', () => {
    expect(parseSavedBooking(null, table, now)).toBeNull();
    expect(parseSavedBooking('{oops', table, now)).toBeNull();
    expect(parseSavedBooking('{"date":"2026-10-14"}', table, now)).toBeNull();
  });

  it('drops unknown values field by field and falls back to the defaults', () => {
    const base = defaultSelection();
    const raw = JSON.stringify({
      sel: { n: { wall: MAX_UNITS_PER_TYPE + 1, ceiling: -1, cassette: 1.5, floor: '3' }, size: { wall: 9, ceiling: 'x' }, level: 'C3', pkg: 'Corporate Control' },
      date: '14/10/2026',
      slotPick: 'night',
    });
    expect(parseSavedBooking(raw, table, now)).toEqual({ sel: base, date: '', slotPick: '' });
  });

  it('a date that has passed is cleared, today and later stay', () => {
    const sel = defaultSelection();
    expect(parseSavedBooking(JSON.stringify({ sel, date: '2026-10-10', slotPick: '' }), table, now)?.date).toBe('');
    expect(parseSavedBooking(JSON.stringify({ sel, date: '2026-10-11', slotPick: '' }), table, now)?.date).toBe('2026-10-11');
  });
});
