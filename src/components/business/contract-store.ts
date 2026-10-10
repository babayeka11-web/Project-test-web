'use client';
// One small store for the /business/ page: the contract calculator's inputs. It is shared by the calculator, the sector
// samples ("ปรับจำนวนเครื่องเอง" loads a sample into it) and the 12-month plan (reads visits / deep clean).
// The store holds INPUTS only; the estimate itself is computed in <ContractProvider> from the rate table prop, so the
// first server render and the first client render show the same numbers.
// Server snapshot = the initial state, so hydration always matches.
import { useSyncExternalStore } from 'react';
import { PRESETS } from '@/lib/domain/contract';
import type { CleanPkgId } from '@/lib/domain/cleaning';
import type { AddrPick } from '@/lib/domain/address';
import type { Zone } from '@/lib/domain/travel';
import type { AcTypeId } from '@/lib/domain/types';

export type Visits = 2 | 3 | 4;
export type CalcUnits = Record<AcTypeId, number>;
export type CalcState = {
  units: CalcUnits;
  visits: Visits;
  pkg: CleanPkgId;
  /** size band id of most units (SIZE_BANDS) */
  size: number;
  /** one C2 deep clean per year */
  deep: boolean;
  /** some units are higher than 3 m (assessed on site) */
  high: boolean;
  /** preset id while the units are untouched */
  preset: string | null;
  /** name of the loaded sample / preset (quote line label) */
  label: string | null;
  addr: AddrPick | null;
  zone: Zone | null;
};

export const DEFAULT_PRESET_ID = 'office-m';
export const MAX_UNITS = 999;

const zeroUnits = (): CalcUnits => ({ wall: 0, ceiling: 0, cassette: 0, floor: 0, duct: 0 });
export const toUnits = (u: Partial<Record<AcTypeId, number>>): CalcUnits => ({ ...zeroUnits(), ...u });
export const asVisits = (v: number): Visits => (v === 2 || v === 4 ? v : 3);

function initial(): CalcState {
  const p = PRESETS.find(x => x.id === DEFAULT_PRESET_ID) ?? PRESETS[0];
  return { units: toUnits(p.units), visits: asVisits(p.visits), pkg: 'Standard Care', size: 0, deep: true, high: false, preset: p.id, label: p.th, addr: null, zone: null };
}

let state: CalcState = initial();
const SERVER: CalcState = initial();
const subs = new Set<() => void>();
const emit = () => subs.forEach(fn => fn());

export const contractStore = {
  get: () => state,
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
  set(patch: Partial<CalcState>) {
    state = { ...state, ...patch };
    emit();
  },
  setUnit(type: AcTypeId, n: number) {
    const v = Math.max(0, Math.min(MAX_UNITS, Math.round(n) || 0));
    if (state.units[type] === v) return;
    state = { ...state, units: { ...state.units, [type]: v }, preset: null, label: null };
    emit();
  },
  applyPreset(id: string) {
    const p = PRESETS.find(x => x.id === id);
    if (!p) return;
    state = { ...state, units: toUnits(p.units), visits: asVisits(p.visits), preset: p.id, label: p.th };
    emit();
  },
  /** Load a sector sample (units, visits, package, size band, one deep clean). */
  load(o: { units: Partial<Record<AcTypeId, number>>; visits: number; pkg: CleanPkgId; size: number; label: string }) {
    state = { ...state, units: toUnits(o.units), visits: asVisits(o.visits), pkg: o.pkg, size: o.size, deep: true, preset: null, label: o.label };
    emit();
  },
};

export function useContractState(): CalcState {
  return useSyncExternalStore(contractStore.subscribe, contractStore.get, () => SERVER);
}
