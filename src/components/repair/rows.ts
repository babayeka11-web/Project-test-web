// Repair price list model for /repair/: the Pricebook repair rows → serialisable rows → customer-facing groups.
// Pure TS, client-safe (no Pricebook import): the server page passes getRepairItems() through toListRows().

import type { RepairRow } from './diag';

/** One Pricebook repair line as the client needs it (small, serialisable). */
export type ListRow = {
  /** stable id inside the list */
  id: string;
  /** Pricebook sheet category (kept for diagnosis-fee matching) */
  cat: string | null;
  name: string;
  unit: string | null;
  /** standard rate before VAT; null = ประเมินหน้างาน */
  ex: number | null;
  warranty: string | null;
  inc: string | null;
  exc: string | null;
  /** price withheld on purpose: out-of-hours work is "มีค่าใช้จ่ายเพิ่มเติม", never a number (ARCHITECTURE §6.10) */
  extra: boolean;
  /** travel / Mobilization row: the fee follows the service-area rule (§6.5) and the quote adds it itself — no flat number */
  travel: boolean;
};

type Source = {
  cat: string | null;
  name: string;
  unit: string | null;
  ex: number | null;
  warranty: string | null;
  inc: string | null;
  exc: string | null;
};

const OUT_OF_HOURS = /เงื่อนไขเวลา|กลางคืน|วันหยุด/;
// the same rows /prices/ shows as "คิดตามระยะทาง" (components/prices/build.ts TRAVEL_ROW)
const TRAVEL_ROW = /ค่าเดินทาง|Mobilization/;

/** Pricebook repair items → list rows. Out-of-hours work loses its number and becomes an assessed line; the travel row
 *  loses its flat ฿ and points to the service-area rule instead. */
export function toListRows(items: readonly Source[]): ListRow[] {
  return items.map((r, i) => {
    const extra = r.cat === 'เงื่อนไขเวลา' || OUT_OF_HOURS.test(r.name);
    const travel = !extra && (r.cat === 'Mobilization' || TRAVEL_ROW.test(r.name));
    return {
      id: `r${i}`,
      cat: r.cat,
      name: r.name,
      unit: r.unit,
      ex: extra || travel ? null : r.ex,
      warranty: r.warranty,
      inc: r.inc,
      exc: r.exc,
      extra,
      travel,
    };
  });
}

/** The subset the symptom checker needs (diagnosis fees and the repair lines linked to each likely point). */
export const toCheckerRows = (rows: readonly ListRow[]): RepairRow[] =>
  rows.map(r => ({ cat: r.cat, name: r.name, unit: r.unit, ex: r.ex }));

/* ---------- groups ---------- */

export type GroupId = 'diag' | 'drain' | 'ref' | 'elec' | 'motor' | 'ahu' | 'access';

export type Group = { id: GroupId; th: string; sub: string };

/** Order = what home and condo customers meet first; building systems and site conditions last. */
export const GROUPS: readonly Group[] = [
  { id: 'diag', th: 'ตรวจวินิจฉัยและค่าแรง', sub: 'ตรวจหาสาเหตุ แจ้งราคาให้อนุมัติก่อนลงมือ · ค่าแรงเปลี่ยนอะไหล่ที่ลูกค้าจัดหาเอง' },
  { id: 'drain', th: 'น้ำหยด ท่อน้ำทิ้ง ปั๊มน้ำทิ้ง', sub: 'แก้ท่อตัน ข้อต่อแตก แก้ความลาดเอียง ปั๊มน้ำทิ้ง ลูกลอย' },
  { id: 'ref', th: 'น้ำยาแอร์ รอยรั่ว คอมเพรสเซอร์', sub: 'ตรวจรั่วด้วยไนโตรเจน ซ่อมรั่ว ทำสุญญากาศ เติมน้ำยา วาล์ว คอมเพรสเซอร์ แผงคอยล์' },
  { id: 'elec', th: 'ไฟฟ้า บอร์ด เซ็นเซอร์ รีโมต', sub: 'คาปาซิเตอร์ แมกเนติก ฟิวส์ รีเลย์ เซ็นเซอร์ บอร์ดควบคุม รีโมตแบบมีสาย' },
  { id: 'motor', th: 'มอเตอร์ พัดลม บานสวิง เสียงดัง', sub: 'มอเตอร์คอยล์เย็นและคอยล์ร้อน ใบพัด แบริ่ง ยางรอง บานสวิง' },
  { id: 'ahu', th: 'AHU · FCU · ระบบน้ำเย็น', sub: 'สำหรับอาคารและโรงงาน: สายพาน แผ่นกรอง วาล์วน้ำเย็น VFD' },
  { id: 'access', th: 'งานสูง เปิดฝ้า และเงื่อนไขหน้างาน', sub: 'ค่าใช้จ่ายเพิ่มตามหน้างานที่ทีมแจ้งในใบเสนอราคา' },
];

/** Which group a row belongs to (first rule that matches; a category such as "AHU/Drainage" sits with AHU). */
export function groupOf(cat: string | null): GroupId {
  const c = cat || '';
  if (/ตรวจวินิจฉัย|^Labor|Other Repair/.test(c)) return 'diag';
  if (/AHU|FCU|Chilled|VFD|Filter|BMS/.test(c)) return 'ahu';
  if (/น้ำทิ้ง|Drainage/.test(c)) return 'drain';
  if (/Refrigerant|Compressor|Coil/.test(c)) return 'ref';
  if (/Motor|Mechanical/.test(c)) return 'motor';
  if (/ไฟฟ้า|Electrical|PCB|Control|Sensor/.test(c)) return 'elec';
  return 'access';
}

export type GroupedRows = { group: Group; rows: ListRow[] };

/** Rows grouped for display, empty groups dropped. */
export function groupRows(rows: readonly ListRow[]): GroupedRows[] {
  return GROUPS.map(group => ({ group, rows: rows.filter(r => groupOf(r.cat) === group.id) })).filter(g => g.rows.length > 0);
}

/* ---------- search ---------- */

/** Query without spaces, slashes, commas and dashes, lower case — "r32 เติม" and "R32เติม" find the same rows. */
const squash = (s: string) => s.toLowerCase().replace(/[\s,/\-–—.]+/g, '');

/** Every word of the query must appear in the row's name, unit, category group or scope text. */
export function matchRow(row: ListRow, query: string): boolean {
  const words = query.toLowerCase().split(/\s+/).map(squash).filter(Boolean);
  if (!words.length) return true;
  const hay = squash([row.name, row.unit, row.inc, groupName(row), row.cat].filter(Boolean).join(' '));
  return words.every(w => hay.includes(w));
}

const groupName = (row: ListRow) => GROUPS.find(g => g.id === groupOf(row.cat))?.th ?? '';
