// FUJIVA is the company's own brand. It has no prices in the Pricebook yet, so it is a featured card that sends the
// customer to the sales team instead of a price card (ARCHITECTURE §6.13).
import Image from 'next/image';
import { Button, Card } from '@/components/ui';
import { asset } from '@/lib/site';

export function FujivaCard({ className }: { className?: string }) {
  return (
    <Card tone="sky" padding="md" className={className}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
          <div className="grid h-16 w-44 shrink-0 place-items-center rounded-control bg-surface px-4 shadow-card">
            <Image src={asset('/brand/fujiva.png')} alt="FUJIVA" width={288} height={92} unoptimized className="h-9 w-auto dark:hidden" />
            <Image src={asset('/brand/fujiva-light.png')} alt="FUJIVA" width={288} height={92} unoptimized className="hidden h-9 w-auto dark:block" />
          </div>
          <div className="min-w-0">
            <h3 className="text-h3">FUJIVA — แบรนด์ของบริษัท</h3>
            <p className="mt-1 text-small text-ink-2">สอบถามราคากับทีมขาย ยังไม่มีราคามาตรฐานในรายการนี้ ทีมช่วยเลือกขนาดและแจ้งราคาให้</p>
          </div>
        </div>
        <Button href="/contact/?topic=fujiva" variant="secondary" icon="chat" className="shrink-0">
          สอบถามราคา FUJIVA
        </Button>
      </div>
    </Card>
  );
}
