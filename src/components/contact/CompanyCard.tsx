// Company facts for the contact page — every value comes from COMPANY (the single source for header, footer and schema.org).
// A <dl> whose rows hold only <dt> + <dd> (valid markup); the icon sits inside the <dt>, placed in the row's left gutter.
// Links wrap anywhere so a long e-mail or URL never pushes a 320px screen sideways.
import Image from 'next/image';
import type { ReactNode } from 'react';
import { Button, Card, Icon, type IconName } from '@/components/ui';
import { asset } from '@/lib/site';
import { COMPANY } from '@/lib/domain/company';
import { OpenNow } from '@/components/shared/OpenNow';

const link = 'inline-flex min-h-11 min-w-0 items-center gap-1 font-semibold text-brand underline-offset-4 [overflow-wrap:anywhere] hover:underline';

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={link}>
      {children}
      <Icon name="external" size={14} className="shrink-0" />
      <span className="sr-only">(เปิดหน้าต่างใหม่)</span>
    </a>
  );
}

type Row = { icon: IconName; label: string; body: ReactNode };

export function CompanyCard() {
  const rows: Row[] = [
    {
      icon: 'pin',
      label: 'ที่อยู่สำนักงานใหญ่',
      body: (
        <>
          <address className="not-italic text-ink">{COMPANY.addr}</address>
          <Button href={COMPANY.mapUrl} variant="soft" size="sm" icon="pin" className="mt-3">
            เปิดแผนที่
          </Button>
        </>
      ),
    },
    {
      icon: 'phone',
      label: 'โทรศัพท์',
      body: (
        <a href={COMPANY.telHref} className={`${link} num text-h3`}>
          {COMPANY.tel}
        </a>
      ),
    },
    {
      icon: 'chat',
      label: 'LINE Official',
      body: <ExtLink href={COMPANY.lineUrl}>{COMPANY.line}</ExtLink>,
    },
    {
      icon: 'mail',
      label: 'อีเมล',
      body: (
        <a href={`mailto:${COMPANY.email}`} className={link}>
          {COMPANY.email}
        </a>
      ),
    },
    {
      icon: 'users',
      label: 'Facebook',
      body: <ExtLink href={COMPANY.fbUrl}>เพจ {COMPANY.th}</ExtLink>,
    },
    {
      icon: 'globe',
      label: 'เว็บไซต์',
      body: <ExtLink href={COMPANY.webUrl}>{COMPANY.web}</ExtLink>,
    },
    {
      icon: 'clock',
      label: 'เวลาทำการ',
      body: (
        <div className="flex flex-col items-start gap-2">
          <span className="text-ink">{COMPANY.hours}</span>
          <OpenNow />
          <span className="text-small text-ink-2">{COMPANY.hoursNote}</span>
        </div>
      ),
    },
    {
      icon: 'document',
      label: 'เลขประจำตัวผู้เสียภาษี',
      body: <span className="num text-ink">{COMPANY.taxId}</span>,
    },
  ];

  return (
    <Card as="section" padding="lg" className="flex flex-col gap-7" aria-labelledby="company-name">
      <div className="flex items-center gap-4">
        <Image src={asset('/brand/sbp.png')} alt="" width={200} height={146} unoptimized className="h-14 w-auto shrink-0" />
        <div className="min-w-0">
          <h3 id="company-name" className="text-h3">
            {COMPANY.th}
          </h3>
          <p className="text-small text-ink-2">{COMPANY.en}</p>
          <p className="text-meta text-ink-3">{COMPANY.brand}</p>
        </div>
      </div>
      <dl className="flex flex-col gap-5">
        {rows.map(r => (
          <div key={r.label} className="relative min-h-10 pl-14">
            <dt className="text-meta text-ink-3">
              <span aria-hidden className="absolute left-0 top-0 grid size-10 place-items-center rounded-full bg-sky-soft text-brand">
                <Icon name={r.icon} size={20} />
              </span>
              {r.label}
            </dt>
            <dd className="m-0 min-w-0 text-body">{r.body}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
