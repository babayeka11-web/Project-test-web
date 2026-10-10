// "ควรล้างบ่อยแค่ไหน": recommended cleaning intervals by place, the signs a unit is due and what owners can do between visits.
// General practice, not a promise — the real need depends on dust and hours of use. Server component.
import { Card, Icon, Notice } from '@/components/ui';
import { CARE_TIPS, DUE_SIGNS, INTERVALS } from './content';

export function Intervals() {
  return (
    <div className="grid grid-cols-1 gap-8">
      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {INTERVALS.map(i => (
          <li key={i.id} className="flex min-w-0">
            <Card padding="md" className="flex w-full gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
                <Icon name={i.icon} size={24} />
              </span>
              <div className="min-w-0">
                <p className="text-small font-medium text-ink">{i.place}</p>
                <p className="mt-1 flex items-baseline gap-2 text-ink-2">
                  <span>ทุก</span>
                  <span className="font-display text-[2.25rem] font-bold leading-none tabular-nums text-brand">{i.months}</span>
                  <span>เดือน</span>
                </p>
                <p className="mt-2 text-meta text-ink-3">{i.detail}</p>
              </div>
            </Card>
          </li>
        ))}
        <li className="flex min-w-0 sm:col-span-2 lg:col-span-1">
          <Card tone="soft" padding="md" className="w-full">
            <h3 className="text-h3">แบบนี้ถึงเวลาล้างแล้ว</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {DUE_SIGNS.map(s => (
                <li key={s} className="rounded-full border border-line bg-surface px-3.5 py-1.5 text-small text-ink">
                  {s}
                </li>
              ))}
            </ul>
          </Card>
        </li>
      </ul>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {CARE_TIPS.map(t => (
          <Notice key={t.t} tone={t.ok ? 'ok' : 'warn'} icon={t.ok ? 'check' : 'alert'} title={t.ok ? 'ทำเองได้ระหว่างรอบ' : 'ไม่ควรทำเอง'}>
            {t.t}
          </Notice>
        ))}
      </div>
      <p className="text-meta text-ink-3">ความถี่เป็นแนวทางทั่วไป ห้องที่มีฝุ่นมาก ใช้งานนานต่อวัน หรือมีไอน้ำมัน ควรล้างถี่กว่านี้</p>
    </div>
  );
}
