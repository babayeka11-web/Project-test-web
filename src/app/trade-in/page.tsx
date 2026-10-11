// /trade-in/ — เทิร์นแอร์เก่า: describe the old unit → trade-in value, repair estimate vs a new Inverter unit of the same
// size. Moved here from /installation/#tradein (it made that page 6,000px longer); /repair/ links here for old units.
// Server component: the trade-in data is built from Pricebook rows at build time, exactly as /installation/ did.
import type { Metadata } from 'next';
import { Button, CtaBand, PageHeader, Section } from '@/components/ui';
import { buildTradeInData } from '@/components/tradein/data';
import { TradeIn } from '@/components/tradein/TradeIn';
import { thousands } from '@/lib/domain/format';
import { getCatalogLite, getInstallItems, getRepairItems, getSkuCount } from '@/lib/domain/pricebook';

export const metadata: Metadata = {
  // the layout's title template adds " · SBP AirCare"
  title: 'เทิร์นแอร์เก่า เทียบค่าซ่อมกับเครื่องใหม่',
  description:
    'บอกอายุ ขนาด และอาการของแอร์เครื่องเดิม ดูมูลค่าเทิร์นที่หักจากเครื่องใหม่ เทียบค่าซ่อมกับเครื่อง Inverter ใหม่ขนาดเดียวกัน ราคามาตรฐานก่อน VAT ทีมยืนยันหน้างาน',
  alternates: { canonical: './' },
};

export default function TradeInPage() {
  const data = buildTradeInData({ catalog: getCatalogLite(), repair: getRepairItems(), install: getInstallItems() });

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'เทิร์นแอร์เก่า' }]}
        title="แอร์เก่า ซ่อมหรือเปลี่ยนดี"
        lead="บอกอายุ ขนาด และอาการของแอร์เดิม ดูมูลค่าเทิร์นที่หักจากเครื่องใหม่ เทียบค่าซ่อมกับเครื่อง Inverter ใหม่ขนาดเดียวกัน"
      />

      <Section
        id="tool"
        spacing="compact"
        title="เทียบค่าซ่อมกับเครื่องใหม่"
        lead="ตัวเลขเป็นราคามาตรฐานก่อน VAT และช่วงมูลค่าเทิร์นโดยประมาณ ทีมช่างตรวจเครื่องจริงแล้วยืนยันในใบเสนอราคา"
      >
        <TradeIn data={data} />
      </Section>

      <CtaBand
        title="เลือกเครื่องใหม่พร้อมติดตั้ง"
        lead={`ดูแอร์ ${thousands(getSkuCount())} รุ่นพร้อมราคาติดตั้ง หรือคุยกับทีมเรื่องมูลค่าเทิร์นของเครื่องเดิม`}
        actions={
          <>
            <Button data-page-cta href="/products/" size="lg" icon="ac">
              ดูแอร์ทุกรุ่น
            </Button>
            <Button href="/contact/?topic=tradein" size="lg" variant="secondary" icon="chat">
              คุยกับทีม
            </Button>
          </>
        }
      />
    </>
  );
}
