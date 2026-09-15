# Launch / maker story · Indie Hackers · Product Hunt · Hacker News (Show HN)

**Use for:** Indie Hackers, Product Hunt, Hacker News (Show HN), Lobsters, dev.to
**Link:** `example.com/webp-to-png/`
**Angle:** the engineering problem worth writing about is *warning someone about data loss they can't see*. Lead with that, not with the tool.

---

**Title (Show HN):** Show HN: WebP→PNG converter that warns you before it destroys your transparency

**Title (Indie Hackers):** The hardest part of a file converter isn't the conversion

**Body:**

The conversion is the easy half. `createImageBitmap` in, `OffscreenCanvas.convertToBlob` out, maybe a worker pool if you care about the main thread. I had a working converter in an afternoon.

The hard part is that **PNG and JPEG failures look completely different**, and only one of them is visible.

**JPEG fails loudly, PNG fails silently**

If you write a JPEG, the file gets bigger. The user sees a number go up and either accepts it or changes a setting. Noisy, self-correcting, fine.

If you write a JPEG from a source that *had transparency*, the alpha channel is simply discarded. Every transparent pixel is filled with something — usually white, sometimes black, depends on the decoder. There's no error. There's no warning from any API. The user downloads a file, and the only signal that anything went wrong is that the background is a different colour than it was.

In my testing nobody notices until they place that image on a coloured surface, or send it to a printer. By then the original context is long gone.

**So the converter has to check for it**

The pipeline now does this: after decoding, before encoding, downsample the bitmap to a small canvas (200px wide is plenty) and read the alpha byte of every pixel. If anything below full opacity shows up, the file is flagged as having transparency.

Then, at render time, if the selected output format can't store alpha and the batch contains at least one flagged file, a warning appears with a one-click switch to a format that can.

Two details that took longer than the feature itself:

**1. The warning has to outrank the size message.** My first version showed "your files grew 746%" and "3 of these have transparency" in the same banner slot, and the size message won because it rendered first. That's backwards — a bigger file is an inconvenience, silently losing an alpha channel is data loss. The transparency check now returns early and suppresses everything else.

**2. "Has alpha" and "has *visible* alpha" aren't the same thing.** Plenty of PNGs carry an alpha channel where every pixel is fully opaque — technically present, visually irrelevant. Warning on those would be noise, and noise trains people to ignore warnings. Hence the threshold at 250 rather than 255, and the sampling rather than a full-resolution scan. It's a heuristic, and it's the right kind of heuristic: cheap, and wrong only in the direction of staying quiet.

**Making privacy checkable instead of claimed**

Most converters upload your file. Most of them also say "your files are safe with us." Those two things are hard to reconcile.

I'd rather make it verifiable. The page patches `fetch`, `XMLHttpRequest.open` and `sendBeacon` and accumulates the actual bytes in outbound request bodies, not just a request count — a count proves you made a request, byte totals prove you didn't send anything.

This page is the strongest case of the three I built: **WebP decoding is native in every browser that matters**, so there's no WASM module to fetch at all. Converting adds zero requests *and* zero bytes. It works with the network disconnected, which is a nice thing to be able to demonstrate live.

The loader page for my HEIC converter pulls a ~2 MB WASM module on first use. That one honest disclosure is worth more than the marketing claim, and it's why the counter lists requests individually instead of showing a single number.

**Stack:** no framework, no build step. One HTML file, a shared engine module, one stylesheet. Static hosting.

**Takeaway for anyone converting files:** the interesting engineering isn't the format conversion, it's deciding what to do when the operation *succeeds* but the result is worse than what the user had. Once you notice that pattern you'll see it everywhere.

Tool: example.com/webp-to-png/

---

**HN posting notes**

- HN will engage with the "noisy failure vs silent failure" framing. That's the hook — the tool is just the evidence.
- Someone will correctly point out that `getImageData` on a downsampled canvas can miss isolated transparent pixels. Agree with them. That's a real limitation and conceding it early keeps the thread civil.
- Do not post the same day as the HEIC launch. Space them out; identical framing twice reads as a content farm.
