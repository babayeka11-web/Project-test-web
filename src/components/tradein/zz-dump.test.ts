import { test } from 'vitest';
import { writeFileSync } from 'node:fs';
import { getInstallItems, installOptions, addonsFor, materialMatrix, serviceFrom, getCatalogLite } from '@/lib/domain/pricebook';
test('dump', () => {
  const items = getInstallItems();
  const o: Record<string, unknown> = {
    items,
    from: serviceFrom(),
    wall12: installOptions('wall', 12000),
    addons: addonsFor('wall', 12000),
    mats: materialMatrix('wall', 12000),
    cats: [...new Set(items.map(i => i.cat))],
  };
  writeFileSync('/tmp/claude-0/-home-user-Project-test-web/343e7ae3-b4d0-504d-8f71-b910e53dbeb2/scratchpad/dump.json', JSON.stringify(o, null, 1));
});
