# Reddit post · "what is this .avif file"

**Target subs:** r/webdev · r/techsupport · r/linuxquestions · r/web_design · r/photography
**Link:** `example.com/avif-to-jpg/`
**Rules to respect:** link in your own comment, not the post. Disclose you built it.

---

**Title:** Downloaded an image and the file type says AVIF? Here's what it is and why nothing opens it

**Body:**

You saved an image, the extension says `.avif`, Windows Photos won't touch it, Photoshop says unsupported, and the upload form on whatever site you're using rejects it. Nothing is broken — you've just run into the newest image format a few years before your software caught up.

**What AVIF actually is**

It's built on AV1, the same video codec that YouTube and Netflix use for streaming. That lineage is the whole point: AV1 is very good at compressing, so AVIF gets you roughly **half the file size of a JPEG at comparable visual quality** — better than WebP's ~30% saving. It also supports transparency and HDR, which JPEG does not.

Which is exactly why sites are adopting it. Every site at scale is paying for bandwidth, and halving image weight is a large bill going away.

**Why it breaks things**

Browser support arrived quickly — Chrome 85 (2020), Firefox 93 (2021), Safari 16.4 (2023). So it renders fine in your browser. That's the trap: **the browser is the one place it works.**

Outside the browser:

- Photoshop — no AVIF support until very recently, so anyone on CS6/2019/2021 is out of luck
- MS Paint, most built-in viewers
- Word / PowerPoint insertion
- Affinity Photo older versions, GIMP without a plugin
- Most CMS upload fields, print shops, and basically every internal enterprise system
- Windows File Explorer thumbnails

You can rename it to `.jpg` and nothing changes — the container is still AV1 inside. That "fix" is the source of a lot of people concluding their download was corrupt.

**The size thing nobody warns you about**

Same physics as HEIC, and it catches people out every time. AVIF is *more* efficient than JPEG, so a faithful JPEG has to be *larger*. Measured on a real 1600×1068 image starting from a 168.3 KB AVIF:

| Setting | Output | vs input |
|---|---|---|
| JPG q95 | 443 KB | +163% |
| JPG q85 | 259 KB | +54% |
| JPG q80 | 220 KB | +31% |
| JPG q75 | 191 KB | +14% |
| JPG q70 | 173 KB | **+3%** |
| JPG q65 | 158 KB | −6% |
| PNG | 2.31 MB | +1273% |

Notice where the line falls. Quality 70 is roughly the break-even point where output size matches input size. Anything the "visually lossless, recommended" defaults ship — q85 and above — makes the file substantially bigger.

That's worth knowing before you conclude a converter is bad. Every AVIF/JPG converter on earth behaves this way; the format difference is structural, not a bug.

**What to actually do**

- If it's one file and you just want to *look* at it: any current browser will open it. Drag it into a tab.
- If you need it as a JPEG: convert it, and start around quality 70–75 rather than the usual 85.
- If you need the transparency preserved: go to PNG, not JPEG. JPEG has no alpha channel and will silently fill transparent areas with solid colour.
- If it's batched work: check whether the converter uploads your files. Most do. You can verify — DevTools → Network → clear → convert → watch whether a request carries the image. Browser-side WASM decoders don't transmit anything.

Disclosure: I built the one I use, at `example.com/avif-to-jpg/`. Pure browser-side, batch support, and it has a "match original size" search that hunts for the quality setting which lands the output near your input's byte count. On my test image that settled around q68.

**The bigger pattern worth taking away**

JPEG → WebP → AVIF. Each generation saves real bandwidth and each takes years for the software ecosystem to absorb. Per the 2024 Web Almanac analysis of 10M+ pages, AVIF's presence was roughly 4× what it was two years earlier — still a small share, but growing fast.

So this isn't going away. **Every time a new format wins on the server side, everyone downstream has to convert.** You're paying the toll for a decision a web developer made to save money, and no amount of waiting fixes it.
