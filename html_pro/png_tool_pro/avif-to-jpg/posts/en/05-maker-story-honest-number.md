# Launch / maker story · Indie Hackers · Product Hunt · Hacker News (Show HN)

**Use for:** Indie Hackers, Product Hunt, Hacker News (Show HN), Lobsters, dev.to
**Link:** `example.com/avif-to-jpg/`
**Angle:** the native-decode-plus-WASM-fallback decision, and one honest disclosure that costs you nothing and buys credibility.

---

**Title (Show HN):** Show HN: AVIF→JPG converter — native decode first, WASM only when needed

**Title (Indie Hackers):** I built three file converters and shipped an honest number instead of a good one

**Body:**

AVIF is the awkward format to build for, because support is split in a way that punishes naive implementations.

Chrome has decoded it since v85, Firefox since 93, Safari since 16.4. So on a modern browser you can just call `createImageBitmap` on the file and it works, natively, fast, no dependency. That path is what you want to be on.

The problem is what happens when it fails. `createImageBitmap` throws for reasons it doesn't explain — an older browser, an unusual AVIF profile, a corrupt header — and the user is simply stuck with an unhandled rejection and no idea why.

**Native first, WASM as a real fallback**

So the pipeline is: try native decode. If it throws, drop into `@jsquash/avif` — `libavif` compiled to WebAssembly — which decodes to raw RGBA pixels directly. That gives me an `ImageData` I can hand straight to `createImageBitmap` and then encode.

Three things I had to verify rather than assume:

1. **Does the WASM binary actually resolve from a CDN?** `@jsquash/avif` uses Emscripten's default `locateFile`, which resolves relative to `import.meta.url`. That *should* mean the `.wasm` file sits next to the `.js` on the CDN and loads without any configuration. It does — but I only knew that after running it in a real browser and probing the decoded pixels for non-zero values, because "the promise resolved" and "the image decoded correctly" are very different assertions.
2. **Is the fallback actually reachable?** A fallback path that never executes in testing is a fallback path that doesn't work. I added a `?decode=` query override so the verification harness can force the WASM route on a browser that would otherwise take the native one. That's not a test hook for its own sake — it's the only way the path ever gets exercised.
3. **Are the decoded pixels real?** The harness samples the returned `ImageData` and asserts a non-trivial grayscale range. A decoder that returns a correctly-sized buffer full of zeros would pass every structural check and be completely useless.

**Honest disclosure instead of a clean number**

Every page in this project carries a network counter that patches `fetch`, `XHR.open` and `sendBeacon`, accumulates the actual bytes in outbound request bodies, and lists every request it made. The point is that "we don't upload your files" should be checkable, not asserted.

Here's where the honesty costs me. On the **WebP** converter, decoding is native everywhere, so there's no library to fetch and the counter reads **zero requests, zero bytes** — a genuinely perfect claim.

On the **AVIF** page, the WASM fallback is a ~1–2 MB module. So the counter shows a request. It's code, not user data, and the page labels it as such in the list rather than hiding it.

I could have made the number look better. Instead the page lists the request and explains what it is. Two reasons: users who open DevTools and find a discrepancy between the claim and reality never come back, and the disclosure itself demonstrates that the counter is real rather than decorative.

**Publishing the uncomfortable measurement**

The other thing I chose to put on the page rather than bury: **converting AVIF to JPG makes the file bigger.** Measured from a 168.3 KB source, q95 produces 443 KB (+163%) and q85 produces 259 KB (+54%). Break-even is around q70.

The reason is structural — AVIF is roughly twice as efficient as JPEG, so a faithful JPEG must spend more bytes. Every converter has this property and most don't mention it. But a user seeing "+163%" with no explanation concludes the tool is broken, and they're not wrong to.

So the page defaults to q70 rather than the conventional q85, offers a "match original size" search that binary-searches quality until the output lands near the input's byte count, and when output does grow, says why in plain words and offers two fixes. Explaining the disappointing number turned out to be more valuable than the conversion itself.

**Stack:** no framework, no build step. Static files, one shared engine module across three pages. Deploy is a copy.

Tool: example.com/avif-to-jpg/

---

**HN posting notes**

- The "I shipped the honest number instead of the good one" framing is the story. Lead with it if you can find a way to make it the title without sounding self-congratulatory.
- Someone will ask why you don't just use a server-side `libavif` binary, which is faster and handles edge cases better. The honest answer is the privacy claim is the product — don't get defensive, say it plainly.
- 10-bit and HDR AVIF files are a real weak spot. If someone raises it, confirm it rather than deflecting; the thread will reward that.
