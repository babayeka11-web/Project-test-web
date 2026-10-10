// Page copy for /cleaning/ that is not a price: the C1 / C2 comparison and the recommended cleaning intervals.
// Sources: reference standards.js (C1 / C2 cards), services.js cleanSteps (what is removed and washed), the Pricebook
// scope text (inc / exc of the cleaning rows), knowledge.js "ควรล้างแอร์บ่อยแค่ไหน" and acdiag.js care tips.
import type { IconName } from '@/components/ui';
import type { CleanLevel } from '@/lib/domain/cleaning';

export type MethodCompare = {
  level: CleanLevel;
  /** parts taken off and washed outside the unit */
  removed: string[];
  /** what is washed */
  washed: string[];
  /** the record the customer gets for this method */
  record: string;
  /** when to choose it */
  when: string[];
};

export const METHOD_COMPARE: readonly MethodCompare[] = [
  {
    level: 'C1',
    removed: ['หน้ากาก', 'แผ่นกรองฝุ่น', 'บานสวิง', 'ฝาครอบที่ถอดได้'],
    washed: ['คอยล์เย็นด้านหน้า พ่นน้ำยาแล้วฉีดตามแนวครีบ', 'ใบพัดเท่าที่หัวฉีดเข้าถึง โดยไม่ถอด', 'ถาดและทางน้ำทิ้ง', 'คอยล์ร้อนด้านนอก'],
    record: 'ใบรับมอบงาน พร้อมผลทดสอบการทำงาน น้ำทิ้ง และ Error Code',
    when: ['ล้างตามรอบ', 'ฝุ่นและคราบไม่หนา', 'เครื่องยังเย็นดี ไม่มีกลิ่น'],
  },
  {
    level: 'C2',
    removed: ['ทุกชิ้นของล้างปกติ', 'ใบพัดและโครงใบพัด', 'ถาดน้ำทิ้งและจุดต่อ', 'ปลดหรือลดระดับตัวเครื่อง โดยไม่ตัดท่อน้ำยา'],
    washed: ['คอยล์เย็นทั้งด้านหน้าและด้านหลัง', 'ใบพัดที่ถอดออกมาล้างทีละชิ้น', 'ถาดน้ำทิ้งนอกตัวเครื่อง', 'คอยล์ร้อนด้านนอก'],
    record: 'ทะเบียนชิ้นส่วนที่ถอดพร้อมภาพ ชิ้นที่ไม่ได้ถอดต้องระบุเหตุผล',
    when: ['มีคราบดำที่ใบพัด', 'กลิ่นอับไม่หายหลังล้างปกติ', 'น้ำล้นถาดหรือหยดบ่อย', 'ไม่ได้ล้างมานาน'],
  },
];

/** Not included in either method (Pricebook scope of the cleaning rows, in plain words). */
export const NOT_INCLUDED: readonly string[] = [
  'ซ่อมและอะไหล่',
  'เติมน้ำยาแอร์',
  'มอเตอร์และแผงวงจร',
  'ถอดแผงคอยล์หรือเปิดวงจรน้ำยา',
  'ระบบไฟต้นทาง',
  'งานสูงเกิน 3 เมตร',
  'งานโครงสร้างและรายการนอกใบเสนอราคา',
];

export type CleanInterval = { id: string; place: string; detail: string; months: number; icon: IconName };

/** Recommended cleaning intervals by room (general practice — the real need depends on dust and hours of use). */
export const INTERVALS: readonly CleanInterval[] = [
  { id: 'home', place: 'บ้าน คอนโด ห้องนอน', detail: 'เปิดตอนกลางคืนหรือบางช่วงของวัน', months: 6, icon: 'home' },
  { id: 'living', place: 'ห้องนั่งเล่น', detail: 'ห้องที่เปิดแอร์เกือบทั้งวัน', months: 4, icon: 'users' },
  { id: 'office', place: 'สำนักงาน คลินิก ร้านค้า', detail: 'คนเข้าออกมาก เปิดทุกวันทำการ', months: 3, icon: 'building' },
  { id: 'kitchen', place: 'ครัว ร้านอาหาร โรงงาน', detail: 'ไอน้ำมันและฝุ่นจากการผลิต', months: 2, icon: 'thermometer' },
  { id: 'server', place: 'ห้อง Server', detail: 'ห้องปิด ฝุ่นน้อย แต่ต้องเปิดตลอด', months: 6, icon: 'monitor' },
];

/** Signs that a unit is due for cleaning. */
export const DUE_SIGNS: readonly string[] = ['ลมเบาลง', 'เย็นช้ากว่าเดิม', 'มีกลิ่นอับ', 'น้ำหยดจากตัวเครื่อง', 'เสียงดังขึ้น'];

/** What owners can do between visits, and what they should not. */
export const CARE_TIPS: readonly { ok: boolean; t: string }[] = [
  { ok: true, t: 'ล้างแผ่นกรองเองได้ทุก 2–4 สัปดาห์ ห้องที่มีฝุ่นหรือสัตว์เลี้ยงควรล้างบ่อยขึ้น' },
  { ok: false, t: 'ไม่ควรฉีดน้ำแรงดันหรือสเปรย์ล้างเข้าคอยล์เอง แผงวงจรและมอเตอร์ต้องคลุมกันน้ำก่อนทุกครั้ง' },
];
