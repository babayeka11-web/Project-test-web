// Site search (header button, Ctrl/⌘ K): one small index of every page, guide, FAQ answer and air-con series, built at
// build time (src/lib/search-index.ts → /search-index.json) and fetched when the search first opens. Matching reuses the
// catalog's rules (Thai brand spellings, "12k" = 12000, "แอร์" / "BTU" ignored), so the same words find the same series.
import { squash, textMatches } from './domain/catalog';

export type SearchKind = 'page' | 'guide' | 'faq' | 'series';
export type SearchEntry = {
  /** title */
  t: string;
  /** one-line description */
  s: string;
  /** link inside the site (no base path) */
  h: string;
  k: SearchKind;
  /** searchable text, already squashed (title + description + extra words) */
  x: string;
};

export const KIND_TH: Record<SearchKind, string> = { page: 'หน้า', guide: 'บทความ', faq: 'คำถามที่พบบ่อย', series: 'รุ่นแอร์' };
const KIND_ORDER: Record<SearchKind, number> = { page: 0, guide: 1, faq: 2, series: 3 };

/** One index entry: the haystack holds the title, the description and any extra words people may type. */
export const entry = (k: SearchKind, t: string, s: string, h: string, extra: string = ''): SearchEntry => ({
  t,
  s,
  h,
  k,
  x: squash(`${t} ${s} ${extra}`),
});

/** Entries for a query, best first: title starts with it → title contains it → anything matches; pages before guides,
 *  FAQ and series at the same rank. An empty query finds nothing. */
export function searchSite(entries: readonly SearchEntry[], q: string, limit = 30): SearchEntry[] {
  const whole = squash(q);
  if (!whole) return [];
  const scored: { e: SearchEntry; score: number; i: number }[] = [];
  entries.forEach((e, i) => {
    const title = squash(e.t);
    const score = title.startsWith(whole) ? 3 : title.includes(whole) ? 2 : textMatches(e.x, q) ? 1 : 0;
    if (score) scored.push({ e, score, i });
  });
  scored.sort((a, b) => b.score - a.score || KIND_ORDER[a.e.k] - KIND_ORDER[b.e.k] || a.i - b.i);
  return scored.slice(0, limit).map(s => s.e);
}
