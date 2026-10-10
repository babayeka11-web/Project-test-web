// URL helpers for the catalog (client-safe, no data). Every SKU has its own page: /products/<series slug>/<model slug>/.
// Model slug = SKU code lower-cased, every run of characters outside [a-z0-9] turned into one '-', trimmed, and made unique
// within its series ('-2', '-3' …). Other pages that link to a model page should use modelSlugs() from here.

/** 'CFH-32IVSA60 / CCS-32IVSA60(A)-H' → 'cfh-32ivsa60-ccs-32ivsa60-a-h' */
export const skuSlug = (sku: string): string =>
  sku
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'model';

/** Slugs for the SKUs of one series, in the same order, de-duplicated within the series. */
export function modelSlugs(skus: readonly { sku: string }[]): string[] {
  const used = new Set<string>();
  return skus.map(k => {
    const base = skuSlug(k.sku);
    let slug = base;
    for (let n = 2; used.has(slug); n++) slug = `${base}-${n}`;
    used.add(slug);
    return slug;
  });
}

export const productsPath = '/products/';
export const seriesPath = (seriesSlug: string): string => `/products/${seriesSlug}/`;
export const modelPath = (seriesSlug: string, modelSlug: string): string => `/products/${seriesSlug}/${modelSlug}/`;
