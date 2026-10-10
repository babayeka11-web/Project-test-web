// Business constants that client components need without loading the Pricebook (client-safe, no data import).
// MIN_BILL mirrors `minBill` of data/pricebook.json — a unit test (pricebook.test.ts) fails if the two ever drift.

/** Cleaning minimum per visit, baht before VAT. Below it a cleaning visit pays the travel base fee instead. */
export const MIN_BILL = 4500;

/** Booking rule (owner, 2 ต.ค. 2569): normal booking ≥ leadDays ahead; earlier = คิวด่วน +rushFeeEx before VAT per visit. */
export const QUEUE_RULES = { leadDays: 3, rushFeeEx: 500 } as const;

/** From this many units a page says special rates may apply (never a number, never a % discount). */
export const VOLUME_HINT = 10;

/** Honest-UX sentences shared by every calculator (ARCHITECTURE.md §1.4). */
export const NOTES = {
  estimate: 'ราคาประมาณการ · ทีมยืนยันในใบเสนอราคา',
  simulation: 'แบบจำลองเพื่ออธิบาย',
  volume: 'ตั้งแต่ 10 เครื่องขึ้นไป อาจได้อัตราพิเศษตามเงื่อนไขบริษัท ทีมขายยืนยันในใบเสนอราคา',
  source: 'ราคามาตรฐานจาก Pricebook 2569 · ทีมยืนยันราคาและคิวก่อนเข้างานทุกครั้ง',
  survey: 'ประเมินหน้างาน',
  askSales: 'สอบถามราคากับทีมขาย',
  outOfHours: 'นอกเวลาทำการและวันอาทิตย์ให้บริการได้ มีค่าใช้จ่ายเพิ่มเติม ทีมแจ้งในใบเสนอราคา',
} as const;
