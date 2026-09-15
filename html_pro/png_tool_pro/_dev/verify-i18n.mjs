/* =====================================================================
   verify-i18n.mjs — the multi-language half of the verification suite.

   verify-cluster.mjs proves that an English page turns a real file into a
   structurally valid image. This script proves the same holds in 中文 /
   日本語 / 한국어, and that the four locales are wired to one another:

     1. dictionary integrity — every locale defines every key, and the
        prominent copy is translated rather than accidentally left English
     2. static page checks   — <html lang>, canonical, the full hreflang
        cluster and the nav switcher, across all 16 routes
     3. live conversion      — a real .heic through each locale's page,
        output validated at byte level, with the on-screen UI strings
        asserted to be in that locale

   Step 3 is the one that carries the weight. The engine falls back to
   English for any missing key, so a page can look completely fine while
   actually serving English to a Chinese visitor — only reading the
   rendered strings catches it.

   Usage:  node _dev/verify-i18n.mjs
   ===================================================================== */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEV = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(DEV);
const SAMPLES = path.join(DEV, 'test-assets');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 8812;

/* playwright-core normally lives outside this project, so probe the usual
   places before failing with something actionable. */
function loadPlaywright() {
  const bases = [
    process.env.PW_ROOT,
    path.join(DEV, 'package.json'),
    'C:/Users/Administrator/.workbuddy/binaries/node/workspace/package.json',
  ].filter(Boolean);
  const tried = [];
  for (const base of bases) {
    try {
      return createRequire(base)('playwright-core');
    } catch (e) {
      tried.push('  ' + base + '  (' + (e.code || e.message) + ')');
    }
  }
  console.error('Could not resolve playwright-core. Tried:\n' + tried.join('\n'));
  console.error('\nFix: run `npm i playwright-core` inside _dev/, or set PW_ROOT');
  process.exit(1);
}
const { chromium } = loadPlaywright();

const { SITE, TOOLS } = await import(pathToFileURL(path.join(DEV, 'site.mjs')).href);
const { LOCALES, UI } = await import(pathToFileURL(path.join(ROOT, 'assets', 'i18n.js')).href);

const loadPage = async (n) => (await import(pathToFileURL(path.join(DEV, 'i18n', n)).href)).default;
const PAGES = [
  await loadPage('hub.mjs'),
  await loadPage('heic.mjs'),
  await loadPage('webp.mjs'),
  await loadPage('avif.mjs'),
];

const absPath = (locale, slug) =>
  '/' + (locale.code === 'en' ? '' : locale.code + '/') + (slug ? slug + '/' : '');

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.webp': 'image/webp', '.avif': 'image/avif', '.heic': 'image/heic',
};

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  let file = path.join(ROOT, rel.replace(/^\//, ''));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
});
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const base = `http://127.0.0.1:${PORT}`;

/* ---------------- reporting ---------------- */
const report = [];
const say = (s) => { report.push(s); };
let failures = 0;
let passes = 0;
const check = (cond, label, extra = '') => {
  if (cond) passes++; else failures++;
  say(`   ${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
};
const section = (t) => {
  say('');
  say('='.repeat(70));
  say(t);
  say('='.repeat(70));
};

const jpegOk = (buf) =>
  buf[0] === 0xff && buf[1] === 0xd8 && buf[buf.length - 2] === 0xff && buf[buf.length - 1] === 0xd9;

/* =====================================================================
   1. Dictionary integrity — no browser needed, so it runs first and cheap.
   ===================================================================== */
section('DICTIONARY INTEGRITY');

for (const locale of LOCALES) {
  if (locale.code === 'en') continue;
  const mine = Object.keys(UI[locale.code]).sort();
  const en = Object.keys(UI.en).sort();
  const missing = en.filter((k) => !(k in UI[locale.code]));
  const extra = mine.filter((k) => !(k in UI.en));
  check(missing.length === 0, `engine UI ${locale.code}: no missing keys`,
    missing.length ? 'missing: ' + missing.join(', ') : '');
  check(extra.length === 0, `engine UI ${locale.code}: no stray keys`,
    extra.length ? 'extra: ' + extra.join(', ') : '');
}

/* Copy that exists only to be read by a human must actually differ from
   English. Structural values (format names, file sizes, slugs) are shared
   on purpose and are deliberately excluded. */
function mustDiffer(pg, loc, en) {
  const out = [
    ['title', loc.title, en.title],
    ['desc', loc.desc, en.desc],
    ['h1Html', loc.h1Html, en.h1Html],
    ['lede', loc.lede, en.lede],
    ['footerTagline', loc.footerTagline, en.footerTagline],
    ['related.h2', loc.related.h2, en.related.h2],
    ['related.sub', loc.related.sub, en.related.sub],
  ];
  loc.sections.forEach((s, i) => out.push([`sections[${i}].h2`, s.h2, en.sections[i].h2]));
  loc.sections.forEach((s, i) => out.push([`sections[${i}].html`, s.html, en.sections[i].html]));
  loc.related.items.forEach((it, i) => out.push([`related.items[${i}].td`, it.td, en.related.items[i].td]));
  if (loc.tool) {
    out.push(['tool.qualityHint', loc.tool.qualityHint, en.tool.qualityHint]);
    out.push(['tool.bannerGrew', loc.tool.bannerGrew, en.tool.bannerGrew]);
    out.push(['tool.reject', loc.tool.reject, en.tool.reject]);
    out.push(['tool.verifySteps[0]', loc.tool.verifySteps[0], en.tool.verifySteps[0]]);
  }
  // Only pages that actually ship a decoder worker carry these strings; the
  // WebP page has none, so its columns are empty in every language by design.
  if (loc.worker && pg.code && pg.code.workerId) {
    out.push(['worker.noImage', loc.worker.noImage, en.worker.noImage]);
  }
  return out;
}

for (const pg of PAGES) {
  const en = pg.locales.en;
  for (const locale of LOCALES) {
    if (locale.code === 'en') continue;
    const loc = pg.locales[locale.code];
    const untranslated = mustDiffer(pg, loc, en)
      .filter(([, a, b]) => a === b || a === undefined)
      .map(([k]) => k);
    check(untranslated.length === 0,
      `${pg.slug || 'hub'}/${locale.code}: copy is translated, not copied from English`,
      untranslated.length ? 'still English: ' + untranslated.join(', ') : '');
  }
}

/* =====================================================================
   2 + 3. Live browser pass.
   ===================================================================== */
const browser = await chromium.launch({
  executablePath: CHROME, headless: true, args: ['--no-sandbox'],
});

/* The engine's "busy" status line is localised, so an English-only regex
   would return instantly on a translated page and let us download the
   previous render. Busy means "contains any locale's decoding/optimizing
   word", and settling additionally requires the text to stop changing. */
const BUSY_WORDS = LOCALES
  .flatMap((l) => [UI[l.code].decoding, UI[l.code].optimizing])
  .map((s) => s.replace(/[….]+$/, '').trim())
  .filter(Boolean);

/* An exception mid-run must still produce a report — the PASS/FAIL lines
   gathered so far are the whole point of the run. */
let crashed = null;
try {
  const ctx = await browser.newContext({    acceptDownloads: true,
    viewport: { width: 1340, height: 1000 },
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));

  /* ---------------- 2. static checks, all 16 routes ---------------- */
  for (const pg of PAGES) {
    const label = pg.slug || 'hub';
    for (const locale of LOCALES) {
      const url = absPath(locale, pg.slug);
      const loc = pg.locales[locale.code];
      section(`STATIC  ${url}`);

      const res = await page.goto(base + url, { waitUntil: 'load' });
      check(res && res.status() === 200, `${url} -> 200`, 'got ' + (res ? res.status() : 'none'));
      await page.waitForTimeout(250);

      const doc = await page.evaluate(() => ({
        lang: document.documentElement.getAttribute('lang'),
        title: document.title,
        canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href') || '',
        alts: [...document.querySelectorAll('link[rel=alternate][hreflang]')]
          .map((n) => [n.getAttribute('hreflang'), n.getAttribute('href')]),
        navCurrent: document.querySelector('.sitenav ul a[aria-current]')?.getAttribute('href') || '',
        bodyLangSwitcher: [...document.querySelectorAll('.langsw a')]
          .map((a) => [a.getAttribute('href'), a.getAttribute('hreflang'), a.hasAttribute('aria-current')]),
        h1: document.querySelector('h1')?.innerText.replace(/\s+/g, ' ').trim() || '',
        cluster: [...document.querySelectorAll('.cluster a.tool, .hubcard')]
          .map((a) => a.getAttribute('href')),
      }));

      check(doc.lang === locale.htmlLang, `<html lang="${locale.htmlLang}">`, String(doc.lang));
      check(doc.title === loc.title, 'document title is the locale copy', JSON.stringify(doc.title));

      const wantCanonical = new URL(SITE + url);
      check(new URL(doc.canonical).pathname === wantCanonical.pathname,
        'canonical points at this locale', doc.canonical);

      // hreflang cluster: all four siblings plus x-default, no duplicates.
      const wantAlts = LOCALES.map((l) => l.hreflang);
      const gotAlts = doc.alts.filter(([h]) => h !== 'x-default').map(([h]) => h);
      check(JSON.stringify(gotAlts) === JSON.stringify(wantAlts),
        'hreflang cluster lists all four locales', JSON.stringify(gotAlts));
      const altPaths = doc.alts
        .filter(([h]) => h !== 'x-default')
        .map(([, href]) => new URL(href).pathname);
      const wantPaths = LOCALES.map((l) => absPath(l, pg.slug));
      check(JSON.stringify(altPaths) === JSON.stringify(wantPaths),
        'each hreflang points at the right sibling URL', JSON.stringify(altPaths));
      check(doc.alts.some(([h]) => h === 'x-default'), 'x-default present');

      // The switcher must resolve to the four siblings, wherever the page sits.
      check(doc.bodyLangSwitcher.length === LOCALES.length,
        'switcher offers all four languages', String(doc.bodyLangSwitcher.length));
      const swPaths = doc.bodyLangSwitcher.map(([href]) => new URL(href, base + url).pathname);
      check(JSON.stringify(swPaths) === JSON.stringify(wantPaths),
        'switcher links resolve to the right sibling URLs', JSON.stringify(swPaths));
      const marked = doc.bodyLangSwitcher.filter(([, , cur]) => cur);
      check(marked.length === 1 && marked[0][1] === locale.hreflang,
        'exactly the current language is marked in the switcher',
        JSON.stringify(marked.map((m) => m[1])));

      if (pg.slug) {
        check(new URL(doc.navCurrent, base + url).pathname === url,
          'tool nav marks this page current', doc.navCurrent);
        const wantH1 = loc.h1Html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
        check(doc.h1 === wantH1, 'h1 is this locale\'s copy', JSON.stringify(doc.h1));
      } else {
        check(doc.navCurrent === '', 'hub has no current tool in the nav', doc.navCurrent);
      }

      /* Converter links must stay inside this locale. Sending a Chinese
         visitor to the English converter is the easiest mistake to make here
         and it is invisible unless you actually click. The hub has both a
         card grid and a cluster block, so expect the three paths twice. */
      const clusterPaths = doc.cluster.map((h) => new URL(h, base + url).pathname);
      const wantCluster = TOOLS.map((t) => absPath(locale, t.slug));
      const stray = clusterPaths.filter((p) => !wantCluster.includes(p));
      check(clusterPaths.length >= TOOLS.length && stray.length === 0,
        'converter links stay in this locale',
        stray.length ? 'stray: ' + stray.join(', ') : JSON.stringify(clusterPaths));

      check(errors.length === 0, 'no JS errors on load',
        errors.length ? JSON.stringify(errors) : '');
      errors.length = 0;
    }
  }

  /* ---------------- 3. real conversion, per locale ---------------- */
  const HEIC = path.join(SAMPLES, 'sample2.heic');
  let firstJpegBytes = 0;

  for (const locale of LOCALES) {
    const url = absPath(locale, 'heic-to-jpg');
    const pg = PAGES.find((p) => p.slug === 'heic-to-jpg');
    const loc = pg.locales[locale.code];
    const ui = UI[locale.code];
    section(`CONVERT  ${url}`);

    await page.goto(base + url + '?v=' + Date.now(), { waitUntil: 'load' });
    await page.waitForTimeout(600);
    check(errors.length === 0, 'page loaded with no JS errors',
      errors.length ? JSON.stringify(errors) : '');

    // A page whose script threw never mounts the tool. Detect that here so
    // the run reports a clear FAIL instead of timing out 30s on the input.
    const mounted = await page.evaluate(() => !!document.getElementById('picker'));
    check(mounted, 'tool mounted (file input present)');
    if (!mounted) { errors.length = 0; continue; }

    // The engine's own strings, read off the rendered page. If a key were
    // missing the engine would silently fall back to English.
    const strings = await page.evaluate(() => {
      const txt = (s) => document.querySelector(s)?.innerText.replace(/\s+/g, ' ').trim() ?? null;
      return {
        dropHeading: txt('#drop h2'),
        pick: txt('#pickBtn'),
        qualityLabel: txt('.field label'),
        fit: txt('#fitBtn'),
        trustbar: txt('#trustbar'),
      };
    });

    const wantHeading = ui.dropHere.replace('{name}', loc.tool.inputDropTitle);
    check(strings.dropHeading === wantHeading, 'drop-zone heading is localised',
      JSON.stringify(strings.dropHeading));
    check(strings.pick === ui.chooseFiles, '"Choose files" is localised', JSON.stringify(strings.pick));
    check(strings.qualityLabel === ui.outputQuality, 'quality label is localised',
      JSON.stringify(strings.qualityLabel));
    check(strings.fit === ui.matchOriginal, '"Match original size" is localised',
      JSON.stringify(strings.fit));
    check((strings.trustbar || '').includes(ui.trustNoUpload.replace(/^[^\p{L}]+/u, '')),
      'trust bar is localised', JSON.stringify(strings.trustbar));

    // Real file in, real bytes out.
    await page.setInputFiles('#picker', HEIC);
    await page.waitForFunction((words) => {
      const s = [...document.querySelectorAll('.item .sub')];
      return s.length > 0 && s.every((x) => !words.some((w) => x.innerText.includes(w)));
    }, BUSY_WORDS, { timeout: 180000 });

    // Stability gate — the 260ms debounce means one quiet poll is not enough.
    let last = null, stable = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < 120000) {
      const now = (await page.evaluate(() =>
        [...document.querySelectorAll('.item .sub')].map((s) => s.innerText).join('|')));
      if (now === last) { if (++stable >= 3) break; } else { stable = 0; last = now; }
      await page.waitForTimeout(300);
    }

    const ready = await page.evaluate(() => {
      const sub = document.querySelector('.item .sub')?.innerText.replace(/\s+/g, ' ').trim();
      const dl = document.querySelector('.item .mini.dl');
      const btn = dl || [...document.querySelectorAll('.item button')]
        .find((b) => /download|下载|ダウンロード/i.test(b.innerText));
      if (btn) btn.id = 'i18nDl';
      return { sub, found: !!btn };
    });
    check(ready.found, 'a download control is present after conversion', String(ready.sub));

    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('#i18nDl'),
    ]);
    const out = path.join(SAMPLES, `i18n-${locale.code}.jpg`);
    await dl.saveAs(out);
    const buf = fs.readFileSync(out);

    check(jpegOk(buf), 'downloaded output is a valid JPEG (SOI..EOI)',
      `${buf.length} B`);
    check(dl.suggestedFilename() === 'sample2.jpg',
      'output filename keeps the stem and drops .heic (the ext regex works)',
      dl.suggestedFilename());
    if (!firstJpegBytes) firstJpegBytes = buf.length;
    check(Math.abs(buf.length - firstJpegBytes) < 16 * 1024,
      'output size is consistent with the English page',
      `${buf.length} B vs ${firstJpegBytes} B`);
    check(errors.length === 0, 'conversion raised no JS errors',
      errors.length ? JSON.stringify(errors) : '');
    errors.length = 0;

    fs.unlinkSync(out);
  }

  /* ---------------- cross-locale consistency ---------------- */
  section('CROSS-LOCALE / SEO');
  const probe = await browser.newContext();
  const p2 = await probe.newPage();

  const smRes = await probe.request.get(base + '/sitemap.xml');
  check(smRes && smRes.status() === 200, 'sitemap.xml -> 200');
  // Fetch it as text: an XML document has no <body>, and textContent would
  // drop the attribute values the hreflang annotations live in.
  const sm = await smRes.text();
  const missingUrls = [];
  for (const pg of PAGES) {
    for (const locale of LOCALES) {
      const u = SITE + absPath(locale, pg.slug);
      if (!sm.includes(u)) missingUrls.push(absPath(locale, pg.slug));
    }
  }
  check(missingUrls.length === 0,
    `sitemap lists all ${PAGES.length * LOCALES.length} localised URLs`,
    missingUrls.length ? 'missing: ' + missingUrls.join(', ') : '');
  check((sm.match(/hreflang="x-default"/g) || []).length === PAGES.length * LOCALES.length,
    'every sitemap entry carries an x-default alternate');

  const rbRes = await probe.request.get(base + '/robots.txt');
  const rbText = await rbRes.text();
  check(rbText.includes('Disallow: /*/*/posts/'),
    'robots.txt blocks posts/ under a language prefix too');
  check(rbText.includes(`Sitemap: ${SITE}/sitemap.xml`), 'robots.txt advertises the sitemap');

  await probe.close();
} catch (e) {
  crashed = e;
} finally {
  await browser.close();
  server.close();
}

/* ---------------- report ---------------- */
if (crashed) {
  failures++;
  say('');
  say('!!! RUN ABORTED: ' + (crashed.stack || crashed.message));
}
say('');
say('='.repeat(70));
say(`TOTAL  ${passes} PASS / ${failures} FAIL`);
say('='.repeat(70));
const text = report.join('\n') + '\n';
fs.writeFileSync(path.join(DEV, 'verify-i18n-report.txt'), text, 'utf8');
console.log(text);
process.exit(failures ? 1 : 0);
