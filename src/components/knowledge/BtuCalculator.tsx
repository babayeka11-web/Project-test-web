'use client';
// BTU calculator of /knowledge/#btu. Room use + size + sun + people + equipment → needed BTU (btuBreakdown), then the unit size
// and count (recommendUnits) with the catalog sizes passed in by the server page. Everything here is client-safe domain code:
// the Pricebook never reaches this bundle — it arrives as a small `catalog` prop (size → cheapest machine price).
// The result is an estimate; the crew confirms the real load on site.
import { useId, useMemo, useState } from 'react';
import { TypeArt } from '@/components/shared/TypeArt';
import { Badge, Button, Card, Checkbox, Field, Fieldset, Icon, Input, Notice, Price, SegmentedControl, Select, Stepper } from '@/components/ui';
import { BTU_BANDS } from '@/lib/domain/catalog';
import {
  btuBreakdown,
  defaultOrient,
  GLASS,
  ORIENT,
  recommendUnits,
  ROOM_BY_ID,
  ROOM_USES,
  TYPE_RULES,
  type RoomInput,
  type RoomUse,
} from '@/lib/domain/btu';
import { NOTES } from '@/lib/domain/constants';
import { thousands } from '@/lib/domain/format';
import type { AcTypeId } from '@/lib/domain/types';

/** One standard size class of one AC type in the catalog (9,000 · 12,000 …) and its lowest machine price (before VAT). */
export type CatalogSize = { btu: number; from: number };
export type BtuCalculatorProps = { catalog: Partial<Record<AcTypeId, CatalogSize[]>> };

type Sun = 0 | 1 | 2;
type Edit = { w?: string; d?: string; h?: string; people?: number; sun?: Sun; equip?: string; roof?: boolean };

const GROUPS: { g: RoomUse['g'][]; th: string }[] = [
  { g: ['home'], th: 'บ้าน · คอนโด' },
  { g: ['office'], th: 'สำนักงาน' },
  { g: ['retail'], th: 'ร้านค้า · ร้านอาหาร' },
  { g: ['service', 'school', 'hospital'], th: 'บริการ · การศึกษา · คลินิก' },
  { g: ['ind'], th: 'โรงงาน · คลังสินค้า' },
];

const SUN_OPTIONS = [
  { value: '0', label: 'แดดน้อย', hint: 'ร่ม' },
  { value: '1', label: 'ปานกลาง', hint: 'แดดเช้า' },
  { value: '2', label: 'แดดจัด', hint: 'แดดบ่าย' },
];

/** Allowed ranges (metres / watts). Kept wide enough for the warehouse preset (20 × 14 × 6). */
const LIMIT = { w: [1, 60], d: [1, 60], h: [2, 12], equip: [0, 100000] } as const;

const num = (s: string): number => {
  const t = s.trim().replace(',', '.');
  return t === '' ? NaN : Number(t);
};
const inRange = (n: number, [lo, hi]: readonly [number, number] | readonly number[]) => Number.isFinite(n) && n >= lo && n <= hi;
const round100 = (n: number) => Math.round(n / 100) * 100;
const signed = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '') + thousands(Math.abs(n));

export function BtuCalculator({ catalog }: BtuCalculatorProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [useKey, setUseKey] = useState('bedroom');
  const [edit, setEdit] = useState<Edit>({});
  const [typeSel, setTypeSel] = useState<AcTypeId | null>(null);

  const room = ROOM_BY_ID[useKey];
  const patch = (p: Edit) => setEdit(e => ({ ...e, ...p }));

  // values the visitor typed win; everything else follows the room use
  const wS = edit.w ?? String(room.w);
  const dS = edit.d ?? String(room.d);
  const hS = edit.h ?? String(room.h);
  const eS = edit.equip ?? String(room.equip);
  const people = edit.people ?? room.people;
  const sun: Sun = room.closed ? 0 : (edit.sun ?? room.sun);
  const roof = edit.roof ?? false;

  const w = num(wS);
  const d = num(dS);
  const h = num(hS);
  const equip = num(eS);
  const dimError = !inRange(w, LIMIT.w)
    ? 'กรอกความกว้าง 1–60 เมตร เช่น 3.5'
    : !inRange(d, LIMIT.d)
      ? 'กรอกความยาว 1–60 เมตร เช่น 4'
      : !inRange(h, LIMIT.h)
        ? 'กรอกความสูงฝ้า 2–12 เมตร เช่น 2.7'
        : null;
  const equipError = inRange(equip, LIMIT.equip) ? null : 'กรอกกำลังไฟเป็นวัตต์ เช่น 300 หรือ 0 ถ้าไม่มี';

  // only the types the catalog actually sells (ducted units are surveyed first, so they have no list price)
  const sold = room.types.filter(t => catalog[t]?.length);
  const types = sold.length ? sold : room.types;
  const type: AcTypeId = typeSel && types.includes(typeSel) ? typeSel : types[0];

  const calc = useMemo(() => {
    if (dimError || equipError) return null;
    const input: RoomInput = {
      w,
      d,
      h,
      people,
      equip,
      sun,
      roof,
      closed: !!room.closed,
      orient: defaultOrient({ sun, closed: room.closed }),
    };
    const { items, total } = btuBreakdown(input, room);
    const area = w * d;
    const sizes = (catalog[type] ?? []).map(s => s.btu);
    const rec = recommendUnits(total, area, type, sizes.length ? sizes : undefined);
    const band = BTU_BANDS.find(b => rec.per >= b.min && rec.per <= b.max);
    const from = catalog[type]?.find(s => s.btu === rec.per)?.from ?? null;
    const raw = items.reduce((a, b) => a + b.btu, 0);
    const rows = items.filter(i => i.k === 'base' || Math.abs(i.btu) >= 50).map(i => ({ ...i, btu: round100(i.btu) }));
    const maxAbs = Math.max(1, ...rows.map(r => Math.abs(r.btu)));
    return { total, area, rec, band, from, floored: raw < 5950, rows, maxAbs, orient: input.orient };
  }, [dimError, equipError, w, d, h, people, equip, sun, roof, room, catalog, type]);

  const sunNote = `${ORIENT.find(o => o.id === defaultOrient({ sun, closed: room.closed }))?.long ?? ''} · ${GLASS[sun].th}`;
  const dirty = Object.keys(edit).length > 0 || typeSel !== null;
  const productsHref = calc?.band ? `/products/?btu=${calc.band.id}&type=${type}` : '/products/';
  const sunLabelId = `${uid}-sun`;
  const peopleHintId = `${uid}-people`;

  return (
    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-8">
      {/* ── form ─────────────────────────────────────────────────────────────────────────────── */}
      <Card padding="md" className="flex min-w-0 flex-col gap-7">
        <Field label="ห้องนี้ใช้ทำอะไร" hint="เลือกแล้วขนาดห้อง จำนวนคน และแดดจะตั้งค่าเริ่มต้นให้ แก้ได้ทุกช่อง">
          <Select value={useKey} onChange={e => setUseKey(e.target.value)}>
            {GROUPS.map(grp => (
              <optgroup key={grp.th} label={grp.th}>
                {ROOM_USES.filter(r => grp.g.includes(r.g)).map(r => (
                  <option key={r.id} value={r.id}>
                    {r.th}
                  </option>
                ))}
              </optgroup>
            ))}
          </Select>
        </Field>

        <Fieldset legend="ขนาดห้อง" error={dimError} hint="วัดจากผนังถึงผนัง ความสูงวัดจากพื้นถึงฝ้า">
          <div className="grid grid-cols-3 gap-3">
            <Field label="กว้าง (ม.)">
              <Input inputMode="decimal" autoComplete="off" value={wS} aria-invalid={!inRange(w, LIMIT.w) || undefined} onChange={e => patch({ w: e.target.value })} />
            </Field>
            <Field label="ยาว (ม.)">
              <Input inputMode="decimal" autoComplete="off" value={dS} aria-invalid={!inRange(d, LIMIT.d) || undefined} onChange={e => patch({ d: e.target.value })} />
            </Field>
            <Field label="ฝ้าสูง (ม.)">
              <Input inputMode="decimal" autoComplete="off" value={hS} aria-invalid={!inRange(h, LIMIT.h) || undefined} onChange={e => patch({ h: e.target.value })} />
            </Field>
          </div>
        </Fieldset>

        <div className="flex flex-col gap-2">
          <span id={sunLabelId} className="text-small font-semibold text-ink">
            แดดเข้าห้อง
          </span>
          {room.closed ? (
            <p className="rounded-control bg-surface-2 px-4 py-3 text-small text-ink-2">ห้องปิดทึบ ไม่มีแดดเข้า เครื่องคำนวณไม่นับแดดให้ห้องประเภทนี้</p>
          ) : (
            <>
              <SegmentedControl
                labelledBy={sunLabelId}
                fullWidth
                value={String(sun)}
                onChange={v => patch({ sun: Number(v) as Sun })}
                options={SUN_OPTIONS}
              />
              <p className="text-meta text-ink-3">คิดจาก {sunNote}</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span id={peopleHintId} className="text-small font-semibold text-ink">
              จำนวนคนในห้อง
            </span>
            <Stepper label="จำนวนคนในห้อง" describedBy={peopleHintId} unit="คน" min={0} max={200} value={people} onChange={n => patch({ people: n })} />
          </div>
          <Field label="เครื่องใช้ไฟฟ้า / อุปกรณ์" hint={`ค่าเริ่มต้นของห้องนี้ ${thousands(room.equip)} วัตต์ ไม่ทราบใช้ค่านี้ได้`} error={equipError}>
            <Input inputMode="numeric" autoComplete="off" suffix="วัตต์" value={eS} onChange={e => patch({ equip: e.target.value })} />
          </Field>
        </div>

        {!room.closed && (
          <Checkbox
            label="ห้องอยู่ชั้นบนสุด ใต้หลังคารับแดด"
            description="เช่น ห้องใต้ดาดฟ้าหรือใต้หลังคาที่ไม่มีชั้นอื่นคั่น"
            checked={roof}
            onChange={e => patch({ roof: e.target.checked })}
          />
        )}

        {types.length > 1 && (
          <Field label="ประเภทแอร์ที่สนใจ" hint="แต่ละประเภทใช้ขนาดเครื่องและจำนวนเครื่องต่างกัน">
            <Select value={type} onChange={e => setTypeSel(e.target.value as AcTypeId)}>
              {types.map(t => (
                <option key={t} value={t}>
                  {TYPE_RULES[t].th}
                </option>
              ))}
            </Select>
          </Field>
        )}

        {dirty && (
          <div>
            <Button
              variant="quiet"
              size="sm"
              icon="sliders"
              onClick={() => {
                setEdit({});
                setTypeSel(null);
              }}
            >
              ใช้ค่าเริ่มต้นของห้องนี้
            </Button>
          </div>
        )}
      </Card>

      {/* ── result ───────────────────────────────────────────────────────────────────────────── */}
      <Card padding="md" className="flex min-w-0 flex-col gap-6 lg:sticky lg:top-28">
        {calc ? (
          <>
            <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-small font-semibold text-ink-2">ห้องนี้ต้องการประมาณ</p>
                <Badge tone="outline" icon="info">
                  ประมาณการ
                </Badge>
              </div>
              <p className="num text-h1 leading-tight text-brand">
                {thousands(calc.total)} <span className="text-lead font-medium text-ink-2">BTU</span>
              </p>
              {calc.floored && <p className="-mt-2 text-meta text-ink-3">ห้องเล็กมาก ตั้งขั้นต่ำที่ 6,000 BTU</p>}

              <div className="flex items-center gap-4 rounded-2xl bg-sky-soft p-4">
                <TypeArt type={type} aria-hidden role="presentation" aria-label={undefined} className="h-16 w-24 shrink-0 text-brand" />
                <div className="min-w-0">
                  <p className="text-meta text-ink-2">ขนาดแอร์ที่แนะนำ · {TYPE_RULES[type].th}</p>
                  <p className="num text-h3 text-ink">
                    {calc.rec.n > 1 && <>{calc.rec.n} × </>}
                    {thousands(calc.rec.per)} BTU
                  </p>
                  {calc.rec.n > 1 && (
                    <p className="text-small text-ink-2">
                      {calc.rec.n} เครื่อง รวม {thousands(calc.rec.total)} BTU
                    </p>
                  )}
                </div>
              </div>

              {calc.rec.n > 1 && !calc.rec.project && (
                <p className="text-small text-ink-2">
                  พื้นที่ {calc.area.toFixed(1)} ตร.ม. ควรแบ่งเป็น {calc.rec.n} เครื่อง เพื่อให้ลมถึงทั่วห้องและสำรองเมื่อเครื่องใดเครื่องหนึ่งหยุด
                </p>
              )}
              {calc.rec.project && (
                <Notice tone="warn" size="sm" title="งานขนาดนี้เป็นงานโครงการ">
                  ทีมช่างสำรวจและออกแบบให้ก่อน ตัวเลขนี้ใช้เป็นข้อมูลเบื้องต้นเท่านั้น
                </Notice>
              )}
            </div>

            {!calc.rec.project && (
              <div className="flex flex-col gap-1.5 border-t border-line pt-5">
                <Price amount={calc.from} prefix="ราคาเครื่อง เริ่ม" unit="/ เครื่อง" size="lg" tone="brand" fallback="สอบถามราคากับทีมขาย" />
                <p className="text-meta text-ink-3">ยังไม่รวมค่าติดตั้ง · {NOTES.estimate}</p>
              </div>
            )}

            <div className="flex flex-col gap-4 border-t border-line pt-5">
              <h3 className="text-small font-semibold text-ink">ตัวเลขนี้มาจากอะไรบ้าง</h3>
              <ul className="flex flex-col gap-3.5">
                {calc.rows.map(r => (
                  <li key={r.k} className="flex flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-4 text-small">
                      <span className="min-w-0 text-ink-2">{r.th}</span>
                      <span className="num shrink-0 font-semibold text-ink">{r.k === 'base' ? thousands(r.btu) : signed(r.btu)}</span>
                    </div>
                    <div aria-hidden className="h-2 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full rounded-full transition-[width] duration-250 ease-air ${r.k === 'base' ? 'bg-brand' : r.btu < 0 ? 'bg-ok' : 'bg-sky'}`}
                        style={{ width: `${Math.max(3, (Math.abs(r.btu) / calc.maxAbs) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-meta text-ink-3">ปัดเป็นหลักร้อย BTU · ทีมช่างยืนยันขนาดจริงตอนสำรวจหน้างาน</p>
            </div>

            <div className="flex flex-wrap gap-3">
              {calc.rec.project ? (
                <Button href="/contact/" icon="chat">
                  ปรึกษาทีมโครงการ
                </Button>
              ) : (
                <Button href={productsHref} icon="ac">
                  ดูแอร์ขนาดนี้
                </Button>
              )}
              <Button href="/knowledge/btu/" variant="quiet" iconEnd="arrow-right">
                อ่านวิธีเลือก BTU
              </Button>
            </div>
          </>
        ) : (
          <div role="status" className="flex flex-col items-start gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-warn-soft text-warn">
              <Icon name="alert" size={24} />
            </span>
            <p className="text-h3">ยังคำนวณไม่ได้</p>
            <p className="text-small text-ink-2">{dimError ?? equipError} แก้ช่องที่มีกรอบสีแดง แล้วผลจะขึ้นที่นี่ทันที</p>
          </div>
        )}
      </Card>
    </div>
  );
}
