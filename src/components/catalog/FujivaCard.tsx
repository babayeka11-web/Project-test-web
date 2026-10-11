// FUJIVA is the company's own brand. It has no prices in the Pricebook yet, so it is a featured card that sends the
// customer to the sales team instead of a price card (ARCHITECTURE §6.13). Same compact build as the series cards
// (mark tile · brand row · title · one action) so the company's own brand reads at least as strongly as the rest.
import Image from 'next/image';
import { Badge, Button, Card } from '@/components/ui';
import { asset } from '@/lib/site';

export function FujivaCard({ className }: { className?: string }) {
  return (
    <Card tone="sky" padding="sm" className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <span className="grid h-11 w-24 shrink-0 place-items-center rounded-2xl bg-surface px-2.5 shadow-card sm:h-14 sm:w-32">
            <Image src={asset('/brand/fujiva.png')} alt="FUJIVA" width={288} height={92} unoptimized className="h-6 w-auto sm:h-8 dark:hidden" />
            <Image src={asset('/brand/fujiva-light.png')} alt="FUJIVA" width={288} height={92} unoptimized className="hidden h-6 w-auto sm:h-8 dark:block" />
          </span>
          <div className="flex min-w-0 flex-col gap-1">
            <h3 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-h3 leading-snug">
              FUJIVA
              <Badge tone="brand">แบรนด์ของบริษัท</Badge>
            </h3>
            <p className="text-small text-ink-2">สอบถามราคากับทีมขาย ยังไม่มีราคามาตรฐานในรายการนี้ ทีมช่วยเลือกขนาดและแจ้งราคาให้</p>
          </div>
        </div>
        <Button href="/contact/?topic=fujiva" variant="secondary" size="sm" icon="chat" className="shrink-0">
          สอบถามราคา FUJIVA
        </Button>
      </div>
    </Card>
  );
}
