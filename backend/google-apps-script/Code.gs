/**
 * SBP AirCare — request inbox for the website (Google Apps Script web app).
 *
 * Container-bound script: create it from the Google Sheet that should hold the requests
 * (Extensions → Apps Script), paste this file, deploy as a Web app (Execute as: Me · Who has access: Anyone).
 * Step-by-step guide in Thai: backend/README.md.
 *
 * Permissions: the @OnlyCurrentDoc line below limits the script to THIS spreadsheet (scope spreadsheets.currentonly)
 * plus sending e-mail. Keep it: every request from the internet runs as the owner's account ("Execute as: Me"), and
 * without it Apps Script asks for every spreadsheet in that account.
 *
 * What it does
 *  - doPost(e): the website (src/lib/request.ts → submitRequest) POSTs one request as JSON with the
 *    Content-Type "text/plain;charset=utf-8" (a CORS "simple request", so the browser sends no preflight):
 *      { kind: 'contact'|'quote'|'booking', ref: 'SBP-691009-K7Q2', fields: { label: value }, text, _subject }
 *    (_subject is ignored: the e-mail subject is built here from kind + ref, so a sender cannot choose it.)
 *    The request is checked, appended as one row to the sheet "คำขอ" (created with a header row when missing),
 *    and the team gets a plain-text e-mail when the Script Property NOTIFY_EMAIL is set.
 *  - doGet(e): health check, {"ok":true,"service":"sbp-requests","version":"…"} — open the /exec URL in a browser.
 *
 * Answer: always JSON, {ok:true, ref} or {ok:false, error:'<Thai message>'}. Apps Script cannot set HTTP status codes,
 * so the website reads the body: it says "ส่งถึงทีมแล้ว" only for ok:true and shows the Thai error with the
 * hand-off (LINE · phone · copy · e-mail) otherwise.
 *
 * Safety
 *  - Size limits (whole body, summary text, every field) and strict shapes for kind and ref.
 *  - Honeypot: the forms have a hidden field people never fill ('website', 'company-site'); a filled one is a bot.
 *    (The website already drops those itself, so this only catches scripts that copy the form fields.)
 *  - Spreadsheet formula injection: a value starting with = + - @ tab or CR is stored with a leading apostrophe
 *    (Sheets' "this is text" prefix, not shown in the cell), so it can never run as a formula.
 *  - Idempotent retries: the same ref within 10 minutes adds no second row and still answers ok.
 *  - Abuse limit: at most RATE_LIMIT_PER_MINUTE saved requests per minute for the whole site. The counter is read and
 *    written under the script lock, so requests arriving together cannot all see the same count; rejected requests do
 *    not count, so junk cannot lock real customers out.
 *  - LockService around the duplicate check, the count and the append; the row is committed (SpreadsheetApp.flush)
 *    before the lock is released, so the next request sees it.
 *
 * Plain JavaScript for the Apps Script V8 runtime; no libraries. Functions ending in "_" are private helpers
 * (Apps Script hides them from the Run menu and they can never be called from outside).
 */

/** @OnlyCurrentDoc */

var VERSION = '1.0.0';
var SERVICE = 'sbp-requests';

var SHEET_NAME = 'คำขอ';
var TIME_ZONE = 'Asia/Bangkok';
/** Text timestamp: sorts correctly, reads the same in every spreadsheet time zone. */
var TIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';

var MAX_BODY_CHARS = 20000;
var MAX_TEXT_CHARS = 8000;
var MAX_FIELDS = 40;
var MAX_LABEL_CHARS = 100;
var MAX_VALUE_CHARS = 2000;

var DUPLICATE_WINDOW_SECONDS = 600; // 10 minutes
var DUPLICATE_SCAN_ROWS = 50; // also look at the last rows of the sheet in case the cache entry was evicted
var RATE_LIMIT_PER_MINUTE = 20;
var LOCK_WAIT_MS = 10000;

var REF_PATTERN = /^SBP-\d{6}-[0-9A-Z]{4}$/;
var EMAIL_PATTERN = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]{2,}$/;
/** Hidden form fields that only bots fill. */
var HONEYPOT_NAMES = ['website', 'company-site', '_gotcha'];

/** Same words as the website (src/lib/request.ts KIND_TH). */
var KIND_TH = { contact: 'ติดต่อทีม', quote: 'ขอใบเสนอราคา', booking: 'จองคิวงาน' };
var STATUS_NEW = 'ใหม่';

var HEADERS = [
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

/**
 * Field labels the website sends (src/components/contact/ContactForm.tsx and src/components/quote/RequestSection.tsx,
 * which also carries every booking). Each key is a sheet column; a field with one of these labels fills that column.
 * Every other field (เรื่อง, ใบกำกับภาษีในนาม, สภาพหน้างาน, หมายเหตุ, รายละเอียด …) goes to "รายละเอียดทั้งหมด".
 */
var FIELD_LABELS = {
  name: ['ชื่อ / บริษัท', 'ชื่อ'],
  phone: ['โทร', 'เบอร์โทร'],
  email: ['อีเมล'],
  line: ['LINE ID'],
  address: ['ที่อยู่หน้างาน'], // quote / booking: the address the customer typed
  area: ['พื้นที่หน้างาน'], // contact form: the area chosen on the area checker
  date: ['วันที่สะดวก'], // quote / booking
  slot: ['ช่วงเวลา'], // quote / booking
  callTime: ['สะดวกให้ติดต่อ'], // contact form: when to call back
  total: ['ยอดประมาณการ'],
};
/** Quote and booking requests carry the area and the total inside the summary text (quoteTextLines). */
var TEXT_AREA_PREFIX = 'พื้นที่หน้างาน:';
var TEXT_TOTAL_PREFIX = 'รวมทั้งสิ้น:';
var AREA_NOT_CHOSEN = 'ยังไม่ได้เลือก';

/** Thai messages the website shows next to the hand-off when a request is not accepted. */
var MSG = {
  tooBig: 'คำขอมีข้อมูลยาวเกินกำหนด',
  badFormat: 'รูปแบบคำขอไม่ถูกต้อง',
  badKind: 'ประเภทคำขอไม่ถูกต้อง',
  badRef: 'เลขอ้างอิงไม่ถูกต้อง',
  badFields: 'ข้อมูลในฟอร์มไม่ถูกต้องหรือยาวเกินไป',
  textTooLong: 'สรุปคำขอยาวเกินกำหนด',
  rejected: 'ระบบไม่รับคำขอนี้',
  rateLimited: 'ขณะนี้มีคำขอเข้ามามาก ระบบรับเพิ่มไม่ได้ชั่วคราว ลองใหม่ในอีก 1 นาที',
  busy: 'ระบบรับคำขอไม่ว่างชั่วคราว ลองใหม่อีกครั้ง',
  internal: 'ระบบรับคำขอขัดข้องชั่วคราว',
};

// ---------------------------------------------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------------------------------------------

/** Health check: open the /exec URL in a browser to see that the deployment works. Shows no data. */
function doGet(e) {
  return json_({ ok: true, service: SERVICE, version: VERSION });
}

/** One request from the website. Never throws: every outcome is a JSON answer. */
function doPost(e) {
  try {
    var raw = e && e.postData && typeof e.postData.contents === 'string' ? e.postData.contents : '';
    if (raw.length > MAX_BODY_CHARS) return fail_(MSG.tooBig);

    var cache = CacheService.getScriptCache();
    var nowMs = nowMs_();
    var rateKey = rateKey_(nowMs);
    // quick look without the lock: while the minute is full, a flood is turned away before it queues for the lock
    if (savedThisMinute_(cache, rateKey) >= RATE_LIMIT_PER_MINUTE) return fail_(MSG.rateLimited);

    var checked = parseRequest_(raw);
    if (checked.error) return fail_(checked.error);
    var req = checked.request;

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var lock = LockService.getScriptLock();
    if (!lock.tryLock(LOCK_WAIT_MS)) return fail_(MSG.busy);
    var sheet, row;
    try {
      sheet = requestSheet_(ss);
      if (isDuplicate_(sheet, cache, req.ref, nowMs)) {
        // a retry of a request that is already in the sheet: keep one row, tell the website it arrived
        return json_({ ok: true, ref: req.ref, duplicate: true });
      }
      // the exact count, under the lock: requests arriving at the same moment cannot all read the same number
      var saved = savedThisMinute_(cache, rateKey);
      if (saved >= RATE_LIMIT_PER_MINUTE) return fail_(MSG.rateLimited);
      row = buildRow_(req, nowMs);
      sheet.appendRow(row.map(cell_));
      // commit while the lock is held (LockService docs): the next request then sees this row, and a write that fails
      // fails here, before the website is told the request arrived
      SpreadsheetApp.flush();
      cache.put(rateKey, String(saved + 1), 120);
      cache.put(refKey_(req.ref), '1', DUPLICATE_WINDOW_SECONDS);
    } finally {
      lock.releaseLock();
    }

    // the row is saved: a failed e-mail (quota, bad address) must not turn this into an error for the customer
    try {
      notifyTeam_(ss, sheet, req, row);
    } catch (mailErr) {
      console.error('Notification e-mail failed for ' + req.ref + ': ' + mailErr);
    }
    return json_({ ok: true, ref: req.ref });
  } catch (err) {
    console.error('doPost failed: ' + (err && err.stack ? err.stack : err));
    return fail_(MSG.internal);
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Checking the request
// ---------------------------------------------------------------------------------------------------------------

/** Parse and validate the body. Returns {request} or {error: '<Thai message>'}. */
function parseRequest_(raw) {
  if (!raw) return { error: MSG.badFormat };
  var body;
  try {
    body = JSON.parse(raw);
  } catch (parseErr) {
    return { error: MSG.badFormat };
  }
  if (!isPlainObject_(body)) return { error: MSG.badFormat };

  var fields = body.fields;
  if (!isPlainObject_(fields)) return { error: MSG.badFields };
  if (honeypotFilled_(body) || honeypotFilled_(fields)) return { error: MSG.rejected };

  if (typeof body.kind !== 'string' || !Object.prototype.hasOwnProperty.call(KIND_TH, body.kind)) return { error: MSG.badKind };
  if (typeof body.ref !== 'string' || !REF_PATTERN.test(body.ref)) return { error: MSG.badRef };

  var labels = Object.keys(fields);
  if (labels.length > MAX_FIELDS) return { error: MSG.badFields };
  var clean = {};
  for (var i = 0; i < labels.length; i++) {
    var label = labels[i];
    var value = fields[label];
    // flat: every value is a short string (no nested objects, arrays or numbers)
    if (!label || label.length > MAX_LABEL_CHARS || typeof value !== 'string' || value.length > MAX_VALUE_CHARS) {
      return { error: MSG.badFields };
    }
    if (HONEYPOT_NAMES.indexOf(label) === -1) clean[label] = value.trim();
  }

  if (body.text != null && typeof body.text !== 'string') return { error: MSG.badFormat };
  var text = body.text ? String(body.text) : '';
  if (text.length > MAX_TEXT_CHARS) return { error: MSG.textTooLong };

  // the subject is ours, never the sender's (the website sends the same words as _subject; other senders cannot choose it)
  var subject = KIND_TH[body.kind] + ' ' + body.ref;

  return { request: { kind: body.kind, ref: body.ref, fields: clean, text: text.trim(), subject: subject } };
}

function isPlainObject_(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

/**
 * True when any honeypot name holds something (a person never sees these fields). Anything but an empty string counts,
 * and the value is never turned into text: String() on a deeply nested array would overflow the stack.
 */
function honeypotFilled_(obj) {
  for (var i = 0; i < HONEYPOT_NAMES.length; i++) {
    var v = obj[HONEYPOT_NAMES[i]];
    if (v != null && (typeof v !== 'string' || v.trim() !== '')) return true;
  }
  return false;
}

// ---------------------------------------------------------------------------------------------------------------
// Abuse limit and duplicates
// ---------------------------------------------------------------------------------------------------------------

/** Cache key of the saved-request counter for the current minute. */
function rateKey_(nowMs) {
  return 'rate:' + Math.floor(nowMs / 60000);
}

/** Requests saved so far in this minute (written under the script lock only, in doPost). */
function savedThisMinute_(cache, key) {
  return Number(cache.get(key)) || 0;
}

function refKey_(ref) {
  return 'ref:' + ref;
}

/** Same ref received within DUPLICATE_WINDOW_SECONDS? Checks the cache first, then the last rows of the sheet. */
function isDuplicate_(sheet, cache, ref, nowMs) {
  if (cache.get(refKey_(ref))) return true;
  var last = sheet.getLastRow();
  if (last < 2) return false;
  var count = Math.min(DUPLICATE_SCAN_ROWS, last - 1);
  var rows = sheet.getRange(last - count + 1, 1, count, 2).getValues(); // [time, ref]
  for (var i = rows.length - 1; i >= 0; i--) {
    if (String(rows[i][1]).replace(/^'/, '') !== ref) continue;
    var at = timeMs_(rows[i][0]);
    if (!isNaN(at) && nowMs - at < DUPLICATE_WINDOW_SECONDS * 1000) return true;
  }
  return false;
}

/** Received-time cell → epoch ms (the cell holds Bangkok time as text; a Date also works). NaN when unreadable. */
function timeMs_(v) {
  if (v && typeof v.getTime === 'function') return v.getTime();
  var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(String(v).replace(/^'/, ''));
  if (!m) return NaN;
  // Asia/Bangkok is UTC+7 all year (no daylight saving)
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5], +m[6]);
}

// ---------------------------------------------------------------------------------------------------------------
// The sheet
// ---------------------------------------------------------------------------------------------------------------

/** The sheet "คำขอ"; created with a bold, frozen header row when it does not exist (or is empty). */
function requestSheet_(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

/** One row in HEADERS order (raw values; cell_ makes them safe when written). */
function buildRow_(req, nowMs) {
  var f = req.fields;
  var pick = function (key) {
    var labels = FIELD_LABELS[key];
    for (var i = 0; i < labels.length; i++) {
      if (f[labels[i]]) return f[labels[i]];
    }
    return '';
  };
  var textArea = textValue_(req.text, TEXT_AREA_PREFIX);
  if (textArea === AREA_NOT_CHOSEN) textArea = '';
  var area = joinDistinct_([pick('address'), pick('area') || textArea], ' · ');
  var when = joinDistinct_([pick('date'), pick('slot'), pick('callTime')], ' · ');
  var total = pick('total') || textValue_(req.text, TEXT_TOTAL_PREFIX);

  return [
    Utilities.formatDate(new Date(nowMs), TIME_ZONE, TIME_FORMAT),
    req.ref,
    KIND_TH[req.kind],
    pick('name'),
    pick('phone'),
    pick('email'),
    pick('line'),
    area,
    when,
    total,
    STATUS_NEW,
    detailText_(req),
  ];
}

/** The full summary text, plus every field that has no column of its own and is not already in the text. */
function detailText_(req) {
  var mapped = {};
  Object.keys(FIELD_LABELS).forEach(function (key) {
    FIELD_LABELS[key].forEach(function (label) {
      mapped[label] = true;
    });
  });
  var extra = [];
  Object.keys(req.fields).forEach(function (label) {
    var value = req.fields[label];
    if (!value || mapped[label]) return;
    var line = label + ': ' + value;
    if (req.text.indexOf(line) === -1) extra.push(line);
  });
  if (!req.text) return extra.join('\n');
  return extra.length ? req.text + '\n\n' + extra.join('\n') : req.text;
}

/** Value of the first "prefix value" line in the summary text ('' when absent). */
function textValue_(text, prefix) {
  var lines = String(text || '').split('\n');
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf(prefix) === 0) return lines[i].slice(prefix.length).trim();
  }
  return '';
}

function joinDistinct_(parts, sep) {
  var out = [];
  parts.forEach(function (p) {
    if (p && out.indexOf(p) === -1) out.push(p);
  });
  return out.join(sep);
}

/**
 * Make one value safe for a cell. A leading apostrophe is Sheets' "this is text" prefix (it is not shown):
 *  - = + - @ tab CR at the start could make Sheets run the value as a formula (formula injection) → apostrophe;
 *  - a value starting with a digit would be re-typed by Sheets (phone 0812345678 loses its 0, a time becomes a date
 *    in the spreadsheet's own time zone) → apostrophe, so the cell keeps exactly what was received.
 */
function cell_(v) {
  var s = v == null ? '' : String(v);
  return /^[=+\-@\t\r0-9]/.test(s) ? "'" + s : s;
}

// ---------------------------------------------------------------------------------------------------------------
// E-mail to the team
// ---------------------------------------------------------------------------------------------------------------

/**
 * Plain-text e-mail to Script Property NOTIFY_EMAIL (one address, or several separated by commas).
 * Skipped when the property is not set or today's MailApp quota is used up (the row is in the sheet either way).
 * Reply-To is the customer's e-mail when they gave a valid one, so "Reply" answers the customer.
 */
function notifyTeam_(ss, sheet, req, row) {
  var to = String(PropertiesService.getScriptProperties().getProperty('NOTIFY_EMAIL') || '').trim();
  if (!to) return false;
  if (MailApp.getRemainingDailyQuota() < 1) {
    console.warn('MailApp daily quota used up: no e-mail for ' + req.ref);
    return false;
  }
  var link = ss.getUrl() + '#gid=' + sheet.getSheetId();
  var body = [
    'คำขอใหม่จากเว็บไซต์ · เลขอ้างอิง ' + req.ref,
    'ได้รับเมื่อ ' + row[0] + ' (เวลาไทย)',
    '',
    row[11],
    '',
    'เปิดชีตคำขอ: ' + link,
  ].join('\n');
  var message = { to: to, subject: req.subject, body: body, name: 'เว็บไซต์ SBP AirCare' };
  var customer = req.fields[FIELD_LABELS.email[0]] || '';
  if (EMAIL_PATTERN.test(customer)) message.replyTo = customer;
  MailApp.sendEmail(message);
  return true;
}

// ---------------------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------------------

function nowMs_() {
  return Date.now();
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function fail_(message) {
  return json_({ ok: false, error: message });
}
