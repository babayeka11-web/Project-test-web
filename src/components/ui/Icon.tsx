// Inline SVG icon set — one family: 24px grid, 1.75 stroke, round caps and joins, no fills.
// Decorative by default (aria-hidden). Pass `label` when the icon carries meaning on its own.
// A few outlines (phone, wind, wrench, thermometer) follow the Feather/Lucide geometry (MIT/ISC licensed).
// Never draw other companies' logos here (ARCHITECTURE §6.12) — LINE and Facebook use generic glyphs.
import type { SVGProps } from 'react';

const PATHS = {
  // services
  clean:
    'M12 2.75v18.5M3.99 7.38l16.02 9.25M20.01 7.38 3.99 16.63M10.16 3.76 12 5.6l1.84-1.84M3.95 9.47l2.51-.67-.68-2.51M5.78 17.71l.68-2.51-2.51-.67M13.84 20.24 12 18.4l-1.84 1.84M20.05 14.53l-2.51.67.68 2.51M18.22 6.29l-.68 2.51 2.51.67',
  install:
    'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
  repair: 'M4.5 16.5a8.5 8.5 0 1 1 15 0M12 12.5l3.6-3.6M6.37 9.25l1.04.6M12 6v1.2M17.63 9.25l-1.04.6M8 20h8M12 16.5V20',
  ac: 'M4.5 5h15A2.5 2.5 0 0 1 22 7.5v4A2.5 2.5 0 0 1 19.5 14h-15A2.5 2.5 0 0 1 2 11.5v-4A2.5 2.5 0 0 1 4.5 5zM6 10.5h12M8.5 17c0 1.2-1 1.6-1 2.8M12 17v2.8M15.5 17c0 1.2 1 1.6 1 2.8',
  quote:
    'M9 3.5h6a1 1 0 0 1 1 1V6a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1zM16 5h1.5A2.5 2.5 0 0 1 20 7.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 18.5v-11A2.5 2.5 0 0 1 6.5 5H8M8.5 12h7M8.5 16h4.5',
  tag: 'M3 12.2V4.5A1.5 1.5 0 0 1 4.5 3h7.7a1.5 1.5 0 0 1 1.06.44l7.3 7.3a1.5 1.5 0 0 1 0 2.12l-7.7 7.7a1.5 1.5 0 0 1-2.12 0l-7.3-7.3A1.5 1.5 0 0 1 3 12.2zM8 8h.01',
  // contact
  phone:
    'M21.5 16.6v2.9a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 1.62 3.8 2 2 0 0 1 3.6 1.6h2.9a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.53 9.47a16 16 0 0 0 6 6l1.23-1.23a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7a2 2 0 0 1 1.72 2.03z',
  chat: 'M12 3.5c4.97 0 9 3.36 9 7.5s-4.03 7.5-9 7.5c-.66 0-1.3-.06-1.92-.17L5.5 20.5l.9-3.8C4.3 15.3 3 13.27 3 11c0-4.14 4.03-7.5 9-7.5zM8.5 11h.01M12 11h.01M15.5 11h.01',
  mail: 'M5.5 5h13A2.5 2.5 0 0 1 21 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 16.5v-9A2.5 2.5 0 0 1 5.5 5zM3.6 6.6 12 13l8.4-6.4',
  pin: 'M12 21.5s-7-6.06-7-11.75a7 7 0 0 1 14 0c0 5.69-7 11.75-7 11.75zM12 12.25a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  users:
    'M16 20v-1.5a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4V20M9.25 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21.5 20v-1.5a4 4 0 0 0-3-3.87M15.5 4.13a3.5 3.5 0 0 1 0 6.75',
  globe:
    'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM3 12h18M12 3c2.3 2.46 3.5 5.6 3.5 9s-1.2 6.54-3.5 9c-2.3-2.46-3.5-5.6-3.5-9S9.7 5.46 12 3z',
  building:
    'M6.5 3h11A1.5 1.5 0 0 1 19 4.5V21H5V4.5A1.5 1.5 0 0 1 6.5 3zM3 21h18M9 7h1.5M13.5 7H15M9 11h1.5M13.5 11H15M9 15h1.5M13.5 15H15M10.5 21v-2.5h3V21',
  home: 'M3.5 11 12 3.75 20.5 11M5.75 9.25V20h12.5V9.25M10 20v-5h4v5',
  truck:
    'M2.5 6.5A1.5 1.5 0 0 1 4 5h9.5v11h-11zM13.5 9h4l3.5 3.8V16h-7.5M7 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  // status
  check: 'M5 12.5 9.5 17 19 7.5',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v5.5M12 7.75h.01',
  alert: 'M10.27 4.4a2 2 0 0 1 3.46 0l7.6 13.1a2 2 0 0 1-1.73 3H4.4a2 2 0 0 1-1.73-3zM12 9.5v4M12 17h.01',
  shield: 'M12 3 19 6v5.5c0 4.4-2.95 7.9-7 9.5-4.05-1.6-7-5.1-7-9.5V6zM9 12l2.2 2.2L15.5 10',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3.2 2',
  calendar: 'M5.5 5h13A2.5 2.5 0 0 1 21 7.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5zM3 10h18M8 3v4M16 3v4',
  document: 'M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8zM14 3v5h5M9 13h6M9 17h4',
  // nature / air
  sparkle:
    'M11 3c.55 4.6 2.4 6.45 7 7-4.6.55-6.45 2.4-7 7-.55-4.6-2.4-6.45-7-7 4.6-.55 6.45-2.4 7-7zM18.5 15c.25 1.75 1 2.5 2.75 2.75-1.75.25-2.5 1-2.75 2.75-.25-1.75-1-2.5-2.75-2.75 1.75-.25 2.5-1 2.75-2.75z',
  leaf: 'M20 4C10.5 4 4.5 9 4.5 15.75c0 1.5.3 2.95.85 4.25 1.3-.55 2.75-.85 4.25-.85C15.5 19.15 20 13.5 20 4zM5.35 20C8.5 15.5 12 12 16 9',
  thermometer: 'M14 14.76V4.5a2.5 2.5 0 0 0-5 0v10.26a4.5 4.5 0 1 0 5 0zM11.5 9v8',
  wind: 'M9.59 4.59A2 2 0 1 1 11 8H2.5m10.09 11.41A2 2 0 1 0 14 16H2.5m15.23-8.27A2.5 2.5 0 1 1 19.5 12h-17',
  droplet: 'M12 3s6.5 6.6 6.5 11.25a6.5 6.5 0 0 1-13 0C5.5 9.6 12 3 12 3z',
  bolt: 'M13 2.5 4.5 13.5H12l-1 8 8.5-11H12z',
  sun: 'M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4',
  moon: 'M20.5 14.2A8.5 8.5 0 1 1 9.8 3.5a6.75 6.75 0 0 0 10.7 10.7z',
  monitor: 'M5 4h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8.5 21h7M12 17v4',
  // interface
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20.5 20.5l-4.55-4.55',
  close: 'M6 6l12 12M18 6 6 18',
  menu: 'M4 7h16M4 12h16M4 17h10',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  'chevron-down': 'M6 9l6 6 6-6',
  'chevron-up': 'M6 15l6-6 6 6',
  'chevron-right': 'M9 6l6 6-6 6',
  'chevron-left': 'M15 6l-6 6 6 6',
  'arrow-right': 'M4.5 12h15M13.5 6l6 6-6 6',
  'arrow-left': 'M19.5 12h-15M10.5 6l-6 6 6 6',
  external: 'M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10',
  copy: 'M9.5 9h9A1.5 1.5 0 0 1 20 10.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 8 19.5v-9A1.5 1.5 0 0 1 9.5 9zM5 15h-.5A1.5 1.5 0 0 1 3 13.5v-9A1.5 1.5 0 0 1 4.5 3h9A1.5 1.5 0 0 1 15 4.5V5',
  send: 'M21 3 10.5 13.5M21 3l-6.5 18-4-7.5-7.5-4z',
  trash: 'M4 6.5h16M9.5 6.5V4.5A1.5 1.5 0 0 1 11 3h2a1.5 1.5 0 0 1 1.5 1.5v2M6 6.5l.9 12.6A2 2 0 0 0 8.9 21h6.2a2 2 0 0 0 2-1.9L18 6.5M10 11v6M14 11v6',
  sliders: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  // media (pause/resume a motion or a 3D view)
  pause: 'M8.5 5v14M15.5 5v14',
  play: 'M7.5 5.2v13.6a1 1 0 0 0 1.5.86l10.6-6.8a1 1 0 0 0 0-1.72L9 4.34a1 1 0 0 0-1.5.86z',
  camera:
    'M4.5 7h2.3l1.4-2.2A1.5 1.5 0 0 1 9.5 4h5a1.5 1.5 0 0 1 1.3.8L17.2 7h2.3A1.5 1.5 0 0 1 21 8.5v10a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5v-10A1.5 1.5 0 0 1 4.5 7zM12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z',
} as const;

/** Friendly aliases so callers can use either name. */
const ALIASES = {
  snowflake: 'clean',
  wrench: 'install',
  gauge: 'repair',
  cart: 'quote',
  line: 'chat',
  'map-pin': 'pin',
  chevron: 'chevron-down',
  arrow: 'arrow-right',
  x: 'close',
  'arrow-up-right': 'external',
} as const;

export type IconName = keyof typeof PATHS | keyof typeof ALIASES;
export const ICON_NAMES = [...Object.keys(PATHS), ...Object.keys(ALIASES)] as IconName[];

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  name: IconName;
  /** Pixel size (width = height). Default 20. */
  size?: number;
  /** Accessible name. Without it the icon is decorative and hidden from assistive tech. */
  label?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 20, label, strokeWidth = 1.75, className, ...rest }: IconProps) {
  const key = (name in ALIASES ? ALIASES[name as keyof typeof ALIASES] : name) as keyof typeof PATHS;
  const d = PATHS[key];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ? `shrink-0 ${className}` : 'shrink-0'}
      focusable="false"
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      {...rest}
    >
      <path d={d} />
    </svg>
  );
}
