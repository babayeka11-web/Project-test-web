// Screenshot a page of the running site: node scripts/shot.mjs <url> <out.png> [width=1366] [height=900] [full=0]
// Uses the Playwright + Chromium that are pre-installed on this machine (never run `playwright install`).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');
const [url, out, w = '1366', h = '900', full = '0'] = process.argv.slice(2);
if (!url || !out) { console.error('usage: node scripts/shot.mjs <url> <out.png> [width] [height] [full]'); process.exit(1); }
const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: +w, height: +h } });
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
await page.waitForTimeout(1500);
const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await page.screenshot({ path: out, fullPage: full === '1', timeout: 120000 });
console.log(JSON.stringify({ out, overflowPx: overflow, errors }));
await browser.close();
