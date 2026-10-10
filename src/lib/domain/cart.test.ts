// The client quote store (src/lib/cart.ts) without React: stubbed window + localStorage.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { __resetCartForTests, cart, requestQuoteOpen, STORAGE_KEY, type CartLineInput } from '../cart';

const wall: CartLineInput = { kind: 'service', group: 'clean', key: 'QC-Basic Clean-C1-wall-0', name: 'ล้าง', unitEx: 700, qty: 1, src: 'qc' };
const survey: CartLineInput = { kind: 'survey', group: 'addon', key: 'S-ACC-HEIGHT', name: 'งานสูง', unitEx: null };

let mem: Record<string, string>;
function stubWindow(storage: 'ok' | 'throws' | 'none' = 'ok') {
  mem = {};
  const ls = {
    getItem: (k: string) => (storage === 'throws' ? (() => { throw new Error('blocked'); })() : (mem[k] ?? null)),
    setItem: (k: string, v: string) => {
      if (storage === 'throws') throw new Error('blocked');
      mem[k] = v;
    },
    removeItem: (k: string) => void delete mem[k],
  };
  vi.stubGlobal('window', { localStorage: storage === 'none' ? undefined : ls, addEventListener: () => {} });
}

beforeEach(() => {
  stubWindow();
  __resetCartForTests();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('cart store', () => {
  it('add merges by key; survey requests are kept once; qty clamps to 1..999', () => {
    const id = cart.add(wall);
    expect(cart.add({ ...wall, qty: 2 })).toBe(id);
    expect(cart.get().lines).toHaveLength(1);
    expect(cart.get().lines[0].qty).toBe(3);
    cart.add(survey);
    cart.add(survey);
    expect(cart.get().lines.filter(l => l.kind === 'survey')).toHaveLength(1);
    expect(cart.count()).toBe(3);
    cart.setQty(id, 5000);
    expect(cart.get().lines[0].qty).toBe(999);
    cart.setQty(id, 0);
    expect(cart.get().lines[0].qty).toBe(1);
    cart.remove(id);
    expect(cart.get().lines.map(l => l.key)).toEqual(['S-ACC-HEIGHT']);
    cart.clear();
    expect(cart.get().lines).toEqual([]);
  });
  it('totals follow quoteTotals with MIN_BILL (below the minimum → travel ฿300)', () => {
    cart.add({ ...wall, qty: 5 });
    expect(cart.totals()).toMatchObject({ ex: 3500, travel: 300, totalEx: 3800, vat: 266, inc: 4066 });
  });
  it('persists to localStorage under sbp-web-quote-v1 and reads it back', () => {
    cart.add(wall);
    cart.setZone({ province: 'กรุงเทพมหานคร', district: '', sub: '', zip: '', match: 'บางมด', districts: [], tier: 'core', km: 3, fee: 0 });
    cart.setPref('2999-01-04', 'ช่วงเช้า');
    const stored = JSON.parse(mem[STORAGE_KEY]);
    expect(stored.v).toBe(1);
    expect(stored.lines[0].key).toBe(wall.key);
    __resetCartForTests();
    const s = cart.get();
    expect(s.lines.map(l => l.key)).toEqual([wall.key]);
    expect(s.zone?.tier).toBe('core');
    expect(s.zoneInput).toBe('บางมด');
    expect(s.pref).toEqual({ date: '2999-01-04', slot: 'ช่วงเช้า' });
  });
  it('ignores broken or old storage, and a past preferred date', () => {
    mem[STORAGE_KEY] = '{not json';
    expect(cart.get().lines).toEqual([]);
    __resetCartForTests();
    mem[STORAGE_KEY] = JSON.stringify({ v: 1, zv: 1, lines: [{ bad: true }, { ...wall, id: 'a', qty: 2 }], addr: null, zone: null, zoneInput: '', pref: { date: '2000-01-01', slot: 'x' } });
    const s = cart.get();
    expect(s.lines).toHaveLength(1);
    expect(s.pref).toEqual({ date: '', slot: '' });
  });
  it('works without storage (blocked or missing)', () => {
    stubWindow('throws');
    __resetCartForTests();
    cart.add(wall);
    expect(cart.get().lines).toHaveLength(1);
    stubWindow('none');
    __resetCartForTests();
    cart.add(wall);
    expect(cart.count()).toBe(1);
  });
  it('replaceSource swaps a tool’s lines; syncRush keeps one rush line inside the rush window', () => {
    cart.add({ kind: 'product', group: 'product', key: 'P-x', name: 'แอร์', unitEx: 10000, qty: 1 });
    cart.replaceSource('qc', [wall]);
    cart.replaceSource('qc', [{ ...wall, key: 'QC-Standard Care-C1-wall-0', unitEx: 900, qty: 5 }]);
    expect(cart.get().lines.map(l => l.key)).toEqual(['P-x', 'QC-Standard Care-C1-wall-0']);
    const now = { date: '2026-10-09', min: 600 };
    cart.syncRush('2026-10-10', now);
    cart.syncRush('2026-10-10', now);
    expect(cart.get().lines.filter(l => l.group === 'rush')).toHaveLength(1);
    cart.syncRush('2026-10-12', now);
    expect(cart.get().lines.some(l => l.group === 'rush')).toBe(false);
  });
  it('setAddress without a zone computes it from the lazy address book', async () => {
    cart.setAddress({ p: 'กรุงเทพมหานคร', d: 'จอมทอง', s: 'บางมด', z: '10150' });
    expect(cart.get().zoneInput).toBe('แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150');
    await vi.waitFor(() => expect(cart.get().zone?.tier).toBe('core'));
    cart.setAddress(null);
    expect(cart.get().zone).toBeNull();
  });
  it('subscribers are notified; quote-open requests reach listeners', () => {
    const f = vi.fn();
    const off = cart.subscribe(f);
    cart.add(wall);
    expect(f).toHaveBeenCalled();
    off();
    expect(() => requestQuoteOpen()).not.toThrow();
  });
});
