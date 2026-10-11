import { describe, expect, it } from 'vitest';
import { BRAND_ALIASES, btuRange, emptyFilter, facetCounts, filterToParams, haystack, paramsToFilter, priceRange, queryCatalog, textMatches, type CatalogFilter } from './catalog';
import { getBrands, getCatalog, getCatalogLite } from './pricebook';

const cat = getCatalog();
const f = (o: Partial<CatalogFilter>): CatalogFilter => ({ ...emptyFilter(), ...o });

describe('catalog search', () => {
  it('finds a BTU written with or without a comma', () => {
    const a = queryCatalog(cat, f({ q: '12000' }));
    const b = queryCatalog(cat, f({ q: '12,000' }));
    expect(a.list.length).toBeGreaterThan(20);
    expect(b.list.map(m => m.slug)).toEqual(a.list.map(m => m.slug));
    expect(a.list.every(m => m.skus.some(s => String(s.btu).includes('12000') || s.sku.includes('12000')))).toBe(true);
  });
  it('multi-word queries: every word must match (brand + size)', () => {
    // = the series matching 'carrier' AND the series matching '12000' (substring like the reference: 120,000 counts too)
    const r = queryCatalog(cat, f({ q: 'carrier 12000' }));
    const both = new Set(queryCatalog(cat, f({ q: '12000' })).list.map(m => m.slug));
    const want = queryCatalog(cat, f({ q: 'carrier' })).list.filter(m => both.has(m.slug)).map(m => m.slug);
    expect(r.list.length).toBeGreaterThan(0);
    expect(r.list.map(m => m.slug)).toEqual(want);
    expect(r.list.every(m => m.brand === 'carrier')).toBe(true);
    const typeBrand = queryCatalog(cat, f({ q: 'carrier สี่ทิศทาง' }));
    expect(typeBrand.list.length).toBeGreaterThan(0);
    expect(typeBrand.list.every(m => m.brand === 'carrier' && m.type === 'cassette')).toBe(true);
  });
  it("'12k' means 12000; 'btu' and 'แอร์' are ignored", () => {
    expect(queryCatalog(cat, f({ q: 'carrier 12k' })).list.map(m => m.slug)).toEqual(queryCatalog(cat, f({ q: 'carrier 12000' })).list.map(m => m.slug));
    expect(queryCatalog(cat, f({ q: 'แอร์ carrier 12000 btu' })).list.length).toBe(queryCatalog(cat, f({ q: 'carrier 12000' })).list.length);
    expect(queryCatalog(cat, f({ q: 'zzzz' })).list).toEqual([]);
  });
  it('Thai brand names find the same series as the Latin name', () => {
    const slugs = (q: string) => queryCatalog(cat, f({ q })).list.map(m => m.slug);
    const daikin = slugs('daikin');
    expect(daikin.length).toBeGreaterThan(0);
    expect(slugs('ไดกิ้น')).toEqual(daikin);
    expect(slugs('ไดกิน')).toEqual(daikin);
    expect(slugs('ไดกิ้น 12000')).toEqual(slugs('daikin 12000'));
    // both Mitsubishi brands answer to the short Thai name
    const mitsu = queryCatalog(cat, f({ q: 'มิตซู' })).list;
    expect(new Set(mitsu.map(m => m.brand))).toEqual(new Set(['mitsubishi-electric', 'mitsubishi-heavy-duty']));
    // 'อินเวอร์เตอร์' = every Inverter series, and only those
    const inv = queryCatalog(cat, f({ q: 'อินเวอร์เตอร์' })).list;
    expect(inv.length).toBe(cat.filter(m => m.inverter).length);
    // every alias key is a real brand name in the data (a renamed brand would silently lose its Thai spelling)
    const names = new Set(cat.map(m => m.brandName));
    expect(Object.keys(BRAND_ALIASES).filter(n => !names.has(n))).toEqual([]);
  });
  it('textMatches on a haystack', () => {
    const h = haystack({ series: 'FTKQ · Inverter', brandName: 'Daikin', type: 'wall', skus: [{ sku: 'FTKQ12', btu: 12000, price: 1, installStdEx: null }] });
    expect(textMatches(h, 'ftkq')).toBe(true);
    expect(textMatches(h, 'Daikin  ติดผนัง')).toBe(true);
    expect(textMatches(h, 'carrier')).toBe(false);
    expect(textMatches(h, '   ')).toBe(true);
  });
});

describe('catalog filters, sort and facets', () => {
  it('works on the lite catalog with the same result', () => {
    const lite = getCatalogLite();
    const o = f({ type: new Set(['wall']), price: new Set(['p2']), sort: 'price-asc' });
    expect(queryCatalog(lite, o).list.map(m => m.slug)).toEqual(queryCatalog(cat, o).list.map(m => m.slug));
  });
  it('price sort uses the cheapest SKU inside the filter', () => {
    const r = queryCatalog(cat, f({ sort: 'price-asc', price: new Set(['p3']) }));
    const mins = r.list.map(m => Math.min(...r.visibleSkus(m).map(s => s.price)));
    expect(mins.every((p, i) => i === 0 || mins[i - 1] <= p)).toBe(true);
    expect(mins.every(p => p >= 25000 && p < 40000)).toBe(true);
  });
  it('facets ignore their own selection', () => {
    const o = f({ type: new Set(['wall']) });
    const fc = facetCounts(cat, o, getBrands());
    expect(fc.type.ceiling).toBeGreaterThan(0);
    expect(fc.brand.fujiva).toBe(0);
    expect(fc.inverter.inv + fc.inverter.fix).toBe(queryCatalog(cat, o).list.length);
  });
  it('URL params round-trip and drop unknown values', () => {
    const o = f({ q: 'daikin 12000', type: new Set(['wall', 'cassette']), btu: new Set(['b1']), inverter: 'inv', sort: 'price-desc' });
    const back = paramsToFilter(filterToParams(o));
    expect(back).toEqual(o);
    const bad = paramsToFilter('type=wall,rocket&btu=b9&sort=cheap&inv=yes&brand=Bad Brand');
    expect([...bad.type]).toEqual(['wall']);
    expect(bad.btu.size + bad.brand.size).toBe(0);
    expect([bad.sort, bad.inverter]).toEqual(['rec', '']);
  });
  it('price and BTU range of a series', () => {
    const m = cat[0];
    expect(priceRange(m).min).toBe(Math.min(...m.skus.map(s => s.price)));
    expect(btuRange(m)).toEqual({ min: m.skus[0].btu, max: m.skus[m.skus.length - 1].btu });
  });
});
