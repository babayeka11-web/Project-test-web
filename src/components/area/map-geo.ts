// Build-time geometry for the service-area map (server components only — it embeds the province outlines).
// Equirectangular projection (x scaled by cos of the middle latitude, so a circle on the ground stays a circle) cropped to
// central Thailand around HQ. Rings are road distances converted to straight-line radius (km / TRAVEL.roadFactor), the
// same rule roadKm() uses in reverse — an approximation, labelled as such on the page.
import provinces from '@data/thai-provinces.json';
import { buildAddressBook, type RawAddressBook } from '@/lib/domain/address';
import addressJson from '@data/th-address.json';
import { HQ, roadKm, travelFee, TRAVEL } from '@/lib/domain/travel';

type Ring = number[]; // flat [lon, lat, lon, lat, …]
type Polygon = Ring[];
type ProvinceRow = { th: string; en: string; l: [number, number]; p: Polygon[] };
type CountryRow = { c: string; p: Polygon[] };
const DATA = provinces as unknown as { prov: ProvinceRow[]; nb: CountryRow[] };

/** Crop window (degrees). Centred on HQ so both rings sit in the middle with room for labels. */
export const MAP_BOX = { lonMin: 99, lonMax: 102, latMin: 12.15, latMax: 15.15 } as const;
const K = 200; // px per degree of latitude
const COS = Math.cos((((MAP_BOX.latMin + MAP_BOX.latMax) / 2) * Math.PI) / 180);
const KM_PER_DEG = (6371 * Math.PI) / 180; // same earth radius as travel.ts

/** Serialisable projection for client overlays (the picked-area pin). */
export type MapProjection = { lonMin: number; latMax: number; k: number; cos: number; w: number; h: number };
export const PROJ: MapProjection = {
  lonMin: MAP_BOX.lonMin,
  latMax: MAP_BOX.latMax,
  k: K,
  cos: COS,
  w: round((MAP_BOX.lonMax - MAP_BOX.lonMin) * COS * K),
  h: round((MAP_BOX.latMax - MAP_BOX.latMin) * K),
};

function round(n: number) {
  return Math.round(n * 10) / 10;
}
export const px = (lon: number) => round((lon - MAP_BOX.lonMin) * COS * K);
export const py = (lat: number) => round((MAP_BOX.latMax - lat) * K);
/** Radius in map units of a road distance (km) around HQ. */
export const ringR = (roadKmValue: number) => round((roadKmValue / TRAVEL.roadFactor / KM_PER_DEG) * K);

const M = 0.4; // degrees of margin kept around the crop so outlines run off the edge cleanly
const inView = (poly: Polygon[]) => {
  for (const rings of poly)
    for (const r of rings)
      for (let i = 0; i < r.length; i += 2) {
        const x = r[i];
        const y = r[i + 1];
        if (x >= MAP_BOX.lonMin - M && x <= MAP_BOX.lonMax + M && y >= MAP_BOX.latMin - M && y <= MAP_BOX.latMax + M) return true;
      }
  return false;
};

/** SVG path data of a multipolygon; drops points closer than ~0.8 units to the previous one. */
function pathOf(poly: Polygon[]): string {
  let d = '';
  for (const rings of poly)
    for (const r of rings) {
      let lx = NaN;
      let ly = NaN;
      let seg = '';
      for (let i = 0; i < r.length; i += 2) {
        const x = px(r[i]);
        const y = py(r[i + 1]);
        if (seg && Math.abs(x - lx) < 0.8 && Math.abs(y - ly) < 0.8) continue;
        seg += `${seg ? 'L' : 'M'}${x} ${y}`;
        lx = x;
        ly = y;
      }
      d += seg + 'Z';
    }
  return d;
}

export type MapProvince = { th: string; en: string; d: string; bkk: boolean };
export type MapLabel = { text: string; x: number; y: number; level: 1 | 2 | 3; kind: 'bkk' | 'prov' | 'sea' | 'country' };

const BKK = 'กรุงเทพมหานคร';
/** Province labels: level 1 always, 2 from 640 px, 3 from 1024 px (the inner ring is crowded on phones). */
const LABELS: Record<string, { text?: string; level: 1 | 2 | 3; dx?: number; dy?: number }> = {
  กรุงเทพมหานคร: { text: 'กรุงเทพฯ', level: 1, dx: 0.02, dy: 0.05 },
  นนทบุรี: { level: 3, dx: -0.08, dy: 0.05 },
  ปทุมธานี: { level: 2, dy: 0.03 },
  สมุทรปราการ: { level: 3, dx: 0.12, dy: -0.04 },
  สมุทรสาคร: { level: 3, dx: -0.1, dy: -0.05 },
  นครปฐม: { level: 2 },
  พระนครศรีอยุธยา: { text: 'อยุธยา', level: 1 },
  ฉะเชิงเทรา: { level: 1, dx: -0.2 },
  ชลบุรี: { level: 1, dx: -0.15 },
  ระยอง: { level: 2 },
  ราชบุรี: { level: 1, dx: 0.12 },
  สุพรรณบุรี: { level: 2 },
  กาญจนบุรี: { level: 3, dx: 0.35, dy: -0.25 },
  เพชรบุรี: { level: 2, dx: 0.1 },
  สมุทรสงคราม: { level: 3, dx: 0.04, dy: -0.02 },
  สระบุรี: { level: 2 },
  นครนายก: { level: 3 },
  ปราจีนบุรี: { level: 2, dx: -0.1 },
  ลพบุรี: { level: 3, dy: -0.15 },
  อ่างทอง: { level: 3 },
};

export type ServiceMap = {
  proj: MapProjection;
  provinces: MapProvince[];
  countries: string[];
  hq: { x: number; y: number };
  core: { r: number; km: number };
  outer: { r: number; km: number };
  labels: MapLabel[];
};

let memo: ServiceMap | null = null;

/** Everything the map draws, computed once per build. */
export function serviceMap(): ServiceMap {
  if (memo) return memo;
  const provs: MapProvince[] = DATA.prov
    .filter(p => inView(p.p))
    .map(p => ({ th: p.th, en: p.en, d: pathOf(p.p), bkk: p.th === BKK }))
    // Bangkok last so its highlighted outline sits on top of the neighbours' shared borders
    .sort((a, b) => Number(a.bkk) - Number(b.bkk));
  const countries = DATA.nb.filter(c => inView(c.p)).map(c => pathOf(c.p));
  const labels: MapLabel[] = [];
  for (const p of DATA.prov) {
    const cfg = LABELS[p.th];
    if (!cfg) continue;
    const [lon, lat] = p.l;
    const x = px(lon + (cfg.dx ?? 0));
    const y = py(lat + (cfg.dy ?? 0));
    if (x < 24 || x > PROJ.w - 24 || y < 14 || y > PROJ.h - 14) continue;
    labels.push({ text: cfg.text ?? p.th, x, y, level: cfg.level, kind: p.th === BKK ? 'bkk' : 'prov' });
  }
  labels.push({ text: 'อ่าวไทย', x: px(100.55), y: py(12.62), level: 1, kind: 'sea' });
  labels.push({ text: 'เมียนมา', x: px(99.14), y: py(12.42), level: 3, kind: 'country' });
  memo = {
    proj: PROJ,
    provinces: provs,
    countries,
    hq: { x: px(HQ.lon), y: py(HQ.lat) },
    core: { r: ringR(TRAVEL.freeKm), km: TRAVEL.freeKm },
    outer: { r: ringR(TRAVEL.maxKm), km: TRAVEL.maxKm },
    labels,
  };
  return memo;
}

/* ---------- text alternative: road distance by province (from the address book) ---------- */

export type ProvinceReach = {
  province: string;
  /** nearest and farthest district / subdistrict point, road km (estimate) */
  minKm: number;
  maxKm: number;
  /** travel fee per trip at the nearest and farthest point (null beyond maxKm); core = Bangkok within freeKm */
  minFee: number | null;
  maxFee: number | null;
  core: boolean;
};

/** Road-km range and travel fee range per province of the address book, nearest first. */
export function provinceReach(): ProvinceReach[] {
  const book = buildAddressBook(addressJson as unknown as RawAddressBook);
  const by = new Map<string, number[]>();
  for (const r of book.list) {
    const list = by.get(r.p) ?? [];
    list.push(roadKm(r.lat, r.lon));
    by.set(r.p, list);
  }
  const fee = (p: string, km: number) => (p === BKK && km <= TRAVEL.freeKm ? 0 : travelFee(km));
  return [...by.entries()]
    .map(([province, ks]) => {
      const minKm = Math.min(...ks);
      const maxKm = Math.max(...ks);
      return { province, minKm, maxKm, minFee: fee(province, minKm), maxFee: fee(province, maxKm), core: province === BKK && minKm <= TRAVEL.freeKm };
    })
    .sort((a, b) => a.minKm - b.minKm);
}
