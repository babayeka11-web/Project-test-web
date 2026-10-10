'use client';
// "ราคาติดตั้งตามขนาด": pick the AC type and size band → Standard and Premium prices from the Pricebook rows the server passed
// in, excess pipe beyond the 4 m included, number of units → a total before VAT and the lines for the quote.
import Link from 'next/link';
import { useId, useMemo, useState } from 'react';
import { AccordionItem, Badge, Button, Card, Fieldset, Notice, Price, Radio, Select, Stepper, cn } from '@/components/ui';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { TypeArt } from '@/components/shared/TypeArt';
import type { CartLineInput } from '@/lib/cart';
import { NOTES } from '@/lib/domain/constants';
import { INCLUDED_PIPE_M, INSTALL_WARRANTY, INS_LEVELS, installItemLine, type InstallLevel } from '@/lib/domain/install';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { INSTALL_TYPE_HINT } from './copy';
import type { InstallType, SizeRow } from './types';

const TYPES: readonly InstallType[] = ['wall', 'ceiling', 'cassette', 'floor'];
const MAX_PIPE = 40;

const band = (r: Pick<SizeRow, 'lo' | 'hi'>) => `${r.lo.toLocaleString('en-US')}–${r.hi.toLocaleString('en-US')} BTU`;

export function InstallPriceTool({ rows, includes }: { rows: SizeRow[]; includes: Record<InstallLevel, string[]> }) {
  const uid = useId();
  const [type, setType] = useState<InstallType>('wall');
  const [hi, setHi] = useState(12000);
  const [level, setLevel] = useState<InstallLevel>('STANDARD');
  const [pipeLen, setPipeLen] = useState(INCLUDED_PIPE_M);
  const [count, setCount] = useState(1);

  const bands = useMemo(() => rows.filter(r => r.type === type), [rows, type]);
  const row = bands.find(r => r.hi === hi) ?? bands.find(r => r.hi >= hi) ?? bands[bands.length - 1];

  const pick = (t: InstallType) => {
    const next = rows.filter(r => r.type === t);
    setType(t);
    setHi((next.find(r => r.hi >= hi) ?? next[next.length - 1])?.hi ?? hi);
  };

  if (!row) return null;
  const item = level === 'PREMIUM' ? row.prem ?? row.std : row.std;
  const extra = Math.max(0, pipeLen - INCLUDED_PIPE_M);
  const pipeEx = row.pipe?.ex != null ? row.pipe.ex * extra : 0;
  const perUnit = item.ex != null ? item.ex + pipeEx : null;
  const total = perUnit != null ? perUnit * count : null;

  const lines = (): CartLineInput[] => {
    const out: CartLineInput[] = [{ ...installItemLine(item), qty: count }];
    if (extra > 0 && row.pipe && row.pipe.ex != null) {
      out.push({
        kind: 'addon',
        group: 'addon',
        key: `A-${row.pipe.code}`,
        name: row.pipe.name,
        detail: `ท่อเกิน ${extra} เมตรต่อเครื่อง`,
        unitEx: row.pipe.ex * extra,
        qty: count,
      });
    }
    return out;
  };

  const typeLabelId = `${uid}-type`;
  const levels = INS_LEVELS.filter(l => (l.key === 'PREMIUM' ? row.prem : row.std));

  return (
    <Card padding="lg" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-10">
      {/* choices */}
      <div className="flex min-w-0 flex-col gap-7">
        <div className="flex flex-col gap-3">
          <p id={typeLabelId} className="text-small font-semibold text-ink">
            1. ประเภทแอร์
          </p>
          <div role="group" aria-labelledby={typeLabelId} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {TYPES.map(t => {
              const on = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={on}
                  onClick={() => pick(t)}
                  className={cn(
                    'pressable flex min-h-11 flex-col items-center gap-2 rounded-control border px-3 py-3 text-center transition-[border-color,background-color,box-shadow] duration-150 ease-air',
                    on ? 'border-brand bg-sky-soft/50 shadow-card ring-1 ring-brand' : 'border-line-strong/40 bg-surface hover:border-brand',
                  )}
                >
                  <TypeArt type={t} className={cn('h-12 w-16', on ? 'text-brand' : 'text-ink-2')} />
                  <span className={cn('text-small font-semibold', on ? 'text-brand' : 'text-ink')}>{TYPE_BY_ID[t].th}</span>
                  <span className="text-meta text-ink-3">{INSTALL_TYPE_HINT[t]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label htmlFor={`${uid}-size`} className="text-small font-semibold text-ink">
              2. ขนาดเครื่อง
            </label>
            <Select id={`${uid}-size`} value={row.hi} onChange={e => setHi(+e.target.value)}>
              {bands.map(b => (
                <option key={b.hi} value={b.hi}>
                  {band(b)}
                </option>
              ))}
            </Select>
            {/* Pricebook bands leave gaps (12,000 → 13,000); a unit between two bands is priced in the higher one (btu ≤ hi) */}
            <p className="text-meta text-ink-3">ดูตัวเลข BTU จากป้ายหรือกล่องเครื่อง ถ้าอยู่ระหว่างสองช่วง (เช่น 12,300) ให้เลือกช่วงที่สูงกว่า</p>
          </div>
          <div className="flex flex-col gap-2">
            <span id={`${uid}-pipe`} className="text-small font-semibold text-ink">
              3. ท่อน้ำยายาวประมาณ
            </span>
            <Stepper label="ความยาวท่อน้ำยา" unit="เมตร" min={1} max={MAX_PIPE} value={pipeLen} onChange={setPipeLen} describedBy={`${uid}-pipe-hint`} />
            <p id={`${uid}-pipe-hint`} className="text-meta text-ink-3">
              รวมในราคา {INCLUDED_PIPE_M} เมตรแรก ไม่แน่ใจ ใส่ {INCLUDED_PIPE_M} ไว้ก่อน ทีมวัดจริงตอนสำรวจ
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span id={`${uid}-count`} className="text-small font-semibold text-ink">
            4. จำนวนเครื่อง
          </span>
          <Stepper label="จำนวนเครื่อง" unit="เครื่อง" min={1} max={99} value={count} onChange={setCount} />
        </div>

        <Notice tone="info" size="sm">
          แอร์ซ่อนในฝ้า ท่อลม ตู้ตั้งพื้นเกิน 60,000 BTU และ VRV / VRF ประเมินหน้างานหรือเป็นงานโครงการ{' '}
          <Link className="font-medium text-brand underline underline-offset-4" href="/contact/">
            คุยกับทีมสำรวจ
          </Link>
        </Notice>
      </div>

      {/* result */}
      <div className="flex min-w-0 flex-col gap-5">
        <Fieldset legend="5. เลือกแพ็กเกจ" className="gap-3">
          {levels.map(l => {
            const it = l.key === 'PREMIUM' ? row.prem : row.std;
            return (
              <Radio
                key={l.key}
                name={`${uid}-level`}
                value={l.key}
                variant="card"
                checked={level === l.key}
                onChange={() => setLevel(l.key)}
                label={l.th}
                description={l.note}
                aside={<Price amount={it?.ex ?? null} unit="/ เครื่อง" size="md" stacked />}
              />
            );
          })}
        </Fieldset>

        <div className="rounded-card bg-surface-2 p-5" aria-live="polite" aria-atomic="true">
          <p className="text-small text-ink-2">
            {TYPE_BY_ID[type].th} {band(row)} · {count} เครื่อง
          </p>
          <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 text-small">
            <dt className="text-ink-2">
              ค่าติดตั้ง{INS_LEVELS.find(l => l.key === level)?.th} × {count}
            </dt>
            <dd className="text-end">
              <Price amount={item.ex != null ? item.ex * count : null} vat={false} size="sm" />
            </dd>
            {extra > 0 && (
              <>
                <dt className="text-ink-2">
                  ท่อเกิน {extra} เมตร × {count} เครื่อง
                </dt>
                <dd className="text-end">{row.pipe?.ex != null ? <Price amount={pipeEx * count} vat={false} size="sm" /> : <Price amount={null} size="sm" />}</dd>
              </>
            )}
          </dl>
          <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-4">
            <span className="font-semibold text-ink">รวมโดยประมาณ</span>
            <Price amount={total} size="lg" tone="brand" />
          </div>
          <p className="mt-2 text-meta text-ink-3">{extra > 0 ? NOTES.estimate : 'ราคามาตรฐานสำหรับหน้างานปกติ · ทีมยืนยันในใบเสนอราคา'}</p>
        </div>

        <div className="flex flex-col gap-3">
          <AddToQuote lines={lines} variant="primary" size="lg" fullWidth label="ใส่ใบเสนอราคา" disabled={item.ex == null} />
          <Button href="/quote/" variant="quiet" icon="quote" fullWidth>
            ดูใบเสนอราคา
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="ok" icon="shield" size="sm">
            {INSTALL_WARRANTY.boughtHere}
          </Badge>
          <Badge tone="neutral" size="sm">
            {INSTALL_WARRANTY.ownUnit}
          </Badge>
        </div>

        <AccordionItem title={`ในราคา ${band(row)} นี้รวมอะไรบ้าง`} variant="card">
          <ul className="grid gap-2 text-small">
            {includes[level].map(t => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-sky" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </AccordionItem>
      </div>
    </Card>
  );
}
