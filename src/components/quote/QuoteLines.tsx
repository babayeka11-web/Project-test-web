'use client';
// The quotation lines, grouped (สินค้า · ล้างแอร์ · ติดตั้ง · ซ่อม · งานเสริม · สัญญา · ขอประเมิน · คิวด่วน). Each line shows its
// name, detail, unit price before VAT (or ประเมินหน้างาน), a quantity stepper (not for fixed lines), the line amount and
// "ลบ". "ล้างทั้งหมด" asks inline first; both removals offer "เลิกทำ" in the toast. Focus never gets lost after a removal.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Icon, IconButton, Price, Stepper, toast } from '@/components/ui';
import { cart, MAX_QTY, useCart, type CartLine, type CartLineInput } from '@/lib/cart';
import { EX_TH } from '@/lib/domain/format';
import { lineAmount } from '@/lib/domain/quote';
import { groupLines, qtyFixed, unitOf } from './quote-model';

const strip = (l: CartLine): CartLineInput => {
  const { id, ...rest } = l;
  void id;
  return rest;
};

const rmId = (id: string) => `quote-rm-${id}`;

export function QuoteLines({ titleId }: { titleId: string }) {
  const { lines, totals } = useCart();
  const groups = useMemo(() => groupLines(lines), [lines]);
  const flat = useMemo(() => groups.flatMap(g => g.lines), [groups]);
  const [confirming, setConfirming] = useState(false);
  const clearBtnRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLParagraphElement>(null);

  // the inline confirm takes focus on its safe choice; Esc or "ยกเลิก" returns to "ล้างทั้งหมด"
  useEffect(() => {
    if (confirming) confirmRef.current?.querySelector<HTMLButtonElement>('[data-cancel]')?.focus();
  }, [confirming]);

  const cancelClear = () => {
    setConfirming(false);
    requestAnimationFrame(() => clearBtnRef.current?.querySelector<HTMLButtonElement>('button')?.focus());
  };

  const clearAll = () => {
    const prev = cart.get().lines.map(strip);
    setConfirming(false);
    cart.clear();
    toast('ล้างรายการในใบเสนอราคาแล้ว', { action: { label: 'เลิกทำ', onClick: () => cart.addMany(prev) } });
  };

  const removeLine = (l: CartLine) => {
    const i = flat.findIndex(x => x.id === l.id);
    const removable = (x: CartLine | undefined) => !!x && x.group !== 'rush';
    const next = flat.slice(i + 1).find(removable) ?? flat.slice(0, i).reverse().find(removable);
    cart.remove(l.id);
    toast(`ลบ “${l.name}” แล้ว`, { action: { label: 'เลิกทำ', onClick: () => cart.add(strip(l)) } });
    requestAnimationFrame(() => {
      const el = next ? document.getElementById(rmId(next.id)) : null;
      if (el) el.focus();
      else headRef.current?.focus();
    });
  };

  return (
    <div className="@container min-w-0 overflow-hidden rounded-card border border-line bg-surface shadow-card print:rounded-none print:border-0 print:shadow-none">
      {/* header: count + clear all */}
      <div className="flex min-h-16 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-5 py-3 sm:px-7">
        <p ref={headRef} tabIndex={-1} className="text-small text-ink-2">
          <b className="text-ink">{lines.length} รายการ</b>
          {totals.units > 0 && <> · {totals.units} เครื่อง</>}
          <span className="sr-only"> ในใบเสนอราคา</span>
        </p>
        {confirming ? (
          <div
            ref={confirmRef}
            role="group"
            aria-labelledby={`${titleId}-confirm`}
            className="flex flex-wrap items-center gap-2 print:hidden"
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                cancelClear();
              }
            }}
          >
            <span id={`${titleId}-confirm`} className="text-small font-semibold text-ink">
              ล้างทุกรายการ?
            </span>
            <Button size="sm" variant="secondary" icon="trash" onClick={clearAll}>
              ล้างเลย
            </Button>
            <Button size="sm" variant="ghost" data-cancel onClick={cancelClear}>
              ยกเลิก
            </Button>
          </div>
        ) : (
          <div ref={clearBtnRef} className="print:hidden">
            <Button size="sm" variant="quiet" icon="trash" onClick={() => setConfirming(true)}>
              ล้างทั้งหมด
            </Button>
          </div>
        )}
      </div>

      {groups.map(g => {
        const hid = `${titleId}-g-${g.id}`;
        return (
          <div key={g.id}>
            <h3 id={hid} className="flex items-center gap-2.5 border-b border-line bg-surface-2/70 px-5 py-2.5 font-sans text-small font-semibold text-ink sm:px-7">
              <span aria-hidden className="grid size-7 place-items-center rounded-full bg-sky-soft text-brand">
                <Icon name={g.icon} size={16} />
              </span>
              {g.th}
              <span className="font-normal text-ink-3">· {g.lines.length} รายการ</span>
            </h3>
            <ul aria-labelledby={hid} className="divide-y divide-line">
              {g.lines.map(l => (
                <LineRow key={l.id} line={l} onRemove={() => removeLine(l)} />
              ))}
            </ul>
          </div>
        );
      })}

      {/* add more */}
      <div className="flex flex-wrap items-center gap-1 border-t border-line px-3 py-3 sm:px-5 print:hidden">
        <span className="px-2 text-meta text-ink-3">เพิ่มรายการ</span>
        <Button href="/cleaning/#book" size="sm" variant="quiet" icon="plus">
          ล้างแอร์
        </Button>
        <Button href="/products/" size="sm" variant="quiet" icon="plus">
          ซื้อแอร์
        </Button>
        <Button href="/repair/" size="sm" variant="quiet" icon="plus">
          ซ่อม
        </Button>
        <Button href="/prices/" size="sm" variant="quiet" icon="plus">
          ค่าบริการอื่น
        </Button>
      </div>
    </div>
  );
}

function LineRow({ line: l, onRemove }: { line: CartLine; onRemove: () => void }) {
  const amount = lineAmount(l);
  const fixed = qtyFixed(l);
  const unit = unitOf(l);
  const rush = l.group === 'rush';
  const survey = l.unitEx == null;

  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-3 px-5 py-4 sm:px-7 @xl:grid-cols-[minmax(0,1fr)_auto_8.5rem_2.75rem] @xl:gap-x-5">
      {/* name · detail · unit price */}
      <div className="col-start-1 row-start-1 min-w-0 self-start">
        <p className="font-semibold leading-snug text-ink break-words">{l.name}</p>
        {l.detail && <p className="mt-0.5 text-meta text-ink-3 break-words">{l.detail}</p>}
        {!survey && !rush && (
          <p className="mt-1">
            <Price
              amount={l.unitEx}
              unit={unit ? `/ ${unit}` : undefined}
              prefix={unit ? undefined : 'หน่วยละ'}
              vat={false}
              size="sm"
              className="[&_data]:text-small [&_data]:font-medium [&_data]:text-ink-2"
            />
          </p>
        )}
        {rush && (
          <p className="mt-1 text-meta text-ink-2">
            เปลี่ยนวันเข้างานเป็นวันจองปกติเพื่อยกเลิก ·{' '}
            <a href="#quote-date" className="font-medium text-brand underline">
              เปลี่ยนวัน
            </a>
          </p>
        )}
      </div>

      {/* remove (top-right on phones, last column on wide boxes) */}
      <div className="col-start-2 row-start-1 self-start justify-self-end @xl:col-start-4 print:hidden">
        {!rush && <IconButton id={rmId(l.id)} icon="trash" label={`ลบ ${l.name}`} className="text-ink-2 hover:text-bad" onClick={onRemove} />}
      </div>

      {/* quantity */}
      <div className="col-start-1 row-start-2 min-w-0 @xl:col-start-2 @xl:row-start-1">
        {fixed ? (
          <p className="text-meta text-ink-3">
            {survey ? 'ทีมแจ้งราคาก่อนเริ่มงาน' : rush ? 'ต่อการเข้างาน' : l.group === 'contract' ? `1 สัญญา${l.units ? ` · ${l.units} เครื่อง` : ''}` : `จำนวน ${l.qty}`}
          </p>
        ) : (
          <>
            <div className="print:hidden">
              <Stepper size="sm" value={l.qty} min={1} max={MAX_QTY} label={`จำนวน ${l.name}`} onChange={q => cart.setQty(l.id, q)} />
            </div>
            <p className="hidden text-small print:block">จำนวน {l.qty}{l.unit ? ` ${l.unit}` : ''}</p>
          </>
        )}
      </div>

      {/* line amount */}
      <div className="col-start-2 row-start-2 text-right @xl:col-start-3 @xl:row-start-1">
        {amount == null ? (
          <Price amount={null} className="text-small" />
        ) : (
          <>
            <Price amount={amount} vat={false} size="md" />
            <span className="block text-meta text-ink-3">{EX_TH}</span>
          </>
        )}
      </div>
    </li>
  );
}
