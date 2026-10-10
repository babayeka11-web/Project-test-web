import type { Metadata } from 'next';
import { BtuCalculator } from '@/components/knowledge/BtuCalculator';
import { GuideBrowser, type GuideCard } from '@/components/knowledge/GuideBrowser';
import { GUIDES } from '@/components/knowledge/guides';
import { Button, Card, CtaBand, Icon, PageHeader, Section } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { catalogSizes } from './catalog-sizes';

export const metadata: Metadata = {
  title: 'ความรู้เรื่องแอร์ และเครื่องคำนวณ BTU',
  description:
    'คู่มือสั้นเรื่องเลือกขนาด BTU ประเภทแอร์ อินเวอร์เตอร์ รอบล้าง งานติดตั้ง และสัญญารายปี พร้อมเครื่องคำนวณ BTU ตามขนาดห้องของคุณ',
  alternates: { canonical: './' },
};

const CARDS: GuideCard[] = GUIDES.map(g => ({ slug: g.slug, th: g.th, lead: g.lead, min: g.min, icon: g.icon, aud: g.aud }));

export default function KnowledgePage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ความรู้' }]}
        eyebrow="ความรู้"
        title="ความรู้เรื่องแอร์ ก่อนตัดสินใจ"
        lead="คู่มือสั้นเรื่องเลือกขนาด เลือกประเภท รอบล้าง และงานติดตั้ง อ่านเรื่องละไม่กี่นาที แล้วลองคำนวณ BTU ของห้องคุณเองได้เลย"
        meta={`${GUIDES.length} เรื่อง · เป็นข้อมูลทั่วไปเพื่อช่วยตัดสินใจ ทีมช่างยืนยันอีกครั้งที่หน้างานจริง`}
        aside={
          <Card className="flex flex-col gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-sky-soft text-brand">
              <Icon name="thermometer" size={24} />
            </span>
            <div className="flex flex-col gap-1.5">
              <h2 className="text-h3">เครื่องคำนวณ BTU</h2>
              <p className="text-small text-ink-2">ใส่ขนาดห้อง แดด และจำนวนคน ได้ขนาดแอร์ที่ควรเลือกภายใน 1 นาที</p>
            </div>
            <Button href="#btu" variant="secondary" icon="arrow-right" className="self-start">
              คำนวณ BTU ห้องของคุณ
            </Button>
          </Card>
        }
      />

      <Section
        id="guides"
        eyebrow="คู่มือสั้น"
        title="เลือกอ่านตามที่คุณสนใจ"
        lead="แต่ละเรื่องมีปุ่มพาไปลองเองต่อ ทั้งดูราคา จองล้าง หรือเช็กพื้นที่บริการ"
      >
        <GuideBrowser guides={CARDS} />
      </Section>

      <Section
        id="btu"
        tone="soft"
        eyebrow="ลองเอง"
        title="คำนวณ BTU ห้องของคุณ"
        lead="เลือกว่าห้องใช้ทำอะไร ใส่ขนาดห้อง แล้วดูว่าควรใช้แอร์ขนาดเท่าไร เป็นการประมาณเบื้องต้น ทีมช่างยืนยันขนาดจริงตอนสำรวจ"
      >
        <BtuCalculator catalog={catalogSizes()} />
      </Section>

      <CtaBand
        title="อยากให้ทีมช่างช่วยดูหน้างานจริง"
        lead="ส่งขนาดห้องและรูปหน้างานให้ทีมช่าง ทีมแนะนำขนาดและประเภทที่เหมาะ แล้วแจ้งราคาในใบเสนอราคาก่อนเริ่มงาน"
        actions={
          <>
            <Button href="/contact/" icon="chat">
              ปรึกษาทีมช่าง
            </Button>
            <Button href="/cleaning/#book" variant="secondary" icon="clean">
              จองล้างแอร์
            </Button>
          </>
        }
        aside={
          <ul className="flex flex-col gap-2 text-small">
            <li className="flex items-center gap-2">
              <Icon name="phone" size={18} />
              <a href={COMPANY.telHref} className="font-semibold text-ink no-underline">
                {COMPANY.tel}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Icon name="clock" size={18} />
              {COMPANY.hours}
            </li>
          </ul>
        }
      />
    </>
  );
}
