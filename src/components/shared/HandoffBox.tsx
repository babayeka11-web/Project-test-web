'use client';
// The result of a request (contact form, quote, booking) — honest about what happened.
// sent → "ส่งถึงทีมแล้ว" with the reference. Not sent (no endpoint yet, or the endpoint failed) → say so plainly and hand the
// summary over: copy it, send it on LINE with the text typed in, call, or e-mail. Never claims a send that did not happen.
import { useState } from 'react';
import { Button, Notice } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';
import { copyText, handoffLinks, type RequestKind, type SendResult } from '@/lib/request';

export type HandoffBoxProps = {
  kind: RequestKind;
  result: SendResult;
  /** The plain-text summary (buildSummary) — shown and handed over. */
  text: string;
  /** Start over (new request). */
  onReset?: () => void;
};

export function HandoffBox({ kind, result, text, onReset }: HandoffBoxProps) {
  const [copied, setCopied] = useState<'text' | 'ref' | null>(null);
  const links = handoffLinks(kind, result.ref, text);
  const copy = async (what: 'text' | 'ref') => {
    if (await copyText(what === 'text' ? text : result.ref)) {
      setCopied(what);
      window.setTimeout(() => setCopied(null), 2500);
    }
  };

  return (
    <div className="flex flex-col gap-5" tabIndex={-1}>
      {result.status === 'sent' ? (
        <Notice tone="ok" live="polite" title="ส่งถึงทีมแล้ว">
          เลขอ้างอิง <b className="num">{result.ref}</b> · ทีมติดต่อกลับในเวลาทำการ {COMPANY.hours}
        </Notice>
      ) : (
        <Notice tone={result.status === 'failed' ? 'warn' : 'info'} live="polite" title={result.status === 'failed' ? 'ส่งผ่านเว็บไม่สำเร็จ' : 'ส่งสรุปนี้ให้ทีมได้ทันที'}>
          {result.status === 'failed' ? `${result.reason} · ` : 'ตอนนี้เว็บยังไม่ส่งคำขอถึงทีมอัตโนมัติ · '}
          กดส่งทาง LINE (ข้อความพิมพ์ให้แล้ว) หรือโทรแจ้งเลขอ้างอิง <b className="num">{result.ref}</b>
        </Notice>
      )}

      <div className="rounded-control border border-line bg-surface-2 p-4">
        <p className="mb-2 text-meta text-ink-3">สรุปคำขอ</p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words font-sans text-small text-ink">{text}</pre>
      </div>

      <div className="flex flex-wrap gap-3">
        {result.status !== 'sent' && (
          <Button href={links.line} variant="primary" icon="chat">
            ส่งทาง LINE
          </Button>
        )}
        <Button type="button" variant="secondary" icon="copy" onClick={() => copy('text')}>
          {copied === 'text' ? 'คัดลอกสรุปแล้ว' : 'คัดลอกสรุป'}
        </Button>
        <Button href={links.tel} variant="ghost" icon="phone">
          โทร {COMPANY.tel}
        </Button>
        <Button href={links.mail} variant="ghost" icon="mail">
          ส่งอีเมล
        </Button>
        <Button type="button" variant="quiet" icon="copy" onClick={() => copy('ref')}>
          {copied === 'ref' ? 'คัดลอกเลขอ้างอิงแล้ว' : 'คัดลอกเลขอ้างอิง'}
        </Button>
      </div>
      <p aria-live="polite" className="sr-only">
        {copied ? 'คัดลอกแล้ว' : ''}
      </p>
      {onReset && (
        <div>
          <Button type="button" variant="quiet" onClick={onReset}>
            เริ่มคำขอใหม่
          </Button>
        </div>
      )}
    </div>
  );
}
