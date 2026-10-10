import type { Metadata } from 'next';
import { NAV } from '@/lib/site';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PageHeader } from '@/components/ui/PageHeader';
import { Section } from '@/components/ui/Section';
import { NAV_ICONS } from '@/components/layout/nav-icons';

export const metadata: Metadata = {
  title: 'ไม่พบหน้านี้',
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <>
      <PageHeader
        eyebrow="ไม่พบหน้า (404)"
        title="ไม่พบหน้าที่คุณกำลังหา"
        lead="ลิงก์อาจเปลี่ยนไป หรือหน้านี้ถูกย้ายแล้ว เลือกบริการที่ต้องการด้านล่าง หรือกลับไปเริ่มที่หน้าแรก"
        actions={
          <>
            <Button href="/" icon="home">
              กลับหน้าแรก
            </Button>
            <Button href="/contact/" variant="ghost" icon="phone">
              ติดต่อทีมงาน
            </Button>
          </>
        }
      />
      <Section spacing="compact" title="บริการที่ลูกค้าเปิดดูบ่อย" id="services">
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {NAV.map((item) => (
            <li key={item.href}>
              <Card href={item.href} padding="sm" className="flex h-full items-center gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-sky-soft text-brand">
                  <Icon name={NAV_ICONS[item.href] ?? 'arrow-right'} size={24} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="font-semibold text-ink">{item.th}</span>
                  {item.sub && <span className="text-small text-ink-3">{item.sub}</span>}
                </span>
                <Icon name="chevron-right" size={18} className="text-ink-3" />
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </>
  );
}
