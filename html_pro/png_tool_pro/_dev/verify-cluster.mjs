/* =====================================================================
   Cluster verification harness.

   Serves the whole project from inside this process (a separate static
   server kept dying between runs), then drives real Chrome through every
   page in the tool cluster: injects genuine sample files, waits for the
   conversion to SETTLE, downloads the actual output bytes and validates
   them at the byte level. A page is not "done" because it renders — it is
   done when the file it hands the user is a structurally valid image.

   Usage:  node verify-cluster.mjs [slug ...]
   ===================================================================== */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

/* Self-locating: this file lives in <site-root>/_dev/, so the served
   site root is its parent and the fixtures sit beside it. */
const DEV = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.dirname(DEV);
const SAMPLES = path.join(DEV, 'test-assets');
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUT = SAMPLES;

/* playwright-core is normally installed outside this project, so try the
   usual locations before giving up with an actionable message. */
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
  console.error('to a directory whose package.json resolves it.');
  process.exit(1);
}
const { chromium } = loadPlaywright();

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
const PORT = 8811;
await new Promise((r) => server.listen(PORT, '127.0.0.1', r));
const base = `http://127.0.0.1:${PORT}`;

/* ---------------- byte-level image validation ---------------- */

function jpegInfo(b) {
  const ok = b[0] === 0xff && b[1] === 0xd8 && b[b.length - 2] === 0xff && b[b.length - 1] === 0xd9;
  let w = 0, h = 0;
  for (let i = 2; i < b.length - 9;) {
    if (b[i] !== 0xff) { i++; continue; }
    const mk = b[i + 1], len = b.readUInt16BE(i + 2);
    if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) {
      h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break;
    }
    i += 2 + len;
  }
  return { ok, w, h };
}
function pngInfo(b) {
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const ok = sig.every((v, i) => b[i] === v) && b.toString('latin1', 12, 16) === 'IHDR';
  return { ok, w: ok ? b.readUInt32BE(16) : 0, h: ok ? b.readUInt32BE(20) : 0 };
}
function webpInfo(b) {
  const ok = b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
  let w = 0, h = 0;
  if (ok) {
    const fourcc = b.toString('latin1', 12, 16);
    if (fourcc === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
    else if (fourcc === 'VP8 ') { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
    else if (fourcc === 'VP8L') {
      const n = b.readUInt32LE(21);
      w = (n & 0x3fff) + 1; h = ((n >> 14) & 0x3fff) + 1;
    }
  }
  return { ok, w, h };
}
const zipInfo = (b) => ({ ok: b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04, w: 0, h: 0 });
const VERIFY = { jpeg: jpegInfo, png: pngInfo, webp: webpInfo, zip: zipInfo };

function inspect(file, kind) {
  const b = fs.readFileSync(file);
  let k = kind;
  if (!k) {
    const e = path.extname(file).toLowerCase();
    k = e === '.png' ? 'png' : e === '.webp' ? 'webp' : e === '.zip' ? 'zip' : 'jpeg';
  }
  return { bytes: b.length, ...VERIFY[k](b) };
}

/* ---------------- pages under test ----------------
   `expectKind` is what the DEFAULT state must produce; every further step
   is a control the user can actually reach, and each one is downloaded and
   validated independently. */

const PAGES = [
  {
    slug: 'heic-to-jpg',
    title: 'HEIC → JPG',
    samples: ['sample2.heic'],
    nativeAvailable: false,          // no browser decodes HEIC natively except Safari
    netMin: 1,                       // one codec download (libheif), then cached
    seq: [
      { label: 'default q70', kind: 'jpeg', ext: 'jpg' },
      { label: 'Match original size', acts: ['fit'], kind: 'jpeg', ext: 'jpg' },
      { label: 'switch to PNG', acts: ['format:image/png'], kind: 'png', ext: 'png',
        expect: { qDisabled: true, fitDisabled: true } },
      { label: 'back to JPG at q85', acts: ['format:image/jpeg', 'quality:85'], kind: 'jpeg', ext: 'jpg',
        expect: { qDisabled: false, fitDisabled: false } },
    ],
  },
  {
    slug: 'webp-to-png',
    title: 'WebP → PNG',
    samples: ['big.webp', 's.webp', 'transparent.webp'],
    nativeAvailable: true,
    netMin: 0,                       // no codec to fetch: this page is fully self-contained
    seq: [
      { label: 'default PNG lossless', kind: 'png', ext: 'png',
        expect: { qDisabled: true, fitDisabled: true, alphaWarn: false } },
      { label: 'switch to JPG', acts: ['format:image/jpeg', 'quality:70'], kind: 'jpeg', ext: 'jpg',
        expect: { qDisabled: false, fitDisabled: false, alphaWarn: true } },
      { label: 'Match original size', acts: ['fit'], kind: 'jpeg', ext: 'jpg',
        expect: { alphaWarn: true } },
      { label: 'back to PNG', acts: ['format:image/png'], kind: 'png', ext: 'png',
        expect: { alphaWarn: false } },
    ],
  },
  {
    slug: 'avif-to-jpg',
    title: 'AVIF → JPG',
    samples: ['big.avif', 'fox.profile0.10bpc.yuv420.avif'],
    nativeAvailable: true,           // Chrome has decoded AVIF since v85
    netMin: 0,                       // native decoder built in; libavif only on failure
    seq: [
      { label: 'default q70', kind: 'jpeg', ext: 'jpg' },
      { label: 'Match original size', acts: ['fit'], kind: 'jpeg', ext: 'jpg' },
      { label: 'switch to PNG', acts: ['format:image/png'], kind: 'png', ext: 'png',
        expect: { qDisabled: true, fitDisabled: true } },
    ],
  },
];

const only = process.argv.slice(2);
const todo = only.length ? PAGES.filter((p) => only.includes(p.slug)) : PAGES;

const report = [];
const say = (s) => { report.push(s); };
let failures = 0;
const check = (cond, label, extra = '') => {
  if (!cond) failures++;
  say(`   ${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? '  ' + extra : ''}`);
};

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const summary = [];

for (const P of todo) {
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1340, height: 1250 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('[console] ' + m.text().slice(0, 200)); });
  page.on('pageerror', (e) => errors.push('[pageerror] ' + e.message.split('\n')[0]));
  page.on('requestfailed', (r) => {
    const u = r.url();
    if (!/favicon/.test(u)) errors.push('[reqfail] ' + u.slice(0, 90) + ' ' + (r.failure()?.errorText || ''));
  });

  say(`\n======================================================================`);
  say(`PAGE  ${P.slug}   (${P.title})`);
  say(`======================================================================`);

  const subsText = () => page.evaluate(() =>
    [...document.querySelectorAll('.item .sub')].map((s) => s.innerText.replace(/\s+/g, ' ').trim()));

  const snap = () => page.evaluate(() => {
    const t = (s) => { const e = document.querySelector(s); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; };
    return {
      rows: [...document.querySelectorAll('.item')].map((r) => ({
        name: r.querySelector('.name')?.innerText,
        sub: r.querySelector('.sub')?.innerText.replace(/\s+/g, ' ').trim(),
      })),
      net: t('#netcount'), netDetail: t('#netDetail'), bytesUp: t('#bytesUp'),
      netClass: (document.getElementById('netpill') || {}).className,
      bannerClass: (document.getElementById('banner') || {}).className,
      bannerText: t('#bannerText'), bannerBtn: t('#bannerAct'),
      qval: t('#qval'), qhint: t('#qhint'), fmtHint: t('#fmthint'),
      fmtOn: t('#fmtseg button.on'),
      fitOn: document.getElementById('fitBtn')?.classList.contains('on') ?? null,
      fitDisabled: document.getElementById('fitBtn')?.disabled ?? null,
      qDisabled: document.getElementById('quality')?.disabled ?? null,
      related: [...document.querySelectorAll('.cluster a.tool')].map((a) => a.getAttribute('href')),
      navCurrent: document.querySelector('.sitenav a[aria-current]')?.getAttribute('href'),
      h1: t('h1'),
    };
  });

  // "Settled" = nothing is decoding or optimising AND the status lines have
  // stopped changing. A 260ms debounce means a single sample is not enough.
  async function waitSettled(timeout = 150000) {
    await page.waitForFunction(() => {
      const s = [...document.querySelectorAll('.item .sub')];
      return s.length > 0 && s.every((x) => !/decoding|optimizing/i.test(x.innerText));
    }, null, { timeout });
    let last = null, stable = 0;
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      const now = (await subsText()).join(' | ');
      if (now === last) { if (++stable >= 3) return; } else { stable = 0; last = now; }
      await page.waitForTimeout(300);
    }
  }

  const doAct = async (act) => {
    if (act === 'fit') { await page.click('#fitBtn'); return; }
    if (act.startsWith('format:')) { await page.click(`#fmtseg button[data-fmt="${act.slice(7)}"]`); return; }
    if (act.startsWith('quality:')) {
      const v = act.slice(8);
      await page.evaluate((val) => {
        const el = document.getElementById('quality');
        el.value = val;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }, v);
      return;
    }
    throw new Error('unknown action ' + act);
  };

  async function grab(name) {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('.item .mini.dl'),
    ]);
    const f = path.join(OUT, name);
    await dl.saveAs(f);
    return f;
  }

  try {
    await page.goto(`${base}/${P.slug}/?v=${Date.now()}`, { waitUntil: 'load' });
    await page.waitForTimeout(700);

    const boot = await snap();
    check(errors.length === 0, 'booted with no JS errors', errors.length ? JSON.stringify(errors) : '');
    check(!!boot.h1, 'h1 rendered', JSON.stringify(boot.h1));
    check(boot.navCurrent === `../${P.slug}/`, 'cluster nav marks this page current', String(boot.navCurrent));
    check((boot.related || []).length === 3, 'related-tools block lists all three tools');
    check(await page.evaluate(() => !document.getElementById('workspace').classList.contains('on')),
      'workspace hidden until a file is added');

    // Wrong-format file must be refused, not silently mangled.
    await page.setInputFiles('#picker', path.join(SAMPLES, 'big.jpg'));
    await page.waitForTimeout(900);
    const rej = await page.evaluate(() => {
      const b = document.querySelector('#tool > .banner.warn');
      return b ? b.innerText.replace(/\s+/g, ' ').trim() : null;
    });
    check(!!rej, 'wrong-format file shows a rejection notice', rej ? rej.slice(0, 70) : 'no notice');
    check(await page.evaluate(() => !document.getElementById('workspace').classList.contains('on')),
      'workspace stays closed for a rejected file');

    // Real samples in.
    const samplePaths = P.samples.map((s) => path.join(SAMPLES, s));
    await page.setInputFiles('#picker', samplePaths);
    await waitSettled();

    const s0 = await snap();
    check(s0.rows.length === P.samples.length, `all ${P.samples.length} sample(s) decoded`,
      JSON.stringify(s0.rows.map((r) => r.name)));
    check(s0.rows.every((r) => r.sub && !/NaN|undefined/.test(r.sub)), 'status lines well-formed');
    const netMin = P.netMin ?? 1;
    check(Number(s0.net) >= netMin, `self-verify counted requests (expected >= ${netMin})`, `netcount=${s0.net}`);
    if (netMin === 0) check(Number(s0.net) === 0, 'converting issues zero network requests', `netcount=${s0.net}`);
    check(s0.bytesUp === '0 B', 'outbound payload reported as 0 B', String(s0.bytesUp));
    check(!/alert/.test(s0.netClass || ''), 'network pill not in alert state');
    if (netMin > 0) check(/codec library/.test(s0.netDetail || ''), 'codec request is labelled as such');
    const mode0 = (s0.rows[0].sub || '').match(/\b(native|wasm)\b/);
    check(!!mode0, 'decoder name reported per file', mode0 ? mode0[1] : 'none');
    if (P.nativeAvailable) check(mode0 && mode0[1] === 'native', 'uses the browser-native decoder', mode0 ? mode0[1] : '');

    let idx = 0;
    for (const step of P.seq) {
      idx++;
      const before = await subsText();
      const hadActs = !!(step.acts && step.acts.length);
      for (const a of (step.acts || [])) await doAct(a);
      if (hadActs) { await page.waitForTimeout(400); await waitSettled(); }

      const s = await snap();
      const name = `${P.slug}--${idx}-${step.label.replace(/[^a-z0-9]+/gi, '-')}.${step.ext}`;
      const file = await grab(name);
      const info = inspect(file, step.kind);

      check(info.ok, `[${step.label}] valid ${step.kind.toUpperCase()} bytes`, `${info.bytes} B ${info.w}×${info.h}`);
      check(info.w > 0 && info.h > 0, `[${step.label}] dimensions parsed`);
      if (P.samples[0] === 'sample2.heic' || info.ok) {
        // dimension cross-check against the source where we know it
      }
      if (hadActs) check(JSON.stringify(await subsText()) !== JSON.stringify(before),
        `[${step.label}] UI reflects the change`);
      if (step.expect) {
        if ('qDisabled' in step.expect) check(s.qDisabled === step.expect.qDisabled,
          `[${step.label}] quality slider ${step.expect.qDisabled ? 'disabled' : 'enabled'}`, String(s.qDisabled));
        if ('fitDisabled' in step.expect) check(s.fitDisabled === step.expect.fitDisabled,
          `[${step.label}] Match-size button ${step.expect.fitDisabled ? 'disabled' : 'enabled'}`, String(s.fitDisabled));
        if ('alphaWarn' in step.expect) {
          const shown = /transparent areas/i.test(s.bannerText || '');
          check(shown === step.expect.alphaWarn,
            `[${step.label}] transparency warning ${step.expect.alphaWarn ? 'shown' : 'absent'}`,
            (s.bannerText || '(no banner)').slice(0, 90));
        }
      }
      say(`   -- ${step.label}: ${path.basename(file)}  ${info.bytes} B ${info.w}×${info.h}  q=${s.qval}  fmt=${s.fmtOn}`);
      say(`      UI : ${(await subsText()).join('  |  ')}`);
      if (s.bannerText) say(`      banner: ${s.bannerText.slice(0, 160)}`);
      summary.push({ page: P.slug, step: step.label, bytes: info.bytes, dim: `${info.w}×${info.h}` });
    }

    // Compare overlay pulls its "after" pane from the shipped bytes.
    await page.click('.item .mini:not(.dl):not(.x)');
    await page.waitForTimeout(1500);
    const cmp = await page.evaluate(() => ({
      open: document.getElementById('modal').classList.contains('on'),
      dim: document.getElementById('sDim').innerText,
      orig: document.getElementById('sOrig').innerText,
      conv: document.getElementById('sNew').innerText,
      delta: document.getElementById('sDelta').innerText,
      mode: document.getElementById('sMode').innerText,
      ms: document.getElementById('sMs').innerText,
      tagR: document.getElementById('tagRight').innerText,
      basePainted: document.getElementById('cmpBase').width > 0,
      topPainted: document.getElementById('cmpTop').width > 0,
    }));
    check(cmp.open, 'compare overlay opens');
    check(cmp.basePainted && cmp.topPainted, 'compare paints both panes');
    check(/^(native|wasm)/.test(cmp.mode), 'compare reports the decoder that ran', cmp.mode);
    say(`   -- compare: ${JSON.stringify(cmp)}`);
    await page.screenshot({ path: path.join(OUT, `shot-${P.slug}-compare.png`) });
    await page.keyboard.press('Escape');

    // ZIP bundle.
    const [zipDl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('#dlZip'),
    ]);
    const zipFile = path.join(OUT, `${P.slug}--bundle.zip`);
    await zipDl.saveAs(zipFile);
    const zi = inspect(zipFile, 'zip');
    check(zi.ok, 'ZIP bundle is a real archive', `${zi.bytes} B`);

    // Clearing collapses the workspace again.
    await page.click('#clearAll');
    await page.waitForTimeout(500);
    check(await page.evaluate(() => !document.getElementById('workspace').classList.contains('on')),
      'clearing all files closes the workspace');

    // Visual capture in the default state, for the human eyeball pass.
    const fresh = await ctx.newPage();
    await fresh.goto(`${base}/${P.slug}/?shot=1`, { waitUntil: 'load' });
    await fresh.setInputFiles('#picker', samplePaths);
    await fresh.waitForFunction(() => {
      const s = [...document.querySelectorAll('.item .sub')];
      return s.length > 0 && s.every((x) => !/decoding|optimizing/i.test(x.innerText));
    }, null, { timeout: 120000 });
    await fresh.waitForTimeout(900);
    await fresh.screenshot({ path: path.join(OUT, `shot-${P.slug}.png`), fullPage: true });
    await fresh.close();

    check(errors.length === 0, 'no JS errors across the whole session',
      errors.length ? JSON.stringify(errors.slice(0, 4)) : '');
  } catch (e) {
    failures++;
    say(`   FAIL  [fatal] ${e.message.split('\n')[0]}`);
    if (errors.length) say(`   errors: ${JSON.stringify(errors.slice(0, 5))}`);
    await page.screenshot({ path: path.join(OUT, `shot-${P.slug}-fatal.png`), fullPage: true }).catch(() => {});
  }
  await ctx.close();
}

/* ---------------- forced fallback-decoder paths ----------------
   Every page carries a second decoder for engines that cannot handle the
   format natively. Those branches never execute on a current Chrome, so they
   are forced explicitly — an untested fallback is just a comment. */

const FALLBACKS = {
  'webp-to-png': {
    param: 'img', expect: /\bimg\b/, kind: 'png',
    note: 'the <img> route, for engines without createImageBitmap(Blob)',
  },
  'avif-to-jpg': {
    param: 'wasm', expect: /\bwasm\b/, kind: 'jpeg',
    note: 'the libavif WebAssembly decoder, for engines without native AVIF',
  },
};

for (const P of todo) {
  const fb = FALLBACKS[P.slug];
  if (!fb) continue;
  say(`\n--- forced fallback decoder (?decode=${fb.param}) : ${P.slug}`);
  say(`    ${fb.note}`);
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1340, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.split('\n')[0]));
  try {
    await page.goto(`${base}/${P.slug}/?decode=${fb.param}`, { waitUntil: 'load' });
    await page.setInputFiles('#picker', path.join(SAMPLES, P.samples[0]));
    await page.waitForFunction(() => {
      const s = [...document.querySelectorAll('.item .sub')];
      return s.length > 0 && s.every((x) => !/decoding|optimizing/i.test(x.innerText));
    }, null, { timeout: 180000 });
    await page.waitForTimeout(1500);
    const txt = await page.evaluate(() => document.querySelector('.item .sub').innerText.replace(/\s+/g, ' '));
    check(fb.expect.test(txt), 'fallback decoder actually ran', txt);
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.click('.item .mini.dl'),
    ]);
    const f = path.join(OUT, `${P.slug}--forced-${fb.param}.${fb.kind === 'png' ? 'png' : 'jpg'}`);
    await dl.saveAs(f);
    const info = inspect(f, fb.kind);
    check(info.ok, 'fallback decoder produced valid output', `${info.bytes} B ${info.w}×${info.h}`);
    check(errors.length === 0, 'no JS errors on the fallback path', JSON.stringify(errors.slice(0, 2)));
  } catch (e) {
    failures++;
    say(`   FAIL  [fatal] ${e.message.split('\n')[0]}`);
  }
  await ctx.close();
}

/* ---------------- cluster / SEO ---------------- */

say(`\n======================================================================`);
say(`CLUSTER / SEO`);
say(`======================================================================`);
const probe = await browser.newContext();
const p2 = await probe.newPage();
for (const target of ['/', '/heic-to-jpg/', '/webp-to-png/', '/avif-to-jpg/', '/sitemap.xml', '/robots.txt']) {
  const res = await p2.goto(base + target, { waitUntil: 'domcontentloaded' }).catch(() => null);
  check(res && res.status() === 200, `GET ${target} -> 200`, 'got ' + (res ? res.status() : 'no response'));
}
await p2.goto(base + '/', { waitUntil: 'load' });
const hubLinks = await p2.evaluate(() =>
  [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')).filter((h) => h && !/^https?:|^#/.test(h)));
check(hubLinks.length >= 3, 'hub links out to every converter', JSON.stringify(hubLinks));

// Every tool page must be reachable from every other tool page (the whole
// point of a cluster: internal links carry visitors and crawl equity).
for (const P of PAGES) {
  await p2.goto(`${base}/${P.slug}/`, { waitUntil: 'load' });
  const hrefs = await p2.evaluate(() =>
    [...document.querySelectorAll('a')].map((a) => a.getAttribute('href')));
  const missing = PAGES.filter((o) => o.slug !== P.slug).filter((o) => !hrefs.some((h) => h && h.includes(o.slug)));
  check(missing.length === 0, `${P.slug} links to the other tools`,
    missing.length ? 'missing: ' + missing.map((m) => m.slug).join(', ') : '');
}
// Read the sitemap as text. It is an XML document, so there is no <body> to
// take innerText from, and the hreflang annotations live in attributes.
const smRes = await probe.request.get(base + '/sitemap.xml');
const sm = await smRes.text();
check(PAGES.every((P) => sm.includes(`/${P.slug}/`)), 'sitemap.xml lists every tool page');
check(['/zh/heic-to-jpg/', '/ja/webp-to-png/', '/ko/avif-to-jpg/'].every((p) => sm.includes(p)),
  'sitemap.xml lists the localised routes too');
await probe.close();

await browser.close();
server.close();

console.log(report.join('\n'));
console.log('\n--- size results ---');
for (const r of summary) console.log(`${r.page.padEnd(14)} ${r.step.padEnd(24)} ${String(r.bytes).padStart(9)} B  ${r.dim}`);
console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : failures + ' CHECK(S) FAILED'}`);
process.exit(failures === 0 ? 0 : 1);
