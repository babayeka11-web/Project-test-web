'use client';
// One small store for the /business/ page: the contract calculator's inputs, shared by the calculator, the sector samples
// ("ปรับจำนวนเครื่องเอง" loads a sample) and the 12-month plan (reads visits / deep clean and the per-visit amounts).
// The calculator publishes the rate table once (setTable) so the plan can show the same estimate without its own copy.
// Server snapshot = the initial state without a table, so server HTML and the first client render always match.
import { useSyncExternalStore } from 'react';
import { estimateContract, PRESETS, type ContractEstimate } from '@/lib/domain/contract';
import type { CleanPkgId, CleanRateTable } from '@/lib/domain/cleaning';
import type { AddrPick } from '@/lib/domain/address';
import type { Zone } from '@/lib/domain/travel';
import type { AcTypeId } from '@/lib/domain/types';

export type Visits = 2 | 3 | 4;
export type CalcUnits = Record<AcTypeId, number>;
export type CalcState = {
  units: CalcUnits;
  visits: Visits;
  pkg: CleanPkgId;
  size: number;
  deep: boolean;
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
const asVisits = (v: number): Visits => (v === 2 || v === 4 ? v : 3);

function initial(): CalcState {
  const p = PRESETS.find(x => x.id === DEFAULT_PRESET_ID) ?? PRESETS[0];
  return { units: toUnits(p.units), visits: asVisits(p.visits), pkg: 'Standard Care', size: 0, deep: true, high: false, preset: p.id, label: p.th, addr: null, zone: null };
}

type Snapshot = { state: CalcState; est: ContractEstimate | null; hasTable: boolean };

let table: CleanRateTable | null = null;
let state: CalcState = initial();
const compute = (): Snapshot => ({
  state,
  hasTable: !!table,
  est: table
    ? estimateContract(table, {
        units: state.units,
        visits: state.visits,
        pkg: state.pkg,
        size: state.size,
        deep: state.deep,
        high: state.high,
        // an unknown place does not change the travel rule — the estimate stays on the core-area rule
        zone: state.zone && state.zone.tier !== 'unknown' ? state.zone : null,
      })
    : null,
});
let snap: Snapshot = compute();
const SERVER: Snapshot = { state: initial(), est: null, hasTable: false };
const subs = new Set<() => void>();
const emit = () => {
  snap = compute();
  subs.forEach(fn => fn());
};

export const contractStore = {
  get: () => snap,
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => void subs.delete(fn);
  },
  setTable(t: CleanRateTable) {
    if (table === t) return;
    table = t;
    emit();
  },
  set(patch: Partial<CalcState>) {
    state = { ...state, ...patch };
    emit();
  },
  setUnit(type: AcTypeId, n: number) {
    state = { ...state, units: { ...state.units, [type]: Math.max(0, Math.min(MAX_UNITS, Math.round(n) || 0)) }, preset: null, label: null };
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

export function useContract(): Snapshot {
  return useSyncExternalStore(contractStore.subscribe, contractStore.get, () => SERVER);
}
