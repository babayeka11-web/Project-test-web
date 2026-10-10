'use client';
// "เลือกอาการที่พบ" — the repair triage. Pick a symptom (or describe it in your own words), see whether it can be normal,
// what the owner can safely check, answer a few quick questions and read the likely faulty points with the standard
// Pricebook repair lines. Nothing here promises a fix: the result is a first estimate the technician confirms on site.
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, Checkbox, Field, Fieldset, Icon, Input, Notice, Price, Radio, toast, type IconName } from '@/components/ui';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { cart, useCart, type CartLineInput } from '@/lib/cart';
import { COMPANY, lineMessageUrl } from '@/lib/domain/company';
import { NOTES } from '@/lib/domain/constants';
import { repairLine } from '@/lib/domain/install';
import {
  CARE_NOTE,
  CLEAN_FIRST,
  NORMAL_NOTE,
  PREPARE,
  SAFETY,
  STOP_NOW,
  SYMPTOMS,
  diagLine,
  diagnose,
  matchSymptoms,
  questionsFor,
  relatedJobs,
  shortCause,
  symptom,
  type Answers,
  type DiagCause,
  type RepairRow,
  type Symptom,
  type SymptomId,
} from './diag';
import { Disclosure } from './Disclosure';

const SYMPTOM_ICON: Record<SymptomId, IconName> = {
  warm: 'thermometer',
  drip: 'droplet',
  ice: 'snowflake',
  dead: 'monitor',
  code: 'alert',
  trip: 'bolt',
  cycle: 'clock',
  noise: 'wind',
  smell: 'leaf',
  weak: 'wind',
  swing: 'sliders',
  cduwater: 'droplet',
  bill: 'tag',
  care: 'sparkle',
};

/* ---------- the whole checker ---------- */

export function SymptomChecker({ rows }: { rows: RepairRow[] }) {
  const [symId, setSymId] = useState<SymptomId | null>(null);
  const s = symptom(symId);
  const gridId = useId();
  const [text, setText] = useState('');
  const matches = useMemo(() => matchSymptoms(text, 2), [text]);
  const typed = text.trim().length >= 2;

  const pick = (id: SymptomId) => setSymId(id);
  const submitText = (e: FormEvent) => {
    e.preventDefault();
    if (matches[0]) pick(matches[0].id);
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <Notice tone="warn" size="sm" icon="alert" title="หยุดใช้เครื่องก่อน แล้วโทรหาทีม ถ้าเป็นแบบนี้">
        <ul className="mt-1 grid gap-1 sm:grid-cols-3 sm:gap-4">
          {STOP_NOW.map(t => (
            <li key={t} className="flex gap-2">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-warn" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          ปิดเครื่องและปิดเบรกเกอร์แอร์ แล้วโทร{' '}
          <a href={COMPANY.telHref} className="font-semibold text-brand underline underline-offset-2">
            {COMPANY.tel}
          </a>
        </p>
      </Notice>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,27rem)_minmax(0,1fr)] lg:items-start lg:gap-10">
        <div className="flex min-w-0 flex-col gap-6">
          <div role="group" aria-labelledby={`${gridId}-label`} className="flex flex-col gap-3">
            <p id={`${gridId}-label`} className="text-small font-semibold text-ink">
              อาการที่พบ
            </p>
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-2">
              {SYMPTOMS.map(item => {
                const on = item.id === symId;
                return (
                  <li key={item.id} className="min-w-0">
                    <button
                      type="button"
                      aria-pressed={on}
                      onClick={() => pick(item.id)}
                      className="pressable flex h-full min-h-[4.75rem] w-full flex-col items-start gap-2.5 rounded-control border border-line bg-surface p-3.5 text-left shadow-card transition-[border-color,background-color,box-shadow] sm:flex-row sm:gap-3 duration-150 ease-air hover:border-sky/60 aria-pressed:border-brand aria-pressed:bg-sky-soft aria-pressed:ring-1 aria-pressed:ring-brand"
                    >
                      <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-sky-soft text-brand">
                        <Icon name={SYMPTOM_ICON[item.id]} size={22} />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold leading-snug text-ink">{item.short}</span>
                        <span className="mt-0.5 block text-meta text-ink-3">{item.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          <form onSubmit={submitText} className="flex flex-col gap-3 rounded-card border border-line bg-surface-2 p-4 sm:p-5">
            <Field
              label="เล่าอาการเอง"
              hint="พิมพ์สั้น ๆ เช่น น้ำหยด เสียงดัง ไม่เย็น แล้วเลือกอาการที่ตรงที่สุด"
            >
              <Input
                name="symptom-text"
                type="search"
                inputMode="search"
                autoComplete="off"
                icon="search"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="เช่น แอร์น้ำหยด มีกลิ่นอับ"
              />
            </Field>
            <div aria-live="polite" className="flex flex-col gap-2">
              {typed && matches.length > 0 && (
                <>
                  <p className="text-small text-ink-2">น่าจะตรงกับอาการ</p>
                  <div className="flex flex-wrap gap-2">
                    {matches.map((m, i) => (
                      <Button key={m.id} type="button" size="sm" variant={i === 0 ? 'secondary' : 'soft'} icon={SYMPTOM_ICON[m.id]} onClick={() => pick(m.id)}>
                        {m.short}
                      </Button>
                    ))}
                  </div>
                </>
              )}
              {typed && matches.length === 0 && (
                <p className="text-small text-ink-2">
                  ยังไม่พบอาการที่ตรงกัน ลองใช้คำสั้น ๆ หรือเลือกจากรายการด้านบน หรือ{' '}
                  <a
                    href={lineMessageUrl(`อาการแอร์: ${text.trim()}`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-brand underline underline-offset-2"
                  >
                    ส่งอาการให้ทีมดูทาง LINE<span className="sr-only"> (เปิดหน้าต่างใหม่)</span>
                  </a>
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="min-w-0">
          {s ? <SymptomPanel key={s.id} s={s} rows={rows} /> : <EmptyPanel />}
        </div>
      </div>
    </div>
  );
}

function EmptyPanel() {
  const points: { icon: IconName; t: string }[] = [
    { icon: 'info', t: 'อาการนี้เป็นปกติของเครื่องหรือไม่' },
    { icon: 'shield', t: 'เช็กเองอย่างปลอดภัยได้อย่างไร โดยไม่เปิดชิ้นส่วนไฟฟ้า' },
    { icon: 'repair', t: 'ช่างน่าจะตรวจจุดไหน และงานซ่อมที่เกี่ยวข้อง' },
    { icon: 'tag', t: 'ค่าตรวจและค่าซ่อมมาตรฐาน ก่อน VAT' },
  ];
  return (
    <Card tone="soft" padding="lg" className="hidden lg:block">
      <div className="flex flex-col gap-5">
        <span className="grid size-14 place-items-center rounded-2xl bg-surface text-brand shadow-card">
          <Icon name="repair" size={28} />
        </span>
        <h3 className="text-h3">เลือกอาการทางซ้าย แล้วดูผลทันที</h3>
        <ul className="grid gap-3">
          {points.map(p => (
            <li key={p.t} className="flex gap-3 text-ink-2">
              <Icon name={p.icon} size={20} className="mt-1 text-sky" />
              <span>{p.t}</span>
            </li>
          ))}
        </ul>
        <p className="text-meta text-ink-3">ผลประเมินเบื้องต้นจากอาการ ช่างยืนยันหน้างานก่อนซ่อม</p>
      </div>
    </Card>
  );
}

/* ---------- one symptom: normal? · safe checks · questions · result ---------- */

function SymptomPanel({ s, rows }: { s: Symptom; rows: RepairRow[] }) {
  const router = useRouter();
  const uid = useId();
  const { lines: cartLines } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [picked, setPicked] = useState<readonly string[]>([]);

  // Opening a symptom moves focus to its title; on phones the panel sits below the tiles, so bring it into view.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 1023px)').matches) {
      const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      panelRef.current?.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    }
  }, []);

  const isCare = s.id === 'care';
  const qs = questionsFor(s);
  const d = useMemo(() => diagnose(s.id, answers, rows), [s.id, answers, rows]);
  const jobs = useMemo(() => (d && !isCare ? relatedJobs(d) : []), [d, isCare]);
  const answeredCount = qs.filter(q => answers[q.id] != null).length;
  const setAnswer = (id: string, v: string) => setAnswers(a => ({ ...a, [id]: v }));
  const togglePick = (name: string) => setPicked(p => (p.includes(name) ? p.filter(x => x !== name) : [...p, name]));

  const diag = !isCare && d ? diagLine(d.type, rows) : null;
  const chosen = jobs.filter(j => picked.includes(j.name));
  const detail = `จากอาการ: ${s.short}`;
  const lines: CartLineInput[] = [
    ...(diag ? [{ ...repairLine(diag), detail }] : []),
    ...chosen.map(j => ({ ...repairLine(j), detail })),
  ];
  const inQuote = new Set(cartLines.map(l => l.key));
  const fresh = lines.filter(l => !inQuote.has(l.key));
  const sumEx = lines.reduce((n, l) => n + (l.unitEx ?? 0), 0);
  const assessed = lines.filter(l => l.unitEx == null).length;

  if (!d) return null;
  const top = d.top;
  const topNormal = d.answered && top?.id === 'normal';

  const book = () => {
    if (fresh.length) {
      cart.addMany(fresh);
      toast('เพิ่มในใบเสนอราคาแล้ว', { tone: 'ok' });
    }
    router.push('/quote/#request');
  };
  const lineHref = lineMessageUrl(d.summary);

  return (
    <Card padding="md" className="flex flex-col gap-8">
      <div ref={panelRef} className="scroll-mt-header flex flex-col gap-2">
        <p className="text-meta font-medium text-ink-3">อาการที่เลือก</p>
        <h3 ref={headingRef} tabIndex={-1} className="text-h3 outline-none">
          {s.th}
        </h3>
      </div>

      {s.normal.length > 0 && (
        <Notice tone="info" icon="info" title="อาการนี้อาจไม่ใช่ความเสีย">
          <ul className="mt-1 grid gap-1.5">
            {s.normal.map(t => (
              <li key={t} className="flex gap-2">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </Notice>
      )}

      <section aria-labelledby={`${uid}-diy`} className="flex flex-col gap-3">
        <h4 id={`${uid}-diy`} className="text-body font-semibold">
          {isCare ? 'แนวทางดูแลแอร์' : 'เช็กเองได้อย่างปลอดภัย'}
        </h4>
        <ul className="grid gap-2.5">
          {s.diy.map(t => (
            <li key={t} className="flex gap-3">
              <span aria-hidden className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-ok-soft text-ok">
                <Icon name="check" size={14} strokeWidth={2.5} />
              </span>
              <span className="text-ink-2">{t}</span>
            </li>
          ))}
        </ul>
        <Notice tone="warn" size="sm" icon="shield">
          {SAFETY}
        </Notice>
      </section>

      {isCare ? (
        <div className="flex flex-col gap-4">
          <Notice tone="info" icon="sparkle">
            {CARE_NOTE}
          </Notice>
          <div className="flex flex-wrap gap-3">
            <Button href="/cleaning/#book" icon="clean">
              จองล้างแอร์
            </Button>
            <Button href={lineHref} variant="ghost" icon="chat">
              ถามทีมทาง LINE
            </Button>
          </div>
        </div>
      ) : (
        <>
          <section aria-labelledby={`${uid}-q`} className="flex flex-col gap-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h4 id={`${uid}-q`} className="text-body font-semibold">
                ตอบคำถามสั้น ๆ <span className="text-small font-normal text-ink-3">ข้ามข้อที่ไม่แน่ใจได้</span>
              </h4>
              <div className="flex items-center gap-3">
                <span aria-live="polite" className="text-meta tabular-nums text-ink-3">
                  ตอบแล้ว {answeredCount} จาก {qs.length} ข้อ
                </span>
                {answeredCount > 0 && (
                  <Button type="button" variant="quiet" size="sm" onClick={() => setAnswers({})}>
                    ล้างคำตอบ
                  </Button>
                )}
              </div>
            </div>
            {qs.map(q => (
              <Fieldset key={q.id} legend={q.th}>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {q.opts.map(o => (
                    <Radio
                      key={o[0]}
                      variant="card"
                      name={`${uid}-${q.id}`}
                      value={o[0]}
                      checked={answers[q.id] === o[0]}
                      onChange={() => setAnswer(q.id, o[0])}
                      label={o[1]}
                    />
                  ))}
                </div>
              </Fieldset>
            ))}
          </section>

          <section aria-labelledby={`${uid}-r`} className="-mx-2 flex flex-col gap-5 rounded-card bg-surface-2 p-3 sm:mx-0 sm:p-6">
            <div className="flex flex-col gap-1">
              <h4 id={`${uid}-r`} className="text-body font-semibold">
                {d.answered ? 'จุดที่น่าจะเป็น' : 'จุดที่พบบ่อยของอาการนี้'}
              </h4>
              <p className="text-small text-ink-2">
                {d.answered ? 'เรียงจากที่เป็นไปได้มากที่สุด ตามคำตอบของคุณ' : 'ยังไม่ได้ตอบคำถาม ตอบด้านบนเพื่อให้ผลแคบลง'}
              </p>
              <p className="sr-only" aria-live="polite">
                {d.answered && top ? `ผลอัปเดตแล้ว จุดที่น่าจะเป็นอันดับแรก ${shortCause(top.th)}` : ''}
              </p>
            </div>

            {d.urgent && (
              <Notice tone="bad" icon="alert" title="อาการนี้เกี่ยวกับไฟฟ้า หยุดใช้เครื่องก่อน">
                ปิดเครื่องและปิดเบรกเกอร์ แล้วโทรหาทีมก่อนเปิดใช้อีกครั้ง
              </Notice>
            )}
            {topNormal && (
              <Notice tone="ok" icon="check">
                {NORMAL_NOTE}
              </Notice>
            )}

            <ol className="grid gap-3">
              {d.causes.map((c, i) => (
                <CauseItem key={c.id} c={c} index={i} lead={d.answered && i === 0 && c.score > 0} />
              ))}
            </ol>

            {d.clean && !topNormal && (
              <Notice
                tone="info"
                icon="sparkle"
                action={
                  <Button href="/cleaning/#book" variant="soft" size="sm" icon="clean">
                    ดูราคาล้างแอร์
                  </Button>
                }
              >
                {CLEAN_FIRST}
              </Notice>
            )}

            {diag && (
              <div className="flex flex-col gap-5">
                {jobs.length > 0 ? (
                  <Fieldset
                    legend="งานซ่อมที่เกี่ยวข้อง ราคามาตรฐาน"
                    hint="ติ๊กเพื่อใส่ในใบเสนอราคาล่วงหน้า หรือไม่ติ๊กก็ได้ ช่างตรวจแล้วแจ้งราคาให้อนุมัติก่อนซ่อมทุกครั้ง"
                  >
                    {jobs.map(j => (
                      <Checkbox
                        key={j.name}
                        variant="card"
                        checked={picked.includes(j.name)}
                        onChange={() => togglePick(j.name)}
                        label={j.name}
                        description={j.unit ? `คิดต่อ${j.unit}` : undefined}
                        aside={<Price amount={j.ex} size="sm" stacked />}
                      />
                    ))}
                  </Fieldset>
                ) : (
                  <p className="text-small text-ink-2">
                    ยังไม่ต้องเลือกงานซ่อม ช่างตรวจหน้างานก่อน แล้วแจ้งรายการและราคาให้อนุมัติ
                  </p>
                )}

                <div className="flex flex-col gap-3 rounded-control border border-line bg-surface p-4 shadow-card sm:p-5">
                  <dl className="grid gap-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <dt className="min-w-0 text-small text-ink-2">
                        <span className="font-medium text-ink">ค่าตรวจวินิจฉัย</span>
                        <span className="block text-meta text-ink-3">{diag.name.replace(/^ตรวจวินิจฉัย/, '')}</span>
                      </dt>
                      <dd className="shrink-0">
                        <Price amount={diag.ex} size="sm" vat={false} />
                      </dd>
                    </div>
                    {chosen.map(j => (
                      <div key={j.name} className="flex items-baseline justify-between gap-4">
                        <dt className="min-w-0 text-small text-ink-2">{j.name}</dt>
                        <dd className="shrink-0">
                          <Price amount={j.ex} size="sm" vat={false} />
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-line pt-3" aria-live="polite">
                    <span className="font-medium text-ink">รวมที่เลือก</span>
                    <Price amount={sumEx} size="lg" tone="brand" />
                  </div>
                  <p className="text-meta text-ink-3">
                    {NOTES.estimate}
                    {assessed > 0 ? ` · มี ${assessed} รายการประเมินหน้างาน` : ''}
                  </p>
                  {d.type == null && (
                    <p className="text-meta text-ink-3">ยังไม่ได้เลือกประเภทแอร์ จึงใช้ค่าตรวจแอร์ติดผนัง ตอบข้อประเภทแอร์ด้านบนเพื่อให้ตรงกับเครื่องของคุณ</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button type="button" icon="calendar" onClick={book}>
                    จองช่าง
                  </Button>
                  <AddToQuote
                    lines={() => fresh}
                    label={fresh.length === 0 ? 'อยู่ในใบเสนอราคาแล้ว' : 'ใส่ใบเสนอราคา'}
                    disabled={fresh.length === 0}
                  />
                  <Button href={lineHref} variant="quiet" icon="chat">
                    ส่งอาการทาง LINE
                  </Button>
                </div>
              </div>
            )}

            <Notice tone="info" size="sm" icon="info">
              ผลประเมินเบื้องต้นจากอาการ ช่างยืนยันหน้างานก่อนซ่อม และไม่ซ่อมก่อนลูกค้าอนุมัติราคา
            </Notice>

            <Disclosure title="ถ่ายรูปหรือวิดีโอไว้ ช่างเตรียมตัวได้ตรงขึ้น">
              <ul className="grid gap-2 text-small text-ink-2">
                {PREPARE.map(t => (
                  <li key={t} className="flex gap-2.5">
                    <Icon name="camera" size={18} className="mt-1 text-sky" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Disclosure>
          </section>
        </>
      )}
    </Card>
  );
}

function CauseItem({ c, index, lead }: { c: DiagCause; index: number; lead: boolean }) {
  const title = shortCause(c.th);
  const more = c.th.slice(title.length).replace(/^\s*\(|\)\s*$/g, '').trim();
  return (
    <li className="flex gap-3 rounded-control bg-surface p-4 shadow-card">
      <span
        aria-hidden
        className="grid size-8 shrink-0 place-items-center rounded-full bg-sky-soft text-small font-semibold tabular-nums text-brand"
      >
        {index + 1}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="min-w-0 font-semibold leading-snug text-ink">{title}</p>
          {lead && <Badge tone="sky">น่าจะเป็นมากที่สุด</Badge>}
          {c.urgent && <Badge tone="bad" icon="alert">เร่งด่วน</Badge>}
        </div>
        {more && <p className="text-small text-ink-2">{more}</p>}
        <p className="text-small text-ink-2">
          <span className="font-medium text-ink">ช่างจะตรวจ</span> {c.check}
        </p>
        {c.team !== '—' && (
          <p className="text-meta text-ink-3">
            งานที่เตรียม: <span className="font-medium text-ink-2">{c.team}</span>
          </p>
        )}
      </div>
    </li>
  );
}
