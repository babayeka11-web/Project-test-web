'use client';
// Tabs (WAI-ARIA tabs pattern, automatic activation): one tab stop, arrow keys move between tabs, Home/End jump.
// Every panel is rendered into the static HTML (inactive ones `hidden`) so content stays indexable.
import { useCallback, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

export type TabItem = {
  id: string;
  label: ReactNode;
  content: ReactNode;
  icon?: IconName;
  /** Small count after the label. */
  count?: number;
};

export type TabsProps = {
  items: TabItem[];
  /** Accessible name of the tab list. */
  label: string;
  /** Controlled value (tab id). */
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** line = underline indicator (page-level) · pill = filled pills (inside cards). */
  variant?: 'line' | 'pill';
  className?: string;
  /** Classes for every panel. */
  panelClassName?: string;
};

export function Tabs({
  items,
  label,
  value,
  defaultValue,
  onChange,
  variant = 'line',
  className,
  panelClassName,
}: TabsProps) {
  const uid = useId();
  const [inner, setInner] = useState(defaultValue ?? items[0]?.id);
  const active = value ?? inner;
  const index = Math.max(
    0,
    items.findIndex((t) => t.id === active),
  );
  const listRef = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [bar, setBar] = useState<{ x: number; w: number } | null>(null);

  const measure = useCallback(() => {
    const el = tabRefs.current[index];
    if (el) setBar({ x: el.offsetLeft, w: el.offsetWidth });
  }, [index]);

  useLayoutEffect(() => {
    measure();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    return () => ro.disconnect();
  }, [measure]);

  const select = (i: number, focus = false) => {
    const t = items[i];
    if (!t) return;
    if (value === undefined) setInner(t.id);
    onChange?.(t.id);
    const el = tabRefs.current[i];
    if (focus && el) {
      el.focus();
      el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    const n = items.length;
    let next: number | undefined;
    if (e.key === 'ArrowRight') next = (index + 1) % n;
    else if (e.key === 'ArrowLeft') next = (index - 1 + n) % n;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === undefined) return;
    e.preventDefault();
    select(next, true);
  };

  const line = variant === 'line';

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        className={cn(
          'no-scrollbar relative flex max-w-full overflow-x-auto',
          line ? 'gap-1 border-b border-line' : 'gap-2 rounded-full bg-surface-2 p-1',
        )}
      >
        {items.map((t, i) => {
          const selected = i === index;
          return (
            <button
              key={t.id}
              ref={(el) => {
                tabRefs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${uid}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${uid}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => select(i)}
              onKeyDown={onKeyDown}
              className={cn(
                'pressable relative inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap font-semibold',
                line ? 'rounded-t-control px-4 pb-3 pt-2.5' : 'rounded-full px-4 text-small',
                selected
                  ? line
                    ? 'text-brand'
                    : 'bg-surface text-brand shadow-card'
                  : 'text-ink-2 hover:text-ink',
                line && selected && !bar && 'shadow-[inset_0_-2px_0_var(--color-brand)]',
              )}
            >
              {t.icon && <Icon name={t.icon} size={18} />}
              {t.label}
              {t.count != null && (
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-meta leading-none tabular-nums',
                    selected ? 'bg-sky-soft text-brand' : 'bg-surface-2 text-ink-3',
                  )}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
        {line && bar && (
          <span
            aria-hidden
            className="absolute bottom-0 left-0 h-0.5 rounded-full bg-brand transition-[transform,width] duration-250 ease-air"
            style={{ width: bar.w, transform: `translateX(${bar.x}px)` }}
          />
        )}
      </div>
      {items.map((t, i) => (
        <div
          key={t.id}
          role="tabpanel"
          id={`${uid}-panel-${t.id}`}
          aria-labelledby={`${uid}-tab-${t.id}`}
          hidden={i !== index}
          tabIndex={0}
          className={cn('pt-6 focus-visible:rounded-control', panelClassName)}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
