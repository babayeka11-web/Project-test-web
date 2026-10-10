// /cleaning/ — ล้างแอร์: C1 vs C2, packages, price by size, what the crew does, how often, and the quick booking.
// Server component: reads the Pricebook at build time and passes small serialisable props to the client parts.
import type { Metadata } from 'next';
import { QuickBookingSection } from '@/components/booking/QuickBookingSection';
import { CrewSteps } from '@/components/cleaning/CrewSteps';
import { Intervals } from '@/components/cleaning/Intervals';
import { MethodCompare } from '@/components/cleaning/MethodCompare';
import { PackageCards } from '@/components/cleaning/PackageCards';
import { PriceTables, type ExtraRow } from '@/components/cleaning/PriceTables';
import { Button, Card, CtaBand, PageHeader, Price, Section } from '@/components/ui';
import { CLEAN_PKG_IDS, LEVEL_TH, startAt, type CleanPkgId } from '@/lib/domain/cleaning';
import { COMPANY } from '@/lib/domain/company';
import { VOLUME_HINT } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { cleanFrom, getCleanRates, getCleanRateTable } from '@/lib/domain/pricebook';

export const metadata: Metadata = {
  title: 'ล้างแอร์ ล้างปกติ ล้างใหญ่ จองออนไลน์',
  description: `ล้างแอร์โดยทีมช่างของบริษัท เลือกล้างปกติหรือล้างใหญ่ เริ่ม ${baht(cleanFrom())} ต่อเครื่อง ก่อน VAT เห็นราคารวมและค่าเดินทางก่อนจอง ทีมยืนยันคิวทุกครั้ง`,
  alternates: { canonical: './' },
};

/** Sheet groups shown under "แอร์ชนิดอื่นและงานเสริม" (outside-hours and trip-fee rows are left out: the site never quotes them per row). */
const EXTRA_GROUPS: Record<string, string> = {
  AHU: 'เครื่อง AHU',
  'ล้างเฉพาะส่วน': 'ล้างเฉพาะส่วน',
  'งานเฉพาะพื้นที่': 'พื้นที่ควบคุม',
  'งานเพิ่ม': 'งานเพิ่ม',
};

function extraRows(): Record<CleanPkgId, ExtraRow[]> {
  const rates = getCleanRates();
  const out = { 'Basic Clean': [], 'Standard Care': [], 'Corporate Control': [] } as Record<CleanPkgId, ExtraRow[]>;
  CLEAN_PKG_IDS.forEach(pkg => {
    const rows = rates.filter(r => r.pkg === pkg && r.type == null && r.level === 'C1' && r.ty != null);
    const keep = rows.filter(r => EXTRA_GROUPS[r.ty as string] || (r.ty === 'Access/Risk' && /ความสูงเกิน/.test(r.name)));
    out[pkg] = keep.map(r => {
      const c2 = rates.find(x => x.pkg === pkg && x.level === 'C2' && x.name === r.name && x.type == null);
      return {
        id: `${pkg}-${r.name}`,
        group: EXTRA_GROUPS[r.ty as string] ?? 'งานสูง',
        name: r.name,
        unit: r.unit ?? 'เครื่อง',
        ex: r.ex,
        note: c2 && c2.ex == null && r.ex != null ? 'ล้างใหญ่ประเมินหน้างาน' : undefined,
      };
    });
  });
  return out;
}

export default function CleaningPage() {
  const table = getCleanRateTable();
  const from = cleanFrom();
  const levelFrom = { C1: startAt(table, 'Basic Clean', 'C1'), C2: startAt(table, 'Basic Clean', 'C2') };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ล้างแอร์' }]}
        eyebrow="ล้างแอร์"
        title="ล้างแอร์โดยทีมช่างของบริษัท"
        lead="เลือกล้างปกติหรือล้างใหญ่ แล้วดูราคาก่อน VAT ตามขนาดเครื่อง จองได้ในสามขั้น ทีมยืนยันคิวและเวลาก่อนเข้างานทุกครั้ง"
        actions={
          <>
            <Button href="#book" size="lg" icon="clean">
              จองล้างแอร์
            </Button>
            <Button href="#prices" size="lg" variant="ghost">
              ดูราคาตามขนาด
            </Button>
          </>
        }
        meta={`ทีมช่างของบริษัท ${COMPANY.years} · ${COMPANY.hours}`}
        aside={
          <Card padding="md" className="grid grid-cols-1 gap-4">
            <Price amount={from} prefix="เริ่ม" unit="/ เครื่อง" size="xl" tone="brand" stacked />
            <dl className="grid grid-cols-1 gap-2 border-t border-line pt-4 text-small">
              {(['C1', 'C2'] as const).map(l => (
                <div key={l} className="flex items-baseline justify-between gap-4">
                  <dt className="text-ink-2">
                    {LEVEL_TH[l].th} ({l})
                  </dt>
                  <dd>
                    <Price amount={levelFrom[l]} prefix="เริ่ม" vat={false} size="sm" />
                  </dd>
                </div>
              ))}
            </dl>
            <p className="text-meta text-ink-3">ติดผนังขนาดเล็ก ล้างมาตรฐาน ราคามาตรฐานก่อน VAT</p>
          </Card>
        }
      />

      <Section
        id="compare"
        eyebrow="วิธีล้าง"
        title="ล้างปกติ หรือ ล้างใหญ่"
        lead="ล้างปกติล้างที่ตำแหน่งเดิม ล้างใหญ่ปลดตัวเครื่องลงมาล้างและถอดชิ้นส่วนไปล้างแยก ไม่ว่าแบบไหนทีมช่างบันทึกสิ่งที่ทำเป็นเอกสารให้"
      >
        <MethodCompare from={levelFrom} />
      </Section>

      <Section
        id="packages"
        tone="soft"
        eyebrow="แพ็กเกจ"
        title="ได้เอกสารอะไรหลังล้าง"
        lead="สามแพ็กเกจ ต่างกันที่เอกสารและการติดตามผล ขั้นตอนล้างเหมือนกัน เลือกตามที่คุณต้องใช้เป็นหลักฐาน"
      >
        <PackageCards table={table} />
      </Section>

      <Section
        id="prices"
        eyebrow="ราคา"
        title="ราคาตามขนาด"
        lead="เลือกแพ็กเกจและชนิดแอร์ ราคาต่อเครื่องก่อน VAT ใส่ลงใบเสนอราคาได้ทีละรายการ"
      >
        <PriceTables table={table} extras={extraRows()} />
      </Section>

      <Section
        id="steps"
        tone="soft"
        eyebrow="หน้างาน"
        title="ช่างทำอะไรบ้าง"
        lead="ดูทุกขั้นตั้งแต่ตรวจก่อนเริ่มจนถึงลงนามรับมอบ เลือกชนิดแอร์และวิธีล้างเพื่อดูขั้นตอนของงานที่คุณจะจอง"
      >
        <CrewSteps />
      </Section>

      <Section id="interval" eyebrow="ดูแลแอร์" title="ควรล้างบ่อยแค่ไหน" lead="ขึ้นกับฝุ่น ชั่วโมงใช้งาน และสถานที่ นี่คือแนวทางที่ใช้กันทั่วไป">
        <Intervals />
      </Section>

      <QuickBookingSection id="book" />

      <CtaBand
        id="b2b"
        title={`ล้างตั้งแต่ ${VOLUME_HINT} เครื่อง หรือทั้งอาคาร`}
        lead="ทีมขายวางรอบล้างทั้งปี ประเมินอัตราตามจำนวนเครื่องและสถานที่ พร้อมรายงานรายเครื่อง"
        actions={
          <>
            <Button href="/business/" variant="primary" size="lg">
              ดูสัญญาล้างรายปี
            </Button>
            <Button href="/contact/" variant="secondary" size="lg">
              คุยกับทีมขาย
            </Button>
          </>
        }
      />
    </>
  );
}
