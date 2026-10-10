'use client';
// Guide cards with an audience filter. Receives only plain card data (no guide bodies), so the client bundle stays small.
// Server HTML shows every guide ("ทั้งหมด"); the filter only narrows the list in the browser.
import { useId, useState } from 'react';
import { Badge, Card, Chip, Icon, type IconName } from '@/components/ui';

export type GuideCard = {
  slug: string;
  th: string;
  lead: string;
  min: number;
  icon: IconName;
  aud: 'home' | 'biz' | 'all';
};

type Filter = 'all' | 'home' | 'biz';

const FILTERS: readonly { id: Filter; th: string }[] = [
  { id: 'all', th: 'ทั้งหมด' },
  { id: 'home', th: 'บ้าน · คอนโด' },
  { id: 'biz', th: 'องค์กร · อาคาร' },
];

const AUD_TH = { home: 'บ้าน · คอนโด', biz: 'องค์กร · อาคาร', all: 'ทุกคน' } as const;

const matches = (g: GuideCard, f: Filter) => f === 'all' || g.aud === 'all' || g.aud === f;

export function GuideBrowser({ guides }: { guides: GuideCard[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const labelId = useId();
  const shown = guides.filter(g => matches(g, filter));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <span id={labelId} className="text-small font-semibold text-ink">
          อ่านสำหรับ
        </span>
        <div role="group" aria-labelledby={labelId} className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <Chip key={f.id} selected={filter === f.id} count={guides.filter(g => matches(g, f.id)).length} onClick={() => setFilter(f.id)}>
              {f.th}
            </Chip>
          ))}
        </div>
        <p className="sr-only" role="status" aria-live="polite">
          แสดง {shown.length} เรื่อง
        </p>
      </div>

      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shown.map(g => (
          <li key={g.slug} className="flex">
            <Card href={`/knowledge/${g.slug}/`} className="flex w-full flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
                  <Icon name={g.icon} size={24} />
                </span>
                <Badge tone={g.aud === 'biz' ? 'brand' : g.aud === 'home' ? 'sky' : 'neutral'}>{AUD_TH[g.aud]}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-h3">{g.th}</h3>
                <p className="text-small text-ink-2">{g.lead}</p>
              </div>
              <p className="mt-auto flex items-center justify-between gap-3 pt-1 text-meta text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={14} />
                  อ่าน {g.min} นาที
                </span>
                <span className="inline-flex items-center gap-1 font-semibold text-brand">
                  อ่านเรื่องนี้
                  <Icon name="arrow-right" size={16} />
                </span>
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
