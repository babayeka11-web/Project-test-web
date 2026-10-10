// ┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
// │ SERVER / BUILD-TIME ONLY. This module embeds data/pricebook.json (~220 KB). Import it from server components        │
// │ (page.tsx, layout.tsx, generateStaticParams) and pass small, serialisable results to client components as props.     │
// │ Never import it from a 'use client' file — use the client-safe modules (catalog, cleaning, quote, …) there.          │
// └──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
// The company Pricebook 2569 with EXACTLY the transformations of the reference loadData() (sbp-core.js Rev.07–Rev.27):
//   · string pool decoded · products grouped into series (brand | series | type | inverter) with stable URL slugs
//   · copper brand shown as O-TWO (K Copper / Type L text renamed) · Basic/MASS tier and Type L copper rows removed
//   · service rates rounded up to 100: INS-* installation, cleaning, repair (materials keep their exact price)
//   · rates.ts DECIDED overlay for lines without a rate · per-size relocation rows MOVE-{W,C,K,FS}-{lo}-{hi} replacing MOVE-W/C/K
//   · FUJIVA (company brand) listed first with 0 models — "สอบถามราคากับทีมขาย"
// Every getter is memoised; results are plain objects (safe to pass as props).
import raw from '@data/pricebook.json';
import { type CleanLevel, type CleanPkgId, type CleanRateTable, CLEAN_PKG_IDS, QUICK_PKGS } from './cleaning';
import { type Brand, type CatalogSeries, type CatalogSeriesLite, type SkuSpec } from './catalog';
import { faqList, serviceCards, type FaqItem, type FaqPrices, type ServiceCard, type ServiceFrom } from './content';
import { baht, up100 } from './format';
import {
  INS_LEVELS,
  materialColumns,
  pipeCodeFor,
  REMOVAL_CODE,
  type AddonGroup,
  type AddonOption,
  type InstallItem,
  type InstallOption,
  type MaterialColumn,
  type PipeBundle,
} from './install';
import { DECIDED, MOVE, MOVE_REPLACES, MOVE_TH } from './rates';
import { TYPE_BY_ID, typeFromCleanLabel, type AcTypeId } from './types';

if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  throw new Error('src/lib/domain/pricebook.ts is build-time only: compute on the server and pass props to client components.');
}

/* ---------- raw JSON shape ---------- */

type Ix = number | null; // string-pool index (null / -1 = empty)
type RawProd = [type: string, brand: string, model: string, btu: number, px: number, ix: number | null, approved: number, ...pool: Ix[]];
type RawInst = [code: string, cat: Ix, name: string, unit: Ix, price: number | null, inc: Ix, exc: Ix, warranty: Ix, survey: Ix];
type RawClean = [pkg: Ix, level: string, ty: Ix, range: Ix, unit: Ix, s: number | null, sp: number | null, pj: number | null, warranty: Ix, care: Ix, doc: Ix, inc: Ix, exc: Ix, status: Ix, name: string];
type RawRep = [cat: Ix, name: string, unit: Ix, s: number | null, sp: number | null, pj: number | null, warranty: Ix, inc: Ix, exc: Ix, status: Ix];
type RawPricebook = { v: string; pf: string[]; pool: string[]; prods: RawProd[]; inst: RawInst[]; clean: RawClean[]; rep: RawRep[]; minBill: number };

const RAW = raw as unknown as RawPricebook;

/** Pricebook version text (source + date). */
export const pricebookVersion: string = RAW.v;
/** Cleaning minimum per visit before VAT (= constants.MIN_BILL, checked by a test). */
export const minBill: number = RAW.minBill;

/* ---------- public row types ---------- */

export type CleanRate = {
  pkg: CleanPkgId;
  level: CleanLevel;
  /** type label of the cleaning sheet ('ติดผนัง', 'AHU', 'งานเพิ่ม' …) */
  ty: string | null;
  /** null for AHU / add-on / special-area rows */
  type: AcTypeId | null;
  range: string | null;
  unit: string | null;
  /** standard rate before VAT, rounded up to 100; null = assessed on site */
  ex: number | null;
  /** the Pricebook figure before rounding */
  pb: number | null;
  warranty: string | null;
  care: string | null;
  doc: string | null;
  inc: string | null;
  exc: string | null;
  status: string | null;
  name: string;
};

export type RepairItem = {
  cat: string | null;
  name: string;
  unit: string | null;
  /** standard rate before VAT, rounded up to 100; null = assessed on site */
  ex: number | null;
  pb: number | null;
  warranty: string | null;
  inc: string | null;
  exc: string | null;
  status: string | null;
};

/* ---------- load (once) ---------- */

const urlSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const copper = (t: string | null): string | null =>
  t == null
    ? t
    : t
        .replace(/K Copper Type L/g, 'O-TWO')
        .replace(/K Copper/g, 'O-TWO')
        .replace(/ท่อน้ำยาทองแดง 0\.70 มม\./g, 'ท่อน้ำยาทองแดง O-TWO 0.70 มม.')
        .replace(/ท่อ Type L หรือ Project-grade ใช้เมื่อระบุใน QTN\/BOQ;\s*ไม่รวมอัตโนมัติหากไม่ระบุ;\s*/g, '');

type Loaded = {
  catalog: CatalogSeries[];
  brands: Brand[];
  bySlug: Map<string, CatalogSeries>;
  inst: InstallItem[];
  instByCode: Record<string, InstallItem>;
  clean: CleanRate[];
  rep: RepairItem[];
};

/** Give each series a short, unique, URL-safe slug: brand + series; type and inverter / fixed are added only when needed. */
function assignSlugs(groups: { brand: string; seriesName: string; type: string; inverter: boolean }[]): string[] {
  const parts = groups.map(g => [urlSlug(`${g.brand} ${g.seriesName}`)]);
  const extras: ((g: (typeof groups)[number]) => string)[] = [g => g.type, g => (g.inverter ? 'inverter' : 'fixed')];
  for (const extra of extras) {
    const cur = parts.map(p => p.join('-'));
    const sets = new Map<string, number[]>();
    cur.forEach((s, i) => sets.set(s, [...(sets.get(s) || []), i]));
    sets.forEach(ix => {
      if (ix.length < 2 || new Set(ix.map(i => extra(groups[i]))).size < 2) return;
      ix.forEach(i => parts[i].push(extra(groups[i])));
    });
  }
  const used = new Set<string>();
  return parts.map(p => {
    const s0 = p.join('-') || 'series';
    let s = s0;
    for (let k = 2; used.has(s); k++) s = `${s0}-${k}`;
    used.add(s);
    return s;
  });
}

function build(j: RawPricebook): Loaded {
  const S = (i: Ix | undefined): string | null => (i == null || i < 0 ? null : j.pool[i]);

  /* products → series */
  const brands: Brand[] = [];
  const brandById: Record<string, Brand> = {};
  type Group = Omit<CatalogSeries, 'slug' | 'brandName' | 'brandSkus'>;
  const groups = new Map<string, Group>();
  const seriesName = new Map<Group, string>();
  for (const r of j.prods) {
    const [type, brand, model, btu, px, ix, approved, se, sys, ref, pl, pg, idim, iwt, odim, owt, pw, comp, war, lead, od, lmax, hmax] = r;
    const spec: SkuSpec = {
      series: S(se), system: S(sys), refrigerant: S(ref), pipeLiquid: S(pl), pipeGas: S(pg), indoorDim: S(idim), indoorKg: S(iwt),
      outdoorDim: S(odim), outdoorKg: S(owt), power: S(pw), compressor: S(comp), warranty: S(war), lead: S(lead), outdoorModel: S(od),
      maxPipe: S(lmax), maxLift: S(hmax), approved: !!approved,
    };
    const bid = urlSlug(brand);
    if (!brandById[bid]) {
      const b: Brand = { id: bid, name: brand, n: 0 };
      brands.push(b);
      brandById[bid] = b;
    }
    brandById[bid].n++;
    const inverter = /inverter/i.test(spec.system || '');
    const key = [bid, spec.series || model, type, inverter].join('|');
    if (!groups.has(key)) {
      const sn = spec.series || model;
      const g: Group = {
        refId: urlSlug(key),
        code: model,
        brand: bid,
        type: type as AcTypeId,
        inverter,
        label: spec.refrigerant || '—',
        series: sn + (/inverter|fixed/i.test(spec.series || '') ? '' : inverter ? ' · Inverter' : spec.system ? ' · ' + spec.system : ''),
        skus: [],
      };
      groups.set(key, g);
      seriesName.set(g, sn);
    }
    (groups.get(key) as Group).skus.push({ sku: model, btu, price: px, installStdEx: ix, spec });
  }
  const list = [...groups.values()];
  list.forEach(m => {
    m.skus.sort((a, b) => a.btu - b.btu);
    m.code = m.skus[0].sku;
  });
  brands.sort((a, b) => b.n - a.n);
  const fujiva: Brand = { id: 'fujiva', name: 'FUJIVA', own: true, n: 0 };
  brands.unshift(fujiva);
  brandById.fujiva = fujiva;
  const slugs = assignSlugs(list.map(m => ({ brand: m.brand, seriesName: seriesName.get(m) as string, type: m.type, inverter: m.inverter })));
  const catalog: CatalogSeries[] = list.map((m, i) => ({ ...m, slug: slugs[i], brandName: brandById[m.brand].name, brandSkus: brandById[m.brand].n }));

  /* installation + add-on items (web: Standard / Premium only, O-TWO copper only) */
  let inst: InstallItem[] = j.inst
    .map(([c, cat, n, u, p, inc, exc, w, sv]): InstallItem => ({
      code: c, cat: S(cat), name: copper(n) as string, unit: S(u), ex: /^INS-/.test(c) ? up100(p) : p,
      inc: copper(S(inc)), exc: S(exc), warranty: S(w), survey: S(sv),
    }))
    .filter(i => !/-MASS$/.test(i.code) && !/^MAT-CU-L-/.test(i.code));
  inst.forEach(i => {
    const d = DECIDED[i.code];
    if (d && i.ex == null) Object.assign(i, { ex: up100(d.ex), decided: d.how, inc: d.note + (i.inc ? ' · ' + i.inc : '') });
  });
  {
    const byCode = Object.fromEntries(inst.map(i => [i.code, i]));
    const at = inst.findIndex(i => i.code === MOVE_REPLACES[0]);
    const cat = at >= 0 ? inst[at].cat : '13 งานรื้อ ย้าย และขนย้าย';
    const rows: InstallItem[] = [];
    (Object.entries(MOVE) as [keyof typeof MOVE, string][]).forEach(([C, rc]) => {
      const rem = byCode[rc];
      if (!rem || rem.ex == null) return;
      const remEx = rem.ex;
      inst.filter(i => new RegExp(`^INS-${C}-\\d+-\\d+-STANDARD$`).test(i.code) && i.ex != null).forEach(ins => {
        const [lo, hi] = ins.code.split('-').slice(2, 4).map(Number);
        const f = (n: number) => n.toLocaleString('en-US');
        const insEx = ins.ex as number;
        rows.push({
          code: `MOVE-${C}-${lo}-${hi}`, cat, name: `ย้ายแอร์${MOVE_TH[C]} ${f(lo)}–${f(hi)} BTU (รื้อ + ติดตั้งมาตรฐานจุดใหม่)`, unit: 'เครื่อง', ex: remEx + insEx, decided: 'k',
          inc: `รื้อเครื่องเดิม (${baht(remEx)}: ${DECIDED[rc].note}) + ติดตั้งมาตรฐานจุดใหม่ (${baht(insEx)}: ท่อน้ำยาและวัสดุ 4 เมตรแรก Vacuum ทดสอบเดินเครื่อง) ในสถานที่เดียวกัน`,
          exc: 'ไม่รวมท่อส่วนเกิน 4 เมตร ซ่อมตัวเครื่อง อะไหล่ งานสูงเกิน 3 ม. ซ่อมผนังจุดเดิม และขนย้ายข้ามสถานที่ (คิดค่าเดินทางตามระยะ)',
          warranty: 'รับประกันงานติดตั้ง 1 ปี (เครื่องเดิมของลูกค้า) · ตัวเครื่องและอะไหล่เดิมไม่อยู่ในประกัน', survey: 'NO',
        });
      });
    });
    if (rows.length) {
      inst = inst.filter(i => !MOVE_REPLACES.includes(i.code));
      inst.splice(Math.max(0, Math.min(at, inst.length)), 0, ...rows);
    }
  }
  const instByCode = Object.fromEntries(inst.map(i => [i.code, i]));

  /* cleaning + repair (service rates rounded up to 100; standard rate only — no special / project rates) */
  const clean: CleanRate[] = j.clean.map(([pk, lv, ty, rg, u, s, , , w, care, doc, inc, exc, st, n]) => ({
    pkg: S(pk) as CleanPkgId, level: lv as CleanLevel, ty: S(ty), type: typeFromCleanLabel(S(ty)), range: S(rg), unit: S(u), ex: up100(s), pb: s,
    warranty: S(w), care: S(care), doc: S(doc), inc: S(inc), exc: S(exc), status: S(st), name: n,
  }));
  const rep: RepairItem[] = j.rep.map(([ty, n, u, s, , , w, inc, exc, st]) => ({
    cat: S(ty), name: n.replace(/^ซ่อมแอร์:\s*/, ''), unit: S(u), ex: up100(s), pb: s, warranty: S(w), inc: S(inc), exc: S(exc), status: S(st),
  }));

  return { catalog, brands, bySlug: new Map(catalog.map(m => [m.slug, m])), inst, instByCode, clean, rep };
}

let cache: Loaded | null = null;
const load = (): Loaded => (cache ??= build(RAW));

/* ---------- getters ---------- */

/** Every series with its SKUs (sorted by BTU) and full spec, in Pricebook order. */
export const getCatalog = (): CatalogSeries[] => load().catalog;

/** The catalog without spec fields — the smaller prop for list / search pages. */
export function getCatalogLite(): CatalogSeriesLite[] {
  return load().catalog.map(m => ({ ...m, skus: m.skus.map(({ sku, btu, price, installStdEx }) => ({ sku, btu, price, installStdEx })) }));
}

/** One series by its URL slug. */
export const getSeriesBySlug = (slug: string): CatalogSeries | undefined => load().bySlug.get(slug);
/** Every series slug (generateStaticParams). */
export const getSeriesSlugs = (): string[] => load().catalog.map(m => m.slug);
/** Number of models (SKUs) in the catalog. */
export const getSkuCount = (): number => load().catalog.reduce((n, m) => n + m.skus.length, 0);

/** Brands, biggest first, FUJIVA (own brand, no Pricebook prices yet) first of all. n = SKUs. */
export const getBrands = (): Brand[] => load().brands;

/** Installation, materials and extra-work lines after the web rules (see the header). */
export const getInstallItems = (): InstallItem[] => load().inst;
export const getInstallItem = (code: string): InstallItem | undefined => load().instByCode[code];

/** Every cleaning row (3 packages × C1/C2 × type × size + AHU / add-on / special rows with type null). */
export const getCleanRates = (): CleanRate[] => load().clean;

/** Repair and diagnosis lines ('ซ่อมแอร์: ' prefix removed). */
export const getRepairItems = (): RepairItem[] => load().rep;

/** Compact cleaning table for client calculators (quick booking, contract estimate). Typed rows only. */
export function getCleanRateTable(pkgs: readonly CleanPkgId[] = CLEAN_PKG_IDS): CleanRateTable {
  return {
    v: pricebookVersion,
    minBill,
    rows: load()
      .clean.filter(r => r.type != null && pkgs.includes(r.pkg))
      .map(r => ({ pkg: r.pkg, level: r.level, type: r.type as AcTypeId, range: r.range as string, ex: r.ex, name: r.name, warranty: r.warranty })),
  };
}

const minOf = (arr: (number | null)[]): number => Math.min(...arr.filter((x): x is number => x != null));

/** Lowest per-unit cleaning price of the quick-booking packages ("ล้างแอร์ เริ่ม ฿700 / เครื่อง"). */
export function cleanFrom(): number {
  return minOf(load().clean.filter(r => r.type && r.level === 'C1' && QUICK_PKGS.includes(r.pkg) && r.ex != null).map(r => r.ex));
}

/** Headline "from" prices for the service cards: cleaning (Basic Clean C1), installation (INS-*), diagnosis fee. */
export function serviceFrom(): ServiceFrom {
  const L = load();
  return {
    clean: minOf(L.clean.filter(r => r.pkg === 'Basic Clean' && r.level === 'C1' && r.type).map(r => r.ex)),
    install: minOf(L.inst.filter(i => /^INS-/.test(i.code) && i.ex).map(i => i.ex)),
    repair: minOf(L.rep.filter(r => r.cat === 'ตรวจวินิจฉัย').map(r => r.ex)),
  };
}

/** Service cards with their Pricebook headline prices. */
export const getServices = (): ServiceCard[] => serviceCards(serviceFrom(), load().rep.length);

/** Prices quoted by the removal / relocation FAQ answer. */
export function faqPrices(): FaqPrices {
  const I = (c: string) => load().instByCode[c]?.ex ?? null;
  return { remW: I('REM-W'), remC: I('REM-C'), remK: I('REM-K'), remFS: I('REM-FS'), moveW12: I('MOVE-W-9000-12000'), dispose: I('DISPOSE') };
}

/** The FAQ with every number filled from the rules and the Pricebook. */
export const getFaq = (): FaqItem[] => faqList(faqPrices(), minBill);

/* ---------- product page helpers (per type × BTU) ---------- */

/** Installation packages (Standard, Premium) for a unit; [] when the size needs a survey (e.g. ducted, floor > 60k). */
export function installOptions(type: AcTypeId, btu: number): InstallOption[] {
  const L = load();
  const code = TYPE_BY_ID[type]?.code;
  const bands = [...new Set(L.inst.filter(i => i.code.startsWith(`INS-${code}-`) && !/SURVEY/.test(i.code)).map(i => i.code.split('-').slice(2, 4).join('-')))]
    .map(b => ({ b, lo: +b.split('-')[0], hi: +b.split('-')[1] }))
    .sort((a, b) => a.lo - b.lo);
  const band = bands.find(x => btu <= x.hi);
  if (!band) return [];
  return INS_LEVELS.map(l => ({ ...l, item: L.instByCode[`INS-${code}-${band.b}-${l.key}`] })).filter((o): o is InstallOption => !!o.item);
}

/** Add-ons offered on the product page for a unit (excess pipe per metre, drain, power, removal, …). */
export function addonsFor(type: AcTypeId, btu: number): AddonGroup[] {
  const I = (c: string) => load().instByCode[c];
  const one = (c: string, qty: AddonOption['qty'], note?: string): AddonOption[] => {
    const it = I(c);
    return it ? [{ choices: [it], qty, ...(note ? { note } : {}) }] : [];
  };
  const pick = (cs: string[], qty: AddonOption['qty'], note?: string): AddonOption[] => {
    const its = cs.map(I).filter((x): x is InstallItem => !!x);
    return its.length ? [{ choices: its, qty, ...(note ? { note } : {}) }] : [];
  };
  const all = [REMOVAL_CODE[type], 'DISPOSE', 'CIV-CORE', 'ACC-HEIGHT', 'SUP-STD', 'CIV-CHASE', 'CIV-CEIL', 'LOG-NIGHT', 'LOG-SUN'].map(I).filter((x): x is InstallItem => !!x);
  const groups: AddonGroup[] = [
    { group: 'วัสดุส่วนเกิน', items: [...one(pipeCodeFor(btu), 'm', 'ในราคาติดตั้งรวมท่อ 4 เมตรแรกแล้ว ใส่เฉพาะส่วนที่เกิน'), ...one('MAT-SCG-DRAIN-34', 'm')] },
    { group: 'ระบบไฟ', items: [...pick(['ELE-MAIN-1P-2.5', 'ELE-MAIN-1P-4', 'ELE-MAIN-1P-6'], 'm', 'ช่างยืนยันขนาดสายตามกระแสของรุ่นก่อนติดตั้ง'), ...pick(['ELE-NANO-RCBO20', 'ELE-NANO-RCBO32'], 'pc')] },
    { group: 'น้ำทิ้งและงานอื่น', items: [...one('DRAIN-PUMP-15', 'pc'), ...one('DRAIN-TRAP-34', 'pc'), ...one('FIRESTOP-4', 'pc')] },
    { group: 'เครื่องเดิมและงานเจาะ', items: all.filter(i => i.ex != null).map(item => ({ choices: [item], qty: 'pc' as const })) },
    { group: 'ประเมินหน้างาน (ไม่มีราคาตายตัว)', items: all.filter(i => i.ex == null).map(item => ({ choices: [item], qty: 'flag' as const })) },
  ];
  return groups.filter((g, i) => i < 3 || g.items.length);
}

/** Standard vs Premium material comparison for a unit (MAT_ROWS × packages). */
export const materialMatrix = (type: AcTypeId, btu: number): MaterialColumn[] => materialColumns(installOptions(type, btu));

/** The excess-pipe bundle line for a unit size. */
export const pipeItemFor = (btu: number): InstallItem | undefined => load().instByCode[pipeCodeFor(btu)];

// copper pair + insulation sizes per bundle (the same pairs as the Pricebook's PIP-PKG names)
const PAIRS: Readonly<Record<string, readonly [string, string, string, string]>> = {
  'PIP-PKG-1438': ['1438', '3814', '3838', 'R75'], 'PIP-PKG-1412': ['1412', '3814', '3812', 'R75'], 'PIP-PKG-1458': ['1458', '3814', '3858', 'R75'],
  'PIP-PKG-3858': ['3858', '3838', '3858', 'R100'], 'PIP-PKG-3834': ['3834', '3838', '3834', 'R100'],
};

/** One extra metre of the bundle against the same metre bought line by line (parts null when not comparable, e.g. 7/8"). */
export function pipeBundle(pipeItem: InstallItem | undefined): PipeBundle | null {
  if (!pipeItem) return null;
  const p = PAIRS[pipeItem.code];
  if (!p) return { item: pipeItem, parts: null };
  const I = (c: string) => load().instByCode[c];
  const parts: [InstallItem | undefined, number, string][] = [
    [I('MAT-CU-K22-' + p[0]), 1, 'ท่อทองแดงคู่'],
    [I('MAT-AERO-' + p[1]), 1, 'ฉนวนท่อเล็ก'],
    [I('MAT-AERO-' + p[2]), 1, 'ฉนวนท่อใหญ่'],
    [I('MAT-AIRPRO-' + p[3]), 1, 'รางครอบท่อ'],
    [I('ELE-YAZ-2.5'), 3, 'สายไฟ 3 เส้น'],
    [I('MAT-SCG-DRAIN-34'), 1, 'ท่อน้ำทิ้ง'],
  ];
  if (parts.some(([x]) => !x || x.ex == null)) return { item: pipeItem, parts: null };
  const ok = parts as [InstallItem & { ex: number }, number, string][];
  const sum = ok.reduce((n, [x, q]) => n + x.ex * q, 0);
  return { item: pipeItem, parts: ok.map(([x, q, th]) => ({ th, name: x.name, ex: x.ex, qty: q })), sum };
}

/** Everything a product page needs for one SKU size, in one serialisable object. */
export function productOptions(type: AcTypeId, btu: number): { install: InstallOption[]; addons: AddonGroup[]; materials: MaterialColumn[]; bundle: PipeBundle | null } {
  return { install: installOptions(type, btu), addons: addonsFor(type, btu), materials: materialMatrix(type, btu), bundle: pipeBundle(pipeItemFor(btu)) };
}
