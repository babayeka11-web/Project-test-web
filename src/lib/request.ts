// Customer requests (contact form, quote, booking) — one place for the reference number, the summary text and sending.
// With NEXT_PUBLIC_FORM_ENDPOINT empty every request ends in the honest hand-off box (copy · LINE · phone · e-mail).
// When an endpoint is configured — the company's Google Apps Script web app (backend/google-apps-script/Code.gs, set up
// with backend/README.md) or a form service that accepts JSON — the request is POSTed first and the page says
// "ส่งถึงทีมแล้ว" ONLY when the answer is 2xx AND the body does not say {ok:false} (Apps Script cannot send error status
// codes, so it answers 200 with {ok:false, error}); an Apps Script endpoint must answer {ok:true} naming this request's ref.
// Anything else falls back to the hand-off box with a plain explanation. The browser never decides prices: totals travel as "ยอดประมาณการ".
// LINE gets a short message (lineText): a long summary does not fit a LINE link, so the full text goes by copy and e-mail
// and the LINE message points to the reference number.
import type { KeyboardEvent } from 'react';
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
/** A Google Apps Script web app (or the googleusercontent host its answer comes from after the redirect); http too, and
 *  any letter case, so a URL pasted a little differently still gets the strict reading. */
const APPS_SCRIPT_URL = /^https?:\/\/script\.google(?:usercontent)?\.com\//i;
const REJECTED = 'ระบบรับคำขอไม่รับคำขอนี้';
const UNREADABLE = 'ระบบรับคำขอตอบกลับในรูปแบบที่อ่านไม่ได้';

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

/** What the short LINE message says about a request (every value already in the customer's words). */
export type LineBrief = {
  name: string;
  tel: string;
  /** preferred date and slot, e.g. 'พฤ. 15 ต.ค. · ช่วงเช้า' */
  when?: string;
  /** area in a few words */
  area?: string;
  /** one short text per quote line, in quote order */
  items?: readonly string[];
  /** grand total including VAT, already formatted ('฿12,840') */
  total?: string;
};

const LINE_ITEMS = 5;
/** Longest LINE message as encoded in the link — a Thai letter takes 9 characters there, the link itself adds 45, so the
 *  whole link stays under 1,500. A long link can fail to open the chat with the text typed in: items are listed while
 *  they fit. */
export const LINE_MAX = 1450;
const LINE_END = 'รายละเอียดครบ แจ้งเลขอ้างอิงนี้ได้';

/** The compact LINE message: reference, contact, date, area, item count with the total, up to five items (as many as fit
 *  in LINE_MAX) plus 'อีก N รายการ', and a last line pointing to the reference. Copy and e-mail keep the full summary. */
export function lineText(kind: RequestKind, ref: string, b: LineBrief): string {
  const items = b.items ?? [];
  const total = b.total ? `รวม VAT ${b.total}` : '';
  const head = [
    `${KIND_TH[kind]} ${ref}`,
    `${b.name} · ${b.tel}`,
    b.when ?? '',
    b.area ?? '',
    items.length ? [`${items.length} รายการ`, total].filter(Boolean).join(' · ') : total,
  ].filter(Boolean);
  const build = (shown: readonly string[]) => {
    const more = items.length - shown.length;
    return [...head, ...shown.map(t => `- ${t}`), ...(more > 0 ? [`อีก ${more} รายการ`] : []), LINE_END].join('\n');
  };
  const shown: string[] = [];
  for (const t of items.slice(0, LINE_ITEMS)) {
    if (encodeURIComponent(build([...shown, t])).length > LINE_MAX) break;
    shown.push(t);
  }
  return build(shown);
}

/** Links for the hand-off box: LINE with a message typed in (`line`, the short lineText when given, else the summary),
 *  e-mail with subject + the full summary, phone. */
export function handoffLinks(kind: RequestKind, ref: string, text: string, line: string = text) {
  const subject = `${KIND_TH[kind]} ${ref}`;
  return {
    line: lineMessageUrl(line),
    mail: `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`,
    tel: COMPANY.telHref,
    subject,
  };
}

/** True when a request can be POSTed from this page. */
export const canSend = () =>
  !!FORM_ENDPOINT && (typeof navigator === 'undefined' || navigator.onLine !== false);

/** Send one request. Never throws; never reports success without a 2xx answer that does not say {ok:false}.
 *  fetch follows redirects (the default, needed: Apps Script answers a POST with a 302 to the page holding the answer)
 *  and sends no cookies to the other origin (Google answers with Access-Control-Allow-Origin: *). */
export async function submitRequest(
  kind: RequestKind,
  ref: string,
  fields: RequestField[],
  text: string,
  opts: { endpoint?: string; fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<SendResult> {
  // a repository variable pasted with a space or line break still works in fetch; trim so the Apps Script check sees it
  const endpoint = (opts.endpoint ?? FORM_ENDPOINT).trim();
  if (!endpoint) return { status: 'unconfigured', ref };
  const doFetch = opts.fetchImpl ?? fetch;
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  try {
    const res = await doFetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8', Accept: 'application/json' },
      body: JSON.stringify({ kind, ref, fields: Object.fromEntries(fields), text, _subject: `${KIND_TH[kind]} ${ref}` }),
      signal: ctl.signal,
    });
    if (!res.ok) return { status: 'failed', ref, reason: `ระบบรับคำขอตอบกลับไม่สำเร็จ (${res.status})` };
    // the body is read under the same timeout; a body that cannot be read is not proof of delivery
    return answerOf(await res.text(), ref, APPS_SCRIPT_URL.test(endpoint) || APPS_SCRIPT_URL.test(res.url));
  } catch (e) {
    const aborted = e instanceof DOMException && e.name === 'AbortError';
    return { status: 'failed', ref, reason: aborted ? 'ระบบรับคำขอไม่ตอบกลับในเวลาที่กำหนด' : 'เชื่อมต่อระบบรับคำขอไม่ได้' };
  } finally {
    clearTimeout(timer);
  }
}

/** Read a 2xx answer. JSON {ok:false, error} → failed with the endpoint's (Thai) message; JSON {ok:true} → sent.
 *  Other 2xx answers (other form services: '{}', 'OK', an HTML thank-you page) → sent, except from Apps Script
 *  (`strict`, the endpoint or the final URL is Google's): there only {ok:true, ref: <this ref>} is proof, the answer
 *  doPost gives after saving the row. Not a send: a Google sign-in or error page, or the doGet health check
 *  ({ok:true} without a ref), which answers when a redirect before Google turned the POST into a GET (http://, a short link). */
function answerOf(body: string, ref: string, strict: boolean): SendResult {
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    data = undefined;
  }
  const ok = data !== null && typeof data === 'object' ? (data as { ok?: unknown }).ok : undefined;
  if (ok === false) {
    const msg = (data as { error?: unknown }).error;
    return { status: 'failed', ref, reason: typeof msg === 'string' && msg.trim() ? msg.trim().slice(0, 200) : REJECTED };
  }
  if (strict && (ok !== true || (data as { ref?: unknown }).ref !== ref)) return { status: 'failed', ref, reason: UNREADABLE };
  return { status: 'sent', ref };
}

/** Form onKeyDown: Enter in an input marked enterKeyHint="next" moves to the next visible field instead of submitting the
 *  form, so the keyboard's "next" key does what it says (an input without the hint keeps Enter = submit). */
export function enterToNext(e: KeyboardEvent<HTMLFormElement>): void {
  const t = e.target;
  if (e.key !== 'Enter' || e.nativeEvent.isComposing || !(t instanceof HTMLInputElement) || t.getAttribute('enterkeyhint') !== 'next') return;
  const fields = Array.from(e.currentTarget.elements).filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement &&
      el.matches('input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not(:disabled), select:not(:disabled), textarea') &&
      el.tabIndex >= 0 &&
      !el.closest('[inert], [aria-hidden="true"]') &&
      el.getClientRects().length > 0, // inside a closed <details> → not rendered → skipped
  );
  const next = fields[fields.indexOf(t) + 1];
  if (!next) return;
  e.preventDefault();
  next.focus();
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
