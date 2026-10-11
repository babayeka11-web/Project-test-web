// /business/ — annual cleaning contracts for organisations: sectors → budget calculator → packages & reports → 12-month
// plan → what purchasing gets. A server component: it reads the Pricebook at build time and passes small props to the
// interactive parts (calculator, plan, sample loader).
import type { Metadata } from 'next';
import { Badge, Button, Card, CtaBand, Icon, Notice, PageHeader, Price, Section, Tabs } from '@/components/ui';
import { ContractCalculator } from '@/components/business/ContractCalculator';
import { ContractProvider } from '@/components/business/ContractProvider';
import { PackageCompare, type PackageFacts } from '@/components/business/PackageCompare';
import { Procurement } from '@/components/business/Procurement';
import { SectorIcon } from '@/components/business/SectorIcon';
import { SectorPanel } from '@/components/business/SectorPanel';
import { sampleContract, scopeText, sectorAddOns, SECTORS, volumeBenefits } from '@/components/business/sectors';
import { YearPlan } from '@/components/business/YearPlan';
import { RelatedGuides } from '@/components/knowledge/RelatedGuides';
import { COMPANY } from '@/lib/domain/company';
import { NOTES } from '@/lib/domain/constants';
import { CLEAN_PKG_IDS, PKG_TH, startAt } from '@/lib/domain/cleaning';
import { estimateContract, PRESETS } from '@/lib/domain/contract';
import { baht, up100 } from '@/lib/domain/format';
import { getCleanRates, getCleanRateTable } from '@/lib/domain/pricebook';

export const metadata: Metadata = {
  title: 'สัญญาล้างแอร์รายปีสำหรับองค์กร',
  description:
    'วางแผนล้างแอร์ทั้งปีในสัญญาเดียว สำหรับสำนักงาน หลายสาขา คอนโด โรงพยาบาล โรงเรียน โรงแรม และโรงงาน ประเมินงบก่อน VAT พร้อมรายงานรายเครื่อง ทีมขายยืนยันในใบเสนอราคา',
  alternates: { canonical: './' },
};

export default function BusinessPage() {
  const table = getCleanRateTable();
  const rows = getCleanRates();
  const minBill = table.minBill;

  // header example: the same default as the calculator (office-m preset, Standard Care, one deep clean)
  const preset = PRESETS.find(p => p.id === 'office-m') ?? PRESETS[0];
  const example = estimateContract(table, { units: preset.units, visits: preset.visits, pkg: 'Standard Care', size: 0, deep: true });

  const tabs = SECTORS.map(s => {
    const sample = sampleContract(table, s);
    if (!sample) return null;
    return {
      id: s.id,
      label: (
        <span className="inline-flex items-center gap-2">
          <SectorIcon id={s.id} size={18} />
          {s.tab}
        </span>
      ),
      content: (
        <SectorPanel
          sector={s}
          sample={sample}
          benefits={volumeBenefits(sample, minBill)}
          scope={scopeText(s, sample)}
          addOns={sectorAddOns(rows, s.addOns, s.sample.pkg)}
          minBill={minBill}
        />
      ),
    };
  }).filter((t): t is NonNullable<typeof t> => t !== null);

  const facts: PackageFacts[] = CLEAN_PKG_IDS.map(id => {
    const c1 = rows.find(r => r.pkg === id && r.level === 'C1' && r.type);
    const c2 = rows.find(r => r.pkg === id && r.level === 'C2' && r.type);
    return {
      id,
      docC1: c1?.doc ?? '-',
      docC2: c2?.doc ?? '-',
      warranty: c1?.warranty ?? '-',
      care: c1?.care ?? '-',
      fromC1: startAt(table, id, 'C1'),
      fromC2: startAt(table, id, 'C2'),
    };
  });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'องค์กร' }]}
        title={
          <>
            <span className="whitespace-nowrap">สัญญาล้างแอร์รายปี</span> <span className="whitespace-nowrap">สำหรับองค์กร</span>
          </>
        }
        lead="วางรอบล้างทั้งปีในสัญญาเดียว เห็นงบก่อน VAT กำลังทีมต่อรอบ และเอกสารที่ได้รับ ก่อนคุยกับทีมขาย"
        actions={
          <>
            <Button href="#calculator" size="lg" icon="sliders">
              ประเมินงบทั้งปี
            </Button>
            <Button href="/contact/?topic=contract" size="lg" variant="ghost" icon="chat">
              คุยกับทีมขาย
            </Button>
          </>
        }
        meta={NOTES.source}
        aside={
          example && (
            <Card padding="lg" className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-small font-semibold text-ink-2">
                  ตัวอย่าง · {preset.th} {preset.sub}
                </p>
                <Badge tone="outline" icon="info">
                  ราคาประมาณการ
                </Badge>
              </div>
              <Price amount={example.annualEx} unit="/ ปี" size="xl" tone="brand" stacked />
              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-2 border-t border-line pt-4 text-small">
                <dt className="text-ink-2">ล้างปีละ</dt>
                <dd className="text-end font-semibold">{example.visits} ครั้ง (ล้างใหญ่ 1 ครั้ง)</dd>
                <dt className="text-ink-2">เฉลี่ยต่อเครื่องต่อปี</dt>
                <dd className="text-end font-semibold">≈ {baht(up100(example.perUnitYear) ?? 0)}</dd>
                <dt className="text-ink-2">กำลังทีมต่อรอบ</dt>
                <dd className="text-end font-semibold">≈ {example.teamDaysPerVisit} ทีม-วัน</dd>
                <dt className="text-ink-2">แพ็กเกจ</dt>
                <dd className="text-end font-semibold">{PKG_TH['Standard Care'].th}</dd>
              </dl>
              <p className="text-meta text-ink-3">{NOTES.estimate}</p>
            </Card>
          )
        }
      />

      <Section
        id="sectors"
        title="เลือกประเภทองค์กรของคุณ"
        lead="แต่ละที่มีเรื่องที่กังวลต่างกัน ดูว่าบริษัททำอะไรให้ได้บ้าง พร้อมตัวอย่างงบรายปีที่คำนวณจากราคามาตรฐาน"
      >
        <Tabs label="ประเภทองค์กร" variant="pill" items={tabs} panelClassName="mt-8" />
      </Section>

      <ContractProvider table={table}>
        <Section
          id="calculator"
          tone="soft"
          eyebrow="เครื่องคำนวณ"
          title="ประเมินงบล้างแอร์ทั้งปี"
          lead="ใส่จำนวนเครื่อง เลือกจำนวนรอบและแพ็กเกจ ตัวเลขเปลี่ยนตามทันที แล้วใส่ในใบเสนอราคาให้ทีมสำรวจและยืนยัน"
        >
          <ContractCalculator />
        </Section>

        <Section
          id="packages"
            title="แพ็กเกจและรายงานที่ได้รับ"
          lead="ทุกแพ็กเกจมีเอกสารส่งมอบ ต่างกันที่ความละเอียดของรายงาน ระยะรับประกัน และการดูแลหลังงาน"
        >
          <PackageCompare facts={facts} />
        </Section>

        <Section
          id="plan"
          tone="soft"
            title="แผนล้างตลอดปี"
          lead="ดูว่าเดือนไหนทีมเข้า รอบไหนเป็นล้างใหญ่ และงบสะสมถึงปลายปีเท่าไร ตามจำนวนเครื่องที่ใส่ไว้ในเครื่องคำนวณ"
        >
          <YearPlan />
        </Section>
      </ContractProvider>

      <Section
        id="procurement"
        title="สิ่งที่ฝ่ายจัดซื้อได้"
        lead="เอกสารและการตั้งค่าที่ฝ่ายจัดซื้อ ฝ่ายอาคาร และผู้ตรวจสอบมักต้องใช้ ป้ายแต่ละใบบอกว่ามีอยู่แล้วหรือตกลงกันในสัญญา"
      >
        <Procurement />
        <Notice size="sm" tone="info" className="mt-8">
          งานซ่อมและอะไหล่ไม่รวมในสัญญาล้าง ทีมแจ้งราคาให้อนุมัติก่อนทุกครั้ง · ระบบ VRV / VRF เป็นงานโครงการ เสนอราคาแยก
        </Notice>
      </Section>

      <RelatedGuides page="/business/" tone="soft" />

      <CtaBand
        title="ขอใบเสนอราคาสัญญาล้างแอร์รายปี"
        lead="บอกประเภทอาคาร จำนวนเครื่อง และพื้นที่ ทีมขายสำรวจหน้างานแล้วออกใบเสนอราคาเป็นทางการให้"
        actions={
          <>
            <Button data-page-cta href="/contact/?topic=contract" size="lg" icon="chat">
              คุยกับทีมขายองค์กร
            </Button>
            <Button href="/quote/" size="lg" variant="secondary" icon="quote">
              ดูใบเสนอราคา
            </Button>
          </>
        }
        aside={
          <ul className="flex flex-col gap-2 text-small">
            <li className="flex items-center gap-2.5">
              <Icon name="phone" size={18} />
              <a href={COMPANY.telHref} className="font-semibold text-on-deep underline-offset-4 hover:underline">
                {COMPANY.tel}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="clock" size={18} />
              {COMPANY.hours}
            </li>
          </ul>
        }
      />
    </>
  );
}
