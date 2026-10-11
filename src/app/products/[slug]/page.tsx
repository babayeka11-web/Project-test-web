// /products/[slug]/ — one series: every size with its price, the specs the sizes share, and where to go next.
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TypeArt } from '@/components/shared/TypeArt';
import { Badge, Button, Card, CtaBand, Icon, PageHeader, Price, Section, Table } from '@/components/ui';
import { stdInstallEx } from '@/components/catalog/catalog-data';
import { modelPath, modelSlugs, productsPath, seriesPath } from '@/components/catalog/slug';
import { sharedSpecs } from '@/components/catalog/spec';
import { NOTES } from '@/lib/domain/constants';
import { baht, btuFmt, EX_TH } from '@/lib/domain/format';
import { getCatalog, getSeriesBySlug, getSeriesSlugs } from '@/lib/domain/pricebook';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { SITE_URL } from '@/lib/site';

export const dynamicParams = false;
export const generateStaticParams = () => getSeriesSlugs().map(slug => ({ slug }));

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const m = getSeriesBySlug(slug);
  if (!m) return {};
  const first = m.skus[0];
  const last = m.skus[m.skus.length - 1];
  const sizes = first.btu === last.btu ? btuFmt(first.btu) : `${btuFmt(first.btu)} ถึง ${btuFmt(last.btu)}`;
  return {
    title: `${m.brandName} ${m.series} แอร์${TYPE_BY_ID[m.type].th}`,
    description: `แอร์${TYPE_BY_ID[m.type].th} ${m.brandName} ซีรีส์ ${m.series} ${m.skus.length} ขนาด ${sizes} ราคาเริ่ม ${baht(Math.min(...m.skus.map(k => k.price)))} ${EX_TH} ดูราคาติดตั้งมาตรฐานและสเปกทุกรุ่น`,
    alternates: { canonical: './' },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const m = getSeriesBySlug(slug);
  if (!m) notFound();

  const type = TYPE_BY_ID[m.type];
  const slugs = modelSlugs(m.skus);
  const first = m.skus[0];
  const last = m.skus[m.skus.length - 1];
  const from = Math.min(...m.skus.map(k => k.price));
  const specs = sharedSpecs(m.skus);
  const name = `${m.brandName} ${m.series}`;
  const others = getCatalog()
    .filter(x => x.brand === m.brand && x.slug !== m.slug)
    .slice(0, 6);

  const rows = m.skus.map((k, i) => {
    const std = stdInstallEx(m.type, k.btu);
    return { k, href: modelPath(m.slug, slugs[i]), total: std != null ? k.price + std : null };
  });

  // the sizes of this series as a list of their own pages (each model page carries the Product data)
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `ขนาดและราคาของ ${name}`,
    numberOfItems: rows.length,
    itemListElement: rows.map((r, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}${r.href}`,
      name: `${m.brandName} ${r.k.sku} ${btuFmt(r.k.btu)}`,
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'แอร์ทุกรุ่น', href: productsPath }, { label: name }]}
        eyebrow={`แอร์${type.th}`}
        title={name}
        lead={`${m.inverter ? 'Inverter' : 'Fixed speed'} · น้ำยา ${m.label || '—'} · ${m.skus.length} ขนาด ตั้งแต่ ${btuFmt(first.btu)}${first.btu === last.btu ? '' : ` ถึง ${btuFmt(last.btu)}`}`}
        actions={
          <Button href="#sizes" variant="secondary" icon="arrow-right">
            ดูทุกขนาดและราคา
          </Button>
        }
        aside={
          <Card padding="md" className="flex items-center gap-5">
            <div className="grid shrink-0 place-items-center rounded-control bg-air-soft px-3 py-3">
              <TypeArt type={m.type} aria-hidden="true" className="h-20 w-28 text-brand" />
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <Price amount={from} prefix="เริ่ม" size="lg" />
              <p className="text-meta text-ink-3">ภาพประกอบประเภทแอร์ ไม่ใช่ภาพเครื่องจริง</p>
            </div>
          </Card>
        }
      />

      <Section id="sizes" eyebrow="ขนาดและราคา" title={`ทุกขนาดของ ${name}`} lead="เลือกขนาดเพื่อดูแพ็กเกจติดตั้ง ตัวเลือกเพิ่ม และใส่ใบเสนอราคา">
        <div className="hidden md:block">
          <Table
            caption={`ขนาดและราคาของ ${name} ราคาก่อน VAT`}
            minWidth="44rem"
            columns={[
              { key: 'btu', label: 'ขนาด', rowHeader: true, numeric: true },
              { key: 'sku', label: 'รหัสรุ่น' },
              { key: 'price', label: 'ราคาเครื่อง (ก่อน VAT)', align: 'end', numeric: true },
              { key: 'total', label: 'พร้อมติดตั้งมาตรฐาน (ก่อน VAT)', align: 'end', numeric: true },
              { key: 'go', label: <span className="sr-only">ดูรุ่น</span>, align: 'end' },
            ]}
            rows={rows.map(r => ({
              id: r.k.sku,
              btu: btuFmt(r.k.btu),
              sku: <span className="break-all font-mono text-small">{r.k.sku}</span>,
              price: <Price amount={r.k.price} size="sm" vat={false} />,
              total: r.total != null ? <Price amount={r.total} size="sm" vat={false} /> : <span className="text-ink-2">สำรวจหน้างานก่อน</span>,
              go: (
                // the visible words first, then which model (WCAG 2.5.3: the name contains what is on screen)
                <Button href={r.href} variant="soft" size="sm">
                  ดูรุ่นนี้<span className="sr-only"> {r.k.sku} {btuFmt(r.k.btu)}</span>
                </Button>
              ),
            }))}
            footnote={`${NOTES.source} · ยืนยันสต็อกก่อนสั่ง`}
          />
        </div>
        <div className="md:hidden">
          <ul className="flex flex-col gap-3">
            {rows.map(r => (
              <li key={r.k.sku}>
                <Card padding="sm" className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-h3">{btuFmt(r.k.btu)}</p>
                      <p className="break-all font-mono text-meta text-ink-3">{r.k.sku}</p>
                    </div>
                    <Price amount={r.k.price} size="md" stacked className="items-end text-right" />
                  </div>
                  <p className="text-small text-ink-2">
                    {r.total != null ? (
                      <>
                        พร้อมติดตั้งมาตรฐาน <strong className="font-semibold text-ink">{baht(r.total)}</strong> {EX_TH}
                      </>
                    ) : (
                      'ติดตั้ง: สำรวจหน้างานก่อนเสนอราคา'
                    )}
                  </p>
                  <Button href={r.href} variant="soft" fullWidth>
                    ดูรุ่นนี้<span className="sr-only"> {r.k.sku} {btuFmt(r.k.btu)}</span>
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-meta text-ink-3">{NOTES.source} · ยืนยันสต็อกก่อนสั่ง</p>
        </div>
      </Section>

      {specs.length > 0 && (
        <Section id="specs" tone="soft" title="สเปกที่ทุกขนาดมีเหมือนกัน" lead="ขนาดเครื่อง น้ำหนัก และท่อน้ำยาแต่ละขนาดต่างกัน ดูได้ในหน้าของแต่ละรุ่น">
          <Card padding="md">
            <dl className="grid grid-cols-1 gap-x-10 gap-y-4 sm:grid-cols-2">
              {specs.map(s => (
                <div key={s.th} className="flex flex-col gap-0.5 border-b border-line pb-3">
                  <dt className="text-small text-ink-3">{s.th}</dt>
                  <dd className="font-medium text-ink">{s.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </Section>
      )}

      {others.length > 0 && (
        <Section id="others" eyebrow={m.brandName} title={`ซีรีส์อื่นของ ${m.brandName}`} spacing="compact">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {others.map(o => (
              <li key={o.slug}>
                <Link
                  href={seriesPath(o.slug)}
                  className="lift flex min-h-11 items-center justify-between gap-3 rounded-card border border-line bg-surface p-4 text-ink no-underline shadow-card hover:text-brand"
                >
                  <span className="min-w-0">
                    <span className="block font-semibold">{o.series}</span>
                    <span className="block text-meta text-ink-3">
                      {TYPE_BY_ID[o.type].th} · {btuFmt(o.skus[0].btu)}
                      {o.skus.length > 1 ? ` – ${btuFmt(o.skus[o.skus.length - 1].btu)}` : ''}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={20} className="shrink-0 text-ink-3" />
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <CtaBand
        id="help"
        title="ไม่แน่ใจว่าขนาดไหนเหมาะกับห้อง"
        lead={`บอกขนาดห้องและการใช้งาน ทีมช่วยเลือกขนาดของ ${name} ให้ และแจ้งราคาติดตั้งตามหน้างานจริง`}
        actions={
          <>
            <Button data-page-cta href="/knowledge/" variant="primary" icon="thermometer">
              หาขนาด BTU ที่เหมาะ
            </Button>
            <Button href="/contact/?topic=buy" variant="secondary" icon="chat">
              คุยกับทีมขาย
            </Button>
          </>
        }
        aside={<Badge tone="outline">ราคาทั้งหมดก่อน VAT</Badge>}
      />
    </>
  );
}
