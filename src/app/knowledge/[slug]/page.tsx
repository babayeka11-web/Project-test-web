import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { GuideBody } from '@/components/knowledge/GuideBody';
import { audienceTh, GUIDES, guideBySlug } from '@/components/knowledge/guides';
import { Button, Card, CtaBand, Icon, PageHeader, Section } from '@/components/ui';
import { COMPANY } from '@/lib/domain/company';

type Params = { slug: string };

export const dynamicParams = false;
export const generateStaticParams = (): Params[] => GUIDES.map(g => ({ slug: g.slug }));

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const g = guideBySlug((await params).slug);
  if (!g) return {};
  return { title: g.th, description: `${g.lead} อ่านประมาณ ${g.min} นาที จากทีมช่างสหบูรพากรุ๊ป`, alternates: { canonical: './' } };
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const g = guideBySlug((await params).slug);
  if (!g) notFound();
  const i = GUIDES.findIndex(x => x.slug === g.slug);
  const prev = GUIDES[i - 1];
  const next = GUIDES[i + 1];
  const [tool, ...more] = g.tries;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'หน้าแรก', href: '/' }, { label: 'ความรู้', href: '/knowledge/' }, { label: g.th }]}
        eyebrow={audienceTh(g.aud)}
        title={g.th}
        lead={g.lead}
        meta={`อ่านประมาณ ${g.min} นาที · ข้อมูลทั่วไปเพื่อช่วยตัดสินใจ ทีมช่างยืนยันอีกครั้งที่หน้างานจริง`}
      />

      <Section spacing="compact" width="text">
        <article className="flex flex-col gap-10">
          <GuideBody blocks={g.body} />

          <Card tone="sky" padding="md" className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface text-brand">
                <Icon name="sparkle" size={22} />
              </span>
              <h2 className="text-h3">ลองเอง</h2>
            </div>
            <p className="text-small text-ink-2">อ่านแล้วลองต่อได้เลย ใช้ตัวเลขจริงของบริษัท ไม่ต้องกรอกข้อมูลส่วนตัว</p>
            <div className="flex flex-wrap gap-3">
              <Button href={tool.href}>{tool.label}</Button>
              {more.map(t => (
                <Button key={t.href} href={t.href} variant="ghost">
                  {t.label}
                </Button>
              ))}
            </div>
          </Card>
        </article>
      </Section>

      <Section tone="soft" spacing="compact" width="text" eyebrow="อ่านต่อ" title="เรื่องอื่นในหมวดความรู้">
        <nav aria-label="เรื่องก่อนหน้าและถัดไป" className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {prev ? (
              <Card href={`/knowledge/${prev.slug}/`} padding="sm" className="flex h-full flex-col gap-1.5">
                <span className="inline-flex items-center gap-1.5 text-meta text-ink-3">
                  <Icon name="arrow-left" size={14} />
                  เรื่องก่อนหน้า
                </span>
                <span className="text-h3">{prev.th}</span>
              </Card>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next && (
              <Card href={`/knowledge/${next.slug}/`} padding="sm" className="flex h-full flex-col gap-1.5 sm:items-end sm:text-right">
                <span className="inline-flex items-center gap-1.5 text-meta text-ink-3">
                  เรื่องถัดไป
                  <Icon name="arrow-right" size={14} />
                </span>
                <span className="text-h3">{next.th}</span>
              </Card>
            )}
          </div>
          <div>
            <Button href="/knowledge/" variant="quiet" icon="arrow-left">
              ดูความรู้ทั้งหมด
            </Button>
          </div>
        </nav>
      </Section>

      <CtaBand
        title="อยากให้ทีมช่างช่วยดูหน้างานจริง"
        lead="ส่งขนาดห้องและรูปหน้างานให้ทีมช่าง ทีมแนะนำที่เหมาะ แล้วแจ้งราคาในใบเสนอราคาก่อนเริ่มงาน"
        actions={
          <>
            <Button href="/contact/" icon="chat">
              ปรึกษาทีมช่าง
            </Button>
            <Button href={COMPANY.telHref} variant="secondary" icon="phone">
              โทร {COMPANY.tel}
            </Button>
          </>
        }
      />
    </>
  );
}
