// What the crew does on an installation job — port of the reference services.js installSteps(type, level) and INSTALL_HOW,
// which follow the company form SBP-SR-ACIN-UNI-001 Rev.04 (one handover report per unit).
//   · Standard: leak check at the joints that can be reached, vacuum, test run with measurements, photos, handover
//   · Premium: adds nitrogen leak test + flare torque check, vacuum hold, commissioning record and 2 follow-up visits
// Measured values are examples of what is recorded — never a pass / fail line. Client-safe: plain data, no Pricebook.

export const INSTALL_FORM = 'SBP-SR-ACIN-UNI-001 Rev.04';

export type StepType = 'wall' | 'ceiling' | 'cassette' | 'floor';
export type StepLevel = 'STANDARD' | 'PREMIUM';
export type StepPhase = 'pre' | 'work' | 'test' | 'hand';

export const PHASES: Readonly<Record<StepPhase, { th: string; form: string }>> = {
  pre: { th: 'ก่อนเริ่มงาน', form: 'สำรวจและตรวจรับเครื่อง' },
  work: { th: 'ติดตั้งหน้างาน', form: 'ติดตั้งคอยล์ เดินท่อ น้ำทิ้ง และสายไฟ' },
  test: { th: 'ทดสอบระบบ', form: 'ตรวจรั่ว ทำสุญญากาศ เดินเครื่อง' },
  hand: { th: 'เก็บงานและส่งมอบ', form: 'ตรวจรายการค้าง สอนใช้งาน ส่งเอกสาร' },
};
export const PHASE_ORDER: readonly StepPhase[] = ['pre', 'work', 'test', 'hand'];

export type InstallStep = {
  id: string;
  ph: StepPhase;
  /** step title */
  t: string;
  /** what is done (company form wording) */
  d: string;
  /** how it is done on this unit type */
  how?: string;
  /** values the crew records — examples of what is written down, not pass / fail limits */
  rec?: readonly string[];
  /** what the customer gets from this step */
  you?: string;
  /** not part of this package */
  off?: boolean;
};

const TEST: Record<StepLevel, { leak: string; vac: string; rec: boolean; photo: boolean; follow: boolean }> = {
  STANDARD: { leak: 'ตรวจรอยต่อตามจุดที่เข้าถึงได้', vac: 'Vacuum ก่อนปล่อยน้ำยา', rec: true, photo: true, follow: false },
  PREMIUM: {
    leak: 'ทดสอบรั่วด้วยไนโตรเจนเมื่อเหมาะสม + ตรวจแรงบิดขันแฟลร์',
    vac: 'Vacuum และทดสอบค้างความดัน (Vacuum Hold)',
    rec: true,
    photo: true,
    follow: true,
  },
};

const MOUNT: Record<StepType, string> = {
  wall: 'ยึดแผ่นยึดกับผนังให้ได้ระดับ ตรวจผนังรับน้ำหนักได้ และเจาะผนังลาดออกด้านนอก',
  ceiling: 'แขวนด้วยก้านเกลียวยึดโครงสร้างด้านบน ปรับระดับตามคู่มือให้น้ำไหลไปทางท่อน้ำทิ้ง',
  cassette: 'เปิดฝ้าตามขนาดหน้ากาก แขวนก้านเกลียวจากพื้นชั้นบน ตั้งระยะตัวเครื่องกับฝ้าตามคู่มือ',
  floor: 'วางตัวเครื่องตามตำแหน่งบนพื้นที่รับน้ำหนักได้ ปรับระดับ ยึดกันล้มกับผนังตามคู่มือ และเจาะผนังด้านหลังหรือด้านข้างสำหรับแนวท่อ',
};
const DRAIN: Record<StepType, string> = {
  wall: 'เดินท่อน้ำทิ้งให้ลาดตลอดแนว ไม่ย้อนขึ้น',
  ceiling: 'เดินท่อน้ำทิ้งให้ลาดตลอดแนว ทำ Trap เมื่อจำเป็น',
  cassette: 'ต่อท่อน้ำทิ้งจากปั๊มในตัวเครื่อง เทน้ำทดสอบปั๊มและลูกลอย',
  floor: 'เดินท่อน้ำทิ้งจากถาดด้านล่างตัวเครื่องให้ลาดตลอดแนว ไม่ย้อนขึ้น',
};

/** How each step is done on each unit type — general technician practice under the company form steps (never a promise). */
const HOW: Record<StepType, Partial<Record<'survey' | 'indoor' | 'piping' | 'outdoor', string>>> = {
  wall: {
    survey: 'วัดผนังที่จะติด ระยะถึงฝ้าและมุมห้อง แนวท่อผ่านผนังถึงตำแหน่งคอยล์ร้อน',
    indoor: 'ยึดเพลทแขวนด้วยพุกให้ได้ระดับ เจาะรูผนังลาดออกด้านนอก ใส่ปลอกรูผนัง แล้วแขวนตัวเครื่องให้ล็อกครบทุกจุด',
    piping: 'ดัดท่อด้วยเครื่องมือดัดท่อ บานแฟลร์ ขันตามแรงบิด หุ้มฉนวนตลอดแนวและเก็บในรางครอบท่อ',
    outdoor: 'ติดขาแขวนหรือวางฐานพร้อมยางกันสั่น เว้นระยะระบายความร้อน',
  },
  ceiling: {
    survey: 'ตรวจโครงสร้างเหนือฝ้า/ใต้พื้นชั้นบน ความสูงที่แขวนได้ แนวท่อน้ำทิ้งที่ลาดได้ และไม่มีคานขวางแนวลม',
    indoor: 'ยึดพุกเพดานและก้านเกลียว ช่างสองคนยกตัวเครื่องขึ้นแขวน ปรับระดับให้ลาดไปทางท่อน้ำทิ้ง',
    piping: 'เดินท่อตามแนวฝ้าในราง หุ้มฉนวนตลอดแนว ยึดหิ้วท่อเป็นระยะ',
    outdoor: 'วางคอยล์ร้อนบนฐานหรือขาแขวนพร้อมยางกันสั่น เว้นระยะระบายความร้อน',
  },
  cassette: {
    survey: 'ตรวจความสูงเหนือฝ้าที่ต้องพอสำหรับตัวเครื่อง ตำแหน่งกลางห้อง และโครงฝ้าที่ต้องเปิด',
    indoor: 'เปิดฝ้าตามแบบกระดาษ (Template) ของรุ่น ยึดก้านเกลียว ช่างสองคนยกเครื่องขึ้นเหนือฝ้า ตั้งระยะกับฝ้าตามคู่มือ ติดหน้ากากหลังเดินท่อ',
    piping: 'เดินท่อเหนือฝ้า หุ้มฉนวนตลอดแนว ต่อท่อน้ำทิ้งจากปั๊มในตัวเครื่อง',
    outdoor: 'วางคอยล์ร้อนบนฐานพร้อมยางกันสั่น เว้นระยะระบายความร้อน',
  },
  floor: {
    survey: 'ตรวจพื้นรับน้ำหนัก ระยะหน้าเครื่องโล่งสำหรับลมออก ตำแหน่งเจาะผนังด้านหลังหรือด้านข้าง',
    indoor: 'ช่างสองคนยกตัวเครื่องวางตำแหน่ง ปรับระดับ ยึดกันล้มกับผนัง เจาะผนังสำหรับท่อ',
    piping: 'ต่อท่อจากด้านหลังหรือด้านข้างตัวเครื่องผ่านผนัง หุ้มฉนวนและเก็บในรางครอบท่อ',
    outdoor: 'วางคอยล์ร้อนบนฐานพร้อมยางกันสั่น เว้นระยะระบายความร้อน',
  },
};

/** The steps of one installation job, in order. */
export function installSteps(type: StepType, level: StepLevel): InstallStep[] {
  const T = TEST[level];
  const how = HOW[type];
  return [
    { id: 'survey', ph: 'pre', t: 'สำรวจหน้างาน', d: 'ตำแหน่งคอยล์เย็น–คอยล์ร้อน แนวและระยะท่อ ระบบไฟ เบรกเกอร์ ความสูง และโครงสร้างที่ต้องรับน้ำหนัก แจ้งวัสดุส่วนเกินก่อนเริ่มงาน', how: how.survey, you: 'รู้ค่าใช้จ่ายส่วนเกินก่อนเริ่มงาน' },
    { id: 'receive', ph: 'pre', t: 'ตรวจรับเครื่อง', d: 'รุ่นและ Serial จากป้าย Nameplate ต้องตรงกับใบเสนอราคาและ BTU ที่ตกลง ตรวจสภาพกล่องและอุปกรณ์ในกล่อง' },
    { id: 'indoor', ph: 'work', t: 'ติดตั้งคอยล์เย็น', d: MOUNT[type], how: how.indoor },
    { id: 'outdoor', ph: 'work', t: 'ติดตั้งคอยล์ร้อน', d: 'ขาแขวนหรือฐานรองพร้อมยางกันสั่น เว้นระยะระบายความร้อนตามคู่มือ', how: how.outdoor },
    { id: 'piping', ph: 'work', t: 'เดินท่อน้ำยาและหุ้มฉนวน', d: 'ท่อไม่หักงอ บานแฟลร์หรือเชื่อมตามมาตรฐาน หุ้มฉนวนตลอดแนวและเก็บในราง', how: how.piping },
    { id: 'drain', ph: 'work', t: 'ระบบน้ำทิ้ง', d: `${DRAIN[type]} แล้วทดสอบการไหล` },
    { id: 'electric', ph: 'work', t: 'ระบบไฟฟ้าและรีโมต', d: 'สายไฟตามกระแสของรุ่น เบรกเกอร์แยกวงจร ต่อสายดิน กรณี 3 เฟสตรวจลำดับเฟส และตั้งค่ารีโมต' },
    { id: 'leak', ph: 'test', t: 'ทดสอบรอยรั่ว', d: T.leak },
    { id: 'vacuum', ph: 'test', t: 'ทำสุญญากาศ (Vacuum)', d: `${T.vac} เพื่อไล่อากาศและความชื้นออกจากท่อก่อนเปิดวาล์วน้ำยา${T.rec ? ' บันทึกเวลาและค่าที่วัดได้' : ''}` },
    { id: 'valve', ph: 'test', t: 'เปิดวาล์วและเติมน้ำยาส่วนเกิน (ถ้ามี)', d: 'เติมเพิ่มเฉพาะเมื่อท่อยาวเกินระยะที่ผู้ผลิตกำหนด บันทึกปริมาณที่เติม' },
    {
      id: 'testrun',
      ph: 'test',
      t: 'เดินเครื่องทดสอบ (Test Run)',
      d: 'วัดแรงดันไฟ กระแส อุณหภูมิลมกลับและลมจ่าย ตรวจน้ำทิ้ง รีโมต และไม่มี Error',
      rec: ['แรงดันไฟ (V)', 'กระแส (A)', 'ลมกลับ °C', 'ลมจ่าย °C', 'ผลต่างอุณหภูมิ ΔT °C'],
      you: 'เห็นค่าที่วัดได้ในใบรับมอบ',
    },
    { id: 'cleanup', ph: 'hand', t: 'เก็บงานและทำความสะอาด', d: T.photo ? 'ตรวจรายการค้าง (Punch list) ถ่ายภาพก่อน–หลังและค่าที่วัดได้' : 'ตรวจรายการค้างและทำความสะอาดพื้นที่' },
    {
      id: 'handover',
      ph: 'hand',
      t: 'ส่งมอบและสอนใช้งาน',
      d: `ส่งรีโมต คู่มือ บัตรรับประกัน/QR สอนการใช้งานและการล้างฟิลเตอร์ ตั้งรอบบริการครั้งถัดไป${T.follow ? ' และนัดตรวจติดตาม 2 ครั้ง' : ''}`,
      you: 'รับเอกสารรับประกันงานติดตั้ง',
    },
  ];
}
