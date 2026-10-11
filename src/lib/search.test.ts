import { describe, expect, it } from 'vitest';
import { getCatalogLite } from './domain/pricebook';
import { entry, searchSite } from './search';
import { buildSearchIndex } from './search-index';

const index = buildSearchIndex();
const hrefs = (q: string) => searchSite(index, q).map(e => e.h);

describe('site search index', () => {
  it('has every page, every series and links that stay inside the site', () => {
    expect(index.filter(e => e.k === 'series')).toHaveLength(getCatalogLite().length);
    for (const p of ['/', '/cleaning/', '/repair/', '/status/', '/quote/']) expect(index.some(e => e.k === 'page' && e.h === p)).toBe(true);
    expect(index.some(e => e.k === 'guide')).toBe(true);
    expect(index.some(e => e.k === 'faq')).toBe(true);
    for (const e of index) expect(e.h).toMatch(/^\/[^/]*/);
  });

  it('stays small enough to fetch on a phone', () => {
    expect(JSON.stringify(index).length).toBeLessThan(250_000);
  });
});

describe('searchSite', () => {
  it('finds a page by the words people type', () => {
    expect(hrefs('ล้างแอร์')[0]).toBe('/cleaning/');
    expect(hrefs('น้ำหยด')).toContain('/repair/');
    expect(hrefs('เลขอ้างอิง')).toContain('/status/');
  });

  it('finds series by Thai brand name and BTU written as 12k', () => {
    const r = searchSite(index, 'ไดกิ้น 12k');
    expect(r.length).toBeGreaterThan(0);
    expect(r.every(e => e.k === 'series' && e.t.startsWith('Daikin'))).toBe(true);
  });

  it('ranks a title that starts with the query first, pages before series at the same rank', () => {
    const list = [entry('series', 'Zeta ล้าง', '', '/products/z/'), entry('page', 'ล้างแอร์', '', '/cleaning/'), entry('series', 'ล้างพิเศษ', '', '/products/x/')];
    expect(searchSite(list, 'ล้าง').map(e => e.h)).toEqual(['/cleaning/', '/products/x/', '/products/z/']);
  });

  it('finds nothing for an empty query', () => {
    expect(searchSite(index, '   ')).toEqual([]);
  });
});
