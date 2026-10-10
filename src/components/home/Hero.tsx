// Home hero: the page's only <h1>. Cleaning first — the headline price comes from the Pricebook (cleanFrom), the 3D unit
// is a lazy client component on top of a still illustration (HeroVisual).
import { AirLines, Button, Container, Eyebrow, Icon, Price } from '@/components/ui';
import { HeroVisual } from './HeroVisual';

const TRUST = ['ทีมช่างของบริษัท', 'รายงานหลังงานรายเครื่อง', 'ใบกำกับภาษีเต็มรูป', 'ราคามาตรฐานก่อน VAT ชัดเจน'] as const;

export function Hero({ from }: { from: number }) {
  return (
    <header className="relative isolate -mt-header overflow-hidden bg-air pt-header">
      <AirLines
        animate
        className="absolute -right-40 top-4 -z-10 h-56 w-[40rem] max-w-none text-sky opacity-45 md:-right-10 md:top-10 md:h-[24rem] md:w-[52rem] lg:h-[30rem] lg:w-[68rem]"
      />
      <Container className="pb-12 pt-8 sm:pt-12 md:pb-16 lg:pb-20 lg:pt-14">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-12">
          <div className="flex min-w-0 flex-col gap-6">
            <Eyebrow>ล้าง · ติดตั้ง · ซ่อม · ขายแอร์ · กรุงเทพฯ และปริมณฑล</Eyebrow>
            <h1 className="text-display">ล้างแอร์โดยทีมช่างของบริษัท</h1>
            <div className="flex flex-col gap-1">
              <p className="text-small text-ink-2">ล้างแอร์ติดผนัง · ล้างปกติ</p>
              <Price amount={from} prefix="เริ่ม" unit="/ เครื่อง" size="xl" tone="brand" />
            </div>
            <p className="max-w-[36rem] text-lead text-ink-2">
              เลือกชนิดและจำนวนเครื่อง ดูยอดรวมก่อน VAT ได้ทันที ทีมโทรยืนยันคิวและราคาก่อนเข้างานทุกครั้ง
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="#book" size="lg" icon="clean">
                จองล้างแอร์
              </Button>
              <Button href="/prices/" size="lg" variant="ghost">
                ดูค่าบริการทั้งหมด
              </Button>
            </div>
            <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 text-small text-ink-2 xs:grid-cols-2">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-2.5">
                  <span aria-hidden className="grid size-5 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
                    <Icon name="check" size={13} strokeWidth={2.5} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <HeroVisual />
        </div>
      </Container>
    </header>
  );
}
