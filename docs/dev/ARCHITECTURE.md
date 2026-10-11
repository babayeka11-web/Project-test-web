# SBP AirCare Web — architecture & shared contract

The new site for SBP AirCare (บริษัท สหบูรพากรุ๊ป จำกัด): air-conditioner cleaning, installation, repair and sales in
Bangkok and nearby provinces. It rebuilds the reference prototype (`docs/00-reference-sbp-aircare.md`, source in
`/home/user/sahaburapaofficial-cmyk/sahaburapa-project/sbp-aircare/`) as **one design, real URLs, lighter pages**.

Read this file before writing code. Companion docs written by the foundation work:
`docs/dev/DOMAIN.md` (business-logic API) and `docs/dev/UI.md` (design system + components).

## 1. Principles

1. **Cleaning first.** The home page leads with "ล้างแอร์ เริ่ม ฿700 / เครื่อง" and a 3-step booking with a live total.
2. **One job per section.** A page tells one story; a section has one purpose and one primary action. No walls of panels.
3. **Prices are real and visible.** Every number comes from the company Pricebook (`data/pricebook.json`) through
   `src/lib/domain/*` — never typed into a component.
4. **Honest UX.** No fake "sent", no made-up free queue slots, simulations labelled "แบบจำลองเพื่ออธิบาย",
   estimates labelled "ราคาประมาณการ · ทีมยืนยันในใบเสนอราคา".
5. **Fast on phones.** Server-rendered static HTML; client JS only where there is interaction; 3D only in the home hero,
   lazy, with a still fallback.
6. **Thai first.** All visible text is Thai (brand/model names stay as they are). Code, comments and identifiers are English.

## 2. Stack

Next.js 15 App Router · `output: 'export'` (static HTML, `trailingSlash: true`) · React 19 · TypeScript (strict) ·
Tailwind CSS 4 (tokens in `src/app/globals.css` `@theme`) · three.js (home hero only) · Vitest (domain tests) ·
fonts self-hosted with `next/font/local` from `src/fonts/` (Anuphan · IBM Plex Sans Thai · IBM Plex Mono).

No server at runtime: anything dynamic happens in the browser. Pages are **server components** that read the Pricebook at
build time and pass small, serialisable props to client components (`'use client'`) that need interaction.

## 3. Routes

| Route | Page | Owner |
|---|---|---|
| `/` | หน้าแรก — hero (3D), quick booking, services, why us, process, B2B teaser, area check, FAQ teaser | home |
| `/cleaning/` | ล้างแอร์ — C1 vs C2, packages, price table by type × BTU, what the crew does, quick booking | cleaning |
| `/installation/` | ติดตั้งแอร์ — Standard vs Premium, what's included, materials, prices by type × BTU, warranty, relocation | cleaning |
| `/repair/` | ซ่อมแอร์ — symptom checker (triage), diagnosis fee, repair price list | repair |
| `/products/` | แอร์ทุกรุ่น — catalog with search, filters, sort, compare | catalog |
| `/products/[slug]/` | หน้าซีรีส์ — BTU sizes, price, install packages, add-ons, spec, add to quote | catalog |
| `/prices/` | ค่าบริการทั้งหมด — every service line, searchable, add to quote | prices |
| `/faq/` | คำถามที่พบบ่อย | prices |
| `/business/` | องค์กร — sectors, annual contract calculator, what reports you get | business |
| `/area/` | พื้นที่ให้บริการ — address search → zone, distance, travel fee | contact |
| `/contact/` | ติดต่อเรา — company facts, hours, channels, contact form | contact |
| `/knowledge/` | ความรู้ — short guides + BTU calculator | knowledge |
| `/quote/` | ใบเสนอราคา — lines, area, totals, request form (+ cart drawer used site-wide) | quote |

## 4. Directory layout and ownership

```
data/                         pricebook.json (Pricebook 2569, public standard rates) · th-address.json (address book)
src/fonts/                    woff2 (do not edit)
src/app/                      routes (one folder per route, owned by the route's owner) · layout.tsx · globals.css
src/lib/site.ts               NAV, asset(), SITE_URL                                   (foundation)
src/lib/domain/*.ts           business logic, pure TS, unit-tested                      (foundation: domain)
src/lib/cart.ts               client quote store (localStorage) + hooks                 (foundation: domain)
src/components/ui/*           design-system primitives                                  (foundation: design)
src/components/layout/*       Header, Footer, MobileBar, CartButton, BetaNotice          (foundation: design)
src/components/<feature>/*    one folder per page owner (home, booking, services, repair, catalog, prices,
                              business, area, contact, knowledge, quote, hero3d)
public/brand/                 sbp.png (company SP mark) · fujiva.png · fujiva-light.png (company's own brand)
scripts/shot.mjs              screenshot helper (Playwright, pre-installed Chromium)
```

**Rules for parallel work:** only create/edit files inside the folders you own. Foundation files (`src/lib/**`,
`src/components/ui/**`, `src/components/layout/**`, `src/app/layout.tsx`, `src/app/globals.css`, configs) are frozen for
page owners — if you need something there, build it inside your own folder and say so in your report.

## 5. Design language — "Cool Air"

Bright, airy, calm, premium. Large Thai type, generous white space, soft layered shadows, rounded cards, one strong orange
CTA per view. Brand: FUJIVA navy + sky blue (cool, clean air) with the SP orange-red only for primary actions.

| Token | Light | Dark |
|---|---|---|
| `bg` page | `#F5F9FC` | `#0A1220` |
| `surface` card | `#FFFFFF` | `#111B2B` |
| `surface-2` soft panel | `#EDF4FA` | `#16233A` |
| `ink` text | `#0B1B2E` | `#E8EEF6` |
| `ink-2` secondary text | `#46566B` | `#AEBBCC` |
| `ink-3` meta text (≥4.5:1 on surface) | `#5B6B7F` | `#8C9BB0` |
| `line` hairline | `rgba(0,60,153,.11)` | `rgba(160,190,230,.14)` |
| `brand` FUJIVA navy | `#003C99` | `#8DB8F5` |
| `sky` | `#0B74B5` | `#5BB5EC` |
| `sky-soft` | `#E3F1FB` | `#13304A` |
| `cta` SP orange-red (white text) | `#C93A0A` hover `#A92F07` | `#F08A4B` (text `#0B1B2E`) |
| `ok` / `warn` / `bad` | `#1B7A45` / `#B4560D` / `#B02A26` | `#4ED39A` / `#FFB35C` / `#FF7B72` |

Type: headings Anuphan 600–700, body IBM Plex Sans Thai 400–600 at `16px/1.7`, numbers IBM Plex Mono or
`tabular-nums`. Never negative letter-spacing on Thai. Radius: 24 cards · 14 controls · full pills for buttons.
Motion: `cubic-bezier(.16,1,.3,1)` 150/250/400 ms, press = scale .97, hover lift on cards (pointer only); everything off
under `prefers-reduced-motion`. Dark mode follows the OS (`prefers-color-scheme`) and `html[data-theme]`.

Accessibility (WCAG 2.2 AA): contrast ≥ 4.5:1, one `<h1>` per page and no skipped heading levels, one `<main>`,
visible focus ring, touch targets ≥ 44 px, labels on every input, `aria-live` on changing totals, everything usable by
keyboard. No horizontal page scroll at 360–1440 px (wide tables scroll inside their own box).

## 6. Business rules (do not change — from the company / reference prototype)

1. Every price shown is **before VAT** and says so ("ก่อน VAT"). VAT 7% is added once, on a quote total
   (`incVat = Math.round(n × 1.07)`).
2. Service rates (cleaning, repair, installation service `INS-*`) are **rounded up to the next 100** when loaded; materials
   per metre/piece keep their exact price. Wall-unit cleaning starts at **฿700**.
3. Standard rates only. From 10 units: "อาจได้อัตราพิเศษตามเงื่อนไข ทีมขายยืนยันในใบเสนอราคา". No cost, margin, % discount.
4. Cleaning minimum **฿4,500 before VAT per visit**; a cleaning visit below it pays the travel fee ฿300 instead.
   Small work only (no cleaning/installation/repair/contract line): visit minimum ฿1,000 — the gap is the visit charge.
5. Travel: Bangkok ≤ 30 road-km from HQ = free (when cleaning reaches the minimum) · elsewhere up to 150 km =
   ฿300 + ฿10/km beyond 30 km, rounded up to 100 · beyond 150 km = project work. Road km ≈ straight line × 1.35.
6. Booking: normal visits ≥ 3 days ahead (Sunday → Monday) · earlier (today included) = คิวด่วน +฿500 before VAT per visit,
   only when a crew is free — the team confirms. Never show a slot as free without a live queue.
7. Installation on the web: Standard / Premium only; price includes the first 4 m of pipe; warranty 3 years when the unit is
   bought from the company, 1 year for the customer's own unit.
8. Copper on the web is always "O-TWO 0.70 มม." — never "Type L" / "K Copper".
9. VRV / VRF = separate project inquiry, never into the quote cart.
10. Opening hours Mon–Sat 08:30–17:30; out of hours "มีค่าใช้จ่ายเพิ่มเติม" — never a number.
11. Banned phrases anywhere: แก้หายแน่นอน · ไม่มีปัญหาอีกแน่นอน · ประหยัดไฟแน่นอน · ปลอดเชื้อ · สะอาด 100% · รับประกันเย็น ·
    ล้างใหญ่ครบทุกจุด · ไม่มีค่าใช้จ่ายเพิ่มเติมทุกกรณี · อะไหล่เสียแน่นอน · เสร็จตามเวลาแน่นอน.
12. Logos: only the files in `public/brand/` (company's own). Never draw or imitate other brands' logos or AC designs.
13. FUJIVA (company brand) has no Pricebook prices yet → "สอบถามราคากับทีมขาย".

## 7. Forms and requests

A request (contact form, quote, booking) builds a clear Thai summary with a reference number and offers honest hand-off:
**copy summary · send via LINE (`lineMessageUrl`) · call · e-mail**. The optional backend is a Google Sheets + Apps Script
web app (`backend/`, set up with `backend/README.md`; the build reads its URL from the `FORM_ENDPOINT` repository variable
as `NEXT_PUBLIC_FORM_ENDPOINT`). When set, the request is POSTed first (JSON as `text/plain`, no CORS preflight) and
"ส่งถึงทีมแล้ว" shows **only** when the answer confirms it: a 2xx that is not `{ok:false}`, and for Apps Script exactly
`{ok:true, ref}` for this reference. Anything else falls back to the hand-off box with a plain explanation. Every form shows the PDPA line
"ข้อมูลที่กรอกใช้เพื่อติดต่อกลับเรื่องคำขอนี้เท่านั้น" and has a hidden honeypot field.

## 8. Working locally (parallel agents)

- Never run `npm run build` while other agents work — only the integrator builds. Check your work with
  `npx tsc --noEmit -p .`, `npx eslint <your files>`, `npx vitest run` and a private dev server:
  `NEXT_DIST_DIR=.next-<owner> npx next dev -p <your port>` (ports: home 3101 · cleaning 3102 · repair 3103 ·
  catalog 3104 · prices 3105 · business 3106 · contact 3107 · knowledge 3108 · quote 3109 · design 3110 · domain 3111).
- Screenshots: `node scripts/shot.mjs http://localhost:<port>/<route>/ shots/<name>.png 1366 900` and `... 390 844`;
  look at them. The output also reports horizontal overflow and console errors — both must be zero.
- Stop your dev server before you finish (`pkill -f "next dev -p <port>"`).
