# _dev — build & verification tooling

**Not part of the deployed site.** `robots.txt` blocks `/_dev/`, but the cleanest
option is to exclude this directory from your build output entirely.

These tools exist for one reason: **every number published on the tool pages is
measured, not estimated.** If you add a new converter page, measure first, then
write the copy.

---

## Requirements

- Node 18+
- Google Chrome installed (the scripts drive the real browser, not a bundled one)
- `playwright-core`

```bash
# either install it here
cd _dev && npm i playwright-core

# or point at an existing install
export PW_ROOT=/path/to/dir/with/playwright-core
```

The scripts are self-locating — no hardcoded absolute paths. `CHROME_PATH` and
`ASSETS_DIR` env vars override the browser binary and fixture directory.

`.gitignore` in the site root keeps the transient output out of history:
`test-assets/` (about 27 MB of downloaded conversions, screenshots and ZIPs),
the generated `*-report*.txt`, and `_*.mjs` scratch copies. It is scoped to
`png_tool_pro/` on purpose — the git root is `go_common/`, which holds unrelated
projects.

---

## Scripts

### `build-pages.mjs` — the generator

```bash
node build-pages.mjs
```

Renders all **16 pages** (4 pages × `en`/`zh`/`ja`/`ko`) plus `sitemap.xml` from
the dictionaries in `i18n/` and `assets/i18n.js`. It computes each page's output
path, its relative asset prefix, its canonical, the full hreflang cluster, the
nav language switcher and its JSON-LD.

**The generated `index.html` files are build output — never hand-edit them.**

It also refuses to write a broken build: it compiles every dictionary's `extSrc`
regex and checks it matches a real filename (see trap 8), verifies each locale
column defines every required key, and asserts each output really contains its
locale's `<html lang>`, five hreflang links and its own headline. A failure is
reported in `build-report.txt` and exits non-zero.

### `site.mjs` — the domain and tool list

`SITE` is the only place the domain is written. `TOOLS` drives the nav, the
cluster block and the sitemap. Change the domain here and re-run the build.

### `verify-cluster.mjs` — the end-to-end verifier (English)

```bash
node verify-cluster.mjs                 # all three pages
node verify-cluster.mjs heic-to-jpg     # one page
```

Serves the site from inside its own process (a separate static server kept dying
between runs), then drives real Chrome through every page: injects genuine sample
files, waits for the conversion to **settle**, downloads the actual output bytes
and validates them structurally.

**124 assertions.** A page is not "done" because it renders — it is done when the
file it hands the user is a structurally valid image with a parsed real dimension.

What it covers per page: no JS errors on load · h1 · nav aria-current · all three
cluster links · workspace hidden before input · wrong format rejected without
opening the workspace · real sample decodes · **0 bytes outbound** · decoder name
reported · every output format downloaded and byte-validated (magic + dimensions)
· quality slider and match-size button enable states · transparency warning
appears and clears · comparison panel renders both panes · ZIP is a real ZIP ·
workspace collapses after clearing. Cluster level: 6 routes return 200 · hub links
out · **all three pages cross-link** · sitemap coverage incl. localised routes.

Fallback decoders are forced with `?decode=` so the rarely-hit paths are actually
exercised, then asserted to produce valid output.

Outputs land in `test-assets/` — safe to delete, they are regenerated each run.

### `verify-i18n.mjs` — the multi-language verifier

```bash
node verify-i18n.mjs
```

**291 assertions.** Three layers, in increasing order of usefulness:

1. **Dictionary integrity** — every locale column defines every key, and the
   prominent copy genuinely differs from English. Catches a column that was
   filled by copy-paste or left half-translated.
2. **Static page checks, all 16 routes** — `<html lang>`, canonical, the five
   hreflang links, the switcher resolving to the right siblings, and (the one
   that matters) **every in-page converter link staying inside its own locale**.
3. **Live conversion in each language** — a real `.heic` through `en`, `zh`, `ja`
   and `ko`, output validated at byte level and asserted byte-identical across
   languages, plus the rendered UI strings (drop heading, buttons, trust bar)
   asserted to be in that locale.

Layer 3 is the point. The engine falls back to English for a missing key, so a
page can look completely fine while serving English to a Chinese visitor; only
reading the rendered strings catches it.

### `probe-sizes.mjs` — the measurement tool

```bash
node probe-sizes.mjs
node probe-sizes.mjs test-assets/big.avif --quality 85,70 --formats png,jpeg
```

Sweeps quality × format for each fixture and prints real output sizes. **Run this
before writing any size claim into a page.**

### `gen-fixture.mjs` — transparency fixture

```bash
node gen-fixture.mjs
```

None of the downloaded samples carry an alpha channel, so this generates a WebP
that does. Without it the transparency warning feature cannot be verified — and
that warning guards against silent data loss, which makes it the one feature that
must be tested rather than assumed.

### `shot-top.mjs` — layout screenshots

```bash
node shot-top.mjs
```

Captures the top strip of **8 targets** — the four English pages plus the `zh`,
`ja` and `ko` hubs and one localized tool page — so the navigation, the language
switcher and the trust bar can be eyeballed at real size. Useful for catching
overflow and wrapping that only shows up at full width.

Alongside each screenshot it prints the switcher's resolved targets
(`中文->../zh/ *`), which is the cheapest way to confirm every locale link points
where you think it does, and the trust-bar geometry (`pillOverflowRight`) so a
pill that overflows the bar is caught numerically rather than by eye.

### `serve.mjs` — local preview

```bash
node serve.mjs          # http://127.0.0.1:8814
```

A plain static server for clicking through the built site in a browser. You need
it rather than opening the files directly: the pages are ES modules, and
`file://` blocks module loading by CORS. It sends `text/javascript` for `.js`,
which trap 3 explains is required.

---

## Fixtures in `test-assets/`

| File | What it is |
|---|---|
| `sample2.heic` | real HEIC, 1440×960, brand `mif1` |
| `big.webp` | real 1600×1068 photo, 294.6 KB |
| `s.webp`, `s2.webp` | small WebP, incl. a lossless-mode one |
| `transparent.webp` | generated by `gen-fixture.mjs`, has alpha |
| `big.avif` | real 1600×1068, 168.3 KB |
| `a.avif`, `sofa_grid1x5_420.avif` | libavif test images |
| `fox.profile0.10bpc.yuv420.avif` | **10-bit** AVIF — the awkward case |
| `big.jpg` | JPEG control |

---

## Traps this workflow already hit

Recording them so they are not rediscovered:

1. **`waitForFunction` argument order.** Passing options as the second arg instead
   of the third makes it fail silently — the verification then proves nothing.
2. **Waiting for "settled" must mean the status text is unchanged across three
   consecutive polls.** Testing merely for the absence of `decoding`/`optimizing`
   returns immediately in non-fit modes, so you download the *previous* render's
   output and assert against a stale file. Most subtle bug in the harness.
3. **A hand-rolled static server must send `text/javascript` for `.js`**, or module
   imports fail in a way that is hard to trace back to the server.
4. **Concurrent edits to the same file silently drop changes.** Serialize edits to
   any single file, and re-check that markers actually landed before running.
5. **`convertToBlob({ quality: undefined })` is unreliable.** For lossless targets
   omit the `quality` key entirely rather than passing undefined.
6. **Worker scope needs its own network shim.** A main-thread patch of
   `fetch`/`XHR` cannot see requests made inside a Worker. Dynamic `import()` also
   cannot be patched, so those are reported explicitly.
7. **Concurrent `file://` module loading is blocked by CORS.** Serve over HTTP.
8. **A regex written inside a template literal silently loses its backslash.**
   The dictionaries hold `extSrc` in backticks, so `\.` collapses to `.` — the
   regex still compiles, still matches the happy path, and quietly accepts
   `foowebp` as a `.webp`. Nothing throws, so the page ships working on every
   fixture you happen to try. The build now compiles each `extSrc` and matches it
   against a real filename and a near-miss before it will write anything.
9. **XML documents have no `<body>`.** `document.body.innerText` on `sitemap.xml`
   returns nothing and throws nothing — the assertion "sitemap lists every page"
   fails with an empty string, which reads like a content problem instead of a
   wrong-API problem. Read `document.documentElement.textContent` instead.
10. **Keep closing tokens in exactly one place when a generator composes code.**
    The JSON-LD and config blocks are emitted line by line; one extra `});` from
    the builder plus one from the wrapper produced `}););` — a syntax error that
    only shows up when the browser parses the page, not when the string is built.
11. **`html.length` is not the file size.** It counts UTF-16 code units, so a
    CJK page reports ~2 bytes per character short of reality and the build report
    stops agreeing with `ls`. Use `Buffer.byteLength(html, 'utf8')`.
