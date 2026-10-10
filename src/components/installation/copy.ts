// Copy and small helpers of the installation page (client-safe, no Pricebook). Text from the Pricebook sheets is kept as the
// company wrote it; `plain()` only swaps a few English sheet terms for the words customers use.
import type { IconName } from '@/components/ui';

const WORDS: readonly (readonly [string, string])[] = [
  ['วัสดุ Standard ครบ 4 ม.', 'วัสดุเหมือนแพ็กเกจมาตรฐานครบ 4 ม.'],
  ['เพิ่ม Support/Anti-vibration', 'เพิ่มขาแขวนและกันสั่น'],
  ['Breaker Nano/Approved ตาม Load', 'เบรกเกอร์ NANO ตามกระแสของเครื่อง'],
  ['Support/Anti-vibration', 'ขาแขวนและกันสั่นเพิ่ม'],
  ['บันทึกค่า Commissioning', 'บันทึกค่าเดินเครื่องทดสอบ'],
  ['Nitrogen Leak Test', 'อัดไนโตรเจนตรวจรั่ว'],
  ['Vacuum Hold', 'Vacuum ค้างความดัน'],
  ['ตรวจ Torque/Flare', 'ตรวจแรงบิดขันแฟลร์'],
  ['ตรวจรอยต่อ/Drain/Current/Voltage', 'ตรวจรอยต่อ น้ำทิ้ง กระแส แรงดันไฟ'],
  ['ตามจุดเข้าถึง', 'ตามจุดที่เข้าถึงได้'],
  ['Test Run', 'เดินเครื่องทดสอบ'],
  ['ตามระบบ', 'ตามระบบของเครื่อง'],
  ['ตาม QTN', 'ตามใบเสนอราคา'],
  ['เมนไฟจาก DB', 'เมนไฟจากตู้ไฟ (DB)'],
  ['Permit พิเศษ', 'ใบอนุญาตเข้าพื้นที่พิเศษ'],
  ['Access/ระยะ/ระบบเดิม/ไฟ/น้ำหนักไม่ชัด', 'ทางเข้าทำงาน ระยะท่อ ระบบเดิม ไฟ หรือน้ำหนักยังไม่ชัด'],
];

/** Sheet wording → words customers use (only the listed English terms are replaced). */
export function plain(text: string): string {
  return WORDS.reduce((s, [from, to]) => s.split(from).join(to), text);
}

/** "A; B, C และ D" → clauses; keeps the sheet's order. */
export const clauses = (text: string | null | undefined): string[] =>
  (text || '')
    .split(/;\s*|,\s*|\s+และ(?=\S)/)
    .map(x => x.trim())
    .filter(Boolean);

/** Survey rule of the sheet ("NO … ; YES …") → two plain sentences. */
export function surveyRule(rule: string | null | undefined): { skip: string; need: string } | null {
  if (!rule) return null;
  const parts = rule.split(/;\s*/);
  const no = parts.find(p => /^NO\b/.test(p));
  const yes = parts.find(p => /^YES\b/.test(p));
  if (!no || !yes) return null;
  return {
    skip: `ไม่ต้องสำรวจ${plain(no.replace(/^NO/, ''))}`,
    need: `ทีมสำรวจก่อน${plain(yes.replace(/^YES/, ''))}`,
  };
}

export type MaterialSpec = { id: string; th: string; spec: string; why: string; icon: IconName };

/** The materials every package uses (names as the company writes them in the Pricebook; text only, no logos). */
export const MATERIAL_SPECS: readonly MaterialSpec[] = [
  { id: 'pipe', th: 'ท่อน้ำยาทองแดง', spec: 'O-TWO ความหนา 0.70 มม.', why: 'ท่อทองแดงสำหรับน้ำยาแอร์ ดัดโค้งได้ ไม่ต้องต่อเพิ่มกลางทาง', icon: 'thermometer' },
  { id: 'ins', th: 'ฉนวนหุ้มท่อ', spec: 'Aeroflex', why: 'หุ้มท่อน้ำยาตลอดแนว ลดน้ำเกาะท่อและความเย็นสูญเสีย', icon: 'wind' },
  { id: 'rail', th: 'รางครอบท่อ', spec: 'Airpro', why: 'เก็บท่อและสายไฟให้เป็นระเบียบ กันแดดกันฝนส่วนที่อยู่นอกอาคาร', icon: 'sparkle' },
  { id: 'cable', th: 'สายไฟ', spec: 'Yazaki THW', why: 'สายทองแดงขนาดตามกระแสของรุ่น ต่อสายดินทุกจุด', icon: 'bolt' },
  { id: 'drain', th: 'ท่อน้ำทิ้ง', spec: 'PVC SCG', why: 'ท่อ PVC เดินลาดตลอดแนว น้ำไหลออกได้ ไม่ย้อนกลับ', icon: 'droplet' },
  { id: 'breaker', th: 'เบรกเกอร์', spec: 'NANO RCBO', why: 'แยกวงจรของแอร์ ตัดไฟเมื่อมีไฟรั่วหรือกระแสเกิน', icon: 'shield' },
  { id: 'mount', th: 'ขาแขวนและยางกันสั่น', spec: 'ขาแขวนหรือฐานรอง + ยางกันสั่น', why: 'รองรับคอยล์ร้อนให้มั่นคง ลดเสียงสั่นถึงตัวอาคาร', icon: 'ac' },
];

/** Customer-word names of the AC types the installation sheet prices. */
export const INSTALL_TYPE_HINT: Readonly<Record<'wall' | 'ceiling' | 'cassette' | 'floor', string>> = {
  wall: 'บ้าน คอนโด ห้องนอน ห้องทำงานเล็ก',
  ceiling: 'ร้านค้า สำนักงาน ห้องโถง',
  cassette: 'ฝ้าสูง ห้องประชุม ร้านอาหาร',
  floor: 'ห้องใหญ่ ร้านค้า โชว์รูม',
};
