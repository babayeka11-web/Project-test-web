// "มาตรฐาน หรือ พรีเมียม": the two packages side by side for one example unit, what both include and leave out, the warranty and
// the survey rule. Server component — everything arrives from the Pricebook through build.ts.
import { AccordionItem, Badge, Card, Icon, Notice, Price } from '@/components/ui';
import { INCLUDED_PIPE_M, INSTALL_WARRANTY } from '@/lib/domain/install';
import type { CompareView } from './build';

/** 'รับประกันงานติดตั้ง 3 ปี (ซื้อเครื่องจากบริษัท)' → ['รับประกันงานติดตั้ง 3 ปี', 'ซื้อเครื่องจากบริษัท'] */
const splitWarranty = (s: string): [string, string] => {
  const m = s.match(/^(.*?)\s*\((.*)\)\s*$/);
  return m ? [m[1], m[2]] : [s, ''];
};

export function Compare({ view }: { view: CompareView }) {
  const [boughtTitle, boughtWhen] = splitWarranty(INSTALL_WARRANTY.boughtHere);
  const [ownTitle, ownWhen] = splitWarranty(INSTALL_WARRANTY.ownUnit);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {view.levels.map(l => {
          const std = l.key === 'STANDARD';
          return (
            <Card key={l.key} padding="lg" as="article" className={std ? 'flex flex-col gap-6 ring-2 ring-brand' : 'flex flex-col gap-6'}>
              <header className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-h2">{l.th}</h3>
                  {std ? <Badge tone="brand">แนะนำ</Badge> : <Badge tone="sky">ครบกว่า</Badge>}
                </div>
                <p className="text-small text-ink-2">{l.note}</p>
              </header>
              <div className="rounded-card bg-surface-2 p-4">
                <p className="text-meta text-ink-3">ตัวอย่าง {view.size}</p>
                <Price amount={l.ex} unit="/ เครื่อง" size="lg" tone="brand" className="mt-1" />
              </div>
              <div>
                <h4 className="text-small font-semibold text-ink">รวมในราคา</h4>
                <ul className="mt-3 grid gap-2.5 text-small text-ink-2">
                  {l.parts.map(p => (
                    <li key={p} className="flex items-start gap-2.5">
                      <Icon name="check" size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-ok" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {!std && view.premiumExtra && (
                <p className="mt-auto flex items-start gap-2.5 text-small text-ink-2">
                  <Icon name="shield" size={18} className="mt-0.5 shrink-0 text-brand" />
                  <span>
                    <span className="font-medium text-ink">เพิ่มเรื่องรับประกัน: </span>
                    {view.premiumExtra}
                  </span>
                </p>
              )}
            </Card>
          );
        })}
      </div>

      <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <li className="flex items-start gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
            <Icon name="ac" size={22} />
          </span>
          <div>
            <p className="font-semibold text-ink">ท่อน้ำยา {INCLUDED_PIPE_M} เมตรแรกรวมในราคา</p>
            <p className="mt-0.5 text-small text-ink-2">ส่วนที่เกินคิดเป็นเมตร ดูได้ในงานเสริมด้านล่าง</p>
          </div>
        </li>
        <li className="flex items-start gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ok-soft text-ok">
            <Icon name="shield" size={22} />
          </span>
          <div>
            <p className="font-semibold text-ink">{boughtTitle}</p>
            <p className="mt-0.5 text-small text-ink-2">{boughtWhen}</p>
          </div>
        </li>
        <li className="flex items-start gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
            <Icon name="shield" size={22} />
          </span>
          <div>
            <p className="font-semibold text-ink">{ownTitle}</p>
            <p className="mt-0.5 text-small text-ink-2">{ownWhen}</p>
          </div>
        </li>
      </ul>

      <div className="grid grid-cols-1 gap-4">
        <AccordionItem title="สิ่งที่ไม่รวมในราคา · ทีมแจ้งราคาก่อนทำทุกครั้ง" variant="card">
          <ul className="flex flex-wrap gap-2">
            {view.excludes.map(x => (
              <li key={x}>
                <Badge tone="neutral">{x}</Badge>
              </li>
            ))}
          </ul>
        </AccordionItem>
        {view.survey && (
          <Notice tone="info" icon="calendar" title="ต้องสำรวจหน้างานก่อนไหม">
            {view.survey.skip} · {view.survey.need}
          </Notice>
        )}
      </div>
    </div>
  );
}
