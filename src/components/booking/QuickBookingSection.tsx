// The quick booking as a page section — the one block the home page and /cleaning/ both use.
// Server component: it reads the Pricebook at build time and hands the client widget a small, serialisable rate table.
import { QuickBooking } from '@/components/booking/QuickBooking';
import { Section, type SectionTone } from '@/components/ui';
import { QUICK_PKGS } from '@/lib/domain/cleaning';
import { getCleanRateTable } from '@/lib/domain/pricebook';

export function QuickBookingSection({
  id = 'book',
  title = 'จองล้างแอร์ เห็นราคารวมก่อนจอง',
  lead = 'เลือกแอร์ วิธีล้าง และวันที่สะดวก ราคาทั้งหมดก่อน VAT และรวมค่าเดินทางให้เห็นทันที ยังไม่ต้องกรอกชื่อหรือเบอร์จนกว่าจะพร้อมจอง',
  tone = 'soft',
}: {
  id?: string;
  title?: string;
  lead?: string;
  tone?: SectionTone;
}) {
  const table = getCleanRateTable(QUICK_PKGS);
  return (
    <Section id={id} eyebrow="จองล้างแอร์" title={title} lead={lead} tone={tone}>
      <QuickBooking table={table} />
    </Section>
  );
}
