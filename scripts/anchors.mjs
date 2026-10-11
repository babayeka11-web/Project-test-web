// Same-page anchor check: every "#…" action in the page hero (PageHeader or the home hero) must land its target just
// under the sticky header, not scroll past it.
// usage: node scripts/anchors.mjs [baseUrl=http://localhost:3120] [route …]   — exits 1 when a target lands outside
// 0–300px. Routes default to the nine pages below.
// Runs each route at 390×844 (touch phone) and 1366×900, with and without reduced motion.
// Uses the Playwright + Chromium pre-installed on this machine (never run `playwright install`).
import { createRequire } from 'node:module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const BASE = (process.argv[2] || 'http://localhost:3120').replace(/\/$/, '');
const ALL = ['/', '/cleaning/', '/installation/', '/repair/', '/products/', '/business/', '/prices/', '/area/', '/knowledge/'];
const ROUTES = process.argv.length > 3 ? process.argv.slice(3) : ALL;
const VIEWPORTS = [
  { name: '390', viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
  { name: '1366', viewport: { width: 1366, height: 900 } },
];
const MOTION = ['no-preference', 'reduce'];
const MIN = 0;
const MAX = 300;

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
const rows = [];
let failed = 0;

for (const vp of VIEWPORTS) {
  for (const reducedMotion of MOTION) {
    const ctx = await browser.newContext({ ...vp, reducedMotion, locale: 'th-TH', timezoneId: 'Asia/Bangkok' });
    const page = await ctx.newPage();
    for (const route of ROUTES) {
      try {
        await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle', timeout: 90000 });
        // the first <header> inside <main> is the page hero (PageHeader or the home hero)
        const links = page.locator('main header').first().locator('a[href^="#"]');
        const n = await links.count();
        if (n === 0) rows.push({ vp: vp.name, motion: reducedMotion, route, link: '(no # actions)', ok: true });
        for (let i = 0; i < n; i++) {
          const link = links.nth(i);
          if (!(await link.isVisible())) continue;
          const href = await link.getAttribute('href');
          const label = (await link.innerText()).replace(/\s+/g, ' ').trim();
          // start every click from the top of the page with no hash
          await page.evaluate(() => {
            history.replaceState(history.state, '', location.pathname + location.search);
            window.scrollTo({ top: 0, behavior: 'instant' });
          });
          await page.waitForTimeout(150);
          await link.click();
          await page.waitForTimeout(1500);
          // a busy main thread (3D hero on a software GPU) can slow a smooth scroll down: wait until it stops moving.
          // An overshoot still fails — it settles in the wrong place.
          await page.waitForFunction(
            () =>
              new Promise((done) => {
                const y = window.scrollY;
                setTimeout(() => done(window.scrollY === y), 250);
              }),
            null,
            { timeout: 8000, polling: 50 },
          );
          const top = await page.evaluate((h) => {
            const el = document.getElementById(decodeURIComponent(h.slice(1)));
            return el ? Math.round(el.getBoundingClientRect().top) : null;
          }, href);
          const ok = top !== null && top >= MIN && top <= MAX;
          if (!ok) failed++;
          rows.push({ vp: vp.name, motion: reducedMotion, route, link: `${label} ${href}`, top, ok });
        }
      } catch (e) {
        failed++;
        rows.push({ vp: vp.name, motion: reducedMotion, route, link: String(e).split('\n')[0].slice(0, 160), ok: false });
      }
    }
    await ctx.close();
  }
}
await browser.close();

for (const r of rows) {
  console.log(`${r.ok ? 'ok  ' : 'FAIL'} ${r.vp.padEnd(4)} ${r.motion.padEnd(13)} ${r.route.padEnd(14)} ${r.top ?? ''}\t${r.link}`);
}
console.log(failed ? `\n${failed} anchor(s) outside ${MIN}–${MAX}px` : `\nall anchors land ${MIN}–${MAX}px from the top`);
process.exit(failed ? 1 : 0);
