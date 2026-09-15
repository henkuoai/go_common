/* =====================================================================
   Engine UI strings, per locale.

   Flat key -> string. `{name}` slots are interpolated by tool-core.js.
   The English column is copied verbatim from the strings the engine used
   before it was localised, so the English pages are byte-for-byte the
   same behaviour they were verified with.

   Rules kept across every column:
     - Format names (HEIC, JPG, WebP, AVIF, PNG), the brand, units (KB/MB)
       and product names (DevTools, WebAssembly, EXIF) are never translated.
     - `{files}` is filled with fileOne/fileMany, which is how English gets
       its plural and the CJK columns simply repeat themselves.
   ===================================================================== */

export const UI = {
  en: {
    /* drop zone */
    dropHere: 'Drop {name} files here',
    dropHint: 'or click to browse · paste with Ctrl + V · batch supported',
    chooseFiles: 'Choose files',

    /* toolbar */
    outputQuality: 'Output quality',
    matchOriginal: 'Match original size',
    resize: 'Resize',
    resizeHint: 'Downscaling on export, originals untouched.',
    outputFormat: 'Output format',
    resizeKeep: 'Keep original size',
    resize2560: 'Max 2560 px (long edge)',
    resize2048: 'Max 2048 px (long edge)',
    resize1280: 'Max 1280 px (web / email)',
    resize800: 'Max 800 px (thumbnail)',
    presetSmaller: 'Smaller',
    presetBalanced: 'Balanced',
    presetSharper: 'Sharper',
    presetMax: 'Max',

    /* actions */
    downloadAll: '⬇ Download all',
    downloadZip: '🗜 Download as ZIP',
    addMore: '+ Add more',
    clearAll: 'Clear all',

    /* trust bar */
    trustRuns: '🔒 Runs 100% in your browser',
    trustNoUpload: 'No upload',
    trustNoSignup: 'No signup',
    trustNoWatermark: 'No watermark',
    netRequests: 'outgoing requests:',

    /* self-verification panel */
    verifyTitle: "🔎 Don't trust me — verify it yourself",
    verifyLead: 'Every request this page makes is counted, and the size of each request body is added up — including requests made inside the decoding workers. The total is the number that has to stay at zero.',
    bytesUploaded: 'bytes uploaded:',

    /* file rows */
    decoding: 'decoding…',
    optimizing: 'optimizing…',
    compare: 'Compare',
    download: 'Download',
    remove: 'Remove',
    packing: '⏳ Packing…',

    /* size banner */
    bannerSearching: '<b>Searching for the quality that matches your original sizes…</b> Each image is tested several times, so allow a few seconds per photo.',
    bannerAlpha: '<b>{n} of these {files} transparent areas.</b> {fmt} cannot store transparency, so those areas will come out solid. Pick a format that keeps it, or carry on if the background does not matter. ({orig} → {now}.)',
    bannerAlphaAuto: ' Auto-matched to your originals at an average quality of {q}%.',
    bannerMatched: '<b>Auto-matched to your originals.</b> {orig} → {now} across {files}{atQ}',
    bannerMatchedQ: ' at an average quality of {q}%.',
    bannerMatchedEnd: '.',
    bannerGrew: '<b>Output is larger than the input</b> ({orig} → {now}, +{pct}%). {why}',
    bannerSaved: '<b>Saved {pct}%.</b> {orig} → {now} across {files}.',
    keepTransparency: 'Keep transparency → {fmt}',

    /* notices */
    bannerSkipped: '<b>{files} skipped</b> — not {name}: {list}{more}.',
    bannerSkippedMore: ' and {n} more',

    /* plural helper — English inflects, CJK does not */
    fileOne: '{n} file',
    fileMany: '{n} files',

    /* compare modal */
    modalCompare: 'Compare',
    compareLeft: 'ORIGINAL (decoded)',
    statPixel: 'Pixel size',
    statOrig: 'Original file',
    statConverted: 'Converted',
    statChange: 'Change',
    statDecoder: 'Decoder',
    statDecodeTime: 'Decode time',
    lossless: 'lossless',

    /* control hints + errors */
    qualityAuto: 'AUTO',
    fitTitleOn: 'Pick the quality that lands closest to your original file size',
    fitTitleOff: 'Only available for lossy formats',
    zipFailed: 'Could not build the ZIP: ',
    encodeFailed: 'Encode failed: ',
    convertFailed: 'Encoding failed: ',
    decoderCrashed: 'Decoder crashed',

    /* network panel details */
    unmeasurable: 'unmeasurable',
    netCodecNote: '— codec library, sent 0 B',
    netSentNone: '— sent 0 B',
    netSent: '— sent {size}',
    netUnmeasurable: '— body size unmeasurable',

    /* page chrome the builder fills in (footer links) */
    allConverters: 'All converters',
    backToTop: 'Back to top',

    /* language switcher */
    langLabel: 'Language',
  },

  zh: {
    dropHere: '把 {name} 文件拖到这里',
    dropHint: '或点击浏览 · Ctrl + V 粘贴 · 支持批量',
    chooseFiles: '选择文件',

    outputQuality: '输出质量',
    matchOriginal: '匹配原始大小',
    resize: '调整尺寸',
    resizeHint: '仅在导出时缩小，原文件不受影响。',
    outputFormat: '输出格式',
    resizeKeep: '保持原始尺寸',
    resize2560: '最长边不超过 2560 px',
    resize2048: '最长边不超过 2048 px',
    resize1280: '最长边不超过 1280 px（网页 / 邮件）',
    resize800: '最长边不超过 800 px（缩略图）',
    presetSmaller: '体积优先',
    presetBalanced: '均衡',
    presetSharper: '清晰优先',
    presetMax: '最清晰',

    downloadAll: '⬇ 全部下载',
    downloadZip: '🗜 打包成 ZIP 下载',
    addMore: '+ 继续添加',
    clearAll: '全部清除',

    trustRuns: '🔒 100% 在你的浏览器里完成',
    trustNoUpload: '不上传',
    trustNoSignup: '不用注册',
    trustNoWatermark: '不加水印',
    netRequests: '外发请求：',

    verifyTitle: '🔎 不用信我 —— 自己验证',
    verifyLead: '这个页面发出的每一个请求都会被记录，每个请求正文的字节数也会累加 —— 包括解码线程内部发出的请求。这个总数必须始终保持为 0。',
    bytesUploaded: '已外发字节数：',

    decoding: '解码中…',
    optimizing: '优化中…',
    compare: '对比',
    download: '下载',
    remove: '移除',
    packing: '⏳ 正在打包…',

    bannerSearching: '<b>正在查找与原始大小匹配的质量…</b> 每张图都要反复试算，请给每张图留出几秒。',
    bannerAlpha: '<b>这批文件里有 {n} 个含透明区域。</b>{fmt} 存不下透明通道，这些区域会变成实色。换一个能保留透明的格式，或者如果背景不重要就直接继续。（{orig} → {now}。）',
    bannerAlphaAuto: ' 已自动匹配原始大小，平均质量 {q}%。',
    bannerMatched: '<b>已自动匹配到原始大小。</b>{files}：{orig} → {now}{atQ}',
    bannerMatchedQ: '，平均质量 {q}%。',
    bannerMatchedEnd: '。',
    bannerGrew: '<b>输出比输入更大</b>（{orig} → {now}，+{pct}%）。{why}',
    bannerSaved: '<b>减小了 {pct}%。</b>{files}：{orig} → {now}。',
    keepTransparency: '保留透明 → {fmt}',

    bannerSkipped: '<b>已跳过 {files}</b> —— 不是 {name}：{list}{more}。',
    bannerSkippedMore: '，以及另外 {n} 个',

    fileOne: '{n} 个文件',
    fileMany: '{n} 个文件',

    modalCompare: '对比',
    compareLeft: '原图（已解码）',
    statPixel: '像素尺寸',
    statOrig: '原始文件',
    statConverted: '转换后',
    statChange: '变化',
    statDecoder: '解码器',
    statDecodeTime: '解码耗时',
    lossless: '无损',

    qualityAuto: '自动',
    fitTitleOn: '选择最接近原始文件大小的质量',
    fitTitleOff: '仅对有损格式可用',
    zipFailed: '无法生成 ZIP：',
    encodeFailed: '编码失败：',
    convertFailed: '转换失败：',
    decoderCrashed: '解码器崩溃',

    unmeasurable: '无法测量',
    netCodecNote: '— 解码器库，外发 0 B',
    netSentNone: '— 外发 0 B',
    netSent: '— 已外发 {size}',
    netUnmeasurable: '— 请求正文大小无法测量',

    allConverters: '全部转换器',
    backToTop: '回到顶部',

    langLabel: '语言',
  },

  ja: {
    dropHere: '{name} ファイルをここにドロップ',
    dropHint: 'またはクリックして選択 · Ctrl + V で貼り付け · 複数ファイル対応',
    chooseFiles: 'ファイルを選択',

    outputQuality: '出力画質',
    matchOriginal: '元のサイズに合わせる',
    resize: 'リサイズ',
    resizeHint: '書き出し時のみ縮小します。元のファイルは変更されません。',
    outputFormat: '出力形式',
    resizeKeep: '元のサイズを維持',
    resize2560: '長辺 2560 px まで',
    resize2048: '長辺 2048 px まで',
    resize1280: '長辺 1280 px まで（Web・メール）',
    resize800: '長辺 800 px まで（サムネイル）',
    presetSmaller: '小さめ',
    presetBalanced: 'バランス',
    presetSharper: '高画質',
    presetMax: '最高',

    downloadAll: '⬇ すべてダウンロード',
    downloadZip: '🗜 ZIP でまとめてダウンロード',
    addMore: '+ 追加',
    clearAll: 'すべて削除',

    trustRuns: '🔒 100% ブラウザ内で処理',
    trustNoUpload: 'アップロードなし',
    trustNoSignup: '登録不要',
    trustNoWatermark: '透かしなし',
    netRequests: '外部リクエスト：',

    verifyTitle: '🔎 信じなくて構いません — 自分で確かめてください',
    verifyLead: 'このページが行うすべてのリクエストを記録し、各リクエスト本文のサイズも合計します（デコード用ワーカー内の通信も含みます）。この合計がゼロのままであることが証拠になります。',
    bytesUploaded: '送信されたバイト数：',

    decoding: 'デコード中…',
    optimizing: '最適化中…',
    compare: '比較',
    download: 'ダウンロード',
    remove: '削除',
    packing: '⏳ 圧縮中…',

    bannerSearching: '<b>元のファイルサイズに合う画質を検索しています…</b> 1 枚ごとに複数回試算するため、数秒かかります。',
    bannerAlpha: '<b>このうち {n} 件に透明部分があります。</b>{fmt} は透明度を保存できないため、その部分は単色で塗りつぶされます。透明度を保持できる形式に切り替えるか、背景が問題にならない場合はそのまま進めてください。（{orig} → {now}）',
    bannerAlphaAuto: ' 元のサイズに自動調整済み（平均画質 {q}%）。',
    bannerMatched: '<b>元のファイルサイズに自動調整しました。</b>{files}で {orig} → {now}{atQ}',
    bannerMatchedQ: '（平均画質 {q}%）',
    bannerMatchedEnd: '。',
    bannerGrew: '<b>出力が入力より大きくなりました</b>（{orig} → {now}、+{pct}%）。{why}',
    bannerSaved: '<b>{pct}% 削減しました。</b>{files}で {orig} → {now}。',
    keepTransparency: '透明度を保持 → {fmt}',

    bannerSkipped: '<b>{files}をスキップしました</b> — {name} ではないため：{list}{more}。',
    bannerSkippedMore: ' ほか {n} 件',

    fileOne: '{n} ファイル',
    fileMany: '{n} ファイル',

    modalCompare: '比較',
    compareLeft: '元画像（デコード後）',
    statPixel: 'ピクセルサイズ',
    statOrig: '元のファイル',
    statConverted: '変換後',
    statChange: '増減',
    statDecoder: 'デコーダー',
    statDecodeTime: 'デコード時間',
    lossless: '可逆圧縮',

    qualityAuto: '自動',
    fitTitleOn: '元のファイルサイズに最も近くなる画質を選びます',
    fitTitleOff: '非可逆形式でのみ利用できます',
    zipFailed: 'ZIP を作成できませんでした：',
    encodeFailed: 'エンコードに失敗：',
    convertFailed: '変換に失敗：',
    decoderCrashed: 'デコーダーがクラッシュしました',

    unmeasurable: '測定不能',
    netCodecNote: '— デコーダーライブラリ、送信 0 B',
    netSentNone: '— 送信 0 B',
    netSent: '— {size} を送信',
    netUnmeasurable: '— 本文サイズが測定不能',

    allConverters: 'すべての変換ツール',
    backToTop: 'トップへ戻る',

    langLabel: '言語',
  },

  ko: {
    dropHere: '{name} 파일을 여기에 놓으세요',
    dropHint: '또는 클릭해서 선택 · Ctrl + V로 붙여넣기 · 여러 파일 동시 지원',
    chooseFiles: '파일 선택',

    outputQuality: '출력 품질',
    matchOriginal: '원본 크기에 맞추기',
    resize: '크기 조정',
    resizeHint: '내보낼 때만 축소하며 원본 파일은 그대로 유지됩니다.',
    outputFormat: '출력 형식',
    resizeKeep: '원본 크기 유지',
    resize2560: '긴 변 2560 px 이하',
    resize2048: '긴 변 2048 px 이하',
    resize1280: '긴 변 1280 px 이하 (웹·이메일)',
    resize800: '긴 변 800 px 이하 (썸네일)',
    presetSmaller: '용량 우선',
    presetBalanced: '균형',
    presetSharper: '화질 우선',
    presetMax: '최고',

    downloadAll: '⬇ 모두 다운로드',
    downloadZip: '🗜 ZIP으로 한 번에 받기',
    addMore: '+ 더 추가',
    clearAll: '전체 삭제',

    trustRuns: '🔒 100% 브라우저에서 실행',
    trustNoUpload: '업로드 없음',
    trustNoSignup: '가입 불필요',
    trustNoWatermark: '워터마크 없음',
    netRequests: '외부 요청:',

    verifyTitle: '🔎 저를 믿지 마세요 — 직접 확인하세요',
    verifyLead: '이 페이지가 보내는 모든 요청을 세고, 각 요청 본문의 바이트 크기까지 합산합니다. 디코딩 워커 내부에서 발생한 요청도 포함됩니다. 이 합계가 계속 0이어야 합니다.',
    bytesUploaded: '전송된 바이트:',

    decoding: '디코딩 중…',
    optimizing: '최적화 중…',
    compare: '비교',
    download: '다운로드',
    remove: '제거',
    packing: '⏳ 압축 중…',

    bannerSearching: '<b>원본 크기에 맞는 품질을 찾는 중…</b> 이미지마다 여러 번 시험하므로 한 장에 몇 초씩 걸립니다.',
    bannerAlpha: '<b>이 중 {n}개 파일에 투명 영역이 있습니다.</b> {fmt}은(는) 투명도를 저장할 수 없어 해당 부분이 단색으로 나옵니다. 투명도를 유지하는 형식으로 바꾸거나, 배경이 중요하지 않다면 그대로 진행하세요. ({orig} → {now})',
    bannerAlphaAuto: ' 평균 품질 {q}%로 원본 크기에 자동 맞췄습니다.',
    bannerMatched: '<b>원본 크기에 자동으로 맞췄습니다.</b> {files} 기준 {orig} → {now}{atQ}',
    bannerMatchedQ: ' (평균 품질 {q}%)',
    bannerMatchedEnd: '.',
    bannerGrew: '<b>출력이 입력보다 큽니다</b> ({orig} → {now}, +{pct}%). {why}',
    bannerSaved: '<b>{pct}% 줄였습니다.</b> {files} 기준 {orig} → {now}.',
    keepTransparency: '투명도 유지 → {fmt}',

    bannerSkipped: '<b>{files}을 건너뛰었습니다</b> — {name} 형식이 아님: {list}{more}.',
    bannerSkippedMore: ' 외 {n}개',

    fileOne: '{n}개 파일',
    fileMany: '{n}개 파일',

    modalCompare: '비교',
    compareLeft: '원본 (디코딩됨)',
    statPixel: '픽셀 크기',
    statOrig: '원본 파일',
    statConverted: '변환 결과',
    statChange: '변화',
    statDecoder: '디코더',
    statDecodeTime: '디코딩 시간',
    lossless: '무손실',

    qualityAuto: '자동',
    fitTitleOn: '원본 파일 크기에 가장 가까운 품질을 선택합니다',
    fitTitleOff: '손실 형식에서만 사용할 수 있습니다',
    zipFailed: 'ZIP을 만들 수 없습니다: ',
    encodeFailed: '인코딩 실패: ',
    convertFailed: '변환 실패: ',
    decoderCrashed: '디코더가 중단되었습니다',

    unmeasurable: '측정 불가',
    netCodecNote: '— 코덱 라이브러리, 전송 0 B',
    netSentNone: '— 전송 0 B',
    netSent: '— {size} 전송됨',
    netUnmeasurable: '— 본문 크기 측정 불가',

    allConverters: '모든 변환기',
    backToTop: '맨 위로',

    langLabel: '언어',
  },
};

/* Locale metadata: what goes into <html lang>, hreflang and the switcher. */
export const LOCALES = [
  { code: 'en', htmlLang: 'en', hreflang: 'en', label: 'English', short: 'EN' },
  { code: 'zh', htmlLang: 'zh-Hans', hreflang: 'zh-Hans', label: '简体中文', short: '中文' },
  { code: 'ja', htmlLang: 'ja', hreflang: 'ja', label: '日本語', short: '日本語' },
  { code: 'ko', htmlLang: 'ko', hreflang: 'ko', label: '한국어', short: '한국어' },
];

/* English lives at the site root; the others get a /{code}/ prefix. */
export const localePrefix = (code) => (code === 'en' ? '' : `/${code}`);

export default UI;
