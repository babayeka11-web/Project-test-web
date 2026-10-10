// "ขั้นตอนตรวจซ่อมของทีม" — six steps from the first look to the warranty, with the rule that matters most highlighted:
// nothing is repaired before the customer approves the price. Static (server) component; fees arrive as props.
import { Badge, Card, Icon, Price, type IconName } from '@/components/ui';
import { PREPARE } from './diag';

export type DiagFee = { label: string; ex: number | null };

type Step = { icon: IconName; title: string; text: string; key?: boolean };

const STEPS: readonly Step[] = [
  { icon: 'search', title: 'ตรวจวินิจฉัย', text: 'ช่างตรวจอาการ เดินเครื่องทดสอบ ตรวจไฟฟ้า น้ำทิ้ง อุณหภูมิ และรหัสเตือน ตามจุดที่เข้าถึงได้' },
  { icon: 'document', title: 'แจ้งผลตรวจและราคา', text: 'บอกสาเหตุ อะไหล่ ค่าแรง ระยะรับประกันต่อรายการ และทางเลือก ซ่อม เปลี่ยน หรือไม่ซ่อม' },
  {
    icon: 'check',
    title: 'ลูกค้าอนุมัติ',
    text: 'ลูกค้าตัดสินใจจากราคาที่แจ้ง อะไหล่เฉพาะรุ่นบางรายการต้องสั่ง ทีมแจ้งวันนัดตามวันที่อะไหล่เข้า',
    key: true,
  },
  { icon: 'repair', title: 'ซ่อมหรือเปลี่ยนอะไหล่', text: 'เก็บอะไหล่เก่าให้ลูกค้าดู ถ้าพบปัญหาเพิ่มระหว่างซ่อม แจ้งก่อนทำต่อ' },
  { icon: 'thermometer', title: 'ทดสอบหลังซ่อม', text: 'เดินเครื่อง วัดค่าที่เกี่ยวข้อง ตรวจว่าไม่มีรหัสเตือน และอาการเดิมไม่เกิดขณะทดสอบ' },
  { icon: 'shield', title: 'ส่งรายงานและรับประกัน', text: 'รายงานตรวจและซ่อม รายการอะไหล่ ผลทดสอบ และระยะรับประกันต่อรายการ' },
];

export function RepairSteps({ fees }: { fees: readonly DiagFee[] }) {
  return (
    <div className="flex flex-col gap-8">
      <ol className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {STEPS.map((s, i) => (
          <li key={s.title} className="min-w-0">
            <Card tone={s.key ? 'sky' : 'surface'} padding="md" className={`flex h-full flex-col gap-4 ${s.key ? 'ring-2 ring-brand' : ''}`}>
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className={`grid size-12 shrink-0 place-items-center rounded-2xl ${s.key ? 'bg-brand text-on-brand' : 'bg-sky-soft text-brand'}`}
                >
                  <Icon name={s.icon} size={24} />
                </span>
                <span className="text-small font-semibold text-ink-3">
                  ขั้นที่ <span className="tabular-nums">{i + 1}</span>
                </span>
              </div>
              <h3 className="text-h3">{s.title}</h3>
              <p className="text-ink-2">{s.text}</p>
              {s.key && (
                <p>
                  <Badge tone="brand" size="md" icon="shield">
                    ไม่ซ่อมก่อนลูกค้าอนุมัติ
                  </Badge>
                </p>
              )}
              {i === 0 && fees.length > 0 && (
                <ul className="mt-auto grid gap-2 border-t border-line pt-4">
                  {fees.map(f => (
                    <li key={f.label} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                      <span className="text-small text-ink-2">ค่าตรวจ {f.label}</span>
                      <Price amount={f.ex} size="sm" />
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </li>
        ))}
      </ol>

      <Card tone="soft" padding="md" className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-center">
        <div className="flex flex-col gap-2">
          <h3 className="text-h3">ส่งข้อมูลมาก่อน ช่างเตรียมตัวได้ตรงขึ้น</h3>
          <p className="text-ink-2">แนบในใบจอง หรือส่งทาง LINE ก็ได้ ยิ่งมีข้อมูล ช่างยิ่งเตรียมอะไหล่และเครื่องมือได้ตรงกับเครื่องของคุณ</p>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {PREPARE.map(t => (
            <li key={t} className="flex gap-3 rounded-control bg-surface p-3.5 text-small text-ink-2 shadow-card">
              <Icon name="camera" size={20} className="mt-0.5 text-sky" />
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
