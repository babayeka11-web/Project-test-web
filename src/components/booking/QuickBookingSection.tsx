// The quick booking as a page section — the one block the home page and /cleaning/ both use.
// Server component: it reads the Pricebook at build time and hands the client widget a small, serialisable rate table.
import { QuickBooking } from '@/components/booking/QuickBooking';
import { Section, type SectionTone } from '@/components/ui';
import { QUICK_PKGS } from '@/lib/domain/cleaning';
import { getCleanRateTable } from '@/lib/domain/pricebook';

const EYEBROW = 'จองล้างแอร์';

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
  // the eyebrow names the topic only when the title does not already say it (UI.md §5)
  const eyebrow = title.includes(EYEBROW) ? undefined : EYEBROW;
  return (
    <Section id={id} eyebrow={eyebrow} title={title} lead={lead} tone={tone}>
      <QuickBooking table={table} />
    </Section>
  );
}
