'use client';
// "ใส่ใบเสนอราคา" — the one button every page uses to put lines into the quote (src/lib/cart.ts).
// Lines are built by the caller with the domain helpers (productLines, cleanPriceLine, repairLine, installItemLine …).
// VRV / VRF never goes into the quote: those lines are refused with a pointer to the project inquiry.
import { useState } from 'react';
import { Button, toast, type ButtonSize, type ButtonVariant } from '@/components/ui';
import { cart, type CartLineInput } from '@/lib/cart';
import { isVRF } from '@/lib/domain/content';

export type AddToQuoteProps = {
  /** Lines to add, or a function that builds them at click time (current selections). */
  lines: readonly CartLineInput[] | (() => readonly CartLineInput[]);
  label?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  /** Called after the lines were added. */
  onAdded?: (count: number) => void;
};

export function AddToQuote({ lines, label = 'ใส่ใบเสนอราคา', variant = 'secondary', size = 'md', fullWidth, className, disabled, onAdded }: AddToQuoteProps) {
  const [busy, setBusy] = useState(false);
  const add = () => {
    const list = typeof lines === 'function' ? lines() : lines;
    if (!list.length) return;
    if (list.some(l => isVRF(l.name, l.detail))) {
      toast('ระบบ VRV / VRF เป็นงานโครงการ ทีมสำรวจและออกแบบให้แยก', { tone: 'warn', action: { label: 'ติดต่อทีมโครงการ', href: '/contact/?topic=vrf' } });
      return;
    }
    setBusy(true);
    cart.addMany(list);
    toast('เพิ่มในใบเสนอราคาแล้ว', { tone: 'ok', action: { label: 'ดูใบเสนอราคา', href: '/quote/' } });
    onAdded?.(list.length);
    window.setTimeout(() => setBusy(false), 250);
  };
  return (
    <Button type="button" icon="quote" variant={variant} size={size} fullWidth={fullWidth} className={className} disabled={disabled || busy} onClick={add}>
      {label}
    </Button>
  );
}
