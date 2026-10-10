// The three cleaning packages of a contract: what document the customer receives, the warranty, the Service Care period and
// the starting price. Documents / warranty / care come from the Pricebook rows (passed as props by the server page).
import { Badge, Card, Icon, Price, Table } from '@/components/ui';
import { PKG_INFO, PKG_TH, type CleanPkgId } from '@/lib/domain/cleaning';
import { reportKindOf } from './sectors';

export type PackageFacts = {
  id: CleanPkgId;
  /** document line of a normal (C1) and a deep (C2) clean, as in the Pricebook */
  docC1: string;
  docC2: string;
  warranty: string;
  care: string;
  fromC1: number | null;
  fromC2: number | null;
};

export function PackageCompare({ facts }: { facts: PackageFacts[] }) {
  const by = Object.fromEntries(facts.map(f => [f.id, f])) as Record<CleanPkgId, PackageFacts>;
  return (
    <div className="flex flex-col gap-8">
      <ul className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {PKG_INFO.map(p => {
          const f = by[p.id];
          return (
            <li key={p.id} className="flex">
              <Card padding="lg" className="flex w-full flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Badge tone="sky" className="self-start">
                    {p.pitch}
                  </Badge>
                  <h3 className="text-h3">{p.id}</h3>
                  <p className="text-small text-ink-2">{PKG_TH[p.id].th}</p>
                </div>
                <p className="flex gap-2.5 rounded-control bg-sky-soft p-3 text-small font-semibold text-brand">
                  <Icon name="document" size={20} className="mt-0.5 shrink-0" />
                  <span>{reportKindOf(p.id)}</span>
                </p>
                <ul className="flex flex-col gap-2 text-small text-ink-2">
                  {p.gets.map(g => (
                    <li key={g} className="flex gap-2.5">
                      <Icon name="check" size={18} className="mt-0.5 shrink-0 text-ok" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-small text-ink-2">
                  <strong className="text-ink">เหมาะกับ</strong> {p.fit}
                </p>
                <div className="mt-auto border-t border-line pt-4">
                  <Price amount={f?.fromC1 ?? null} prefix="ล้างปกติ เริ่ม" unit="/ เครื่อง" size="md" tone="brand" />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Table
        caption="เปรียบเทียบ 3 แพ็กเกจล้างแอร์ในสัญญารายปี"
        showCaption
        stickyFirstColumn
        minWidth="44rem"
        columns={[
          { key: 'k', label: 'รายการ', rowHeader: true },
          ...PKG_INFO.map(p => ({ key: p.id, label: p.id })),
        ]}
        rows={[
          { id: 'c1', k: 'เอกสารหลังล้างปกติ (C1)', ...Object.fromEntries(PKG_INFO.map(p => [p.id, by[p.id]?.docC1])) },
          { id: 'c2', k: 'เอกสารหลังล้างใหญ่ (C2)', ...Object.fromEntries(PKG_INFO.map(p => [p.id, by[p.id]?.docC2])) },
          { id: 'w', k: 'รับประกันงานล้าง', ...Object.fromEntries(PKG_INFO.map(p => [p.id, by[p.id]?.warranty])) },
          { id: 'care', k: 'Service Care', ...Object.fromEntries(PKG_INFO.map(p => [p.id, by[p.id]?.care])) },
          {
            id: 'p1',
            k: 'ล้างปกติ (C1) เริ่ม ต่อเครื่อง',
            ...Object.fromEntries(PKG_INFO.map(p => [p.id, <Price key={p.id} amount={by[p.id]?.fromC1 ?? null} size="sm" vat={false} />])),
          },
          {
            id: 'p2',
            k: 'ล้างใหญ่ (C2) เริ่ม ต่อเครื่อง',
            ...Object.fromEntries(PKG_INFO.map(p => [p.id, <Price key={p.id} amount={by[p.id]?.fromC2 ?? null} size="sm" vat={false} />])),
          },
        ]}
        footnote="ราคาในตารางเป็นราคาเริ่มต้นต่อเครื่อง ก่อน VAT ตามขนาดเครื่องเล็กสุด · ราคาตามขนาดและชนิดเครื่องจริงดูได้ในเครื่องคำนวณด้านบน"
      />
    </div>
  );
}
