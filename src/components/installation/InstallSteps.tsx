'use client';
// "ขั้นตอนติดตั้ง": the crew's steps for one AC type and package, numbered across four phases (company form
// SBP-SR-ACIN-UNI-001 Rev.04). Standard and Premium differ only in the test and handover steps — those are marked.
import { useId, useMemo, useState } from 'react';
import { Badge, Icon, Notice, SegmentedControl, cn } from '@/components/ui';
import { INS_LEVELS } from '@/lib/domain/install';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { INSTALL_FORM, PHASES, PHASE_ORDER, installSteps, type StepLevel, type StepType } from './steps';

const TYPES: readonly StepType[] = ['wall', 'ceiling', 'cassette', 'floor'];

export function InstallSteps() {
  const uid = useId();
  const [type, setType] = useState<StepType>('wall');
  const [level, setLevel] = useState<StepLevel>('STANDARD');

  const { steps, other, num } = useMemo(() => {
    const cur = installSteps(type, level);
    const alt = installSteps(type, level === 'STANDARD' ? 'PREMIUM' : 'STANDARD');
    return { steps: cur, other: new Map(alt.map(s => [s.id, s.d])), num: new Map(cur.map((s, i) => [s.id, i + 1])) };
  }, [type, level]);

  const levelTh = (k: StepLevel) => INS_LEVELS.find(l => l.key === k)?.th ?? k;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-wrap items-end gap-x-10 gap-y-5">
        <div className="flex min-w-0 flex-col gap-2">
          <span id={`${uid}-t`} className="text-small font-semibold text-ink">
            ประเภทแอร์
          </span>
          <SegmentedControl
            labelledBy={`${uid}-t`}
            value={type}
            onChange={setType}
            options={TYPES.map(t => ({ value: t, label: TYPE_BY_ID[t].th }))}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-2">
          <span id={`${uid}-l`} className="text-small font-semibold text-ink">
            แพ็กเกจ
          </span>
          <SegmentedControl
            labelledBy={`${uid}-l`}
            value={level}
            onChange={setLevel}
            options={INS_LEVELS.map(l => ({ value: l.key, label: l.th }))}
          />
        </div>
        <p className="text-meta text-ink-3" aria-live="polite">
          {steps.length} ขั้นตอน · ตามแบบฟอร์ม {INSTALL_FORM}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {PHASE_ORDER.map(ph => {
          const list = steps.filter(s => s.ph === ph);
          return (
            <div key={ph} className="grid grid-cols-1 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <h3 className="text-h3">{PHASES[ph].th}</h3>
                <p className="mt-1 text-small text-ink-3">{PHASES[ph].form}</p>
              </div>
              <ol className="flex min-w-0 flex-col">
                {list.map(s => {
                  const n = num.get(s.id) ?? 0;
                  const alt = other.get(s.id);
                  const differs = alt != null && alt !== s.d;
                  return (
                    <li key={s.id} className="group relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-4 pb-7 last:pb-0">
                      <span
                        aria-hidden
                        className="absolute left-5 top-11 bottom-0 w-px bg-line group-last:hidden"
                      />
                      <span
                        className="z-10 grid size-10 place-items-center rounded-full bg-sky-soft font-display text-small font-bold text-brand tabular-nums"
                        aria-hidden
                      >
                        {n}
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <h4 className="text-[1.0625rem] font-semibold leading-snug text-ink">
                            <span className="sr-only">ขั้นที่ {n} </span>
                            {s.t}
                          </h4>
                          {differs && level === 'PREMIUM' && (
                            <Badge tone="brand" size="sm">
                              เพิ่มในพรีเมียม
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1.5 text-small text-ink-2">{s.d}</p>
                        {s.how && (
                          <p className="mt-2 text-small text-ink-2">
                            <span className="font-medium text-ink">แอร์{TYPE_BY_ID[type].th}: </span>
                            {s.how}
                          </p>
                        )}
                        {s.rec && (
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="text-meta text-ink-3">ตัวอย่างค่าที่บันทึก</span>
                            {s.rec.map(r => (
                              <Badge key={r} tone="outline" size="sm">
                                {r}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {differs && level === 'STANDARD' && (
                          <p className="mt-2 rounded-control bg-surface-2 px-3 py-2 text-meta text-ink-2">
                            <span className="font-semibold text-ink">ใน{levelTh('PREMIUM')}: </span>
                            {alt}
                          </p>
                        )}
                        {s.you && (
                          <p className={cn('mt-3 flex items-start gap-2 text-small font-medium text-ok')}>
                            <Icon name="check" size={18} className="mt-0.5 shrink-0" strokeWidth={2.25} />
                            <span>{s.you}</span>
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          );
        })}
      </div>

      <Notice tone="info" size="sm" icon="info">
        ค่าที่ช่างวัดในใบรับมอบเป็นตัวอย่างสิ่งที่บันทึก ไม่ใช่เกณฑ์ผ่านหรือไม่ผ่านเกณฑ์เดียวที่ใช้กับทุกยี่ห้อ ขั้นตอนอาจปรับตามหน้างานและคู่มือของผู้ผลิตแต่ละรุ่น
      </Notice>
    </div>
  );
}
