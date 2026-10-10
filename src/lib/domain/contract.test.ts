import { describe, expect, it } from 'vitest';
import type { CleanRateTable } from './cleaning';
import { contractLine, estimateContract, PRESETS } from './contract';
import { getCleanRateTable } from './pricebook';
import type { Zone } from './travel';

// a tiny table with round numbers so every figure can be checked by hand
const T: CleanRateTable = {
  v: 'test',
  minBill: 4500,
  rows: [
    { pkg: 'Standard Care', level: 'C1', type: 'wall', range: '9,000-18,000', ex: 1000, name: 'w1', warranty: null },
    { pkg: 'Standard Care', level: 'C2', type: 'wall', range: '9,000-18,000', ex: 2000, name: 'w2', warranty: null },
    { pkg: 'Standard Care', level: 'C1', type: 'cassette', range: '<=24,000', ex: 1500, name: 'k1', warranty: null },
    { pkg: 'Standard Care', level: 'C2', type: 'cassette', range: '<=24,000', ex: 3000, name: 'k2', warranty: null },
  ],
};
const ext: Zone = { province: '', district: '', sub: '', zip: '', match: '', districts: [], tier: 'extended', km: 70, fee: 700 };

describe('estimateContract (hand-computed)', () => {
  it('core area: a C1 visit below the minimum pays the base fee; one deep clean per year', () => {
    const e = estimateContract(T, { units: { wall: 2, cassette: 1 }, visits: 3 });
    // C1 visit 2×1000 + 1500 = 3500 (< 4500 → +300) · C2 visit 2×2000 + 3000 = 7000 · 2 × 3800 + 7000
    expect(e).toMatchObject({ count: 3, perVisitC1: 3800, perVisitC2: 7000, travel: 300, annualEx: 14600, vat: 1022, annualInc: 15622, minBillApplied: true, teamDaysPerVisit: 0.5 });
    expect(e?.perUnitYear).toBeCloseTo(14600 / 3);
    expect(e?.lines).toEqual([
      { type: 'wall', n: 2, range: '9,000-18,000', c1: 1000, c2: 2000 },
      { type: 'cassette', n: 1, range: '<=24,000', c1: 1500, c2: 3000 },
    ]);
  });
  it('without the deep clean every visit is C1; outside the core area every visit pays the distance fee', () => {
    const e = estimateContract(T, { units: { wall: 5 }, visits: 4, deep: false, zone: ext });
    expect(e).toMatchObject({ perVisitC1: 5700, annualEx: 22800, travel: 700, travelLabel: 'ค่าเดินทาง 70 กม. (ระยะถนนโดยประมาณ)', minBillApplied: false });
  });
  it('types without a rate count units but no price; no units → null', () => {
    const e = estimateContract(T, { units: { floor: 3 }, visits: 2 });
    expect(e?.lines).toEqual([{ type: 'floor', n: 3, range: undefined, c1: 0, c2: 0 }]);
    expect(estimateContract(T, { units: {}, visits: 3 })).toBeNull();
    expect(estimateContract(T, { units: { wall: 0 }, visits: 3 })).toBeNull();
  });
  it('crew size from units per team-day, rounded up to a half day', () => {
    expect(estimateContract(T, { units: { wall: 44 }, visits: 1 })?.teamDaysPerVisit).toBe(2);
    expect(estimateContract(T, { units: { wall: 45 }, visits: 1 })?.teamDaysPerVisit).toBe(2.5);
  });
  it('every preset prices with the real Pricebook', () => {
    const t = getCleanRateTable();
    for (const p of PRESETS) {
      const e = estimateContract(t, { units: p.units, visits: p.visits });
      expect(e?.annualEx).toBeGreaterThan(0);
      expect(e?.annualEx).toBe((e?.perVisitC1 ?? 0) * (p.visits - 1) + (e?.perVisitC2 ?? 0));
    }
  });
  it('contract quote line', () => {
    const e = estimateContract(T, { units: { wall: 2, cassette: 1 }, visits: 3 });
    expect(e && contractLine(e, { label: 'สำนักงานเล็ก', pkg: 'Standard Care' })).toEqual({
      kind: 'service', group: 'contract', key: 'K-สำนักงานเล็ก-Standard Care-3-3', name: 'สัญญาล้างรายปี · สำนักงานเล็ก (3 เครื่อง × 3 ครั้ง/ปี)', detail: 'Standard Care · ยืนยันหลังสำรวจ', unitEx: 14600, qty: 1, units: 3,
    });
  });
});
