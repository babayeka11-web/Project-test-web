'use client';
// The result of a request (contact form, quote, booking) — honest about what happened, and one clear next step.
// sent → "ส่งถึงทีมแล้ว" with the reference. Not sent (no endpoint yet, or the endpoint failed) → say so plainly and hand the
// summary over: ① send it on LINE with a short message typed in (primary), ② call with the reference number, then the
// quieter channels (copy · e-mail · copy the reference). The live opening status sits above the actions; while the office
// is closed the phone steps back and LINE is the way to leave the request. Never claims a send that did not happen, and
// never promises a response time.
import { useState, type Ref } from 'react';
import { Button, Icon, Notice } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { copyText, handoffLinks, type RequestKind, type SendResult } from '@/lib/request';
import { OpenNow, useOpenStatus } from './OpenNow';

export type HandoffBoxProps = {
  kind: RequestKind;
  result: SendResult;
  /** The plain-text summary (buildSummary) — shown, copied and e-mailed. */
  text: string;
  /** The short LINE message (lineText); defaults to `text`. */
  lineText?: string;
  /** Level of the result title: h3 under a section title (quote), h4 under a sub-heading (contact). */
  titleAs?: 'h3' | 'h4';
  /** The title (tabIndex -1): the form scrolls it into view and moves focus to it when the result appears. */
  titleRef?: Ref<HTMLHeadingElement>;
  /** Start over (new request). */
  onReset?: () => void;
};

const TITLE: Record<SendResult['status'], string> = {
  sent: 'ส่งถึงทีมแล้ว',
  failed: 'ส่งผ่านเว็บไม่สำเร็จ · ส่งสรุปนี้ให้ทีม',
  unconfigured: 'อีกขั้นเดียว · ส่งสรุปนี้ให้ทีม',
};

export function HandoffBox({ kind, result, text, lineText, titleAs: Title = 'h3', titleRef, onReset }: HandoffBoxProps) {
  const [copied, setCopied] = useState<'text' | 'ref' | null>(null);
  const status = useOpenStatus();
  const links = handoffLinks(kind, result.ref, text, lineText);
  const sent = result.status === 'sent';
  const closed = status?.open === false;
  const copy = async (what: 'text' | 'ref') => {
    if (await copyText(what === 'text' ? text : result.ref)) {
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <Title ref={titleRef} tabIndex={-1} className="text-h3 outline-none">
        {TITLE[result.status]}
      </Title>

      {sent ? (
        <Notice tone="ok" live="polite">
          เลขอ้างอิง <b className="num whitespace-nowrap">{result.ref}</b> · ทีมติดต่อกลับในเวลาทำการ {COMPANY.hours}
        </Notice>
      ) : (
        <Notice tone={result.status === 'failed' ? 'warn' : 'info'} live="polite">
          {result.status === 'failed' ? `${result.reason} · ` : 'เว็บยังไม่ส่งคำขอถึงทีมอัตโนมัติ · '}
          ส่งทาง LINE หรือโทรแจ้งเลขอ้างอิง <b className="num whitespace-nowrap">{result.ref}</b>
        </Notice>
      )}

      <div className="flex flex-col items-start gap-2">
        <OpenNow />
        {!sent && closed && <p className="text-small text-ink-2">ส่งทาง LINE ไว้ได้เลย ทีมอ่านและตอบในเวลาทำการ</p>}
      </div>

      {!sent && (
        // the one orange action of this view (UI.md §2: the header's booking button steps back while it shows)
        <div data-page-cta className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <Button href={links.line} size="lg" icon="chat">
            ส่งทาง LINE <span className="whitespace-nowrap font-medium">(ข้อความพิมพ์ให้แล้ว)</span>
          </Button>
          <Button href={links.tel} variant={closed ? 'quiet' : 'secondary'} icon="phone">
            โทร {COMPANY.tel} แจ้งเลขอ้างอิง
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {!sent && <p className="text-meta text-ink-3">ช่องทางอื่น</p>}
        <div className="-ml-4 flex flex-wrap gap-x-1">
          <Button type="button" variant="quiet" size="sm" icon="copy" onClick={() => copy('text')}>
            {copied === 'text' ? 'คัดลอกสรุปแล้ว' : 'คัดลอกสรุป'}
          </Button>
          {!sent && (
            <Button href={links.mail} variant="quiet" size="sm" icon="mail">
              ส่งอีเมล
            </Button>
          )}
          <Button type="button" variant="quiet" size="sm" icon="copy" onClick={() => copy('ref')}>
            {copied === 'ref' ? 'คัดลอกเลขอ้างอิงแล้ว' : 'คัดลอกเลขอ้างอิง'}
          </Button>
        </div>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? 'คัดลอกแล้ว' : ''}
      </p>

      <details className="group rounded-control border border-line bg-surface-2">
        <summary className="flex min-h-12 list-none items-center justify-between gap-3 rounded-control px-4 text-small font-semibold text-ink hover:text-brand [&::-webkit-details-marker]:hidden">
          {sent ? 'ดูสรุปคำขอ' : 'ดูข้อความที่จะส่ง'}
          <Icon name="chevron-down" size={18} className="shrink-0 text-ink-2 transition-transform duration-250 ease-air group-open:rotate-180" />
        </summary>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words px-4 pb-4 font-sans text-small text-ink">{text}</pre>
      </details>

      {onReset && (
        <div className="-ml-4">
          <Button type="button" variant="quiet" size="sm" onClick={onReset}>
            เริ่มคำขอใหม่
          </Button>
        </div>
      )}
    </div>
  );
}
