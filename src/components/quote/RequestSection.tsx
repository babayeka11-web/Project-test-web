'use client';
// The request form (#request): the cleaning booking and every other flow lands here. It keeps the promise of the lead —
// name and phone, then the action: the summary of what is sent, the contact fields (plus the date when the work needs one
// and none is chosen yet), the submit button, and everything else folded in a native <details> that stays mounted so
// FormData still reads it. Validates on submit (name, 9–10 digit phone, e-mail shape, date not in the past), opens the
// details when the first invalid field is inside and focuses it, then builds the summary with a reference number, sends it
// with submitRequest() and shows the shared HandoffBox in place of the form. Never says "sent" unless the endpoint
// answered 2xx (HandoffBox does the wording); with no endpoint the button says what it does ("สร้างสรุป…"). The preferred
// date/slot live in the quote store (cart.pref) so a booking tool's choice arrives pre-filled; cart.syncRush() keeps
// exactly one คิวด่วน line for a date inside the rush window.
import { useEffect, useId, useMemo, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { HandoffBox } from '@/components/shared/HandoffBox';
import { Button, Card, Checkbox, Field, Fieldset, Icon, Input, Notice, Section, Select, Skeleton, Textarea } from '@/components/ui';
import { cart, useCart } from '@/lib/cart';
import { COMPANY } from '@/lib/domain/company';
import { TIME_NOTE, timeTh } from '@/lib/domain/content';
import { NOTES } from '@/lib/domain/constants';
import { bkkNow, dateHint, dateTh, judge, SLOTS, visitLinesOf, type SlotId } from '@/lib/domain/queue';
import { baht } from '@/lib/domain/format';
import {
  buildSummary,
  enterToNext,
  FORM_ENDPOINT,
  lineText,
  makeRef,
  PDPA_NOTE,
  submitRequest,
  type RequestField,
  type RequestKind,
  type SendResult,
} from '@/lib/request';
import { areaShort, areaText, groupLines, hasBookableWork, lineBrief, quoteTextLines } from './quote-model';
import { useHydrated } from './use-hydrated';

const CONDITIONS = ['ติดสูงเกิน 3 ม.', 'ไม่มีที่จอดรถ', 'ต้องขออนุญาตนิติบุคคล', 'มีสัตว์เลี้ยง'] as const;
/** Annual contracts: what the team needs to know about the site and the buyer's process instead. */
const CONTRACT_CONDITIONS = [
  'หลายอาคาร / หลายสาขา',
  'ต้องขออนุญาตนิติบุคคล',
  'เข้างานได้นอกเวลาทำการเท่านั้น (มีค่าใช้จ่ายเพิ่มเติม)',
  'ต้องการเอกสารผู้ขายสำหรับจัดซื้อ',
] as const;

type Key = 'name' | 'tel' | 'email' | 'date';
type Errors = Partial<Record<Key, string>>;
type Draft = { name: string; tel: string; line: string; email: string; tax: string; addr: string; note: string; conditions: string[] };
type Outcome = { kind: RequestKind; result: SendResult; text: string; line: string };

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

/** Focus a field by key; a field inside the closed "เพิ่มรายละเอียด" is shown first (a closed <details> renders nothing). */
const focusId = (key: Key) => {
  const el = document.getElementById(`quote-${key}`);
  const fold = el?.closest('details');
  if (fold && !fold.open) fold.open = true;
  el?.focus();
};

const CONTACT_ID = 'quote-contact';

/** Land on the contact fields: the group at the top of the view (under the header) and the cursor in the name field. */
const focusContact = () => {
  document.getElementById(CONTACT_ID)?.scrollIntoView({ block: 'start', behavior: 'instant' });
  document.getElementById('quote-name')?.focus({ preventScroll: true });
};

export function RequestSection() {
  const hydrated = useHydrated();
  const { lines, pref } = useCart();

  // exactly one คิวด่วน line while the date is inside the rush window (and none when it is not, or the date is gone)
  useEffect(() => {
    if (hydrated) cart.syncRush(pref.date);
  }, [hydrated, pref.date, lines]);

  // arriving on /quote/#request (quick booking, repair checker): the page grew when the quote loaded, so land on the
  // contact fields once the form is there, with the cursor in the name field
  const landed = useRef(false);
  useEffect(() => {
    if (!hydrated || landed.current || lines.length === 0) return;
    landed.current = true;
    if (window.location.hash === '#request') requestAnimationFrame(focusContact);
  }, [hydrated, lines.length]);

  if (hydrated && lines.length === 0) return <div id="request" aria-hidden className="scroll-mt-header print:hidden" />;

  return (
    <Section
      id="request"
      tone="soft"
      className="print:hidden"
      title="ส่งให้ทีมยืนยันราคาและคิว"
      lead={
        FORM_ENDPOINT ? 'กรอกแค่ชื่อกับเบอร์โทรก็ส่งได้ รายละเอียดอื่นเพิ่มทีหลังได้' : 'กรอกแค่ชื่อกับเบอร์โทร แล้วส่งสรุปให้ทีมทาง LINE หรือโทรแจ้ง'
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
function Group({ id, title, first, children }: { id?: string; title: string; first?: boolean; children: ReactNode }) {
  const titleId = useId();
  return (
    <div id={id} role="group" aria-labelledby={titleId} className={`flex flex-col gap-5 ${first ? '' : 'border-t border-line pt-7'}`}>
      <h3 id={titleId} className="text-h3">
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
  const resultRef = useRef<HTMLHeadingElement>(null);
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
  const contract = lines.some(l => l.group === 'contract');
  const repair = lines.some(l => l.group === 'repair');
  const conditions: readonly string[] = contract ? CONTRACT_CONDITIONS : CONDITIONS;

  // Where the date field sits is decided once per form, not on every change (picking a date must not move the field
  // away): no date yet and the work needs a visit date (repair, the survey of a contract) → next to name and phone;
  // otherwise it is folded in "เพิ่มรายละเอียด" and the chosen date shows in the summary box with "เปลี่ยน".
  const dateUpFor = (ls: readonly { group: string }[], date: string) => !date && ls.some(l => l.group === 'repair' || l.group === 'contract');
  const [dateUp, setDateUp] = useState(() => dateUpFor(lines, pref.date));
  const [foldOpen, setFoldOpen] = useState(false);
  // the last field of the quick path sends the form (Enter in it submits); the ones before it move to the next field
  const last = contract ? 'tax' : dateUp ? 'date' : 'tel';

  useEffect(() => {
    if (!outcome) return;
    resultRef.current?.scrollIntoView({ block: 'start' });
    resultRef.current?.focus({ preventScroll: true });
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

    const picked = conditions.filter(c => fd.getAll('cond').includes(c));
    setDraft({ name: v('name'), tel: v('tel'), line: v('line'), email: v('email'), tax: v('tax'), addr: v('addr'), note: v('note'), conditions: picked });

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
      ['สภาพหน้างาน', picked.join(' · ')],
      ['หมายเหตุ', v('note')],
    ];
    const extra = [...quoteTextLines(st.lines, st.zone, st.zoneInput, t), '', 'รูปหน้างานส่งทาง LINE ตามหลังได้ แจ้งเลขอ้างอิงนี้'];

    setSending(true);
    const ref = makeRef();
    const text = buildSummary(k, ref, fields, extra);
    // LINE gets the short version (a long summary does not fit a LINE link); copy and e-mail carry the full text
    const line = lineText(k, ref, {
      name: v('name'),
      tel: telDigits(v('tel')),
      when: st.pref.date ? `${dateTh(st.pref.date)}${sl ? ` · ${SLOTS[sl].th}` : ''}` : '',
      area: areaShort(st.zone, st.zoneInput),
      items: groupLines(st.lines).flatMap(g => g.lines.map(lineBrief)),
      total: t.totalEx > 0 ? baht(t.inc) : undefined,
    });
    const result = await submitRequest(k, ref, fields, text);
    setSending(false);
    setOutcome({ kind: k, result, text, line });
  };

  if (outcome) {
    return (
      <Card padding="lg">
        <HandoffBox
          kind={outcome.kind}
          result={outcome.result}
          text={outcome.text}
          lineText={outcome.line}
          titleRef={resultRef}
          onReset={() => {
            const st = cart.get();
            setOutcome(null);
            setRound(r => r + 1);
            setDateUp(dateUpFor(st.lines, st.pref.date));
            // a new request keeps what was typed (defaultValue = draft): show the folded part when it holds something
            setFoldOpen(!!(draft.line || draft.email || draft.addr || draft.note || draft.conditions.length || (draft.tax && !contract)));
            requestAnimationFrame(focusContact);
          }}
        />
      </Card>
    );
  }

  const area = areaText(zone, zoneInput);
  const needsArea = !zone && lines.some(l => l.group !== 'contract' && l.kind !== 'survey');
  const errorCount = Object.values(errors).filter(Boolean).length;
  const fit = J.fit;
  const fitText = fit.kind === 'half' ? 'ครึ่งวัน' : fit.kind === 'day' ? 'ทั้งวัน' : `ประมาณ ${fit.days} วันทำการ`;
  const dateLabel = contract ? 'วันที่สะดวกให้ทีมสำรวจหน้างาน' : repair ? 'วันที่สะดวกให้ช่างเข้า' : 'วันที่สะดวก';
  const foldList = ['LINE ID', 'อีเมล', !dateUp && !pref.date ? 'วันเวลา' : '', 'ที่อยู่', 'สภาพหน้างาน', contract ? '' : 'ใบกำกับภาษี'].filter(Boolean);

  const taxField = (
    <Field label="ใบกำกับภาษีในนาม" optional id="quote-tax" hint="ชื่อบริษัทหรือชื่อผู้เสียภาษี พร้อมเลขประจำตัวผู้เสียภาษี ถ้าต้องการใบกำกับภาษีเต็มรูป">
      <Input name="tax" autoComplete="organization" icon="building" enterKeyHint={last === 'tax' ? 'send' : undefined} defaultValue={draft.tax} />
    </Field>
  );

  const dateFields = (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label={dateLabel} optional id="quote-date" error={errors.date}>
          <Input
            name="date"
            type="date"
            min={today}
            value={pref.date}
            onChange={e => setDate(e.target.value)}
            aria-describedby="quote-date-hint"
            enterKeyHint={last === 'date' ? 'send' : undefined}
          />
        </Field>
        {/* next to name and phone the slot shows once there is a date, so the quick path stays short */}
        {(pref.date || !dateUp) && (
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
        )}
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
    </>
  );

  return (
    <Card padding="lg" className="min-w-0">
      <form
        key={round}
        ref={formRef}
        noValidate
        onSubmit={onSubmit}
        onBlur={onBlur}
        onInput={onInput}
        onKeyDown={enterToNext}
        className="flex flex-col gap-7"
      >
        {/* (1) what is being sent */}
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
          {pref.date && !dateUp && (
            <>
              <div className="flex flex-wrap items-center gap-x-1">
                <p className="text-ink-2">
                  {dateLabel}{' '}
                  <span className="font-semibold text-ink">
                    {dateTh(pref.date)} · {slotValue ? SLOTS[slotValue].th : 'ให้ทีมเสนอเวลา'}
                  </span>
                </p>
                <Button type="button" variant="quiet" size="sm" className="-my-2" onClick={() => focusId('date')}>
                  เปลี่ยน
                  <span className="sr-only"> {dateLabel}</span>
                </Button>
              </div>
              {hint.warn && <p className="text-meta text-ink-2">{hint.text}</p>}
            </>
          )}
          <p className="text-meta text-ink-3">{NOTES.estimate}</p>
        </div>

        {errorCount > 0 && (
          <Notice tone="bad" live="assertive" size="sm" title={FORM_ENDPOINT ? 'ยังส่งไม่ได้' : 'ยังสร้างสรุปไม่ได้'}>
            ตรวจ {errorCount} ช่องที่มีข้อความสีแดงด้านล่าง แล้วกดอีกครั้ง
          </Notice>
        )}

        {/* (2) name and phone — all a request needs (plus the date for a visit that has none yet) */}
        <Group id={CONTACT_ID} title="ข้อมูลติดต่อ" first>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="ชื่อ / บริษัท" required id="quote-name" hint="ชื่อที่ให้ทีมเรียก" error={errors.name}>
              <Input name="name" autoComplete="name" enterKeyHint="next" defaultValue={draft.name} />
            </Field>
            <Field label="เบอร์โทร" required id="quote-tel" hint="ทีมโทรยืนยันในเวลาทำการ" error={errors.tel}>
              <Input
                name="tel"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                icon="phone"
                enterKeyHint={last === 'tel' ? 'send' : 'next'}
                defaultValue={draft.tel}
              />
            </Field>
          </div>
          {dateUp && dateFields}
          {contract && taxField}
        </Group>

        {/* honeypot: hidden from people and assistive tech, bots fill it */}
        <div aria-hidden inert className="absolute -left-[9999px] size-px overflow-hidden">
          <label>
            เว็บไซต์ (ปล่อยว่าง)
            <input name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
          </label>
        </div>

        {/* (3) the action */}
        <div data-page-cta className="flex flex-col gap-3">
          <Button type="submit" size="lg" icon={FORM_ENDPOINT ? 'send' : 'document'} loading={sending} fullWidth className="sm:w-auto sm:self-start">
            {sending
              ? FORM_ENDPOINT
                ? 'กำลังส่ง…'
                : 'กำลังสร้างสรุป…'
              : FORM_ENDPOINT
                ? kind === 'booking'
                  ? 'ส่งคำขอจองคิว'
                  : 'ส่งคำขอใบเสนอราคา'
                : kind === 'booking'
                  ? 'สร้างสรุปการจอง'
                  : 'สร้างสรุปคำขอ'}
          </Button>
          {!FORM_ENDPOINT && <p className="text-meta text-ink-3">ขั้นต่อไป ส่งสรุปทาง LINE หรือโทรแจ้งเลขอ้างอิง</p>}
          <p className="flex items-start gap-2 text-meta text-ink-3">
            <Icon name="shield" size={16} className="mt-[0.25em] shrink-0" />
            <span>{PDPA_NOTE}</span>
          </p>
        </div>

        {/* (4) everything optional, folded — the inputs stay mounted, so FormData reads them even while closed */}
        <details open={foldOpen} className="group rounded-control border border-line">
          <summary className="flex min-h-14 list-none items-center justify-between gap-4 rounded-control px-4 py-3 hover:bg-surface-2/60 [&::-webkit-details-marker]:hidden">
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-ink-2">
                <span className="font-semibold text-ink">เพิ่มรายละเอียด (ไม่บังคับ)</span> · {foldList.join(' ')}
              </span>
              <span className="text-meta text-ink-3">ช่วยให้ทีมเตรียมงานได้ตรงขึ้น</span>
            </span>
            <span
              aria-hidden
              className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-2 text-ink-2 group-open:bg-sky-soft group-open:text-brand"
            >
              <Icon name="chevron-down" size={18} className="transition-transform duration-250 ease-air group-open:rotate-180" />
            </span>
          </summary>

          <div className="flex flex-col gap-7 border-t border-line px-4 pb-5 pt-6 sm:px-5">
            <Group title="ช่องทางติดต่ออื่น" first>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field label="LINE ID" optional id="quote-line" hint="ให้ทีมทักไปส่งราคาและยืนยันคิว">
                  <Input
                    name="line"
                    autoComplete="off"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    defaultValue={draft.line}
                  />
                </Field>
                <Field label="อีเมล" optional id="quote-email" hint="สำหรับให้ทีมส่งใบเสนอราคา" error={errors.email}>
                  <Input name="email" type="email" inputMode="email" autoComplete="email" icon="mail" enterKeyHint="next" defaultValue={draft.email} />
                </Field>
              </div>
            </Group>

            <Group title="วันและสถานที่">
              {!dateUp && dateFields}
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
                  {conditions.map(c => (
                    <Checkbox key={c} name="cond" value={c} label={c} defaultChecked={draft.conditions.includes(c)} />
                  ))}
                </div>
              </Fieldset>
            </Group>

            <Group title="รายละเอียดเพิ่มเติม">
              {!contract && taxField}
              <Field label="หมายเหตุ" optional id="quote-note" hint="เช่น ช่วงเวลาที่เข้าหน้างานได้ ชั้นของเครื่อง อาการที่พบ">
                <Textarea name="note" rows={3} defaultValue={draft.note} />
              </Field>
              <Notice tone="info" size="sm" icon="camera">
                ส่งรูปหน้างานทาง LINE ได้หลังส่งคำขอ ช่วยให้ทีมประเมินได้เร็วขึ้น
              </Notice>
            </Group>
          </div>
        </details>
      </form>
    </Card>
  );
}
