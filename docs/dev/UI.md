# SBP AirCare Web — design system "Cool Air" (UI.md)

The visual language and the component kit every page is built from. Read `ARCHITECTURE.md` §5 first; this file is the
practical version of it. Source: `src/app/globals.css` (tokens, base styles, utilities), `src/components/ui/*`
(primitives, barrel `@/components/ui`), `src/components/layout/*` (site chrome, used only by `src/app/layout.tsx`).
A live showcase of every primitive is the temporary home page (`src/app/page.tsx`, until the home owner replaces it).

**The look in one line:** bright and airy, cool navy + sky blue, big calm Thai type, soft layered shadows, rounded
surfaces, and **one orange action per view**. The signature is *air*: soft sky washes and thin flowing lines
(`AirLines`, the eyebrow mark, `bg-air`). Use it at the top of a page and in navy panels — never on every block.

```tsx
import { Section, Card, Button, Price, Icon } from '@/components/ui';
```

---

## 1. Tokens

All colours are CSS variables registered in Tailwind's `@theme`, so they are ordinary utilities (`bg-surface`,
`text-ink-2`, `border-line`, `bg-cta`, `ring-focus/20` …) and **switch automatically** in dark mode: the OS setting,
unless `html[data-theme="light"|"dark"]` forces one (the footer has the switch; the choice is kept in this browser
only). `dark:` utilities follow the same rule. **Never write a hex value in a component.**

### 1.1 Colour

| Token (utility) | Light | Dark | Use for |
|---|---|---|---|
| `bg` / `page` (`bg-bg`) | `#F5F9FC` | `#0A1220` | page background (set on `<body>`) |
| `surface` (`bg-surface`) | `#FFFFFF` | `#111B2B` | cards, sheets, inputs |
| `surface-2` (`bg-surface-2`) | `#EDF4FA` | `#16233A` | soft panels, tracks, table header |
| `ink` (`text-ink`) | `#0B1B2E` | `#E8EEF6` | headings, body text |
| `ink-2` (`text-ink-2`) | `#46566B` | `#AEBBCC` | secondary text, leads |
| `ink-3` (`text-ink-3`) | `#5B6B7F` | `#8C9BB0` | meta text, hints (≥ 4.5:1 on surface and surface-2) |
| `line` (`border-line`) | `rgba(0,60,153,.11)` | `rgba(160,190,230,.14)` | hairlines, card borders (decorative) |
| `line-strong` (`border-line-strong`) | `#7A8BA2` | `#5F7292` | input / control borders (≥ 3:1, WCAG 1.4.11) |
| `brand` (`bg-brand`, `text-brand`) | `#003C99` | `#8DB8F5` | FUJIVA navy: secondary buttons, links, selected states |
| `brand-hover` / `on-brand` | `#00307D` / `#FFF` | `#A4C6F7` / `#0B1B2E` | hover, text on brand |
| `sky` (`text-sky`) | `#0B74B5` | `#5BB5EC` | eyebrows, icons, air lines, focus |
| `sky-soft` (`bg-sky-soft`) | `#E3F1FB` | `#13304A` | icon discs, selected rows, info notices |
| `cta` (`bg-cta`) | `#C93A0A` hover `#A92F07` | `#F08A4B` hover `#F49A63` | **primary action only** |
| `on-cta` / `cta-soft` | `#FFF` / `#FFF3EC` | `#0B1B2E` / `#33200F` | text on CTA / soft orange badge |
| `ok` · `ok-soft` | `#1B7A45` · `#EAF6EF` | `#4ED39A` · `#0F2B22` | success |
| `warn` · `warn-soft` | `#B4560D` · `#FFF6EB` | `#FFB35C` · `#2E2210` | caution (คิวด่วน, conditions) |
| `bad` · `bad-soft` | `#B02A26` · `#FBEAEA` | `#FF7B72` · `#331A1C` | errors |
| `deep` / `on-deep` / `on-deep-2` | `#003C99` / `#FFF` / `#CFDDF2` | `#0E2547` / `#E8EEF6` / `#AEC4E6` | navy feature panels |
| `sky-on-deep` | `#8ACBF5` | `#6BC0F0` | accents inside navy panels |
| `focus` (`outline-focus`, `ring-focus`) | `#0B74B5` | `#5BB5EC` | focus ring (white inside navy panels) |

Contrast pairs that **fail** — don't use them for normal-size text: `text-sky` on `bg-sky-soft` (use `text-brand`),
`text-cta` on anything but `surface`/`cta-soft`, `text-ink-3` on `bg-sky-soft` below 13px. All `*-soft` +
same-tone text pairs (`bg-ok-soft text-ok` …) pass 4.5:1 in both themes.

### 1.2 Type

| Utility | Size (fluid) | Line height | Font | Use |
|---|---|---|---|---|
| `text-display` | 38 → 64px | 1.24 | Anuphan 700 | home hero `<h1>` only |
| `text-h1` | 32 → 48px | 1.3 | Anuphan 700 | inner-page `<h1>` (PageHeader) |
| `text-h2` | 26 → 36px | 1.36 | Anuphan 600 | section titles |
| `text-h3` | 19 → 22px | 1.5 | Anuphan 600 | card titles, sheet titles |
| `text-lead` | 17 → 19px | 1.75 | Plex Sans Thai | one or two sentences under a title |
| `text-body` | 16px | 1.7 | Plex Sans Thai | default body |
| `text-small` | 15px | 1.65 | Plex Sans Thai | card text, controls, nav |
| `text-meta` | 13px | 1.6 | Plex Sans Thai | hints, "ก่อน VAT", footnotes (minimum size) |

Families: `font-display` (Anuphan 500–700), `font-sans` (IBM Plex Sans Thai 400–700, the default), `font-mono`
(IBM Plex Mono 400–600, Latin only — reference numbers, model codes; it has no "฿"). Plex digits are tabular already;
`table`, `output`, `data`, `time` and `.num` also get `tabular-nums`. h1–h4 use `text-wrap: balance`, paragraphs
`pretty`. **Never** negative letter-spacing or line-height below 1.24 on Thai. Don't put all-caps or tracked-out labels.

### 1.3 Space, size, shape, depth, motion

| Token | Value | Utility |
|---|---|---|
| page gutter | `clamp(16px … 40px)` | `px-gutter` (Container does it) |
| section rhythm | `clamp(64px … 112px)` | `py-section` (Section does it) |
| header height | 64px (<1024) · 72px | `h-header`, `-mt-header`, `pt-header`, `scroll-mt-header` |
| containers | 1216 · 672 · 1408px | `max-w-page` · `max-w-text` · `max-w-wide` |
| radius | 24 cards · 14 controls · 32 panels · pills | `rounded-card` · `rounded-control` · `rounded-panel` · `rounded-full` |
| shadows | resting · hover · overlays · orange glow | `shadow-card` · `shadow-lift` · `shadow-pop` · `shadow-cta` |
| easing | `cubic-bezier(.16,1,.3,1)` | `ease-air` (+ `duration-150/250/400`) |
| breakpoints | 400 · 640 · 768 · 1024 · 1280 | `xs:` `sm:` `md:` `lg:` `xl:` |

z-index: content 0–10 · sticky header and MobileBar 40 · toasts 60 · skip link 100 · Sheet uses the browser top layer.

Motion: press = `scale(.97)` (`pressable`), hover lift on cards (`lift`, fine pointers only), 150 ms for feedback,
250 ms for state changes, 400 ms for entering panels; exits are faster. One orchestrated moment per page at most (the
air lines draw in once on the hero). No scroll-triggered fade-ups. **Everything is off under
`prefers-reduced-motion`** (global rule in `globals.css`).

### 1.4 Signature and helper utilities (`globals.css`)

| Utility | What it does |
|---|---|
| `bg-air` | cool sky wash for heroes and PageHeader |
| `bg-air-soft` | gentle wash for `Section tone="soft"` |
| `bg-air-deep` + `scheme-deep` | navy panel; `scheme-deep` re-maps the tokens inside so every primitive (Button, Badge, Card, Price, focus ring) reads correctly on navy |
| `glass` | frosted surface (sticky header, MobileBar) |
| `air-lines` | flowing-lines shape as a CSS mask, coloured by `text-*` (for small decorative spots; prefer `<AirLines>`) |
| `air-rule` | hairline divider that fades at both ends (`<hr className="air-rule" />`) |
| `pressable` · `lift` | press feedback · hover lift |
| `no-scrollbar` · `scroll-shadow-x` | hidden scrollbar for chip/tab rows · edge shadows on side-scrolling boxes |
| `safe-bottom` | padding for the iPhone home indicator |
| `ui-table` | styles plain `<table>` markup (Table uses it) |

---

## 2. Page layout rules

**Skeleton** (from `layout.tsx`, nothing to do per page): skip link → BetaNotice → sticky Header → `<main id="main">`
→ Footer → MobileBar (phones) → Toaster → JSON-LD (HVACBusiness). Pages render only the content of `<main>`.

**An inner page** is a PageHeader plus 2–5 Sections and one CtaBand:

```tsx
// src/app/cleaning/page.tsx (server component)
import type { Metadata } from 'next';
import { PageHeader, Section, CtaBand, Button, Card, Price } from '@/components/ui';

export const metadata: Metadata = { title: 'ล้างแอร์', description: '…', alternates: { canonical: './' } };

export default function Page() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ล้างแอร์' }]}
        eyebrow="ล้างแอร์"
        title="ล้างแอร์โดยทีมช่างของบริษัท"
        lead="เลือกล้างปกติหรือล้างใหญ่ แล้วเห็นราคาก่อน VAT ทันที"
        actions={<Button href="#book" icon="clean">จองล้างแอร์</Button>}
        aside={<Card><Price amount={fromPrice} prefix="เริ่ม" unit="/ เครื่อง" size="xl" /></Card>}
      />
      <Section id="compare" eyebrow="วิธีล้าง" title="ล้างปกติ หรือ ล้างใหญ่">…</Section>
      <Section id="prices" tone="soft" title="ราคาตามขนาด">…</Section>
      <Section id="book" title="จองล้างแอร์">…</Section>
      <CtaBand title="…" actions={…} />
    </>
  );
}
```

- **Headings:** exactly one `<h1>` (PageHeader / home hero). Section titles are `<h2>`, cards inside are `<h3>`.
  Never skip a level; use `SectionHeading as="h3"` for a sub-block.
- **Hero under the header:** PageHeader (and the home hero) use `-mt-header pt-header` so the transparent header floats
  over the sky wash. Do the same on any custom first block that has its own background.
- **Containers:** `Container` (1216px) for everything; `size="text"` for long reading (FAQ answers, policies);
  `size="wide"` only for very wide tools.
- **Section rhythm:** let `Section` set vertical padding (`spacing="compact"` for short follow-ups). Alternate `plain`
  and `soft` tones to separate stories; at most one `tone="brand"` section and one CtaBand per page.
- **Grids:** start every grid with `grid-cols-1` (= `minmax(0,1fr)`) so wide children can't push the page sideways.
  Common patterns: cards `grid gap-5 md:grid-cols-2 lg:grid-cols-3`; text + tool
  `grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_25rem]`; stats `<StatGroup columns={4}>`. Gaps: 12/16/20/24px
  inside components, 40–48px between a heading and its content (Section does this).
- **Width:** no horizontal page scroll from 360 to 1440px. Wide content (tables, chip rows) scrolls inside its own box
  (`Table`, `no-scrollbar overflow-x-auto`).
- **Phones:** touch targets ≥ 44px (all primitives are), the fixed MobileBar takes the bottom 64px + safe area (body
  is padded for it), sticky things never cover focused fields (`scroll-padding` is set).
- **Anchors:** give sections an `id`; links like `/cleaning/#book` land below the sticky header automatically.
- **Prices:** always through `<Price>` with an amount from `src/lib/domain/*`. Never type a number into a page.

**Server vs client.** Static primitives (Container, Section, PageHeader, Card, Badge, Price, Stat, Notice, Table,
Breadcrumbs, Accordion, CtaBand, Icon, AirLines, Skeleton, Button) work in server components. Interactive ones are
client components: SegmentedControl, Tabs, Stepper, Field/Input/Select/Textarea/Checkbox/Radio/Fieldset, Sheet,
toast/Toaster, Chip (needs an onClick). Keep pages as server components and put interaction in a small
`'use client'` component inside your own folder.

**className merging.** `className` is appended, not merged (no tailwind-merge). Adding spacing/colour/size is fine;
to change `display` (e.g. hide on phones) wrap the component: `<div className="hidden md:block"><X /></div>`.

---

## 3. Components (`@/components/ui`)

### Container
`size?: 'page' | 'text' | 'wide'`, `as?`. Centres content with the page gutter.
```tsx
<Container size="text">…</Container>
```

### Section · SectionHeading · Eyebrow
`id`, `eyebrow`, `title` (h2), `lead`, `actions`, `tone?: 'plain' | 'soft' | 'brand'`, `align?: 'start' | 'center'`,
`spacing?: 'default' | 'compact' | 'none'`, `width?: 'page' | 'text' | 'wide'`. Labelled by its heading. `tone="brand"`
is a navy panel with air lines; everything inside re-themes (secondary buttons turn white, cards turn glassy).
```tsx
<Section id="why" eyebrow="ทำไมต้องเรา" title="ทีมช่างของบริษัท ไม่ใช่ช่างรับจ้างต่อ"
  lead="…" actions={<Button href="/contact/" variant="ghost">คุยกับทีม</Button>}>
  <ul className="grid gap-5 md:grid-cols-3">…</ul>
</Section>
```
`SectionHeading` (same props + `as: 'h2'|'h3'`) for custom layouts; `Eyebrow` alone for a topic line with the air mark.

### PageHeader
`breadcrumbs: Crumb[]`, `eyebrow`, `title` (**the h1**), `lead`, `actions`, `aside` (right column ≥ 1024px), `meta`
(small print), `children`. Sits under the transparent header on the `bg-air` wash with drawn-in air lines.

### Button · IconButton · buttonClass · CountBubble
`variant?: 'primary' | 'secondary' | 'ghost' | 'soft' | 'quiet'` (primary = orange CTA, **one per view**; secondary
= navy; ghost = outlined; soft = pale sky; quiet = text only), `size?: 'sm' | 'md' | 'lg'` (44 / 48 / 56px),
`icon` / `iconEnd` (icon name or node), `fullWidth`, `loading` (spinner + `aria-busy`, clicks ignored — keep a label
like "กำลังส่ง…"), `href` (site path → next/link; `http(s)` opens a new tab with a hidden "(เปิดหน้าต่างใหม่)";
`tel:`/`mailto:` stay in place), `external` to force a new tab, plus normal button/anchor attributes.
```tsx
<Button href="/cleaning/#book" icon="clean">จองล้างแอร์</Button>
<Button variant="secondary" icon="quote" onClick={add}>ใส่ใบเสนอราคา</Button>
<Button variant="ghost" href={COMPANY.lineUrl} icon="chat">ส่งทาง LINE</Button>
<Button type="submit" loading={sending}>{sending ? 'กำลังส่ง…' : 'ส่งคำขอ'}</Button>
<IconButton icon="close" label="ปิด" />            {/* label is required: it is the accessible name */}
<IconButton icon="quote" label="ใบเสนอราคา" variant="soft" badge={count} />
<label className={buttonClass({ variant: 'ghost' })}>…</label>
```

### Card
`tone?: 'surface' | 'soft' | 'sky' | 'deep'`, `padding?: 'none' | 'sm' | 'md' | 'lg'`, `interactive` (hover lift),
`href` (whole card is one link — keep its content short), `as`.
```tsx
<Card href="/repair/" className="flex h-full flex-col gap-4">
  <span className="grid size-14 place-items-center rounded-2xl bg-sky-soft text-brand"><Icon name="repair" size={28} /></span>
  <h3 className="text-h3">ซ่อมแอร์</h3>
  <p className="text-small text-ink-2">เช็กอาการเบื้องต้น ดูค่าตรวจและค่าซ่อมมาตรฐาน</p>
</Card>
```

### Badge · Chip
Badge (static label): `tone?: 'neutral' | 'sky' | 'brand' | 'ok' | 'warn' | 'bad' | 'cta' | 'outline'`,
`size?: 'sm' | 'md'`, `icon`, `dot`. Use for "ก่อน VAT", "แบบจำลองเพื่ออธิบาย", "คิวด่วน", "สอบถามทีมขาย".
Chip (toggle, `aria-pressed`, 44px): `selected`, `onClick`, `icon`, `count`. Wrap chips in
`<div role="group" aria-labelledby=…" className="flex flex-wrap gap-2">`.
```tsx
<Badge tone="outline" icon="info">{NOTES.simulation}</Badge>
<Chip selected={on} count={351} onClick={toggle}>ติดผนัง</Chip>
```

### Price
`amount: number | null` (baht **before VAT** from the domain layer; `null` → `fallback`, default "ประเมินหน้างาน"),
`prefix` ("เริ่ม"), `unit` ("/ เครื่อง"), `vat?: 'ex' | 'inc' | false` (default `'ex'` → prints "ก่อน VAT"; use `false`
only inside a table/total whose header already says it), `size?: 'sm' | 'md' | 'lg' | 'xl'`,
`tone?: 'ink' | 'brand' | 'sky'`, `stacked` (VAT note on its own line). Formats with `baht()` from
`@/lib/domain/format`. For a changing total, put `aria-live="polite"` on the element that wraps it.
```tsx
<Price amount={startAt(table, 'Basic Clean', 'C1')} prefix="เริ่ม" unit="/ เครื่อง" size="xl" tone="brand" />
<Price amount={null} fallback={NOTES.askSales} />
```

### Stat · StatGroup
`<StatGroup columns={2|3|4}>` (a `<dl>`, 2 columns on phones) with `<Stat value label hint size="md|lg" />`. Values
come from data/constants ("705", `฿${MIN_BILL…}`), never invented.

### Icon
`name: IconName`, `size` (default 20), `label` (makes it meaningful: `role="img"`), `strokeWidth`. One family: 24px
grid, 1.75 stroke, round joins. Names: services `clean` (snowflake) · `install` (wrench) · `repair` (gauge) · `ac` ·
`quote` (cart) · `tag`; contact `phone` · `chat` (LINE — generic bubble, never the LINE logo) · `mail` · `pin` ·
`users` · `globe` · `building` · `home` · `truck`; status `check` · `info` · `alert` · `shield` · `clock` ·
`calendar` · `document`; air `sparkle` · `leaf` · `thermometer` · `wind` · `droplet` · `bolt` · `sun` · `moon` ·
`monitor`; interface `search` · `close` · `menu` · `plus` · `minus` · `chevron-down|up|left|right` ·
`arrow-right|left` · `external` · `copy` · `send` · `trash` · `sliders` · `camera`. Aliases: `snowflake`, `wrench`,
`gauge`, `cart`, `line`, `map-pin`, `chevron`, `arrow`, `x`, `arrow-up-right`. Decorative icons next to text need
nothing; icon-only controls use `IconButton`.

### SegmentedControl (client)
Radiogroup for 2–4 short exclusive options. `options: { value, label, hint?, icon?, disabled? }[]`, `value`,
`onChange`, `label` or `labelledBy` (one is required for a name), `size?: 'sm' | 'md'`, `fullWidth` (equal segments,
shrinks on phones), `name` (adds a hidden input). Arrow keys move and select; the thumb slides.
```tsx
<span id="lvl">วิธีล้าง</span>
<SegmentedControl labelledBy="lvl" fullWidth value={level} onChange={setLevel}
  options={[{ value: 'C1', label: 'ล้างปกติ', hint: 'C1' }, { value: 'C2', label: 'ล้างใหญ่', hint: 'C2' }]} />
```

### Tabs (client)
`items: { id, label, content, icon?, count? }[]`, `label` (tablist name), `value`/`defaultValue`/`onChange`,
`variant?: 'line' | 'pill'`, `panelClassName`. Roving tabindex, ←/→/Home/End. All panels are in the static HTML
(inactive ones `hidden`). Use for switching views of the same thing (ติดผนัง / แขวน / สี่ทิศทาง), not for page navigation.

### Stepper (client)
`value`, `onChange`, `label` (required, e.g. "จำนวนเครื่อง"), `min` (0), `max` (99), `step`, `unit` ("เครื่อง"),
`size?: 'sm' | 'md'`, `disabled`, `describedBy`, `name`. − / + are 44–48px; the number is typeable (↑/↓,
PageUp/PageDown, Home/End) and clamped on blur.

### Field · Fieldset · Input · Select · Textarea · Checkbox · Radio (client)
`Field`: `label`, `hint`, `error`, `required` (red * + "(จำเป็น)" for screen readers), `optional` ("(ไม่บังคับ)"),
`id`. It wires `id`, `aria-describedby`, `aria-invalid` and `required` into the control inside it.
`Fieldset`: `legend`, `hint`, `error`, `required`, `hideLegend` — for groups of Radio/Checkbox.
`Input`: native props + `icon` (left), `suffix` (unit, right), `size?: 'md' | 'lg'` (48 / 56px).
`Select`: native props + `placeholder` (empty first option), `size`. `Textarea`: native props.
`Checkbox` / `Radio`: `label`, `description`, `variant?: 'row' | 'card'` (card = bordered option with selected ring),
`aside` (e.g. a Price on the right of a card), plus native props.
```tsx
<Field label="เบอร์โทร" required hint="ทีมโทรยืนยันในเวลาทำการ" error={errors.tel}>
  <Input name="tel" type="tel" inputMode="tel" autoComplete="tel" icon="phone" />
</Field>
<Fieldset legend="วิธีล้าง" required>
  <Radio name="method" value="C1" variant="card" label="ล้างปกติ (C1)" description="…" aside={<Price amount={c1} size="sm" />} />
  <Radio name="method" value="C2" variant="card" label="ล้างใหญ่ (C2)" description="…" />
</Fieldset>
<Checkbox name="consent" label="ยินยอมให้ติดต่อกลับ" description="ข้อมูลที่กรอกใช้เพื่อติดต่อกลับเรื่องคำขอนี้เท่านั้น" />
```
Form rules: visible label on every field (never placeholder-only), `type`/`inputMode`/`autoComplete` set, validate on
blur or submit (not per keystroke), error text says what to do ("กรอกเบอร์ 9–10 หลัก เช่น 0812345678"), after a failed
submit focus the first invalid field. Every form shows the PDPA line and a hidden honeypot (ARCHITECTURE §7).

### Accordion · AccordionItem
Native `<details>` (works without JS; animates where supported). `items: { id?, title, content, defaultOpen? }[]`,
`name` (exclusive group — one open at a time), `variant?: 'lined' | 'card'`. Or compose `AccordionItem` (`title`,
`name`, `defaultOpen`, `id`, `variant`). Use for FAQ and "รายละเอียดเพิ่มเติม", not for primary content.

### Sheet (client)
Modal on native `<dialog>`: `open`, `onClose`, `title` (h2 + accessible name), `description`,
`side?: 'right' | 'left' | 'bottom' | 'center'`, `size?: 'sm' | 'md' | 'lg'`, `footer` (sticky actions/totals),
`headerStart`. Focus moves into the sheet and returns to the opener; Esc, the close button and the backdrop close it;
page scroll is locked. Bottom sheets for filters on phones; right sheets for the cart/menu.
```tsx
<Sheet open={open} onClose={() => setOpen(false)} side="bottom" title="ตัวกรอง"
  footer={<Button fullWidth variant="secondary" onClick={() => setOpen(false)}>ดูผลลัพธ์</Button>}>
  …
</Sheet>
```

### toast · Toaster (client)
`toast(message, { tone?: 'neutral' | 'ok' | 'warn' | 'bad', action?: { label, href? , onClick? }, duration?, id? })`
returns an id; `toast.dismiss(id)`. `<Toaster />` is already in the root layout. Polite live region, never steals
focus, 4.5 s (7 s with an action), pauses on hover/focus, sits above the MobileBar. Same verb as the button:
button "ใส่ใบเสนอราคา" → toast "เพิ่มในใบเสนอราคาแล้ว". Don't toast errors that need fixing — show them in place.
```tsx
toast('เพิ่มในใบเสนอราคาแล้ว', { tone: 'ok', action: { label: 'ดูใบเสนอราคา', href: '/quote/' } });
```

### Notice
`tone?: 'info' | 'ok' | 'warn' | 'bad'`, `title`, children, `icon`, `action`, `live?: 'polite' | 'assertive'`
(role status/alert for results that appear), `size?: 'sm' | 'md'`. For honest notes in context: estimates
(`NOTES.estimate`), conditions, hand-off fallbacks ("ส่งผ่านเว็บไม่ได้ในตอนนี้ คัดลอกสรุปแล้วส่งทาง LINE").

### Table · TableShell
`caption` (required; screen-reader caption + region name), `showCaption`, `columns: { key, label, align?, numeric?,
rowHeader?, className? }[]`, `rows: ({ id? } & Record<key, ReactNode>)[]`, `maxHeight` (box scrolls, header sticks),
`stickyFirstColumn`, `minWidth` (default 36rem before it scrolls sideways), `footnote`. The box is
keyboard-scrollable (`tabIndex=0`) and shows edge shadows when there is more. `TableShell` wraps hand-written
`<table className="ui-table">`.
```tsx
<Table caption="ค่าล้างแอร์ติดผนัง ก่อน VAT" showCaption stickyFirstColumn
  columns={[{ key: 'size', label: 'ขนาด', rowHeader: true }, { key: 'c1', label: 'ล้างปกติ', align: 'end', numeric: true }]}
  rows={rows.map(r => ({ id: r.id, size: r.label, c1: <Price amount={r.c1} size="sm" vat={false} /> }))}
  footnote={NOTES.source} />
```

### Breadcrumbs
`items: { label, href? }[]` (last = current page, `aria-current="page"`), `jsonLd` (default true: prints a
schema.org BreadcrumbList). PageHeader renders it from `breadcrumbs`.

### CtaBand
`title` (h2), `lead`, `actions` (one primary + at most one secondary), `aside` (hours, phone, short list), `as`,
`id`. The navy closing panel — once per page, last before the footer.

### Skeleton · SkeletonText
`<Skeleton shape="line|pill|card|circle" className="h-6 w-40" />`, `<SkeletonText lines={3} />`. Only for client data
that loads (> 300 ms); give it the real content's size so nothing jumps.

### VisuallyHidden · AirLines · cn
`<VisuallyHidden>` = `sr-only` text (`focusable` for skip-style links). `<AirLines animate lines={3|5}
className="absolute … text-sky opacity-50" />` = the signature flowing lines (decorative, `aria-hidden`, colour from
`text-*`, draws in once when `animate`). `cn(...)` joins class names.

---

## 4. Site chrome (`src/components/layout`, used by `layout.tsx` only)

| Component | What it does |
|---|---|
| `SkipLink` | first tab stop, "ข้ามไปยังเนื้อหาหลัก" → `#main` |
| `BetaNotice` | slim navy bar: เว็บไซต์ทดลอง · ราคามาตรฐานจาก Pricebook 2569 ก่อน VAT · ฟอร์มยังไม่ส่งถึงทีมอัตโนมัติ |
| `Header` | sticky, fixed height (no layout shift), transparent at the top and frosted glass once content scrolls under it; logo + wordmark, `NAV` from `src/lib/site.ts` with active state (≥ 1024px), `CartButton`, primary "จองล้างแอร์" → `/cleaning/#book`, menu button (< 1024px) |
| `MobileMenu` | right Sheet: booking CTA, `NAV` with descriptions, `NAV_MORE`, hours, call / LINE / e-mail |
| `CartButton` | link to `/quote/` with the live count from `useCartCount()` (`@/lib/cart`) |
| `MobileBar` | phones (< 768px): โทร · LINE · ใบเสนอราคา (count) · เมนู; glass, safe-area aware; `body` is padded by `--mobilebar-h` |
| `Footer` | company facts from `COMPANY`, all pages, hours + out-of-hours note, HQ map link, tax ID, LINE/Facebook/phone/e-mail, FUJIVA mark (light/dark file), theme switch |
| `ThemeSwitch` | ตามเครื่อง · สว่าง · มืด, stored in `localStorage['sbp-theme']`, applied before paint by `THEME_SCRIPT` |
| `JsonLd` | schema.org `HVACBusiness` built from `COMPANY` |
| `menu-store` | `setMenuOpen(bool)` / `useMenuOpen()` — open the menu from anywhere |

Brand files: `public/brand/sbp.png` (SP mark), `fujiva.png` (light backgrounds), `fujiva-light.png` (dark
backgrounds) — always through `asset()` and never redrawn. Favicon (`src/app/icon.svg`, `apple-icon.png`) is our own
mark: a wall unit with an orange power light and flowing air, on the navy→sky gradient. `opengraph-image.jpg` is the
default share image for every page.

---

## 5. Copy and tone

- **Short Thai sentences**, plain verbs, the customer's words: "ล้างแอร์", "ใบเสนอราคา", "ค่าเดินทาง" — not system
  words ("ตะกร้า", "submit", "SKU").
- **Buttons say exactly what happens**: "จองล้างแอร์", "ใส่ใบเสนอราคา", "คัดลอกสรุป", "ส่งทาง LINE". The toast or
  result repeats the verb ("เพิ่มในใบเสนอราคาแล้ว", "คัดลอกสรุปแล้ว"). **No "→" or ">" at the end of buttons**, no
  "คลิกที่นี่", no exclamation marks.
- **Prices**: "เริ่ม ฿700 / เครื่อง · ก่อน VAT" — every price says ก่อน VAT (Price does it). Estimates say
  "ราคาประมาณการ · ทีมยืนยันในใบเสนอราคา"; simulations say "แบบจำลองเพื่ออธิบาย" (`NOTES` in
  `@/lib/domain/constants`).
- **Honest states**: never "ส่งแล้ว" unless the endpoint answered 2xx; never "ว่าง" for a queue slot without a live
  queue; out of hours = "มีค่าใช้จ่ายเพิ่มเติม" (no number). Banned phrases: ARCHITECTURE §6.11.
- **Errors** say what happened and how to fix it, in the interface's voice: "กรอกเบอร์ 9–10 หลัก เช่น 0812345678",
  not "ข้อมูลไม่ถูกต้อง". **Empty states** invite the next step: "ยังไม่มีรายการ เลือกบริการเพื่อเริ่มใบเสนอราคา".
- **Eyebrows** name the topic in 1–3 words ("ล้างแอร์", "สำหรับองค์กร"); skip them when the title already says it.
  No all-caps, no numbering (01/02/03) unless the content is a real sequence (booking steps, crew steps).
- Brand and model names stay as written (FUJIVA, Daikin, Inverter, BTU). Numbers use Western digits with commas.

---

## 6. Do / Don't

| Do | Don't |
|---|---|
| One orange `primary` button per view; others `secondary`/`ghost`/`soft` | Two orange buttons side by side, or orange for decoration |
| `bg-surface text-ink border-line` tokens | `bg-white text-gray-700 border-[#ddd]`, raw hex, Tailwind palette colours |
| `<Price amount={fromDomain} />` | `฿700` typed into JSX, a price without "ก่อน VAT" |
| PageHeader → Sections → CtaBand; one h1; h2 per section | Several h1s, skipped levels, a page made of 12 identical cards |
| `grid grid-cols-1 … md:grid-cols-3`; wide tables in `Table` | Fixed widths, `w-[900px]`, anything that scrolls the page sideways |
| `IconButton label="ปิด"`; decorative icons beside text | Icon-only buttons without a name; emoji as icons |
| Air lines once at the top / in navy panels | Air lines, gradients and glows on every section |
| Motion that answers an action (press, open, add) | Fade-up on scroll for each section, looping animations |
| `Notice` for conditions in context | Fine print hidden in tooltips |
| `Sheet` for filters/cart/menu | Custom modals without focus handling, `alert()` |
| Wrap to change display: `<div className="hidden md:block"><Chip/></div>` | `className="hidden"` on a component that sets its own `inline-flex` |
| Real brand files via `asset('/brand/…')` | Redrawn logos, other brands' logos, LINE/Facebook logos |

## 7. Checklist before you hand over a page

1. `npx tsc --noEmit -p .` and `npx eslint <your files>` are clean.
2. Screenshots at 1366×900 and 390×844 (`node scripts/shot.mjs …`), light **and** dark (set
   `document.documentElement.dataset.theme = 'dark'`): `overflowPx` 0, no console errors, nothing hidden behind the
   header or MobileBar.
3. Keyboard only: Tab reaches everything in visual order, focus ring always visible, Esc closes sheets, arrow keys
   work in SegmentedControl/Tabs.
4. One h1, no skipped headings, every input labelled, changing totals in an `aria-live` region.
5. Every price from the domain layer, says ก่อน VAT; honest-UX labels where needed; no banned phrases.
