// Shared site content (client-safe): services, process, FAQ, contact topics, VRF rule, on-site time estimates.
// Port of SERVICES / PROCESS / FAQ / CONTACT_TOPICS / isVRF / VRF_NOTE / JOB_TIME / TIME_NOTE / timeTh in the reference
// sbp-core.js. FAQ answers are computed from the same constants as the calculators, so they can never drift from them.
import { MIN_BILL, QUEUE_RULES } from './constants';
import { baht } from './format';
import { SMALL_VISIT } from './rates';
import { TRAVEL } from './travel';
import type { AcTypeId } from './types';

/* ---------- services ---------- */

export type ServiceId = 'clean-b2b' | 'clean' | 'install' | 'repair' | 'move' | 'project';
export type ServiceCard = {
  id: ServiceId;
  th: string;
  sub: string;
  /** headline price text ('เริ่ม ฿700 / เครื่อง') — Pricebook-derived for clean / install / repair */
  from: string;
  time: string;
  href: string;
  /** the B2B card (cleaning contracts) */
  key?: boolean;
  /** goes to a separate inquiry, never to the quote cart */
  contact?: boolean;
};

/** Headline "from" prices (before VAT); pricebook.ts serviceFrom() computes them. */
export type ServiceFrom = { clean: number; install: number; repair: number };

/** Service cards. Pass serviceFrom() (server) to fill the Pricebook prices; without it those cards say '—'.
 *  Note: the reference listed installation as 'พื้นฐาน · มาตรฐาน · พรีเมียม'; the web sells Standard / Premium only
 *  (ARCHITECTURE.md §6.7), so the sub line says so. */
export function serviceCards(from?: ServiceFrom | null, repairCount?: number): ServiceCard[] {
  return [
    { id: 'clean-b2b', th: 'สัญญาล้างรายปี', sub: 'องค์กร · อาคาร · โรงงาน', from: 'อัตราตามจำนวนเครื่อง', time: 'วางแผนรอบทั้งปี', href: '/business/', key: true },
    { id: 'clean', th: 'ล้างแอร์', sub: 'ล้างปกติ C1 / ล้างใหญ่ C2', from: from ? `เริ่ม ${baht(from.clean)} / เครื่อง` : '—', time: 'ตามจำนวนเครื่อง', href: '/cleaning/' },
    { id: 'install', th: 'ติดตั้งแอร์', sub: 'มาตรฐาน · พรีเมียม', from: from ? `เริ่ม ${baht(from.install)} / เครื่อง` : '—', time: 'รวมท่อ 4 เมตรแรก', href: '/installation/' },
    { id: 'repair', th: 'ตรวจเช็ก / ซ่อม', sub: `${repairCount ?? 86} รายการ พร้อมราคาและประกัน`, from: from ? `ค่าตรวจเริ่ม ${baht(from.repair)}` : '—', time: 'แจ้งราคาก่อนซ่อม', href: '/repair/' },
    { id: 'move', th: 'รื้อ ย้าย ติดตั้งใหม่', sub: 'เก็บน้ำยา ถอด ย้าย ติดตั้ง', from: 'ประเมินหน้างาน', time: 'ตามระยะท่อจริง', href: '/prices/' },
    { id: 'project', th: 'งานโครงการ · VRV / VRF', sub: 'VRV · VRF · Package · AHU · Duct', from: 'ติดต่อทีมโครงการ', time: 'สำรวจ + ออกแบบ + BOQ', href: '/contact/', contact: true },
  ];
}

/* ---------- VRV / VRF (separate project inquiry, never into the quote cart) ---------- */

export const isVRF = (...t: (string | null | undefined)[]): boolean => /VRV|VRF/i.test(t.filter(Boolean).join(' '));
export const VRF_NOTE = 'ระบบ VRV / VRF ออกแบบเฉพาะโครงการ ไม่มีราคาบนเว็บ ติดต่อทีมโครงการเพื่อสำรวจและออกแบบ';

/** Topics offered in every contact form. */
export const CONTACT_TOPICS: readonly string[] = [
  'ล้างแอร์', 'ติดตั้งแอร์', 'ซ่อม / ตรวจเช็ก', 'เทิร์นแอร์เก่า', 'สัญญาล้างรายปี', 'ซื้อแอร์', 'FUJIVA', 'ระบบ VRV / VRF', 'งานโครงการอื่น', 'อื่น ๆ',
];

export const PROCESS: readonly { th: string; d: string }[] = [
  { th: 'เลือกบริการหรือรุ่น', d: 'ดูราคาบนเว็บ ใส่ลงใบเสนอราคาเบื้องต้น ระบบรวมยอดและ VAT ให้' },
  { th: 'ยืนยันหน้างาน', d: 'ทีมโทรยืนยัน รายการที่ต้องประเมินหน้างานจะแจ้งราคาก่อนเริ่มงาน' },
  { th: 'ลงมือทำงาน', d: 'คลุมพื้นที่ ทำตามขั้นตอน ถ่ายภาพก่อน–หลัง' },
  { th: 'ส่งมอบ + รายงาน', d: 'ทดสอบการทำงาน ส่งเอกสารตามแพ็กเกจ และเงื่อนไขรับประกันต่อรายการ' },
];

/* ---------- FAQ ---------- */

export type FaqItem = { q: string; a: string };
/** Install-sheet prices the removal / relocation answer quotes (before VAT); pricebook.ts faqPrices() fills them. */
export type FaqPrices = { remW: number | null; remC: number | null; remK: number | null; remFS: number | null; moveW12: number | null; dispose: number | null };

const n0 = (n: number) => n.toLocaleString('en-US');

/** The FAQ with answers computed from the rule constants (and the removal prices when given). */
export function faqList(prices?: FaqPrices | null, minBill: number = MIN_BILL): FaqItem[] {
  const T = TRAVEL;
  const f = (n: number | null | undefined) => (n != null ? n.toLocaleString('en-US') : '-');
  const P = prices || { remW: null, remC: null, remK: null, remFS: null, moveW12: null, dispose: null };
  return [
    { q: 'ต้องจองล่วงหน้ากี่วัน ถ้าต้องการด่วนได้ไหม', a: `จองปกติล่วงหน้า ${QUEUE_RULES.leadDays} วัน ถ้าต้องการเร็วกว่านั้น (รวมถึงวันนี้) เลือกคิวด่วน มีค่าบริการเพิ่ม ${n0(QUEUE_RULES.rushFeeEx)} บาทต่อการเข้างาน (ก่อน VAT) รับเมื่อมีทีมว่างเท่านั้น ทีมยืนยันคิวก่อนทุกครั้ง ถ้าไม่มีคิวจะไม่เก็บค่าคิวด่วนและเสนอวันที่ใกล้ที่สุดให้ งานนอกเวลาทำการและวันอาทิตย์มีค่าใช้จ่ายเพิ่มเติม ทีมแจ้งในใบเสนอราคา` },
    { q: 'ราคาบนเว็บรวม VAT แล้วหรือยัง', a: 'ทุกราคาบนเว็บเป็นราคาก่อน VAT ราคางานบริการปัดเป็นหลักร้อยให้อ่านง่าย VAT 7% คิดครั้งเดียวที่ยอดรวมของใบเสนอราคา (แสดงยอดก่อน VAT · VAT · รวมทั้งสิ้น แยกให้เห็น)' },
    { q: 'ราคาติดตั้งรวมอะไรบ้าง', a: 'รวมท่อน้ำยาและวัสดุ 4 เมตรแรก ท่อน้ำทิ้ง สายไฟตามระยะที่ระบุ เบรกเกอร์ ขาแขวน Vacuum และทดสอบ ส่วนที่เกินเลือกเพิ่มได้ในหน้าสินค้า' },
    { q: 'รายการที่ขึ้นว่า "ประเมินหน้างาน" คืออะไร', a: 'งานที่ราคาขึ้นกับสภาพจริง เช่น รื้อเครื่องเดิม งานสูง นั่งร้าน เปิดฝ้า ทีมจะแจ้งราคาให้ยืนยันก่อนเริ่มงานทุกครั้ง' },
    { q: 'สัญญารายปีต่างจากเรียกล้างทีละครั้งอย่างไร', a: 'ทีมวางรอบล่วงหน้าทั้งปี ได้อัตราตามจำนวนเครื่อง มีรายงานตามแพ็กเกจหลังทุกรอบ และวางบิลตามรอบ' },
    { q: 'พื้นที่ให้บริการและค่าเดินทางคิดอย่างไร', a: `พื้นที่หลักคือกรุงเทพฯ ในระยะ ${T.freeKm} กม. จากสำนักงานใหญ่ พระราม 2 ไม่มีค่าเดินทางเมื่อยอดงานล้างถึง ${n0(minBill)} บาท ถ้าต่ำกว่านั้นคิดค่าเดินทาง ${T.baseFee} บาทต่อการเข้างาน นอกพื้นที่หลักรับถึงประมาณ ${T.maxKm} กม. ค่าเดินทางต่อเที่ยว ${T.baseFee} บาท + ${T.perKm} บาทต่อกิโลเมตรที่เกิน ${T.freeKm} กม. (ก่อน VAT ปัดขึ้นหลักร้อย) ไกลกว่านั้นรับเป็นงานโครงการหรือสัญญา` },
    { q: 'รับงานระบบ VRV / VRF ไหม', a: 'รับเป็นงานโครงการแยกจากงานล้างและติดตั้งทั่วไป เพราะต้องสำรวจ ออกแบบท่อและคอนโทรล และทำ BOQ ตามอาคารจริง กด "ติดต่อสอบถาม VRV / VRF" แล้วทีมโครงการจะติดต่อกลับ' },
    { q: 'มียอดขั้นต่ำไหม', a: 'งานล้างมียอดขั้นต่ำต่อการเข้าหน้างาน ' + n0(minBill) + ` บาทก่อน VAT ถ้ายอดงานล้างต่ำกว่านี้ คิดค่าเดินทาง ${T.baseFee} บาทต่อการเข้างาน ใบเสนอราคาเบื้องต้นแสดงให้เห็นก่อนส่งทุกครั้ง` },
    { q: 'งานเล็ก ๆ อย่างเดียว เช่น ขนแอร์เก่าออก เจาะผนังเพิ่ม มีค่าเข้างานไหม', a: `งานย่อยที่ไม่มีงานล้าง ติดตั้ง หรือตรวจซ่อมในวันเดียวกัน มียอดขั้นต่ำต่อการเข้างาน ${n0(SMALL_VISIT.minEx)} บาทก่อน VAT รายการที่ทำนับรวมในยอดนี้ ส่วนที่ขาดคิดเป็นค่าเข้างาน ถ้านัดพร้อมรอบล้างหรืองานติดตั้ง ไม่มีค่าเข้างานนี้` },
    { q: 'ค่ารื้อและย้ายแอร์เท่าไร', a: `ค่ารื้อ (รวมเก็บน้ำยากลับคอยล์ร้อน) ติดผนัง ${f(P.remW)} · แขวนใต้ฝ้า ${f(P.remC)} · สี่ทิศทาง ${f(P.remK)} · ตู้ตั้งพื้น ${f(P.remFS)} บาท ก่อน VAT · ย้ายแอร์ = ค่ารื้อ + ราคาติดตั้งมาตรฐานตามขนาดที่จุดใหม่ (ติดผนัง 9,000–12,000 BTU ${f(P.moveW12)} บาท) · ขนเครื่องเดิมออก ${f(P.dispose)} บาทต่อเครื่อง · ดูทุกขนาดในค่าบริการ หมวดรื้อ ย้าย` },
  ];
}

/* ---------- on-site time (estimate, never a promise) ---------- */

export type JobLevel = 'C1' | 'C2' | 'install';
/** Estimated on-site minutes per unit for one crew of two, from what Thai air-con shops publish. Always shown with TIME_NOTE. */
export const JOB_TIME: Readonly<Record<JobLevel, Partial<Record<AcTypeId, readonly [number, number]>>>> = {
  C1: { wall: [30, 60], ceiling: [40, 90], cassette: [40, 90], floor: [40, 90] },
  C2: { wall: [90, 150], ceiling: [90, 120], cassette: [90, 120], floor: [90, 120] },
  install: { wall: [120, 240], ceiling: [180, 360], cassette: [180, 480], floor: [180, 360] },
};
export const TIME_NOTE = 'เวลาโดยประมาณจากข้อมูลร้านแอร์ทั่วไป ขึ้นกับหน้างานและสภาพเครื่อง ไม่ใช่เกณฑ์หรือคำรับรอง';

const minTh = (m: number) => (m < 60 ? `${m} นาที` : `${+(m / 60).toFixed(1)} ชม.`.replace('.0 ', ' '));
/** [min, max] minutes → '30–60 นาที' · '1.5–2.5 ชม.' · '40 นาที–1.5 ชม.' */
export const timeTh = ([a, b]: readonly [number, number] | readonly number[]): string =>
  a < 60 && b <= 60 ? `${a}–${b} นาที` : `${minTh(a)}–${minTh(b)}`.replace(/ ชม\.–/, '–');

/* ---------- wording rules ---------- */

/** Phrases that must never appear anywhere on the site (ARCHITECTURE.md §6.11). */
export const BANNED_PHRASES: readonly string[] = [
  'แก้หายแน่นอน', 'ไม่มีปัญหาอีกแน่นอน', 'ประหยัดไฟแน่นอน', 'ปลอดเชื้อ', 'สะอาด 100%', 'รับประกันเย็น',
  'ล้างใหญ่ครบทุกจุด', 'ไม่มีค่าใช้จ่ายเพิ่มเติมทุกกรณี', 'อะไหล่เสียแน่นอน', 'เสร็จตามเวลาแน่นอน',
];
/** The banned phrases found in a text ([] = clean). */
export const bannedIn = (text: string): string[] => BANNED_PHRASES.filter(p => text.includes(p));
