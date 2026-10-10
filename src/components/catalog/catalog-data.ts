// SERVER / BUILD-TIME ONLY — reads the Pricebook (src/lib/domain/pricebook.ts). Import it from the products pages
// (page.tsx, generateStaticParams, generateMetadata) only, never from a 'use client' file. Everything returned here is a
// small, plain, serialisable object for the client components.
import type { CatalogSeries, Sku } from '@/lib/domain/catalog';
import type { InstallItem } from '@/lib/domain/install';
import type { AcTypeId } from '@/lib/domain/types';
import { getCatalog, getCatalogLite, getInstallItem, getInstallItems, getSeriesBySlug, installOptions, productOptions } from '@/lib/domain/pricebook';
import { modelSlugs } from './slug';
import { COMPARE_SPECS, DASH, type ListSeries, type ProductPageOptions } from './spec';

/** Standard installation price the quote will use for a unit (null = survey first). */
export const stdInstallEx = (type: AcTypeId, btu: number): number | null =>
  installOptions(type, btu).find(o => o.key === 'STANDARD')?.item.ex ?? null;

/**
 * The catalog for /products/: getCatalogLite() with `installStdEx` taken from the installation package the product page and
 * the quote actually use (installOptions STANDARD). The product sheet's own column disagrees for 18 SKUs (16 of them need a
 * survey first), and a card must never promise a "พร้อมติดตั้ง" total the quote then changes. Each SKU also carries the few
 * spec values the compare table shows, as indexes into one shared string pool (keeps the prop small).
 */
export function catalogForList(): { models: ListSeries[]; pool: string[] } {
  const pool = [DASH];
  const index = new Map<string, number>([[DASH, 0]]);
  const intern = (v: string): number => {
    let i = index.get(v);
    if (i == null) {
      i = pool.length;
      pool.push(v);
      index.set(v, i);
    }
    return i;
  };
  const full = new Map(getCatalog().map(m => [m.slug, m]));
  const models = getCatalogLite().map<ListSeries>(m => {
    const src = full.get(m.slug)!;
    return {
      ...m,
      skus: m.skus.map((k, i) => ({
        ...k,
        installStdEx: stdInstallEx(m.type, k.btu),
        x: COMPARE_SPECS.map(f => intern(f.get(src.skus[i].spec))),
      })),
    };
  });
  return { models, pool };
}

export type ModelRef = { series: CatalogSeries; sku: Sku; index: number; slugs: string[] };

/** Every { slug, model } pair (generateStaticParams of /products/[slug]/[model]/). */
export function allModelParams(): { slug: string; model: string }[] {
  return getCatalog().flatMap(m => modelSlugs(m.skus).map(model => ({ slug: m.slug, model })));
}

/** One SKU by its series slug + model slug. */
export function findModel(slug: string, model: string): ModelRef | undefined {
  const series = getSeriesBySlug(slug);
  if (!series) return undefined;
  const slugs = modelSlugs(series.skus);
  const index = slugs.indexOf(model);
  return index < 0 ? undefined : { series, sku: series.skus[index], index, slugs };
}

/* ---------- product-page options (slimmed for the client) ---------- */

/** Only what the configurator shows or puts in the quote (category / survey notes stay on the server). */
const slim = (i: InstallItem, keepText = false): InstallItem => ({
  code: i.code,
  cat: null,
  name: i.name,
  unit: i.unit,
  ex: i.ex,
  inc: keepText ? i.inc : null,
  exc: keepText ? i.exc : null,
  warranty: keepText ? i.warranty : null,
  survey: null,
});

/** productOptions(type, btu) + the survey item, ready to pass to the page and the configurator. */
export function pageOptions(type: AcTypeId, btu: number): ProductPageOptions {
  const o = productOptions(type, btu);
  return {
    install: o.install.map(x => ({ ...x, item: slim(x.item, true) })),
    addons: o.addons.map(g => ({ group: g.group, items: g.items.map(a => ({ ...a, choices: a.choices.map(c => slim(c)) })) })),
    materials: o.materials.map(c => ({ ...c, item: slim(c.item) })),
    bundle: o.bundle,
    survey: o.install.length ? null : surveyItemFor(type, btu),
  };
}

/** The "สำรวจหน้างาน" installation line for a size the web cannot price (e.g. floor 61,000–80,000 BTU), else the general survey. */
export function surveyItemFor(type: AcTypeId, btu: number): InstallItem | null {
  const code = { wall: 'W', ceiling: 'C', cassette: 'K', floor: 'FS', duct: 'DUCT' }[type];
  const items = getInstallItems().filter(i => i.code.startsWith(`INS-${code}-`) && /-SURVEY$/.test(i.code));
  const banded = items.find(i => {
    const m = /^INS-[A-Z]+-(\d+)-(\d+|UP)-SURVEY$/.exec(i.code);
    return !!m && btu >= +m[1] && (m[2] === 'UP' || btu <= +m[2]);
  });
  const item = banded ?? getInstallItem(`INS-${code}-SURVEY`) ?? getInstallItem('DOC-SURVEY');
  return item ? slim(item) : null;
}
