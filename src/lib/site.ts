// Site map and helpers shared by the header, footer, sitemap and every page.

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
/** Absolute URL of the published site (Open Graph, canonical, schema.org). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://babayeka11-web.github.io/Project-test-web').replace(/\/$/, '');

/** Path of a file in /public, with the base path the static host serves the site under (next/link adds it by itself). */
export const asset = (path: string) => `${BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;

export type NavItem = { href: string; th: string; sub?: string };

/** Main menu — order follows what customers come for most: cleaning first. */
export const NAV: NavItem[] = [
  { href: '/cleaning/', th: 'ล้างแอร์', sub: 'ล้างปกติ · ล้างใหญ่ · จองออนไลน์' },
  { href: '/installation/', th: 'ติดตั้ง', sub: 'มาตรฐาน · พรีเมียม · ย้ายแอร์' },
  { href: '/repair/', th: 'ซ่อม', sub: 'เช็กอาการ · ค่าตรวจ · ค่าซ่อม' },
  { href: '/products/', th: 'ซื้อแอร์', sub: '705 รุ่นพร้อมราคา' },
  { href: '/business/', th: 'องค์กร', sub: 'สัญญาล้างรายปี' },
  { href: '/prices/', th: 'ราคา', sub: 'ค่าบริการทั้งหมด' },
];

/** Secondary links (footer, mobile menu). */
export const NAV_MORE: NavItem[] = [
  { href: '/area/', th: 'พื้นที่ให้บริการ' },
  { href: '/knowledge/', th: 'ความรู้ · หา BTU' },
  { href: '/faq/', th: 'คำถามที่พบบ่อย' },
  { href: '/contact/', th: 'ติดต่อเรา' },
  { href: '/quote/', th: 'ใบเสนอราคา' },
];
