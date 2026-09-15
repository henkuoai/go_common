#!/usr/bin/env node
/* =====================================================================
   build-pages.mjs — generate every page in every locale.

     node _dev/build-pages.mjs

   Inputs
     _dev/i18n/{hub,heic,webp,avif}.mjs   page copy, one column per locale
     assets/i18n.js                        engine UI strings + LOCALES

   Outputs (16 files, 4 pages x 4 locales)
     index.html, {slug}/index.html                    English (site root)
     {zh|ja|ko}/index.html, {zh|ja|ko}/{slug}/index.html

   English deliberately stays at the site root so the URLs that were
   verified by verify-cluster.mjs keep working unchanged; the other three
   locales live under a /{code}/ prefix. Every page carries an hreflang
   cluster pointing at its three siblings and a switcher in the nav.

   The dictionaries are the single source of truth. Edit those and re-run
   this script — never hand-edit a generated index.html, the next build
   will overwrite it.
   ===================================================================== */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const DEV = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(DEV);

/* SITE / TOOLS / FAVICON live in _dev/site.mjs so the verifiers agree with
   the generator about URLs and slugs by construction. */
const { SITE, TOOLS, FAVICON } = await import(pathToFileURL(join(DEV, 'site.mjs')).href);

const i18nMod = await import(pathToFileURL(join(ROOT, 'assets', 'i18n.js')).href);
const { LOCALES, UI } = i18nMod;

const loadPage = async (name) =>
  (await import(pathToFileURL(join(DEV, 'i18n', name)).href)).default;

const PAGES = [
  await loadPage('hub.mjs'),
  await loadPage('heic.mjs'),
  await loadPage('webp.mjs'),
  await loadPage('avif.mjs'),
];

/* Structure that is neither copy nor page-specific code: which output
   formats the page offers, whether it inspects for an alpha channel, and
   the identifier the page's own module script exposes. Everything else
   comes out of the dictionary above. */
const STRUCT = {
  'heic-to-jpg': {
    sniffer: 'looksLikeHeic',
    decode: null,
    detectAlpha: false,
    format: 'image/jpeg',
    formats: [
      { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', lossy: true },
      { mime: 'image/png', ext: 'png', label: 'PNG', lossy: false },
      { mime: 'image/webp', ext: 'webp', label: 'WebP', lossy: true },
    ],
  },
  'webp-to-png': {
    sniffer: 'looksLikeWebp',
    decode: 'decodeWebp',
    detectAlpha: true,
    format: 'image/png',
    formats: [
      { mime: 'image/png', ext: 'png', label: 'PNG', lossy: false, alpha: true },
      { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', lossy: true, alpha: false },
      { mime: 'image/webp', ext: 'webp', label: 'WebP', lossy: true, alpha: true },
    ],
    // Resizing is the only size lever this page has while the output is PNG.
    presetValues: [55, 70, 85, 95],
    resizeValues: [0, 2048, 1280, 800, 512],
  },
  'avif-to-jpg': {
    sniffer: 'looksLikeAvif',
    decode: null,
    detectAlpha: true,
    format: 'image/jpeg',
    formats: [
      { mime: 'image/jpeg', ext: 'jpg', label: 'JPG', lossy: true, alpha: false },
      { mime: 'image/png', ext: 'png', label: 'PNG', lossy: false, alpha: true },
      { mime: 'image/webp', ext: 'webp', label: 'WebP', lossy: true, alpha: true },
    ],
  },
};

/* ---------------------------- helpers ------------------------------ */
const escAttr = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const J = (v) => JSON.stringify(v);                       // JS string literal
/** JSON block re-indented so it can follow `key: ` at `n` spaces. */
const blk = (v, n) => JSON.stringify(v, null, 2).replace(/\n/g, '\n' + ' '.repeat(n));

const prefixOf = (locale) => (locale.code === 'en' ? '' : locale.code + '/');
const dirOf = (locale, slug) => prefixOf(locale) + (slug ? slug + '/' : '');
/** Site-absolute path, always leading and trailing slash. */
const absPath = (locale, slug) => '/' + dirOf(locale, slug);
/** How many directories deep the output file sits, counting from the site root. */
const depthOf = (locale, slug) => (locale.code === 'en' ? 0 : 1) + (slug ? 1 : 0);
/**
 * How many directories deep the file sits inside its OWN locale. Links
 * between the tools, and back to the locale homepage, use this rather than
 * the site-root depth — a Chinese visitor clicking "WebP → PNG" has to land
 * on the Chinese page, not on the English one.
 */
const localDepth = (slug) => (slug ? 1 : 0);
const outFile = (locale, slug) => join(ROOT, dirOf(locale, slug), 'index.html');

/**
 * The same page in another locale, relative to where we are now. `up` is
 * the hop from here to the site root, not to the locale root.
 */
function relLink(up, slug, locale) {
  const p = dirOf(locale, slug);
  if (p === '') return up === '' ? './' : up;   // the English hub is the site root
  return up + p;
}

/* --------------------------- head -------------------------------- */
function head(pg, loc, locale, up) {
  const canonical = SITE + absPath(locale, pg.slug);
  const alternates = LOCALES.map(
    (l) =>
      `  <link rel="alternate" hreflang="${l.hreflang}" href="${SITE + absPath(l, pg.slug)}">`
  );
  alternates.push(
    `  <link rel="alternate" hreflang="x-default" href="${SITE + absPath(LOCALES[0], pg.slug)}">`
  );

  return [
    '<!DOCTYPE html>',
    `<html lang="${locale.htmlLang}">`,
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escAttr(loc.title)}</title>`,
    `<meta name="description" content="${escAttr(loc.desc)}">`,
    `<link rel="canonical" href="${canonical}">`,
    ...alternates,
    '<meta name="theme-color" content="#2563eb">',
    `<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='7' fill='%232563eb'/%3E%3Ctext x='16' y='23' font-family='monospace' font-size='${pg.slug ? 17 : 15}' font-weight='700' fill='white' text-anchor='middle'%3E${FAVICON[pg.slug]}%3C/text%3E%3C/svg%3E">`,
    '',
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${escAttr(loc.ogTitle)}">`,
    `<meta property="og:description" content="${escAttr(loc.ogDesc)}">`,
    `<meta property="og:url" content="${canonical}">`,
    '',
    `<link rel="stylesheet" href="${up}assets/tool.css">`,
    '</head>',
  ].join('\n');
}

/* ---------------------------- nav -------------------------------- */
function nav(pg, loc, locale, local, up) {
  const here = pg.slug;
  const items = TOOLS.map(
    (t) =>
      `      <li><a href="${local}${t.slug}/"${t.slug === here ? ' aria-current="page"' : ''}>${t.label}</a></li>`
  );
  const langs = LOCALES.map((l) => {
    const cur = l.code === locale.code;
    return (
      `<a href="${relLink(up, pg.slug, l)}" hreflang="${l.hreflang}" lang="${l.htmlLang}"` +
      `${cur ? ' aria-current="page"' : ''} title="${escAttr(l.label)}">${escAttr(l.short)}</a>`
    );
  });

  return [
    '<nav class="sitenav">',
    '  <div class="wrap">',
    `    <a class="brand" href="${local === '' ? './' : local}"><span class="mark">/</span>LocalConvert</a>`,
    '    <ul>',
    ...items,
    '    </ul>',
    `    <div class="langsw" aria-label="${escAttr(UI[locale.code].langLabel)}" role="group">`,
    `      ${langs.join('\n      ')}`,
    '    </div>',
    '  </div>',
    '</nav>',
  ].join('\n');
}

/* -------------------------- trust bar ---------------------------- */
function trustbar(pg) {
  // The hub renders it statically from its own dictionary; tool pages ship
  // an empty shell that the engine fills in (the live request counter lives
  // in there, so its element ids have to exist before the engine runs).
  return pg.slug === ''
    ? null
    : '<div class="trustbar" id="trustbar"></div>';
}

function trustbarStatic(loc) {
  const spans = loc.trustbar
    .map((s) => `    <span>${s}</span>`)
    .join('\n    <span class="dot-sep">·</span>\n');
  return ['<div class="trustbar">', '  <div class="wrap">', spans, '  </div>', '</div>'].join('\n');
}

/* --------------------------- header ------------------------------ */
function header(pg, loc) {
  const pad = pg.slug === '' ? ' style="padding-top:52px"' : '';
  const badges = loc.badges
    .map((b, i) => `      <span class="badge${i === 0 ? ' g' : ''}">${b}</span>`)
    .join('\n');
  return [
    `  <header${pad}>`,
    `    <h1>${loc.h1Html}</h1>`,
    `    <p class="lede">${loc.lede}</p>`,
    '    <div class="badges">',
    badges,
    '    </div>',
    '  </header>',
  ].join('\n');
}

/* --------------------------- sections ---------------------------- */
function sections(loc) {
  return loc.sections
    .map((s) => ['    <section class="content">', `      <h2>${s.h2}</h2>`, s.html, '    </section>'].join('\n'))
    .join('\n\n');
}

function related(pg, loc, local) {
  const links = TOOLS.map((t, i) => {
    const it = loc.related.items[i];
    const here = t.slug === pg.slug ? ' here' : '';
    return [
      `        <a class="tool${here}" href="${local}${t.slug}/">`,
      `          <div class="tt">${it.tt}</div>`,
      `          <div class="td">${it.td}</div>`,
      `          <div class="tm">${it.tm}</div>`,
      '        </a>',
    ].join('\n');
  });
  return [
    '    <section class="related">',
    `      <h2>${loc.related.h2}</h2>`,
    `      <p class="rsub">${loc.related.sub}</p>`,
    '      <div class="cluster">',
    ...links,
    '      </div>',
    '    </section>',
  ].join('\n');
}

function hubGrid(loc, local) {
  const cards = loc.cards.map((c, i) =>
    [
      `      <a class="hubcard" href="${local}${TOOLS[i].slug}/">`,
      `        <div class="hicon">${c.icon}</div>`,
      `        <h3>${c.h3}</h3>`,
      `        <p>${c.p}</p>`,
      `        <span class="go">${c.go}</span>`,
      '      </a>',
    ].join('\n')
  );
  return ['    <div class="hubgrid">', ...cards, '    </div>'].join('\n');
}

/* --------------------------- footer ------------------------------ */
function footer(pg, loc, locale, local) {
  const links = TOOLS.map((t) => `      <a href="${local}${t.slug}/">${t.label}</a>`);
  return [
    '<footer>',
    '  <div class="wrap">',
    '    <div class="fl">',
    `      <a href="${local === '' ? './' : local}">${UI[locale.code].allConverters}</a>`,
    ...links,
    '    </div>',
    `    ${loc.footerTagline} · <a href="#top">${UI[locale.code].backToTop}</a>`,
    '  </div>',
    '</footer>',
  ].join('\n');
}

/* --------------------- page-specific script ---------------------- */
/** The decoder / sniffer source, with the build-time placeholders filled. */
function pageCode(pg, loc) {
  const parts = [];
  if (pg.code.sniff) {
    parts.push(pg.code.sniff.replace('__BRANDS__', pg.code.brands || '').trim());
  }
  if (pg.code.decode) {
    parts.push(pg.code.decode.replace("'__IMG_FAIL__'", J(loc.tool.imgFail)).trim());
  }
  return parts.join('\n\n');
}

function workerTag(pg) {
  if (!pg.code.workerId) return '';
  return [
    '<!-- =====================================================================',
    '     Page-specific decoder. Everything else comes from ../assets/tool-core.js.',
    '     Error strings arrive as self.__MSG, injected by the engine, so this',
    '     source is identical in every language.',
    '     ===================================================================== -->',
    `<script id="${pg.code.workerId}" type="javascript/worker">`,
    pg.code.worker.trim(),
    '</script>',
    '',
  ].join('\n');
}

function toolConfig(pg, loc, locale) {
  const st = STRUCT[pg.slug];
  const code = pg.code;
  const tl = loc.tool;
  const L = [];
  const p = (...xs) => L.push(...xs);

  p('{');
  p(`  mount: '#tool',`);
  p(`  locale: ${J(locale.code)},`);
  p(
    code.workerId
      ? `  workerId: ${J(code.workerId)},`
      : `  workerId: null,          // no worker, no CDN, no network requests`
  );
  p(`  zipName: ${J(tl.zipName)},`);
  if (code.workerId && loc.worker) {
    p(`  // Decoder error strings, in this page's language (see workerTag above).`);
    p(`  workerMsgs: ${blk(loc.worker, 2)},`);
  }
  if (st.detectAlpha) p(`  detectAlpha: true,       // warn before JPG flattens a transparent source`);
  if (st.decode) p(`  decode: ${st.decode},`);
  p('');
  p('  input: {');
  p(`    name: ${J(tl.inputName)},`);
  p(`    dropTitle: ${J(tl.inputDropTitle)},`);
  p(`    accept: ${J(code.accept)},`);
  p(`    ext: ${code.extSrc},`);
  p(`    mime: ${J(code.mime)},`);
  p(`    sniff: ${st.sniffer},`);
  p(`    reject: ${J(tl.reject)},`);
  p('  },');
  p('');
  p('  formats: [');
  for (const f of st.formats) {
    const alpha = f.alpha === undefined ? '' : `, alpha: ${f.alpha}`;
    p(`    { mime: ${J(f.mime)}, ext: ${J(f.ext)}, label: ${J(f.label)}, lossy: ${f.lossy}${alpha},`);
    p(`      hint: ${J(tl.formatHints[f.mime] || '')} },`);
  }
  p('  ],');
  p(`  format: ${J(st.format)},`);
  p('');
  p(`  quality: ${tl.quality},`);
  p(`  qualityHint: ${J(tl.qualityHint)},`);
  p(`  qualityHintByFormat: ${blk(tl.qualityHintByFormat, 2)},`);
  if (st.presetValues && tl.presetLabels) {
    p(`  presets: [${st.presetValues.map((v, i) => `[${v}, ${J(tl.presetLabels[i])}]`).join(', ')}],`);
  }
  if (st.resizeValues && tl.resizeLabels) {
    p('  resize: [');
    st.resizeValues.forEach((v, i) => p(`    [${v}, ${J(tl.resizeLabels[i])}],`));
    p('  ],');
  }
  p('');
  p('  banner: {');
  p(`    grew: ${J(tl.bannerGrew)},`);
  if (tl.bannerGrewByFormat) p(`    grewByFormat: ${blk(tl.bannerGrewByFormat, 4)},`);
  p('    grewActions: [');
  for (const a of tl.grewActions) p(`      { label: ${J(a.label)}, act: ${J(a.act)} },`);
  p('    ],');
  p('  },');
  p('');
  p('  verify: {');
  p('    steps: [');
  for (const s of tl.verifySteps) p(`      ${J(s)},`);
  p('    ],');
  p('  },');
  p('}');                       // the object literal; the call is closed by the caller
  return L.join('\n');
}

function moduleScript(pg, loc, locale, up) {
  return [
    '<script type="module">',
    `import { mountTool } from '${up}assets/tool-core.js';`,
    '',
    pageCode(pg, loc),
    '',
    `mountTool(${toolConfig(pg, loc, locale)});`,
    '</script>',
  ].join('\n');
}

/* --------------------------- JSON-LD ----------------------------- */
function ldFor(pg, loc, locale) {
  const canonical = SITE + absPath(locale, pg.slug);
  if (pg.ldType === 'WebSite') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'LocalConvert',
      description: loc.ldDesc,
      url: canonical,
      inLanguage: locale.htmlLang,
      hasPart: TOOLS.map((t, i) => ({
        '@type': 'SoftwareApplication',
        name: loc.cards[i].h3,
        url: SITE + absPath(locale, t.slug),
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any (browser-based)',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      })),
    };
  }
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: loc.ldName,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Any (browser-based)',
        description: loc.ldDesc,
        url: canonical,
        inLanguage: locale.htmlLang,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: loc.ldFaq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

/* --------------------------- sitemap ----------------------------- */
/* Generated from the same locale list as the pages, so a new language can
   never be published while the sitemap still advertises three. Every URL
   carries the full hreflang cluster, matching the <link rel="alternate">
   set in its own <head>. */
function buildSitemap() {
  const today = new Date().toISOString().slice(0, 10);
  const cluster = (slug) => [
    ...LOCALES.map(
      (l) => `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${SITE + absPath(l, slug)}"/>`
    ),
    `    <xhtml:link rel="alternate" hreflang="x-default" href="${SITE + absPath(LOCALES[0], slug)}"/>`,
  ];

  const urls = [];
  for (const pg of PAGES) {
    for (const locale of LOCALES) {
      urls.push(
        [
          '  <url>',
          `    <loc>${SITE + absPath(locale, pg.slug)}</loc>`,
          ...cluster(pg.slug),
          `    <lastmod>${today}</lastmod>`,
          `    <changefreq>${pg.slug === '' ? 'weekly' : 'monthly'}</changefreq>`,
          `    <priority>${pg.slug === '' ? '1.0' : '0.9'}</priority>`,
          '  </url>',
        ].join('\n')
      );
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

/* ---------------------------- assemble --------------------------- */
function buildPage(pg, locale) {
  const loc = pg.locales[locale.code];
  if (!loc) throw new Error(`${pg.slug || 'hub'}: no "${locale.code}" column`);

  const up = '../'.repeat(depthOf(locale, pg.slug));          // hop to the site root
  const local = '../'.repeat(localDepth(pg.slug));            // hop to the locale root
  const isHub = pg.slug === '';

  const body = [
    '',
    nav(pg, loc, locale, local, up),
    '',
    isHub ? trustbarStatic(loc) : trustbar(pg),
    '',
    '<div class="wrap">',
    header(pg, loc),
    '',
    '  <main>',
    isHub ? hubGrid(loc, local) : '    <div id="tool"></div>',
    '',
    sections(loc),
    '',
    related(pg, loc, local),
    '  </main>',
    '</div>',
    '',
    footer(pg, loc, locale, local),
    '',
  ];

  if (!isHub) {
    body.push(workerTag(pg));
    body.push(moduleScript(pg, loc, locale, up));
    body.push('');
  }

  body.push('<script type="application/ld+json">');
  body.push(JSON.stringify(ldFor(pg, loc, locale), null, 2));
  body.push('</script>');
  body.push('</body>');
  body.push('</html>');
  body.push('');

  return [head(pg, loc, locale, up), '<body id="top">', ...body].join('\n');
}

/* ------------------------------ run ------------------------------ */
let written = 0;
const report = [];
const built = new Map();

for (const pg of PAGES) {
  for (const locale of LOCALES) {
    const html = buildPage(pg, locale);
    const file = outFile(locale, pg.slug);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html, 'utf8');
    built.set(`${pg.slug}|${locale.code}`, html);
    const rel = file.slice(ROOT.length + 1).replace(/\\/g, '/');
    // Buffer.byteLength, not html.length: the latter counts UTF-16 code units,
    // which understates every CJK page by roughly 2 bytes per character and
    // makes the report disagree with the bytes actually on disk.
    report.push(`${rel.padEnd(34)} ${String(Buffer.byteLength(html, 'utf8')).padStart(7)} B`);
    written++;
  }
}

/* sitemap.xml is derived, not maintained: it lists every page in every
   locale with the same hreflang cluster the pages themselves declare. */
{
  const xml = buildSitemap();
  writeFileSync(join(ROOT, 'sitemap.xml'), xml, 'utf8');
  report.push(
    `${'sitemap.xml'.padEnd(34)} ${String(Buffer.byteLength(xml, 'utf8')).padStart(7)} B  (${PAGES.length * LOCALES.length} urls)`
  );
}

/* A locale column that is missing a key would publish an empty heading, so
   check the shape of every column before declaring success. */
const REQUIRED = {
  hub: ['title', 'desc', 'ogTitle', 'ogDesc', 'trustbar', 'h1Html', 'lede', 'badges',
    'cards', 'sections', 'related', 'footerTagline', 'ldDesc'],
  page: ['title', 'desc', 'ogTitle', 'ogDesc', 'h1Html', 'lede', 'badges', 'sections',
    'related', 'footerTagline', 'worker', 'tool', 'ldName', 'ldDesc', 'ldFaq'],
};
const problems = [];
for (const pg of PAGES) {
  const keys = REQUIRED[pg.slug === '' ? 'hub' : 'page'];
  for (const locale of LOCALES) {
    const loc = pg.locales[locale.code];
    const where = `${pg.slug || 'hub'}/${locale.code}`;
    if (!loc) { problems.push(`${where}: column missing`); continue; }
    for (const k of keys) {
      if (loc[k] === undefined) problems.push(`${where}: missing "${k}"`);
    }
    // The hub is not a tool: it has no decoder, so no code block by design.
    if (pg.slug !== '' && (!pg.code || !pg.code.accept)) {
      problems.push(`${where}: code.accept missing`);
    }
  }
}

/* Regex literals travel through the dictionaries as strings, and a single
   backslash is an empty escape inside a template literal — which is exactly
   how `\.` silently degraded to `.`. Compile them here so that mistake
   fails the build instead of shipping a too-permissive matcher. */
for (const pg of PAGES) {
  if (!pg.code || !pg.code.extSrc) continue;
  let re;
  try {
    re = new Function('return ' + pg.code.extSrc)();
  } catch (e) {
    problems.push(`${pg.slug}: extSrc is not a regex literal — ${e.message}`);
    continue;
  }
  if (!(re instanceof RegExp)) { problems.push(`${pg.slug}: extSrc is not a RegExp`); continue; }
  const sample = 'photo.' + pg.code.mime.split('/')[1];
  if (!re.test(sample)) problems.push(`${pg.slug}: extSrc does not match "${sample}"`);
  if (re.test('photo-x' + pg.code.mime.split('/')[1])) {
    problems.push(`${pg.slug}: extSrc matches a filename with no dot — escape lost?`);
  }
}

/* Every page must declare its own language, carry the full hreflang
   cluster, and actually contain the locale's own headline. */
for (const pg of PAGES) {
  for (const locale of LOCALES) {
    const html = built.get(`${pg.slug}|${locale.code}`) || '';
    const where = `${pg.slug || 'hub'}/${locale.code}`;
    if (!html.includes(`<html lang="${locale.htmlLang}">`)) {
      problems.push(`${where}: <html lang> wrong`);
    }
    const alts = (html.match(/rel="alternate"/g) || []).length;
    if (alts !== LOCALES.length + 1) {
      problems.push(`${where}: expected ${LOCALES.length + 1} hreflang links, found ${alts}`);
    }
    const h1 = pg.locales[locale.code].h1Html;
    if (!html.includes(h1)) problems.push(`${where}: h1 copy missing from the output`);
  }
}

const summary = [
  `built ${written} pages`,
  '',
  ...report,
  '',
  problems.length ? 'PROBLEMS:\n  ' + problems.join('\n  ') : 'all locale columns complete',
  '',
].join('\n');
writeFileSync(join(DEV, 'build-report.txt'), summary, 'utf8');
if (problems.length) {
  console.error(summary);
  process.exit(1);
}
console.log(summary);
