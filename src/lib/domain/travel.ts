// Service area + travel fee (client-safe). Port of TRAVEL / TIER_TH / travelFee / roadKm / jobTravel / travelNote in the
// reference sbp-core.js (Rev.20, owner 3 ต.ค. 2569; base fee and per-km rate confirmed Rev.27).
//   · core area = Bangkok within freeKm road-km of HQ → no travel fee when the visit's cleaning reaches the minimum
//     (MIN_BILL); a cleaning visit below the minimum pays baseFee instead of a top-up
//   · elsewhere up to maxKm → baseFee + perKm × km beyond freeKm per trip, rounded up to 100
//   · beyond maxKm → project / contract work (no per-unit job)
// Road km ≈ straight line from the district office (or subdistrict centre) × roadFactor — an estimate, the team confirms.
import { COMPANY } from './company';
import { MIN_BILL } from './constants';
import { baht, up100 } from './format';

export const HQ = COMPANY.hq;

export const TRAVEL = {
  roadFactor: 1.35,
  freeKm: 30,
  freeProvince: 'กรุงเทพมหานคร',
  baseFee: 300,
  perKm: 10,
  maxKm: 150,
  source: 'ค่าเดินทางเริ่มต้นและต่อกิโลเมตรจากการสำรวจราคาที่ร้านแอร์ในไทยประกาศ (29 ก.ย. 2569)',
} as const;

/** Bump when the zone rules change so stored zones (cart) are recomputed. */
export const ZONE_RULES_V = 1;

export type ZoneTier = 'core' | 'extended' | 'out' | 'unknown';

export const TIER_TH: Readonly<Record<ZoneTier, { th: string; note: string }>> = {
  core: { th: 'พื้นที่ให้บริการหลัก', note: `กรุงเทพฯ ในระยะ ${TRAVEL.freeKm} กม. จากสำนักงานใหญ่ ไม่มีค่าเดินทางเมื่อยอดงานล้างถึงขั้นต่ำ` },
  extended: { th: 'รับงานได้ คิดค่าเดินทางตามระยะ', note: `ค่าเดินทางต่อเที่ยว = ${TRAVEL.baseFee} บาท + ${TRAVEL.perKm} บาทต่อ กม. ที่เกิน ${TRAVEL.freeKm} กม. (ก่อน VAT ปัดขึ้นหลักร้อย)` },
  out: { th: 'เกินระยะรับงานรายเครื่อง', note: `ไกลกว่า ${TRAVEL.maxKm} กม. ฝากข้อมูลไว้ ทีมประเมินเป็นงานโครงการหรือสัญญา` },
  unknown: { th: 'ไม่พบพื้นที่นี้', note: 'เลือกจากรายการ หรือพิมพ์ชื่อแขวง/ตำบล เขต/อำเภอ หรือรหัสไปรษณีย์' },
};

/** Zone of one picked address (see address.ts zoneOf). km / fee are null when unknown or beyond the address book. */
export type Zone = {
  province: string;
  district: string;
  sub: string;
  zip: string;
  /** display name of the pick (addrTh) or the typed text */
  match: string;
  districts: string[];
  tier: ZoneTier;
  km: number | null;
  /** travel fee per trip before VAT: 0 in the core area, null when out / unknown */
  fee: number | null;
};

/** Fee for one trip at `km` road-km outside the core area; null beyond maxKm. */
export const travelFee = (km: number): number | null =>
  km > TRAVEL.maxKm ? null : up100(TRAVEL.baseFee + TRAVEL.perKm * Math.max(0, km - TRAVEL.freeKm));

const hav = (a: number, b: number, c: number, d: number): number => {
  const R = 6371;
  const t = (x: number) => (x * Math.PI) / 180;
  const dl = t(c - a);
  const dn = t(d - b);
  const s = Math.sin(dl / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(dn / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
};

/** Estimated road km from HQ to a point (straight line × roadFactor, rounded). */
export const roadKm = (lat: number, lon: number): number => Math.round(hav(HQ.lat, HQ.lon, lat, lon) * TRAVEL.roadFactor);

export type JobTravel = {
  fee: number;
  /** the visit has cleaning below the minimum */
  small: boolean;
  /** the fee is the distance fee of the extended area */
  distance: boolean;
  label: string;
};

/** Travel for one visit: the zone (or null when not given yet) and the cleaning amount of that visit (before VAT). */
export function jobTravel(zone: Pick<Zone, 'tier' | 'km' | 'fee'> | null | undefined, cleanEx = 0, minBill: number = MIN_BILL): JobTravel {
  const small = cleanEx > 0 && cleanEx < minBill;
  if (zone && zone.tier === 'extended') {
    return { fee: zone.fee ?? 0, small, distance: true, label: `ค่าเดินทาง ${zone.km} กม. (ระยะถนนโดยประมาณ)` };
  }
  if (small && (!zone || zone.tier === 'core' || zone.tier === 'unknown')) {
    return { fee: TRAVEL.baseFee, small, distance: false, label: `ค่าเดินทาง (งานล้างต่ำกว่าขั้นต่ำ ${baht(minBill)})` };
  }
  return { fee: 0, small, distance: false, label: '' };
}

/** One line about the travel rule of a zone ('' when no zone). */
export const travelNote = (z: Pick<Zone, 'tier' | 'km' | 'fee'> | null | undefined, minBill: number = MIN_BILL): string =>
  !z
    ? ''
    : z.tier === 'core'
      ? `ในระยะ ${z.km} กม. · ไม่มีค่าเดินทางเมื่องานล้างถึง ${baht(minBill)}`
      : z.tier === 'extended'
        ? `ระยะถนนประมาณ ${z.km} กม. · ค่าเดินทาง ${baht(z.fee ?? 0)}/เที่ยว (ก่อน VAT)`
        : z.tier === 'out'
          ? TIER_TH.out.note
          : TIER_TH.unknown.note;

/** Short chip text for a zone in pickers: 'พื้นที่หลัก' · '฿600/เที่ยว' · 'เกินระยะ' · ''. */
export const zoneChip = (z: Pick<Zone, 'tier' | 'fee'> | null | undefined): string =>
  !z ? '' : z.tier === 'core' ? 'พื้นที่หลัก' : z.tier === 'extended' ? `${baht(z.fee ?? 0)}/เที่ยว` : z.tier === 'out' ? 'เกินระยะ' : '';
