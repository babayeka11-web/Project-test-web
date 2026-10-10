// Customer requests (contact form, quote, booking) — one place for the reference number, the summary text and sending.
// There is no back office yet: with NEXT_PUBLIC_FORM_ENDPOINT empty every request ends in the honest hand-off box
// (copy · LINE · phone · e-mail). When an endpoint is configured (Google Apps Script web app or a form service that accepts
// JSON), the request is POSTed first and the page says "ส่งถึงทีมแล้ว" ONLY on a 2xx answer; anything else falls back to the
// hand-off box with a plain explanation. The browser never decides prices: totals travel as "ยอดประมาณการ".
import { COMPANY, lineMessageUrl } from '@/lib/domain/company';

export type RequestKind = 'contact' | 'quote' | 'booking';
export type RequestField = readonly [label: string, value: string];
export type SendResult =
  | { status: 'sent'; ref: string }
  | { status: 'failed'; ref: string; reason: string }
  | { status: 'unconfigured'; ref: string };

export const FORM_ENDPOINT = process.env.NEXT_PUBLIC_FORM_ENDPOINT || '';
export const PDPA_NOTE = 'ข้อมูลที่กรอกใช้เพื่อติดต่อกลับเรื่องคำขอนี้เท่านั้น';
export const KIND_TH: Record<RequestKind, string> = { contact: 'ติดต่อทีม', quote: 'ขอใบเสนอราคา', booking: 'จองคิวงาน' };
const TIMEOUT_MS = 15000;

/** Reference number the customer keeps, e.g. "SBP-691009-K7Q2" (Buddhist-era yymmdd in Bangkok time + 4 random chars). */
export function makeRef(now: Date = new Date()): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(now)
      .map(x => [x.type, x.value]),
  );
  const be = String(Number(p.year) + 543).slice(-2);
  const rnd = Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, '0');
  return `SBP-${be}${p.month}${p.day}-${rnd}`;
}

/** Plain-text summary shown in the hand-off box and sent to the team. Empty values are skipped. */
export function buildSummary(kind: RequestKind, ref: string, fields: RequestField[], extra: string[] = []): string {
  const rows = fields.filter(([, v]) => v && v.trim()).map(([k, v]) => `${k}: ${v.trim()}`);
  return [`${KIND_TH[kind]} · ${COMPANY.brand}`, `เลขอ้างอิง ${ref}`, '', ...rows, ...(extra.length ? ['', ...extra] : [])].join('\n');
}

/** Links for the hand-off box (LINE with the summary typed in, e-mail with subject + body, phone). */
export function handoffLinks(kind: RequestKind, ref: string, text: string) {
  const subject = `${KIND_TH[kind]} ${ref}`;
  return {
    line: lineMessageUrl(text),
    mail: `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
    tel: COMPANY.telHref,
    subject,
  };
}

/** True when a request can be POSTed from this page. */
export const canSend = () =>
  !!FORM_ENDPOINT && (typeof navigator === 'undefined' || navigator.onLine !== false);

/** Send one request. Never throws; never reports success without a 2xx answer. */
export async function submitRequest(
  kind: RequestKind,
  ref: string,
  fields: RequestField[],
  text: string,
  opts: { endpoint?: string; fetchImpl?: typeof fetch } = {},
): Promise<SendResult> {
  const endpoint = opts.endpoint ?? FORM_ENDPOINT;
  if (!endpoint) return { status: 'unconfigured', ref };
  const doFetch = opts.fetchImpl ?? fetch;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const res = await doFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8', Accept: 'application/json' },
      body: JSON.stringify({ kind, ref, fields: Object.fromEntries(fields), text, _subject: `${KIND_TH[kind]} ${ref}` }),
      signal: ctl.signal,
    });
    if (!res.ok) return { status: 'failed', ref, reason: `ระบบรับคำขอตอบกลับไม่สำเร็จ (${res.status})` };
    return { status: 'sent', ref };
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    return { status: 'failed', ref, reason: aborted ? 'ระบบรับคำขอไม่ตอบกลับในเวลาที่กำหนด' : 'เชื่อมต่อระบบรับคำขอไม่ได้' };
  } finally {
    clearTimeout(timer);
  }
}

/** Copy text to the clipboard; falls back to a hidden textarea. Resolves true on success. */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}
