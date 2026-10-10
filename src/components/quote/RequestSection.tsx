'use client';
// The request form (#request): the cleaning booking and every other flow lands here. Validates on submit (name, 9–10 digit
// phone, e-mail shape, date not in the past), focuses the first invalid field, then builds the summary with a reference
// number, sends it with submitRequest() and shows the shared HandoffBox in place of the form. Never says "sent" unless the
// endpoint answered 2xx (HandoffBox does the wording). The preferred date/slot live in the quote store (cart.pref) so a
// booking tool's choice arrives pre-filled; cart.syncRush() keeps exactly one คิวด่วน line for a date inside the rush window.
import { useEffect, useId, useMemo, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { HandoffBox } from '@/components/shared/HandoffBox';
import { Button, Card, Checkbox, Field, Fieldset, Icon, Input, Notice, Section, Select, Skeleton, Textarea } from '@/components/ui';
import { cart, useCart } from '@/lib/cart';
import { COMPANY } from '@/lib/domain/company';
import { TIME_NOTE, timeTh } from '@/lib/domain/content';
import { NOTES } from '@/lib/domain/constants';
import { bkkNow, dateHint, dateTh, judge, SLOTS, visitLinesOf, type SlotId } from '@/lib/domain/queue';
import { baht } from '@/lib/domain/format';
import { buildSummary, FORM_ENDPOINT, makeRef, PDPA_NOTE, submitRequest, type RequestField, type RequestKind, type SendResult } from '@/lib/request';
import { areaText, hasBookableWork, quoteTextLines } from './quote-model';
import { useHydrated } from './use-hydrated';

const CONDITIONS = ['ติดสูงเกิน 3 ม.', 'ไม่มีที่จอดรถ', 'ต้องขออนุญาตนิติบุคคล', 'มีสัตว์เลี้ยง'] as const;

type Key = 'name' | 'tel' | 'email' | 'date';
type Errors = Partial<Record<Key, string>>;
type Draft = { name: string; tel: string; line: string; email: string; tax: string; addr: string; note: string; conditions: string[] };
type Outcome = { kind: RequestKind; result: SendResult; text: string };

const EMPTY_DRAFT: Draft = { name: '', tel: '', line: '', email: '', tax: '', addr: '', note: '', conditions: [] };

const THAI_DIGITS = '๐๑๒๓๔๕๖๗๘๙';
/** '081-234 5678' · '+66 81 234 5678' · '๐๘๑…' → digits only, local format. */
const telDigits = (v: string) =>
  v
    .replace(/[๐-๙]/g, d => String(THAI_DIGITS.indexOf(d)))
    .replace(/[\s\-().]/g, '')
    .replace(/^\+66/, '0');
const telOk = (v: string) => /^\d{9,10}$/.test(telDigits(v));
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

const slotIdOf = (label: string): SlotId | '' => ((Object.keys(SLOTS) as SlotId[]).find(id => id === label || SLOTS[id].th === label) ?? '');

/** The error text of one field ('' = fine). */
function problem(key: Key, value: string, today: string): string {
  const v = value.trim();
  if (key === 'name') return v ? '' : 'กรอกชื่อ หรือชื่อบริษัท เพื่อให้ทีมเรียกถูก';
  if (key === 'tel') return telOk(v) ? '' : 'กรอกเบอร์ 9–10 หลัก เช่น 0812345678';
  if (key === 'email') return !v || emailOk(v) ? '' : 'อีเมลยังไม่ถูกต้อง เช่น name@example.com';
  return v && v < today ? 'วันที่ผ่านมาแล้ว เลือกวันนี้หรือวันถัดไป' : '';
}

const focusId = (key: Key) => document.getElementById(`quote-${key}`)?.focus();

export function RequestSection() {
  const hydrated = useHydrated();
  const { lines, pref } = useCart();

  // exactly one คิวด่วน line while the date is inside the rush window (and none when it is not, or the date is gone)
  useEffect(() => {
    if (hydrated) cart.syncRush(pref.date);
  }, [hydrated, pref.date, lines]);

  // arriving on /quote/#request: the page grew when the quote loaded, so scroll to the form once more
  const scrolled = useRef(false);
  useEffect(() => {
    if (!hydrated || scrolled.current || lines.length === 0) return;
    scrolled.current = true;
    if (window.location.hash === '#request') requestAnimationFrame(() => document.getElementById('request')?.scrollIntoView());
  }, [hydrated, lines.length]);

  if (hydrated && lines.length === 0) return <div id="request" aria-hidden className="scroll-mt-header print:hidden" />;

  return (
    <Section
      id="request"
      tone="soft"
      className="print:hidden"
      eyebrow="ส่งคำขอ"
      title="ส่งให้ทีมยืนยันราคาและคิว"
      lead={
        FORM_ENDPOINT
          ? 'กรอกแค่ชื่อกับเบอร์โทรก็ส่งได้ ข้อมูลอื่นช่วยให้ทีมเตรียมงานและตอบกลับได้ตรงขึ้น'
          : 'กรอกแค่ชื่อกับเบอร์โทร แล้วส่งสรุปให้ทีมทาง LINE หรือโทรแจ้ง ข้อมูลอื่นช่วยให้ทีมเตรียมงานและตอบกลับได้ตรงขึ้น'
      }
    >
      {hydrated ? (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start">
          <RequestForm />
          <HowItWorks />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_21rem]" aria-busy="true">
          <Skeleton shape="card" className="h-[44rem]" />
          <Skeleton shape="card" className="hidden h-72 lg:block" />
        </div>
      )}
    </Section>
  );
}

function HowItWorks() {
  return (
    <Card tone="surface" padding="lg" className="flex flex-col gap-5">
      <h3 className="text-h3">{FORM_ENDPOINT ? 'หลังส่งคำขอ' : 'เมื่อทีมได้รับสรุปแล้ว'}</h3>
      <ol className="flex flex-col gap-4">
        {['ทีมตรวจรายการและพื้นที่หน้างาน', 'โทรหรือทัก LINE ยืนยันราคา คิว และเวลาเข้างานในเวลาทำการ', 'ส่งใบเสนอราคาให้ยืนยัน แล้วนัดเข้างาน'].map((t, i) => (
          <li key={t} className="flex gap-3">
            <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-full bg-sky-soft text-small font-semibold text-brand">
              {i + 1}
            </span>
            <span className="text-small text-ink-2">{t}</span>
          </li>
        ))}
      </ol>
      <div className="flex flex-col gap-2 border-t border-line pt-4 text-small text-ink-2">
        <p>
          ถามก่อนได้ทางโทร <a href={COMPANY.telHref} className="font-semibold text-brand">{COMPANY.tel}</a> หรือ LINE{' '}
          <a href={COMPANY.lineUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand">
            {COMPANY.line}
          </a>
        </p>
        <p className="text-meta text-ink-3">{COMPANY.hours}</p>
      </div>
    </Card>
  );
}

/** A titled block of the form (a labelled group, with a divider above unless it is the first). */
function Group({ title, first, children }: { title: string; first?: boolean; children: ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className={`flex flex-col gap-5 ${first ? '' : 'border-t border-line pt-7'}`}>
      <h3 id={id} className="text-h3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function RequestForm() {
  const { lines, zone, zoneInput, totals, pref } = useCart();
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [round, setRound] = useState(0);
  const resultRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const now = bkkNow();
  const today = now.date;
  const visit = useMemo(() => visitLinesOf(lines), [lines]);
  const hasRush = lines.some(l => l.group === 'rush');
  const J = judge(pref.date, visit, 'C1', now);
  const hint = dateHint(pref.date, hasRush, now);
  const bookable = hasBookableWork(lines);
  const hasVisit = visit.length > 0;
  const slot = slotIdOf(pref.slot);
  const slotValue = slot && J.slots.includes(slot) ? slot : '';
  const kind: RequestKind = bookable && pref.date ? 'booking' : 'quote';

  useEffect(() => {
    if (outcome) resultRef.current?.focus();
  }, [outcome]);

  const setDate = (date: string) => {
    const slots = judge(date, visit, 'C1', bkkNow()).slots;
    const keep = slotIdOf(pref.slot);
    cart.setPref(date, keep && slots.includes(keep) ? SLOTS[keep].th : '');
    if (errors.date) setErrors(e => ({ ...e, date: problem('date', date, today) }));
  };

  const valueOf = (key: Key) => String(new FormData(formRef.current ?? undefined).get(key) ?? '');
  const check = (key: Key) => {
    const msg = problem(key, key === 'date' ? pref.date : valueOf(key), today);
    setErrors(e => ({ ...e, [key]: msg || undefined }));
  };

  // validate a field when it is left, and re-check a field that currently shows an error while it is being fixed
  const onBlur = (e: FocusEvent<HTMLFormElement>) => {
    const n = (e.target as HTMLElement).getAttribute('name');
    if (n === 'name' || n === 'tel' || n === 'email') check(n);
  };
  const onInput = (e: FormEvent<HTMLFormElement>) => {
    const n = (e.target as HTMLElement).getAttribute('name');
    if ((n === 'name' || n === 'tel' || n === 'email') && errors[n]) check(n);
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (sending) return;
    const fd = new FormData(e.currentTarget);
    if (String(fd.get('website') ?? '').trim()) return; // honeypot: a person never fills it — stop without a word
    const v = (k: string) => String(fd.get(k) ?? '').trim();

    const found: Errors = {};
    (['name', 'tel', 'email', 'date'] as const).forEach(k => {
      const msg = problem(k, k === 'date' ? cart.get().pref.date : v(k), today);
      if (msg) found[k] = msg;
    });
    setErrors(found);
    const first = (['name', 'tel', 'email', 'date'] as const).find(k => found[k]);
    if (first) return focusId(first);

    const conditions = CONDITIONS.filter(c => fd.getAll('cond').includes(c));
    setDraft({ name: v('name'), tel: v('tel'), line: v('line'), email: v('email'), tax: v('tax'), addr: v('addr'), note: v('note'), conditions: [...conditions] });

    // take the quote as it is right now, not as it was at the last render
    const st = cart.get();
    const t = cart.totals();
    const book = hasBookableWork(st.lines) && !!st.pref.date;
    const k: RequestKind = book ? 'booking' : 'quote';
    const sl = slotIdOf(st.pref.slot);
    const fields: RequestField[] = [
      ['ชื่อ / บริษัท', v('name')],
      ['โทร', telDigits(v('tel'))],
      ['LINE ID', v('line')],
      ['อีเมล', v('email')],
      ['ใบกำกับภาษีในนาม', v('tax')],
      ['ที่อยู่หน้างาน', v('addr')],
      ['วันที่สะดวก', st.pref.date ? `${dateTh(st.pref.date)} (${st.pref.date})` : ''],
      ['ช่วงเวลา', sl ? SLOTS[sl].th : ''],
      ['สภาพหน้างาน', conditions.join(' · ')],
      ['หมายเหตุ', v('note')],
    ];
    const extra = [...quoteTextLines(st.lines, st.zone, st.zoneInput, t), '', 'รูปหน้างานส่งทาง LINE ตามหลังได้ แจ้งเลขอ้างอิงนี้'];

    setSending(true);
    const ref = makeRef();
    const text = buildSummary(k, ref, fields, extra);
    const result = await submitRequest(k, ref, fields, text);
    setSending(false);
    setOutcome({ kind: k, result, text });
  };

  if (outcome) {
    return (
      <Card padding="lg" className="flex flex-col gap-5">
        <div ref={resultRef} tabIndex={-1} className="flex scroll-mt-header flex-col gap-5 outline-none">
          <h3 className="text-h3">{outcome.result.status === 'sent' ? 'ส่งคำขอแล้ว' : 'สรุปคำขอของคุณ'}</h3>
          <HandoffBox
            kind={outcome.kind}
            result={outcome.result}
            text={outcome.text}
            onReset={() => {
              setOutcome(null);
              setRound(r => r + 1);
            }}
          />
        </div>
      </Card>
    );
  }

  const area = areaText(zone, zoneInput);
  const needsArea = !zone && lines.some(l => l.group !== 'contract' && l.kind !== 'survey');
  const errorCount = Object.values(errors).filter(Boolean).length;
  const fit = J.fit;
  const fitText = fit.kind === 'half' ? 'ครึ่งวัน' : fit.kind === 'day' ? 'ทั้งวัน' : `ประมาณ ${fit.days} วันทำการ`;

  return (
    <Card padding="lg" className="min-w-0">
      <form key={round} ref={formRef} noValidate onSubmit={onSubmit} onBlur={onBlur} onInput={onInput} className="flex flex-col gap-7">
        {/* what is being sent */}
        <div className="flex flex-col gap-1 rounded-control bg-surface-2 p-4 text-small">
          <p className="text-ink">
            <b>
              {lines.length} รายการ · รวมทั้งสิ้น {baht(totals.inc)}
            </b>{' '}
            <span className="text-ink-2">รวม VAT{totals.surveys > 0 ? ` (ยังไม่รวม ${totals.surveys} รายการประเมินหน้างาน)` : ''}</span>
          </p>
          <p className="text-ink-2">
            พื้นที่: {area || 'ยังไม่ได้เลือก'}{' '}
            <a href="#quote-area" className="font-medium text-brand underline underline-offset-2">
              {area ? 'เปลี่ยน' : 'เลือกพื้นที่'}
            </a>
          </p>
          <p className="text-meta text-ink-3">{NOTES.estimate}</p>
        </div>

        {errorCount > 0 && (
          <Notice tone="bad" live="assertive" size="sm" title="ยังส่งไม่ได้">
            ตรวจ {errorCount} ช่องที่มีข้อความสีแดงด้านล่าง แล้วกดส่งอีกครั้ง
          </Notice>
        )}

        <Group title="ข้อมูลติดต่อ" first>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="ชื่อ / บริษัท" required id="quote-name" hint="ชื่อที่ให้ทีมเรียก" error={errors.name}>
              <Input name="name" autoComplete="name" defaultValue={draft.name} />
            </Field>
            <Field label="เบอร์โทร" required id="quote-tel" hint="ทีมโทรยืนยันในเวลาทำการ" error={errors.tel}>
              <Input name="tel" type="tel" inputMode="tel" autoComplete="tel" icon="phone" defaultValue={draft.tel} />
            </Field>
            <Field label="LINE ID" optional id="quote-line" hint="ให้ทีมทักไปส่งราคาและยืนยันคิว">
              <Input name="line" autoComplete="off" defaultValue={draft.line} />
            </Field>
            <Field label="อีเมล" optional id="quote-email" hint="สำหรับให้ทีมส่งใบเสนอราคา" error={errors.email}>
              <Input name="email" type="email" inputMode="email" autoComplete="email" icon="mail" defaultValue={draft.email} />
            </Field>
          </div>
        </Group>

        <Group title="วันและสถานที่">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="วันที่สะดวก" optional id="quote-date" error={errors.date}>
              <Input
                name="date"
                type="date"
                min={today}
                value={pref.date}
                onChange={e => setDate(e.target.value)}
                aria-describedby="quote-date-hint"
              />
            </Field>
            <Field label="ช่วงเวลาที่สะดวก" optional id="quote-slot">
              <Select
                name="slot"
                placeholder={pref.date ? 'ให้ทีมเสนอเวลา' : 'เลือกวันก่อน'}
                disabled={!pref.date || J.slots.length === 0}
                value={slotValue}
                onChange={e => cart.setPref(pref.date, e.target.value ? SLOTS[e.target.value as SlotId].th : '')}
              >
                {J.slots.map(id => (
                  <option key={id} value={id}>
                    {SLOTS[id].th} · {SLOTS[id].sub}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div aria-live="polite" className="-mt-1 flex flex-col gap-2">
            <p id="quote-date-hint" className={`text-small ${hint.warn ? 'font-medium text-warn' : 'text-ink-2'}`}>
              {hint.text}
            </p>
            {J.kind === 'rush' && J.late && <Notice tone="warn" size="sm">{`ช่วงที่เหลือของวันนี้อาจไม่พอ ถ้าเกินเวลาทำการ ${NOTES.outOfHours}`}</Notice>}
            {hasVisit && J.time[1] > 0 && (
              <p className="text-meta text-ink-3">
                เวลาทำงานโดยประมาณ {timeTh(J.time)} ({fitText}){J.time[2] > 0 ? ' · บางรายการทีมแจ้งเวลาหลังประเมิน' : ''} · {TIME_NOTE}
              </p>
            )}
          </div>
          <Field label="รายละเอียดที่อยู่หน้างาน" optional id="quote-addr" hint="บ้านเลขที่ หมู่บ้านหรืออาคาร ชั้น ห้อง ซอย ถนน ช่วยให้ทีมวางเส้นทางและเตรียมของ">
            <Textarea name="addr" rows={3} autoComplete="street-address" defaultValue={draft.addr} />
          </Field>
          {needsArea && (
            <Notice tone="info" size="sm">
              {/* with no area a cleaning below the minimum already carries the core-area ฿300 trip — say what the total holds */}
              {totals.travel > 0
                ? `ยังไม่ได้เลือกพื้นที่ ยอดนี้คิดค่าเดินทางแบบพื้นที่หลัก ${baht(totals.travel)} ถ้าหน้างานอยู่นอกพื้นที่หลัก ค่าเดินทางเปลี่ยนตามระยะ`
                : 'ยังไม่ได้เลือกพื้นที่ ค่าเดินทางยังไม่รวมในยอดนี้ ทีมแจ้งพร้อมราคา'}
            </Notice>
          )}
          <Fieldset legend="สภาพหน้างาน" hint="เลือกที่ตรงกับหน้างาน ทีมจะเตรียมอุปกรณ์และแจ้งค่าใช้จ่ายเพิ่ม (ถ้ามี) ก่อนเข้างาน">
            <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
              {CONDITIONS.map(c => (
                <Checkbox key={c} name="cond" value={c} label={c} defaultChecked={draft.conditions.includes(c)} />
              ))}
            </div>
          </Fieldset>
        </Group>

        <Group title="รายละเอียดเพิ่มเติม">
          <Field label="ใบกำกับภาษีในนาม" optional id="quote-tax" hint="ชื่อบริษัทหรือชื่อผู้เสียภาษี พร้อมเลขประจำตัวผู้เสียภาษี ถ้าต้องการใบกำกับภาษีเต็มรูป">
            <Input name="tax" autoComplete="organization" icon="building" defaultValue={draft.tax} />
          </Field>
          <Field label="หมายเหตุ" optional id="quote-note" hint="เช่น ช่วงเวลาที่เข้าหน้างานได้ ชั้นของเครื่อง อาการที่พบ">
            <Textarea name="note" rows={3} defaultValue={draft.note} />
          </Field>
          <Notice tone="info" size="sm" icon="camera">
            ส่งรูปหน้างานทาง LINE ได้หลังส่งคำขอ ช่วยให้ทีมประเมินได้เร็วขึ้น
          </Notice>
        </Group>

        {/* honeypot: hidden from people and assistive tech, bots fill it */}
        <div aria-hidden inert className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            เว็บไซต์ (ปล่อยว่าง)
            <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-7">
          <Button type="submit" size="lg" icon="send" loading={sending} fullWidth className="sm:w-auto sm:self-start">
            {sending ? 'กำลังส่ง…' : kind === 'booking' ? 'ส่งคำขอจองคิว' : 'ส่งคำขอใบเสนอราคา'}
          </Button>
          <p className="flex items-start gap-2 text-meta text-ink-3">
            <Icon name="shield" size={16} className="mt-[0.25em] shrink-0" />
            <span>{PDPA_NOTE}</span>
          </p>
        </div>
      </form>
    </Card>
  );
}
