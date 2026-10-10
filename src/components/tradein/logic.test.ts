import { describe, expect, it } from 'vitest';
import { bannedIn } from '@/lib/domain/content';
import { getCatalogLite, getInstallItems, getRepairItems } from '@/lib/domain/pricebook';
import { TRADE_ISSUES } from '@/lib/domain/tradein';
import { REPAIR_PICK, buildTradeInData, newUnitList, newUnitStat, type NewUnit } from './data';
import {
  AGES,
  DEFAULT_INPUT,
  SIZES,
  TRADE_TYPES,
  VERDICT_TEXT,
  clampInput,
  electricityPerYear,
  moveRate,
  newSet,
  repairLines,
  sizesFor,
  statKey,
  tradeIn,
  type RepairKey,
  type TradeInData,
  type TradeInput,
} from './logic';

const data: TradeInData = buildTradeInData({ catalog: getCatalogLite(), repair: getRepairItems(), install: getInstallItems() });
const base: TradeInput = { ...DEFAULT_INPUT };

describe('data from the Pricebook', () => {
  it('finds every repair row the comparison needs', () => {
    (Object.keys(REPAIR_PICK) as RepairKey[]).forEach(k => expect(data.repair[k], k).not.toBeNull());
  });

  it('prices a diagnosis and leaves unpriced parts as null', () => {
    expect(data.repair.diagWall?.ex).toBeGreaterThan(0);
    expect(data.repair.compInv?.ex).toBeNull(); // no standard rate → ประเมินหน้างาน
  });

  it('has a removal rate for every type, the carry-away row and relocation bands', () => {
    TRADE_TYPES.forEach(t => expect(data.removal[t]?.ex, t).toBeGreaterThan(0));
    expect(data.dispose?.ex).toBeGreaterThan(0);
    expect(data.moves.length).toBeGreaterThan(10);
  });

  it('has Inverter catalog stats for the common sizes', () => {
    const s = data.newUnits[statKey('wall', 12000)];
    expect(s.n).toBeGreaterThan(3);
    expect(s.min as number).toBeLessThanOrEqual(s.med as number);
    expect(s.med as number).toBeLessThanOrEqual(s.max as number);
    expect(s.install).toBeGreaterThan(0);
  });

  it('builds a stat for every type × size of the form', () => {
    TRADE_TYPES.forEach(t => SIZES.forEach(b => expect(data.newUnits[statKey(t, b)], `${t} ${b}`).toBeDefined()));
  });
});

describe('newUnitStat', () => {
  const U = (btu: number, price: number, inverter = true, type: NewUnit['type'] = 'wall'): NewUnit => ({ type, btu, price, installStdEx: btu < 13000 ? 3800 : 4500, inverter });
  const list = [U(12000, 12000), U(12400, 9000), U(12000, 15000), U(18000, 20000), U(12000, 5000, false), U(12000, 9999, true, 'ceiling')];

  it('uses Inverter units of the same type within −10 % … +12 % and takes the lower median', () => {
    const s = newUnitStat(list, 'wall', 12000);
    expect(s).toEqual({ n: 3, min: 9000, max: 15000, med: 12000, medBtu: 12000, install: 3800 });
  });

  it('is empty when nothing fits', () => {
    expect(newUnitStat(list, 'floor', 12000).med).toBeNull();
    expect(newUnitStat(list, 'wall', 60000).n).toBe(0);
  });

  it('keeps only priced Inverter units of the four types', () => {
    const series = getCatalogLite();
    const units = newUnitList(series);
    expect(units.length).toBeGreaterThan(100);
    expect(units.every(u => u.inverter && u.price > 0)).toBe(true);
    expect(new Set(units.map(u => u.type))).toEqual(new Set(TRADE_TYPES));
  });
});

describe('repairLines', () => {
  it('has nothing to repair for a unit that only gets renovated', () => {
    expect(repairLines({ ...base, issue: 'reno' }, data.repair)).toEqual([]);
  });

  it('starts with the diagnosis for the unit type', () => {
    expect(repairLines({ ...base, issue: 'weak' }, data.repair).map(l => l.name)).toEqual([data.repair.diagWall?.name]);
    expect(repairLines({ ...base, type: 'cassette', issue: 'weak' }, data.repair)[0].name).toMatch(/แขวน/);
  });

  it('adds the refrigerant work for a compressor fault and the R22 refill for R22', () => {
    const names = (x: Partial<TradeInput>) => repairLines({ ...base, issue: 'comp', ...x }, data.repair).map(l => l.name).join('|');
    expect(names({})).toMatch(/Recover/);
    expect(names({ ref: 'r22' })).toMatch(/R22/);
    expect(names({ ref: 'r32' })).not.toMatch(/R22/);
    expect(names({ sys: 'inv' })).toMatch(/Inverter/);
    expect(names({ btu: 30000 })).toMatch(/21,000-36,000/);
  });

  it('picks the fixed-speed board unless the unit is Inverter or large', () => {
    const board = (x: Partial<TradeInput>) => repairLines({ ...base, issue: 'board', ...x }, data.repair)[1].name;
    expect(board({})).toMatch(/Fixed Speed/);
    expect(board({ sys: 'inv' })).toMatch(/Inverter/);
    expect(board({ btu: 48000, type: 'floor' })).toMatch(/Inverter/);
  });
});

describe('tradeIn', () => {
  const run = (x: Partial<TradeInput>) => tradeIn({ ...base, ...x }, data);

  it('gives the working or not-working trade-in range of the old size', () => {
    expect(run({ issue: 'reno' }).trade).toMatchObject({ lo: 900, hi: 1300, working: true });
    expect(run({ issue: 'comp' }).trade).toMatchObject({ lo: 300, hi: 700, working: false });
    expect(run({ issue: 'comp', btu: 18000 }).trade).toMatchObject({ lo: 500, hi: 1200 });
    expect(run({ issue: 'weak', btu: 36000, type: 'floor' }).trade).toMatchObject({ lo: 2400, hi: 3500, working: true });
  });

  it('prices the new set = median unit + installation, plus taking the old unit out', () => {
    const r = run({ issue: 'comp' });
    const s = data.newUnits[statKey('wall', 12000)];
    expect(r.setEx).toBe((s.med as number) + (s.install as number));
    expect(r.set.outEx).toBe((data.removal.wall?.ex as number) + (data.dispose?.ex as number));
    expect(r.allEx).toBe((r.setEx as number) + (r.set.outEx as number));
    const trade = r.trade as NonNullable<typeof r.trade>;
    expect(r.net).toEqual([(r.allEx as number) - trade.hi, (r.allEx as number) - trade.lo]);
  });

  it('adds the known repair cost and counts lines without a rate', () => {
    const r = run({ issue: 'comp', sys: 'inv' });
    expect(r.repair.unknown).toBeGreaterThanOrEqual(1); // Inverter compressor has no standard rate
    expect(r.repair.known).toBe(r.repair.lines.reduce((n, l) => n + (l.ex ?? 0), 0));
  });

  it('follows the rules of thumb for the verdict', () => {
    expect(run({ issue: 'reno', age: 'a3' }).verdict).toBe('keep');
    expect(run({ issue: 'reno', age: 'a8' }).verdict).toBe('compare');
    expect(run({ issue: 'reno', age: 'a16' }).verdict).toBe('replace');
    expect(run({ issue: 'comp', age: 'a12' }).verdict).toBe('replace');
    expect(run({ issue: 'comp', age: 'a8', ref: 'r22' }).verdict).toBe('replace');
    expect(run({ issue: 'comp', age: 'a8', ref: 'r32' }).verdict).toBe('replace'); // known repair ≥ half of a new set
    expect(run({ issue: 'comp', age: 'a8', ref: 'r32', type: 'floor', btu: 9000 }).verdict).toBe('compare'); // no catalog price to compare
    expect(run({ issue: 'weak', age: 'a6' }).verdict).toBe('repair');
    expect(run({ issue: 'weak', age: 'a16' }).verdict).toBe('compare');
    expect(run({ issue: 'fanOut', age: 'a3' }).verdict).toBe('repair');
  });

  it('always has a title, a sentence and reasons that stay honest', () => {
    TRADE_ISSUES.forEach(i =>
      AGES.forEach(a => {
        const r = run({ issue: i.id, age: a.id, ref: 'r22', sys: 'fix' });
        expect(r.title).toBe(VERDICT_TEXT[r.verdict].title);
        expect(bannedIn([r.title, r.sub, ...r.why].join(' '))).toEqual([]);
      }),
    );
  });

  it('estimates electricity: an old fixed-speed unit costs more than a new Inverter, more hours cost more', () => {
    const r = run({ sys: 'fix', age: 'a12' });
    expect(r.energy.old).toBeGreaterThan(r.energy.now);
    expect(r.energy.save).toBeCloseTo(r.energy.old - r.energy.now, 6);
    expect(r.energy.loss).toBeCloseTo(0.09, 6); // 1 % a year after year 3 → 12 y = 9 %
    expect(run({ hrs: 12 }).energy.now).toBeGreaterThan(run({ hrs: 6 }).energy.now);
    expect(electricityPerYear(12000, 'wall', true, 8)).toBeCloseTo((12000 / 18 / 1000) * 8 * 0.65 * 30 * 4.62 * 12, 6);
  });

  it('treats an unknown system as Inverter below 7 years and fixed speed from 7 years', () => {
    expect(run({ sys: 'unk', age: 'a3' }).energy.oldInv).toBe(true);
    expect(run({ sys: 'unk', age: 'a8' }).energy.oldInv).toBe(false);
  });

  it('flags 10 or more units for the special-rate note', () => {
    expect(run({ qty: 9 }).special).toBe(false);
    expect(run({ qty: 10 }).special).toBe(true);
  });

  it('survives a size the catalog has no Inverter unit for', () => {
    const r = tradeIn({ ...base, type: 'floor', btu: 9000 }, data);
    expect(r.setEx).toBeNull();
    expect(r.net).toBeNull();
    expect(r.allEx).toBeNull();
  });
});

describe('helpers', () => {
  it('limits wall units to 30,000 BTU and snaps a size to the type', () => {
    expect(sizesFor('wall')).not.toContain(36000);
    expect(sizesFor('floor')).toContain(60000);
    expect(clampInput({ ...base, type: 'wall', btu: 36000 }).btu).toBe(30000);
    expect(clampInput({ ...base, qty: 999, hrs: 0 })).toMatchObject({ qty: 200, hrs: 8 });
  });

  it('finds the relocation band of the old unit', () => {
    expect(moveRate({ type: 'wall', btu: 12000 }, data.moves)?.ex).toBeGreaterThan(0);
    expect(moveRate({ type: 'floor', btu: 12000 }, data.moves)?.ex).toBeGreaterThan(0);
  });

  it('keeps the page text free of banned phrases', () => {
    expect(bannedIn(Object.values(VERDICT_TEXT).map(v => `${v.title} ${v.sub}`).join(' '))).toEqual([]);
    const set = newSet({ type: 'wall', btu: 12000 }, data);
    expect(set.out.length).toBe(2);
  });
});
