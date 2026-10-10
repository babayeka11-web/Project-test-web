import type { Metadata } from 'next';
import Link from 'next/link';
import { Button, Card, CtaBand, Icon, PageHeader, Price, Section } from '@/components/ui';
import { buildPriceData } from '@/components/prices/build';
import { PriceCenter } from '@/components/prices/PriceCenter';
import { RuleCards } from '@/components/prices/RuleCards';
import { COMPANY } from '@/lib/domain/company';
import { NOTES } from '@/lib/domain/constants';
import { cleanFrom, serviceFrom } from '@/lib/domain/pricebook';

export const metadata: Metadata = {
  title: 'ค่าบริการทั้งหมด',
  description:
    'ราคามาตรฐานก่อน VAT ของงานล้าง ติดตั้ง ซ่อม รื้อ ย้ายแอร์ วัสดุและอุปกรณ์ ค้นหาได้ทุกรายการ ดูสิ่งที่รวมและไม่รวม แล้วใส่ใบเสนอราคาได้ทันที',
  alternates: { canonical: './' },
};

export default function PricesPage() {
  const data = buildPriceData();
  const from = serviceFrom();
  const start = cleanFrom();
  const quickLinks = [
    { href: '/prices/?tab=clean#price-list', label: 'ล้างแอร์', amount: start, icon: 'clean' as const },
    { href: '/prices/?tab=install#price-list', label: 'ติดตั้ง', amount: from.install, icon: 'install' as const },
    { href: '/prices/?tab=repair#price-list', label: 'ตรวจซ่อม', amount: from.repair, icon: 'repair' as const },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ค่าบริการทั้งหมด' }]}
        eyebrow="ค่าบริการ"
        title="ค่าบริการทั้งหมด ดูได้ทุกรายการ"
        lead="ล้าง ติดตั้ง ซ่อม รื้อ ย้าย และวัสดุ ราคามาตรฐานก่อน VAT ค้นหาได้ ดูสิ่งที่รวมและไม่รวม แล้วใส่ใบเสนอราคาเพื่อให้ทีมยืนยัน"
        actions={
          <>
            <Button href="#price-list" variant="secondary" icon="search">
              ค้นหาราคา
            </Button>
            <Button href="/quote/" variant="ghost" icon="quote">
              ใบเสนอราคาของฉัน
            </Button>
          </>
        }
        meta={NOTES.source}
        aside={
          <Card padding="md">
            <p className="text-small font-semibold text-ink">ราคาเริ่มต้นต่อเครื่อง</p>
            <ul className="mt-3 divide-y divide-line">
              {quickLinks.map(q => (
                <li key={q.label}>
                  <Link href={q.href} className="group flex min-h-14 items-center justify-between gap-3 py-2 text-ink no-underline">
                    <span className="flex items-center gap-3">
                      <span className="grid size-10 place-items-center rounded-xl bg-sky-soft text-brand">
                        <Icon name={q.icon} size={20} />
                      </span>
                      <span className="font-semibold group-hover:text-brand">{q.label}</span>
                    </span>
                    <Price amount={q.amount} prefix="เริ่ม" size="sm" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-meta text-ink-3">VAT 7% คิดครั้งเดียวที่ยอดรวมของใบเสนอราคา</p>
          </Card>
        }
      />

      <Section id="rules" eyebrow="ก่อนดูราคา" title="4 ข้อที่ใช้กับทุกใบเสนอราคา" lead="ราคาแต่ละรายการอยู่ในตารางด้านล่าง ส่วนค่าใช้จ่ายของการเข้าหน้างานคิดตามกติกาเหล่านี้">
        <RuleCards />
      </Section>

      <Section id="price-list" tone="soft" eyebrow="รายการราคา" title="ค้นหาและเลือกรายการ" lead="เลือกหมวด หรือพิมพ์ค้นหาข้ามทุกหมวด ปุ่ม ‘ใส่ใบเสนอราคา’ เก็บรายการไว้ให้ทีมตรวจและยืนยันราคา">
        <PriceCenter rows={data.rows} pool={data.pool} />
      </Section>

      <CtaBand
        title="ไม่แน่ใจว่าต้องใช้รายการไหน"
        lead="ส่งรายการที่เลือกให้ทีมตรวจ หรือเล่าอาการ ขนาดห้อง และที่อยู่ ทีมช่วยเลือกให้ในใบเสนอราคา"
        actions={
          <>
            <Button href="/quote/" variant="primary" size="lg" icon="quote">
              ดูใบเสนอราคา
            </Button>
            <Button href="/contact/" variant="secondary" size="lg" icon="chat">
              คุยกับทีมงาน
            </Button>
          </>
        }
        aside={
          <ul className="space-y-1 text-small">
            <li>{COMPANY.hours}</li>
            <li>โทร {COMPANY.tel}</li>
          </ul>
        }
      />
    </>
  );
}
