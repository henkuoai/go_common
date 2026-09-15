# png_tool_pro

浏览器本地处理的图片格式转换工具簇 —— 纯静态，无后端，无上传。**四种语言。**

站点部署时，**本目录就是站点根目录**。

---

## 三个工具 × 四种语言 = 16 个页面

| 页面 | 英文（站点根） | 中文 | 日本語 | 한국어 |
|---|---|---|---|---|
| 簇入口 | `/` | `/zh/` | `/ja/` | `/ko/` |
| HEIC → JPG | `/heic-to-jpg/` | `/zh/heic-to-jpg/` | `/ja/heic-to-jpg/` | `/ko/heic-to-jpg/` |
| WebP → PNG | `/webp-to-png/` | `/zh/webp-to-png/` | `/ja/webp-to-png/` | `/ko/webp-to-png/` |
| AVIF → JPG | `/avif-to-jpg/` | `/zh/avif-to-jpg/` | `/ja/avif-to-jpg/` | `/ko/avif-to-jpg/` |

**英文留在站点根目录**，其余语言走 `/{code}/` 前缀。这样已验证过的英文 URL 一个都不动，同时 16 个页面各自携带完整的 hreflang 互链（含 `x-default`），导航栏右上角有语言切换器。

每个语言内部的导航、簇内互链、页脚链接**都停留在该语言里** —— 中文访客点「WebP → PNG」落到的是 `/zh/webp-to-png/`，不是英文页。这条由验证器强制检查。

### 16 个页面都是生成的，不要手改

```bash
node _dev/build-pages.mjs
```

内容源是词典：

```
_dev/i18n/hub.mjs     簇入口
_dev/i18n/heic.mjs    HEIC → JPG
_dev/i18n/webp.mjs    WebP → PNG
_dev/i18n/avif.mjs    AVIF → JPG
 assets/i18n.js       引擎 UI 文案（按钮/状态/横幅），四语言
```

每个词典里 `locales.{en,zh,ja,ko}` 是四个语言列，`code` 是与语言无关的解码器代码。**改文案改词典，然后重跑构建。** 手改 `index.html` 会在下一次构建时被覆盖。

构建同时生成 `sitemap.xml`（16 条 URL，每条带 hreflang 簇），所以它不会和页面脱节。

---

## 为什么不上传

所有转换在你的浏览器里完成：解码用 WebAssembly，编码用 Canvas。文件从不发送到任何服务器。

**这件事是可验证的，不是宣称。** 每个页面都统计并列出自己发出的网络请求与**外发字节数**（1 个请求 = 程序库本身；WebP 页为 0）。打开 F12 → Network 自己核对即可。

这是与 iLoveIMG / CloudConvert / Convertio / Zamzar 那批服务器端工具的核心差异——它们都要先把你的照片传上去。

---

## 目录结构

```
index.html              簇入口（en）
zh/ ja/ ko/             各语言的完整站点（簇入口 + 三个工具页）
assets/tool-core.js     共用引擎：布局/批量/编码/体积核算/对比面板/ZIP/网络自证
assets/i18n.js          引擎 UI 文案，四语言
assets/tool.css
heic-to-jpg/            工具页 + posts/{en,zh}/ 社媒文案
webp-to-png/
avif-to-jpg/
_dev/i18n/              页面内容词典（真实内容源）
_dev/build-pages.mjs    生成 16 个页面 + sitemap.xml
_dev/site.mjs           域名与工具清单（改域名只改这里）
_dev/verify-cluster.mjs 英文端到端回归（124 项断言）
_dev/verify-i18n.mjs    四语言端到端校验（291 项断言）
sitemap.xml  robots.txt
POSTING-PLAN.md         30 篇社媒文案的索引与发布策略
```

**页面只贡献解码器。** 布局、批量、质量处理、体积核算、对比面板、ZIP 打包、网络自证全在共用引擎里 —— 改一处，所有页面同时生效。SEO 内容（标题、数据表、FAQ、结构化数据）保持静态 HTML，只用 JS 渲染交互层。

---

## 部署

```bash
node _dev/build-pages.mjs     # 生成 16 页 + sitemap
```

然后把目录扔进 Vercel / Cloudflare Pages / 任意静态托管。

**部署前必做一件事：** 把 `_dev/site.mjs` 里的 `SITE = 'https://example.com'` 换成真实域名，重跑一次构建。域名会写进 16 个页面的 canonical / hreflang / og:url / JSON-LD 和 sitemap.xml。

> ⚠️ 若要走小红书（国内流量），注意 `*.vercel.app` / `*.pages.dev` 在中国大陆访问通常不稳定。长期方案是海外流量与国内流量分开承载 —— 见 `POSTING-PLAN.md` 第三节问题 2。

---

## 页面上的每个数字都是实测的

文案里的体积数据来自真机跑出来的结果，不是估算：

- HEIC → JPG：q85 大 **68%**，q70 大 **16%**，"匹配原大小" 自动落到 q61 → 大 **−1%**
- WebP → PNG：大 **+134% ~ +1121%**（源文件越小、膨胀越夸张）；同一张图转 JPG q70 反而小 **39%**
- AVIF → JPG：q95 大 **163%**，q70 大 **3%**

根因一致：**新格式就是靠省空间赢的**，转回老格式等于把省下的还回去。所有转换器都如此，只是大部分不公布。四个语言的所有页面共用这同一组实测数字。

重新测量：

```bash
cd _dev && node probe-sizes.mjs
```

---

## 加新工具页

1. 跑 `_dev/probe-sizes.mjs` 量出真实输出体积
2. 在 `_dev/i18n/` 新建词典（照抄现有页的结构），四语言各写一列
3. 在 `_dev/site.mjs` 的 `TOOLS` 里加一行（导航、簇内互链、sitemap 都读它）
4. 在 `_dev/build-pages.mjs` 的 `STRUCT` 里声明该页的输出格式与解码标识符
5. 跑 `node _dev/build-pages.mjs`
6. 跑 `_dev/verify-cluster.mjs` 与 `_dev/verify-i18n.mjs` 做端到端校验

## 加新语言

1. 在 `assets/i18n.js` 的 `LOCALES` 加一项，并给 `UI` 补一整列
2. 给 `_dev/i18n/*.mjs` 四个词典各补一个语言列
3. 跑 `node _dev/build-pages.mjs`（输出路径、hreflang、sitemap 自动跟上）
4. 跑 `_dev/verify-i18n.mjs`

验证器会检查新列的每个 key 都在、并且**不是照抄英文**，所以漏翻会直接失败而不是静默回退英文。

详细契约见 `_dev/README.md`。
