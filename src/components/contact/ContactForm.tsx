'use client';
// Contact form. Validates on submit (focus goes to the first invalid field), then builds the reference number + Thai summary and
// sends it through src/lib/request.ts. With no form endpoint configured the box that replaces the form says plainly that
// nothing was sent automatically and hands the summary over (LINE · copy · call · e-mail) — never a fake "sent".
import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { HandoffBox } from '@/components/shared/HandoffBox';
import { Button, Card, Field, Input, Notice, Select, Textarea } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { CONTACT_TOPICS, isVRF, VRF_NOTE } from '@/lib/domain/content';
import { buildSummary, makeRef, PDPA_NOTE, submitRequest, type RequestField, type SendResult } from '@/lib/request';

/** ?topic= values other pages link with → the topic text of the select. */
const TOPIC_PARAM: Record<string, string> = {
  fujiva: 'FUJIVA',
  vrf: 'ระบบ VRV / VRF',
  contract: 'สัญญาล้างรายปี',
  project: 'งานโครงการอื่น',
  clean: 'ล้างแอร์',
  install: 'ติดตั้งแอร์',
  repair: 'ซ่อม / ตรวจเช็ก',
  tradein: 'เทิร์นแอร์เก่า',
  buy: 'ซื้อแอร์',
};

const topicFromParam = (v: string | null | undefined): string => {
  if (!v) return '';
  const t = TOPIC_PARAM[v.toLowerCase()] ?? v;
  return CONTACT_TOPICS.includes(t) ? t : '';
};

const WHEN = ['ช่วงเวลาทำการ', 'ช่วงเช้า', 'ช่วงบ่าย', 'ทัก LINE ก่อน'] as const;
const MIN_MESSAGE = 10;

type Values = { topic: string; name: string; tel: string; line: string; email: string; when: string; message: string };
type Errors = Partial<Record<keyof Values, string>>;
const EMPTY: Values = { topic: '', name: '', tel: '', line: '', email: '', when: WHEN[0], message: '' };

/** Thai phone: 9–10 digits starting with 0 (02-xxx-xxxx · 08x-xxx-xxxx); +66 is accepted. */
const telDigits = (v: string) => v.replace(/[\s\-().]/g, '').replace(/^\+66/, '0');
const telOk = (v: string) => /^0\d{8,9}$/.test(telDigits(v));
const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.topic) e.topic = 'เลือกเรื่องที่ต้องการติดต่อ';
  if (!v.name.trim()) e.name = 'กรอกชื่อ หรือชื่อบริษัท';
  if (!telOk(v.tel)) e.tel = 'กรอกเบอร์ 9–10 หลัก เช่น 0812345678 หรือ 024593299';
  if (v.email.trim() && !emailOk(v.email.trim())) e.email = 'อีเมลยังไม่ถูกต้อง เช่น name@example.com';
  if (v.message.trim().length < MIN_MESSAGE) e.message = `เขียนรายละเอียดอย่างน้อย ${MIN_MESSAGE} ตัวอักษร เช่น ประเภทอาคาร จำนวนเครื่อง ช่วงเวลาที่สะดวก`;
  return e;
}

// DOM order = focus order for "first invalid"
const ORDER: (keyof Values)[] = ['topic', 'name', 'tel', 'line', 'email', 'when', 'message'];

export function ContactForm() {
  const params = useSearchParams();
  const paramTopic = topicFromParam(params?.get('topic'));
  const { zoneInput } = useCart();

  const [values, setValues] = useState<Values>(() => ({ ...EMPTY, topic: paramTopic }));
  const [seenParam, setSeenParam] = useState(paramTopic);
  const [errors, setErrors] = useState<Errors>({});
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState<{ result: SendResult; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const doneRef = useRef<HTMLDivElement>(null);

  // a link to /contact/?topic=… while the page is already open changes the topic (derived-state pattern, no effect)
  if (paramTopic !== seenParam) {
    setSeenParam(paramTopic);
    if (paramTopic) setValues(v => ({ ...v, topic: paramTopic }));
  }

  useEffect(() => {
    if (done) {
      const box = doneRef.current;
      box?.scrollIntoView({ block: 'start' });
      box?.querySelector<HTMLElement>('[tabindex="-1"]')?.focus({ preventScroll: true });
    }
  }, [done]);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues(v => ({ ...v, [key]: value }));
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }));
  };

  const submit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (sending) return;
    const form = ev.currentTarget;
    // honeypot: people never see this field; a filled one is a bot — drop it without a reply
    if ((new FormData(form).get('company-site') as string | null)?.trim()) return;

    const errs = validate(values);
    setErrors(errs);
    const bad = ORDER.find(k => errs[k]);
    if (bad) {
      (form.elements.namedItem(bad) as HTMLElement | null)?.focus();
      return;
    }

    setSending(true);
    const ref = makeRef();
    const v = values;
    const fields: RequestField[] = [
      ['เรื่อง', v.topic],
      ['ชื่อ / บริษัท', v.name],
      ['โทร', v.tel],
      ['LINE ID', v.line],
      ['อีเมล', v.email],
      ['สะดวกให้ติดต่อ', v.when],
      ['พื้นที่หน้างาน', zoneInput],
      ['รายละเอียด', v.message],
    ];
    const text = buildSummary('contact', ref, fields);
    const result = await submitRequest('contact', ref, fields, text);
    setSending(false);
    setDone({ result, text });
  };

  if (done) {
    return (
      <Card padding="lg">
        <div ref={doneRef} className="scroll-mt-header">
          <HandoffBox
            kind="contact"
            result={done.result}
            text={done.text}
            onReset={() => {
              setDone(null);
              setValues({ ...EMPTY, topic: paramTopic });
              setErrors({});
            }}
          />
        </div>
      </Card>
    );
  }

  return (
    <Card padding="lg">
      <form ref={formRef} onSubmit={submit} noValidate aria-label="ฟอร์มติดต่อทีม" className="flex flex-col gap-6">
        {/* honeypot — hidden from people and from assistive tech */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            เว็บไซต์ (ไม่ต้องกรอก)
            <input type="text" name="company-site" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <Field label="เรื่องที่ต้องการติดต่อ" required error={errors.topic}>
          <Select name="topic" placeholder="เลือกเรื่อง" value={values.topic} onChange={e => set('topic', e.target.value)}>
            {CONTACT_TOPICS.map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>
        {isVRF(values.topic) && (
          <Notice tone="info" size="sm">
            {VRF_NOTE}
          </Notice>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <Field label="ชื่อ หรือชื่อบริษัท" required error={errors.name}>
            <Input name="name" autoComplete="name" icon="users" value={values.name} onChange={e => set('name', e.target.value)} />
          </Field>
          <Field label="เบอร์โทร" required error={errors.tel}>
            <Input name="tel" type="tel" inputMode="tel" autoComplete="tel" icon="phone" placeholder="0812345678" value={values.tel} onChange={e => set('tel', e.target.value)} />
          </Field>
          <Field label="LINE ID" optional>
            <Input name="line" autoComplete="off" icon="chat" placeholder="เช่น @yourname" value={values.line} onChange={e => set('line', e.target.value)} />
          </Field>
          <Field label="อีเมล" optional error={errors.email}>
            <Input name="email" type="email" inputMode="email" autoComplete="email" icon="mail" placeholder="name@example.com" value={values.email} onChange={e => set('email', e.target.value)} />
          </Field>
        </div>

        <Field label="สะดวกให้ติดต่อช่วงไหน" hint="ทีมโทรกลับในเวลาทำการ">
          <Select name="when" value={values.when} onChange={e => set('when', e.target.value)}>
            {WHEN.map(w => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="รายละเอียด" required hint="เช่น ประเภทอาคาร จำนวนเครื่อง ที่ตั้ง ช่วงเวลาที่สะดวก" error={errors.message}>
          <Textarea name="message" rows={5} value={values.message} onChange={e => set('message', e.target.value)} />
        </Field>

        <div className="flex flex-col gap-4">
          <Button type="submit" size="lg" icon="send" loading={sending} fullWidth className="sm:w-auto sm:self-start">
            {sending ? 'กำลังส่ง…' : 'ส่งข้อความถึงทีม'}
          </Button>
          <p className="text-meta text-ink-3">
            {PDPA_NOTE} · หลังกดส่ง จะได้เลขอ้างอิงและสรุปคำขอ ส่งต่อทาง LINE หรือโทรหาทีมได้ทันที
          </p>
        </div>
      </form>
    </Card>
  );
}
