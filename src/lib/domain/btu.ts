// BTU sizing helpers (client-safe). Rules of thumb for a first estimate — the survey confirms the real load; pages label the
// result "ประมาณการ" and never promise a temperature.
//   · recommendBtu: the reference sbp-core.js quick rule (area × BTU/m² by sun exposure × use × ceiling height + people)
//   · btuBreakdown / needBtu / recommendUnits: the richer room model of the reference studio-model.js (base by room use,
//     sun & glass, roof, extra people, extra appliances), with a subset of its room library as ROOM_USES
import type { AcTypeId } from './types';

/* ---------- quick rule (sbp-core) ---------- */

export type BtuInput = { w: number; d: number; h?: number; sun?: 0 | 1 | 2; people?: number; use?: 'home' | 'office' | 'shop' };
export const BTU_SIZES: readonly number[] = [9000, 12000, 15000, 18000, 24000, 30000, 36000, 48000, 60000];

/** → { area m², btu (rounded to 100), pick (smallest standard size ≥ btu, max 60,000) } */
export function recommendBtu({ w, d, h = 2.7, sun = 1, people = 2, use = 'home' }: BtuInput): { area: number; btu: number; pick: number } {
  const area = w * d;
  const perM2 = [700, 750, 820][sun];
  const useF = { home: 1, office: 1.06, shop: 1.15 }[use] || 1;
  const btu = area * perM2 * useF * Math.max(1, h / 2.7) + Math.max(0, people - 2) * 600;
  const pick = BTU_SIZES.find(s => s >= btu) || BTU_SIZES[BTU_SIZES.length - 1];
  return { area, btu: Math.round(btu / 100) * 100, pick };
}

/* ---------- room model (studio-model) ---------- */

/** A room use: default size and occupancy, BTU per m² for this use (incl. its usual occupancy), suitable types. */
export type RoomUse = {
  id: string;
  g: 'home' | 'office' | 'retail' | 'service' | 'school' | 'hospital' | 'ind';
  th: string;
  w: number;
  d: number;
  h: number;
  people: number;
  /** appliances / machines, W */
  equip: number;
  /** default sun exposure 0..2 */
  sun: 0 | 1 | 2;
  perM2: number;
  types: AcTypeId[];
  closed?: boolean;
  /** equipment room: base + equipment heat + 20 % only */
  critical?: boolean;
};

/** Subset of the reference room library (same figures as studio-model SCENES). */
export const ROOM_USES: readonly RoomUse[] = [
  { id: 'bedroom', g: 'home', th: 'ห้องนอน', w: 4, d: 3.5, h: 2.6, people: 2, equip: 150, sun: 1, perM2: 750, types: ['wall'] },
  { id: 'master', g: 'home', th: 'ห้องนอนมาสเตอร์', w: 5.5, d: 4.5, h: 2.8, people: 2, equip: 300, sun: 1, perM2: 750, types: ['wall', 'ceiling', 'duct'] },
  { id: 'living', g: 'home', th: 'ห้องนั่งเล่น', w: 6.5, d: 5, h: 2.8, people: 4, equip: 450, sun: 2, perM2: 800, types: ['wall', 'ceiling', 'cassette', 'floor'] },
  { id: 'kitchen', g: 'home', th: 'ห้องครัว', w: 5, d: 4, h: 2.7, people: 4, equip: 1200, sun: 1, perM2: 900, types: ['wall', 'ceiling'] },
  { id: 'study', g: 'home', th: 'ห้องทำงานที่บ้าน', w: 3.5, d: 3, h: 2.6, people: 1, equip: 450, sun: 1, perM2: 800, types: ['wall'] },
  { id: 'openoffice', g: 'office', th: 'ออฟฟิศ Open-plan', w: 14, d: 10, h: 2.8, people: 24, equip: 4800, sun: 1, perM2: 800, types: ['cassette', 'ceiling', 'duct', 'wall'] },
  { id: 'meeting', g: 'office', th: 'ห้องประชุม', w: 8, d: 5, h: 2.8, people: 12, equip: 700, sun: 1, perM2: 850, types: ['cassette', 'ceiling', 'duct'] },
  { id: 'server', g: 'office', th: 'ห้อง Server · ห้องไฟฟ้า', w: 4, d: 4, h: 2.8, people: 0, equip: 6000, sun: 0, perM2: 400, types: ['wall', 'floor'], closed: true, critical: true },
  { id: 'shop', g: 'retail', th: 'ร้านเสื้อผ้า · โชว์รูม', w: 10, d: 8, h: 3.2, people: 10, equip: 1800, sun: 2, perM2: 850, types: ['cassette', 'ceiling', 'floor'] },
  { id: 'restaurant', g: 'retail', th: 'ร้านอาหาร', w: 10, d: 7, h: 3, people: 24, equip: 2500, sun: 1, perM2: 1000, types: ['ceiling', 'cassette', 'floor'] },
  { id: 'cafe', g: 'retail', th: 'คาเฟ่ · เบเกอรี่', w: 8, d: 6, h: 3.0, people: 16, equip: 3500, sun: 2, perM2: 950, types: ['ceiling', 'cassette', 'wall'] },
  { id: 'salon', g: 'service', th: 'ร้านทำผม · เสริมสวย', w: 7, d: 5, h: 2.8, people: 8, equip: 3000, sun: 2, perM2: 900, types: ['ceiling', 'cassette', 'wall'] },
  { id: 'clinic', g: 'hospital', th: 'ห้องตรวจ', w: 5, d: 4, h: 2.7, people: 3, equip: 500, sun: 1, perM2: 800, types: ['wall', 'cassette'] },
  { id: 'complab', g: 'school', th: 'ห้องคอมพิวเตอร์', w: 10, d: 8, h: 3, people: 40, equip: 8000, sun: 1, perM2: 1000, types: ['cassette', 'ceiling', 'wall'] },
  { id: 'warehouse', g: 'ind', th: 'คลังสินค้า', w: 20, d: 14, h: 6, people: 6, equip: 2000, sun: 1, perM2: 450, types: ['ceiling', 'floor', 'duct'] },
];
export const ROOM_BY_ID: Readonly<Record<string, RoomUse>> = Object.fromEntries(ROOM_USES.map(r => [r.id, r]));

export type OrientId = 'none' | 'N' | 'E' | 'S' | 'W';
export const ORIENT: readonly { id: OrientId; th: string; long: string; f: number }[] = [
  { id: 'none', th: 'ไม่มี', long: 'ไม่มีผนังรับแดดโดยตรง', f: 0.95 },
  { id: 'N', th: 'เหนือ', long: 'ผนังหันทิศเหนือ · แดดอ้อม', f: 0.97 },
  { id: 'E', th: 'ตะวันออก', long: 'ผนังหันทิศตะวันออก · แดดเช้า', f: 1.03 },
  { id: 'S', th: 'ใต้', long: 'ผนังหันทิศใต้ · แดดเกือบทั้งวัน', f: 1.05 },
  { id: 'W', th: 'ตะวันตก', long: 'ผนังหันทิศตะวันตก · แดดบ่ายร้อนที่สุด', f: 1.08 },
];
const ORIENT_BY_ID = Object.fromEntries(ORIENT.map(o => [o.id, o])) as Record<OrientId, (typeof ORIENT)[number]>;
export const GLASS: readonly { th: string; f: number }[] = [
  { th: 'หน้าต่างเล็ก', f: 0.95 },
  { th: 'หน้าต่างปกติ', f: 1 },
  { th: 'ผนังกระจกบานใหญ่', f: 1.08 },
];
export const ROOF_F = 1.12;
export const CLOSED_F = 0.92;

/** Room as the visitor describes it. sun = glass amount index into GLASS (0..2). */
export type RoomInput = { w: number; d: number; h: number; people: number; equip: number; orient?: OrientId; sun?: 0 | 1 | 2; roof?: boolean; closed?: boolean };

/** Default orientation for a room use (reference defaultOrient). */
export const defaultOrient = (r: Pick<RoomUse, 'sun' | 'closed'>): OrientId => (r.closed ? 'none' : r.sun === 2 ? 'W' : r.sun === 0 ? 'none' : 'E');
/** The room's default input values (reference studio pick(): the room's sun exposure doubles as the glass index). */
export const roomDefaults = (r: RoomUse): RoomInput => ({ w: r.w, d: r.d, h: r.h, people: r.people, equip: r.equip, sun: r.closed ? 0 : r.sun, orient: defaultOrient(r), roof: false, closed: !!r.closed });

export function solarF(p: Pick<RoomInput, 'closed' | 'orient' | 'sun'>): number {
  return p.closed ? CLOSED_F : (ORIENT_BY_ID[p.orient as OrientId] || ORIENT[2]).f * GLASS[p.sun ?? 1].f;
}

export type BtuItem = { k: 'base' | 'sun' | 'roof' | 'people' | 'equip'; th: string; btu: number };

/** BTU split into readable parts; total = max(6,000, rounded to 100). */
export function btuBreakdown(p: RoomInput, room: Pick<RoomUse, 'th' | 'perM2' | 'people' | 'equip' | 'critical'>): { items: BtuItem[]; total: number } {
  const area = p.w * p.d;
  const hF = Math.pow(Math.max(1, p.h / 2.7), 0.8);
  const base = area * room.perM2 * hF;
  const sf = solarF(p);
  const rf = p.roof ? ROOF_F : 1;
  let items: BtuItem[] = [
    { k: 'base', th: `พื้นที่ ${area.toFixed(1)} ตร.ม. × สูง ${p.h} ม. (${room.th})`, btu: base },
    { k: 'sun', th: p.closed ? 'ห้องปิดทึบ ไม่มีแดดเข้า' : `แดด: ${(ORIENT_BY_ID[p.orient as OrientId] || ORIENT[2]).long} · ${GLASS[p.sun ?? 1].th}`, btu: base * (sf - 1) },
    { k: 'roof', th: 'ชั้นบนสุด ใต้หลังคารับแดด', btu: p.roof ? base * sf * (rf - 1) : 0 },
    { k: 'people', th: `คน ${p.people} คน (${p.people >= room.people ? 'เพิ่ม' : 'ลด'}จากปกติ ${room.people} คน)`, btu: (p.people - room.people) * 600 },
    { k: 'equip', th: `เครื่องใช้ไฟฟ้า ${Number(p.equip).toLocaleString('en-US')} วัตต์ (ปกติ ${room.equip.toLocaleString('en-US')})`, btu: (p.equip - room.equip) * 3.412 },
  ];
  if (room.critical) {
    items = [
      { k: 'base', th: `พื้นที่ ${area.toFixed(1)} ตร.ม.`, btu: area * room.perM2 * rf },
      { k: 'equip', th: `ความร้อนจากอุปกรณ์ ${Number(p.equip).toLocaleString('en-US')} วัตต์ + เผื่อ 20%`, btu: p.equip * 3.412 * 1.2 },
    ];
  }
  const raw = items.reduce((a, b) => a + b.btu, 0);
  return { items, total: Math.max(6000, Math.round(raw / 100) * 100) };
}
export const needBtu = (p: RoomInput, room: Pick<RoomUse, 'th' | 'perM2' | 'people' | 'equip' | 'critical'>): number => btuBreakdown(p, room).total;

/** How many m² one unit of each type covers well, and the largest size per unit. */
export const TYPE_RULES: Readonly<Record<AcTypeId, { cover: number; max: number; th: string }>> = {
  wall: { cover: 40, max: 30000, th: 'ติดผนัง' },
  ceiling: { cover: 90, max: 60000, th: 'แขวนใต้ฝ้า' },
  cassette: { cover: 70, max: 48000, th: 'สี่ทิศทาง' },
  floor: { cover: 90, max: 60000, th: 'ตู้ตั้งพื้น' },
  duct: { cover: 60, max: 60000, th: 'ท่อลม (ซ่อนในฝ้า)' },
};
export const STD_SIZES = BTU_SIZES;

/** Count + per-unit size for a type; `sizes` = sizes that exist in the catalog for that type. project = hand to the team. */
export function recommendUnits(need: number, area: number, type: AcTypeId, sizes: readonly number[] = STD_SIZES): { n: number; per: number; total: number; project: boolean } {
  const r = TYPE_RULES[type];
  const avail = sizes.filter(s => s <= r.max).sort((a, b) => a - b);
  const top = avail[avail.length - 1] || r.max;
  let n = Math.max(1, Math.ceil(need / top), Math.ceil(area / r.cover));
  n = Math.min(n, 40);
  const per = avail.find(s => s * n >= need * 0.97) || top;
  return { n, per, total: n * per, project: need > 240000 || n > 12 };
}
