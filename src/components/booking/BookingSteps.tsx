'use client';
// The three steps of the quick booking. They only draw controls: the state, the quote and the booking action
// live in QuickBooking.tsx. Prices come from the CleanRateTable prop (built on the server) and the domain layer.
import Link from 'next/link';
import type { ReactNode } from 'react';
import { AddressPicker } from '@/components/shared/AddressPicker';
import { TypeArt } from '@/components/shared/TypeArt';
import { Chip, Field, Fieldset, Icon, Input, Notice, Price, Radio, SegmentedControl, Select, Stepper, cn } from '@/components/ui';
import {
  cleanRate,
  LEVEL_TH,
  MAX_UNITS_PER_TYPE,
  PKG_INFO,
  PKG_TH,
  QUICK_PKGS,
  QUICK_TYPES,
  sizeNum,
  sizesFor,
  startAt,
  type CleanLevel,
  type CleanPkgId,
  type CleanRateTable,
  type CleanSelection,
  type CleaningQuote,
  type QuickType,
} from '@/lib/domain/cleaning';
import { COMPANY } from '@/lib/domain/company';
import { NOTES } from '@/lib/domain/constants';
import { TIME_NOTE, timeTh } from '@/lib/domain/content';
import { baht } from '@/lib/domain/format';
import { addDays, dateHint, dateTh, RUSH_FEE_EX, SLOTS, type BkkNow, type SlotId } from '@/lib/domain/queue';
import { Step } from './Step';

/* ---------- step 1 · which air-cons ---------- */

export function AirconStep({
  table,
  sel,
  units,
  onCount,
  onSize,
}: {
  table: CleanRateTable;
  sel: CleanSelection;
  units: number;
  onCount: (t: QuickType, n: number) => void;
  onSize: (t: QuickType, sizeId: number) => void;
}) {
  return (
    <Step id="qb-s1" n={1} title="แอร์ของคุณ" hint="เลือกชนิดและจำนวนเครื่อง แล้วเลือกขนาด BTU ตามป้ายหน้าเครื่อง">
      <ul className="grid grid-cols-1 gap-3">
        {QUICK_TYPES.map(t => {
          const n = sel.n[t.id] ?? 0;
          const sizes = sizesFor(table, t.id);
          return (
            <li
              key={t.id}
              className={cn(
                'rounded-2xl border p-4 transition-colors duration-250 ease-air sm:p-5',
                n > 0 ? 'border-brand bg-sky-soft' : 'border-line bg-surface',
              )}
            >
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
                <div className="flex min-w-0 flex-1 basis-56 items-center gap-4">
                  <TypeArt type={t.id} className="h-14 w-20 shrink-0 text-brand" />
                  <div className="min-w-0">
                    <p className="font-display text-[1.0625rem] font-semibold leading-snug text-ink">แอร์{t.th}</p>
                    <p className="text-meta text-ink-3">{t.where}</p>
                  </div>
                </div>
                <Stepper
                  label={`จำนวนแอร์${t.th}`}
                  unit="เครื่อง"
                  min={0}
                  max={MAX_UNITS_PER_TYPE}
                  value={n}
                  onChange={v => onCount(t.id, v)}
                />
              </div>
              {n > 0 && (
                <Field label={`ขนาดแอร์${t.th}`} className="mt-4">
                  <Select value={String(sel.size[t.id] ?? 0)} onChange={e => onSize(t.id, Number(e.target.value))}>
                    {sizes.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.th} · {sizeNum(t.id, b)} BTU
                      </option>
                    ))}
                  </Select>
                </Field>
              )}
            </li>
          );
        })}
      </ul>
      {units === 0 ? (
        <Notice tone="warn" size="sm" live="polite" className="mt-4">
          เลือกแอร์อย่างน้อย 1 เครื่อง เพื่อดูราคา
        </Notice>
      ) : (
        <p className="mt-4 text-meta text-ink-3">
          ราคาตามช่วง BTU ของเครื่อง ถ้าไม่แน่ใจ ถ่ายป้ายหน้าเครื่องส่งทาง LINE ทีมช่วยดูให้ได้
        </p>
      )}
    </Step>
  );
}

/** Per-unit price of a package × level for what is chosen now ("เริ่ม" when the chosen types differ in price). */
function unitPrice(table: CleanRateTable, sel: CleanSelection, pkg: CleanPkgId, level: CleanLevel): { amount: number | null; from: boolean } {
  const prices = QUICK_TYPES.filter(t => (sel.n[t.id] ?? 0) > 0)
    .map(t => cleanRate(table, pkg, level, t.id, sel.size[t.id] ?? 0)?.ex)
    .filter((x): x is number => x != null);
  if (!prices.length) return { amount: startAt(table, pkg, level), from: true };
  const lo = Math.min(...prices);
  return { amount: lo, from: lo !== Math.max(...prices) };
}

/** Option name on the left, its per-unit price on the right (wraps under the name on narrow screens). */
function RowLabel({ children, price }: { children: ReactNode; price: ReactNode }) {
  return (
    <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
      <span>{children}</span>
      {price}
    </span>
  );
}

function UnitPrice({ table, sel, pkg, level }: { table: CleanRateTable; sel: CleanSelection; pkg: CleanPkgId; level: CleanLevel }) {
  const p = unitPrice(table, sel, pkg, level);
  return <Price amount={p.amount} prefix={p.from ? 'เริ่ม' : undefined} unit="/ เครื่อง" size="sm" tone="brand" />;
}

/* ---------- step 2 · how to clean ---------- */

export function MethodStep({
  table,
  sel,
  onLevel,
  onPkg,
}: {
  table: CleanRateTable;
  sel: CleanSelection;
  onLevel: (l: CleanLevel) => void;
  onPkg: (p: CleanPkgId) => void;
}) {
  return (
    <Step id="qb-s2" n={2} title="วิธีล้าง" hint="ราคาต่อเครื่องเปลี่ยนตามที่เลือกทันที">
      <div className="grid grid-cols-1 gap-7">
        <Fieldset legend="ล้างแบบไหน">
          <div className="grid grid-cols-1 gap-3">
            {(['C1', 'C2'] as const).map(level => (
              <Radio
                key={level}
                name="qb-level"
                value={level}
                variant="card"
                checked={sel.level === level}
                onChange={() => onLevel(level)}
                label={
                  <RowLabel price={<UnitPrice table={table} sel={sel} pkg={sel.pkg} level={level} />}>
                    {LEVEL_TH[level].th} ({level})
                  </RowLabel>
                }
                description={LEVEL_TH[level].sub}
              />
            ))}
          </div>
          <p className="text-meta text-ink-3">
            ไม่แน่ใจว่าแบบไหนเหมาะ{' '}
            <Link href="/cleaning/#compare" className="font-medium text-brand underline underline-offset-2">
              ดูความต่างของล้างปกติกับล้างใหญ่
            </Link>
          </p>
        </Fieldset>
        <Fieldset legend="ได้เอกสารอะไรหลังล้าง">
          <div className="grid grid-cols-1 gap-3">
            {QUICK_PKGS.map(pkg => {
              const info = PKG_INFO.find(p => p.id === pkg);
              return (
                <Radio
                  key={pkg}
                  name="qb-pkg"
                  value={pkg}
                  variant="card"
                  checked={sel.pkg === pkg}
                  onChange={() => onPkg(pkg)}
                  label={<RowLabel price={<UnitPrice table={table} sel={sel} pkg={pkg} level={sel.level} />}>{PKG_TH[pkg].th}</RowLabel>}
                  description={
                    <>
                      <span className="block">{PKG_TH[pkg].sub}</span>
                      {info?.gets.slice(0, 2).map(g => (
                        <span key={g} className="mt-1 flex gap-2 text-meta text-ink-2">
                          <Icon name="check" size={14} className="mt-[0.3em] shrink-0 text-ok" strokeWidth={2.25} />
                          <span>{g}</span>
                        </span>
                      ))}
                    </>
                  }
                />
              );
            })}
          </div>
        </Fieldset>
      </div>
    </Step>
  );
}

/* ---------- step 3 · where and when ---------- */

const FIT_TH = (f: CleaningQuote['when']['fit'], slots: readonly SlotId[]): string =>
  f.kind === 'half'
    ? slots.includes('am') && slots.includes('pm')
      ? 'ใช้เวลาไม่เกินครึ่งวัน เลือกช่วงเช้าหรือบ่ายได้'
      : 'ใช้เวลาไม่เกินครึ่งวัน'
    : f.kind === 'day'
      ? 'ใช้เวลาประมาณ 1 วันทำการ'
      : `ใช้เวลาประมาณ ${f.days} วันทำการ`;

export function WhenStep({
  now,
  date,
  slot,
  q,
  onDate,
  onSlot,
}: {
  now: BkkNow | null;
  date: string;
  /** the slot in effect (already valid for the date) */
  slot: SlotId | '';
  q: CleaningQuote;
  onDate: (d: string) => void;
  onSlot: (s: SlotId) => void;
}) {
  const rush = baht(RUSH_FEE_EX);
  const when = q.when;
  const hint = now ? dateHint(date, q.rush, now) : null;
  const pick = (d: string) => onDate(date === d ? '' : d);
  const hasTime = q.units > 0 && when.time[1] > 0;
  return (
    <Step id="qb-s3" n={3} title="ที่ไหน · เมื่อไร" hint="บอกพื้นที่เพื่อคิดค่าเดินทาง และเลือกวันที่สะดวก ทีมโทรยืนยันคิวอีกครั้ง">
      <div className="grid grid-cols-1 gap-8">
        <AddressPicker />

        <div className="grid grid-cols-1 gap-4">
          <Field label="วันที่สะดวกให้ทีมเข้า" optional>
            <Input type="date" icon="calendar" value={date} min={now?.date} onChange={e => onDate(e.target.value)} />
          </Field>
          <div role="group" aria-label="เลือกวันแบบเร็ว" className="flex min-h-11 flex-wrap gap-2">
            {now && (
              <>
                <Chip selected={date === now.date} onClick={() => pick(now.date)}>
                  วันนี้ · คิวด่วน +{rush}
                </Chip>
                <Chip selected={date === addDays(now.date, 1)} onClick={() => pick(addDays(now.date, 1))}>
                  พรุ่งนี้ · คิวด่วน +{rush}
                </Chip>
                <Chip selected={date === when.earliest} onClick={() => pick(when.earliest)}>
                  เร็วสุดแบบจองปกติ · {dateTh(when.earliest)}
                </Chip>
              </>
            )}
          </div>

          <div aria-live="polite" className="grid grid-cols-1 gap-3 empty:hidden">
            {hint && (
              <Notice tone={hint.warn ? 'warn' : 'info'} icon="calendar" size="sm">
                {hint.text}
              </Notice>
            )}
            {date && when.late && (
              <Notice tone="warn" size="sm">
                {when.slots.length === 0
                  ? `วันนี้ไม่มีช่วงเวลาทำการเหลือพอสำหรับงานนี้ ส่วนที่เลย ${COMPANY.open.to} น. เป็นงานนอกเวลา มีค่าใช้จ่ายเพิ่มเติม เลือกวันอื่น หรือให้ทีมเสนอเวลา`
                  : `งานนี้ใช้เวลามากกว่าเวลาทำการที่เหลือของวันนี้ ส่วนที่เลย ${COMPANY.open.to} น. เป็นงานนอกเวลา มีค่าใช้จ่ายเพิ่มเติม`}
              </Notice>
            )}
          </div>

          {q.units > 0 && date && when.slots.length > 1 && (
            <div className="grid grid-cols-1 gap-2">
              <span id="qb-slot-label" className="text-small font-semibold text-ink">
                ช่วงเวลาที่สะดวก
              </span>
              <SegmentedControl
                labelledBy="qb-slot-label"
                fullWidth
                value={slot}
                onChange={v => onSlot(v as SlotId)}
                options={when.slots.map(id => ({ value: id, label: SLOTS[id].th, hint: SLOTS[id].sub }))}
              />
            </div>
          )}
          {q.units > 0 && date && when.slots.length === 1 && (
            <p className="flex items-center gap-2 text-small text-ink-2">
              <Icon name="clock" size={18} className="text-brand" />
              งานนี้ต้องใช้{SLOTS[when.slots[0]].th} ({SLOTS[when.slots[0]].sub})
            </p>
          )}

          {hasTime && (
            <div className="rounded-control bg-surface-2 p-4">
              <p className="flex items-start gap-2 font-medium text-ink">
                <Icon name="clock" size={20} className="mt-[0.2em] shrink-0 text-brand" />
                <span>
                  เวลาหน้างานโดยประมาณ {timeTh(when.time)}
                  <span className="font-normal text-ink-2"> · {FIT_TH(when.fit, when.slots)}</span>
                </span>
              </p>
              <p className="mt-1 pl-7 text-meta text-ink-3">{TIME_NOTE}</p>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1 text-small text-ink-2">
            <p className="flex items-start gap-2">
              <Icon name="calendar" size={18} className="mt-[0.2em] shrink-0 text-brand" />
              <span>เวลาทำการ {COMPANY.hours}</span>
            </p>
            <p className="pl-7 text-meta text-ink-3">{NOTES.outOfHours}</p>
          </div>
        </div>
      </div>
    </Step>
  );
}
