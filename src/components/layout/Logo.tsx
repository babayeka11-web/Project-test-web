import Image from 'next/image';
import Link from 'next/link';
import { asset } from '@/lib/site';
import { cn } from '@/components/ui/cn';

/** SP company mark + "SBP AirCare" wordmark, linking home (not prefetched: it is on every page and rarely the next step). */
export function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <Link
      href="/"
      prefetch={false}
      className={cn('group inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-control no-underline', className)}
    >
      <Image
        src={asset('/brand/sbp.png')}
        alt=""
        width={200}
        height={146}
        priority={priority}
        unoptimized
        className="h-8 w-auto sm:h-9"
      />
      <span className="flex flex-col leading-none max-[359px]:hidden">
        <span className="font-display text-[1.0625rem] font-bold text-ink sm:text-[1.1875rem]">SBP AirCare</span>
        <span className="mt-1 text-[0.75rem] font-medium text-ink-3">สหบูรพากรุ๊ป</span>
      </span>
      <span className="sr-only">หน้าแรก</span>
    </Link>
  );
}
