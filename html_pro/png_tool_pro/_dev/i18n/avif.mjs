/* =====================================================================
   AVIF -> JPG page content. Four locales.

   Native AVIF decoding is available in every current browser, so the
   libavif WASM build is a fallback that is fetched only when the native
   path is missing or rejects the file.
   ===================================================================== */

export default {
  slug: 'avif-to-jpg',
  ldType: 'SoftwareApplication',

  /* ---------- language-independent code ---------- */
  code: {
    workerId: 'avif-worker',
    accept: '.avif,image/avif',
    extSrc: `/\\.avif$/i`,
    mime: 'image/avif',

    // AVIF is an ISO-BMFF container: bytes 4-7 must read "ftyp" and the
    // major brand at 8-11 is "avif" (or "avis" for sequences).
    sniff: `
async function looksLikeAvif(file) {
  const h = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ftyp = String.fromCharCode(h[4], h[5], h[6], h[7]) === 'ftyp';
  const brand = String.fromCharCode(h[8], h[9], h[10], h[11]);
  return ftyp && (brand === 'avif' || brand === 'avis' || /\\.avif$/i.test(file.name));
}`,

    /* Layer 1: the browser's own AVIF decoder (Chrome 85+, Firefox 93+,
       Safari 16.4+) — this is the path taken almost always.
       Layer 2: @jsquash/avif, a libavif WASM build, fetched ONLY when the
       native decoder is missing or rejects the file. Returns raw RGBA,
       which we then wrap in an ImageBitmap. */
    worker: `
const LIBAVIF_URL = 'https://cdn.jsdelivr.net/npm/@jsquash/avif@2.1.1/decode.js';

let decoderPromise = null;

function loadDecoder() {
  if (decoderPromise) return decoderPromise;
  decoderPromise = (async () => {
    self.__trackNet(LIBAVIF_URL, 'worker import', 0);
    const mod = await import(LIBAVIF_URL);
    const decode = mod.default;
    if (typeof decode !== 'function') throw new Error(self.__MSG.libavifFail);
    return decode;
  })();
  return decoderPromise;
}

async function decodeNative(blob) {
  const bmp = await createImageBitmap(blob);
  return { bitmap: bmp, width: bmp.width, height: bmp.height, mode: 'native' };
}

async function decodeWasm(buffer) {
  const decode = await loadDecoder();
  const imageData = await decode(buffer);
  if (!imageData || !imageData.width) throw new Error(self.__MSG.noImage);
  const bitmap = await createImageBitmap(imageData);
  return { bitmap, width: imageData.width, height: imageData.height, mode: 'wasm' };
}

self.onmessage = async (e) => {
  const { id, buffer, mime, force } = e.data;
  const t0 = performance.now();
  try {
    let out;
    if (force === 'wasm') {
      out = await decodeWasm(buffer);
    } else {
      try {
        out = await decodeNative(new Blob([buffer], { type: mime || 'image/avif' }));
      } catch (_) {
        out = await decodeWasm(buffer);
      }
    }
    const ms = Math.round(performance.now() - t0);
    self.postMessage(
      { id, ok: true, bitmap: out.bitmap, width: out.width, height: out.height, mode: out.mode, ms },
      [out.bitmap]
    );
  } catch (err) {
    self.postMessage({ id, ok: false, error: (err && err.message) || String(err) });
  }
};`,
  },

  locales: {
    en: {
      title: 'AVIF to JPG Converter — Free, Private, No Upload',
      desc: 'Convert AVIF images to JPG in your browser. Handles 10-bit files, keeps transparency when you need it, no upload and no signup. Batch convert and ZIP download.',
      ogTitle: 'AVIF to JPG Converter — Free, Private, No Upload',
      ogDesc: 'Convert AVIF images to JPG in your browser. Files never leave your device.',

      h1Html: `AVIF to <span class="accent">JPG</span>`,
      lede: `AVIF is the newest image format and the one most likely to break something. Convert it to JPG here, locally — nothing is uploaded to a server.`,
      badges: ['✓ Never uploaded', 'Handles 10-bit AVIF', 'Batch &amp; ZIP', 'Transparency aware', 'Unlimited &amp; free'],

      sections: [
        {
          h2: 'Why convert AVIF to JPG?',
          html:
`      <p>AVIF is built on the AV1 video codec and it is genuinely excellent — around twice as compact as JPEG at the same visual quality, with proper support for transparency and high dynamic range. The catch is everything else. Modern CDNs now serve AVIF to your browser automatically without telling you, so files land in your downloads folder in a format that older Photoshop, many Windows tools, most office suites, print pipelines and a long list of upload forms simply will not open.</p>
      <p>JPG is the opposite trade: mediocre compression, universal acceptance. That makes this conversion the standard rescue move — you are not converting to get a better image, you are converting to get an image that <em>everything can read</em>.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>Opens on anything</h4>
          <p>JPG is accepted by every editor, printer, browser and upload form made in the last thirty years. That is the whole point of converting.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></div>
          <h4>10-bit and HDR files</h4>
          <p>AVIF is often 10-bit while JPG is 8-bit. Files are read correctly here, but see the note below on what that means for HDR.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>Files never leave your device</h4>
          <p>Decoding happens in your browser tab. Most converters upload your files to a server you know nothing about — this one cannot.</p>
        </div>
      </div>`,
        },
        {
          h2: 'What output size should you expect?',
          html:
`      <p>AVIF and HEIC are close cousins in efficiency — both beat JPEG by roughly a factor of two on the same picture. So a faithful JPG is normally <em>larger</em> than the AVIF you started from. Measured on a 1600×1068 AVIF of 168.3&nbsp;KB:</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>Output setting</th><th>File size</th><th>vs original</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG (lossless)</td><td>2.26 MB</td><td class="up">+1273%</td></tr>
            <tr><td class="h">JPG quality 95</td><td>442.8 KB</td><td class="up">+163%</td></tr>
            <tr><td class="h">JPG quality 85</td><td>258.7 KB</td><td class="up">+54%</td></tr>
            <tr><td class="h">JPG quality 80</td><td>219.6 KB</td><td class="up">+31%</td></tr>
            <tr><td class="h">JPG quality 75</td><td>191.2 KB</td><td class="up">+14%</td></tr>
            <tr><td class="h">JPG quality 70 <span style="color:#059669">← default</span></td><td>173.2 KB</td><td class="up">+3%</td></tr>
            <tr><td class="h">JPG quality 65</td><td>157.5 KB</td><td class="down">−6%</td></tr>
            <tr><td class="h">WebP quality 80</td><td>161.2 KB</td><td class="down">−4%</td></tr>
          </tbody>
        </table>
      </div>
      <p>That is why the default here is <b>quality 70</b> rather than the 85 or 90 most converters ship: it lands within a few percent of the original file size, so the first thing you see is not a file that tripled. You can always push it up, and <b>Match original size</b> will search per file for the setting that lands closest to what you started with.</p>`,
        },
        {
          h2: 'Two honest limitations',
          html:
`      <h3>10-bit and HDR AVIF</h3>
      <p>AVIF commonly stores 10 bits per channel; JPG stores 8. Conversion here goes through an 8-bit canvas, so a high dynamic range AVIF will be tone-mapped down and may look flatter or differently graded than it did in an HDR-aware viewer. For ordinary photos shot in SDR you will not notice. If you specifically need to preserve HDR, keep the AVIF or convert with a desktop tool that supports it.</p>
      <h3>Transparency</h3>
      <p>AVIF supports an alpha channel and JPG does not. If your file has transparency and you convert to JPG, those areas become a solid colour. This page checks for transparency as soon as a file is decoded and warns you before you download, rather than letting you discover it later. Switch the output to PNG or WebP to keep it.</p>`,
        },
        {
          h2: 'How to convert AVIF to JPG',
          html:
`      <ul>
        <li><b>Add your files</b> — drag them in, click <i>Choose files</i>, or paste with Ctrl&nbsp;+&nbsp;V. Batches are fine.</li>
        <li><b>Leave quality at 70</b> for output close to the original size, raise it if you want more headroom, or press <b>Match original size</b> to let the page decide per image.</li>
        <li><b>Download</b> individually, or grab the whole batch as a ZIP.</li>
      </ul>`,
        },
        {
          h2: 'FAQ',
          html:
`      <details><summary>Why is my JPG bigger than the AVIF I started with?</summary><p>Because AVIF compresses roughly twice as efficiently as JPEG for the same visual quality, and that is exactly why CDNs serve it. Any faithful JPG has to spend more bytes to store the same picture. Quality 70 brings it back to around +3%; the WebP option actually comes out slightly smaller than the original AVIF.</p></details>
      <details><summary>Is AVIF better than JPG?</summary><p>For compression, yes — substantially better. For compatibility, no, and it is not close. AVIF needs a recent browser and a recent image editor; JPG needs nothing. The right answer depends on which of those two problems you have.</p></details>
      <details><summary>Does it handle 10-bit AVIF files?</summary><p>Yes, they decode correctly, including the 10-bit test file used to build this page. What it cannot do is keep the extra bit depth — the output is 8-bit JPG, so HDR files lose their extended range. See the limitations section above.</p></details>
      <details><summary>Will I lose transparency?</summary><p>Only if you choose JPG, which has no alpha channel at all. This page detects transparency after decoding and warns you with a one-click switch to PNG or WebP, which both preserve it.</p></details>
      <details><summary>Are my files uploaded anywhere?</summary><p>No. The panel on this page counts the number of outbound requests and the total outbound byte size; converting a file keeps both at zero apart from the one-time decoder download.</p></details>
      <details><summary>Why is the first conversion slower?</summary><p>On any recent Chrome, Firefox, Edge or Safari your browser decodes AVIF itself and the first conversion is instant. On an older browser this page loads a WebAssembly build of libavif (about 1.2&nbsp;MB, then cached) so that the file still converts instead of failing.</p></details>
      <details><summary>Is this really free? What's the catch?</summary><p>Free and unlimited, no account, no email, no watermark. There is no server doing the work, so there is no per-conversion cost to pass on to you.</p></details>
      <details><summary>Is there a file size or count limit?</summary><p>No artificial limit. Everything is processed on your machine, so the only ceiling is your own memory. Very large batches of full-resolution images will use a lot of RAM.</p></details>`,
        },
      ],

      related: {
        h2: 'Other converters in this set',
        sub: 'Same engine, same privacy model — your files stay on your device in all of them.',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone photos into a format everything can open.', tm: 'libheif WASM · native on Safari' },
          { tt: 'WebP → PNG', td: 'Lossless output with transparency preserved.', tm: 'native decode · zero network requests' },
          { tt: 'AVIF → JPG', td: 'The newest image format, opened by the oldest. You are here.', tm: 'native decode · libavif WASM fallback' },
        ],
      },

      footerTagline: 'AVIF to JPG · processed locally, always.',

      worker: {
        libavifFail: 'The libavif fallback decoder did not load',
        noImage: 'No image found inside this file',
        libheifFail: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'avif-to-jpg.zip',
        inputName: 'AVIF',
        inputDropTitle: 'AVIF',
        reject: 'That does not look like an AVIF file. Drop .avif files here — the file structure is checked, not just the name.',
        quality: 70,
        qualityHint: 'AVIF compresses about twice as well as JPG, so output is usually larger. 70% keeps it close to your original.',
        qualityHintByFormat: {
          'image/jpeg': 'At 70% our 168.3 KB AVIF sample becomes a 173.2 KB JPG — within 3% of the original.',
          'image/png': 'PNG is lossless, so quality has no effect — and the file will be roughly 13x larger than the AVIF.',
          'image/webp': 'WebP keeps transparency. At quality 70 it is usually close to or below the original AVIF size.',
        },
        formatHints: {
          'image/jpeg': 'JPG is the safest for sharing and printing — but it has no transparency.',
          'image/png': 'PNG is lossless and keeps transparency — expect a file around 13x larger.',
          'image/webp': 'WebP keeps transparency and lands slightly smaller than the original AVIF.',
        },
        bannerGrew: 'AVIF packs the same picture into roughly half the bytes of JPG, so a faithful JPG is normally larger — that is the format, not the converter. Lower the quality, try WebP, or match your original size automatically.',
        bannerGrewByFormat: {
          'image/png': 'PNG is lossless, so it stores every pixel of the decoded image and the file balloons to many times the original. That is the format, not the converter. Use JPG or WebP unless something specifically requires PNG — and if it does, cap the resolution, which is the only size lever PNG gives you.',
        },
        grewActions: [
          { label: '⭐ Match original size', act: 'fit' },
          { label: 'Try WebP', act: 'format:image/webp' },
          { label: 'Try PNG (keeps transparency)', act: 'format:image/png' },
        ],
        verifySteps: [
          'Open DevTools (<code>F12</code>) → <b>Network</b> tab and clear it.',
          'Drop your own AVIF files in and convert them.',
          'On a current browser nothing appears at all — the AVIF decoder is built in. On an older one you will see the libavif fallback download once. <b>No request ever carries your image.</b>',
        ],
      },

      ldName: 'AVIF to JPG Converter',
      ldDesc: 'Convert AVIF images to JPG in the browser, including 10-bit files, with a libavif WebAssembly fallback for older browsers. Files are never uploaded.',
      ldFaq: [
        { q: 'Why is the JPG larger than the AVIF?', a: 'AVIF compresses roughly twice as efficiently as JPEG for the same visual quality, so a faithful JPG needs more bytes to store the same picture. Using quality 70 brings the output to within about 3% of the original AVIF size.' },
        { q: 'Is AVIF better than JPG?', a: 'AVIF compresses substantially better, but JPG is accepted by far more software. AVIF requires a recent browser and image editor, while JPG opens essentially anywhere.' },
        { q: 'Does it convert 10-bit AVIF files?', a: 'Yes, 10-bit AVIF files decode correctly, but the 8-bit JPG output cannot retain the extra bit depth, so high dynamic range files lose their extended range.' },
        { q: 'Are my files uploaded anywhere?', a: 'No. Decoding runs entirely in the browser and the page reports both the number of outbound requests and the total outbound byte size.' },
      ],
    },

    zh: {
      title: 'AVIF 转 JPG —— 免费、不上传、支持 10-bit',
      desc: '在浏览器里把 AVIF 图片转成 JPG。支持 10-bit 文件，需要时保留透明通道，不上传、不用注册。支持批量转换和打包 ZIP 下载。',
      ogTitle: 'AVIF 转 JPG —— 免费、不上传、支持 10-bit',
      ogDesc: '在浏览器里把 AVIF 转成 JPG。文件永远不会离开你的设备。',

      h1Html: `AVIF 转 <span class="accent">JPG</span>`,
      lede: `AVIF 是最新的图片格式，也最容易让别的软件出问题。在这里本地转成 JPG —— 没有任何东西被上传到服务器。`,
      badges: ['✓ 从不上传', '支持 10-bit AVIF', '批量 + ZIP', '能识别透明通道', '免费不限量'],

      sections: [
        {
          h2: '为什么要把 AVIF 转成 JPG？',
          html:
`      <p>AVIF 建立在 AV1 视频编码之上，它确实非常出色 —— 同观感下体积约为 JPEG 的一半，还完整支持透明通道和高动态范围。问题出在其他所有环节。现在的 CDN 已经会自动把 AVIF 发给你的浏览器而不告诉你，于是文件以这种格式落进你的下载文件夹，而旧版 Photoshop、许多 Windows 工具、大多数办公套件、印刷流程和一大串上传表单，根本打不开它。</p>
      <p>JPG 是另一种取舍：压缩效率平庸，但到处都被接受。所以这个转换是标准的"抢救"动作 —— 你不是为了拿到更好的画质而转，而是为了拿到一张<em>什么都能读</em>的图。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>什么都能打开</h4>
          <p>JPG 被过去三十年里每一款编辑器、打印机、浏览器和上传表单接受。这就是转换的全部意义。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></div>
          <h4>10-bit 和 HDR 文件</h4>
          <p>AVIF 常常是 10-bit，而 JPG 是 8-bit。这里能正确读入文件，但那对 HDR 意味着什么，请看下面的说明。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>文件不离开你的设备</h4>
          <p>解码发生在你的浏览器标签页里。大多数转换器会把文件上传到一台你完全不了解的服务器 —— 这一个做不到。</p>
        </div>
      </div>`,
        },
        {
          h2: '输出体积大概会是多少？',
          html:
`      <p>AVIF 和 HEIC 在效率上是近亲 —— 同一张图它们都比 JPEG 好上大约一倍。所以忠实还原的 JPG 通常比源 AVIF <em>更大</em>。下面是拿一张 168.3&nbsp;KB 的 1600×1068 AVIF 实测的结果：</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>输出设置</th><th>文件大小</th><th>相比原文件</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG（无损）</td><td>2.26 MB</td><td class="up">+1273%</td></tr>
            <tr><td class="h">JPG 质量 95</td><td>442.8 KB</td><td class="up">+163%</td></tr>
            <tr><td class="h">JPG 质量 85</td><td>258.7 KB</td><td class="up">+54%</td></tr>
            <tr><td class="h">JPG 质量 80</td><td>219.6 KB</td><td class="up">+31%</td></tr>
            <tr><td class="h">JPG 质量 75</td><td>191.2 KB</td><td class="up">+14%</td></tr>
            <tr><td class="h">JPG 质量 70 <span style="color:#059669">← 默认</span></td><td>173.2 KB</td><td class="up">+3%</td></tr>
            <tr><td class="h">JPG 质量 65</td><td>157.5 KB</td><td class="down">−6%</td></tr>
            <tr><td class="h">WebP 质量 80</td><td>161.2 KB</td><td class="down">−4%</td></tr>
          </tbody>
        </table>
      </div>
      <p>这就是为什么这里的默认值是<b>质量 70</b>，而不是大多数转换器出厂的 85 或 90：它落在原始文件体积的几个百分点之内，所以你不会第一眼就看到一个体积翻三倍的文件。你随时可以往上调，而<b>匹配原始大小</b>会针对每个文件搜索最接近你原始文件的设置。</p>`,
        },
        {
          h2: '两个必须说清楚的限制',
          html:
`      <h3>10-bit 和 HDR 的 AVIF</h3>
      <p>AVIF 通常每通道存 10 bit，JPG 存 8 bit。这里的转换会经过 8-bit 的 canvas，所以高动态范围的 AVIF 会被色调映射压下来，在支持 HDR 的查看器里它可能显得更平，或者色彩不一样。对普通 SDR 拍摄的照片你不会察觉。如果你确实需要保留 HDR，请留着 AVIF，或者用支持它的桌面工具转换。</p>
      <h3>透明通道</h3>
      <p>AVIF 支持 alpha 通道，JPG 不支持。如果你的文件带透明，而你又转成了 JPG，那些区域会变成一块实色。这个页面在文件解码完成后就会检查透明通道，并在你下载之前提醒你，而不是让你事后才发现。把输出切成 PNG 或 WebP 就能保留它。</p>`,
        },
        {
          h2: '怎么把 AVIF 转成 JPG',
          html:
`      <ul>
        <li><b>添加文件</b> —— 拖进来、点<i>选择文件</i>，或者用 Ctrl&nbsp;+&nbsp;V 粘贴。批量也没问题。</li>
        <li><b>质量保持 70</b>，输出体积会接近原文件；想要更多余量就往上调，或者按<b>匹配原始大小</b>让页面逐张决定。</li>
        <li><b>下载</b> 单张，或者把整批打包成 ZIP 一次拿走。</li>
      </ul>`,
        },
        {
          h2: '常见问题',
          html:
`      <details><summary>为什么我转出来的 JPG 比原来的 AVIF 还大？</summary><p>因为 AVIF 在同观感下的压缩效率约为 JPEG 的两倍，而这也正是 CDN 都在用它的原因。任何忠实还原的 JPG 都必须花更多字节来存同一张画。质量 70 能把差距拉回到 +3% 左右；WebP 选项甚至会比原始 AVIF 略小一点。</p></details>
      <details><summary>AVIF 比 JPG 好吗？</summary><p>论压缩，好得多。论兼容性，不好，而且差得远。AVIF 需要较新的浏览器和较新的图像编辑器；JPG 什么都不需要。正确答案取决于你手里的是哪一个问题。</p></details>
      <details><summary>它支持 10-bit 的 AVIF 文件吗？</summary><p>支持，能正确解码，包括用来构建这个页面的那个 10-bit 测试文件。它做不到的是保留多出来的位深 —— 输出是 8-bit JPG，所以 HDR 文件会损失扩展范围。请见上面的限制章节。</p></details>
      <details><summary>透明通道会丢吗？</summary><p>只有在你选 JPG 时会，它完全没有 alpha 通道。这个页面会在解码后检测透明通道，并用一键切换提醒你改用 PNG 或 WebP —— 两者都能保留透明。</p></details>
      <details><summary>我的文件会被上传到什么地方吗？</summary><p>不会。这个页面上的面板会统计外发请求条数和外发字节总量；转换一个文件时，除了一次性的解码器下载，两者都保持为零。</p></details>
      <details><summary>为什么第一次转换比较慢？</summary><p>在任何较新的 Chrome、Firefox、Edge 或 Safari 上，你的浏览器自己就能解 AVIF，第一次转换是瞬时的。在老浏览器上，这个页面会加载 libavif 的 WebAssembly 版本（约 1.2&nbsp;MB，之后走缓存），让文件依然能转换，而不是直接失败。</p></details>
      <details><summary>真的免费吗？套路在哪？</summary><p>免费且不限量，不用账号、不留邮箱、不加水印。干活的是浏览器，没有服务器，也就没有每次转换的成本要转嫁给你。</p></details>
      <details><summary>有文件大小或数量限制吗？</summary><p>没有人为限制。一切都在你自己的机器上处理，所以唯一的天花板是你自己的内存。全分辨率图片的批次很大时会吃掉大量内存。</p></details>`,
        },
      ],

      related: {
        h2: '这一组里的其他转换器',
        sub: '同一套引擎，同样的隐私模型 —— 它们都把文件留在你的设备上。',
        items: [
          { tt: 'HEIC → JPG', td: '把 iPhone 照片变成什么都能打开的格式。', tm: 'libheif WASM · Safari 原生' },
          { tt: 'WebP → PNG', td: '无损输出，透明通道原样保留。', tm: '原生解码 · 零网络请求' },
          { tt: 'AVIF → JPG', td: '最新的图片格式，交给最老的格式打开。你正在这里。', tm: '原生解码 · libavif WASM 降级' },
        ],
      },

      footerTagline: 'AVIF 转 JPG · 始终在本地处理。',

      worker: {
        libavifFail: 'libavif 降级解码器没有加载成功',
        noImage: '在这个文件里没有找到图像',
        libheifFail: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'avif-to-jpg.zip',
        inputName: 'AVIF',
        inputDropTitle: 'AVIF',
        reject: '这看起来不像 AVIF 文件。请把 .avif 文件拖到这里 —— 我们检查的是文件结构，不只是文件名。',
        quality: 70,
        qualityHint: 'AVIF 的压缩效率约为 JPG 的两倍，所以输出通常更大。70% 能让体积贴近原文件。',
        qualityHintByFormat: {
          'image/jpeg': '在 70% 下，我们那个 168.3 KB 的 AVIF 样本会变成 173.2 KB 的 JPG —— 与原文件相差 3% 以内。',
          'image/png': 'PNG 是无损的，所以质量对它无效 —— 而且体积大约是 AVIF 的 13 倍。',
          'image/webp': 'WebP 保留透明通道。在质量 70 下，它通常接近或低于原始 AVIF 的体积。',
        },
        formatHints: {
          'image/jpeg': 'JPG 是分享和打印最稳妥的选择 —— 但它没有透明通道。',
          'image/png': 'PNG 无损且保留透明 —— 体积大约是原文件的 13 倍。',
          'image/webp': 'WebP 保留透明，而且通常比原始 AVIF 略小一点。',
        },
        bannerGrew: 'AVIF 把同一张画塞进 JPG 大约一半的字节里，所以忠实还原的 JPG 通常更大 —— 这是格式决定的，不是转换器的问题。调低质量、试试 WebP，或者自动匹配你的原始大小。',
        bannerGrewByFormat: {
          'image/png': 'PNG 是无损的，它会把解码后的每个像素都存下来，体积会膨胀到原文件的很多倍。这是格式决定的，不是转换器的问题。除非有明确要求，否则用 JPG 或 WebP —— 如果确实需要 PNG，那就限制分辨率，这是 PNG 唯一有效的减体积杠杆。',
        },
        grewActions: [
          { label: '⭐ 匹配原始大小', act: 'fit' },
          { label: '试试 WebP', act: 'format:image/webp' },
          { label: '试试 PNG（保留透明）', act: 'format:image/png' },
        ],
        verifySteps: [
          '打开开发者工具（<code>F12</code>）→ <b>Network</b> 面板，清空。',
          '把你自己的 AVIF 文件拖进来，然后转换。',
          '在较新的浏览器上什么都不会出现 —— AVIF 解码器是内置的。在老浏览器上你会看到 libavif 降级包下载一次。<b>没有任何请求会携带你的图片。</b>',
        ],
      },

      ldName: 'AVIF 转 JPG 转换器',
      ldDesc: '在浏览器里把 AVIF 图片转成 JPG，支持 10-bit 文件，老浏览器走 libavif WebAssembly 降级。文件永不上传。',
      ldFaq: [
        { q: '为什么 JPG 比 AVIF 大？', a: 'AVIF 在同观感下的压缩效率约为 JPEG 的两倍，所以忠实还原的 JPG 需要更多字节来存同一张画。用质量 70 可以把输出拉到原始 AVIF 体积的 3% 以内。' },
        { q: 'AVIF 比 JPG 好吗？', a: 'AVIF 的压缩明显更好，但 JPG 被多得多的软件接受。AVIF 需要较新的浏览器和图像编辑器，而 JPG 几乎到处都能打开。' },
        { q: '能转换 10-bit 的 AVIF 文件吗？', a: '能，10-bit AVIF 可以正确解码，但 8-bit 的 JPG 输出无法保留额外的位深，所以 HDR 文件会损失扩展范围。' },
        { q: '我的文件会被上传吗？', a: '不会。解码完全在浏览器里进行，页面会同时报告外发请求条数和外发字节总量。' },
      ],
    },

    ja: {
      title: 'AVIF → JPG 変換 — 無料・アップロードなし・10 ビット対応',
      desc: 'AVIF 画像をブラウザ上で JPG に変換。10 ビットファイルに対応し、必要なときは透明度も保持します。アップロードも登録も不要。一括変換と ZIP ダウンロードに対応。',
      ogTitle: 'AVIF → JPG 変換 — 無料・アップロードなし・10 ビット対応',
      ogDesc: 'AVIF をブラウザで JPG に変換。ファイルは端末から出ません。',

      h1Html: `AVIF → <span class="accent">JPG</span>`,
      lede: `AVIF は最も新しい画像形式であり、最もトラブルを起こしやすい形式でもあります。ここでローカルに JPG へ変換します — サーバーへのアップロードは一切ありません。`,
      badges: ['✓ アップロードなし', '10 ビット AVIF 対応', '一括 &amp; ZIP', '透明度を検出', '無料・無制限'],

      sections: [
        {
          h2: 'なぜ AVIF を JPG に変換するのか',
          html:
`      <p>AVIF は AV1 ビデオコーデックを基盤にしており、実際に優れています — 同じ見た目で JPEG のおよそ半分の容量、透明度とハイダイナミックレンジにもきちんと対応します。問題はそれ以外のすべてです。現在の CDN は AVIF をブラウザへ自動的に配信し、そのことを知らせません。その結果、古い Photoshop、多くの Windows ツール、ほとんどのオフィススイート、印刷工程、そして数多くのアップロードフォームが開けない形式でファイルがダウンロードフォルダに落ちてきます。</p>
      <p>JPG は逆のトレードオフです。圧縮効率は平凡ですが、どこでも受け入れられます。したがってこの変換は定番の「救出」作業です — より良い画像を得るためではなく、<em>何でも読める</em>画像を得るために変換します。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>何にでも開ける</h4>
          <p>JPG は過去 30 年間に作られたあらゆるエディター、プリンター、ブラウザ、アップロードフォームで受け入れられます。それが変換の目的そのものです。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></div>
          <h4>10 ビットと HDR ファイル</h4>
          <p>AVIF は 10 ビットであることが多く、JPG は 8 ビットです。ここではファイルを正しく読み込みますが、HDR にとってそれが何を意味するかは下記の注記をご覧ください。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>ファイルが端末から出ない</h4>
          <p>デコードはブラウザのタブ内で行われます。多くの変換サービスはファイルをあなたの知らないサーバーへ送りますが、ここではそれが起こりえません。</p>
        </div>
      </div>`,
        },
        {
          h2: '出力サイズはどのくらいになる？',
          html:
`      <p>AVIF と HEIC は効率の面で近い親戚です — 同じ絵でどちらも JPEG のおよそ 2 倍優れています。つまり忠実な JPG は元の AVIF より通常<em>大きくなります</em>。168.3&nbsp;KB の 1600×1068 AVIF で実測した結果です。</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>出力設定</th><th>ファイルサイズ</th><th>元ファイル比</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG（可逆）</td><td>2.26 MB</td><td class="up">+1273%</td></tr>
            <tr><td class="h">JPG 画質 95</td><td>442.8 KB</td><td class="up">+163%</td></tr>
            <tr><td class="h">JPG 画質 85</td><td>258.7 KB</td><td class="up">+54%</td></tr>
            <tr><td class="h">JPG 画質 80</td><td>219.6 KB</td><td class="up">+31%</td></tr>
            <tr><td class="h">JPG 画質 75</td><td>191.2 KB</td><td class="up">+14%</td></tr>
            <tr><td class="h">JPG 画質 70 <span style="color:#059669">← 既定</span></td><td>173.2 KB</td><td class="up">+3%</td></tr>
            <tr><td class="h">JPG 画質 65</td><td>157.5 KB</td><td class="down">−6%</td></tr>
            <tr><td class="h">WebP 画質 80</td><td>161.2 KB</td><td class="down">−4%</td></tr>
          </tbody>
        </table>
      </div>
      <p>だからこそ、ここでの既定値は<b>画質 70</b> であり、多くの変換ツールが出荷する 85 や 90 ではありません。元のファイルサイズの数%以内に収まるため、最初に見るのが 3 倍に膨らんだファイル、という事態を避けられます。いつでも上げられますし、<b>元のサイズに合わせる</b>がファイルごとに最も近い設定を探します。</p>`,
        },
        {
          h2: '正直に言っておくべき 2 つの制約',
          html:
`      <h3>10 ビットと HDR の AVIF</h3>
      <p>AVIF は通常 1 チャンネルあたり 10 ビット、JPG は 8 ビットです。ここでの変換は 8 ビットの canvas を通るため、HDR の AVIF はトーンマッピングで圧縮され、HDR 対応ビューアで見たときより平坦、あるいは色味が違って見えることがあります。SDR で撮影した通常の写真では気づきません。HDR を保持する必要がある場合は AVIF のままにするか、対応するデスクトップツールをお使いください。</p>
      <h3>透明度</h3>
      <p>AVIF はアルファチャンネルに対応し、JPG は対応しません。透明部分を持つファイルを JPG に変換すると、その部分は単色になります。このページはファイルのデコード直後に透明度を確認し、後から気づくのではなくダウンロード前に警告します。出力を PNG か WebP に切り替えれば保持できます。</p>`,
        },
        {
          h2: 'AVIF を JPG に変換する手順',
          html:
`      <ul>
        <li><b>ファイルを追加</b> — ドラッグするか、<i>ファイルを選択</i>をクリック、Ctrl&nbsp;+&nbsp;V で貼り付け。一括でも問題ありません。</li>
        <li><b>画質は 70 のまま</b>にすると元のサイズに近くなります。余裕を持たせたいなら上げるか、<b>元のサイズに合わせる</b>を押して画像ごとに判断させてください。</li>
        <li><b>ダウンロード</b> — 個別に、あるいはまとめて ZIP で受け取ります。</li>
      </ul>`,
        },
        {
          h2: 'よくある質問',
          html:
`      <details><summary>変換後の JPG が元の AVIF より大きいのはなぜ？</summary><p>AVIF は同じ見た目での圧縮効率が JPEG のおよそ 2 倍で、それこそ CDN が採用する理由です。忠実な JPG は同じ絵を保存するのにより多くのバイトを必要とします。画質 70 なら +3% 程度に収まりますし、WebP オプションは元の AVIF よりわずかに小さくなることもあります。</p></details>
      <details><summary>AVIF は JPG より優れている？</summary><p>圧縮率では、はるかに優れています。互換性では劣り、しかも差は大きいです。AVIF は新しいブラウザと新しい画像エディターを必要とし、JPG はほとんど何も必要としません。どちらの問題を抱えているかで答えが変わります。</p></details>
      <details><summary>10 ビットの AVIF ファイルに対応？</summary><p>はい、このページの作成に使った 10 ビットのテストファイルを含め、正しくデコードします。できないのはビット深度を保つことです — 出力は 8 ビット JPG なので、HDR ファイルは拡張レンジを失います。上記の制約の節をご覧ください。</p></details>
      <details><summary>透明度は失われる？</summary><p>JPG を選んだ場合のみです。JPG にはアルファチャンネルがありません。このページはデコード後に透明度を検出し、PNG か WebP へのワンクリック切り替えを提示します。どちらも透明度を保ちます。</p></details>
      <details><summary>ファイルはどこかにアップロードされる？</summary><p>いいえ。このページのパネルは送信リクエスト数と送信バイト数の合計を数えます。1 回だけのデコーダーダウンロードを除けば、ファイルを変換してもどちらもゼロのままです。</p></details>
      <details><summary>最初の変換だけ遅いのはなぜ？</summary><p>最近の Chrome、Firefox、Edge、Safari ならブラウザ自身が AVIF をデコードするため、最初から一瞬で終わります。古いブラウザでは libavif の WebAssembly 版（約 1.2&nbsp;MB、以降はキャッシュ）を読み込むことで、失敗せずに変換できるようにしています。</p></details>
      <details><summary>本当に無料？ 裏はある？</summary><p>無料で無制限、アカウントもメールも透かしもありません。処理をするサーバーがないので、変換ごとのコストを転嫁することもありません。</p></details>
      <details><summary>ファイルサイズや枚数の上限は？</summary><p>人為的な上限はありません。すべてあなたのマシンで処理されるため、上限はメモリだけです。フル解像度の画像を大量にまとめて処理すると多くのメモリを消費します。</p></details>`,
        },
      ],

      related: {
        h2: 'このセットの他の変換ツール',
        sub: '同じエンジン、同じプライバシーモデル — どれもファイルを端末内に留めます。',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone の写真を、あらゆる環境で開ける形式に。', tm: 'libheif WASM · Safari ではネイティブ' },
          { tt: 'WebP → PNG', td: '透明度を保ったままの可逆出力。', tm: 'ネイティブデコード · ネットワークリクエスト 0' },
          { tt: 'AVIF → JPG', td: '最新の画像形式を、最古の形式で開く。現在のページです。', tm: 'ネイティブデコード · libavif WASM フォールバック' },
        ],
      },

      footerTagline: 'AVIF → JPG · 常に端末内で処理します。',

      worker: {
        libavifFail: 'libavif フォールバックデコーダーを読み込めませんでした',
        noImage: 'このファイル内に画像が見つかりません',
        libheifFail: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'avif-to-jpg.zip',
        inputName: 'AVIF',
        inputDropTitle: 'AVIF',
        reject: 'AVIF ファイルではないようです。.avif ファイルをドロップしてください — ファイル名だけでなく構造を検査しています。',
        quality: 70,
        qualityHint: 'AVIF は JPG のおよそ 2 倍の圧縮効率があるため、出力は通常大きくなります。70% なら元のファイルに近いサイズに収まります。',
        qualityHintByFormat: {
          'image/jpeg': '画質 70 では、168.3 KB の AVIF サンプルが 173.2 KB の JPG になります — 元ファイルとの差は 3% 以内です。',
          'image/png': 'PNG は可逆なので画質は効きません — しかもサイズは AVIF のおよそ 13 倍になります。',
          'image/webp': 'WebP は透明度を保ちます。画質 70 では元の AVIF と同程度か、それより小さくなるのが通常です。',
        },
        formatHints: {
          'image/jpeg': 'JPG は共有と印刷に最も安全な選択です — ただし透明度はありません。',
          'image/png': 'PNG は可逆で透明度も保てます — 元ファイルのおよそ 13 倍のサイズになります。',
          'image/webp': 'WebP は透明度を保ち、元の AVIF よりわずかに小さくなるのが通常です。',
        },
        bannerGrew: 'AVIF は同じ絵を JPG のおよそ半分のバイト数に収めるため、忠実な JPG は通常大きくなります — これは形式の性質で、変換ツールの問題ではありません。画質を下げる、WebP を試す、あるいは元のサイズに自動で合わせてください。',
        bannerGrewByFormat: {
          'image/png': 'PNG は可逆圧縮のため、デコード後の全ピクセルをそのまま保存し、ファイルは元の何倍にも膨らみます。これは形式の性質であり、変換ツールの問題ではありません。特に必要がなければ JPG か WebP をお使いください。PNG が必要な場合は解像度を制限してください。それが PNG で唯一効く軽量化の手段です。',
        },
        grewActions: [
          { label: '⭐ 元のサイズに合わせる', act: 'fit' },
          { label: 'WebP を試す', act: 'format:image/webp' },
          { label: 'PNG を試す（透明度を保持）', act: 'format:image/png' },
        ],
        verifySteps: [
          '開発者ツール（<code>F12</code>）→ <b>Network</b> タブを開き、内容をクリアします。',
          'お手持ちの AVIF ファイルをドロップして変換します。',
          '最近のブラウザでは何も表示されません — AVIF デコーダーは内蔵されています。古いブラウザでは libavif フォールバックのダウンロードが 1 回だけ現れます。<b>あなたの画像を含むリクエストは 1 件も発生しません。</b>',
        ],
      },

      ldName: 'AVIF → JPG 変換ツール',
      ldDesc: 'AVIF 画像を 10 ビットファイルも含めてブラウザ上で JPG に変換。古いブラウザ向けに libavif WebAssembly のフォールバックを備えています。ファイルはアップロードされません。',
      ldFaq: [
        { q: 'JPG が AVIF より大きいのはなぜですか？', a: 'AVIF は同じ見た目での圧縮効率が JPEG のおよそ 2 倍のため、忠実な JPG は同じ絵を保存するのにより多くのバイトを要します。画質 70 を使うと、出力は元の AVIF サイズのおよそ 3% 以内に収まります。' },
        { q: 'AVIF は JPG より優れていますか？', a: '圧縮率は大幅に優れていますが、JPG のほうがはるかに多くのソフトウェアで受け入れられます。AVIF は新しいブラウザと画像エディターを必要とし、JPG はほぼどこでも開けます。' },
        { q: '10 ビットの AVIF ファイルも変換できますか？', a: 'はい、正しくデコードされます。ただし 8 ビットの JPG 出力はビット深度を保てないため、HDR ファイルは拡張レンジを失います。' },
        { q: 'ファイルはアップロードされますか？', a: 'いいえ。デコードはすべてブラウザ内で実行され、ページは送信リクエスト数と送信バイト数の合計の両方を報告します。' },
      ],
    },

    ko: {
      title: 'AVIF → JPG 변환기 — 무료, 업로드 없음, 10비트 지원',
      desc: 'AVIF 이미지를 브라우저에서 JPG로 변환하세요. 10비트 파일을 처리하고 필요할 때 투명도도 유지합니다. 업로드와 가입이 필요 없습니다. 일괄 변환과 ZIP 다운로드 지원.',
      ogTitle: 'AVIF → JPG 변환기 — 무료, 업로드 없음, 10비트 지원',
      ogDesc: 'AVIF를 브라우저에서 JPG로 변환. 파일은 기기에서 나가지 않습니다.',

      h1Html: `AVIF → <span class="accent">JPG</span>`,
      lede: `AVIF는 가장 새로운 이미지 형식이자 가장 문제를 일으키기 쉬운 형식입니다. 여기서 로컬로 JPG로 바꾸세요. 서버로 업로드되는 것은 아무것도 없습니다.`,
      badges: ['✓ 업로드 없음', '10비트 AVIF 지원', '일괄 &amp; ZIP', '투명도 감지', '무료 · 무제한'],

      sections: [
        {
          h2: 'AVIF를 JPG로 바꾸는 이유',
          html:
`      <p>AVIF는 AV1 비디오 코덱을 기반으로 하고 실제로 뛰어납니다. 같은 화질에서 JPEG의 절반 정도 용량이고 투명도와 HDR도 제대로 지원합니다. 문제는 나머지 전부입니다. 요즘 CDN은 AVIF를 브라우저로 알아서 보내면서 그 사실을 알려주지 않습니다. 그 결과 예전 Photoshop, 많은 Windows 도구, 대부분의 오피스 제품군, 인쇄 공정, 그리고 수많은 업로드 양식이 열지 못하는 형식으로 파일이 다운로드 폴더에 떨어집니다.</p>
      <p>JPG는 반대의 거래입니다. 압축 효율은 평범하지만 어디서나 받아들여집니다. 그래서 이 변환은 전형적인 "구출" 작업입니다. 더 좋은 그림을 얻으려는 게 아니라 <em>무엇이든 읽는</em> 그림을 얻으려는 것입니다.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>어디에나 열림</h4>
          <p>JPG는 지난 30년간 만들어진 모든 편집기, 프린터, 브라우저, 업로드 양식에서 받아들여집니다. 그게 변환의 목적 전부입니다.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg></div>
          <h4>10비트와 HDR 파일</h4>
          <p>AVIF는 흔히 10비트이고 JPG는 8비트입니다. 여기서는 파일을 올바르게 읽지만, HDR에게 그것이 무엇을 뜻하는지는 아래 설명을 보세요.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>파일이 기기를 떠나지 않음</h4>
          <p>디코딩은 브라우저 탭 안에서 일어납니다. 대부분의 변환 서비스는 파일을 사용자가 모르는 서버로 보내지만 여기서는 그럴 수 없습니다.</p>
        </div>
      </div>`,
        },
        {
          h2: '출력 용량은 얼마나 될까?',
          html:
`      <p>AVIF와 HEIC는 효율 면에서 가까운 사촌입니다. 같은 그림에서 둘 다 JPEG보다 약 두 배 낫습니다. 그래서 충실한 JPG는 원본 AVIF보다 보통 <em>더 큽니다</em>. 168.3&nbsp;KB짜리 1600×1068 AVIF로 실측한 결과입니다.</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>출력 설정</th><th>파일 크기</th><th>원본 대비</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG (무손실)</td><td>2.26 MB</td><td class="up">+1273%</td></tr>
            <tr><td class="h">JPG 품질 95</td><td>442.8 KB</td><td class="up">+163%</td></tr>
            <tr><td class="h">JPG 품질 85</td><td>258.7 KB</td><td class="up">+54%</td></tr>
            <tr><td class="h">JPG 품질 80</td><td>219.6 KB</td><td class="up">+31%</td></tr>
            <tr><td class="h">JPG 품질 75</td><td>191.2 KB</td><td class="up">+14%</td></tr>
            <tr><td class="h">JPG 품질 70 <span style="color:#059669">← 기본</span></td><td>173.2 KB</td><td class="up">+3%</td></tr>
            <tr><td class="h">JPG 품질 65</td><td>157.5 KB</td><td class="down">−6%</td></tr>
            <tr><td class="h">WebP 품질 80</td><td>161.2 KB</td><td class="down">−4%</td></tr>
          </tbody>
        </table>
      </div>
      <p>그래서 기본값이 <b>품질 70</b>이고, 대부분의 변환기가 내놓는 85나 90이 아닙니다. 원본 크기의 몇 퍼센트 안에 들어오므로 첫 화면에서 용량이 세 배가 된 파일을 보는 일이 없습니다. 언제든 올릴 수 있고, <b>원본 크기에 맞추기</b>가 파일마다 가장 가까운 설정을 찾습니다.</p>`,
        },
        {
          h2: '솔직히 말해야 할 두 가지 한계',
          html:
`      <h3>10비트와 HDR AVIF</h3>
      <p>AVIF는 보통 채널당 10비트를 저장하고 JPG는 8비트입니다. 여기 변환은 8비트 canvas를 거치므로 HDR AVIF는 톤 매핑으로 눌리고, HDR을 지원하는 뷰어에서보다 평평하거나 색이 다르게 보일 수 있습니다. SDR로 찍은 일반 사진에서는 느끼지 못합니다. HDR을 꼭 보존해야 한다면 AVIF를 그대로 두거나 지원하는 데스크톱 도구를 쓰세요.</p>
      <h3>투명도</h3>
      <p>AVIF는 알파 채널을 지원하고 JPG는 지원하지 않습니다. 투명한 파일을 JPG로 바꾸면 그 영역이 단색이 됩니다. 이 페이지는 파일이 디코딩되는 즉시 투명도를 확인하고, 나중에 발견하게 두지 않고 다운로드 전에 경고합니다. 출력을 PNG나 WebP로 바꾸면 유지됩니다.</p>`,
        },
        {
          h2: 'AVIF를 JPG로 변환하는 방법',
          html:
`      <ul>
        <li><b>파일 추가</b> — 끌어다 놓거나 <i>파일 선택</i>을 클릭하거나 Ctrl&nbsp;+&nbsp;V로 붙여넣으세요. 묶음도 괜찮습니다.</li>
        <li><b>품질은 70으로 두세요.</b> 원본 크기에 가까워집니다. 여유를 원하면 올리거나, <b>원본 크기에 맞추기</b>를 눌러 이미지마다 맡기세요.</li>
        <li><b>다운로드</b> — 개별로, 또는 묶음 전체를 ZIP으로 받으세요.</li>
      </ul>`,
        },
        {
          h2: '자주 묻는 질문',
          html:
`      <details><summary>변환한 JPG가 원본 AVIF보다 큰 이유는?</summary><p>AVIF는 같은 화질에서 압축 효율이 JPEG의 약 두 배이고, 그래서 CDN이 이 형식을 씁니다. 충실한 JPG는 같은 그림을 담는 데 더 많은 바이트를 써야 합니다. 품질 70이면 차이가 +3% 정도로 줄고, WebP 옵션은 원본 AVIF보다 오히려 조금 작을 수도 있습니다.</p></details>
      <details><summary>AVIF가 JPG보다 좋은가요?</summary><p>압축은 훨씬 좋습니다. 호환성은 아닙니다. 차이가 큽니다. AVIF는 최신 브라우저와 최신 이미지 편집기가 필요하고, JPG는 거의 아무것도 필요로 하지 않습니다. 정답은 두 문제 중 어느 쪽을 겪고 있느냐에 달려 있습니다.</p></details>
      <details><summary>10비트 AVIF 파일도 처리하나요?</summary><p>네, 이 페이지를 만드는 데 쓴 10비트 테스트 파일을 포함해 올바르게 디코딩합니다. 다만 비트 심도를 유지하지는 못합니다. 출력이 8비트 JPG이므로 HDR 파일은 확장 범위를 잃습니다. 위의 한계 항목을 보세요.</p></details>
      <details><summary>투명도가 사라지나요?</summary><p>JPG를 고를 때만 그렇습니다. JPG에는 알파 채널이 전혀 없습니다. 이 페이지는 디코딩 후 투명도를 감지하고 PNG나 WebP로 한 번에 바꾸도록 안내합니다. 둘 다 투명도를 유지합니다.</p></details>
      <details><summary>파일이 어딘가로 업로드되나요?</summary><p>아니요. 이 페이지의 패널은 외부 요청 수와 전송 바이트 총량을 셉니다. 한 번뿐인 디코더 다운로드를 빼면 파일을 변환해도 둘 다 0입니다.</p></details>
      <details><summary>첫 변환만 느린 이유는?</summary><p>최신 Chrome, Firefox, Edge, Safari에서는 브라우저가 AVIF를 직접 디코딩해 첫 변환이 즉시 끝납니다. 구형 브라우저에서는 libavif의 WebAssembly 버전(약 1.2&nbsp;MB, 이후 캐시)을 불러와 실패하지 않고 변환되게 합니다.</p></details>
      <details><summary>정말 무료인가요? 함정은?</summary><p>무료이고 무제한이며 계정도, 이메일도, 워터마크도 없습니다. 일하는 서버가 없으니 변환마다 사용자에게 넘길 비용도 없습니다.</p></details>
      <details><summary>파일 크기나 개수 제한이 있나요?</summary><p>인위적인 제한은 없습니다. 모든 처리가 사용자 기기에서 이루어지므로 한계는 메모리뿐입니다. 풀 해상도 이미지를 아주 많이 한 번에 처리하면 메모리를 크게 씁니다.</p></details>`,
        },
      ],

      related: {
        h2: '이 세트의 다른 변환기',
        sub: '같은 엔진, 같은 개인정보 보호 모델 — 모두 파일을 기기 안에 남깁니다.',
        items: [
          { tt: 'HEIC → JPG', td: '아이폰 사진을 어디서나 열리는 형식으로.', tm: 'libheif WASM · Safari에서는 네이티브' },
          { tt: 'WebP → PNG', td: '투명도를 유지한 무손실 출력.', tm: '네이티브 디코딩 · 네트워크 요청 0' },
          { tt: 'AVIF → JPG', td: '가장 새로운 이미지 형식을 가장 오래된 형식으로. 지금 이 페이지입니다.', tm: '네이티브 디코딩 · libavif WASM 폴백' },
        ],
      },

      footerTagline: 'AVIF → JPG · 언제나 기기 안에서 처리합니다.',

      worker: {
        libavifFail: 'libavif 폴백 디코더를 불러오지 못했습니다',
        noImage: '이 파일 안에서 이미지를 찾지 못했습니다',
        libheifFail: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'avif-to-jpg.zip',
        inputName: 'AVIF',
        inputDropTitle: 'AVIF',
        reject: 'AVIF 파일이 아닌 것 같습니다. .avif 파일을 놓아주세요. 파일 이름만이 아니라 구조를 검사합니다.',
        quality: 70,
        qualityHint: 'AVIF는 JPG보다 약 두 배 효율이 좋아 출력이 보통 더 큽니다. 70%면 원본에 가깝게 유지됩니다.',
        qualityHintByFormat: {
          'image/jpeg': '품질 70에서 168.3 KB AVIF 샘플이 173.2 KB JPG가 됩니다. 원본과 3% 이내 차이입니다.',
          'image/png': 'PNG는 무손실이라 품질이 효과가 없고, 크기는 AVIF의 약 13배가 됩니다.',
          'image/webp': 'WebP는 투명도를 유지합니다. 품질 70이면 원본 AVIF와 비슷하거나 그보다 작은 게 보통입니다.',
        },
        formatHints: {
          'image/jpeg': 'JPG는 공유와 인쇄에 가장 안전합니다. 다만 투명도는 없습니다.',
          'image/png': 'PNG는 무손실이고 투명도도 유지합니다. 원본의 약 13배 크기가 됩니다.',
          'image/webp': 'WebP는 투명도를 유지하고 원본 AVIF보다 조금 작아지는 게 보통입니다.',
        },
        bannerGrew: 'AVIF는 같은 그림을 JPG의 절반 정도 바이트에 담기 때문에 충실한 JPG는 보통 더 큽니다. 형식의 특성이지 변환기 문제가 아닙니다. 품질을 낮추거나 WebP를 시도하거나 원본 크기에 자동으로 맞추세요.',
        bannerGrewByFormat: {
          'image/png': 'PNG는 무손실이라 디코딩된 모든 픽셀을 그대로 저장하고, 파일은 원본의 몇 배로 부풀어 오릅니다. 형식의 특성이지 변환기 문제가 아닙니다. 특별한 이유가 없다면 JPG나 WebP를 쓰고, PNG가 꼭 필요하면 해상도를 제한하세요. PNG에서 유일하게 통하는 용량 줄이기 수단입니다.',
        },
        grewActions: [
          { label: '⭐ 원본 크기에 맞추기', act: 'fit' },
          { label: 'WebP 시도', act: 'format:image/webp' },
          { label: 'PNG 시도 (투명도 유지)', act: 'format:image/png' },
        ],
        verifySteps: [
          '개발자 도구(<code>F12</code>) → <b>Network</b> 탭을 열고 비웁니다.',
          '가지고 있는 AVIF 파일을 놓고 변환합니다.',
          '최신 브라우저에서는 아무것도 나타나지 않습니다. AVIF 디코더가 내장돼 있기 때문입니다. 구형 브라우저에서는 libavif 폴백 다운로드가 한 번 보입니다. <b>이미지를 실은 요청은 한 건도 발생하지 않습니다.</b>',
        ],
      },

      ldName: 'AVIF → JPG 변환기',
      ldDesc: 'AVIF 이미지를 10비트 파일까지 브라우저에서 JPG로 변환합니다. 구형 브라우저를 위한 libavif WebAssembly 폴백을 갖췄습니다. 파일은 업로드되지 않습니다.',
      ldFaq: [
        { q: 'JPG가 AVIF보다 큰 이유는 무엇인가요?', a: 'AVIF는 같은 화질에서 압축 효율이 JPEG의 약 두 배이므로 충실한 JPG는 같은 그림을 담는 데 더 많은 바이트가 필요합니다. 품질 70을 쓰면 출력이 원본 AVIF 크기의 약 3% 이내로 들어옵니다.' },
        { q: 'AVIF가 JPG보다 좋은가요?', a: '압축은 훨씬 좋지만 JPG가 훨씬 많은 소프트웨어에서 받아들여집니다. AVIF는 최신 브라우저와 이미지 편집기가 필요하고, JPG는 거의 어디서나 열립니다.' },
        { q: '10비트 AVIF 파일도 변환되나요?', a: '네, 올바르게 디코딩됩니다. 다만 8비트 JPG 출력은 비트 심도를 유지하지 못하므로 HDR 파일은 확장 범위를 잃습니다.' },
        { q: '파일이 업로드되나요?', a: '아니요. 디코딩은 전적으로 브라우저에서 실행되며 페이지는 외부 요청 수와 전송 바이트 총량을 함께 보고합니다.' },
      ],
    },
  },
};
