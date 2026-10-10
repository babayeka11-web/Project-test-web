// /products/ — every air-conditioner model with price, search, filters, sort and compare.
import type { Metadata } from 'next';
import Link from 'next/link';
import { Accordion, Button, Card, CtaBand, Icon, Section, Stat, StatGroup, type IconName } from '@/components/ui';
import { Catalog } from '@/components/catalog/Catalog';
import { catalogForList } from '@/components/catalog/catalog-data';
import { seriesPath } from '@/components/catalog/slug';
import { INCLUDED_PIPE_M, INSTALL_WARRANTY } from '@/lib/domain/install';
import { COMPANY } from '@/lib/domain/company';
import { btuFmt, thousands } from '@/lib/domain/format';
import { getBrands, getSkuCount } from '@/lib/domain/pricebook';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { PageHeader } from '@/components/ui';

export const metadata: Metadata = {
  title: 'แอร์ทุกรุ่น พร้อมราคาและค่าติดตั้ง',
  description:
    'เลือกแอร์ใหม่ทุกยี่ห้อ ค้นหาตามยี่ห้อ ขนาด BTU และราคา เทียบได้สูงสุด 4 รุ่น ดูราคาเครื่องก่อน VAT พร้อมราคาติดตั้งมาตรฐานจากทีมช่างบริษัท',
  alternates: { canonical: './' },
};

export default function ProductsPage() {
  const { models, pool } = catalogForList();
  const brands = getBrands();
  const sold = brands.filter(b => !b.own && b.n > 0);
  const total = getSkuCount();

  const why: { icon: IconName; title: string; text: string }[] = [
    {
      icon: 'tag',
      title: 'ราคาเครื่องชัดเจน ก่อน VAT',
      text: 'ราคามาตรฐานจาก Pricebook 2569 ของบริษัท VAT 7% คิดครั้งเดียวที่ยอดรวมในใบเสนอราคา',
    },
    {
      icon: 'install',
      title: 'เลือกแพ็กเกจติดตั้งได้เลย',
      text: `มาตรฐานหรือพรีเมียม รวมท่อน้ำยา ${INCLUDED_PIPE_M} เมตรแรก ${INSTALL_WARRANTY.boughtHere}`,
    },
    {
      icon: 'shield',
      title: 'ยืนยันสต็อกก่อนสั่ง',
      text: 'ทีมขายตรวจสต็อกและระยะส่งให้ก่อนยืนยันใบเสนอราคา การใส่ใบเสนอราคายังไม่ใช่การจองเครื่อง',
    },
  ];

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'แอร์ทุกรุ่น' }]}
        eyebrow="ซื้อแอร์"
        title="แอร์ทุกรุ่น ดูราคาได้ทันที"
        lead={`${thousands(total)} รุ่นจาก ${sold.length} ยี่ห้อ ราคาเครื่องก่อน VAT พร้อมราคาติดตั้งมาตรฐาน เลือกขนาด เทียบรุ่น แล้วใส่ใบเสนอราคาได้เลย`}
        actions={
          <Button href="#catalog" variant="primary" icon="search">
            ค้นหารุ่น
          </Button>
        }
        aside={
          <Card padding="md">
            <StatGroup columns={3}>
              <Stat value={thousands(total)} label="รุ่น" />
              <Stat value={thousands(models.length)} label="ซีรีส์" />
              <Stat value={String(sold.length)} label="ยี่ห้อ" />
            </StatGroup>
            <p className="mt-4 flex items-start gap-2 text-small text-ink-2">
              <Icon name="info" size={18} className="mt-1 shrink-0 text-sky" />
              <span>ภาพในรายการเป็นภาพประกอบประเภทแอร์ ไม่ใช่ภาพเครื่องจริง</span>
            </p>
          </Card>
        }
      />

      <Section id="catalog" aria-labelledby="catalog-heading" spacing="compact" className="scroll-mt-header">
        <h2 id="catalog-heading" className="sr-only">
          ค้นหา กรอง และเทียบรุ่นแอร์
        </h2>
        <Catalog models={models} pool={pool} brands={brands} />
      </Section>

      <Section id="why" tone="soft" eyebrow="ซื้อกับเรา" title="ได้ทั้งเครื่องและงานติดตั้งจากบริษัทเดียว">
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {why.map(w => (
            <li key={w.title} className="flex">
              <Card className="flex w-full flex-col gap-4">
                <span className="grid size-12 place-items-center rounded-2xl bg-sky-soft text-brand">
                  <Icon name={w.icon} size={24} />
                </span>
                <h3 className="text-h3">{w.title}</h3>
                <p className="text-small text-ink-2">{w.text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="brands" eyebrow="ดูทั้งหมด" title="ซีรีส์แอร์ตามยี่ห้อ" lead="เปิดดูทีละยี่ห้อ แล้วเลือกซีรีส์เพื่อดูทุกขนาดและราคา" width="text">
        <Accordion
          items={sold.map(b => {
            const list = models.filter(m => m.brand === b.id);
            return {
              id: `brand-${b.id}`,
              title: (
                <span>
                  {b.name} <span className="text-small font-normal text-ink-3">· {list.length} ซีรีส์ · {thousands(b.n)} รุ่น</span>
                </span>
              ),
              content: (
                <ul className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
                  {list.map(m => (
                    <li key={m.slug}>
                      <Link href={seriesPath(m.slug)} className="flex min-h-11 flex-col justify-center py-1.5 text-ink no-underline hover:text-brand">
                        <span className="text-small font-medium">{m.series}</span>
                        <span className="text-meta text-ink-3">
                          {TYPE_BY_ID[m.type].th} · {btuFmt(m.skus[0].btu)}
                          {m.skus.length > 1 ? ` – ${btuFmt(m.skus[m.skus.length - 1].btu)}` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ),
            };
          })}
        />
      </Section>

      <CtaBand
        id="help"
        title="ไม่แน่ใจว่าควรเลือกกี่ BTU"
        lead="บอกขนาดห้องและการใช้งาน ทีมขายช่วยเลือกขนาดและรุ่นให้ หรือลองคำนวณเบื้องต้นเองก่อนก็ได้"
        actions={
          <>
            <Button href="/knowledge/" variant="primary" icon="thermometer">
              หาขนาด BTU ที่เหมาะ
            </Button>
            <Button href="/contact/?topic=buy" variant="secondary" icon="chat">
              คุยกับทีมขาย
            </Button>
          </>
        }
        aside={<p className="text-small">ทีมตอบในเวลาทำการ {COMPANY.hours}</p>}
      />
    </>
  );
}
