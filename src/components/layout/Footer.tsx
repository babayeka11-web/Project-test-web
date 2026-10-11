// Site footer: who we are, every page, when and how to reach the team, the company's own FUJIVA brand.
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { COMPANY } from '@/lib/domain/company';
import { NAV, NAV_MORE, asset } from '@/lib/site';
import { AirLines } from '@/components/ui/AirLines';
import { Container } from '@/components/ui/Container';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ThemeSwitch } from './ThemeSwitch';

function FooterHeading({ children }: { children: ReactNode }) {
  return <h2 className="mb-4 font-sans text-small font-semibold text-ink">{children}</h2>;
}

function ContactLink({ href, icon, children, external }: { href: string; icon: IconName; children: ReactNode; external?: boolean }) {
  return (
    <li>
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : null)}
        className="group inline-flex min-h-11 items-center gap-3 rounded-control text-small text-ink-2 no-underline hover:text-brand"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-surface-2 text-brand transition-colors group-hover:bg-sky-soft">
          <Icon name={icon} size={18} />
        </span>
        <span className="min-w-0 break-words underline-offset-4 group-hover:underline">{children}</span>
        {external && <span className="sr-only"> (เปิดหน้าต่างใหม่)</span>}
      </a>
    </li>
  );
}

export function Footer() {
  const yearBE = new Date().getFullYear() + 543;
  return (
    <footer className="relative isolate overflow-hidden border-t border-line bg-surface">
      <AirLines lines={3} className="absolute -right-40 -top-24 -z-10 h-72 w-[52rem] max-w-none text-sky opacity-25" />
      <Container className="pb-8 pt-14 md:pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:gap-x-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,1.15fr)]">
          {/* Company */}
          <div className="col-span-2 flex flex-col gap-5 lg:col-span-1">
            <Link href="/" className="inline-flex w-fit items-center gap-3 rounded-control no-underline">
              <Image src={asset('/brand/sbp.png')} alt="" width={200} height={146} unoptimized className="h-10 w-auto" />
              <span className="flex flex-col leading-none">
                <span className="font-display text-[1.25rem] font-bold text-ink">{COMPANY.brand}</span>
                <span className="mt-1.5 text-meta text-ink-3">{COMPANY.th}</span>
              </span>
            </Link>
            <p className="max-w-[26rem] text-small text-ink-2">
              ล้าง ติดตั้ง ซ่อม และขายแอร์ในกรุงเทพฯ และปริมณฑล โดยทีมช่างของบริษัท ประสบการณ์{COMPANY.years}
            </p>
            <ul className="grid gap-0.5">
              <ContactLink href={COMPANY.telHref} icon="phone">
                โทร <span className="tabular-nums">{COMPANY.tel}</span>
              </ContactLink>
              <ContactLink href={COMPANY.lineUrl} icon="chat" external>
                LINE {COMPANY.line}
              </ContactLink>
              <ContactLink href={COMPANY.fbUrl} icon="users" external>
                Facebook ของบริษัท
              </ContactLink>
              <ContactLink href={`mailto:${COMPANY.email}`} icon="mail">
                {COMPANY.email}
              </ContactLink>
            </ul>
          </div>

          {/* Pages — #site-map is also where the MobileBar's "เมนู" jumps before the page's script has loaded */}
          <nav id="site-map" aria-label="บริการ" className="scroll-mt-header">
            <FooterHeading>บริการ</FooterHeading>
            <ul className="grid gap-0.5">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-small text-ink-2 underline-offset-4 hover:text-brand hover:underline"
                  >
                    {item.full ?? item.th}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label="ข้อมูลและช่วยเหลือ">
            <FooterHeading>ข้อมูลและช่วยเหลือ</FooterHeading>
            <ul className="grid gap-0.5">
              {NAV_MORE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center text-small text-ink-2 underline-offset-4 hover:text-brand hover:underline"
                  >
                    {item.full ?? item.th}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Hours, address, brand */}
          <div className="col-span-2 flex flex-col gap-6 lg:col-span-1">
            <div>
              <FooterHeading>เวลาทำการ</FooterHeading>
              <p className="flex items-start gap-2.5 text-small font-medium text-ink">
                <Icon name="clock" size={18} className="mt-0.5 text-sky" />
                {COMPANY.hours}
              </p>
              <p className="mt-2 text-meta text-ink-3">{COMPANY.hoursNote}</p>
            </div>
            <div>
              <FooterHeading>สำนักงานใหญ่</FooterHeading>
              <a
                href={COMPANY.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2.5 text-small text-ink-2 underline-offset-4 hover:text-brand hover:underline"
              >
                <Icon name="pin" size={18} className="mt-0.5 text-sky" />
                <span>
                  {COMPANY.addr}
                  <span className="sr-only"> (เปิดแผนที่ในหน้าต่างใหม่)</span>
                </span>
              </a>
            </div>
            <div className="flex items-center gap-4 rounded-card border border-line bg-bg/60 p-4">
              <Image
                src={asset('/brand/fujiva.png')}
                alt="FUJIVA"
                width={288}
                height={92}
                unoptimized
                className="h-7 w-auto dark:hidden"
              />
              <Image
                src={asset('/brand/fujiva-light.png')}
                alt="FUJIVA"
                width={288}
                height={92}
                unoptimized
                className="hidden h-7 w-auto dark:block"
              />
              <p className="text-meta leading-snug text-ink-3">
                แบรนด์แอร์ของบริษัท
                <br />
                สอบถามราคากับทีมขาย
              </p>
            </div>
          </div>
        </div>

        <hr className="air-rule mb-6 mt-12" />
        <div className="flex flex-col-reverse gap-5 md:flex-row md:items-center md:justify-between">
          <div className="text-meta text-ink-3">
            <p>
              © {yearBE} {COMPANY.th} · {COMPANY.en}
            </p>
            <p>
              เลขประจำตัวผู้เสียภาษี <span className="tabular-nums">{COMPANY.taxId}</span> · ราคาทุกรายการบนเว็บเป็นราคาก่อน VAT
            </p>
          </div>
          <ThemeSwitch className="self-start md:self-auto" />
        </div>
      </Container>
    </footer>
  );
}
