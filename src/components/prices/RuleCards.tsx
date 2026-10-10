// Four short rules that apply to every quotation, shown above the price list. Every number comes from the domain constants.
import { Card, Icon, Price, type IconName } from '@/components/ui';
import Link from 'next/link';
import { MIN_BILL, QUEUE_RULES } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { SMALL_VISIT } from '@/lib/domain/rates';
import { TRAVEL } from '@/lib/domain/travel';

type Rule = { icon: IconName; title: string; price: React.ReactNode; text: string; link?: { href: string; label: string } };

const RULES: Rule[] = [
  {
    icon: 'tag',
    title: 'ยอดขั้นต่ำงานล้าง',
    price: <Price amount={MIN_BILL} unit="/ การเข้างาน" size="lg" tone="brand" />,
    text: `ถ้ายอดงานล้างต่ำกว่านี้ คิดค่าเดินทาง ${baht(TRAVEL.baseFee)} ต่อการเข้างานแทน`,
  },
  {
    icon: 'truck',
    title: 'ค่าเดินทาง',
    price: <span className="font-display text-[1.75rem] font-bold leading-tight text-brand">ไม่มี ในพื้นที่หลัก</span>,
    text: `กรุงเทพฯ ในระยะ ${TRAVEL.freeKm} กม. จากสำนักงานใหญ่ เมื่อยอดล้างถึงขั้นต่ำ ไกลกว่านั้น ${baht(TRAVEL.baseFee)} + ${baht(TRAVEL.perKm)} ต่อ กม. ที่เกิน ${TRAVEL.freeKm} กม. ก่อน VAT ปัดขึ้นหลักร้อย`,
    link: { href: '/area/', label: 'เช็กพื้นที่ของคุณ' },
  },
  {
    icon: 'clock',
    title: 'คิวด่วน',
    price: <Price amount={QUEUE_RULES.rushFeeEx} prefix="เพิ่ม" unit="/ การเข้างาน" size="lg" tone="brand" />,
    text: `จองปกติล่วงหน้า ${QUEUE_RULES.leadDays} วัน เร็วกว่านั้นเลือกคิวด่วน รับเมื่อมีทีมว่างเท่านั้น ทีมยืนยันคิวก่อนทุกครั้ง`,
  },
  {
    icon: 'install',
    title: 'ค่าเข้างานของงานย่อย',
    price: <Price amount={SMALL_VISIT.minEx} unit="/ การเข้างาน" size="lg" tone="brand" />,
    text: 'ใช้เมื่อมีแต่งานย่อย ไม่มีล้าง ติดตั้ง หรือตรวจซ่อมในวันเดียวกัน รายการที่ทำนับรวมในยอดนี้ ส่วนที่ขาดคิดเป็นค่าเข้างาน',
  },
];

export function RuleCards() {
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
      {RULES.map(r => (
        <li key={r.title} className="flex">
          <Card padding="md" className="flex w-full flex-col gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-sky-soft text-brand">
              <Icon name={r.icon} size={24} />
            </span>
            <h3 className="text-h3">{r.title}</h3>
            <div>{r.price}</div>
            <p className="text-small text-ink-2">{r.text}</p>
            {r.link && (
              <Link href={r.link.href} className="mt-auto inline-flex min-h-11 items-center gap-1.5 text-small font-semibold text-brand hover:underline">
                {r.link.label}
                <Icon name="arrow-right" size={16} strokeWidth={2.25} />
              </Link>
            )}
          </Card>
        </li>
      ))}
    </ul>
  );
}
