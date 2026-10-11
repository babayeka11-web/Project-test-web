// One sector's story inside the tabs (server component): who it is for → the problems buyers name → what the company does
// (tagged by what the promise rests on) → a sample annual contract from the Pricebook → what volume changes (published rules
// only, no % discount) → a draft scope of work to copy. Everything arrives precomputed as props.
import type { ReactNode } from 'react';
import { Accordion, Badge, Card, Icon, Price } from '@/components/ui';
import { NOTES } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { PKG_TH } from '@/lib/domain/cleaning';
import { TRAVEL } from '@/lib/domain/travel';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { CopyTextButton } from './CopyTextButton';
import { LoadSampleButton } from './LoadSampleButton';
import {
  FILL_TOKENS,
  PROMISE_TH,
  splitTokens,
  type Sector,
  type SectorAddOn,
  type SectorSample,
  type VolumeBenefits,
} from './sectors';

/** A sentence with {min} {fee} {wallC1} filled from the domain layer; money tokens are real prices (ก่อน VAT). */
function Filled({ text, minBill }: { text: string; minBill: number }) {
  return (
    <>
      {splitTokens(text).map((p, i) =>
        typeof p === 'string' ? (
          <span key={i}>{p}</span>
        ) : p.token === 'wallC1' ? (
          <span key={i}>{FILL_TOKENS.wallC1(minBill)}</span>
        ) : (
          <Price key={i} amount={p.token === 'min' ? minBill : TRAVEL.baseFee} size="sm" className="text-ink" />
        ),
      )}
    </>
  );
}

function Tile({ icon, k, children, hint }: { icon: 'truck' | 'calendar' | 'users' | 'document' | 'tag' | 'shield'; k: string; children: ReactNode; hint: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-control border border-line bg-surface p-4">
      <p className="flex items-center gap-2 text-small font-semibold text-ink-2">
        <span className="grid size-8 place-items-center rounded-full bg-sky-soft text-brand">
          <Icon name={icon} size={18} />
        </span>
        {k}
      </p>
      <div className="font-display text-[1.375rem] font-bold leading-tight text-brand">{children}</div>
      <p className="text-meta text-ink-3">{hint}</p>
    </div>
  );
}

export type SectorPanelProps = {
  sector: Sector;
  sample: SectorSample;
  benefits: VolumeBenefits;
  scope: string;
  addOns: SectorAddOn[];
  minBill: number;
};

export function SectorPanel({ sector: s, sample: c, benefits: b, scope, addOns, minBill }: SectorPanelProps) {
  const br = c.branches > 1;
  const unitChips = c.est.lines.map(l => `${TYPE_BY_ID[l.type].th} ${l.n}`);
  const loadLabel = br ? `${s.th} 1 สาขา` : c.label;
  const scopeId = `scope-${s.id}`;
  return (
    <div className="flex flex-col gap-10">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-col gap-5">
          <div>
            <h3 className="text-h3">{s.th}</h3>
            <p className="mt-1 text-ink-2">เหมาะกับ {s.who}</p>
          </div>
          <ul className="flex flex-col gap-3">
            {s.pains.map(([pain, fix, kind]) => (
              <li key={pain} className="rounded-control border border-line bg-surface p-4 shadow-card">
                <p className="flex gap-2.5 font-semibold text-ink">
                  <Icon name="alert" size={20} className="mt-0.5 shrink-0 text-warn" />
                  <span>{pain}</span>
                </p>
                <p className="mt-2.5 flex gap-2.5 text-small text-ink-2">
                  <Icon name="check" size={20} className="mt-0.5 shrink-0 text-ok" />
                  <span>
                    <Filled text={fix} minBill={minBill} />
                  </span>
                </p>
                <Badge tone={kind === 'pkg' ? 'ok' : 'sky'} className="mt-3">
                  {PROMISE_TH[kind]}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="flex gap-2.5 text-small text-ink-2">
            <Icon name="clock" size={20} className="mt-0.5 shrink-0 text-sky" />
            <span>
              <strong className="text-ink">ช่วงเข้างาน</strong> {s.window}
            </span>
          </p>
        </div>

        <Card padding="lg" className="flex min-w-0 flex-col gap-5 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="text-h3">ตัวอย่างสัญญารายปี</h4>
              <p className="text-small text-ink-2">{c.label}</p>
            </div>
            <Badge tone="outline" icon="info">
              ราคาประมาณการ
            </Badge>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="เครื่องในตัวอย่าง">
            {unitChips.map(u => (
              <li key={u}>
                <Badge tone="sky" size="md">
                  {u}
                </Badge>
              </li>
            ))}
            {br && (
              <li>
                <Badge tone="brand" size="md">
                  × {c.branches} สาขา
                </Badge>
              </li>
            )}
          </ul>
          <div>
            <Price amount={c.annualEx} unit="/ ปี" size="xl" tone="brand" stacked />
            <p className="mt-1 text-small text-ink-2">
              {c.unitsAll} เครื่อง · {c.visits} ครั้ง/ปี (ทุก {c.every} เดือน) · {PKG_TH[c.pkg].th}
            </p>
            <p className="mt-1 text-small text-ink-2">
              VAT 7% {baht(c.vat)} · รวม VAT <strong className="text-ink">{baht(c.annualInc)}</strong>
              {br && <> · สาขาละ {baht(c.perSite)} ก่อน VAT</>}
            </p>
          </div>
          {addOns.length > 0 && (
            <div className="border-t border-line pt-4">
              <p className="mb-2 text-small font-semibold text-ink">งานเสริมที่องค์กรกลุ่มนี้มักใช้ (แยกรายการในใบเสนอราคา)</p>
              <ul className="flex flex-col gap-2">
                {addOns.map(a => (
                  <li key={a.key} className="flex items-start justify-between gap-3 text-small">
                    <span className="min-w-0 text-ink-2">{a.name}</span>
                    <span className="shrink-0 text-end font-semibold">
                      {a.ex === 'ooh' ? (
                        <span className="text-warn">มีค่าใช้จ่ายเพิ่มเติม</span>
                      ) : (
                        <Price amount={a.ex} vat={false} size="sm" fallback="ประเมินหน้างาน" unit={a.ex != null && a.unit ? `/ ${a.unit}` : undefined} />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-meta text-ink-3">ราคางานเสริมเป็นอัตรามาตรฐานก่อน VAT</p>
            </div>
          )}
          <LoadSampleButton units={c.units} visits={c.visits} pkg={c.pkg} size={c.size} label={loadLabel} note={br ? 'ตัวอย่างนี้เป็น 1 สาขา' : undefined} />
          <p className="text-meta text-ink-3">
            {NOTES.estimate}
            {b.special ? ` · ${NOTES.volume}` : ''}
          </p>
        </Card>
      </div>

      <section aria-labelledby={`vol-${s.id}`} className="rounded-card bg-surface-2 p-5 sm:p-8">
        <h4 id={`vol-${s.id}`} className="text-h3">
          ใช้บริการ {c.unitsAll} เครื่องในสัญญาเดียว ได้อะไรบ้าง
        </h4>
        <p className="mt-1 max-w-[46rem] text-small text-ink-2">
          คำนวณจากตัวอย่างนี้ด้วยกฎที่ประกาศบนเว็บ เทียบกับการเรียกช่างแยกทีละเครื่อง · ไม่ใช่ส่วนลด
        </p>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {b.travelAvoided > 0 && (
            <Tile icon="truck" k="ค่าเดินทางที่ไม่เกิดขึ้น" hint={`เรียกแยกทีละเครื่อง ${b.splitJobs.toLocaleString('en-US')} ครั้ง/ปี แต่ละงานต่ำกว่าขั้นต่ำ ${baht(minBill)} จึงมีค่าเดินทางทุกครั้ง · ในสัญญายอดต่อรอบถึงขั้นต่ำ (พื้นที่หลักในกรุงเทพฯ)`}>
              <Price amount={b.travelAvoided} prefix="≈" unit="/ ปี" size="lg" tone="brand" />
            </Tile>
          )}
          <Tile icon="calendar" k="เข้าพื้นที่" hint={`แทนการนัดช่าง ${b.splitJobs.toLocaleString('en-US')} ครั้ง${br ? ` · ${c.branches} สาขา สาขาละ ${c.visits} รอบ` : ''} · รู้วันเข้างานล่วงหน้าทั้งปี`}>
            {b.contractVisits} รอบ / ปี
          </Tile>
          <Tile
            icon="users"
            k="กำลังคนต่อรอบ"
            hint={b.teamDays > 1 ? `จัด 2 ทีมพร้อมกันเหลือ ≈ ${b.teamDays2} วัน · ทำทีละโซนให้พื้นที่อื่นใช้งานต่อได้` : 'จบในวันเดียว · ทำทีละโซนให้พื้นที่อื่นใช้งานต่อได้'}
          >
            ≈ {b.teamDays} ทีม-วัน{br ? ' / สาขา' : ''}
          </Tile>
          <Tile icon="document" k="หลักฐานการทำงาน" hint={`${b.reportKind} ทุกเครื่องทุกรอบ ลงนามรับงาน 3 ฝ่าย ใช้ตรวจรับงานและตอบฝ่ายจัดซื้อหรือผู้ตรวจสอบได้`}>
            {b.reports.toLocaleString('en-US')} ฉบับ / ปี
          </Tile>
          <Tile icon="tag" k="งบต่อเครื่อง" hint="อัตรามาตรฐานตั้งงบรายปีได้ล่วงหน้า · งานซ่อมแจ้งราคาให้อนุมัติก่อนทุกครั้ง">
            <Price amount={b.perUnitMonth} prefix="≈" unit="/ เดือน" size="lg" tone="brand" />
          </Tile>
          <Tile icon="shield" k="เงื่อนไขในแพ็กเกจ" hint={b.terms}>
            {PKG_TH[c.pkg].th}
          </Tile>
        </div>
        {b.special && <p className="mt-5 text-small text-ink-2">{NOTES.volume}</p>}
      </section>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-h3">ร่างขอบเขตงานสำหรับฝ่ายจัดซื้อ</h4>
            <p className="text-small text-ink-2">คัดลอกไปวางใน TOR หรือใบขอราคา ข้อที่ยังไม่ตกลงเว้นว่างไว้ให้กรอกตอนทำสัญญา</p>
          </div>
          <CopyTextButton targetId={scopeId} label="คัดลอกร่างขอบเขตงาน" done="คัดลอกร่างขอบเขตงานแล้ว วางในเอกสารจัดซื้อได้เลย" />
        </div>
        <Accordion
          variant="card"
          items={[
            {
              id: `scope-acc-${s.id}`,
              title: 'ดูร่างขอบเขตงาน',
              content: (
                <pre id={scopeId} className="whitespace-pre-wrap break-words font-sans text-small leading-relaxed text-ink-2">
                  {scope}
                </pre>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
