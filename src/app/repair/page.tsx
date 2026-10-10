import type { Metadata } from 'next';
import { Button, Card, CtaBand, Icon, PageHeader, Price, Section } from '@/components/ui';
import { RepairPriceList } from '@/components/repair/RepairPriceList';
import { RepairSteps, type DiagFee } from '@/components/repair/RepairSteps';
import { SymptomChecker } from '@/components/repair/SymptomChecker';
import { diagLine } from '@/components/repair/diag';
import { toCheckerRows, toListRows } from '@/components/repair/rows';
import { COMPANY } from '@/lib/domain/company';
import { getRepairItems, serviceFrom } from '@/lib/domain/pricebook';

export const metadata: Metadata = {
  title: 'ซ่อมแอร์ เช็กอาการก่อนเรียกช่าง',
  description:
    'แอร์ไม่เย็น น้ำหยด เปิดไม่ติด เสียงดัง? เลือกอาการ ดูวิธีเช็กเบื้องต้นที่ปลอดภัย รู้ว่าช่างน่าจะตรวจจุดไหน พร้อมค่าตรวจและค่าซ่อมมาตรฐานก่อน VAT ไม่ซ่อมก่อนลูกค้าอนุมัติ',
  alternates: { canonical: './' },
};

export default function RepairPage() {
  const listRows = toListRows(getRepairItems());
  const checkerRows = toCheckerRows(listRows);
  const from = serviceFrom();
  const fees: DiagFee[] = (['wall', 'big'] as const).flatMap(type => {
    const line = diagLine(type, checkerRows);
    return line ? [{ label: line.name.replace(/^ตรวจวินิจฉัย/, ''), ex: line.ex }] : [];
  });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ซ่อมแอร์' }]}
        eyebrow="ซ่อมแอร์"
        title={
          <>
            <span className="inline-block">แอร์มีปัญหา</span> <span className="inline-block">เช็กอาการ</span>
            <wbr />
            <span className="inline-block">ก่อนเรียกช่าง</span>
          </>
        }
        lead="เลือกอาการที่เจอ ดูว่าเป็นปกติหรือไม่ เช็กเองอย่างปลอดภัย และรู้ก่อนว่าช่างน่าจะตรวจจุดไหน พร้อมค่าตรวจและค่าซ่อมมาตรฐาน"
        actions={
          <>
            <Button href="#symptoms" icon="repair" size="lg">
              เช็กอาการ
            </Button>
            <Button href="#prices" variant="ghost" size="lg">
              ดูราคาซ่อม
            </Button>
          </>
        }
        aside={
          <Card padding="md" className="flex flex-col gap-4">
            <Price amount={from.repair} prefix="ค่าตรวจเริ่ม" unit="/ ครั้ง" size="xl" tone="brand" />
            <ul className="grid gap-2.5 text-small text-ink-2">
              <li className="flex gap-2.5">
                <Icon name="check" size={18} className="mt-1 text-ok" strokeWidth={2.25} />
                <span>แจ้งผลตรวจและราคาก่อนลงมือซ่อม</span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="check" size={18} className="mt-1 text-ok" strokeWidth={2.25} />
                <span>ไม่ซ่อมก่อนลูกค้าอนุมัติ</span>
              </li>
              <li className="flex gap-2.5">
                <Icon name="check" size={18} className="mt-1 text-ok" strokeWidth={2.25} />
                <span>มีรายงานและระยะรับประกันต่อรายการ</span>
              </li>
            </ul>
          </Card>
        }
      />

      <Section
        id="symptoms"
        eyebrow="เช็กอาการ"
        title="เลือกอาการที่พบ"
        lead="ตอบไม่กี่ข้อ ก็เห็นจุดที่ช่างน่าจะตรวจ งานซ่อมที่เกี่ยวข้อง และราคามาตรฐานก่อน VAT"
      >
        <SymptomChecker rows={checkerRows} />
      </Section>

      <Section
        id="steps"
        tone="soft"
        eyebrow="ขั้นตอน"
        title="ขั้นตอนตรวจซ่อมของทีม"
        lead="ลูกค้ารู้ราคาและเงื่อนไขก่อนทุกขั้นที่มีค่าใช้จ่าย ไม่ซ่อมก่อนลูกค้าอนุมัติ"
      >
        <RepairSteps fees={fees} />
      </Section>

      <Section
        id="prices"
        eyebrow="ค่าซ่อม"
        title="ราคาซ่อมมาตรฐาน"
        lead="ทุกรายการมีราคามาตรฐานก่อน VAT หน่วยที่คิด รับประกัน และสิ่งที่รวมหรือไม่รวม รายการที่ยังไม่มีราคามาตรฐาน ช่างประเมินหน้างานให้"
      >
        <RepairPriceList rows={listRows} />
      </Section>

      <CtaBand
        id="book"
        title="ไม่แน่ใจอาการ ส่งรูปหรือวิดีโอให้ทีมดูก่อนได้"
        lead="ทีมช่างตอบในเวลาทำการ ช่วยดูว่าควรให้ช่างเข้าตรวจหรือเช็กเบื้องต้นด้วยตัวเองก่อน"
        actions={
          <>
            <Button href="/quote/#request" icon="calendar" size="lg">
              จองช่าง
            </Button>
            <Button href={COMPANY.telHref} variant="secondary" icon="phone" size="lg">
              โทร {COMPANY.tel}
            </Button>
          </>
        }
        aside={
          <div className="flex flex-col items-start gap-3">
            <p className="text-small">{COMPANY.hours}</p>
            <Button href={COMPANY.lineUrl} variant="ghost" icon="chat">
              แชท LINE {COMPANY.line}
            </Button>
          </div>
        }
      />
    </>
  );
}
