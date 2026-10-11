'use client';
// Price summary of the quick booking: what is chosen, travel, rush, the total (aria-live) and the two ways to continue.
// Everything is computed by cleaningQuote() in the domain layer; this file only presents it.
import type { ReactNode, Ref } from 'react';
import { Badge, Button, Card, Notice, Price } from '@/components/ui';
import { LEVEL_TH, PKG_TH, type CleanSelection, type CleaningQuote, type QuickType } from '@/lib/domain/cleaning';
import { NOTES } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { dateTh, RUSH_FEE_EX } from '@/lib/domain/queue';
import { TIER_TH, type Zone } from '@/lib/domain/travel';
import { FORM_ENDPOINT } from '@/lib/request';

function Row({ label, sub, children, tone }: { label: ReactNode; sub?: ReactNode; children: ReactNode; tone?: 'warn' }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <span className={tone === 'warn' ? 'text-small font-medium text-warn' : 'text-small text-ink'}>
        {label}
        {sub && <span className="block text-meta font-normal text-ink-3">{sub}</span>}
      </span>
      <span className="shrink-0 text-right">{children}</span>
    </div>
  );
}

export function BookingSummary({
  q,
  sel,
  zone,
  minBill,
  date,
  slotLabel,
  lineUrl,
  onBook,
  onAddOne,
  ctaRef,
}: {
  q: CleaningQuote;
  sel: CleanSelection;
  zone: Zone | null;
  minBill: number;
  /** the visit date in effect ('' when none or in the past) */
  date: string;
  slotLabel: string;
  lineUrl: string;
  onBook: () => void;
  onAddOne: (t: QuickType) => void;
  /** wrapper of the in-flow "จองล้างแอร์" (the phone dock hides while it is on screen) */
  ctaRef?: Ref<HTMLDivElement>;
}) {
  const t = q.totals;
  const ready = q.units > 0 && q.lines.length > 0;
  const unpriced = q.rows.some(r => r.amount == null);
  const rushFee = q.lines.find(l => l.group === 'rush')?.unitEx ?? RUSH_FEE_EX;
  // the last unit the offer asks for removes the offer (and its button): hand focus to the next step, not to <body>
  const addOne = (fill: NonNullable<CleaningQuote['fill']>) => {
    onAddOne(fill.type);
    if (fill.need <= 1) requestAnimationFrame(() => document.getElementById('qb-book')?.focus());
  };

  return (
    <Card id="qb-summary" padding="md" className="scroll-mt-header shadow-lift" aria-labelledby="qb-summary-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id="qb-summary-title" className="text-h3">
          สรุปราคา
        </h3>
        <Badge tone="outline" icon="info">
          ราคาประมาณการ
        </Badge>
      </div>
      <p className="mt-1 text-small text-ink-2">
        {LEVEL_TH[sel.level].th} ({sel.level}) · {PKG_TH[sel.pkg].th}
      </p>

      {q.units === 0 ? (
        <p className="mt-6 rounded-control bg-surface-2 p-4 text-small text-ink-2">เลือกแอร์ในขั้นที่ 1 แล้วราคารวมจะขึ้นที่นี่</p>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {q.rows.map(r => (
              <li key={r.type}>
                <Row label={`แอร์${r.th} × ${r.qty} เครื่อง`} sub={r.sizeTh}>
                  <Price amount={r.amount} vat={false} size="sm" />
                </Row>
              </li>
            ))}
            {t.travel > 0 ? (
              <li>
                <Row label={t.travelLabel || 'ค่าเดินทาง'} tone="warn">
                  <Price amount={t.travel} vat={false} size="sm" />
                </Row>
              </li>
            ) : (
              <li>
                <Row label="ค่าเดินทาง">
                  <span className="text-small text-ink-2">
                    {!zone || zone.tier === 'unknown' ? 'เลือกพื้นที่ในขั้นที่ 3' : zone.tier === 'core' ? 'ไม่มี' : 'ทีมประเมิน'}
                  </span>
                </Row>
              </li>
            )}
            {q.rush && (
              <li>
                <Row label="คิวด่วน" sub="ทีมยืนยันคิวก่อน ถ้าไม่มีคิวไม่เก็บค่านี้" tone="warn">
                  <Price amount={rushFee} vat={false} size="sm" />
                </Row>
              </li>
            )}
          </ul>

          {date && (
            <p className="mt-3 text-small text-ink-2">
              วันที่สะดวก {dateTh(date)}
              {slotLabel ? ` · ${slotLabel}` : ''}
              {q.rush ? ' · คิวด่วน' : ''}
            </p>
          )}

          <div aria-live="polite" aria-atomic="true" className="mt-4">
            <Row label="ราคาก่อน VAT">
              <Price amount={t.totalEx} vat={false} size="sm" />
            </Row>
            <Row label="VAT 7%">
              <Price amount={t.vat} vat={false} size="sm" />
            </Row>
            <div className="mt-2 flex items-end justify-between gap-4 border-t border-line pt-4">
              <span className="font-display text-[1.0625rem] font-semibold text-ink">รวมทั้งสิ้น</span>
              <Price amount={t.inc} vat="inc" size="lg" tone="brand" stacked className="items-end text-right" />
            </div>
          </div>

          {/* the top-up offer only when it is a small step; otherwise just the rule, without a button */}
          {q.fill && q.fill.need <= 2 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-control border border-ok/25 bg-ok-soft p-3">
              <p className="min-w-0 flex-1 basis-44 text-small text-ink">
                เพิ่มแอร์{q.fill.th}อีก {q.fill.need} เครื่อง ยอดงานล้างถึง {baht(minBill)} ไม่มีค่าเดินทาง
              </p>
              <Button type="button" size="sm" variant="soft" icon="plus" aria-label={`เพิ่มแอร์${q.fill.th} 1 เครื่อง`} onClick={() => addOne(q.fill!)}>
                +1 เครื่อง
              </Button>
            </div>
          ) : q.fill && t.travel > 0 ? (
            <p className="mt-3 text-meta text-ink-3">ยอดงานล้างถึง {baht(minBill)} ต่อการเข้างาน ไม่มีค่าเดินทาง</p>
          ) : null}

          <div className="mt-4 grid gap-3 empty:hidden">
            {zone?.tier === 'out' && (
              <Notice tone="warn" size="sm" live="polite">
                {TIER_TH.out.note}
              </Notice>
            )}
            {unpriced && (
              <Notice tone="info" size="sm">
                บางขนาดยังไม่มีราคามาตรฐาน ทีมประเมินหน้างานและแจ้งราคาในใบเสนอราคา
              </Notice>
            )}
            {q.volumeHint && (
              <Notice tone="info" size="sm" icon="users">
                {NOTES.volume}
              </Notice>
            )}
          </div>
        </>
      )}

      <p className="mt-4 text-meta text-ink-3">{NOTES.estimate}</p>

      <div className="mt-5 grid gap-3">
        <div ref={ctaRef} data-page-cta>
          <Button id="qb-book" type="button" variant="primary" size="lg" fullWidth icon="clean" disabled={!ready} aria-describedby="qb-book-note" onClick={onBook}>
            จองล้างแอร์ · กรอกชื่อและเบอร์
          </Button>
        </div>
        {q.units > 0 ? (
          <Button href={lineUrl} variant="ghost" fullWidth icon="chat">
            ส่งทาง LINE
          </Button>
        ) : (
          <Button type="button" variant="ghost" fullWidth icon="chat" disabled>
            ส่งทาง LINE
          </Button>
        )}
      </div>
      <p id="qb-book-note" className="mt-3 text-meta text-ink-3">
        {/* no form endpoint yet: nothing reaches the team until the customer sends the summary themselves */}
        {FORM_ENDPOINT
          ? 'ยังไม่ส่งคำขอ ขั้นต่อไปกรอกชื่อและเบอร์ที่หน้าใบเสนอราคา แล้วทีมโทรยืนยันคิว'
          : 'ยังไม่ส่งคำขอ ขั้นต่อไปกรอกชื่อและเบอร์ที่หน้าใบเสนอราคา แล้วส่งสรุปให้ทีมทาง LINE หรือโทรแจ้ง'}
      </p>
    </Card>
  );
}
