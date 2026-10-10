'use client';
// "ปรับจำนวนเครื่องเอง": puts a sector's sample contract into the calculator and scrolls there.
import { Button, toast } from '@/components/ui';
import type { CleanPkgId } from '@/lib/domain/cleaning';
import type { AcTypeId } from '@/lib/domain/types';
import { contractStore } from './contract-store';

export type LoadSampleButtonProps = {
  units: Partial<Record<AcTypeId, number>>;
  visits: number;
  pkg: CleanPkgId;
  size: number;
  /** name of the loaded sample (the quote line label) */
  label: string;
  /** extra sentence in the toast, e.g. "ตัวอย่างนี้เป็น 1 สาขา" */
  note?: string;
};

export function LoadSampleButton({ units, visits, pkg, size, label, note }: LoadSampleButtonProps) {
  const go = () => {
    contractStore.load({ units, visits, pkg, size, label });
    toast(`โหลดตัวอย่างแล้ว${note ? ` · ${note}` : ''}`, { tone: 'ok' });
    const el = document.getElementById('calculator');
    if (el) {
      let reduce = false;
      try {
        reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      } catch {
        /* default smooth */
      }
      el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
  };
  return (
    <Button type="button" variant="secondary" icon="sliders" fullWidth onClick={go}>
      ปรับจำนวนเครื่องเอง
    </Button>
  );
}
