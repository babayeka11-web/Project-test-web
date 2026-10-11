// SERVER / BUILD-TIME ONLY — the site search index (src/lib/search.ts), served as /search-index.json
// (src/app/search-index.json/route.ts). Reads the Pricebook, so never import it from a 'use client' file.
import { groupFaq } from '@/app/faq/faq-groups';
import { GUIDES } from '@/components/knowledge/guides';
import { BRAND_ALIASES } from './domain/catalog';
import { baht, btuFmt, EX_TH } from './domain/format';
import { getCatalogLite, getFaq } from './domain/pricebook';
import { TYPE_BY_ID } from './domain/types';
import { entry, type SearchEntry } from './search';
import { NAV, NAV_MORE } from './site';

/** Words people type for each page that its title and description do not already say. */
const PAGE_WORDS: Record<string, string> = {
  '/cleaning/': 'ล้างแอร์ ราคาล้างแอร์ จองล้าง ล้างใหญ่ ล้างปกติ คิวด่วน ทำความสะอาด',
  '/installation/': 'ติดตั้งแอร์ ราคาติดตั้ง ย้ายแอร์ ถอดแอร์ รื้อ ท่อทองแดง วัสดุ',
  '/repair/': 'ซ่อมแอร์ แอร์ไม่เย็น น้ำหยด เสียงดัง เติมน้ำยา อาการ ค่าตรวจ',
  '/products/': 'ซื้อแอร์ ราคาแอร์ รุ่น ยี่ห้อ inverter อินเวอร์เตอร์ แคตตาล็อก',
  '/business/': 'องค์กร บริษัท สัญญารายปี โรงงาน โรงแรม โรงพยาบาล คอนโด จัดซื้อ',
  '/prices/': 'ราคา ค่าบริการ ตารางราคา pricebook vat',
  '/area/': 'พื้นที่บริการ ค่าเดินทาง รหัสไปรษณีย์ เขต แขวง กรุงเทพ สมุทรปราการ',
  '/knowledge/': 'ความรู้ บทความ หาบีทียู btu ขนาดแอร์ คำนวณ',
  '/faq/': 'คำถาม faq ถามบ่อย',
  '/contact/': 'ติดต่อ โทร line อีเมล ที่อยู่ แผนที่ เวลาทำการ',
  '/trade-in/': 'เทิร์น แลกแอร์เก่า เปลี่ยนแอร์ ซ่อมหรือเปลี่ยน',
  '/quote/': 'ใบเสนอราคา ตะกร้า สรุปราคา',
  '/status/': 'สถานะ เลขอ้างอิง ติดตามงาน sbp',
};

export function buildSearchIndex(): SearchEntry[] {
  const pages = [{ href: '/', th: 'หน้าแรก', sub: 'จองล้างแอร์ด่วน เห็นราคารวมทันที' }, ...NAV, ...NAV_MORE].map(p =>
    entry('page', p.full ?? p.th, p.sub ?? '', p.href, PAGE_WORDS[p.href]),
  );
  const guides = GUIDES.map(g => entry('guide', g.th, g.lead, `/knowledge/${g.slug}/`));
  const faq = groupFaq(getFaq()).flatMap(g => g.items.map(i => entry('faq', i.q, g.th, `/faq/#${g.id}`, i.a)));
  const series = getCatalogLite().map(m => {
    const btus = m.skus.map(s => s.btu);
    const min = Math.min(...btus);
    const max = Math.max(...btus);
    const from = Math.min(...m.skus.map(s => s.price).filter(p => p > 0));
    const sub = [
      TYPE_BY_ID[m.type]?.th,
      min === max ? btuFmt(min) : `${btuFmt(min).replace(' BTU', '')}–${btuFmt(max)}`,
      Number.isFinite(from) ? `เริ่ม ${baht(from)} ${EX_TH}` : 'สอบถามราคา',
    ]
      .filter(Boolean)
      .join(' · ');
    const extra = [...(BRAND_ALIASES[m.brandName] ?? []), m.inverter ? 'อินเวอร์เตอร์ inverter' : '', ...m.skus.map(s => `${s.sku} ${s.btu}`)].join(' ');
    return entry('series', `${m.brandName} ${m.series}`, sub, `/products/${m.slug}/`, extra);
  });
  return [...pages, ...guides, ...faq, ...series];
}
