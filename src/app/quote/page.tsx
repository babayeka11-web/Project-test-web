import type { Metadata } from 'next';
import { QuoteWorkspace } from '@/components/quote/QuoteWorkspace';
import { RequestSection } from '@/components/quote/RequestSection';
import { Button, CtaBand, PageHeader, Section } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { NOTES } from '@/lib/domain/constants';

export const metadata: Metadata = {
  title: 'ใบเสนอราคา',
  description: 'ตรวจรายการที่เลือก ค่าเดินทาง และ VAT ของงานล้างแอร์ ติดตั้ง ซ่อม หรือซื้อแอร์ แล้วส่งคำขอให้ทีม SBP AirCare ยืนยันราคาและคิว',
  alternates: { canonical: './' },
  robots: { index: false, follow: false },
};

export default function QuotePage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ใบเสนอราคา' }]}
        eyebrow="ใบเสนอราคา"
        title="ใบเสนอราคาเบื้องต้น"
        lead="รวมทุกรายการที่คุณเลือกไว้ พร้อมค่าเดินทางและ VAT เห็นยอดรวมทันที แล้วส่งให้ทีมยืนยันราคาและคิวอีกครั้งก่อนเข้างาน"
        meta={NOTES.source}
      />
      <Section
        id="items"
        spacing="compact"
        title="รายการในใบเสนอราคา"
        lead="ตรวจรายการ จำนวน และพื้นที่หน้างาน ยอดรวมกับค่าเดินทางคำนวณให้ทันที"
        className="print:py-0"
      >
        <QuoteWorkspace />
      </Section>
      <RequestSection />
      <CtaBand
        className="print:hidden"
        title="มีข้อสงสัย คุยกับทีมได้เลย"
        lead="โทรหรือทัก LINE ในเวลาทำการ ทีมช่วยเลือกบริการ ตรวจรายการ และยืนยันราคาให้"
        actions={
          <>
            <Button href={COMPANY.telHref} icon="phone">
              โทร {COMPANY.tel}
            </Button>
            <Button href={COMPANY.lineUrl} variant="secondary" icon="chat">
              ทัก LINE
            </Button>
          </>
        }
        aside={<p className="max-w-60 text-small">{COMPANY.hours}</p>}
      />
    </>
  );
}
