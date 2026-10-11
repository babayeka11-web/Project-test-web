'use client';
// Quantity stepper: − value + with 44px targets. The value is also typeable (spinbutton: ↑/↓, PageUp/PageDown,
// Home/End) and clamped to min/max when the field is left. At a limit − / + are aria-disabled, never natively disabled:
// a button that disables itself under the keyboard drops focus to <body>.
import { useEffect, useId, useState, type KeyboardEvent } from 'react';
import { cn } from './cn';
import { Icon } from './Icon';

export type StepperProps = {
  value: number;
  onChange: (value: number) => void;
  /** Accessible name, e.g. "จำนวนเครื่อง". Required: the control has no visible label of its own. */
  label: string;
  min?: number;
  max?: number;
  step?: number;
  /** Unit after the number, e.g. "เครื่อง". */
  unit?: string;
  size?: 'sm' | 'md';
  disabled?: boolean;
  /** id of a visible label/description. */
  describedBy?: string;
  name?: string;
  className?: string;
};

export function Stepper({
  value,
  onChange,
  label,
  min = 0,
  max = 99,
  step = 1,
  unit,
  size = 'md',
  disabled,
  describedBy,
  name,
  className,
}: StepperProps) {
  const id = useId();
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const set = (n: number) => {
    const next = clamp(n);
    if (next !== value) onChange(next);
    setDraft(String(next));
  };
  const commit = () => {
    const n = parseInt(draft.replace(/[^\d-]/g, ''), 10);
    set(Number.isFinite(n) ? n : value);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const map: Record<string, number> = {
      ArrowUp: value + step,
      ArrowDown: value - step,
      PageUp: value + step * 10,
      PageDown: value - step * 10,
      Home: min,
      End: max,
    };
    if (e.key in map) {
      e.preventDefault();
      set(map[e.key]);
    } else if (e.key === 'Enter') {
      commit();
    }
  };

  const atMin = value <= min;
  const atMax = value >= max;
  const btn = cn(
    'pressable grid shrink-0 place-items-center rounded-full text-ink transition-colors hover:bg-surface-2 hover:text-brand',
    'disabled:opacity-35 disabled:hover:bg-transparent',
    'aria-disabled:cursor-not-allowed aria-disabled:opacity-35 aria-disabled:hover:bg-transparent aria-disabled:hover:text-ink',
    size === 'sm' ? 'size-11' : 'size-12',
  );

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        'inline-flex items-center rounded-full border border-line-strong/60 bg-surface p-0.5 transition-shadow',
        'has-[input:focus]:border-focus has-[input:focus]:ring-4 has-[input:focus]:ring-focus/20',
        // invisible normally; Windows High Contrast paints it, where the box-shadow ring is dropped
        'has-[input:focus]:outline-2 has-[input:focus]:outline-transparent',
        disabled && 'opacity-60',
        className,
      )}
    >
      <button
        type="button"
        className={btn}
        onClick={() => {
          if (!disabled && !atMin) set(value - step);
        }}
        disabled={disabled}
        aria-disabled={atMin || undefined}
        aria-label={`ลด${label}`}
        aria-controls={id}
      >
        <Icon name="minus" size={20} strokeWidth={2} />
      </button>
      <label className="flex items-baseline gap-1 px-1">
        <span className="sr-only">{label}</span>
        <input
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          role="spinbutton"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-describedby={describedBy}
          disabled={disabled}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          onFocus={(e) => e.target.select()}
          className={cn(
            'w-[3ch] min-w-[2.5ch] bg-transparent text-center font-semibold tabular-nums text-ink outline-none [field-sizing:content]',
            size === 'sm' ? 'text-body' : 'text-[1.125rem]',
          )}
        />
        {unit && <span className="text-small text-ink-2">{unit}</span>}
      </label>
      <button
        type="button"
        className={btn}
        onClick={() => {
          if (!disabled && !atMax) set(value + step);
        }}
        disabled={disabled}
        aria-disabled={atMax || undefined}
        aria-label={`เพิ่ม${label}`}
        aria-controls={id}
      >
        <Icon name="plus" size={20} strokeWidth={2} />
      </button>
    </div>
  );
}
