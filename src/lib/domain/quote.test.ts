import { describe, expect, it } from 'vitest';
import { hasVisitWork, lineAmount, quoteCount, quoteTotals, quoteUnits, rushLine, type QuoteLine } from './quote';
import type { Zone } from './travel';

const clean = (ex: number, qty: number): QuoteLine => ({ kind: 'service', group: 'clean', key: `QC-x-${ex}`, name: 'ล้าง', unitEx: ex, qty });
const addon = (ex: number | null, qty = 1, key = 'A-DISPOSE'): QuoteLine => ({ kind: ex == null ? 'survey' : 'addon', group: 'addon', key, name: 'งานย่อย', unitEx: ex, qty });
const ext: Zone = { province: 'นนทบุรี', district: '', sub: '', zip: '', match: '', districts: [], tier: 'extended', km: 45, fee: 500 };

describe('quoteTotals (hand-computed)', () => {
  it('cleaning below the minimum pays the travel base fee, VAT on the total', () => {
    const t = quoteTotals([clean(700, 5)], null);
    expect(t).toMatchObject({ ex: 3500, cleanEx: 3500, travel: 300, travelSmall: true, totalEx: 3800, vat: 266, inc: 4066, units: 5 });
  });
  it('cleaning at the minimum in the core area: no travel', () => {
    expect(quoteTotals([clean(900, 5)], null)).toMatchObject({ travel: 0, totalEx: 4500, vat: 315, inc: 4815 });
  });
  it('outside the core area every visit pays the distance fee', () => {
    expect(quoteTotals([clean(900, 10)], ext)).toMatchObject({ travel: 500, totalEx: 9500, travelLabel: 'ค่าเดินทาง 45 กม. (ระยะถนนโดยประมาณ)' });
  });
  it('small work only: the gap to ฿1,000 is the visit charge', () => {
    expect(quoteTotals([addon(500)], null)).toMatchObject({ visit: 500, visitSmall: true, totalEx: 1000, visitLabel: 'ค่าเข้างานขั้นต่ำ (งานย่อย) ฿1,000' });
    expect(quoteTotals([addon(2500)], null)).toMatchObject({ visit: 0, totalEx: 2500 });
    expect(quoteTotals([addon(null, 1, 'S-LOG-NIGHT')], null)).toMatchObject({ visit: 1000, surveys: 1, totalEx: 1000 });
    expect(quoteTotals([clean(900, 5), addon(500)], null)).toMatchObject({ visit: 0, visitSmall: false, totalEx: 5000 });
  });
  it('contract lines carry their own travel: no trip for a contract-only quote', () => {
    const k: QuoteLine = { kind: 'service', group: 'contract', key: 'K-x', name: 'สัญญา', unitEx: 60000, qty: 1, units: 20 };
    expect(quoteTotals([k], ext)).toMatchObject({ travel: 0, totalEx: 60000, units: 0 });
    expect(quoteTotals([k, clean(700, 1)], ext).travel).toBe(500);
  });
  it('a product without technician work has no visit charge and no travel', () => {
    const p: QuoteLine = { kind: 'product', group: 'product', key: 'P-x', name: 'แอร์', unitEx: 15900, qty: 2 };
    expect(quoteTotals([p], null)).toMatchObject({ travel: 0, visit: 0, totalEx: 31800, units: 2 });
  });
  it('empty quote', () => {
    expect(quoteTotals([], null)).toMatchObject({ ex: 0, travel: 0, totalEx: 0, vat: 0, inc: 0, units: 0 });
  });
});

describe('quote helpers', () => {
  it('units = largest per-group count (product + its install = one machine)', () => {
    const l: QuoteLine[] = [
      { kind: 'product', group: 'product', key: 'P', name: '', unitEx: 1, qty: 2 },
      { kind: 'service', group: 'install', key: 'I', name: '', unitEx: 1, qty: 2 },
      { kind: 'service', group: 'clean', key: 'C', name: '', unitEx: 1, qty: 1, units: 3 },
    ];
    expect(quoteUnits(l)).toBe(3);
  });
  it('count skips survey requests; visit work; rush line; amount', () => {
    expect(quoteCount([clean(700, 3), addon(null, 1, 'S-x')])).toBe(3);
    expect(hasVisitWork([addon(500)])).toBe(false);
    expect(hasVisitWork([clean(700, 1)])).toBe(true);
    expect(rushLine()).toMatchObject({ key: 'QC-RUSH', group: 'rush', unitEx: 500, qty: 1, name: 'คิวด่วน (ภายใน 3 วัน)' });
    expect(lineAmount({ unitEx: null, qty: 2 })).toBeNull();
    expect(lineAmount({ unitEx: 700, qty: 2 })).toBe(1400);
  });
});
