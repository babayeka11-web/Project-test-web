'use client';
// "ตรวจสถานะคำขอ": the reference number + the last 4 digits of the phone given with the request → the status the team set
// in the request sheet (src/lib/request.ts → checkStatus → Code.gs doGet). Reads ?ref= so the "ส่งถึงทีมแล้ว" box can link
// here with the reference filled in. With no request inbox configured the form is replaced by the honest way to ask: call or
// LINE with the reference.
import { useSearchParams } from 'next/navigation';
import { useRef, useState, type FormEvent } from 'react';
import { Button, Card, Field, Input, Notice } from '@/components/ui';
import { COMPANY, lineMessageUrl } from '@/lib/domain/company';
import { checkStatus, enterToNext, FORM_ENDPOINT, normalizeRef, type StatusResult } from '@/lib/request';

type Errors = { ref?: string; tel?: string };

export function StatusChecker() {
  const params = useSearchParams();
  const [ref, setRef] = useState(() => normalizeRef(params?.get('ref') ?? '') || '');
  const [tel, setTel] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<StatusResult | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (!FORM_ENDPOINT) {
    return (
      <Card padding="lg" className="flex flex-col gap-4">
        <Notice tone="info" title="ตรวจสถานะผ่านทีมงาน">
          ตอนนี้ตรวจสถานะคำขอทางเว็บยังไม่ได้ แจ้งเลขอ้างอิงทาง LINE หรือโทร ทีมบอกสถานะให้ทันทีในเวลาทำการ {COMPANY.hours}
        </Notice>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button href={lineMessageUrl(ref ? `ขอตรวจสถานะคำขอ ${ref}` : 'ขอตรวจสถานะคำขอ เลขอ้างอิง ')} icon="chat">
            ถามทาง LINE
          </Button>
          <Button href={COMPANY.telHref} variant="secondary" icon="phone">
            โทร {COMPANY.tel}
          </Button>
        </div>
      </Card>
    );
  }

  const submit = async (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    if (checking) return;
    const r = normalizeRef(ref);
    const t = tel.replace(/\D/g, '');
    const errs: Errors = {};
    if (!r) errs.ref = 'กรอกเลขอ้างอิงแบบ SBP-691011-K7Q2';
    if (t.length !== 4) errs.tel = 'กรอกเบอร์โทร 4 ตัวท้าย ตามที่ให้ไว้ในคำขอ';
    setErrors(errs);
    setResult(null);
    if (errs.ref || errs.tel) {
      (formRef.current?.elements.namedItem(errs.ref ? 'ref' : 'tel') as HTMLElement | null)?.focus();
      return;
    }
    setRef(r);
    setChecking(true);
    setResult(await checkStatus(r, t));
    setChecking(false);
  };

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <form ref={formRef} onSubmit={submit} onKeyDown={enterToNext} noValidate aria-label="ตรวจสถานะคำขอ" className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[minmax(0,1fr)_12rem]">
          <Field label="เลขอ้างอิง" required error={errors.ref} hint="อยู่ในสรุปคำขอ เช่น SBP-691011-K7Q2">
            <Input
              name="ref"
              icon="document"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              enterKeyHint="next"
              placeholder="SBP-"
              value={ref}
              onChange={e => {
                setRef(e.target.value);
                if (errors.ref) setErrors(x => ({ ...x, ref: undefined }));
              }}
            />
          </Field>
          <Field label="เบอร์โทร 4 ตัวท้าย" required error={errors.tel}>
            <Input
              name="tel"
              icon="phone"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              enterKeyHint="search"
              placeholder="5678"
              value={tel}
              onChange={e => {
                setTel(e.target.value.replace(/\D/g, '').slice(0, 4));
                if (errors.tel) setErrors(x => ({ ...x, tel: undefined }));
              }}
            />
          </Field>
        </div>
        <Button type="submit" size="lg" icon="search" loading={checking} className="self-start">
          {checking ? 'กำลังตรวจ…' : 'ตรวจสถานะ'}
        </Button>
      </form>

      <div aria-live="polite">
        {result?.status === 'found' && (
          <Notice tone="ok" title={`สถานะ: ${result.state}`}>
            {result.kind || 'คำขอ'} เลขอ้างอิง <b className="num whitespace-nowrap">{result.ref}</b>
            {result.received && <> · ได้รับเมื่อ <span className="num whitespace-nowrap">{result.received}</span> น.</>}
          </Notice>
        )}
        {result && (result.status === 'notFound' || result.status === 'failed') && (
          <Notice tone={result.status === 'failed' ? 'warn' : 'bad'} title={result.status === 'failed' ? 'ตรวจไม่สำเร็จ' : 'ไม่พบคำขอ'}>
            {result.reason} · หรือโทร{' '}
            <a href={COMPANY.telHref} className="num whitespace-nowrap font-semibold text-brand">
              {COMPANY.tel}
            </a>{' '}
            แจ้งเลขอ้างอิง
          </Notice>
        )}
      </div>
    </Card>
  );
}
