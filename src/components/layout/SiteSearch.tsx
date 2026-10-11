'use client';
// Site search sheet: pages, guides, FAQ answers and every air-con series (src/lib/search.ts). The index is fetched the
// first time the sheet opens. Ctrl/⌘ K opens it from anywhere; ↓ / ↑ move through the results, Enter follows one.
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useDeferredValue, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Badge, Icon, Input, Sheet } from '@/components/ui';
import { KIND_TH, searchSite, type SearchEntry } from '@/lib/search';
import { asset, NAV } from '@/lib/site';
import { setSearchOpen, useSearchOpen } from './search-store';

let indexPromise: Promise<SearchEntry[]> | null = null;
function loadIndex(): Promise<SearchEntry[]> {
  indexPromise ??= fetch(asset('/search-index.json'))
    .then(r => (r.ok ? (r.json() as Promise<SearchEntry[]>) : Promise.reject(new Error(String(r.status)))))
    .catch(e => {
      indexPromise = null; // try again next time
      throw e;
    });
  return indexPromise;
}

/** Ctrl/⌘ K anywhere opens the search (and closes it again). */
function useShortcut() {
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function SiteSearch() {
  useShortcut();
  const open = useSearchOpen();
  const pathname = usePathname();
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<SearchEntry[] | null>(null);
  const [error, setError] = useState(false);
  const list = useRef<HTMLUListElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const query = useDeferredValue(q);

  useEffect(() => {
    if (!open || index) return;
    let live = true;
    loadIndex().then(
      data => live && setIndex(data),
      () => live && setError(true),
    );
    return () => {
      live = false;
    };
  }, [open, index]);

  // a result was followed: close
  useEffect(() => {
    setSearchOpen(false);
  }, [pathname]);

  const close = () => setSearchOpen(false);
  const results = index ? searchSite(index, query) : [];
  const links = () => Array.from(list.current?.querySelectorAll<HTMLAnchorElement>('a') ?? []);
  const move = (e: KeyboardEvent<HTMLElement>, from: number) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const all = links();
    const next = from + (e.key === 'ArrowDown' ? 1 : -1);
    if (next < 0) input.current?.focus();
    else all[Math.min(next, all.length - 1)]?.focus();
  };

  const row = (e: SearchEntry, i: number) => (
    <li key={`${e.k}${e.h}${e.t}`}>
      <Link
        href={e.h}
        prefetch={false}
        onClick={close}
        onKeyDown={ev => move(ev, i)}
        className="pressable flex min-h-14 items-center gap-3 rounded-control px-3 py-2 no-underline outline-offset-[-2px] hover:bg-surface-2 focus-visible:bg-surface-2"
      >
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold text-ink">{e.t}</span>
          {e.s && <span className="truncate text-meta text-ink-3">{e.s}</span>}
        </span>
        <Badge tone="neutral" className="shrink-0">
          {KIND_TH[e.k]}
        </Badge>
      </Link>
    </li>
  );

  return (
    <Sheet open={open} onClose={close} title="ค้นหาในเว็บ" side="center" size="lg">
      <div className="flex flex-col gap-4">
        <Input
          ref={input}
          type="search"
          icon="search"
          autoFocus
          enterKeyHint="search"
          aria-label="ค้นหา"
          aria-controls="site-search-results"
          placeholder="เช่น ล้างแอร์ · Daikin 12000 · น้ำหยด"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              links()[0]?.click();
            } else move(e, -1);
          }}
        />
        <p aria-live="polite" className="text-meta text-ink-3">
          {error
            ? 'โหลดข้อมูลค้นหาไม่สำเร็จ ลองเปิดใหม่อีกครั้ง'
            : !index
              ? open
                ? 'กำลังโหลด…'
                : ''
              : query.trim()
                ? results.length
                  ? `พบ ${results.length} รายการ`
                  : 'ไม่พบ ลองคำอื่น เช่น ชื่อยี่ห้อ ขนาด BTU หรืออาการแอร์'
                : 'หน้าที่คนเปิดบ่อย'}
        </p>
        <ul id="site-search-results" ref={list} className="-mx-3 grid gap-0.5">
          {query.trim()
            ? results.map(row)
            : NAV.map((n, i) => row({ k: 'page', t: n.full ?? n.th, s: n.sub ?? '', h: n.href, x: '' }, i))}
        </ul>
        <p className="hidden items-center gap-1.5 text-meta text-ink-3 sm:flex">
          <Icon name="info" size={14} />
          กด Ctrl K (Mac: ⌘ K) เพื่อเปิดค้นหาได้จากทุกหน้า
        </p>
      </div>
    </Sheet>
  );
}
