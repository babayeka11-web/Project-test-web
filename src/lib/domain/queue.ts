// Booking queue rules (client-safe, no network). Port of the reference queue.js (Rev.15, owner 2 ต.ค. 2569).
//   · normal booking: the visit date is at least LEAD_DAYS after today (Bangkok time); a Sunday moves to Monday
//   · คิวด่วน: any earlier date, today included — +RUSH_FEE_EX per visit (before VAT) and only when a crew is free; the team
//     confirms first, with no free crew there is no rush fee and the nearest free date is offered
//   · visit time = Σ units × JOB_TIME → which slot fits (half day / whole day / several days), same-day limits
//   · there is no live queue (QUEUE_URL is empty) → never show a slot as free: say QUEUE_CONFIRM_TH ('ทีมยืนยันคิว')
// Every function takes `now` (BkkNow) so pages and tests can inject the clock; the default is the real Bangkok time.
import { COMPANY } from './company';
import { QUEUE_RULES } from './constants';
import { baht } from './format';
import type { QuoteLine } from './quote';
import { JOB_TIME, type JobLevel } from './content';
import { TYPE_BY_CODE, type AcTypeCode, type AcTypeId } from './types';

export const LEAD_DAYS = QUEUE_RULES.leadDays;
export const RUSH_FEE_EX = QUEUE_RULES.rushFeeEx;
/** No live queue on this site: availability is always confirmed by the team. */
export const QUEUE_URL = '';
export const QUEUE_CONFIRM_TH = 'ทีมยืนยันคิว';

const toMin = (s: string) => {
  const [a, b] = s.split(':').map(Number);
  return a * 60 + b;
};
/** Working day in minutes since midnight: 08:30–17:30 → 510 / 1050 / 540. */
export const DAY_FROM = toMin(COMPANY.open.from);
export const DAY_TO = toMin(COMPANY.open.to);
export const DAY_MIN = DAY_TO - DAY_FROM;

export type SlotId = 'am' | 'pm' | 'day';
export const SLOTS: Readonly<Record<SlotId, { th: string; sub: string }>> = {
  am: { th: 'ช่วงเช้า', sub: `เริ่ม ${COMPANY.open.from} น.` },
  pm: { th: 'ช่วงบ่าย', sub: 'เริ่มหลังเที่ยง' },
  day: { th: 'ทั้งวัน', sub: `${COMPANY.open.from}–${COMPANY.open.to} น.` },
};

/** Bangkok date (YYYY-MM-DD) and minutes since midnight. */
export type BkkNow = { date: string; min: number };

/** Today's date and minutes since midnight in Bangkok, whatever the visitor's own time zone. */
export function bkkNow(now: Date = new Date()): BkkNow {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map(x => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, min: +p.hour * 60 + +p.minute };
}

export const addDays = (iso: string, n: number): string => {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
/** 0 = Sunday */
export const dow = (iso: string): number => new Date(iso + 'T12:00:00Z').getUTCDay();
export const isOpen = (iso: string): boolean => (COMPANY.open.days as readonly number[]).includes(dow(iso));
const nextOpen = (iso: string): string => {
  let d = iso;
  for (let i = 0; i < 7 && !isOpen(d); i++) d = addDays(d, 1);
  return d;
};
/** 'พฤ. 9 ต.ค.' */
export const dateTh = (iso: string): string =>
  new Date(iso + 'T12:00:00Z').toLocaleDateString('th-TH', { timeZone: 'UTC', weekday: 'short', day: 'numeric', month: 'short' });

/** First date a normal (non-rush) booking can take. */
export const earliestNormal = (now: BkkNow = bkkNow()): string => nextOpen(addDays(now.date, LEAD_DAYS));

/** One kind of work on the visit: type, level and units. unknown = no published time (counted apart, never as a wall C1). */
export type VisitLine = { t: AcTypeId | null; level?: JobLevel | 'repair'; qty: number; unknown?: boolean };
/** [min, max, unknownUnits] minutes for one crew. */
export type VisitTime = [number, number, number];

/** On-site time of one crew for the lines. */
export function visitTime(lines: readonly VisitLine[], level: JobLevel | 'repair' = 'C1'): VisitTime {
  return lines.reduce<VisitTime>(([a, b, u], l) => {
    const T = (JOB_TIME as Partial<Record<string, Partial<Record<AcTypeId, readonly [number, number]>>>>)[l.level || level];
    const r = T && l.t ? T[l.t] : null;
    if (!T) return [a, b, u];
    if (!r || l.unknown) return [a, b, u + l.qty];
    return [a + r[0] * l.qty, b + r[1] * l.qty, u];
  }, [0, 0, 0]);
}

export type Fit = { kind: 'half' | 'day' | 'days'; days: number; unknown?: boolean };
/** How the visit fits the working day: a morning or an afternoon, a whole day, or several working days. */
export function fitOf([, max]: readonly number[]): Fit {
  if (max <= 0) return { kind: 'half', days: 0.5, unknown: true };
  if (max <= DAY_MIN / 2) return { kind: 'half', days: 0.5 };
  if (max <= DAY_MIN) return { kind: 'day', days: 1 };
  return { kind: 'days', days: Math.ceil(max / DAY_MIN) };
}

export type Judgement = {
  kind: 'none' | 'past' | 'rush' | 'normal';
  rush: boolean;
  /** the company is closed that day (Sunday) → out-of-hours work, extra charge stated in the quotation */
  closed?: boolean;
  sameDay?: boolean;
  /** today's remaining working time is shorter than the visit */
  late?: boolean;
  earliest: string;
  slots: SlotId[];
  fit: Fit;
  time: VisitTime;
};

/** Everything a booking form needs to say about a date ('' = not chosen). */
export function judge(date: string | null | undefined, lines: readonly VisitLine[], level: JobLevel | 'repair' = 'C1', now: BkkNow = bkkNow()): Judgement {
  const time = visitTime(lines, level);
  const fit = fitOf(time);
  const earliest = earliestNormal(now);
  const base = { earliest, time, fit };
  if (!date) return { ...base, kind: 'none', rush: false, slots: [] };
  if (date < now.date) return { ...base, kind: 'past', rush: false, slots: [] };
  const rush = date < earliest;
  const closed = !isOpen(date);
  const sameDay = date === now.date;
  let slots: SlotId[] = fit.kind === 'half' ? ['am', 'pm'] : ['day'];
  // same day: a slot that already started is gone; a visit that cannot end by closing time runs into out-of-hours work
  let late = false;
  if (sameDay) {
    const left = DAY_TO - Math.max(now.min, DAY_FROM);
    if (now.min >= 12 * 60) slots = slots.filter(s => s !== 'am' && s !== 'day');
    if (left < time[0] || !slots.length) late = true;
  }
  return { ...base, kind: rush ? 'rush' : 'normal', rush, closed, sameDay, late, slots };
}

/** One-line hint under a date field (reference commerce.dateHint wording). */
export function dateHint(date: string, hasRush: boolean, now: BkkNow = bkkNow()): { text: string; warn: boolean } {
  const J = judge(date, [], 'C1', now);
  const fee = baht(RUSH_FEE_EX);
  const txt = !date
    ? `จองปกติล่วงหน้า ${LEAD_DAYS} วัน (เร็วสุด ${dateTh(J.earliest)}) · เร็วกว่านั้นเป็นคิวด่วน +${fee} ก่อน VAT ต้องมีคิวว่าง`
    : J.kind === 'past'
      ? 'วันที่ผ่านมาแล้ว เลือกวันนี้หรือวันถัดไป'
      : J.rush
        ? hasRush
          ? `คิวด่วน +${fee} อยู่ในรายการแล้ว · ทีมยืนยันคิวก่อน ถ้าไม่มีคิวไม่เก็บค่านี้`
          : `วันนี้อยู่ในช่วงคิวด่วน (+${fee} ก่อน VAT ต่อการเข้างาน ถ้ามีคิวว่าง) ทีมยืนยันกับคุณก่อน`
        : 'จองปกติ · ทีมยืนยันคิวและเวลาเข้างาน';
  return { text: txt + (J.closed ? ' · วันอาทิตย์เป็นงานนอกเวลา มีค่าใช้จ่ายเพิ่มเติม' : ''), warn: J.rush || J.kind === 'past' };
}

const CLEAN_KEY = /^(?:QC|CL|C)-.+-(C1|C2)-(wall|ceiling|cassette|floor|duct)-/;
const INSTALL_KEY = /^I[NV]?-INS-(W|C|K|FS)-(\d+)-(\d+)/;

/** What the crew does on the visit, read from quotation lines (port of the reference commerce.visitLines + ticket.jobsIn):
 *  typed cleaning lines by their key · other priced cleaning lines (AHU …) = unknown time, cleaning add-ons (kind 'addon',
 *  see cleanExtraLine) are not units · installation per type · install survey requests = unknown time · repair = a half-day
 *  slot without a time estimate. */
export function visitLinesOf(lines: readonly Pick<QuoteLine, 'key' | 'group' | 'kind' | 'unitEx' | 'qty'>[]): VisitLine[] {
  const out: VisitLine[] = [];
  lines.forEach(i => {
    if (i.group !== 'clean' || i.unitEx == null) return;
    const m = CLEAN_KEY.exec(i.key || '');
    if (m) out.push({ t: m[2] as AcTypeId, level: m[1] as JobLevel, qty: i.qty });
    else if (i.kind !== 'addon') out.push({ t: null, level: 'C1', qty: i.qty, unknown: true });
  });
  const inst = lines.filter(i => i.group === 'install');
  inst.forEach(i => {
    const m = INSTALL_KEY.exec(i.key || '');
    if (m) out.push({ t: TYPE_BY_CODE[m[1] as AcTypeCode].id, level: 'install', qty: i.qty });
  });
  const surveys = inst.filter(i => i.kind === 'survey').length;
  if (surveys) out.push({ t: null, level: 'install', qty: surveys, unknown: true });
  const repair = lines.filter(i => i.group === 'repair').reduce((n, i) => n + (i.unitEx == null ? 1 : i.qty), 0);
  if (repair) out.push({ t: 'wall', level: 'repair', qty: repair });
  return out;
}
