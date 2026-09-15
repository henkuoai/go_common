/* =====================================================================
   Hub page content (site root). Four locales, one structure.

   Fields consumed by _dev/build-pages.mjs:
     title/desc/ogTitle/ogDesc  -> <head>
     trustbar[]                 -> the bar above the header
     h1Html/lede/badges[]       -> <header>
     cards[]                    -> .hubgrid entries
     sections[]                 -> .content blocks, { h2, html }
     related                    -> .related block + cluster links
     footerTagline              -> <footer> text
     ld                         -> JSON-LD (URLs are filled in by the builder)

   Values are trusted HTML written by us, so the builder inserts them
   verbatim. Anything user-supplied is escaped inside the engine instead.
   ===================================================================== */

export default {
  slug: '',            // site root
  ldType: 'WebSite',

  locales: {
    en: {
      title: 'LocalConvert — Image Converters That Never Upload Your Files',
      desc: 'A small set of browser-based image converters: HEIC to JPG, WebP to PNG, AVIF to JPG. Everything runs on your own machine — no upload, no signup, no watermark.',
      ogTitle: 'LocalConvert — Image Converters That Never Upload Your Files',
      ogDesc: 'HEIC to JPG, WebP to PNG, AVIF to JPG. All processed in your browser.',

      trustbar: [
        `🔒 <b>Runs 100% in your browser</b>`,
        `No upload`,
        `No signup`,
        `No watermark`,
        `No file-size limit`,
      ],

      h1Html: `Image converters that <span class="accent">never upload</span> your files`,
      lede: `Every tool here does its work inside your own browser tab. Nothing is sent to a server, nothing is stored, and you can watch that claim hold up in DevTools.`,
      badges: ['✓ Verified locally', 'Batch convert', 'ZIP download', 'Free &amp; unlimited'],

      cards: [
        {
          icon: 'HEIC', h3: 'HEIC to JPG',
          p: `The iPhone problem. Your phone shoots HEIC by default, then Windows, browsers, print shops and upload forms refuse to open it. Convert a whole batch to JPG and get on with your day.`,
          go: 'Convert HEIC → JPG',
        },
        {
          icon: 'WebP', h3: 'WebP to PNG',
          p: `WebP is what websites serve you; PNG is what desktop software accepts. Converts losslessly and keeps transparency — and this page makes no network requests at all while it works.`,
          go: 'Convert WebP → PNG',
        },
        {
          icon: 'AVIF', h3: 'AVIF to JPG',
          p: `The newest format, and the one most likely to break something. Handles 10-bit files, flags transparency before JPG flattens it, and falls back to a WebAssembly decoder on older browsers.`,
          go: 'Convert AVIF → JPG',
        },
      ],

      sections: [
        {
          h2: `Why "never uploaded" is the whole design`,
          html:
`      <p>Search for any of these conversions and you will find dozens of sites that do it. Almost all of them <em>upload your file to a server</em>, convert it there, and hand it back. That means your photo — with its location data, its faces, whatever is in it — sits on a machine belonging to someone you have never met, for a period of time they decide. Most of the time nothing bad happens. But you have no way to verify that, and for a lot of people that is reason enough to look elsewhere.</p>
      <p>These tools take the other approach. Your browser already contains decoders for JPEG, PNG, WebP and AVIF, and a WebAssembly build of libheif or libavif closes the gap for HEIC and older browsers. Encoding happens on a <code>&lt;canvas&gt;</code> in the tab. The consequence is that there is no server in the loop at all — which is why every page here ships a panel that counts the requests it makes and adds up the size of every outbound payload, so you can check the claim instead of trusting it.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>Nothing to store or leak</h4>
          <p>There is no upload, so there is no queue, no retention policy and no third party holding your images.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>No queue, no limits</h4>
          <p>Your own CPU does the work, so there is no file-size cap, no hourly allowance and no waiting behind other people.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>Free with no catch</h4>
          <p>No account, no email capture, no watermark, no upgrade nag. There is no per-conversion cost to recover because there is no server cost.</p>
        </div>
      </div>`,
        },
        {
          h2: `What each tool is actually good at`,
          html:
`      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>Tool</th><th>Decoder</th><th>Keeps transparency</th><th>Network requests while converting</th></tr></thead>
          <tbody>
            <tr><td class="h">HEIC → JPG</td><td>native (Safari) / libheif WASM</td><td>with PNG or WebP output</td><td>1 codec download, cached after</td></tr>
            <tr><td class="h">WebP → PNG</td><td>native, built into every browser</td><td>yes</td><td><b>none at all</b></td></tr>
            <tr><td class="h">AVIF → JPG</td><td>native / libavif WASM fallback</td><td>with PNG or WebP output</td><td>none on current browsers</td></tr>
          </tbody>
        </table>
      </div>
      <h3>One thing worth knowing before you convert anything</h3>
      <p>Converting between formats does not improve quality, and it usually changes the file size — sometimes by a lot. Older formats are simply less efficient, so a faithful JPG of a HEIC or AVIF is typically larger, while a PNG of any lossy source is dramatically larger. Each tool page states the measured numbers for its own conversion so you know what to expect before you download, and every page has a <b>Match original size</b> option that searches for the setting landing closest to the file you started with.</p>`,
        },
      ],

      related: {
        h2: 'Pick a converter',
        sub: 'All three share the same engine and the same privacy model.',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone photos into a format everything can open.', tm: 'libheif WASM · native on Safari' },
          { tt: 'WebP → PNG', td: 'Lossless output with transparency preserved.', tm: 'native decode · zero network requests' },
          { tt: 'AVIF → JPG', td: 'The newest image format, opened by the oldest.', tm: 'native decode · libavif WASM fallback' },
        ],
      },

      footerTagline: 'LocalConvert · processed locally, always.',
      ldDesc: 'Browser-based image converters that never upload your files.',
    },

    zh: {
      title: 'LocalConvert —— 图片转换，从不上传你的文件',
      desc: '一组跑在浏览器里的图片转换工具：HEIC 转 JPG、WebP 转 PNG、AVIF 转 JPG。全部在你自己的电脑上完成 —— 不上传、不注册、不加水印。',
      ogTitle: 'LocalConvert —— 图片转换，从不上传你的文件',
      ogDesc: 'HEIC 转 JPG、WebP 转 PNG、AVIF 转 JPG，全部在浏览器里完成。',

      trustbar: [
        `🔒 <b>100% 在你的浏览器里运行</b>`,
        `不上传`,
        `不用注册`,
        `不加水印`,
        `不限文件大小`,
      ],

      h1Html: `从<span class="accent">不上传</span>你文件的图片转换工具`,
      lede: `这里的每个工具都在你自己的浏览器标签页里干活。没有任何东西发往服务器，没有任何东西被留下来，而且这个说法你可以自己在开发者工具里验证。`,
      badges: ['✓ 本地验证通过', '批量转换', '打包 ZIP 下载', '免费不限量'],

      cards: [
        {
          icon: 'HEIC', h3: 'HEIC 转 JPG',
          p: `iPhone 带来的麻烦。手机默认拍 HEIC，然后 Windows、浏览器、打印店和各种上传表单都不肯打开它。一次性把整批转成 JPG，该干嘛干嘛去。`,
          go: '转换 HEIC → JPG',
        },
        {
          icon: 'WebP', h3: 'WebP 转 PNG',
          p: `网站塞给你的是 WebP，桌面软件认的是 PNG。无损转换、透明通道原样保留 —— 而且这个页面在转换期间不会发出任何网络请求。`,
          go: '转换 WebP → PNG',
        },
        {
          icon: 'AVIF', h3: 'AVIF 转 JPG',
          p: `最新的格式，也最容易让软件翻脸。支持 10-bit 文件，在 JPG 压平透明区域之前就提醒你，老浏览器上会自动降级到 WebAssembly 解码器。`,
          go: '转换 AVIF → JPG',
        },
      ],

      sections: [
        {
          h2: `为什么"从不上传"是整个设计的出发点`,
          html:
`      <p>搜索这类转换，你会找到几十个网站在做。它们几乎都是<em>把你的文件上传到服务器</em>，在那边转完再还给你。这意味着你的照片 —— 连同位置信息、里面的人脸、照片里的一切 —— 会待在一台属于陌生人的机器上，待多久由对方决定。大多数时候不会出事。但你没有任何办法核实这一点，而对很多人来说，这已经足够成为换一个工具的理由。</p>
      <p>这些工具走的是另一条路。你的浏览器本身就带着 JPEG、PNG、WebP 和 AVIF 的解码器，而 libheif 或 libavif 的 WebAssembly 版本补齐了 HEIC 和老浏览器的缺口。编码发生在标签页里的 <code>&lt;canvas&gt;</code> 上。结果是整条链路里根本没有服务器 —— 所以这里的每个页面都自带一个面板，统计它发过多少请求、累加每一条外发数据的体积，让你可以自己核实，而不是选择相信。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>没有东西可存，就没有东西可泄</h4>
          <p>没有上传，就没有排队，没有留存策略，也没有第三方替你保管图片。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>不排队，不设限</h4>
          <p>干活的是你自己的 CPU，所以没有文件大小上限，没有每小时的额度，也不用排在别人后面。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>免费，而且没有附加条件</h4>
          <p>不用账号、不留邮箱、不加水印、不弹升级提示。没有服务器成本，也就没有需要从你身上找补的转换成本。</p>
        </div>
      </div>`,
        },
        {
          h2: `这三个工具各自擅长什么`,
          html:
`      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>工具</th><th>解码器</th><th>是否保留透明</th><th>转换时的网络请求</th></tr></thead>
          <tbody>
            <tr><td class="h">HEIC → JPG</td><td>原生（Safari）/ libheif WASM</td><td>输出 PNG 或 WebP 时保留</td><td>下载 1 次解码器，之后走缓存</td></tr>
            <tr><td class="h">WebP → PNG</td><td>浏览器原生自带</td><td>是</td><td><b>完全没有</b></td></tr>
            <tr><td class="h">AVIF → JPG</td><td>原生 / libavif WASM 降级</td><td>输出 PNG 或 WebP 时保留</td><td>现代浏览器上为零</td></tr>
          </tbody>
        </table>
      </div>
      <h3>动手之前，有一件事值得先知道</h3>
      <p>格式互转不会提升画质，而且通常会改变文件体积 —— 有时改变还很大。旧格式的效率就是更低，所以 HEIC 或 AVIF 转成忠实还原的 JPG 通常更大，而任何有损源文件转成 PNG 都会大得离谱。每个工具页都写明了自己那组转换的实测数字，让你在下载前就知道会得到什么；每个页面也都有<b>匹配原始大小</b>选项，会自动找出最接近原始文件的参数。</p>`,
        },
      ],

      related: {
        h2: '选一个转换器',
        sub: '三个工具共用同一套引擎，隐私模型也完全一致。',
        items: [
          { tt: 'HEIC → JPG', td: '把 iPhone 照片变成什么都能打开的格式。', tm: 'libheif WASM · Safari 原生' },
          { tt: 'WebP → PNG', td: '无损输出，透明通道原样保留。', tm: '原生解码 · 零网络请求' },
          { tt: 'AVIF → JPG', td: '最新的图片格式，交给最老的格式打开。', tm: '原生解码 · libavif WASM 降级' },
        ],
      },

      footerTagline: 'LocalConvert · 始终在本地处理。',
      ldDesc: '从不上传文件的浏览器端图片转换工具。',
    },

    ja: {
      title: 'LocalConvert — ファイルを一切アップロードしない画像変換ツール',
      desc: 'ブラウザだけで動く画像変換ツールセット：HEIC → JPG、WebP → PNG、AVIF → JPG。すべてお使いの端末内で処理します。アップロードなし、登録なし、透かしなし。',
      ogTitle: 'LocalConvert — ファイルを一切アップロードしない画像変換ツール',
      ogDesc: 'HEIC → JPG、WebP → PNG、AVIF → JPG。すべてブラウザ内で処理します。',

      trustbar: [
        `🔒 <b>100% ブラウザ内で処理</b>`,
        `アップロードなし`,
        `登録不要`,
        `透かしなし`,
        `ファイルサイズ無制限`,
      ],

      h1Html: `ファイルを<span class="accent">一切アップロードしない</span>画像変換ツール`,
      lede: `ここにあるツールはすべて、お使いのブラウザのタブ内だけで処理が完結します。サーバーへ送られるものは何もなく、保存されるものも何もありません。その主張は開発者ツールでご自身で確認できます。`,
      badges: ['✓ ローカルで検証済み', '一括変換', 'ZIP ダウンロード', '無料・無制限'],

      cards: [
        {
          icon: 'HEIC', h3: 'HEIC → JPG',
          p: `iPhone がらみの厄介ごと。スマホは既定で HEIC で撮影し、Windows、ブラウザ、プリントショップ、各種アップロードフォームがそれを開こうとしません。まとめて JPG に変換して先に進みましょう。`,
          go: 'HEIC → JPG に変換',
        },
        {
          icon: 'WebP', h3: 'WebP → PNG',
          p: `Web サイトが配信してくるのが WebP、デスクトップソフトが受け付けるのが PNG。可逆変換で透明度もそのまま — しかもこのページは処理中にネットワークリクエストを一切行いません。`,
          go: 'WebP → PNG に変換',
        },
        {
          icon: 'AVIF', h3: 'AVIF → JPG',
          p: `最も新しい形式であり、最もトラブルを起こしやすい形式でもあります。10 ビットファイルに対応し、JPG が透明部分を塗りつぶす前に警告し、古いブラウザでは WebAssembly デコーダーに自動で切り替わります。`,
          go: 'AVIF → JPG に変換',
        },
      ],

      sections: [
        {
          h2: `「アップロードしない」が設計そのものである理由`,
          html:
`      <p>こうした変換を検索すると、同じことをするサイトが何十も見つかります。そのほとんどが<em>あなたのファイルをサーバーにアップロード</em>し、そこで変換して返してきます。つまり写真は、位置情報や写り込んだ人物などすべて含めて、見ず知らずの誰かのマシン上に、相手が決めた期間だけ置かれることになります。大抵は何も起きません。しかしそれを確認する手段はあなたにはなく、多くの人にとってはそれだけで別のツールを探す理由になります。</p>
      <p>このツール群は逆のアプローチを取ります。ブラウザには JPEG、PNG、WebP、AVIF のデコーダーがすでに組み込まれており、libheif や libavif の WebAssembly 版が HEIC と古いブラウザの隙間を埋めます。エンコードはタブ内の <code>&lt;canvas&gt;</code> で行われます。結果として、経路にサーバーが一切存在しません。だからこそ各ページには、自分が発したリクエスト数と送信データの合計サイズを表示するパネルが付いており、信じるのではなく自分で確かめられるようになっています。</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>保存も漏洩もするものがない</h4>
          <p>アップロードがなければ、待ち行列も保存ポリシーも、あなたの画像を抱え込む第三者も存在しません。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>順番待ちも上限もなし</h4>
          <p>処理するのはあなた自身の CPU です。ファイルサイズの上限も、時間あたりの回数制限も、他人の後ろで待つこともありません。</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>条件なしで無料</h4>
          <p>アカウント不要、メール取得なし、透かしなし、アップグレード催促なし。サーバー費用がないので、回収すべき変換コストもありません。</p>
        </div>
      </div>`,
        },
        {
          h2: `各ツールが実際に得意なこと`,
          html:
`      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>ツール</th><th>デコーダー</th><th>透明度の保持</th><th>変換中のネットワークリクエスト</th></tr></thead>
          <tbody>
            <tr><td class="h">HEIC → JPG</td><td>ネイティブ（Safari）/ libheif WASM</td><td>PNG・WebP 出力時に保持</td><td>デコーダーを 1 回取得、以降はキャッシュ</td></tr>
            <tr><td class="h">WebP → PNG</td><td>すべてのブラウザに標準搭載</td><td>はい</td><td><b>まったくありません</b></td></tr>
            <tr><td class="h">AVIF → JPG</td><td>ネイティブ / libavif WASM フォールバック</td><td>PNG・WebP 出力時に保持</td><td>最新ブラウザではゼロ</td></tr>
          </tbody>
        </table>
      </div>
      <h3>変換を始める前に知っておきたいこと</h3>
      <p>形式を変換しても画質は向上せず、たいていはファイルサイズが変わります — しかも大きく変わることがあります。古い形式は単純に効率が悪いため、HEIC や AVIF を忠実に JPG 化すると通常は大きくなり、非可逆の元ファイルを PNG にすると桁違いに大きくなります。各ツールページにはその変換の実測値が記載されているので、ダウンロード前に何が得られるか分かります。また全ページに<b>元のサイズに合わせる</b>オプションがあり、元のファイルに最も近くなる設定を自動で探します。</p>`,
        },
      ],

      related: {
        h2: '変換ツールを選ぶ',
        sub: '3 つとも同じエンジンと同じプライバシーモデルを共有しています。',
        items: [
          { tt: 'HEIC → JPG', td: 'iPhone の写真を、あらゆる環境で開ける形式に。', tm: 'libheif WASM · Safari ではネイティブ' },
          { tt: 'WebP → PNG', td: '透明度を保ったままの可逆出力。', tm: 'ネイティブデコード · ネットワークリクエスト 0' },
          { tt: 'AVIF → JPG', td: '最新の画像形式を、最古の形式で開く。', tm: 'ネイティブデコード · libavif WASM フォールバック' },
        ],
      },

      footerTagline: 'LocalConvert · 常に端末内で処理します。',
      ldDesc: 'ファイルをアップロードしないブラウザベースの画像変換ツール。',
    },

    ko: {
      title: 'LocalConvert — 파일을 절대 업로드하지 않는 이미지 변환기',
      desc: '브라우저에서만 동작하는 이미지 변환 도구 모음: HEIC → JPG, WebP → PNG, AVIF → JPG. 모든 처리는 사용자 기기에서 이루어집니다. 업로드 없음, 가입 없음, 워터마크 없음.',
      ogTitle: 'LocalConvert — 파일을 절대 업로드하지 않는 이미지 변환기',
      ogDesc: 'HEIC → JPG, WebP → PNG, AVIF → JPG. 모두 브라우저에서 처리됩니다.',

      trustbar: [
        `🔒 <b>100% 브라우저에서 실행</b>`,
        `업로드 없음`,
        `가입 불필요`,
        `워터마크 없음`,
        `파일 크기 제한 없음`,
      ],

      h1Html: `파일을 <span class="accent">절대 업로드하지 않는</span> 이미지 변환기`,
      lede: `여기 있는 모든 도구는 사용자의 브라우저 탭 안에서 작업을 끝냅니다. 서버로 전송되는 것도, 남겨지는 것도 없습니다. 그리고 그 주장은 개발자 도구에서 직접 확인할 수 있습니다.`,
      badges: ['✓ 로컬 검증 완료', '일괄 변환', 'ZIP 다운로드', '무료 · 무제한'],

      cards: [
        {
          icon: 'HEIC', h3: 'HEIC → JPG',
          p: `아이폰이 만든 문제입니다. 휴대폰은 기본적으로 HEIC로 찍는데, Windows와 브라우저, 인쇄소, 각종 업로드 양식이 이를 열지 못합니다. 한 번에 JPG로 바꾸고 다음 일로 넘어가세요.`,
          go: 'HEIC → JPG 변환',
        },
        {
          icon: 'WebP', h3: 'WebP → PNG',
          p: `웹사이트가 보내주는 건 WebP, 데스크톱 프로그램이 받아주는 건 PNG입니다. 무손실로 변환하고 투명도도 그대로 유지합니다. 게다가 이 페이지는 변환 중에 네트워크 요청을 전혀 보내지 않습니다.`,
          go: 'WebP → PNG 변환',
        },
        {
          icon: 'AVIF', h3: 'AVIF → JPG',
          p: `가장 최신 형식이면서 가장 문제를 일으키기 쉬운 형식입니다. 10비트 파일을 처리하고, JPG가 투명 영역을 눌러버리기 전에 경고하며, 구형 브라우저에서는 WebAssembly 디코더로 자동 전환됩니다.`,
          go: 'AVIF → JPG 변환',
        },
      ],

      sections: [
        {
          h2: `"업로드하지 않음"이 설계의 전부인 이유`,
          html:
`      <p>이런 변환을 검색하면 같은 기능을 하는 사이트가 수십 개 나옵니다. 그중 거의 모두가 <em>파일을 서버로 업로드</em>해서 변환한 뒤 돌려줍니다. 즉 사진은 위치 정보와 얼굴, 그 안에 담긴 모든 것과 함께 한 번도 만난 적 없는 누군가의 컴퓨터에, 그 사람이 정한 기간만큼 남습니다. 대부분 아무 일도 일어나지 않습니다. 하지만 그것을 확인할 방법은 없고, 많은 사람에게는 그것만으로도 다른 도구를 찾을 이유가 됩니다.</p>
      <p>이 도구들은 반대 방향을 택합니다. 브라우저에는 이미 JPEG, PNG, WebP, AVIF 디코더가 들어 있고, libheif와 libavif의 WebAssembly 버전이 HEIC와 구형 브라우저의 빈틈을 메웁니다. 인코딩은 탭 안의 <code>&lt;canvas&gt;</code>에서 일어납니다. 그 결과 경로에 서버가 아예 없습니다. 그래서 각 페이지에는 자신이 보낸 요청 수와 전송한 데이터 총량을 세는 패널이 붙어 있습니다. 믿는 대신 직접 확인할 수 있습니다.</p>
      <div class="grid3">
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></div>
          <h4>저장할 것도, 유출될 것도 없음</h4>
          <p>업로드가 없으니 대기열도, 보관 정책도, 내 이미지를 쥐고 있는 제3자도 없습니다.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8z"/></svg></div>
          <h4>대기 없음, 제한 없음</h4>
          <p>일하는 건 사용자의 CPU입니다. 파일 크기 상한도, 시간당 허용량도, 남들 뒤에서 기다릴 일도 없습니다.</p>
        </div>
        <div class="card">
          <div class="ci"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M5 10l7-7 7 7"/></svg></div>
          <h4>조건 없는 무료</h4>
          <p>계정도, 이메일 수집도, 워터마크도, 업그레이드 재촉도 없습니다. 서버 비용이 없으니 회수할 변환 비용도 없습니다.</p>
        </div>
      </div>`,
        },
        {
          h2: `각 도구가 실제로 잘하는 것`,
          html:
`      <div class="tablewrap">
        <table class="data">
          <thead><tr><th>도구</th><th>디코더</th><th>투명도 유지</th><th>변환 중 네트워크 요청</th></tr></thead>
          <tbody>
            <tr><td class="h">HEIC → JPG</td><td>네이티브(Safari) / libheif WASM</td><td>PNG·WebP 출력 시 유지</td><td>코덱 1회 다운로드, 이후 캐시</td></tr>
            <tr><td class="h">WebP → PNG</td><td>모든 브라우저에 내장</td><td>예</td><td><b>전혀 없음</b></td></tr>
            <tr><td class="h">AVIF → JPG</td><td>네이티브 / libavif WASM 폴백</td><td>PNG·WebP 출력 시 유지</td><td>최신 브라우저에서는 0</td></tr>
          </tbody>
        </table>
      </div>
      <h3>변환하기 전에 알아둘 한 가지</h3>
      <p>형식을 바꾼다고 화질이 좋아지지는 않으며, 보통 파일 크기가 달라집니다. 때로는 아주 크게요. 구형 형식은 효율이 낮기 때문에 HEIC나 AVIF를 충실하게 JPG로 만들면 대개 더 커지고, 손실 압축 원본을 PNG로 만들면 훨씬 더 커집니다. 각 도구 페이지에는 해당 변환의 실측 수치가 적혀 있어 다운로드 전에 결과를 알 수 있고, 모든 페이지에 원본 파일에 가장 가까운 설정을 자동으로 찾아주는 <b>원본 크기에 맞추기</b> 옵션이 있습니다.</p>`,
        },
      ],

      related: {
        h2: '변환기 고르기',
        sub: '세 도구 모두 같은 엔진과 같은 개인정보 보호 모델을 씁니다.',
        items: [
          { tt: 'HEIC → JPG', td: '아이폰 사진을 어디서나 열리는 형식으로.', tm: 'libheif WASM · Safari에서는 네이티브' },
          { tt: 'WebP → PNG', td: '투명도를 유지한 무손실 출력.', tm: '네이티브 디코딩 · 네트워크 요청 0' },
          { tt: 'AVIF → JPG', td: '가장 새로운 이미지 형식을 가장 오래된 형식으로.', tm: '네이티브 디코딩 · libavif WASM 폴백' },
        ],
      },

      footerTagline: 'LocalConvert · 언제나 기기 안에서 처리합니다.',
      ldDesc: '파일을 업로드하지 않는 브라우저 기반 이미지 변환 도구.',
    },
  },
};
