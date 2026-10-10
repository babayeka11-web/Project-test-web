// Server components for a model page: Standard vs Premium installation materials side by side, and what one extra metre of
// the pipe bundle holds against the same parts bought line by line. Data comes from the Pricebook via productOptions().
import { Accordion, Notice, Price, TableShell } from '@/components/ui';
import { MAT_ROWS, type InstallOption, type MaterialColumn, type PipeBundle } from '@/lib/domain/install';
import { baht } from '@/lib/domain/format';
import { plain } from '@/lib/plain';

export function MaterialsTable({ columns, install }: { columns: MaterialColumn[]; install: InstallOption[] }) {
  const rows = MAT_ROWS.filter(r => columns.some(c => (c.cell[r.id] ?? []).length > 0));
  if (!columns.length) return null;
  return (
    <TableShell label="เทียบวัสดุติดตั้ง มาตรฐาน กับ พรีเมียม">
      <table className="ui-table" style={{ minWidth: '34rem' }}>
        <caption className="sr-only">เทียบวัสดุและงานที่รวมในแพ็กเกจติดตั้งมาตรฐานกับพรีเมียม</caption>
        <thead>
          <tr>
            <th scope="col">รายการ</th>
            {columns.map(c => (
              <th key={c.key} scope="col" className="!whitespace-normal">
                <span className="block text-small text-ink">ติดตั้ง{c.th}</span>
                <span className="block font-normal">
                  <Price amount={install.find(o => o.key === c.key)?.item.ex ?? null} size="sm" vat={false} /> <span className="text-ink-3">/ เครื่อง ก่อน VAT</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.id}>
              <th scope="row">{r.th}</th>
              {columns.map(c => {
                const cell = c.cell[r.id] ?? [];
                return (
                  <td key={c.key}>
                    {cell.length ? (
                      <ul className="space-y-1">
                        {cell.map(x => (
                          <li key={x}>{plain(x)}</li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-ink-3">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </TableShell>
  );
}

export function PipeBundleBlock({ bundle }: { bundle: PipeBundle }) {
  const { item, parts, sum } = bundle;
  return (
    <Accordion
      variant="card"
      items={[
        {
          id: 'pipe-bundle',
          title: (
            <span>
              ท่อเกิน 4 เมตร: ชุดเหมา {baht(item.ex ?? 0)} ต่อเมตร มีอะไรบ้าง
            </span>
          ),
          content: (
            <div className="flex flex-col gap-4 text-small">
              {item.inc && <p>{plain(item.inc)}</p>}
              {parts && (
                <TableShell label="วัสดุใน 1 เมตรของชุดเหมา เทียบกับซื้อแยกชิ้น">
                  <table className="ui-table" style={{ minWidth: '28rem' }}>
                    <caption className="sr-only">วัสดุใน 1 เมตรของชุดเหมา เทียบกับซื้อแยกชิ้น ราคาก่อน VAT</caption>
                    <thead>
                      <tr>
                        <th scope="col">ใน 1 เมตร</th>
                        <th scope="col">รายการใน Pricebook</th>
                        <th scope="col" data-align="end">
                          ถ้าซื้อแยก
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {parts.map(x => (
                        <tr key={x.th}>
                          <th scope="row">{x.th}</th>
                          <td>
                            {x.name}
                            {x.qty > 1 ? ` × ${x.qty}` : ''}
                          </td>
                          <td data-align="end" data-numeric>
                            {baht(x.ex * x.qty)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <th scope="row">รวมถ้าซื้อแยกชิ้น</th>
                        <td className="text-ink-2">ยังไม่รวมค่าแรงเดินท่อ เชื่อม และบานแฟลร์</td>
                        <td data-align="end" data-numeric className="font-semibold">
                          {baht(sum ?? 0)}
                        </td>
                      </tr>
                      <tr>
                        <th scope="row">ชุดเหมาต่อเมตร</th>
                        <td className="text-ink-2">วัสดุครบชุดและค่าแรงติดตั้ง</td>
                        <td data-align="end" data-numeric className="font-semibold text-brand">
                          {baht(item.ex ?? 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </TableShell>
              )}
              <Notice tone="info" size="sm">
                ราคาก่อน VAT จาก Pricebook 2569 ของบริษัท วัสดุคิดตามราคาจริงไม่ปัด ทีมวัดระยะจริงก่อนติดตั้ง {plain(item.exc ?? '')}
              </Notice>
            </div>
          ),
        },
      ]}
    />
  );
}
