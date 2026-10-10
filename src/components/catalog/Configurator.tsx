'use client';
// The buying panel of a model page: installation package (มาตรฐาน / พรีเมียม / ไม่ติดตั้ง), add-ons by group, number of
// units and a live itemised total (ก่อน VAT, VAT, รวม). Receives only this SKU's data from the server page — never the
// Pricebook. "ใส่ใบเสนอราคา" builds the same lines (P- I- A- S-) as the reference through productLines().
import { useId, useMemo, useState } from 'react';
import { AddToQuote } from '@/components/shared/AddToQuote';
import { AccordionItem, Badge, Button, Card, Checkbox, Field, Fieldset, Notice, Price, Radio, Select, Stepper } from '@/components/ui';
import { INSTALL_WARRANTY, INCLUDED_PIPE_M, breakdown, optionNote, packageParts, productLines, type AddonOption, type InstallItem } from '@/lib/domain/install';
import { baht, thousands, VAT } from '@/lib/domain/format';
import { TYPE_BY_ID, type AcTypeId } from '@/lib/domain/types';
import { plain } from '@/lib/plain';
import type { ProductPageOptions } from './spec';

export type ConfiguratorProps = {
  brandName: string;
  type: AcTypeId;
  sku: string;
  btu: number;
  /** machine price before VAT */
  price: number;
  options: ProductPageOptions;
};

type Pkg = 'STANDARD' | 'PREMIUM' | 'NONE';
type AddState = { choice: number; qty: number; on: boolean };

/** Shorter option names for the choose-one lists (the Pricebook names are long). */
function shortName(name: string): string {
  const wire = /^งานเดินเมนไฟ 1 เฟส — สาย .*? (1x[\d.]+ sq\.mm) จำนวน (\d+) เส้น$/.exec(name);
  if (wire) return `สายเมน ${wire[1]} × ${wire[2]} เส้น`;
  const rcbo = /RCBO.*? (\d+A) /.exec(name);
  if (rcbo) return `เบรกเกอร์ RCBO ${rcbo[1]}`;
  return name;
}

function choiceLabel(a: AddonOption): string {
  const code = a.choices[0]?.code ?? '';
  if (/^ELE-MAIN/.test(code)) return 'เลือกขนาดสายเมนไฟ';
  if (/^ELE-NANO/.test(code)) return 'เลือกขนาดเบรกเกอร์';
  return 'เลือกรายการ';
}

export function Configurator({ brandName, type, sku, btu, price, options }: ConfiguratorProps) {
  const uid = useId();
  const hasInstall = options.install.length > 0;
  const [pkg, setPkg] = useState<Pkg>(hasInstall ? 'STANDARD' : 'NONE');
  const [qty, setQty] = useState(1);
  const [add, setAdd] = useState<Record<string, AddState>>({});
  const [survey, setSurvey] = useState(true);

  const install = pkg === 'NONE' ? null : (options.install.find(o => o.key === pkg) ?? null);
  const stateOf = (k: string): AddState => add[k] ?? { choice: 0, qty: 0, on: false };
  const setState = (k: string, patch: Partial<AddState>) => setAdd(s => ({ ...s, [k]: { ...stateOf(k), ...patch } }));

  const addons = useMemo(() => {
    const out: { item: InstallItem; qty: number; flag?: boolean }[] = [];
    if (!hasInstall) {
      if (survey && options.survey) out.push({ item: options.survey, qty: 1, flag: true });
      return out;
    }
    if (pkg === 'NONE') return out;
    options.addons.forEach((g, gi) =>
      g.items.forEach((a, ii) => {
        const s = add[`${gi}-${ii}`];
        if (!s) return;
        const item = a.choices[s.choice] ?? a.choices[0];
        if (a.qty === 'flag') {
          if (s.on) out.push({ item, qty: 1, flag: true });
        } else if (s.qty > 0) out.push({ item, qty: s.qty });
      }),
    );
    return out;
  }, [add, hasInstall, options.addons, options.survey, pkg, survey]);

  const lines = useMemo(
    () => productLines({ brandName, type, sku, btu, price, install, addons, qty }),
    [brandName, type, sku, btu, price, install, addons, qty],
  );
  const bd = useMemo(() => breakdown(lines), [lines]);
  const detailOf = useMemo(() => new Map(lines.map(l => [l.name, l.detail])), [lines]);
  const typeTh = TYPE_BY_ID[type].th;

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-start lg:gap-10">
      <div className="flex min-w-0 flex-col gap-10">
        {/* 1 — installation package */}
        <div className="flex flex-col gap-4">
          <h3 className="text-h3">1. เลือกแพ็กเกจติดตั้ง</h3>
          {hasInstall ? (
            <>
              <Fieldset
                legend="แพ็กเกจติดตั้ง"
                hideLegend
                hint={`ราคาติดตั้งต่อเครื่อง ก่อน VAT · รวมท่อน้ำยา ${INCLUDED_PIPE_M} เมตรแรก · ${INSTALL_WARRANTY.boughtHere}`}
              >
                <div className="grid grid-cols-1 gap-3">
                  {options.install.map(o => (
                    <Radio
                      key={o.key}
                      name={`${uid}-pkg`}
                      variant="card"
                      value={o.key}
                      checked={pkg === o.key}
                      onChange={() => setPkg(o.key)}
                      label={
                        <span className="flex flex-wrap items-center gap-2">
                          ติดตั้ง{o.th}
                          {o.key === 'STANDARD' && <Badge tone="ok">แนะนำ</Badge>}
                        </span>
                      }
                      description={o.note}
                      aside={<Price amount={o.item.ex} size="sm" vat={false} className="whitespace-nowrap" />}
                    />
                  ))}
                  <Radio
                    name={`${uid}-pkg`}
                    variant="card"
                    value="NONE"
                    checked={pkg === 'NONE'}
                    onChange={() => setPkg('NONE')}
                    label="ไม่ติดตั้ง"
                    description="ซื้อเครื่องอย่างเดียว ไม่รวมค่าติดตั้ง"
                    aside={<span className="whitespace-nowrap text-small text-ink-2">฿0</span>}
                  />
                </div>
              </Fieldset>

              {install && (
                <AccordionItem
                  key={install.key}
                  variant="card"
                  title={`ดูสิ่งที่รวม ไม่รวม และรับประกันของแพ็กเกจ${install.th}`}
                >
                  <div className="flex flex-col gap-4 text-small">
                    <div>
                      <p className="font-semibold text-ink">รวมในแพ็กเกจ</p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5">
                        {packageParts(install.item).map(p => (
                          <li key={p}>{plain(p)}</li>
                        ))}
                      </ul>
                    </div>
                    {install.item.exc && (
                      <p>
                        <span className="font-semibold text-ink">ไม่รวม </span>
                        {plain(install.item.exc.replace(/^ไม่รวม/, ''))}
                      </p>
                    )}
                    <div>
                      <p className="font-semibold text-ink">รับประกันงานติดตั้ง</p>
                      <ul className="mt-1.5 list-disc space-y-1 pl-5">
                        <li>{INSTALL_WARRANTY.boughtHere}</li>
                        <li>{INSTALL_WARRANTY.ownUnit}</li>
                      </ul>
                      {install.item.warranty && <p className="mt-1.5 text-ink-3">เงื่อนไขในใบเสนอราคา: {plain(install.item.warranty)}</p>}
                    </div>
                  </div>
                </AccordionItem>
              )}
            </>
          ) : (
            <Notice tone="warn" title="ติดตั้งต้องสำรวจหน้างาน">
              <p className="text-small">
                แอร์{typeTh}ขนาด {thousands(btu)} BTU ราคาติดตั้งขึ้นกับระบบท่อ ไฟ และหน้างานจริง ทีมช่างสำรวจก่อน แล้วแจ้งราคาในใบเสนอราคา
              </p>
              {options.survey && (
                <div className="mt-3">
                  <Checkbox
                    checked={survey}
                    onChange={e => setSurvey(e.target.checked)}
                    label="ขอให้ทีมสำรวจหน้างานก่อนติดตั้ง"
                    description={options.survey.name}
                  />
                </div>
              )}
            </Notice>
          )}
        </div>

        {/* 2 — add-ons */}
        {hasInstall && (
          <div className="flex flex-col gap-5">
            <div>
              <h3 className="text-h3">2. ตัวเลือกเพิ่มเติม</h3>
              <p className="mt-1 text-small text-ink-2">เลือกเฉพาะที่ต้องใช้ ช่างยืนยันระยะและงานจริงหน้างานอีกครั้งก่อนทำ</p>
            </div>
            {pkg === 'NONE' ? (
              <Notice tone="info" size="sm">
                เลือกไม่ติดตั้งแล้ว ตัวเลือกวัสดุและงานติดตั้งเพิ่มเติมจึงปิดไว้ เลือกแพ็กเกจติดตั้งด้านบนถ้าต้องการเพิ่ม
              </Notice>
            ) : (
              options.addons.map((g, gi) => (
                <section key={g.group} aria-labelledby={`${uid}-g${gi}`} className="flex flex-col gap-2">
                  <h4 id={`${uid}-g${gi}`} className="text-small font-semibold text-ink">
                    {g.group}
                  </h4>
                  <ul className="divide-y divide-line overflow-hidden rounded-control border border-line bg-surface shadow-card">
                    {g.items.map((a, ii) => {
                      const k = `${gi}-${ii}`;
                      const s = stateOf(k);
                      const item = a.choices[s.choice] ?? a.choices[0];
                      const note = a.note || optionNote(item.code);
                      if (a.qty === 'flag') {
                        return (
                          <li key={k} className="p-4">
                            <Checkbox
                              checked={s.on}
                              onChange={e => setState(k, { on: e.target.checked })}
                              label={item.name}
                              description="ไม่มีราคาตายตัว ทีมแจ้งราคาก่อนทำ"
                              aside={<Badge tone="warn">ประเมินหน้างาน</Badge>}
                            />
                          </li>
                        );
                      }
                      const many = a.choices.length > 1;
                      return (
                        <li key={k} className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-5">
                          <div className="flex min-w-0 flex-col gap-1.5">
                            {many ? (
                              <Field label={choiceLabel(a)}>
                                <Select value={s.choice} onChange={e => setState(k, { choice: +e.target.value })}>
                                  {a.choices.map((c, ci) => (
                                    <option key={c.code} value={ci}>
                                      {shortName(c.name)} · {baht(c.ex ?? 0)} / {c.unit}
                                    </option>
                                  ))}
                                </Select>
                              </Field>
                            ) : (
                              <p className="font-medium leading-snug text-ink">{item.name}</p>
                            )}
                            <p className="text-small text-ink-2">
                              <Price amount={item.ex} size="sm" vat={false} className="font-semibold" /> / {item.unit}
                              <span className="text-ink-3"> · ก่อน VAT</span>
                            </p>
                            {note && <p className="text-meta text-ink-3">{note}</p>}
                          </div>
                          <Stepper
                            label={`จำนวน ${shortName(item.name)}`}
                            value={s.qty}
                            onChange={n => setState(k, { qty: n })}
                            min={0}
                            max={99}
                            unit={item.unit ?? undefined}
                          />
                        </li>
                      );
                    })}
                  </ul>
                </section>
              ))
            )}
          </div>
        )}
      </div>

      {/* summary */}
      <Card padding="md" className="flex flex-col gap-5 lg:sticky lg:top-[calc(var(--header-h)+1rem)]">
        <h3 className="text-h3">สรุปราคา</h3>
        <div className="flex items-center justify-between gap-4">
          <span className="font-medium text-ink">จำนวนเครื่อง</span>
          <Stepper label="จำนวนเครื่อง" value={qty} onChange={setQty} min={1} max={99} unit="เครื่อง" />
        </div>

        <div className="flex flex-col gap-4 border-t border-line pt-4">
          {bd.groups.map(g => (
            <div key={g.th} className="flex flex-col gap-2">
              <p className="text-meta font-semibold text-ink-3">{g.th}</p>
              <ul className="flex flex-col gap-2.5">
                {g.rows.map(r => {
                  const d = detailOf.get(r.name);
                  const sub = r.amount == null ? null : r.unit === 'เครื่อง' ? (r.qty > 1 ? `${baht(r.ex ?? 0)} × ${r.qty} เครื่อง` : null) : (d ?? null);
                  return (
                    <li key={r.name} className="flex items-start justify-between gap-3 text-small">
                      <span className="min-w-0">
                        <span className="block leading-snug text-ink">{r.name}</span>
                        {sub && <span className="block text-meta text-ink-3">{sub}</span>}
                        {r.note && <span className="block text-meta text-ink-3">{r.note}</span>}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-ink">
                        {r.amount == null ? <span className="text-ink-2">ประเมินหน้างาน</span> : baht(r.amount)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div aria-live="polite" aria-atomic="true" className="flex flex-col gap-2 border-t border-line pt-4">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-small text-ink-2">รวมก่อน VAT</span>
            <Price amount={bd.ex} size="lg" vat={false} tone="brand" />
          </div>
          <div className="flex items-baseline justify-between gap-3 text-small text-ink-2">
            <span>VAT {Math.round(VAT * 100)}%</span>
            <span className="tabular-nums">{baht(bd.vat)}</span>
          </div>
          <div className="flex items-baseline justify-between gap-3 text-small">
            <span className="font-semibold text-ink">รวม VAT</span>
            <span className="font-semibold tabular-nums text-ink">{baht(bd.inc)}</span>
          </div>
          {bd.assess > 0 && <p className="text-meta text-ink-3">มี {bd.assess} รายการประเมินหน้างาน ยังไม่รวมในยอดนี้ ทีมแจ้งราคาก่อนทำ</p>}
        </div>

        <div className="flex flex-col gap-3">
          <AddToQuote lines={lines} variant="primary" size="lg" fullWidth label="ใส่ใบเสนอราคา" />
          <Button href="/quote/" variant="quiet" icon="quote">
            ดูใบเสนอราคา
          </Button>
          <p className="text-meta text-ink-3">ยืนยันสต็อกก่อนสั่ง · ทีมยืนยันราคาและรายการในใบเสนอราคา</p>
        </div>
      </Card>
    </div>
  );
}
