'use client';
// "แอร์เก่า ซ่อมหรือเปลี่ยนดี": the visitor describes the old unit → trade-in value range, repair estimate, a new Inverter unit
// of the same size after the trade-in, yearly electricity (estimate) and a rule-of-thumb verdict with its reasons.
// All prices come from the data the server passed in (logic.ts); nothing here reads the Pricebook.
import Link from 'next/link';
import { useId, useMemo, useState, type ReactNode } from 'react';
import { Accordion, Badge, Button, Card, Chip, Icon, Notice, Price, Select, Stepper, Table, toast } from '@/components/ui';
import { cart } from '@/lib/cart';
import { BTU_BANDS, emptyFilter, filterToParams } from '@/lib/domain/catalog';
import { NOTES } from '@/lib/domain/constants';
import { baht, btuFmt } from '@/lib/domain/format';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { TRADE_IN, TRADE_ISSUES, type TradeIssueId } from '@/lib/domain/tradein';
import { TRADE_QA, TRADE_STEPS } from './content';
import {
  AGES,
  DEFAULT_INPUT,
  ELECTRIC,
  REFS,
  SYSTEMS,
  TRADE_TYPES,
  clampInput,
  moveRate,
  sizesFor,
  tradeIn,
  type AgeId,
  type RefId,
  type RepairLine,
  type SystemId,
  type TradeInData,
  type TradeInput,
  type TradeType,
} from './logic';

const r100 = (n: number) => Math.round(n / 100) * 100;

const rangeText = (lo: number, hi: number) => `${baht(lo)}–${baht(hi).replace('฿', '')}`;

function ChipGroup<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: readonly { id: V; th: string }[]; onChange: (v: V) => void }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2.5">
      <span id={id} className="text-small font-semibold text-ink">
        {label}
      </span>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {options.map(o => (
          <Chip key={o.id} selected={o.id === value} onClick={() => onChange(o.id)}>
            {o.th}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function LineRow({ children, price, strong }: { children: ReactNode; price: ReactNode; strong?: boolean }) {
  return (
    <li className="flex items-start justify-between gap-4 border-b border-line py-2.5 text-small first:pt-0 last:border-b-0">
      <span className={strong ? 'font-medium text-ink' : 'text-ink-2'}>{children}</span>
      <span className="shrink-0 text-end">{price}</span>
    </li>
  );
}

const Rate = ({ line }: { line: RepairLine }) => <Price amount={line.ex} vat={false} size="sm" fallback="ประเมินหน้างาน" />;

export function TradeIn({ data }: { data: TradeInData }) {
  const uid = useId();
  const [input, setInput] = useState<TradeInput>(DEFAULT_INPUT);
  const set = (patch: Partial<TradeInput>) => setInput(prev => clampInput({ ...prev, ...patch }));

  const r = useMemo(() => tradeIn(input, data), [input, data]);
  const typeTh = TYPE_BY_ID[input.type].th;
  const q = r.q;
  const move = r.issue.id === 'reno' ? moveRate(input, data.moves) : null;

  const productsHref = useMemo(() => {
    const f = emptyFilter();
    f.type = new Set([input.type]);
    const band = BTU_BANDS.find(b => input.btu >= b.min && input.btu <= b.max);
    if (band) f.btu = new Set([band.id]);
    f.inverter = 'inv';
    return `/products/?${filterToParams(f)}`;
  }, [input.type, input.btu]);

  const requestAssessment = () => {
    cart.get().lines.filter(l => l.key === 'TI-REQ').forEach(l => cart.remove(l.id));
    const sys = SYSTEMS.find(s => s.id === input.sys)?.th;
    const ref = REFS.find(s => s.id === input.ref)?.th;
    cart.add({
      kind: 'survey',
      group: 'install',
      key: 'TI-REQ',
      name: `ขอประเมินมูลค่าเทิร์น แอร์เก่า ${q} เครื่อง`,
      detail: [
        `${typeTh} ${btuFmt(input.btu)}`,
        `อายุ ${r.age.th}`,
        sys && `ระบบ ${sys}`,
        ref && `น้ำยา ${ref}`,
        r.issue.th,
        r.trade ? `มูลค่าเทิร์นโดยประมาณ ${rangeText(r.trade.lo, r.trade.hi)} ต่อเครื่อง (ทีมยืนยันเมื่อตรวจเครื่อง)` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      unitEx: null,
      qty: 1,
      units: q,
    });
    toast('เพิ่มคำขอประเมินเทิร์นในใบเสนอราคาแล้ว', { tone: 'ok', action: { label: 'ดูใบเสนอราคา', href: '/quote/' } });
  };

  const S = r.set.stat;
  const tradeWord = r.trade ? (r.trade.working ? 'ใช้งานได้' : 'เสีย / ต้องซ่อม') : null;

  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:items-start xl:gap-10">
        {/* form */}
        <Card padding="lg" as="section" aria-labelledby={`${uid}-form`} className="flex flex-col gap-6">
          <h3 id={`${uid}-form`} className="text-h3">
            บอกเรื่องแอร์เครื่องเดิม
          </h3>
          <ChipGroup<AgeId> label="แอร์อายุเท่าไร" value={input.age} options={AGES} onChange={age => set({ age })} />
          <ChipGroup<TradeType>
            label="ประเภทแอร์"
            value={input.type}
            options={TRADE_TYPES.map(t => ({ id: t, th: TYPE_BY_ID[t].th }))}
            onChange={type => set({ type })}
          />
          <div className="flex flex-col gap-2">
            <label htmlFor={`${uid}-btu`} className="text-small font-semibold text-ink">
              ขนาดเครื่อง
            </label>
            <Select id={`${uid}-btu`} value={input.btu} onChange={e => set({ btu: +e.target.value })}>
              {sizesFor(input.type).map(b => (
                <option key={b} value={b}>
                  {btuFmt(b)}
                </option>
              ))}
            </Select>
          </div>
          <ChipGroup<SystemId> label="ระบบคอมเพรสเซอร์" value={input.sys} options={SYSTEMS} onChange={sys => set({ sys })} />
          <ChipGroup<RefId> label="น้ำยาแอร์ (ดูจากป้ายข้างเครื่อง)" value={input.ref} options={REFS} onChange={ref => set({ ref })} />
          <div className="flex flex-col gap-2">
            <label htmlFor={`${uid}-issue`} className="text-small font-semibold text-ink">
              ตอนนี้แอร์เป็นอย่างไร
            </label>
            <Select id={`${uid}-issue`} value={input.issue} onChange={e => set({ issue: e.target.value as TradeIssueId })}>
              {TRADE_ISSUES.map(i => (
                <option key={i.id} value={i.id}>
                  {i.th}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div className="flex flex-col gap-2">
              <span className="text-small font-semibold text-ink">จำนวนเครื่อง</span>
              <Stepper label="จำนวนเครื่อง" unit="เครื่อง" min={1} max={200} value={input.qty} onChange={qty => set({ qty })} />
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-small font-semibold text-ink">เปิดแอร์วันละ</span>
              <Stepper label="ชั่วโมงที่เปิดแอร์ต่อวัน" unit="ชม." min={1} max={24} value={input.hrs} onChange={hrs => set({ hrs })} />
            </div>
          </div>
        </Card>

        {/* results */}
        <div className="flex min-w-0 flex-col gap-6">
          <Notice tone={r.verdict === 'repair' || r.verdict === 'keep' ? 'ok' : 'info'} title={r.title} live="polite">
            <p>{r.sub}</p>
            {r.why.length > 0 && (
              <ul className="mt-3 grid gap-1.5 text-small text-ink-2">
                {r.why.map(w => (
                  <li key={w} className="flex gap-2">
                    <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-3" />
                    <span>{w}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-meta text-ink-3">หลักคิดเบื้องต้นจากอายุและอาการ ไม่ใช่การวินิจฉัย ทีมตรวจเครื่องจริงก่อนสรุปทุกครั้ง</p>
          </Notice>

          {!r.eligible && (
            <Notice tone="warn" size="sm" icon="info">
              โปรแกรมเทิร์นออกแบบมาสำหรับเครื่องอายุ {TRADE_IN.minAge} ปีขึ้นไป หรือเครื่องที่เสียหนัก เครื่องที่อายุน้อยกว่านี้ทีมประเมินเป็นรายกรณี
            </Notice>
          )}

          {r.trade && (
            <Card tone="sky" padding="lg" className="flex flex-col gap-3" aria-live="polite" aria-atomic="true">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-small font-semibold text-ink">มูลค่าเทิร์นเครื่องเดิมโดยประมาณ · ต่อเครื่อง</p>
                <Badge tone={r.trade.working ? 'ok' : 'warn'} size="sm" dot>
                  {tradeWord}
                </Badge>
                <Badge tone="outline" size="sm">
                  {r.trade.band}
                </Badge>
              </div>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <Price amount={r.trade.lo} vat={false} size="lg" tone="brand" />
                <span className="text-ink-2" aria-hidden>
                  –
                </span>
                <span className="sr-only">ถึง</span>
                <Price amount={r.trade.hi} size="lg" tone="brand" />
              </p>
              {q > 1 && (
                <p className="text-small text-ink-2">
                  รวม {q} เครื่อง {rangeText(r.trade.lo * q, r.trade.hi * q)} ก่อน VAT
                </p>
              )}
              <p className="text-small text-ink-2">หักจากใบเสนอราคาเครื่องใหม่พร้อมติดตั้งของบริษัท ไม่จ่ายเป็นเงินสด ทีมยืนยันมูลค่าจริงเมื่อตรวจเครื่อง</p>
              <p className="text-meta text-ink-3">{NOTES.estimate}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {/* repair */}
            <Card padding="lg" as="section" aria-labelledby={`${uid}-rep`} className={`flex flex-col gap-4 ${r.verdict === 'repair' || r.verdict === 'keep' ? 'ring-2 ring-brand' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 id={`${uid}-rep`} className="text-h3">
                  {r.issue.id === 'reno' ? 'ใช้เครื่องเดิมต่อ' : 'ซ่อมเครื่องเดิม'}
                </h3>
                {(r.verdict === 'repair' || r.verdict === 'keep') && <Badge tone="brand" size="sm">ตรงกับคำแนะนำ</Badge>}
              </div>
              {r.repair.lines.length > 0 ? (
                <>
                  <ul className="flex flex-col">
                    {r.repair.lines.map(l => (
                      <LineRow key={l.name} price={<Rate line={l} />}>
                        {l.name}
                      </LineRow>
                    ))}
                  </ul>
                  <div className="rounded-control bg-surface-2 p-4">
                    <p className="text-small text-ink-2">{r.repair.unknown ? 'ค่าซ่อมที่รู้ราคาแล้ว อย่างน้อย' : 'รวมค่าซ่อมโดยประมาณ'}</p>
                    <Price amount={r.repair.known * q} size="lg" tone="brand" />
                    {q > 1 && <span className="ms-2 text-small text-ink-2">({q} เครื่อง)</span>}
                    {r.repair.unknown > 0 && (
                      <p className="mt-1.5 text-meta text-ink-3">+ {r.repair.unknown} รายการที่ประเมินหน้างาน (ยังไม่มีราคามาตรฐาน เช่น ตัวอะไหล่หลัก)</p>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-small text-ink-2">
                  {r.issue.id === 'reno'
                    ? move?.ex != null
                      ? `ไม่มีงานซ่อม ถ้าต้องย้ายตำแหน่งตอนรีโนเวท ค่าย้ายแอร์ (รื้อ + ติดตั้งมาตรฐานจุดใหม่) ${baht(move.ex)} ก่อน VAT ต่อเครื่อง`
                      : 'ไม่มีงานซ่อม ถ้าต้องย้ายตำแหน่งตอนรีโนเวท ใช้บริการรื้อ ย้าย และติดตั้งใหม่ (ประเมินหน้างาน)'
                    : 'เริ่มจากค่าตรวจวินิจฉัย แล้วทีมแจ้งราคาซ่อมให้อนุมัติก่อน'}
                </p>
              )}
              <p className="mt-auto text-meta text-ink-3">ซ่อมทุกครั้งแจ้งราคาให้อนุมัติก่อน ไม่ซ่อมจนกว่าคุณตกลง</p>
            </Card>

            {/* new unit */}
            <Card padding="lg" as="section" aria-labelledby={`${uid}-new`} className={`flex flex-col gap-4 ${r.verdict === 'replace' ? 'ring-2 ring-brand' : ''}`}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 id={`${uid}-new`} className="text-h3">
                  เปลี่ยนเป็นเครื่องใหม่ (Inverter)
                </h3>
                {r.verdict === 'replace' && <Badge tone="brand" size="sm">ตรงกับคำแนะนำ</Badge>}
              </div>
              <ul className="flex flex-col">
                <LineRow price={S.med != null ? <Price amount={S.med} vat={false} size="sm" /> : <span className="text-small text-ink-2">สอบถามรุ่น</span>}>
                  เครื่องใหม่ {typeTh} {btuFmt(input.btu)}
                  {S.n > 0 && S.min != null && S.max != null && (
                    <span className="block text-meta text-ink-3">
                      ราคากลางจาก {S.n} รุ่นในเว็บ ช่วง {rangeText(S.min, S.max)}
                    </span>
                  )}
                </LineRow>
                {r.set.install && (
                  <LineRow price={<Price amount={r.set.install.ex} vat={false} size="sm" />}>{r.set.install.name}</LineRow>
                )}
                {r.set.out.map(l => (
                  <LineRow key={l.name} price={<Rate line={l} />}>
                    {l.name}
                  </LineRow>
                ))}
                {r.trade && (
                  <LineRow
                    strong
                    price={
                      <span className="font-semibold text-ok">
                        − {rangeText(r.trade.lo, r.trade.hi)}
                      </span>
                    }
                  >
                    มูลค่าเทิร์นเครื่องเดิม ({tradeWord}) หักจากใบเสนอราคา
                  </LineRow>
                )}
              </ul>
              {r.net && r.allEx != null ? (
                <div className="rounded-control bg-surface-2 p-4">
                  <p className="text-small text-ink-2">หลังหักมูลค่าเทิร์น ≈</p>
                  <p className="flex flex-wrap items-baseline gap-x-2">
                    <Price amount={r.net[0] * q} vat={false} size="lg" tone="brand" />
                    <span aria-hidden className="text-ink-2">
                      –
                    </span>
                    <span className="sr-only">ถึง</span>
                    <Price amount={r.net[1] * q} size="lg" tone="brand" />
                    {q > 1 && <span className="text-small text-ink-2">({q} เครื่อง)</span>}
                  </p>
                  <p className="mt-1.5 text-meta text-ink-3">
                    เครื่อง + ติดตั้งมาตรฐาน{r.set.outEx != null ? ' + รื้อเครื่องเดิม' : ''} ราคากลางของรุ่นในเว็บ ไม่รวมงานที่ประเมินหน้างาน
                  </p>
                </div>
              ) : (
                <Notice tone="info" size="sm">
                  ยังไม่มีรุ่น Inverter ขนาดนี้ในรายการ สอบถามรุ่นและราคากับทีมขาย
                </Notice>
              )}
              <p className="mt-auto text-meta text-ink-3">{NOTES.estimate}</p>
            </Card>
          </div>

          {/* electricity */}
          <Card padding="lg" as="section" aria-labelledby={`${uid}-elec`} className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <h3 id={`${uid}-elec`} className="text-h3">
                ค่าไฟโดยประมาณต่อปี
              </h3>
              <Badge tone="outline" size="sm" icon="info">
                ประมาณการ
              </Badge>
            </div>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-control bg-surface-2 p-4">
                <dt className="text-small text-ink-2">
                  เครื่องเดิม ({r.energy.oldInv ? 'Inverter' : 'Fixed speed'} อายุ {r.age.th})
                </dt>
                <dd>
                  <Price amount={r100(r.energy.old)} vat={false} size="lg" unit="/ ปี / เครื่อง" />
                </dd>
              </div>
              <div className="rounded-control bg-sky-soft p-4">
                <dt className="text-small text-ink-2">เครื่องใหม่ Inverter ขนาดเดียวกัน</dt>
                <dd>
                  <Price amount={r100(r.energy.now)} vat={false} size="lg" tone="brand" unit="/ ปี / เครื่อง" />
                </dd>
              </div>
            </dl>
            {r.energy.save > 0 && r100(r.energy.old) > r100(r.energy.now) && (
              <p className="text-small text-ink-2">
                {/* the difference of the two rounded figures above, so the numbers on screen add up */}
                ต่างกันราว {baht((r100(r.energy.old) - r100(r.energy.now)) * q)} ต่อปี{q > 1 ? ` (${q} เครื่อง)` : ''} ตามเงื่อนไขที่สมมติด้านล่าง
              </p>
            )}
            <p className="text-meta text-ink-3">
              {NOTES.estimate} · เปิดวันละ {r.energy.hrs} ชม. · ค่าไฟ {ELECTRIC.rate} บาทต่อหน่วย · สมมติประสิทธิภาพลดลงราว 1% ต่อปีหลังปีที่ 3 · ไม่ใช่การรับประกันค่าไฟ
            </p>
          </Card>

          {r.special && <Notice tone="info" size="sm">{NOTES.volume}</Notice>}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" icon="quote" onClick={requestAssessment}>
              ขอประเมินมูลค่าเทิร์น
            </Button>
            <Button variant="soft" href={productsHref} iconEnd="arrow-right">
              ดูเครื่องใหม่ขนาดเดียวกัน
            </Button>
          </div>
        </div>
      </div>

      {/* process, values and questions */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
        <div className="flex flex-col gap-6">
          <h3 className="text-h3">ขั้นตอนเทิร์นแอร์เก่า</h3>
          <ol className="flex flex-col">
            {TRADE_STEPS.map((s, i) => (
              <li key={s.t} className="group relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 pb-6 last:pb-0">
                <span aria-hidden className="absolute left-5 top-11 bottom-0 w-px bg-line group-last:hidden" />
                <span aria-hidden className="z-10 grid size-10 place-items-center rounded-full bg-sky-soft font-display text-small font-bold text-brand tabular-nums">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-ink">
                    <span className="sr-only">ขั้นที่ {i + 1} </span>
                    {s.t}
                  </p>
                  <p className="mt-0.5 text-small text-ink-2">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/contact/" className="inline-flex min-h-11 items-center gap-2 text-small font-medium text-brand underline underline-offset-4">
            <Icon name="chat" size={18} />
            ถามทีมก่อนเทิร์น
          </Link>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <h3 className="text-h3">ตารางมูลค่าเทิร์นและเงื่อนไข</h3>
          <Table
            caption="มูลค่าเทิร์นต่อเครื่อง (บาท) ตามขนาดเครื่องเดิม"
            showCaption
            minWidth="20rem"
            columns={[
              { key: 'size', label: 'ขนาดเครื่องเดิม', rowHeader: true },
              { key: 'ok', label: 'ใช้งานได้', align: 'end', numeric: true },
              { key: 'bad', label: 'เสีย / ต้องซ่อม', align: 'end', numeric: true },
            ]}
            rows={TRADE_IN.table.map(t => ({
              id: t.th,
              size: r.trade?.band === t.th ? <strong>{t.th}</strong> : t.th,
              ok: rangeText(t.ok[0], t.ok[1]),
              bad: rangeText(t.bad[0], t.bad[1]),
            }))}
            footnote="บาทต่อเครื่อง หักจากใบเสนอราคา ไม่จ่ายเป็นเงินสด · ยืนยันเมื่อทีมตรวจเครื่อง"
          />
          <ul className="grid gap-2.5 text-small text-ink-2">
            {TRADE_IN.terms.map(t => (
              <li key={t} className="flex gap-2.5">
                <Icon name="check" size={18} strokeWidth={2.25} className="mt-0.5 shrink-0 text-ok" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <h3 className="text-h3">คำถามก่อนเทิร์น</h3>
        <Accordion name="tradein-qa" items={TRADE_QA.map(x => ({ title: x.q, content: <p>{x.a}</p> }))} />
      </div>
    </div>
  );
}
