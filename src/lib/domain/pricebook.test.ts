import { describe, expect, it } from 'vitest';
import raw from '@data/pricebook.json';
import { MIN_BILL } from './constants';
import { bannedIn } from './content';
import {
  addonsFor, cleanFrom, getBrands, getCatalog, getCatalogLite, getCleanRates, getCleanRateTable, getFaq, getInstallItem, getInstallItems,
  getRepairItems, getSeriesBySlug, getSeriesSlugs, getServices, getSkuCount, installOptions, minBill, productOptions, serviceFrom,
} from './pricebook';

describe('pricebook · business rules after load', () => {
  it('client-safe MIN_BILL equals the Pricebook minBill', () => {
    expect(MIN_BILL).toBe(minBill);
    expect(MIN_BILL).toBe((raw as { minBill: number }).minBill);
    expect(getCleanRateTable().minBill).toBe(MIN_BILL);
  });
  it('cleaning starts at ฿700; headline prices', () => {
    expect(cleanFrom()).toBe(700);
    expect(serviceFrom()).toEqual({ clean: 700, install: 3800, repair: 900 });
    const s = getServices();
    expect(s.find(x => x.id === 'clean')?.from).toBe('เริ่ม ฿700 / เครื่อง');
    expect(s.find(x => x.id === 'install')?.sub).toBe('มาตรฐาน · พรีเมียม');
  });
  it('service rates are whole hundreds; materials keep exact prices', () => {
    expect(getInstallItems().filter(i => /^INS-/.test(i.code) && i.ex != null).every(i => i.ex! % 100 === 0)).toBe(true);
    expect(getCleanRates().every(r => r.ex == null || r.ex % 100 === 0)).toBe(true);
    expect(getRepairItems().every(r => r.ex == null || r.ex % 100 === 0)).toBe(true);
    expect(getCleanRates().some(r => r.pb != null && r.pb % 100 !== 0)).toBe(true);
  });
  it('web sells Standard / Premium only; copper is O-TWO only', () => {
    const items = getInstallItems();
    expect(items.some(i => /-MASS$/.test(i.code) || /^MAT-CU-L-/.test(i.code))).toBe(false);
    const text = JSON.stringify(items);
    expect(text).not.toMatch(/K Copper|Type L/);
    expect(text).toMatch(/O-TWO/);
  });
  it('decided rates + relocation rows replace the single MOVE lines', () => {
    expect(getInstallItem('REM-W')?.ex).toBe(1000);
    expect(getInstallItem('REM-W')?.decided).toBe('m');
    expect(getInstallItem('MOVE-W')).toBeUndefined();
    expect(getInstallItem('MOVE-W-9000-12000')?.ex).toBe(1000 + (getInstallItem('INS-W-9000-12000-STANDARD')?.ex ?? 0));
    expect(getInstallItems().filter(i => /^MOVE-(W|C|K|FS)-\d+-\d+$/.test(i.code))).toHaveLength(21);
    expect(getInstallItem('LOG-NIGHT')?.ex ?? null).toBeNull();
  });
  it('only standard rates reach the site (no special / project rate fields)', () => {
    expect(Object.keys(getCleanRates()[0])).not.toContain('sp');
    expect(JSON.stringify(getCleanRateTable())).not.toMatch(/"sp"|"pj"/);
  });
  it('no banned phrase in any loaded text', () => {
    const all = JSON.stringify([getInstallItems(), getCleanRates(), getRepairItems(), getFaq(), getServices()]);
    expect(bannedIn(all)).toEqual([]);
  });
});

describe('pricebook · catalog', () => {
  it('series and brands', () => {
    expect(getSkuCount()).toBe(705);
    const brands = getBrands();
    expect(brands[0]).toEqual({ id: 'fujiva', name: 'FUJIVA', own: true, n: 0 });
    expect(getCatalog().some(m => m.brand === 'fujiva')).toBe(false);
    expect(brands.slice(1).every((b, i, a) => i === 0 || a[i - 1].n >= b.n)).toBe(true);
    expect(getCatalog().every(m => m.skus.every((s, i, a) => i === 0 || a[i - 1].btu <= s.btu))).toBe(true);
  });
  it('slugs are unique, URL-safe and resolve back', () => {
    const slugs = getSeriesSlugs();
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs.every(s => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(s))).toBe(true);
    for (const s of slugs) expect(getSeriesBySlug(s)?.slug).toBe(s);
    expect(getSeriesBySlug('nope')).toBeUndefined();
    // collisions are told apart by type, then inverter / fixed, then a number
    expect(slugs).toEqual(expect.arrayContaining(['casper-verde-inverter', 'casper-verde-fixed', 'carrier-tgf-fixed-speed-ceiling', 'carrier-tgf-fixed-speed-cassette']));
    expect(slugs.filter(s => s.startsWith('mitsubishi-electric-ply-m'))).toEqual(['mitsubishi-electric-ply-m', 'mitsubishi-electric-ply-m-2']);
  });
  it('lite catalog has no spec and serialises', () => {
    const lite = getCatalogLite();
    expect(lite).toHaveLength(getCatalog().length);
    expect('spec' in lite[0].skus[0]).toBe(false);
    expect(JSON.parse(JSON.stringify(lite))).toEqual(lite);
  });
  it('clean rate table: typed rows of 3 packages × C1/C2 × 20 bands, serialisable', () => {
    const t = getCleanRateTable();
    expect(t.rows).toHaveLength(120);
    expect(JSON.parse(JSON.stringify(t))).toEqual(t);
    expect(getCleanRateTable(['Basic Clean']).rows).toHaveLength(40);
  });
});

describe('pricebook · product helpers', () => {
  it('installOptions: Standard + Premium by size band; ducted / oversize → survey', () => {
    expect(installOptions('wall', 12000).map(o => o.item.code)).toEqual(['INS-W-9000-12000-STANDARD', 'INS-W-9000-12000-PREMIUM']);
    expect(installOptions('wall', 13000)[0].item.code).toBe('INS-W-13000-18000-STANDARD');
    expect(installOptions('duct', 24000)).toEqual([]);
    expect(installOptions('floor', 80000)).toEqual([]);
  });
  it('addonsFor: pipe bundle by size, removal by type, assessed lines as flags', () => {
    const g = addonsFor('cassette', 36000);
    expect(g[0].items[0].choices[0].code).toBe('PIP-PKG-3858');
    expect(g.find(x => x.group === 'เครื่องเดิมและงานเจาะ')?.items.map(a => a.choices[0].code)).toContain('REM-K');
    const flags = g.find(x => x.group.startsWith('ประเมินหน้างาน'));
    expect(flags?.items.every(a => a.qty === 'flag' && a.choices[0].ex == null)).toBe(true);
    expect(g[1].items[0].choices.map(c => c.code)).toEqual(['ELE-MAIN-1P-2.5', 'ELE-MAIN-1P-4', 'ELE-MAIN-1P-6']);
  });
  it('productOptions bundles everything for one SKU and serialises', () => {
    const o = productOptions('wall', 18000);
    expect(o.install).toHaveLength(2);
    expect(o.bundle?.item.code).toBe('PIP-PKG-1412');
    expect(o.bundle?.sum).toBeGreaterThan(0);
    expect(JSON.parse(JSON.stringify(o))).toEqual(o);
  });
});
