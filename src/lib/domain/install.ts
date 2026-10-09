// Installation packages, add-ons, material comparison and itemised cost (client-safe, no data).
// Ports of INS_LEVELS / PIPE_SET (sbp-core.js), MAT_ROWS / materialMatrix and the product-drawer line builders (commerce.js),
// packageParts / optionNote / breakdown (costs.js). The Pricebook-backed lookups (installOptions, addonsFor, materialMatrix,
// pipeBundle for a type × BTU) live in pricebook.ts; a server page computes them and passes the results as props.
// Web rule: Standard / Premium only; price includes the first 4 m of pipe; copper is always "O-TWO 0.70 มม.".
import { btuFmt, VAT } from './format';
import type { QuoteLine } from './quote';
import { TYPE_BY_ID, type AcTypeId } from './types';

/** One line of the installation / materials sheet (after the web rules are applied). */
export type InstallItem = {
  code: string;
  /** category with its sheet number, e.g. '13 งานรื้อ ย้าย และขนย้าย' */
  cat: string | null;
  name: string;
  unit: string | null;
  /** before VAT; service lines (INS-*) rounded up to 100, materials exact; null = assessed on site */
  ex: number | null;
  inc: string | null;
  exc: string | null;
  warranty: string | null;
  /** survey rule from the sheet ('NO' / 'YES' / …) */
  survey: string | null;
  /** how a web-decided rate was set (rates.ts): m · c · k */
  decided?: 'm' | 'c' | 'k';
};

export type InstallLevel = 'STANDARD' | 'PREMIUM';
export const INS_LEVELS: readonly { key: InstallLevel; th: string; note: string }[] = [
  { key: 'STANDARD', th: 'มาตรฐาน', note: 'แนะนำ · รับประกันงานติดตั้งตามเงื่อนไข 1–3 ปี' },
  { key: 'PREMIUM', th: 'พรีเมียม', note: 'เพิ่ม Support และงานเก็บรายละเอียด' },
];
/** Warranty of installation work (ARCHITECTURE.md §6.7). */
export const INSTALL_WARRANTY = { boughtHere: 'รับประกันงานติดตั้ง 3 ปี (ซื้อเครื่องจากบริษัท)', ownUnit: 'รับประกันงานติดตั้ง 1 ปี (เครื่องของลูกค้า)' } as const;
export const INCLUDED_PIPE_M = 4;

export type InstallOption = { key: InstallLevel; th: string; note: string; item: InstallItem };

/** Excess pipe bundle per metre by unit size (largest set for anything above). */
export const PIPE_SET: readonly (readonly [number, string])[] = [
  [12000, 'PIP-PKG-1438'], [18000, 'PIP-PKG-1412'], [24000, 'PIP-PKG-1458'], [36000, 'PIP-PKG-3858'], [48000, 'PIP-PKG-3834'], [60000, 'PIP-PKG-3878'],
];
export const pipeCodeFor = (btu: number): string => (PIPE_SET.find(([m]) => btu <= m) || PIPE_SET[PIPE_SET.length - 1])[1];
/** Removal code per type. */
export const REMOVAL_CODE: Readonly<Record<AcTypeId, string>> = { wall: 'REM-W', ceiling: 'REM-C', cassette: 'REM-K', floor: 'REM-FS', duct: 'REM-DUCT' };

/** One add-on choice of the product page. choices.length > 1 → pick one (e.g. cable size); qty: per metre, per piece, or a
 *  "flag" = no fixed price, the team assesses it on site. */
export type AddonOption = { choices: InstallItem[]; qty: 'm' | 'pc' | 'flag'; note?: string };
export type AddonGroup = { group: string; items: AddonOption[] };

/* ---------- material comparison (Standard vs Premium) ---------- */

export const MAT_ROWS: readonly { id: string; th: string; re: RegExp }[] = [
  { id: 'incl', th: 'ระยะที่รวมในราคา', re: /^รวมท่อ/ },
  { id: 'pipe', th: 'ท่อน้ำยาทองแดง', re: /ท่อน้ำยา|ท่อทองแดง|Type L|K Copper|ทองแดง/ },
  { id: 'ins', th: 'ฉนวนหุ้มท่อ', re: /ฉนวน|Aeroflex|Closed-cell/ },
  { id: 'rail', th: 'รางครอบท่อ', re: /ราง/ },
  { id: 'cable', th: 'สายไฟ', re: /สายไฟ|Yazaki|มอก\./ },
  { id: 'drain', th: 'ท่อน้ำทิ้ง', re: /ท่อน้ำทิ้ง|SCG|PVC/ },
  { id: 'brk', th: 'เบรกเกอร์', re: /Breaker|เบรกเกอร์/ },
  { id: 'mount', th: 'ขาแขวน · กันสั่น', re: /ขาแขวน|ยางรอง|Support|Anti-vibration|กันสั่น/ },
  { id: 'test', th: 'ทดสอบระบบ', re: /Vacuum|Nitrogen|Leak|Torque|Flare|Test Run|ตรวจรอยต่อ|Function/ },
  { id: 'doc', th: 'เอกสาร · ภาพ · ติดตามผล', re: /Photo|ภาพ|ใบรับมอบ|บันทึก|ติดตาม|Commissioning/ },
];

export type MaterialColumn = { key: InstallLevel; th: string; item: InstallItem; cell: Record<string, string[]> };

/** Parse each package's "รวม" text into comparable rows (every clause goes to ONE row: the first that matches, else the row
 *  of the clause before it). */
export function materialColumns(opts: readonly InstallOption[]): MaterialColumn[] {
  return opts.map(o => {
    const parts = (o.item.inc || '').split(/;\s*/).map(x => x.trim()).filter(Boolean);
    const cell: Record<string, string[]> = {};
    let lastRow: (typeof MAT_ROWS)[number] | null = null;
    parts.forEach(pt => {
      if (/^รวมท่อ/.test(pt)) {
        (cell.incl = cell.incl || []).push(pt.replace(/^รวม/, '').trim());
        return;
      }
      if (/วัสดุ Standard/.test(pt)) return;
      pt.split(/,\s*|\s+และ(?=\S)/).map(x => x.trim()).filter(Boolean).forEach(cl => {
        const r = MAT_ROWS.slice(1).find(x => x.re.test(cl)) || lastRow;
        if (!r) return;
        lastRow = r;
        (cell[r.id] = cell[r.id] || []).push(cl);
      });
    });
    if (parts.some(pt => /วัสดุ Standard/.test(pt))) {
      MAT_ROWS.slice(1, 8).forEach(r => {
        cell[r.id] = cell[r.id] ? ['เหมือนแพ็กเกจมาตรฐาน', ...cell[r.id]] : ['เหมือนแพ็กเกจมาตรฐาน'];
      });
    }
    return { key: o.key, th: o.th, item: o.item, cell };
  });
}

/* ---------- itemised cost (costs.js) ---------- */

/** What the package's own "รวม" text lists, one short line each. */
export function packageParts(item: Pick<InstallItem, 'inc'> | null | undefined): string[] {
  if (!item || !item.inc) return [];
  return item.inc.split(/;\s*/).map(x => x.trim()).filter(x => x && !/ใช้เมื่อระบุใน QTN|ไม่รวมอัตโนมัติ/.test(x));
}

/** Notes that keep the customer from paying twice for what the package already has. */
export function optionNote(code: string): string {
  if (/^ELE-NANO-RCBO/.test(code)) return 'แพ็กเกจติดตั้งรวมเบรกเกอร์ 1 ตัวแล้ว — ใส่เพิ่มเมื่อต้องการวงจรใหม่อีกวงจร';
  if (/^ELE-MAIN-/.test(code)) return 'สายไฟระหว่างเครื่องรวมในแพ็กเกจแล้ว — รายการนี้คือเมนไฟจากตู้ไฟ (DB) ถึงจุดติดตั้ง';
  if (/^MAT-SCG-DRAIN-/.test(code)) return 'ท่อน้ำทิ้งตามแนวท่อน้ำยารวมในแพ็กเกจ / ชุดเหมาแล้ว — ใส่เฉพาะเส้นทางที่แยกไปจุดทิ้งอื่น';
  if (/^PIP-PKG-/.test(code)) return 'แพ็กเกจรวม 4 เมตรแรกแล้ว — ใส่เฉพาะส่วนที่เกิน';
  return '';
}

/** One per-metre excess bundle against the same metre bought line by line (pricebook.pipeBundle builds it). */
export type PipeBundle = { item: InstallItem; parts: { th: string; name: string; ex: number; qty: number }[] | null; sum?: number };

export type BreakdownRow = { name: string; unit: string; ex: number | null; qty: number; amount: number | null; note: string };
export type Breakdown = { groups: { th: string; rows: BreakdownRow[] }[]; ex: number; vat: number; inc: number; assess: number };

/** Lines of one product page → grouped, itemised breakdown before VAT (machine · package · options · assessed on site). */
export function breakdown(lines: readonly Pick<QuoteLine, 'group' | 'key' | 'name' | 'unit' | 'unitEx' | 'qty'>[]): Breakdown {
  const g: Record<'product' | 'install' | 'addon' | 'survey', { th: string; rows: BreakdownRow[] }> = {
    product: { th: 'เครื่องปรับอากาศ', rows: [] },
    install: { th: 'แพ็กเกจติดตั้ง', rows: [] },
    addon: { th: 'ตัวเลือกเพิ่ม (วัสดุและงาน)', rows: [] },
    survey: { th: 'ประเมินหน้างาน (แจ้งราคาก่อนทำ)', rows: [] },
  };
  lines.forEach(l => {
    const k = l.unitEx == null ? 'survey' : l.group === 'product' || l.group === 'install' || l.group === 'addon' || l.group === 'survey' ? l.group : 'addon';
    const code = (l.key || '').replace(/^[A-Z]+-/, '');
    g[k].rows.push({ name: l.name, unit: l.unit || '', ex: l.unitEx, qty: l.qty, amount: l.unitEx == null ? null : l.unitEx * l.qty, note: optionNote(code) });
  });
  const ex = lines.reduce((n, l) => n + (l.unitEx == null ? 0 : l.unitEx * l.qty), 0);
  const vat = Math.round(ex * VAT);
  return { groups: Object.values(g).filter(x => x.rows.length), ex, vat, inc: ex + vat, assess: g.survey.rows.length };
}

/* ---------- cart lines of a product page (commerce.productDetail) ---------- */

export type ProductPick = {
  brandName: string;
  type: AcTypeId;
  sku: string;
  btu: number;
  /** machine price before VAT (null for a brand without Pricebook prices — then no product line is made) */
  price: number | null;
  /** chosen installation package, or null for "ไม่ติดตั้ง / ซื้อเครื่องอย่างเดียว" */
  install: InstallOption | null;
  /** chosen add-ons: the item and its quantity per unit (m / pc); flag = assessed on site */
  addons: { item: InstallItem; qty: number; flag?: boolean }[];
  /** number of machines */
  qty: number;
};

/** Cart lines for a product + package + add-ons, the same keys / names as the reference (P- · I- · A- · S-). */
export function productLines(p: ProductPick): QuoteLine[] {
  const L: QuoteLine[] = [];
  if (p.price != null) {
    L.push({ kind: 'product', group: 'product', key: `P-${p.sku}`, name: `${p.brandName} ${p.sku}`, detail: `${TYPE_BY_ID[p.type].th} ${btuFmt(p.btu)}`, unitEx: p.price, qty: p.qty, unit: 'เครื่อง' });
  }
  if (p.install) {
    L.push({ kind: 'service', group: 'install', key: `I-${p.install.item.code}`, name: p.install.item.name, detail: `สำหรับ ${p.sku}`, unitEx: p.install.item.ex, qty: p.qty, unit: 'เครื่อง' });
  }
  p.addons.forEach(a => {
    if (a.flag || a.item.ex == null) {
      L.push({ kind: 'survey', group: 'addon', key: `S-${a.item.code}`, name: a.item.name, detail: `สำหรับ ${p.sku}`, unitEx: null, qty: 1 });
    } else if (a.qty > 0) {
      L.push({ kind: 'addon', group: 'addon', key: `A-${a.item.code}`, name: a.item.name, detail: `${a.qty} ${a.item.unit} × ${p.qty} เครื่อง`, unitEx: a.item.ex * a.qty, qty: p.qty });
    }
  });
  return L;
}

/** Line of one service-price row (price centre): priced → service / addon line, unpriced → survey request. */
export function serviceLine(o: { key: string; group: QuoteLine['group']; name: string; ex: number | null; detail?: string; unit?: string | null; addon?: boolean }): QuoteLine {
  return {
    kind: o.ex == null ? 'survey' : o.addon ? 'addon' : 'service',
    group: o.group,
    key: o.key,
    name: o.name,
    detail: o.detail,
    unitEx: o.ex,
    qty: 1,
    unit: o.unit ?? undefined,
  };
}

/* ---------- price-centre rows (reference commerce.mountPriceCenter) ---------- */

/** Sheet-category prefixes of each price-centre tab (category text starts with its sheet number). */
export const PRICE_GROUPS = {
  install: ['01', '02', '03', '04'],
  move: ['13', '11', '14', '16', '12', '17'],
  materials: ['06', '07', '08', '09', '10'],
  project: ['05', '15'],
} as const;
/** Items whose category starts with one of the prefixes (Pricebook order). */
export const inCategories = <I extends Pick<InstallItem, 'cat'>>(items: readonly I[], prefixes: readonly string[]): I[] =>
  items.filter(i => prefixes.some(p => (i.cat || '').startsWith(p)));
/** '13 งานรื้อ ย้าย และขนย้าย' → 'งานรื้อ ย้าย และขนย้าย' */
export const catTitle = (cat: string | null): string => (cat || '').replace(/^\d+\s*/, '');

/** Cart line for an installation-sheet item: INS-* → install service (or survey request), anything else → add-on. */
export function installItemLine(i: Pick<InstallItem, 'code' | 'name' | 'ex' | 'unit'>): QuoteLine {
  if (/^INS-/.test(i.code)) {
    return i.ex == null
      ? { kind: 'survey', group: 'install', key: `S-${i.code}`, name: i.name, unitEx: null, qty: 1 }
      : { kind: 'service', group: 'install', key: `I-${i.code}`, name: i.name, unitEx: i.ex, qty: 1, unit: i.unit ?? undefined };
  }
  return { kind: i.ex == null ? 'survey' : 'addon', group: 'addon', key: `A-${i.code}`, name: i.name, unitEx: i.ex, qty: 1, unit: i.unit ?? undefined };
}

/** Cart line for a repair / diagnosis row (no standard rate → survey request). */
export const repairLine = (r: { name: string; ex: number | null; unit?: string | null }): QuoteLine => ({
  kind: r.ex == null ? 'survey' : 'service',
  group: 'repair',
  key: `R-${r.name}`,
  name: r.name,
  unitEx: r.ex,
  qty: 1,
  unit: r.unit ?? undefined,
});
