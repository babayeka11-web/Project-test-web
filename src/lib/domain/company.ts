// Company facts — the single source for every page (header, footer, contact, schema.org).
// Taken from the reference prototype's COMPANY (sbp-aircare/assets/sbp-core.js, Rev.12–20), which checked them against the
// official site sahaburapagroup.com and the DBD juristic-person listing. Never link www.sahaburapa.com (no longer the company's).
// Out-of-hours work costs extra, but no amount is published — the team states it in the quotation; never invent a figure.

export const COMPANY = {
  th: 'บริษัท สหบูรพากรุ๊ป จำกัด',
  en: 'Saha Burapa Group Co., Ltd.',
  brand: 'SBP AirCare',
  service: 'Sahaburapa Service',
  addr: '593 ถนนพระราม 2 แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150',
  hq: { th: 'สำนักงานใหญ่ 593 ถ.พระราม 2', lat: 13.664, lon: 100.44 },
  tel: '02-459-3299',
  telHref: 'tel:024593299',
  email: 'Sahaburapa.official@gmail.com',
  web: 'www.sahaburapagroup.com',
  webUrl: 'https://www.sahaburapagroup.com',
  years: 'กว่า 30 ปี',
  taxId: '0105553009307',
  line: '@sahaservices',
  lineUrl: 'https://line.me/R/ti/p/@sahaservices',
  fbUrl: 'https://www.facebook.com/profile.php?id=61560113712375',
  hours: 'จันทร์–เสาร์ 08:30–17:30 น. (หยุดวันอาทิตย์)',
  hoursNote: 'นอกเวลาทำการและวันอาทิตย์ให้บริการได้ มีค่าใช้จ่ายเพิ่มเติม ทีมแจ้งในใบเสนอราคา',
  open: { days: [1, 2, 3, 4, 5, 6], from: '08:30', to: '17:30' }, // 0 = Sunday (Date#getDay)
  trade: 'จำหน่ายและนำเข้าน้ำยาแอร์ อุปกรณ์ เครื่องมือ และอะไหล่แอร์ ทั้งปลีกและส่ง',
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('สหบูรพากรุ๊ป 593 ถนนพระราม 2 บางมด จอมทอง กรุงเทพฯ'),
} as const;

/** LINE OA chat with a message typed in (LINE URL scheme oaMessage). */
export const lineMessageUrl = (text: string) =>
  `https://line.me/R/oaMessage/${encodeURIComponent(COMPANY.line)}/?${encodeURIComponent(text)}`;
