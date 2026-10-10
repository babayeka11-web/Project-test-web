'use client';
// Side-by-side comparison of up to 4 models (opened from the compare tray). Rows that differ are highlighted and can be
// shown alone. Everything comes from the list data; the full spec of each model is one link away.
import { useMemo, useState } from 'react';
import { Button, Checkbox, IconButton, Sheet, TableShell } from '@/components/ui';
import { baht, btuFmt } from '@/lib/domain/format';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { COMPARE_SPECS, DASH, type ListSeries, type ListSku } from './spec';

export type CompareItem = { m: ListSeries; k: ListSku; href: string };

type Row = { id: string; th: string; cells: string[] };

export function CompareSheet({
  open,
  onClose,
  items,
  pool,
  onRemove,
  onClear,
  returnFocus,
}: {
  open: boolean;
  onClose: () => void;
  items: CompareItem[];
  pool: string[];
  onRemove: (item: CompareItem) => void;
  onClear: () => void;
  /** where focus goes when the sheet closes (see Sheet) */
  returnFocus?: () => HTMLElement | null;
}) {
  const [onlyDiff, setOnlyDiff] = useState(false);

  const rows = useMemo<Row[]>(() => {
    const r: Row[] = [
      { id: 'brand', th: 'ยี่ห้อ', cells: items.map(i => i.m.brandName) },
      { id: 'series', th: 'ซีรีส์', cells: items.map(i => i.m.series) },
      { id: 'type', th: 'ประเภท', cells: items.map(i => TYPE_BY_ID[i.m.type].th) },
      { id: 'system', th: 'ระบบ', cells: items.map(i => (i.m.inverter ? 'Inverter' : 'Fixed speed')) },
      { id: 'refrigerant', th: 'น้ำยาแอร์', cells: items.map(i => i.m.label || DASH) },
      { id: 'btu', th: 'ขนาด', cells: items.map(i => btuFmt(i.k.btu)) },
      { id: 'price', th: 'ราคาเครื่อง (ก่อน VAT)', cells: items.map(i => baht(i.k.price)) },
      {
        id: 'install',
        th: 'พร้อมติดตั้งมาตรฐาน (ก่อน VAT)',
        cells: items.map(i => (i.k.installStdEx != null ? baht(i.k.price + i.k.installStdEx) : 'สำรวจหน้างานก่อน')),
      },
      ...COMPARE_SPECS.map((f, n) => ({ id: `s${n}`, th: f.th, cells: items.map(i => pool[i.k.x[n]] ?? DASH) })),
    ];
    return r;
  }, [items, pool]);

  const differs = (r: Row) => new Set(r.cells).size > 1;
  const shown = onlyDiff && items.length > 1 ? rows.filter(differs) : rows;
  const diffCount = rows.filter(differs).length;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      returnFocus={returnFocus}
      side="center"
      size="lg"
      className="sm:w-[min(64rem,calc(100vw-3rem))]!"
      title={`เทียบ ${items.length} รุ่น`}
      description="ราคาทั้งหมดเป็นราคาก่อน VAT · แถวที่ต่างกันมีแถบสี"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="ghost" icon="trash" onClick={onClear}>
            ล้างรายการเทียบ
          </Button>
          <Button variant="secondary" onClick={onClose}>
            กลับไปเลือกรุ่น
          </Button>
        </div>
      }
    >
      {items.length > 1 && (
        <div className="mb-4">
          <Checkbox
            checked={onlyDiff}
            onChange={e => setOnlyDiff(e.target.checked)}
            label="ดูเฉพาะแถวที่ต่างกัน"
            description={`ต่างกัน ${diffCount} จาก ${rows.length} แถว`}
          />
        </div>
      )}
      <TableShell label="ตารางเทียบรุ่นแอร์">
        <table className="ui-table" data-sticky-first style={{ minWidth: `${7 + items.length * 10}rem` }}>
          <caption className="sr-only">เทียบรุ่นแอร์ {items.length} รุ่น</caption>
          <thead>
            <tr>
              <th scope="col" className="w-28 min-w-28 sm:w-36 sm:min-w-36">
                <span className="sr-only">รายการ</span>
              </th>
              {items.map(i => (
                <th key={`${i.m.slug}-${i.k.sku}`} scope="col" className="!whitespace-normal align-top">
                  <div className="flex min-w-36 flex-col items-start gap-1.5 pb-1">
                    <span className="text-meta font-semibold text-ink-3">{i.m.brandName}</span>
                    <span className="text-small font-semibold leading-snug text-ink">{i.m.series}</span>
                    <span className="break-all font-mono text-meta font-normal text-ink-2">{i.k.sku}</span>
                    <span className="flex flex-wrap items-center gap-1">
                      <Button href={i.href} variant="soft" size="sm">
                        รายละเอียด
                      </Button>
                      <IconButton
                        icon="close"
                        label={`เอา ${i.m.brandName} ${i.k.sku} ออกจากการเทียบ`}
                        variant="quiet"
                        onClick={() => onRemove(i)}
                      />
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map(r => {
              const diff = items.length > 1 && differs(r);
              return (
                <tr key={r.id}>
                  <th scope="row" className="!whitespace-normal">
                    <span className="block text-small">{r.th}</span>
                    {diff && <span className="text-meta font-medium text-brand">ต่างกัน</span>}
                  </th>
                  {r.cells.map((c, n) => (
                    <td key={n} className={diff ? 'bg-sky-soft/60 font-medium' : undefined}>
                      {c}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableShell>
      <p className="mt-3 text-meta text-ink-3">ค่าที่ไม่มีใน Pricebook แสดงเป็น — เราไม่เดาข้อมูลสเปก ยืนยันสต็อกก่อนสั่ง</p>
    </Sheet>
  );
}
