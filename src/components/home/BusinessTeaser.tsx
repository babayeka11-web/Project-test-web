// For organisations: the annual cleaning contract, with a live estimate for one preset building (30 units, 3 visits a year).
// Server component — it reads the Pricebook rate table at build time (never import it from a client component).
import Link from 'next/link';
import { Badge, Button, Card, Icon, Price, Section } from '@/components/ui';
import { PKG_TH } from '@/lib/domain/cleaning';
import { NOTES } from '@/lib/domain/constants';
import { estimateContract, PRESETS } from '@/lib/domain/contract';
import { baht, up100, VAT } from '@/lib/domain/format';
import { getCleanRateTable } from '@/lib/domain/pricebook';
import { TIER_TH } from '@/lib/domain/travel';
import { TYPE_BY_ID } from '@/lib/domain/types';

const POINTS = ['ทีมวางรอบล้างล่วงหน้าทั้งปี', 'ได้อัตราตามจำนวนเครื่อง', 'มีรายงานตามแพ็กเกจหลังทุกรอบ', 'วางบิลตามรอบ'] as const;

export function BusinessTeaser() {
  const preset = PRESETS.find((p) => p.id === 'office-m') ?? PRESETS[0];
  const est = estimateContract(getCleanRateTable(), { units: preset.units, visits: 3, pkg: 'Standard Care', deep: true });
  const deepVisits = 1; // one of the visits is a deep clean (C2), as in the contract calculator default

  return (
    <Section id="business" tone="brand" eyebrow="สำหรับองค์กร" title="สัญญาล้างรายปี" lead="วางรอบล้างทั้งปีล่วงหน้า ไม่ต้องไล่เรียกช่างทีละครั้ง เหมาะกับสำนักงาน โรงงาน และอาคาร">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:items-start lg:gap-16">
        <div className="flex flex-col gap-8">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-ink">
                <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-sky-soft text-brand">
                  <Icon name="check" size={14} strokeWidth={2.5} />
                </span>
                {p}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <Button href="/business/" variant="secondary" size="lg" iconEnd="arrow-right">
              ดูสัญญาและคำนวณราคา
            </Button>
          </div>
        </div>
        {est && (
          <Card padding="lg" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-ink">
                ตัวอย่าง: {preset.th} · {est.count} เครื่อง
              </p>
              <Badge tone="outline" icon="info">
                {NOTES.estimate}
              </Badge>
            </div>
            <div className="flex flex-col gap-1" aria-label="ยอดต่อปีของตัวอย่าง">
              <Price amount={est.annualEx} unit="/ ปี" size="xl" tone="brand" />
              <p className="text-small text-ink-2">
                รวม VAT {Math.round(VAT * 100)}% เป็น {baht(est.annualInc)} · เฉลี่ยประมาณ {baht(up100(est.perUnitYear))} ต่อเครื่องต่อปี
              </p>
            </div>
            <dl className="flex flex-col gap-3 border-t border-line pt-4 text-small">
              {[
                ['เครื่องในอาคาร', est.lines.map((l) => `${TYPE_BY_ID[l.type].th} ${l.n}`).join(' · ')],
                ['รอบล้างต่อปี', `${est.visits} รอบ · ล้างปกติ ${est.visits - deepVisits} รอบ + ล้างใหญ่ ${deepVisits} รอบ`],
                ['แพ็กเกจ', PKG_TH['Standard Care'].th],
                ['พื้นที่', TIER_TH.core.th],
              ].map(([k, v]) => (
                <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:gap-6">
                  <dt className="text-ink-3 sm:w-28 sm:shrink-0">{k}</dt>
                  <dd className="min-w-0 text-ink">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="text-meta text-ink-3">
              {NOTES.volume}{' '}
              <Link href="/business/" className="font-semibold text-brand underline-offset-4 hover:underline">
                เปลี่ยนจำนวนเครื่องและรอบล้าง
              </Link>
            </p>
          </Card>
        )}
      </div>
    </Section>
  );
}
