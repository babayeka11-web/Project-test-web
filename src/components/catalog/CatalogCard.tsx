'use client';
// One series in the catalog grid: illustration, brand, series name, the BTU sizes you can pick, the price of the picked
// size (before VAT) with the standard-installation total, a link to that size's own page and a compare toggle.
import Link from 'next/link';
import { useRef, type KeyboardEvent } from 'react';
import { TypeArt } from '@/components/shared/TypeArt';
import { Badge, Button, Icon, Price, cn } from '@/components/ui';
import type { CatalogSeriesLite, SkuLite } from '@/lib/domain/catalog';
import { baht, btuFmt, EX_TH, kbtu } from '@/lib/domain/format';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { sizeLabels } from './spec';

export type CatalogCardProps = {
  m: CatalogSeriesLite;
  /** sizes inside the current filter */
  skus: SkuLite[];
  picked: SkuLite;
  onPick: (sku: SkuLite) => void;
  modelHref: (sku: SkuLite) => string;
  seriesHref: string;
  inCompare: boolean;
  onCompare: () => void;
  /** id for the title link (focus target after "แสดงเพิ่ม") */
  titleId?: string;
};

export function CatalogCard({ m, skus, picked, onPick, modelHref, seriesHref, inCompare, onCompare, titleId }: CatalogCardProps) {
  const name = `${m.brandName} ${m.series}`;
  const install = picked.installStdEx != null ? picked.price + picked.installStdEx : null;
  return (
    <article className="flex w-full min-w-0 flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card">
      <div className="relative grid place-items-center bg-air-soft px-6 pb-3 pt-10 [&_.type-art-air]:[animation:none]">
        <TypeArt type={m.type} aria-hidden="true" className="h-24 w-32 text-brand" />
        <Badge tone="outline" className="absolute left-3 top-3">
          {TYPE_BY_ID[m.type].th}
        </Badge>
        <span className="absolute right-3 top-3.5 text-meta text-ink-3">ภาพประกอบ</span>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex flex-col gap-1">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-small font-semibold text-ink-2">
            <span>{m.brandName}</span>
            <Badge tone={m.inverter ? 'sky' : 'neutral'} className="h-6">
              {m.inverter ? 'Inverter' : 'Fixed speed'}
            </Badge>
          </p>
          <h3 className="text-h3 leading-snug">
            <Link id={titleId} href={seriesHref} className="rounded-md text-ink no-underline hover:text-brand hover:underline">
              {m.series}
            </Link>
          </h3>
        </div>

        <SizePicker skus={skus} picked={picked} onPick={onPick} label={`ขนาด BTU ของ ${name}`} />

        <div className="flex flex-col gap-1">
          <Price amount={picked.price} size="lg" />
          {install != null ? (
            <Price amount={install} prefix="พร้อมติดตั้งมาตรฐาน" size="sm" className="text-ink-2" />
          ) : (
            <p className="text-small text-ink-2">ติดตั้ง: สำรวจหน้างานก่อนเสนอราคา</p>
          )}
          <p className="break-all font-mono text-meta text-ink-3">{picked.sku}</p>
        </div>

        <div className="mt-auto flex flex-wrap gap-2 pt-1">
          <Button href={modelHref(picked)} variant="soft" size="sm" className="flex-1" aria-label={`รายละเอียด ${m.brandName} ${picked.sku} ${btuFmt(picked.btu)}`}>
            รายละเอียด
          </Button>
          <button
            type="button"
            aria-pressed={inCompare}
            aria-label={`เทียบ ${name} ${btuFmt(picked.btu)}`}
            onClick={onCompare}
            className={cn(
              'pressable inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border px-4 text-small font-semibold',
              inCompare
                ? 'border-brand bg-brand text-on-brand'
                : 'border-line-strong/60 bg-surface text-ink-2 hover:border-brand hover:text-brand',
            )}
          >
            <Icon name={inCompare ? 'check' : 'plus'} size={16} strokeWidth={2.25} />
            เทียบ
          </button>
        </div>
      </div>
    </article>
  );
}

/** Radio group of BTU sizes (arrow keys move and pick, like a native radio group). */
export function SizePicker({
  skus,
  picked,
  onPick,
  label,
}: {
  skus: SkuLite[];
  picked: SkuLite;
  onPick: (sku: SkuLite) => void;
  label: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const at = Math.max(0, skus.indexOf(picked));
  const labels = sizeLabels(skus.map(k => k.btu), kbtu);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = skus.length;
    const map: Record<string, number> = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: n - 1 };
    if (!(e.key in map)) return;
    e.preventDefault();
    const j = (map[e.key] + n) % n;
    onPick(skus[j]);
    refs.current[j]?.focus();
  };
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-1.5">
      {skus.map((k, i) => {
        const on = i === at;
        return (
          <button
            key={k.sku}
            ref={el => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={on}
            aria-label={`${btuFmt(k.btu)} รุ่น ${k.sku} · ${baht(k.price)} ${EX_TH}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onPick(k)}
            onKeyDown={e => onKey(e, i)}
            className={cn(
              'pressable inline-flex min-h-11 min-w-12 items-center justify-center rounded-full border px-3 text-small font-semibold tabular-nums',
              on ? 'border-brand bg-brand text-on-brand' : 'border-line-strong/50 bg-surface text-ink-2 hover:border-brand hover:text-brand',
            )}
          >
            {labels[i]}
          </button>
        );
      })}
    </div>
  );
}
