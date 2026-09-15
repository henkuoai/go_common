/* Captures the top strip of every page at viewport resolution, so the
   navigation and trust bar can be eyeballed at their real size.
   Run:  node shot-top.mjs                                              */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const DEV = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(DEV);
const OUT = path.join(DEV, 'test-assets');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

function loadPlaywright() {
  const bases = [process.env.PW_ROOT, path.join(DEV, 'package.json'),
    'C:/Users/Administrator/.workbuddy/binaries/node/workspace/package.json'].filter(Boolean);
  const tried = [];
  for (const base of bases) {
    try { return createRequire(base)('playwright-core'); }
    catch (e) { tried.push('  ' + base + '  (' + (e.code || e.message) + ')'); }
  }
  console.error('Could not resolve playwright-core. Tried:\n' + tried.join('\n'));
  process.exit(1);
}
const { chromium } = loadPlaywright();

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let f = path.join(ROOT, rel.replace(/^\//, ''));
  if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
  if (!fs.existsSync(f) || !fs.statSync(f).isFile()) { res.writeHead(404); res.end(''); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' });
  res.end(fs.readFileSync(f));
});
await new Promise((r) => server.listen(8813, '127.0.0.1', r));

const browser = await chromium.launch({
  executablePath: CHROME,
  headless: true, args: ['--no-sandbox'],
});

const TARGETS = [
  ['/', 'hub', null],
  ['/heic-to-jpg/', 'heic', 'sample2.heic'],
  ['/webp-to-png/', 'webp', 'big.webp'],
  ['/avif-to-jpg/', 'avif', 'big.avif'],
  // One entry per added language, plus a localized tool page so the switcher
  // and the translated engine UI are both captured at real size.
  ['/zh/', 'zh-hub', null],
  ['/ja/', 'ja-hub', null],
  ['/ko/', 'ko-hub', null],
  ['/zh/heic-to-jpg/', 'zh-heic', 'sample2.heic'],
];

for (const [url, name, sample] of TARGETS) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 560 }, acceptDownloads: true });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8813' + url, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  if (sample) {
    // Fixtures live beside this script (OUT), not at the site root — the
    // earlier ROOT reference made every sample injection an ENOENT.
    await page.setInputFiles('#picker', path.join(OUT, sample));
    /* Locale-safe settle. Matching /decoding|optimizing/i works on the English
       pages and silently no-ops on /zh/, /ja/ and /ko/ — the wait falls through
       to the timeout and the screenshot is taken mid-conversion. Poll instead
       for the status line to stop changing, which is language-independent. */
    await page.waitForFunction(() => {
      const w = window;
      const sig = [...document.querySelectorAll('.item .sub')].map((x) => x.innerText).join('|');
      if (!sig) return false;
      if (!w.__settle) w.__settle = { sig: null, n: 0 };
      if (w.__settle.sig === sig) w.__settle.n++; else { w.__settle.sig = sig; w.__settle.n = 1; }
      return w.__settle.n >= 3;
    }, null, { timeout: 120000, polling: 250 }).catch(() => {});
    await page.waitForTimeout(1000);
  }
  await page.screenshot({ path: path.join(OUT, `top-${name}.png`) });

  // Report the trust-bar geometry rather than relying on the eye alone.
  const geo = await page.evaluate(() => {
    const bar = document.querySelector('.trustbar');
    const pill = document.getElementById('netpill');
    if (!bar) return { bar: false };
    const br = bar.getBoundingClientRect();
    const pr = pill ? pill.getBoundingClientRect() : null;
    return {
      barHeight: Math.round(br.height),
      pillText: pill ? pill.innerText.replace(/\s+/g, ' ').trim() : null,
      pillOverflowRight: pr ? Math.round(pr.right - br.right) : null,
      pillWraps: pr ? pr.height > 30 : null,
      navItems: [...document.querySelectorAll('.sitenav ul a')].map((a) => a.textContent.trim()),
      // The switcher is the thing under test on this pass: which language is
      // marked current, and where each of the four links actually points.
      langLinks: [...document.querySelectorAll('.langsw a')].map(
        (a) => a.textContent.trim() + '->' + a.getAttribute('href') + (a.getAttribute('aria-current') ? ' *' : '')
      ),
    };
  });
  console.log(name.padEnd(6), JSON.stringify(geo));
  await ctx.close();
}

await browser.close();
server.close();
