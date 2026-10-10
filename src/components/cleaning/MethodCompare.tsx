// C1 (ล้างปกติ) next to C2 (ล้างใหญ่): what comes off, what is washed, time, the record you get and when to choose it.
// Server component — copy lives in content.ts, times in the domain layer (JOB_TIME), prices come from the page as props.
import { Badge, Card, Icon, Price } from '@/components/ui';
import { LEVEL_TH, METHOD_INFO, type CleanLevel } from '@/lib/domain/cleaning';
import { JOB_TIME, TIME_NOTE, timeTh } from '@/lib/domain/content';
import { TYPE_BY_ID, type AcTypeId } from '@/lib/domain/types';
import { METHOD_COMPARE, NOT_INCLUDED, type MethodCompare as Method } from './content';

/** '30–60 นาที' → 'ติดผนัง'; types with the same estimate share a line. */
function timeLines(level: CleanLevel): { time: string; types: string }[] {
  const out = new Map<string, string[]>();
  (Object.entries(JOB_TIME[level]) as [AcTypeId, readonly [number, number]][]).forEach(([t, range]) => {
    const k = timeTh(range);
    out.set(k, [...(out.get(k) ?? []), TYPE_BY_ID[t].th]);
  });
  return [...out].map(([time, types]) => ({ time, types: types.join(' · ') }));
}

function List({ title, items, icon }: { title: string; items: readonly string[]; icon: 'check' | 'minus' | 'info' }) {
  return (
    <div>
      <h4 className="mb-2 text-small font-semibold text-ink">{title}</h4>
      <ul className="grid grid-cols-1 gap-1.5">
        {items.map(x => (
          <li key={x} className="flex gap-2.5 text-small text-ink-2">
            <Icon name={icon} size={16} className="mt-[0.35em] shrink-0 text-brand" strokeWidth={2.25} />
            <span>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MethodCard({ m, from, deep }: { m: Method; from: number | null; deep?: boolean }) {
  return (
    <Card padding="md" className="flex h-full flex-col gap-6" tone={deep ? 'sky' : 'surface'}>
      <header className="grid grid-cols-1 gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone={deep ? 'brand' : 'sky'} size="md">
            {m.level}
          </Badge>
          <Price amount={from} prefix="เริ่ม" unit="/ เครื่อง" size="md" tone="brand" />
        </div>
        <h3 className="text-h3">
          {LEVEL_TH[m.level].th} ({m.level})
        </h3>
        <p className="text-small text-ink-2">{METHOD_INFO.find(x => x.id === m.level)?.d}</p>
      </header>

      <div>
        <h4 className="mb-2 text-small font-semibold text-ink">เวลาหน้างานโดยประมาณ ต่อเครื่อง</h4>
        <dl className="grid grid-cols-1 gap-1.5 text-small">
          {timeLines(m.level).map(l => (
            <div key={l.time} className="flex flex-wrap items-baseline justify-between gap-x-4">
              <dt className="text-ink-2">{l.types}</dt>
              <dd className="font-semibold tabular-nums text-ink">{l.time}</dd>
            </div>
          ))}
        </dl>
      </div>

      <List title="ถอดออกมาล้าง" items={m.removed} icon="minus" />
      <List title="ล้างอะไรบ้าง" items={m.washed} icon="check" />

      <div>
        <h4 className="mb-2 text-small font-semibold text-ink">เอกสารที่ได้</h4>
        <p className="text-small text-ink-2">{m.record}</p>
      </div>

      <div className="mt-auto rounded-control bg-surface-2 p-4">
        <h4 className="mb-2 text-small font-semibold text-ink">เลือกแบบนี้เมื่อ</h4>
        <ul className="grid grid-cols-1 gap-1.5">
          {m.when.map(x => (
            <li key={x} className="flex gap-2.5 text-small text-ink">
              <Icon name="arrow-right" size={16} className="mt-[0.35em] shrink-0 text-brand" />
              <span>{x}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

export function MethodCompare({ from }: { from: Record<CleanLevel, number | null> }) {
  const c3 = METHOD_INFO.find(x => x.id === 'C3');
  return (
    <div className="grid grid-cols-1 gap-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {METHOD_COMPARE.map(m => (
          <MethodCard key={m.level} m={m} from={from[m.level]} deep={m.level === 'C2'} />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <Card tone="soft" padding="md">
          <h3 className="mb-3 text-h3">ไม่รวมทั้งสองแบบ</h3>
          <ul className="flex flex-wrap gap-2">
            {NOT_INCLUDED.map(x => (
              <li key={x}>
                <Badge tone="outline" size="md">
                  {x}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-small text-ink-2">ถ้าพบว่าต้องซ่อมระหว่างล้าง ช่างแจ้งก่อนและทำต่อเมื่อคุณอนุมัติ</p>
        </Card>
        <Card tone="soft" padding="md">
          <h3 className="mb-3 text-h3">{c3?.th ?? 'ตัดล้าง (C3)'}</h3>
          <p className="text-small text-ink-2">{c3?.d}</p>
          <p className="mt-4 text-meta text-ink-3">{TIME_NOTE}</p>
        </Card>
      </div>
    </div>
  );
}
