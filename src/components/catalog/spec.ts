// Spec rows for a model / series page (client-safe, no data). Labels in customer Thai; values exactly as the Pricebook has
// them — a missing value is shown as '—', never guessed.
import type { SkuSpec } from '@/lib/domain/catalog';
import { btuFmt } from '@/lib/domain/format';

export const DASH = '—';

type SpecKey = Exclude<keyof SkuSpec, 'approved'>;

const inch = (v: string) => `${v}"`;
const unit = (u: string) => (v: string) => `${v} ${u}`;

/** Spec fields in reading order: what it is → size and weight → power → installation limits → warranty and stock. */
export const SPEC_FIELDS: readonly { key: SpecKey; th: string; fmt?: (v: string) => string }[] = [
  { key: 'series', th: 'ซีรีส์' },
  { key: 'system', th: 'ระบบคอมเพรสเซอร์' },
  { key: 'compressor', th: 'ชนิดคอมเพรสเซอร์' },
  { key: 'refrigerant', th: 'น้ำยาแอร์' },
  { key: 'power', th: 'ระบบไฟ' },
  { key: 'indoorDim', th: 'ขนาดคอยล์เย็น (มม.)' },
  { key: 'indoorKg', th: 'น้ำหนักคอยล์เย็น', fmt: unit('กก.') },
  { key: 'outdoorModel', th: 'รุ่นคอยล์ร้อน' },
  { key: 'outdoorDim', th: 'ขนาดคอยล์ร้อน (มม.)' },
  { key: 'outdoorKg', th: 'น้ำหนักคอยล์ร้อน', fmt: unit('กก.') },
  { key: 'pipeLiquid', th: 'ท่อน้ำยาเส้นเล็ก', fmt: inch },
  { key: 'pipeGas', th: 'ท่อน้ำยาเส้นใหญ่', fmt: inch },
  { key: 'maxPipe', th: 'ความยาวท่อสูงสุด', fmt: unit('ม.') },
  { key: 'maxLift', th: 'ความสูงต่างระดับสูงสุด', fmt: unit('ม.') },
  { key: 'warranty', th: 'รับประกันตัวเครื่อง (ผู้ผลิต)' },
  { key: 'lead', th: 'สต็อกและระยะส่ง' },
];

/** Formatted value of one spec field, or '—'. */
export function specValue(spec: SkuSpec, key: SpecKey): string {
  const v = spec[key];
  if (v == null || String(v).trim() === '') return DASH;
  const f = SPEC_FIELDS.find(x => x.key === key)?.fmt;
  return f ? f(String(v)) : String(v);
}

/** Every spec row of one SKU (model code and size first). */
export function specRows(sku: { sku: string; btu: number; spec: SkuSpec }): { th: string; value: string }[] {
  return [
    { th: 'รหัสรุ่น', value: sku.sku },
    { th: 'ขนาดทำความเย็น', value: btuFmt(sku.btu) },
    ...SPEC_FIELDS.map(f => ({ th: f.th, value: specValue(sku.spec, f.key) })),
    { th: 'ที่มาของราคา', value: sku.spec.approved ? 'ราคาอนุมัติใน Pricebook 2569' : 'ราคาอ้างอิงตลาด ทีมยืนยันก่อนเสนอ' },
  ];
}

/** Spec fields that have the same known value in every SKU of a series (shown once on the series page). */
export function sharedSpecs(skus: readonly { spec: SkuSpec }[]): { th: string; value: string }[] {
  const out: { th: string; value: string }[] = [];
  SPEC_FIELDS.forEach(f => {
    const vals = new Set(skus.map(k => specValue(k.spec, f.key)));
    if (vals.size === 1) {
      const [value] = [...vals];
      if (value !== DASH) out.push({ th: f.th, value });
    }
  });
  return out;
}
