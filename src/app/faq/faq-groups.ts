// Groups the 10 company FAQ answers (getFaq, every number filled from the Pricebook) and adds a few more answers that come
// straight from domain constants. Server / build time only (the page passes getFaq() in).
import { COMPANY } from '@/lib/domain/company';
import { JOB_TIME, TIME_NOTE, timeTh } from '@/lib/domain/content';
import { INCLUDED_PIPE_M, INSTALL_WARRANTY } from '@/lib/domain/install';

export type FaqEntry = { q: string; a: string };
export type FaqGroup = { id: string; th: string; hint: string; items: FaqEntry[] };

const GROUPS: { id: string; th: string; hint: string; match?: RegExp }[] = [
  { id: 'booking', th: 'การจอง', hint: 'ล่วงหน้ากี่วัน คิวด่วน', match: /ล่วงหน้า|คิวด่วน/ },
  { id: 'price', th: 'ราคา', hint: 'VAT ยอดขั้นต่ำ ประเมินหน้างาน', match: /VAT|ประเมินหน้างาน|ยอดขั้นต่ำ|ค่าเข้างาน/ },
  { id: 'area', th: 'พื้นที่', hint: 'พื้นที่ให้บริการและค่าเดินทาง', match: /พื้นที่ให้บริการ|ค่าเดินทาง/ },
  { id: 'install', th: 'งานติดตั้ง', hint: 'สิ่งที่รวม รื้อ ย้าย รับประกัน', match: /ติดตั้ง|รื้อ|ย้าย/ },
  { id: 'business', th: 'องค์กร', hint: 'สัญญารายปี VRV / VRF เอกสาร', match: /สัญญา|VRV|VRF/ },
  { id: 'other', th: 'อื่น ๆ', hint: 'เวลาทำงาน ช่องทางติดต่อ' },
];

/** Extra answers, written from the domain constants (never typed numbers). */
const EXTRA: { group: string; q: string; a: string }[] = [
  {
    group: 'install',
    q: 'รับประกันงานติดตั้งกี่ปี',
    a: `${INSTALL_WARRANTY.boughtHere} · ${INSTALL_WARRANTY.ownUnit} ตามเงื่อนไขในใบเสนอราคา ราคาติดตั้งรวมท่อน้ำยาและวัสดุ ${INCLUDED_PIPE_M} เมตรแรก`,
  },
  {
    group: 'install',
    q: 'วัสดุติดตั้งที่ใช้เป็นแบบไหน',
    a: 'ท่อน้ำยาทองแดง O-TWO หนา 0.70 มม. ฉนวน Aeroflex ราง Airpro สายไฟ Yazaki ท่อน้ำทิ้ง SCG ระบุยี่ห้อในใบเสนอราคาทุกครั้ง ดูรายการเปรียบเทียบได้ในหน้าติดตั้งแอร์',
  },
  {
    group: 'other',
    q: 'ล้างแอร์ใช้เวลานานแค่ไหน',
    a: `แอร์ติดผนัง ล้างปกติประมาณ ${timeTh(JOB_TIME.C1.wall!)} ต่อเครื่อง ล้างใหญ่ประมาณ ${timeTh(JOB_TIME.C2.wall!)} ต่อเครื่อง ${TIME_NOTE}`,
  },
  {
    group: 'other',
    q: 'เปิดให้บริการวันไหน',
    a: `${COMPANY.hours} ${COMPANY.hoursNote} ติดต่อได้ที่ ${COMPANY.tel} หรือ LINE ${COMPANY.line}`,
  },
  {
    group: 'business',
    q: 'ออกใบกำกับภาษีได้ไหม',
    a: 'ออกใบกำกับภาษีเต็มรูปได้ ใบเสนอราคาแยกรายการ ระบุสิ่งที่รวมและไม่รวม ส่วนงานที่ต้องมีรายงานหลังบริการ ดูแพ็กเกจล้างได้ในหน้าองค์กร',
  },
  {
    group: 'other',
    q: 'แอร์ FUJIVA ราคาเท่าไร',
    a: 'FUJIVA เป็นแบรนด์ของบริษัท ยังไม่มีราคามาตรฐานบนเว็บ สอบถามราคากับทีมขายทางโทร LINE หรือหน้าติดต่อเรา',
  },
  {
    group: 'other',
    q: 'ส่งคำขอบนเว็บแล้ว ทีมได้รับทันทีไหม',
    a: 'เว็บสรุปคำขอให้พร้อมเลขอ้างอิง แล้วช่วยส่งทาง LINE คัดลอก โทร หรืออีเมล เว็บจะแจ้งว่า “ส่งถึงทีมแล้ว” เฉพาะเมื่อระบบรับคำขอจริง ถ้าไม่ได้ ให้ส่งสรุปทาง LINE หรือโทรหาทีม',
  },
];

export function groupFaq(base: readonly FaqEntry[]): FaqGroup[] {
  const groups: FaqGroup[] = GROUPS.map(g => ({ id: g.id, th: g.th, hint: g.hint, items: [] }));
  const by = (id: string) => groups.find(g => g.id === id) as FaqGroup;
  for (const f of base) {
    const g = GROUPS.find(x => x.match?.test(f.q)) ?? GROUPS[GROUPS.length - 1];
    by(g.id).items.push(f);
  }
  for (const e of EXTRA) by(e.group).items.push({ q: e.q, a: e.a });
  return groups.filter(g => g.items.length > 0);
}
