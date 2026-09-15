/* =====================================================================
   WebP -> PNG page content. Four locales.

   This page deliberately has no decoder worker and no CDN reference:
   WebP decoding is native everywhere, so the page can honestly claim
   zero network requests during a conversion.
   ===================================================================== */

export default {
  slug: 'webp-to-png',
  ldType: 'SoftwareApplication',

  /* ---------- language-independent code ---------- */
  code: {
    workerId: null,
    accept: '.webp,image/webp',
    extSrc: `/\\.webp$/i`,
    mime: 'image/webp',

    // The container, not the extension, decides: RIFF....WEBP
    sniff: `
async function looksLikeWebp(file) {
  const h = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const riff = String.fromCharCode(h[0], h[1], h[2], h[3]) === 'RIFF';
  const webp = String.fromCharCode(h[8], h[9], h[10], h[11]) === 'WEBP';
  return riff && webp;
}`,

    /* WebP decoding is built into every browser that can display an image,
       so there is no codec to fetch and no worker needed — createImageBitmap
       already performs the decode off the main thread. The <img> branch
       exists for engines without createImageBitmap(Blob) (Safari < 15): an
       <img> runs the same codec and is equally drawable, it just cannot hand
       back a raw bitmap. */
    decode: `
async function decodeWebp(buffer, mime, force) {
  const blob = new Blob([buffer], { type: mime || 'image/webp' });
  // ?decode=img exercises the <img> branch on a browser that does not need it.
  if (force !== 'img') {
    try {
      const bmp = await createImageBitmap(blob);
      return { bitmap: bmp, width: bmp.width, height: bmp.height, mode: 'native' };
    } catch (_) { /* fall through to the <img> route */ }
  }
  const url = URL.createObjectURL(blob);
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => rej(new Error('__IMG_FAIL__'));
    i.src = url;
  });
  img.close = () => URL.revokeObjectURL(url);   // the engine calls this on remove
  return { bitmap: img, width: img.naturalWidth, height: img.naturalHeight, mode: 'img' };
}`,
  },

  locales: {
    en: {
      title: 'WebP to PNG Converter — Free, Private, No Upload',
      desc: 'Convert WebP images to PNG in your browser. Keeps transparency, no upload, no signup. Also exports JPG or a smaller WebP when PNG is too heavy. Batch convert and ZIP download.',
      ogTitle: 'WebP to PNG Converter — Free, Private, No Upload',
      ogDesc: 'Convert WebP to PNG in your browser. Transparency preserved. Files never leave your device.',

      h1Html: `WebP to <span class="accent">PNG</span>`,
      lede: `Turn a WebP into a PNG right here. Transparency is preserved, and this page fetches nothing from anyone while it works.`,
      badges: ['✓ Never uploaded', 'Zero network requests', 'Keeps transparency', 'Batch &amp; ZIP', 'Unlimited &amp; free'],

      sections: [
        {
          h2: 'Why convert WebP to PNG?',
          html:
`      <p>WebP is what websites hand you — Google pushed it, every CDN serves it, and it saves bandwidth. It is also the format that breaks things. Photoshop before 2022 refuses it, plenty of desktop apps, print shops and internal upload tools still reject it, and some document pipelines only accept PNG. PNG in exchange is the one format every piece of software on earth reads, transparency included. So this conversion is usually not about quality at all — it is about making a file <em>acceptable</em> to something that will not take WebP.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>Opens everywhere</h4>
          <p>PNG is read by every editor, operating system, printer driver and upload form in existence. No "unsupported file type".</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="#2563eb" stroke="none"/></svg></div>
          <h4>Transparency kept intact</h4>
          <p>Both formats carry an alpha channel, so logos, cut-outs and icons come through with clean edges — unlike JPG, which flattens them.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>Nothing leaves your device</h4>
          <p>This one is stronger than usual: the page loads no codec and makes no request at all while converting. Open DevTools and watch.</p>
        </div>
      </div>`,
        },
        {
          h2: 'The one thing you should know before converting',
          html:
`      <p><b>PNG is lossless, and that is exactly why your file will get much bigger.</b> Most WebP images on the web are <em>lossy</em> — detail was already thrown away when the image was created. Re-wrapping those pixels in a PNG does not bring any of it back. It only stores the same pixels in an uncompressed container. You get a larger file with identical (not better) picture quality.</p>
      <p>Here is what that looks like measured, across three real WebP files of different sizes:</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>Source WebP</th><th>PNG output</th><th>Change</th></tr></thead>
          <tbody>
            <tr><td class="h">1600×1068 · 294.6 KB</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">550×368 · 29.6 KB</td><td>361.6 KB</td><td class="up">+1121%</td></tr>
            <tr><td class="h">386×395 · 27.0 KB</td><td>63.1 KB</td><td class="up">+134%</td></tr>
          </tbody>
        </table>
      </div>
      <p>The smaller the WebP, the worse the ratio — a highly compressed 30 KB file can land above 360 KB. This is not a bug in this tool; it is what "lossless" means. If the file is going somewhere that needs a small size rather than a PNG specifically, the same source exports far smaller:</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>Output from the 294.6 KB WebP</th><th>File size</th><th>vs source</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG (lossless)</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">JPG at quality 85</td><td>271.6 KB</td><td class="down">−8%</td></tr>
            <tr><td class="h">JPG at quality 70</td><td>178.5 KB</td><td class="down">−39%</td></tr>
            <tr><td class="h">WebP at quality 80</td><td>187.2 KB</td><td class="down">−36%</td></tr>
          </tbody>
        </table>
      </div>
      <p>So: use PNG when something <em>requires</em> PNG or you need transparency. Use JPG or WebP when you only care about the picture. And if you need PNG but the size is the problem, <b>resize</b> — halving the long edge cuts the file to roughly a quarter, which is by far the biggest lever here.</p>`,
        },
        {
          h2: 'How to convert WebP to PNG',
          html:
`      <ul>
        <li><b>Add your files</b> — drag them in, click <i>Choose files</i>, or paste with Ctrl&nbsp;+&nbsp;V. Batches are fine.</li>
        <li><b>Leave it on PNG</b> if you need a PNG. Flip to JPG or WebP if you would rather have a small file; the toolbar tells you what each does.</li>
        <li><b>Download</b> individual images, or take the whole batch as a ZIP.</li>
      </ul>
      <h3>Which WebP files are supported?</h3>
      <p>Both lossy and lossless WebP, with or without an alpha channel, including animated files — though only the first frame is converted, because a PNG holds a single image. If you need the animation, keep it as WebP or convert to GIF or video instead.</p>`,
        },
        {
          h2: 'FAQ',
          html:
`      <details><summary>Why is the PNG so much bigger than the WebP I started with?</summary><p>WebP compresses hard and PNG does not compress at all — it stores lossless pixels. Measured on our samples the increase ranged from +134% to +1121%. If size matters more than the container format, export JPG or WebP instead; the same 294.6&nbsp;KB source becomes a 178.5&nbsp;KB JPG at quality 70.</p></details>
      <details><summary>Will converting to PNG improve the quality?</summary><p>No, and any tool that implies otherwise is misleading you. If your WebP is lossy, the detail is already gone. PNG is lossless, which means it will not lose anything <em>further</em> — it cannot recover what was discarded before you got the file. Converting a sharp source to PNG and then editing it is still a good idea, because the lossless container will not degrade each time you save.</p></details>
      <details><summary>Will I lose transparency?</summary><p>Not on this page — PNG keeps the alpha channel. But be careful if you switch the output to JPG: JPG has no alpha channel at all, so transparent areas come out as a solid colour. If your image has transparency, this page detects it and warns you before you download.</p></details>
      <details><summary>Is this really free? What's the catch?</summary><p>Free and unlimited, no account, no email, no watermark. There is no server cost to recover because there is no server — your browser does the decoding.</p></details>
      <details><summary>Does it work without an internet connection?</summary><p>Yes. WebP decoding is built into every browser, so this page needs no codec download. Once the page has loaded you can turn off your network and it will still convert.</p></details>
      <details><summary>Are my images uploaded anywhere?</summary><p>No. The self-verification panel on this page counts both the number of requests and the total outbound byte size. Convert a batch and it stays at zero — there is nothing to upload.</p></details>
      <details><summary>What is the largest batch I can convert?</summary><p>No artificial cap. Everything runs on your machine, so the only limit is your own memory. PNG output is large in memory too — a few dozen big images at once will use a lot of RAM.</p></details>`,
        },
      ],

      related: {
        h2: 'Other converters in this set',
        sub: 'Same engine, same privacy model — your files stay on your device in all of them.',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone photos into a format everything can open.', tm: 'libheif WASM · native on Safari' },
          { tt: 'WebP → PNG', td: 'Lossless output with transparency preserved. You are here.', tm: 'native decode · zero network requests' },
          { tt: 'AVIF → JPG', td: 'The newest image format, opened by the oldest. Handles 10-bit files.', tm: 'native decode · libavif WASM fallback' },
        ],
      },

      footerTagline: 'WebP to PNG · processed locally, always.',

      worker: {
        libheifFail: '',
        noImage: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'webp-to-png.zip',
        inputName: 'WebP',
        inputDropTitle: 'WebP',
        imgFail: 'This browser could not decode the WebP file',
        reject: 'That does not look like a WebP file. Drop .webp files here — the file structure is checked, not just the name.',
        quality: 70,
        qualityHint: 'PNG is lossless, so this slider has no effect until you switch to JPG or WebP.',
        qualityHintByFormat: {
          'image/png': 'PNG is lossless, so this slider has no effect — pick JPG or WebP to trade size against quality.',
          'image/jpeg': 'JPG at 70% cuts our 294.6 KB sample to 178.5 KB while staying visually clean.',
          'image/webp': 'WebP at 70% keeps transparency and beats JPG on size.',
        },
        formatHints: {
          'image/png': 'PNG is lossless and keeps transparency — but expect a file several times larger than the WebP.',
          'image/jpeg': 'JPG is much smaller than PNG, but it has no transparency — transparent areas come out solid.',
          'image/webp': 'Re-encodes the image as WebP — useful mainly to shrink an oversized one.',
        },
        /* For a PNG-only visitor, resizing is the real size lever — quality is
           not available to them at all. */
        presetLabels: null,
        resizeLabels: [
          'Keep original size',
          'Max 2048 px (long edge)',
          'Max 1280 px (web / email)',
          'Max 800 px (thumbnail)',
          'Max 512 px (icon)',
        ],
        bannerGrew: 'PNG is lossless and WebP is not, so a PNG is normally several times larger — that is the format, not the converter. Resize, or switch to JPG / WebP if the format is not required.',
        bannerGrewByFormat: {
          'image/jpeg': 'JPG is compressing a picture that was already compressed once, so it is not always smaller than the WebP you started with — a heavily compressed source can actually come out larger as JPG. Lower the quality, or let Match original size find the closest setting.',
          'image/webp': 'Re-encoding an already-compressed WebP loses a little quality and does not always make it smaller. If your source was heavily compressed, expect the output to land at roughly the same size.',
        },
        grewActions: [
          { label: 'Cap at 1280 px (≈4× smaller)', act: 'resize:1280' },
          { label: 'Try JPG (−39%)', act: 'format:image/jpeg' },
          { label: 'Try WebP (−36%)', act: 'format:image/webp' },
        ],
        verifySteps: [
          'Open DevTools (<code>F12</code>) → <b>Network</b> tab and clear it.',
          'Drop your own WebP files in and convert them.',
          'Nothing appears at all. WebP decoding is built into your browser, so there is no codec to download either — <b>this page never talks to a network</b>.',
        ],
      },

      ldName: 'WebP to PNG Converter',
      ldDesc: 'Convert WebP images to PNG in the browser with transparency preserved. Files are never uploaded and no codec is downloaded.',
      ldFaq: [
        { q: 'Why is the PNG larger than the WebP?', a: 'PNG is a lossless format while WebP is normally lossy, so the same pixels take far more space. Measured on real files the increase ranged from 134% to 1121%. Converting to PNG cannot restore detail that the WebP already discarded.' },
        { q: 'Does converting WebP to PNG improve quality?', a: 'No. If the WebP was lossy the detail is already gone; PNG stores the existing pixels without further loss but cannot recover anything.' },
        { q: 'Will transparency be preserved?', a: 'Yes when converting to PNG or WebP, which both carry an alpha channel. JPG has no alpha channel, so transparent areas become a solid colour, and this tool warns you before that happens.' },
        { q: 'Are my images uploaded?', a: 'No. The conversion runs entirely in the browser and the page makes no network requests at all while converting.' },
      ],
    },

    zh: {
      title: 'WebP 转 PNG —— 免费、不上传、保留透明',
      desc: '在浏览器里把 WebP 图片转成 PNG。保留透明通道，不上传、不用注册。PNG 太大的时候也能导出 JPG 或更小的 WebP。支持批量转换和打包 ZIP 下载。',
      ogTitle: 'WebP 转 PNG —— 免费、不上传、保留透明',
      ogDesc: '在浏览器里把 WebP 转成 PNG，透明通道完整保留。文件永远不会离开你的设备。',

      h1Html: `WebP 转 <span class="accent">PNG</span>`,
      lede: `就在这里把 WebP 变成 PNG。透明通道原样保留，而且这个页面在干活的时候，不会向任何地方取任何东西。`,
      badges: ['✓ 从不上传', '零网络请求', '保留透明通道', '批量 + ZIP', '免费不限量'],

      sections: [
        {
          h2: '为什么要把 WebP 转成 PNG？',
          html:
`      <p>WebP 是网站塞给你的东西 —— 谷歌在推它，每个 CDN 都在用它，它也确实省带宽。它同时也是最容易让软件翻脸的格式。2022 年之前的 Photoshop 直接拒绝它，很多桌面软件、打印店和内部上传工具至今不认它，还有些文档流程只收 PNG。而 PNG 是地球上每一款软件都读得懂的格式，透明通道也不例外。所以这个转换通常跟画质毫无关系 —— 它只是为了让某个不认 WebP 的地方能<em>收下</em>这个文件。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>到处都能打开</h4>
          <p>PNG 被所有编辑器、操作系统、打印机驱动和上传表单读取。不会出现"不支持的文件类型"。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="#2563eb" stroke="none"/></svg></div>
          <h4>透明通道完整保留</h4>
          <p>两种格式都带 alpha 通道，所以 logo、抠图和图标能保持干净的边缘 —— 这一点 JPG 做不到，它会直接把透明区域压平。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>没有任何东西离开你的设备</h4>
          <p>这一页比通常还要更彻底：它不加载任何解码器，转换期间也不发一个请求。打开开发者工具自己看。</p>
        </div>
      </div>`,
        },
        {
          h2: '动手之前，你最该知道的一件事',
          html:
`      <p><b>PNG 是无损的，这正是你的文件会大很多的原因。</b>网上大多数 WebP 都是<em>有损</em>的 —— 细节在图片生成的时候就已被丢掉。把这些像素重新装进 PNG 并不会把它们找回来，只是把同样的像素放进了一个未压缩的容器。你得到的是一个更大的文件，画质完全一样（而不是更好）。</p>
      <p>下面是三个不同体量的真实 WebP 文件实测的结果：</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>源 WebP</th><th>PNG 输出</th><th>变化</th></tr></thead>
          <tbody>
            <tr><td class="h">1600×1068 · 294.6 KB</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">550×368 · 29.6 KB</td><td>361.6 KB</td><td class="up">+1121%</td></tr>
            <tr><td class="h">386×395 · 27.0 KB</td><td>63.1 KB</td><td class="up">+134%</td></tr>
          </tbody>
        </table>
      </div>
      <p>WebP 越小，膨胀比例越夸张 —— 一个压得很狠的 30 KB 文件能落到 360 KB 以上。这不是本工具的 bug，这就是"无损"的含义。如果这份文件要去的地方需要的是小体积而不是 PNG 本身，同一个源文件可以导出小得多的结果：</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>从那个 294.6 KB 的 WebP 导出</th><th>文件大小</th><th>相比源文件</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG（无损）</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">JPG 质量 85</td><td>271.6 KB</td><td class="down">−8%</td></tr>
            <tr><td class="h">JPG 质量 70</td><td>178.5 KB</td><td class="down">−39%</td></tr>
            <tr><td class="h">WebP 质量 80</td><td>187.2 KB</td><td class="down">−36%</td></tr>
          </tbody>
        </table>
      </div>
      <p>所以：当某个地方<em>要求</em> PNG，或者你需要透明通道时，就用 PNG。只在乎画面本身时，用 JPG 或 WebP。如果你需要 PNG 但体积是问题，那就<b>缩小尺寸</b> —— 长边减半能把文件压到大约四分之一，这是这里最大的杠杆，没有之一。</p>`,
        },
        {
          h2: '怎么把 WebP 转成 PNG',
          html:
`      <ul>
        <li><b>添加文件</b> —— 拖进来、点<i>选择文件</i>，或者用 Ctrl&nbsp;+&nbsp;V 粘贴。批量也没问题。</li>
        <li><b>需要 PNG 就让它保持在 PNG</b>。如果更想要小体积，切到 JPG 或 WebP —— 工具栏会告诉你各自的代价。</li>
        <li><b>下载</b> 单张图片，或者把整批打包成 ZIP 一次拿走。</li>
      </ul>
      <h3>支持哪些 WebP 文件？</h3>
      <p>有损和无损 WebP 都支持，带不带 alpha 通道都行，动图也支持 —— 不过只转换第一帧，因为 PNG 只能装一张静态图。如果你需要动画，请保留为 WebP，或者改转 GIF 或视频。</p>`,
        },
        {
          h2: '常见问题',
          html:
`      <details><summary>为什么 PNG 比原来的 WebP 大这么多？</summary><p>WebP 压得很狠，而 PNG 完全不压缩 —— 它存的是无损像素。在我们的样本上实测，增幅从 +134% 一直到 +1121%。如果体积比容器格式更重要，请改导出 JPG 或 WebP；同一个 294.6&nbsp;KB 的源文件，在质量 70 下会变成 178.5&nbsp;KB 的 JPG。</p></details>
      <details><summary>转成 PNG 会提升画质吗？</summary><p>不会，任何暗示可以的工具都在误导你。如果你的 WebP 是有损的，细节早就没了。PNG 无损的意思是它不会<em>进一步</em>丢东西 —— 它无法恢复在你拿到文件之前就被丢掉的内容。把清晰的源文件转成 PNG 再编辑仍然是个好主意，因为无损容器在你每次保存时都不会再劣化。</p></details>
      <details><summary>透明通道会丢吗？</summary><p>在这个页面上不会 —— PNG 会保留 alpha 通道。但如果你把输出切成 JPG 就要注意了：JPG 根本没有 alpha 通道，透明区域会变成一块实色。如果你的图带透明，这个页面会检测到，并在你下载之前提醒你。</p></details>
      <details><summary>真的免费吗？套路在哪？</summary><p>免费且不限量，不用账号、不留邮箱、不加水印。没有服务器成本需要回收，因为没有服务器 —— 解码是你的浏览器在做。</p></details>
      <details><summary>断网还能用吗？</summary><p>可以。WebP 解码是所有浏览器自带的，所以这个页面不需要下载任何解码器。页面加载完之后，你可以把网断掉，它照样能转换。</p></details>
      <details><summary>我的图片会被上传到什么地方吗？</summary><p>不会。这个页面上的自检面板会同时统计请求条数和外发字节总量。转一批试试，它会一直停在零 —— 因为没有东西需要上传。</p></details>
      <details><summary>一次最多能转多少？</summary><p>没有人为上限。一切都在你自己的机器上跑，所以唯一的限制是你自己的内存。PNG 输出在内存里也很大 —— 一次几十张大图会吃掉大量内存。</p></details>`,
        },
      ],

      related: {
        h2: '这一组里的其他转换器',
        sub: '同一套引擎，同样的隐私模型 —— 它们都把文件留在你的设备上。',
        items: [
          { tt: 'HEIC → JPG', td: '把 iPhone 照片变成什么都能打开的格式。', tm: 'libheif WASM · Safari 原生' },
          { tt: 'WebP → PNG', td: '无损输出，透明通道原样保留。你正在这里。', tm: '原生解码 · 零网络请求' },
          { tt: 'AVIF → JPG', td: '最新的图片格式，交给最老的格式打开。支持 10-bit 文件。', tm: '原生解码 · libavif WASM 降级' },
        ],
      },

      footerTagline: 'WebP 转 PNG · 始终在本地处理。',

      worker: {
        libheifFail: '',
        noImage: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'webp-to-png.zip',
        inputName: 'WebP',
        inputDropTitle: 'WebP',
        imgFail: '这个浏览器无法解码该 WebP 文件',
        reject: '这看起来不像 WebP 文件。请把 .webp 文件拖到这里 —— 我们检查的是文件结构，不只是文件名。',
        quality: 70,
        qualityHint: 'PNG 是无损的，所以在你切到 JPG 或 WebP 之前，这个滑块不起作用。',
        qualityHintByFormat: {
          'image/png': 'PNG 是无损的，所以这个滑块不起作用 —— 选 JPG 或 WebP 才能在体积和画质之间取舍。',
          'image/jpeg': '质量 70 下，我们那个 294.6 KB 的样本会变成 178.5 KB，观感依然干净。',
          'image/webp': '质量 70 的 WebP 保留透明通道，而且体积比 JPG 更小。',
        },
        formatHints: {
          'image/png': 'PNG 无损且保留透明 —— 但体积会是 WebP 的好几倍。',
          'image/jpeg': 'JPG 比 PNG 小得多，但它没有透明通道 —— 透明区域会变成实色。',
          'image/webp': '重新编码为 WebP —— 主要用来压缩过大的文件。',
        },
        presetLabels: ['体积优先', '均衡', '清晰优先', '最清晰'],
        resizeLabels: [
          '保持原始尺寸',
          '最长边不超过 2048 px',
          '最长边不超过 1280 px（网页 / 邮件）',
          '最长边不超过 800 px（缩略图）',
          '最长边不超过 512 px（图标）',
        ],
        bannerGrew: 'PNG 无损而 WebP 有损，所以 PNG 通常是好几倍大 —— 这是格式决定的，不是转换器的问题。缩小尺寸，或者如果不需要 PNG 就切到 JPG / WebP。',
        bannerGrewByFormat: {
          'image/jpeg': 'JPG 是在压缩一张已经被压缩过的图，所以它不总是比你手里的 WebP 小 —— 压缩得很狠的源文件转成 JPG 反而可能更大。调低质量，或者让"匹配原始大小"去找最接近的设置。',
          'image/webp': '把已经压缩过的 WebP 再编码一次会损失一点画质，而且不总是更小。如果你的源文件压得很狠，输出大概会和它差不多大。',
        },
        grewActions: [
          { label: '压到 1280 px（约小 4 倍）', act: 'resize:1280' },
          { label: '试试 JPG（−39%）', act: 'format:image/jpeg' },
          { label: '试试 WebP（−36%）', act: 'format:image/webp' },
        ],
        verifySteps: [
          '打开开发者工具（<code>F12</code>）→ <b>Network</b> 面板，清空。',
          '把你自己的 WebP 文件拖进来，然后转换。',
          '什么都不会出现。WebP 解码是浏览器自带的，所以也没有解码器要下载 —— <b>这个页面从不跟网络打交道</b>。',
        ],
      },

      ldName: 'WebP 转 PNG 转换器',
      ldDesc: '在浏览器里把 WebP 图片转成 PNG，透明通道完整保留。文件永不上传，也不需要下载解码器。',
      ldFaq: [
        { q: '为什么 PNG 比 WebP 大？', a: 'PNG 是无损格式，而 WebP 通常是有损的，所以同样的像素要占大得多的空间。在真实文件上实测，增幅在 134% 到 1121% 之间。转成 PNG 无法恢复 WebP 已经丢弃的细节。' },
        { q: 'WebP 转 PNG 会提升画质吗？', a: '不会。如果 WebP 是有损的，细节已经没了；PNG 会无损地保存现有像素，但无法恢复任何内容。' },
        { q: '透明通道会被保留吗？', a: '转成 PNG 或 WebP 时会，两者都带 alpha 通道。JPG 没有 alpha 通道，透明区域会变成实色，本工具会在那之前提醒你。' },
        { q: '我的图片会被上传吗？', a: '不会。转换完全在浏览器里进行，页面在转换期间不会发出任何网络请求。' },
      ],
    },

    ja: {
      title: 'WebP → PNG 変換 — 無料・アップロードなし・透明度を保持',
      desc: 'WebP 画像をブラウザ上で PNG に変換。透明度を保持し、アップロードも登録も不要です。PNG が重すぎる場合は JPG やより小さな WebP で書き出せます。一括変換と ZIP ダウンロードに対応。',
      ogTitle: 'WebP → PNG 変換 — 無料・アップロードなし・透明度を保持',
      ogDesc: 'WebP をブラウザで PNG に変換。透明度はそのまま。ファイルは端末から出ません。',

      h1Html: `WebP → <span class="accent">PNG</span>`,
      lede: `WebP をその場で PNG に変換します。透明度は保持され、このページは処理中どこからも何も取得しません。`,
      badges: ['✓ アップロードなし', 'ネットワークリクエスト 0', '透明度を保持', '一括 &amp; ZIP', '無料・無制限'],

      sections: [
        {
          h2: 'なぜ WebP を PNG に変換するのか',
          html:
`      <p>WebP は Web サイトが押し付けてくる形式です — Google が推進し、あらゆる CDN が配信し、帯域も節約できます。同時に、最もトラブルを起こしやすい形式でもあります。2022 年より前の Photoshop は拒否し、多くのデスクトップアプリ、プリントショップ、社内アップロードツールも今なお受け付けず、PNG しか受け取らないドキュメント処理も存在します。一方 PNG は、地球上のあらゆるソフトウェアが読める形式で、透明度も扱えます。つまりこの変換は画質の話ではなく、WebP を受け付けない何かにファイルを<em>受け入れてもらう</em>ための作業です。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>どこでも開ける</h4>
          <p>PNG はあらゆるエディター、OS、プリンタードライバー、アップロードフォームで読めます。「未対応のファイル形式」はありません。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="#2563eb" stroke="none"/></svg></div>
          <h4>透明度がそのまま残る</h4>
          <p>どちらの形式もアルファチャンネルを持つため、ロゴや切り抜き、アイコンがきれいな輪郭のまま通ります — 透明部分を塗りつぶす JPG とは違います。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>端末から何も出ない</h4>
          <p>このページはさらに徹底しています。コーデックを読み込まず、変換中はリクエストを 1 件も発しません。開発者ツールでご確認ください。</p>
        </div>
      </div>`,
        },
        {
          h2: '変換前に知っておくべき唯一のこと',
          html:
`      <p><b>PNG は可逆圧縮であり、それがファイルがずっと大きくなる理由です。</b>Web 上の WebP のほとんどは<em>非可逆</em>です — 画像が作られた時点でディテールはすでに捨てられています。そのピクセルを PNG に詰め直しても戻ってくるわけではなく、同じピクセルを非圧縮の容器に入れるだけです。得られるのは、画質が同じ（良くはならない）ままの、より大きなファイルです。</p>
      <p>実際の WebP ファイル 3 つで実測した結果がこちらです。</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>元の WebP</th><th>PNG 出力</th><th>変化</th></tr></thead>
          <tbody>
            <tr><td class="h">1600×1068 · 294.6 KB</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">550×368 · 29.6 KB</td><td>361.6 KB</td><td class="up">+1121%</td></tr>
            <tr><td class="h">386×395 · 27.0 KB</td><td>63.1 KB</td><td class="up">+134%</td></tr>
          </tbody>
        </table>
      </div>
      <p>元の WebP が小さいほど比率は悪化します — 強く圧縮された 30 KB のファイルが 360 KB を超えることもあります。これはこのツールの不具合ではなく、「可逆圧縮」の意味そのものです。PNG という形式そのものではなく小ささが必要な場所なら、同じ元ファイルからずっと小さく書き出せます。</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>294.6 KB の WebP からの出力</th><th>ファイルサイズ</th><th>元ファイル比</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG（可逆）</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">JPG 画質 85</td><td>271.6 KB</td><td class="down">−8%</td></tr>
            <tr><td class="h">JPG 画質 70</td><td>178.5 KB</td><td class="down">−39%</td></tr>
            <tr><td class="h">WebP 画質 80</td><td>187.2 KB</td><td class="down">−36%</td></tr>
          </tbody>
        </table>
      </div>
      <p>つまり、PNG が<em>必須</em>の場合や透明度が必要な場合は PNG を。絵そのものが目的なら JPG か WebP を。PNG が必要でサイズが問題なら<b>リサイズ</b>してください — 長辺を半分にするとファイルはおよそ 4 分の 1 になります。ここで最も効く手段です。</p>`,
        },
        {
          h2: 'WebP を PNG に変換する手順',
          html:
`      <ul>
        <li><b>ファイルを追加</b> — ドラッグするか、<i>ファイルを選択</i>をクリック、Ctrl&nbsp;+&nbsp;V で貼り付け。一括でも問題ありません。</li>
        <li><b>PNG が必要ならそのまま</b>。小さくしたいなら JPG か WebP に切り替えてください。ツールバーがそれぞれの代償を示します。</li>
        <li><b>ダウンロード</b> — 個別に保存するか、まとめて ZIP で受け取ります。</li>
      </ul>
      <h3>どの WebP ファイルに対応？</h3>
      <p>非可逆・可逆の両方、アルファチャンネルの有無を問わず対応し、アニメーション WebP も扱えます — ただし PNG は静止画しか持てないため先頭フレームのみです。アニメーションが必要な場合は WebP のままか、GIF や動画への変換をご検討ください。</p>`,
        },
        {
          h2: 'よくある質問',
          html:
`      <details><summary>PNG が元の WebP よりずっと大きいのはなぜ？</summary><p>WebP は強く圧縮し、PNG はまったく圧縮しません — 可逆のピクセルをそのまま保持します。当サイトのサンプルでは +134% から +1121% の増加でした。コンテナ形式よりサイズが重要な場合は JPG か WebP で書き出してください。同じ 294.6&nbsp;KB の元ファイルが、画質 70 なら 178.5&nbsp;KB の JPG になります。</p></details>
      <details><summary>PNG に変換すると画質は良くなる？</summary><p>いいえ、そう示唆するツールは誤解を与えています。元の WebP が非可逆ならディテールはすでに失われています。PNG が可逆だというのは「これ以上失わない」という意味で、あなたがファイルを受け取る前に捨てられたものを取り戻すことはできません。シャープな元画像を PNG にしてから編集するのは依然として有効です。可逆の容器なら保存のたびに劣化しないからです。</p></details>
      <details><summary>透明度は失われる？</summary><p>このページでは失われません — PNG はアルファチャンネルを保持します。ただし出力を JPG に切り替える場合は注意してください。JPG にアルファチャンネルは存在せず、透明部分は単色になります。画像に透明度がある場合、このページが検出してダウンロード前に警告します。</p></details>
      <details><summary>本当に無料？ 裏はある？</summary><p>無料で無制限、アカウントもメールも透かしもありません。サーバーがないので回収すべきサーバー費用もありません — デコードはあなたのブラウザが行います。</p></details>
      <details><summary>インターネット接続がなくても動く？</summary><p>はい。WebP のデコードはすべてのブラウザに組み込まれているため、コーデックのダウンロードが不要です。ページを読み込んだ後はネットワークを切っても変換できます。</p></details>
      <details><summary>画像はどこかにアップロードされる？</summary><p>いいえ。このページの自己検証パネルは、リクエスト件数と送信バイト数の合計の両方を数えます。一括で変換してもゼロのままです — アップロードするものが何もありません。</p></details>
      <details><summary>一度に変換できる最大量は？</summary><p>人為的な上限はありません。すべてあなたのマシンで動くため、制限はメモリだけです。PNG 出力はメモリ上でも大きいため、大きな画像を数十枚まとめて処理すると多くのメモリを消費します。</p></details>`,
        },
      ],

      related: {
        h2: 'このセットの他の変換ツール',
        sub: '同じエンジン、同じプライバシーモデル — どれもファイルを端末内に留めます。',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone の写真を、あらゆる環境で開ける形式に。', tm: 'libheif WASM · Safari ではネイティブ' },
          { tt: 'WebP → PNG', td: '透明度を保ったままの可逆出力。現在のページです。', tm: 'ネイティブデコード · ネットワークリクエスト 0' },
          { tt: 'AVIF → JPG', td: '最新の画像形式を、最古の形式で開く。10 ビットファイルにも対応。', tm: 'ネイティブデコード · libavif WASM フォールバック' },
        ],
      },

      footerTagline: 'WebP → PNG · 常に端末内で処理します。',

      worker: {
        libheifFail: '',
        noImage: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'webp-to-png.zip',
        inputName: 'WebP',
        inputDropTitle: 'WebP',
        imgFail: 'このブラウザでは WebP ファイルをデコードできませんでした',
        reject: 'WebP ファイルではないようです。.webp ファイルをドロップしてください — ファイル名だけでなく構造を検査しています。',
        quality: 70,
        qualityHint: 'PNG は可逆圧縮のため、JPG か WebP に切り替えるまでこのスライダーは効きません。',
        qualityHintByFormat: {
          'image/png': 'PNG は可逆なのでこのスライダーは効きません — 容量と画質を天秤にかけるには JPG か WebP を選んでください。',
          'image/jpeg': '画質 70 なら、294.6 KB のサンプルが 178.5 KB になり、見た目もきれいなままです。',
          'image/webp': '画質 70 の WebP は透明度を保ち、容量でも JPG を上回ります。',
        },
        formatHints: {
          'image/png': 'PNG は可逆で透明度も保てます — ただし WebP の数倍のサイズになります。',
          'image/jpeg': 'JPG は PNG よりずっと小さいですが、透明度はありません — 透明部分は単色になります。',
          'image/webp': 'WebP として再エンコードします — 主に大きすぎるファイルを軽くする用途です。',
        },
        presetLabels: ['小さめ', 'バランス', '高画質', '最高'],
        resizeLabels: [
          '元のサイズを維持',
          '長辺 2048 px まで',
          '長辺 1280 px まで（Web・メール）',
          '長辺 800 px まで（サムネイル）',
          '長辺 512 px まで（アイコン）',
        ],
        bannerGrew: 'PNG は可逆、WebP は非可逆のため、PNG は通常数倍の大きさになります — これは形式の性質で、変換ツールの問題ではありません。リサイズするか、PNG が不要なら JPG / WebP に切り替えてください。',
        bannerGrewByFormat: {
          'image/jpeg': 'JPG は一度圧縮された画像をさらに圧縮するため、元の WebP より常に小さいとは限りません — 強く圧縮された元ファイルは JPG にすると逆に大きくなることがあります。画質を下げるか、「元のサイズに合わせる」で最も近い設定を探させてください。',
          'image/webp': 'すでに圧縮済みの WebP を再エンコードすると画質が少し落ち、常に小さくなるわけでもありません。元が強く圧縮されていれば、出力はほぼ同じサイズになると考えてください。',
        },
        grewActions: [
          { label: '1280 px に制限（約 4 倍軽量）', act: 'resize:1280' },
          { label: 'JPG を試す（−39%）', act: 'format:image/jpeg' },
          { label: 'WebP を試す（−36%）', act: 'format:image/webp' },
        ],
        verifySteps: [
          '開発者ツール（<code>F12</code>）→ <b>Network</b> タブを開き、内容をクリアします。',
          'お手持ちの WebP ファイルをドロップして変換します。',
          '何も表示されません。WebP のデコードはブラウザに組み込まれているため、ダウンロードするコーデックもありません — <b>このページはネットワークと一切通信しません</b>。',
        ],
      },

      ldName: 'WebP → PNG 変換ツール',
      ldDesc: 'WebP 画像を透明度を保ったままブラウザ上で PNG に変換。ファイルはアップロードされず、コーデックもダウンロードしません。',
      ldFaq: [
        { q: 'PNG が WebP より大きいのはなぜですか？', a: 'PNG は可逆形式で WebP は通常非可逆のため、同じピクセルがはるかに多くの容量を占めます。実ファイルでの実測では 134% から 1121% の増加でした。PNG に変換しても、WebP がすでに捨てたディテールは取り戻せません。' },
        { q: 'WebP を PNG に変換すると画質は上がりますか？', a: 'いいえ。WebP が非可逆ならディテールはすでに失われています。PNG は既存のピクセルをさらに損失なく保存しますが、何かを復元することはできません。' },
        { q: '透明度は保持されますか？', a: 'PNG または WebP への変換時は保持されます。どちらもアルファチャンネルを持つためです。JPG にアルファチャンネルはなく透明部分が単色になるため、このツールはその前に警告します。' },
        { q: '画像はアップロードされますか？', a: 'いいえ。変換はすべてブラウザ内で実行され、変換中にページがネットワークリクエストを発することは一切ありません。' },
      ],
    },

    ko: {
      title: 'WebP → PNG 변환기 — 무료, 업로드 없음, 투명도 유지',
      desc: 'WebP 이미지를 브라우저에서 PNG로 변환하세요. 투명도를 유지하며 업로드와 가입이 필요 없습니다. PNG가 너무 무거우면 JPG나 더 작은 WebP로 내보낼 수 있습니다. 일괄 변환과 ZIP 다운로드 지원.',
      ogTitle: 'WebP → PNG 변환기 — 무료, 업로드 없음, 투명도 유지',
      ogDesc: 'WebP를 브라우저에서 PNG로 변환. 투명도 유지. 파일은 기기에서 나가지 않습니다.',

      h1Html: `WebP → <span class="accent">PNG</span>`,
      lede: `WebP를 여기서 바로 PNG로 바꾸세요. 투명도는 그대로 유지되고, 이 페이지는 작업 중 어디에서도 아무것도 가져오지 않습니다.`,
      badges: ['✓ 업로드 없음', '네트워크 요청 0', '투명도 유지', '일괄 &amp; ZIP', '무료 · 무제한'],

      sections: [
        {
          h2: 'WebP를 PNG로 바꾸는 이유',
          html:
`      <p>WebP는 웹사이트가 밀어넣는 형식입니다. 구글이 밀었고 모든 CDN이 쓰고 있으며 대역폭도 절약합니다. 동시에 가장 문제를 일으키기 쉬운 형식이기도 합니다. 2022년 이전 Photoshop은 거부하고, 많은 데스크톱 앱과 인쇄소, 사내 업로드 도구도 여전히 받지 않으며, PNG만 받는 문서 처리도 있습니다. 반면 PNG는 지구상 모든 소프트웨어가 읽는 형식이고 투명도도 다룹니다. 그래서 이 변환은 화질의 문제가 아니라, WebP를 받지 않는 무언가에게 파일을 <em>받아들이게</em> 만드는 작업입니다.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>어디서나 열림</h4>
          <p>PNG는 모든 편집기, 운영체제, 프린터 드라이버, 업로드 양식에서 읽힙니다. "지원하지 않는 파일 형식"은 없습니다.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="#2563eb" stroke="none"/></svg></div>
          <h4>투명도가 그대로 남음</h4>
          <p>두 형식 모두 알파 채널을 가지므로 로고와 누끼, 아이콘이 깨끗한 가장자리로 넘어갑니다. 투명 영역을 눌러버리는 JPG와 다릅니다.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>기기에서 아무것도 나가지 않음</h4>
          <p>이 페이지는 더 철저합니다. 코덱을 불러오지 않고 변환 중 요청을 한 건도 보내지 않습니다. 개발자 도구로 확인해 보세요.</p>
        </div>
      </div>`,
        },
        {
          h2: '변환 전에 알아야 할 단 한 가지',
          html:
`      <p><b>PNG는 무손실이고, 그래서 파일이 훨씬 커집니다.</b> 웹에 있는 대부분의 WebP는 <em>손실</em> 압축입니다. 이미지가 만들어질 때 디테일은 이미 버려졌습니다. 그 픽셀을 PNG에 다시 담아도 되돌아오지 않습니다. 같은 픽셀을 압축하지 않은 용기에 넣을 뿐입니다. 결과는 화질이 같고(더 좋아지지 않고) 크기만 큰 파일입니다.</p>
      <p>실제 WebP 파일 세 개로 실측한 결과입니다.</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>원본 WebP</th><th>PNG 출력</th><th>변화</th></tr></thead>
          <tbody>
            <tr><td class="h">1600×1068 · 294.6 KB</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">550×368 · 29.6 KB</td><td>361.6 KB</td><td class="up">+1121%</td></tr>
            <tr><td class="h">386×395 · 27.0 KB</td><td>63.1 KB</td><td class="up">+134%</td></tr>
          </tbody>
        </table>
      </div>
      <p>원본 WebP가 작을수록 비율은 더 나빠집니다. 강하게 압축된 30 KB 파일이 360 KB를 넘기도 합니다. 이 도구의 버그가 아니라 "무손실"의 의미 그대로입니다. PNG 형식 자체가 아니라 작은 크기가 필요한 곳이라면 같은 원본에서 훨씬 작게 내보낼 수 있습니다.</p>
      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>294.6 KB WebP에서 내보낸 결과</th><th>파일 크기</th><th>원본 대비</th></tr></thead>
          <tbody>
            <tr><td class="h">PNG (무손실)</td><td>2.43 MB</td><td class="up">+746%</td></tr>
            <tr><td class="h">JPG 품질 85</td><td>271.6 KB</td><td class="down">−8%</td></tr>
            <tr><td class="h">JPG 품질 70</td><td>178.5 KB</td><td class="down">−39%</td></tr>
            <tr><td class="h">WebP 품질 80</td><td>187.2 KB</td><td class="down">−36%</td></tr>
          </tbody>
        </table>
      </div>
      <p>정리하면, PNG가 <em>필수</em>이거나 투명도가 필요하면 PNG를 쓰세요. 그림 자체가 목적이면 JPG나 WebP를 쓰세요. PNG가 필요한데 크기가 문제라면 <b>크기를 줄이세요</b>. 긴 변을 절반으로 줄이면 파일이 4분의 1 정도가 됩니다. 여기서 가장 강력한 수단입니다.</p>`,
        },
        {
          h2: 'WebP를 PNG로 변환하는 방법',
          html:
`      <ul>
        <li><b>파일 추가</b> — 끌어다 놓거나 <i>파일 선택</i>을 클릭하거나 Ctrl&nbsp;+&nbsp;V로 붙여넣으세요. 묶음도 괜찮습니다.</li>
        <li><b>PNG가 필요하면 그대로 두세요</b>. 작게 만들고 싶으면 JPG나 WebP로 바꾸세요. 도구 모음이 각각의 대가를 알려줍니다.</li>
        <li><b>다운로드</b> — 개별 저장하거나 묶음 전체를 ZIP으로 받으세요.</li>
      </ul>
      <h3>어떤 WebP 파일을 지원하나요?</h3>
      <p>손실과 무손실 WebP 모두, 알파 채널 유무와 관계없이 지원하며 애니메이션 WebP도 처리합니다. 다만 PNG는 정지 이미지만 담을 수 있어 첫 프레임만 변환합니다. 애니메이션이 필요하면 WebP로 두거나 GIF·동영상으로 바꾸세요.</p>`,
        },
        {
          h2: '자주 묻는 질문',
          html:
`      <details><summary>PNG가 원본 WebP보다 훨씬 큰 이유는?</summary><p>WebP는 강하게 압축하고 PNG는 전혀 압축하지 않습니다. 무손실 픽셀을 그대로 저장합니다. 저희 샘플에서는 +134%에서 +1121%까지 늘었습니다. 컨테이너 형식보다 크기가 중요하면 JPG나 WebP로 내보내세요. 같은 294.6&nbsp;KB 원본이 품질 70에서 178.5&nbsp;KB JPG가 됩니다.</p></details>
      <details><summary>PNG로 바꾸면 화질이 좋아지나요?</summary><p>아니요, 그렇게 암시하는 도구는 오해를 부추기는 것입니다. 원본 WebP가 손실 압축이라면 디테일은 이미 사라졌습니다. PNG가 무손실이라는 건 "더 이상 잃지 않는다"는 뜻이며, 파일을 받기 전에 버려진 것을 되살릴 수는 없습니다. 선명한 원본을 PNG로 만들어 두고 편집하는 건 여전히 좋습니다. 무손실 용기라 저장할 때마다 열화되지 않기 때문입니다.</p></details>
      <details><summary>투명도가 사라지나요?</summary><p>이 페이지에서는 사라지지 않습니다. PNG는 알파 채널을 유지합니다. 다만 출력을 JPG로 바꾸면 주의하세요. JPG에는 알파 채널이 없어 투명 영역이 단색이 됩니다. 이미지에 투명도가 있으면 이 페이지가 감지해서 다운로드 전에 경고합니다.</p></details>
      <details><summary>정말 무료인가요? 함정은?</summary><p>무료이고 무제한이며 계정도, 이메일도, 워터마크도 없습니다. 서버가 없으니 회수할 서버 비용도 없습니다. 디코딩은 사용자의 브라우저가 합니다.</p></details>
      <details><summary>인터넷 연결 없이도 되나요?</summary><p>네. WebP 디코딩은 모든 브라우저에 내장돼 있어 코덱을 받을 필요가 없습니다. 페이지를 한 번 열어두면 네트워크를 끊어도 변환됩니다.</p></details>
      <details><summary>이미지가 어딘가로 업로드되나요?</summary><p>아니요. 이 페이지의 자체 검증 패널은 요청 수와 전송 바이트 총량을 함께 셉니다. 묶음으로 변환해도 계속 0입니다. 업로드할 것이 없기 때문입니다.</p></details>
      <details><summary>한 번에 얼마나 많이 변환할 수 있나요?</summary><p>인위적인 상한은 없습니다. 모든 처리가 사용자 기기에서 돌아가므로 제한은 메모리뿐입니다. PNG 출력은 메모리도 많이 차지해서 큰 이미지 수십 장을 한 번에 하면 메모리를 크게 씁니다.</p></details>`,
        },
      ],

      related: {
        h2: '이 세트의 다른 변환기',
        sub: '같은 엔진, 같은 개인정보 보호 모델 — 모두 파일을 기기 안에 남깁니다.',
        items: [
          { tt: 'HEIC → JPG', td: '아이폰 사진을 어디서나 열리는 형식으로.', tm: 'libheif WASM · Safari에서는 네이티브' },
          { tt: 'WebP → PNG', td: '투명도를 유지한 무손실 출력. 지금 이 페이지입니다.', tm: '네이티브 디코딩 · 네트워크 요청 0' },
          { tt: 'AVIF → JPG', td: '가장 새로운 이미지 형식을 가장 오래된 형식으로. 10비트 파일도 처리.', tm: '네이티브 디코딩 · libavif WASM 폴백' },
        ],
      },

      footerTagline: 'WebP → PNG · 언제나 기기 안에서 처리합니다.',

      worker: {
        libheifFail: '',
        noImage: '',
        hevcFail: '',
      },

      tool: {
        zipName: 'webp-to-png.zip',
        inputName: 'WebP',
        inputDropTitle: 'WebP',
        imgFail: '이 브라우저에서는 WebP 파일을 디코딩하지 못했습니다',
        reject: 'WebP 파일이 아닌 것 같습니다. .webp 파일을 놓아주세요. 파일 이름만이 아니라 구조를 검사합니다.',
        quality: 70,
        qualityHint: 'PNG는 무손실이라 JPG나 WebP로 바꾸기 전까지 이 슬라이더는 효과가 없습니다.',
        qualityHintByFormat: {
          'image/png': 'PNG는 무손실이라 이 슬라이더가 효과가 없습니다. 크기와 화질을 맞바꾸려면 JPG나 WebP를 고르세요.',
          'image/jpeg': '품질 70이면 294.6 KB 샘플이 178.5 KB가 되고, 보기에도 깨끗합니다.',
          'image/webp': '품질 70의 WebP는 투명도를 유지하면서 크기에서 JPG를 앞섭니다.',
        },
        formatHints: {
          'image/png': 'PNG는 무손실이고 투명도도 유지합니다. 다만 WebP보다 몇 배 큰 파일이 됩니다.',
          'image/jpeg': 'JPG는 PNG보다 훨씬 작지만 투명도가 없습니다. 투명 영역은 단색이 됩니다.',
          'image/webp': 'WebP로 다시 인코딩합니다. 주로 너무 큰 파일을 줄일 때 씁니다.',
        },
        presetLabels: ['작게', '균형', '선명하게', '최대'],
        resizeLabels: [
          '원본 크기 유지',
          '긴 변 2048 px 이하',
          '긴 변 1280 px 이하 (웹·이메일)',
          '긴 변 800 px 이하 (썸네일)',
          '긴 변 512 px 이하 (아이콘)',
        ],
        bannerGrew: 'PNG는 무손실이고 WebP는 손실이라 PNG가 보통 몇 배 커집니다. 형식의 특성이지 변환기 문제가 아닙니다. 크기를 줄이거나, PNG가 필요 없다면 JPG·WebP로 바꾸세요.',
        bannerGrewByFormat: {
          'image/jpeg': 'JPG는 이미 한 번 압축된 그림을 다시 압축하는 것이라 원본 WebP보다 항상 작지는 않습니다. 강하게 압축된 원본은 JPG로 만들면 오히려 커질 수 있습니다. 품질을 낮추거나 원본 크기에 맞추기로 가장 가까운 설정을 찾게 하세요.',
          'image/webp': '이미 압축된 WebP를 다시 인코딩하면 화질이 조금 떨어지고 항상 작아지지도 않습니다. 원본이 강하게 압축돼 있었다면 출력도 비슷한 크기가 된다고 보세요.',
        },
        grewActions: [
          { label: '1280 px로 제한 (약 4배 작게)', act: 'resize:1280' },
          { label: 'JPG 시도 (−39%)', act: 'format:image/jpeg' },
          { label: 'WebP 시도 (−36%)', act: 'format:image/webp' },
        ],
        verifySteps: [
          '개발자 도구(<code>F12</code>) → <b>Network</b> 탭을 열고 비웁니다.',
          '가지고 있는 WebP 파일을 놓고 변환합니다.',
          '아무것도 나타나지 않습니다. WebP 디코딩은 브라우저에 내장돼 있어 받을 코덱도 없습니다. <b>이 페이지는 네트워크와 전혀 통신하지 않습니다.</b>',
        ],
      },

      ldName: 'WebP → PNG 변환기',
      ldDesc: 'WebP 이미지를 투명도를 유지한 채 브라우저에서 PNG로 변환합니다. 파일은 업로드되지 않고 코덱도 내려받지 않습니다.',
      ldFaq: [
        { q: 'PNG가 WebP보다 큰 이유는 무엇인가요?', a: 'PNG는 무손실 형식이고 WebP는 보통 손실이므로 같은 픽셀이 훨씬 많은 공간을 차지합니다. 실제 파일 실측에서 증가율은 134%에서 1121%였습니다. PNG로 변환해도 WebP가 이미 버린 디테일은 되살릴 수 없습니다.' },
        { q: 'WebP를 PNG로 바꾸면 화질이 좋아지나요?', a: '아니요. WebP가 손실 압축이라면 디테일은 이미 사라졌습니다. PNG는 기존 픽셀을 추가 손실 없이 저장할 뿐이며 무엇도 복원하지 못합니다.' },
        { q: '투명도가 유지되나요?', a: 'PNG나 WebP로 변환할 때는 유지됩니다. 둘 다 알파 채널을 가지기 때문입니다. JPG에는 알파 채널이 없어 투명 영역이 단색이 되며, 이 도구는 그 전에 경고합니다.' },
        { q: '이미지가 업로드되나요?', a: '아니요. 변환은 전적으로 브라우저에서 실행되며 변환 중 페이지는 네트워크 요청을 전혀 보내지 않습니다.' },
      ],
    },
  },
};
