// /status/ — check a request's status with its reference number and the last 4 digits of the phone number.
import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StatusChecker } from '@/components/status/StatusChecker';
import { Card, PageHeader, Section, Skeleton } from '@/components/ui';
import { STATUS_STEPS } from '@/lib/domain/content';

export const metadata: Metadata = {
  title: 'ตรวจสถานะคำขอ · เลขอ้างอิง SBP',
  description: 'ตรวจสถานะคำขอจอง ใบเสนอราคา หรือข้อความที่ส่งถึงทีม ด้วยเลขอ้างอิง SBP และเบอร์โทร 4 ตัวท้าย',
  alternates: { canonical: './' },
};

function FormFallback() {
  return (
    <Card padding="lg" aria-hidden className="flex flex-col gap-6">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-40" />
    </Card>
  );
}

export default function StatusPage() {
  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ตรวจสถานะคำขอ' }]}
        title="ตรวจสถานะคำขอ"
        lead="ใช้เลขอ้างอิงที่ได้หลังส่งคำขอ กับเบอร์โทร 4 ตัวท้ายที่ให้ไว้ ระบบแสดงเฉพาะสถานะ ไม่แสดงข้อมูลส่วนตัว"
      />
      <Section id="check" title="ข้อมูลคำขอของคุณ">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:items-start lg:gap-10">
          <Suspense fallback={<FormFallback />}>
            <StatusChecker />
          </Suspense>
          <Card padding="md" tone="soft" className="flex flex-col gap-3">
            <h3 className="text-h3">สถานะที่จะเห็น</h3>
            <dl className="grid gap-2 text-small">
              {STATUS_STEPS.map(s => (
                <div key={s.th}>
                  <dt className="font-semibold text-ink">{s.th}</dt>
                  <dd className="text-ink-2">{s.d}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </Section>
    </>
  );
}
