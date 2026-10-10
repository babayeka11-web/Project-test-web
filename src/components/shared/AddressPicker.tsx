'use client';
// Area of the job site — a postal-style type-ahead (แขวง/ตำบล · เขต/อำเภอ · จังหวัด · รหัสไปรษณีย์) on the lazy address book,
// plus "ใช้ตำแหน่งปัจจุบัน" (nearest subdistrict point). The pick resolves to a Zone (tier · road km · travel fee).
// With syncCart (default) the pick also becomes the quote's area, so every page that asks "where?" shares one answer.
// ARIA combobox pattern: ↑/↓ move, Enter picks, Esc closes; the listbox is announced with a result count.
import { useEffect, useId, useMemo, useState } from 'react';
import { Badge, Button, Field, Icon, Input } from '@/components/ui';
import { cart, useCart } from '@/lib/cart';
import { addrParts, addrSearch, addrTh, loadAddressBook, zoneOf, type AddrHit, type AddrPick, type AddressBook } from '@/lib/domain/address';
import { roadKm, TIER_TH, travelNote, zoneChip, type Zone } from '@/lib/domain/travel';

export type AddressPickerProps = {
  label?: string;
  hint?: string;
  placeholder?: string;
  /** also store the pick as the quote's area (default true) */
  syncCart?: boolean;
  /** show the zone card under the field (default true) */
  showResult?: boolean;
  /** with syncCart false: the current pick */
  value?: AddrPick | null;
  onPick?: (pick: AddrPick | null, zone: Zone | null) => void;
  id?: string;
  className?: string;
};

const hav = (a: number, b: number, c: number, d: number) => {
  const t = (x: number) => (x * Math.PI) / 180;
  const s = Math.sin(t(c - a) / 2) ** 2 + Math.cos(t(a)) * Math.cos(t(c)) * Math.sin(t(d - b) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(s));
};

export function AddressPicker({
  label = 'พื้นที่หน้างาน',
  hint = 'พิมพ์แขวง/ตำบล เขต/อำเภอ หรือรหัสไปรษณีย์ แล้วเลือกจากรายการ',
  placeholder = 'เช่น บางมด · จอมทอง · 10150',
  syncCart = true,
  showResult = true,
  value,
  onPick,
  id,
  className,
}: AddressPickerProps) {
  const store = useCart();
  const current = syncCart ? store.addr : value ?? null;
  const currentZone = syncCart ? store.zone : null;
  const [book, setBook] = useState<AddressBook | null>(null);
  const [failed, setFailed] = useState(false);
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [localZone, setLocalZone] = useState<Zone | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoMsg, setGeoMsg] = useState('');
  const listId = useId();
  const autoId = useId();
  const inputId = id ?? `addr${autoId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const ensureBook = () => {
    if (book) return Promise.resolve(book);
    return loadAddressBook().then(
      b => (setBook(b), setFailed(false), b),
      () => (setFailed(true), null),
    );
  };

  // keep the field text in sync with the chosen pick when not typing
  const shown = editing ? text : current ? addrTh(current) : text;
  const hits: AddrHit[] = useMemo(() => (book && editing && text.trim().length >= 2 ? addrSearch(book, text, 8) : []), [book, editing, text]);
  const zone = syncCart ? currentZone : localZone;

  useEffect(() => {
    if (!syncCart && value && book) setLocalZone(zoneOf(book, value));
  }, [syncCart, value, book]);

  // the area changed from outside (e.g. the example chips on /area/): show it instead of half-typed text
  useEffect(() => {
    setEditing(false);
  }, [current]);

  // `loaded` is the book ensureBook() just returned: inside the geolocation callback the `book` state of this render is
  // still null, and without it the pick would be stored with no zone (no travel fee). With no book at all the cart
  // computes the zone itself (zone undefined).
  const choose = (pick: AddrPick | null, loaded?: AddressBook | null) => {
    const bk = loaded ?? book;
    const z = pick && bk ? zoneOf(bk, pick) : null;
    if (syncCart) cart.setAddress(pick, pick ? (bk ? z : undefined) : null);
    else setLocalZone(z);
    onPick?.(pick, z);
    setEditing(false);
    setOpen(false);
    setText(pick ? addrTh(pick) : '');
  };

  const locate = () => {
    if (!('geolocation' in navigator)) return setGeoMsg('อุปกรณ์นี้ระบุตำแหน่งไม่ได้ พิมพ์ชื่อพื้นที่แทน');
    setLocating(true);
    setGeoMsg('');
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const b = await ensureBook();
        setLocating(false);
        if (!b) return setGeoMsg('โหลดรายชื่อพื้นที่ไม่สำเร็จ ลองอีกครั้ง');
        const { latitude: la, longitude: lo } = pos.coords;
        let best = b.list[0], dist = Infinity;
        for (const r of b.list) {
          const d = hav(la, lo, r.lat, r.lon);
          if (d < dist) {
            dist = d;
            best = r;
          }
        }
        if (!best || dist > 25) return setGeoMsg(`ตำแหน่งนี้อยู่นอกพื้นที่ในรายการ (ห่างสำนักงานใหญ่ประมาณ ${roadKm(la, lo)} กม.) ฝากข้อมูลให้ทีมประเมินได้`);
        choose({ p: best.p, d: best.d, s: best.s, z: best.z }, b);
      },
      () => {
        setLocating(false);
        setGeoMsg('ไม่ได้รับอนุญาตให้ใช้ตำแหน่ง พิมพ์ชื่อพื้นที่แทนได้');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 },
    );
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive(i => Math.min(hits.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter' && open && hits[active]) {
      e.preventDefault();
      choose(hits[active]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const expanded = open && hits.length > 0;
  return (
    <div className={className}>
      <Field label={label} hint={hint} id={inputId}>
        <div className="relative">
          <Input
            icon="pin"
            role="combobox"
            aria-expanded={expanded}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={expanded ? `${listId}-${active}` : undefined}
            autoComplete="off"
            placeholder={placeholder}
            value={shown}
            onFocus={() => void ensureBook()}
            onChange={e => {
              setText(e.target.value);
              setEditing(true);
              setOpen(true);
              setActive(0);
            }}
            onKeyDown={onKey}
            // leaving the field without picking drops the typed text, so the field never shows a different area
            // from the one the quote uses (with no pick yet, the typed text stays)
            onBlur={() =>
              window.setTimeout(() => {
                setOpen(false);
                setEditing(false);
              }, 150)
            }
          />
          {expanded && (
            <ul id={listId} role="listbox" aria-label="พื้นที่ที่ตรงกัน" className="absolute inset-x-0 top-full z-30 mt-2 max-h-80 overflow-auto rounded-control border border-line bg-surface p-1 shadow-pop">
              {hits.map((h, i) => {
                const p = addrParts(h);
                const z = book ? zoneOf(book, h) : null;
                return (
                  <li
                    key={`${h.p}|${h.d}|${h.s}|${h.z}`}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className={`flex cursor-pointer items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 ${i === active ? 'bg-sky-soft' : 'hover:bg-surface-2'}`}
                    onMouseDown={e => e.preventDefault()}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => choose(h)}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{p.title}</span>
                      <span className="block truncate text-meta text-ink-3">{p.sub}</span>
                    </span>
                    {z && zoneChip(z) && <Badge tone={z.tier === 'core' ? 'ok' : z.tier === 'extended' ? 'sky' : 'warn'}>{zoneChip(z)}</Badge>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Field>
      <p className="sr-only" aria-live="polite">
        {editing && text.trim().length >= 2 && book ? `พบ ${hits.length} พื้นที่` : ''}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="quiet" icon="pin" loading={locating} onClick={locate}>
          {locating ? 'กำลังหาตำแหน่ง…' : 'ใช้ตำแหน่งปัจจุบัน'}
        </Button>
        {current && (
          <Button type="button" size="sm" variant="quiet" icon="close" onClick={() => { choose(null); document.getElementById(inputId)?.focus(); }}>
            ล้างพื้นที่
          </Button>
        )}
      </div>
      {(geoMsg || failed) && <p className="mt-2 text-meta text-warn">{failed ? 'โหลดรายชื่อพื้นที่ไม่สำเร็จ ลองคลิกที่ช่องอีกครั้ง' : geoMsg}</p>}
      {showResult && zone && <ZoneResult zone={zone} className="mt-4" />}
    </div>
  );
}

/** Card that explains a zone: tier, road km, travel fee per trip. */
export function ZoneResult({ zone, className }: { zone: Zone; className?: string }) {
  const tone = zone.tier === 'core' ? 'ok' : zone.tier === 'extended' ? 'sky' : 'warn';
  return (
    <div className={`rounded-control border border-line bg-surface-2 p-4 ${className ?? ''}`} aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Icon name={zone.tier === 'core' ? 'check' : zone.tier === 'extended' ? 'truck' : 'info'} size={18} className="text-brand" />
        <b className="text-ink">{TIER_TH[zone.tier].th}</b>
        {zoneChip(zone) && <Badge tone={tone}>{zoneChip(zone)}</Badge>}
      </div>
      <p className="mt-1 text-small text-ink-2">{travelNote(zone) || TIER_TH[zone.tier].note}</p>
      {zone.match && <p className="mt-1 text-meta text-ink-3">{zone.match}</p>}
    </div>
  );
}
