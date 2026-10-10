'use client';
// 12-month plan for the visits per year chosen in the calculator: which months the crew comes, which round is the deep
// clean (C2), what each round costs and what the year adds up to. The order is an example (port of planMonths in the
// reference annualplan.js) — the team agrees the real dates with the building. Same estimate as the calculator.
import { useId } from 'react';
import { Badge, Icon, Notice, Price, SegmentedControl } from '@/components/ui';
import { NOTES } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { LEVEL_TH } from '@/lib/domain/cleaning';
import { useContract } from './ContractProvider';
import { asVisits, contractStore } from './contract-store';
import { everyMonths, reportKindOf } from './sectors';
import './business.css';

const MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'] as const;
const MONTHS_FULL = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'] as const;
/** Thai Meteorological Department seasons, in months from 1 Jan */
const SEASONS = [
  { th: 'หนาว', a: 0, b: 1.5, cls: 'bg-sky-soft text-brand' },
  { th: 'ร้อน', a: 1.5, b: 4.5, cls: 'bg-warn-soft text-warn' },
  { th: 'ฝน', a: 4.5, b: 9.5, cls: 'bg-surface-2 text-ink-2' },
  { th: 'หนาว', a: 9.5, b: 12, cls: 'bg-sky-soft text-brand' },
] as const;

/** Example months (0 = January) for n visits a year; the first round is the deep clean when there is one. */
const MONTHS_BY_VISITS: Record<number, number[]> = { 2: [1, 7], 3: [1, 5, 9], 4: [0, 3, 6, 9] };

const VISIT_OPTIONS = [2, 3, 4].map(n => ({ value: String(n), label: `${n} ครั้ง`, hint: `ทุก ${everyMonths(n)} เดือน` }));

export function YearPlan() {
  const { state, est } = useContract();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const months = MONTHS_BY_VISITS[state.visits] ?? MONTHS_BY_VISITS[3];
  const rounds = months.map((m, i) => {
    const deep = state.deep && i === 0;
    return { m, i, deep, ex: est ? (deep ? est.perVisitC2 : est.perVisitC1) : null };
  });
  let acc = 0;
  const cumulative = rounds.map(r => (acc += r.ex ?? 0));
  const byMonth = new Map(rounds.map(r => [r.m, r]));
  const report = reportKindOf(state.pkg);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:min-w-[22rem]">
          <p id={`${uid}-v`} className="text-small font-semibold text-ink">
            ล้างปีละกี่ครั้ง
          </p>
          <SegmentedControl labelledBy={`${uid}-v`} fullWidth options={VISIT_OPTIONS} value={String(state.visits)} onChange={v => contractStore.set({ visits: asVisits(Number(v)) })} />
        </div>
        <Badge tone="outline" icon="info" className="self-start sm:self-auto">
          {NOTES.simulation}
        </Badge>
      </div>

      <div className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-6">
        {/* decorative: the list below carries the same information for screen readers */}
        <div aria-hidden>
          <div className="relative mb-3 hidden h-7 overflow-hidden rounded-full md:block">
            {SEASONS.map(s => (
              <span
                key={`${s.th}-${s.a}`}
                className={`absolute inset-y-0 grid place-items-center text-meta font-semibold ${s.cls}`}
                style={{ left: `${(s.a / 12) * 100}%`, width: `${((s.b - s.a) / 12) * 100}%` }}
              >
                {s.th}
              </span>
            ))}
          </div>
          <ol key={`${state.visits}-${state.deep}`} className="grid grid-cols-6 gap-y-6 md:grid-cols-12 md:gap-y-0">
            {MONTHS_SHORT.map((name, m) => {
              const r = byMonth.get(m);
              return (
                <li key={name} className="yp-cell flex flex-col items-center gap-1.5" style={{ ['--i' as string]: m }}>
                  <span className="grid size-10 place-items-center">
                    {r ? (
                      <span
                        className={`yp-node grid size-10 place-items-center rounded-full ${r.deep ? 'bg-brand text-on-brand shadow-lift' : 'bg-sky-soft text-brand ring-1 ring-sky/40'}`}
                        style={{ ['--i' as string]: r.i }}
                      >
                        <Icon name={r.deep ? 'sparkle' : 'clean'} size={20} />
                      </span>
                    ) : (
                      <span className="size-2.5 rounded-full border-2 border-line-strong bg-surface" />
                    )}
                  </span>
                  <span className={`text-meta ${r ? 'font-semibold text-ink' : 'text-ink-3'}`}>{name}</span>
                  <span className="h-4 text-meta font-semibold text-brand">
                    {r && (
                      <>
                        <span className="md:hidden">{r.deep ? 'C2' : 'C1'}</span>
                        <span className="hidden md:inline">{r.deep ? 'ล้างใหญ่' : 'ล้างปกติ'}</span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <ol aria-label="รอบล้างตลอดปี" className="mt-6 grid grid-cols-1 gap-3 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(13rem,1fr))]">
          {rounds.map(r => (
            <li key={r.i} className="flex flex-col gap-2 rounded-control bg-surface-2 p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-small font-semibold text-ink">
                  รอบที่ {r.i + 1} · {MONTHS_FULL[r.m]}
                </span>
                <Badge tone={r.deep ? 'brand' : 'sky'}>{r.deep ? 'ล้างใหญ่ C2' : 'ล้างปกติ C1'}</Badge>
              </div>
              {r.ex != null ? <Price amount={r.ex} unit="/ รอบ" size="md" /> : <span className="text-small text-ink-3">ใส่จำนวนเครื่องเพื่อดูงบ</span>}
              <p className="text-meta text-ink-3">
                ส่งมอบ {report}
                {r.deep ? ` · ${LEVEL_TH.C2.th}ก่อนหน้าร้อน` : ''}
              </p>
              {r.ex != null && <p className="text-meta text-ink-2">สะสมถึงรอบนี้ {baht(cumulative[r.i])}</p>}
            </li>
          ))}
        </ol>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
          <p className="text-small text-ink-2">
            {est ? `${est.count} เครื่อง · ${state.pkg} · ราคาก่อน VAT` : 'ยังไม่ได้ใส่จำนวนเครื่องในเครื่องคำนวณ'}
          </p>
          {est && (
            <p aria-live="polite" className="text-small text-ink-2">
              รวมทั้งปี <Price amount={est.annualEx} size="lg" tone="brand" className="ms-1 align-middle" />
            </p>
          )}
        </div>
      </div>

      <Notice size="sm" tone="info">
        ลำดับเดือนเป็นตัวอย่าง ทีมวางวันจริงร่วมกับอาคารของคุณ ตามเวลาที่เข้าพื้นที่ได้ ปิดภาคเรียน หรือหยุดไลน์ผลิต
      </Notice>
    </div>
  );
}
