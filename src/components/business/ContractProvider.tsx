'use client';
// Gives the calculator and the 12-month plan the same inputs (contract-store) and the same estimate. The rate table comes
// from the server page as a prop, so the estimate is already in the static HTML.
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { estimateContract, type ContractEstimate } from '@/lib/domain/contract';
import type { CleanRateTable } from '@/lib/domain/cleaning';
import { useContractState, type CalcState } from './contract-store';

type Value = {
  table: CleanRateTable;
  state: CalcState;
  est: ContractEstimate | null;
  /** the picked place is beyond the travel range — the team prices travel as a project */
  outOfRange: boolean;
};

const Ctx = createContext<Value | null>(null);

export function ContractProvider({ table, children }: { table: CleanRateTable; children: ReactNode }) {
  const state = useContractState();
  const value = useMemo<Value>(() => {
    const tier = state.zone?.tier;
    return {
      table,
      state,
      outOfRange: tier === 'out',
      est: estimateContract(table, {
        units: state.units,
        visits: state.visits,
        pkg: state.pkg,
        size: state.size,
        deep: state.deep,
        high: state.high,
        // an unknown place stays on the core-area rule; an out-of-range one (> 150 km) carries no travel in the figure,
        // which is what its notice says ("ตัวเลขนี้ยังไม่รวมค่าเดินทาง") — the team prices that trip as project work
        zone: state.zone && tier !== 'unknown' ? state.zone : null,
      }),
    };
  }, [table, state]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useContract(): Value {
  const v = useContext(Ctx);
  if (!v) throw new Error('useContract must be used inside <ContractProvider>');
  return v;
}
