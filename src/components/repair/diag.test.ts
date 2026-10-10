import { describe, expect, it } from 'vitest';
import { bannedIn } from '@/lib/domain/content';
import { getRepairItems } from '@/lib/domain/pricebook';
import {
  CAUSES,
  SYMPTOMS,
  diagLine,
  diagnose,
  isSymptomId,
  jobsFor,
  matchSymptoms,
  questionsFor,
  relatedJobs,
  shortCause,
  symptom,
  type Answers,
  type RepairRow,
} from './diag';
import { groupOf, groupRows, matchRow, toCheckerRows, toListRows } from './rows';

const real = (): RepairRow[] => toCheckerRows(toListRows(getRepairItems()));

/** Every combination of answers (including "not answered") for a symptom's questions. */
function allAnswers(id: string): Answers[] {
  const s = symptom(id);
  if (!s) return [];
  let combos: Answers[] = [{}];
  for (const q of questionsFor(s)) {
    combos = combos.flatMap(c => [c, ...q.opts.map(o => ({ ...c, [q.id]: o[0] }))]);
  }
  return combos;
}

describe('symptom data', () => {
  it('has the 14 symptoms of the reference, each with a hint, safe checks and base causes', () => {
    expect(SYMPTOMS).toHaveLength(14);
    for (const s of SYMPTOMS) {
      expect(s.short.length).toBeGreaterThan(0);
      expect(s.hint.length).toBeGreaterThan(0);
      expect(s.diy.length).toBeGreaterThan(0);
      expect(s.base.length).toBeGreaterThan(0);
      s.base.forEach(c => expect(CAUSES[c], `${s.id} → ${c}`).toBeDefined());
      s.q.forEach(q => q.opts.forEach(o => Object.keys(o[2]).forEach(c => expect(CAUSES[c as keyof typeof CAUSES], `${s.id}.${q.id} → ${c}`).toBeDefined())));
      expect(isSymptomId(s.id)).toBe(true);
    }
  });

  it('uses no banned phrase and never names Type L / K Copper', () => {
    const text = JSON.stringify([CAUSES, SYMPTOMS]);
    expect(bannedIn(text)).toEqual([]);
    expect(text).not.toMatch(/Type L|K Copper/);
  });

  it('never tells the customer to open electrical parts', () => {
    const diy = SYMPTOMS.flatMap(s => s.diy).join('\n');
    expect(diy).not.toMatch(/เปิดฝาครอบ(?!แผง)|ถอดบอร์ด|ต่อสายไฟเอง/);
  });
});

describe('diagnose', () => {
  it('every symptom diagnoses without throwing, with and without answers', () => {
    for (const s of SYMPTOMS) {
      const combos = allAnswers(s.id);
      expect(combos.length).toBeGreaterThan(0);
      for (const a of combos) {
        const d = diagnose(s.id, a, real());
        expect(d, `${s.id} ${JSON.stringify(a)}`).not.toBeNull();
        expect(d!.causes.length).toBeGreaterThan(0);
        expect(d!.summary).toContain(`อาการ: ${s.th}`);
      }
    }
  });

  it('returns null for an unknown symptom', () => {
    expect(diagnose('nope')).toBeNull();
    expect(symptom(null)).toBeNull();
    expect(isSymptomId('nope')).toBe(false);
  });

  it('lists the base causes in order when nothing is answered', () => {
    const d = diagnose('warm')!;
    expect(d.answered).toBe(false);
    expect(d.causes.map(c => c.id)).toEqual(['dirty', 'cduHeat', 'cduPower', 'gas', 'load']);
    expect(d.summary).toContain('ยังไม่ได้ตอบคำถาม');
  });

  it('answering only the AC type does not count as answered', () => {
    const d = diagnose('drip', { type: 'wall' })!;
    expect(d.answered).toBe(false);
    expect(d.type).toBe('wall');
  });

  it('answers change the ranking and unknown answers are ignored', () => {
    expect(diagnose('warm', { cdu: 'off' })!.top!.id).toBe('cduPower');
    expect(diagnose('warm', { cdu: 'hot' })!.top!.id).toBe('cduHeat');
    expect(diagnose('warm', { cdu: 'run', frost: 'yes' })!.top!.id).toBe('gas');
    expect(diagnose('warm', { last: 'old' })!.top!.id).toBe('dirty');
    expect(diagnose('drip', { out: 'none' })!.top!.id).toBe('drainClog');
    expect(diagnose('drip', { where: 'pipe' })!.top!.id).toBe('drainLine');
    expect(diagnose('drip', { where: 'vent' })!.top!.id).toBe('dirty');
    expect(diagnose('dead', { ir: 'no' })!.top!.id).toBe('remote');
    expect(diagnose('noise', { kind: 'not-an-option' })!.causes.map(c => c.id)).toEqual(['blower', 'mount', 'swing', 'comp']);
    expect(diagnose('noise', { kind: 'flap' })!.top!.id).toBe('swing');
    expect(diagnose('code', { after: 'gone' })!.top!.id).toBe('normal');
    expect(diagnose('cduwater', { ice: 'yes' })!.top!.id).toBe('gas');
  });

  it('keeps at most 4 causes once answered and fills with base causes', () => {
    const d = diagnose('warm', { cdu: 'off', frost: 'yes' })!;
    expect(d.causes.length).toBeLessThanOrEqual(4);
    expect(d.causes[0].id).toBe('cduPower');
  });

  it('drops ceiling-only causes for a wall unit and keeps them for the others', () => {
    const wall = diagnose('drip', { out: 'none', type: 'wall' })!;
    const big = diagnose('drip', { out: 'none', type: 'big' })!;
    expect(wall.causes.map(c => c.id)).not.toContain('drainPump');
    expect(big.causes.map(c => c.id)).toContain('drainPump');
    expect(big.type).toBe('big');
  });

  it('flags electrical safety', () => {
    expect(diagnose('dead', { brk: 'trip' })!.urgent).toBe(true);
    expect(diagnose('trip', { when: 'up' })!.urgent).toBe(true);
    expect(diagnose('smell', { kind: 'burn' })!.urgent).toBe(true);
    expect(diagnose('smell', { kind: 'musty' })!.urgent).toBe(false);
    expect(diagnose('warm', { cdu: 'run' })!.urgent).toBe(false);
  });

  it('marks results a cleaning job usually fixes', () => {
    expect(diagnose('smell', { kind: 'musty' })!.clean).toBe(true);
    expect(diagnose('warm', { last: 'old' })!.clean).toBe(true);
    expect(diagnose('dead', { ir: 'no' })!.clean).toBe(false);
  });

  it('writes a plain-text summary with the answers', () => {
    const d = diagnose('drip', { out: 'none', type: 'wall' })!;
    expect(d.qa).toContain('ขณะเปิดแอร์ ปลายท่อน้ำทิ้งด้านนอกมีน้ำไหลออกไหม: ไม่มีน้ำออก');
    expect(d.summary.split('\n')[0]).toBe('อาการ: น้ำหยด / น้ำไหลจากตัวเครื่องในห้อง');
    expect(d.summary).toContain('จุดที่น่าจะเป็น:');
    expect(d.summary).toContain('งานที่ช่างควรเตรียม:');
  });

  it('adds the AC-type question when a symptom has none, but not for the care topic', () => {
    expect(questionsFor(symptom('cduwater')!).map(q => q.id)).toEqual(['ice', 'type']);
    expect(questionsFor(symptom('warm')!).filter(q => q.id === 'type')).toHaveLength(1);
    expect(questionsFor(symptom('care')!)).toHaveLength(0);
  });
});

describe('matchSymptoms (free text)', () => {
  it('finds the symptom from how customers talk', () => {
    expect(matchSymptoms('แอร์น้ำหยดครับ')[0].id).toBe('drip');
    expect(matchSymptoms('แอร์ไม่เย็นเลย')[0].id).toBe('warm');
    expect(matchSymptoms('เปิดไม่ติด กดรีโมทแล้วเงียบ')[0].id).toBe('dead');
    expect(matchSymptoms('เบรกเกอร์ตัด')[0].id).toBe('trip');
    expect(matchSymptoms('มีกลิ่นอับ')[0].id).toBe('smell');
    expect(matchSymptoms('ควรล้างบ่อยแค่ไหน')[0].id).toBe('care');
  });

  it('returns nothing for empty or unrelated text and at most n results', () => {
    expect(matchSymptoms('')).toEqual([]);
    expect(matchSymptoms('   ')).toEqual([]);
    expect(matchSymptoms('xyzabc')).toEqual([]);
    expect(matchSymptoms('น้ำหยด เสียงดัง ไม่เย็น กลิ่น', 2).length).toBeLessThanOrEqual(2);
  });
});

describe('Pricebook lines', () => {
  it('every likely point with linked repair lines finds at least one real Pricebook row', () => {
    const rows = real();
    for (const [id, c] of Object.entries(CAUSES)) {
      if (!c.rep.length) continue;
      expect(jobsFor(id as keyof typeof CAUSES, rows).length, id).toBeGreaterThan(0);
    }
  });

  it('lists each line once, keeps the standard rate and null = assessed on site', () => {
    const rows: RepairRow[] = [
      { cat: 'Refrigerant', name: 'ตรวจรั่วด้วยไนโตรเจน', unit: 'ระบบ', ex: 2200 },
      { cat: 'Refrigerant', name: 'เปลี่ยน Capillary Tube / Filter Drier', unit: 'ระบบ', ex: null },
    ];
    const jobs = jobsFor('gas', rows);
    expect(jobs).toEqual([
      { name: 'ตรวจรั่วด้วยไนโตรเจน', ex: 2200, unit: 'ระบบ' },
      { name: 'เปลี่ยน Capillary Tube / Filter Drier', ex: null, unit: 'ระบบ' },
    ]);
    expect(jobsFor('dirty', rows)).toEqual([]);
  });

  it('relatedJobs takes the first two points, de-duplicated and capped', () => {
    const d = diagnose('warm', { cdu: 'off' }, real())!;
    const jobs = relatedJobs(d, 5);
    expect(jobs.length).toBeGreaterThan(0);
    expect(jobs.length).toBeLessThanOrEqual(5);
    expect(new Set(jobs.map(j => j.name)).size).toBe(jobs.length);
  });

  it('picks the diagnosis fee for the AC class from the real Pricebook', () => {
    const rows = real();
    const wall = diagLine('wall', rows)!;
    const big = diagLine('big', rows)!;
    expect(wall.name).toMatch(/ติดผนัง/);
    expect(big.name).toMatch(/แขวน|ฝังฝ้า|สี่ทิศทาง/);
    expect(big.ex!).toBeGreaterThan(wall.ex!);
    expect(diagLine(null, rows)).toBe(wall);
    expect(diagLine('wall', rows.filter(r => r.cat !== 'ตรวจวินิจฉัย'))).toBeNull();
  });

  it('shortCause trims the explanation in brackets', () => {
    expect(shortCause('คอยล์ร้อนระบายความร้อนไม่ได้ (คอยล์ร้อนสกปรก ลมร้อนวน)')).toBe('คอยล์ร้อนระบายความร้อนไม่ได้');
    expect(shortCause('คอมเพรสเซอร์')).toBe('คอมเพรสเซอร์');
  });
});

describe('repair list model', () => {
  const rows = toListRows(getRepairItems());

  it('keeps all 86 Pricebook lines with unique ids', () => {
    expect(rows).toHaveLength(getRepairItems().length);
    expect(new Set(rows.map(r => r.id)).size).toBe(rows.length);
  });

  it('never shows a number for out-of-hours work', () => {
    const ooh = rows.filter(r => r.extra);
    expect(ooh.length).toBeGreaterThan(0);
    ooh.forEach(r => expect(r.ex).toBeNull());
  });

  it('puts every line in exactly one group and the diagnosis lines first', () => {
    const grouped = groupRows(rows);
    expect(grouped.reduce((n, g) => n + g.rows.length, 0)).toBe(rows.length);
    expect(grouped[0].group.id).toBe('diag');
    expect(grouped[0].rows.some(r => r.cat === 'ตรวจวินิจฉัย')).toBe(true);
    expect(groupOf('Refrigerant/Control')).toBe('ref');
    expect(groupOf('AHU/Drainage')).toBe('ahu');
    expect(groupOf('Labor/Access')).toBe('diag');
  });

  it('searches by words in any order, ignoring spaces and slashes', () => {
    const find = (q: string) => rows.filter(r => matchRow(r, q)).map(r => r.name);
    expect(find('คาปาซิเตอร์').length).toBeGreaterThanOrEqual(2);
    expect(find('r32 เติม').some(n => /R32/.test(n) && /เติม/.test(n))).toBe(true);
    expect(find('เติม r32')).toEqual(find('r32 เติม'));
    expect(find('ปั๊มน้ำทิ้ง').length).toBeGreaterThan(0);
    expect(find('')).toHaveLength(rows.length);
    expect(find('zzzz')).toEqual([]);
  });
});
