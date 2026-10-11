'use client';
// Phone action dock: a tool's live figure and its one action, fixed in thumb reach just above the MobileBar. It shows
// while the tool (`watch`) is on screen and its in-flow action (`hideWhen`) is not, so the page never shows the same
// action twice. While shown it sets html[data-dock-open] (the header's "จองล้างแอร์" steps back to soft) and --dock-h
// (focused fields scroll clear of it) — the contract in docs/dev/UI.md §2; both are cleared when it hides or unmounts.
// Phones only (< 768px): wider screens keep the tool's sticky summary column. No aria-live: the inline summary announces.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { cn } from '@/components/ui';

export type ActionDockProps = {
  /** The tool: the dock can show while any of it is on screen. */
  watch: RefObject<HTMLElement | null>;
  /** The tool's in-flow action (or its wrapper): the dock hides while it is on screen. */
  hideWhen: RefObject<HTMLElement | null>;
  /** Region name, e.g. "สรุปราคาและใส่ใบเสนอราคา". */
  label: string;
  /** Left side: the live figure (a Price with its label). */
  summary: ReactNode;
  /** Right side: the one action (a small Button or AddToQuote). */
  action: ReactNode;
};

const PHONE = '(max-width: 767.98px)';
const DOCK_ATTR = 'data-dock-open';
const FOCUSABLE = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// useLayoutEffect warns during server rendering; the dock has nothing to measure there anyway
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export function ActionDock({ watch, hideWhen, label, summary, action }: ActionDockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [phone, setPhone] = useState(false);
  const [watchIn, setWatchIn] = useState(false);
  const [hideIn, setHideIn] = useState(false);
  const shown = phone && watchIn && !hideIn;

  // follow the phone breakpoint (the dock is md:hidden; a hidden dock must not tell the header it is open)
  useEffect(() => {
    const mq = window.matchMedia(PHONE);
    const read = () => setPhone(mq.matches);
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, []);

  // what counts as "on screen" is the band between the sticky header and the dock's bottom edge (the MobileBar)
  useEffect(() => {
    const dock = ref.current;
    const tool = watch.current;
    if (!phone || !dock || !tool || typeof IntersectionObserver === 'undefined') return;
    const html = getComputedStyle(document.documentElement);
    const top = Math.round(parseFloat(html.scrollPaddingTop) || 0);
    // the MobileBar (+ safe area) only — not a toast that happens to be showing right now
    const bottom = Math.round((parseFloat(getComputedStyle(dock).bottom) || 0) - (parseFloat(html.getPropertyValue('--toast-h')) || 0));
    const io = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.target === tool) setWatchIn(e.isIntersecting);
          else setHideIn(e.isIntersecting);
        }
      },
      { rootMargin: `-${top}px 0px -${bottom}px 0px` },
    );
    io.observe(tool);
    if (hideWhen.current) io.observe(hideWhen.current);
    return () => io.disconnect();
  }, [phone, watch, hideWhen]);

  // hidden = inert and aria-hidden. Set here, after a focused dock button has handed focus to the in-flow action, so
  // keyboard focus is never dropped to <body> and aria-hidden never lands on a focused element.
  useIsoLayoutEffect(() => {
    const dock = ref.current;
    if (!dock) return;
    if (!shown && dock.contains(document.activeElement)) {
      hideWhen.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus({ preventScroll: true });
    }
    dock.inert = !shown;
    if (shown) dock.removeAttribute('aria-hidden');
    else dock.setAttribute('aria-hidden', 'true');
  }, [shown, hideWhen]);

  // while shown: html[data-dock-open] and --dock-h (its height, kept current)
  useEffect(() => {
    const dock = ref.current;
    if (!shown || !dock) return;
    const html = document.documentElement;
    html.toggleAttribute(DOCK_ATTR, true);
    const publish = () => html.style.setProperty('--dock-h', `${Math.ceil(dock.getBoundingClientRect().height)}px`);
    publish();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(publish);
    ro?.observe(dock);
    return () => {
      ro?.disconnect();
      html.removeAttribute(DOCK_ATTR);
      html.style.removeProperty('--dock-h');
    };
  }, [shown]);

  return (
    <div
      ref={ref}
      role="region"
      aria-label={label}
      className={cn(
        // sits on the MobileBar; while toasts show (--toast-h, set by the Toaster) it moves up above them instead of
        // hiding under the toast it just triggered
        'md:hidden fixed inset-x-0 bottom-[calc(var(--mobilebar-h)+var(--toast-h,0px)+env(safe-area-inset-bottom,0px))] z-30 px-gutter pb-2 transition-[transform,opacity,bottom] duration-250 ease-air motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-[calc(100%+1rem)] opacity-0',
      )}
    >
      <div className="glass flex items-center justify-between gap-3 rounded-panel border border-line py-2 pl-4 pr-2 shadow-pop">
        <div className="min-w-0">{summary}</div>
        <div className="shrink-0">{action}</div>
      </div>
    </div>
  );
}
