// Line illustrations of the five indoor-unit types — used wherever a product photo would go (there are no official photos
// yet). Neutral shapes only: no brand marks, no copy of any manufacturer's design. Colours come from currentColor
// (outline) and the --type-art-fill / --type-art-air custom properties, so the art follows the theme.
import type { ReactNode, SVGProps } from 'react';
import './type-art.css';

export type AcType = 'wall' | 'ceiling' | 'cassette' | 'floor' | 'duct';

const TITLES: Record<AcType, string> = {
  wall: 'ภาพประกอบแอร์ติดผนัง',
  ceiling: 'ภาพประกอบแอร์แขวนใต้ฝ้า',
  cassette: 'ภาพประกอบแอร์สี่ทิศทาง',
  floor: 'ภาพประกอบแอร์ตู้ตั้งพื้น',
  duct: 'ภาพประกอบแอร์ซ่อนในฝ้า / ท่อลม',
};

const FILL = 'var(--type-art-fill, color-mix(in oklab, currentColor 7%, transparent))';
const AIR = 'var(--type-art-air, #0B74B5)';

function Air({ d, delay = 0 }: { d: string; delay?: number }) {
  return (
    <path
      d={d}
      fill="none"
      stroke={AIR}
      strokeWidth={2}
      strokeLinecap="round"
      strokeDasharray="4 7"
      opacity={0.7}
      className="type-art-air"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

const SHAPES: Record<AcType, ReactNode> = {
  wall: (
    <>
      <path d="M8 20h144" strokeOpacity={0.25} />
      <rect x={30} y={28} width={100} height={34} rx={10} fill={FILL} />
      <path d="M38 52h84" strokeOpacity={0.45} />
      <path d="M44 62c10 6 62 6 72 0" />
      <circle cx={120} cy={38} r={2} fill="currentColor" stroke="none" opacity={0.5} />
      <Air d="M52 74c-4 12-2 22 4 32" />
      <Air d="M80 74c0 12 0 22 0 32" delay={300} />
      <Air d="M108 74c4 12 2 22-4 32" delay={600} />
    </>
  ),
  ceiling: (
    <>
      <path d="M8 18h144" strokeOpacity={0.25} />
      <path d="M40 18v6M120 18v6" strokeOpacity={0.4} />
      <rect x={24} y={24} width={112} height={28} rx={8} fill={FILL} />
      <path d="M34 46h92" strokeOpacity={0.45} />
      <path d="M34 52c18 5 74 5 92 0" />
      <Air d="M40 62c10 10 24 18 40 22" />
      <Air d="M70 62c10 12 26 22 46 26" delay={300} />
      <Air d="M100 62c8 10 20 18 36 22" delay={600} />
    </>
  ),
  cassette: (
    <>
      <path d="M8 26h144" strokeOpacity={0.25} />
      <rect x={34} y={26} width={92} height={18} rx={4} fill={FILL} />
      <rect x={58} y={30} width={44} height={10} rx={2} strokeOpacity={0.5} />
      <path d="M38 44h18M104 44h18" />
      <Air d="M48 52c-8 12-16 22-30 30" />
      <Air d="M66 52c-2 14-4 26-8 40" delay={250} />
      <Air d="M94 52c2 14 4 26 8 40" delay={500} />
      <Air d="M112 52c8 12 16 22 30 30" delay={750} />
    </>
  ),
  floor: (
    <>
      <path d="M8 108h144" strokeOpacity={0.25} />
      <rect x={56} y={14} width={48} height={94} rx={8} fill={FILL} />
      <path d="M64 24h32M64 30h32M64 36h32" strokeOpacity={0.5} />
      <rect x={66} y={58} width={28} height={8} rx={3} strokeOpacity={0.5} />
      <Air d="M108 28c12 2 22 6 32 12" />
      <Air d="M108 36c12 4 20 10 28 18" delay={300} />
      <Air d="M52 28c-12 2-22 6-32 12" delay={600} />
    </>
  ),
  duct: (
    <>
      <path d="M8 56h144" strokeOpacity={0.35} />
      <rect x={30} y={20} width={64} height={28} rx={6} fill={FILL} strokeDasharray="5 4" />
      <path d="M94 34h28v22" strokeDasharray="5 4" />
      <path d="M110 56h24" strokeWidth={4} strokeOpacity={0.6} />
      <path d="M112 60h20M112 64h20" strokeOpacity={0.4} />
      <Air d="M114 70c-2 10-2 20 0 30" />
      <Air d="M122 70c0 10 0 20 0 30" delay={300} />
      <Air d="M130 70c2 10 2 20 0 30" delay={600} />
    </>
  ),
};

export function TypeArt({ type, title, ...rest }: { type: AcType; title?: string } & SVGProps<SVGSVGElement>) {
  const label = title ?? TITLES[type];
  return (
    <svg
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
      {...rest}
    >
      {SHAPES[type]}
    </svg>
  );
}

export const TYPE_ART_TITLES = TITLES;
