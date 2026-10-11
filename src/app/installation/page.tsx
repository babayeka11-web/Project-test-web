import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge, Button, Card, CtaBand, Icon, Notice, PageHeader, Price, Section, Table, Tabs } from '@/components/ui';
import { TypeArt } from '@/components/shared/TypeArt';
import { AddonList } from '@/components/installation/AddonList';
import { Compare } from '@/components/installation/Compare';
import { InstallPriceTool } from '@/components/installation/InstallPriceTool';
import { InstallSteps } from '@/components/installation/InstallSteps';
import { MoveRemove } from '@/components/installation/MoveRemove';
import { buildAddonGroups, buildCompare, buildMaterialRows, buildMoveRemove, buildSizeRows } from '@/components/installation/build';
import { MATERIAL_SPECS } from '@/components/installation/copy';
import { INSTALL_TYPES } from '@/components/installation/types';
import { RelatedGuides } from '@/components/knowledge/RelatedGuides';
import { COMPANY } from '@/lib/domain/company';
import { NOTES } from '@/lib/domain/constants';
import { INCLUDED_PIPE_M, INSTALL_WARRANTY } from '@/lib/domain/install';
import { serviceFrom } from '@/lib/domain/pricebook';
import { TYPE_BY_ID } from '@/lib/domain/types';

export const metadata: Metadata = {
  title: 'ติดตั้งแอร์มาตรฐาน · พรีเมียม',
  description: `ราคาติดตั้งแอร์ตามประเภทและขนาด BTU รวมท่อน้ำยา ${INCLUDED_PIPE_M} เมตรแรก วัสดุหลักครบ ทดสอบก่อนส่งมอบ รับประกันงานติดตั้ง 3 ปีเมื่อซื้อเครื่องกับบริษัท พร้อมบริการย้ายแอร์และรื้อแอร์`,
  alternates: { canonical: './' },
};

const band = (lo: number, hi: number) => `${lo.toLocaleString('en-US')}–${hi.toLocaleString('en-US')} BTU`;

export default function InstallationPage() {
  const from = serviceFrom().install;
  const sizeRows = buildSizeRows();
  const compare = buildCompare();
  const materialRows = buildMaterialRows();
  const addonGroups = buildAddonGroups();
  const { move, remove, dispose } = buildMoveRemove();
  const includes = {
    STANDARD: compare.levels.find(l => l.key === 'STANDARD')?.parts ?? [],
    PREMIUM: compare.levels.find(l => l.key === 'PREMIUM')?.parts ?? [],
  };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ติดตั้งแอร์' }]}
        title="ติดตั้งแอร์มาตรฐาน · พรีเมียม"
        lead={`ทีมช่างของบริษัทติดตั้งให้ ราคารวมท่อน้ำยา ${INCLUDED_PIPE_M} เมตรแรกและวัสดุหลักครบ ทดสอบและวัดค่าก่อนส่งมอบ เลือกแพ็กเกจตามห้องและงบ แล้วดูราคาตามขนาดได้ทันที`}
        actions={
          <>
            <Button href="#prices" size="lg" icon="tag">
              ดูราคาตามขนาด
            </Button>
            <Button href="/trade-in/" size="lg" variant="ghost">
              เทิร์นแอร์เก่า
            </Button>
          </>
        }
        aside={
          <Card padding="lg" className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <TypeArt type="wall" className="h-16 w-24 shrink-0 text-brand" />
              <div>
                <Price amount={from} prefix="เริ่ม" unit="/ เครื่อง" size="xl" tone="brand" />
              </div>
            </div>
            <ul className="grid gap-2 border-t border-line pt-4 text-small text-ink-2">
              <li className="flex items-start gap-2.5">
                <Icon name="check" size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-ok" />
                รวมท่อน้ำยา {INCLUDED_PIPE_M} เมตรแรก
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-brand" />
                {INSTALL_WARRANTY.boughtHere}
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-ink-3" />
                {INSTALL_WARRANTY.ownUnit}
              </li>
            </ul>
          </Card>
        }
        meta={NOTES.source}
      />

      <Section
        id="compare"
        eyebrow="เลือกแพ็กเกจ"
        title="มาตรฐาน หรือ พรีเมียม"
        lead="ทั้งสองแพ็กเกจใช้วัสดุชุดเดียวกัน พรีเมียมเพิ่มการทดสอบละเอียดขึ้น บันทึกค่า ภาพก่อน–หลัง และตรวจติดตามหลังติดตั้ง"
      >
        <Compare view={compare} />
      </Section>

      <Section
        id="prices"
        tone="soft"
        title="ราคาติดตั้งตามขนาด"
        lead="เลือกประเภทและขนาดเครื่อง เห็นราคามาตรฐานและพรีเมียมทันที ใส่ใบเสนอราคาได้เลย"
      >
        <div className="flex flex-col gap-12">
          <InstallPriceTool rows={sizeRows} includes={includes} />

          <div className="flex flex-col gap-5">
            <h3 className="text-h3">ตารางราคาทั้งหมดตามประเภทแอร์</h3>
            <Tabs
              label="ประเภทแอร์"
              panelClassName="pt-5"
              items={INSTALL_TYPES.map(t => ({
                id: t,
                label: TYPE_BY_ID[t].th,
                count: sizeRows.filter(r => r.type === t).length,
                content: (
                  <Table
                    caption={`ราคาติดตั้งแอร์${TYPE_BY_ID[t].th} ต่อเครื่อง ก่อน VAT`}
                    minWidth="34rem"
                    stickyFirstColumn
                    columns={[
                      { key: 'size', label: 'ขนาดเครื่อง', rowHeader: true },
                      { key: 'std', label: 'มาตรฐาน (ก่อน VAT)', align: 'end', numeric: true },
                      { key: 'prem', label: 'พรีเมียม (ก่อน VAT)', align: 'end', numeric: true },
                      { key: 'pipe', label: `ท่อเกิน ${INCLUDED_PIPE_M} ม. คิดเมตรละ`, align: 'end', numeric: true },
                    ]}
                    rows={sizeRows
                      .filter(r => r.type === t)
                      .map(r => ({
                        id: r.std.code,
                        size: band(r.lo, r.hi),
                        std: <Price amount={r.std.ex} vat={false} size="sm" />,
                        prem: <Price amount={r.prem?.ex ?? null} vat={false} size="sm" />,
                        pipe: <Price amount={r.pipe?.ex ?? null} vat={false} size="sm" />,
                      }))}
                    footnote={`ราคาต่อเครื่อง ก่อน VAT · รวมท่อน้ำยา ${INCLUDED_PIPE_M} เมตรแรก · ${NOTES.source}`}
                  />
                ),
              }))}
            />
            <Notice tone="info" size="sm">
              แอร์ซ่อนในฝ้า ท่อลม ตู้ตั้งพื้นเกิน 60,000 BTU และ VRV / VRF ไม่มีราคาตายตัว ทีมสำรวจหน้างานแล้วแจ้งราคาก่อนทำ
            </Notice>
          </div>
        </div>
      </Section>

      <Section
        id="materials"
        title="วัสดุที่ใช้"
        lead="วัสดุหลักเป็นรุ่นและยี่ห้อเดียวกันทุกงาน ระบุชื่อไว้ในใบเสนอราคา ท่อทองแดงเป็น O-TWO ความหนา 0.70 มม. เท่านั้น"
      >
        <div className="flex flex-col gap-10">
          <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {MATERIAL_SPECS.map(m => (
              <li key={m.id}>
                <Card padding="lg" className="flex h-full flex-col gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-sky-soft text-brand">
                    <Icon name={m.icon} size={24} />
                  </span>
                  <h3 className="text-h3">{m.th}</h3>
                  <p className="font-semibold text-brand">{m.spec}</p>
                  <p className="text-small text-ink-2">{m.why}</p>
                </Card>
              </li>
            ))}
            <li>
              <Card tone="soft" padding="lg" className="flex h-full flex-col gap-3">
                <span className="grid size-12 place-items-center rounded-2xl bg-surface text-ink-2">
                  <Icon name="info" size={24} />
                </span>
                <h3 className="text-h3">ถ้าหน้างานต้องใช้วัสดุอื่น</h3>
                <p className="text-small text-ink-2">ทีมแจ้งชนิดและราคาก่อนเริ่มงาน ไม่เปลี่ยนวัสดุเองโดยไม่บอก</p>
              </Card>
            </li>
          </ul>

          <div className="flex flex-col gap-4">
            <h3 className="text-h3">เทียบวัสดุและการทดสอบ ({compare.size})</h3>
            <Table
              caption="เทียบวัสดุและการทดสอบของแพ็กเกจมาตรฐานกับพรีเมียม"
              minWidth="38rem"
              stickyFirstColumn
              columns={[
                { key: 'th', label: 'หัวข้อ', rowHeader: true },
                { key: 'std', label: 'มาตรฐาน' },
                { key: 'prem', label: 'พรีเมียม' },
              ]}
              rows={materialRows.map(r => ({
                id: r.id,
                th: r.th,
                std: r.std.length ? r.std.join(' · ') : '—',
                prem: r.prem.length ? r.prem.join(' · ') : '—',
              }))}
              footnote="รายการจากแพ็กเกจในรายการราคามาตรฐาน · พรีเมียมใช้วัสดุชุดเดียวกับมาตรฐาน แล้วเพิ่มการทดสอบและงานเก็บรายละเอียด"
            />
          </div>
        </div>
      </Section>

      <Section
        id="addons"
        tone="soft"
        title="งานเสริมที่อาจต้องใช้"
        lead="ราคาแพ็กเกจรวมเฉพาะของมาตรฐานของหน้างานปกติ ถ้าท่อยาวกว่าที่รวมไว้ หรือต้องเดินไฟ เจาะผนัง ทีมแจ้งรายการเหล่านี้ตอนสำรวจ เลือกใส่ใบเสนอราคาไว้ก่อนได้"
      >
        <div className="flex flex-col gap-6">
          <AddonList groups={addonGroups} />
          <Notice tone="info" size="sm">
            ราคาต่อเมตรและต่อชิ้นเป็นอัตรามาตรฐาน ก่อน VAT · งานที่ไม่มีราคาตายตัว (งานสูง กรีดผนัง เปิดฝ้า นอกเวลา) ทีมประเมินหน้างานแล้วแจ้งก่อนทำ
          </Notice>
        </div>
      </Section>

      <Section
        id="steps"
        title="ขั้นตอนติดตั้ง"
        lead="ช่างทำตามแบบฟอร์มงานติดตั้งของบริษัททุกเครื่อง เลือกประเภทแอร์และแพ็กเกจเพื่อดูว่าแต่ละขั้นทำอะไร"
      >
        <InstallSteps />
      </Section>

      <Section
        id="move"
        tone="soft"
        title="ย้ายแอร์ · รื้อแอร์"
        lead="ย้ายไปจุดใหม่ในบ้านหรือสำนักงาน รื้อออกเมื่อเลิกใช้ หรือขนเครื่องเดิมออกพร้อมงานเปลี่ยนเครื่อง"
      >
        <div className="flex flex-col gap-6">
          <MoveRemove move={move} remove={remove} dispose={dispose} />
          {/* the trade-in tool has its own page now; old /installation/#tradein links land here */}
          <p id="tradein" className="scroll-mt-header text-ink-2">
            มีแอร์เครื่องเก่าจะเปลี่ยน{' '}
            <Link href="/trade-in/" className="font-semibold text-brand underline underline-offset-4">
              ดูมูลค่าเทิร์นได้ที่หน้าเทิร์นแอร์เก่า
            </Link>
          </p>
        </div>
      </Section>

      <RelatedGuides page="/installation/" />

      <CtaBand
        title="พร้อมติดตั้งแอร์ ขอใบเสนอราคาได้เลย"
        lead="ใส่ขนาดและจำนวนเครื่องในใบเสนอราคา ทีมสำรวจหน้างานแล้วแจ้งราคาจริงก่อนเริ่มงานทุกครั้ง"
        actions={
          <>
            <Button data-page-cta href="/quote/" size="lg" icon="quote">
              ดูใบเสนอราคา
            </Button>
            <Button href="/products/" size="lg" variant="ghost">
              เลือกเครื่องใหม่
            </Button>
          </>
        }
        aside={
          <div className="flex flex-col gap-2 text-small">
            <Badge tone="outline" icon="clock">
              {COMPANY.hours}
            </Badge>
            <a className="font-medium underline underline-offset-4" href={COMPANY.telHref}>
              โทร {COMPANY.tel}
            </a>
          </div>
        }
      />
    </>
  );
}
