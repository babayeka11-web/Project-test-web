'use client';
// Route error boundary: when a part of a page throws while rendering in the browser, the page area shows this card
// instead of Next's blank "Application error". The header, footer and MobileBar (root layout) stay in place, so the
// visitor can still call, open LINE or go elsewhere. global-error.tsx reuses it when the root layout itself fails.
import { useEffect } from 'react';
import { COMPANY } from '@/lib/domain/company';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Container } from '@/components/ui/Container';

export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container className="py-section">
      <Card padding="lg" className="mx-auto flex max-w-[40rem] flex-col gap-5">
        <h1 className="text-h2">ส่วนหนึ่งของหน้านี้โหลดไม่สำเร็จ</h1>
        <p className="text-ink-2">
          อาจเป็นเพราะสัญญาณอินเทอร์เน็ตขาดช่วง ลองโหลดหน้าใหม่อีกครั้ง ถ้ายังเปิดไม่ได้ โทรหรือทัก LINE คุยกับทีมได้เลย
        </p>
        <div data-page-cta className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              reset();
              window.location.reload();
            }}
          >
            โหลดหน้าใหม่
          </Button>
          <Button href={COMPANY.telHref} variant="secondary" icon="phone">
            โทร {COMPANY.tel}
          </Button>
          <Button href={COMPANY.lineUrl} variant="ghost" icon="chat">
            LINE {COMPANY.line}
          </Button>
        </div>
        <p className="text-meta text-ink-3">{COMPANY.hours}</p>
      </Card>
    </Container>
  );
}
