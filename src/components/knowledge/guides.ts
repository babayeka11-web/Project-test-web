// The 12 short guides of /knowledge/ ("ศึกษาก่อน ลองเอง"), ported from the reference knowledge.js. Client-safe: only domain
// constants are imported (never the Pricebook), and every number in the text is read from the same constants the tools use,
// so a guide can never disagree with the calculator or the price page next to it.
// Wording follows the banned-claims list (ARCHITECTURE §6.11). General information to help a decision — the crew confirms
// on site and against the real model.
import type { IconName } from '@/components/ui';
import { recommendBtu } from '@/lib/domain/btu';
import { METHOD_INFO, PKG_INFO } from '@/lib/domain/cleaning';
import { MIN_BILL, NOTES } from '@/lib/domain/constants';
import { PRICING } from '@/lib/domain/contract';
import { VRF_NOTE } from '@/lib/domain/content';
import { baht, btuFmt } from '@/lib/domain/format';
import { INCLUDED_PIPE_M, INSTALL_WARRANTY } from '@/lib/domain/install';
import { TRAVEL } from '@/lib/domain/travel';

export type Audience = 'home' | 'biz' | 'all';

export type Block =
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  | { t: 'example'; title: string; text: string }
  | { t: 'pkg'; code: string; title: string; fit: string; items: string[]; care: string };

export type Guide = {
  slug: string;
  aud: Audience;
  th: string;
  lead: string;
  /** reading time, minutes */
  min: number;
  icon: IconName;
  body: Block[];
  /** "ลองเอง": the tool or page where the reader can try it */
  tries: { label: string; href: string }[];
};

export const AUDIENCES: readonly { id: 'all' | 'home' | 'biz'; th: string }[] = [
  { id: 'all', th: 'ทั้งหมด' },
  { id: 'home', th: 'บ้าน · คอนโด' },
  { id: 'biz', th: 'องค์กร · อาคาร' },
];

export const audienceTh = (a: Audience) => (a === 'biz' ? 'องค์กร · อาคาร' : a === 'home' ? 'บ้าน · คอนโด' : 'ทุกคน');

/** Typical airflow reach and clearances (reference roomfit FIT_RULES — general values, the real model's manual decides). */
const FIT = {
  wall: { throw: 6.5, topCm: 10, sideCm: 15, bestBottom: [2.0, 2.5] as const },
  ceiling: { throw: 10 },
  cassette: { throw: 4.2, wallCm: 100 },
} as const;

// the quick sizing rule, read back from recommendBtu so the text can never drift from it
const perM2 = ([0, 1, 2] as const).map(sun => recommendBtu({ w: 10, d: 1, sun, people: 2 }).btu / 10);
const perPerson = recommendBtu({ w: 1, d: 1, people: 3 }).btu - recommendBtu({ w: 1, d: 1, people: 2 }).btu;
const example = recommendBtu({ w: 4, d: 3.5, h: 2.6, sun: 1, people: 2 });

const p = (text: string): Block => ({ t: 'p', text });
const ul = (...items: string[]): Block => ({ t: 'ul', items });

export const GUIDES: readonly Guide[] = [
  {
    slug: 'btu',
    aud: 'home',
    th: 'เลือก BTU ให้พอดีห้อง',
    lead: 'พื้นที่ แดด จำนวนคน และความสูงฝ้า กำหนดขนาดเครื่อง',
    min: 2,
    icon: 'thermometer',
    body: [
      p('สูตรเบื้องต้นสำหรับห้องทั่วไป:'),
      ul(
        `พื้นที่ห้อง (ตร.ม.) × ${perM2[0]} BTU เมื่อแดดน้อย · ${perM2[1]} ปานกลาง · ${perM2[2]} แดดจัดหรือห้องใต้หลังคา`,
        `คนเกิน 2 คน เพิ่มราว ${perPerson} BTU ต่อคน`,
        'ฝ้าสูงกว่า 2.7 ม. เพิ่มตามสัดส่วนความสูง',
      ),
      { t: 'example', title: 'ตัวอย่าง', text: `ห้อง 4 × 3.5 ม. แดดปานกลาง 2 คน ต้องการประมาณ ${btuFmt(example.btu)} จึงเลือกเครื่องขนาด ${btuFmt(example.pick)}` },
      p('เครื่องเล็กไปจะเย็นช้าและทำงานหนักตลอด ส่วนเครื่องธรรมดาที่ใหญ่ไปจะตัดบ่อย ห้องเย็นแต่ความชื้นค้าง ห้องที่มีกระจกมาก ครัว ห้องเซิร์ฟเวอร์ หรือมีเครื่องจักร ทีมจะคำนวณจากหน้างานจริง'),
      p('เครื่องคำนวณด้านบนใช้แบบจำลองละเอียดกว่าสูตรเบื้องต้น (ตามประเภทห้อง ทิศแดด หน้าต่าง และอุปกรณ์) ผลจึงอาจต่างจากสูตรนี้เล็กน้อย'),
    ],
    tries: [
      { label: 'คำนวณ BTU ห้องของคุณ', href: '/knowledge/#btu' },
      { label: 'ดูแอร์ตามขนาด', href: '/products/' },
    ],
  },
  {
    slug: 'types',
    aud: 'all',
    th: 'แอร์ 4 ประเภท ต่างกันอย่างไร',
    lead: 'ติดผนัง แขวน สี่ทิศทาง ตู้ตั้ง เหมาะกับห้องแบบไหน',
    min: 3,
    icon: 'ac',
    body: [
      ul(
        `ติดผนัง — ห้องนอน ห้องนั่งเล่น ห้องทำงาน ลมไปได้ราว ${FIT.wall.throw} ม. ติดตั้งง่าย ราคาเริ่มต้นต่ำสุด`,
        `แขวนใต้ฝ้า — ห้องยาว ร้านค้า สำนักงาน ลมเกาะแนวฝ้าไปได้ราว ${FIT.ceiling.throw} ม.`,
        `สี่ทิศทาง (ฝังฝ้า) — กลางห้อง ร้านอาหาร โถง ลมออก 4 ทิศ รัศมีราว ${FIT.cassette.throw} ม. ต้องมีช่องเหนือฝ้าให้ตัวเครื่อง`,
        'ตู้ตั้งพื้น — พื้นที่ใหญ่ที่เจาะฝ้าไม่ได้ ห้องประชุม โชว์รูม',
      ),
      p('ระยะลมเป็นค่าทั่วไปของแต่ละประเภท รุ่นจริงต่างกันได้ ส่วนระบบ VRV / VRF ที่ต่อคอยล์เย็นหลายตัวเข้าคอยล์ร้อนชุดเดียวเป็นงานโครงการ ติดต่อทีมแยก'),
    ],
    tries: [
      { label: 'ดูแอร์ทุกรุ่น', href: '/products/' },
      { label: 'คำนวณ BTU ห้องของคุณ', href: '/knowledge/#btu' },
    ],
  },
  {
    slug: 'inverter',
    aud: 'home',
    th: 'อินเวอร์เตอร์ กับ ระบบธรรมดา',
    lead: 'ต่างกันที่การปรับรอบคอมเพรสเซอร์',
    min: 2,
    icon: 'bolt',
    body: [
      ul(
        'อินเวอร์เตอร์ปรับรอบคอมเพรสเซอร์ตามความร้อนในห้อง เมื่อห้องเย็นแล้วจะเบาลง อุณหภูมินิ่งกว่า ไม่ตัด–ต่อบ่อย',
        'ระบบธรรมดา (Fixed speed) ทำงานเต็มกำลังแล้วตัด ราคาเครื่องต่ำกว่า เหมาะห้องที่เปิดไม่กี่ชั่วโมงต่อวัน',
      ),
      p('ห้องที่เปิดนานหลายชั่วโมงต่อวัน รุ่นอินเวอร์เตอร์มักใช้ไฟรวมน้อยกว่า ผลจริงขึ้นกับรุ่น การใช้งาน และการล้างตามรอบ'),
    ],
    tries: [
      { label: 'ดูรุ่นอินเวอร์เตอร์', href: '/products/?inv=inv' },
      { label: 'ดูรุ่นระบบธรรมดา', href: '/products/?inv=fix' },
    ],
  },
  {
    slug: 'clean',
    aud: 'all',
    th: 'ควรล้างแอร์บ่อยแค่ไหน',
    lead: 'รอบล้างตามประเภทห้อง และสัญญาณว่าถึงรอบแล้ว',
    min: 2,
    icon: 'clean',
    body: [
      p('รอบที่แนะนำตามแนวปฏิบัติทั่วไป:'),
      ul('บ้าน 6 เดือน (ห้องนั่งเล่นที่เปิดทั้งวัน 4 เดือน)', 'สำนักงาน คลินิก ร้านค้า 3 เดือน', 'ครัว ร้านอาหาร โรงงาน คลังสินค้า 2 เดือน', 'ห้อง Server 6 เดือน'),
      p('สัญญาณว่าถึงรอบ: ลมเบาลง เย็นช้า มีกลิ่นอับ น้ำหยด หรือเสียงดังขึ้น แผ่นกรองล้างเองได้ทุก 2–4 สัปดาห์ แต่ไม่ควรฉีดน้ำแรงดันเอง เพราะแผงวงจรต้องคลุมกันน้ำก่อนทุกครั้ง'),
    ],
    tries: [
      { label: 'จองล้างแอร์', href: '/cleaning/#book' },
      { label: 'ราคาล้างทุกประเภท', href: '/prices/?tab=clean#price-list' },
    ],
  },
  {
    slug: 'c1c2',
    aud: 'all',
    th: 'ล้างปกติ (C1) กับ ล้างใหญ่ (C2)',
    lead: 'ต่างกันที่การปลดเครื่องและชิ้นส่วนที่ถอดล้าง',
    min: 2,
    icon: 'droplet',
    body: [
      ul(...METHOD_INFO.filter(m => m.id !== 'C3').map(m => `${m.th} — ${m.d}`)),
      p('เลือกล้างใหญ่เมื่อเห็นคราบดำที่ใบพัด กลิ่นอับไม่หายหลังล้างปกติ หรือไม่ได้ล้างมานาน ทุกงานเรียงตามแบบฟอร์มรายงานของบริษัท และแจ้งราคาก่อนเริ่มงาน'),
    ],
    tries: [
      { label: 'ดูขั้นตอนของทีมช่างล้าง', href: '/cleaning/' },
      { label: 'ราคาล้างทุกประเภท', href: '/prices/?tab=clean#price-list' },
    ],
  },
  {
    slug: 'install',
    aud: 'all',
    th: 'ติดตั้งมาตรฐานของเรารวมอะไร',
    lead: 'ระยะท่อที่รวม วัสดุที่ระบุยี่ห้อ และการทดสอบก่อนส่งมอบ',
    min: 3,
    icon: 'install',
    body: [
      ul(
        `รวมท่อน้ำยาและวัสดุ ${INCLUDED_PIPE_M} เมตรแรก ท่อน้ำทิ้ง สายไฟตามระยะที่ระบุ เบรกเกอร์ ขาแขวน`,
        'วัสดุ: ท่อทองแดง O-TWO หนา 0.70 มม. · ฉนวน Aeroflex · ราง Airpro · สายไฟ Yazaki · ท่อน้ำทิ้ง SCG · เบรกเกอร์กันดูด NANO RCBO',
        'ก่อนส่งมอบ: Vacuum ไล่ความชื้นในท่อ ตรวจรอยต่อ ทดสอบน้ำทิ้ง วัดกระแสและแรงดันไฟ Test Run และใบรับมอบงาน',
        `${INSTALL_WARRANTY.boughtHere} · ${INSTALL_WARRANTY.ownUnit} ตามเงื่อนไขในใบเสนอราคา`,
      ),
      p('ส่วนที่เกินจากที่รวม เช่น ท่อยาวขึ้น ปั๊มน้ำทิ้ง งานสูง เลือกเพิ่มได้ในหน้าสินค้า รายการที่ขึ้นกับหน้างานจริงจะแจ้งราคาก่อนเริ่มงาน'),
    ],
    tries: [
      { label: 'ดูรายละเอียดงานติดตั้ง', href: '/installation/' },
      { label: 'ราคาติดตั้งและวัสดุ', href: '/prices/?tab=install#price-list' },
    ],
  },
  {
    slug: 'place',
    aud: 'home',
    th: 'ตำแหน่งติดตั้งที่ดี',
    lead: 'ระยะห่างฝ้า ผนัง ความสูง และที่วางคอยล์ร้อน',
    min: 2,
    icon: 'pin',
    body: [
      ul(
        `แอร์ติดผนัง: เว้นห่างฝ้าอย่างน้อย ${FIT.wall.topCm} ซม. ซ้าย–ขวา ${FIT.wall.sideCm} ซม. ใต้เครื่องสูงจากพื้นราว ${FIT.wall.bestBottom[0].toFixed(1)}–${FIT.wall.bestBottom[1].toFixed(1)} ม.`,
        'ห้องยาว ติดเครื่องที่ผนังด้านแคบเพื่อให้ลมพุ่งตามความยาวห้อง และไม่เป่าตรงหัวเตียงหรือโต๊ะทำงาน',
        `สี่ทิศทาง: ขอบหน้ากากห่างผนังอย่างน้อย ${FIT.cassette.wallCm} ซม. ทุกด้าน`,
        `คอยล์ร้อน: วางที่ระบายอากาศดี ไม่อับ ใกล้ตัวเครื่องเพื่อให้ท่อสั้น (ราคารวมท่อ ${INCLUDED_PIPE_M} เมตรแรก)`,
      ),
      p('ค่าเหล่านี้เป็นค่าแนะนำทั่วไป ทีมช่างยืนยันตามคู่มือของรุ่นจริงตอนสำรวจ'),
    ],
    tries: [
      { label: 'ดูรายละเอียดงานติดตั้ง', href: '/installation/' },
      { label: 'คำนวณ BTU ห้องของคุณ', href: '/knowledge/#btu' },
    ],
  },
  {
    slug: 'contract',
    aud: 'biz',
    th: 'สัญญาล้างรายปีสำหรับองค์กร',
    lead: 'วางรอบทั้งปี รายงานทุกรอบ วางบิลตามรอบ',
    min: 2,
    icon: 'calendar',
    body: [
      ul(
        'ทีมวางรอบล่วงหน้าทั้งปี ส่งรายงานตามแพ็กเกจหลังทุกรอบ และวางบิลตามรอบ',
        `ราคาบนเว็บเป็นอัตรามาตรฐานต่อเครื่องต่อครั้ง ${NOTES.volume}`,
        `งานล้างมียอดขั้นต่ำต่อการเข้าหน้างาน ${baht(MIN_BILL)} ก่อน VAT ต่ำกว่านี้คิดค่าเดินทาง ${baht(TRAVEL.baseFee)} ต่อการเข้างาน`,
        `กำลังทีมต่อวันตามคู่มือบริษัท: ติดผนังราว ${PRICING.unitsPerTeamDay.wall} เครื่อง · แขวน / สี่ทิศทางราว ${PRICING.unitsPerTeamDay.cassette} เครื่อง ต่อทีม-วัน`,
      ),
    ],
    tries: [{ label: 'คำนวณงบทั้งปี', href: '/business/' }],
  },
  {
    slug: 'packages',
    aud: 'biz',
    th: 'แพ็กเกจล้าง 3 ระดับ ต่างกันอย่างไร',
    lead: 'เอกสาร ภาพ ค่าตรวจวัด และระยะรับประกันงานล้าง',
    min: 3,
    icon: 'document',
    body: PKG_INFO.map(k => ({ t: 'pkg' as const, code: k.code, title: `${k.id} · ${k.pitch}`, fit: k.fit, items: k.gets, care: k.care })),
    tries: [
      { label: 'เทียบราคาแพ็กเกจ', href: '/prices/?tab=clean#price-list' },
      { label: 'คำนวณงบทั้งปี', href: '/business/' },
    ],
  },
  {
    slug: 'docs',
    aud: 'biz',
    th: 'เอกสารที่องค์กรได้รับ',
    lead: 'สำหรับฝ่ายอาคาร จัดซื้อ และบัญชี',
    min: 1,
    icon: 'document',
    body: [
      ul(
        'ใบเสนอราคาแยกรายการ ระบุยี่ห้อและสเปกวัสดุ สิ่งที่รวมและไม่รวม',
        'ใบกำกับภาษีเต็มรูป',
        'รายงานหลังงานตามแพ็กเกจ: ใบรับมอบงาน · Service Report พร้อมภาพ · ทะเบียนทรัพย์สินรายเครื่อง',
        'งานติดตั้ง: ใบรับมอบงาน ค่าหลังติดตั้ง และเงื่อนไขรับประกัน',
      ),
    ],
    tries: [
      { label: 'ขอใบเสนอราคา', href: '/quote/' },
      { label: 'ดูหน้าองค์กร', href: '/business/' },
    ],
  },
  {
    slug: 'vrf',
    aud: 'biz',
    th: 'ระบบ VRV / VRF',
    lead: 'งานโครงการแยก ออกแบบตามอาคารจริง',
    min: 1,
    icon: 'building',
    body: [p(VRF_NOTE), p('ล้างและติดตั้งแอร์ทุกประเภทอื่นมีราคามาตรฐานบนเว็บ ส่วน VRV / VRF ทีมโครงการจะสำรวจ ออกแบบท่อและคอนโทรล แล้วทำ BOQ ให้')],
    tries: [{ label: 'ติดต่อสอบถาม VRV / VRF', href: '/contact/?topic=vrf' }],
  },
  {
    slug: 'area',
    aud: 'all',
    th: 'พื้นที่บริการและค่าเดินทาง',
    lead: `กรุงเทพฯ ในระยะ ${TRAVEL.freeKm} กม. จากพระราม 2 เป็นพื้นที่หลัก`,
    min: 1,
    icon: 'truck',
    body: [
      ul(
        `พื้นที่หลัก: กรุงเทพฯ ในระยะถนน ${TRAVEL.freeKm} กม. จากสำนักงานใหญ่ ไม่มีค่าเดินทางเมื่อยอดงานล้างถึง ${baht(MIN_BILL)} ก่อน VAT`,
        `งานล้างที่ยอดต่ำกว่า ${baht(MIN_BILL)} คิดค่าเดินทาง ${baht(TRAVEL.baseFee)} ต่อการเข้างาน`,
        `นอกพื้นที่หลัก (ไม่เกิน ${TRAVEL.maxKm} กม.): ${baht(TRAVEL.baseFee)} + ${baht(TRAVEL.perKm)} ต่อกิโลเมตรที่เกิน ${TRAVEL.freeKm} กม. ต่อเที่ยว ก่อน VAT ปัดขึ้นหลักร้อย`,
        `ไกลกว่า ${TRAVEL.maxKm} กม. รับเป็นงานโครงการหรือสัญญา`,
      ),
    ],
    tries: [{ label: 'เช็กพื้นที่ของคุณ', href: '/area/' }],
  },
];

export const guideBySlug = (slug: string): Guide | undefined => GUIDES.find(g => g.slug === slug);
