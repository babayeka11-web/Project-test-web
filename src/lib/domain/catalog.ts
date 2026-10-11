// Catalog types + search / filter / sort / facets (client-safe, pure). Port of PRICE_BANDS / BTU_BANDS / emptyFilter /
// queryCatalog / facetCounts / filterToParams in the reference sbp-core.js. Every function takes the catalog array as an
// argument (pricebook.getCatalog() or getCatalogLite() on the server → prop), so nothing here embeds the Pricebook.
// Search: the reference matched the whole query (spaces, commas, '-' and '/' removed) inside one haystack of series +
// brand + type + sku codes + BTU numbers, so '12000' and '12,000' work. Added here: a multi-word query matches when every
// word matches ('daikin 12000'), '12k' also means 12000, the words 'btu' / 'แอร์' are ignored, and brand names typed in
// Thai ('ไดกิ้น', 'มิตซู') or 'อินเวอร์เตอร์' find the same series (BRAND_ALIASES — search text only).
import { typeOrder, TYPE_BY_ID, type AcTypeId } from './types';

export type SkuSpec = {
  series: string | null;
  system: string | null;
  refrigerant: string | null;
  pipeLiquid: string | null;
  pipeGas: string | null;
  indoorDim: string | null;
  indoorKg: string | null;
  outdoorDim: string | null;
  outdoorKg: string | null;
  power: string | null;
  compressor: string | null;
  warranty: string | null;
  lead: string | null;
  outdoorModel: string | null;
  maxPipe: string | null;
  maxLift: string | null;
  /** price approved in Pricebook 2569 */
  approved: boolean;
};

export type SkuLite = { sku: string; btu: number; price: number; installStdEx: number | null };
export type Sku = SkuLite & { spec: SkuSpec };

/** What the catalog functions need from a series (both CatalogSeries and CatalogSeriesLite satisfy it). */
export type CatalogSeriesLite = {
  /** URL slug: /products/<slug>/ */
  slug: string;
  /** reference prototype id (brand|series|type|inverter slug) */
  refId: string;
  /** first (smallest) sku code */
  code: string;
  brand: string;
  brandName: string;
  /** SKUs of this brand in the whole catalog (default sort: bigger brands first) */
  brandSkus: number;
  type: AcTypeId;
  inverter: boolean;
  /** refrigerant label of the series ('R32' …) */
  label: string;
  /** display name: series + ' · Inverter' / ' · Fixed Speed' unless the series name says so */
  series: string;
  /** sorted by BTU */
  skus: SkuLite[];
};
export type CatalogSeries = Omit<CatalogSeriesLite, 'skus'> & { skus: Sku[] };

export type Brand = { id: string; name: string; /** SKUs */ n: number; /** the company's own brand (FUJIVA) */ own?: boolean };

export type Band = { id: string; th: string; min: number; max: number };
export const PRICE_BANDS: readonly Band[] = [
  { id: 'p1', th: 'ต่ำกว่า 15,000', min: 0, max: 15000 },
  { id: 'p2', th: '15,000–25,000', min: 15000, max: 25000 },
  { id: 'p3', th: '25,000–40,000', min: 25000, max: 40000 },
  { id: 'p4', th: '40,000–70,000', min: 40000, max: 70000 },
  { id: 'p5', th: '70,000 ขึ้นไป', min: 70000, max: Infinity },
];
export const BTU_BANDS: readonly Band[] = [
  { id: 'b1', th: '≤ 12,000', min: 0, max: 12000 },
  { id: 'b2', th: '12,001–18,000', min: 12001, max: 18000 },
  { id: 'b3', th: '18,001–30,000', min: 18001, max: 30000 },
  { id: 'b4', th: '30,001–48,000', min: 30001, max: 48000 },
  { id: 'b5', th: '> 48,000', min: 48001, max: Infinity },
];

export type CatalogSort = 'rec' | 'price-asc' | 'price-desc' | 'btu';
export const SORTS: readonly { id: CatalogSort; th: string }[] = [
  { id: 'rec', th: 'แนะนำ' },
  { id: 'price-asc', th: 'ราคาต่ำ–สูง' },
  { id: 'price-desc', th: 'ราคาสูง–ต่ำ' },
  { id: 'btu', th: 'ขนาด BTU' },
];

export type CatalogFilter = {
  q: string;
  type: Set<string>;
  brand: Set<string>;
  /** BTU_BANDS ids */
  btu: Set<string>;
  /** PRICE_BANDS ids */
  price: Set<string>;
  inverter: '' | 'inv' | 'fix';
  sort: CatalogSort;
};

export const emptyFilter = (): CatalogFilter => ({ q: '', type: new Set(), brand: new Set(), btu: new Set(), price: new Set(), inverter: '', sort: 'rec' });

type FacetKey = 'type' | 'brand' | 'inverter' | 'btu' | 'price';

function skuMatches(sku: SkuLite, f: Pick<CatalogFilter, 'btu' | 'price'>): boolean {
  if (f.btu.size && ![...f.btu].some(id => { const b = BTU_BANDS.find(x => x.id === id); return !!b && sku.btu >= b.min && sku.btu <= b.max; })) return false;
  if (f.price.size && ![...f.price].some(id => { const b = PRICE_BANDS.find(x => x.id === id); return !!b && sku.price >= b.min && sku.price < b.max; })) return false;
  return true;
}

const squash = (s: string) => s.toLowerCase().replace(/[,\s\-/]/g, '');
const IGNORED_WORDS = new Set(['btu', 'บีทียู', 'แอร์']);

/** How people write each brand in Thai, keyed by the exact brandName in the catalog data. Search text only: nothing here
 *  is shown, and it never touches prices or rules. 'มิตซูบิชิ' / 'มิตซู' are part of both Mitsubishi names, so they
 *  find both brands. */
export const BRAND_ALIASES: Readonly<Record<string, readonly string[]>> = {
  Daikin: ['ไดกิ้น', 'ไดกิน'],
  Carrier: ['แคเรียร์', 'แคเรีย'],
  'Mitsubishi Electric': ['มิตซูบิชิ', 'มิตซู'],
  'Mitsubishi Heavy Duty': ['มิตซูบิชิเฮฟวี่', 'มิตซูเฮฟวี่'],
  Samsung: ['ซัมซุง'],
  LG: ['แอลจี'],
  Panasonic: ['พานาโซนิค'],
  Sharp: ['ชาร์ป'],
  Haier: ['ไฮเออร์'],
  Hisense: ['ไฮเซนส์'],
  Hitachi: ['ฮิตาชิ'],
  Fujitsu: ['ฟูจิตสึ'],
  Gree: ['กรี'],
  Midea: ['ไมเดีย', 'มีเดีย'],
  TCL: ['ทีซีแอล'],
  York: ['ยอร์ค'],
  'Saijo Denki': ['ไซโจ', 'ไซโจเดนกิ'],
  'Central Air': ['เซ็นทรัลแอร์'],
  AUX: ['ออกซ์'],
  Casper: ['แคสเปอร์'],
  Eminent: ['อีมิเนนท์'],
  Mavell: ['มาเวล'],
};
/** Added to the search text of Inverter series. */
const INVERTER_ALIAS = 'อินเวอร์เตอร์';

/** The searchable text of a series (the reference haystack + the Thai brand spellings). */
export const haystack = (m: Pick<CatalogSeriesLite, 'series' | 'brandName' | 'type' | 'skus'> & { inverter?: boolean }): string =>
  squash(
    m.series +
      m.brandName +
      (BRAND_ALIASES[m.brandName] ?? []).join('') +
      (m.inverter ? INVERTER_ALIAS : '') +
      (TYPE_BY_ID[m.type]?.th ?? '') +
      m.skus.map(s => s.sku + s.btu).join(''),
  );

/** Does the query match this haystack? Whole query first (reference), then every word on its own. */
export function textMatches(hay: string, q: string): boolean {
  const whole = squash(q);
  if (!whole || hay.includes(whole)) return true;
  const words = q.toLowerCase().split(/\s+/).map(w => w.replace(/[,\-/]/g, '')).filter(w => w && !IGNORED_WORDS.has(w));
  if (!words.length) return true;
  return words.every(w => {
    if (hay.includes(w)) return true;
    const k = /^(\d+(?:\.\d+)?)k$/.exec(w);
    return !!k && hay.includes(String(Math.round(parseFloat(k[1]) * 1000)));
  });
}

function modelMatches<S extends CatalogSeriesLite>(m: S, f: CatalogFilter, skip?: FacetKey, hay?: string): boolean {
  if (skip !== 'type' && f.type.size && !f.type.has(m.type)) return false;
  if (skip !== 'brand' && f.brand.size && !f.brand.has(m.brand)) return false;
  if (skip !== 'inverter' && f.inverter && (f.inverter === 'inv') !== m.inverter) return false;
  if (f.q && !textMatches(hay ?? haystack(m), f.q)) return false;
  const g = { btu: skip === 'btu' ? new Set<string>() : f.btu, price: skip === 'price' ? new Set<string>() : f.price };
  return m.skus.some(s => skuMatches(s, g));
}

export type CatalogResult<S extends CatalogSeriesLite> = {
  list: S[];
  /** SKUs inside the filter across the list */
  skuTotal: number;
  /** the SKUs of one series that are inside the filter */
  visibleSkus: (m: S) => S['skus'];
};

/** Filter + sort the catalog. */
export function queryCatalog<S extends CatalogSeriesLite>(models: readonly S[], f: CatalogFilter): CatalogResult<S> {
  const list = models.filter(m => modelMatches(m, f));
  const minP = (m: S) => Math.min(...m.skus.filter(s => skuMatches(s, f)).map(s => s.price));
  if (f.sort === 'price-asc') list.sort((a, b) => minP(a) - minP(b));
  else if (f.sort === 'price-desc') list.sort((a, b) => minP(b) - minP(a));
  else if (f.sort === 'btu') list.sort((a, b) => a.skus[0].btu - b.skus[0].btu);
  else list.sort((a, b) => typeOrder(a.type) - typeOrder(b.type) || b.brandSkus - a.brandSkus || a.skus[0].btu - b.skus[0].btu);
  const skuTotal = list.reduce((n, m) => n + m.skus.filter(s => skuMatches(s, f)).length, 0);
  return { list, skuTotal, visibleSkus: (m: S) => m.skus.filter(s => skuMatches(s, f)) as S['skus'] };
}

export type FacetCounts = { type: Record<string, number>; brand: Record<string, number>; btu: Record<string, number>; price: Record<string, number>; inverter: { inv: number; fix: number } };

/** Series count per facet value, each facet ignoring its own selection (so the counts say what a click would give). */
export function facetCounts<S extends CatalogSeriesLite>(models: readonly S[], f: CatalogFilter, brands?: readonly Pick<Brand, 'id'>[]): FacetCounts {
  const out: FacetCounts = { type: {}, brand: {}, btu: {}, price: {}, inverter: { inv: 0, fix: 0 } };
  const hays = new Map<S, string>();
  const hayOf = (m: S) => {
    let h = hays.get(m);
    if (h == null) hays.set(m, (h = haystack(m)));
    return h;
  };
  const base = (key: FacetKey) => models.filter(m => modelMatches(m, f, key, f.q ? hayOf(m) : undefined));
  const bt = base('type');
  Object.keys(TYPE_BY_ID).forEach(t => (out.type[t] = bt.filter(m => m.type === t).length));
  const bb = base('brand');
  const brandIds = brands ? brands.map(b => b.id) : [...new Set(models.map(m => m.brand))];
  brandIds.forEach(id => (out.brand[id] = bb.filter(m => m.brand === id).length));
  const noBtu = { ...f, btu: new Set<string>() };
  const bu = base('btu');
  BTU_BANDS.forEach(b => (out.btu[b.id] = bu.filter(m => m.skus.some(s => s.btu >= b.min && s.btu <= b.max && skuMatches(s, noBtu))).length));
  const noPrice = { ...f, price: new Set<string>() };
  const bp = base('price');
  PRICE_BANDS.forEach(b => (out.price[b.id] = bp.filter(m => m.skus.some(s => s.price >= b.min && s.price < b.max && skuMatches(s, noPrice))).length));
  const bi = base('inverter');
  out.inverter.inv = bi.filter(m => m.inverter).length;
  out.inverter.fix = bi.filter(m => !m.inverter).length;
  return out;
}

/** Filter → URL query string (shareable /products/?q=…&type=wall). */
export function filterToParams(f: CatalogFilter): string {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  for (const k of ['type', 'brand', 'btu', 'price'] as const) if (f[k].size) p.set(k, [...f[k]].join(','));
  if (f.inverter) p.set('inv', f.inverter);
  if (f.sort !== 'rec') p.set('sort', f.sort);
  return p.toString();
}

/** URL query → filter (unknown values are dropped). */
export function paramsToFilter(params: URLSearchParams | string): CatalogFilter {
  const p = typeof params === 'string' ? new URLSearchParams(params) : params;
  const f = emptyFilter();
  f.q = p.get('q') || '';
  const set = (k: string, ok: (v: string) => boolean) => new Set((p.get(k) || '').split(',').filter(v => v && ok(v)));
  f.type = set('type', v => v in TYPE_BY_ID);
  f.brand = set('brand', v => /^[a-z0-9-]+$/.test(v));
  f.btu = set('btu', v => BTU_BANDS.some(b => b.id === v));
  f.price = set('price', v => PRICE_BANDS.some(b => b.id === v));
  const inv = p.get('inv');
  f.inverter = inv === 'inv' || inv === 'fix' ? inv : '';
  const sort = p.get('sort');
  f.sort = SORTS.some(s => s.id === sort) ? (sort as CatalogSort) : 'rec';
  return f;
}

/** Lowest / highest machine price of a series (before VAT). */
export const priceRange = (m: Pick<CatalogSeriesLite, 'skus'>): { min: number; max: number } => {
  const ps = m.skus.map(s => s.price);
  return { min: Math.min(...ps), max: Math.max(...ps) };
};

/** Smallest / largest BTU of a series. */
export const btuRange = (m: Pick<CatalogSeriesLite, 'skus'>): { min: number; max: number } => ({ min: m.skus[0].btu, max: m.skus[m.skus.length - 1].btu });
