// Standard rates decided for Pricebook lines that have no rate (client-safe). Port of the reference rates.js (Rev.27,
// owner 5 ต.ค. 2569). Applied on top of data/pricebook.json in pricebook.ts — the Pricebook mirror itself is never edited.
// How each rate was set: m = Thai market reference prices 2569 · c = the company's own Pricebook rate for the same work in
// another sheet · k = composite of published rates (removal + standard installation). All amounts before VAT, whole hundreds,
// fixed baht (never a percentage). Lines that depend on parts, design or the project keep "ประเมินหน้างาน".

export type DecidedRate = { ex: number; how: 'm' | 'c' | 'k'; note: string };

/** install code → decided rate */
export const DECIDED: Readonly<Record<string, DecidedRate>> = {
  'REM-W': { ex: 1000, how: 'm', note: 'รวมเก็บน้ำยากลับคอยล์ร้อน ปลดท่อ ปิดปลายท่อ และยกเครื่องลง' },
  'REM-C': { ex: 1800, how: 'm', note: 'รวมเก็บน้ำยากลับคอยล์ร้อน ปลดท่อ ปิดปลายท่อ และยกเครื่องลง' },
  'REM-K': { ex: 2500, how: 'm', note: 'รวมเก็บน้ำยา ถอดหน้ากาก ปลดท่อและท่อน้ำทิ้ง ยกเครื่องลงจากฝ้า (ไม่รวมงานซ่อมฝ้า)' },
  'REM-FS': { ex: 2000, how: 'm', note: 'รวมเก็บน้ำยากลับคอยล์ร้อน ปลดท่อ ปิดปลายท่อ' },
  'REF-PUMPDOWN': { ex: 500, how: 'm', note: 'เก็บน้ำยากลับคอยล์ร้อนโดยเครื่องอยู่ที่เดิม เช่น ก่อนรีโนเวทหรือทาสี (ถ้ารื้อเครื่อง รวมอยู่ในค่ารื้อแล้ว)' },
  'DISPOSE': { ex: 500, how: 'm', note: 'ขนเครื่องเดิมออกจากพื้นที่ต่อเครื่อง (m: ค่าขนย้าย/ค่ารถ 300–1,000)' },
  'REF-R22': { ex: 3000, how: 'c', note: 'เท่ากับค่าเติม R22 ส่วนเกินต่อ kg ในตารางซ่อม' },
  'REF-R32': { ex: 2100, how: 'c', note: 'เท่ากับค่าเติม R32/R410A ส่วนเกินต่อ kg ในตารางซ่อม' },
  'REF-R410A': { ex: 2100, how: 'c', note: 'เท่ากับค่าเติม R32/R410A ส่วนเกินต่อ kg ในตารางซ่อม' },
  'REF-VAC': { ex: 2400, how: 'c', note: 'เท่ากับ Vacuum ระบบ / ไล่ความชื้น ในตารางซ่อม' },
  'REF-LEAK': { ex: 2200, how: 'c', note: 'เท่ากับตรวจรั่วด้วยไนโตรเจน ในตารางซ่อม' },
  'ELE-PHASE': { ex: 2800, how: 'c', note: 'เท่ากับเปลี่ยน Phase Protector ในตารางซ่อม' },
  'CIV-CORE': { ex: 600, how: 'm', note: 'รูเดินท่อแอร์ผ่านผนังคอนกรีต ขนาดไม่เกิน 5 นิ้ว พร้อมเก็บฝุ่น' },
};

/** Relocation = removal + standard installation at the new spot, per type code (k). */
export const MOVE: Readonly<Record<'W' | 'C' | 'K' | 'FS', string>> = { W: 'REM-W', C: 'REM-C', K: 'REM-K', FS: 'REM-FS' };
export const MOVE_TH: Readonly<Record<'W' | 'C' | 'K' | 'FS', string>> = { W: 'ติดผนัง', C: 'แขวนใต้ฝ้า', K: 'สี่ทิศทาง', FS: 'ตู้ตั้งพื้น' };
/** The Pricebook's single relocation lines, replaced on the web by the per-size MOVE-{code}-{lo}-{hi} rows. */
export const MOVE_REPLACES: readonly string[] = ['MOVE-W', 'MOVE-C', 'MOVE-K'];

/** A visit with small work only (no cleaning, installation, repair or contract line): items count toward this minimum and
 *  the difference is charged as the visit charge. */
export const SMALL_VISIT = { minEx: 1000, th: 'ค่าเข้างานขั้นต่ำ (งานย่อย)' } as const;

export const RATE_SOURCES: readonly string[] = [
  'ราคาถอด / ย้ายแอร์ปี 2569 ของร้านแอร์ที่ประกาศบนเว็บ (ถอดแอร์ 9,000–18,000 BTU 800–1,500 · 18,000–24,000 BTU 1,000 · 20,000–36,000 BTU 1,200–2,500 · ย้ายพร้อมติดตั้ง 3,500–6,500)',
  'ร้านค้าปลีกวัสดุและเครื่องใช้ไฟฟ้า: ค่ารื้อแอร์ 750 บาทต่อชุด',
  'ค่าเจาะคอริ่งผนัง/พื้นคอนกรีต 3 นิ้ว 400 · 5 นิ้ว 600 บาทต่อจุด',
  'ค่าตรวจเช็กเมื่อไม่ซ่อม 300–1,000 บาท (หลายร้านไม่เก็บถ้าซ่อมต่อ)',
  'ตาราง Pricebook ของบริษัทเอง (ตารางซ่อม) สำหรับงานเดียวกันที่ตารางติดตั้งยังว่าง',
];
export const RATE_DATE = '5 ต.ค. 2569';
