'use client';
// Annual contract calculator for organisations: units per AC type × visits per year × package × size band (+ one deep
// clean, optional area, high units). Every number comes from estimateContract() on the standard Pricebook rates and is
// labelled as an estimate. The inputs live in contract-store so the sector samples and the 12-month plan share them.
// On phones an ActionDock keeps the yearly figure and "ใส่ใบเสนอราคา" in thumb reach while the controls scroll.
import { useId, useRef } from 'react';
import { ActionDock } from '@/components/shared/ActionDock';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { AddressPicker } from '@/components/shared/AddressPicker';
import { TypeArt } from '@/components/shared/TypeArt';
import { Badge, Button, Card, Checkbox, Chip, Fieldset, Icon, Notice, Price, Radio, SegmentedControl, Stepper, toast } from '@/components/ui';
import { NOTES, VOLUME_HINT } from '@/lib/domain/constants';
import { CLEAN_PKGS, contractLine, PRESETS } from '@/lib/domain/contract';
import { bandRange, LEVEL_TH, PKG_TH, SIZE_BANDS, type CleanPkgId } from '@/lib/domain/cleaning';
import { baht, up100 } from '@/lib/domain/format';
import { TIER_TH } from '@/lib/domain/travel';
import { AC_TYPES } from '@/lib/domain/types';
import { useContract } from './ContractProvider';
import { asVisits, contractStore, MAX_UNITS } from './contract-store';
import { everyMonths } from './sectors';

const VISIT_OPTIONS = [2, 3, 4].map(n => ({ value: String(n), label: `${n} ครั้ง`, hint: `ทุก ${everyMonths(n)} เดือน` }));
const SIZE_OPTIONS = SIZE_BANDS.map(b => ({ value: String(b.id), label: b.th }));
const teamDaysTh = (n: number) => `${n % 1 ? n.toFixed(1) : n} ทีม-วัน`;

export function ContractCalculator() {
  const { state, est, outOfRange } = useContract();
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const band = SIZE_BANDS[state.size] ?? SIZE_BANDS[0];
  const label = state.label ?? 'องค์กรของคุณ';
  const zone = state.zone;
  const normalVisits = est ? Math.max(0, est.visits - (state.deep ? 1 : 0)) : 0;
  const toolRef = useRef<HTMLDivElement>(null);
  const resultActionRef = useRef<HTMLDivElement>(null);

  const lines = () => {
    if (!est) return [];
    const detail = [
      state.pkg,
      `ขนาด${band.th}`,
      state.deep ? 'ล้างใหญ่ 1 ครั้ง' : 'ล้างปกติทุกรอบ',
      zone && (zone.tier === 'core' || zone.tier === 'extended') ? zone.match : null,
      state.high ? 'มีเครื่องสูงเกิน 3 ม. (ประเมินหน้างาน)' : null,
      'ยืนยันหลังสำรวจ',
    ]
      .filter(Boolean)
      .join(' · ');
    return [contractLine(est, { label, pkg: state.pkg, detail, key: `K-${label}-${state.pkg}-${est.count}-${est.visits}-${est.annualEx}` })];
  };

  const copySummary = async () => {
    if (!est) return;
    const fleet = AC_TYPES.filter(t => state.units[t.id] > 0)
      .map(t => `${t.th} ${state.units[t.id]}`)
      .join(' · ');
    const text = [
      `สรุปประเมินสัญญาล้างแอร์รายปี (${NOTES.estimate})`,
      `เครื่อง: ${fleet} · รวม ${est.count} เครื่อง · ขนาด${band.th}`,
      `ความถี่: ปีละ ${est.visits} ครั้ง${state.deep ? ' (ล้างใหญ่ 1 ครั้ง)' : ''} · แพ็กเกจ${PKG_TH[state.pkg].th} (${state.pkg})`,
      `ราคาต่อปี ${baht(est.annualEx)} ก่อน VAT · VAT 7% ${baht(est.vat)} · รวม ${baht(est.annualInc)}`,
      `กำลังทีม ≈ ${teamDaysTh(est.teamDaysPerVisit)} ต่อรอบ`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast('คัดลอกสรุปแล้ว', { tone: 'ok' });
    } catch {
      toast('คัดลอกไม่ได้ในเบราว์เซอร์นี้ เลือกข้อความจากการ์ดแล้วคัดลอกเอง', { tone: 'warn' });
    }
  };

  return (
    <div ref={toolRef} className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_26rem] lg:items-start xl:grid-cols-[minmax(0,1fr)_28rem]">
      <div className="flex min-w-0 flex-col gap-5">
        <Card className="flex flex-col gap-4">
          <div>
            <h3 id={`${uid}-presets`} className="text-h3">
              เริ่มจากตัวอย่างอาคาร
            </h3>
            <p className="mt-1 text-small text-ink-2">เลือกแล้วปรับจำนวนเครื่องต่อได้ ตัวเลขข้างล่างเปลี่ยนตามทันที</p>
          </div>
          <div role="group" aria-labelledby={`${uid}-presets`} className="flex flex-wrap gap-2">
            {PRESETS.map(p => (
              <Chip key={p.id} selected={state.preset === p.id} onClick={() => contractStore.applyPreset(p.id)}>
                {p.th} · {p.sub}
              </Chip>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-2">
          <div className="mb-2">
            <h3 id={`${uid}-units`} className="text-h3">
              จำนวนเครื่องแต่ละแบบ
            </h3>
            <p className="mt-1 text-small text-ink-2">นับเฉพาะเครื่องที่ต้องการให้เข้าล้างตามสัญญา</p>
          </div>
          <ul aria-labelledby={`${uid}-units`} className="divide-y divide-line">
            {AC_TYPES.map(t => (
              <li key={t.id} className="flex items-center gap-4 py-3">
                <TypeArt type={t.id} aria-hidden className="hidden h-12 w-16 shrink-0 text-brand sm:block" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{t.th}</p>
                  <p className="text-meta text-ink-3">{bandRange(t.id, band).replace('<=', '≤ ').replace('-', '–')} BTU</p>
                </div>
                <Stepper label={`จำนวนแอร์${t.th}`} value={state.units[t.id]} min={0} max={MAX_UNITS} onChange={n => contractStore.setUnit(t.id, n)} />
              </li>
            ))}
          </ul>
        </Card>

        <Card className="flex flex-col gap-6">
          <h3 className="text-h3">ตั้งค่าสัญญา</h3>

          <div className="-mt-3 flex flex-col gap-3">
            <p id={`${uid}-visits`} className="text-small font-semibold text-ink">
              ล้างปีละกี่ครั้ง
            </p>
            <SegmentedControl
              labelledBy={`${uid}-visits`}
              fullWidth
              options={VISIT_OPTIONS}
              value={String(state.visits)}
              onChange={v => contractStore.set({ visits: asVisits(Number(v)) })}
            />
          </div>

          <Fieldset legend="แพ็กเกจและรายงาน">
            <div className="flex flex-col gap-3">
              {CLEAN_PKGS.map(p => (
                <Radio
                  key={p.id}
                  variant="card"
                  name={`${uid}-pkg`}
                  value={p.id}
                  checked={state.pkg === p.id}
                  onChange={() => contractStore.set({ pkg: p.id as CleanPkgId })}
                  label={PKG_TH[p.id].th}
                  description={p.sub}
                />
              ))}
            </div>
          </Fieldset>

          <div className="flex flex-col gap-3">
            <p id={`${uid}-size`} className="text-small font-semibold text-ink">
              ขนาดเครื่องส่วนใหญ่
            </p>
            <SegmentedControl
              labelledBy={`${uid}-size`}
              fullWidth
              options={SIZE_OPTIONS}
              value={String(state.size)}
              onChange={v => contractStore.set({ size: Number(v) })}
            />
            <p className="text-meta text-ink-3">
              ติดผนัง {band.wall.replace('-', '–')} BTU · แบบอื่น {band.other.replace('<=', '≤ ').replace('-', '–')} BTU
            </p>
          </div>

          <Checkbox
            variant="card"
            checked={state.deep}
            onChange={e => contractStore.set({ deep: e.target.checked })}
            label={`ล้างใหญ่ (C2) 1 ครั้งต่อปี`}
            description={`รอบที่เหลือเป็น${LEVEL_TH.C1.th} (C1) · ${LEVEL_TH.C2.sub}`}
          />
        </Card>

        <Card className="flex flex-col gap-5">
          <div>
            <h3 className="text-h3">หน้างานและเงื่อนไข</h3>
            <p className="mt-1 text-small text-ink-2">ไม่บังคับ ช่วยให้ค่าเดินทางต่อรอบแม่นขึ้น</p>
          </div>
          <AddressPicker
            syncCart={false}
            id={`${uid}-addr`}
            label="พื้นที่หน้างาน"
            hint="ถ้าไม่ระบุ คิดตามพื้นที่หลักในกรุงเทพฯ"
            value={state.addr}
            onPick={(pick, z) => contractStore.set({ addr: pick, zone: z })}
          />
          <Checkbox
            checked={state.high}
            onChange={e => contractStore.set({ high: e.target.checked })}
            label="มีเครื่องติดสูงเกิน 3 ม."
            description="ใช้บันไดพิเศษหรือนั่งร้าน ทีมประเมินหน้างานและแจ้งแยกรายการ ไม่รวมในตัวเลขนี้"
          />
        </Card>
      </div>

      <aside id={`${uid}-result`} aria-labelledby={`${uid}-out`} className="min-w-0 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
        <Card padding="lg" className="flex flex-col gap-5 ring-1 ring-brand/15">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 id={`${uid}-out`} className="text-h3">
              งบล้างแอร์ทั้งปี
            </h3>
            <Badge tone="outline" icon="info">
              ราคาประมาณการ
            </Badge>
          </div>

          {est ? (
            <>
              <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-1">
                <p className="text-small text-ink-2">
                  {est.count} เครื่อง · {est.visits} ครั้ง/ปี · {PKG_TH[state.pkg].th}
                </p>
                <Price amount={est.annualEx} unit="/ ปี" size="xl" tone="brand" stacked />
                <p className="text-small text-ink-2">
                  VAT 7% <span className="num">{baht(est.vat)}</span> · รวม VAT <strong className="num text-ink">{baht(est.annualInc)}</strong>
                </p>
              </div>

              <hr className="air-rule" />

              <dl className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-3 text-small">
                <dt className="text-ink-2">
                  ล้างปกติ (C1) ต่อรอบ{normalVisits > 0 ? ` × ${normalVisits}` : ''}
                </dt>
                <dd className="text-end font-semibold">{baht(est.perVisitC1)}</dd>
                {state.deep && (
                  <>
                    <dt className="text-ink-2">ล้างใหญ่ (C2) ต่อรอบ × 1</dt>
                    <dd className="text-end font-semibold">{baht(est.perVisitC2)}</dd>
                  </>
                )}
                <dt className="text-ink-2">เฉลี่ยต่อเครื่องต่อปี</dt>
                <dd className="text-end font-semibold">≈ {baht(up100(est.perUnitYear) ?? 0)}</dd>
                <dt className="text-ink-2">กำลังทีมต่อรอบ</dt>
                <dd className="text-end font-semibold">≈ {teamDaysTh(est.teamDaysPerVisit)}</dd>
                <dt className="text-ink-2">ค่าเดินทางต่อรอบ</dt>
                <dd className="text-end font-semibold">{est.travel > 0 ? baht(est.travel) : 'ไม่มี'}</dd>
              </dl>
              <p className="-mt-2 text-meta text-ink-3">ตัวเลขในรายการข้างบนเป็นราคาก่อน VAT</p>

              <div className="flex flex-col gap-2.5">
                {est.travelLabel && (
                  <Notice size="sm" tone="info" icon="truck">
                    {est.travelLabel}
                    {zone && zone.tier === 'extended' ? '' : ' ต่อรอบ ตามกฎค่าเดินทางที่ประกาศบนเว็บ'}
                  </Notice>
                )}
                {!zone && !est.travelLabel && (
                  <p className="flex gap-2 text-small text-ink-2">
                    <Icon name="pin" size={18} className="mt-0.5 shrink-0 text-sky" />
                    ยังไม่ระบุพื้นที่ คิดตามพื้นที่หลักในกรุงเทพฯ รอบที่ยอดล้างถึงขั้นต่ำไม่มีค่าเดินทาง
                  </p>
                )}
                {outOfRange && (
                  <Notice size="sm" tone="warn" title={TIER_TH.out.th}>
                    {TIER_TH.out.note} ตัวเลขนี้ยังไม่รวมค่าเดินทาง
                  </Notice>
                )}
                {state.high && (
                  <Notice size="sm" tone="warn" icon="alert">
                    มีเครื่องติดสูงเกิน 3 ม. ทีมประเมินหน้างานและแจ้งแยกรายการ ยังไม่รวมในตัวเลขนี้
                  </Notice>
                )}
                {est.count >= VOLUME_HINT && (
                  <Notice size="sm" tone="ok" icon="tag">
                    {NOTES.volume}
                  </Notice>
                )}
              </div>
            </>
          ) : (
            <div aria-live="polite" className="rounded-control bg-surface-2 p-5 text-center">
              <p className="font-semibold text-ink">ยังไม่ได้ใส่จำนวนเครื่อง</p>
              <p className="mt-1 text-small text-ink-2">เลือกตัวอย่างอาคาร หรือกด + ที่แอร์แบบที่มี แล้วงบทั้งปีจะขึ้นตรงนี้</p>
            </div>
          )}

          <div ref={resultActionRef} className="flex flex-col gap-3">
            <AddToQuote lines={lines} label="ใส่ใบเสนอราคา" size="lg" fullWidth disabled={!est} />
            <Button variant="ghost" icon="copy" fullWidth disabled={!est} onClick={copySummary}>
              คัดลอกสรุป
            </Button>
          </div>
          <p className="text-meta text-ink-3">{NOTES.estimate} · อัตรามาตรฐาน ทีมสำรวจหน้างานก่อนยืนยันจำนวนเครื่องและราคา</p>
        </Card>
      </aside>

      {est && (
        <ActionDock
          watch={toolRef}
          hideWhen={resultActionRef}
          label="งบล้างแอร์ทั้งปีและใส่ใบเสนอราคา"
          summary={
            <span className="flex flex-col">
              <span className="text-meta text-ink-3">
                {est.count} เครื่อง · {est.visits} ครั้ง/ปี
              </span>
              <Price amount={est.annualEx} unit="/ ปี" size="sm" tone="brand" />
            </span>
          }
          action={<AddToQuote lines={lines} label="ใส่ใบเสนอราคา" size="sm" />}
        />
      )}
    </div>
  );
}
