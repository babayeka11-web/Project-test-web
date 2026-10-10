// Build-time only (imports the Pricebook): turns the Pricebook lines into compact PriceRow props for <PriceCenter>.
// NEVER import this file from a client component.
import { CLEAN_PKG_IDS, type CleanPkgId } from '@/lib/domain/cleaning';
import { isVRF } from '@/lib/domain/content';
import { catTitle, inCategories, PRICE_GROUPS } from '@/lib/domain/install';
import { getCleanRates, getInstallItems, getRepairItems } from '@/lib/domain/pricebook';
import { DECIDED } from '@/lib/domain/rates';
import type { PriceData, PriceRow, PriceTabId } from './price-data';

/* ---------- string pool ---------- */

function makePool() {
  const pool: string[] = [];
  const at = new Map<string, number>();
  const put = (s: string | null | undefined): number | undefined => {
    const t = (s ?? '').trim();
    if (!t) return undefined;
    let i = at.get(t);
    if (i === undefined) {
      i = pool.push(t) - 1;
      at.set(t, i);
    }
    return i;
  };
  return { pool, put };
}

/* ---------- rows that must never show a number ---------- */

// Out-of-hours work: ARCHITECTURE §6.10 — "มีค่าใช้จ่ายเพิ่มเติม", never a figure.
const OUT_OF_HOURS = /นอกเวลา|วันหยุด|กลางคืน|วันอาทิตย์/;
// Travel: §6.5 — the travel fee follows the service-area rule (rule card + /area/), not a flat Pricebook line.
const TRAVEL_ROW = /ค่าเดินทาง|Mobilization/;
const unpriced = (name: string): { ex: null; fb: string } | null =>
  OUT_OF_HOURS.test(name) ? { ex: null, fb: 'มีค่าใช้จ่ายเพิ่มเติม' } : TRAVEL_ROW.test(name) ? { ex: null, fb: 'คิดตามระยะทาง' } : null;

/* ---------- cleaning ---------- */

const TYPED_GROUP: Record<string, string> = {
  ติดผนัง: 'แอร์ติดผนัง',
  แขวนใต้ฝ้า: 'แอร์แขวนใต้ฝ้า',
  สี่ทิศทาง: 'แอร์สี่ทิศทาง',
  'ตั้งพื้น/ตั้งตู้': 'แอร์ตู้ตั้งพื้น',
  'ซ่อนในฝ้า/ต่อท่อลม': 'แอร์ซ่อนในฝ้า · ต่อท่อลม',
};
const EXTRA_GROUP: Record<string, string> = {
  AHU: 'ล้าง AHU (เครื่องใหญ่ในอาคาร)',
  ล้างเฉพาะส่วน: 'ล้างเฉพาะส่วน',
  งานเฉพาะพื้นที่: 'งานเฉพาะพื้นที่',
  งานเพิ่ม: 'งานเพิ่มต่อเครื่อง',
  'Access/Risk': 'งานสูงและการเข้าถึง',
  เงื่อนไขเวลา: 'นอกเวลา · งานด่วน',
  พื้นที่ควบคุม: 'พื้นที่ควบคุม',
  Mobilization: 'ค่าเดินทางต่างจังหวัด',
};

function cleanRows(put: (s: string | null | undefined) => number | undefined): PriceRow[] {
  const rates = getCleanRates();
  type R = (typeof rates)[number];
  const rows: PriceRow[] = [];

  // typed rows: one row per package × type × size, with the ล้างปกติ and ล้างใหญ่ prices side by side
  const typed = new Map<string, { c1?: R; c2?: R }>();
  for (const r of rates) {
    if (!r.type) continue;
    const key = `${r.pkg}|${r.type}|${r.range}`;
    const e = typed.get(key) ?? {};
    if (r.level === 'C1') e.c1 = r;
    else e.c2 = r;
    typed.set(key, e);
  }
  for (const [key, { c1, c2 }] of typed) {
    const base = (c1 ?? c2) as R;
    const common = {
      id: `c|${key}`,
      k: 'c' as const,
      tab: 'clean' as const,
      g: TYPED_GROUP[base.ty ?? ''] ?? base.ty ?? 'ล้างแอร์',
      n: base.name,
      u: base.unit,
      w: put(base.warranty),
      pkg: base.pkg,
      ty: base.type as NonNullable<R['type']>,
      rg: base.range ?? '',
    };
    if (c1 && c2) rows.push({ ...common, pair: 1, ex: c1.ex, ex2: c2.ex, inc: put(c1.inc), exc: put(c1.exc), inc2: put(c2.inc), exc2: put(c2.exc) });
    else rows.push({ ...common, lv: base.level, ex: base.ex, inc: put(base.inc), exc: put(base.exc) });
  }

  // AHU / partial / add-on rows: shown once when every package has the same prices, otherwise per package
  const extras = rates.filter(r => !r.type);
  const byName = new Map<string, R[]>();
  for (const r of extras) {
    const key = `${r.ty}|${r.name}`;
    byName.set(key, [...(byName.get(key) ?? []), r]);
  }
  const sig = (list: R[], pkg: CleanPkgId) =>
    list
      .filter(r => r.pkg === pkg)
      .sort((a, b) => a.level.localeCompare(b.level))
      .map(r => `${r.level}:${r.ex}`)
      .join(',');
  for (const list of byName.values()) {
    const same = CLEAN_PKG_IDS.every(p => sig(list, p) === sig(list, CLEAN_PKG_IDS[0]));
    for (const pkg of same ? [CLEAN_PKG_IDS[0]] : CLEAN_PKG_IDS) {
      const c1 = list.find(r => r.pkg === pkg && r.level === 'C1');
      const c2 = list.find(r => r.pkg === pkg && r.level === 'C2');
      const base = (c1 ?? c2) as R | undefined;
      if (!base) continue;
      const mask = unpriced(base.name);
      const price = (r?: R) => (mask ? null : r?.ex ?? null);
      const common = {
        k: 'x' as const,
        tab: 'clean' as const,
        g: EXTRA_GROUP[base.ty ?? ''] ?? base.ty ?? 'งานเพิ่ม',
        n: base.name,
        u: base.unit,
        fb: mask?.fb,
        w: put(base.warranty),
        pkg: same ? undefined : pkg,
        sh: base.ty ?? '',
      };
      const idBase = `x|${same ? '' : pkg}|${base.ty}|${base.name}`;
      if (c1 && c2 && c1.ex === c2.ex) rows.push({ ...common, id: `${idBase}|both`, lv: 'both', ex: price(c1), inc: put(c1.inc), exc: put(c1.exc) });
      else if (c1 && c2)
        rows.push({ ...common, id: `${idBase}|pair`, pair: 1, ex: price(c1), ex2: price(c2), inc: put(c1.inc), exc: put(c1.exc), inc2: put(c2.inc), exc2: put(c2.exc) });
      else rows.push({ ...common, id: `${idBase}|${base.level}`, lv: base.level, ex: price(base), inc: put(base.inc), exc: put(base.exc) });
    }
  }
  return rows;
}

/* ---------- installation sheet ---------- */

function installRows(put: (s: string | null | undefined) => number | undefined): PriceRow[] {
  const items = getInstallItems();
  const out: PriceRow[] = [];
  const tabs: [PriceTabId, readonly string[]][] = [
    ['install', PRICE_GROUPS.install],
    ['materials', PRICE_GROUPS.materials],
    ['move', PRICE_GROUPS.move],
    ['other', PRICE_GROUPS.project],
  ];
  for (const [tab, prefixes] of tabs) {
    for (const i of inCategories(items, prefixes)) {
      const mask = unpriced(i.name);
      const vrf = isVRF(i.name);
      out.push({
        id: `i|${i.code}`,
        k: 'i',
        tab,
        g: catTitle(i.cat),
        n: i.name,
        u: i.unit,
        ex: vrf || mask ? null : i.ex,
        fb: mask?.fb,
        w: put(i.warranty),
        inc: put(i.inc),
        exc: put(i.exc),
        dec: i.decided ? DECIDED[i.code]?.how ?? (i.decided as 'm' | 'c' | 'k') : undefined,
        vrf: vrf ? 1 : undefined,
        code: i.code,
      });
    }
  }
  return out;
}

/* ---------- repair ---------- */

// Many sheet categories → a handful of headings a customer understands (first match wins; list order = display order).
const REPAIR_GROUPS: [RegExp, string][] = [
  [/^ตรวจวินิจฉัย/, 'ค่าตรวจวินิจฉัย'],
  [/^(ระบบน้ำทิ้ง|AHU\/Drainage)/, 'ระบบน้ำทิ้ง'],
  [/^(Labor|Access|เงื่อนไข|Mobilization|Other)/, 'ค่าแรง · เงื่อนไข · งานอื่น'],
  [/^Motor/, 'มอเตอร์และพัดลม'],
  [/^(Refrigerant|Compressor)/, 'น้ำยาและคอมเพรสเซอร์'],
  [/^(Coil|Filter)/, 'คอยล์และแผ่นกรอง'],
  [/^(AHU|FCU|VFD|Chilled)/, 'AHU · FCU และระบบน้ำเย็น'],
  [/./, 'ไฟฟ้าและแผงควบคุม'],
];
const REPAIR_ORDER = [
  'ค่าตรวจวินิจฉัย',
  'ระบบน้ำทิ้ง',
  'ไฟฟ้าและแผงควบคุม',
  'มอเตอร์และพัดลม',
  'น้ำยาและคอมเพรสเซอร์',
  'คอยล์และแผ่นกรอง',
  'AHU · FCU และระบบน้ำเย็น',
  'ค่าแรง · เงื่อนไข · งานอื่น',
];

function repairRows(put: (s: string | null | undefined) => number | undefined): PriceRow[] {
  const out: PriceRow[] = getRepairItems().map(r => {
    const g = REPAIR_GROUPS.find(([re]) => re.test(r.cat ?? ''))?.[1] ?? 'ไฟฟ้าและแผงควบคุม';
    const mask = unpriced(r.name);
    const vrf = isVRF(r.name);
    return {
      id: `r|${r.name}`,
      k: 'r' as const,
      tab: 'repair' as const,
      g,
      n: r.name,
      u: r.unit,
      ex: vrf || mask ? null : r.ex,
      fb: mask?.fb,
      w: put(r.warranty),
      inc: put(r.inc),
      exc: put(r.exc),
      vrf: vrf ? 1 : undefined,
    };
  });
  // stable sort by display order of the group
  return out
    .map((r, i) => ({ r, i }))
    .sort((a, b) => REPAIR_ORDER.indexOf(a.r.g) - REPAIR_ORDER.indexOf(b.r.g) || a.i - b.i)
    .map(x => x.r);
}

/** All price-centre rows + the string pool. Call from a server component only. */
export function buildPriceData(): PriceData {
  const { pool, put } = makePool();
  const rows = [...cleanRows(put), ...installRows(put), ...repairRows(put)];
  // drop undefined keys so the serialised props stay small
  return { rows: rows.map(r => Object.fromEntries(Object.entries(r).filter(([, v]) => v !== undefined)) as PriceRow), pool };
}
