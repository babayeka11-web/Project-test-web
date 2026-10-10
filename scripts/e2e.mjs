// End-to-end check of the main customer flows on a running site (static build or dev server).
// usage: node scripts/e2e.mjs [baseUrl=http://localhost:3120]   — exits 1 when a step fails.
// Uses the Playwright + Chromium pre-installed on this machine (never run `playwright install`).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:3120').replace(/\/$/, '');
const results = [];
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

async function step(name, fn, viewport = { width: 1366, height: 900 }) {
  const ctx = await browser.newContext({ viewport, locale: 'th-TH', timezoneId: 'Asia/Bangkok' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e).slice(0, 160)));
  page.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) errors.push(m.text().slice(0, 160)); });
  try {
    const note = await fn(page);
    results.push({ name, ok: errors.length === 0, note: note || '', errors });
  } catch (e) {
    results.push({ name, ok: false, note: String(e).split('\n')[0].slice(0, 220), errors });
  }
  await ctx.close();
}
const count = async page => (await page.locator('header').getByRole('link', { name: /ใบเสนอราคา/ }).first().innerText()).replace(/\s+/g, ' ').trim();

await step('home: quick booking → quote request → honest hand-off', async page => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  await page.locator('#book').scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'เพิ่มจำนวนแอร์ติดผนัง' }).click();
  await page.getByRole('button', { name: 'เพิ่มจำนวนแอร์ติดผนัง' }).click();
  const summary = page.getByRole('complementary', { name: 'สรุปราคาจอง' });
  const total = await summary.innerText();
  if (!/฿[\d,]+/.test(total)) throw new Error('no total in the booking summary');
  await page.getByRole('button', { name: /จองล้างแอร์ · กรอกชื่อและเบอร์/ }).click();
  await page.waitForURL(/\/quote\/?#request/, { timeout: 20000 });
  await page.waitForTimeout(800);
  const body = await page.locator('main').innerText();
  if (!/ล้าง/.test(body)) throw new Error('quote page shows no cleaning line');
  await page.locator('input[name="name"]').fill('ทดสอบ ระบบ');
  await page.locator('input[name="tel"]').fill('0812345678');
  await page.getByRole('button', { name: /ส่งคำขอ/ }).first().click();
  await page.waitForTimeout(800);
  const after = await page.locator('main').innerText();
  if (!/SBP-\d{6}-[0-9A-Z]{4}/.test(after)) throw new Error('no reference number after submit');
  if (/ส่งถึงทีมแล้ว/.test(after)) throw new Error('claims "sent" without an endpoint');
  return `booking total seen; ref ${after.match(/SBP-\d{6}-[0-9A-Z]{4}/)[0]}; header ${await count(page)}`;
});

await step('catalog: search daikin 18000 → model page → add to quote', async page => {
  await page.goto(`${BASE}/products/`, { waitUntil: 'networkidle' });
  const search = page.getByRole('searchbox').or(page.locator('input[type="search"]')).first();
  await search.fill('daikin 18000');
  await page.waitForTimeout(600);
  const txt = await page.locator('main').innerText();
  const m = txt.match(/(\d+) ซีรีส์ · (\d+) รุ่น · ราคาก่อน VAT/);
  if (!m || +m[1] >= 136) throw new Error(`search did not narrow the series (${m ? m[0] : 'no count'})`);
  await page.goto(`${BASE}/products/aux-me-series/asw-09-dim-1s/`, { waitUntil: 'networkidle' });
  const before = await count(page);
  await page.getByRole('button', { name: /ใส่ใบเสนอราคา/ }).first().click();
  await page.waitForTimeout(500);
  const after = await count(page);
  if (before === after) throw new Error(`header count did not change (${before})`);
  return `search result: ${m ? m[0] : '?'}; header ${before.trim()} → ${after.trim()}`;
});

await step('repair: symptom → result → add', async page => {
  await page.goto(`${BASE}/repair/`, { waitUntil: 'networkidle' });
  const first = page.locator('#symptoms button, [id*="symptom"] button').first();
  await first.click();
  await page.waitForTimeout(500);
  const txt = await page.locator('main').innerText();
  return `after picking a symptom: ${/น่าจะ|จุดที่|สาเหตุ/.test(txt) ? 'result text shown' : 'no result keywords'}`;
});

await step('prices: tabs + search + add', async page => {
  await page.goto(`${BASE}/prices/?tab=repair`, { waitUntil: 'networkidle' });
  const tabs = await page.getByRole('tab').count();
  const before = await count(page);
  await page.getByRole('button', { name: /ใส่ใบเสนอราคา|เพิ่ม/ }).first().click();
  await page.waitForTimeout(500);
  return `tabs ${tabs}; header ${before.trim()} → ${(await count(page)).trim()}`;
});

await step('business: contract → add to quote', async page => {
  await page.goto(`${BASE}/business/`, { waitUntil: 'networkidle' });
  const before = await count(page);
  await page.getByRole('button', { name: /ใส่ใบเสนอราคา/ }).first().click();
  await page.waitForTimeout(500);
  return `header ${before.trim()} → ${(await count(page)).trim()}`;
});

await step('area: example place → zone', async page => {
  await page.goto(`${BASE}/area/`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'ศรีราชา' }).first().click();
  await page.waitForTimeout(1500);
  const txt = await page.locator('main').innerText();
  return /ค่าเดินทาง|กม\./.test(txt) ? 'zone shown' : 'no zone text';
});

await step('contact: validation + hand-off', async page => {
  await page.goto(`${BASE}/contact/?topic=vrf`, { waitUntil: 'networkidle' });
  const form = page.locator('form').filter({ has: page.locator('input[name="tel"]') }).first();
  await form.getByRole('button', { name: /ส่ง/ }).first().click();
  await page.waitForTimeout(300);
  const errs = await form.locator('[id$="-error"]').count();
  await form.locator('input[name="name"]').fill('ทดสอบ');
  await form.locator('input[name="tel"]').fill('021234567');
  await form.locator('textarea').first().fill('สอบถามระบบ VRV สำหรับอาคาร 5 ชั้น');
  await form.getByRole('button', { name: /ส่ง/ }).first().click();
  await page.waitForTimeout(800);
  const txt = await page.locator('main').innerText();
  if (!/SBP-\d{6}/.test(txt)) throw new Error('no reference number');
  return `errors on empty submit: ${errs}; hand-off shown`;
});

await step('knowledge: BTU calculator → products link keeps matching sizes', async page => {
  await page.goto(`${BASE}/knowledge/`, { waitUntil: 'networkidle' });
  await page.getByLabel('กว้าง (ม.)').fill('4');
  await page.getByLabel('ยาว (ม.)').fill('5');
  await page.waitForTimeout(400);
  const link = page.getByRole('link', { name: /ดูแอร์ขนาดนี้/ }).first();
  const href = await link.getAttribute('href');
  if (!/btu=b\d/.test(href || '')) throw new Error(`no BTU band in the link (${href})`);
  await link.click();
  await page.waitForURL(/\/products\/\?/, { timeout: 20000 });
  await page.waitForTimeout(600);
  const m = (await page.locator('main').innerText()).match(/(\d+) ซีรีส์ · (\d+) รุ่น/);
  if (!m || +m[2] === 0) throw new Error(`no models for ${href}`);
  return `${href} → ${m[0]}`;
});

await step('phone: home renders without overflow', async page => {
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
  const ov = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (ov > 0) throw new Error(`overflow ${ov}px`);
  return 'ok';
}, { width: 390, height: 844 });

await browser.close();
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name} — ${r.note}${r.errors.length ? ' · errors: ' + r.errors.join(' | ') : ''}`);
process.exit(results.every(r => r.ok) ? 0 : 1);
