// "อ่านก่อนตัดสินใจ": two or three short guides linked from the page where that decision is made (RELATED_GUIDES), with
// the same card as /knowledge/ (a compact row on phones). Server component: only titles, leads and reading times reach the
// HTML.
import { Button, Card, Icon, Section, type SectionTone } from '@/components/ui';
import { guideBySlug, RELATED_GUIDES, type Guide } from './guides';

export function RelatedGuides({
  page,
  id = 'guides',
  tone = 'plain',
  spacing = 'default',
}: {
  /** A RELATED_GUIDES key: the route ('/cleaning/') or 'model'. */
  page: string;
  id?: string;
  tone?: SectionTone;
  spacing?: 'default' | 'compact';
}) {
  const guides = (RELATED_GUIDES[page] ?? []).map(guideBySlug).filter((g): g is Guide => g !== undefined);
  if (!guides.length) return null;
  return (
    <Section
      id={id}
      tone={tone}
      spacing={spacing}
      title="อ่านก่อนตัดสินใจ"
      lead="เรื่องสั้นที่ช่วยตัดสินใจในขั้นนี้ ตัวเลขในบทความใช้เงื่อนไขชุดเดียวกับเครื่องมือในเว็บนี้"
      actions={
        <Button href="/knowledge/" variant="ghost" size="sm" icon="document">
          ความรู้ทั้งหมด
        </Button>
      }
    >
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {guides.map(g => (
          <li key={g.slug} className="flex">
            {/* phones: a compact row (icon · title · reading time), the lead from 768px — this section follows long tools */}
            <Card href={`/knowledge/${g.slug}/`} className="flex w-full items-start gap-4 md:flex-col md:items-stretch">
              <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand md:size-12">
                <Icon name={g.icon} size={24} />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1.5 md:gap-2">
                <h3 className="text-h3">{g.th}</h3>
                <p className="text-small text-ink-2 max-md:hidden">{g.lead}</p>
                <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-meta text-ink-3 md:mt-auto md:pt-1">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" size={14} />
                    อ่านประมาณ {g.min} นาที
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand">
                    อ่านเรื่องนี้
                    <Icon name="arrow-right" size={16} />
                  </span>
                </p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </Section>
  );
}
