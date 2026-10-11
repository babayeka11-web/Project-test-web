import { describe, expect, it } from 'vitest';
import type { CartLine } from '@/lib/cart';
import { handoffLinks, LINE_MAX, lineText } from '@/lib/request';
import { areaShort, groupLines, lineBrief } from './quote-model';

const line = (o: Partial<CartLine> & Pick<CartLine, 'name' | 'group'>): CartLine => ({
  id: o.name,
  key: o.name,
  kind: 'service',
  unitEx: 1000,
  qty: 1,
  ...o,
});

// 3 models, their installation and a cleaning: the long quote the LINE link used to choke on (4,948 characters)
const LINES: CartLine[] = [
  line({ name: 'Daikin FTKF12XV2S', group: 'product', kind: 'product', unitEx: 15900 }),
  line({ name: 'Mitsubishi Electric MSY-GT13VF', group: 'product', kind: 'product', unitEx: 18900 }),
  line({ name: 'Carrier 42TVAB013', group: 'product', kind: 'product', unitEx: 14900 }),
  line({ name: 'บริการติดตั้งมาตรฐาน — แอร์ติดผนัง 9,000–12,000 BTU', group: 'install', qty: 3, detail: 'สำหรับ FTKF12XV2S' }),
  line({ name: 'ล้างแอร์ติดผนัง 9,000-18,000 BTU · ล้างปกติ C1', group: 'clean', qty: 2 }),
];

const brief = {
  name: 'บริษัท ตัวอย่าง จำกัด',
  tel: '0812345678',
  when: 'พ. 14 ต.ค. · ช่วงเช้า',
  area: 'เขตจอมทอง',
  items: groupLines(LINES).flatMap(g => g.lines.map(lineBrief)),
  total: '฿71,262',
};

describe('lineText (short LINE message)', () => {
  it('keeps the LINE link under 1,500 characters for a long quote', () => {
    const t = lineText('booking', 'SBP-691011-AB12', brief);
    expect(handoffLinks('booking', 'SBP-691011-AB12', 'full text', t).line.length).toBeLessThan(1500);
    expect(encodeURIComponent(t).length).toBeLessThanOrEqual(LINE_MAX);
  });

  it('says who, when, where, how many, the total, and points to the reference', () => {
    const rows = lineText('booking', 'SBP-691011-AB12', brief).split('\n');
    expect(rows[0]).toBe('จองคิวงาน SBP-691011-AB12');
    expect(rows[1]).toBe('บริษัท ตัวอย่าง จำกัด · 0812345678');
    expect(rows).toContain('พ. 14 ต.ค. · ช่วงเช้า');
    expect(rows).toContain('เขตจอมทอง');
    expect(rows).toContain('5 รายการ · รวม VAT ฿71,262');
    expect(rows.at(-1)).toBe('รายละเอียดครบ แจ้งเลขอ้างอิงนี้ได้');
  });

  it('lists up to five items and counts the rest', () => {
    const many = { ...brief, items: Array.from({ length: 8 }, (_, i) => `Model ${i + 1}`) };
    const rows = lineText('quote', 'R', many).split('\n');
    expect(rows.filter(r => r.startsWith('- '))).toEqual(['- Model 1', '- Model 2', '- Model 3', '- Model 4', '- Model 5']);
    expect(rows).toContain('อีก 3 รายการ');
  });

  it('lists only the items that fit, never a link that is too long', () => {
    const long = { ...brief, items: Array.from({ length: 5 }, () => 'บริการติดตั้งมาตรฐาน — แอร์ติดผนัง 9,000–12,000 BTU × 3') };
    const t = lineText('quote', 'R', long);
    expect(encodeURIComponent(t).length).toBeLessThanOrEqual(LINE_MAX);
    const shown = t.split('\n').filter(r => r.startsWith('- ')).length;
    expect(shown).toBeLessThan(5);
    expect(t).toContain(`อีก ${5 - shown} รายการ`);
  });

  it('skips what is not given', () => {
    expect(lineText('quote', 'R', { name: 'ก', tel: '1' })).toBe('ขอใบเสนอราคา R\nก · 1\nรายละเอียดครบ แจ้งเลขอ้างอิงนี้ได้');
  });

  it('keeps the full text for e-mail', () => {
    const l = handoffLinks('quote', 'R', 'ข้อความเต็ม', 'สั้น');
    expect(l.mail).toContain(encodeURIComponent('ข้อความเต็ม'));
    expect(l.line).toContain(encodeURIComponent('สั้น'));
    expect(l.line).not.toContain(encodeURIComponent('ข้อความเต็ม'));
  });
});

describe('quote-model briefs', () => {
  it('names a line with its quantity only when more than one', () => {
    expect(lineBrief({ name: 'Daikin FTKF12XV2S', qty: 1 })).toBe('Daikin FTKF12XV2S');
    expect(lineBrief({ name: 'ล้างแอร์', qty: 3 })).toBe('ล้างแอร์ × 3');
  });
  it('shortens the area', () => {
    const z = { province: 'กรุงเทพมหานคร', district: 'จอมทอง', sub: 'บางมด', zip: '10150', match: 'แขวงบางมด เขตจอมทอง กรุงเทพฯ 10150', districts: [], tier: 'core', km: 5, fee: 0 } as const;
    expect(areaShort({ ...z, districts: [] }, z.match)).toBe('เขตจอมทอง');
    expect(areaShort({ ...z, districts: [], province: 'สมุทรปราการ', district: 'บางพลี' }, '')).toBe('อ.บางพลี จ.สมุทรปราการ');
    expect(areaShort(null, 'บางนา')).toBe('บางนา');
    expect(areaShort(null, '')).toBe('');
  });
});
