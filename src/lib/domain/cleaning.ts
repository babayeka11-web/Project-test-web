// Cleaning: packages, levels, size bands and the quick 3-step booking (client-safe).
// Port of PKG_TH / LEVEL_TH / sizesFor / cleanFrom / the line + total logic of the reference quickclean.js (Rev.11 / Rev.15 /
// Rev.20), cleanRate / SIZE_BANDS of sbp-core.js and PKG_INFO / METHOD_INFO of commerce.js.
// Rates come from a CleanRateTable that a SERVER page builds with getCleanRateTable() (pricebook.ts) and passes as a prop —
// nothing here embeds the Pricebook. cleaningQuote() follows the quotation rules exactly (quote.ts quoteTotals).
import { MIN_BILL, VOLUME_HINT } from './constants';
import { baht } from './format';
import { quoteTotals, rushLine, type QuoteLine, type QuoteTotals } from './quote';
import { bkkNow, dateTh, judge, SLOTS, type BkkNow, type Judgement, type SlotId } from './queue';
import type { Zone } from './travel';
import { TYPE_BY_ID, type AcTypeId } from './types';

export type CleanPkgId = 'Basic Clean' | 'Standard Care' | 'Corporate Control';
export type CleanLevel = 'C1' | 'C2';
export const CLEAN_PKG_IDS: readonly CleanPkgId[] = ['Basic Clean', 'Standard Care', 'Corporate Control'];
/** The packages the reference quick booking offers (Corporate Control is sold through contracts / the price centre). */
export const QUICK_PKGS: readonly CleanPkgId[] = ['Basic Clean', 'Standard Care'];

/** Package names in plain Thai first, the company's package name second. */
export const PKG_TH: Readonly<Record<CleanPkgId, { th: string; sub: string; code: 'P1' | 'P2' | 'P3' }>> = {
  'Basic Clean': { th: 'ล้างมาตรฐาน', sub: 'ใบรับมอบงาน · รับประกันงาน 30 วัน', code: 'P1' },
  'Standard Care': { th: 'ล้างพร้อมรายงานภาพ', sub: 'รายงานพร้อมภาพก่อน–หลัง · รับประกัน 45 วัน', code: 'P2' },
  'Corporate Control': { th: 'ล้างพร้อมทะเบียนทรัพย์สิน', sub: 'ทะเบียนทรัพย์สินรายเครื่อง · รับประกัน 60 วัน', code: 'P3' },
};

export const LEVEL_TH: Readonly<Record<CleanLevel, { th: string; sub: string }>> = {
  C1: { th: 'ล้างปกติ', sub: 'ล้างที่ตำแหน่งเดิม ไม่ปลดเครื่อง เหมาะกับการล้างตามรอบ' },
  C2: { th: 'ล้างใหญ่', sub: 'ปลดคอยล์เย็นลงล้าง ถอดใบพัดและถาดน้ำทิ้ง เหมาะเมื่อมีกลิ่นอับหรือไม่ได้ล้างนาน' },
};

/** What each package gives and who it suits (sales manual SBP-SAL-001, reference commerce.PKG_INFO). */
export const PKG_INFO: readonly { id: CleanPkgId; code: 'P1' | 'P2' | 'P3'; th: string; pitch: string; fit: string; gets: string[]; care: string }[] = [
  { id: 'Basic Clean', code: 'P1', th: 'ล้างมาตรฐาน', pitch: 'คุ้มค่า', fit: 'บ้าน คอนโด ร้านเล็ก ที่ต้องการล้างตามรอบ', gets: ['ใบรับมอบงาน / รายงานแบบย่อรายเครื่อง', 'ทดสอบการทำงาน น้ำทิ้ง และ Error Code หลังล้าง (T1)'], care: 'ไม่มี' },
  { id: 'Standard Care', code: 'P2', th: 'ล้างพร้อมรายงานภาพ', pitch: 'มีหลักฐาน วางแผนซ่อมได้', fit: 'สำนักงาน ร้านค้า คลินิก ร้านอาหาร ที่ต้องการเอกสารและภาพ', gets: ['Service Report พร้อมภาพ 2–4 ภาพต่อเครื่อง', 'วัดค่าก่อน–หลัง (T2): ลมกลับ ลมจ่าย ผลต่างอุณหภูมิ กระแส แรงดัน', 'ประเมินสภาพเครื่อง A–D + สรุปโครงการ'], care: 'Service Care 90 วัน' },
  { id: 'Corporate Control', code: 'P3', th: 'ล้างพร้อมทะเบียนทรัพย์สิน', pitch: 'บริหารทรัพย์สิน', fit: 'องค์กรหลายสาขา โรงงาน โรงแรม โรงพยาบาล', gets: ['ทะเบียนทรัพย์สิน รุ่น / หมายเลขเครื่อง รายเครื่อง', 'ดัชนีภาพ + ค่าตรวจวัดเชื่อมกับทะเบียน (T3)', 'จัดลำดับความสำคัญ แนวโน้ม ผู้รับผิดชอบ กำหนดปิดเคส'], care: 'Service Care Plus 90 วัน' },
];

/** Cleaning methods. C3 (cut-and-clean) has no standard web price — always surveyed first. */
export const METHOD_INFO: readonly { id: 'C1' | 'C2' | 'C3'; th: string; d: string }[] = [
  { id: 'C1', th: 'ล้างปกติ (C1)', d: 'ล้างที่ตำแหน่งเดิม ล้างจุดบริการและส่วนที่เข้าถึงได้ ไม่ปลดเครื่อง ไม่เปิดวงจรน้ำยา' },
  { id: 'C2', th: 'ล้างใหญ่ (C2)', d: 'ปลดคอยล์เย็นลงล้างโดยไม่ตัดท่อน้ำยา ถอดใบพัดโบลเวอร์และถาดน้ำทิ้งตามทะเบียนชิ้นส่วนที่ถอด (ไม่รวมมอเตอร์ แผงวงจร และการเปิดวงจรน้ำยา)' },
  { id: 'C3', th: 'ตัดล้าง (C3)', d: 'สำรวจก่อนเสมอ รวมทดสอบรั่ว Vacuum และ Commissioning ตามใบเสนอราคา ไม่มีราคามาตรฐานบนเว็บ' },
];

/** Size bands of the cleaning sheet: the wall-type range and the range of every other type. */
export type SizeBand = { id: 0 | 1 | 2 | 3; th: string; wall: string; other: string };
export const SIZE_BANDS: readonly SizeBand[] = [
  { id: 0, th: 'เล็ก', wall: '9,000-18,000', other: '<=24,000' },
  { id: 1, th: 'กลาง', wall: '19,000-24,000', other: '25,000-36,000' },
  { id: 2, th: 'ใหญ่', wall: '25,000-36,000', other: '37,000-48,000' },
  { id: 3, th: 'ใหญ่มาก', wall: '37,000-60,000', other: '49,000-60,000' },
];
/** Pricebook range label of a band for a type. */
export const bandRange = (type: AcTypeId, band: SizeBand): string => (type === 'wall' ? band.wall : band.other);
/** '9,000–18,000' · '≤ 24,000' */
export const sizeNum = (type: AcTypeId, band: SizeBand): string => bandRange(type, band).replace('<=', '≤ ').replace('-', '–');
/** '9,000–18,000 BTU' */
export const sizeTh = (type: AcTypeId, band: SizeBand): string => `${sizeNum(type, band)} BTU`;
/** Band index for a unit size in BTU (null above 60,000). */
export const bandOfBtu = (type: AcTypeId, btu: number): number | null => {
  const hi = (r: string) => Number(r.replace(/[^0-9-]/g, '').split('-').pop());
  const b = SIZE_BANDS.find(x => btu <= hi(bandRange(type, x)));
  return b ? b.id : null;
};

/* ---------- compact rate table (built on the server by pricebook.getCleanRateTable) ---------- */

export type CleanRateRow = {
  pkg: CleanPkgId;
  level: CleanLevel;
  type: AcTypeId;
  /** Pricebook range label, e.g. '9,000-18,000' or '<=24,000' */
  range: string;
  /** standard rate before VAT, rounded up to 100; null = assessed on site */
  ex: number | null;
  /** Pricebook line name, e.g. 'ล้างแอร์ติดผนัง 9,000-18,000 BTU' */
  name: string;
  warranty: string | null;
};
/** Serialisable cleaning rates for client calculators (typed rows only: wall / ceiling / cassette / floor / duct). */
export type CleanRateTable = { v: string; minBill: number; rows: CleanRateRow[] };

/** The Pricebook row for one package × level × type × size band (band 0 when sizeId is out of range). */
export function cleanRate(table: CleanRateTable, pkg: CleanPkgId, level: CleanLevel, type: AcTypeId, sizeId: number): CleanRateRow | undefined {
  const band = SIZE_BANDS[sizeId] || SIZE_BANDS[0];
  const rg = bandRange(type, band);
  return table.rows.find(r => r.pkg === pkg && r.level === level && r.type === type && r.range === rg);
}

/** Size bands that have a price for this type (any package / level in the table). */
export const sizesFor = (table: CleanRateTable, type: AcTypeId): SizeBand[] =>
  SIZE_BANDS.filter(b => table.rows.some(r => r.type === type && r.range === bandRange(type, b) && r.ex != null));

/** Lowest per-unit standard price of a package × level ("เริ่ม ฿…"), null when none. */
export function startAt(table: CleanRateTable, pkg: CleanPkgId, level: CleanLevel): number | null {
  const rs = table.rows.filter(r => r.pkg === pkg && r.level === level && r.ex != null).map(r => r.ex as number);
  return rs.length ? Math.min(...rs) : null;
}

/** Client-side twin of pricebook.cleanFrom(): lowest C1 price of the quick-booking packages in the table. */
export function cleanFromTable(table: CleanRateTable): number | null {
  const rs = table.rows.filter(r => r.level === 'C1' && QUICK_PKGS.includes(r.pkg) && r.ex != null).map(r => r.ex as number);
  return rs.length ? Math.min(...rs) : null;
}

/** Cart line for one row of the cleaning price table (reference price centre key C-<pkg>-<level>-<type>-<range>). */
export const cleanPriceLine = (r: Pick<CleanRateRow, 'pkg' | 'level' | 'type' | 'range' | 'ex'>): QuoteLine => ({
  kind: r.ex == null ? 'survey' : 'service',
  group: 'clean',
  key: `C-${r.pkg}-${r.level}-${r.type}-${r.range}`,
  name: `${LEVEL_TH[r.level].th} ${TYPE_BY_ID[r.type].th} ${r.range} BTU`,
  detail: r.pkg,
  unitEx: r.ex,
  qty: 1,
});

/** Cart line for an AHU / add-on / special-area cleaning row (no type) — key CX-<name>. Pass the row's sheet label `ty`:
 *  add-on rows ('งานเพิ่ม…', 'Access…') become kind 'addon' so the visit planner does not count them as units. */
export const cleanExtraLine = (r: { name: string; ex: number | null; ty?: string | null }): QuoteLine => ({
  kind: r.ex == null ? 'survey' : /^(งานเพิ่ม|Access)/.test(r.ty || '') ? 'addon' : 'service',
  group: 'clean',
  key: `CX-${r.name}`,
  name: r.name,
  unitEx: r.ex,
  qty: 1,
});

/* ---------- quick 3-step booking ---------- */

export type QuickType = 'wall' | 'ceiling' | 'cassette' | 'floor';
/** The types the quick booking offers, with where each is typical. */
export const QUICK_TYPES: readonly { id: QuickType; th: string; where: string }[] = [
  { id: 'wall', th: 'ติดผนัง', where: 'บ้าน คอนโด ห้องนอน' },
  { id: 'ceiling', th: 'แขวนใต้ฝ้า', where: 'ร้านค้า สำนักงาน' },
  { id: 'cassette', th: 'สี่ทิศทาง', where: 'คาเฟ่ ร้านอาหาร' },
  { id: 'floor', th: 'ตู้ตั้งพื้น', where: 'ห้องประชุม โถง' },
];
export const MAX_UNITS_PER_TYPE = 99;

export type CleanSelection = {
  /** units per type (0 = not chosen) */
  n: Partial<Record<QuickType, number>>;
  /** size band id per type (default 0) */
  size: Partial<Record<QuickType, number>>;
  level: CleanLevel;
  pkg: CleanPkgId;
};
/** The reference's starting state: one wall unit, small, ล้างปกติ, ล้างมาตรฐาน. */
export const defaultSelection = (): CleanSelection => ({ n: { wall: 1, ceiling: 0, cassette: 0, floor: 0 }, size: { wall: 0, ceiling: 0, cassette: 0, floor: 0 }, level: 'C1', pkg: 'Basic Clean' });

export type CleaningRow = {
  type: QuickType;
  th: string;
  qty: number;
  sizeId: number;
  sizeTh: string;
  rate: CleanRateRow | null;
  /** the priced cart line; null when this size has no standard rate ("ประเมินหน้างาน") */
  line: QuoteLine | null;
  /** qty × rate, null when not priced */
  amount: number | null;
};

export type CleaningQuote = {
  rows: CleaningRow[];
  /** lines for the cart: priced cleaning lines + the rush line when the date is a rush date */
  lines: QuoteLine[];
  totals: QuoteTotals;
  units: number;
  /** what the chosen date means (kind 'none' when no date) */
  when: Judgement;
  rush: boolean;
  /** "add N more units of <type> to reach the minimum and drop the travel fee" (only below the minimum in the core area) */
  fill: { type: QuickType; th: string; need: number } | null;
  /** units ≥ VOLUME_HINT → say special rates may apply */
  volumeHint: boolean;
  /** the area is beyond per-unit range → the team assesses it as a project */
  outOfArea: boolean;
};

/** Cart line key of one quick-booking row — the same scheme as the reference (QC-<pkg>-<level>-<type>-<sizeId>). */
export const quickKey = (pkg: CleanPkgId, level: CleanLevel, type: AcTypeId, sizeId: number): string => `QC-${pkg}-${level}-${type}-${sizeId}`;

/**
 * Selection → priced rows, cart lines and totals, exactly as the reference quick booking:
 * per type one line `${row.name} · ${ล้างปกติ|ล้างใหญ่} C1|C2`, qty = units; a rush line when the date is earlier than the
 * normal lead time; totals via quoteTotals (travel by zone, cleaning minimum, VAT on the total).
 */
export function cleaningQuote(
  sel: CleanSelection,
  table: CleanRateTable,
  zone: Pick<Zone, 'tier' | 'km' | 'fee'> | null | undefined,
  opts: { date?: string | null; now?: BkkNow } = {},
): CleaningQuote {
  const now = opts.now ?? bkkNow();
  const rows: CleaningRow[] = QUICK_TYPES.filter(t => (sel.n[t.id] || 0) > 0).map(t => {
    const qty = sel.n[t.id] || 0;
    const sizeId = sel.size[t.id] || 0;
    const band = SIZE_BANDS[sizeId] || SIZE_BANDS[0];
    const r = cleanRate(table, sel.pkg, sel.level, t.id, sizeId) || null;
    const line: QuoteLine | null =
      r && r.ex != null
        ? {
            kind: 'service',
            group: 'clean',
            src: 'qc',
            key: quickKey(sel.pkg, sel.level, t.id, sizeId),
            name: `${r.name} · ${LEVEL_TH[sel.level].th} ${sel.level}`,
            detail: `${PKG_TH[sel.pkg].th} (${sel.pkg}) · ${r.warranty || ''}`,
            unitEx: r.ex,
            qty,
          }
        : null;
    return { type: t.id, th: t.th, qty, sizeId, sizeTh: sizeTh(t.id, band), rate: r, line, amount: line ? (line.unitEx as number) * qty : null };
  });
  const when = judge(opts.date || '', rows.map(l => ({ t: l.type, qty: l.qty })), sel.level, now);
  const lines = rows.map(r => r.line).filter((l): l is QuoteLine => l != null);
  const rush = when.rush && lines.length > 0;
  if (rush) lines.push(rushLine());
  const totals = quoteTotals(lines, zone, table.minBill ?? MIN_BILL);
  const units = rows.reduce((n, l) => n + l.qty, 0);
  let fill: CleaningQuote['fill'] = null;
  if (totals.travelSmall && (!zone || zone.tier !== 'extended')) {
    const l0 = rows.find(l => l.line && (l.line.unitEx as number) > 0);
    const unit = l0?.line?.unitEx ?? 0;
    const need = unit > 0 ? Math.ceil(((table.minBill ?? MIN_BILL) - totals.cleanEx) / unit) : 0;
    if (l0 && need > 0) fill = { type: l0.type, th: l0.th, need };
  }
  return { rows, lines, totals, units, when, rush, fill, volumeHint: units >= VOLUME_HINT, outOfArea: !!zone && zone.tier === 'out' };
}

/** Plain-text summary for LINE / copy (reference quickclean summaryText). */
export function cleaningSummary(
  sel: CleanSelection,
  q: CleaningQuote,
  where: { zoneText?: string; date?: string; slot?: SlotId | '' } = {},
): string {
  const date = where.date || '';
  return [
    'ขอจองล้างแอร์ · SBP AirCare',
    ...q.rows.map(l => `• ${l.th} ${l.qty} เครื่อง (${l.sizeTh})`),
    `วิธีล้าง: ${LEVEL_TH[sel.level].th} ${sel.level} · ${PKG_TH[sel.pkg].th}`,
    `พื้นที่: ${where.zoneText || '-'}`,
    date ? `วันเข้างาน: ${dateTh(date)} (${date})${where.slot ? ' · ' + SLOTS[where.slot].th : ''}${q.when.rush ? ` · คิวด่วน +${baht(rushLine().unitEx as number)} ก่อน VAT (ถ้ามีคิวว่าง)` : ''}` : null,
    q.units ? `ยอดประมาณการ ${baht(q.totals.totalEx)} ก่อน VAT · รวม VAT 7% ${baht(q.totals.inc)}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

/** Type label for a cleaning row (falls back to the taxonomy). */
export const cleanTypeTh = (t: AcTypeId): string => QUICK_TYPES.find(x => x.id === t)?.th ?? TYPE_BY_ID[t].th;
