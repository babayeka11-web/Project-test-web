// Service area teaser: the three zones and the travel rule in words, with a simple (not-to-scale) ring diagram.
// All figures come from the travel module / constants — nothing typed here.
import { Badge, Button, Icon, Section, cn } from '@/components/ui';
import { MIN_BILL, NOTES } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { TIER_TH, TRAVEL } from '@/lib/domain/travel';

const RINGS = [
  { tier: 'core', swatch: 'bg-sky border-sky' },
  { tier: 'extended', swatch: 'bg-sky-soft border-sky' },
  { tier: 'out', swatch: 'bg-surface border-dashed border-line-strong' },
] as const;

export function AreaTeaser() {
  return (
    <Section
      id="area"
      tone="soft"
      eyebrow="พื้นที่ให้บริการ"
      title="กรุงเทพฯ และปริมณฑล เห็นค่าเดินทางก่อนจอง"
      lead="พิมพ์ชื่อแขวง เขต หรือรหัสไปรษณีย์ ระบบบอกโซนและค่าเดินทางให้ ทีมยืนยันอีกครั้งในใบเสนอราคา"
      actions={
        <Button href="/area/" variant="secondary" icon="pin" iconEnd="arrow-right">
          เช็กพื้นที่ของคุณ
        </Button>
      }
    >
      <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-16">
        <div className="flex min-w-0 flex-col gap-6">
          <ul className="flex flex-col gap-5">
            {RINGS.map((r) => (
              <li key={r.tier} className="flex gap-4">
                <span aria-hidden className={cn('mt-1.5 size-4 shrink-0 rounded-full border-2', r.swatch)} />
                <div className="flex min-w-0 flex-col gap-1">
                  <h3 className="text-h3">{TIER_TH[r.tier].th}</h3>
                  <p className="text-small text-ink-2">{TIER_TH[r.tier].note}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="flex gap-3 rounded-card bg-surface p-4 text-small text-ink-2 shadow-card">
            <Icon name="info" size={20} className="mt-0.5 shrink-0 text-sky" />
            <span>
              งานล้างต่อการเข้างานต่ำกว่า {baht(MIN_BILL)} ก่อน VAT คิดค่าเดินทาง {baht(TRAVEL.baseFee)} ล้างหลายเครื่องในที่เดียวกันจึงคุ้มกว่า
            </span>
          </p>
        </div>
        <figure className="mx-auto flex w-full max-w-[22rem] flex-col items-center gap-3" aria-label="แผนผังโซนพื้นที่ให้บริการ">
          <div aria-hidden className="relative aspect-square w-full">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-line-strong bg-surface" />
            <div className="absolute inset-[17%] rounded-full border-2 border-sky bg-sky-soft" />
            <div className="absolute inset-[37%] rounded-full border-2 border-sky bg-sky/25" />
            <span className="absolute left-1/2 top-1/2 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-on-brand shadow-pop">
              <Icon name="pin" size={22} />
            </span>
          </div>
          <figcaption className="flex flex-wrap items-center justify-center gap-2 text-center text-meta text-ink-3">
            <span>สำนักงานใหญ่ พระราม 2 อยู่ตรงกลาง</span>
            <Badge tone="outline" icon="info">
              {NOTES.simulation} · ไม่ใช่แผนที่จริง
            </Badge>
          </figcaption>
        </figure>
      </div>
    </Section>
  );
}
