// "แอร์เก่า ซ่อมหรือเปลี่ยนดี" — repair-or-replace comparison for an old air-conditioner (client-safe, pure).
// Port of repairLines / newSet / tradeIn in the reference tradein.js (Rev.24–27), with the Pricebook rows and the catalog
// prices passed in as small data (data.ts builds them on the server) so no Pricebook import ever reaches a client bundle.
//   · repair  = diagnosis + the parts the chosen fault usually needs, at the standard repair rates (no rate = ประเมินหน้างาน)
//   · replace = median catalog price of an Inverter unit of the same type and size + standard installation + taking the old
//               unit out, minus the trade-in value (a fixed baht range per unit, deducted from the quotation, never cash)
//   · the verdict is a rule of thumb shown with its reasons — never a promise; electricity is an estimate
import { TRADE_IN, TRADE_ISSUES, tradeValue, type TradeIssueId } from '@/lib/domain/tradein';
import { VOLUME_HINT } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';

/* ---------- choices of the form ---------- */

export type TradeType = 'wall' | 'ceiling' | 'cassette' | 'floor';
export const TRADE_TYPES: readonly TradeType[] = ['wall', 'ceiling', 'cassette', 'floor'];

export const AGES = [
  { id: 'a3', th: 'ไม่ถึง 5 ปี', y: 3 },
  { id: 'a6', th: '5–7 ปี', y: 6 },
  { id: 'a8', th: '7–10 ปี', y: 8.5 },
  { id: 'a12', th: '10–15 ปี', y: 12 },
  { id: 'a16', th: 'เกิน 15 ปี', y: 16 },
] as const;
export type AgeId = (typeof AGES)[number]['id'];

/** Nominal sizes of the old unit. */
export const SIZES: readonly number[] = [9000, 12000, 18000, 24000, 30000, 36000, 48000, 60000];
/** Wall units above 30,000 BTU are rare — the reference does not offer them for the old unit. */
export const sizesFor = (type: TradeType): number[] => SIZES.filter(b => type !== 'wall' || b <= 30000);

export const SYSTEMS = [
  { id: 'fix', th: 'Fixed speed' },
  { id: 'inv', th: 'Inverter' },
  { id: 'unk', th: 'ไม่ทราบ' },
] as const;
export type SystemId = (typeof SYSTEMS)[number]['id'];

export const REFS = [
  { id: 'r22', th: 'R22 (รุ่นเก่า)' },
  { id: 'r410', th: 'R410A' },
  { id: 'r32', th: 'R32' },
  { id: 'unk', th: 'ไม่ทราบ' },
] as const;
export type RefId = (typeof REFS)[number]['id'];

export type TradeInput = {
  age: AgeId;
  type: TradeType;
  btu: number;
  sys: SystemId;
  ref: RefId;
  issue: TradeIssueId;
  /** number of old units */
  qty: number;
  /** hours the unit runs per day (electricity estimate) */
  hrs: number;
};

export const DEFAULT_INPUT: TradeInput = { age: 'a12', type: 'wall', btu: 12000, sys: 'unk', ref: 'unk', issue: 'comp', qty: 1, hrs: 8 };

/* ---------- data from the server ---------- */

export type RateLine = { name: string; ex: number | null; unit: string | null };

export type RepairKey =
  | 'diagWall' | 'diagOther' | 'compInv' | 'comp20' | 'comp36' | 'comp60' | 'leakTest' | 'recover' | 'vacuum'
  | 'refillR22' | 'refillR32' | 'spotLeak' | 'coilOut' | 'coilIn' | 'boardInv' | 'boardFix' | 'motorBig' | 'motorIn' | 'motorOut';

/** New Inverter units of one type and size: how many, price range, the median and its standard installation. */
export type NewStat = { n: number; min: number | null; max: number | null; med: number | null; medBtu: number | null; install: number | null };
export type MoveRate = { type: TradeType; lo: number; hi: number; ex: number | null };

export type TradeInData = {
  repair: Record<RepairKey, RateLine | null>;
  /** key `${type}:${btu}` for every type × size of the form */
  newUnits: Record<string, NewStat>;
  removal: Record<TradeType, RateLine | null>;
  dispose: RateLine | null;
  moves: MoveRate[];
};

export const statKey = (type: TradeType, btu: number) => `${type}:${btu}`;
const EMPTY_STAT: NewStat = { n: 0, min: null, max: null, med: null, medBtu: null, install: null };

/* ---------- repair ---------- */

export type RepairLine = RateLine & { qty: number };

/** Repair lines for one old unit: diagnosis first, then what the fault usually needs. Nothing for a unit that still runs well. */
export function repairLines(x: Pick<TradeInput, 'type' | 'btu' | 'sys' | 'ref' | 'issue'>, rates: TradeInData['repair']): RepairLine[] {
  if (x.issue === 'reno') return [];
  const big = x.btu > 36000;
  const inv = x.sys === 'inv';
  const refill: RepairKey = x.ref === 'r22' ? 'refillR22' : 'refillR32';
  const sealed: RepairKey[] = ['recover', 'vacuum', refill]; // opening the refrigerant circuit
  const comp: RepairKey = inv ? 'compInv' : x.btu <= 20000 ? 'comp20' : x.btu <= 36000 ? 'comp36' : 'comp60';
  const byIssue: Record<TradeIssueId, RepairKey[]> = {
    reno: [],
    comp: [comp, 'leakTest', ...sealed],
    leak: ['leakTest', 'spotLeak', refill],
    coilOut: ['coilOut', ...sealed],
    coilIn: ['coilIn', ...sealed],
    board: [inv || big ? 'boardInv' : 'boardFix'],
    fanIn: [big ? 'motorBig' : 'motorIn'],
    fanOut: [big ? 'motorBig' : 'motorOut'],
    weak: [],
  };
  const keys: RepairKey[] = [x.type === 'wall' ? 'diagWall' : 'diagOther', ...(byIssue[x.issue] ?? [])];
  return keys.map(k => rates[k]).filter((r): r is RateLine => !!r).map(r => ({ ...r, qty: 1 }));
}

/* ---------- new unit ---------- */

export type NewSetResult = {
  stat: NewStat;
  install: { name: string; ex: number | null } | null;
  /** taking the old unit out: removal (refrigerant pumped down into the outdoor unit) + carrying it away */
  out: RepairLine[];
  /** null when a line has no standard rate */
  outEx: number | null;
};

/** The new Inverter unit that replaces the old one, with the standard installation and the removal of the old unit. */
export function newSet(x: Pick<TradeInput, 'type' | 'btu'>, data: TradeInData): NewSetResult {
  const stat = data.newUnits[statKey(x.type, x.btu)] ?? EMPTY_STAT;
  const install = stat.install != null ? { name: 'ติดตั้งมาตรฐาน (ตามขนาดเครื่องใหม่)', ex: stat.install } : null;
  const rem = data.removal[x.type];
  const out: RepairLine[] = [
    rem && { name: `${rem.name} + เก็บน้ำยา (เครื่องเดิม)`, ex: rem.ex, unit: rem.unit, qty: 1 },
    data.dispose && { name: `${data.dispose.name} (เครื่องเดิม)`, ex: data.dispose.ex, unit: data.dispose.unit, qty: 1 },
  ].filter((l): l is RepairLine => !!l);
  const outEx = out.length && out.every(l => l.ex != null) ? out.reduce((n, l) => n + (l.ex as number), 0) : null;
  return { stat, install, out, outEx };
}

/** Relocation rate for the old unit's size, for a unit that only needs to move. */
export function moveRate(x: Pick<TradeInput, 'type' | 'btu'>, moves: readonly MoveRate[]): MoveRate | null {
  const mine = moves.filter(m => m.type === x.type);
  return mine.find(m => x.btu <= m.hi && x.btu >= m.lo - 1000) ?? mine.find(m => x.btu <= m.hi) ?? null;
}

/* ---------- electricity (estimate) ---------- */

/** Typical seasonal efficiency (BTU/h per W) — an assumption for the estimate, not a model's label value
 *  (port of EFF / LOAD_F / RATE in the reference studio-model.js). Thai home tariff ≈ 4.62 baht per unit (Sep–Dec 2569). */
export const ELECTRIC = {
  eff: { inverter: { wall: 18, other: 14 }, fixed: { wall: 12.5, other: 11.5 } },
  loadFactor: 0.65,
  rate: 4.62,
  /** efficiency lost per year of age after year 3, at most 15 % */
  ageLossPerYear: 0.01,
  ageLossMax: 0.15,
} as const;

/** Baht per year for one clean unit running `hrs` hours a day (30-day months). */
export function electricityPerYear(btu: number, type: TradeType, inverter: boolean, hrs: number, rate: number = ELECTRIC.rate): number {
  const eff = (inverter ? ELECTRIC.eff.inverter : ELECTRIC.eff.fixed)[type === 'wall' ? 'wall' : 'other'];
  return (btu / eff / 1000) * hrs * ELECTRIC.loadFactor * 30 * rate * 12;
}

export const ageLoss = (years: number): number => Math.min(ELECTRIC.ageLossMax, Math.max(0, years - 3) * ELECTRIC.ageLossPerYear);

/* ---------- the comparison ---------- */

export type Verdict = 'replace' | 'compare' | 'repair' | 'keep';

export const VERDICT_TEXT: Readonly<Record<Verdict, { title: string; sub: string }>> = {
  replace: {
    title: 'ควรพิจารณาเปลี่ยนเป็นเครื่องใหม่',
    sub: 'อายุและอาการนี้ ซ่อมแล้วอาจเจอจุดอื่นตามมา เทิร์นเครื่องเดิมแล้วติดตั้งเครื่อง Inverter ใหม่ในวันเดียวกันได้',
  },
  compare: {
    title: 'ควรเทียบใบเสนอราคาทั้งสองทาง',
    sub: 'ให้ทีมตรวจก่อน แล้วรับใบเสนอราคาซ่อม และใบเสนอราคาเครื่องใหม่หักมูลค่าเทิร์นพร้อมกัน ตัดสินใจหลังเห็นราคาจริง',
  },
  repair: {
    title: 'ซ่อมเครื่องเดิมน่าจะเหมาะกว่า',
    sub: 'อาการนี้ซ่อมได้ในราคามาตรฐาน ยังไม่ถึงจุดที่ควรเปลี่ยนเครื่อง',
  },
  keep: {
    title: 'ยังไม่จำเป็นต้องเปลี่ยน',
    sub: 'ถ้ารีโนเวทแล้วต้องย้ายตำแหน่ง ใช้บริการรื้อ ย้าย และติดตั้งใหม่ และล้างเครื่องก่อนติดกลับ',
  },
};

export type TradeInResult = {
  q: number;
  age: (typeof AGES)[number];
  issue: (typeof TRADE_ISSUES)[number];
  repair: { lines: RepairLine[]; known: number; unknown: number };
  set: NewSetResult;
  /** median new unit + installation (null without a catalog price) */
  setEx: number | null;
  /** new unit + installation + taking the old one out, per unit */
  allEx: number | null;
  trade: ReturnType<typeof tradeValue>;
  /** after the trade-in value, per unit: [lowest, highest] */
  net: [number, number] | null;
  energy: { old: number; now: number; save: number; loss: number; oldInv: boolean; hrs: number; rate: number };
  verdict: Verdict;
  title: string;
  sub: string;
  why: string[];
  /** from VOLUME_HINT units the team may offer special rates */
  special: boolean;
  /** inside what the trade-in programme is made for (age ≥ minAge, or a major fault) */
  eligible: boolean;
};

export function clampInput(x: TradeInput): TradeInput {
  const type = TRADE_TYPES.includes(x.type) ? x.type : 'wall';
  const sizes = sizesFor(type);
  const btu = sizes.includes(x.btu) ? x.btu : sizes.reduce((p, c) => (Math.abs(c - x.btu) < Math.abs(p - x.btu) ? c : p), sizes[0]);
  return { ...x, type, btu, qty: Math.max(1, Math.min(200, Math.round(+x.qty || 1))), hrs: Math.max(1, Math.min(24, Math.round(+x.hrs || 8))) };
}

/** Full comparison for one kind of old unit (x.qty of them). */
export function tradeIn(input: TradeInput, data: TradeInData): TradeInResult {
  const x = clampInput(input);
  const A = AGES.find(a => a.id === x.age) ?? AGES[2];
  const I = TRADE_ISSUES.find(i => i.id === x.issue) ?? TRADE_ISSUES[0];
  const lines = repairLines(x, data.repair);
  const known = lines.reduce((n, l) => n + (l.ex ?? 0) * l.qty, 0);
  const unknown = lines.filter(l => l.ex == null).length;
  const N = newSet(x, data);
  const setEx = N.stat.med != null && N.install?.ex != null ? N.stat.med + N.install.ex : null;
  const allEx = setEx != null ? setEx + (N.outEx ?? 0) : null;
  const trade = tradeValue({ btu: x.btu, issue: x.issue });
  const net: [number, number] | null =
    allEx != null && trade ? [Math.max(0, allEx - trade.hi), Math.max(0, allEx - trade.lo)] : null;

  // electricity: the old unit (worn with age; "ไม่ทราบ" counts as fixed speed from 7 years on) vs a new Inverter unit, both clean
  const oldInv = x.sys === 'inv' || (x.sys === 'unk' && A.y < 7);
  const loss = ageLoss(A.y);
  const oldYear = electricityPerYear(x.btu, x.type, oldInv, x.hrs) / (1 - loss);
  const newYear = electricityPerYear(x.btu, x.type, true, x.hrs);
  const save = Math.max(0, oldYear - newYear);

  // rules of thumb → verdict + reasons
  const why: string[] = [];
  if (A.y >= 10) why.push(`อายุเครื่อง ${A.th} อะไหล่และน้ำยาบางชนิดหายากขึ้น ค่าซ่อมครั้งต่อไปมีแนวโน้มสูงขึ้น`);
  if (I.major) why.push('อาการนี้ต้องเปิดระบบน้ำยา (เก็บน้ำยา ทำสุญญากาศ เติมใหม่) เป็นงานซ่อมใหญ่');
  if (x.ref === 'r22') {
    const a = data.repair.refillR22;
    const b = data.repair.refillR32;
    why.push(
      `ใช้น้ำยา R22 ซึ่งทยอยเลิกใช้ ค่าเติมตามตารางราคา ${a?.ex != null ? baht(a.ex) : 'ประเมินหน้างาน'} เทียบ R32 / R410A ${b?.ex != null ? baht(b.ex) : 'ประเมินหน้างาน'} (ไม่เกิน 1 กก.)`,
    );
  }
  if (setEx != null && known >= setEx * 0.5) why.push('ค่าซ่อมที่รู้ราคาแล้วเกินครึ่งหนึ่งของเครื่องใหม่พร้อมติดตั้ง (หลักคิดเบื้องต้น)');
  if (setEx != null && A.y >= 7 && known * A.y >= setEx) why.push(`อายุ × ค่าซ่อม (${A.y} ปี × ${baht(known)}) เท่ากับหรือเกินราคาเครื่องใหม่พร้อมติดตั้ง`);
  if (A.y < 5 && I.id !== 'reno') why.push('เครื่องอายุไม่ถึง 5 ปี ตรวจใบรับประกันของผู้ผลิตก่อน อะไหล่บางชิ้นอาจยังอยู่ในประกัน');
  if (!oldInv && save > 0) why.push(`เครื่องเดิมเป็น Fixed speed ค่าไฟโดยประมาณสูงกว่าเครื่อง Inverter ใหม่ราว ${baht(Math.round(save / 100) * 100)} ต่อปีต่อเครื่อง`);

  let verdict: Verdict;
  if (I.id === 'reno') verdict = A.y >= 10 ? 'replace' : A.y >= 7 ? 'compare' : 'keep';
  else if (I.id === 'weak') verdict = A.y >= 10 ? 'compare' : 'repair';
  else if ((I.major && A.y >= 10) || (I.major && x.ref === 'r22' && A.y >= 7) || (setEx != null && known >= setEx * 0.5)) verdict = 'replace';
  else if (I.major && A.y >= 7) verdict = 'compare';
  else if (setEx != null && A.y >= 7 && known * A.y >= setEx) verdict = 'compare';
  else verdict = 'repair';

  return {
    q: x.qty,
    age: A,
    issue: I,
    repair: { lines, known, unknown },
    set: N,
    setEx,
    allEx,
    trade,
    net,
    energy: { old: oldYear, now: newYear, save, loss, oldInv, hrs: x.hrs, rate: ELECTRIC.rate },
    verdict,
    ...VERDICT_TEXT[verdict],
    why,
    special: x.qty >= VOLUME_HINT,
    eligible: A.y >= TRADE_IN.minAge || I.major,
  };
}
