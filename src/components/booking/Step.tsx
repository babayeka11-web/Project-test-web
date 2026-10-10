// One numbered step of the quick booking: a number disc, an h3 and the step's controls in a card.
import type { ReactNode } from 'react';
import { Card } from '@/components/ui';

export function Step({ id, n, title, hint, children }: { id: string; n: number; title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <Card as="section" padding="md" aria-labelledby={`${id}-title`}>
      <div className="mb-6 flex items-start gap-4">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-[1.125rem] font-semibold text-on-brand"
        >
          {n}
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 id={`${id}-title`} className="text-h3">
            <span className="sr-only">ขั้นที่ {n} </span>
            {title}
          </h3>
          {hint && <p className="mt-1 text-small text-ink-2">{hint}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}
