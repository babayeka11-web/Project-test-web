// Site map and helpers shared by the header, footer, sitemap and every page.

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
/** Absolute URL of the published site (Open Graph, canonical, schema.org). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://babayeka11-web.github.io/Project-test-web').replace(/\/$/, '');

/** Path of a file in /public, with the base path the static host serves the site under (next/link adds it by itself). */
export const asset = (path: string) => `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;

export type NavItem = {
  href: string;
  /** Short label for the desktop header, where space is tight. */
  th: string;
  /** Label with its noun ("ซ่อมแอร์") where there is room: the menu sheet and the footer. Falls back to `th`. */
  full?: string;
  /** One-line description under the label in the menu sheet. */
  sub?: string;
};

/** Main menu — order follows what customers come for most: cleaning first. */
export const NAV: NavItem[] = [
  { href: '/cleaning/', th: 'ล้างแอร์', sub: 'ล้างปกติ · ล้างใหญ่ · จองออนไลน์' },
  { href: '/installation/', th: 'ติดตั้ง', full: 'ติดตั้งแอร์', sub: 'มาตรฐาน · พรีเมียม · ย้ายแอร์' },
  { href: '/repair/', th: 'ซ่อม', full: 'ซ่อมแอร์', sub: 'เช็กอาการ · ค่าตรวจ · ซ่อมหรือเปลี่ยน' },
  { href: '/products/', th: 'ซื้อแอร์', sub: '705 รุ่นพร้อมราคา' },
  { href: '/business/', th: 'องค์กร', full: 'ลูกค้าองค์กร', sub: 'สัญญาล้างรายปี' },
  { href: '/prices/', th: 'ราคา', full: 'ค่าบริการทั้งหมด', sub: 'ล้าง · ติดตั้ง · ซ่อม · ราคาก่อน VAT' },
];

/** Secondary links (footer, menu sheet — on desktop through the header's "เพิ่มเติม"). */
export const NAV_MORE: NavItem[] = [
  { href: '/area/', th: 'พื้นที่ให้บริการ' },
  { href: '/knowledge/', th: 'ความรู้ · หา BTU' },
  { href: '/faq/', th: 'คำถามที่พบบ่อย' },
  { href: '/contact/', th: 'ติดต่อเรา' },
  { href: '/trade-in/', th: 'เทิร์นแอร์เก่า' },
  { href: '/quote/', th: 'ใบเสนอราคา' },
];
