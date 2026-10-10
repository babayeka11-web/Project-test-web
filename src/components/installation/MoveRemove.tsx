// "ย้ายแอร์ · รื้อแอร์": relocation by size and type, removal per unit and carrying the old unit away. Server component —
// the rows come from the Pricebook through build.ts; AddToQuote is the only client part.
import { Card, Price, Tabs } from '@/components/ui';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { installItemLine } from '@/lib/domain/install';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { INSTALL_TYPES, type InstallType, type MoveBand, type RateRef } from './types';

const band = (lo: number, hi: number) => `${lo.toLocaleString('en-US')}–${hi.toLocaleString('en-US')} BTU`;

function RateRow({ title, hint, item }: { title: string; hint?: string; item: RateRef }) {
  const survey = item.ex == null;
  return (
    <li className="grid grid-cols-1 gap-3 border-b border-line py-4 first:pt-0 last:border-b-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-6">
      <div className="min-w-0">
        <p className="font-medium text-ink">{title}</p>
        {hint && <p className="mt-0.5 text-meta text-ink-3">{hint}</p>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:justify-end">
        <Price amount={item.ex} unit={item.unit ? `/ ${item.unit}` : undefined} fallback="ประเมินหน้างาน" />
        <AddToQuote size="sm" label={survey ? 'ขอประเมินหน้างาน' : 'ใส่ใบเสนอราคา'} lines={[installItemLine(item)]} />
      </div>
    </li>
  );
}

export function MoveRemove({ move, remove, dispose }: { move: Record<InstallType, MoveBand[]>; remove: RateRef[]; dispose: RateRef | null }) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card padding="lg" as="section" className="flex min-w-0 flex-col gap-5" aria-labelledby="move-title">
        <div>
          <h3 id="move-title" className="text-h3">
            ย้ายแอร์ไปจุดใหม่
          </h3>
          <p className="mt-1 text-small text-ink-2">ราคารวมรื้อเครื่องเดิมและติดตั้งมาตรฐานที่จุดใหม่ ต่อเครื่อง</p>
        </div>
        <Tabs
          label="ประเภทแอร์ที่ย้าย"
          variant="pill"
          items={INSTALL_TYPES.map(t => ({
            id: t,
            label: TYPE_BY_ID[t].th,
            content: (
              <ul className="flex flex-col">
                {move[t].map(b => (
                  <RateRow key={b.item.code} title={band(b.lo, b.hi)} item={b.item} />
                ))}
              </ul>
            ),
          }))}
          panelClassName="pt-4"
        />
      </Card>

      <Card padding="lg" as="section" className="flex min-w-0 flex-col gap-5" aria-labelledby="remove-title">
        <div>
          <h3 id="remove-title" className="text-h3">
            รื้อแอร์ ไม่ติดตั้งใหม่
          </h3>
          <p className="mt-1 text-small text-ink-2">รื้อเครื่องและเก็บน้ำยากลับคอยล์ร้อน ต่อเครื่อง</p>
        </div>
        <ul className="flex flex-col">
          {remove.map(r => (
            <RateRow key={r.code} title={r.name} item={r} />
          ))}
          {dispose && <RateRow title={dispose.name} hint="ขนเครื่องเดิมออกจากพื้นที่ ใช้ร่วมกับงานรื้อหรืองานเปลี่ยนเครื่อง" item={dispose} />}
        </ul>
      </Card>
    </div>
  );
}
