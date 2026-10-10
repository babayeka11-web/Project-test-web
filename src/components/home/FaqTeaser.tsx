// FAQ teaser: the first five questions of the shared FAQ (answers are computed from the same constants as the calculators).
import { Accordion, Button, Section } from '@/components/ui';
import type { FaqItem } from '@/lib/domain/content';

export function FaqTeaser({ items }: { items: FaqItem[] }) {
  return (
    <Section
      id="faq"
      eyebrow="คำถามที่พบบ่อย"
      title="ก่อนจอง ลูกค้ามักถามเรื่องเหล่านี้"
      width="text"
      actions={
        <Button href="/faq/" variant="ghost" iconEnd="arrow-right">
          ดูคำถามทั้งหมด
        </Button>
      }
    >
      <Accordion
        name="home-faq"
        items={items.slice(0, 5).map((f, i) => ({
          id: `faq-${i + 1}`,
          title: f.q,
          content: <p className="text-body">{f.a}</p>,
        }))}
      />
    </Section>
  );
}
