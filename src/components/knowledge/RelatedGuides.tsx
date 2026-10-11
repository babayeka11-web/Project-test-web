// "อ่านก่อนตัดสินใจ": two or three short guides linked from the page where that decision is made (RELATED_GUIDES), with
// the same card as /knowledge/. Server component: only titles, leads and reading times reach the HTML.
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
            <Card href={`/knowledge/${g.slug}/`} className="flex w-full flex-col gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sky-soft text-brand">
                <Icon name={g.icon} size={24} />
              </span>
              <div className="flex flex-col gap-2">
                <h3 className="text-h3">{g.th}</h3>
                <p className="text-small text-ink-2">{g.lead}</p>
              </div>
              <p className="mt-auto flex items-center justify-between gap-3 pt-1 text-meta text-ink-3">
                <span className="inline-flex items-center gap-1.5">
                  <Icon name="clock" size={14} />
                  อ่านประมาณ {g.min} นาที
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
    </Section>
  );
}
