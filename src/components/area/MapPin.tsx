'use client';
// Marks the area the visitor picked (the quote's area, shared with the address field) on the service map.
// Rendered as a child of the server-rendered <svg>; it only needs the map projection, never the province outlines.
import { useEffect, useState } from 'react';
import { useCart } from '@/lib/cart';
import { addrParts, loadAddressBook, type AddrPick } from '@/lib/domain/address';
import { roadKm } from '@/lib/domain/travel';
import type { MapProjection } from './map-geo';

type Spot = { key: string; lat: number; lon: number };

const keyOf = (a: AddrPick) => `${a.p}|${a.d ?? ''}|${a.s ?? ''}|${a.z ?? ''}`;

export function MapPin({ proj }: { proj: MapProjection }) {
  const { addr } = useCart();
  const [spot, setSpot] = useState<Spot | null>(null);
  const key = addr ? keyOf(addr) : '';

  useEffect(() => {
    if (!addr) return;
    let live = true;
    loadAddressBook().then(
      book => {
        if (!live) return;
        // a whole district / province: the nearest point to the head office decides, like the travel zone does
        const rows = book.list.filter(r => r.p === addr.p && (!addr.d || r.d === addr.d) && (!addr.s || r.s === addr.s) && (!addr.z || r.z === addr.z));
        if (!rows.length) return setSpot(null);
        const best = rows.reduce((a, b) => (roadKm(b.lat, b.lon) < roadKm(a.lat, a.lon) ? b : a));
        setSpot({ key: keyOf(addr), lat: best.lat, lon: best.lon });
      },
      () => undefined,
    );
    return () => {
      live = false;
    };
  }, [addr]);

  if (!addr || !spot || spot.key !== key) return null;
  const x = Math.round((spot.lon - proj.lonMin) * proj.cos * proj.k * 10) / 10;
  const y = Math.round((proj.latMax - spot.lat) * proj.k * 10) / 10;
  if (x < 0 || x > proj.w || y < 0 || y > proj.h) return null;
  const label = addrParts(addr).title;
  const km = roadKm(spot.lat, spot.lon);
  const right = x > proj.w * 0.62;
  const text = `${label} · ประมาณ ${km} กม.`;

  return (
    <g aria-hidden>
      <circle cx={x} cy={y} r={13} className="fill-ink/20" />
      <circle cx={x} cy={y} r={7} className="fill-ink stroke-surface" strokeWidth={2.5} />
      <text
        x={right ? x - 14 : x + 14}
        y={y - 12}
        textAnchor={right ? 'end' : 'start'}
        className="fill-ink text-[19px] font-semibold [paint-order:stroke] stroke-surface stroke-[4] [stroke-linejoin:round] sm:text-[13px]"
      >
        {text}
      </text>
    </g>
  );
}
