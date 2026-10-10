// Services: cleaning leads (wide card), then installation / repair / buying / relocation, and the annual contract as an
// emphasised band. Titles, subtitles and links come from getServices(); headline prices from serviceFrom().
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Button, Card, Icon, Price, Section, cn, type IconName } from '@/components/ui';
import { LEVEL_TH } from '@/lib/domain/cleaning';
import { VRF_NOTE, type ServiceCard, type ServiceId } from '@/lib/domain/content';

export type ServicesSectionProps = {
  services: ServiceCard[];
  from: { clean: number; install: number; repair: number };
  skuCount: number;
};

const ICON: Record<ServiceId, IconName> = {
  'clean-b2b': 'building',
  clean: 'clean',
  install: 'install',
  repair: 'repair',
  move: 'truck',
  project: 'building',
};

function IconDisc({ name, large }: { name: IconName; large?: boolean }) {
  return (
    <span className={cn('grid shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand', large ? 'size-16' : 'size-14')}>
      <Icon name={name} size={large ? 32 : 28} />
    </span>
  );
}

function GoLink({ children }: { children: ReactNode }) {
  return (
    <span className="mt-auto inline-flex items-center gap-1.5 pt-1 text-small font-semibold text-brand">
      {children}
      <Icon name="arrow-right" size={16} />
    </span>
  );
}

export function ServicesSection({ services, from, skuCount }: ServicesSectionProps) {
  const by = (id: ServiceId) => services.find((s) => s.id === id);
  const clean = by('clean');
  const install = by('install');
  const repair = by('repair');
  const move = by('move');
  const contract = by('clean-b2b');
  const project = by('project');

  return (
    <Section
      id="services"
      eyebrow="บริการ"
      title={
        <>
          เริ่มจากล้างแอร์ แล้วต่อด้วย<span className="whitespace-nowrap">ติดตั้ง</span> ซ่อม และเลือกซื้อเครื่อง
        </>
      }
      lead="ทุกบริการมีราคามาตรฐานก่อน VAT ให้ดูบนเว็บก่อนติดต่อ ไม่ต้องรอใบเสนอราคาเพื่อรู้ว่าราคาประมาณเท่าไร"
      actions={
        <Button href="/prices/" variant="ghost" iconEnd="arrow-right">
          ดูค่าบริการทั้งหมด
        </Button>
      }
    >
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {clean && (
          <li className="md:col-span-2">
            <Card href={clean.href} padding="lg" className="flex h-full flex-col gap-6 sm:flex-row sm:items-stretch sm:gap-8">
              <div className="flex min-w-0 flex-1 flex-col gap-4">
                <IconDisc name={ICON.clean} large />
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-h3">{clean.th}</h3>
                  <p className="text-small text-ink-2">{clean.sub}</p>
                </div>
                <Price amount={from.clean} prefix="เริ่ม" unit="/ เครื่อง" size="lg" tone="brand" />
                <GoLink>ดูราคาและจองล้างแอร์</GoLink>
              </div>
              <dl className="flex flex-col justify-center gap-4 rounded-2xl bg-surface-2 p-5 text-small sm:w-[17rem] sm:shrink-0">
                {(['C1', 'C2'] as const).map((lv) => (
                  <div key={lv} className="flex flex-col gap-1">
                    <dt className="font-semibold text-ink">
                      {LEVEL_TH[lv].th} <span className="font-normal text-ink-3">{lv}</span>
                    </dt>
                    <dd className="text-ink-2">{LEVEL_TH[lv].sub}</dd>
                  </div>
                ))}
              </dl>
            </Card>
          </li>
        )}
        {install && (
          <li>
            <Card href={install.href} padding="lg" className="flex h-full flex-col gap-4">
              <IconDisc name={ICON.install} />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-h3">{install.th}</h3>
                <p className="text-small text-ink-2">{install.sub}</p>
                <p className="text-small text-ink-2">{install.time}</p>
              </div>
              <Price amount={from.install} prefix="เริ่ม" unit="/ เครื่อง" size="md" tone="brand" />
              <GoLink>ดูแพ็กเกจติดตั้ง</GoLink>
            </Card>
          </li>
        )}
        {repair && (
          <li>
            <Card href={repair.href} padding="lg" className="flex h-full flex-col gap-4">
              <IconDisc name={ICON.repair} />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-h3">{repair.th}</h3>
                <p className="text-small text-ink-2">{repair.sub}</p>
                <p className="text-small text-ink-2">{repair.time}</p>
              </div>
              <Price amount={from.repair} prefix="ค่าตรวจเริ่ม" size="md" tone="brand" />
              <GoLink>เช็กอาการแอร์</GoLink>
            </Card>
          </li>
        )}
        <li>
          <Card href="/products/" padding="lg" className="flex h-full flex-col gap-4">
            <IconDisc name="ac" />
            <div className="flex flex-col gap-1.5">
              <h3 className="text-h3">ซื้อแอร์</h3>
              <p className="text-small text-ink-2">ดูรุ่น ราคา และแพ็กเกจติดตั้งในหน้าเดียว</p>
              <p className="text-small text-ink-2">เลือกใส่ใบเสนอราคาได้ทันที</p>
            </div>
            <p className="font-semibold text-brand">{skuCount.toLocaleString('en-US')} รุ่นพร้อมราคา</p>
            <GoLink>เลือกแอร์</GoLink>
          </Card>
        </li>
        {move && (
          <li>
            <Card href={move.href} padding="lg" className="flex h-full flex-col gap-4">
              <IconDisc name={ICON.move} />
              <div className="flex flex-col gap-1.5">
                <h3 className="text-h3">{move.th}</h3>
                <p className="text-small text-ink-2">{move.sub}</p>
                <p className="text-small text-ink-2">{move.time}</p>
              </div>
              <p className="font-semibold text-brand">{move.from}</p>
              <GoLink>ดูราคารื้อ ย้าย</GoLink>
            </Card>
          </li>
        )}
        {contract && (
          <li className="md:col-span-2 lg:col-span-3">
            <Card href={contract.href} tone="deep" padding="lg" className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
              <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
                <Icon name={ICON['clean-b2b']} size={32} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <p className="text-small font-semibold text-sky-on-deep">สำหรับองค์กร</p>
                <h3 className="text-h3">{contract.th}</h3>
                <p className="text-small text-ink-2">
                  {contract.sub} · {contract.time}
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:items-end">
                <p className="font-semibold">{contract.from}</p>
                <span className="inline-flex items-center gap-1.5 text-small font-semibold text-brand">
                  ดูสัญญาและคำนวณราคา
                  <Icon name="arrow-right" size={16} />
                </span>
              </div>
            </Card>
          </li>
        )}
      </ul>
      {project && (
        <p className="mt-8 flex items-start gap-2 text-small text-ink-2">
          <Icon name="info" size={16} className="mt-1 shrink-0 text-sky" />
          <span>
            {VRF_NOTE}{' '}
            <Link href={project.href} className="font-semibold text-brand underline-offset-4 hover:underline">
              ติดต่อทีมโครงการ
            </Link>
          </span>
        </p>
      )}
    </Section>
  );
}
