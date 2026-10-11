// /sitemap.xml — every indexable static page: the main routes, each guide, each series and each model page.
import type { MetadataRoute } from 'next';
import { allModelParams } from '@/components/catalog/catalog-data';
import { GUIDES } from '@/components/knowledge/guides';
import { getSeriesSlugs } from '@/lib/domain/pricebook';
import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

const MAIN: readonly [path: string, priority: number][] = [
  ['/', 1],
  ['/cleaning/', 0.9],
  ['/installation/', 0.9],
  ['/repair/', 0.9],
  ['/trade-in/', 0.7],
  ['/products/', 0.9],
  ['/business/', 0.8],
  ['/prices/', 0.8],
  ['/area/', 0.7],
  ['/knowledge/', 0.6],
  ['/faq/', 0.6],
  ['/contact/', 0.7],
  ['/status/', 0.3],
  // /quote/ is left out: the per-visitor quote page is noindex
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const url = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({ url: `${SITE_URL}${path}`, lastModified: now, priority });
  return [
    ...MAIN.map(([p, pr]) => url(p, pr)),
    ...GUIDES.map(g => url(`/knowledge/${g.slug}/`, 0.5)),
    ...getSeriesSlugs().map(s => url(`/products/${s}/`, 0.6)),
    ...allModelParams().map(m => url(`/products/${m.slug}/${m.model}/`, 0.4)),
  ];
}
