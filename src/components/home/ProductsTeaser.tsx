// Buying an air conditioner: catalogue size in three figures, the five unit types as shortcuts into /products/, and the
// company's own FUJIVA brand (no Pricebook prices yet → ask the sales team). Counts come from the Pricebook; server only.
import Image from 'next/image';
import Link from 'next/link';
import { TypeArt } from '@/components/shared/TypeArt';
import { Badge, Button, Card, Icon, Section, Stat } from '@/components/ui';
import { NOTES } from '@/lib/domain/constants';
import { getBrands, getCatalogLite, getSkuCount } from '@/lib/domain/pricebook';
import { TYPE_BY_ID, TYPE_IDS } from '@/lib/domain/types';
import { asset } from '@/lib/site';

const n = (v: number) => v.toLocaleString('en-US');

export function ProductsTeaser() {
  const series = getCatalogLite();
  const brands = getBrands().filter((b) => !b.own);
  const perType = TYPE_IDS.map((id) => ({ id, count: series.filter((s) => s.type === id).length })).filter((t) => t.count > 0);

  return (
    <Section
      id="products"
      eyebrow="ซื้อแอร์"
      title="เลือกแอร์ได้ทุกชนิด พร้อมราคาและแพ็กเกจติดตั้ง"
      lead="ดูรุ่น เทียบราคา แล้วใส่ใบเสนอราคาพร้อมค่าติดตั้งได้ในหน้าเดียว"
      actions={
        <Button href="/products/" variant="secondary" iconEnd="arrow-right">
          ดูแอร์ทุกรุ่น
        </Button>
      }
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-14">
        <div className="flex min-w-0 flex-col gap-10">
          <dl className="grid grid-cols-3 gap-4">
            <Stat size="lg" value={n(getSkuCount())} label="รุ่นพร้อมราคา" />
            <Stat size="lg" value={n(series.length)} label="ซีรีส์" />
            <Stat size="lg" value={n(brands.length)} label="ยี่ห้อ" />
          </dl>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
            {perType.map(({ id, count }) => (
              <li key={id}>
                <Link
                  href={`/products/?type=${id}`}
                  className="lift flex h-full flex-col items-center gap-2 rounded-card border border-line bg-surface p-4 text-center shadow-card no-underline"
                >
                  <TypeArt type={id} className="h-14 w-auto text-brand" aria-hidden />
                  <span className="text-small font-semibold text-ink">{TYPE_BY_ID[id].th}</span>
                  <span className="text-meta text-ink-3">{n(count)} ซีรีส์</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <Card tone="soft" padding="lg" className="flex flex-col gap-5 self-start">
          <Image src={asset('/brand/fujiva.png')} alt="FUJIVA" width={288} height={92} unoptimized className="h-9 w-auto dark:hidden" />
          <Image src={asset('/brand/fujiva-light.png')} alt="FUJIVA" width={288} height={92} unoptimized className="hidden h-9 w-auto dark:block" />
          <div className="flex flex-col gap-2">
            <h3 className="text-h3">FUJIVA แบรนด์ของบริษัท</h3>
            <p className="text-small text-ink-2">แอร์แบรนด์ของบริษัทเอง ยังไม่มีราคาบนเว็บ ทีมขายแจ้งรุ่นและราคาให้ตามขนาดห้องของคุณ</p>
          </div>
          <Badge tone="sky" size="md" icon="tag" className="self-start">
            {NOTES.askSales}
          </Badge>
          <Button href="/contact/?topic=fujiva" variant="ghost" icon="phone" className="self-start">
            คุยกับทีมขาย
          </Button>
        </Card>
      </div>
      <p className="mt-8 flex items-center gap-2 text-small text-ink-2">
        <Icon name="info" size={16} className="shrink-0 text-sky" />
        ราคาเครื่องและค่าติดตั้งเป็นราคามาตรฐานก่อน VAT ทีมยืนยันอีกครั้งในใบเสนอราคา
      </p>
    </Section>
  );
}
