'use client';
// Facet filters of /products/: type, BTU, brand (with counts), machine price, Inverter / fixed speed.
// One panel, used as the desktop sidebar and inside the bottom sheet on phones.
import { useId, useState, type ReactNode } from 'react';
import { Badge, Checkbox, Chip } from '@/components/ui';
import { BTU_BANDS, PRICE_BANDS, type Brand, type CatalogFilter, type FacetCounts } from '@/lib/domain/catalog';
import { AC_TYPES } from '@/lib/domain/types';

export type FilterPatch = Partial<Pick<CatalogFilter, 'type' | 'brand' | 'btu' | 'price' | 'inverter'>>;

const FIRST_BRANDS = 8;
const OFF = 'disabled:cursor-not-allowed disabled:opacity-45 aria-disabled:cursor-not-allowed aria-disabled:opacity-45';

export const toggleIn = (set: ReadonlySet<string>, id: string): Set<string> => {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
};

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="flex flex-col gap-3">
      <h3 id={id} className="text-small font-semibold text-ink">
        {title}
      </h3>
      {children}
    </div>
  );
}

export function CatalogFilters({
  filter,
  counts,
  brands,
  onChange,
}: {
  filter: CatalogFilter;
  counts: FacetCounts;
  brands: Brand[];
  onChange: (patch: FilterPatch) => void;
}) {
  const [allBrands, setAllBrands] = useState(false);
  // An option with no matches is disabled — except the one pressed last: a selected option whose count is 0 would
  // otherwise disable itself the moment it is unselected and drop keyboard focus to <body> (UI.md §2). That one stays
  // focusable, dimmed (aria-disabled) and ignores presses until something else is pressed.
  const [last, setLast] = useState('');
  const opt = (key: string, off: boolean, act: () => void) => ({
    disabled: off && last !== key,
    'aria-disabled': off || undefined,
    onClick: () => {
      setLast(key);
      if (!off) act();
    },
  });
  const shown = allBrands ? brands : brands.filter((b, i) => i < FIRST_BRANDS || filter.brand.has(b.id));
  const hidden = brands.length - shown.length;
  const row = 'flex flex-wrap gap-2';
  return (
    <div className="flex flex-col gap-7">
      <Group title="ประเภทแอร์">
        <div className={row}>
          {AC_TYPES.map(t => {
            const on = filter.type.has(t.id);
            const n = counts.type[t.id] ?? 0;
            return (
              <Chip key={t.id} className={OFF} selected={on} count={n} countLabel="ซีรีส์" {...opt(`type:${t.id}`, !on && n === 0, () => onChange({ type: toggleIn(filter.type, t.id) }))}>
                {t.th}
              </Chip>
            );
          })}
        </div>
      </Group>

      <Group title="ขนาด (BTU)">
        <div className={row}>
          {BTU_BANDS.map(b => {
            const on = filter.btu.has(b.id);
            const n = counts.btu[b.id] ?? 0;
            return (
              <Chip key={b.id} className={OFF} selected={on} count={n} countLabel="ซีรีส์" {...opt(`btu:${b.id}`, !on && n === 0, () => onChange({ btu: toggleIn(filter.btu, b.id) }))}>
                {b.th}
              </Chip>
            );
          })}
        </div>
      </Group>

      <Group title="ยี่ห้อ">
        <div className="flex flex-col">
          {shown.map(b => {
            const on = filter.brand.has(b.id);
            const n = counts.brand[b.id] ?? 0;
            return (
              <Checkbox
                key={b.id}
                checked={on}
                disabled={!b.own && !on && n === 0 && last !== `brand:${b.id}`}
                aria-disabled={(!b.own && !on && n === 0) || undefined}
                onChange={() => {
                  setLast(`brand:${b.id}`);
                  if (b.own || on || n > 0) onChange({ brand: toggleIn(filter.brand, b.id) });
                }}
                label={
                  <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    {b.name}
                    {b.own && <Badge tone="sky">แบรนด์ของเรา</Badge>}
                  </span>
                }
                aside={
                  b.own ? null : (
                    <span className="text-meta tabular-nums text-ink-3">
                      {n}
                      <span className="sr-only"> ซีรีส์</span>
                    </span>
                  )
                }
              />
            );
          })}
        </div>
        {(hidden > 0 || allBrands) && (
          <button
            type="button"
            onClick={() => setAllBrands(v => !v)}
            aria-expanded={allBrands}
            className="pressable -mt-1 inline-flex min-h-11 w-fit items-center rounded-full px-1 text-small font-semibold text-brand hover:underline"
          >
            {allBrands ? 'ย่อรายการยี่ห้อ' : `ดูทั้งหมด ${brands.length} ยี่ห้อ`}
          </button>
        )}
      </Group>

      <Group title="ราคาเครื่อง (บาท · ก่อน VAT)">
        <div className={row}>
          {PRICE_BANDS.map(b => {
            const on = filter.price.has(b.id);
            const n = counts.price[b.id] ?? 0;
            return (
              <Chip key={b.id} className={OFF} selected={on} count={n} countLabel="ซีรีส์" {...opt(`price:${b.id}`, !on && n === 0, () => onChange({ price: toggleIn(filter.price, b.id) }))}>
                {b.th}
              </Chip>
            );
          })}
        </div>
      </Group>

      <Group title="ระบบคอมเพรสเซอร์">
        <div className={row}>
          <Chip
            className={OFF}
            selected={filter.inverter === 'inv'}
            count={counts.inverter.inv}
            countLabel="ซีรีส์"
            {...opt('inv:inv', filter.inverter !== 'inv' && counts.inverter.inv === 0, () => onChange({ inverter: filter.inverter === 'inv' ? '' : 'inv' }))}
          >
            Inverter
          </Chip>
          <Chip
            className={OFF}
            selected={filter.inverter === 'fix'}
            count={counts.inverter.fix}
            countLabel="ซีรีส์"
            {...opt('inv:fix', filter.inverter !== 'fix' && counts.inverter.fix === 0, () => onChange({ inverter: filter.inverter === 'fix' ? '' : 'fix' }))}
          >
            Fixed speed
          </Chip>
        </div>
      </Group>
    </div>
  );
}
