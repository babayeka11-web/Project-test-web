# Domain layer — business logic API (`src/lib/domain/*`, `src/lib/cart.ts`)

Every price, fee, date rule and business sentence on the site comes from here. The modules are a typed port of the
reference prototype (`sbp-aircare/assets/sbp-core.js`, `rates.js`, `commerce.js`, `queue.js`, `quickclean.js`, `costs.js`,
`studio-model.js`, `tradein.js`) and are checked against it value-for-value (see [Parity](#parity)).

> **Golden rule:** `pricebook.ts` is **build-time / server only** (it embeds the 220 KB Pricebook). Server components
> (`page.tsx`, `generateStaticParams`) call its getters and pass small, serialisable results to client components as
> props. Every other module is **client-safe** (pure functions + constants, no data import). There is deliberately no
> barrel `index.ts` — import each module by path so the Pricebook can never slip into a client bundle.

## Module map

| Module | Client-safe | What it holds |
|---|---|---|
| `constants.ts` | yes | `MIN_BILL` (4,500), `QUEUE_RULES`, `VOLUME_HINT`, honest-UX sentences `NOTES` |
| `format.ts` | yes | VAT, `incVat`, `vatOf`, `up100`, `baht`, `thousands`, `btuFmt`, `kbtu`, `EX_TH`, `priceOrSurvey` |
| `types.ts` | yes | AC type taxonomy (`AC_TYPES` / `TYPES`, `TYPE_BY_ID`, `TYPE_BY_CODE`, codes W/C/K/FS/DUCT, cleaning labels) |
| `company.ts` | yes | `COMPANY` facts, `lineMessageUrl()` (existing file, unchanged) |
| `rates.ts` | yes | web-decided rates `DECIDED`, `MOVE*`, `SMALL_VISIT`, `RATE_SOURCES` (port of `rates.js`) |
| **`pricebook.ts`** | **NO — server / build only** | the loaded Pricebook: catalog, brands, install / cleaning / repair lines, headline prices, product-page helpers, FAQ |
| `catalog.ts` | yes | catalog types, search / filter / sort / facets / URL params |
| `travel.ts` | yes | service area: `TRAVEL`, `TIER_TH`, `travelFee`, `roadKm`, `jobTravel`, `travelNote`, `Zone` type |
| `address.ts` | yes (book is a lazy chunk) | address book: `loadAddressBook()`, `addrSearch`, `zoneOf`, `checkZone`, `addrTh`, cascade helpers |
| `quote.ts` | yes | `QuoteLine` type, `quoteTotals`, `quoteUnits`, `quoteCount`, `rushLine` |
| `queue.ts` | yes | booking dates: `bkkNow`, `earliestNormal`, `judge`, `visitTime`, `visitLinesOf`, `dateTh`, `dateHint` (no network) |
| `cleaning.ts` | yes | packages / levels / size bands, `CleanRateTable`, `cleaningQuote` (quick booking), price-table line builders |
| `contract.ts` | yes | annual contract: `PRESETS`, `estimateContract`, `contractLine` |
| `install.ts` | yes | install packages / add-on types, `productLines`, material comparison, itemised `breakdown`, price-centre helpers |
| `btu.ts` | yes | `recommendBtu` (quick rule) + room model `btuBreakdown` / `needBtu` / `recommendUnits`, `ROOM_USES` |
| `content.ts` | yes | `serviceCards`, `PROCESS`, `faqList`, `CONTACT_TOPICS`, `isVRF`, `VRF_NOTE`, `JOB_TIME`, `TIME_NOTE`, `timeTh`, `BANNED_PHRASES` |
| `tradein.ts` | yes | trade-in value ranges `TRADE_IN`, `TRADE_ISSUES`, `tradeValue` |
| `src/lib/cart.ts` | `'use client'` | the quote store + hooks (`useCart`, `useCartCount`, `requestQuoteOpen`, `useQuoteOpenRequest`) |

All prices are **before VAT** (`EX_TH = 'ก่อน VAT'`). VAT 7 % appears only on quotation totals.

---

## `pricebook.ts` (server / build-time only)

Loads `data/pricebook.json` once (memoised) with exactly the reference `loadData()` transformations: string pool decoded ·
brand / copper renames (K Copper → O-TWO, Type L text removed) · `-MASS` and `MAT-CU-L-*` rows removed · `up100` on `INS-*`,
cleaning and repair rates · `DECIDED` overlay for lines without a rate · per-size relocation rows `MOVE-{W,C,K,FS}-{lo}-{hi}`
replacing `MOVE-W/C/K` · series grouping · FUJIVA placeholder brand (0 models). In a browser bundle it throws in development
to make a wrong import obvious.

| Export | Returns |
|---|---|
| `pricebookVersion` | `string` — Pricebook source + date text |
| `minBill` | `number` — 4500 (a test asserts `constants.MIN_BILL === minBill`) |
| `getCatalog()` | `CatalogSeries[]` — 136 series in Pricebook order; each `{ slug, refId, code, brand, brandName, brandSkus, type, inverter, label, series, skus: Sku[] }`, SKUs sorted by BTU with `{ sku, btu, price, installStdEx, spec }` (`spec` = series, system, refrigerant, pipe sizes, dimensions, weights, power, compressor, warranty, lead, outdoorModel, maxPipe, maxLift, approved) |
| `getCatalogLite()` | `CatalogSeriesLite[]` — the same without `spec` (smaller prop for `/products/`) |
| `getSeriesBySlug(slug)` | `CatalogSeries \| undefined` |
| `getSeriesSlugs()` | `string[]` — for `generateStaticParams` |
| `getSkuCount()` | `number` — 705 |
| `getBrands()` | `Brand[]` — `{ id, name, n (SKUs), own? }`, FUJIVA first (`own: true`, `n: 0` → "สอบถามราคากับทีมขาย"), then biggest first |
| `getInstallItems()` / `getInstallItem(code)` | `InstallItem[]` / `InstallItem \| undefined` — `{ code, cat, name, unit, ex, inc, exc, warranty, survey, decided? }`, `ex: null` = ประเมินหน้างาน |
| `getCleanRates()` | `CleanRate[]` — all 234 cleaning rows `{ pkg, level, ty, type (null for AHU / add-on rows), range, unit, ex, pb, warranty, care, doc, inc, exc, status, name }` |
| `getRepairItems()` | `RepairItem[]` — `{ cat, name, unit, ex, pb, warranty, inc, exc, status }` |
| `getCleanRateTable(pkgs?)` | `CleanRateTable` — compact, serialisable typed rows (`{ pkg, level, type, range, ex, name, warranty }`, 120 rows for all 3 packages, ~15 KB) + `minBill` + `v`. **The prop for every cleaning / contract calculator.** |
| `cleanFrom()` | `number` — 700, lowest quick-booking C1 price ("ล้างแอร์ เริ่ม ฿700") |
| `serviceFrom()` | `{ clean: 700, install: 3800, repair: 900 }` |
| `getServices()` | `ServiceCard[]` — `serviceCards()` with Pricebook headline prices |
| `faqPrices()` / `getFaq()` | removal / relocation prices · `FaqItem[]` with every number filled |
| `installOptions(type, btu)` | `InstallOption[]` — Standard + Premium `{ key, th, note, item }` for the size band; `[]` = survey first (ducted, floor > 60k) |
| `addonsFor(type, btu)` | `AddonGroup[]` — `{ group, items: { choices: InstallItem[], qty: 'm' \| 'pc' \| 'flag', note? }[] }` (choices > 1 = pick one, `flag` = assessed on site) |
| `materialMatrix(type, btu)` | `MaterialColumn[]` — Standard vs Premium materials by `MAT_ROWS` |
| `pipeItemFor(btu)` / `pipeBundle(item)` | the excess-pipe line · `PipeBundle` (bundle per metre vs the same parts bought line by line) |
| `productOptions(type, btu)` | `{ install, addons, materials, bundle }` — everything a product page needs for one SKU size |

Series slugs are `brand + series`, with the type and then `inverter` / `fixed` appended only when two series would
collide, then `-2`, `-3` (e.g. `casper-verde-inverter`, `carrier-tgf-fixed-speed-cassette`, `mitsubishi-electric-ply-m-2`).
They are stable for a given Pricebook.

## Client-safe modules

### `constants.ts`
`MIN_BILL = 4500` · `QUEUE_RULES = { leadDays: 3, rushFeeEx: 500 }` · `VOLUME_HINT = 10` ·
`NOTES = { estimate, simulation, volume, source, survey, askSales, outOfHours }` — use these sentences verbatim
("ราคาประมาณการ · ทีมยืนยันในใบเสนอราคา", "แบบจำลองเพื่ออธิบาย", …).

### `format.ts`
`VAT` 0.07 · `incVat(n)` = round(n × 1.07) · `vatOf(n)` = round(n × 0.07) · `up100(n)` (null-safe) · `baht(n)` → `'฿1,234'` ·
`thousands(n)` → `'1,234'` · `btuFmt(n)` → `'12,000 BTU'` · `kbtu(n)` → `'12k'` / `'9.5k'` · `EX_TH` · `priceOrSurvey(n)` → `'฿1,200'` or `'ประเมินหน้างาน'`.

### `types.ts`
`AcTypeId = 'wall' | 'ceiling' | 'cassette' | 'floor' | 'duct'` · `AC_TYPES` (= `TYPES`) `{ id, th, en, code, clean }` ·
`TYPE_BY_ID`, `TYPE_BY_CODE`, `TYPE_IDS`, `isAcType(x)`, `typeFromCleanLabel(label)`, `typeOrder(id)`.

### `rates.ts`
`DECIDED` (code → `{ ex, how: 'm'|'c'|'k', note }`) · `MOVE`, `MOVE_TH`, `MOVE_REPLACES` · `SMALL_VISIT = { minEx: 1000, th }` · `RATE_SOURCES`, `RATE_DATE`.

### `catalog.ts`
- Types: `CatalogSeries`, `CatalogSeriesLite`, `Sku`, `SkuLite`, `SkuSpec`, `Brand`, `CatalogFilter`, `FacetCounts`.
- `PRICE_BANDS`, `BTU_BANDS` (`{ id, th, min, max }`), `SORTS`.
- `emptyFilter()` → `{ q: '', type, brand, btu, price: Set, inverter: '' | 'inv' | 'fix', sort: 'rec' | 'price-asc' | 'price-desc' | 'btu' }`.
- `queryCatalog(models, f)` → `{ list, skuTotal, visibleSkus(m) }` (works with full or lite series).
- `facetCounts(models, f, brands?)` → series count per facet value (each facet ignores its own selection).
- `filterToParams(f)` / `paramsToFilter(params)` — shareable `/products/?q=…&type=wall&sort=price-asc`.
- `priceRange(m)`, `btuRange(m)`, `haystack(m)`, `textMatches(hay, q)`.
- Search = the reference rule (query without spaces / commas / `-` / `/` inside series + brand + type + SKU codes + BTU, so
  `12000` and `12,000` work; it is a substring match, so `12000` also finds 120,000 BTU units) **plus**: multi-word queries
  match when every word matches (`carrier 12000`), `12k` also means 12000, and the words `btu` / `บีทียู` / `แอร์` are ignored.

### `travel.ts`
`HQ` · `TRAVEL = { roadFactor 1.35, freeKm 30, freeProvince, baseFee 300, perKm 10, maxKm 150, source }` · `TIER_TH`
(`core | extended | out | unknown` → `{ th, note }`) · `Zone` type · `travelFee(km)` → fee or `null` beyond 150 km ·
`roadKm(lat, lon)` · `jobTravel(zone, cleanEx, minBill = MIN_BILL)` → `{ fee, small, distance, label }` ·
`travelNote(zone)` → one Thai line · `zoneChip(zone)` → `'พื้นที่หลัก' | '฿600/เที่ยว' | 'เกินระยะ' | ''` · `ZONE_RULES_V`.

### `address.ts`
- `loadAddressBook()` → `Promise<AddressBook>` — dynamic-imports `data/th-address.json` (its own lazy chunk, ~84 KB; verified
  in the dev build as `_app-pages-browser_data_th-address_json.js`). Memoised; rejects (and retries next call) if the chunk fails.
- `buildAddressBook(json)` — for server code that already has the JSON.
- `addrSearch(book, q, n = 8)` → `AddrHit[]` best first (subdistrict / district / province / postcode type-ahead).
- `zoneOf(book, pick)` → `Zone | null` · `checkZone(book, textOrPick)` → best match zone, an `unknown` zone, or `null` (< 2 chars).
- `addrTh(pick)` → `'แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150'` · `addrParts(pick)` → `{ title, sub }` for suggestion rows.
- Cascade: `provincesOf(book)`, `districtsOf(book, p)`, `subdistrictsOf(book, p, d)`, `pickFrom(book, p, d, s)`; provinces in
  `book.other` are names only (out of per-unit range).

### `quote.ts`
- `QuoteLine = { key, kind, group, name, detail?, unitEx (null = ประเมินหน้างาน), qty, units?, unit?, src?, fixed? }`;
  `kind: product | service | addon | contract | survey`, `group: product | clean | install | repair | addon | contract | survey | rush`.
- `quoteTotals(lines, zone, minBill = MIN_BILL)` → `{ ex, travel, travelLabel, travelSmall, units, cleanEx, visit, visitSmall,
  visitLabel, totalEx, vat, inc, surveys }` — identical results to the reference `commerce.quoteTotals`: travel by zone,
  cleaning below the minimum pays ฿300 (no top-up), small work only pays the gap to ฿1,000, contract lines add no trip,
  VAT once on the total.
- `quoteUnits(lines)`, `quoteCount(lines)` (badge), `lineAmount(line)`, `hasVisitWork(lines)`, `rushLine()` (`QC-RUSH`, +฿500).
- Line key scheme (same as the reference): `P-<sku>` product · `I-<INS code>` install · `A-<code>` add-on · `S-<code>` survey
  request · `QC-<pkg>-<level>-<type>-<sizeId>` quick booking · `C-<pkg>-<level>-<type>-<range>` cleaning price row ·
  `CX-<name>` AHU / add-on cleaning row · `R-<name>` repair · `K-…` contract · `QC-RUSH` rush fee. Same key = merged in the cart.

### `queue.ts` (no network — there is no live queue, `QUEUE_URL = ''`, say `QUEUE_CONFIRM_TH` = 'ทีมยืนยันคิว')
- `bkkNow(date = new Date())` → `{ date: 'YYYY-MM-DD', min }` in Bangkok time. **Every function takes `now`** — inject it in
  tests and compute it on the client (never at build time).
- `earliestNormal(now)` — first normal-booking date (+3 days, Sunday → Monday) · `addDays`, `dow`, `isOpen`, `dateTh(iso)` → `'ศ. 9 ต.ค.'`.
- `judge(date, visitLines, level, now)` → `{ kind: 'none'|'past'|'rush'|'normal', rush, closed, sameDay, late, earliest, slots, fit, time }`.
- `visitTime(lines, level)` → `[min, max, unknownUnits]` · `fitOf(time)` → half / day / days · `visitLinesOf(quoteLines)` → visit lines
  of a quotation (typed cleaning, installation per type, repair, unknown) · `SLOTS` (`am` / `pm` / `day`) · `DAY_FROM/TO/MIN` ·
  `dateHint(date, hasRush, now)` → `{ text, warn }` (one line under a date field).

### `cleaning.ts`
- `CleanPkgId` (`Basic Clean` · `Standard Care` · `Corporate Control`), `CleanLevel` (`C1` · `C2`), `CLEAN_PKG_IDS`, `QUICK_PKGS`.
- `PKG_TH` — ล้างมาตรฐาน / ล้างพร้อมรายงานภาพ / ล้างพร้อมทะเบียนทรัพย์สิน (`{ th, sub, code P1–P3 }`) · `LEVEL_TH` — ล้างปกติ C1 /
  ล้างใหญ่ C2 with one-line descriptions · `PKG_INFO`, `METHOD_INFO` (C1 / C2 / C3) for the cleaning page.
- `SIZE_BANDS` (เล็ก / กลาง / ใหญ่ / ใหญ่มาก with wall vs other ranges), `bandRange`, `sizeNum`, `sizeTh`, `bandOfBtu(type, btu)`.
- `CleanRateTable`, `CleanRateRow` · `cleanRate(table, pkg, level, type, sizeId)` · `sizesFor(table, type)` · `startAt(table, pkg, level)` ·
  `cleanFromTable(table)`.
- Quick booking: `QUICK_TYPES` (wall / ceiling / cassette / floor + where), `defaultSelection()`,
  `cleaningQuote(selection, table, zone, { date?, now? })` → `{ rows, lines, totals, units, when, rush, fill, volumeHint, outOfArea }`
  — the same lines, rush line and totals as the reference quick booking (`fill` = "add N more units to drop the travel fee").
  `cleaningSummary(selection, quote, { zoneText, date, slot })` → text for LINE / copy. `quickKey(...)`.
- Price-table lines: `cleanPriceLine(row)` (`C-…`), `cleanExtraLine({ name, ex, ty })` (`CX-…`; add-on rows become kind `addon`).

### `contract.ts`
`CLEAN_PKGS`, `SIZE_BANDS` (re-export), `PRESETS` (4 buildings), `VOLUME_HINT`, `VOLUME_LEVELS`, `PRICING.unitsPerTeamDay` ·
`estimateContract(table, { units, visits, zone?, high?, pkg = 'Standard Care', size = 0, deep = true })` →
`{ count, visits, level, lines, perVisitC1, perVisitC2, travel, travelLabel, minBillApplied, annualEx, vat, annualInc,
perUnitYear, teamDaysPerVisit, high }` or **`null` when there are no units** · `contractLine(estimate, { label, pkg })` → cart line.

### `install.ts`
`InstallItem`, `InstallOption`, `AddonGroup`, `AddonOption`, `INS_LEVELS`, `INSTALL_WARRANTY` (3 years bought here / 1 year own
unit), `INCLUDED_PIPE_M` (4), `PIPE_SET`, `pipeCodeFor(btu)`, `REMOVAL_CODE` · `MAT_ROWS`, `materialColumns(options)` ·
`packageParts(item)`, `optionNote(code)`, `breakdown(lines)` → itemised cost `{ groups, ex, vat, inc, assess }` ·
`productLines({ brandName, type, sku, btu, price, install, addons, qty })` → cart lines (`P-` `I-` `A-` `S-`) ·
`serviceLine(...)`, `installItemLine(item)`, `repairLine(row)` · `PRICE_GROUPS` (sheet-category prefixes per price-centre tab),
`inCategories(items, prefixes)`, `catTitle(cat)`.

### `btu.ts`
`recommendBtu({ w, d, h?, sun?, people?, use? })` → `{ area, btu, pick }` · `BTU_SIZES` / `STD_SIZES` · room model:
`ROOM_USES` (15 rooms, same figures as the reference room library), `ROOM_BY_ID`, `roomDefaults(room)`, `ORIENT`, `GLASS`,
`ROOF_F`, `CLOSED_F`, `solarF`, `btuBreakdown(input, room)` → `{ items: { k, th, btu }[], total }`, `needBtu`, `TYPE_RULES`,
`recommendUnits(need, area, type, sizes?)` → `{ n, per, total, project }`. Always label the result as an estimate.

### `content.ts`
`serviceCards(from?, repairCount?)` (`ServiceCard { id, th, sub, from, time, href, key?, contact? }`) · `PROCESS` ·
`faqList(prices?, minBill?)` · `CONTACT_TOPICS` · `isVRF(...texts)`, `VRF_NOTE` (VRV / VRF never goes into the cart) ·
`JOB_TIME`, `TIME_NOTE`, `timeTh([min, max])` · `BANNED_PHRASES`, `bannedIn(text)`.

### `tradein.ts`
`TRADE_IN` (`minAge`, `minBtu`, value `table`, `terms`), `TRADE_ISSUES`, `tradeValue({ btu, issue })` → `{ lo, hi, working, band } | null`.

## `src/lib/cart.ts` (`'use client'`)

Lines + picked area persisted in `localStorage['sbp-web-quote-v1']` (every access in try/catch; works without storage).
`useSyncExternalStore` with an **empty server snapshot**, so server HTML and the first client render match; storage is read on
the first client subscribe and the component re-renders. Other tabs stay in sync through the `storage` event.

| Export | What |
|---|---|
| `type CartLine` | `QuoteLine & { id }` |
| `type CartLineInput` | a `QuoteLine` without `id`, `qty` optional (1) |
| `useCart()` | `{ lines, addr, zone, zoneInput, pref, count, totals, add, addMany, replaceSource, setQty, remove, clear, setAddress, setZone, setPref, syncRush }` — `totals` via `quoteTotals(lines, zone, MIN_BILL)` |
| `useCartCount()` | badge number (Σ qty of non-survey lines); 0 on the server |
| `cart` | the same actions outside React: `get()`, `subscribe(fn)`, `add(line)` (merge by key; a survey request is kept once) → id, `addMany`, `replaceSource(src, lines)`, `setQty(id, q)` (1–999), `remove(id)`, `clear()`, `setAddress(pick, zone?, text?)` (zone computed from the lazy address book when omitted), `setZone(zone, text?)`, `setPref(date, slot)`, `syncRush(date, now?)`, `count()`, `totals()` |
| `requestQuoteOpen()` / `useQuoteOpenRequest(cb)` | ask the site-wide quote drawer to open / the drawer listens |
| `STORAGE_KEY`, `MAX_QTY` | constants |

Use the hooks in render; call `cart.*` only in event handlers / effects.

---

## Recipes

### A server page passes cleaning rates to a client calculator
```tsx
// src/app/cleaning/page.tsx (server component)
import { getCleanRateTable, cleanFrom } from '@/lib/domain/pricebook';
import { QuickBooking } from '@/components/booking/QuickBooking';

export default function CleaningPage() {
  return <QuickBooking table={getCleanRateTable(['Basic Clean', 'Standard Care'])} from={cleanFrom()} />;
}
```
```tsx
// src/components/booking/QuickBooking.tsx
'use client';
import { useMemo, useState } from 'react';
import { cleaningQuote, defaultSelection, type CleanRateTable } from '@/lib/domain/cleaning';
import { bkkNow } from '@/lib/domain/queue';
import { baht } from '@/lib/domain/format';
import { cart, requestQuoteOpen, useCart } from '@/lib/cart';

export function QuickBooking({ table }: { table: CleanRateTable; from: number }) {
  const [sel, setSel] = useState(defaultSelection);
  const [date, setDate] = useState('');
  const { zone } = useCart();
  const q = useMemo(() => cleaningQuote(sel, table, zone, { date, now: bkkNow() }), [sel, table, zone, date]);
  const book = () => { cart.replaceSource('qc', q.lines); if (date) cart.setPref(date); requestQuoteOpen(); };
  return <p aria-live="polite">รวมทั้งสิ้น {baht(q.totals.inc)} · ก่อน VAT {baht(q.totals.totalEx)}</p>;
}
```

### Add lines to the quote
```ts
import { cart } from '@/lib/cart';
import { productLines } from '@/lib/domain/install';
import { cleanPriceLine } from '@/lib/domain/cleaning';
import { repairLine, installItemLine } from '@/lib/domain/install';

cart.addMany(productLines({ brandName: s.brandName, type: s.type, sku: k.sku, btu: k.btu, price: k.price, install: std, addons: [], qty: 1 }));
cart.add(cleanPriceLine(row));     // a row of the cleaning price table
cart.add(repairLine(item));        // unpriced rows become survey requests automatically
cart.add(installItemLine(item));   // INS-* → install, everything else → add-on
```
VRV / VRF rows (`isVRF(name)`) never go to the cart — show the project inquiry instead.

### Product pages
```ts
// src/app/products/[slug]/page.tsx
import { getSeriesSlugs, getSeriesBySlug, productOptions } from '@/lib/domain/pricebook';
export const generateStaticParams = () => getSeriesSlugs().map(slug => ({ slug }));
// per SKU size: const opts = productOptions(series.type, sku.btu) → pass to the client component
```
Catalog list: `getCatalogLite()` + `getBrands()` → client → `queryCatalog(models, filter)` / `facetCounts(models, filter, brands)`.

### Area check
```ts
const book = await loadAddressBook();            // lazy chunk, call on focus / first keystroke
const hits = addrSearch(book, input);            // suggestions
const zone = zoneOf(book, hits[0]);              // tier, km, fee
cart.setAddress(hits[0], zone);                  // the quote uses it for travel
travelNote(zone); TIER_TH[zone.tier].th;         // what to say
```

### Quote page
`useCart()` gives lines and totals. For the date field: `dateHint(date, lines.some(l => l.group === 'rush'))`,
`judge(date, visitLinesOf(lines), 'C1', bkkNow())` for slots, then `cart.syncRush(date)` to keep exactly one rush line.

### Annual contract
`estimateContract(table, { units, visits, zone, pkg, size, deep })` → show `annualEx` (ก่อน VAT), `annualInc`,
`up100(perUnitYear)`, `teamDaysPerVisit`; `count >= VOLUME_HINT` → `NOTES.volume`; add with `cart.add(contractLine(e, { label, pkg }))`.

---

## Parity

`node scripts/ref-parity.mjs [reference-assets-dir]` loads the reference modules in node (`__SBP_DATA` / `__SBP_ADDR` set
from `data/`, minimal `localStorage` / `location` / `Image` / `matchMedia` stubs), evaluates a broad input grid and writes
`src/lib/domain/__fixtures__/parity.json` (~1 MB; long texts stored as SHA-1 digests). `src/lib/domain/parity.test.ts`
asserts the port reproduces every value: constants and Thai labels, the loaded Pricebook (136 series / 705 SKUs with spec,
brands, 185 install lines, 234 cleaning rows, 86 repair rows), headline prices, install options for 5 types × 20 sizes,
add-ons / materials for 5 types × 8 sizes, pipe bundles, 40 catalog queries with facets, 99 address picks across all four tiers, address search,
travel fees, `jobTravel`, 110 quote totals (small visit, contract, rush, survey cases), visit lines, itemised breakdowns,
648 + 30 contract estimates, Bangkok dates incl. weekends and year ends, 840 `judge` cases, 252 quick bookings, the BTU
models and the FAQ text. A coverage test keeps the grid from shrinking. Re-run the script whenever the Pricebook changes.

Reference code that only exists inside DOM closures is reproduced in the script with the reference's own functions and
constants (the quick booking `lines()` / `drawSum()`; `LEVEL_TH` and `TYPES_QC` are read from `quickclean.js` source text).

### Deliberate differences from the reference
- Catalog search: multi-word queries, `12k`, ignored filler words (single-word queries are identical).
- Service card "ติดตั้งแอร์" says `มาตรฐาน · พรีเมียม` (the reference still listed พื้นฐาน; the web sells Standard / Premium only).
- `PKG_TH` adds Corporate Control (ล้างพร้อมทะเบียนทรัพย์สิน); `cleanFrom()` still uses the two quick-booking packages (= ฿700).
- `estimateContract` returns `null` instead of `{ count: 0 }`; legacy aliases (`low`, `high_`, `travelWaived`, `travelShort`,
  `minGap`) are gone. `addonsFor` items are `{ choices[], qty, note }` instead of `{ item }` / `{ choose }`.
- No live queue, no network code (`fetchSlots` / `slotFree` / `fetchStatus` not ported). `cleaningSummary` mentions the rush
  fee only for future rush dates and the total only when units are chosen.
- The cart does not re-price stored lines when the Pricebook changes (the reference had `repriceLine`); see open issues.
- `cleanExtraLine` marks cleaning add-on rows as kind `addon` so `visitLinesOf` can skip them without the Pricebook.
