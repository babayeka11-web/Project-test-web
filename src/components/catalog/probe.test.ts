import { it } from 'vitest';
import { getCatalog, installOptions, productOptions, getBrands } from '@/lib/domain/pricebook';
import { modelSlugs } from './slug';
it('probe', () => {
  const cat = getCatalog();
  let n = 0, empty = 0, longest = 0, withBundle = 0, nullSpec = 0;
  const emptyList: string[] = [];
  for (const m of cat) {
    const sl = modelSlugs(m.skus);
    if (new Set(sl).size !== sl.length) console.log('dup', m.slug);
    for (const k of m.skus) { n++; longest = Math.max(longest, k.sku.length); const o = productOptions(m.type, k.btu); if (!o.install.length) { empty++; emptyList.push(m.type + ' ' + k.btu); } if (o.bundle) withBundle++; if (!k.spec.series) nullSpec++; }
  }
  const sizes = JSON.stringify(productOptions('wall', 12000)).length;
  console.log(JSON.stringify({ series: cat.length, n, empty, longest, withBundle, nullSpec, sizes, emptyTypes: [...new Set(emptyList)].slice(0, 30), brands: getBrands().slice(0, 4) }));
  console.log(JSON.stringify(cat[0].skus[0]), cat[0].slug, cat[0].series, cat[0].label);
  const o = productOptions('wall', 12000);
  console.log(JSON.stringify(o.install.map(i => ({ ...i, item: { ...i.item } })), null, 1).slice(0, 2500));
  console.log(JSON.stringify(o.addons, null, 0).slice(0, 3000));
});
