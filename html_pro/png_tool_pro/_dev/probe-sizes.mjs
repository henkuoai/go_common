/* Measures real output sizes for the cluster's conversion matrix, so the
   size tables published on the pages are measured rather than guessed.
   Run:  node probe-sizes.mjs                                        */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEV = path.dirname(fileURLToPath(import.meta.url));
const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const ASSETS = process.env.ASSETS_DIR || path.join(DEV, 'test-assets') + path.sep;

function loadPlaywright() {
  const bases = [process.env.PW_ROOT, path.join(DEV, 'package.json'),
    'C:/Users/Administrator/.workbuddy/binaries/node/workspace/package.json'].filter(Boolean);
  const tried = [];
  for (const base of bases) {
    try { return createRequire(base)('playwright-core'); }
    catch (e) { tried.push('  ' + base + '  (' + (e.code || e.message) + ')'); }
  }
  console.error('Could not resolve playwright-core. Tried:\n' + tried.join('\n'));
  console.error('\nFix: run `npm i playwright-core` inside _dev/, or set PW_ROOT.');
  process.exit(1);
}
const { chromium } = loadPlaywright();

const SOURCES = [
  ['big.webp', 'image/webp'],
  ['s.webp', 'image/webp'],
  ['s2.webp', 'image/webp'],
  ['big.avif', 'image/avif'],
  ['fox.profile0.10bpc.yuv420.avif', 'image/avif'],
  ['a.avif', 'image/avif'],
];

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGEERROR:', e.message.split('\n')[0]));
await page.goto('about:blank');

const kB = (n) => (n / 1024).toFixed(1) + ' KB';
const mb = (n) => (n / 1048576).toFixed(2) + ' MB';
const size = (n) => (n >= 1048576 ? mb(n) : kB(n));
const pct = (out, src) => {
  const d = Math.round((out / src - 1) * 100);
  return (d >= 0 ? '+' : '') + d + '%';
};

for (const [name, mime] of SOURCES) {
  const file = ASSETS + name;
  const srcBytes = fs.statSync(file).size;
  const bytes = Array.from(fs.readFileSync(file));

  const res = await page.evaluate(async ({ arr, mime }) => {
    const buf = new Uint8Array(arr).buffer;
    const rows = [];
    let bmp;
    try {
      bmp = await createImageBitmap(new Blob([buf], { type: mime }));
      rows.push(['decoder', 'native', bmp.width + 'x' + bmp.height, 0]);
    } catch (e) { return { error: 'decode failed: ' + e.message, rows }; }

    const enc = async (type, q) => {
      const c = new OffscreenCanvas(bmp.width, bmp.height);
      c.getContext('2d').drawImage(bmp, 0, 0);
      const blob = q == null ? await c.convertToBlob({ type }) : await c.convertToBlob({ type, quality: q });
      return blob.size;
    };

    try { rows.push(['PNG', 'lossless', '', await enc('image/png')]); } catch (e) { rows.push(['PNG', 'ERR ' + e.message, '', 0]); }
    for (const q of [0.95, 0.85, 0.80, 0.75, 0.70, 0.65]) {
      try { rows.push(['JPG', 'q' + Math.round(q * 100), '', await enc('image/jpeg', q)]); } catch (e) { rows.push(['JPG', 'ERR', '', 0]); }
    }
    for (const q of [0.85, 0.80]) {
      try { rows.push(['WebP', 'q' + Math.round(q * 100), '', await enc('image/webp', q)]); } catch (e) { rows.push(['WebP', 'ERR', '', 0]); }
    }
    bmp.close();
    return { rows };
  }, { arr: bytes, mime });

  console.log('\n=== ' + name + '  (' + mime + ', source ' + srcBytes + ' B / ' + size(srcBytes) + ') ===');
  if (res.error) { console.log('   ' + res.error); continue; }
  for (const [kind, label, dim, out] of res.rows) {
    if (kind === 'decoder') { console.log('   decoded ' + dim + ' via ' + label); continue; }
    console.log('   ' + (kind + ' ' + label).padEnd(14) + size(out).padStart(10) + '   vs source ' + pct(out, srcBytes).padStart(8));
  }
}

await browser.close();
