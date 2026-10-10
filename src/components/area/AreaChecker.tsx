'use client';
// "ตรวจพื้นที่ของคุณ": the shared address field (it also sets the quote's area) + quick example places + a plain summary
// of what the pick means for travel. Everything comes from the zone the domain layer computed — no number is typed here.
import { useState } from 'react';
import { AddressPicker } from '@/components/shared/AddressPicker';
import { Badge, Button, Card, Chip, Icon, Price } from '@/components/ui';
import { cart, useCart } from '@/lib/cart';
import { addrSearch, addrTh, loadAddressBook, zoneOf } from '@/lib/domain/address';
import { MIN_BILL } from '@/lib/domain/constants';
import { baht } from '@/lib/domain/format';
import { jobTravel, TIER_TH, TRAVEL, type Zone } from '@/lib/domain/travel';

const EXAMPLES = ['บางมด', 'บางนา', 'ปากเกร็ด', 'สามพราน', 'ศรีราชา'] as const;

/** Customer-facing reading of one zone: how far, what the trip costs, what to do next. */
function ZoneSummary({ zone }: { zone: Zone | null }) {
  if (!zone) {
    return (
      <div className="rounded-control border border-dashed border-line-strong p-4 text-small text-ink-2" aria-live="polite">
        <p className="flex items-start gap-2">
          <Icon name="info" size={18} className="mt-1 shrink-0 text-brand" />
          <span>เลือกพื้นที่ แล้วดูระยะทางและค่าเดินทางโดยประมาณ ผลเดียวกันนี้ใช้ในใบเสนอราคาของคุณ</span>
        </p>
      </div>
    );
  }
  const small = jobTravel(null, MIN_BILL - 1).fee;
  const tone = zone.tier === 'core' ? 'ok' : zone.tier === 'extended' ? 'sky' : 'warn';
  return (
    <div className="flex flex-col gap-4 rounded-control border border-line bg-surface-2 p-4 sm:p-5" aria-live="polite">
      <div className="flex flex-wrap items-center gap-2">
        <Icon name={zone.tier === 'core' ? 'check' : zone.tier === 'extended' ? 'truck' : 'info'} size={20} className="text-brand" />
        <b className="text-ink">{TIER_TH[zone.tier].th}</b>
        <Badge tone={tone}>{zone.tier === 'core' ? 'พื้นที่หลัก' : zone.tier === 'extended' ? 'คิดตามระยะ' : zone.tier === 'out' ? 'งานโครงการ' : 'ไม่พบ'}</Badge>
      </div>
      <p className="-mt-2 text-meta text-ink-3">{zone.match}</p>

      {(zone.tier === 'core' || zone.tier === 'extended') && (
        <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
          <div>
            <dt className="text-meta text-ink-3">ระยะถนนโดยประมาณ</dt>
            <dd className="text-h3 num">
              {zone.km} <span className="text-small font-normal text-ink-2">กม. จากสำนักงานใหญ่</span>
            </dd>
          </div>
          <div>
            <dt className="text-meta text-ink-3">ค่าเดินทางต่อเที่ยว</dt>
            <dd>
              {zone.tier === 'core' ? (
                <>
                  <span className="text-h3">ไม่มีค่าเดินทาง</span>
                  <span className="mt-1 block text-small text-ink-2">
                    เมื่องานล้างถึง {baht(MIN_BILL)} ก่อน VAT · ต่ำกว่านั้นค่าเดินทาง <Price amount={small} size="sm" />
                  </span>
                </>
              ) : (
                <Price amount={zone.fee} size="lg" tone="brand" unit="/ เที่ยว" />
              )}
            </dd>
          </div>
        </dl>
      )}
      {zone.tier === 'extended' && (
        <p className="text-small text-ink-2">
          คิดจาก {baht(TRAVEL.baseFee)} + {baht(TRAVEL.perKm)} ต่อ กม. ที่เกิน {TRAVEL.freeKm} กม. ปัดขึ้นหลักร้อย
        </p>
      )}
      {zone.tier === 'out' && (
        <p className="text-small text-ink-2">
          {zone.km ? `ระยะถนนประมาณ ${zone.km} กม. ` : ''}
          {TIER_TH.out.note}
        </p>
      )}
      {zone.tier === 'unknown' && <p className="text-small text-ink-2">{TIER_TH.unknown.note}</p>}

      <div className="flex flex-wrap gap-3">
        {zone.tier === 'out' ? (
          <Button href="/contact/?topic=project" variant="secondary" icon="chat">
            ฝากข้อมูลให้ทีมประเมิน
          </Button>
        ) : zone.tier !== 'unknown' ? (
          <>
            <Button href="/cleaning/#book" variant="secondary" icon="clean">
              จองล้างแอร์ในพื้นที่นี้
            </Button>
            <Button href="/quote/" variant="ghost" icon="quote">
              ดูใบเสนอราคา
            </Button>
          </>
        ) : null}
      </div>
    </div>
  );
}

export function AreaChecker() {
  const { addr, zone } = useCart();
  const [busy, setBusy] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  const pickExample = async (name: string) => {
    setBusy(name);
    setFailed(false);
    try {
      const book = await loadAddressBook();
      const hit = addrSearch(book, name, 1)[0];
      if (hit) {
        const pick = { p: hit.p, d: hit.d, s: hit.s, z: hit.z };
        cart.setAddress(pick, zoneOf(book, pick), addrTh(pick));
      }
    } catch {
      setFailed(true);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card padding="lg" className="flex flex-col gap-6">
      <AddressPicker showResult={false} label="พื้นที่หน้างานของคุณ" id="area-check" />
      <div>
        <p id="area-examples" className="mb-3 text-small font-semibold text-ink">
          หรือลองพื้นที่ตัวอย่าง
        </p>
        <div role="group" aria-labelledby="area-examples" className="flex flex-wrap gap-2">
          {EXAMPLES.map(name => (
            <Chip key={name} selected={!!addr && (addr.s === name || addr.d === name)} disabled={busy !== null} onClick={() => pickExample(name)}>
              {name}
            </Chip>
          ))}
        </div>
        {failed && <p className="mt-2 text-meta text-warn">โหลดรายชื่อพื้นที่ไม่สำเร็จ ลองกดอีกครั้ง</p>}
      </div>
      <ZoneSummary zone={zone} />
    </Card>
  );
}
