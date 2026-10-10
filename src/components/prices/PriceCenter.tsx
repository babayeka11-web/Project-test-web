'use client';
// The price centre: one search box across every service line, six tabs, rows with price, warranty, รวม / ไม่รวม and
// "ใส่ใบเสนอราคา". Rows arrive as compact props from the server page (build.ts) — this file never imports the Pricebook.
import { memo, Suspense, useCallback, useDeferredValue, useEffect, useId, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { Accordion, Badge, Button, Chip, cn, Field, Icon, Input, Notice, Price, Tabs, type TabItem } from '@/components/ui';
import type { CartLineInput } from '@/lib/cart';
import {
  CLEAN_PKG_IDS,
  cleanExtraLine,
  cleanPriceLine,
  LEVEL_TH,
  METHOD_INFO,
  PKG_INFO,
  PKG_TH,
  type CleanLevel,
  type CleanPkgId,
} from '@/lib/domain/cleaning';
import { installItemLine, repairLine } from '@/lib/domain/install';
import { RATE_DATE, RATE_SOURCES } from '@/lib/domain/rates';
import { isTabId, PRICE_TABS, type PriceRow, type PriceTabId } from './price-data';

/* ---------- helpers ---------- */

/** Search text: lower case, thousands separators / spaces / dashes dropped, "12k" → 12000. */
const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/(\d+(?:\.\d+)?)\s*k\b/g, (_, n: string) => String(Math.round(parseFloat(n) * 1000)))
    .replace(/[\s,\-–—/·()]+/g, '');

const rangeTh = (rg: string) => rg.replace(/^<=\s*/, 'ไม่เกิน ').replace(/^>\s*/, 'มากกว่า ');

/** The cart line of a row (or of one level of a pair row) — built at click time with the domain helpers. */
function lineOf(row: PriceRow, level?: CleanLevel): CartLineInput {
  const lv = level ?? (row.lv && row.lv !== 'both' ? row.lv : undefined);
  const ex = level === 'C2' && row.pair ? row.ex2 ?? null : row.ex;
  switch (row.k) {
    case 'c':
      return cleanPriceLine({ pkg: row.pkg as CleanPkgId, level: lv ?? 'C1', type: row.ty!, range: row.rg ?? '', ex });
    case 'x': {
      const base = cleanExtraLine({ name: lv ? `${row.n} (${LEVEL_TH[lv].th})` : row.n, ex, ty: row.sh });
      if (!row.pkg) return base;
      // same keys as /cleaning/ ExtraPrices: an extra priced per package stays one line per package
      return { ...base, key: row.pkg === 'Basic Clean' ? base.key : `${base.key}|${row.pkg}`, detail: PKG_TH[row.pkg].th };
    }
    case 'i':
      return installItemLine({ code: row.code ?? row.id, name: row.n, ex, unit: row.u });
    default:
      return repairLine({ name: row.n, ex, unit: row.u });
  }
}

const DECIDED_TH = {
  m: 'อัตรากำหนดจากราคาตลาดไทย 2569',
  c: 'เท่ากับค่าบริการงานเดียวกันในตารางซ่อมของบริษัท',
  k: 'รื้อ + ติดตั้งมาตรฐานที่จุดใหม่',
} as const;

const splitList = (text: string, by: RegExp) => text.split(by).map(s => s.trim()).filter(Boolean);

/* ---------- one row ---------- */

type RowProps = { row: PriceRow; pool: string[]; open: boolean; onToggle: (id: string) => void; showPkg: boolean };

/** รวม / ไม่รวม lists of one level (or of the only price of a row). */
function IncExc({ title, inc, exc }: { title?: string; inc: string | null; exc: string | null }) {
  if (!inc && !exc) return null;
  return (
    <div className="flex flex-col gap-4">
      {title && <p className="text-small font-semibold text-ink">{title}</p>}
      {inc && (
        <div>
          <p className="flex items-center gap-2 text-small font-semibold text-ok">
            <Icon name="check" size={18} strokeWidth={2.25} />
            รวมในราคา
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-ink-2">
            {splitList(inc, /;\s*/).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
      {exc && (
        <div>
          <p className="flex items-center gap-2 text-small font-semibold text-warn">
            <Icon name="alert" size={18} strokeWidth={2.25} />
            ไม่รวม
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-small text-ink-2">
            {splitList(exc, /,\s+|;\s*/).map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const PriceRowItem = memo(function PriceRowItem({ row, pool, open, onToggle, showPkg }: RowProps) {
  const detailId = useId();
  const text = (i?: number) => (i != null ? pool[i] : null);
  const warranty = text(row.w);
  const inc = text(row.inc);
  const exc = text(row.exc);
  const inc2 = text(row.inc2);
  const exc2 = text(row.exc2);
  const hasDetail = !!(inc || exc || inc2 || exc2 || warranty || row.dec);
  const lv = row.lv;
  const title = row.k === 'c' ? `ขนาด ${rangeTh(row.rg ?? '')} BTU` : row.n;
  const cells: { level?: CleanLevel; ex: number | null; label?: string }[] = row.pair
    ? [
        { level: 'C1', ex: row.ex, label: `${LEVEL_TH.C1.th} C1` },
        { level: 'C2', ex: row.ex2 ?? null, label: `${LEVEL_TH.C2.th} C2` },
      ]
    : [{ ex: row.ex, label: lv === 'both' ? 'ล้างปกติและล้างใหญ่ราคาเดียวกัน' : lv ? `${LEVEL_TH[lv].th} ${lv}` : undefined }];

  return (
    <li className="px-4 py-4 sm:px-5">
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0 xl:col-start-1 xl:row-start-1 xl:self-end">
          <p className="text-body font-semibold leading-snug text-ink">{title}</p>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-meta text-ink-3">
            {showPkg && row.pkg && <Badge tone="outline">{PKG_TH[row.pkg].th}</Badge>}
            {row.dec && (
              <Badge tone="warn" icon="info">
                อัตรากำหนด
              </Badge>
            )}
            {row.vrf && <Badge tone="outline">งานโครงการ</Badge>}
            {row.u && <span>ต่อ{row.u}</span>}
            {warranty && warranty.length <= 24 && <span>รับประกัน {warranty}</span>}
          </p>
        </div>
        <div
          className={
            row.pair
              ? 'grid grid-cols-1 gap-3 sm:grid-cols-2 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:grid-cols-[17.5rem_17.5rem] xl:self-center'
              : 'sm:max-w-[22rem] xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:w-[22rem] xl:self-center'
          }
        >
          {cells.map((c, i) => (
            <div
              key={i}
              role="group"
              aria-label={`${row.g} ${title}${c.label ? ` ${c.label}` : ''}`}
              className={cn('flex items-center justify-between gap-3', row.pair && 'rounded-control bg-surface-2 px-3.5 py-3')}
            >
              <div className="min-w-0">
                {c.label && <p className={cn('mb-0.5 text-meta font-semibold', row.pair ? 'text-brand' : 'text-ink-3')}>{c.label}</p>}
                <Price
                  stacked
                  amount={c.ex}
                  fallback={row.fb ?? 'ประเมินหน้างาน'}
                  unit={!row.pair && c.ex != null && row.u ? `/ ${row.u}` : undefined}
                />
              </div>
              {row.vrf ? (
                <Button variant="ghost" size="sm" href="/contact/?topic=vrf" icon="phone" className="shrink-0">
                  ติดต่อทีมโครงการ
                </Button>
              ) : (
                <AddToQuote
                  lines={() => [lineOf(row, c.level)]}
                  size="sm"
                  className="shrink-0"
                  label={c.ex == null ? 'ขอประเมินราคา' : 'ใส่ใบเสนอราคา'}
                />
              )}
            </div>
          ))}
        </div>
        {hasDetail && (
          <button
            type="button"
            aria-expanded={open}
            aria-controls={detailId}
            onClick={() => onToggle(row.id)}
            className="pressable -ml-2 inline-flex min-h-11 items-center gap-1.5 self-start rounded-control px-2 text-small font-semibold text-brand hover:bg-sky-soft xl:col-start-1 xl:row-start-2 xl:justify-self-start"
          >
            รวม / ไม่รวม
            <Icon name={open ? 'chevron-up' : 'chevron-down'} size={16} strokeWidth={2.25} />
          </button>
        )}
        {hasDetail && open && (
          <div id={detailId} className="grid gap-6 rounded-control bg-surface-2 p-4 sm:p-5 md:grid-cols-2 xl:col-span-2">
            {row.pair ? (
              <>
                <IncExc title={`${LEVEL_TH.C1.th} C1`} inc={inc} exc={exc} />
                <IncExc title={`${LEVEL_TH.C2.th} C2`} inc={inc2} exc={exc2} />
              </>
            ) : (
              <IncExc inc={inc} exc={exc} />
            )}
            {(warranty || row.dec) && (
              <div className="space-y-2 text-small text-ink-2 md:col-span-2">
                {warranty && (
                  <p>
                    <span className="font-semibold text-ink">การรับประกัน </span>
                    {warranty}
                  </p>
                )}
                {row.dec && (
                  <p>
                    <span className="font-semibold text-ink">ที่มาของอัตรา </span>
                    {DECIDED_TH[row.dec]} (ณ {RATE_DATE})
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
});

/* ---------- a tab's body ---------- */

function CleanHeader({ pkg, onPkg, searching }: { pkg: CleanPkgId; onPkg: (p: CleanPkgId) => void; searching: boolean }) {
  const labelId = useId();
  const info = PKG_INFO.find(p => p.id === pkg);
  return (
    <div className="mb-8 flex flex-col gap-5">
      <div>
        <p id={labelId} className="mb-2.5 text-small font-semibold text-ink">
          เลือกแพ็กเกจล้าง
        </p>
        <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
          {CLEAN_PKG_IDS.map(p => (
            <Chip key={p} selected={pkg === p} onClick={() => onPkg(p)}>
              {PKG_TH[p].th}
            </Chip>
          ))}
        </div>
        {searching ? (
          <p className="mt-3 text-small text-ink-3">กำลังค้นหาในทุกแพ็กเกจ ลบคำค้นเพื่อเลือกแพ็กเกจ</p>
        ) : (
          info && (
            <p className="mt-3 max-w-[46rem] text-small text-ink-2">
              <span className="font-semibold text-ink">{info.th}</span> เหมาะกับ{info.fit} · {PKG_TH[pkg].sub}
            </p>
          )
        )}
      </div>
      <dl className="grid gap-4 rounded-control bg-surface-2 p-4 text-small sm:grid-cols-2 sm:p-5">
        {METHOD_INFO.filter(m => m.id !== 'C3').map(m => (
          <div key={m.id}>
            <dt className="font-semibold text-ink">{m.th}</dt>
            <dd className="mt-1 text-ink-2">{m.d}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function RateNote() {
  return (
    <div className="mt-10">
      <Notice tone="info" title="ป้าย ‘อัตรากำหนด’ คืออะไร">
        <p>
          บางรายการไม่มีราคาในตารางติดตั้งของบริษัท เราจึงกำหนดอัตรามาตรฐานเป็นเงินบาทคงที่ (ก่อน VAT ปัดเป็นหลักร้อย) ณ {RATE_DATE} ทีมยืนยันราคาอีกครั้งในใบเสนอราคา
        </p>
        <div className="mt-3">
          <Accordion
            items={[
              {
                title: 'ดูแหล่งอ้างอิงของอัตรากำหนด',
                content: (
                  <ul className="list-disc space-y-1.5 pl-5 text-small text-ink-2">
                    {RATE_SOURCES.map(s => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                ),
              },
            ]}
          />
        </div>
      </Notice>
    </div>
  );
}

type BodyProps = {
  tab: PriceTabId;
  rows: PriceRow[];
  pool: string[];
  openIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
  query: string;
  otherHits: { id: PriceTabId; label: string; n: number }[];
  onTab: (t: PriceTabId) => void;
  onClear: () => void;
  pkg: CleanPkgId;
  onPkg: (p: CleanPkgId) => void;
};

function TabBody({ tab, rows, pool, openIds, onToggle, query, otherHits, onTab, onClear, pkg, onPkg }: BodyProps) {
  const groups = useMemo(() => {
    const map = new Map<string, PriceRow[]>();
    for (const r of rows) map.set(r.g, [...(map.get(r.g) ?? []), r]);
    return [...map.entries()];
  }, [rows]);
  const meta = PRICE_TABS.find(t => t.id === tab)!;
  const hasDecided = rows.some(r => r.dec);
  const searching = query.length > 0;

  return (
    <div>
      <p className="mb-6 max-w-[46rem] text-small text-ink-2">{meta.hint}</p>
      {tab === 'clean' && <CleanHeader pkg={pkg} onPkg={onPkg} searching={searching} />}
      {rows.length === 0 ? (
        <div className="rounded-card border border-line bg-surface p-6 text-center sm:p-10">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-sky-soft text-brand">
            <Icon name="search" size={24} />
          </span>
          <p className="mt-4 text-h3">
            {searching ? <>ไม่พบ “{query}” ในหมวด{meta.label}</> : 'ยังไม่มีรายการในหมวดนี้'}
          </p>
          {otherHits.length > 0 ? (
            <>
              <p className="mt-2 text-small text-ink-2">พบในหมวดอื่น</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {otherHits.map(h => (
                  <Button key={h.id} variant="soft" size="sm" onClick={() => onTab(h.id)}>
                    {h.label} · {h.n} รายการ
                  </Button>
                ))}
              </div>
            </>
          ) : (
            <p className="mx-auto mt-2 max-w-[30rem] text-small text-ink-2">
              ลองพิมพ์คำสั้นลง เช่น ติดผนัง ท่อ หรือขนาด BTU ถ้ายังไม่เจอ ทักทีมงานให้ช่วยหาได้
            </p>
          )}
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {searching && (
              <Button variant="ghost" size="sm" onClick={onClear}>
                ล้างคำค้น
              </Button>
            )}
            <Button variant="quiet" size="sm" href="/contact/">
              ถามทีมงาน
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-9">
          {groups.map(([g, list]) => (
            <section key={g} aria-label={g}>
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h3 className="text-h3">{g}</h3>
                <span className="shrink-0 text-meta text-ink-3">{list.length} รายการ</span>
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface shadow-card">
                {list.map(r => (
                  <PriceRowItem key={r.id} row={r} pool={pool} open={openIds.has(r.id)} onToggle={onToggle} showPkg={searching && !!r.pkg} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      {hasDecided && <RateNote />}
    </div>
  );
}

/* ---------- ?tab= deep link (useSearchParams needs a Suspense boundary) ---------- */

function UrlTab({ onTab, onQuery }: { onTab: (t: PriceTabId) => void; onQuery: (q: string) => void }) {
  const params = useSearchParams();
  const tab = params.get('tab');
  const q = params.get('q');
  useEffect(() => {
    if (isTabId(tab)) onTab(tab);
  }, [tab, onTab]);
  useEffect(() => {
    if (q) onQuery(q);
  }, [q, onQuery]);
  return null;
}

/* ---------- the centre ---------- */

export function PriceCenter({ rows, pool }: { rows: PriceRow[]; pool: string[] }) {
  const [tab, setTab] = useState<PriceTabId>('clean');
  const [query, setQuery] = useState('');
  const [pkg, setPkg] = useState<CleanPkgId>('Basic Clean');
  const [openIds, setOpenIds] = useState<ReadonlySet<string>>(new Set());
  const deferred = useDeferredValue(query.trim());

  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) {
      const lvWords = r.lv === 'C1' ? 'ล้างปกติ c1' : r.lv === 'C2' ? 'ล้างใหญ่ c2' : r.lv === 'both' || r.pair ? 'ล้างปกติ c1 ล้างใหญ่ c2' : '';
      const pk = r.pkg ? `${PKG_TH[r.pkg].th} ${r.pkg}` : '';
      map.set(r.id, norm(`${r.n} ${r.g} ${r.u ?? ''} ${r.code ?? ''} ${r.rg ?? ''} ${lvWords} ${pk} ${r.dec ? 'อัตรากำหนด' : ''}`));
    }
    return map;
  }, [rows]);

  const tokens = useMemo(() => deferred.split(/\s+/).map(norm).filter(Boolean), [deferred]);
  const searching = tokens.length > 0;

  // rows per tab that match the search (and, for cleaning without a search, the chosen package)
  const byTab = useMemo(() => {
    const out: Record<PriceTabId, PriceRow[]> = { clean: [], install: [], materials: [], move: [], repair: [], other: [] };
    for (const r of rows) {
      if (searching) {
        const hay = haystacks.get(r.id) ?? '';
        if (!tokens.every(t => hay.includes(t))) continue;
      } else if (r.tab === 'clean' && r.pkg && r.pkg !== pkg) continue;
      out[r.tab].push(r);
    }
    return out;
  }, [rows, haystacks, tokens, searching, pkg]);

  const toggle = useCallback((id: string) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const changeTab = useCallback((id: PriceTabId) => {
    setTab(id);
    try {
      const u = new URL(window.location.href);
      u.searchParams.set('tab', id);
      // null state (not window.history.state, which carries Next's own marker and is passed through untouched): Next
      // then syncs useSearchParams, so a later quick link to ?tab=… still switches the tab
      window.history.replaceState(null, '', u.toString());
    } catch {
      /* the address bar is a convenience only */
    }
  }, []);

  // deep links must not rewrite the URL again → separate setter without replaceState
  const fromUrl = useCallback((id: PriceTabId) => setTab(id), []);
  const clear = useCallback(() => setQuery(''), []);

  const otherHits = useMemo(
    () => PRICE_TABS.filter(t => t.id !== tab && byTab[t.id].length > 0).map(t => ({ id: t.id, label: t.label, n: byTab[t.id].length })),
    [byTab, tab],
  );

  const total = byTab[tab].length;
  const tabLabel = PRICE_TABS.find(t => t.id === tab)!.label;
  const searchId = useId();

  const items: TabItem[] = PRICE_TABS.map(t => ({
    id: t.id,
    label: t.label,
    icon: t.icon,
    count: byTab[t.id].length,
    content:
      t.id === tab ? (
        <TabBody
          tab={t.id}
          rows={byTab[t.id]}
          pool={pool}
          openIds={openIds}
          onToggle={toggle}
          query={deferred}
          otherHits={otherHits}
          onTab={changeTab}
          onClear={clear}
          pkg={pkg}
          onPkg={setPkg}
        />
      ) : null,
  }));

  return (
    <div>
      <Suspense fallback={null}>
        <UrlTab onTab={fromUrl} onQuery={setQuery} />
      </Suspense>
      <div className="mb-8 grid gap-3 md:grid-cols-[minmax(0,34rem)_1fr] md:items-end md:gap-6">
        <Field label="ค้นหาค่าบริการ" id={searchId} hint="พิมพ์ชื่อรายการ ขนาด หรือรหัส เช่น 12000 · ท่อทองแดง · คาปาซิเตอร์">
          <Input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            icon="search"
            size="lg"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="ค้นหาในทุกหมวด"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 md:pb-3">
          <p role="status" aria-live="polite" className="text-small text-ink-2">
            {searching ? (
              <>
                พบ <strong className="tabular-nums text-ink">{total}</strong> รายการในหมวด{tabLabel}
                {otherHits.length > 0 && ` · หมวดอื่นอีก ${otherHits.reduce((a, h) => a + h.n, 0)} รายการ`}
              </>
            ) : (
              <>
                หมวด{tabLabel} <strong className="tabular-nums text-ink">{total}</strong> รายการ · ทุกราคาก่อน VAT
              </>
            )}
          </p>
          {query && (
            <Button variant="quiet" size="sm" onClick={clear} icon="close">
              ล้างคำค้น
            </Button>
          )}
        </div>
      </div>
      <Tabs label="หมวดค่าบริการ" items={items} value={tab} onChange={id => changeTab(id as PriceTabId)} />
    </div>
  );
}
