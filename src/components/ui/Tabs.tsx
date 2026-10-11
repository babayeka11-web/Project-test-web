'use client';
// Tabs (WAI-ARIA tabs pattern, automatic activation): one tab stop, arrow keys move between tabs, Home/End jump.
// Every panel is rendered into the static HTML (inactive ones `hidden`) so content stays indexable.
// On phones (< 640px) tabs that do not fit wrap onto extra rows so none is hidden off-screen (a row that fits is
// unchanged); wider screens scroll a list that is too wide sideways, faded at the edge that has more.
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
  // y: the indicator sits under the selected tab's own row when the list wraps
  const [bar, setBar] = useState<{ x: number; y: number; w: number } | null>(null);
  // which edges still have tabs scrolled out of view (drives the edge fade)
  const [more, setMore] = useState({ start: false, end: false });

  const measure = useCallback(() => {
    const el = tabRefs.current[index];
    if (el) setBar({ x: el.offsetLeft, y: el.offsetTop + el.offsetHeight - 2, w: el.offsetWidth });
    const list = listRef.current;
    if (list) {
      const start = list.scrollLeft > 1;
      const end = list.scrollLeft + list.clientWidth < list.scrollWidth - 1;
      setMore((m) => (m.start === start && m.end === end ? m : { start, end }));
    }
  }, [index]);

  useLayoutEffect(() => {
    measure();
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;
    // the tabs too: a clamped list keeps its size when its labels grow (web font swap), the tabs do not
    const ro = new ResizeObserver(measure);
    ro.observe(list);
    tabRefs.current.forEach((el) => el && ro.observe(el));
    list.addEventListener('scroll', measure, { passive: true });
    return () => {
      ro.disconnect();
      list.removeEventListener('scroll', measure);
    };
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
  const fade = more.start || more.end ? edgeFade(more.start, more.end) : undefined;

  return (
    <div className={className}>
      <div
        ref={listRef}
        role="tablist"
        aria-label={label}
        style={fade ? { maskImage: fade, WebkitMaskImage: fade } : undefined}
        className={cn(
          // scroll-px keeps a tab scrolled into view by the keyboard clear of the faded edge
          'no-scrollbar relative flex max-w-full scroll-px-10 overflow-x-auto',
          line ? 'gap-1 border-b border-line' : 'gap-2 rounded-full bg-surface-2 p-1',
          'max-sm:flex-wrap max-sm:overflow-visible',
          // pill: half the one-row height, so a single row keeps its pill shape and wrapped rows get soft corners
          !line && 'max-sm:rounded-[1.625rem]',
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
                // Windows High Contrast drops backgrounds and the sliding bar: mark the selected tab another way
                selected &&
                  (line
                    ? 'forced-colors:underline forced-colors:decoration-2 forced-colors:underline-offset-8'
                    : 'forced-colors:forced-color-adjust-none forced-colors:bg-[SelectedItem] forced-colors:text-[SelectedItemText]'),
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
            className="absolute left-0 top-0 h-0.5 rounded-full bg-brand transition-[transform,width] duration-250 ease-air forced-colors:hidden"
            style={{ width: bar.w, transform: `translate(${bar.x}px, ${bar.y}px)` }}
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

/** Mask that fades the list out over 2.5rem at each edge that has more tabs beyond it. */
function edgeFade(start: boolean, end: boolean) {
  return `linear-gradient(to right, ${start ? 'transparent, black 2.5rem' : 'black'}, ${end ? 'black calc(100% - 2.5rem), transparent' : 'black'})`;
}
