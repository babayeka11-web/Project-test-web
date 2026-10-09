'use client';
// Short confirmations: toast('เพิ่มในใบเสนอราคาแล้ว', { action: { label: 'ดูใบเสนอราคา', href: '/quote/' } }).
// <Toaster /> is mounted once in the root layout. Toasts are announced politely (aria-live), never take focus,
// stay 4.5 s (7 s with an action), pause while hovered or focused, and sit above the phone MobileBar.
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { cn } from './cn';
import { Icon, type IconName } from './Icon';

export type ToastTone = 'neutral' | 'ok' | 'warn' | 'bad';
export type ToastAction = { label: string; onClick?: () => void; href?: string };
export type ToastOptions = {
  tone?: ToastTone;
  action?: ToastAction;
  /** Milliseconds before it hides; 0 = stays until closed. */
  duration?: number;
  /** Replace an existing toast with the same id instead of stacking (e.g. "copied"). */
  id?: string;
};
type ToastItem = Required<Pick<ToastOptions, 'tone' | 'duration'>> & {
  id: string;
  /** Changes when a toast is replaced by id, so its timer restarts. */
  instance: number;
  message: string;
  action?: ToastAction;
  leaving?: boolean;
};

let items: ToastItem[] = [];
const subs = new Set<() => void>();
const EMPTY: ToastItem[] = [];
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => {
  subs.add(f);
  return () => {
    subs.delete(f);
  };
};
let seq = 0;

/** Show a toast. Returns its id. */
export function toast(message: string, opts: ToastOptions = {}): string {
  const id = opts.id ?? `t${++seq}`;
  const item: ToastItem = {
    id,
    instance: ++seq,
    message,
    tone: opts.tone ?? 'neutral',
    action: opts.action,
    duration: opts.duration ?? (opts.action ? 7000 : 4500),
  };
  items = [...items.filter((t) => t.id !== id), item].slice(-3);
  emit();
  return id;
}

/** Hide a toast now (with its exit animation). */
toast.dismiss = (id: string) => {
  if (!items.some((t) => t.id === id && !t.leaving)) return;
  items = items.map((t) => (t.id === id ? { ...t, leaving: true } : t));
  emit();
  window.setTimeout(() => {
    items = items.filter((t) => t.id !== id);
    emit();
  }, 160);
};

const TONE_ICON: Record<ToastTone, IconName | null> = { neutral: null, ok: 'check', warn: 'alert', bad: 'alert' };
const TONE_COLOR: Record<ToastTone, string> = {
  neutral: '',
  ok: 'text-[color-mix(in_oklab,var(--color-ok)_45%,var(--color-bg))]',
  warn: 'text-[color-mix(in_oklab,var(--color-warn)_45%,var(--color-bg))]',
  bad: 'text-[color-mix(in_oklab,var(--color-bad)_45%,var(--color-bg))]',
};

function ToastView({ t }: { t: ToastItem }) {
  const [paused, setPaused] = useState(false);
  const remaining = useRef(t.duration);
  const started = useRef(0);

  useEffect(() => {
    if (!t.duration || paused || t.leaving) return;
    started.current = Date.now();
    const timer = window.setTimeout(() => toast.dismiss(t.id), remaining.current);
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(1200, remaining.current - (Date.now() - started.current));
    };
  }, [paused, t.duration, t.id, t.leaving]);

  const icon = TONE_ICON[t.tone];
  return (
    <li
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full items-center gap-3 rounded-[18px] bg-ink py-2.5 pl-4 pr-2 text-small text-bg shadow-pop',
        t.leaving ? 'animate-toast-out' : 'animate-toast-in',
      )}
    >
      {icon && <Icon name={icon} size={20} strokeWidth={2} className={TONE_COLOR[t.tone]} />}
      <p className="min-w-0 flex-1 py-1 font-medium leading-snug">{t.message}</p>
      {t.action &&
        (t.action.href ? (
          <Link
            href={t.action.href}
            onClick={() => {
              t.action?.onClick?.();
              toast.dismiss(t.id);
            }}
            className="pressable inline-flex min-h-10 shrink-0 items-center rounded-full bg-bg/12 px-3.5 font-semibold text-bg no-underline hover:bg-bg/20"
          >
            {t.action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              t.action?.onClick?.();
              toast.dismiss(t.id);
            }}
            className="pressable inline-flex min-h-10 shrink-0 items-center rounded-full bg-bg/12 px-3.5 font-semibold text-bg hover:bg-bg/20"
          >
            {t.action.label}
          </button>
        ))}
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        aria-label="ปิดการแจ้งเตือน"
        className="pressable grid size-10 shrink-0 place-items-center rounded-full text-bg/70 hover:bg-bg/12 hover:text-bg"
      >
        <Icon name="close" size={18} />
      </button>
    </li>
  );
}

/** Mount once (root layout). */
export function Toaster() {
  const list = useSyncExternalStore(subscribe, () => items, () => EMPTY);
  return (
    <section aria-label="การแจ้งเตือน" className="pointer-events-none fixed inset-x-0 z-[60] flex justify-center px-4 bottom-[calc(var(--mobilebar-h)+env(safe-area-inset-bottom,0px)+0.75rem)] md:bottom-6">
      <ol aria-live="polite" aria-relevant="additions text" className="flex w-full max-w-[26rem] flex-col gap-2">
        {list.map((t) => (
          <ToastView key={`${t.id}-${t.instance}`} t={t} />
        ))}
      </ol>
    </section>
  );
}
