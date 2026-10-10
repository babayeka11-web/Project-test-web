'use client';
// The working part of the quotation page: lines + area on the left, the sticky totals on the right (below on phones).
// Hydration-safe: the quote lives in localStorage, so the server HTML and the first client render are a skeleton.
// Also owns the print sheet: "พิมพ์" shows only this part, with the company facts and the date, always on light colours.
import { useEffect, useId } from 'react';
import { AddressPicker } from '@/components/shared/AddressPicker';
import { Button, Card, Icon, Skeleton } from '@/components/ui';
import { useCart } from '@/lib/cart';
import { COMPANY } from '@/lib/domain/company';
import { NOTES } from '@/lib/domain/constants';
import { QuoteLines } from './QuoteLines';
import { QuoteTotals } from './QuoteTotals';
import { areaText, todayTh } from './quote-model';
import { useHydrated } from './use-hydrated';

// Print: hide the site chrome (header, footer, mobile bar, notices) and the page hero; the rest of the page is laid out
// by `print:` utilities on the components themselves.
const PRINT_CSS = `
@page { margin: 14mm; }
@media print {
  body > :not(main) { display: none !important; }
  body { padding: 0 !important; }
  main > header { display: none !important; }
  main section { padding-block: 0 !important; }
  #items h2, #items h2 + p { display: none !important; }
}`;

/** Printing always uses the light theme (dark text colours on white paper), then restores the visitor's theme. */
function useLightWhilePrinting() {
  useEffect(() => {
    const root = document.documentElement;
    let saved: string | null | undefined;
    const before = () => {
      saved = root.getAttribute('data-theme');
      root.setAttribute('data-theme', 'light');
    };
    const after = () => {
      if (saved === undefined) return;
      if (saved === null) root.removeAttribute('data-theme');
      else root.setAttribute('data-theme', saved);
      saved = undefined;
    };
    window.addEventListener('beforeprint', before);
    window.addEventListener('afterprint', after);
    return () => {
      window.removeEventListener('beforeprint', before);
      window.removeEventListener('afterprint', after);
      after();
    };
  }, []);
}

const GRID = 'grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_26rem]';

function WorkspaceSkeleton() {
  return (
    <div className={GRID} aria-busy="true">
      <p role="status" className="sr-only">
        กำลังโหลดรายการในใบเสนอราคา
      </p>
      <div className="flex min-w-0 flex-col gap-4">
        <Skeleton shape="card" className="h-[26rem]" />
        <Skeleton shape="card" className="h-64" />
      </div>
      <Skeleton shape="card" className="h-[30rem]" />
    </div>
  );
}

function EmptyQuote() {
  return (
    <Card padding="lg" className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
      <span aria-hidden className="grid size-16 place-items-center rounded-full bg-sky-soft text-brand">
        <Icon name="quote" size={30} />
      </span>
      <div className="flex flex-col gap-2">
        <h3 className="text-h3">ยังไม่มีรายการในใบเสนอราคา</h3>
        <p className="mx-auto max-w-md text-ink-2">เลือกบริการหรือแอร์ที่สนใจ แล้วกดใส่ใบเสนอราคา ราคาก่อน VAT และค่าเดินทางจะคิดให้ทันที</p>
      </div>
      <div className="flex flex-wrap justify-center gap-3">
        <Button href="/cleaning/#book" variant="secondary" icon="clean">
          จองล้างแอร์
        </Button>
        <Button href="/products/" variant="ghost" icon="ac">
          ดูแอร์ทุกรุ่น
        </Button>
        <Button href="/prices/" variant="ghost" icon="tag">
          ดูค่าบริการทั้งหมด
        </Button>
      </div>
    </Card>
  );
}

/** Shown only on paper: who the quotation comes from, the date and the area. */
function PrintHead() {
  const { zone, zoneInput } = useCart();
  return (
    <div className="mb-6 hidden border-b border-line pb-4 print:block">
      <p className="font-display text-h3">ใบเสนอราคาเบื้องต้น</p>
      <p className="mt-1 text-small">
        {COMPANY.th} · {COMPANY.brand}
      </p>
      <p className="text-small">{COMPANY.addr}</p>
      <p className="text-small">
        โทร {COMPANY.tel} · {COMPANY.email} · เลขประจำตัวผู้เสียภาษี {COMPANY.taxId}
      </p>
      <p className="mt-2 text-small">
        วันที่ {todayTh()} · พื้นที่หน้างาน: {areaText(zone, zoneInput) || 'ยังไม่ได้เลือก'}
      </p>
      <p className="text-meta">{NOTES.estimate} · ทุกราคาก่อน VAT ยกเว้นยอดรวมทั้งสิ้น</p>
    </div>
  );
}

export function QuoteWorkspace() {
  const hydrated = useHydrated();
  const { lines } = useCart();
  const titleId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  useLightWhilePrinting();

  if (!hydrated) return <WorkspaceSkeleton />;
  if (lines.length === 0) return <EmptyQuote />;

  return (
    <>
      <style>{PRINT_CSS}</style>
      <PrintHead />
      <div className={GRID}>
        <div className="flex min-w-0 flex-col gap-8">
          <QuoteLines titleId={`q${titleId}`} />
          <Card padding="lg" className="flex flex-col gap-5 print:hidden">
            <div className="flex items-start gap-4">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-soft text-brand">
                <Icon name="pin" size={22} />
              </span>
              <div className="flex min-w-0 flex-col gap-1">
                <h3 className="text-h3">พื้นที่หน้างาน</h3>
                <p className="text-small text-ink-2">ใช้คิดค่าเดินทาง เลือกแล้วยอดรวมอัปเดตให้ทันที</p>
              </div>
            </div>
            <AddressPicker id="quote-area" label="แขวง/ตำบล เขต/อำเภอ หรือรหัสไปรษณีย์" />
          </Card>
        </div>
        <aside aria-label="ยอดรวม" className="min-w-0 lg:-m-3 lg:p-3 lg:sticky lg:top-[calc(var(--spacing-header)+1.5rem)] lg:max-h-[calc(100dvh-var(--spacing-header)-3rem)] lg:overflow-y-auto lg:overscroll-contain print:static print:max-h-none print:overflow-visible">
          <QuoteTotals />
        </aside>
      </div>
    </>
  );
}
