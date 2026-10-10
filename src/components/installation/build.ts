// Server-only builders of /installation/ (they read the Pricebook, so only page.tsx may import this file — never a client
// component). Everything returned is small and serialisable.
import { getInstallItems, installOptions, addonsFor, materialMatrix, pipeItemFor } from '@/lib/domain/pricebook';
import { INS_LEVELS, MAT_ROWS, REMOVAL_CODE, packageParts, type InstallItem, type InstallLevel } from '@/lib/domain/install';
import { TYPE_BY_ID } from '@/lib/domain/types';
import { clauses, plain, surveyRule } from './copy';
import { INSTALL_TYPES, type AddonGroupView, type AddonRow, type InstallType, type MaterialRowView, type MoveBand, type RateRef, type SizeRow } from './types';

const ref = (i: InstallItem | undefined | null): RateRef | null => (i ? { code: i.code, name: i.name, ex: i.ex, unit: i.unit } : null);

/** "…แอร์ติดผนัง 9,000–12,000 BTU" → "9,000–12,000 BTU" */
export const bandLabel = (lo: number, hi: number): string => `${lo.toLocaleString('en-US')}–${hi.toLocaleString('en-US')} BTU`;

/** Standard + Premium price rows for every priced size band of the four types. */
export function buildSizeRows(): SizeRow[] {
  const items = getInstallItems();
  const rows: SizeRow[] = [];
  INSTALL_TYPES.forEach(type => {
    const code = TYPE_BY_ID[type].code;
    const bands = new Map<string, { lo: number; hi: number }>();
    items.forEach(i => {
      const m = i.code.match(new RegExp(`^INS-${code}-(\\d+)-(\\d+)-(STANDARD|PREMIUM)$`));
      if (m) bands.set(`${m[1]}-${m[2]}`, { lo: +m[1], hi: +m[2] });
    });
    [...bands.values()]
      .sort((a, b) => a.lo - b.lo)
      .forEach(({ lo, hi }) => {
        const opts = installOptions(type, hi);
        const std = opts.find(o => o.key === 'STANDARD')?.item;
        if (!std) return;
        rows.push({ type, lo, hi, std: ref(std) as RateRef, prem: ref(opts.find(o => o.key === 'PREMIUM')?.item), pipe: ref(pipeItemFor(hi)) });
      });
  });
  return rows;
}

/** Standard vs Premium materials of the example unit (wall 12,000 BTU) as rows of MAT_ROWS. */
export function buildMaterialRows(): MaterialRowView[] {
  const cols = materialMatrix('wall', 12000);
  const std = cols.find(c => c.key === 'STANDARD');
  const prem = cols.find(c => c.key === 'PREMIUM');
  return MAT_ROWS.map(r => ({
    id: r.id,
    th: r.th,
    std: (std?.cell[r.id] || []).map(plain),
    prem: (prem?.cell[r.id] || []).map(plain),
  })).filter(r => r.std.length || r.prem.length);
}

/** Label of a pipe-bundle choice: "ชุดวัสดุส่วนเกินแบบเหมา — ท่อ 1/4" + 3/8" — แอร์ 9,000–12,000 BTU" → "แอร์ 9,000–12,000 BTU". */
const pipeLabel = (name: string): string => (name.split(' — ').pop() || name).trim();

/** Shared leading words of several names ("เซอร์กิตเบรกเกอร์ NANO RCBO 1P 6kA 20A…" / "…32A…" → "เซอร์กิตเบรกเกอร์ NANO RCBO 1P 6kA"). */
function commonLead(names: readonly string[]): string {
  const tokens = names.map(n => n.split(' '));
  const out: string[] = [];
  for (let i = 0; i < tokens[0].length; i++) {
    if (tokens.every(t => t[i] === tokens[0][i])) out.push(tokens[0][i]);
    else break;
  }
  return out.join(' ');
}

/** Add-on groups for the add-on section (the groups of addonsFor, with removal moved to its own section and the excess
 *  pipe offered for every size). */
export function buildAddonGroups(): AddonGroupView[] {
  const items = getInstallItems();
  const pipes = items.filter(i => /^PIP-PKG-/.test(i.code) && i.ex != null);
  const REMOVAL = new Set<string>([...Object.values(REMOVAL_CODE), 'DISPOSE']);
  let n = 0;
  const groups: AddonGroupView[] = [];
  addonsFor('wall', 12000).forEach(g => {
    const rows: AddonRow[] = [];
    g.items.forEach(o => {
      if (o.choices.some(c => REMOVAL.has(c.code))) return;
      const isPipe = o.choices.some(c => /^PIP-PKG-/.test(c.code));
      const list = isPipe ? pipes : o.choices;
      const lead = !isPipe && list.length > 1 ? commonLead(list.map(c => c.name)) : '';
      const cut = lead.length >= 8;
      rows.push({
        id: `a${n++}`,
        title: isPipe ? list[0].name.split(' — ')[0] : cut ? lead.replace(/\s*—\s*(สาย)?\s*$/, '') : list[0].name,
        qty: o.qty,
        note: o.note,
        choices: list.map(c => ({
          code: c.code,
          name: c.name,
          ex: c.ex,
          unit: c.unit,
          label: isPipe ? pipeLabel(c.name) : cut ? c.name.slice(lead.length).trim() || c.name : c.name,
        })),
      });
    });
    if (!rows.length) return;
    groups.push({ group: g.group === 'เครื่องเดิมและงานเจาะ' ? 'งานเจาะ' : g.group, rows });
  });
  return groups;
}

/** Relocation rows (MOVE-W / C / K / FS by size), removal rows (REM-*) and the carry-away row. */
export function buildMoveRemove(): { move: Record<InstallType, MoveBand[]>; remove: RateRef[]; dispose: RateRef | null } {
  const items = getInstallItems();
  const move = { wall: [], ceiling: [], cassette: [], floor: [] } as Record<InstallType, MoveBand[]>;
  INSTALL_TYPES.forEach(type => {
    const code = TYPE_BY_ID[type].code;
    items.forEach(i => {
      const m = i.code.match(new RegExp(`^MOVE-${code}-(\\d+)-(\\d+)$`));
      if (m) move[type].push({ lo: +m[1], hi: +m[2], item: ref(i) as RateRef });
    });
    move[type].sort((a, b) => a.lo - b.lo);
  });
  const order = ['wall', 'ceiling', 'cassette', 'floor', 'duct'] as const;
  const remove = order.map(t => ref(items.find(i => i.code === REMOVAL_CODE[t]))).filter((x): x is RateRef => !!x);
  return { move, remove, dispose: ref(items.find(i => i.code === 'DISPOSE')) };
}

export type CompareLevel = { key: InstallLevel; th: string; note: string; ex: number | null; parts: string[] };
export type CompareView = {
  /** the example unit the two columns are priced for */
  size: string;
  levels: CompareLevel[];
  excludes: string[];
  survey: { skip: string; need: string } | null;
  /** Premium-only warranty extra, if the sheet has one */
  premiumExtra: string | null;
};

/** Standard vs Premium for the example unit (wall, 12,000 BTU): price, what is included, what is not, warranty, survey rule. */
export function buildCompare(): CompareView {
  const opts = installOptions('wall', 12000);
  const std = opts.find(o => o.key === 'STANDARD')?.item;
  const prem = opts.find(o => o.key === 'PREMIUM')?.item;
  const sizeName = std?.name.match(/(\d[\d,]*–\d[\d,]*) BTU/);
  return {
    size: `${TYPE_BY_ID.wall.th} ${sizeName ? sizeName[1] : '9,000–12,000'} BTU`,
    levels: INS_LEVELS.map(l => {
      const item = opts.find(o => o.key === l.key)?.item;
      return { key: l.key, th: l.th, note: l.note, ex: item?.ex ?? null, parts: packageParts(item).flatMap(clauses).map(plain) };
    }),
    excludes: clauses(std?.exc).map(x => plain(x.replace(/^ไม่รวม/, '')).trim()).filter(Boolean),
    survey: surveyRule(std?.survey),
    premiumExtra: /Priority Claim/.test(prem?.warranty || '') ? 'Priority Claim ตามเงื่อนไขในใบเสนอราคา' : null,
  };
}
