# Launch / maker story · Indie Hackers · Product Hunt · Hacker News (Show HN)

**Use for:** Indie Hackers, Product Hunt, Hacker News (Show HN), Lobsters, dev.to
**Link:** `example.com/heic-to-jpg/`
**Angle:** the interesting thing here isn't the tool, it's a counterintuitive measurement that fell out of building it. Lead with that.

---

**Title (Show HN):** Show HN: HEIC→JPG converter that runs entirely in the browser

**Title (Indie Hackers):** I built a converter and discovered the metric everyone optimises for is wrong

**Body:**

I set out to build the boring version of a file converter: no upload, no account, no watermark. A static page, WASM decoding in a worker pool, done in a weekend.

Then I measured the output and found the actual problem.

**The measurement**

I converted one 1440×960 iPhone photo (286.7 KB HEIC) across the whole quality range:

| Setting | Output | vs input |
|---|---|---|
| JPG q95 | 771 KB | +169% |
| JPG q85 | 482 KB | **+68%** |
| JPG q75 | 366 KB | +28% |
| JPG q65 | 302 KB | +5% |
| JPG q55 | 260 KB | −9% |
| WebP q85 | 445 KB | +55% |
| PNG | 3.32 MB | +1086% |

q85 is what basically every converter ships as its default, labelled "visually lossless." On the most common use case in the world — an iPhone photo you want to send to a Windows user — it makes the file **68% bigger**.

And the cause isn't a compressor setting. HEVC needs roughly half the bytes of JPEG for comparable visual quality. That efficiency is the whole reason Apple adopted HEIC. So "convert to JPG and shrink it" is a request the formats can't satisfy. Every tool on the market has this property. Most just don't mention it, so users conclude the tool is broken.

**Three changes that fell out of it**

1. **Default quality 85 → 70.** First-run experience went from +68% to +16%. This is not a tuning detail; it's the difference between a user staying and a user closing the tab.
2. **A "match original size" button.** Binary-search the quality until the output lands near the input's byte count. It converges in about five encode passes and settled at q61 → 283.2 KB (−1%). Progress feedback mattered here — the search takes 3–5 seconds and an unresponsive UI reads as a crash.
3. **Explain the growth, don't hide it.** When the output is larger, say why in plain language and offer two fixes. An unexplained bigger number is a trust failure. An explained one is a trust signal.

**The decoding choice**

The obvious library is `heic2any`. I skipped it: it's a three-year-old asm.js build whose pipeline is decode → re-encode to JPEG → decode again. Lossy before you even pick a quality, and 2–3× slower.

Instead: try `createImageBitmap(file)` first — Safari decodes HEIC natively and it's reported 17–39× faster than any JS path — and fall back to `libheif` compiled to WASM, which hands back RGBA pixels so there's no intermediate JPEG re-encode. Decode in a worker pool, transfer the `ImageBitmap` back to the main thread, then encode there. That split is what makes the quality slider feel instant: dragging it only re-encodes, it never re-decodes.

**Making "we don't upload your files" checkable**

Every converter says this. Most of the big ones are lying by omission — they do the conversion server-side.

I wanted it verifiable rather than asserted, so the page patches `fetch`, `XMLHttpRequest.open` and `sendBeacon` and renders a live count plus the full list of outbound requests. Workers have their own scope so the main-thread patch can't see inside them; I inject a small shim via `importScripts` so worker-initiated fetches report back too.

The honest result on this page: converting files adds **zero** outbound requests. The one request on the list is the WASM decoder itself, which is code and carries no image data — we label it as such rather than dropping it from the list to make the number look better.

**Stack:** no framework, no build step. One HTML file plus a shared engine module and a stylesheet. Deploys as static files.

**What I'd tell anyone building in this space:** measure your output before you write your marketing copy. The number I would have shipped as a headline feature was the number that made users leave, and I only found it because I checked the byte count instead of trusting that the conversion succeeded.

Tool: example.com/heic-to-jpg/ — feedback welcome, especially on the WASM fallback path.

---

**HN posting notes**

- HN rewards "I measured something surprising" and punishes "I made a thing, please clap." Keep the framing on the measurement; the tool is the artefact, not the story.
- Do not ask for upvotes anywhere, ever. It is detected and it kills the post.
- Stay in the thread for the first 3 hours. The top comment will be someone disputing the format claim — that exchange is the marketing.
- Be genuinely open about what's weak: EXIF (including GPS) is dropped, Safari takes a different code path than Chrome, first load pulls a ~2 MB WASM module.
