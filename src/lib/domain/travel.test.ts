import { describe, expect, it } from 'vitest';
import raw from '@data/th-address.json';
import { addrParts, addrSearch, addrTh, buildAddressBook, checkZone, districtsOf, loadAddressBook, pickFrom, provincesOf, subdistrictsOf, zoneOf, type RawAddressBook } from './address';
import { jobTravel, roadKm, TRAVEL, travelFee, travelNote, zoneChip, type Zone } from './travel';

const book = buildAddressBook(raw as unknown as RawAddressBook);
const zone = (tier: Zone['tier'], km: number | null, fee: number | null): Zone => ({ province: '', district: '', sub: '', zip: '', match: '', districts: [], tier, km, fee });

describe('travel fee', () => {
  it('300 + 10/km beyond 30 km, rounded up to 100; beyond 150 km = project', () => {
    expect(travelFee(0)).toBe(300);
    expect(travelFee(30)).toBe(300);
    expect(travelFee(31)).toBe(400);
    expect(travelFee(60)).toBe(600);
    expect(travelFee(61)).toBe(700);
    expect(travelFee(150)).toBe(1500);
    expect(travelFee(151)).toBeNull();
    expect(roadKm(13.664, 100.44)).toBe(0);
  });
  it('jobTravel: core area free at the minimum, base fee below it, distance fee outside', () => {
    expect(jobTravel(null, 0)).toEqual({ fee: 0, small: false, distance: false, label: '' });
    expect(jobTravel(null, 700).fee).toBe(TRAVEL.baseFee);
    expect(jobTravel(null, 700).label).toBe('ค่าเดินทาง (งานล้างต่ำกว่าขั้นต่ำ ฿4,500)');
    expect(jobTravel(zone('core', 12, 0), 4500).fee).toBe(0);
    expect(jobTravel(zone('core', 12, 0), 4499).fee).toBe(300);
    expect(jobTravel(zone('extended', 55, 600), 9000)).toEqual({ fee: 600, small: false, distance: true, label: 'ค่าเดินทาง 55 กม. (ระยะถนนโดยประมาณ)' });
    expect(jobTravel(zone('out', null, null), 700).fee).toBe(0);
    expect(jobTravel(null, 3000, 2000).fee).toBe(0);
  });
  it('travelNote + zoneChip', () => {
    expect(travelNote(null)).toBe('');
    expect(travelNote(zone('core', 12, 0))).toBe('ในระยะ 12 กม. · ไม่มีค่าเดินทางเมื่องานล้างถึง ฿4,500');
    expect(travelNote(zone('extended', 55, 600))).toBe('ระยะถนนประมาณ 55 กม. · ค่าเดินทาง ฿600/เที่ยว (ก่อน VAT)');
    expect([zoneChip(zone('core', 1, 0)), zoneChip(zone('extended', 50, 500)), zoneChip(zone('out', null, null)), zoneChip(null)]).toEqual(['พื้นที่หลัก', '฿500/เที่ยว', 'เกินระยะ', '']);
  });
});

describe('address book', () => {
  it('HQ subdistrict is in the core area', () => {
    const z = zoneOf(book, { p: 'กรุงเทพมหานคร', d: 'จอมทอง', s: 'บางมด', z: '10150' });
    expect(z?.tier).toBe('core');
    expect(z?.fee).toBe(0);
    expect(z?.match).toBe('แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150');
  });
  it('provinces by name only are out of per-unit range; unknown stays unknown', () => {
    expect(zoneOf(book, { p: book.other[0] })?.tier).toBe('out');
    expect(zoneOf(book, { p: 'ไม่มีจังหวัดนี้' })?.tier).toBe('unknown');
    expect(zoneOf(book, null)).toBeNull();
  });
  it('search by postcode, subdistrict, district; free text', () => {
    const z = addrSearch(book, '10150');
    expect(z.length).toBeGreaterThan(0);
    expect(z.every(a => a.z === '10150')).toBe(true);
    expect(addrSearch(book, 'บางมด')[0].s).toBe('บางมด');
    expect(addrSearch(book, 'เขตจอมทอง')[0]).toMatchObject({ p: 'กรุงเทพมหานคร', d: 'จอมทอง', score: 7 });
    expect(addrSearch(book, 'ก')).toEqual([]);
    expect(checkZone(book, 'x')).toBeNull();
    expect(checkZone(book, 'ไม่มีที่นี่เลย')?.tier).toBe('unknown');
    expect(checkZone(book, 'บางมด')?.tier).toBe('core');
  });
  it('display + cascade helpers', () => {
    expect(addrTh({ p: 'นนทบุรี', d: 'ปากเกร็ด', s: 'บางพูด', z: '11120' })).toBe('ต.บางพูด อ.ปากเกร็ด จ.นนทบุรี 11120');
    expect(addrParts({ p: 'กรุงเทพมหานคร', d: 'จอมทอง' })).toEqual({ title: 'เขตจอมทอง', sub: 'กรุงเทพฯ · ทั้งเขต' });
    expect(provincesOf(book)[0]).toBe('กรุงเทพมหานคร');
    expect(districtsOf(book, 'กรุงเทพมหานคร')).toContain('จอมทอง');
    expect(subdistrictsOf(book, 'กรุงเทพมหานคร', 'จอมทอง').map(r => r.s)).toContain('บางมด');
    expect(pickFrom(book, 'กรุงเทพมหานคร', 'จอมทอง', 'บางมด')).toEqual({ p: 'กรุงเทพมหานคร', d: 'จอมทอง', s: 'บางมด', z: '10150' });
    expect(pickFrom(book, '')).toBeNull();
  });
  it('loadAddressBook (lazy dynamic import) gives the same book, once', async () => {
    const a = await loadAddressBook();
    expect(a.list.length).toBe(book.list.length);
    expect(await loadAddressBook()).toBe(a);
  });
});
