// Row model of the price centre (/prices/). Client-safe: only types, tab definitions and tiny helpers — the rows themselves
// are built at build time by build.ts (server only) and handed to <PriceCenter> as compact, serialisable props.
// Long texts (รวม / ไม่รวม / warranty) are stored once in a string pool; rows hold indexes into it.
import type { IconName } from '@/components/ui';
import type { CleanLevel, CleanPkgId } from '@/lib/domain/cleaning';
import type { AcTypeId } from '@/lib/domain/types';

export type PriceTabId = 'clean' | 'install' | 'materials' | 'move' | 'repair' | 'other';

export const PRICE_TABS: readonly { id: PriceTabId; label: string; icon: IconName; hint: string }[] = [
  { id: 'clean', label: 'ล้างแอร์', icon: 'clean', hint: 'ล้างปกติ ล้างใหญ่ แยกตามประเภทและขนาด' },
  { id: 'install', label: 'ติดตั้ง', icon: 'install', hint: 'บริการติดตั้งมาตรฐาน พรีเมียม ตามประเภทและขนาด' },
  { id: 'materials', label: 'วัสดุและอุปกรณ์', icon: 'tag', hint: 'ท่อ ราง สายไฟ น้ำทิ้ง และอุปกรณ์ส่วนที่เกินจากที่รวมในราคาติดตั้ง' },
  { id: 'move', label: 'รื้อ · ย้าย', icon: 'truck', hint: 'รื้อ ย้ายแอร์ น้ำยา ฐานรอง งานสูง และค่าใช้จ่ายประกอบงาน' },
  { id: 'repair', label: 'ซ่อม', icon: 'repair', hint: 'ค่าตรวจวินิจฉัยและค่าซ่อมตามอาการ' },
  { id: 'other', label: 'งานอื่น', icon: 'document', hint: 'งานระบบอื่น งานโยธา ฝ้า ท่อลม ที่ทีมสำรวจก่อน' },
];

export const isTabId = (x: unknown): x is PriceTabId => PRICE_TABS.some(t => t.id === x);

/** Which cart-line builder a row uses: c = cleanPriceLine · x = cleanExtraLine · i = installItemLine · r = repairLine. */
export type PriceRowKind = 'c' | 'x' | 'i' | 'r';

export type PriceRow = {
  id: string;
  k: PriceRowKind;
  tab: PriceTabId;
  /** group heading the row sits under */
  g: string;
  /** name shown (and used in the quote line for i / r rows) */
  n: string;
  /** unit of the price (เครื่อง · เมตร · ครั้ง …) */
  u: string | null;
  /** standard rate before VAT; null = no standard rate */
  ex: number | null;
  /** shown instead of "ประเมินหน้างาน" when ex is null (out-of-hours and travel rows never show a number) */
  fb?: string;
  /** pool indexes: warranty · รวม · ไม่รวม */
  w?: number;
  inc?: number;
  exc?: number;
  /** cleaning pair row (pair = 1): ex / inc / exc belong to ล้างปกติ C1, these to ล้างใหญ่ C2 */
  pair?: 1;
  ex2?: number | null;
  inc2?: number;
  exc2?: number;
  /** rate decided for the web (how: m market · c company repair table · k removal + standard installation) */
  dec?: 'm' | 'c' | 'k';
  /** VRV / VRF — project inquiry, never into the quote */
  vrf?: 1;
  /* cleaning price row (k = 'c') */
  pkg?: CleanPkgId;
  ty?: AcTypeId;
  rg?: string;
  /* single-level cleaning rows: C1 · C2 · both (same price for both levels); pair rows have no lv */
  lv?: CleanLevel | 'both';
  /** cleaning sheet type label (k = 'x') */
  sh?: string;
  /** install-sheet code (k = 'i') */
  code?: string;
};

export type PriceData = { rows: PriceRow[]; pool: string[] };
