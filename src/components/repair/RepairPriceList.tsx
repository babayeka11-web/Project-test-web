'use client';
// "ราคาซ่อมมาตรฐาน" — every Pricebook repair line, grouped by kind of work, searchable, each with unit, standard rate
// (before VAT), warranty, what is included / not included and a button that puts it in the quote.
import { useMemo, useState } from 'react';
import { Button, Field, Icon, Input, Notice, Price } from '@/components/ui';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { NOTES } from '@/lib/domain/constants';
import { repairLine } from '@/lib/domain/install';
import { Disclosure } from './Disclosure';
import { groupRows, matchRow, type ListRow } from './rows';

export function RepairPriceList({ rows }: { rows: ListRow[] }) {
  const [query, setQuery] = useState('');
  const q = query.trim();
  const shown = useMemo(() => rows.filter(r => matchRow(r, q)), [rows, q]);
  const groups = useMemo(() => groupRows(shown), [shown]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="max-w-[28rem]">
          <Field label="ค้นหารายการซ่อม">
            <Input
              name="repair-search"
              type="search"
              inputMode="search"
              autoComplete="off"
              icon="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="เช่น คาปาซิเตอร์ น้ำยา R32 ปั๊มน้ำทิ้ง"
            />
          </Field>
        </div>
        <p aria-live="polite" className="text-small text-ink-2">
          {q ? `พบ ${shown.length} จาก ${rows.length} รายการ` : `ทั้งหมด ${rows.length} รายการ ใน ${groups.length} หมวด`}
        </p>
      </div>

      {groups.length === 0 ? (
        <Notice
          tone="info"
          title={`ไม่พบรายการที่ตรงกับ “${q}”`}
          action={
            <Button type="button" variant="soft" size="sm" onClick={() => setQuery('')}>
              ดูทุกรายการ
            </Button>
          }
        >
          ลองคำสั้น ๆ เช่น น้ำยา มอเตอร์ บอร์ด ท่อน้ำทิ้ง หรือถามทีมช่างว่าอาการของคุณใช้รายการไหน
        </Notice>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map(({ group, rows: list }, i) => {
            const lowest = list.reduce<number | null>((m, r) => (r.ex != null && (m == null || r.ex < m) ? r.ex : m), null);
            return (
              <Disclosure
                key={`${group.id}-${q ? 'found' : 'all'}`}
                defaultOpen={Boolean(q) || i === 0}
                title={
                  <span className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4">
                    <span>{group.th}</span>
                    <span className="flex flex-wrap items-baseline gap-x-3 text-small font-normal text-ink-3">
                      <span>{list.length} รายการ</span>
                      {lowest != null && <Price amount={lowest} prefix="เริ่ม" size="sm" />}
                    </span>
                  </span>
                }
              >
                <p className="pb-2 text-small text-ink-2">{group.sub}</p>
                <ul className="divide-y divide-line">
                  {list.map(r => (
                    <RepairRowItem key={r.id} r={r} />
                  ))}
                </ul>
              </Disclosure>
            );
          })}
        </div>
      )}

      <Notice tone="info" size="sm" icon="info">
        {NOTES.source} · ราคาเป็นอัตรามาตรฐานของแต่ละรายการ ก่อน VAT · อะไหล่หรืองานนอกรายการ ช่างแจ้งราคาให้อนุมัติก่อนซ่อมทุกครั้ง
      </Notice>
    </div>
  );
}

function RepairRowItem({ r }: { r: ListRow }) {
  const assessed = r.ex == null;
  return (
    <li className="grid grid-cols-1 gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-8">
      <div className="min-w-0">
        <p className="font-medium leading-snug text-ink">{r.name}</p>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-meta text-ink-3">
          {r.unit && <span>คิดต่อ{r.unit}</span>}
        </p>
        {r.warranty && (
          <p className="mt-1.5 flex gap-2 text-small text-ink-2">
            <Icon name="shield" size={16} className="mt-1 text-sky" />
            <span>
              <span className="font-medium text-ink">รับประกัน</span> {r.warranty}
            </span>
          </p>
        )}
        {(r.inc || r.exc) && (
          <details className="group mt-1">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-control text-small font-medium text-brand marker:content-none [&::-webkit-details-marker]:hidden">
              รายละเอียดงาน
              <Icon name="chevron-down" size={16} className="transition-transform duration-150 group-open:rotate-180" />
            </summary>
            <dl className="grid gap-2.5 pb-2 text-small">
              {r.inc && (
                <div>
                  <dt className="font-medium text-ink">รวมในงาน</dt>
                  <dd className="text-ink-2">{r.inc}</dd>
                </div>
              )}
              {r.exc && (
                <div>
                  <dt className="font-medium text-ink">ไม่รวม</dt>
                  <dd className="text-ink-2">{r.exc}</dd>
                </div>
              )}
            </dl>
          </details>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:flex-col sm:items-end sm:justify-start">
        {r.extra ? (
          <span className="text-small font-medium text-ink-2">
            มีค่าใช้จ่ายเพิ่มเติม
            <span className="block text-meta font-normal text-ink-3">ทีมแจ้งในใบเสนอราคา</span>
          </span>
        ) : (
          <Price amount={r.ex} size="md" stacked className="sm:items-end" />
        )}
        <AddToQuote
          size="sm"
          variant="soft"
          label={assessed ? 'ขอประเมินราคา' : 'ใส่ใบเสนอราคา'}
          lines={() => [repairLine({ name: r.name, ex: r.ex, unit: r.unit })]}
        />
      </div>
    </li>
  );
}
