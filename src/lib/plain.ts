// Pricebook sheet wording → the words customers use. The sheets are written for the team (QTN, Commissioning, staff
// rules); every page that shows sheet text to customers runs it through plain(). Only the listed phrases change.

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
  // staff rules from the repair sheet → what they mean for the customer
  ['ห้ามออก Final Price ก่อน Manager/ช่างยืนยัน', 'ทีมยืนยันราคาก่อนเริ่มงานทุกครั้ง'],
  ['ใช้สำหรับรายการที่ไม่มีใน Pricebook ต้องระบุรุ่น Part No. อาการ Scope และผลทดสอบให้ครบ', 'สำหรับงานที่ไม่มีในรายการราคา ทีมแจ้งรุ่น อะไหล่ อาการ ขอบเขตงาน และผลทดสอบในใบเสนอราคา'],
  ['QTN/Method Statement', 'ใบเสนอราคาและขั้นตอนงาน'],
  // any other mention of the internal abbreviation (after 'ตาม QTN' above)
  ['ใน QTN', 'ในใบเสนอราคา'],
  ['QTN', 'ใบเสนอราคา'],
];

/** Sheet wording → words customers use (only the listed English terms are replaced). */
export function plain(text: string): string {
  return WORDS.reduce((s, [from, to]) => s.split(from).join(to), text);
}

