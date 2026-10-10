'use client';
// "งานเสริมที่อาจต้องใช้": excess pipe, power, drain and other work, each with its Pricebook price and unit. Pick the size where
// there is more than one, set the quantity and add it to the quote. Work with no fixed price becomes an on-site assessment request.
import { useState } from 'react';
import { Card, Price, Select, Stepper } from '@/components/ui';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { installItemLine } from '@/lib/domain/install';
import type { AddonGroupView, AddonRow } from './types';

function Row({ row }: { row: AddonRow }) {
  const [idx, setIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const choice = row.choices[idx] ?? row.choices[0];
  const flag = row.qty === 'flag' || choice.ex == null;
  const unit = choice.unit || (row.qty === 'm' ? 'เมตร' : 'ชิ้น');

  return (
    <li className="flex flex-col gap-3 border-b border-line py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="min-w-0">
        <p className="font-medium text-ink">{row.choices.length > 1 ? row.title : choice.name}</p>
        {row.note && <p className="mt-1 text-meta text-ink-3">{row.note}</p>}
      </div>
      {row.choices.length > 1 && (
        <Select aria-label={`เลือกแบบของ ${row.title}`} value={idx} onChange={e => setIdx(+e.target.value)}>
          {row.choices.map((c, i) => (
            <option key={c.code} value={i}>
              {c.label}
            </option>
          ))}
        </Select>
      )}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
        <Price amount={choice.ex} unit={`/ ${unit}`} size="md" fallback="ประเมินหน้างาน" />
        {!flag && (
          <div className="flex items-center gap-2">
            <Stepper label={`จำนวน${unit}ของ ${row.title}`} size="sm" min={1} max={200} value={qty} unit={unit} onChange={setQty} />
          </div>
        )}
        <AddToQuote
          className="ms-auto"
          size="sm"
          label={flag ? 'ขอประเมินหน้างาน' : 'ใส่ใบเสนอราคา'}
          lines={() => [{ ...installItemLine(choice), qty: flag ? 1 : qty }]}
        />
      </div>
    </li>
  );
}

export function AddonList({ groups }: { groups: AddonGroupView[] }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      {groups.map(g => (
        <Card key={g.group} padding="lg" as="section" className="flex flex-col gap-5">
          <h3 className="text-h3">{g.group}</h3>
          <ul className="flex flex-col">
            {g.rows.map(r => (
              <Row key={r.id} row={r} />
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
