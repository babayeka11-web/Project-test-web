// Air-conditioner type taxonomy (client-safe). Port of TYPES in the reference sbp-core.js.
// `code` is the Pricebook code segment (INS-W-…, REM-K, MOVE-FS-…); `clean` is the label the cleaning sheet uses.

export type AcTypeId = 'wall' | 'ceiling' | 'cassette' | 'floor' | 'duct';
export type AcTypeCode = 'W' | 'C' | 'K' | 'FS' | 'DUCT';

export type AcType = {
  id: AcTypeId;
  th: string;
  en: string;
  code: AcTypeCode;
  /** label of this type in the cleaning Pricebook sheet */
  clean: string;
};

export const AC_TYPES: readonly AcType[] = [
  { id: 'wall', th: 'ติดผนัง', en: 'Wall type', code: 'W', clean: 'ติดผนัง' },
  { id: 'ceiling', th: 'แขวนใต้ฝ้า', en: 'Ceiling suspended', code: 'C', clean: 'แขวนใต้ฝ้า' },
  { id: 'cassette', th: 'สี่ทิศทาง', en: 'Cassette', code: 'K', clean: 'สี่ทิศทาง' },
  { id: 'floor', th: 'ตู้ตั้งพื้น', en: 'Floor standing', code: 'FS', clean: 'ตั้งพื้น/ตั้งตู้' },
  { id: 'duct', th: 'ซ่อนในฝ้า / ท่อลม', en: 'Ducted / concealed', code: 'DUCT', clean: 'ซ่อนในฝ้า/ต่อท่อลม' },
];

/** Alias with the reference name. */
export const TYPES = AC_TYPES;

export const TYPE_IDS: readonly AcTypeId[] = AC_TYPES.map(t => t.id);

export const TYPE_BY_ID = Object.fromEntries(AC_TYPES.map(t => [t.id, t])) as Record<AcTypeId, AcType>;

export const TYPE_BY_CODE = Object.fromEntries(AC_TYPES.map(t => [t.code, t])) as Record<AcTypeCode, AcType>;

export const isAcType = (x: unknown): x is AcTypeId => typeof x === 'string' && x in TYPE_BY_ID;

const FROM_CLEAN: Record<string, AcTypeId> = Object.fromEntries(AC_TYPES.map(t => [t.clean, t.id]));

/** Cleaning-sheet label → type id (null for AHU, add-on and special-area rows). */
export const typeFromCleanLabel = (label: string | null | undefined): AcTypeId | null =>
  (label != null && FROM_CLEAN[label]) || null;

/** Display order index (catalog default sort). */
export const typeOrder = (id: string): number => AC_TYPES.findIndex(t => t.id === id);
