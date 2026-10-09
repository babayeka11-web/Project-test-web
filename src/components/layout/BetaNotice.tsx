// Slim honesty bar at the very top of every page (scrolls away; never dismissible).
import { Container } from '@/components/ui/Container';
import { Icon } from '@/components/ui/Icon';

function Dot() {
  return (
    <>
      <span aria-hidden className="pl-1.5 opacity-60">
        ·
      </span>
      <span className="sr-only">,</span>
    </>
  );
}

export function BetaNotice() {
  return (
    <aside aria-label="ประกาศเว็บไซต์ทดลอง" className="scheme-deep bg-deep text-ink-2">
      <Container className="flex min-h-9 items-center justify-center gap-2 py-1.5 text-center text-[0.75rem] leading-snug sm:text-meta">
        <Icon name="info" size={15} strokeWidth={2} className="hidden text-sky sm:block" />
        <p>
          <span className="inline-block whitespace-nowrap">
            <strong className="font-semibold text-ink">เว็บไซต์ทดลอง</strong>
            <Dot />
          </span>{' '}
          ราคามาตรฐานจาก <span className="whitespace-nowrap">Pricebook 2569</span>{' '}
          <span className="inline-block whitespace-nowrap">
            ก่อน VAT
            <Dot />
          </span>{' '}
          <span className="inline-block whitespace-nowrap">ฟอร์มยังไม่ส่งถึงทีมอัตโนมัติ</span>
        </p>
      </Container>
    </aside>
  );
}
