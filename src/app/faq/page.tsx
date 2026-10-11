import type { Metadata } from 'next';
import Link from 'next/link';
import { Accordion, Button, Card, CtaBand, Icon, PageHeader, Section, type IconName } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { getFaq } from '@/lib/domain/pricebook';
import { groupFaq } from './faq-groups';

export const metadata: Metadata = {
  title: 'คำถามที่พบบ่อย เรื่องล้าง ติดตั้ง และค่าเดินทาง',
  description: 'ตอบเรื่องการจอง คิวด่วน ราคาก่อน VAT ยอดขั้นต่ำ ค่าเดินทาง งานติดตั้ง รื้อ ย้ายแอร์ และสัญญารายปี จากทีมช่างของสหบูรพากรุ๊ป',
  alternates: { canonical: './' },
};

const RELATED: { href: string; icon: IconName; title: string; text: string }[] = [
  { href: '/prices/', icon: 'tag', title: 'ค่าบริการทั้งหมด', text: 'ค้นหาราคาทุกรายการ ดูสิ่งที่รวมและไม่รวม' },
  { href: '/area/', icon: 'pin', title: 'พื้นที่ให้บริการ', text: 'พิมพ์ที่อยู่เพื่อดูค่าเดินทางของงานคุณ' },
  { href: '/knowledge/', icon: 'sparkle', title: 'ความรู้ก่อนเลือกแอร์', text: 'คู่มือสั้นและเครื่องคำนวณ BTU' },
];

export default function FaqPage() {
  const groups = groupFaq(getFaq());
  const all = groups.flatMap(g => g.items);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: all.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'คำถามที่พบบ่อย' }]}
        eyebrow="คำถามที่พบบ่อย"
        title="ถามบ่อยก่อนจองงาน"
        lead="คำตอบเรื่องการจอง ราคา ค่าเดินทาง และงานติดตั้ง ตัวเลขทุกตัวมาจากราคามาตรฐานของบริษัท ถ้าไม่เจอคำตอบ ถามทีมได้เลย"
        actions={
          <Button href="/contact/" variant="secondary" icon="chat">
            ถามทีมงาน
          </Button>
        }
        meta={`${all.length} คำถาม · ราคาทั้งหมดก่อน VAT`}
      />

      <Section id="questions" title="เลือกหัวข้อที่อยากรู้">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="หัวข้อคำถาม" className="lg:sticky lg:top-28 lg:self-start">
            {/* phones and tablets: the topics wrap, so none hides off-screen in a side-scroller */}
            <ul className="flex flex-wrap gap-2 lg:flex-col lg:flex-nowrap lg:gap-1">
              {groups.map(g => (
                <li key={g.id} className="shrink-0">
                  <a
                    href={`#${g.id}`}
                    className="pressable flex min-h-11 items-center gap-2 rounded-full border border-line-strong/40 bg-surface px-4 text-small font-semibold text-ink-2 no-underline hover:border-brand hover:text-brand lg:rounded-control lg:border-transparent lg:bg-transparent lg:px-3"
                  >
                    {g.th}
                    <span className="text-meta font-normal text-ink-3">{g.items.length}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="flex min-w-0 flex-col gap-10">
            {groups.map(g => (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-title`} className="scroll-mt-header">
                <div className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <h3 id={`${g.id}-title`} className="text-h3">
                    {g.th}
                  </h3>
                  <p className="text-small text-ink-3">{g.hint}</p>
                </div>
                <Card padding="none" className="px-5 sm:px-7">
                  <Accordion items={g.items.map(f => ({ title: f.q, content: <p className="text-body text-ink-2">{f.a}</p> }))} />
                </Card>
              </section>
            ))}
          </div>
        </div>
      </Section>

      <Section id="related" tone="soft" title="อ่านต่อ" lead="หน้าที่ตอบเรื่องราคาและพื้นที่ได้ละเอียดกว่า">
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {RELATED.map(r => (
            <li key={r.href} className="flex">
              <Card href={r.href} className="flex w-full flex-col gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-sky-soft text-brand">
                  <Icon name={r.icon} size={24} />
                </span>
                <h3 className="text-h3">{r.title}</h3>
                <p className="text-small text-ink-2">{r.text}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-small font-semibold text-brand">
                  เปิดดู
                  <Icon name="arrow-right" size={16} strokeWidth={2.25} />
                </span>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        title="ยังไม่เจอคำตอบที่ต้องการ"
        lead="เล่าสิ่งที่อยากรู้ให้ทีมงาน ทีมตอบกลับในเวลาทำการ"
        actions={
          <>
            <Button data-page-cta href="/contact/" variant="primary" size="lg" icon="chat">
              ติดต่อทีมงาน
            </Button>
            <Button href={COMPANY.telHref} variant="secondary" size="lg" icon="phone">
              โทร {COMPANY.tel}
            </Button>
          </>
        }
        aside={
          <p className="max-w-60 text-small">
            {COMPANY.hours}
            <br />
            <Link href="/area/" className="font-semibold text-on-deep underline-offset-4 hover:underline">
              เช็กพื้นที่ให้บริการ
            </Link>
          </p>
        }
      />
    </>
  );
}
