// Server-side builder of the trade-in data (page.tsx calls it with Pricebook rows; client code never imports this file).
// It only reads plain arrays, so it has no Pricebook import itself and is easy to test.
import type { CatalogSeriesLite } from '@/lib/domain/catalog';
import type { InstallItem } from '@/lib/domain/install';
import { TYPE_BY_ID } from '@/lib/domain/types';
import {
  SIZES,
  TRADE_TYPES,
  statKey,
  type MoveRate,
  type NewStat,
  type RateLine,
  type RepairKey,
  type TradeInData,
  type TradeType,
} from './logic';

type RepairRow = { name: string; ex: number | null; unit: string | null };

/** Which Pricebook repair row each logical line uses (first row whose name starts with the pattern). */
export const REPAIR_PICK: Readonly<Record<RepairKey, RegExp>> = {
  diagWall: /^ตรวจวินิจฉัยแอร์ติดผนัง/,
  diagOther: /^ตรวจวินิจฉัยแอร์แขวน/,
  compInv: /^เปลี่ยนคอมเพรสเซอร์ Inverter/,
  comp20: /^เปลี่ยนคอมเพรสเซอร์ 9,000-20,000/,
  comp36: /^เปลี่ยนคอมเพรสเซอร์ 21,000-36,000/,
  comp60: /^เปลี่ยนคอมเพรสเซอร์ 37,000-60,000/,
  leakTest: /^ตรวจรั่วด้วยไนโตรเจน/,
  recover: /^Recover\//,
  vacuum: /^Vacuum ระบบอย่างเดียว/,
  refillR22: /^เติมสารทำความเย็น R22/,
  refillR32: /^เติมสารทำความเย็น R32\/R410A/,
  spotLeak: /^ซ่อมรั่วเฉพาะจุด/,
  coilOut: /^เปลี่ยนแผงคอยล์ร้อน/,
  coilIn: /^เปลี่ยนแผงคอยล์เย็น/,
  boardInv: /^ซ่อม\/เปลี่ยนบอร์ด Inverter/,
  boardFix: /^เปลี่ยนบอร์ดควบคุม Fixed Speed/,
  motorBig: /^เปลี่ยนมอเตอร์ FCU\/CDU/,
  motorIn: /^เปลี่ยนมอเตอร์คอยล์เย็น/,
  motorOut: /^เปลี่ยนมอเตอร์คอยล์ร้อนพร้อมใบพัด/,
};

const rate = (r: RepairRow | InstallItem | undefined): RateLine | null => (r ? { name: r.name, ex: r.ex, unit: r.unit } : null);

/** One catalog SKU as the comparison needs it. */
export type NewUnit = { type: TradeType; btu: number; price: number; installStdEx: number | null; inverter: boolean };

/** Inverter SKUs with a price, of the four types the old-unit form offers. */
export function newUnitList(series: readonly CatalogSeriesLite[]): NewUnit[] {
  const types = new Set<string>(TRADE_TYPES);
  return series
    .filter(s => s.inverter && types.has(s.type))
    .flatMap(s => s.skus.filter(k => k.price > 0).map(k => ({ type: s.type as TradeType, btu: k.btu, price: k.price, installStdEx: k.installStdEx, inverter: true })));
}

/** Price range, median and standard installation of the new units that fit an old unit of `btu` (−10 % … +12 %). */
export function newUnitStat(list: readonly NewUnit[], type: TradeType, btu: number): NewStat {
  const lo = btu * 0.9;
  const hi = btu * 1.12;
  const fit = list
    .filter(u => u.inverter && u.type === type && u.btu >= lo && u.btu <= hi && u.price > 0)
    .sort((a, b) => a.price - b.price || a.btu - b.btu);
  if (!fit.length) return { n: 0, min: null, max: null, med: null, medBtu: null, install: null };
  const mid = fit[Math.floor((fit.length - 1) / 2)];
  return { n: fit.length, min: fit[0].price, max: fit[fit.length - 1].price, med: mid.price, medBtu: mid.btu, install: mid.installStdEx };
}

export function buildTradeInData(src: { catalog: readonly CatalogSeriesLite[]; repair: readonly RepairRow[]; install: readonly InstallItem[] }): TradeInData {
  const repair = Object.fromEntries(
    (Object.keys(REPAIR_PICK) as RepairKey[]).map(k => [k, rate(src.repair.find(r => REPAIR_PICK[k].test(r.name)))]),
  ) as TradeInData['repair'];

  const units = newUnitList(src.catalog);
  const newUnits: Record<string, NewStat> = {};
  TRADE_TYPES.forEach(t => SIZES.forEach(b => (newUnits[statKey(t, b)] = newUnitStat(units, t, b))));

  const byCode = (c: string) => src.install.find(i => i.code === c);
  const removal = Object.fromEntries(TRADE_TYPES.map(t => [t, rate(byCode({ wall: 'REM-W', ceiling: 'REM-C', cassette: 'REM-K', floor: 'REM-FS' }[t]))])) as TradeInData['removal'];

  const moves: MoveRate[] = [];
  TRADE_TYPES.forEach(t => {
    const code = TYPE_BY_ID[t].code;
    src.install.forEach(i => {
      const m = i.code.match(new RegExp(`^MOVE-${code}-(\\d+)-(\\d+)$`));
      if (m) moves.push({ type: t, lo: +m[1], hi: +m[2], ex: i.ex });
    });
  });
  moves.sort((a, b) => a.lo - b.lo);

  return { repair, newUnits, removal, dispose: rate(byCode('DISPOSE')), moves };
}
