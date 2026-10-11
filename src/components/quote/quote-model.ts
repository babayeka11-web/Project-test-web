// Pure helpers for the quotation page (client-safe, no React, no Pricebook): line grouping, the honest notes under the
// totals and the plain-text summary shared by "คัดลอกสรุป", the print sheet and the request sent to the team.
// Every amount comes from the quote lines and quoteTotals() (src/lib/domain/quote.ts); every sentence about rules is built
// from the domain constants so it can never drift from the maths.
import type { IconName } from '@/components/ui';
import type { CartLine } from '@/lib/cart';
import { MIN_BILL, NOTES, VOLUME_HINT } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { lineAmount, type LineGroup, type QuoteTotals } from '@/lib/domain/quote';
import { SMALL_VISIT } from '@/lib/domain/rates';
import { TIER_TH, type Zone } from '@/lib/domain/travel';

/* ---------- groups ---------- */

export type GroupId = Exclude<LineGroup, 'survey'> | 'survey';

/** Display order and names of the line groups (customer words, not system words). */
export const GROUPS: readonly { id: GroupId; th: string; icon: IconName }[] = [
  { id: 'product', th: 'สินค้า', icon: 'ac' },
  { id: 'clean', th: 'ล้างแอร์', icon: 'clean' },
  { id: 'install', th: 'ติดตั้ง', icon: 'install' },
  { id: 'repair', th: 'ซ่อม', icon: 'repair' },
  { id: 'addon', th: 'งานเสริม', icon: 'plus' },
  { id: 'contract', th: 'สัญญาล้างรายปี', icon: 'document' },
  { id: 'survey', th: 'ขอประเมินหน้างาน', icon: 'search' },
  { id: 'rush', th: 'คิวด่วน', icon: 'clock' },
];

/** Survey requests (no standard price) are listed together, whatever service they belong to. */
export const groupOf = (l: Pick<CartLine, 'kind' | 'group' | 'unitEx'>): GroupId =>
  l.kind === 'survey' || l.group === 'survey' || l.unitEx == null ? 'survey' : l.group;

export type LineGroupView = { id: GroupId; th: string; icon: IconName; lines: CartLine[] };

export function groupLines(lines: readonly CartLine[]): LineGroupView[] {
  return GROUPS.map(g => ({ ...g, lines: lines.filter(l => groupOf(l) === g.id) })).filter(g => g.lines.length > 0);
}

/** Quantity is fixed for the rush fee (one per visit), survey requests (kept once) and annual contracts (one contract). */
export const qtyFixed = (l: Pick<CartLine, 'fixed' | 'kind' | 'group' | 'unitEx'>): boolean =>
  !!l.fixed || l.kind === 'survey' || l.unitEx == null || l.group === 'contract' || l.group === 'rush';

/** Unit text after a unit price: '/ เครื่อง' · '/ ปี' (contract) · '' when the line has no unit. */
export const unitOf = (l: Pick<CartLine, 'unit' | 'group'>): string => (l.group === 'contract' ? 'ปี' : l.unit || '');

/** The quote has one-off work that travels (anything but contract lines and survey requests). */
export const hasOneOff = (lines: readonly Pick<CartLine, 'group' | 'kind'>[]): boolean =>
  lines.some(l => l.group !== 'contract' && l.kind !== 'survey');

/** The quote has a crew job the team books a date for (cleaning or installation). */
export const hasBookableWork = (lines: readonly Pick<CartLine, 'group'>[]): boolean =>
  lines.some(l => l.group === 'clean' || l.group === 'install');

/* ---------- travel row ---------- */

export type TravelView =
  | { kind: 'fee'; label: string; amount: number }
  | { kind: 'text'; label: string; text: string; tone: 'ok' | 'muted' | 'warn'; needsArea?: boolean };

/** What the travel row of the totals says for these lines, this zone and these totals. */
export function travelView(lines: readonly Pick<CartLine, 'group' | 'kind'>[], zone: Zone | null, t: QuoteTotals): TravelView {
  if (t.travel > 0) return { kind: 'fee', label: t.travelLabel || 'ค่าเดินทาง', amount: t.travel };
  const label = 'ค่าเดินทาง';
  if (!hasOneOff(lines)) {
    return lines.some(l => l.group === 'contract')
      ? { kind: 'text', label, text: 'รวมในสัญญาแล้ว', tone: 'muted' }
      : { kind: 'text', label, text: 'ทีมแจ้งพร้อมราคา', tone: 'muted' };
  }
  if (!zone) return { kind: 'text', label, text: 'เลือกพื้นที่ก่อน', tone: 'muted', needsArea: true };
  if (zone.tier === 'core') return { kind: 'text', label, text: 'ไม่มี', tone: 'ok' };
  if (zone.tier === 'out') return { kind: 'text', label, text: 'ทีมประเมินแยก', tone: 'warn' };
  if (zone.tier === 'unknown') return { kind: 'text', label, text: 'เลือกพื้นที่จากรายการ', tone: 'warn', needsArea: true };
  return { kind: 'text', label, text: 'ไม่มี', tone: 'ok' };
}

/* ---------- notes under the totals ---------- */

export type QuoteNote = { id: string; tone: 'info' | 'warn' | 'ok'; text: string };

/** The honest notes for the current quote (reference commerce cart summary wording, built from the domain constants). */
export function quoteNotes(lines: readonly CartLine[], zone: Zone | null, t: QuoteTotals): QuoteNote[] {
  const out: QuoteNote[] = [];
  if (zone?.tier === 'out') {
    out.push({ id: 'out', tone: 'warn', text: 'พื้นที่นี้เกินระยะรับงานรายเครื่อง ส่งข้อมูลได้ ทีมจะประเมินเป็นงานโครงการ' });
  }
  if (t.surveys > 0) {
    out.push({ id: 'survey', tone: 'info', text: `${t.surveys} รายการประเมินหน้างาน ทีมแจ้งราคาก่อนเริ่มงาน` });
  }
  if (t.cleanEx > 0) {
    if (t.travelSmall && zone?.tier !== 'extended' && zone?.tier !== 'out') {
      out.push({
        id: 'min',
        tone: 'info',
        text: `งานล้างครบ ${baht(MIN_BILL)} ก่อน VAT ไม่มีค่าเดินทางในพื้นที่หลัก · ตอนนี้ ${baht(t.cleanEx)} ขาดอีก ${baht(MIN_BILL - t.cleanEx)}`,
      });
    } else if (!t.travelSmall && (!zone || zone.tier === 'core')) {
      out.push({ id: 'min', tone: 'ok', text: `งานล้างถึงขั้นต่ำ ${baht(MIN_BILL)} ก่อน VAT แล้ว ไม่มีค่าเดินทางในพื้นที่หลัก` });
    }
  }
  if (t.visitSmall) {
    out.push(
      t.visit > 0
        ? {
            id: 'visit',
            tone: 'info',
            text: `งานย่อยอย่างเดียวมียอดขั้นต่ำต่อการเข้างาน ${baht(SMALL_VISIT.minEx)} ก่อน VAT รายการที่ทำนับรวมแล้ว · ถ้าทำพร้อมงานล้าง ติดตั้ง หรือตรวจซ่อมในวันเดียวกัน ไม่มีค่าเข้างานนี้`,
          }
        : { id: 'visit', tone: 'ok', text: `รายการถึงยอดขั้นต่ำต่อการเข้างาน ${baht(SMALL_VISIT.minEx)} แล้ว ไม่มีค่าเข้างานเพิ่ม` },
    );
  }
  if (t.units >= VOLUME_HINT) out.push({ id: 'volume', tone: 'info', text: NOTES.volume });
  if (lines.some(l => l.group === 'product')) {
    out.push({ id: 'stock', tone: 'info', text: 'รายการเครื่องต้องยืนยันสต็อกก่อนสั่ง ทีมแจ้งในใบเสนอราคา' });
  }
  return out;
}

/* ---------- plain-text summary ---------- */

/** One summary row per line: '• name (detail) × 2 — ฿1,400' or '— ประเมินหน้างาน'. */
export const lineText = (l: CartLine): string => {
  const amt = lineAmount(l);
  return `• ${l.name}${l.detail ? ` (${l.detail})` : ''} × ${l.qty}${amt == null ? ` — ${NOTES.survey}` : ` — ${baht(amt)}`}`;
};

/** One quote line for the short LINE message: name and quantity, no detail or amount (the full summary has those). */
export const lineBrief = (l: Pick<CartLine, 'name' | 'qty'>): string => `${l.name}${l.qty > 1 ? ` × ${l.qty}` : ''}`;

/** The area in a few words for the LINE message: 'เขตจอมทอง' · 'อ.บางพลี จ.สมุทรปราการ' (or the typed text, cut short). */
export function areaShort(zone: Zone | null, zoneInput: string): string {
  if (zone?.district) return zone.province === 'กรุงเทพมหานคร' ? `เขต${zone.district}` : `อ.${zone.district} จ.${zone.province}`;
  const t = (zoneInput || zone?.match || '').trim();
  return t.length > 32 ? `${t.slice(0, 31)}…` : t;
}

/** Area line for the summary ('' when no area). */
export function areaText(zone: Zone | null, zoneInput: string): string {
  const where = zoneInput || zone?.match || '';
  if (!where && !zone) return '';
  const km = zone && zone.km != null ? ` (ระยะถนนประมาณ ${zone.km} กม.)` : '';
  const tier = zone ? ` · ${TIER_TH[zone.tier].th}` : '';
  return `${where || '-'}${km}${tier}`;
}

/** The quotation as text lines: every line with its amount, the area, the totals and the honest notes. */
export function quoteTextLines(lines: readonly CartLine[], zone: Zone | null, zoneInput: string, t: QuoteTotals): string[] {
  const tv = travelView(lines, zone, t);
  const area = areaText(zone, zoneInput);
  const rows = [
    'รายการ (ราคาก่อน VAT)',
    ...groupLines(lines).flatMap(g => [`[${g.th}]`, ...g.lines.map(lineText)]),
    '',
    `พื้นที่หน้างาน: ${area || 'ยังไม่ได้เลือก'}`,
    `รวมรายการ: ${baht(t.ex)}`,
    tv.kind === 'fee' ? `${tv.label}: ${baht(tv.amount)}` : `${tv.label}: ${tv.text}`,
    t.visitSmall ? `${t.visitLabel}: ${t.visit > 0 ? baht(t.visit) : 'ถึงขั้นต่ำแล้ว'}` : null,
    `ยอดก่อน VAT: ${baht(t.totalEx)}`,
    `VAT 7%: ${baht(t.vat)}`,
    `รวมทั้งสิ้น: ${baht(t.inc)} (รวม VAT)`,
    t.surveys ? `+ ${t.surveys} รายการประเมินหน้างาน ทีมแจ้งราคาก่อนเริ่มงาน` : null,
    NOTES.estimate,
  ];
  return rows.filter((r): r is string => r != null);
}

/** "คัดลอกสรุป": a heading, the date and the quotation lines. */
export function quoteSummaryText(lines: readonly CartLine[], zone: Zone | null, zoneInput: string, t: QuoteTotals, dateText: string): string {
  return ['ใบเสนอราคาเบื้องต้น · SBP AirCare', dateText ? `วันที่ ${dateText}` : null, '', ...quoteTextLines(lines, zone, zoneInput, t)]
    .filter((r): r is string => r != null)
    .join('\n');
}

/** Today in Bangkok as Thai long date: '9 ตุลาคม 2569'. Client-only (call in an effect / event, never at build time). */
export const todayTh = (now: Date = new Date()): string =>
  now.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'long', year: 'numeric' });
