/* Generates a WebP fixture that actually has an alpha channel, so the
   transparency warning can be tested. None of the downloaded samples carry
   one, and that warning guards against silent data loss — it has to be
   verified, not assumed.
   Run:  node gen-fixture.mjs                                          */

import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DEV = path.dirname(fileURLToPath(import.meta.url));
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

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.goto('about:blank');

const b64 = await page.evaluate(async () => {
  const W = 640, H = 400;
  const c = new OffscreenCanvas(W, H);
  const ctx = c.getContext('2d');

  // Fully transparent background — the rest of the canvas stays alpha=0.
  ctx.clearRect(0, 0, W, H);

  // An opaque gradient disc, so the fixture is a real image and not just holes.
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, '#2563eb');
  g.addColorStop(1, '#0891b2');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, 150, 0, Math.PI * 2);
  ctx.fill();

  // A semi-transparent band, to make sure partial alpha survives too.
  ctx.globalAlpha = 0.45;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(40, 40, W - 80, 70);
  ctx.globalAlpha = 1;

  const blob = await c.convertToBlob({ type: 'image/webp', quality: 0.9 });
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = '';
  for (const v of buf) s += String.fromCharCode(v);
  return btoa(s);
});

const out = path.join(DEV, 'test-assets', 'transparent.webp');
fs.writeFileSync(out, Buffer.from(b64, 'base64'));

const b = fs.readFileSync(out);
const riff = b.toString('latin1', 0, 4) === 'RIFF' && b.toString('latin1', 8, 12) === 'WEBP';
const fourcc = b.toString('latin1', 12, 16);
// VP8X extended header carries an explicit alpha flag; VP8L can carry alpha too.
const vp8xFlags = fourcc === 'VP8X' ? b[20] : null;
console.log('wrote', out, b.length, 'bytes');
console.log('  RIFF/WEBP container :', riff, '| first chunk:', fourcc);
console.log('  VP8X flags byte     :', vp8xFlags == null ? 'n/a' : '0x' + vp8xFlags.toString(16));

await browser.close();
