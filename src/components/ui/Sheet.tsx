'use client';
// Modal sheet on the native <dialog> (top layer, the rest of the page inert, focus kept inside).
// Esc, the close button and a click on the dimmed backdrop close it; page scroll is locked while open and focus
// returns to the control that opened it. Slides in from the right/left, up from the bottom, or fades in centred.
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { cn } from './cn';
import { IconButton } from './Button';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Visible heading (h2) and the dialog's accessible name. */
  title: ReactNode;
  /** Short line under the title (also the accessible description). */
  description?: ReactNode;
  side?: 'right' | 'left' | 'bottom' | 'center';
  /** Panel width for side/center sheets. */
  size?: 'sm' | 'md' | 'lg';
  /** Sticky area under the scrolling body (totals, main action). */
  footer?: ReactNode;
  /** Content before the title row (e.g. a logo); rarely needed. */
  headerStart?: ReactNode;
  children?: ReactNode;
  className?: string;
};

const WIDTH = { sm: 'sm:w-[24rem]', md: 'sm:w-[28rem]', lg: 'sm:w-[36rem]' } as const;
const EXIT_MS = 200;

let locks = 0;
function lockScroll() {
  if (locks++ === 0) {
    const sbw = window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.style.overflow = 'hidden';
    if (sbw > 0) document.documentElement.style.paddingRight = `${sbw}px`;
  }
}
function unlockScroll() {
  if (--locks <= 0) {
    locks = 0;
    document.documentElement.style.overflow = '';
    document.documentElement.style.paddingRight = '';
  }
}

export function Sheet({
  open,
  onClose,
  title,
  description,
  side = 'right',
  size = 'sm',
  footer,
  headerStart,
  children,
  className,
}: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const pressStartedOnBackdrop = useRef(false);
  const [state, setState] = useState<'closed' | 'open' | 'closing'>('closed');
  const uid = useId();
  const titleId = `${uid}-title`;
  const descId = description ? `${uid}-desc` : undefined;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
      lockScroll();
      setState('open');
      return;
    }
    if (!open && dialog.open) {
      setState('closing');
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const t = window.setTimeout(
        () => {
          dialog.close();
          unlockScroll();
          setState('closed');
          opener.current?.focus?.({ preventScroll: true });
        },
        reduce ? 0 : EXIT_MS,
      );
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // Unmounting while open: release the lock.
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) {
        dialog.close();
        unlockScroll();
      }
    };
  }, []);

  const panel = {
    right: cn('ml-auto mr-0 h-dvh max-h-dvh w-[min(100vw-2.5rem,24rem)] rounded-l-panel', WIDTH[size]),
    left: cn('ml-0 mr-auto h-dvh max-h-dvh w-[min(100vw-2.5rem,24rem)] rounded-r-panel', WIDTH[size]),
    bottom: 'mb-0 mt-auto max-h-[88dvh] w-full max-w-none rounded-t-panel sm:mx-auto sm:max-w-[40rem]',
    center: cn('m-auto max-h-[min(88dvh,48rem)] w-[min(100vw-2rem,28rem)] rounded-panel', WIDTH[size]),
  }[side];

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descId}
      data-side={side}
      data-state={state}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onPointerDown={(e) => {
        pressStartedOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        // A click whose press started and ended on the <dialog> itself (outside the panel content) is on the backdrop.
        if (e.target === e.currentTarget && pressStartedOnBackdrop.current) {
          const r = e.currentTarget.getBoundingClientRect();
          const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          if (!inside) onClose();
        }
      }}
      className={cn(
        'ui-sheet fixed inset-0 flex-col overflow-hidden border-0 bg-surface p-0 text-ink shadow-pop outline-none open:flex',
        panel,
        className,
      )}
    >
      {side === 'bottom' && <span aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-line-strong/40" />}
      <div className="flex shrink-0 items-start gap-3 px-5 pb-3 pt-4 sm:px-6 sm:pt-5">
        {headerStart}
        <div className="min-w-0 flex-1 pt-2">
          <h2 id={titleId} className="text-h3 leading-snug">
            {title}
          </h2>
          {description && (
            <p id={descId} className="mt-1 text-small text-ink-2">
              {description}
            </p>
          )}
        </div>
        <IconButton icon="close" label="ปิด" onClick={onClose} className="-mr-2 shrink-0" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-6">{children}</div>
      {footer && <div className="safe-bottom shrink-0 border-t border-line bg-surface px-5 py-4 sm:px-6">{footer}</div>}
    </dialog>
  );
}
