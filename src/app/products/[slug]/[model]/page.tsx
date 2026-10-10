// /products/[slug]/[model]/ — one page per SKU: price, installation package and add-ons with a live total, materials,
// the full spec and the other sizes of the series.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Configurator } from '@/components/catalog/Configurator';
import { MaterialsTable, PipeBundleBlock } from '@/components/catalog/Materials';
import { allModelParams, findModel, pageOptions, stdInstallEx } from '@/components/catalog/catalog-data';
import { modelPath, productsPath, seriesPath } from '@/components/catalog/slug';
import { sizeLabels, specRows } from '@/components/catalog/spec';
import { TypeArt } from '@/components/shared/TypeArt';
import { Badge, Button, Card, CtaBand, Icon, PageHeader, Price, Section, Table } from '@/components/ui';
import { baht, btuFmt, EX_TH, thousands } from '@/lib/domain/format';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { SITE_URL } from '@/lib/site';

export const dynamicParams = false;
export const generateStaticParams = () => allModelParams();

type Props = { params: Promise<{ slug: string; model: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, model } = await params;
  const hit = findModel(slug, model);
  if (!hit) return {};
  const { series: m, sku: k } = hit;
  return {
    title: `${m.brandName} ${k.sku} ${btuFmt(k.btu)}`,
    description: `แอร์${TYPE_BY_ID[m.type].th} ${m.brandName} ซีรีส์ ${m.series} ขนาด ${btuFmt(k.btu)} ราคาเครื่อง ${baht(k.price)} ${EX_TH} เลือกแพ็กเกจติดตั้ง ดูสเปก และใส่ใบเสนอราคา ยืนยันสต็อกก่อนสั่ง`,
    alternates: { canonical: './' },
  };
}

export default async function ModelPage({ params }: Props) {
  const { slug, model } = await params;
  const hit = findModel(slug, model);
  if (!hit) notFound();
  const { series: m, sku: k, index, slugs } = hit;

  const type = TYPE_BY_ID[m.type];
  const name = `${m.brandName} ${m.series}`;
  const options = pageOptions(m.type, k.btu);
  const std = stdInstallEx(m.type, k.btu);
  const hasInstall = options.install.length > 0;
  const system = m.inverter ? 'Inverter' : 'Fixed speed';
  const url = `${SITE_URL}${modelPath(m.slug, model)}`;
  const chipLabels = sizeLabels(m.skus.map(s => s.btu), thousands);

  // other sizes: nearest first, at most six
  const others = m.skus
    .map((s, i) => ({ s, i }))
    .filter(x => x.i !== index)
    .sort((a, b) => Math.abs(a.i - index) - Math.abs(b.i - index))
    .slice(0, 6)
    .sort((a, b) => a.i - b.i);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `${m.brandName} ${k.sku} ${btuFmt(k.btu)}`,
    sku: k.sku,
    mpn: k.sku,
    category: `แอร์${type.th}`,
    description: `แอร์${type.th} ${m.brandName} ซีรีส์ ${m.series} ${btuFmt(k.btu)} ${system}`,
    brand: { '@type': 'Brand', name: m.brandName },
    url,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'THB',
      price: k.price,
      priceSpecification: { '@type': 'UnitPriceSpecification', priceCurrency: 'THB', price: k.price, valueAddedTaxIncluded: false },
      seller: { '@type': 'Organization', name: 'บริษัท สหบูรพากรุ๊ป จำกัด' },
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHeader
        breadcrumbs={[
          { label: 'หน้าแรก', href: '/' },
          { label: 'สินค้า', href: productsPath },
          { label: name, href: seriesPath(m.slug) },
          { label: k.sku },
        ]}
        eyebrow={`แอร์${type.th} · ${system}`}
        title={<span className="[overflow-wrap:anywhere]">{`${m.brandName} ${k.sku} ${btuFmt(k.btu)}`}</span>}
        lead={`ซีรีส์ ${m.series} · น้ำยา ${m.label || '—'}`}
        actions={
          m.skus.length > 1 ? (
            <nav aria-label="เปลี่ยนขนาดของซีรีส์นี้" className="flex w-full flex-col gap-2">
              <p className="text-small font-semibold text-ink">เปลี่ยนขนาด (BTU)</p>
              <ul className="flex flex-wrap gap-2">
                {m.skus.map((s, i) => {
                  const current = i === index;
                  return (
                    <li key={s.sku}>
                      <Link
                        href={modelPath(m.slug, slugs[i])}
                        aria-current={current ? 'page' : undefined}
                        aria-label={`${btuFmt(s.btu)} รุ่น ${s.sku} ${baht(s.price)} ${EX_TH}${current ? ' (รุ่นนี้)' : ''}`}
                        className={
                          current
                            ? 'pressable inline-flex min-h-11 min-w-14 items-center justify-center rounded-full border border-brand bg-brand px-4 text-small font-semibold tabular-nums text-on-brand no-underline'
                            : 'pressable inline-flex min-h-11 min-w-14 items-center justify-center rounded-full border border-line-strong/50 bg-surface px-4 text-small font-semibold tabular-nums text-ink-2 no-underline hover:border-brand hover:text-brand'
                        }
                      >
                        {chipLabels[i]}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ) : undefined
        }
        aside={
          <Card padding="none" className="overflow-hidden">
            <div className="relative grid place-items-center bg-air-soft px-6 pb-5 pt-9">
              <TypeArt type={m.type} aria-hidden="true" className="h-32 w-44 text-brand" />
              <span className="absolute right-4 top-3 text-meta text-ink-3">ภาพประกอบ</span>
            </div>
            <div className="flex flex-col gap-2 p-5 sm:p-6">
              <Price amount={k.price} prefix="ราคาเครื่อง" size="xl" tone="brand" stacked />
              {std != null ? (
                <Price amount={k.price + std} prefix="พร้อมติดตั้งมาตรฐาน" size="sm" className="text-ink-2" />
              ) : (
                <p className="text-small text-ink-2">ติดตั้ง: ต้องสำรวจหน้างานก่อนเสนอราคา</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone="outline" icon="info">
                  ยืนยันสต็อกก่อนสั่ง
                </Badge>
                <Badge tone={k.spec.approved ? 'ok' : 'warn'}>{k.spec.approved ? 'ราคาอนุมัติ Pricebook 2569' : 'ราคาอ้างอิงตลาด ทีมยืนยันก่อนเสนอ'}</Badge>
              </div>
            </div>
          </Card>
        }
      />

      <Section id="buy" eyebrow="ซื้อพร้อมติดตั้ง" title="เลือกแพ็กเกจติดตั้งและดูราคารวม" lead="ปรับตัวเลือกแล้วยอดรวมเปลี่ยนทันที ทุกราคาเป็นราคามาตรฐานก่อน VAT">
        <Configurator brandName={m.brandName} type={m.type} sku={k.sku} btu={k.btu} price={k.price} options={options} />
      </Section>

      {hasInstall && (
        <Section id="materials" tone="soft" eyebrow="วัสดุติดตั้ง" title="มาตรฐานกับพรีเมียม ต่างกันอย่างไร" lead="วัสดุและงานที่รวมในราคาติดตั้งของเครื่องขนาดนี้ เทียบกันทีละรายการ ท่อน้ำยาเป็นทองแดง O-TWO 0.70 มม.">
          <div className="flex flex-col gap-8">
            <MaterialsTable columns={options.materials} install={options.install} />
            {options.bundle && <PipeBundleBlock bundle={options.bundle} />}
          </div>
        </Section>
      )}

      <Section id="specs" eyebrow="สเปก" title="สเปกเครื่อง" lead="ข้อมูลจากรายการสินค้าของบริษัท ช่องที่ไม่มีข้อมูลแสดงเป็น — เราไม่เดาค่าสเปก">
        <Table
          caption={`สเปก ${m.brandName} ${k.sku}`}
          minWidth="0"
          columns={[
            { key: 'th', label: 'รายการ', rowHeader: true, className: 'w-2/5' },
            { key: 'value', label: 'รายละเอียด' },
          ]}
          rows={specRows(k).map(r => ({ id: r.th, th: r.th, value: <span className="[overflow-wrap:anywhere]">{r.value}</span> }))}
        />
      </Section>

      {others.length > 0 && (
        <Section
          id="sizes"
          tone="soft"
          eyebrow="ซีรีส์เดียวกัน"
          title="ขนาดอื่นของซีรีส์นี้"
          actions={
            <Button href={seriesPath(m.slug)} variant="ghost" icon="arrow-right">
              ดูทุกขนาด
            </Button>
          }
        >
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map(({ s, i }) => {
              const sStd = stdInstallEx(m.type, s.btu);
              return (
                <li key={s.sku} className="flex">
                  <Link
                    href={modelPath(m.slug, slugs[i])}
                    className="lift flex w-full min-w-0 items-center justify-between gap-3 rounded-card border border-line bg-surface p-5 text-ink no-underline shadow-card hover:text-brand"
                  >
                    <span className="min-w-0">
                      <span className="block text-h3">{btuFmt(s.btu)}</span>
                      <span className="block break-all font-mono text-meta text-ink-3">{s.sku}</span>
                      <span className="mt-2 block">
                        <Price amount={s.price} size="md" />
                      </span>
                      {sStd != null && <span className="block text-meta text-ink-3">พร้อมติดตั้งมาตรฐาน {baht(s.price + sStd)}</span>}
                    </span>
                    <Icon name="chevron-right" size={20} className="shrink-0 text-ink-3" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <CtaBand
        id="help"
        title="อยากให้ทีมช่วยเลือกหรือสำรวจหน้างานก่อน"
        lead="บอกขนาดห้องและตำแหน่งติดตั้ง ทีมช่วยเลือกขนาดและแจ้งราคาติดตั้งตามหน้างานจริงในใบเสนอราคา"
        actions={
          <>
            <Button href="/contact/?topic=buy" variant="primary" icon="chat">
              คุยกับทีมขาย
            </Button>
            <Button href="/quote/" variant="secondary" icon="quote">
              ดูใบเสนอราคา
            </Button>
          </>
        }
      />
    </>
  );
}
