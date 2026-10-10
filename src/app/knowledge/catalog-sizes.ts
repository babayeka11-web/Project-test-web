// Server only (imports the Pricebook): which standard size classes (9,000 · 12,000 · 18,000 …) each AC type is sold in and the
// cheapest machine price of each class, as a small serialisable prop for the BTU calculator. Catalog SKUs carry their real
// rated BTU (11,098 · 12,283 …), so each one is filed under the nearest standard class (within 12 %). Prices are machine
// only, before VAT, installation not included.
import type { CatalogSize } from '@/components/knowledge/BtuCalculator';
import { BTU_SIZES } from '@/lib/domain/btu';
import { getCatalogLite } from '@/lib/domain/pricebook';
import type { AcTypeId } from '@/lib/domain/types';

const classOf = (btu: number): number | null => {
  const nearest = BTU_SIZES.reduce((a, b) => (Math.abs(b - btu) < Math.abs(a - btu) ? b : a));
  return Math.abs(nearest - btu) / nearest <= 0.12 ? nearest : null;
};

export function catalogSizes(): Partial<Record<AcTypeId, CatalogSize[]>> {
  const cheapest = new Map<AcTypeId, Map<number, number>>();
  for (const series of getCatalogLite()) {
    const sizes = cheapest.get(series.type) ?? new Map<number, number>();
    for (const sku of series.skus) {
      const cls = classOf(sku.btu);
      if (cls === null || !(sku.price > 0)) continue;
      const known = sizes.get(cls);
      if (known === undefined || sku.price < known) sizes.set(cls, sku.price);
    }
    cheapest.set(series.type, sizes);
  }
  const out: Partial<Record<AcTypeId, CatalogSize[]>> = {};
  for (const [type, sizes] of cheapest) {
    out[type] = [...sizes].map(([btu, from]) => ({ btu, from })).sort((a, b) => a.btu - b.btu);
  }
  return out;
}
