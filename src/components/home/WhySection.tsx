// Why SBP AirCare: six plain-language reasons, no invented figures. The warranty sentence comes from the installation module.
import { Badge, Icon, Section, type IconName } from '@/components/ui';
import { INSTALL_WARRANTY } from '@/lib/domain/install';

/** Keep a number and its unit on one line (Thai has no spaces to break at, so the browser may split "3 / ปี"). */
const nb = (t: string) => t.replace(/(\d) (ปี|กม\.|เครื่อง|รอบ|มม\.)/g, '$1\u00A0$2');

const MATERIALS = ['ท่อทองแดง O-TWO 0.70 มม.', 'ฉนวน Aeroflex', 'รางครอบท่อ Airpro', 'ท่อน้ำทิ้ง SCG', 'เบรกเกอร์ NANO'] as const;

const REASONS: { icon: IconName; title: string; text: string }[] = [
  {
    icon: 'users',
    title: 'ทีมช่างของบริษัท ไม่ใช่ช่างรับจ้างต่อ',
    text: 'งานทุกใบทำโดยทีมของบริษัทเอง ไม่ส่งต่อให้ช่างภายนอก ติดต่อกลับได้ที่เดียว',
  },
  {
    icon: 'document',
    title: 'ขั้นตอนตามแบบฟอร์มงานของบริษัท',
    text: 'ทุกงานทำตามขั้นตอนและแบบฟอร์มตรวจของบริษัท ผลงานจึงเท่ากันทุกครั้ง ไม่ขึ้นกับว่าวันนั้นใครมา',
  },
  {
    icon: 'shield',
    title: 'วัสดุระบุยี่ห้อและสเปก',
    text: 'ใบเสนอราคาบอกชนิดและขนาดวัสดุชัดเจน ไม่ต้องเดาว่าได้อะไรบ้าง',
  },
  {
    icon: 'camera',
    title: 'รายงานพร้อมภาพก่อน–หลัง',
    text: 'เลือกแพ็กเกจล้างพร้อมรายงานภาพ ได้รายงานรายเครื่องหลังจบงาน เก็บไว้ตรวจสอบย้อนหลังได้',
  },
  {
    icon: 'tag',
    title: 'ราคามาตรฐานจาก Pricebook ก่อนจอง',
    text: 'ดูราคาก่อน VAT บนเว็บได้ทุกรายการ เห็นค่าเดินทางและยอดรวมก่อนส่งใบเสนอราคา',
  },
  {
    icon: 'check',
    title: INSTALL_WARRANTY.boughtHere,
    text: `${INSTALL_WARRANTY.ownUnit} เงื่อนไขของแต่ละรายการแจ้งในใบเสนอราคา`,
  },
];

export function WhySection() {
  return (
    <Section
      id="why"
      tone="soft"
      eyebrow="ทำไมต้องเรา"
      title="งานแอร์ที่ตรวจสอบได้ ตั้งแต่ราคาจนถึงวันส่งมอบ"
      lead="เรื่องที่ลูกค้าถามบ่อยที่สุด คือใครมาทำ ทำอะไรบ้าง และราคาเท่าไร เราตอบทั้งสามข้อไว้ก่อนจอง"
    >
      <ul className="grid grid-cols-1 gap-x-10 gap-y-9 md:grid-cols-2 lg:grid-cols-3">
        {REASONS.map((r) => (
          <li key={r.title} className="flex gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
              <Icon name={r.icon} size={24} />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <h3 className="text-h3">{nb(r.title)}</h3>
              <p className="text-small text-ink-2">{r.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-12 flex flex-col gap-3 rounded-card border border-line bg-surface p-5 shadow-card sm:p-6">
        <p className="text-small font-semibold text-ink">วัสดุที่ระบุยี่ห้อและสเปกในใบเสนอราคา</p>
        <ul className="flex flex-wrap gap-2">
          {MATERIALS.map((m) => (
            <li key={m}>
              <Badge tone="outline" size="md">
                {m}
              </Badge>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
