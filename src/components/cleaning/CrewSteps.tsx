'use client';
// "ช่างทำอะไรบ้าง": the steps of one cleaning visit as a numbered timeline. The customer picks the air-con type, the
// method (ล้างปกติ / ล้างใหญ่) and the package; the list is built by cleanSteps() from the company's cleaning form.
// Measured values are examples of what is written in the report ('ตัวอย่างการบันทึก'), never a pass / fail line.
import { useMemo, useState } from 'react';
import { TypeArt } from '@/components/shared/TypeArt';
import { Badge, Card, Icon, SegmentedControl, cn } from '@/components/ui';
import { LEVEL_TH, PKG_INFO, PKG_TH, QUICK_PKGS, type CleanLevel, type CleanPkgId } from '@/lib/domain/cleaning';
import { JOB_TIME, TIME_NOTE, timeTh } from '@/lib/domain/content';
import { CLEAN_FORM, CLEAN_HOW, PHASE_ORDER, PHASES, STEP_TYPES, cleanSteps, type CleanStep, type StepType } from './steps';

const LEVELS: readonly CleanLevel[] = ['C1', 'C2'];

function Detail({ s, type }: { s: CleanStep; type: StepType }) {
  const how = CLEAN_HOW[type][s.id];
  if (!how && !s.chk) return null;
  return (
    <details className="group mt-2">
      <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 rounded-full text-small font-medium text-brand marker:hidden [&::-webkit-details-marker]:hidden">
        <span className="group-open:hidden">ดูรายละเอียด</span>
        <span className="hidden group-open:inline">ซ่อนรายละเอียด</span>
        <Icon name="chevron-down" size={16} className="transition-transform duration-250 ease-air group-open:rotate-180" />
      </summary>
      <div className="grid grid-cols-1 gap-3 rounded-control bg-surface-2 p-4">
        {how && (
          <p className="text-small text-ink-2">
            <span className="font-semibold text-ink">ที่แอร์ชนิดนี้ </span>
            {how}
          </p>
        )}
        {s.chk && (
          <div>
            <p className="mb-2 text-meta font-semibold text-ink-2">{s.chkTh ?? 'รายการตรวจ'}</p>
            <ul className="flex flex-wrap gap-2">
              {s.chk.map(c => (
                <li key={c} className="rounded-full border border-line bg-surface px-3 py-1 text-meta text-ink">
                  {c}
                </li>
              ))}
            </ul>
            {s.chkTh === 'ตัวอย่างการบันทึก' && (
              <p className="mt-2 text-meta text-ink-3">ช่างจดค่าที่วัดได้ลงรายงาน ใช้ดูแนวโน้มของเครื่อง ไม่ใช่เกณฑ์ผ่านหรือไม่ผ่าน</p>
            )}
          </div>
        )}
      </div>
    </details>
  );
}

export function CrewSteps() {
  const [type, setType] = useState<StepType>('wall');
  const [level, setLevel] = useState<CleanLevel>('C1');
  const [pkg, setPkg] = useState<CleanPkgId>('Basic Clean');

  const steps = useMemo(() => cleanSteps(type, level, pkg), [type, level, pkg]);
  const groups = useMemo(() => {
    let n = 0;
    return PHASE_ORDER.map(ph => ({
      ph,
      items: steps.filter(s => s.ph === ph).map(s => ({ s, n: s.off ? 0 : ++n })),
    })).filter(g => g.items.length);
  }, [steps]);
  const total = steps.filter(s => !s.off).length;
  const typeInfo = STEP_TYPES.find(t => t.id === type)!;
  const time = JOB_TIME[level][type];
  const docs = PKG_INFO.find(p => p.id === pkg)?.gets ?? [];

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_21rem] lg:items-start lg:gap-12">
      <div className="grid min-w-0 grid-cols-1 gap-8">
        <Card padding="sm" className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="grid grid-cols-1 gap-2 md:col-span-2">
            <span id="cs-type-l" className="text-small font-semibold text-ink">
              ชนิดแอร์
            </span>
            <SegmentedControl
              labelledBy="cs-type-l"
              fullWidth
              value={type}
              onChange={setType}
              options={STEP_TYPES.map(t => ({ value: t.id, label: t.th }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <span id="cs-level-l" className="text-small font-semibold text-ink">
              วิธีล้าง
            </span>
            <SegmentedControl
              labelledBy="cs-level-l"
              fullWidth
              value={level}
              onChange={setLevel}
              options={LEVELS.map(l => ({ value: l, label: LEVEL_TH[l].th, hint: l }))}
            />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <span id="cs-pkg-l" className="text-small font-semibold text-ink">
              แพ็กเกจ
            </span>
            <SegmentedControl
              labelledBy="cs-pkg-l"
              fullWidth
              value={pkg}
              onChange={setPkg}
              options={QUICK_PKGS.map(p => ({ value: p, label: PKG_TH[p].th }))}
            />
          </div>
        </Card>

        <p className="sr-only" aria-live="polite">
          แอร์{typeInfo.th} {LEVEL_TH[level].th} {PKG_TH[pkg].th} มี {total} ขั้นตอน
        </p>

        <ol className="grid grid-cols-1 gap-10">
          {groups.map(g => (
            <li key={g.ph}>
              <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="text-h3">{PHASES[g.ph].th}</h3>
                <span className="text-meta text-ink-3">{PHASES[g.ph].form}</span>
              </div>
              <ol className="grid">
                {g.items.map(({ s, n }) => (
                  <li
                    key={s.id}
                    className="relative flex gap-4 pb-7 before:absolute before:bottom-0 before:left-[17px] before:top-10 before:w-0.5 before:bg-line-strong/30 last:pb-0 last:before:hidden"
                  >
                    <span
                      aria-hidden={n === 0}
                      className={cn(
                        'relative z-10 grid size-9 shrink-0 place-items-center rounded-full border-2 bg-surface font-display text-small font-semibold',
                        n ? 'border-brand text-brand' : 'border-dashed border-line-strong text-ink-3',
                      )}
                    >
                      {n || <Icon name="minus" size={16} />}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <h4 className={cn('font-semibold leading-snug', n ? 'text-ink' : 'text-ink-2')}>
                          {n ? <span className="sr-only">ขั้นที่ {n} </span> : null}
                          {s.t}
                        </h4>
                        {s.off === 'pkg' && <Badge tone="neutral">ไม่รวมในแพ็กเกจนี้</Badge>}
                        {s.off === 'approved' && <Badge tone="warn">ทำเมื่ออนุมัติ</Badge>}
                      </div>
                      <p className="mt-1 text-small text-ink-2">{s.d}</p>
                      {s.you && (
                        <p className="mt-2 flex gap-2 text-small text-ink">
                          <Icon name="check" size={16} className="mt-[0.35em] shrink-0 text-ok" strokeWidth={2.25} />
                          <span>
                            <span className="font-semibold">คุณได้ </span>
                            {s.you}
                          </span>
                        </p>
                      )}
                      <Detail s={s} type={type} />
                    </div>
                  </li>
                ))}
              </ol>
            </li>
          ))}
        </ol>
      </div>

      <aside aria-label="สรุปงานที่เลือก" className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
        <Card padding="md" className="grid grid-cols-1 gap-5">
          <div className="flex items-center gap-4">
            <TypeArt type={type} className="h-14 w-20 shrink-0 text-brand" />
            <div className="min-w-0">
              <p className="font-display font-semibold leading-snug text-ink">แอร์{typeInfo.th}</p>
              <p className="text-meta text-ink-3">{typeInfo.venue}</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-3 border-t border-line pt-4 text-small">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">วิธีล้าง</dt>
              <dd className="text-right font-semibold text-ink">
                {LEVEL_TH[level].th} ({level})
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">แพ็กเกจ</dt>
              <dd className="text-right font-semibold text-ink">{PKG_TH[pkg].th}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-2">จำนวนขั้นตอน</dt>
              <dd className="font-semibold tabular-nums text-ink">{total} ขั้น</dd>
            </div>
            {time && (
              <div className="flex justify-between gap-4">
                <dt className="text-ink-2">เวลาโดยประมาณ</dt>
                <dd className="text-right font-semibold tabular-nums text-ink">{timeTh(time)} / เครื่อง</dd>
              </div>
            )}
          </dl>
          <div className="border-t border-line pt-4">
            <p className="mb-2 text-small font-semibold text-ink">เอกสารที่ได้</p>
            <ul className="grid grid-cols-1 gap-2">
              {docs.map(d => (
                <li key={d} className="flex gap-2 text-small text-ink-2">
                  <Icon name="document" size={16} className="mt-[0.3em] shrink-0 text-brand" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-meta text-ink-3">
            ขั้นตอนตามแบบฟอร์มงานล้างแอร์ของบริษัท {CLEAN_FORM} · {TIME_NOTE}
          </p>
        </Card>
      </aside>
    </div>
  );
}
