// Renders the blocks of one guide (server component). Plain reading layout: short paragraphs, dotted lists, a worked example
// card and the cleaning-package cards. "term — explanation" and "term: explanation" list items get a bold term.
import { Badge, Card } from '@/components/ui';
import type { Block } from './guides';

/** "ติดผนัง — ห้องนอน…" / "คอยล์ร้อน: วางที่…" → bold term + rest. Anything else stays one sentence. */
function splitTerm(item: string): { term: string; rest: string } | null {
  const m = /^(.{2,34}?)(?: — |: )(.+)$/s.exec(item);
  return m ? { term: m[1], rest: m[2] } : null;
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {items.map(item => {
        const s = splitTerm(item);
        return (
          <li key={item} className="flex gap-3 text-body text-ink">
            <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-sky" />
            <span className="min-w-0">
              {s ? (
                <>
                  <strong className="font-semibold">{s.term}</strong>
                  <span className="text-ink-2"> — {s.rest}</span>
                </>
              ) : (
                item
              )}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function GuideBody({ blocks }: { blocks: readonly Block[] }) {
  return (
    <div className="flex flex-col gap-6">
      {blocks.map((b, i) => {
        switch (b.t) {
          case 'p':
            return (
              <p key={i} className="text-body text-ink">
                {b.text}
              </p>
            );
          case 'ul':
            return <Bullets key={i} items={b.items} />;
          case 'example':
            return (
              <Card key={i} tone="sky" padding="sm" className="flex flex-col gap-1.5">
                <p className="text-small font-semibold text-brand">{b.title}</p>
                <p className="text-body text-ink">{b.text}</p>
              </Card>
            );
          case 'pkg':
            return (
              <Card key={i} padding="md" className="flex flex-col gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="brand" size="md">
                    {b.code}
                  </Badge>
                  <h2 className="text-h3">{b.title}</h2>
                </div>
                <p className="text-small text-ink-2">
                  <span className="font-semibold text-ink">เหมาะกับ</span> {b.fit}
                </p>
                <Bullets items={b.items} />
                <p className="border-t border-line pt-3 text-small text-ink-2">
                  <span className="font-semibold text-ink">ดูแลหลังงาน</span> {b.care === 'ไม่มี' ? 'ไม่รวม Service Care' : b.care}
                </p>
              </Card>
            );
        }
      })}
    </div>
  );
}
