// Tests for the Google Apps Script backend (backend/google-apps-script/Code.gs). The script is plain JavaScript for the
// Apps Script V8 runtime, so it runs here unchanged in a node:vm context with small fakes of the Google services it uses
// (SpreadsheetApp, MailApp, LockService, CacheService, PropertiesService, ContentService, Utilities). The last block
// wires the website's submitRequest() to doPost() to check the whole path: "ส่งถึงทีมแล้ว" only when a row was saved.
//
// Requests at the same moment (env.parallel): Apps Script runs up to 30 executions of one web app at once. The fakes model
// the worst case: every execution starts together, so a cache read WITHOUT the script lock sees the cache as it was
// before any of them, a cache write without the lock lands only after all of them, and a sheet write lands only when
// SpreadsheetApp.flush() commits it (or when the execution ends, after the others ran). Sections under the script lock
// run one after another and see each other's writes, as LockService guarantees.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildSummary, checkStatus, submitRequest, type RequestField, type RequestKind } from './request';

const CODE = readFileSync(fileURLToPath(new URL('../../backend/google-apps-script/Code.gs', import.meta.url)), 'utf8');

const SHEET_NAME = 'คำขอ';
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/TEST-SHEET/edit';
// 2026-10-11 10:00:00 in Bangkok
const T0 = Date.UTC(2026, 9, 11, 3, 0, 0);
const MINUTE = 60_000;

type Cell = string;
type Answer = {
  ok: boolean;
  ref?: string;
  error?: string;
  duplicate?: boolean;
  service?: string;
  version?: string;
  kind?: string;
  status?: string;
  received?: string;
};
type Mail = { to: string; subject: string; body: string; name?: string; replyTo?: string; htmlBody?: string };
type TextOutput = { content: string; mime: string; getContent(): string; setMimeType(m: string): TextOutput };

/** Which execution is running, and whether writes are batched (requests at the same moment). */
type Run = { exec: number; batched: boolean; log: string[] };

/** A sheet as Code.gs sees it. `rows` keeps exactly what the script wrote (a leading apostrophe included). */
class FakeSheet {
  rows: Cell[][] = [];
  /** Batched appends not committed yet; an execution sees its own, the others do not. */
  pending: { exec: number; values: Cell[] }[] = [];
  frozenRows = 0;
  boldHeader = false;
  constructor(
    readonly name: string,
    private readonly run: Run = { exec: 0, batched: false, log: [] },
  ) {}
  private visible() {
    return [...this.rows, ...this.pending.filter(p => p.exec === this.run.exec).map(p => p.values)];
  }
  /** Commit the batched appends of one execution (SpreadsheetApp.flush) or of all (the end of the executions). */
  commit(exec?: number) {
    const keep: typeof this.pending = [];
    for (const p of this.pending) {
      if (exec === undefined || p.exec === exec) this.rows.push(p.values);
      else keep.push(p);
    }
    this.pending = keep;
  }
  getLastRow() {
    return this.visible().length;
  }
  appendRow(values: unknown[]) {
    const row = values.map(v => String(v));
    this.run.log.push('append');
    if (this.run.batched) this.pending.push({ exec: this.run.exec, values: row });
    else this.rows.push(row);
    return this;
  }
  getRange(row: number, col: number, numRows = 1, numCols = 1) {
    const range = {
      // what Sheets returns: the apostrophe is a "this is text" prefix, not part of the value
      getValues: () => this.visible().slice(row - 1, row - 1 + numRows).map(r => r.slice(col - 1, col - 1 + numCols).map(shown)),
      setFontWeight: (w: string) => {
        if (row === 1) this.boldHeader = w === 'bold';
        return range;
      },
    };
    return range;
  }
  setFrozenRows(n: number) {
    this.frozenRows = n;
  }
  getSheetId() {
    return 987;
  }
}

/** The value Sheets shows for what the script wrote. */
const shown = (v: Cell) => v.replace(/^'/, '');

type Env = ReturnType<typeof makeEnv>;

function makeEnv(opts: { notifyEmail?: string | null; quota?: number; lockFree?: boolean } = {}) {
  const clock = { now: T0 };
  const sheets = new Map<string, FakeSheet>();
  const mails: Mail[] = [];
  const logs: string[] = [];
  const cacheData = new Map<string, { value: string; expires: number }>();
  /** Requests at the same moment: the cache as it was when they started (what unlocked reads see), and the writes made
   *  without the lock (they land after all of them). */
  let startCache = new Map<string, { value: string; expires: number }>();
  const lateCache: [string, { value: string; expires: number }][] = [];
  const props: Record<string, string> = {};
  if (opts.notifyEmail !== null) props.NOTIFY_EMAIL = opts.notifyEmail ?? 'team@sbp.example';
  const state = {
    quota: opts.quota ?? 100,
    lockFree: opts.lockFree ?? true,
    lockHeld: false,
    locks: 0,
    releases: 0,
    mailError: false,
    sheetError: false,
    flushError: false,
  };
  const run: Run = { exec: 0, batched: false, log: [] };

  const spreadsheet = {
    getSheetByName: (name: string) => sheets.get(name) ?? null,
    insertSheet: (name: string) => {
      const s = new FakeSheet(name, run);
      sheets.set(name, s);
      return s;
    },
    getUrl: () => SHEET_URL,
  };

  const services = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => {
        if (state.sheetError) throw new Error('Service Spreadsheets failed');
        return spreadsheet;
      },
      flush: () => {
        run.log.push('flush');
        if (state.flushError) throw new Error('Service Spreadsheets failed while accessing document');
        for (const s of sheets.values()) s.commit(run.exec);
      },
    },
    MailApp: {
      sendEmail: (m: Mail) => {
        run.log.push('mail');
        if (state.mailError) throw new Error('Service invoked too many times for one day: email.');
        mails.push(m);
      },
      getRemainingDailyQuota: () => state.quota,
    },
    LockService: {
      getScriptLock: () => ({
        tryLock: () => {
          if (state.lockFree) {
            state.locks++;
            state.lockHeld = true;
            run.log.push('lock');
          }
          return state.lockFree;
        },
        releaseLock: () => {
          state.releases++;
          state.lockHeld = false;
          run.log.push('release');
        },
      }),
    },
    CacheService: {
      getScriptCache: () => ({
        get: (k: string) => {
          const e = (run.batched && !state.lockHeld ? startCache : cacheData).get(k);
          return e && e.expires > clock.now ? e.value : null;
        },
        put: (k: string, value: string, seconds: number) => {
          const entry = { value, expires: clock.now + seconds * 1000 };
          if (run.batched && !state.lockHeld) lateCache.push([k, entry]);
          else cacheData.set(k, entry);
        },
      }),
    },
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (k: string) => props[k] ?? null }),
    },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (content: string): TextOutput => ({
        content,
        mime: 'text/plain',
        getContent() {
          return this.content;
        },
        setMimeType(m: string) {
          this.mime = m;
          return this;
        },
      }),
    },
    Utilities: {
      formatDate: (d: Date, tz: string, fmt: string) => {
        if (fmt !== 'yyyy-MM-dd HH:mm:ss') throw new Error(`unexpected format ${fmt}`);
        const p = Object.fromEntries(
          new Intl.DateTimeFormat('en-GB', {
            timeZone: tz,
            hourCycle: 'h23',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
            .formatToParts(d)
            .map(x => [x.type, x.value]),
        );
        return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}`;
      },
    },
    console: {
      log: (...a: unknown[]) => logs.push(a.join(' ')),
      info: (...a: unknown[]) => logs.push(a.join(' ')),
      warn: (...a: unknown[]) => logs.push(a.join(' ')),
      error: (...a: unknown[]) => logs.push(a.join(' ')),
    },
  };

  const ctx = vm.createContext({ ...services });
  vm.runInContext(CODE, ctx, { filename: 'Code.gs' });
  ctx.nowMs_ = () => clock.now; // the script reads the time through nowMs_()

  const output = (out: TextOutput): Answer => {
    expect(out.mime).toBe('application/json');
    return JSON.parse(out.getContent());
  };
  let execSeq = 0;
  const postRaw = (contents: string | undefined): Answer => {
    run.exec = ++execSeq;
    try {
      return output(ctx.doPost(contents === undefined ? {} : { postData: { contents, type: 'text/plain', length: contents.length }, parameter: {} }));
    } finally {
      run.exec = 0;
    }
  };
  const post = (body: unknown) => postRaw(JSON.stringify(body));
  /** These requests arrive at the same moment (see the top of this file); afterwards every write has landed. */
  const parallel = (bodies: unknown[]): Answer[] => {
    run.batched = true;
    startCache = new Map(cacheData);
    try {
      return bodies.map(post);
    } finally {
      run.batched = false;
      for (const s of sheets.values()) s.commit();
      for (const [k, e] of lateCache.splice(0)) cacheData.set(k, e);
    }
  };
  const get = (parameter: Record<string, string> = {}): Answer => output(ctx.doGet({ parameter }));
  const sheet = () => sheets.get(SHEET_NAME);
  /** Data rows (the header excluded). */
  const rows = () => (sheet()?.rows ?? []).slice(1);

  return { clock, sheets, mails, logs, props, state, run, spreadsheet, cacheData, post, postRaw, parallel, get, sheet, rows };
}

// --- requests as the website sends them (labels from ContactForm.tsx and RequestSection.tsx) ---------------------

let refSeq = 0;
/** A fresh valid reference number. */
const nextRef = () => `SBP-691011-${(refSeq++).toString(36).toUpperCase().padStart(4, '0')}`;

const BOOKING_FIELDS: RequestField[] = [
  ['ชื่อ / บริษัท', 'สมชาย ใจดี'],
  ['โทร', '0812345678'],
  ['LINE ID', 'somchai.j'],
  ['อีเมล', 'somchai@example.com'],
  ['ใบกำกับภาษีในนาม', ''],
  ['ที่อยู่หน้างาน', 'คอนโดลุมพินี ซอยสุขุมวิท 101'],
  ['วันที่สะดวก', 'พฤ. 15 ต.ค. 69 (2026-10-15)'],
  ['ช่วงเวลา', 'ช่วงเช้า'],
  ['สภาพหน้างาน', 'ไม่มีที่จอดรถ'],
  ['หมายเหตุ', 'มีแมว'],
];
const QUOTE_EXTRA = [
  'รายการ (ราคาก่อน VAT)',
  '[ล้างแอร์]',
  'ล้างแอร์ติดผนัง 9,000–12,000 BTU × 2 ฿1,200',
  '',
  'พื้นที่หน้างาน: บางนา (ระยะถนนประมาณ 12 กม.) · โซนใกล้',
  'รวมรายการ: ฿1,200',
  'ยอดก่อน VAT: ฿1,200',
  'VAT 7%: ฿84',
  'รวมทั้งสิ้น: ฿1,284 (รวม VAT)',
];
const CONTACT_FIELDS: RequestField[] = [
  ['เรื่อง', 'ล้างแอร์'],
  ['ชื่อ / บริษัท', 'บริษัท ตัวอย่าง จำกัด'],
  ['โทร', '024593299'],
  ['LINE ID', ''],
  ['อีเมล', ''],
  ['สะดวกให้ติดต่อ', 'ช่วงบ่าย'],
  ['พื้นที่หน้างาน', 'บางพลี สมุทรปราการ'],
  ['รายละเอียด', 'ห้องประชุม 4 เครื่อง'],
];

/** The JSON body submitRequest() posts. */
function body(kind: RequestKind, ref: string, fields: RequestField[], extra: string[] = []) {
  return {
    kind,
    ref,
    fields: Object.fromEntries(fields),
    text: buildSummary(kind, ref, fields, extra),
    _subject: `${kind === 'booking' ? 'จองคิวงาน' : kind === 'quote' ? 'ขอใบเสนอราคา' : 'ติดต่อทีม'} ${ref}`,
  };
}
const booking = (ref = nextRef()) => body('booking', ref, BOOKING_FIELDS, QUOTE_EXTRA);
const contact = (ref = nextRef()) => body('contact', ref, CONTACT_FIELDS);

const HEADERS = [
  'เวลาที่ได้รับ',
  'เลขอ้างอิง',
  'ประเภท',
  'ชื่อ / บริษัท',
  'โทร',
  'อีเมล',
  'LINE ID',
  'พื้นที่ / ที่อยู่หน้างาน',
  'วัน / ช่วงเวลาที่สะดวก',
  'ยอดประมาณการ',
  'สถานะ',
  'รายละเอียดทั้งหมด',
];

let env: Env;
beforeEach(() => {
  env = makeEnv();
});

describe('doGet', () => {
  it('answers a health check without data', () => {
    expect(env.get()).toEqual({ ok: true, service: 'sbp-requests', version: expect.stringMatching(/^\d+\.\d+\.\d+$/) });
    expect(env.sheet()).toBeUndefined();
  });
});

describe('doGet: status look-up', () => {
  const NOT_FOUND = 'ไม่พบคำขอนี้ ตรวจเลขอ้างอิงและเบอร์โทร 4 ตัวท้ายอีกครั้ง';

  it('answers the status of a saved request when the reference and the last 4 phone digits match, and nothing personal', () => {
    const ref = nextRef();
    env.post(booking(ref));
    const a = env.get({ ref, tel: '5678' });
    expect(a).toEqual({ ok: true, ref, kind: 'จองคิวงาน', status: 'ใหม่', received: '2026-10-11 10:00' });
    expect(JSON.stringify(a)).not.toMatch(/สมชาย|0812345678|ลุมพินี/);
  });

  it('accepts a reference typed in lower case with spaces, and shows the status the team typed', () => {
    const ref = nextRef();
    env.post(contact(ref));
    env.sheet()!.rows[1][10] = 'นัดหมายแล้ว';
    expect(env.get({ ref: ` ${ref.toLowerCase()} `, tel: '3299' })).toMatchObject({ ok: true, ref, status: 'นัดหมายแล้ว' });
  });

  it('gives the same answer for a wrong phone and an unknown reference', () => {
    const ref = nextRef();
    env.post(booking(ref));
    expect(env.get({ ref, tel: '0000' })).toEqual({ ok: false, error: NOT_FOUND });
    expect(env.get({ ref: nextRef(), tel: '5678' })).toEqual({ ok: false, error: NOT_FOUND });
  });

  it('answers not found before any request was saved, and rejects malformed input without reading the sheet', () => {
    expect(env.get({ ref: nextRef(), tel: '5678' })).toEqual({ ok: false, error: NOT_FOUND });
    expect(env.get({ ref: 'R1', tel: '5678' }).ok).toBe(false);
    expect(env.get({ ref: nextRef(), tel: '12' }).ok).toBe(false);
    expect(env.sheet()).toBeUndefined();
  });

  it('limits look-ups per minute for the whole site', () => {
    const ref = nextRef();
    env.post(booking(ref));
    for (let i = 0; i < 30; i++) env.get({ ref, tel: '0000' });
    expect(env.get({ ref, tel: '5678' }).error).toMatch(/ลองใหม่ในอีก 1 นาที/);
    env.clock.now += 61_000;
    expect(env.get({ ref, tel: '5678' }).ok).toBe(true);
  });

  it('answers ok:false (never throws) when the spreadsheet fails', () => {
    env.state.sheetError = true;
    expect(env.get({ ref: nextRef(), tel: '5678' })).toEqual({ ok: false, error: 'ระบบรับคำขอขัดข้องชั่วคราว' });
  });
});

describe('doPost: a valid request', () => {
  it('creates the sheet with a header row and appends one row with the right columns', () => {
    const b = booking('SBP-691011-K7Q2');
    expect(env.post(b)).toEqual({ ok: true, ref: 'SBP-691011-K7Q2' });

    const sheet = env.sheet()!;
    expect(sheet.rows[0]).toEqual(HEADERS);
    expect(sheet.boldHeader).toBe(true);
    expect(sheet.frozenRows).toBe(1);
    expect(env.rows()).toHaveLength(1);
    expect(env.rows()[0].map(shown)).toEqual([
      '2026-10-11 10:00:00',
      'SBP-691011-K7Q2',
      'จองคิวงาน',
      'สมชาย ใจดี',
      '0812345678',
      'somchai@example.com',
      'somchai.j',
      'คอนโดลุมพินี ซอยสุขุมวิท 101 · บางนา (ระยะถนนประมาณ 12 กม.) · โซนใกล้',
      'พฤ. 15 ต.ค. 69 (2026-10-15) · ช่วงเช้า',
      '฿1,284 (รวม VAT)',
      'ใหม่',
      b.text,
    ]);
  });

  it('keeps values that start with a digit as text (phone keeps its leading 0, time stays Bangkok time)', () => {
    env.post(booking());
    const row = env.rows()[0];
    expect(row[0]).toBe("'2026-10-11 10:00:00");
    expect(row[4]).toBe("'0812345678");
  });

  it('maps the contact form labels and keeps the topic and message in the full text', () => {
    const b = contact();
    expect(env.post(b).ok).toBe(true);
    const row = env.rows()[0].map(shown);
    expect(row.slice(2, 11)).toEqual(['ติดต่อทีม', 'บริษัท ตัวอย่าง จำกัด', '024593299', '', '', 'บางพลี สมุทรปราการ', 'ช่วงบ่าย', '', 'ใหม่']);
    expect(row[11]).toBe(b.text);
    expect(row[11]).toContain('เรื่อง: ล้างแอร์');
    expect(row[11]).toContain('รายละเอียด: ห้องประชุม 4 เครื่อง');
  });

  it('adds fields that have no column and are not in the text to the full text, once', () => {
    const b = { ...contact(), text: 'ติดต่อทีม · SBP AirCare\nเรื่อง: ล้างแอร์', fields: { ...contact().fields, 'ช่องทางที่รู้จัก': 'Facebook' } };
    env.post(b);
    const text = shown(env.rows()[0][11]);
    expect(text).toContain('ช่องทางที่รู้จัก: Facebook');
    expect(text).toContain('รายละเอียด: ห้องประชุม 4 เครื่อง');
    expect(text.match(/เรื่อง: ล้างแอร์/g)).toHaveLength(1); // already in the text → not repeated
    expect(text).not.toContain('โทร:'); // has its own column
  });

  it('builds the full text from the fields when another client sends no text', () => {
    const b = { kind: 'quote', ref: nextRef(), fields: { 'ชื่อ / บริษัท': 'ก', โทร: '0811111111', หมายเหตุ: 'ขอราคา' } };
    expect(env.post(b).ok).toBe(true);
    expect(shown(env.rows()[0][11])).toBe('หมายเหตุ: ขอราคา');
    expect(env.rows()[0][2]).toBe('ขอใบเสนอราคา');
  });

  it('appends under an existing sheet without a second header', () => {
    env.post(booking());
    env.post(contact());
    expect(env.sheet()!.rows).toHaveLength(3);
    expect(env.sheet()!.rows.filter(r => r[0] === 'เวลาที่ได้รับ')).toHaveLength(1);
  });

  it('takes the lock for the append and always releases it', () => {
    env.post(booking());
    expect(env.state.locks).toBe(1);
    expect(env.state.releases).toBe(1);
  });
});

describe('doPost: spreadsheet formula injection', () => {
  it('prefixes = + - @ tab and CR with an apostrophe in every column', () => {
    const fields = {
      'ชื่อ / บริษัท': '=HYPERLINK("https://evil.example","คลิก")',
      โทร: '+66812345678',
      'LINE ID': '@SUM(A1:A9)',
      อีเมล: '-2+3',
      'ที่อยู่หน้างาน': '\t=1+1',
      หมายเหตุ: '\r=IMPORTXML("https://evil.example","//a")',
    };
    const b = { kind: 'contact', ref: nextRef(), fields, text: '=cmd|" /C calc"!A0' };
    expect(env.post(b).ok).toBe(true);
    const row = env.rows()[0];
    expect(row[3]).toBe(`'=HYPERLINK("https://evil.example","คลิก")`);
    expect(row[4]).toBe("'+66812345678");
    expect(row[5]).toBe("'-2+3");
    expect(row[6]).toBe("'@SUM(A1:A9)");
    expect(row[7]).toBe("'=1+1"); // trimmed, then prefixed
    expect(row[11].startsWith("'=cmd")).toBe(true);
    for (const cell of row) expect(cell).not.toMatch(/^[=+\-@\t\r]/);
  });

  it('also guards the columns built from the summary text and the date fields (H, I, J)', () => {
    const fields = { 'ชื่อ / บริษัท': 'ก', วันที่สะดวก: '=NOW()', ช่วงเวลา: 'เช้า' };
    const text = 'ขอใบเสนอราคา\nพื้นที่หน้างาน: +IMAGE("https://evil.example/p.png")\nรวมทั้งสิ้น: -1+1';
    expect(env.post({ kind: 'quote', ref: nextRef(), fields, text }).ok).toBe(true);
    const row = env.rows()[0];
    expect(row.slice(7, 10)).toEqual(["'+IMAGE(\"https://evil.example/p.png\")", "'=NOW() · เช้า", "'-1+1"]);
    for (const cell of row) expect(cell).not.toMatch(/^[=+\-@\t\r]/);
  });
});

describe('doPost: rejected requests add no row', () => {
  const rejects = (b: unknown, error?: string | RegExp) => {
    const a = env.post(b);
    expect(a.ok).toBe(false);
    expect(a.error).toMatch(error ?? /[฀-๿]/); // a Thai message
    expect(env.rows()).toHaveLength(0);
    expect(env.mails).toHaveLength(0);
  };

  it('rejects a filled honeypot (top level or in fields) and accepts an empty one', () => {
    rejects({ ...booking(), website: 'https://spam.example' });
    rejects({ ...booking(), fields: { ...booking().fields, website: 'https://spam.example' } });
    rejects({ ...booking(), fields: { ...booking().fields, 'company-site': 'x' } });
    expect(env.post({ ...booking(), website: '', fields: { ...booking().fields, website: ' ' } }).ok).toBe(true);
    expect(env.rows()[0].join('\n')).not.toContain('website');
  });

  it('rejects an unknown or missing kind', () => {
    rejects({ ...booking(), kind: 'order' }, 'ประเภทคำขอไม่ถูกต้อง');
    rejects({ ...booking(), kind: 'constructor' }, 'ประเภทคำขอไม่ถูกต้อง');
    const { kind: _drop, ...noKind } = booking();
    void _drop;
    rejects(noKind, 'ประเภทคำขอไม่ถูกต้อง');
  });

  it('rejects a reference number that is not SBP-yymmdd-XXXX', () => {
    for (const ref of ['SBP-1', 'sbp-691011-ab12', 'SBP-691011-AB1', 'SBP-691011-AB12 ', 'X SBP-691011-AB12', '', 691011]) {
      rejects({ ...booking(), ref }, 'เลขอ้างอิงไม่ถูกต้อง');
    }
  });

  it('rejects fields that are not a flat object of short strings', () => {
    rejects({ ...booking(), fields: undefined });
    rejects({ ...booking(), fields: [['ชื่อ', 'ก']] });
    rejects({ ...booking(), fields: { ชื่อ: { first: 'ก' } } });
    rejects({ ...booking(), fields: { ชื่อ: 42 } });
    rejects({ ...booking(), fields: { ชื่อ: null } });
    rejects({ ...booking(), fields: { ชื่อ: true } });
    rejects({ ...booking(), fields: { ชื่อ: ['ก'] } });
    rejects({ ...booking(), fields: { ชื่อ: 'ก'.repeat(2001) } });
    rejects({ ...booking(), fields: { ['ช'.repeat(101)]: 'ก' } });
    rejects({ ...booking(), fields: Object.fromEntries(Array.from({ length: 41 }, (_, i) => [`f${i}`, 'x'])) });
    // JSON.parse makes "__proto__" an own key: an object there is rejected like any other, and nothing is polluted
    const proto = JSON.stringify(booking()).replace('"fields":{', '"fields":{"__proto__":{"polluted":"x"},');
    expect(env.postRaw(proto)).toEqual({ ok: false, error: 'ข้อมูลในฟอร์มไม่ถูกต้องหรือยาวเกินไป' });
  });

  it('rejects text over 8,000 characters and a body over 20,000', () => {
    rejects({ ...booking(), text: 'ก'.repeat(8001) }, 'สรุปคำขอยาวเกินกำหนด');
    expect(env.post({ ...booking(), text: 'ก'.repeat(8000) }).ok).toBe(true);
    env.sheet()!.rows.length = 1; // back to the header only

    const big = JSON.stringify({ ...booking(), padding: 'x'.repeat(20000) });
    const a = env.postRaw(big);
    expect(a).toEqual({ ok: false, error: 'คำขอมีข้อมูลยาวเกินกำหนด' });
    expect(env.rows()).toHaveLength(0);
  });

  it('rejects deeply nested JSON as a bot without crashing into the internal-error path', () => {
    const deep = (n: number) => '['.repeat(n) + ']'.repeat(n);
    const b = JSON.stringify(booking());
    for (const raw of [`{"website":${deep(9000)},${b.slice(1)}`, b.replace('"fields":{', `"fields":{"website":${deep(9000)},`)]) {
      expect(raw.length).toBeLessThan(20000);
      expect(env.postRaw(raw)).toEqual({ ok: false, error: 'ระบบไม่รับคำขอนี้' });
    }
    expect(env.logs).toEqual([]);
    expect(env.rows()).toHaveLength(0);
  });

  it('rejects a body that is not a JSON object', () => {
    for (const raw of ['', 'kind=contact&ref=SBP-691011-AB12', '[1,2]', 'null', '"text"', '{"kind":']) {
      expect(env.postRaw(raw)).toEqual({ ok: false, error: 'รูปแบบคำขอไม่ถูกต้อง' });
    }
    expect(env.postRaw(undefined).ok).toBe(false); // no postData at all
    expect(env.sheet()).toBeUndefined();
  });
});

describe('doPost: duplicates (idempotent retries)', () => {
  it('answers ok for the same ref within 10 minutes without a second row or e-mail', () => {
    const b = booking();
    expect(env.post(b)).toEqual({ ok: true, ref: b.ref });
    env.clock.now += 9 * MINUTE;
    expect(env.post(b)).toEqual({ ok: true, ref: b.ref, duplicate: true });
    expect(env.rows()).toHaveLength(1);
    expect(env.mails).toHaveLength(1);
  });

  it('still finds the duplicate in the sheet when the cache entry is gone', () => {
    const b = booking();
    env.post(b);
    env.cacheData.clear();
    env.clock.now += 5 * MINUTE;
    expect(env.post(b).duplicate).toBe(true);
    expect(env.rows()).toHaveLength(1);
  });

  it('finds the duplicate through the cache when the row is no longer among the last sheet rows', () => {
    const b = booking();
    env.post(b);
    // staff sorted the sheet or many rows came in: the first row is out of the scanned tail
    for (let i = 0; i < 60; i++) env.sheet()!.appendRow(["'2026-10-11 10:00:00", `SBP-691011-Z${String(i).padStart(3, '0')}`]);
    env.clock.now += 2 * MINUTE;
    expect(env.post(b).duplicate).toBe(true);
    expect(env.rows()).toHaveLength(61);
  });

  it('adds a new row for the same ref after 10 minutes', () => {
    const b = booking();
    env.post(b);
    env.clock.now += 10 * MINUTE + 1000;
    expect(env.post(b)).toEqual({ ok: true, ref: b.ref });
    expect(env.rows()).toHaveLength(2);
  });
});

describe('doPost: abuse limit', () => {
  it('answers ok:false in Thai after 20 requests in one minute, and accepts again the next minute', () => {
    for (let i = 0; i < 20; i++) expect(env.post(contact()).ok).toBe(true);
    const a = env.post(contact());
    expect(a.ok).toBe(false);
    expect(a.error).toContain('ลองใหม่');
    expect(env.rows()).toHaveLength(20);

    env.clock.now += MINUTE;
    expect(env.post(contact()).ok).toBe(true);
    expect(env.rows()).toHaveLength(21);
  });

  it('turns requests away without queuing for the lock once the minute is full', () => {
    for (let i = 0; i < 20; i++) env.post(contact());
    const locks = env.state.locks;
    expect(env.post(contact()).ok).toBe(false);
    expect(env.state.locks).toBe(locks);
  });

  it('holds at 20 saved requests when 30 arrive at the same moment', () => {
    const answers = env.parallel(Array.from({ length: 30 }, () => contact()));
    expect(answers.filter(a => a.ok)).toHaveLength(20);
    expect(answers.filter(a => !a.ok).map(a => a.error)).toEqual(Array(10).fill(expect.stringContaining('ลองใหม่')));
    expect(env.rows()).toHaveLength(20);
    expect(env.mails).toHaveLength(20);
  });

  it('does not let junk use up the limit: rejected requests never lock real customers out', () => {
    for (let i = 0; i < 100; i++) env.postRaw(i % 2 ? 'x' : JSON.stringify({ ...contact(), kind: 'spam' }));
    expect(env.post(contact()).ok).toBe(true);
    expect(env.rows()).toHaveLength(1);
  });
});

describe('doPost: e-mail to the team', () => {
  it('sends one plain-text e-mail to NOTIFY_EMAIL with the subject, the summary and the sheet link', () => {
    const b = booking();
    env.post(b);
    expect(env.mails).toHaveLength(1);
    const m = env.mails[0];
    expect(m.to).toBe('team@sbp.example');
    expect(m.subject).toBe(b._subject);
    expect(m.body).toContain(b.ref);
    expect(m.body).toContain(b.text);
    expect(m.body).toContain(`${SHEET_URL}#gid=987`);
    expect(m.htmlBody).toBeUndefined();
    expect(m.replyTo).toBe('somchai@example.com');
  });

  it('sends nothing when NOTIFY_EMAIL is not set, and the row is saved', () => {
    env = makeEnv({ notifyEmail: null });
    expect(env.post(booking()).ok).toBe(true);
    expect(env.mails).toHaveLength(0);
    expect(env.rows()).toHaveLength(1);
  });

  it('keeps the request when the daily mail quota is used up or sending fails', () => {
    env = makeEnv({ quota: 0 });
    expect(env.post(booking()).ok).toBe(true);
    expect(env.mails).toHaveLength(0);

    env = makeEnv();
    env.state.mailError = true;
    expect(env.post(booking()).ok).toBe(true);
    expect(env.rows()).toHaveLength(1);
  });

  it('builds the subject itself from the kind and the reference: a sender cannot choose it', () => {
    const subjects = [undefined, 'บัญชี Google ของคุณถูกระงับ ยืนยันที่ https://evil.example', 'ติดต่อทีม\r\nBcc: x@evil.example', 42];
    for (const _subject of subjects) {
      const b = { ...contact(), _subject };
      env.post(b);
      expect(env.mails.at(-1)!.subject).toBe(`ติดต่อทีม ${b.ref}`);
    }
    expect(env.mails).toHaveLength(subjects.length);
  });

  it('sets no Reply-To when the customer gave no valid e-mail (one plain address, nothing else)', () => {
    const emails = ['', 'somchai', 'a@b.co\r\nBcc: x@evil.example', 'a@b.co,x@evil.example', 'Somchai <a@b.co>', 'a@b.co x@evil.example'];
    for (const อีเมล of emails) env.post({ ...contact(), fields: { ...contact().fields, อีเมล } });
    expect(env.mails.map(m => m.replyTo)).toEqual(emails.map(() => undefined));
  });
});

describe('doPost: service problems', () => {
  it('answers busy when the lock cannot be taken', () => {
    env = makeEnv({ lockFree: false });
    expect(env.post(booking())).toEqual({ ok: false, error: 'ระบบรับคำขอไม่ว่างชั่วคราว ลองใหม่อีกครั้ง' });
    expect(env.sheet()).toBeUndefined();
  });

  it('answers ok:false (never throws) when the spreadsheet fails', () => {
    env.state.sheetError = true;
    expect(env.post(booking())).toEqual({ ok: false, error: 'ระบบรับคำขอขัดข้องชั่วคราว' });
  });

  it('commits the row (SpreadsheetApp.flush) before releasing the lock, and e-mails after', () => {
    env.post(booking());
    expect(env.run.log).toEqual(['lock', 'append', 'append', 'flush', 'release', 'mail']); // header row + request row
  });

  it('writes one header row when the first two requests arrive at the same moment', () => {
    const answers = env.parallel([booking(), contact()]);
    expect(answers.map(a => a.ok)).toEqual([true, true]);
    expect(env.sheet()!.rows.map(r => r[0] === 'เวลาที่ได้รับ')).toEqual([true, false, false]);
  });

  it('answers ok:false and sends no e-mail when the row cannot be committed', () => {
    env.state.flushError = true;
    expect(env.post(booking())).toEqual({ ok: false, error: 'ระบบรับคำขอขัดข้องชั่วคราว' });
    expect(env.mails).toHaveLength(0);
    expect(env.state.releases).toBe(env.state.locks);
  });
});

describe('Code.gs permissions', () => {
  it('asks only for this spreadsheet (@OnlyCurrentDoc), not every spreadsheet of the account', () => {
    // without the annotation Apps Script requests the full "spreadsheets" scope for SpreadsheetApp
    expect(CODE).toMatch(/^\/\*\* @OnlyCurrentDoc \*\/$/m);
  });
});

describe('website → Apps Script', () => {
  /** fetch that hands the request to doPost and answers what ContentService produced (200, like Apps Script). */
  const viaScript = (e: Env) =>
    (async (_url: string, init: RequestInit) => {
      const a = e.postRaw(String(init.body));
      return new Response(JSON.stringify(a), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;
  const endpoint = 'https://script.google.com/macros/s/AKfy-test/exec';

  it('says sent only when the script saved the row', async () => {
    const ref = nextRef();
    const text = buildSummary('booking', ref, BOOKING_FIELDS, QUOTE_EXTRA);
    const r = await submitRequest('booking', ref, BOOKING_FIELDS, text, { endpoint, fetchImpl: viaScript(env) });
    expect(r).toEqual({ status: 'sent', ref });
    expect(env.rows()).toHaveLength(1);
    expect(env.rows()[0][1]).toBe(ref);
    expect(env.mails[0].subject).toBe(`จองคิวงาน ${ref}`);
  });

  it('does not say sent when a redirect turned the POST into a GET (http:// URL or a short link reaches doGet)', async () => {
    // a 301/302 hop before Google changes POST to GET and drops the body, so the script runs doGet, not doPost
    const viaGetHop = (e: Env) =>
      (async () => {
        const res = new Response(JSON.stringify(e.get()), { status: 200, headers: { 'Content-Type': 'application/json' } });
        Object.defineProperty(res, 'url', { value: 'https://script.googleusercontent.com/macros/echo?user_content_key=k' });
        return res;
      }) as unknown as typeof fetch;
    for (const url of ['http://script.google.com/macros/s/AKfy-test/exec', 'https://short.example/sbp']) {
      const r = await submitRequest('contact', nextRef(), CONTACT_FIELDS, 't', { endpoint: url, fetchImpl: viaGetHop(env) });
      expect(r.status).toBe('failed');
    }
    expect(env.rows()).toHaveLength(0);
  });

  it('shows the script’s Thai message when it rejects the request', async () => {
    const r = await submitRequest('contact', 'R1', CONTACT_FIELDS, 't', { endpoint, fetchImpl: viaScript(env) });
    expect(r).toEqual({ status: 'failed', ref: 'R1', reason: 'เลขอ้างอิงไม่ถูกต้อง' });
    expect(env.rows()).toHaveLength(0);
  });
});

describe('website status page → Apps Script', () => {
  const endpoint = 'https://script.google.com/macros/s/AKfy-test/exec';
  /** fetch that hands the query to doGet and answers what ContentService produced. */
  const viaScript = (e: Env) =>
    (async (url: string) => {
      const q = Object.fromEntries(new URL(url).searchParams);
      return new Response(JSON.stringify(e.get(q)), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }) as unknown as typeof fetch;

  it('shows the status of a request that was sent from the website', async () => {
    const ref = nextRef();
    await submitRequest('booking', ref, BOOKING_FIELDS, 't', {
      endpoint,
      fetchImpl: (async (_u: string, init: RequestInit) =>
        new Response(JSON.stringify(env.postRaw(String(init.body))), { status: 200 })) as unknown as typeof fetch,
    });
    const r = await checkStatus(ref, '5678', { endpoint, fetchImpl: viaScript(env) });
    expect(r).toEqual({ status: 'found', ref, kind: 'จองคิวงาน', state: 'ใหม่', received: '2026-10-11 10:00' });
  });

  it('shows the script’s message when nothing matches, and never reads a health check as a status', async () => {
    expect(await checkStatus(nextRef(), '5678', { endpoint, fetchImpl: viaScript(env) })).toEqual({
      status: 'notFound',
      reason: 'ไม่พบคำขอนี้ ตรวจเลขอ้างอิงและเบอร์โทร 4 ตัวท้ายอีกครั้ง',
    });
    const health = (async () => new Response(JSON.stringify(env.get()), { status: 200 })) as unknown as typeof fetch;
    expect((await checkStatus(nextRef(), '5678', { endpoint, fetchImpl: health })).status).toBe('failed');
  });

  it('is unconfigured without an endpoint and fails softly when the network does', async () => {
    expect(await checkStatus('SBP-691011-AAAA', '5678', { endpoint: '' })).toEqual({ status: 'unconfigured' });
    const down = (async () => {
      throw new TypeError('Failed to fetch');
    }) as unknown as typeof fetch;
    expect(await checkStatus('SBP-691011-AAAA', '5678', { endpoint, fetchImpl: down })).toEqual({ status: 'failed', reason: 'เชื่อมต่อระบบไม่ได้' });
  });
});
