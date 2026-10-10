'use client';
// The /products/ tool: search, facet filters (sidebar on desktop, bottom sheet on phones), sort, active-filter chips,
// a grid of series cards (24 at a time), a compare tray (up to 4) and a URL that mirrors the filter so a search can be shared.
import { useSearchParams } from 'next/navigation';
import { Suspense, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Field, Icon, IconButton, Input, Select, Sheet, Skeleton, VisuallyHidden, toast } from '@/components/ui';
import {
  BTU_BANDS,
  PRICE_BANDS,
  SORTS,
  facetCounts,
  filterToParams,
  paramsToFilter,
  queryCatalog,
  type Brand,
  type CatalogFilter,
  type CatalogSort,
} from '@/lib/domain/catalog';
import { thousands } from '@/lib/domain/format';
import { TYPE_BY_ID, type AcTypeId } from '@/lib/domain/types';
import { CatalogCard } from './CatalogCard';
import { CatalogFilters, toggleIn, type FilterPatch } from './CatalogFilters';
import { CompareSheet, type CompareItem } from './CompareSheet';
import { FujivaCard } from './FujivaCard';
import { modelPath, modelSlugs, seriesPath } from './slug';
import type { ListSeries, ListSku } from './spec';

const PAGE = 24;
const MAX_COMPARE = 4;

export type CatalogProps = { models: ListSeries[]; pool: string[]; brands: Brand[] };

export function Catalog(props: CatalogProps) {
  return (
    <Suspense fallback={<CatalogSkeleton />}>
      <CatalogInner {...props} />
    </Suspense>
  );
}

function CatalogSkeleton() {
  return (
    <div role="status" className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[18rem_minmax(0,1fr)]">
      <VisuallyHidden>กำลังโหลดรายการแอร์</VisuallyHidden>
      <Skeleton shape="card" className="hidden h-[34rem] lg:block" />
      <div className="flex flex-col gap-5">
        <Skeleton shape="card" className="h-24" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} shape="card" className="h-[26rem]" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** '12000' / '12,000' / '12k' in the search box → the BTU size to preselect on every card. */
function wantedBtu(q: string): number | null {
  const s = q.toLowerCase().replace(/,/g, '');
  const k = /(\d+(?:\.\d+)?)k\b/.exec(s);
  if (k) return Math.round(parseFloat(k[1]) * 1000);
  const n = /(?:^|\D)(\d{4,6})(?:\D|$)/.exec(s);
  return n ? +n[1] : null;
}

type Pill = { id: string; label: string; remove: () => void };

function CatalogInner({ models, pool, brands }: CatalogProps) {
  const params = useSearchParams();
  const [filter, setFilter] = useState<CatalogFilter>(() => paramsToFilter(params));
  const [shown, setShown] = useState({ key: '', n: PAGE });
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [compare, setCompare] = useState<{ slug: string; sku: string }[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const focusTarget = useRef<string | null>(null);

  const patch = (p: Partial<CatalogFilter>) => setFilter(f => ({ ...f, ...p }));

  // URL mirrors the filter (replaceState: no history spam, the page does not reload).
  useEffect(() => {
    const qs = filterToParams(filter);
    const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash;
    if (next !== window.location.pathname + window.location.search + window.location.hash) window.history.replaceState(null, '', next);
  }, [filter]);

  const q = useDeferredValue(filter.q);
  const f = useMemo(() => ({ ...filter, q }), [filter, q]);
  const result = useMemo(() => queryCatalog(models, f), [models, f]);
  const counts = useMemo(() => facetCounts(models, f, brands), [models, f, brands]);
  const slugsOf = useMemo(() => new Map(models.map(m => [m.slug, modelSlugs(m.skus)])), [models]);
  const bySlug = useMemo(() => new Map(models.map(m => [m.slug, m])), [models]);
  const want = useMemo(() => wantedBtu(q), [q]);
  const own = brands.find(b => b.own);

  const key = filterToParams(f);
  const count = shown.key === key ? shown.n : PAGE;
  const list = result.list.slice(0, count);

  const modelHref = (m: ListSeries, k: ListSku) => modelPath(m.slug, slugsOf.get(m.slug)?.[m.skus.indexOf(k)] ?? '');
  const pickOf = (m: ListSeries, skus: ListSku[]): ListSku =>
    skus.find(k => k.sku === picks[m.slug]) ?? skus.find(k => k.btu === want) ?? skus[0];

  useEffect(() => {
    if (!focusTarget.current) return;
    document.getElementById(focusTarget.current)?.focus();
    focusTarget.current = null;
  }, [count]);

  const showMore = () => {
    focusTarget.current = `card-${result.list[count]?.slug}`;
    setShown({ key, n: count + PAGE });
  };

  /* compare */
  const inCompare = (slug: string, sku: string) => compare.some(c => c.slug === slug && c.sku === sku);
  const toggleCompare = (m: ListSeries, k: ListSku) => {
    if (inCompare(m.slug, k.sku)) {
      setCompare(c => c.filter(x => !(x.slug === m.slug && x.sku === k.sku)));
      return;
    }
    if (compare.length >= MAX_COMPARE) {
      toast(`เทียบได้สูงสุด ${MAX_COMPARE} รุ่น เอาออกหนึ่งรุ่นก่อนเพิ่มรุ่นใหม่`, { tone: 'warn' });
      return;
    }
    setCompare(c => [...c, { slug: m.slug, sku: k.sku }]);
  };
  const compareItems = useMemo<CompareItem[]>(
    () =>
      compare.flatMap(c => {
        const m = bySlug.get(c.slug);
        const k = m?.skus.find(x => x.sku === c.sku);
        return m && k ? [{ m, k, href: modelPath(m.slug, slugsOf.get(m.slug)?.[m.skus.indexOf(k)] ?? '') }] : [];
      }),
    [compare, bySlug, slugsOf],
  );
  const removeCompare = (i: CompareItem) => {
    setCompare(c => c.filter(x => !(x.slug === i.m.slug && x.sku === i.k.sku)));
  };
  useEffect(() => {
    if (compareOpen && compareItems.length === 0) setCompareOpen(false);
  }, [compareOpen, compareItems.length]);

  /* active filters */
  const pills = useMemo<Pill[]>(() => {
    const out: Pill[] = [];
    if (filter.q) out.push({ id: 'q', label: `ค้นหา “${filter.q}”`, remove: () => patch({ q: '' }) });
    filter.type.forEach(id => out.push({ id: `t-${id}`, label: TYPE_BY_ID[id as AcTypeId]?.th ?? id, remove: () => patch({ type: toggleIn(filter.type, id) }) }));
    filter.brand.forEach(id => out.push({ id: `b-${id}`, label: brands.find(b => b.id === id)?.name ?? id, remove: () => patch({ brand: toggleIn(filter.brand, id) }) }));
    filter.btu.forEach(id => out.push({ id: `u-${id}`, label: `${BTU_BANDS.find(b => b.id === id)?.th ?? id} BTU`, remove: () => patch({ btu: toggleIn(filter.btu, id) }) }));
    filter.price.forEach(id => out.push({ id: `p-${id}`, label: `${PRICE_BANDS.find(b => b.id === id)?.th ?? id} บาท`, remove: () => patch({ price: toggleIn(filter.price, id) }) }));
    if (filter.inverter) out.push({ id: 'inv', label: filter.inverter === 'inv' ? 'Inverter' : 'Fixed speed', remove: () => patch({ inverter: '' }) });
    return out;
  }, [filter, brands]);
  const clearAll = () => setFilter(f => ({ ...f, q: '', type: new Set(), brand: new Set(), btu: new Set(), price: new Set(), inverter: '' }));

  const onFacet = (p: FilterPatch) => patch(p);

  const showOwn =
    own != null &&
    (filter.brand.size === 0 || filter.brand.has(own.id)) &&
    !filter.type.size &&
    !filter.btu.size &&
    !filter.price.size &&
    !filter.inverter &&
    (!q || /fuji|ฟูจิ|ฟูจิวา/i.test(q));
  const empty = result.list.length === 0 && !showOwn;
  const facetCount = pills.filter(p => p.id !== 'q').length;

  return (
    <div className={compare.length ? 'pb-28 sm:pb-24' : undefined}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[17rem_minmax(0,1fr)] lg:items-start xl:grid-cols-[18rem_minmax(0,1fr)]">
        <aside
          aria-label="ตัวกรองรายการแอร์"
          className="hidden lg:sticky lg:top-[calc(var(--header-h)+1rem)] lg:block lg:max-h-[calc(100dvh-var(--header-h)-2rem)] lg:overflow-y-auto lg:rounded-card"
        >
          <Card padding="sm">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h3 className="text-h3">ตัวกรอง</h3>
              {facetCount > 0 && (
                <button type="button" onClick={clearAll} className="pressable min-h-11 rounded-full px-2 text-small font-semibold text-brand hover:underline">
                  ล้างทั้งหมด
                </button>
              )}
            </div>
            <CatalogFilters filter={filter} counts={counts} brands={brands} onChange={onFacet} />
          </Card>
        </aside>

        <div className="flex min-w-0 flex-col gap-5">
          <div className="grid grid-cols-2 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_13rem]">
            <Field label="ค้นหารุ่น" className="col-span-2 sm:col-span-1">
              <Input
                type="search"
                icon="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                spellCheck={false}
                placeholder="เช่น daikin 18000 หรือ 12000"
                value={filter.q}
                onChange={e => patch({ q: e.target.value })}
              />
            </Field>
            <Field label="เรียงตาม">
              <Select value={filter.sort} onChange={e => patch({ sort: e.target.value as CatalogSort })}>
                {SORTS.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.th}
                  </option>
                ))}
              </Select>
            </Field>
            <Button variant="ghost" icon="sliders" onClick={() => setFilterOpen(true)} className="sm:hidden">
              ตัวกรอง{facetCount ? ` (${facetCount})` : ''}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <p role="status" aria-live="polite" className="text-small text-ink-2">
              <strong className="font-semibold text-ink">
                {thousands(result.list.length)} ซีรีส์ · {thousands(result.skuTotal)} รุ่น
              </strong>
              <span className="text-ink-3"> · ราคาก่อน VAT</span>
            </p>
            <div className="hidden sm:block lg:hidden">
              <Button variant="ghost" icon="sliders" onClick={() => setFilterOpen(true)}>
                ตัวกรอง{facetCount ? ` (${facetCount})` : ''}
              </Button>
            </div>
          </div>

          {pills.length > 0 && (
            <ul aria-label="ตัวกรองที่ใช้อยู่" className="flex flex-wrap items-center gap-2">
              {pills.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={p.remove}
                    aria-label={`เอาตัวกรอง ${p.label} ออก`}
                    className="pressable inline-flex min-h-11 items-center gap-1.5 rounded-full border border-brand/30 bg-sky-soft pl-4 pr-3 text-small font-medium text-brand hover:border-brand"
                  >
                    {p.label}
                    <Icon name="close" size={16} strokeWidth={2.25} />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={clearAll} className="pressable min-h-11 rounded-full px-3 text-small font-semibold text-brand hover:underline">
                  ล้างทั้งหมด
                </button>
              </li>
            </ul>
          )}

          {showOwn && own && <FujivaCard />}

          {empty ? (
            <Card tone="soft" padding="lg" className="flex flex-col items-start gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-surface text-ink-2">
                <Icon name="search" size={24} />
              </span>
              <div>
                <h3 className="text-h3">ไม่พบรุ่นที่ตรงเงื่อนไข</h3>
                <p className="mt-1 max-w-[34rem] text-ink-2">
                  ลองเอาตัวกรองบางอย่างออก หรือพิมพ์ยี่ห้อกับขนาดแทน เช่น “daikin 18000” ถ้ายังไม่แน่ใจ ทีมขายช่วยเลือกให้ได้
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="secondary" onClick={clearAll}>
                  ล้างตัวกรอง
                </Button>
                <Button variant="ghost" href="/contact/?topic=buy" icon="chat">
                  ให้ทีมขายช่วยเลือก
                </Button>
              </div>
            </Card>
          ) : (
            list.length > 0 && (
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {list.map(m => {
                  const skus = result.visibleSkus(m);
                  const picked = pickOf(m, skus);
                  return (
                    <li key={m.slug} className="flex min-w-0">
                      <CatalogCard
                        m={m}
                        skus={skus}
                        picked={picked}
                        titleId={`card-${m.slug}`}
                        onPick={k => setPicks(p => ({ ...p, [m.slug]: k.sku }))}
                        modelHref={k => modelHref(m, k as ListSku)}
                        seriesHref={seriesPath(m.slug)}
                        inCompare={inCompare(m.slug, picked.sku)}
                        onCompare={() => toggleCompare(m, picked)}
                      />
                    </li>
                  );
                })}
              </ul>
            )
          )}

          {result.list.length > count && (
            <div className="flex flex-col items-center gap-2 pt-2">
              <p className="text-small text-ink-3">
                แสดง {thousands(count)} จาก {thousands(result.list.length)} ซีรีส์
              </p>
              <Button variant="ghost" size="lg" icon="plus" onClick={showMore}>
                แสดงเพิ่ม
              </Button>
            </div>
          )}
        </div>
      </div>

      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        side="bottom"
        title="ตัวกรอง"
        description={`${thousands(result.list.length)} ซีรีส์ · ${thousands(result.skuTotal)} รุ่น`}
        footer={
          <div className="flex gap-3">
            <Button variant="ghost" onClick={clearAll} disabled={facetCount === 0}>
              ล้าง
            </Button>
            <Button variant="secondary" className="flex-1" onClick={() => setFilterOpen(false)}>
              ดู {thousands(result.list.length)} ซีรีส์
            </Button>
          </div>
        }
      >
        <CatalogFilters filter={filter} counts={counts} brands={brands} onChange={onFacet} />
      </Sheet>

      {compare.length > 0 && (
        <div className="pointer-events-none fixed inset-x-0 bottom-[calc(var(--mobilebar-h)+env(safe-area-inset-bottom,0px))] z-30 px-gutter pb-3">
          <section
            aria-label="รายการที่เลือกเทียบ"
            className="glass pointer-events-auto mx-auto flex max-w-page flex-col gap-3 rounded-panel border border-line p-3 shadow-pop sm:flex-row sm:items-center sm:gap-4 sm:px-4"
          >
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <p className="shrink-0 text-small font-semibold text-ink">
                เทียบ {compareItems.length}/{MAX_COMPARE}
              </p>
              <ul className="no-scrollbar flex min-w-0 flex-1 gap-2 overflow-x-auto">
                {compareItems.map(i => (
                  <li key={`${i.m.slug}-${i.k.sku}`} className="flex shrink-0 items-center gap-0.5 rounded-full bg-surface-2 pl-3 text-small text-ink">
                    <span className="max-w-40 truncate">
                      {i.m.brandName} {thousands(i.k.btu)}
                    </span>
                    <IconButton icon="close" label={`เอา ${i.m.brandName} ${i.k.sku} ออกจากการเทียบ`} variant="quiet" size="sm" onClick={() => removeCompare(i)} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="quiet" onClick={() => setCompare([])}>
                ล้าง
              </Button>
              <Button variant="secondary" icon="sliders" disabled={compareItems.length < 2} onClick={() => setCompareOpen(true)}>
                {compareItems.length < 2 ? 'เลือกอีกอย่างน้อย 1 รุ่น' : `เทียบ ${compareItems.length} รุ่น`}
              </Button>
            </div>
          </section>
        </div>
      )}

      <CompareSheet
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        items={compareItems}
        pool={pool}
        onRemove={removeCompare}
        onClear={() => {
          setCompare([]);
          setCompareOpen(false);
        }}
      />
    </div>
  );
}
