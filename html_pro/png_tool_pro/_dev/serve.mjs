/* Static server for clicking through the built site locally.
   Run:  node serve.mjs        ->  http://127.0.0.1:8814

   You need this rather than double-clicking index.html: the pages are ES
   modules, and file:// blocks module loading by CORS (see _dev/README.md,
   trap 7). It also has to send text/javascript for .js, or the imports fail
   in a way that is hard to trace back to the server (trap 3).            */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT || 8814);
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.heic': 'image/heic',
  '.zip': 'application/zip',
};

http
  .createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]);
    let f = path.join(ROOT, rel.replace(/^\//, ''));
    // Directory URLs must resolve to their index.html, or every link in the
    // nav 404s.
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f) || !fs.statSync(f).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 ' + rel);
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream' });
    res.end(fs.readFileSync(f));
  })
  .listen(PORT, HOST, () => {
    console.log(`png_tool_pro  ->  http://${HOST}:${PORT}/`);
    console.log(`  en  http://${HOST}:${PORT}/`);
    console.log(`  zh  http://${HOST}:${PORT}/zh/`);
    console.log(`  ja  http://${HOST}:${PORT}/ja/`);
    console.log(`  ko  http://${HOST}:${PORT}/ko/`);
  });
