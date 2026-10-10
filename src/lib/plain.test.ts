import { describe, expect, it } from 'vitest';
import { plain } from './plain';

describe('plain()', () => {
  it('turns staff wording from the Pricebook into customer words', () => {
    expect(plain('ห้ามออก Final Price ก่อน Manager/ช่างยืนยัน')).toBe('ทีมยืนยันราคาก่อนเริ่มงานทุกครั้ง');
    expect(plain('อะไหล่รับประกันตามผู้ขาย/ผู้ผลิตที่ระบุใน QTN; ฝีมือติดตั้ง 30 วัน')).toBe('อะไหล่รับประกันตามผู้ขาย/ผู้ผลิตที่ระบุในใบเสนอราคา; ฝีมือติดตั้ง 30 วัน');
    expect(plain('1 ปีเมื่อใช้เครื่องลูกค้าจัดหา ตาม QTN')).toBe('1 ปีเมื่อใช้เครื่องลูกค้าจัดหา ตามใบเสนอราคา');
    expect(plain('ไม่มีคำย่อ')).toBe('ไม่มีคำย่อ');
  });
});
