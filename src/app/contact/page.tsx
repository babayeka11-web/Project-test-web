// /contact/ — company facts, live opening status, channels and the contact form.
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CompanyCard } from '@/components/contact/CompanyCard';
import { ContactForm } from '@/components/contact/ContactForm';
import { Button, Card, CtaBand, Icon, PageHeader, Section, SectionHeading, Skeleton } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { PROCESS } from '@/lib/domain/content';

export const metadata: Metadata = {
  title: `ติดต่อทีมช่างแอร์ สหบูรพากรุ๊ป · โทร ${COMPANY.tel}`,
  description: `ติดต่อ ${COMPANY.th} โทร ${COMPANY.tel} ทาง LINE ${COMPANY.line} หรือฝากข้อความ ทีมติดต่อกลับในเวลาทำการ ${COMPANY.hours}`,
  alternates: { canonical: './' },
};

function FormFallback() {
  return (
    <Card padding="lg" aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-28 w-full" />
    </Card>
  );
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ติดต่อเรา' }]}
        title="ติดต่อเรา"
        lead="โทร ทัก LINE หรือฝากข้อความไว้ ทีมติดต่อกลับในเวลาทำการ ถามราคา ขอใบเสนอราคา หรือนัดวันเข้าดูหน้างานได้ทุกช่องทาง"
        actions={
          <>
            <Button href={COMPANY.telHref} size="lg" variant="secondary" icon="phone">
              โทร {COMPANY.tel}
            </Button>
            <Button href={COMPANY.lineUrl} size="lg" variant="ghost" icon="chat">
              LINE {COMPANY.line}
            </Button>
          </>
        }
      />

      <Section id="reach" title="ข้อมูลบริษัทและฝากข้อความ" lead="เลือกช่องทางที่สะดวก หรือกรอกฟอร์มสั้น ๆ แล้วได้สรุปพร้อมเลขอ้างอิงไว้ส่งต่อให้ทีม">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
          <CompanyCard />
          <div id="form" className="flex min-w-0 scroll-mt-header flex-col gap-4">
            <SectionHeading as="h3" title="ฝากข้อความถึงทีม" />
            <Suspense fallback={<FormFallback />}>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </Section>

      <Section id="process" tone="soft" eyebrow="หลังติดต่อ" title="วิธีทำงานกับเรา" lead="ตั้งแต่เลือกบริการจนส่งมอบงาน ทุกขั้นตอนทีมแจ้งให้คุณทราบ">
        <ol className="grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-4">
          {PROCESS.map((s, i) => (
            <li key={s.th}>
              <Card padding="md" className="flex h-full flex-col gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-sky-soft font-display text-h3 text-brand" aria-hidden>
                  {i + 1}
                </span>
                <h3 className="text-h3">
                  <span className="sr-only">ขั้นที่ {i + 1} </span>
                  {s.th}
                </h3>
                <p className="text-small text-ink-2">{s.d}</p>
              </Card>
            </li>
          ))}
        </ol>
        <p className="mt-8 flex flex-wrap items-center gap-x-2 text-small text-ink-2">
          <Icon name="info" size={18} className="text-brand" />
          ยังมีคำถามเรื่องราคา เวลา หรือการรับประกัน
          <Link href="/faq/" className="inline-flex min-h-11 items-center gap-1 font-semibold text-brand underline-offset-4 hover:underline">
            ดูคำถามที่พบบ่อย
            <Icon name="arrow-right" size={16} />
          </Link>
        </p>
      </Section>

      <CtaBand
        title="ดูราคาจริงก่อนติดต่อก็ได้"
        lead="ราคามาตรฐานทุกรายการแสดงบนเว็บ ก่อน VAT ใส่ใบเสนอราคาเองได้ แล้วค่อยให้ทีมยืนยัน"
        actions={
          <>
            <Button href="/cleaning/#book" size="lg" icon="clean">
              จองล้างแอร์
            </Button>
            <Button href="/prices/" size="lg" variant="ghost" icon="tag">
              ดูค่าบริการทั้งหมด
            </Button>
          </>
        }
      />
    </>
  );
}
