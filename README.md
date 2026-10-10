# SBP AirCare — เว็บไซต์ บริษัท สหบูรพากรุ๊ป จำกัด

เว็บบริการแอร์ครบวงจร (ล้าง · ติดตั้ง · ซ่อม · ขายแอร์ · สัญญาดูแลองค์กร) สร้างใหม่ทั้งหมดในแบบฉบับของเรา
จากการถอดเว็บต้นแบบ — ราคาทุกตัวมาจาก Pricebook 2569 (ราคาก่อน VAT) และเป็นเว็บแบบ static ที่โฮสต์บน GitHub Pages ได้ทันที

## มีอะไรบ้าง

ภาพรวมทุกหน้า: [เดสก์ท็อป](docs/screens/desktop-all-pages.png) · [มือถือ](docs/screens/phone-all-pages.png) · [ใบเสนอราคาที่มีรายการ](docs/screens/quote-filled.png)

| หน้า | ใช้ทำอะไร |
| --- | --- |
| `/` | หน้าแรก · จองล้างแอร์ด่วน เห็นราคารวมทันที |
| `/cleaning/` | ล้างแอร์ทุกประเภท · ขั้นตอนจอง 4 ขั้น · ขั้นต่ำ/ค่าเดินทาง/คิวด่วน |
| `/installation/` | ติดตั้ง Standard / Premium · ย้าย/ถอด · เทิร์นแอร์เก่า |
| `/repair/` | เลือกอาการ → จุดที่น่าตรวจ → ค่าตรวจและค่าซ่อมมาตรฐาน |
| `/products/` | แคตตาล็อก 705 รุ่น 136 ซีรีส์ 22 ยี่ห้อ · ค้นหา/กรอง/เทียบ |
| `/products/<ซีรีส์>/` และ `/products/<ซีรีส์>/<รุ่น>/` | หน้าแยกทุกซีรีส์และทุกรุ่น · ราคาเครื่อง + แพ็กเกจติดตั้ง + วัสดุ |
| `/business/` | สัญญาดูแลแอร์องค์กร · คำนวณรอบ/ทีม/ราคาต่อปี |
| `/prices/` | ตารางราคามาตรฐานทุกหมวด ค้นหาและใส่ใบเสนอราคาได้ |
| `/area/` | เช็กพื้นที่บริการและค่าเดินทางจากแขวง/ตำบลหรือรหัสไปรษณีย์ |
| `/knowledge/` | บทความความรู้ + เครื่องคำนวณ BTU |
| `/faq/` · `/contact/` | คำถามที่พบบ่อย · ติดต่อ/ฟอร์มสอบถาม |
| `/quote/` | ใบเสนอราคาเบื้องต้น รวมทุกอย่างที่เลือกจากทุกหน้า + ส่งคำขอ |

ทุกคำขอ (จอง ใบเสนอราคา ฟอร์มติดต่อ) สร้างสรุปภาษาไทยพร้อมเลขอ้างอิง `SBP-yymmdd-XXXX`
ตอนนี้ยังไม่มีระบบหลังบ้าน เว็บจึงบอกตรง ๆ และส่งต่อให้ลูกค้ากด **ส่งทาง LINE (พิมพ์ข้อความให้แล้ว) · คัดลอก · โทร · อีเมล**
ถ้าตั้ง `NEXT_PUBLIC_FORM_ENDPOINT` (URL ที่รับ POST JSON และตอบ 2xx) เว็บจะส่งคำขอถึงทีมอัตโนมัติและแจ้ง "ส่งถึงทีมแล้ว"

## รันบนเครื่อง

```bash
npm ci
npm run dev          # http://localhost:3000
npm run build        # สร้างเว็บ static ลงโฟลเดอร์ out/
npm run serve        # เปิดดู out/ ที่ http://localhost:3000
npm run lint && npm run typecheck && npm test
node scripts/e2e.mjs http://localhost:3000   # ทดสอบเส้นทางใช้งานหลักบนเว็บที่รันอยู่ (ใช้ Playwright)
```

## ขึ้นเว็บจริง (GitHub Pages)

1. รวมงานเข้า `main` (merge pull request)
2. ครั้งแรกครั้งเดียว: **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. ทุกครั้งที่ push เข้า `main` workflow `Deploy to GitHub Pages` จะตรวจ (lint · typecheck · test · build) แล้วขึ้นเว็บที่
   `https://babayeka11-web.github.io/Project-test-web/`

ตัวแปรที่ตั้งได้ตอน build: `NEXT_PUBLIC_BASE_PATH` (path ย่อย เช่น `/Project-test-web`) · `NEXT_PUBLIC_SITE_URL` · `NEXT_PUBLIC_FORM_ENDPOINT`

## โครงสร้าง

- `src/app/` — หน้าเว็บ (Next.js App Router, static export)
- `src/components/` — ui (ระบบดีไซน์ "Cool Air") · layout · shared · และคอมโพเนนต์ของแต่ละหน้า
- `src/lib/domain/` — กฎธุรกิจและการคำนวณราคา พร้อม unit test (`*.test.ts`)
- `data/` — Pricebook และสมุดที่อยู่ที่ใช้ตอน build

## เอกสาร

- [`docs/00-reference-sbp-aircare.md`](docs/00-reference-sbp-aircare.md) — ถอดเว็บต้นแบบ SBP AirCare (`sahaburapaofficial-cmyk/Sahaburapa-project`): โครงสร้าง ฟีเจอร์ ข้อมูล กฎธุรกิจ ระบบดีไซน์ จุดแข็ง/จุดอ่อน และแนวทางสร้างในแบบฉบับของเรา · ภาพตัวอย่างใน [`docs/reference/sbp/`](docs/reference/sbp/)
- [`docs/dev/ARCHITECTURE.md`](docs/dev/ARCHITECTURE.md) — สัญญาโครงสร้าง เส้นทาง โทเคนดีไซน์ กฎธุรกิจ ฟอร์ม
- [`docs/dev/DOMAIN.md`](docs/dev/DOMAIN.md) · [`docs/dev/UI.md`](docs/dev/UI.md) · [`docs/dev/SHARED.md`](docs/dev/SHARED.md)
