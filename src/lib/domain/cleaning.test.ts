import { describe, expect, it } from 'vitest';
import { bandOfBtu, cleanExtraLine, cleanFromTable, cleanPriceLine, cleaningQuote, cleaningSummary, cleanRate, defaultSelection, QUICK_PKGS, sizesFor, sizeTh, SIZE_BANDS, startAt, type CleanRateTable } from './cleaning';
import { getCleanRates, getCleanRateTable } from './pricebook';
import { visitLinesOf } from './queue';
import type { Zone } from './travel';

const table = getCleanRateTable();
const now = { date: '2026-10-09', min: 600 };
const zone = (tier: Zone['tier'], km: number | null, fee: number | null): Zone => ({ province: '', district: '', sub: '', zip: '', match: '', districts: [], tier, km, fee });

describe('quick cleaning booking', () => {
  it('default selection: 1 wall unit ฿700 + travel ฿300 below the minimum, fill hint +6 units', () => {
    const q = cleaningQuote(defaultSelection(), table, null, { now });
    expect(q.lines).toHaveLength(1);
    expect(q.lines[0]).toMatchObject({ key: 'QC-Basic Clean-C1-wall-0', unitEx: 700, qty: 1, group: 'clean', src: 'qc', name: 'ล้างแอร์ติดผนัง 9,000-18,000 BTU · ล้างปกติ C1', detail: 'ล้างมาตรฐาน (Basic Clean) · 30 วัน' });
    expect(q.totals).toMatchObject({ ex: 700, travel: 300, totalEx: 1000, vat: 70, inc: 1070 });
    expect(q.fill).toEqual({ type: 'wall', th: 'ติดผนัง', need: 6 });
    expect(q.when.kind).toBe('none');
    expect(q.volumeHint).toBe(false);
  });
  it('a rush date adds one rush line (+฿500 before VAT)', () => {
    const q = cleaningQuote(defaultSelection(), table, null, { now, date: '2026-10-10' });
    expect(q.rush).toBe(true);
    expect(q.lines.map(l => l.key)).toEqual(['QC-Basic Clean-C1-wall-0', 'QC-RUSH']);
    expect(q.totals.totalEx).toBe(700 + 300 + 500);
    expect(cleaningQuote(defaultSelection(), table, null, { now, date: '2026-10-12' }).rush).toBe(false);
  });
  it('extended area: distance fee, no fill hint; out of area flagged', () => {
    const q = cleaningQuote(defaultSelection(), table, zone('extended', 60, 600), { now });
    expect(q.totals.travel).toBe(600);
    expect(q.fill).toBeNull();
    expect(cleaningQuote(defaultSelection(), table, zone('out', null, null), { now }).outOfArea).toBe(true);
  });
  it('several types, sizes, C2, every package incl. Corporate Control', () => {
    const sel = { n: { wall: 6, cassette: 4 }, size: { wall: 1, cassette: 2 }, level: 'C2' as const, pkg: 'Corporate Control' as const };
    const q = cleaningQuote(sel, table, zone('core', 10, 0), { now });
    const w = cleanRate(table, 'Corporate Control', 'C2', 'wall', 1);
    const k = cleanRate(table, 'Corporate Control', 'C2', 'cassette', 2);
    expect(q.totals.ex).toBe((w?.ex ?? 0) * 6 + (k?.ex ?? 0) * 4);
    expect(q.totals.travel).toBe(0);
    expect(q.units).toBe(10);
    expect(q.volumeHint).toBe(true);
    expect(q.rows.map(r => r.sizeTh)).toEqual(['19,000–24,000 BTU', '37,000–48,000 BTU']);
    expect(q.lines[0].detail).toBe('ล้างพร้อมทะเบียนทรัพย์สิน (Corporate Control) · 60 วัน');
  });
  it('a size without a rate stays "ประเมินหน้างาน" (no line)', () => {
    const t: CleanRateTable = { ...table, rows: table.rows.map(r => (r.type === 'floor' ? { ...r, ex: null } : r)) };
    const q = cleaningQuote({ n: { floor: 2 }, size: {}, level: 'C1', pkg: 'Basic Clean' }, t, null, { now });
    expect(q.rows[0].line).toBeNull();
    expect(q.lines).toEqual([]);
    expect(q.totals.totalEx).toBe(0);
    expect(sizesFor(t, 'floor')).toEqual([]);
  });
  it('summary text for LINE', () => {
    const q = cleaningQuote(defaultSelection(), table, null, { now, date: '2026-10-10' });
    const s = cleaningSummary(defaultSelection(), q, { zoneText: 'แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150', date: '2026-10-10', slot: 'am' });
    expect(s.split('\n')[0]).toBe('ขอจองล้างแอร์ · SBP AirCare');
    expect(s).toContain('• ติดผนัง 1 เครื่อง (9,000–18,000 BTU)');
    expect(s).toContain('คิวด่วน +฿500 ก่อน VAT (ถ้ามีคิวว่าง)');
    expect(s).toContain('ยอดประมาณการ ฿1,500 ก่อน VAT · รวม VAT 7% ฿1,605');
  });
});

describe('size bands and rates', () => {
  it('band of a BTU per type', () => {
    expect(bandOfBtu('wall', 12000)).toBe(0);
    expect(bandOfBtu('wall', 18001)).toBe(1);
    expect(bandOfBtu('cassette', 24000)).toBe(0);
    expect(bandOfBtu('cassette', 36000)).toBe(1);
    expect(bandOfBtu('ceiling', 60000)).toBe(3);
    expect(bandOfBtu('ceiling', 61000)).toBeNull();
    expect(sizeTh('ceiling', SIZE_BANDS[0])).toBe('≤ 24,000 BTU');
  });
  it('starting prices', () => {
    expect(startAt(table, 'Basic Clean', 'C1')).toBe(700);
    expect(cleanFromTable(table)).toBe(700);
    expect(QUICK_PKGS).toEqual(['Basic Clean', 'Standard Care']);
    expect(cleanRate(table, 'Basic Clean', 'C1', 'wall', 99)?.range).toBe('9,000-18,000');
  });
});

describe('cleaning price-table lines', () => {
  it('typed rows → C- keys; extra rows → CX-, add-ons are not units', () => {
    const r = table.rows.find(x => x.pkg === 'Standard Care' && x.level === 'C2' && x.type === 'cassette');
    expect(r && cleanPriceLine(r)).toMatchObject({ key: `C-Standard Care-C2-cassette-${r?.range}`, name: `ล้างใหญ่ สี่ทิศทาง ${r?.range} BTU`, detail: 'Standard Care', kind: 'service' });
    const extra = getCleanRates().filter(x => !x.type);
    const add = extra.find(x => /^งานเพิ่ม/.test(x.ty || '') && x.ex != null);
    const ahu = extra.find(x => x.ty === 'AHU' && x.ex != null);
    expect(add && cleanExtraLine(add).kind).toBe('addon');
    expect(ahu && cleanExtraLine(ahu).kind).toBe('service');
    const lines = [add, ahu].filter(<X>(x: X | undefined): x is X => !!x).map(cleanExtraLine);
    expect(visitLinesOf(lines)).toEqual([{ t: null, level: 'C1', qty: 1, unknown: true }]);
  });
});
