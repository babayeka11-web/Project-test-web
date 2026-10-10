// Annual cleaning contract estimate (client-safe). Port of CLEAN_PKGS / VOLUME_LEVELS / PRICING / PRESETS / estimateContract in
// the reference sbp-core.js. Standard Pricebook rates only — special / project rates need conditions and approval and are
// never sent to the browser; from VOLUME_HINT units the page says the sales team may offer a special rate in the quotation.
// Takes the same CleanRateTable as the quick booking (pricebook.getCleanRateTable on the server → prop).
import { VOLUME_HINT } from './constants';
import { incVat, VAT } from './format';
import { cleanRate, SIZE_BANDS, type CleanPkgId, type CleanRateTable } from './cleaning';
import type { QuoteLine } from './quote';
import { jobTravel, type Zone } from './travel';
import type { AcTypeId } from './types';

export { SIZE_BANDS, VOLUME_HINT };

export const CLEAN_PKGS: readonly { id: CleanPkgId; th: string; sub: string }[] = [
  { id: 'Basic Clean', th: 'Basic Clean', sub: 'ใบรับมอบงานแบบย่อ · รับประกันงาน 30 วัน' },
  { id: 'Standard Care', th: 'Standard Care', sub: 'Service Report พร้อมภาพ · รับประกัน 45 วัน · Service Care 90 วัน' },
  { id: 'Corporate Control', th: 'Corporate Control', sub: 'Asset Report รายเครื่อง · รับประกัน 60 วัน · Service Care Plus 90 วัน' },
];

/** The public site shows the standard rate only. */
export const VOLUME_LEVELS: readonly { min: number; key: 's'; th: string }[] = [{ min: 0, key: 's', th: 'อัตรามาตรฐาน' }];

/** Crew productivity per team-day for standard cleaning (C1) — company manual §1.9 (SBP-GRW-001) mid-points. */
export const PRICING = { unitsPerTeamDay: { wall: 22, ceiling: 14, cassette: 14, floor: 14, duct: 12 } as Readonly<Record<AcTypeId, number>> };

export type ContractUnits = Partial<Record<AcTypeId, number>>;
export type ContractPreset = { id: string; th: string; sub: string; units: ContractUnits; visits: number };
export const PRESETS: readonly ContractPreset[] = [
  { id: 'office-s', th: 'สำนักงานเล็ก', sub: '10 เครื่อง', units: { wall: 8, cassette: 2 }, visits: 3 },
  { id: 'office-m', th: 'สำนักงาน 1 ชั้น', sub: '30 เครื่อง', units: { wall: 12, cassette: 14, ceiling: 4 }, visits: 3 },
  { id: 'factory', th: 'โรงงาน / โกดัง', sub: '46 เครื่อง', units: { wall: 10, ceiling: 20, floor: 8, duct: 8 }, visits: 4 },
  { id: 'building', th: 'อาคาร / คอนโด', sub: '120 เครื่อง', units: { wall: 96, cassette: 16, duct: 8 }, visits: 2 },
];

export type ContractOptions = {
  units: ContractUnits;
  /** visits per year */
  visits: number;
  zone?: Pick<Zone, 'tier' | 'km' | 'fee'> | null;
  /** work above 3 m (assessed on site — only flagged) */
  high?: boolean;
  pkg?: CleanPkgId;
  /** size band id (0–3) for most units */
  size?: number;
  /** one of the visits is a deep clean (C2) */
  deep?: boolean;
};

export type ContractLine = { type: AcTypeId; n: number; range: string | undefined; c1: number | null; c2: number | null };

export type ContractEstimate = {
  count: number;
  visits: number;
  level: (typeof VOLUME_LEVELS)[number];
  lines: ContractLine[];
  /** one C1 visit incl. travel, before VAT */
  perVisitC1: number;
  /** one C2 visit incl. travel, before VAT */
  perVisitC2: number;
  /** travel per visit */
  travel: number;
  travelLabel: string;
  minBillApplied: boolean;
  annualEx: number;
  vat: number;
  annualInc: number;
  /** annualEx / count (not rounded — pages show up100 of it) */
  perUnitYear: number;
  /** crew size per visit in team-days, rounded up to a half day */
  teamDaysPerVisit: number;
  high: boolean;
};

/** Annual contract estimate; null when there are no units. */
export function estimateContract(table: CleanRateTable, o: ContractOptions): ContractEstimate | null {
  const { units, visits, zone = null, high = false, pkg = 'Standard Care', size = 0, deep = true } = o;
  const count = Object.values(units).reduce<number>((a, b) => a + (Number(b) || 0), 0);
  if (!count) return null;
  const lvl = VOLUME_LEVELS.find(v => count >= v.min) ?? VOLUME_LEVELS[0];
  let c1 = 0;
  let c2 = 0;
  let teamDays = 0;
  const lines: ContractLine[] = [];
  for (const [t, raw] of Object.entries(units) as [AcTypeId, number | undefined][]) {
    const n = Number(raw) || 0;
    if (!n) continue;
    const r1 = cleanRate(table, pkg, 'C1', t, size);
    const r2 = cleanRate(table, pkg, 'C2', t, size);
    const p1 = r1 ? r1.ex : 0;
    const p2 = r2 ? r2.ex : 0;
    c1 += (p1 ?? 0) * n;
    c2 += (p2 ?? 0) * n;
    teamDays += n / (PRICING.unitsPerTeamDay[t] || 5);
    lines.push({ type: t, n, range: r1?.range, c1: p1, c2: p2 });
  }
  const deepVisits = deep ? 1 : 0;
  const normalVisits = Math.max(0, visits - deepVisits);
  const minBill = table.minBill;
  // below the cleaning minimum a visit carries the travel fee (no top-up to the minimum); outside the core area every visit does
  const t1 = jobTravel(zone, c1, minBill);
  const t2 = jobTravel(zone, c2, minBill);
  const v1 = c1 + t1.fee;
  const v2 = c2 + t2.fee;
  const annualEx = v1 * normalVisits + v2 * deepVisits;
  return {
    count,
    visits,
    level: lvl,
    lines,
    perVisitC1: v1,
    perVisitC2: v2,
    travel: t1.fee,
    travelLabel: t1.label,
    minBillApplied: c1 < minBill || (deep && c2 < minBill),
    annualEx,
    vat: Math.round(annualEx * VAT),
    annualInc: incVat(annualEx),
    perUnitYear: annualEx / count,
    teamDaysPerVisit: Math.ceil(teamDays * 2) / 2,
    high,
  };
}

/** Quote line for an annual contract (contract lines carry their own travel; the cart adds no trip for them). */
export function contractLine(e: ContractEstimate, o: { label: string; pkg: CleanPkgId; key?: string; detail?: string }): QuoteLine {
  return {
    kind: 'service',
    group: 'contract',
    key: o.key ?? `K-${o.label}-${o.pkg}-${e.count}-${e.visits}`,
    name: `สัญญาล้างรายปี · ${o.label} (${e.count} เครื่อง × ${e.visits} ครั้ง/ปี)`,
    detail: o.detail ?? `${o.pkg} · ยืนยันหลังสำรวจ`,
    unitEx: e.annualEx,
    qty: 1,
    units: e.count,
  };
}
