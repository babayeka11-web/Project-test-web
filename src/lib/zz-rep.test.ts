import { it } from 'vitest';
import { getRepairItems, serviceFrom } from '@/lib/domain/pricebook';
it('dump', () => {
  const r = getRepairItems();
  console.log(JSON.stringify(serviceFrom()), r.length);
  const cats: Record<string, number> = {};
  r.forEach(x => { cats[String(x.cat)] = (cats[String(x.cat)] || 0) + 1; });
  console.log(JSON.stringify(cats, null, 1));
  console.log(r.slice(0, 6).map(x => JSON.stringify(x)).join('\n'));
  console.log(r.filter(x => x.cat === 'ตรวจวินิจฉัย').map(x => JSON.stringify(x)).join('\n'));
  console.log('nulls', r.filter(x => x.ex == null).length, 'status', [...new Set(r.map(x => x.status))].join(','));
  console.log('warranty', [...new Set(r.map(x => x.warranty))].join(' | '));
  console.log('units', [...new Set(r.map(x => x.unit))].join(' | '));
});
