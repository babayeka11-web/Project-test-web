// What a purchasing / facility team gets with a contract (server component). Each item says what it rests on:
// the package / company forms already, or an arrangement agreed in the contract.
import { Badge, Card, Icon, type IconName } from '@/components/ui';
import { PROMISE_TH, type PromiseKind } from './sectors';

type Item = { icon: IconName; title: string; text: string; kind: PromiseKind; span?: string };

const ITEMS: readonly Item[] = [
  {
    icon: 'quote',
    title: 'ใบเสนอราคาแยกรายการ',
    text: 'แยกค่าล้างตามชนิดเครื่อง ค่าเดินทาง และงานเสริมเป็นบรรทัด ตรวจเทียบกับงบและเทียบผู้ให้บริการได้ง่าย ราคามาตรฐานก่อน VAT',
    kind: 'pkg',
  },
  {
    icon: 'document',
    title: 'ใบกำกับภาษีเต็มรูป',
    text: 'ออกในนามองค์กรของคุณ แจ้งชื่อ ที่อยู่ และเลขประจำตัวผู้เสียภาษีตอนยืนยันงาน',
    kind: 'pkg',
  },
  {
    icon: 'camera',
    title: 'รายงานรายเครื่อง',
    text: 'Service Report พร้อมภาพก่อน–หลัง หรือ Asset Report รายเครื่อง ลงนามรับงาน 3 ฝ่ายทุกรอบ ใช้ตรวจรับงานได้',
    kind: 'pkg',
  },
  {
    icon: 'building',
    title: 'ทะเบียนทรัพย์สิน (Corporate Control)',
    text: 'บันทึกรุ่นและหมายเลขเครื่องรายเครื่อง ดัชนีภาพ จัดลำดับความสำคัญ แนวโน้ม ผู้รับผิดชอบ และกำหนดปิดเคส',
    kind: 'pkg',
  },
  {
    icon: 'calendar',
    title: 'วางบิลตามรอบ',
    text: 'ตกลงรูปแบบใบแจ้งหนี้ รอบวางบิล และผู้ประสานงานของทั้งสองฝ่ายตอนทำสัญญา',
    kind: 'deal',
  },
];

export function Procurement() {
  return (
    <ul className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-6">
      {ITEMS.map((it, i) => (
        <li key={it.title} className={`flex ${i < 3 ? 'lg:col-span-2' : 'lg:col-span-3'} ${i === ITEMS.length - 1 ? 'md:col-span-2' : ''}`}>
          <Card padding="lg" className="flex w-full flex-col gap-3">
            <span className="grid size-12 place-items-center rounded-2xl bg-sky-soft text-brand">
              <Icon name={it.icon} size={24} />
            </span>
            <h3 className="text-h3">{it.title}</h3>
            <p className="text-small text-ink-2">{it.text}</p>
            <Badge tone={it.kind === 'pkg' ? 'ok' : 'sky'} className="mt-auto self-start">
              {PROMISE_TH[it.kind]}
            </Badge>
          </Card>
        </li>
      ))}
    </ul>
  );
}
