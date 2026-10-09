'use client';
// Pick one of 2–4 short options (ล้างปกติ / ล้างใหญ่, ติดผนัง / แขวน …). A WAI-ARIA radiogroup: Tab enters the group,
// arrow keys move and select, Home/End jump. A sliding thumb shows the choice.
import { useCallback, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

export type SegmentOption<V extends string = string> = {
  value: V;
  label: ReactNode;
  /** Small second line (e.g. "C1", "฿700+"). */
  hint?: ReactNode;
  icon?: IconName;
  disabled?: boolean;
};

export type SegmentedControlProps<V extends string = string> = {
  options: SegmentOption<V>[];
  value: V;
  onChange: (value: V) => void;
  /** Accessible name of the group (use when no visible label points at it). */
  label?: string;
  /** id of a visible label element. */
  labelledBy?: string;
  size?: 'sm' | 'md';
  /** Stretch to the container width with equal segments. */
  fullWidth?: boolean;
  /** Also submit the value with a form. */
  name?: string;
  className?: string;
};

export function SegmentedControl<V extends string = string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  size = 'md',
  fullWidth,
  name,
  className,
}: SegmentedControlProps<V>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [thumb, setThumb] = useState<{ x: number; w: number } | null>(null);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const measure = useCallback(() => {
    const el = itemRefs.current[index];
    if (el) setThumb({ x: el.offsetLeft, w: el.offsetWidth });
  }, [index]);

  useLayoutEffect(() => {
    measure();
    const root = rootRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [measure]);

  const enabled = options.map((o, i) => (o.disabled ? -1 : i)).filter((i) => i >= 0);

  const move = (to: number) => {
    const opt = options[to];
    if (!opt || opt.disabled) return;
    onChange(opt.value);
    itemRefs.current[to]?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const pos = enabled.indexOf(index);
    let next: number | undefined;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = enabled[(pos + 1) % enabled.length];
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = enabled[(pos - 1 + enabled.length) % enabled.length];
    else if (e.key === 'Home') next = enabled[0];
    else if (e.key === 'End') next = enabled[enabled.length - 1];
    if (next === undefined) return;
    e.preventDefault();
    move(next);
  };

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={label}
      aria-labelledby={labelledBy}
      data-ready={thumb ? '' : undefined}
      className={cn(
        'group/seg no-scrollbar relative isolate max-w-full overflow-x-auto rounded-full border border-line bg-surface-2 p-1',
        fullWidth ? 'flex w-full' : 'inline-flex',
        className,
      )}
    >
      {thumb && (
        <span
          aria-hidden
          className="absolute inset-y-1 left-0 -z-10 rounded-full bg-surface shadow-card ring-1 ring-line transition-[transform,width] duration-250 ease-air"
          style={{ width: thumb.w, transform: `translateX(${thumb.x}px)` }}
        />
      )}
      {options.map((o, i) => {
        const checked = i === index;
        return (
          <button
            key={o.value}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            disabled={o.disabled}
            tabIndex={checked ? 0 : -1}
            onClick={() => move(i)}
            onKeyDown={onKeyDown}
            className={cn(
              'pressable relative inline-flex min-h-11 min-w-0 items-center justify-center gap-2 rounded-full font-semibold leading-tight',
              size === 'sm' ? 'text-small' : 'text-body',
              fullWidth ? 'flex-1 px-2 sm:px-3' : size === 'sm' ? 'shrink-0 px-3.5' : 'shrink-0 px-5',
              checked
                ? 'text-brand group-not-data-ready/seg:bg-surface group-not-data-ready/seg:shadow-card'
                : 'text-ink-2 hover:text-ink',
              o.disabled && 'opacity-50',
            )}
          >
            {o.icon && <Icon name={o.icon} size={size === 'sm' ? 16 : 18} />}
            <span className={cn('flex min-w-0 flex-col', o.hint ? 'items-center py-1' : '')}>
              <span className="truncate">{o.label}</span>
              {o.hint && <span className="text-meta font-medium leading-tight text-ink-3">{o.hint}</span>}
            </span>
          </button>
        );
      })}
      {name && <input type="hidden" name={name} value={value} />}
    </div>
  );
}
