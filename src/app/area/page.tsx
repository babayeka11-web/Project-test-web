// /area/ — service area and travel fee: address check (zone · km · fee), map, fee by distance, the rules.
import type { Metadata } from 'next';
import Link from 'next/link';
import { AreaChecker } from '@/components/area/AreaChecker';
import { MapPin } from '@/components/area/MapPin';
import { provinceReach, serviceMap } from '@/components/area/map-geo';
import { ServiceMap } from '@/components/area/ServiceMap';
import type { ReactNode } from 'react';
import { Badge, Button, Card, CtaBand, Icon, Notice, PageHeader, Price, Section, SectionHeading, Table } from '@/components/ui';
import type { IconName } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { MIN_BILL } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { jobTravel, travelFee, TRAVEL } from '@/lib/domain/travel';

export const metadata: Metadata = {
  title: 'พื้นที่ให้บริการและค่าเดินทาง',
  description: `ให้บริการกรุงเทพฯ และจังหวัดใกล้เคียงถึง ${TRAVEL.maxKm} กม. ตรวจพื้นที่ของคุณ ดูระยะทาง ค่าเดินทางโดยประมาณ และเงื่อนไขก่อน VAT`,
  alternates: { canonical: './' },
};

/** Sample distances for the fee table; the last one is beyond the limit on purpose. */
const SAMPLE_KM = [10, 20, 30, 40, 60, 80, 100, 120, 150, 160];

const Project = () => <Badge tone="neutral">งานโครงการ</Badge>;
const Free = () => (
  <span className="font-semibold text-ok">
    ไม่มีค่าเดินทาง<span aria-hidden>*</span>
  </span>
);
const Fee = ({ amount }: { amount: number | null }) => (amount == null ? <Project /> : <Price amount={amount} size="sm" vat={false} />);

export default function AreaPage() {
  const proj = serviceMap().proj;
  const underMin = jobTravel(null, MIN_BILL - 1).fee;
  const example = 60;

  const feeRows = SAMPLE_KM.map(km => {
    const fee = travelFee(km);
    return {
      id: String(km),
      km: `${km} กม.`,
      bkk: km <= TRAVEL.freeKm ? <Free /> : <Fee amount={fee} />,
      other: <Fee amount={fee} />,
    };
  });

  const reachRows = provinceReach().map(r => ({
    id: r.province,
    province: r.province,
    km: r.minKm === r.maxKm ? `${r.minKm} กม.` : `${r.minKm}–${r.maxKm} กม.`,
    fee: r.core ? (
      <>
        <Free /> ในระยะ {TRAVEL.freeKm} กม.
        {r.maxFee !== 0 && (
          <>
            {' '}
            · ไกลสุด <Fee amount={r.maxFee} />
          </>
        )}
      </>
    ) : r.minFee == null ? (
      <Project />
    ) : r.minFee === r.maxFee ? (
      <Fee amount={r.minFee} />
    ) : (
      <span className="inline-flex flex-wrap items-baseline gap-x-1.5">
        <Fee amount={r.minFee} />
        <span aria-hidden>–</span>
        <span className="sr-only">ถึง</span>
        <Fee amount={r.maxFee} />
      </span>
    ),
  }));

  const rules: { icon: IconName; title: string; body: ReactNode }[] = [
    {
      icon: 'check',
      title: `พื้นที่หลัก · กรุงเทพฯ ในระยะ ${TRAVEL.freeKm} กม.`,
      body: (
        <>
          ไม่มีค่าเดินทางเมื่องานล้างถึง {baht(MIN_BILL)} ก่อน VAT ต่อเที่ยว ถ้าต่ำกว่านั้นคิดค่าเดินทาง {baht(underMin)} แทนการเติมยอดให้ครบ
        </>
      ),
    },
    {
      icon: 'truck',
      title: `นอกพื้นที่หลัก ถึง ${TRAVEL.maxKm} กม.`,
      body: (
        <>
          {baht(TRAVEL.baseFee)} + {baht(TRAVEL.perKm)} ต่อ กม. ที่เกิน {TRAVEL.freeKm} กม. ปัดขึ้นเป็นหลักร้อย เช่น {example} กม. คิด {baht(travelFee(example) ?? 0)} ต่อเที่ยว
          (ก่อน VAT) กรุงเทพฯ ที่ไกลกว่า {TRAVEL.freeKm} กม. คิดแบบเดียวกัน
        </>
      ),
    },
    {
      icon: 'building',
      title: `เกิน ${TRAVEL.maxKm} กม.`,
      body: (
        <>
          เป็นงานโครงการหรือสัญญา ไม่รับเป็นรายเครื่อง ฝากข้อมูลไว้ ทีมประเมินราคาและเวลาให้{' '}
          <Link href="/contact/?topic=project" className="font-semibold text-brand underline underline-offset-4">
            ติดต่อทีม
          </Link>
        </>
      ),
    },
  ];

  return (
    <>
      <PageHeader
      breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'พื้นที่ให้บริการ' }]}
      title="พื้นที่ให้บริการและค่าเดินทาง"
      lead={`กรุงเทพฯ ในระยะ ${TRAVEL.freeKm} กม. จากสำนักงานใหญ่ไม่มีค่าเดินทาง เมื่องานล้างถึง ${baht(MIN_BILL)} ก่อน VAT ไกลกว่านั้นถึง ${TRAVEL.maxKm} กม. คิด ${baht(TRAVEL.baseFee)} + ${baht(TRAVEL.perKm)} ต่อ กม. ที่เกิน ${TRAVEL.freeKm} กม. เกินกว่านั้นเป็นงานโครงการ`}
      actions={
        <Button href="#check" size="lg" icon="pin">
          ตรวจพื้นที่ของคุณ
        </Button>
      }
    />

      <Section
        id="check"
        title="ตรวจพื้นที่ของคุณ"
        lead="พิมพ์ชื่อแขวง/ตำบล เขต/อำเภอ หรือรหัสไปรษณีย์ แล้วเลือกจากรายการ จะเห็นระยะถนนโดยประมาณและค่าเดินทาง"
      >
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
          <AreaChecker />
          <div className="flex min-w-0 flex-col gap-4">
            <SectionHeading as="h3" title="แผนที่พื้นที่ให้บริการ" />
            <ServiceMap>
              <MapPin proj={proj} />
            </ServiceMap>
          </div>
        </div>
      </Section>

      <Section
        id="fees"
        tone="soft"
        eyebrow="ค่าเดินทาง"
        title="ค่าเดินทางตามระยะ"
        lead="ระยะถนนโดยประมาณจากสำนักงานใหญ่ ราคาต่อเที่ยว ก่อน VAT"
      >
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-start lg:gap-12">
          <Table
            caption="ค่าเดินทางต่อเที่ยวตามระยะถนน ก่อน VAT"
            showCaption
            minWidth="26rem"
            columns={[
              { key: 'km', label: 'ระยะถนน', rowHeader: true },
              { key: 'bkk', label: 'กรุงเทพฯ' },
              { key: 'other', label: 'จังหวัดอื่น' },
            ]}
            rows={feeRows}
            footnote={
              <>
                <span aria-hidden>*</span> เมื่องานล้างถึง {baht(MIN_BILL)} ก่อน VAT ต่อเที่ยว ต่ำกว่านั้นคิด {baht(underMin)} · ราคาทุกช่องเป็นราคาก่อน VAT
              </>
            }
          />

          <div className="flex flex-col gap-5">
            <ol className="flex list-none flex-col gap-4 p-0">
              {rules.map(r => (
                <li key={r.title}>
                  <Card padding="md" className="flex gap-4">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
                      <Icon name={r.icon} size={24} />
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-h3">{r.title}</h3>
                      <p className="mt-1 text-small text-ink-2">{r.body}</p>
                    </div>
                  </Card>
                </li>
              ))}
            </ol>
            <Notice tone="info" title="ระยะทางเป็นค่าประมาณ">
              คำนวณจากระยะเส้นตรงจากสำนักงานใหญ่ × {TRAVEL.roadFactor} ทีมยืนยันระยะและค่าเดินทางจากที่อยู่จริงของคุณในใบเสนอราคาอีกครั้ง
            </Notice>
          </div>
        </div>
      </Section>

      <Section
        id="provinces"
        eyebrow="ข้อมูลเดียวกับแผนที่"
        title="ระยะและค่าเดินทางตามจังหวัด"
        lead="เป็นรายการข้อความแทนแผนที่ ช่วงระยะนับจากจุดที่ใกล้และไกลที่สุดของจังหวัดถึงสำนักงานใหญ่"
        width="text"
      >
        <Table
          caption="ระยะถนนโดยประมาณและค่าเดินทางต่อเที่ยวตามจังหวัด ก่อน VAT"
          maxHeight="30rem"
          minWidth="30rem"
          columns={[
            { key: 'province', label: 'จังหวัด', rowHeader: true },
            { key: 'km', label: 'ระยะถนน', numeric: true },
            { key: 'fee', label: 'ค่าเดินทางต่อเที่ยว' },
          ]}
          rows={reachRows}
          footnote={
            <>
              ระยะและค่าเดินทางเป็นค่าประมาณ ทีมยืนยันจากที่อยู่จริง · <span aria-hidden>*</span> เมื่องานล้างถึง {baht(MIN_BILL)} ก่อน VAT ต่อเที่ยว
            </>
          }
        />
      </Section>

      <CtaBand
        title="ไม่แน่ใจว่าที่อยู่ของคุณอยู่ในพื้นที่หรือไม่"
        lead="บอกที่อยู่หน้างานกับทีมได้เลย ทีมตรวจระยะจริงและแจ้งค่าเดินทางในใบเสนอราคา"
        actions={
          <>
            <Button href="/cleaning/#book" size="lg" icon="clean">
              จองล้างแอร์
            </Button>
            <Button href="/contact/" size="lg" variant="ghost" icon="chat">
              ติดต่อทีม
            </Button>
          </>
        }
        aside={
          <div className="flex flex-col gap-1 text-small">
            <a href={COMPANY.telHref} className="num text-h3 text-on-deep">
              {COMPANY.tel}
            </a>
            <span>{COMPANY.hours}</span>
          </div>
        }
      />
    </>
  );
}
