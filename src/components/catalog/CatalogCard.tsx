'use client';
// One series in the catalog grid: a small type glyph, brand, series name and the picked model code, the BTU sizes you can
// pick, the price of the picked size (before VAT) with the standard-installation total, a link to that size's own page
// and a compare toggle. The whole card opens the series page.
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
    // the series link stretches over the whole card (after:inset-0); the size radios and buttons sit above it (z-10)
    <article className="lift relative flex w-full min-w-0 flex-col gap-3 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
          <TypeArt type={m.type} className="size-9" aria-hidden />
        </span>
        <p className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-small font-semibold text-ink-2">
          <span>{m.brandName}</span>
          <Badge tone="outline">{TYPE_BY_ID[m.type].th}</Badge>
          <Badge tone={m.inverter ? 'sky' : 'neutral'}>{m.inverter ? 'Inverter' : 'Fixed speed'}</Badge>
        </p>
      </div>

      <div className="flex flex-col">
        <h3 className="text-h3 leading-snug">
          <Link
            id={titleId}
            href={seriesHref}
            className="rounded-md text-ink no-underline after:absolute after:inset-0 after:rounded-card after:content-[''] hover:text-brand hover:underline"
          >
            {/* " / " → " /\u00a0" keeps the slash with the next word instead of ending a line on it */}
            {m.series.replace(/ \/ /g, ' /\u00a0')}
          </Link>
        </h3>
        <p className="font-mono text-meta text-ink-3 [overflow-wrap:anywhere]">{picked.sku}</p>
      </div>

      <SizePicker skus={skus} picked={picked} onPick={onPick} label={`ขนาด BTU ของ ${name}`} className="relative z-10" />

      <div className="flex flex-col gap-0.5">
        <Price amount={picked.price} size="lg" />
        {install != null ? (
          <Price amount={install} prefix="พร้อมติดตั้งมาตรฐาน" size="sm" className="text-ink-2" />
        ) : (
          <p className="text-small text-ink-2">ติดตั้ง: สำรวจหน้างานก่อนเสนอราคา</p>
        )}
      </div>

      <div className="relative z-10 mt-auto flex flex-wrap gap-2">
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
              ? 'border-brand bg-brand text-on-brand forced-colors:forced-color-adjust-none forced-colors:bg-[SelectedItem] forced-colors:text-[SelectedItemText]'
              : 'border-line-strong/60 bg-surface text-ink-2 hover:border-brand hover:text-brand',
          )}
        >
          <Icon name={inCompare ? 'check' : 'plus'} size={16} strokeWidth={2.25} />
          เทียบ
        </button>
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
  className,
}: {
  skus: SkuLite[];
  picked: SkuLite;
  onPick: (sku: SkuLite) => void;
  label: string;
  className?: string;
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
    <div role="radiogroup" aria-label={label} className={cn('flex flex-wrap gap-1.5', className)}>
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
            // the name starts with the visible label ("12k"), so voice control users can say what they see (WCAG 2.5.3)
            aria-label={`${labels[i]} · ${btuFmt(k.btu)} รุ่น ${k.sku} · ${baht(k.price)} ${EX_TH}`}
            tabIndex={on ? 0 : -1}
            onClick={() => onPick(k)}
            onKeyDown={e => onKey(e, i)}
            className={cn(
              'pressable inline-flex min-h-11 min-w-12 items-center justify-center rounded-full border px-3 text-small font-semibold tabular-nums',
              on
                ? 'border-brand bg-brand text-on-brand forced-colors:forced-color-adjust-none forced-colors:bg-[SelectedItem] forced-colors:text-[SelectedItemText]'
                : 'border-line-strong/50 bg-surface text-ink-2 hover:border-brand hover:text-brand',
            )}
          >
            {labels[i]}
          </button>
        );
      })}
    </div>
  );
}
