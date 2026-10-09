import { describe, expect, it } from 'vitest';
import { addDays, bkkNow, dateHint, DAY_MIN, earliestNormal, fitOf, isOpen, judge, QUEUE_CONFIRM_TH, QUEUE_URL, visitTime } from './queue';

describe('queue rules (injected clock)', () => {
  it('Bangkok date from any instant', () => {
    expect(bkkNow(new Date('2026-10-09T16:59:00Z'))).toEqual({ date: '2026-10-09', min: 23 * 60 + 59 });
    expect(bkkNow(new Date('2026-10-09T17:00:00Z'))).toEqual({ date: '2026-10-10', min: 0 });
  });
  it('normal booking ≥ 3 days ahead, Sunday → Monday', () => {
    expect(earliestNormal({ date: '2026-10-05', min: 600 })).toBe('2026-10-08'); // Mon → Thu
    expect(earliestNormal({ date: '2026-10-08', min: 600 })).toBe('2026-10-12'); // Thu → Sun → Mon
    expect(earliestNormal({ date: '2026-10-09', min: 600 })).toBe('2026-10-12'); // Fri → Mon
    expect(earliestNormal({ date: '2026-10-10', min: 600 })).toBe('2026-10-13'); // Sat → Tue
    expect(isOpen('2026-10-11')).toBe(false);
    expect(addDays('2026-02-28', 1)).toBe('2026-03-01');
  });
  it('rush window, past dates, Sunday = closed', () => {
    const now = { date: '2026-10-09', min: 600 };
    expect(judge('', [], 'C1', now)).toMatchObject({ kind: 'none', rush: false, slots: [] });
    expect(judge('2026-10-08', [], 'C1', now).kind).toBe('past');
    expect(judge('2026-10-10', [], 'C1', now)).toMatchObject({ kind: 'rush', rush: true, closed: false });
    expect(judge('2026-10-11', [], 'C1', now)).toMatchObject({ kind: 'rush', closed: true });
    expect(judge('2026-10-12', [], 'C1', now)).toMatchObject({ kind: 'normal', rush: false });
  });
  it('same day: after noon only the afternoon; too long → late', () => {
    expect(judge('2026-10-09', [{ t: 'wall', qty: 2 }], 'C1', { date: '2026-10-09', min: 13 * 60 })).toMatchObject({ slots: ['pm'], late: false, sameDay: true });
    expect(judge('2026-10-09', [{ t: 'wall', qty: 6 }], 'C1', { date: '2026-10-09', min: 13 * 60 })).toMatchObject({ slots: [], late: true });
    expect(judge('2026-10-09', [{ t: 'wall', qty: 2 }], 'C1', { date: '2026-10-09', min: 9 * 60 }).slots).toEqual(['am', 'pm']);
  });
  it('visit time and how it fits the day', () => {
    expect(visitTime([{ t: 'wall', qty: 2 }, { t: 'cassette', qty: 1 }], 'C1')).toEqual([100, 210, 0]);
    expect(visitTime([{ t: 'duct', qty: 2 }], 'C1')).toEqual([0, 0, 2]);
    expect(visitTime([{ t: 'wall', qty: 1, level: 'repair' }])).toEqual([0, 0, 0]);
    expect(fitOf([0, 0])).toEqual({ kind: 'half', days: 0.5, unknown: true });
    expect(fitOf([0, DAY_MIN / 2])).toEqual({ kind: 'half', days: 0.5 });
    expect(fitOf([0, DAY_MIN])).toEqual({ kind: 'day', days: 1 });
    expect(fitOf([0, DAY_MIN * 2 + 1])).toEqual({ kind: 'days', days: 3 });
  });
  it('no live queue: the team confirms; date hint wording', () => {
    expect(QUEUE_URL).toBe('');
    expect(QUEUE_CONFIRM_TH).toBe('ทีมยืนยันคิว');
    const now = { date: '2026-10-09', min: 600 };
    expect(dateHint('2026-10-10', false, now)).toEqual({ text: 'วันนี้อยู่ในช่วงคิวด่วน (+฿500 ก่อน VAT ต่อการเข้างาน ถ้ามีคิวว่าง) ทีมยืนยันกับคุณก่อน', warn: true });
    expect(dateHint('2026-10-11', true, now).text).toMatch(/วันอาทิตย์เป็นงานนอกเวลา มีค่าใช้จ่ายเพิ่มเติม$/);
    expect(dateHint('2026-10-12', false, now)).toEqual({ text: 'จองปกติ · ทีมยืนยันคิวและเวลาเข้างาน', warn: false });
  });
});
