// Thai address book + zone lookup (client-safe). Port of loadAddr / zoneOf / addrSearch / addrTh / checkZone in the
// reference sbp-core.js (Rev.20). The book (data/th-address.json, ~84 KB) holds the provinces near HQ with every district,
// subdistrict, postcode and a point, plus other provinces by name only.
// loadAddressBook() dynamic-imports the JSON, so on the client it becomes its own lazy chunk — call it when a picker opens
// (or on the server at build time). Every lookup takes the book as its first argument.
import { roadKm, travelFee, TRAVEL, type Zone } from './travel';

export type AddrRow = { p: string; d: string; s: string; z: string; lat: number; lon: number };
/** A picked address: province, optional district / subdistrict / postcode. */
export type AddrPick = { p: string; d?: string; s?: string; z?: string };
export type AddrHit = AddrPick & { score: number };
export type AddressBook = { list: AddrRow[]; other: string[]; src: string };

type RawSub = [s: string, z: string, lat?: number, lon?: number];
type RawDistrict = [d: string, lat: number, lon: number, subs: RawSub[]];
export type RawAddressBook = { v: string; p: [province: string, districts: RawDistrict[]][]; o: string[] };

const BKK_TH = 'กรุงเทพมหานคร';
const isBkk = (p: string) => p === BKK_TH;

/** Flatten the raw JSON into one row per subdistrict (point = subdistrict point, else the district office). */
export function buildAddressBook(j: RawAddressBook): AddressBook {
  const list: AddrRow[] = [];
  j.p.forEach(([p, ds]) =>
    ds.forEach(([d, la, lo, subs]) =>
      subs.forEach(([s, z, sla, slo]) => list.push({ p, d, s, z, lat: sla ?? la, lon: slo ?? lo })),
    ),
  );
  return { list, other: j.o, src: j.v };
}

let pending: Promise<AddressBook> | null = null;
/** Load the address book once (lazy chunk on the client). Rejects when the chunk cannot load; the next call retries. */
export function loadAddressBook(): Promise<AddressBook> {
  if (!pending) {
    pending = import('@data/th-address.json')
      .then(m => buildAddressBook(((m as { default?: unknown }).default ?? m) as RawAddressBook))
      .catch(e => {
        pending = null;
        throw e;
      });
  }
  return pending;
}

/** Display name: 'แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150' · 'ต.… อ.… จ.… 12345'. */
export const addrTh = (a: AddrPick | null | undefined): string =>
  !a
    ? ''
    : isBkk(a.p)
      ? `${a.s ? 'แขวง' + a.s + ' ' : ''}${a.d ? 'เขต' + a.d + ' ' : ''}กรุงเทพฯ${a.z ? ' ' + a.z : ''}`
      : `${a.s ? 'ต.' + a.s + ' ' : ''}${a.d ? 'อ.' + a.d + ' ' : ''}จ.${a.p}${a.z ? ' ' + a.z : ''}`;

/** Title + sub line for one suggestion row in a picker (same wording as the reference picker). */
export function addrParts(a: AddrPick): { title: string; sub: string } {
  const bkk = isBkk(a.p);
  if (a.s) return { title: (bkk ? 'แขวง' : 'ต.') + a.s, sub: `${bkk ? 'เขต' : 'อ.'}${a.d} · ${bkk ? 'กรุงเทพฯ' : a.p}${a.z ? ' · ' + a.z : ''}` };
  if (a.d) return { title: (bkk ? 'เขต' : 'อ.') + a.d, sub: bkk ? 'กรุงเทพฯ · ทั้งเขต' : `${a.p} · ทั้งอำเภอ` };
  return { title: a.p, sub: 'ทั้งจังหวัด' };
}

/** Zone of a picked address → tier, road km, travel fee. A whole province / district: the nearest part decides. */
export function zoneOf(book: AddressBook, a: AddrPick | null | undefined): Zone | null {
  if (!a || !a.p) return null;
  const base = { province: a.p, district: a.d || '', sub: a.s || '', zip: a.z || '', match: addrTh(a), districts: [] as string[] };
  const rows = book.list.filter(r => r.p === a.p && (!a.d || r.d === a.d) && (!a.s || r.s === a.s) && (!a.z || r.z === a.z));
  if (!rows.length) {
    return book.other.includes(a.p) ? { ...base, tier: 'out', km: null, fee: null } : { ...base, tier: 'unknown', km: null, fee: null };
  }
  const km = Math.min(...rows.map(r => roadKm(r.lat, r.lon)));
  if (isBkk(a.p) && km <= TRAVEL.freeKm) return { ...base, tier: 'core', km, fee: 0 };
  const fee = travelFee(km);
  return fee == null ? { ...base, tier: 'out', km, fee: null } : { ...base, tier: 'extended', km, fee };
}

const nrm = (s: string | null | undefined): string =>
  (s || '')
    .replace(/\s|แขวง|เขต|ตำบล|อำเภอ|จังหวัด|ต\.|อ\.|จ\./g, '')
    .replace(/^กทม$|^กรุงเทพฯ?$/, BKK_TH)
    .toLowerCase();

const roadKmOf = (book: AddressBook, a: AddrPick): number => {
  const r = book.list.find(x => x.p === a.p && (!a.d || x.d === a.d));
  return r ? roadKm(r.lat, r.lon) : 999;
};

/** Type-ahead: subdistrict / district / province / postcode → up to n picks, best first. */
export function addrSearch(book: AddressBook, q: string, n = 8): AddrHit[] {
  const k = nrm(q);
  if (k.length < 2) return [];
  const out: AddrHit[] = [];
  const seen = new Set<string>();
  const add = (a: AddrPick, score: number) => {
    const key = `${a.p}|${a.d || ''}|${a.s || ''}|${a.z || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({ ...a, score });
    }
  };
  const zip = /^\d{2,5}$/.test(k);
  for (const r of book.list) {
    if (zip) {
      if (r.z.startsWith(k)) add({ p: r.p, d: r.d, s: r.s, z: r.z }, r.z === k ? 3 : 1);
      continue;
    }
    const s = nrm(r.s);
    const d = nrm(r.d);
    const p = nrm(r.p);
    if (s === k) add({ p: r.p, d: r.d, s: r.s, z: r.z }, 6);
    else if (s.startsWith(k)) add({ p: r.p, d: r.d, s: r.s, z: r.z }, 4);
    if (d === k) add({ p: r.p, d: r.d }, 7);
    else if (d.startsWith(k)) add({ p: r.p, d: r.d }, 5);
    if (p === k || p.startsWith(k)) add({ p: r.p }, p === k ? 5 : 2);
  }
  if (!zip) book.other.forEach(p => {
    if (nrm(p).startsWith(k)) add({ p }, 1);
  });
  return out
    .sort((a, b) => b.score - a.score || (a.s ? 1 : 0) - (b.s ? 1 : 0) || roadKmOf(book, a) - roadKmOf(book, b))
    .slice(0, n);
}

/** Free text (or a pick) → the zone of the best match, an 'unknown' zone, or null when the text is too short. */
export function checkZone(book: AddressBook, input: string | AddrPick | null | undefined): Zone | null {
  if (input && typeof input === 'object') return zoneOf(book, input);
  const q = nrm(input);
  if (q.length < 2) return null;
  const best = addrSearch(book, input as string, 1)[0];
  return best
    ? zoneOf(book, best)
    : { province: '', district: '', sub: '', zip: '', match: input as string, tier: 'unknown', districts: [], km: null, fee: null };
}

/* ---------- step-by-step picker (จังหวัด → เขต/อำเภอ → แขวง/ตำบล → รหัสไปรษณีย์) ---------- */

/** Provinces with full detail (in book order). Provinces in `book.other` are known by name only (out of per-unit range). */
export const provincesOf = (book: AddressBook): string[] => [...new Set(book.list.map(r => r.p))];
export const districtsOf = (book: AddressBook, p: string): string[] => [...new Set(book.list.filter(r => r.p === p).map(r => r.d))];
export const subdistrictsOf = (book: AddressBook, p: string, d: string): AddrRow[] => book.list.filter(r => r.p === p && r.d === d);

/** Build a pick from cascade selects ('' = not chosen); the postcode comes from the subdistrict. */
export function pickFrom(book: AddressBook, p: string, d = '', s = ''): AddrPick | null {
  if (!p) return null;
  const r = s ? subdistrictsOf(book, p, d).find(x => x.s === s) : undefined;
  const a: AddrPick = { p };
  if (d) a.d = d;
  if (s) a.s = s;
  if (r) a.z = r.z;
  return a;
}
