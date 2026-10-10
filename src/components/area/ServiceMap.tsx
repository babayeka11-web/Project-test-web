// Service-area map — a server-rendered SVG of central Thailand (province outlines from data/thai-provinces.json),
// Bangkok highlighted, the head office, and two rings: 30 km (core area) and 150 km (limit for per-unit jobs).
// The rings are road distances converted to straight-line radius (km ÷ 1.35), so they are approximate — the legend says so.
// A small client overlay (MapPin) can be passed as children to mark the area the visitor picked.
import type { ReactNode } from 'react';
import { COMPANY } from '@/lib/domain/company';
import { MIN_BILL } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { TRAVEL } from '@/lib/domain/travel';
import { serviceMap, type MapLabel } from './map-geo';

const MAP_ID = 'area-map';

// Pulse of the head-office ring: slow, subtle, and only when the visitor has not asked for less motion.
const PULSE_CSS = `
@media (prefers-reduced-motion: no-preference) {
  .area-pulse { transform-box: fill-box; transform-origin: center; animation: area-pulse 3.6s cubic-bezier(.16,1,.3,1) infinite; }
  @keyframes area-pulse { 0% { transform: scale(.35); opacity: .55; } 70%, 100% { transform: scale(1.5); opacity: 0; } }
}
@media (prefers-reduced-motion: reduce) { .area-pulse { display: none; } }
`;

// Label text styles: a halo in the surface colour keeps names readable over outlines and rings.
const HALO = '[paint-order:stroke] stroke-surface [stroke-linejoin:round]';
// Phones show the map at ~60% of its drawing size, so labels are drawn larger there.
const LEVEL_SHOW: Record<MapLabel['level'], string> = { 1: '', 2: 'hidden sm:inline', 3: 'hidden lg:inline' };

function labelClass(l: MapLabel) {
  const show = LEVEL_SHOW[l.level];
  if (l.kind === 'bkk') return `fill-brand font-semibold text-[21px] sm:text-[14px] ${HALO} stroke-[4]`;
  if (l.kind === 'sea') return `fill-sky italic text-[19px] sm:text-[13px] ${HALO} stroke-[3]`;
  if (l.kind === 'country') return `fill-ink-3 hidden text-[13px] sm:inline ${HALO} stroke-[3]`;
  return `fill-ink-2 text-[19px] sm:text-[12.5px] ${HALO} stroke-[3] ${show}`;
}

export function ServiceMap({ children }: { children?: ReactNode }) {
  const m = serviceMap();
  const { w, h } = m.proj;
  const { hq, core, outer } = m;
  const km = `${TRAVEL.freeKm} กม.`;
  const kmMax = `${TRAVEL.maxKm} กม.`;

  return (
    <figure className="m-0 flex flex-col gap-4">
      <style>{PULSE_CSS}</style>
      <div className="overflow-hidden rounded-card border border-line bg-sky-soft shadow-card">
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-labelledby={`${MAP_ID}-t ${MAP_ID}-d`} className="block h-auto w-full">
          <title id={`${MAP_ID}-t`}>แผนที่พื้นที่ให้บริการรอบกรุงเทพฯ</title>
          <desc id={`${MAP_ID}-d`}>
            {`สำนักงานใหญ่ของ ${COMPANY.th} อยู่ที่ถนนพระราม 2 กรุงเทพฯ วงในคือระยะถนนประมาณ ${km} (พื้นที่หลัก ไม่มีค่าเดินทางเมื่องานล้างถึง ${baht(MIN_BILL)} ก่อน VAT) วงนอกคือระยะประมาณ ${kmMax} ที่รับงานรายเครื่อง ไกลกว่านั้นเป็นงานโครงการ ระยะบนแผนที่เป็นค่าประมาณ ดูรายชื่อจังหวัดและค่าเดินทางเป็นข้อความได้ใต้แผนที่`}
          </desc>

          {/* neighbouring countries */}
          <g className="fill-ink/[0.07]" aria-hidden>
            {m.countries.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>

          {/* provinces */}
          <g className="stroke-line-strong/60" strokeWidth={0.8} strokeLinejoin="round" aria-hidden>
            {m.provinces.map(p => (
              <path key={p.th} d={p.d} className={p.bkk ? 'fill-brand/25 stroke-brand' : 'fill-surface'} strokeWidth={p.bkk ? 2 : undefined}>
                <title>{p.th}</title>
              </path>
            ))}
          </g>

          {/* 150 km and 30 km rings */}
          <circle cx={hq.x} cy={hq.y} r={outer.r} className="fill-sky/[0.07] stroke-sky" strokeWidth={2} strokeDasharray="9 7" aria-hidden />
          <circle cx={hq.x} cy={hq.y} r={core.r} className="fill-brand/[0.14] stroke-brand" strokeWidth={2.5} aria-hidden />
          <circle cx={hq.x} cy={hq.y} r={core.r} className="area-pulse fill-none stroke-brand" strokeWidth={2} aria-hidden />

          {/* labels */}
          <g textAnchor="middle" aria-hidden>
            {m.labels.map(l => (
              <text key={l.text} x={l.x} y={l.y} className={labelClass(l)}>
                {l.text}
              </text>
            ))}
            <text x={hq.x} y={hq.y - outer.r - 10} className={`fill-sky font-semibold text-[19px] sm:text-[13px] ${HALO} stroke-[4]`}>
              {kmMax}
            </text>
            <text x={hq.x} y={hq.y + core.r + 24} className={`fill-brand font-semibold text-[19px] sm:text-[13px] ${HALO} stroke-[4]`}>
              {km}
            </text>
          </g>

          {/* head office */}
          <g aria-hidden>
            <circle cx={hq.x} cy={hq.y} r={9} className="fill-surface" />
            <circle cx={hq.x} cy={hq.y} r={6} className="fill-brand stroke-surface" strokeWidth={2} />
            <circle cx={hq.x} cy={hq.y} r={2.2} className="fill-on-brand" />
          </g>
          {children}
        </svg>
      </div>

      <figcaption className="flex flex-col gap-4">
        <ul className="grid grid-cols-1 gap-x-6 gap-y-3 text-small text-ink-2 sm:grid-cols-2" aria-label="สัญลักษณ์บนแผนที่">
          <li className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
              <circle cx="14" cy="14" r="9" className="fill-surface" />
              <circle cx="14" cy="14" r="6" className="fill-brand stroke-surface" strokeWidth="2" />
            </svg>
            <span>สำนักงานใหญ่ (จุดเริ่มวัดระยะ)</span>
          </li>
          <li className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
              <circle cx="14" cy="14" r="11" className="fill-brand/[0.14] stroke-brand" strokeWidth="2.5" />
            </svg>
            <span>
              ในระยะ {km} · พื้นที่หลัก<span aria-hidden>*</span>
            </span>
          </li>
          <li className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
              <circle cx="14" cy="14" r="11" className="fill-sky/[0.07] stroke-sky" strokeWidth="2" strokeDasharray="5 4" />
            </svg>
            <span>ถึง {kmMax} · คิดค่าเดินทางตามระยะ</span>
          </li>
          <li className="flex items-center gap-3">
            <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden className="shrink-0">
              <rect x="3" y="6" width="22" height="16" rx="4" className="fill-brand/25 stroke-brand" strokeWidth="2" />
            </svg>
            <span>กรุงเทพมหานคร</span>
          </li>
        </ul>
        <p className="text-meta text-ink-3">
          วงกลมแสดงระยะถนนโดยประมาณ (ระยะเส้นตรง × {TRAVEL.roadFactor}) ไม่ใช่เส้นทางจริง · ทีมยืนยันระยะจากที่อยู่หน้างานอีกครั้ง
          <br />
          <span aria-hidden>*</span> เมื่อยอดงานล้างถึง {baht(MIN_BILL)} ก่อน VAT ต่อเที่ยว
        </p>
      </figcaption>
    </figure>
  );
}
