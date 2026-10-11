'use client';
// "ใส่ใบเสนอราคา" — the one button every page uses to put lines into the quote (src/lib/cart.ts).
// Lines are built by the caller with the domain helpers (productLines, cleanPriceLine, repairLine, installItemLine …).
// VRV / VRF never goes into the quote: those lines are refused with a pointer to the project inquiry.
// The button never disables itself (docs/dev/UI.md §2): a 250 ms guard drops a repeated press and focus stays on it.
// With an array of lines it also knows when they are already in the quote: the same button turns into
// "อยู่ในใบเสนอราคาแล้ว" (no-op), so a double tap cannot silently add a second unit; md/lg then offer "ดูใบเสนอราคา" and
// a deliberate "เพิ่มอีก 1 ชุด". Function-form lines (built at click time) keep the plain add button.
import { useRef } from 'react';
import { Button, cn, toast, type ButtonSize, type ButtonVariant } from '@/components/ui';
import { cart, useCart, type CartLine, type CartLineInput } from '@/lib/cart';
import { isVRF } from '@/lib/domain/content';

type Lines = readonly CartLineInput[] | (() => readonly CartLineInput[]);

export type AddToQuoteProps = {
  /** Lines to add, or a function that builds them at click time (current selections). */
  lines: Lines;
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  /** Nothing to add yet: the button is aria-disabled (dimmed, presses ignored) but keeps focus. */
  disabled?: boolean;
  /** Called after the lines were added. */
  onAdded?: (count: number) => void;
};

/** The same line as cart.add() merges into (key, unit price and detail). */
const sameLine = (i: CartLine, l: CartLineInput) => i.key === l.key && i.unitEx === l.unitEx && (i.detail ?? '') === (l.detail ?? '');
/** cart.add() keeps these once per quote (survey request, annual contract, rush fee): "add again" cannot add them. */
const oncePerQuote = (l: CartLineInput) => l.kind === 'survey' || !!l.fixed || l.group === 'contract' || l.group === 'rush';
/** Changes whenever add() added a line or a unit. */
const cartSignature = () => cart.get().lines.reduce((n, l) => n + l.qty, cart.get().lines.length);

const GUARD_MS = 250;
const TOAST_ID = 'add-to-quote';
const VIEW = { label: 'ดูใบเสนอราคา', href: '/quote/' } as const;

/** True when `lines` is an array and every one of them is already in the quote (function-form lines: false). */
export function useInQuote(lines: Lines): boolean {
  const { lines: cartLines } = useCart();
  if (typeof lines === 'function') return false;
  return lines.length > 0 && lines.every(l => cartLines.some(i => sameLine(i, l)));
}

export function AddToQuote({ lines, label = 'ใส่ใบเสนอราคา', variant = 'secondary', size = 'md', fullWidth, className, disabled, onAdded }: AddToQuoteProps) {
  const busyRef = useRef(false);
  const inQuote = useInQuote(lines);

  const add = (again = false) => {
    if (busyRef.current || disabled) return;
    const list = typeof lines === 'function' ? lines() : lines;
    if (!list.length) return;
    if (list.some(l => isVRF(l.name, l.detail))) {
      toast('ระบบ VRV / VRF เป็นงานโครงการ ทีมสำรวจและออกแบบให้แยก', { tone: 'warn', action: { label: 'ติดต่อทีมโครงการ', href: '/contact/?topic=vrf' } });
      return;
    }
    busyRef.current = true;
    window.setTimeout(() => {
      busyRef.current = false;
    }, GUARD_MS);
    const before = cartSignature();
    cart.addMany(list);
    if (cartSignature() === before) {
      toast('อยู่ในใบเสนอราคาแล้ว', { id: TOAST_ID, action: VIEW });
      return;
    }
    toast(again ? 'เพิ่มอีก 1 ชุดในใบเสนอราคาแล้ว' : 'เพิ่มในใบเสนอราคาแล้ว', { id: TOAST_ID, tone: 'ok', action: VIEW });
    onAdded?.(list.length);
  };

  const blocked = disabled || inQuote;
  const more = inQuote && size !== 'sm';
  const canAddAgain = more && typeof lines !== 'function' && lines.some(l => !oncePerQuote(l));

  // One element tree in both states (button first, extras after it), so the focused button is never re-mounted.
  return (
    <>
      <Button
        type="button"
        icon={inQuote ? 'check' : 'quote'}
        variant={inQuote ? 'soft' : variant}
        size={size}
        fullWidth={fullWidth}
        // a state, not a dead control: keep it fully legible
        className={cn(className, inQuote && !disabled && 'aria-disabled:opacity-100!')}
        aria-disabled={blocked || undefined}
        onClick={blocked ? undefined : () => add()}
      >
        {inQuote ? 'อยู่ในใบเสนอราคาแล้ว' : label}
      </Button>
      {more && (
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <Button href={VIEW.href} variant="quiet" size="sm" icon="quote">
            {VIEW.label}
          </Button>
          {canAddAgain && (
            <Button type="button" variant="quiet" size="sm" icon="plus" onClick={() => add(true)}>
              เพิ่มอีก 1 ชุด
            </Button>
          )}
        </div>
      )}
    </>
  );
}
