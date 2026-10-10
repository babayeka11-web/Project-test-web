// Serialisable shapes the server page hands to the client components of /installation/ (no Pricebook import here).
import type { InstallItem } from '@/lib/domain/install';

/** The part of an installation-sheet row that the quote needs (installItemLine takes exactly this). */
export type RateRef = Pick<InstallItem, 'code' | 'name' | 'ex' | 'unit'>;

export type InstallType = 'wall' | 'ceiling' | 'cassette' | 'floor';
/** The four types with a fixed Standard / Premium price (ducted and VRV / VRF are assessed on site). */
export const INSTALL_TYPES: readonly InstallType[] = ['wall', 'ceiling', 'cassette', 'floor'];

export type MoveBand = { lo: number; hi: number; item: RateRef };

/** One size band of one AC type: Standard and Premium rows of the Pricebook + the excess-pipe bundle for that size. */
export type SizeRow = {
  type: InstallType;
  lo: number;
  hi: number;
  std: RateRef;
  prem: RateRef | null;
  /** excess pipe per metre (beyond the 4 m included) */
  pipe: RateRef | null;
};

export type AddonChoice = RateRef & { /** short label for the picker */ label: string };
export type AddonRow = { id: string; /** row title (the shared part of the choices' names) */ title: string; qty: 'm' | 'pc' | 'flag'; note?: string; choices: AddonChoice[] };
export type AddonGroupView = { group: string; rows: AddonRow[] };

export type MaterialRowView = { id: string; th: string; std: string[]; prem: string[] };
