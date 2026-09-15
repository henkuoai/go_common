/* =====================================================================
   Browser-Local Converter — shared interaction engine.

   Every page in the cluster mounts this with a small config object and
   inherits the identical interaction skeleton:

     drop / paste / pick  ->  worker-pool decode  ->  canvas encode
     ->  per-file download + ZIP  ->  before/after compare  ->  size banner

   Only the decode step is page-specific, and it lives in the page's own
   <script type="javascript/worker" id="..."> block. Everything else —
   layout, batching, quality handling, size accounting, the network
   self-verification panel — is shared, so a fix here fixes all pages.

   Localisation: every user-visible string comes from assets/i18n.js via
   t(key). The page passes cfg.locale. Page-level copy (headings, banner
   explanations, verify steps) is supplied by the page itself, already
   translated, so nothing here needs to know about page content.
   ===================================================================== */

import { UI } from './i18n.js';

/* Requests that legitimately belong to the tool itself: the one-time
   codec download. Anything else firing during a conversion would mean a
   file left the machine, which is exactly what we claim never happens. */
const CODEC_RE = /(libheif|libavif|jsquash|fflate|jsdelivr|unpkg|esm\.sh)/i;

/* Injected ahead of every page's worker source. A worker has its own global
   scope, so the page-level patch cannot see its traffic; without this the
   "nothing is uploaded" claim would silently only cover the main thread.
   Page workers therefore implement decoding and nothing else. */
const WORKER_NET_SHIM = String.raw`
(function () {
  function lenOf(body) {
    if (body == null) return 0;
    try {
      if (typeof body === 'string') return body.length;
      if (typeof Blob !== 'undefined' && body instanceof Blob) return body.size;
      if (body instanceof ArrayBuffer) return body.byteLength;
      if (ArrayBuffer.isView(body)) return body.byteLength;
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        var n = 0; for (var v of body.values()) n += (v instanceof Blob ? v.size : String(v).length); return n;
      }
      if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) return body.toString().length;
    } catch (e) {}
    return -1;
  }
  function track(url, how, out) {
    try { self.postMessage({ kind: 'net', url: String(url).slice(0, 170), how: how, out: typeof out === 'number' ? out : 0 }); } catch (e) {}
  }
  // dynamic import() is host-level and invisible to a fetch patch, so page
  // workers report those explicitly through this hook.
  self.__trackNet = track;
  var f = self.fetch;
  if (f) self.fetch = function (input, init) {
    track((input && input.url) || String(input), 'worker fetch', init && init.body != null ? lenOf(init.body) : 0);
    return f.apply(this, arguments);
  };
  if (self.XMLHttpRequest) {
    var o = self.XMLHttpRequest.prototype.open;
    self.XMLHttpRequest.prototype.open = function (m, u) {
      this.__toolUrl = u;
      track(u, 'worker xhr', 0);
      return o.apply(this, arguments);
    };
    var s = self.XMLHttpRequest.prototype.send;
    self.XMLHttpRequest.prototype.send = function (body) {
      var n = lenOf(body);
      if (n !== 0) track(this.__toolUrl || '(worker xhr)', 'worker xhr body', n);
      return s.apply(this, arguments);
    };
  }
  if (self.navigator && self.navigator.sendBeacon) {
    var b = self.navigator.sendBeacon;
    self.navigator.sendBeacon = function (u, data) { track(u, 'worker beacon', lenOf(data)); return b.apply(this, arguments); };
  }
})();
`;

/* Structural defaults only. Every piece of copy is resolved through t()
   inside mountTool, because it depends on cfg.locale. */
const DEFAULTS = {
  mount: '#tool',
  locale: 'en',
  zipName: 'converted.zip',
  poolSize: 4,
  workerId: null,
  quality: 80,
  minQuality: 40,
  maxQuality: 100,
  qualityHint: '',
  showFit: true,
  detectAlpha: false,   // set true on pages whose inputs can carry transparency
  downloadZip: true,
  workerMsgs: {},       // decoder error strings, injected into the worker as __MSG
  banner: {},
};

const fmtBytes = (b) => {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  return (b / 1048576).toFixed(2) + ' MB';
};

// Any string we interpolate into innerHTML has to be escaped. Filenames are
// the obvious case: they come straight from the user's disk.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const ICON_UPLOAD =
  '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="1.9" ' +
  'stroke-linecap="round" stroke-linejoin="round"><path d="M12 16V4M12 4 7 9M12 5l5 5"/>' +
  '<path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2"/></svg>';

export function mountTool(userCfg) {
  const cfg = { ...DEFAULTS, ...userCfg };

  /* ---------------- localisation ---------------- */
  const locale = cfg.locale || 'en';
  const dict = (UI && UI[locale]) || UI.en;
  // Missing key falls back to English, then to the key itself — a visible
  // marker beats a silently empty label.
  function t(key, vars) {
    let s = dict[key];
    if (s == null) s = UI.en[key];
    if (s == null) s = key;
    if (vars) for (const k in vars) s = s.split('{' + k + '}').join(vars[k]);
    return s;
  }
  // "1 file" / "3 files" — English inflects, the CJK columns repeat.
  const filesWord = (n) => t(n === 1 ? 'fileOne' : 'fileMany', { n });

  cfg.input = userCfg.input;
  cfg.formats = userCfg.formats;
  cfg.qualityLabel = userCfg.qualityLabel || t('outputQuality');
  cfg.fitLabel = userCfg.fitLabel || t('matchOriginal');
  cfg.resizeHint = userCfg.resizeHint || t('resizeHint');
  cfg.presets = userCfg.presets || [
    [55, t('presetSmaller')], [70, t('presetBalanced')],
    [85, t('presetSharper')], [95, t('presetMax')],
  ];
  cfg.resize = userCfg.resize || [
    [0, t('resizeKeep')], [2560, t('resize2560')], [2048, t('resize2048')],
    [1280, t('resize1280')], [800, t('resize800')],
  ];
  cfg.banner = { ...(userCfg.banner || {}) };
  cfg.verify = { title: t('verifyTitle'), lead: t('verifyLead'), steps: [], ...(userCfg.verify || {}) };
  cfg.compare = { leftTag: t('compareLeft'), ...(userCfg.compare || {}) };

  const root = document.querySelector(cfg.mount);
  if (!root) throw new Error('mountTool: no element matches ' + cfg.mount);

  const fmtByMime = Object.fromEntries(cfg.formats.map((f) => [f.mime, f]));
  const isLossy = (m) => !!(fmtByMime[m] && fmtByMime[m].lossy);

  /* ------------------------------------------------------------------ *
   * Markup
   * ------------------------------------------------------------------ */
  root.innerHTML = `
    <div class="drop" id="drop">
      <div class="icon">${ICON_UPLOAD}</div>
      <h2>${t('dropHere', { name: cfg.input.dropTitle || cfg.input.name })}</h2>
      <p>${cfg.input.dropHint || t('dropHint')}</p>
      <span class="cta" id="pickBtn">${t('chooseFiles')}</span>
      <input type="file" id="picker" accept="${cfg.input.accept}" multiple hidden>
    </div>

    <div class="workspace" id="workspace">
      <div class="toolbar">
        <div class="field">
          <label for="quality">${cfg.qualityLabel}</label>
          <div class="qrow">
            <input type="range" id="quality" min="${cfg.minQuality}" max="${cfg.maxQuality}" value="${cfg.quality}" step="1">
            <span class="qval" id="qval">${cfg.quality}%</span>
          </div>
          <div class="presets" id="presets">
            ${cfg.presets.map(([q, l]) => `<button data-q="${q}"${q === cfg.quality ? ' class="on"' : ''}>${esc(l)}</button>`).join('')}
            ${cfg.showFit ? `<button class="star" id="fitBtn">${esc(cfg.fitLabel)}</button>` : ''}
          </div>
          <div class="hint" id="qhint">${cfg.qualityHint}</div>
        </div>
        <div class="field">
          <label for="resize">${t('resize')}</label>
          <select id="resize">
            ${cfg.resize.map(([v, l], i) => `<option value="${v}"${i === 0 ? ' selected' : ''}>${esc(l)}</option>`).join('')}
          </select>
          <div class="hint">${esc(cfg.resizeHint)}</div>
        </div>
        <div class="field">
          <label>${t('outputFormat')}</label>
          <div class="seg" id="fmtseg">
            ${cfg.formats.map((f) => `<button data-fmt="${f.mime}"${f.mime === cfg.format ? ' class="on"' : ''}>${esc(f.label)}</button>`).join('')}
          </div>
          <div class="hint" id="fmthint"></div>
        </div>
      </div>

      <div class="banner" id="banner">
        <div class="btxt" id="bannerText"></div>
        <div class="bact" id="bannerAct"></div>
      </div>

      <div class="actions">
        <button class="btn primary" id="dlAll">${t('downloadAll')}</button>
        ${cfg.downloadZip ? `<button class="btn" id="dlZip">${t('downloadZip')}</button>` : ''}
        <button class="btn" id="addMore">${t('addMore')}</button>
        <span class="spacer"></span>
        <button class="btn link" id="clearAll">${t('clearAll')}</button>
      </div>

      <div class="list" id="list"></div>

      <div class="verify">
        <h3>${cfg.verify.title}</h3>
        <p>${cfg.verify.lead}</p>
        <p><span class="counter">${t('bytesUploaded')} <span id="bytesUp">0 B</span></span></p>
        <div id="netDetail"></div>
        <ol>${cfg.verify.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
      </div>
    </div>

    <div class="modal" id="modal">
      <div class="sheet">
        <header>
          <h3 id="mTitle">${t('modalCompare')}</h3>
          <button class="mini x" id="mClose">✕</button>
        </header>
        <div class="body">
          <div class="cmp" id="cmp">
            <canvas id="cmpBase"></canvas>
            <div class="top"><canvas id="cmpTop"></canvas></div>
            <div class="handle" id="cmpHandle"></div>
            <span class="tag l">${cfg.compare.leftTag}</span>
            <span class="tag r" id="tagRight">—</span>
          </div>
          <div class="stats">
            <div class="stat"><div class="k">${t('statPixel')}</div><div class="v" id="sDim">—</div></div>
            <div class="stat"><div class="k">${t('statOrig')}</div><div class="v" id="sOrig">—</div></div>
            <div class="stat"><div class="k">${t('statConverted')}</div><div class="v good" id="sNew">—</div></div>
            <div class="stat"><div class="k">${t('statChange')}</div><div class="v" id="sDelta">—</div></div>
            <div class="stat"><div class="k">${t('statDecoder')}</div><div class="v" id="sMode">—</div></div>
            <div class="stat"><div class="k">${t('statDecodeTime')}</div><div class="v" id="sMs">—</div></div>
          </div>
        </div>
      </div>
    </div>
  `;

  const $ = (id) => root.querySelector('#' + id) || document.getElementById(id);
  const drop = $('drop'), picker = $('picker'), workspace = $('workspace');

  // The trust bar lives outside the tool mount (it sits above the header),
  // so the engine fills it in. /pages only provide the empty shell, which
  // guarantees the counter's element ids always exist.
  const trustbar = document.querySelector('#trustbar');
  if (trustbar) {
    trustbar.innerHTML =
      '<div class="wrap">' +
      '<span>' + t('trustRuns') + '</span>' +
      '<span class="dot-sep">·</span><span>' + t('trustNoUpload') + '</span>' +
      '<span class="dot-sep">·</span><span>' + t('trustNoSignup') + '</span>' +
      '<span class="dot-sep">·</span><span>' + t('trustNoWatermark') + '</span>' +
      '<span class="netpill" id="netpill"><i class="led"></i>' +
      '<span id="netlabel">' + t('netRequests') + ' <span id="netcount">0</span></span></span>' +
      '</div>';
  }

  /* ------------------------------------------------------------------ *
   * Network self-verification.
   * The counter is the product feature, not decoration: it only means
   * something if it catches Worker-scoped traffic too, so the workers
   * report their own requests back and the two streams are merged.
   * ------------------------------------------------------------------ */
  const net = { seen: new Set(), items: [] };
  let armed = false;

  /* Outbound byte accounting. Counting requests alone is weak proof — a
     single request could still carry the whole file. Summing the actual
     body sizes is the claim that matters: "0 B left this machine". */
  function lenOf(body) {
    if (body == null) return 0;
    try {
      if (typeof body === 'string') return new Blob([body]).size;
      if (typeof Blob !== 'undefined' && body instanceof Blob) return body.size;
      if (body instanceof ArrayBuffer) return body.byteLength;
      if (ArrayBuffer.isView(body)) return body.byteLength;
      if (typeof FormData !== 'undefined' && body instanceof FormData) {
        let n = 0;
        for (const v of body.values()) n += (v instanceof Blob ? v.size : String(v).length);
        return n;
      }
      if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
        return new Blob([body.toString()]).size;
      }
    } catch (_) {}
    return -1;   // unmeasurable — treated as suspicious, not as zero
  }

  function recordNet(entry) {
    if (!armed) return;
    if (entry.out > 0 || entry.out === -1) NET_UNKNOWN = true;
    const key = entry.url + '|' + (entry.how || '');
    if (net.seen.has(key)) return;        // a pool of N workers imports the same URL N times
    net.seen.add(key);
    net.items.push(entry);
    paintNet();
  }
  let NET_UNKNOWN = false;

  const _fetch = window.fetch;
  if (_fetch) window.fetch = function (input, init) {
    const url = (input && input.url) || String(input);
    const body = (init && init.body) || (input && input.body);
    recordNet({ url: url, how: 'fetch', out: lenOf(body) });
    return _fetch.apply(this, arguments);
  };
  const _xhrOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, u, ...rest) {
    this.__toolUrl = u;
    recordNet({ url: u, how: 'xhr', out: 0 });
    return _xhrOpen.call(this, m, u, ...rest);
  };
  const _xhrSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function (body) {
    const n = lenOf(body);
    if (n !== 0) recordNet({ url: this.__toolUrl || '(xhr)', how: 'xhr body', out: n });
    return _xhrSend.apply(this, arguments);
  };
  if (navigator.sendBeacon) {
    const _b = navigator.sendBeacon;
    navigator.sendBeacon = function (u, data) {
      recordNet({ url: u, how: 'beacon', out: lenOf(data) });
      return _b.apply(this, arguments);
    };
  }

  function paintNet() {
    const n = $('netcount'), pill = $('netpill'), bytes = $('bytesUp'), box = $('netDetail');
    if (!n || !box) return;
    const codecOnly = net.items.every((i) => CODEC_RE.test(i.url));
    const sent = net.items.reduce((s, i) => s + (i.out > 0 ? i.out : 0), 0);
    const clean = codecOnly && !NET_UNKNOWN;
    n.textContent = net.items.length;
    if (pill) pill.classList.toggle('alert', !clean);
    if (bytes) bytes.textContent = clean ? '0 B' : (sent > 0 ? fmtBytes(sent) : t('unmeasurable'));

    if (!net.items.length) { box.innerHTML = ''; return; }
    box.innerHTML =
      '<ul class="netlist">' +
      net.items.map((i) =>
        '<li><code>' + i.how + '</code> ' + i.url.replace(/^https:\/\//, '') +
        (i.out > 0 ? ' <b style="color:#dc2626">' + esc(t('netSent', { size: fmtBytes(i.out) })) + '</b>'
          : i.out === -1 ? ' <b style="color:#dc2626">' + esc(t('netUnmeasurable')) + '</b>'
          : CODEC_RE.test(i.url) ? ' <em>' + esc(t('netCodecNote')) + '</em>'
          : ' <em>' + esc(t('netSentNone')) + '</em>') +
      '</li>').join('') +
      '</ul>';
  }

  /* ------------------------------------------------------------------ *
   * Worker pool. Decoding is the CPU-heavy half (a 12 MP photo can take
   * seconds), so it never touches the main thread. The page supplies the
   * worker source; if it supplies none, decode falls back to the main
   * thread, which is fine for formats browsers already unpack natively.
   * ------------------------------------------------------------------ */
  const POOL = Math.max(1, Math.min(navigator.hardwareConcurrency || 2, cfg.poolSize));
  const idle = [], busy = new Map(), queue = [];
  let workerURL = null;

  const workerSrc = cfg.workerId ? document.getElementById(cfg.workerId) : null;
  if (workerSrc) {
    // The decoder's own error strings are translated per page language, so
    // they reach the worker through self.__MSG instead of being baked into
    // the worker source — one copy of each decoder serves every language.
    const MSG = 'self.__MSG = ' + JSON.stringify(cfg.workerMsgs || {}) + ';\n';
    workerURL = URL.createObjectURL(
      new Blob([WORKER_NET_SHIM, '\n', MSG, workerSrc.textContent], { type: 'text/javascript' })
    );
  }

  function spawn() {
    const w = new Worker(workerURL, { type: 'module' });
    w.onmessage = (e) => {
      const d = e.data || {};
      if (d.kind === 'net') {
        // Worker-scoped traffic: the page-level patch cannot see inside a
        // worker, so each worker reports its own requests back.
        recordNet({ url: d.url, how: d.how || 'worker', out: typeof d.out === 'number' ? d.out : 0 });
        return;
      }
      const job = busy.get(d.id);
      busy.delete(d.id);
      idle.push(w);
      if (job) job(d);
      drain();
    };
    w.onerror = () => {
      // A crashed worker must not take the whole batch down with it.
      try { w.terminate(); } catch (_) {}
      const i = idle.indexOf(w); if (i >= 0) idle.splice(i, 1);
      for (const [id, job] of busy) {
        if (job.w === w) { busy.delete(id); job({ id, ok: false, error: t('decoderCrashed') }); }
      }
      if (queue.length) { idle.push(spawn()); drain(); }
    };
    return w;
  }
  if (workerURL) for (let i = 0; i < POOL; i++) idle.push(spawn());

  function runDecode(payload) {
    if (!workerURL) return decodeOnMainThread(payload);
    return new Promise((resolve) => { queue.push({ payload, resolve }); drain(); });
  }
  function drain() {
    while (queue.length && idle.length) {
      const w = idle.pop();
      const { payload, resolve } = queue.shift();
      resolve.w = w;
      busy.set(payload.id, resolve);
      w.postMessage(payload, [payload.buffer]);
    }
  }
  // Fallback path for pages with no worker. Same contract, main thread.
  // Pages whose format can carry its own fallback (e.g. an <img> element for
  // engines without createImageBitmap) supply cfg.decode.
  async function decodeOnMainThread(payload) {
    const t0 = performance.now();
    try {
      if (typeof cfg.decode === 'function') {
        const out = await cfg.decode(payload.buffer, payload.mime, payload.force);
        if (!out || !out.bitmap) throw new Error('Decoder returned no image');
        return { id: payload.id, ok: true, mode: 'native', ms: Math.round(performance.now() - t0), ...out };
      }
      const bmp = await createImageBitmap(new Blob([payload.buffer], { type: payload.mime }));
      return {
        id: payload.id, ok: true, bitmap: bmp, width: bmp.width, height: bmp.height,
        mode: 'native', ms: Math.round(performance.now() - t0),
      };
    } catch (err) {
      return { id: payload.id, ok: false, error: (err && err.message) || String(err) };
    }
  }

  // Test hook: ?decode=wasm forces the software-decoder path so the
  // fallback can actually be exercised on a browser that has a native one.
  const forceMode = new URLSearchParams(location.search).get('decode') || '';

  /* ------------------------------------------------------------------ *
   * State
   * ------------------------------------------------------------------ */
  const state = {
    files: [],               // { id, file, name, size, status, bitmap, w, h, mode, ms, out, err }
    quality: cfg.quality / 100,
    maxDim: 0,
    format: cfg.format,
    fit: false,
    seq: 0,
    encoding: false,
    dirty: false,
  };

  /* ------------------------------------------------------------------ *
   * Encoding — reuses the decoded ImageBitmap, so dragging the quality
   * slider re-encodes without re-decoding the source file.
   * ------------------------------------------------------------------ */
  function targetSize(file) {
    let w = file.bitmap.width, h = file.bitmap.height;
    if (state.maxDim > 0 && Math.max(w, h) > state.maxDim) {
      const s = state.maxDim / Math.max(w, h);
      w = Math.round(w * s); h = Math.round(h * s);
    }
    return { w, h };
  }

  // Transparency detection. JPEG cannot store an alpha channel, so switching
  // a transparent source to JPG silently replaces those areas with a solid
  // colour. Checking a downscaled copy costs almost nothing and turns a
  // silent data-loss bug into an explicit warning.
  function detectAlpha(bitmap, w, h) {
    try {
      const cap = 200;
      const r = Math.min(1, cap / Math.max(w, h));
      const cw = Math.max(1, Math.round(w * r)), ch = Math.max(1, Math.round(h * r));
      const c = typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(cw, ch)
        : Object.assign(document.createElement('canvas'), { width: cw, height: ch });
      const cx = c.getContext('2d');
      cx.drawImage(bitmap, 0, 0, cw, ch);
      const d = cx.getImageData(0, 0, cw, ch).data;
      for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
    } catch (_) {}
    return false;
  }

  async function renderBlob(file, w, h, quality, format) {
    // Lossless targets ignore quality entirely — omit the key rather than
    // pass undefined, which some engines reject on convertToBlob.
    const opts = quality == null ? { type: format } : { type: format, quality };
    if (typeof OffscreenCanvas !== 'undefined') {
      const c = new OffscreenCanvas(w, h);
      c.getContext('2d').drawImage(file.bitmap, 0, 0, w, h);
      return c.convertToBlob(opts);
    }
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    c.getContext('2d').drawImage(file.bitmap, 0, 0, w, h);
    return new Promise((r) => c.toBlob(r, format, quality == null ? undefined : quality));
  }

  // Bisect quality until the output lands at or just under the original
  // byte size. Only meaningful for lossy formats — PNG ignores quality.
  async function fitQuality(file, w, h) {
    const target = file.size;
    let lo = 0.35, hi = 0.98, best = null, bestQ = 0.35;
    for (let i = 0; i < 5; i++) {
      const mid = (lo + hi) / 2;
      const blob = await renderBlob(file, w, h, mid, state.format);
      if (blob.size <= target) { best = blob; bestQ = mid; lo = mid; } else { hi = mid; }
      if (hi - lo < 0.03) break;
    }
    // If even the floor overshoots, that is the honest answer — do not fake it.
    if (!best) best = await renderBlob(file, w, h, bestQ, state.format);
    file.fitQ = Math.round(bestQ * 100);
    return bestQ;
  }

  async function encode(file) {
    const t0 = performance.now();
    const { w, h } = targetSize(file);
    const lossy = isLossy(state.format);
    let q = state.quality;
    if (state.fit && lossy) q = await fitQuality(file, w, h);
    const blob = await renderBlob(file, w, h, lossy ? q : undefined, state.format);

    if (file.out && file.out.url) URL.revokeObjectURL(file.out.url);
    file.out = { blob, url: URL.createObjectURL(blob), size: blob.size, w, h, q: lossy ? q : 0, ms: Math.round(performance.now() - t0) };
  }

  let encodeTimer = null;
  function scheduleEncode() {
    state.dirty = true;
    clearTimeout(encodeTimer);
    encodeTimer = setTimeout(flushEncode, 260);
  }
  async function flushEncode() {
    if (state.encoding) return scheduleEncode();
    state.encoding = true;
    state.dirty = false;
    for (const f of state.files.filter((x) => x.status === 'ready')) {
      if (state.fit) { f.busy = true; render(); }   // bisection takes several passes — show it
      try {
        await encode(f);
      } catch (e) {
        f.err = t('encodeFailed') + ((e && e.message) || e);
      }
      f.busy = false;
      render();
      if (state.dirty) break;
    }
    state.encoding = false;
    render();
    if (state.dirty) scheduleEncode();
  }

  /* ------------------------------------------------------------------ *
   * Adding files
   * ------------------------------------------------------------------ */
  async function accepts(file) {
    if (cfg.input.sniff) return cfg.input.sniff(file);
    return cfg.input.ext.test(file.name);
  }

  function notice(kind, html, ms) {
    const el = document.createElement('div');
    el.className = 'banner ' + kind + ' show';
    el.style.marginTop = '16px';
    el.innerHTML = '<div class="btxt">' + html + '</div>';
    root.insertBefore(el, workspace);
    setTimeout(() => el.remove(), ms);
  }

  async function addFiles(fileList) {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;

    // Sort out what is actually convertible BEFORE revealing the workspace,
    // so dropping the wrong type cannot open an empty converter.
    const accepted = [], skipped = [];
    for (const f of incoming) (await accepts(f) ? accepted : skipped).push(f);

    if (!armed) { armed = true; net.items.length = 0; net.seen.clear(); paintNet(); }

    if (!accepted.length) {
      notice('warn', esc(cfg.input.reject), 8000);
      return;
    }

    workspace.classList.add('on');

    if (skipped.length) {
      const names = skipped.slice(0, 3).map((f) => esc(f.name)).join(', ');
      notice('info', t('bannerSkipped', {
        files: filesWord(skipped.length),
        name: esc(cfg.input.name),
        list: names,
        more: skipped.length > 3 ? esc(t('bannerSkippedMore', { n: skipped.length - 3 })) : '',
      }), 9000);
    }

    for (const f of accepted) {
      const rec = {
        id: ++state.seq, file: f, name: f.name, size: f.size,
        status: 'decoding', bitmap: null, w: 0, h: 0, mode: '', ms: 0, out: null, err: '',
      };
      state.files.push(rec);
      decodeOne(rec);
    }
    render();
  }

  async function decodeOne(rec) {
    try {
      const buffer = await rec.file.arrayBuffer();
      const res = await runDecode({ id: rec.id, buffer, mime: rec.file.type || cfg.input.mime, force: forceMode });
      if (!res.ok) {
        rec.status = 'error';
        rec.err = res.error;
        render();
        return;
      }
      rec.bitmap = res.bitmap;
      rec.w = res.width; rec.h = res.height;
      rec.mode = res.mode; rec.ms = res.ms;
      rec.status = 'ready';
      if (cfg.detectAlpha) rec.hasAlpha = detectAlpha(rec.bitmap, rec.w, rec.h);
      await encode(rec);
    } catch (e) {
      rec.status = 'error';
      rec.err = t('convertFailed') + ((e && e.message) || e);
    }
    render();
  }

  /* ------------------------------------------------------------------ *
   * Naming + download
   * ------------------------------------------------------------------ */
  const baseName = (n) => n.replace(cfg.input.ext, '') || n;
  const outName = (f) => baseName(f.name) + '.' + fmtByMime[state.format].ext;

  function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  async function downloadAll() {
    for (const f of state.files.filter((x) => x.out)) {
      saveBlob(f.out.blob, outName(f));
      await new Promise((r) => setTimeout(r, 220));   // keep the browser from dropping the burst
    }
  }

  async function downloadZip() {
    const btn = $('dlZip');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = t('packing');
    try {
      const { zipSync } = await import('https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js');
      const bag = {};
      const seen = new Set();
      for (const f of state.files.filter((x) => x.out)) {
        let name = outName(f), i = 2;
        while (seen.has(name)) name = baseName(f.name) + '-' + i++ + '.' + fmtByMime[state.format].ext;
        seen.add(name);
        bag[name] = new Uint8Array(await f.out.blob.arrayBuffer());
      }
      if (!Object.keys(bag).length) return;
      // Images are already compressed — STORE avoids a pointless second pass.
      const zipped = zipSync(bag, { level: 0 });
      saveBlob(new Blob([zipped], { type: 'application/zip' }), cfg.zipName);
    } catch (e) {
      alert(t('zipFailed') + e.message);
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  }

  /* ------------------------------------------------------------------ *
   * Rendering
   * ------------------------------------------------------------------ */
  function render() {
    const list = $('list');
    list.innerHTML = '';

    for (const f of state.files) {
      const row = document.createElement('div');
      row.className = 'item' + (f.status === 'error' ? ' err' : '');

      const thumb = document.createElement('div');
      thumb.className = 'thumb';
      if (f.status === 'decoding') {
        thumb.innerHTML = '<div class="spin"></div>';
      } else if (f.bitmap) {
        const c = document.createElement('canvas');
        const s = 112;
        const r = Math.min(s / f.w, s / f.h);
        c.width = Math.max(1, Math.round(f.w * r));
        c.height = Math.max(1, Math.round(f.h * r));
        c.getContext('2d').drawImage(f.bitmap, 0, 0, c.width, c.height);
        thumb.appendChild(c);
      } else {
        thumb.textContent = '⚠';
      }

      const meta = document.createElement('div');
      meta.className = 'meta';
      const nm = document.createElement('div');
      nm.className = 'name';
      nm.textContent = f.name;
      meta.appendChild(nm);

      const sub = document.createElement('div');
      sub.className = 'sub';
      if (f.status === 'decoding') {
        sub.textContent = t('decoding');
      } else if (f.status === 'error') {
        sub.innerHTML = '<span class="bad">' + esc(f.err) + '</span>';
      } else {
        const ratio = f.out ? Math.round((1 - f.out.size / f.size) * 100) : 0;
        const grew = ratio < 0;
        sub.innerHTML =
          f.w + '×' + f.h +
          ' · ' + fmtBytes(f.size) +
          ' → <span class="' + (grew ? 'warn' : 'ok') + '">' + fmtBytes(f.out ? f.out.size : 0) + '</span>' +
          ' · ' + (ratio >= 0 ? '−' : '+') + Math.abs(ratio) + '%' +
          ' · ' + f.mode + ' ' + f.ms + 'ms' +
          (f.out && f.out.q ? ' · q' + Math.round(f.out.q * 100) : '');
        if (f.busy) sub.innerHTML += ' · <span class="ok">' + t('optimizing') + '</span>';
      }
      meta.appendChild(sub);

      if (f.status === 'decoding') {
        const p = document.createElement('div');
        p.className = 'progress';
        p.innerHTML = '<i style="width:38%"></i>';
        meta.appendChild(p);
      }

      const acts = document.createElement('div');
      acts.className = 'acts';
      if (f.status === 'ready' && f.out) {
        const cmp = document.createElement('button');
        cmp.className = 'mini';
        cmp.textContent = t('compare');
        cmp.onclick = () => openCompare(f);
        const dl = document.createElement('button');
        dl.className = 'mini dl';
        dl.textContent = t('download');
        dl.onclick = () => saveBlob(f.out.blob, outName(f));
        acts.append(cmp, dl);
      }
      const x = document.createElement('button');
      x.className = 'mini x';
      x.title = t('remove');
      x.textContent = '✕';
      x.onclick = () => remove(f.id);
      acts.appendChild(x);

      row.append(thumb, meta, acts);
      list.appendChild(row);
    }
    updateBanner();
  }

  /* ---------------------------------------------------------------- *
   * Size summary. Which direction is "bad" depends entirely on the
   * formats involved, so each page supplies its own explanation and its
   * own escape hatches rather than showing a generic number.
   * ---------------------------------------------------------------- */
  function updateBanner() {
    const banner = $('banner'), txt = $('bannerText'), act = $('bannerAct');
    const ready = state.files.filter((f) => f.out);
    if (!ready.length) { banner.classList.remove('show'); return; }

    const origTotal = ready.reduce((s, f) => s + f.size, 0);
    const newTotal = ready.reduce((s, f) => s + f.out.size, 0);
    const delta = Math.round((1 - newTotal / origTotal) * 100);
    const grew = newTotal > origTotal;

    banner.classList.add('show');
    banner.classList.toggle('warn', grew);
    banner.classList.toggle('good', !grew);
    act.innerHTML = '';

    // Transient progress first — it describes an operation in flight.
    if (state.fit && state.encoding) {
      banner.classList.remove('good');
      banner.classList.add('info');
      txt.innerHTML = t('bannerSearching');
      return;
    }

    // Transparency outranks the size story: losing an alpha channel is silent
    // data loss, whereas a bigger file is merely inconvenient. It deliberately
    // sits above the fit branch so "Match original size" cannot swallow it.
    const alphaCount = ready.filter((f) => f.hasAlpha).length;
    const fmtKeepsAlpha = fmtByMime[state.format].alpha !== false;
    if (cfg.detectAlpha && alphaCount && !fmtKeepsAlpha) {
      banner.classList.remove('good');
      banner.classList.add('warn');
      const qs = ready.filter((f) => f.fitQ).map((f) => f.fitQ);
      const auto = state.fit && qs.length
        ? t('bannerAlphaAuto', { q: Math.round(qs.reduce((a, b) => a + b, 0) / qs.length) })
        : '';
      txt.innerHTML = t('bannerAlpha', {
        n: alphaCount,
        files: filesWord(ready.length),
        fmt: esc(fmtByMime[state.format].label),
        orig: fmtBytes(origTotal),
        now: fmtBytes(newTotal),
      }) + auto;
      for (const a of (cfg.banner.grewActions || [])) {
        if (!a.act || !a.act.startsWith('format:')) continue;
        const target = fmtByMime[a.act.slice(7)];
        if (!target || target.alpha === false) continue;
        const b = document.createElement('button');
        b.textContent = t('keepTransparency', { fmt: target.label });
        b.onclick = () => selectFormat(target.mime);
        act.appendChild(b);
      }
      return;
    }

    if (state.fit) {
      const parts = ready.filter((f) => f.fitQ).map((f) => f.fitQ);
      const avg = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
      txt.innerHTML = t('bannerMatched', {
        orig: fmtBytes(origTotal),
        now: fmtBytes(newTotal),
        files: filesWord(ready.length),
        atQ: avg ? t('bannerMatchedQ', { q: avg }) : t('bannerMatchedEnd'),
      });
      return;
    }

    if (grew && cfg.banner.grew) {
      // The reason output grew depends entirely on what it grew INTO: a JPG
      // from AVIF is larger because AVIF is efficient, but a PNG from anything
      // is larger because PNG is lossless. Explaining the wrong one is worse
      // than saying nothing.
      const why = (cfg.banner.grewByFormat && cfg.banner.grewByFormat[state.format]) || cfg.banner.grew;
      txt.innerHTML = t('bannerGrew', {
        orig: fmtBytes(origTotal),
        now: fmtBytes(newTotal),
        pct: Math.abs(delta),
        why: why,
      });
      for (const a of (cfg.banner.grewActions || [])) {
        const b = document.createElement('button');
        b.textContent = a.label;
        if (a.act === 'fit') b.onclick = () => setFit(true);
        else if (a.act.startsWith('format:')) b.onclick = () => selectFormat(a.act.slice(7));
        else if (a.act.startsWith('resize:')) b.onclick = () => {
          const v = a.act.slice(7);
          resizeSel.value = v;
          resizeSel.dispatchEvent(new Event('change', { bubbles: true }));
        };
        act.appendChild(b);
      }
      return;
    }

    txt.innerHTML = t('bannerSaved', {
      pct: Math.abs(delta),
      orig: fmtBytes(origTotal),
      now: fmtBytes(newTotal),
      files: filesWord(ready.length),
    });
  }

  function remove(id) {
    const i = state.files.findIndex((f) => f.id === id);
    if (i < 0) return;
    const f = state.files[i];
    if (f.out && f.out.url) URL.revokeObjectURL(f.out.url);
    if (f.bitmap && f.bitmap.close) f.bitmap.close();
    state.files.splice(i, 1);
    if (!state.files.length) workspace.classList.remove('on');
    render();
  }

  /* ------------------------------------------------------------------ *
   * Compare overlay
   * ------------------------------------------------------------------ */
  function drawTo(canvas, source, w, h, maxPx) {
    const r = Math.min(1, maxPx / Math.max(w, h));
    canvas.width = Math.round(w * r);
    canvas.height = Math.round(h * r);
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  }

  function openCompare(f) {
    if (!f.out) return;
    $('mTitle').textContent = f.name + ' → ' + outName(f);

    // Left: the decoded source. Right: the actual bytes we are shipping.
    drawTo($('cmpBase'), f.bitmap, f.w, f.h, 1600);

    const top = $('cmpTop');
    const r = Math.min(1, 1600 / Math.max(f.out.w, f.out.h));
    top.width = Math.round(f.out.w * r);
    top.height = Math.round(f.out.h * r);

    $('tagRight').textContent =
      fmtByMime[state.format].label.toUpperCase() +
      (f.out.q ? ' · q' + Math.round(f.out.q * 100) : ' · ' + t('lossless'));

    const tmp = new Image();
    tmp.onload = () => {
      top.getContext('2d').drawImage(tmp, 0, 0, top.width, top.height);
      URL.revokeObjectURL(tmp.src);
    };
    tmp.src = f.out.url;

    $('sDim').textContent = f.out.w + '×' + f.out.h;
    $('sOrig').textContent = fmtBytes(f.size);
    $('sNew').textContent = fmtBytes(f.out.size);
    const d = Math.round((1 - f.out.size / f.size) * 100);
    $('sDelta').textContent = (d > 0 ? '−' : '+') + Math.abs(d) + '%';
    $('sMode').textContent = f.mode;
    $('sMs').textContent = f.ms + ' ms';

    setSplit(50);
    $('modal').classList.add('on');
  }

  function setSplit(pct) {
    pct = Math.max(2, Math.min(98, pct));
    root.querySelector('.cmp .top').style.clipPath = 'inset(0 0 0 ' + pct + '%)';
    $('cmpHandle').style.left = pct + '%';
  }

  /* ------------------------------------------------------------------ *
   * Controls
   * ------------------------------------------------------------------ */
  const quality = $('quality'), qval = $('qval'), resizeSel = $('resize');

  function paintRange() {
    const pct = ((quality.value - quality.min) / (quality.max - quality.min)) * 100;
    quality.style.setProperty('--pct', pct + '%');
  }

  function syncQualityUI() {
    const q = parseInt(quality.value, 10);
    const lossy = isLossy(state.format);

    for (const b of $('presets').children) {
      if (b.dataset && b.dataset.q) b.classList.toggle('on', !state.fit && parseInt(b.dataset.q, 10) === q);
    }
    const fitBtn = $('fitBtn');
    if (fitBtn) {
      fitBtn.classList.toggle('on', state.fit);
      fitBtn.disabled = !lossy;
      fitBtn.title = lossy ? t('fitTitleOn') : t('fitTitleOff');
    }
    quality.disabled = !lossy;
    qval.textContent = !lossy ? '—' : (state.fit ? t('qualityAuto') : q + '%');

    const hintByFmt = cfg.banner.qualityHintByFormat || cfg.qualityHintByFormat;
    if (hintByFmt) {
      $('qhint').textContent = hintByFmt[state.format] || cfg.qualityHint;
    }
  }

  function setFit(on) {
    state.fit = !!on && isLossy(state.format);
    syncQualityUI();
    scheduleEncode();
  }

  function selectFormat(fmt) {
    if (!fmtByMime[fmt]) return;
    state.format = fmt;
    for (const x of $('fmtseg').children) x.classList.toggle('on', x.dataset.fmt === fmt);
    $('fmthint').textContent = fmtByMime[fmt].hint || '';
    if (!isLossy(fmt)) state.fit = false;
    syncQualityUI();
    scheduleEncode();
  }

  drop.addEventListener('click', () => picker.click());
  $('pickBtn').addEventListener('click', (e) => { e.stopPropagation(); picker.click(); });
  $('addMore').addEventListener('click', () => picker.click());
  picker.addEventListener('change', () => { addFiles(picker.files); picker.value = ''; });

  ['dragenter', 'dragover'].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('dragging'); }));
  ['dragleave', 'drop'].forEach((ev) =>
    drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('dragging'); }));
  drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));

  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  });
  window.addEventListener('paste', (e) => {
    if (e.clipboardData && e.clipboardData.files.length) addFiles(e.clipboardData.files);
  });

  quality.addEventListener('input', () => {
    if (state.fit) state.fit = false;        // a manual choice overrides auto
    state.quality = parseInt(quality.value, 10) / 100;
    paintRange();
    syncQualityUI();
    scheduleEncode();
  });

  $('presets').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-q]');
    if (!b) return;
    state.fit = false;
    quality.value = b.dataset.q;
    state.quality = parseInt(b.dataset.q, 10) / 100;
    paintRange();
    syncQualityUI();
    scheduleEncode();
  });

  const fitBtn = $('fitBtn');
  if (fitBtn) fitBtn.addEventListener('click', () => setFit(!state.fit));

  resizeSel.addEventListener('change', (e) => {
    state.maxDim = parseInt(e.target.value, 10) || 0;
    scheduleEncode();
  });
  $('fmtseg').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-fmt]');
    if (b) selectFormat(b.dataset.fmt);
  });
  $('dlAll').addEventListener('click', downloadAll);
  if ($('dlZip')) $('dlZip').addEventListener('click', downloadZip);
  $('clearAll').addEventListener('click', () => [...state.files].forEach((f) => remove(f.id)));

  $('mClose').addEventListener('click', () => $('modal').classList.remove('on'));
  $('modal').addEventListener('click', (e) => { if (e.target.id === 'modal') $('modal').classList.remove('on'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') $('modal').classList.remove('on'); });

  const cmp = $('cmp');
  let draggingSplit = false;
  function splitFrom(e) {
    const r = cmp.getBoundingClientRect();
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
    setSplit((x / r.width) * 100);
  }
  cmp.addEventListener('pointerdown', (e) => { draggingSplit = true; splitFrom(e); });
  window.addEventListener('pointermove', (e) => { if (draggingSplit) splitFrom(e); });
  window.addEventListener('pointerup', () => { draggingSplit = false; });

  paintRange();
  $('fmthint').textContent = fmtByMime[state.format].hint || '';
  syncQualityUI();
  render();

  return { state, selectFormat, setFit, addFiles, t };
}
