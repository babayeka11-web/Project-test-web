// Quotation maths (client-safe). Port of quoteUnits / quoteTotals in the reference commerce.js (Rev.11 / Rev.20 / Rev.27).
// The cart, the quick cleaning booking and every calculator share these functions, so every total on the site follows the
// same rules: VAT once on the total · travel by zone and cleaning minimum · small-visit minimum · contract lines carry their
// own travel per visit (no extra trip).
import { MIN_BILL, QUEUE_RULES } from './constants';
import { baht, VAT } from './format';
import { SMALL_VISIT } from './rates';
import { jobTravel, type Zone } from './travel';

export type LineKind = 'product' | 'service' | 'addon' | 'contract' | 'survey';
export type LineGroup = 'product' | 'clean' | 'install' | 'repair' | 'addon' | 'contract' | 'survey' | 'rush';

/** One quotation line. Same shape as CartLine (src/lib/cart.ts) without the store id. */
export type QuoteLine = {
  /** stable identity: P-<sku> · I-<install code> · A-/S-<code> · QC-/C-/CX- cleaning · R- repair · K- contract · QC-RUSH */
  key: string;
  kind: LineKind;
  group: LineGroup;
  name: string;
  detail?: string;
  /** unit price before VAT; null = "ประเมินหน้างาน" (assessed on site) */
  unitEx: number | null;
  qty: number;
  /** machines this line stands for when qty is not a unit count (e.g. a contract line: qty 1, units 30) */
  units?: number;
  /** unit label shown next to the price ('เครื่อง', 'เมตร' …) */
  unit?: string;
  /** which tool added it ('qc' = quick cleaning booking) — lets a tool replace its own lines */
  src?: string;
  /** quantity is fixed (rush fee) */
  fixed?: boolean;
};

export type QuoteTotals = {
  /** sum of priced lines, before VAT */
  ex: number;
  travel: number;
  travelLabel: string;
  /** cleaning in this visit is below the minimum (the travel base fee applies) */
  travelSmall: boolean;
  /** machines on site (largest per-group count) */
  units: number;
  cleanEx: number;
  /** small-visit charge (gap to SMALL_VISIT.minEx) */
  visit: number;
  visitSmall: boolean;
  visitLabel: string;
  totalEx: number;
  vat: number;
  /** total including VAT */
  inc: number;
  /** lines without a price (assessed on site) */
  surveys: number;
};

export const lineAmount = (l: Pick<QuoteLine, 'unitEx' | 'qty'>): number | null => (l.unitEx == null ? null : l.unitEx * l.qty);

/** Machines on site = the largest per-group count (a product + its install line is still one machine). */
export function quoteUnits(lines: readonly Pick<QuoteLine, 'group' | 'qty' | 'units'>[]): number {
  const by: Record<string, number> = {};
  lines.forEach(i => {
    if (i.group === 'product' || i.group === 'install' || i.group === 'clean' || i.group === 'repair') {
      by[i.group] = (by[i.group] || 0) + (i.units || i.qty);
    }
  });
  return Math.max(0, ...Object.values(by));
}

const MAIN_GROUPS: readonly LineGroup[] = ['clean', 'install', 'repair', 'contract'];

/** Totals of a quotation for one visit at `zone` (null = area not given yet). */
export function quoteTotals(lines: readonly QuoteLine[], zone: Pick<Zone, 'tier' | 'km' | 'fee'> | null | undefined, minBill: number = MIN_BILL): QuoteTotals {
  let ex = 0;
  let cleanEx = 0;
  lines.forEach(i => {
    if (i.unitEx != null) {
      ex += i.unitEx * i.qty;
      if (i.group === 'clean') cleanEx += i.unitEx * i.qty;
    }
  });
  const units = quoteUnits(lines);
  // annual contracts already carry travel per visit — only charge a trip for the one-off lines
  const oneOff = lines.some(i => i.group !== 'contract' && i.kind !== 'survey');
  const tr = oneOff ? jobTravel(zone, cleanEx, minBill) : { fee: 0, small: false, label: '' };
  const travel = tr.fee;
  // small work only (no cleaning / installation / repair / contract line in this visit): the items count toward the
  // per-visit minimum and the difference is the visit charge
  const main = lines.some(i => MAIN_GROUPS.includes(i.group));
  const smallEx = lines.filter(i => i.group === 'addon' && i.unitEx != null).reduce((n, i) => n + (i.unitEx as number) * i.qty, 0);
  const small = !main && lines.some(i => i.group === 'addon');
  const visit = small ? Math.max(0, SMALL_VISIT.minEx - smallEx) : 0;
  const totalEx = ex + travel + visit;
  const vat = Math.round(totalEx * VAT);
  return {
    ex,
    travel,
    travelLabel: tr.label,
    travelSmall: tr.small,
    units,
    cleanEx,
    visit,
    visitSmall: small,
    visitLabel: `${SMALL_VISIT.th} ${baht(SMALL_VISIT.minEx)}`,
    totalEx,
    vat,
    inc: totalEx + vat,
    surveys: lines.filter(i => i.unitEx == null).length,
  };
}

/** Number of items for the cart badge: Σ qty of every line that is not a survey request. */
export const quoteCount = (lines: readonly Pick<QuoteLine, 'kind' | 'qty'>[]): number =>
  lines.reduce((n, l) => n + (l.kind === 'survey' ? 0 : l.qty), 0);

/** The quotation has a crew visit (cleaning with a price, installation or repair) — a rush fee can apply to it. */
export const hasVisitWork = (lines: readonly Pick<QuoteLine, 'group' | 'unitEx'>[]): boolean =>
  lines.some(l => (l.group === 'clean' && l.unitEx != null) || l.group === 'install' || l.group === 'repair');

/** The คิวด่วน line (one per visit, before VAT; charged only when a crew is free — the team confirms). */
export const rushLine = (): QuoteLine => ({
  kind: 'service',
  group: 'rush',
  src: 'qc',
  fixed: true,
  key: 'QC-RUSH',
  name: `คิวด่วน (ภายใน ${QUEUE_RULES.leadDays} วัน)`,
  detail: 'ต่อการเข้างาน · รับเมื่อมีทีมว่าง ถ้าไม่มีคิวไม่เก็บค่านี้',
  unitEx: QUEUE_RULES.rushFeeEx,
  qty: 1,
});
