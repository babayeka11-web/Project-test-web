import { describe, expect, it } from 'vitest';
import { breakdown, catTitle, inCategories, installItemLine, materialColumns, optionNote, packageParts, pipeCodeFor, PRICE_GROUPS, productLines, repairLine, serviceLine, type InstallItem } from './install';
import { getInstallItem, getInstallItems, getRepairItems, installOptions } from './pricebook';
import { quoteTotals } from './quote';

const item = (code: string): InstallItem => {
  const i = getInstallItem(code);
  if (!i) throw new Error(`missing ${code}`);
  return i;
};

describe('product page lines', () => {
  it('product + Standard package + metre add-on + assessed flag → reference keys and amounts', () => {
    const [std] = installOptions('wall', 12000);
    const L = productLines({
      brandName: 'Daikin', type: 'wall', sku: 'FTKQ12', btu: 12000, price: 15900, install: std, qty: 2,
      addons: [{ item: item('PIP-PKG-1438'), qty: 3 }, { item: item('ACC-HEIGHT'), qty: 1, flag: true }],
    });
    expect(L.map(l => [l.key, l.kind, l.group, l.unitEx, l.qty])).toEqual([
      ['P-FTKQ12', 'product', 'product', 15900, 2],
      ['I-INS-W-9000-12000-STANDARD', 'service', 'install', std.item.ex, 2],
      ['A-PIP-PKG-1438', 'addon', 'addon', (item('PIP-PKG-1438').ex ?? 0) * 3, 2],
      ['S-ACC-HEIGHT', 'survey', 'addon', null, 1],
    ]);
    expect(L[0]).toMatchObject({ name: 'Daikin FTKQ12', detail: 'ติดผนัง 12,000 BTU' });
    expect(L[2].detail).toBe(`3 ${item('PIP-PKG-1438').unit} × 2 เครื่อง`);
    const t = quoteTotals(L, null);
    expect(t.surveys).toBe(1);
    expect(t.travel).toBe(0);
  });
  it('a brand without prices (FUJIVA) gives no product line; zero-quantity add-ons are skipped', () => {
    const L = productLines({ brandName: 'FUJIVA', type: 'wall', sku: 'X', btu: 9000, price: null, install: null, qty: 1, addons: [{ item: item('DISPOSE'), qty: 0 }] });
    expect(L).toEqual([]);
  });
  it('service rows: priced → service / addon, unpriced → survey', () => {
    expect(serviceLine({ key: 'R-x', group: 'repair', name: 'x', ex: 900 }).kind).toBe('service');
    expect(serviceLine({ key: 'A-x', group: 'addon', name: 'x', ex: 500, addon: true }).kind).toBe('addon');
    expect(serviceLine({ key: 'S-x', group: 'install', name: 'x', ex: null })).toMatchObject({ kind: 'survey', unitEx: null, qty: 1 });
  });
});

describe('itemised cost', () => {
  it('breakdown groups, totals and survey count', () => {
    const b = breakdown([
      { group: 'product', key: 'P-x', name: 'แอร์', unit: 'เครื่อง', unitEx: 10000, qty: 1 },
      { group: 'install', key: 'I-INS-W', name: 'ติดตั้ง', unit: 'เครื่อง', unitEx: 3800, qty: 1 },
      { group: 'addon', key: 'A-PIP-PKG-1438', name: 'ท่อ', unit: 'เมตร', unitEx: 1000, qty: 2 },
      { group: 'addon', key: 'S-ACC-HEIGHT', name: 'งานสูง', unitEx: null, qty: 1 },
    ]);
    expect(b.groups.map(g => [g.th, g.rows.length])).toEqual([['เครื่องปรับอากาศ', 1], ['แพ็กเกจติดตั้ง', 1], ['ตัวเลือกเพิ่ม (วัสดุและงาน)', 1], ['ประเมินหน้างาน (แจ้งราคาก่อนทำ)', 1]]);
    expect([b.ex, b.vat, b.inc, b.assess]).toEqual([15800, 1106, 16906, 1]);
    expect(b.groups[2].rows[0].note).toBe('แพ็กเกจรวม 4 เมตรแรกแล้ว — ใส่เฉพาะส่วนที่เกิน');
  });
  it('package parts, notes, pipe size', () => {
    expect(packageParts({ inc: 'ก; ข ใช้เมื่อระบุใน QTN; ค' })).toEqual(['ก', 'ค']);
    expect(packageParts(null)).toEqual([]);
    expect(optionNote('ELE-NANO-RCBO20')).toMatch(/^แพ็กเกจติดตั้งรวมเบรกเกอร์/);
    expect(optionNote('XYZ')).toBe('');
    expect([pipeCodeFor(9000), pipeCodeFor(18000), pipeCodeFor(60000), pipeCodeFor(90000)]).toEqual(['PIP-PKG-1438', 'PIP-PKG-1412', 'PIP-PKG-3878', 'PIP-PKG-3878']);
  });
  it('material columns split the package text into rows', () => {
    const cols = materialColumns(installOptions('wall', 12000));
    expect(cols.map(c => c.key)).toEqual(['STANDARD', 'PREMIUM']);
    expect(cols[0].cell.pipe?.join(' ')).toMatch(/O-TWO/);
    expect(cols[0].cell.incl?.[0]).toMatch(/^ท่อ/);
  });
});

describe('price-centre rows', () => {
  it('category groups and titles', () => {
    const move = inCategories(getInstallItems(), PRICE_GROUPS.move);
    expect(move.some(i => i.code === 'MOVE-W-9000-12000')).toBe(true);
    expect(move.every(i => PRICE_GROUPS.move.some(p => (i.cat || '').startsWith(p)))).toBe(true);
    expect(catTitle('13 งานรื้อ ย้าย และขนย้าย')).toBe('งานรื้อ ย้าย และขนย้าย');
  });
  it('line builders use the reference key scheme', () => {
    expect(installItemLine(item('INS-W-9000-12000-STANDARD'))).toMatchObject({ key: 'I-INS-W-9000-12000-STANDARD', kind: 'service', group: 'install' });
    expect(installItemLine(item('INS-VRF-IDU-SURVEY'))).toMatchObject({ key: 'S-INS-VRF-IDU-SURVEY', kind: 'survey', unitEx: null });
    expect(installItemLine(item('DISPOSE'))).toMatchObject({ key: 'A-DISPOSE', kind: 'addon', group: 'addon', unitEx: 500 });
    expect(installItemLine(item('LOG-NIGHT'))).toMatchObject({ key: 'A-LOG-NIGHT', kind: 'survey', unitEx: null });
    const r = getRepairItems()[0];
    expect(repairLine(r)).toMatchObject({ key: `R-${r.name}`, group: 'repair', unitEx: r.ex });
  });
});
