// Trade-in value of an old air-con (client-safe). Port of TRADE_IN / ISSUES / tradeValue in the reference tradein.js (Rev.24.1).
// Values are the Bangkok 2569 market ranges for old units by size and condition, shown as a range per unit and confirmed
// when the team inspects the unit. Fixed baht per unit (never a %); the value is deducted from a quotation for a new unit
// with installation, never paid in cash. The repair-vs-replace comparison of the reference is not ported.

export const TRADE_IN = {
  minAge: 7,
  minBtu: 9000,
  table: [
    { max: 12000, th: 'ไม่เกิน 12,000 BTU', ok: [900, 1300], bad: [300, 700] },
    { max: 24000, th: '12,001–24,000 BTU', ok: [1400, 2200], bad: [500, 1200] },
    { max: Infinity, th: '24,001 BTU ขึ้นไป', ok: [2400, 3500], bad: [800, 1800] },
  ] as readonly { max: number; th: string; ok: readonly [number, number]; bad: readonly [number, number] }[],
  terms: [
    'รับเครื่องเดิมทุกยี่ห้อ ไม่ว่าซื้อจากที่ไหน ใช้งานได้หรือเสียแล้ว ขนาด 9,000 BTU ขึ้นไป',
    'ต้องมีครบทั้งคอยล์เย็นและคอยล์ร้อน พร้อมหน้ากากและฝาครอบ',
    'ทีมช่างเก็บน้ำยาและรื้อเครื่องเดิมเอง ในวันติดตั้งเครื่องใหม่',
    'มูลค่าเทิร์นหักจากใบเสนอราคาเครื่องใหม่พร้อมติดตั้งของบริษัท ไม่จ่ายเป็นเงินสด',
    'มูลค่าจริงยืนยันเมื่อทีมตรวจเครื่อง ตามขนาด อายุ และสภาพ · ส่งมอบแล้วขอคืนไม่ได้',
  ] as readonly string[],
} as const;

export type TradeIssueId = 'reno' | 'comp' | 'leak' | 'coilOut' | 'coilIn' | 'board' | 'fanIn' | 'fanOut' | 'weak';
/** Problems of the old unit; major = the fault class where technicians weigh replacing an old unit. */
export const TRADE_ISSUES: readonly { id: TradeIssueId; th: string; major: boolean }[] = [
  { id: 'reno', th: 'ยังใช้ได้ แต่จะรีโนเวท / อยากเปลี่ยนให้ทันสมัย', major: false },
  { id: 'comp', th: 'คอมเพรสเซอร์เสีย / ไม่ติด / ตัดบ่อย', major: true },
  { id: 'leak', th: 'น้ำยารั่ว ต้องเติมบ่อย', major: true },
  { id: 'coilOut', th: 'แผงคอยล์ร้อนผุ / รั่ว', major: true },
  { id: 'coilIn', th: 'แผงคอยล์เย็นรั่ว', major: true },
  { id: 'board', th: 'บอร์ดควบคุมเสีย', major: false },
  { id: 'fanIn', th: 'มอเตอร์พัดลมคอยล์เย็นเสีย', major: false },
  { id: 'fanOut', th: 'มอเตอร์พัดลมคอยล์ร้อนเสีย', major: false },
  { id: 'weak', th: 'ไม่ค่อยเย็น ค่าไฟสูง ยังไม่รู้สาเหตุ', major: false },
];

/** The problems after which the old unit still runs (working condition). */
const WORKING: ReadonlySet<string> = new Set(['reno', 'weak']);

/** Trade-in value range per unit, or null when the unit does not qualify (smaller than 9,000 BTU). */
export function tradeValue(x: { btu: number; issue: string }): { lo: number; hi: number; working: boolean; band: string } | null {
  if (!(x.btu >= TRADE_IN.minBtu)) return null;
  const b = TRADE_IN.table.find(r => x.btu <= r.max) ?? TRADE_IN.table[TRADE_IN.table.length - 1];
  const ok = WORKING.has(x.issue);
  const r = ok ? b.ok : b.bad;
  return { lo: r[0], hi: r[1], working: ok, band: b.th };
}
