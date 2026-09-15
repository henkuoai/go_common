# Quora · answer

**Questions to target:**
- "How do I open an AVIF file?"
- "Why can't Photoshop open my AVIF file?"
- "What is an AVIF file and why does my computer not recognize it?"
- "How do I convert AVIF to JPEG without losing quality?"
**Link:** `example.com/avif-to-jpg/`
**Quora rules:** complete the answer without the link; mention the tool once, late, disclosed.

---

AVIF is the newest mainstream image format, and the short version is: **it's excellent, and that's precisely why your software can't open it.**

**Where it came from**

AVIF is built on AV1, the video codec Netflix and YouTube stream with. Applying a video codec to still images is the whole idea — at comparable visual quality, AVIF produces files roughly **half the size of a JPEG**. For comparison, WebP manages about a 30% saving. AVIF also supports transparency and HDR, neither of which JPEG is capable of.

Per the 2024 Web Almanac analysis of over 10 million web pages, AVIF's presence was roughly **4× what it was two years earlier**. It's still a modest share of the web, but the direction is unambiguous.

**Why it breaks things**

Browser support arrived quickly — Chrome 85 (August 2020), Firefox 93 (2021), Safari 16.4 (2023). So AVIF *renders* fine in your browser.

And that's the trap. **The browser is the one place it works.**

Outside of it:

- **Photoshop** — AVIF support only arrived very recently. Everyone on CS6, CC 2019 or 2021 is out of luck.
- **MS Paint** and most built-in OS viewers
- **Word / PowerPoint** — insertion fails
- **Affinity Photo** (older versions), GIMP without a plugin
- Most **CMS upload fields**, print shop software, and nearly every corporate internal system
- **File Explorer** — no thumbnails, blank tiles

**The fix that doesn't work**

Renaming `.avif` to `.jpg`. This comes up constantly and it never helps: the container is still AV1 inside. Applications that trust the extension will report a corrupt image, which is why a lot of people conclude their download was damaged. It wasn't.

**What to do instead**

**If you just want to look at it:** drag the file into any current browser window. That's genuinely the fastest route and requires nothing.

**If you need a JPEG:** convert it — and pay attention to the quality setting, because this is where everyone gets confused.

AVIF is *more* efficient than JPEG, so a faithful JPEG must be **larger**. Measured on a genuine 1600×1068 image starting from a 168.3 KB AVIF:

| Setting | Output | vs input |
|---|---|---|
| JPG q95 | 443 KB | +163% |
| JPG q85 | 259 KB | +54% |
| JPG q80 | 220 KB | +31% |
| JPG q75 | 191 KB | +14% |
| JPG q70 | 173 KB | **+3%** |
| JPG q65 | 158 KB | −6% |
| PNG | 2.31 MB | +1273% |

Note the break-even: **around quality 70**. Anything at or above q85 — which is what nearly every converter ships as its "visually lossless" default — makes your file substantially bigger. Users routinely see this, assume the converter is broken, and give up. It isn't broken; that's the format.

**If you need transparency preserved:** convert to **PNG**, not JPEG. JPEG has no alpha channel at all, so transparent regions get filled with a solid colour — usually white — with no warning whatsoever. You'll typically only notice when you place the image on a coloured background.

**Choosing a converter**

Two things worth checking before you use one:

1. **Does it upload your files?** Most popular online converters — iLoveIMG, CloudConvert, Convertio, Zamzar — process on their own servers. For personal photos or client work under NDA that's a meaningful trade. You can verify it rather than trust it: open DevTools (F12) → Network tab → clear → run a conversion → look for any request carrying your image data. Browser-side converters using WebAssembly transmit nothing, and they work with your network disconnected — a quick way to confirm it.
2. **Does it warn about transparency?** A tool that cheerfully converts a transparent source to JPEG without a word is telling you something about its priorities.

Disclosure: I built a browser-side AVIF converter at `example.com/avif-to-jpg/` — batch support, a quality slider, an alpha-channel warning, and a "match original size" option that binary-searches the quality setting to land the output near your input's byte count (it settled around q68 on my test image). But any tool that gets the quality setting right will serve you fine.
