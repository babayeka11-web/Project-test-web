'use client';
// TEMPORARY home page — a live showcase of the "Cool Air" design system (docs/dev/UI.md) used for visual checks.
// The home owner replaces this file with the real home page. Figures marked "ตัวอย่าง" are display samples only.
import { useState } from 'react';
import { COMPANY } from '@/lib/domain/company';
import { MIN_BILL, NOTES } from '@/lib/domain/constants';
import {
  Accordion,
  AirLines,
  Badge,
  Breadcrumbs,
  Button,
  Card,
  Checkbox,
  Chip,
  Container,
  CtaBand,
  Field,
  Fieldset,
  Icon,
  IconButton,
  Input,
  Notice,
  Price,
  Radio,
  Section,
  SegmentedControl,
  Select,
  Sheet,
  Skeleton,
  SkeletonText,
  Stat,
  StatGroup,
  Stepper,
  Table,
  Tabs,
  Textarea,
  toast,
  type IconName,
} from '@/components/ui';

// Display samples for the showcase only — real pages read rates from src/lib/domain/*.
const SAMPLE_RATE = { C1: 700, C2: 1500 } as const;

const SWATCHES: Array<{ token: string; cls: string; light: string; dark: string; ink?: boolean }> = [
  { token: 'bg', cls: 'bg-bg', light: '#F5F9FC', dark: '#0A1220' },
  { token: 'surface', cls: 'bg-surface', light: '#FFFFFF', dark: '#111B2B' },
  { token: 'surface-2', cls: 'bg-surface-2', light: '#EDF4FA', dark: '#16233A' },
  { token: 'sky-soft', cls: 'bg-sky-soft', light: '#E3F1FB', dark: '#13304A' },
  { token: 'ink', cls: 'bg-ink', light: '#0B1B2E', dark: '#E8EEF6', ink: true },
  { token: 'ink-2', cls: 'bg-ink-2', light: '#46566B', dark: '#AEBBCC', ink: true },
  { token: 'brand', cls: 'bg-brand', light: '#003C99', dark: '#8DB8F5', ink: true },
  { token: 'sky', cls: 'bg-sky', light: '#0B74B5', dark: '#5BB5EC', ink: true },
  { token: 'cta', cls: 'bg-cta', light: '#C93A0A', dark: '#F08A4B', ink: true },
  { token: 'ok', cls: 'bg-ok', light: '#1B7A45', dark: '#4ED39A', ink: true },
  { token: 'warn', cls: 'bg-warn', light: '#B4560D', dark: '#FFB35C', ink: true },
  { token: 'bad', cls: 'bg-bad', light: '#B02A26', dark: '#FF7B72', ink: true },
];

const SERVICES: Array<{ icon: IconName; title: string; text: string; href: string; amount: number | null; fallback?: string }> = [
  {
    icon: 'clean',
    title: 'ล้างแอร์',
    text: 'ล้างปกติหรือล้างใหญ่ เลือกแพ็กเกจ แล้วเห็นราคารวมทันที',
    href: '/cleaning/',
    amount: SAMPLE_RATE.C1,
  },
  {
    icon: 'install',
    title: 'ติดตั้งแอร์',
    text: 'มาตรฐานหรือพรีเมียม รวมท่อ 4 เมตรแรก รับประกันงานติดตั้ง',
    href: '/installation/',
    amount: null,
    fallback: 'ราคาตามขนาด BTU',
  },
  {
    icon: 'repair',
    title: 'ซ่อมแอร์',
    text: 'เช็กอาการเบื้องต้น ดูค่าตรวจและค่าซ่อมมาตรฐานก่อนเรียกช่าง',
    href: '/repair/',
    amount: null,
    fallback: 'ดูค่าตรวจและค่าซ่อม',
  },
];

function Demo({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <Card className={className ?? 'self-start'}>
      <h3 className="mb-5 text-h3">{title}</h3>
      {children}
    </Card>
  );
}

export default function Home() {
  const [level, setLevel] = useState<'C1' | 'C2'>('C1');
  const [units, setUnits] = useState(3);
  const [tab, setTab] = useState('wall');
  const [band, setBand] = useState('12k');
  const [chips, setChips] = useState<string[]>(['wall']);
  const [sheet, setSheet] = useState(false);
  const [sending, setSending] = useState(false);
  const total = SAMPLE_RATE[level] * units;

  const toggleChip = (id: string) => setChips((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id]));

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <section aria-labelledby="hero-title" className="relative isolate -mt-header overflow-hidden bg-air pt-header">
        <AirLines
          animate
          className="absolute -right-40 -top-4 -z-10 h-56 w-[40rem] max-w-none text-sky opacity-45 md:top-10 md:h-[26rem] md:w-[56rem] lg:-right-10 lg:top-4 lg:h-[34rem] lg:w-[72rem]"
        />
        <Container className="grid gap-12 pb-16 pt-10 md:pb-24 md:pt-16 lg:grid-cols-[minmax(0,1fr)_25rem] lg:items-center lg:gap-16">
          <div className="flex flex-col gap-6">
            <Badge tone="sky" icon="sparkle" className="w-fit">
              ตัวอย่างระบบดีไซน์ · หน้าแรกจริงกำลังจัดทำ
            </Badge>
            <h1 id="hero-title" className="text-display">
              ล้างแอร์โดยทีมช่าง
              <br className="hidden sm:block" />
              ของบริษัท
            </h1>
            <Price amount={SAMPLE_RATE.C1} prefix="เริ่ม" unit="/ เครื่อง" size="xl" tone="brand" />
            <p className="max-w-[36rem] text-lead text-ink-2">
              บ้าน คอนโด ร้านค้า และองค์กรในกรุงเทพฯ และปริมณฑล เลือกแอร์ วิธีล้าง และพื้นที่ แล้วเห็นราคาก่อน VAT ทันที
            </p>
            <div className="flex flex-wrap gap-3">
              <Button href="/cleaning/#book" size="lg" icon="clean">
                จองล้างแอร์
              </Button>
              <Button href="/prices/" size="lg" variant="ghost">
                ดูค่าบริการทั้งหมด
              </Button>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-small text-ink-2">
              {['ใบกำกับภาษีเต็มรูป', 'รายงานรายเครื่อง', 'ทีมช่างของบริษัท'].map((t) => (
                <li key={t} className="inline-flex items-center gap-2">
                  <Icon name="check" size={18} strokeWidth={2.25} className="text-ok" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <Card padding="lg" className="shadow-pop">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-h3">ประมาณราคาล้างแอร์</h2>
              <Badge tone="warn">ตัวอย่าง</Badge>
            </div>
            <div className="grid gap-5">
              <div className="grid gap-2">
                <span id="lvl-label" className="text-small font-semibold">
                  วิธีล้าง
                </span>
                <SegmentedControl
                  labelledBy="lvl-label"
                  fullWidth
                  value={level}
                  onChange={setLevel}
                  options={[
                    { value: 'C1', label: 'ล้างปกติ', hint: 'C1' },
                    { value: 'C2', label: 'ล้างใหญ่', hint: 'C2' },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-small font-semibold">แอร์ติดผนัง</span>
                <Stepper label="จำนวนเครื่อง" value={units} onChange={setUnits} min={1} max={99} unit="เครื่อง" size="sm" />
              </div>
              <hr className="air-rule" />
              <div className="flex items-end justify-between gap-4" aria-live="polite">
                <span className="text-small text-ink-2">รวมโดยประมาณ</span>
                <Price amount={total} size="lg" stacked className="items-end text-right" />
              </div>
              <p className="text-meta text-ink-3">
                {NOTES.estimate} · ขั้นต่ำงานล้าง ฿{MIN_BILL.toLocaleString('en-US')} ต่อการเข้างาน
              </p>
              <Button fullWidth icon="calendar" onClick={() => toast('นี่คือหน้าตัวอย่าง ฟอร์มจองจริงอยู่ที่หน้าล้างแอร์', { action: { label: 'ไปหน้าล้างแอร์', href: '/cleaning/' } })}>
                เลือกวันเข้างาน
              </Button>
            </div>
          </Card>
        </Container>
      </section>

      {/* ── Services ─────────────────────────────────────────────────────────── */}
      <Section
        id="services"
        eyebrow="บริการ"
        title="งานแอร์ครบในบริษัทเดียว"
        lead="การ์ดบริการ: ไอคอน หัวข้อ ประโยคสั้น ราคาเริ่มต้น และลิงก์ไปหน้าบริการ ทั้งใบกดได้"
        actions={
          <Button href="/prices/" variant="soft" icon="tag">
            ค่าบริการทั้งหมด
          </Button>
        }
      >
        <ul className="grid gap-5 md:grid-cols-3">
          {SERVICES.map((s) => (
            <li key={s.href}>
              <Card href={s.href} className="flex h-full flex-col gap-4">
                <span className="grid size-14 place-items-center rounded-2xl bg-sky-soft text-brand">
                  <Icon name={s.icon} size={28} />
                </span>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-h3">{s.title}</h3>
                  <p className="text-small text-ink-2">{s.text}</p>
                </div>
                <div className="mt-auto flex items-end justify-between gap-3 pt-2">
                  <Price amount={s.amount} prefix="เริ่ม" unit="/ เครื่อง" size="md" fallback={s.fallback} />
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-2 text-brand">
                    <Icon name="arrow-right" size={20} />
                  </span>
                </div>
              </Card>
            </li>
          ))}
        </ul>
        <StatGroup className="mt-14 border-t border-line pt-10">
          <Stat value={`${COMPANY.years.match(/\d+/)?.[0] ?? ''}+`} label="ปีที่ดูแลงานแอร์" hint={COMPANY.years} />
          <Stat value="705" label="รุ่นแอร์พร้อมราคา" hint="Pricebook 2569" />
          <Stat value="6 วัน" label="เปิดทำการจันทร์–เสาร์" hint="08:30–17:30 น." />
          <Stat value={`฿${MIN_BILL.toLocaleString('en-US')}`} label="ขั้นต่ำงานล้างต่อการเข้างาน" hint="ก่อน VAT" />
        </StatGroup>
      </Section>

      {/* ── Tokens and type ──────────────────────────────────────────────────── */}
      <Section
        id="tokens"
        tone="soft"
        eyebrow="ระบบดีไซน์"
        title="สีและตัวอักษร"
        lead="สีน้ำเงิน FUJIVA และฟ้าเย็นเป็นหลัก ส้มแดง SP ใช้กับปุ่มหลักเท่านั้น ทุกสีสลับโหมดมืดอัตโนมัติ"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {SWATCHES.map((s) => (
              <li key={s.token} className="overflow-hidden rounded-control border border-line bg-surface">
                <div className={`h-16 ${s.cls} ${s.ink ? '' : 'border-b border-line'}`} />
                <div className="px-3 py-2.5">
                  <p className="font-mono text-meta font-medium text-ink">{s.token}</p>
                  <p className="font-mono text-[0.75rem] leading-snug text-ink-3">
                    {s.light}
                    <br />
                    {s.dark}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <Card className="flex flex-col gap-5">
            <p className="text-meta font-semibold text-ink-3">Anuphan · IBM Plex Sans Thai · IBM Plex Mono</p>
            <p className="font-display text-h1 font-bold">ลมเย็น สะอาดตา</p>
            <p className="font-display text-h2 font-semibold">หัวข้อส่วน (h2)</p>
            <p className="font-display text-h3 font-semibold">หัวข้อการ์ด (h3)</p>
            <p className="text-lead text-ink-2">ข้อความนำ อ่านง่าย ประโยคสั้น บอกสิ่งที่ลูกค้าได้</p>
            <p>
              เนื้อหา 16px บรรทัด 1.7 ภาษาไทยไม่บีบตัวอักษร ตัวเลขเรียงตรงหลัก{' '}
              <span className="tabular-nums font-semibold">฿1,234,500</span>
            </p>
            <p className="text-meta text-ink-3">ข้อความกำกับ 13px · ก่อน VAT · อัปเดตตาม Pricebook 2569</p>
            <p className="font-mono text-small text-ink-2">REF SBP-2569-0042 · 12,000 BTU</p>
          </Card>
        </div>
      </Section>

      {/* ── Buttons, badges, chips ───────────────────────────────────────────── */}
      <Section id="actions" eyebrow="การกระทำ" title="ปุ่ม ป้าย และตัวเลือก">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Demo title="ปุ่ม">
            <div className="flex flex-wrap items-center gap-3">
              <Button icon="clean">จองล้างแอร์</Button>
              <Button variant="secondary" icon="quote">
                ขอใบเสนอราคา
              </Button>
              <Button variant="ghost">ดูรายละเอียด</Button>
              <Button variant="soft" icon="chat">
                คุยทาง LINE
              </Button>
              <Button variant="quiet" icon="copy">
                คัดลอกสรุป
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Button size="sm">เล็ก</Button>
              <Button size="md">กลาง</Button>
              <Button size="lg">ใหญ่</Button>
              <Button
                variant="secondary"
                loading={sending}
                onClick={() => {
                  setSending(true);
                  window.setTimeout(() => setSending(false), 1600);
                }}
              >
                {sending ? 'กำลังส่ง…' : 'ลองสถานะกำลังส่ง'}
              </Button>
              <Button variant="ghost" disabled>
                ปิดใช้งาน
              </Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <IconButton icon="search" label="ค้นหา" variant="ghost" />
              <IconButton icon="quote" label="ใบเสนอราคา" variant="soft" badge={3} />
              <IconButton icon="phone" label="โทรหาทีมงาน" variant="secondary" />
              <IconButton icon="close" label="ปิด" />
            </div>
          </Demo>
          <Demo title="ป้ายและชิป">
            <div className="flex flex-wrap gap-2">
              <Badge>ก่อน VAT</Badge>
              <Badge tone="sky" icon="snowflake">
                ล้างปกติ C1
              </Badge>
              <Badge tone="brand">แนะนำ</Badge>
              <Badge tone="ok" dot>
                พร้อมส่ง
              </Badge>
              <Badge tone="warn" dot>
                คิวด่วน
              </Badge>
              <Badge tone="bad" dot>
                ไม่อยู่ในพื้นที่
              </Badge>
              <Badge tone="cta">สอบถามทีมขาย</Badge>
              <Badge tone="outline" icon="info">
                {NOTES.simulation}
              </Badge>
            </div>
            <p id="chip-label" className="mb-3 mt-6 text-small font-semibold">
              ประเภทแอร์
            </p>
            <div role="group" aria-labelledby="chip-label" className="flex flex-wrap gap-2">
              {[
                { id: 'wall', th: 'ติดผนัง', n: 351 },
                { id: 'ceiling', th: 'แขวนใต้ฝ้า', n: 178 },
                { id: 'cassette', th: 'สี่ทิศทาง', n: 153 },
                { id: 'floor', th: 'ตู้ตั้งพื้น', n: 23 },
              ].map((c) => (
                <Chip key={c.id} selected={chips.includes(c.id)} count={c.n} onClick={() => toggleChip(c.id)}>
                  {c.th}
                </Chip>
              ))}
            </div>
          </Demo>
        </div>
      </Section>

      {/* ── Controls and forms ───────────────────────────────────────────────── */}
      <Section
        id="controls"
        tone="soft"
        eyebrow="ฟอร์ม"
        title="ตัวควบคุมและช่องกรอก"
        lead="ทุกช่องมีป้ายชื่อ คำแนะนำ และข้อความผิดพลาดที่บอกวิธีแก้ ใช้คีย์บอร์ดได้ครบ เป้ากดสูงอย่างน้อย 44px"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          <Demo title="แท็บ ตัวเลือก และจำนวน">
            <Tabs
              label="ประเภทแอร์"
              value={tab}
              onChange={setTab}
              items={[
                {
                  id: 'wall',
                  label: 'ติดผนัง',
                  icon: 'ac',
                  content: <p className="text-ink-2">แอร์ที่บ้านและคอนโดส่วนใหญ่ ขนาด 9,000–30,000 BTU</p>,
                },
                {
                  id: 'ceiling',
                  label: 'แขวนใต้ฝ้า',
                  content: <p className="text-ink-2">ร้านค้า สำนักงาน ห้องประชุม ลมแรงและกระจายไกล</p>,
                },
                {
                  id: 'cassette',
                  label: 'สี่ทิศทาง',
                  content: <p className="text-ink-2">ฝังฝ้า กระจายลมสี่ทิศ เหมาะกับพื้นที่เปิดโล่ง</p>,
                },
              ]}
            />
            <div className="mt-8 grid gap-6">
              <div className="grid gap-2">
                <span id="size-label" className="text-small font-semibold">
                  ขนาด
                </span>
                <SegmentedControl
                  labelledBy="size-label"
                  size="sm"
                  fullWidth
                  value={band}
                  onChange={setBand}
                  options={[
                    { value: '9k', label: '≤ 12k' },
                    { value: '12k', label: '13–18k' },
                    { value: '24k', label: '19–24k' },
                    { value: '30k', label: '25k+' },
                  ]}
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Stepper label="จำนวนเครื่อง" value={units} onChange={setUnits} min={1} unit="เครื่อง" />
                <span className="text-small text-ink-3">ใช้ปุ่ม − + หรือพิมพ์ตัวเลข</span>
              </div>
            </div>
          </Demo>

          <Demo title="ข้อมูลติดต่อ">
            <form className="grid gap-5" onSubmit={(e) => e.preventDefault()} noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="ชื่อผู้ติดต่อ" required>
                  <Input name="name" autoComplete="name" placeholder="เช่น คุณสมชาย" />
                </Field>
                <Field label="เบอร์โทร" required error="กรอกเบอร์ 9–10 หลัก เช่น 0812345678">
                  <Input name="tel" type="tel" inputMode="tel" autoComplete="tel" icon="phone" defaultValue="0812" />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="ประเภทสถานที่" hint="ช่วยให้ทีมเตรียมอุปกรณ์ถูก">
                  <Select name="place" placeholder="เลือกประเภท" defaultValue="">
                    <option value="home">บ้าน</option>
                    <option value="condo">คอนโด</option>
                    <option value="shop">ร้านค้า</option>
                    <option value="office">สำนักงาน</option>
                  </Select>
                </Field>
                <Field label="พื้นที่ห้อง" optional>
                  <Input name="area" inputMode="decimal" suffix="ตร.ม." />
                </Field>
              </div>
              <Fieldset legend="วิธีล้าง" required>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Radio
                    name="method"
                    value="C1"
                    defaultChecked
                    variant="card"
                    label="ล้างปกติ (C1)"
                    description="ฉีดล้างคอยล์และแผงกรอง"
                  />
                  <Radio name="method" value="C2" variant="card" label="ล้างใหญ่ (C2)" description="ถอดชิ้นส่วนล้างละเอียด" />
                </div>
              </Fieldset>
              <Field label="รายละเอียดเพิ่มเติม" optional>
                <Textarea name="note" placeholder="อาการ ชั้นที่ติดตั้ง ที่จอดรถ" />
              </Field>
              <Checkbox
                name="consent"
                label="ยินยอมให้ติดต่อกลับ"
                description="ข้อมูลที่กรอกใช้เพื่อติดต่อกลับเรื่องคำขอนี้เท่านั้น"
              />
              <div className="flex flex-wrap gap-3">
                <Button type="submit" icon="send" onClick={() => toast('หน้านี้เป็นตัวอย่าง ยังไม่ส่งข้อมูล', { tone: 'warn' })}>
                  ส่งคำขอ
                </Button>
                <Button variant="ghost" icon="chat" href={COMPANY.lineUrl}>
                  ส่งทาง LINE
                </Button>
              </div>
            </form>
          </Demo>
        </div>
      </Section>

      {/* ── Feedback ─────────────────────────────────────────────────────────── */}
      <Section id="feedback" eyebrow="สถานะ" title="ข้อความแจ้ง การโหลด และหน้าต่าง">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="grid content-start gap-3">
            <Notice title="ราคาประมาณการ">{NOTES.estimate}</Notice>
            <Notice tone="ok" title="คัดลอกสรุปแล้ว">วางในแชท LINE หรืออีเมลถึงทีมได้ทันที</Notice>
            <Notice tone="warn" title="คิวด่วน" action={<Button size="sm" variant="ghost" href="/contact/">สอบถามคิว</Button>}>
              จองภายใน 3 วันมีค่าคิวด่วน เมื่อมีทีมว่าง ทีมยืนยันก่อนเข้างาน
            </Notice>
            <Notice tone="bad" title="ส่งคำขอไม่สำเร็จ" size="sm">
              ส่งผ่านเว็บไม่ได้ในตอนนี้ คัดลอกสรุปแล้วส่งทาง LINE หรือโทรหาทีมแทน
            </Notice>
          </div>
          <Demo title="การแจ้งเตือนชั่วคราว และหน้าต่าง">
            <div className="flex flex-wrap gap-3">
              <Button
                variant="secondary"
                icon="plus"
                onClick={() =>
                  toast('เพิ่มในใบเสนอราคาแล้ว', { tone: 'ok', action: { label: 'ดูใบเสนอราคา', href: '/quote/' } })
                }
              >
                ใส่ใบเสนอราคา
              </Button>
              <Button variant="ghost" icon="sliders" onClick={() => setSheet(true)}>
                เปิดตัวกรอง
              </Button>
            </div>
            <p className="mt-6 mb-3 text-small font-semibold text-ink-2">ระหว่างโหลดข้อมูล</p>
            <div className="flex items-start gap-4 rounded-control border border-line p-4">
              <Skeleton shape="circle" className="size-12" />
              <div className="flex-1">
                <Skeleton className="mb-3 h-5 w-2/5" />
                <SkeletonText lines={2} />
              </div>
            </div>
          </Demo>
        </div>
        <Sheet
          open={sheet}
          onClose={() => setSheet(false)}
          side="bottom"
          title="ตัวกรอง"
          description="ตัวอย่างหน้าต่างแบบเลื่อนขึ้นจากด้านล่าง"
          footer={
            <div className="flex gap-3">
              <Button variant="ghost" fullWidth onClick={() => setSheet(false)}>
                ล้างตัวกรอง
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setSheet(false)}>
                ดู 705 รุ่น
              </Button>
            </div>
          }
        >
          <Fieldset legend="ระบบ">
            <Checkbox name="inv" label="Inverter" defaultChecked />
            <Checkbox name="fix" label="Fixed speed" />
          </Fieldset>
        </Sheet>
      </Section>

      {/* ── Data ─────────────────────────────────────────────────────────────── */}
      <Section
        id="data"
        tone="soft"
        eyebrow="ข้อมูล"
        title="ตาราง เส้นทางหน้า และคำถาม"
        lead="ตารางกว้างเลื่อนในกรอบของตัวเอง หน้าเว็บไม่เลื่อนข้าง"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="grid content-start gap-6">
            <Breadcrumbs
              jsonLd={false}
              items={[{ label: 'หน้าแรก', href: '/' }, { label: 'ราคา', href: '/prices/' }, { label: 'ล้างแอร์ติดผนัง' }]}
            />
            <Table
              caption="ตัวอย่างตารางราคาล้างแอร์ติดผนัง"
              showCaption
              stickyFirstColumn
              footnote="ตัวเลขตัวอย่างสำหรับทดสอบการแสดงผล · ราคาจริงอยู่ที่หน้าค่าบริการ"
              columns={[
                { key: 'size', label: 'ขนาด', rowHeader: true },
                { key: 'c1', label: 'ล้างปกติ (C1)', align: 'end', numeric: true },
                { key: 'c2', label: 'ล้างใหญ่ (C2)', align: 'end', numeric: true },
                { key: 'time', label: 'เวลาโดยประมาณ', align: 'end' },
              ]}
              rows={[
                { id: 1, size: '≤ 12,000 BTU', c1: <Price amount={700} size="sm" vat={false} />, c2: <Price amount={1500} size="sm" vat={false} />, time: '45–60 นาที' },
                { id: 2, size: '13,000–18,000 BTU', c1: <Price amount={800} size="sm" vat={false} />, c2: <Price amount={1700} size="sm" vat={false} />, time: '60 นาที' },
                { id: 3, size: '19,000–24,000 BTU', c1: <Price amount={900} size="sm" vat={false} />, c2: <Price amount={1900} size="sm" vat={false} />, time: '60–75 นาที' },
                { id: 4, size: '25,000 BTU ขึ้นไป', c1: <Price amount={1000} size="sm" vat={false} />, c2: <Price amount={2200} size="sm" vat={false} />, time: '75–90 นาที' },
              ]}
            />
          </div>
          <Accordion
            name="faq-demo"
            items={[
              {
                title: 'ราคาบนเว็บรวม VAT หรือยัง',
                content: 'ทุกราคาบนเว็บเป็นราคาก่อน VAT ระบบคิด VAT 7% ครั้งเดียวที่ยอดรวมใบเสนอราคา',
                defaultOpen: true,
              },
              { title: 'จองล่วงหน้ากี่วัน', content: 'จองปกติล่วงหน้าอย่างน้อย 3 วัน เร็วกว่านั้นเป็นคิวด่วน เมื่อมีทีมว่าง ทีมยืนยันก่อนเข้างาน' },
              { title: 'นอกเวลาทำการได้ไหม', content: COMPANY.hoursNote },
              { title: 'ล้างกี่เครื่องถึงคุ้มค่าเดินทาง', content: `งานล้างถึง ฿${MIN_BILL.toLocaleString('en-US')} ก่อน VAT ต่อการเข้างาน ไม่มีค่าเดินทางในกรุงเทพฯ ระยะ 30 กม. จากสำนักงานใหญ่` },
            ]}
          />
        </div>
      </Section>

      {/* ── Brand panel ──────────────────────────────────────────────────────── */}
      <Section
        id="business"
        tone="brand"
        eyebrow="สำหรับองค์กร"
        title="สัญญาล้างรายปี ใส่จำนวนเครื่องแล้วเห็นงบทั้งปี"
        lead="ส่วนสีน้ำเงินเข้ม: ทุกชิ้นส่วนด้านในปรับสีให้อ่านง่ายเอง"
        actions={
          <Button href="/business/" variant="secondary" icon="building">
            ดูหน้าองค์กร
          </Button>
        }
      >
        <ul className="grid gap-4 sm:grid-cols-3">
          {[
            { icon: 'document' as IconName, t: 'ใบเสนอราคาและใบกำกับภาษีเต็มรูป' },
            { icon: 'calendar' as IconName, t: 'แผนล้างทั้งปีตามจำนวนเครื่อง' },
            { icon: 'shield' as IconName, t: 'รายงานผลรายเครื่องหลังเข้างาน' },
          ].map((x) => (
            <li key={x.t}>
              <Card className="flex h-full items-center gap-4" padding="sm">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-sky-soft text-sky">
                  <Icon name={x.icon} size={22} />
                </span>
                <span className="font-medium">{x.t}</span>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      <CtaBand
        id="cta"
        title="พร้อมให้ทีมช่างดูแลแอร์ของคุณ"
        lead="จองล้างแอร์ออนไลน์ได้ตลอดเวลา ทีมโทรยืนยันวันและราคาในเวลาทำการ"
        actions={
          <>
            <Button href="/cleaning/#book" size="lg" icon="clean">
              จองล้างแอร์
            </Button>
            <Button href={COMPANY.telHref} size="lg" variant="secondary" icon="phone">
              โทร {COMPANY.tel}
            </Button>
          </>
        }
        aside={
          <ul className="grid gap-3 text-small">
            <li className="flex items-center gap-2.5">
              <Icon name="clock" size={18} className="text-sky" />
              {COMPANY.hours}
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="chat" size={18} className="text-sky" />
              LINE {COMPANY.line}
            </li>
            <li className="flex items-center gap-2.5">
              <Icon name="pin" size={18} className="text-sky" />
              กรุงเทพฯ และปริมณฑล
            </li>
          </ul>
        }
      />
    </>
  );
}
