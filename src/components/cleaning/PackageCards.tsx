// The three cleaning packages (what the customer receives after the visit). Server component: prices and warranty
// come from the CleanRateTable the page builds from the Pricebook.
import { Badge, Button, Card, Icon, Price } from '@/components/ui';
import { PKG_INFO, PKG_TH, startAt, type CleanRateTable } from '@/lib/domain/cleaning';

export function PackageCards({ table }: { table: CleanRateTable }) {
  return (
    <ul className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {PKG_INFO.map(p => {
        const warranty = table.rows.find(r => r.pkg === p.id)?.warranty;
        return (
          <li key={p.id} className="flex min-w-0">
            <Card padding="md" className="flex w-full flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Badge tone="outline" size="md">
                  {p.code}
                </Badge>
                <Badge tone={p.code === 'P2' ? 'brand' : 'sky'} size="md">
                  {p.pitch}
                </Badge>
              </div>
              <div>
                <h3 className="text-h3">{PKG_TH[p.id].th}</h3>
                <p className="mt-1 text-small text-ink-2">เหมาะกับ{p.fit}</p>
              </div>
              <Price amount={startAt(table, p.id, 'C1')} prefix="เริ่ม" unit="/ เครื่อง" size="lg" tone="brand" />
              <ul className="grid grid-cols-1 gap-2.5">
                {p.gets.map(g => (
                  <li key={g} className="flex gap-2.5 text-small text-ink">
                    <Icon name="check" size={18} className="mt-[0.2em] shrink-0 text-ok" strokeWidth={2.25} />
                    <span>{g}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto grid gap-4">
                <dl className="grid grid-cols-1 gap-2 border-t border-line pt-4 text-small">
                  {warranty && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-2">รับประกันงาน</dt>
                      <dd className="font-semibold text-ink">{warranty}</dd>
                    </div>
                  )}
                  {p.care !== 'ไม่มี' && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-ink-2">ดูแลต่อหลังล้าง</dt>
                      <dd className="text-right font-semibold text-ink">{p.care}</dd>
                    </div>
                  )}
                </dl>
                {p.code === 'P3' && (
                  <Button href="/business/" variant="ghost" fullWidth>
                    ดูสัญญาล้างรายปี
                  </Button>
                )}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
