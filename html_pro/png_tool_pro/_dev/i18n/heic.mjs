/* =====================================================================
   HEIC -> JPG page content. Four locales.

   `code` holds everything that is language-independent (decoder worker,
   magic-byte sniffer, accept list) so it is written once instead of four
   times. `tool` holds the engine config minus the copy that comes from
   assets/i18n.js. `worker` holds the strings the decoder worker needs,
   which the engine injects as self.__MSG.
   ===================================================================== */

export default {
  slug: 'heic-to-jpg',
  ldType: 'SoftwareApplication',

  /* ---------- language-independent code ---------- */
  code: {
    workerId: 'heic-worker',
    accept: '.heic,.heif,.heics,image/heic,image/heif',
    extSrc: `/\\.(heic|heif|heics|heifs)$/i`,
    mime: 'image/heic',
    brands: `['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1']`,

    sniff: `
const HEIC_BRANDS = ${'__BRANDS__'};

// Extensions lie often enough that the container's magic bytes get the final word.
async function looksLikeHeic(file) {
  const byName = /\\.(heic|heif|heics|heifs)$/i.test(file.name);
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ftyp = String.fromCharCode(head[4], head[5], head[6], head[7]) === 'ftyp';
  if (!ftyp) return byName;
  const brand = String.fromCharCode(head[8], head[9], head[10], head[11]);
  return HEIC_BRANDS.includes(brand) || byName;
}`,

    worker: `
const LIBHEIF_URL = 'https://cdn.jsdelivr.net/npm/libheif-js@1.23.2/libheif-wasm/libheif-bundle.mjs';

let libheifPromise = null;

function loadLibheif() {
  if (libheifPromise) return libheifPromise;
  libheifPromise = (async () => {
    self.__trackNet(LIBHEIF_URL, 'worker import', 0);
    const mod = await import(LIBHEIF_URL);
    const factory = mod.default !== undefined ? mod.default : mod;
    let inst = typeof factory === 'function' ? factory() : factory;
    if (inst && typeof inst.then === 'function') inst = await inst;
    if (!inst || typeof inst.HeifDecoder !== 'function') {
      throw new Error(self.__MSG.libheifFail);
    }
    return inst;
  })();
  return libheifPromise;
}

async function decodeNative(blob) {
  const bmp = await createImageBitmap(blob);
  return { bitmap: bmp, width: bmp.width, height: bmp.height, mode: 'native' };
}

async function decodeWasm(buffer) {
  const libheif = await loadLibheif();
  const decoder = new libheif.HeifDecoder();
  const images = decoder.decode(new Uint8Array(buffer));
  if (!images || images.length === 0) throw new Error(self.__MSG.noImage);

  const image = images[0];
  const width = image.get_width();
  const height = image.get_height();
  const imageData = new ImageData(width, height);

  const ok = await new Promise((resolve) => {
    image.display(imageData, (result) => resolve(result || null));
  });
  if (!ok) throw new Error(self.__MSG.hevcFail);

  const bitmap = await createImageBitmap(imageData);
  return { bitmap, width, height, mode: 'wasm' };
}

self.onmessage = async (e) => {
  const { id, buffer, mime, force } = e.data;
  const t0 = performance.now();
  try {
    let out;
    if (force === 'wasm') {
      out = await decodeWasm(buffer);
    } else {
      // Prefer the browser's own decoder when it can actually handle HEIC.
      try {
        out = await decodeNative(new Blob([buffer], { type: mime || 'image/heic' }));
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
      title: 'HEIC to JPG Converter — Free, Private, No Upload',
      desc: 'Convert HEIC/HEIF photos from iPhone to JPG instantly in your browser. 100% private — your files never leave your device. Batch convert, adjust quality, download as ZIP. Free, no signup, no watermark.',
      ogTitle: 'HEIC to JPG Converter — Free, Private, No Upload',
      ogDesc: 'Convert iPhone HEIC photos to JPG in your browser. Files never leave your device.',

      h1Html: `HEIC to <span class="accent">JPG</span>`,
      lede: `Convert iPhone photos to JPG right here. Your files are decoded locally by your own CPU — nothing is ever uploaded to a server.`,
      badges: ['✓ Never uploaded', 'Batch convert', 'ZIP download', 'Quality control', 'Unlimited &amp; free'],

      sections: [
        {
          h2: 'Why convert HEIC to JPG?',
          html:
`      <p>HEIC is what iPhones shoot by default — it stores the same photo in roughly half the space. The problem is what happens next. Microsoft Windows can't open it without a paid codec, most browsers still can't display it, and a huge number of upload forms, government portals and print shops reject it outright. You didn't choose HEIC; your phone did. Converting to JPG is how you make the file usable everywhere.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>Universal compatibility</h4>
          <p>JPG opens on every device, browser, printer and upload form in existence. No codec pack, no "unsupported format".</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>Files never leave your device</h4>
          <p>Most converters upload your photos to a server you know nothing about. Here, decoding happens in your browser tab. Nothing is sent anywhere.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>Fast &amp; unlimited</h4>
          <p>No queue, no file-size cap, no 3-per-hour limit. Modern browsers decode HEIC natively; everyone else runs a WebAssembly decoder.</p>
        </div>
      </div>`,
        },
        {
          h2: 'How to convert HEIC to JPG',
          html:
`      <ul>
        <li><b>Add your files</b> — drag them in, click <i>Choose files</i>, or paste with Ctrl&nbsp;+&nbsp;V. Multiple files at once are fine.</li>
        <li><b>Adjust if you want</b> — drag the quality slider to trade file size against detail, or cap the resolution for email and web.</li>
        <li><b>Download</b> — save individual images, or grab everything at once as a ZIP.</li>
      </ul>
      <h3>What output size should you expect?</h3>
      <p>This is worth knowing before you start, because HEIC and JPG are not equally efficient. Measured on a 1440×960 iPhone photo of 286.7&nbsp;KB:</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>Output setting</th><th>File size</th><th>vs original</th></tr></thead>
          <tbody>
            <tr><td class="h">JPG quality 95</td><td>771 KB</td><td class="up">+169%</td></tr>
            <tr><td class="h">JPG quality 85</td><td>482 KB</td><td class="up">+68%</td></tr>
            <tr><td class="h">JPG quality 75</td><td>366 KB</td><td class="up">+28%</td></tr>
            <tr><td class="h">JPG quality 65</td><td>302 KB</td><td class="up">+5%</td></tr>
            <tr><td class="h">JPG quality 55</td><td>260 KB</td><td class="down">−9%</td></tr>
            <tr><td class="h">Match original size (auto)</td><td>283 KB</td><td class="down">−1%</td></tr>
          </tbody>
        </table>
      </div>
      <p>The HEVC codec inside HEIC is simply more efficient than JPEG — that is the entire reason Apple uses it. So a faithful JPG is normally <em>larger</em>, and every converter on the internet behaves this way. Your two levers are the quality slider and <b>Match original size</b>, which searches per file for the setting that lands closest to the file you started with.</p>`,
        },
        {
          h2: 'FAQ',
          html:
`      <details><summary>Why is my JPG bigger than the HEIC I started with?</summary><p>Because HEIC is simply a more efficient codec. For the same visual quality, the HEVC compression inside HEIC needs roughly half the bytes of JPEG — that is Apple's whole reason for using it. So a faithful JPG of the same photo is normally larger. It is not this tool wasting space, and any converter will show you the same thing. If size matters more than compatibility, pick the WebP option (about 25% smaller than JPG) or press <b>Match original size</b>.</p></details>
      <details><summary>What does "Match original size" do?</summary><p>It searches for the JPG quality setting that lands closest to your original file's byte size, doing the search separately for every file. You will usually end up around 65–72% quality — still visually identical on a screen, but without the files ballooning.</p></details>
      <details><summary>Is this really free? What's the catch?</summary><p>Free and unlimited. The page runs entirely inside your browser, so there is no server cost per conversion for us to pass on to you. No account, no email, no watermark.</p></details>
      <details><summary>Are my photos uploaded anywhere?</summary><p>No. That is the whole design. Your browser downloads a decoder once, then does all the work locally. Open the Network tab in DevTools while converting and you will see no request carrying your image — and the panel on this page counts the outbound bytes for you.</p></details>
      <details><summary>Does it strip metadata like EXIF?</summary><p>Yes, and we would rather say so than pretend otherwise. Conversion runs through a canvas, so EXIF — including GPS coordinates and the original capture time — is dropped. For most people sharing photos online that is a privacy win, but if you need to preserve EXIF for professional work, use a desktop tool.</p></details>
      <details><summary>Which Apple and Android files are supported?</summary><p>Any HEIC or HEIF container: single photos, and HEIF files written by some Android phones. HEIC image sequences (bursts) convert their first frame. Live Photos convert as a still JPG.</p></details>
      <details><summary>Why is the first conversion slower?</summary><p>Your browser downloads the WebAssembly decoder once (about 1.4&nbsp;MB, then cached). On Safari 17.6+ we skip that entirely because the browser already decodes HEIC natively.</p></details>
      <details><summary>Is there a file size or count limit?</summary><p>No artificial limit. Everything is processed on your machine, so the only ceiling is your own memory. Very large batches (40+ full-resolution photos) will use a lot of RAM.</p></details>`,
        },
      ],

      related: {
        h2: 'Other converters in this set',
        sub: 'Same engine, same privacy model — your files stay on your device in all of them.',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone photos into a format everything can open. You are here.', tm: 'libheif WASM · native on Safari' },
          { tt: 'WebP → PNG', td: 'Get a lossless PNG you can edit, or shrink a WebP for print.', tm: 'native decode · no WASM' },
          { tt: 'AVIF → JPG', td: 'The newest image format, opened by the oldest. Handles 10-bit files.', tm: 'native decode · libavif WASM fallback' },
        ],
      },

      footerTagline: 'HEIC to JPG · processed locally, always.',

      worker: {
        libheifFail: 'libheif loaded but HeifDecoder is unavailable',
        noImage: 'No image found inside this file',
        hevcFail: 'HEVC frame could not be decoded',
      },

      tool: {
        zipName: 'heic-to-jpg.zip',
        inputName: 'HEIC / HEIF',
        inputDropTitle: 'HEIC / HEIF',
        reject: 'Those files are not HEIC/HEIF. Drop iPhone .heic or .heif files here.',
        quality: 70,
        qualityHint: 'HEIC stores the same photo in roughly half the space of JPG, so output is usually larger. 70% keeps it close to your original.',
        qualityHintByFormat: {
          'image/png': 'PNG is lossless, so quality has no effect — and the file will be much larger than the HEIC.',
          'image/webp': 'WebP compresses better than JPG, so 70% goes further here.',
        },
        formatHints: {
          'image/jpeg': 'JPG is the safest for sharing and printing.',
          'image/png': 'PNG is lossless — expect a file 10x larger. Use it only if you need transparency.',
          'image/webp': 'WebP is ~25% smaller than JPG at the same quality, and works in every modern browser.',
        },
        bannerGrew: 'That is expected, not a bug: HEIC packs the same photo into about half the bytes of JPG. Lower the quality, switch to WebP, or let this page find the setting that matches your original size.',
        bannerGrewByFormat: {
          'image/png': 'PNG is lossless, so it stores every pixel of the decoded photo and the file balloons to many times the original. That is the format, not the converter. Use JPG or WebP unless something specifically requires PNG — and if it does, cap the resolution, which is the only size lever PNG gives you.',
        },
        grewActions: [
          { label: '⭐ Match original size', act: 'fit' },
          { label: 'Try WebP (−30% vs JPG)', act: 'format:image/webp' },
        ],
        verifySteps: [
          'Open DevTools (<code>F12</code>) → <b>Network</b> tab and clear it.',
          'Drop your own HEIC files in and convert them.',
          'The only entry you will see is the decoder library from the CDN — and after the first visit, not even that. <b>No request ever carries your photo.</b>',
        ],
      },

      ldName: 'HEIC to JPG Converter',
      ldDesc: 'Convert HEIC/HEIF photos to JPG directly in the browser. Files are never uploaded to a server.',
      ldFaq: [
        { q: 'Are my photos uploaded anywhere?', a: 'No. Decoding happens entirely inside your browser using a WebAssembly build of libheif. No image data is transmitted.' },
        { q: 'Is the converter free?', a: 'Yes, free and unlimited with no signup, email or watermark.' },
        { q: 'Does it preserve EXIF metadata?', a: 'No. Conversion runs through a canvas, so EXIF including GPS coordinates and capture time is dropped.' },
        { q: 'Why is the converted JPG larger than the HEIC?', a: 'HEIC uses HEVC, which compresses roughly twice as efficiently as JPEG for the same visual quality. A faithful JPG is therefore normally larger than the HEIC it came from. Lower the quality setting or use Match original size to land close to the input size.' },
      ],
    },

    zh: {
      title: 'HEIC 转 JPG —— 免费、不上传、保护隐私',
      desc: '在浏览器里即刻把 iPhone 的 HEIC/HEIF 照片转成 JPG。100% 私密 —— 文件永远不会离开你的设备。支持批量转换、调整画质、打包 ZIP 下载。免费、不用注册、不加水印。',
      ogTitle: 'HEIC 转 JPG —— 免费、不上传、保护隐私',
      ogDesc: '在浏览器里把 iPhone 的 HEIC 照片转成 JPG。文件永远不会离开你的设备。',

      h1Html: `HEIC 转 <span class="accent">JPG</span>`,
      lede: `就在这里把 iPhone 照片转成 JPG。文件由你自己的 CPU 在本地解码 —— 永远不会上传到任何服务器。`,
      badges: ['✓ 从不上传', '批量转换', '打包 ZIP 下载', '画质可调', '免费不限量'],

      sections: [
        {
          h2: '为什么要把 HEIC 转成 JPG？',
          html:
`      <p>HEIC 是 iPhone 默认的拍摄格式 —— 同样的照片它只占大约一半空间。问题出在下一步。Windows 不买付费解码器就打不开它，大多数浏览器至今显示不了它，而大量上传表单、政务网站和打印店干脆直接拒收。HEIC 不是你选的，是你的手机替你选的。转成 JPG，就是让这个文件在任何地方都能用。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>到处都能打开</h4>
          <p>JPG 在任何设备、浏览器、打印机和上传表单上都能打开。不用装解码器包，也不会遇到"不支持的文件格式"。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>文件不离开你的设备</h4>
          <p>大多数转换器会把你的照片传到一台你完全不了解的服务器上。在这里，解码发生在你的浏览器标签页里，没有任何数据被发往任何地方。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>又快又不限量</h4>
          <p>不排队、不限文件大小、没有每小时 3 次的限制。现代浏览器原生就能解码 HEIC，其他的走 WebAssembly 解码器。</p>
        </div>
      </div>`,
        },
        {
          h2: '怎么把 HEIC 转成 JPG',
          html:
`      <ul>
        <li><b>添加文件</b> —— 拖进来、点<i>选择文件</i>，或者用 Ctrl&nbsp;+&nbsp;V 直接粘贴。一次多个文件也没问题。</li>
        <li><b>需要的话调整一下</b> —— 拖动质量滑块在体积和细节之间取舍，或者限制分辨率，方便发邮件和放上网页。</li>
        <li><b>下载</b> —— 单张保存，或者一次性打包成 ZIP 全部拿走。</li>
      </ul>
      <h3>输出体积大概会是多少？</h3>
      <p>这件事最好在动手前就知道，因为 HEIC 和 JPG 的效率并不对等。下面是拿一张 286.7&nbsp;KB 的 1440×960 iPhone 照片实测的结果：</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>输出设置</th><th>文件大小</th><th>相比原文件</th></tr></thead>
          <tbody>
            <tr><td class="h">JPG 质量 95</td><td>771 KB</td><td class="up">+169%</td></tr>
            <tr><td class="h">JPG 质量 85</td><td>482 KB</td><td class="up">+68%</td></tr>
            <tr><td class="h">JPG 质量 75</td><td>366 KB</td><td class="up">+28%</td></tr>
            <tr><td class="h">JPG 质量 65</td><td>302 KB</td><td class="up">+5%</td></tr>
            <tr><td class="h">JPG 质量 55</td><td>260 KB</td><td class="down">−9%</td></tr>
            <tr><td class="h">匹配原始大小（自动）</td><td>283 KB</td><td class="down">−1%</td></tr>
          </tbody>
        </table>
      </div>
      <p>HEIC 里的 HEVC 编码就是比 JPEG 更高效 —— 这正是苹果用它的全部理由。所以忠实还原的 JPG 通常<b>更大</b>，网上每一个转换器都是这个表现。你能调的是两根杠杆：质量滑块，和<b>匹配原始大小</b> —— 后者会针对每个文件分别找出最接近原始体积的设置。</p>`,
        },
        {
          h2: '常见问题',
          html:
`      <details><summary>为什么我转出来的 JPG 比原来的 HEIC 还大？</summary><p>因为 HEIC 用的是更高效的编码。同样的观感下，HEIC 内部的 HEVC 压缩只需要 JPEG 大约一半的字节 —— 这正是苹果采用它的原因。所以同一张照片忠实转成 JPG 通常更大。不是这个工具在浪费空间，任何转换器都会给你同样的结果。如果体积比兼容性更重要，选 WebP（比 JPG 小约 25%），或者按<b>匹配原始大小</b>。</p></details>
      <details><summary>"匹配原始大小"做了什么？</summary><p>它会搜索最接近你原始文件体积的 JPG 质量档位，而且是逐个文件分别搜索。结果通常落在 65–72% 之间 —— 在屏幕上依然看不出差别，但文件不会膨胀。</p></details>
      <details><summary>真的免费吗？套路在哪？</summary><p>免费且不限量。整个页面都在你的浏览器里运行，所以每次转换对我们来说没有服务器成本需要转嫁。不用账号、不留邮箱、不加水印。</p></details>
      <details><summary>我的照片会被上传到什么地方吗？</summary><p>不会。这就是整个设计。你的浏览器只下载一次解码器，之后全部在本地完成。转换时打开开发者工具的 Network 面板，你不会看到任何携带你图片的请求 —— 页面上的面板也会替你统计外发字节数。</p></details>
      <details><summary>会丢掉 EXIF 之类的元数据吗？</summary><p>会，而且我们宁愿直说也不装作没有。转换经过 canvas，所以 EXIF —— 包括 GPS 坐标和原始拍摄时间 —— 会被丢弃。对大多数在网上分享照片的人来说这是隐私上的加分，但如果你需要在专业用途中保留 EXIF，请用桌面工具。</p></details>
      <details><summary>支持哪些苹果和安卓文件？</summary><p>任何 HEIC 或 HEIF 容器：单张照片，以及某些安卓手机写出的 HEIF 文件。HEIC 图像序列（连拍）转换第一帧。Live Photo 会转成一张静态 JPG。</p></details>
      <details><summary>为什么第一次转换比较慢？</summary><p>你的浏览器需要下载一次 WebAssembly 解码器（约 1.4&nbsp;MB，之后走缓存）。在 Safari 17.6+ 上我们完全跳过这一步，因为浏览器原生就能解 HEIC。</p></details>
      <details><summary>有文件大小或数量限制吗？</summary><p>没有人为限制。一切都在你自己的机器上处理，所以唯一的天花板是你自己的内存。非常大的批次（40 张以上全分辨率照片）会吃掉大量内存。</p></details>`,
        },
      ],

      related: {
        h2: '这一组里的其他转换器',
        sub: '同一套引擎，同样的隐私模型 —— 它们都把文件留在你的设备上。',
        items: [
          { tt: 'HEIC → JPG', td: '把 iPhone 照片变成什么都能打开的格式。你正在这里。', tm: 'libheif WASM · Safari 原生' },
          { tt: 'WebP → PNG', td: '拿到可以继续编辑的无损 PNG，或者把 WebP 压小用于印刷。', tm: '原生解码 · 不加载 WASM' },
          { tt: 'AVIF → JPG', td: '最新的图片格式，交给最老的格式打开。支持 10-bit 文件。', tm: '原生解码 · libavif WASM 降级' },
        ],
      },

      footerTagline: 'HEIC 转 JPG · 始终在本地处理。',

      worker: {
        libheifFail: 'libheif 已加载，但 HeifDecoder 不可用',
        noImage: '在这个文件里没有找到图像',
        hevcFail: 'HEVC 帧解码失败',
      },

      tool: {
        zipName: 'heic-to-jpg.zip',
        inputName: 'HEIC / HEIF',
        inputDropTitle: 'HEIC / HEIF',
        reject: '这些文件不是 HEIC/HEIF。请把 iPhone 的 .heic 或 .heif 文件拖到这里。',
        quality: 70,
        qualityHint: 'HEIC 用大约一半的空间存下同一张照片，所以输出通常更大。70% 能让体积贴近原文件。',
        qualityHintByFormat: {
          'image/png': 'PNG 是无损的，质量滑块对它无效 —— 而且体积会比 HEIC 大得多。',
          'image/webp': 'WebP 的压缩效率比 JPG 好，所以 70% 在这里更耐用。',
        },
        formatHints: {
          'image/jpeg': 'JPG 是分享和打印最稳妥的选择。',
          'image/png': 'PNG 是无损格式 —— 体积会大 10 倍左右。只有需要透明通道时才用它。',
          'image/webp': '同画质下 WebP 比 JPG 小约 25%，而且所有现代浏览器都支持。',
        },
        bannerGrew: '这是预期内的，不是 bug：HEIC 把同一张照片塞进 JPG 大约一半的字节里。调低质量、换成 WebP，或者让这个页面自动找出匹配你原始大小的设置。',
        bannerGrewByFormat: {
          'image/png': 'PNG 是无损的，它会把解码后的每个像素都存下来，体积会膨胀到原文件的很多倍。这是格式决定的，不是转换器的问题。除非有明确要求，否则用 JPG 或 WebP —— 如果确实需要 PNG，那就限制分辨率，这是 PNG 唯一有效的减体积杠杆。',
        },
        grewActions: [
          { label: '⭐ 匹配原始大小', act: 'fit' },
          { label: '试试 WebP（比 JPG 小 30%）', act: 'format:image/webp' },
        ],
        verifySteps: [
          '打开开发者工具（<code>F12</code>）→ <b>Network</b> 面板，清空。',
          '把你自己的 HEIC 文件拖进来，然后转换。',
          '你会看到的唯一一条记录是来自 CDN 的解码器库 —— 而且第二次访问之后连它都没有。<b>没有任何请求会携带你的照片。</b>',
        ],
      },

      ldName: 'HEIC 转 JPG 转换器',
      ldDesc: '直接在浏览器里把 HEIC/HEIF 照片转成 JPG，文件永不上传到服务器。',
      ldFaq: [
        { q: '我的照片会被上传到什么地方吗？', a: '不会。解码完全在浏览器内完成，用的是 libheif 的 WebAssembly 版本，没有任何图像数据被传输。' },
        { q: '这个转换器免费吗？', a: '免费且不限量，不需要注册、不留邮箱、不加水印。' },
        { q: '会保留 EXIF 元数据吗？', a: '不会。转换经过 canvas，所以 EXIF（包括 GPS 坐标和拍摄时间）会被丢弃。' },
        { q: '为什么转出来的 JPG 比 HEIC 还大？', a: 'HEIC 使用 HEVC，同观感下的压缩效率约为 JPEG 的两倍。因此忠实还原的 JPG 通常比源 HEIC 更大。调低质量档位，或者用"匹配原始大小"贴近输入体积。' },
      ],
    },

    ja: {
      title: 'HEIC → JPG 変換 — 無料・アップロードなし・プライバシー保護',
      desc: 'iPhone の HEIC/HEIF 写真をブラウザ上ですぐに JPG へ変換。100% プライベート — ファイルが端末から出ることはありません。一括変換、画質調整、ZIP ダウンロードに対応。無料・登録不要・透かしなし。',
      ogTitle: 'HEIC → JPG 変換 — 無料・アップロードなし・プライバシー保護',
      ogDesc: 'iPhone の HEIC 写真をブラウザで JPG に変換。ファイルは端末から出ません。',

      h1Html: `HEIC → <span class="accent">JPG</span>`,
      lede: `iPhone の写真をその場で JPG に変換します。デコードはお使いの CPU がローカルで行い、サーバーへのアップロードは一切ありません。`,
      badges: ['✓ アップロードなし', '一括変換', 'ZIP ダウンロード', '画質調整', '無料・無制限'],

      sections: [
        {
          h2: 'なぜ HEIC を JPG に変換するのか',
          html:
`      <p>HEIC は iPhone が既定で使う形式で、同じ写真をおよそ半分の容量に収めます。問題はその先です。Windows は有料コーデックなしでは開けず、ほとんどのブラウザは今も表示できず、数多くのアップロードフォームや行政サイト、プリントショップは受け付け自体を拒否します。HEIC を選んだのはあなたではなく、スマホです。JPG に変換するのは、そのファイルをどこでも使えるようにする作業です。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>どこでも開ける</h4>
          <p>JPG はあらゆる端末、ブラウザ、プリンター、アップロードフォームで開けます。コーデックパックも「未対応の形式」もありません。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>ファイルが端末から出ない</h4>
          <p>多くの変換サービスは写真をあなたの知らないサーバーへ送ります。ここではデコードがブラウザのタブ内で完結し、どこにも送信されません。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>高速で無制限</h4>
          <p>順番待ちも、サイズ上限も、1 時間 3 回といった制限もありません。最新ブラウザは HEIC をネイティブにデコードし、それ以外は WebAssembly デコーダーが処理します。</p>
        </div>
      </div>`,
        },
        {
          h2: 'HEIC を JPG に変換する手順',
          html:
`      <ul>
        <li><b>ファイルを追加</b> — ドラッグするか、<i>ファイルを選択</i>をクリック、または Ctrl&nbsp;+&nbsp;V で貼り付け。複数まとめてでも問題ありません。</li>
        <li><b>必要なら調整</b> — 画質スライダーで容量とディテールのバランスを取るか、メールや Web 用に解像度を制限します。</li>
        <li><b>ダウンロード</b> — 個別に保存するか、まとめて ZIP で受け取ります。</li>
      </ul>
      <h3>出力サイズはどのくらいになる？</h3>
      <p>始める前に知っておく価値があります。HEIC と JPG は圧縮効率が同じではないからです。286.7&nbsp;KB の 1440×960 の iPhone 写真で実測した結果は次のとおりです。</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>出力設定</th><th>ファイルサイズ</th><th>元ファイル比</th></tr></thead>
          <tbody>
            <tr><td class="h">JPG 画質 95</td><td>771 KB</td><td class="up">+169%</td></tr>
            <tr><td class="h">JPG 画質 85</td><td>482 KB</td><td class="up">+68%</td></tr>
            <tr><td class="h">JPG 画質 75</td><td>366 KB</td><td class="up">+28%</td></tr>
            <tr><td class="h">JPG 画質 65</td><td>302 KB</td><td class="up">+5%</td></tr>
            <tr><td class="h">JPG 画質 55</td><td>260 KB</td><td class="down">−9%</td></tr>
            <tr><td class="h">元のサイズに合わせる（自動）</td><td>283 KB</td><td class="down">−1%</td></tr>
          </tbody>
        </table>
      </div>
      <p>HEIC 内部の HEVC は JPEG より単純に効率が良く、それが Apple の採用理由そのものです。つまり忠実な JPG は通常<b>大きくなります</b>。インターネット上のどの変換ツールも同じ挙動です。調整できるのは画質スライダーと<b>元のサイズに合わせる</b>の 2 つで、後者はファイルごとに元の容量に最も近い設定を探します。</p>`,
        },
        {
          h2: 'よくある質問',
          html:
`      <details><summary>変換後の JPG が元の HEIC より大きいのはなぜ？</summary><p>HEIC のほうが効率の良いコーデックだからです。同じ見た目なら、HEIC 内部の HEVC 圧縮は JPEG のおよそ半分のバイト数で済みます — これが Apple 採用の理由そのものです。したがって同じ写真を忠実に JPG 化すると通常は大きくなります。このツールが容量を無駄にしているわけではなく、どの変換ツールでも同じ結果になります。互換性より容量が重要な場合は WebP（JPG より約 25% 小）を選ぶか、<b>元のサイズに合わせる</b>を押してください。</p></details>
      <details><summary>「元のサイズに合わせる」は何をする？</summary><p>元のファイルのバイト数に最も近くなる JPG 画質を、ファイルごとに個別に探します。多くの場合 65〜72% 前後に落ち着きます — 画面上は見分けがつかないまま、ファイルだけが膨らむのを避けられます。</p></details>
      <details><summary>本当に無料？ 裏はある？</summary><p>無料で無制限です。ページ全体がブラウザ内で動作するため、変換ごとのサーバー費用が発生せず、それを転嫁する必要もありません。アカウントもメールも透かしもありません。</p></details>
      <details><summary>写真はどこかにアップロードされる？</summary><p>いいえ。それが設計のすべてです。ブラウザがデコーダーを一度だけダウンロードし、その後の処理はすべて端末内で行われます。変換中に開発者ツールの Network タブを開いても、画像を運ぶリクエストは現れません。このページのパネルが送信バイト数を集計しています。</p></details>
      <details><summary>EXIF などのメタデータは削除される？</summary><p>はい、そして知らないふりをするより明言します。変換は canvas を通るため、EXIF（GPS 座標や撮影日時を含む）は失われます。オンラインで写真を共有する多くの人にとってはプライバシー上の利点ですが、業務用途で EXIF を保持したい場合はデスクトップツールをお使いください。</p></details>
      <details><summary>Apple と Android のどのファイルに対応？</summary><p>あらゆる HEIC / HEIF コンテナに対応します。単体の写真のほか、一部の Android 端末が書き出す HEIF ファイルも含みます。HEIC の画像シーケンス（連写）は先頭フレームを変換します。Live Photos は静止画 JPG として変換されます。</p></details>
      <details><summary>最初の変換だけ遅いのはなぜ？</summary><p>ブラウザが WebAssembly デコーダーを一度だけダウンロードするためです（約 1.4&nbsp;MB、以降はキャッシュ）。Safari 17.6 以降ではブラウザが HEIC をネイティブに扱えるため、この手順を丸ごと省略します。</p></details>
      <details><summary>ファイルサイズや枚数の上限は？</summary><p>人為的な上限はありません。すべてお使いのマシン上で処理されるため、上限はメモリだけです。非常に大きなバッチ（フル解像度で 40 枚以上）は多くのメモリを消費します。</p></details>`,
        },
      ],

      related: {
        h2: 'このセットの他の変換ツール',
        sub: '同じエンジン、同じプライバシーモデル — どれもファイルを端末内に留めます。',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone の写真を、あらゆる環境で開ける形式に。現在のページです。', tm: 'libheif WASM · Safari ではネイティブ' },
          { tt: 'WebP → PNG', td: '編集できる可逆 PNG を得るか、印刷用に WebP を軽くします。', tm: 'ネイティブデコード · WASM 不使用' },
          { tt: 'AVIF → JPG', td: '最新の画像形式を、最古の形式で開く。10 ビットファイルにも対応。', tm: 'ネイティブデコード · libavif WASM フォールバック' },
        ],
      },

      footerTagline: 'HEIC → JPG · 常に端末内で処理します。',

      worker: {
        libheifFail: 'libheif は読み込まれましたが、HeifDecoder が利用できません',
        noImage: 'このファイル内に画像が見つかりません',
        hevcFail: 'HEVC フレームをデコードできませんでした',
      },

      tool: {
        zipName: 'heic-to-jpg.zip',
        inputName: 'HEIC / HEIF',
        inputDropTitle: 'HEIC / HEIF',
        reject: 'これらのファイルは HEIC/HEIF ではありません。iPhone の .heic または .heif ファイルをドロップしてください。',
        quality: 70,
        qualityHint: 'HEIC は同じ写真をおよそ半分の容量で保存するため、出力は通常大きくなります。70% なら元のファイルに近いサイズに収まります。',
        qualityHintByFormat: {
          'image/png': 'PNG は可逆圧縮なので画質設定は効きません — しかも HEIC よりずっと大きくなります。',
          'image/webp': 'WebP は JPG より圧縮効率が良いため、70% でも余裕があります。',
        },
        formatHints: {
          'image/jpeg': 'JPG は共有と印刷に最も安全な形式です。',
          'image/png': 'PNG は可逆形式です — 10 倍程度のサイズになることを想定してください。透明度が必要な場合のみお使いください。',
          'image/webp': '同じ画質なら WebP は JPG より約 25% 小さく、最新ブラウザすべてで表示できます。',
        },
        bannerGrew: 'これは想定どおりで、不具合ではありません。HEIC は同じ写真を JPG のおよそ半分のバイト数で保存します。画質を下げるか、WebP に切り替えるか、元のサイズに合う設定をこのページに探させてください。',
        bannerGrewByFormat: {
          'image/png': 'PNG は可逆圧縮のため、デコード後の全ピクセルをそのまま保存し、ファイルは元の何倍にも膨らみます。これは形式の性質であり、変換ツールの問題ではありません。特に必要がなければ JPG か WebP をお使いください。PNG が必要な場合は解像度を制限してください。それが PNG で唯一効く軽量化の手段です。',
        },
        grewActions: [
          { label: '⭐ 元のサイズに合わせる', act: 'fit' },
          { label: 'WebP を試す（JPG 比 −30%）', act: 'format:image/webp' },
        ],
        verifySteps: [
          '開発者ツール（<code>F12</code>）→ <b>Network</b> タブを開き、内容をクリアします。',
          'お手持ちの HEIC ファイルをドロップして変換します。',
          '表示されるのは CDN からのデコーダーライブラリだけです — しかも初回以降はそれすら出ません。<b>あなたの写真を含むリクエストは 1 件も発生しません。</b>',
        ],
      },

      ldName: 'HEIC → JPG 変換ツール',
      ldDesc: 'HEIC/HEIF 写真をブラウザ上で直接 JPG に変換。ファイルはサーバーへアップロードされません。',
      ldFaq: [
        { q: '写真はどこかにアップロードされますか？', a: 'いいえ。デコードは libheif の WebAssembly 版を使い、すべてブラウザ内で完結します。画像データは一切送信されません。' },
        { q: 'この変換ツールは無料ですか？', a: 'はい、登録・メール・透かしなしで無料・無制限です。' },
        { q: 'EXIF メタデータは保持されますか？', a: 'いいえ。変換は canvas を通るため、GPS 座標や撮影日時を含む EXIF は失われます。' },
        { q: '変換後の JPG が HEIC より大きいのはなぜですか？', a: 'HEIC は HEVC を使っており、同じ見た目での圧縮効率は JPEG の約 2 倍です。そのため忠実な JPG は元の HEIC より通常大きくなります。画質を下げるか、元のサイズに合わせる機能で入力サイズに近づけてください。' },
      ],
    },

    ko: {
      title: 'HEIC → JPG 변환기 — 무료, 업로드 없음, 개인정보 보호',
      desc: '아이폰의 HEIC/HEIF 사진을 브라우저에서 바로 JPG로 변환하세요. 100% 비공개 — 파일이 기기 밖으로 나가지 않습니다. 일괄 변환, 품질 조절, ZIP 다운로드 지원. 무료, 가입 없음, 워터마크 없음.',
      ogTitle: 'HEIC → JPG 변환기 — 무료, 업로드 없음, 개인정보 보호',
      ogDesc: '아이폰 HEIC 사진을 브라우저에서 JPG로 변환. 파일은 기기에서 나가지 않습니다.',

      h1Html: `HEIC → <span class="accent">JPG</span>`,
      lede: `아이폰 사진을 여기서 바로 JPG로 바꾸세요. 사용자의 CPU가 로컬에서 디코딩하며, 서버로 업로드되는 것은 아무것도 없습니다.`,
      badges: ['✓ 업로드 없음', '일괄 변환', 'ZIP 다운로드', '품질 조절', '무료 · 무제한'],

      sections: [
        {
          h2: 'HEIC를 JPG로 바꾸는 이유',
          html:
`      <p>HEIC는 아이폰이 기본으로 쓰는 형식이며 같은 사진을 절반 정도 용량에 담습니다. 문제는 그다음입니다. Windows는 유료 코덱 없이는 열지 못하고, 대부분의 브라우저는 여전히 표시하지 못하며, 수많은 업로드 양식과 관공서 사이트, 인쇄소는 아예 거부합니다. HEIC를 고른 건 사용자가 아니라 휴대폰입니다. JPG로 바꾸는 것은 그 파일을 어디서든 쓸 수 있게 만드는 일입니다.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>어디서나 열림</h4>
          <p>JPG는 모든 기기, 브라우저, 프린터, 업로드 양식에서 열립니다. 코덱 팩도, "지원하지 않는 형식"도 없습니다.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>파일이 기기를 떠나지 않음</h4>
          <p>대부분의 변환 서비스는 사진을 사용자가 모르는 서버로 보냅니다. 여기서는 디코딩이 브라우저 탭 안에서 끝나고 아무것도 전송되지 않습니다.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>빠르고 무제한</h4>
          <p>대기열도, 용량 상한도, 시간당 3회 제한도 없습니다. 최신 브라우저는 HEIC를 네이티브로 디코딩하고, 나머지는 WebAssembly 디코더가 처리합니다.</p>
        </div>
      </div>`,
        },
        {
          h2: 'HEIC를 JPG로 변환하는 방법',
          html:
`      <ul>
        <li><b>파일 추가</b> — 끌어다 놓거나 <i>파일 선택</i>을 클릭하거나 Ctrl&nbsp;+&nbsp;V로 붙여넣으세요. 여러 개를 한 번에 해도 됩니다.</li>
        <li><b>필요하면 조절</b> — 품질 슬라이더로 용량과 디테일을 맞바꾸거나, 메일·웹용으로 해상도를 제한하세요.</li>
        <li><b>다운로드</b> — 개별 저장하거나 한 번에 ZIP으로 받으세요.</li>
      </ul>
      <h3>출력 용량은 얼마나 될까?</h3>
      <p>시작하기 전에 알아둘 만합니다. HEIC와 JPG는 압축 효율이 같지 않기 때문입니다. 286.7&nbsp;KB짜리 1440×960 아이폰 사진으로 실측한 결과입니다.</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>출력 설정</th><th>파일 크기</th><th>원본 대비</th></tr></thead>
          <tbody>
            <tr><td class="h">JPG 품질 95</td><td>771 KB</td><td class="up">+169%</td></tr>
            <tr><td class="h">JPG 품질 85</td><td>482 KB</td><td class="up">+68%</td></tr>
            <tr><td class="h">JPG 품질 75</td><td>366 KB</td><td class="up">+28%</td></tr>
            <tr><td class="h">JPG 품질 65</td><td>302 KB</td><td class="up">+5%</td></tr>
            <tr><td class="h">JPG 품질 55</td><td>260 KB</td><td class="down">−9%</td></tr>
            <tr><td class="h">원본 크기에 맞추기 (자동)</td><td>283 KB</td><td class="down">−1%</td></tr>
          </tbody>
        </table>
      </div>
      <p>HEIC 안의 HEVC는 JPEG보다 확실히 효율이 좋고, 그게 애플이 이 형식을 쓰는 이유 전부입니다. 그래서 충실하게 변환한 JPG는 보통 <b>더 큽니다</b>. 인터넷의 모든 변환기가 똑같이 동작합니다. 조절할 수 있는 건 품질 슬라이더와 <b>원본 크기에 맞추기</b> 두 가지이며, 후자는 파일마다 원본 용량에 가장 가까운 설정을 찾습니다.</p>`,
        },
        {
          h2: '자주 묻는 질문',
          html:
`      <details><summary>변환한 JPG가 원본 HEIC보다 큰 이유는?</summary><p>HEIC가 더 효율적인 코덱이기 때문입니다. 같은 화질이라면 HEIC 내부의 HEVC 압축은 JPEG의 절반 정도 바이트로 끝납니다. 애플이 이 형식을 쓰는 이유가 바로 그것입니다. 그래서 같은 사진을 충실하게 JPG로 만들면 보통 더 커집니다. 이 도구가 용량을 낭비하는 게 아니라 어떤 변환기든 같은 결과가 나옵니다. 호환성보다 용량이 중요하면 WebP(JPG보다 약 25% 작음)를 고르거나 <b>원본 크기에 맞추기</b>를 누르세요.</p></details>
      <details><summary>"원본 크기에 맞추기"는 무엇을 하나요?</summary><p>원본 파일의 바이트 크기에 가장 가까운 JPG 품질을 파일마다 따로 찾습니다. 보통 65~72% 사이에 자리 잡습니다. 화면에서는 차이를 못 느끼면서 파일만 부풀어 오르는 일을 막아줍니다.</p></details>
      <details><summary>정말 무료인가요? 함정은?</summary><p>무료이고 무제한입니다. 페이지 전체가 브라우저에서 돌아가므로 변환마다 발생하는 서버 비용이 없고, 그 비용을 사용자에게 넘길 일도 없습니다. 계정도, 이메일도, 워터마크도 없습니다.</p></details>
      <details><summary>사진이 어딘가로 업로드되나요?</summary><p>아니요. 그게 설계의 전부입니다. 브라우저가 디코더를 한 번만 받고 이후 모든 처리를 로컬에서 합니다. 변환하는 동안 개발자 도구의 Network 탭을 열어도 사진을 실은 요청은 나타나지 않습니다. 이 페이지의 패널이 전송 바이트를 대신 세어 줍니다.</p></details>
      <details><summary>EXIF 같은 메타데이터가 삭제되나요?</summary><p>네, 그리고 모르는 척하기보다 분명히 말씀드립니다. 변환이 canvas를 거치기 때문에 EXIF(GPS 좌표와 촬영 시각 포함)가 사라집니다. 온라인에 사진을 공유하는 대부분에게는 개인정보 보호 측면에서 이득이지만, 업무용으로 EXIF를 유지해야 한다면 데스크톱 도구를 쓰세요.</p></details>
      <details><summary>어떤 애플·안드로이드 파일을 지원하나요?</summary><p>모든 HEIC/HEIF 컨테이너를 지원합니다. 단일 사진은 물론 일부 안드로이드 기기가 만든 HEIF 파일도 포함됩니다. HEIC 이미지 시퀀스(연사)는 첫 프레임을 변환합니다. Live Photos는 정지 JPG로 변환됩니다.</p></details>
      <details><summary>첫 변환만 느린 이유는?</summary><p>브라우저가 WebAssembly 디코더를 한 번 받기 때문입니다(약 1.4&nbsp;MB, 이후 캐시). Safari 17.6 이상에서는 브라우저가 HEIC를 네이티브로 처리하므로 이 과정을 통째로 건너뜁니다.</p></details>
      <details><summary>파일 크기나 개수 제한이 있나요?</summary><p>인위적인 제한은 없습니다. 모든 처리가 사용자 기기에서 이루어지므로 한계는 메모리뿐입니다. 아주 큰 묶음(풀 해상도 40장 이상)은 메모리를 많이 씁니다.</p></details>`,
        },
      ],

      related: {
        h2: '이 세트의 다른 변환기',
        sub: '같은 엔진, 같은 개인정보 보호 모델 — 모두 파일을 기기 안에 남깁니다.',
        items: [
          { tt: 'HEIC → JPG', td: '아이폰 사진을 어디서나 열리는 형식으로. 지금 이 페이지입니다.', tm: 'libheif WASM · Safari에서는 네이티브' },
          { tt: 'WebP → PNG', td: '편집할 수 있는 무손실 PNG를 얻거나 인쇄용으로 WebP를 줄이세요.', tm: '네이티브 디코딩 · WASM 미사용' },
          { tt: 'AVIF → JPG', td: '가장 새로운 이미지 형식을 가장 오래된 형식으로. 10비트 파일도 처리.', tm: '네이티브 디코딩 · libavif WASM 폴백' },
        ],
      },

      footerTagline: 'HEIC → JPG · 언제나 기기 안에서 처리합니다.',

      worker: {
        libheifFail: 'libheif는 로드됐지만 HeifDecoder를 사용할 수 없습니다',
        noImage: '이 파일 안에서 이미지를 찾지 못했습니다',
        hevcFail: 'HEVC 프레임을 디코딩하지 못했습니다',
      },

      tool: {
        zipName: 'heic-to-jpg.zip',
        inputName: 'HEIC / HEIF',
        inputDropTitle: 'HEIC / HEIF',
        reject: 'HEIC/HEIF 파일이 아닙니다. 아이폰의 .heic 또는 .heif 파일을 놓아주세요.',
        quality: 70,
        qualityHint: 'HEIC는 같은 사진을 절반 정도 용량에 담기 때문에 출력이 보통 더 큽니다. 70%면 원본에 가깝게 유지됩니다.',
        qualityHintByFormat: {
          'image/png': 'PNG는 무손실이라 품질 설정이 효과가 없습니다 — 게다가 HEIC보다 훨씬 커집니다.',
          'image/webp': 'WebP는 JPG보다 압축 효율이 좋아 70%로도 여유가 있습니다.',
        },
        formatHints: {
          'image/jpeg': 'JPG는 공유와 인쇄에 가장 안전한 형식입니다.',
          'image/png': 'PNG는 무손실입니다 — 10배 정도 커진다고 보세요. 투명도가 필요할 때만 쓰세요.',
          'image/webp': '같은 품질이면 WebP는 JPG보다 약 25% 작고, 모든 최신 브라우저에서 동작합니다.',
        },
        bannerGrew: '예상된 결과이며 버그가 아닙니다. HEIC는 같은 사진을 JPG의 절반 정도 바이트로 저장합니다. 품질을 낮추거나 WebP로 바꾸거나, 원본 크기에 맞는 설정을 이 페이지가 찾게 하세요.',
        bannerGrewByFormat: {
          'image/png': 'PNG는 무손실이라 디코딩된 모든 픽셀을 그대로 저장하고, 파일은 원본의 몇 배로 부풀어 오릅니다. 형식의 특성이지 변환기 문제가 아닙니다. 특별한 이유가 없다면 JPG나 WebP를 쓰고, PNG가 꼭 필요하면 해상도를 제한하세요. PNG에서 유일하게 통하는 용량 줄이기 수단입니다.',
        },
        grewActions: [
          { label: '⭐ 원본 크기에 맞추기', act: 'fit' },
          { label: 'WebP 시도 (JPG 대비 −30%)', act: 'format:image/webp' },
        ],
        verifySteps: [
          '개발자 도구(<code>F12</code>) → <b>Network</b> 탭을 열고 비웁니다.',
          '가지고 있는 HEIC 파일을 놓고 변환합니다.',
          '보이는 항목은 CDN의 디코더 라이브러리 하나뿐이고, 두 번째 방문부터는 그것도 나오지 않습니다. <b>사진을 실은 요청은 한 건도 발생하지 않습니다.</b>',
        ],
      },

      ldName: 'HEIC → JPG 변환기',
      ldDesc: 'HEIC/HEIF 사진을 브라우저에서 바로 JPG로 변환합니다. 파일은 서버로 업로드되지 않습니다.',
      ldFaq: [
        { q: '사진이 어딘가로 업로드되나요?', a: '아니요. 디코딩은 libheif의 WebAssembly 버전을 사용해 브라우저 안에서만 이루어지며, 이미지 데이터는 전송되지 않습니다.' },
        { q: '이 변환기는 무료인가요?', a: '네, 가입과 이메일, 워터마크 없이 무료이고 무제한입니다.' },
        { q: 'EXIF 메타데이터가 유지되나요?', a: '아니요. 변환이 canvas를 거치므로 GPS 좌표와 촬영 시각을 포함한 EXIF가 사라집니다.' },
        { q: '변환한 JPG가 HEIC보다 큰 이유는 무엇인가요?', a: 'HEIC는 HEVC를 사용하며 같은 화질에서 압축 효율이 JPEG의 약 두 배입니다. 따라서 충실한 JPG는 원본 HEIC보다 보통 더 큽니다. 품질을 낮추거나 원본 크기에 맞추기 기능으로 입력 크기에 가깝게 만드세요.' },
      ],
    },
  },
};
