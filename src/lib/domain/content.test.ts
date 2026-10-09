import { describe, expect, it } from 'vitest';
import { btuBreakdown, needBtu, recommendBtu, recommendUnits, ROOM_BY_ID, roomDefaults } from './btu';
import { CLEAN_PKGS, PRESETS } from './contract';
import { LEVEL_TH, METHOD_INFO, PKG_INFO, PKG_TH, QUICK_TYPES } from './cleaning';
import { NOTES } from './constants';
import { bannedIn, BANNED_PHRASES, CONTACT_TOPICS, faqList, isVRF, PROCESS, serviceCards, TIME_NOTE, timeTh, VRF_NOTE } from './content';
import { INS_LEVELS, MAT_ROWS } from './install';
import { DECIDED, RATE_SOURCES, SMALL_VISIT } from './rates';
import { SLOTS } from './queue';
import { TRADE_IN, TRADE_ISSUES, tradeValue } from './tradein';
import { TIER_TH, TRAVEL } from './travel';
import { AC_TYPES } from './types';

describe('content', () => {
  it('service cards without Pricebook prices say "—"', () => {
    const c = serviceCards();
    expect(c.map(s => s.id)).toEqual(['clean-b2b', 'clean', 'install', 'repair', 'move', 'project']);
    expect(c.find(s => s.id === 'clean')?.from).toBe('—');
    expect(c.find(s => s.id === 'project')?.contact).toBe(true);
    expect(c.every(s => s.href.startsWith('/') && s.href.endsWith('/'))).toBe(true);
  });
  it('FAQ numbers follow the constants', () => {
    const f = faqList(null, 4500);
    expect(f).toHaveLength(10);
    expect(f[0].a).toContain('จองปกติล่วงหน้า 3 วัน');
    expect(f[0].a).toContain('500 บาทต่อการเข้างาน');
    expect(f[7].a).toContain('4,500 บาท');
    expect(f[9].a).toContain('ติดผนัง - ·');
    expect(faqList(null, 5000)[5].a).toContain('5,000 บาท');
  });
  it('VRV / VRF goes to a separate inquiry', () => {
    expect(isVRF('ระบบ VRF / VRV')).toBe(true);
    expect(isVRF('ติดผนัง', null, 'vrv')).toBe(true);
    expect(isVRF('แอร์ติดผนัง')).toBe(false);
  });
  it('time estimates', () => {
    expect(timeTh([30, 60])).toBe('30–60 นาที');
    expect(timeTh([90, 150])).toBe('1.5–2.5 ชม.');
    expect(timeTh([40, 90])).toBe('40 นาที–1.5 ชม.');
    expect(timeTh([120, 240])).toBe('2–4 ชม.');
  });
  it('no banned phrase in any shared text', () => {
    const text = JSON.stringify([
      faqList(null), serviceCards(), PROCESS, CONTACT_TOPICS, VRF_NOTE, TIME_NOTE, NOTES, TRAVEL, TIER_TH, SLOTS, AC_TYPES, PKG_TH, PKG_INFO, LEVEL_TH, METHOD_INFO,
      QUICK_TYPES, CLEAN_PKGS, PRESETS, INS_LEVELS, MAT_ROWS.map(r => r.th), DECIDED, RATE_SOURCES, SMALL_VISIT, TRADE_IN, TRADE_ISSUES,
    ]);
    expect(bannedIn(text)).toEqual([]);
    expect(bannedIn(`ข้อความ ${BANNED_PHRASES[0]}`)).toEqual([BANNED_PHRASES[0]]);
    expect(text).not.toMatch(/K Copper|Type L/);
  });
});

describe('btu', () => {
  it('quick rule', () => {
    expect(recommendBtu({ w: 4, d: 3.5 })).toEqual({ area: 14, btu: 10500, pick: 12000 });
    expect(recommendBtu({ w: 4, d: 3.5, sun: 2, people: 4, use: 'office' })).toEqual({ area: 14, btu: 13400, pick: 15000 });
    expect(recommendBtu({ w: 20, d: 20 }).pick).toBe(60000);
  });
  it('room model: defaults, breakdown parts add up, floor of 6,000', () => {
    const r = ROOM_BY_ID.bedroom;
    const p = roomDefaults(r);
    expect(p).toMatchObject({ w: 4, d: 3.5, sun: 1, orient: 'E', roof: false, closed: false });
    const b = btuBreakdown(p, r);
    expect(b.items.map(x => x.k)).toEqual(['base', 'sun', 'roof', 'people', 'equip']);
    expect(b.total).toBe(Math.max(6000, Math.round(b.items.reduce((a, x) => a + x.btu, 0) / 100) * 100));
    expect(needBtu({ ...p, w: 1, d: 1 }, r)).toBe(6000);
    expect(btuBreakdown(roomDefaults(ROOM_BY_ID.server), ROOM_BY_ID.server).items.map(x => x.k)).toEqual(['base', 'equip']);
  });
  it('units per type', () => {
    expect(recommendUnits(12000, 14, 'wall')).toEqual({ n: 1, per: 12000, total: 12000, project: false });
    expect(recommendUnits(100000, 140, 'wall')).toMatchObject({ n: 4, per: 30000, project: false });
    expect(recommendUnits(300000, 500, 'ceiling').project).toBe(true);
  });
});

describe('trade-in', () => {
  it('value range by size and condition; small units do not qualify', () => {
    expect(tradeValue({ btu: 12000, issue: 'reno' })).toEqual({ lo: 900, hi: 1300, working: true, band: 'ไม่เกิน 12,000 BTU' });
    expect(tradeValue({ btu: 18000, issue: 'comp' })).toEqual({ lo: 500, hi: 1200, working: false, band: '12,001–24,000 BTU' });
    expect(tradeValue({ btu: 36000, issue: 'weak' })?.lo).toBe(2400);
    expect(tradeValue({ btu: 7000, issue: 'reno' })).toBeNull();
  });
});
