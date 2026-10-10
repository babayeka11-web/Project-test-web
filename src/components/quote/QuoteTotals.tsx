'use client';
// The totals card of the quotation: lines total, travel, the small-visit minimum, total before VAT, VAT 7 % and the grand
// total — all from useCart().totals (quoteTotals), never recomputed here. The grand total sits in an aria-live region.
// Under it: the honest notes (estimate · cleaning minimum · surveys · volume · out of area), copy summary and print.
import type { ReactNode } from 'react';
import { Button, Card, Icon, Notice, Price, toast, type IconName } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { NOTES } from '@/lib/domain/constants';
import { copyText } from '@/lib/request';
import { quoteNotes, quoteSummaryText, todayTh, travelView, type QuoteNote } from './quote-model';

const NOTE_ICON: Record<QuoteNote['tone'], IconName> = { info: 'info', warn: 'alert', ok: 'check' };
const NOTE_COLOR: Record<QuoteNote['tone'], string> = { info: 'text-brand', warn: 'text-warn', ok: 'text-ok' };
const TEXT_COLOR = { ok: 'text-ok', muted: 'text-ink-2', warn: 'text-warn' } as const;

function Row({ label, strong, children }: { label: ReactNode; strong?: boolean; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className={strong ? 'min-w-0 font-semibold text-ink' : 'min-w-0 text-ink-2'}>{label}</dt>
      <dd className={`shrink-0 text-right tabular-nums ${strong ? 'font-semibold text-ink' : 'font-medium text-ink'}`}>{children}</dd>
    </div>
  );
}

const focusArea = () => {
  const el = document.getElementById('quote-area');
  if (el) {
    el.scrollIntoView({ block: 'center' });
    el.focus({ preventScroll: true });
  }
};

export function QuoteTotals() {
  const { lines, zone, zoneInput, totals: t } = useCart();
  const tv = travelView(lines, zone, t);
  const onlySurveys = t.totalEx === 0;
  const notes = quoteNotes(lines, zone, t).filter(n => !(onlySurveys && n.id === 'survey'));

  const copy = async () => {
    const ok = await copyText(quoteSummaryText(lines, zone, zoneInput, t, todayTh()));
    toast(ok ? 'คัดลอกสรุปแล้ว วางในแชตหรืออีเมลได้' : 'คัดลอกไม่ได้ในหน้านี้ ลองเลือกข้อความแล้วคัดลอกเอง', { tone: ok ? 'ok' : 'warn' });
  };

  return (
    <Card padding="lg" className="flex flex-col gap-5 print:border-0 print:p-0 print:shadow-none">
      <h3 className="text-h3">ยอดรวม</h3>

      {onlySurveys ? (
        <Notice tone="info" size="sm" title="รายการนี้ทีมประเมินหน้างาน">
          ยังไม่มีราคามาตรฐานให้รวมยอด ส่งคำขอแล้วทีมแจ้งราคาก่อนเริ่มงาน
        </Notice>
      ) : (
        <>
          <dl className="divide-y divide-line text-small">
            <Row label="ราคารายการ">
              <Price amount={t.ex} vat={false} size="sm" />
            </Row>
            <Row label={tv.label}>
              {tv.kind === 'fee' ? (
                <Price amount={tv.amount} vat={false} size="sm" />
              ) : tv.needsArea ? (
                <button type="button" onClick={focusArea} className="font-medium text-brand underline underline-offset-2 print:hidden">
                  {tv.text}
                </button>
              ) : (
                <span className={`font-medium ${TEXT_COLOR[tv.tone]}`}>{tv.text}</span>
              )}
              {tv.kind === 'text' && tv.needsArea && <span className="hidden font-medium text-ink-2 print:inline">{tv.text}</span>}
            </Row>
            {t.visitSmall && (
              <Row label={t.visitLabel}>{t.visit > 0 ? <Price amount={t.visit} vat={false} size="sm" /> : <span className="text-ok">ถึงขั้นต่ำแล้ว</span>}</Row>
            )}
            <Row label="ยอดก่อน VAT" strong>
              <Price amount={t.totalEx} vat={false} size="sm" />
            </Row>
            <Row label="VAT 7%">
              <Price amount={t.vat} vat={false} size="sm" />
            </Row>
          </dl>

          <div aria-live="polite" aria-atomic="true" className="rounded-control bg-sky-soft px-4 py-3.5 print:bg-transparent print:px-0">
            <p className="text-small text-ink-2">รวมทั้งสิ้น</p>
            <Price amount={t.inc} vat="inc" size="lg" tone="brand" />
            {t.surveys > 0 && <p className="mt-1 text-meta text-ink-2">ยังไม่รวม {t.surveys} รายการประเมินหน้างาน</p>}
          </div>
        </>
      )}

      <p className="text-meta text-ink-3">
        {NOTES.estimate} · ราคารายการเป็นราคามาตรฐานก่อน VAT บวก VAT 7% ครั้งเดียวที่ยอดรวม
      </p>

      {notes.length > 0 && (
        <ul className="flex flex-col gap-3 border-t border-line pt-4">
          {notes.map(n => (
            <li key={n.id} className="flex gap-2.5 text-small text-ink-2">
              <Icon name={NOTE_ICON[n.tone]} size={18} strokeWidth={2} className={`mt-[0.2em] shrink-0 ${NOTE_COLOR[n.tone]}`} />
              <span className="min-w-0">{n.text}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-3 print:hidden">
        <Button href="#request" variant="secondary" icon="send" fullWidth>
          กรอกข้อมูลส่งคำขอ
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="ghost" icon="copy" onClick={copy}>
            คัดลอกสรุป
          </Button>
          <Button variant="ghost" icon="document" onClick={() => window.print()}>
            พิมพ์
          </Button>
        </div>
      </div>
    </Card>
  );
}
