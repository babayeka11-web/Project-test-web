'use client';
// "ราคาตามขนาด": pick a package, then a type; size range × ล้างปกติ × ล้างใหญ่, each price can go to the quote.
// Prices come from the CleanRateTable prop (Pricebook, built on the server). Wide tables on tablets and up, cards on phones.
import Link from 'next/link';
import { useState } from 'react';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { Badge, Notice, Price, SegmentedControl, Table, Tabs, type TabItem } from '@/components/ui';
import {
  cleanExtraLine,
  cleanPriceLine,
  cleanRate,
  cleanTypeTh,
  LEVEL_TH,
  PKG_TH,
  SIZE_BANDS,
  sizeNum,
  type CleanLevel,
  type CleanPkgId,
  type CleanRateRow,
  type CleanRateTable,
} from '@/lib/domain/cleaning';
import { NOTES } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { TRAVEL } from '@/lib/domain/travel';
import type { AcTypeId } from '@/lib/domain/types';

/** An AHU / partial / add-on row of the cleaning sheet (C1 price; ex null = assessed on site). */
export type ExtraRow = { id: string; group: string; name: string; unit: string; ex: number | null; note?: string };

/** Short package names for the 3-segment switch (the full name and what it includes show under it). */
const PKG_SHORT: Record<CleanPkgId, string> = { 'Basic Clean': 'มาตรฐาน', 'Standard Care': 'รายงานภาพ', 'Corporate Control': 'ทะเบียนทรัพย์สิน' };
/** The warranty part of a package's line ('รับประกัน 30 วัน'), read from PKG_TH — the customer's difference, not a code. */
const warrantyOf = (id: CleanPkgId): string | undefined =>
  PKG_TH[id].sub
    .split(' · ')
    .find(x => x.startsWith('รับประกัน'))
    ?.replace(/^รับประกันงาน/, 'รับประกัน');

const TYPE_ORDER: readonly AcTypeId[] = ['wall', 'ceiling', 'cassette', 'floor', 'duct'];
const LEVELS: readonly CleanLevel[] = ['C1', 'C2'];

type SizeRow = { id: string; label: string; band: string; rows: Record<CleanLevel, CleanRateRow | undefined> };

function sizeRows(table: CleanRateTable, pkg: CleanPkgId, type: AcTypeId): SizeRow[] {
  return SIZE_BANDS.map(b => ({
    id: `${type}-${b.id}`,
    label: b.th,
    band: `${sizeNum(type, b)} BTU`,
    rows: {
      C1: cleanRate(table, pkg, 'C1', type, b.id),
      C2: cleanRate(table, pkg, 'C2', type, b.id),
    },
  })).filter(r => r.rows.C1 || r.rows.C2);
}

/** One price with its add button. */
function PriceCell({ row }: { row: CleanRateRow | undefined }) {
  if (!row) return <span className="text-small text-ink-3">ไม่มีในแพ็กเกจนี้</span>;
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
      <Price amount={row.ex} vat={false} size="md" />
      <AddToQuote lines={[cleanPriceLine(row)]} label={row.ex == null ? 'ขอให้ประเมิน' : 'ใส่ใบเสนอราคา'} size="sm" variant="soft" />
    </div>
  );
}

function TypePrices({ table, pkg, type }: { table: CleanRateTable; pkg: CleanPkgId; type: AcTypeId }) {
  const data = sizeRows(table, pkg, type);
  const typeTh = cleanTypeTh(type);
  return (
    <div>
      <div className="hidden md:block">
        <Table
          caption={`ราคาล้างแอร์${typeTh} ${PKG_TH[pkg].th} ต่อเครื่อง ก่อน VAT`}
          stickyFirstColumn
          minWidth="40rem"
          columns={[
            { key: 'size', label: 'ขนาด', rowHeader: true },
            ...LEVELS.map(l => ({ key: l, label: `${LEVEL_TH[l].th} (${l})`, align: 'end' as const })),
          ]}
          rows={data.map(r => ({
            id: r.id,
            size: (
              <span className="grid">
                <span className="font-semibold text-ink">{r.label}</span>
                <span className="text-meta font-normal text-ink-3">{r.band}</span>
              </span>
            ),
            C1: <PriceCell row={r.rows.C1} />,
            C2: <PriceCell row={r.rows.C2} />,
          }))}
          footnote="ราคาต่อเครื่อง ก่อน VAT"
        />
      </div>
      <ul className="grid grid-cols-1 gap-3 md:hidden" aria-label={`ราคาล้างแอร์${typeTh} ต่อเครื่อง ก่อน VAT`}>
        {data.map(r => (
          <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-display font-semibold text-ink">
              {r.label} <span className="font-sans text-small font-normal text-ink-3">{r.band}</span>
            </p>
            <div className="mt-3 grid divide-y divide-line">
              {LEVELS.map(l => {
                const row = r.rows[l];
                return (
                  <div key={l} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-small font-medium text-ink">
                        {LEVEL_TH[l].th} <span className="text-ink-3">{l}</span>
                      </p>
                      {row ? <Price amount={row.ex} size="sm" /> : <span className="text-small text-ink-3">ไม่มีในแพ็กเกจนี้</span>}
                    </div>
                    {row && <AddToQuote lines={[cleanPriceLine(row)]} label={row.ex == null ? 'ขอให้ประเมิน' : 'ใส่ใบเสนอราคา'} size="sm" variant="soft" />}
                  </div>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-meta text-ink-3 md:hidden">ราคาต่อเครื่อง ก่อน VAT</p>
    </div>
  );
}

function ExtraPrices({ pkg, rows }: { pkg: CleanPkgId; rows: ExtraRow[] }) {
  const line = (r: ExtraRow) => {
    const base = cleanExtraLine({ name: r.name, ex: r.ex, ty: r.group });
    // the row key has no package: keep packages apart so two packages never merge into one line at the wrong price
    return { ...base, key: pkg === 'Basic Clean' ? base.key : `${base.key}|${pkg}`, detail: PKG_TH[pkg].th };
  };
  const label = (r: ExtraRow) => (r.ex == null ? 'ขอให้ประเมิน' : 'ใส่ใบเสนอราคา');
  const meta = (r: ExtraRow) => `${r.group}${r.note ? ` · ${r.note}` : ''}`;
  const caption = `งานเสริมและแอร์ชนิดอื่น ${PKG_TH[pkg].th} ก่อน VAT`;
  return (
    <div>
      <div className="hidden md:block">
        <Table
          caption={caption}
          minWidth="38rem"
          columns={[
            { key: 'name', label: 'รายการ', rowHeader: true },
            { key: 'unit', label: 'หน่วย' },
            { key: 'price', label: 'ราคา', align: 'end' },
          ]}
          rows={rows.map(r => ({
            id: r.id,
            name: (
              <span className="grid gap-0.5">
                <span className="font-medium text-ink">{r.name}</span>
                <span className="text-meta font-normal text-ink-3">{meta(r)}</span>
              </span>
            ),
            unit: <span className="text-small text-ink-2">{r.unit}</span>,
            price: (
              <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
                <Price amount={r.ex} vat={false} size="md" />
                <AddToQuote lines={[line(r)]} label={label(r)} size="sm" variant="soft" />
              </div>
            ),
          }))}
          footnote="ราคาก่อน VAT · ล้างใหญ่ของ AHU ประเมินหน้างาน"
        />
      </div>
      <ul className="grid grid-cols-1 gap-3 md:hidden" aria-label={caption}>
        {rows.map(r => (
          <li key={r.id} className="rounded-2xl border border-line bg-surface p-4">
            <p className="font-medium leading-snug text-ink">{r.name}</p>
            <p className="mt-0.5 text-meta text-ink-3">{meta(r)}</p>
            <div className="mt-3 flex items-center justify-between gap-3">
              <Price amount={r.ex} unit={`/ ${r.unit}`} size="sm" />
              <AddToQuote lines={[line(r)]} label={label(r)} size="sm" variant="soft" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function PriceTables({ table, extras }: { table: CleanRateTable; extras: Record<CleanPkgId, ExtraRow[]> }) {
  const [pkg, setPkg] = useState<CleanPkgId>('Basic Clean');
  const types = TYPE_ORDER.filter(t => table.rows.some(r => r.type === t && r.pkg === pkg && r.ex != null));
  const items: TabItem[] = types.map(t => ({
    id: t,
    label: cleanTypeTh(t),
    content: <TypePrices table={table} pkg={pkg} type={t} />,
  }));
  const ids = [...new Set(table.rows.map(r => r.pkg))];
  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="grid grid-cols-1 gap-2">
        <span id="pt-pkg-label" className="text-small font-semibold text-ink">
          แพ็กเกจ
        </span>
        <SegmentedControl
          labelledBy="pt-pkg-label"
          fullWidth
          value={pkg}
          onChange={setPkg}
          options={ids.map(id => ({ value: id, label: PKG_SHORT[id], hint: warrantyOf(id) }))}
          className="max-w-3xl"
        />
        <p className="text-small text-ink-2">
          <span className="font-semibold text-ink">{PKG_TH[pkg].th}</span> · {PKG_TH[pkg].sub}
        </p>
      </div>

      <Tabs label="ชนิดแอร์" variant="pill" items={items} panelClassName="pt-6" />

      <Notice tone="info" title={`ยอดงานล้างขั้นต่ำเที่ยวละ ${baht(table.minBill)} ก่อน VAT`}>
        ถ้ายอดล้างต่ำกว่านี้คิดค่าเดินทางเที่ยวละ {baht(TRAVEL.baseFee)} ถ้าถึงขั้นต่ำแล้ว กรุงเทพฯ ในระยะ {TRAVEL.freeKm} กม. จากสำนักงานใหญ่ไม่มีค่าเดินทาง
        พื้นที่อื่นคิด {baht(TRAVEL.baseFee)} + {baht(TRAVEL.perKm)} ต่อ กม. ที่เกิน {TRAVEL.freeKm} กม.{' '}
        <Link href="/area/" className="font-medium text-brand underline underline-offset-2">
          เช็กพื้นที่ของคุณ
        </Link>
      </Notice>

      {extras[pkg].length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          <div>
            <h3 className="text-h3">แอร์ชนิดอื่นและงานเสริม</h3>
            <p className="mt-1 text-small text-ink-2">เครื่อง AHU ล้างเฉพาะคอยล์ งานคราบหนัก และงานสูงเกิน 3 เมตร รายการที่ไม่มีราคามาตรฐานทีมประเมินหน้างาน</p>
          </div>
          <ExtraPrices pkg={pkg} rows={extras[pkg]} />
        </div>
      )}
      <p className="flex flex-wrap items-center gap-2 text-meta text-ink-3">
        <Badge tone="outline">ก่อน VAT</Badge>
        {NOTES.source}
      </p>
    </div>
  );
}
