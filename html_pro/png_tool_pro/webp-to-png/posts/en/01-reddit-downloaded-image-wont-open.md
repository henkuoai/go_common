# Reddit post · "why won't Photoshop open this image I downloaded"

**Target subs:** r/webdev · r/photoshop · r/graphic_design · r/techsupport · r/web_design
**Link:** `example.com/webp-to-png/`
**Rules to respect:** no link in the post body on most of these. Disclose you built it in your first comment.

---

**Title:** If you've ever downloaded an image off a website and then couldn't open it — this is why

**Body:**

Small thing that costs people a lot of time.

You right-click an image on a website, save it, try to open it, and get nothing. Windows Photos opens it fine but Photoshop 2019 doesn't, Paint doesn't, Word won't insert it, and the "file type" column just says WEBP.

That's not a broken download. The site is serving you **WebP**, and a lot of the software people actually work in still doesn't read it.

**Why sites do this to you**

WebP gets the same visual result as a JPEG at roughly 30% fewer bytes, and unlike JPEG it supports transparency. For anyone paying for bandwidth — which is every site at scale — switching to WebP is free money. As of the 2024 Web Almanac analysis of 10M+ pages, WebP had climbed to about 12% of all images on the web, and JPEG had fallen from 40% to roughly 32%.

The format is moving forward. The software on your desk isn't.

**What actually breaks**

- Photoshop before 2022: no WebP support at all. This is the big one — a huge number of people are on CS6 or 2019.
- MS Paint: no.
- Word / PowerPoint (many versions): won't insert it.
- Older InDesign, Illustrator, most print-shop RIPs.
- A surprising number of CMS upload fields.

If you're on a modern stack — Figma, Affinity, current Chrome, GIMP — it works fine and you've probably never hit this.

**The fix and the trap**

You convert it to PNG. That's the right call if you need **transparency**, because PNG preserves the alpha channel and JPEG doesn't.

The trap is the file size. PNG is *lossless*, so it can't take the shortcuts WebP took. Measured on a real 1600×1068 photo:

| Input (WebP) | Output | Change |
|---|---|---|
| 294.6 KB | PNG | **2.43 MB (+746%)** |
| 29.6 KB | PNG | 361.6 KB (+1121%) |
| 27.0 KB | PNG | 63.1 KB (+134%) |

Roughly 8× the size, and it gets *worse* the smaller your source is — which is counterintuitive until you realise the source was highly compressed and PNG refuses to compress at all.

Two things worth knowing:

1. **The quality slider does nothing on PNG.** PNG is lossless; there's no quality to trade. The only lever that reduces size is **reducing pixel dimensions.** A 1600px-wide image dropped to 1280px was about 4× smaller in my testing.
2. **If you don't need transparency, don't use PNG.** That same 294.6 KB WebP converted to JPEG at q70 came out at **178.5 KB — 39% smaller than the original.** WebP → JPEG often shrinks; WebP → PNG basically never does.

**If you're doing this a lot:** the tool I use handles batches and highlights when a source file has transparent pixels and you're about to flatten it. Full disclosure that I built it — `example.com/webp-to-png/`. It runs in the browser so nothing gets uploaded, which matters if you're working with client assets under NDA.

But the underlying advice stands regardless of what you use: **PNG for transparency, JPEG for size, and expect PNG to be big.**

---

**First comment to post yourself:**

> Made the tool, so take the recommendation with salt. The reason I bothered: existing ones upload your files and free tiers cap you at ~15 images. Worth knowing that converting to PNG and losing a client's transparency is a silent failure — nothing warns you, the image just comes out with a white background.
