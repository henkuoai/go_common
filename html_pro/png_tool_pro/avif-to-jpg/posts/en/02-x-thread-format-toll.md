# X / Twitter · thread

**Use for:** X, Threads, Bluesky, Mastodon
**Link:** `example.com/avif-to-jpg/` — last tweet only
**Angle:** "the format economics are broken in your favour — but never in the direction you want." Comes at AVIF via a pattern rather than a how-to.

---

**1/**
Every new image format saves the *website* bandwidth and costs *you* a conversion.

You're paying the toll for a decision a web developer made to cut their bill.

AVIF is the current one. Here's the arithmetic.

**2/**
AVIF is built on AV1 — the codec Netflix and YouTube stream with.

That lineage is the point: at comparable visual quality, AVIF is roughly **half the size of a JPEG**. Better than WebP's ~30% saving. It also does transparency and HDR, neither of which JPEG can do.

**3/**
So every site at scale serves it. And then you right-click → save, and get a file that:

• Photoshop won't open
• Word won't insert
• Paint can't read
• File Explorer shows as a blank tile
• every upload form rejects

Browser support landed years ago. Everything *outside* the browser didn't.

**4/**
Renaming `.avif` to `.jpg` does nothing. The container is still AV1 inside — you'll get a corrupt-image error and conclude the download was bad.

That single piece of bad advice is responsible for a lot of people thinking their files are damaged.

**5/**
Now the part that surprises everyone.

AVIF is *more* efficient than JPEG — so a faithful JPEG is **bigger**. Not slightly. Measured on a real 1600×1068 image from a 168 KB AVIF:

• JPG q95 → 443 KB (**+163%**)
• JPG q85 → 259 KB (+54%)
• JPG q75 → 191 KB (+14%)
• JPG q70 → 173 KB (**+3%**)

**6/**
Look at where the break-even sits. **Around quality 70.**

And look at what every converter defaults to: q85, labelled "visually lossless."

The industry's standard default produces a file 54% larger on the single most common task. Then users blame the tool and close the tab.

**7/**
This is a recurring pattern, and it's worth naming:

• HEIC ~50% smaller than JPEG → JPG output grows
• AVIF ~50% smaller than JPEG → JPG output grows
• WebP ~30% smaller than JPEG → PNG output grows ~8×

**Converting to an older, less efficient format always costs bytes.** That's the format doing its job.

**8/**
Two practical consequences:

**Lower your default.** Start at q70–75, not q85. Size becomes sane immediately.

**Don't use PNG unless you need alpha.** On the same image, PNG came out at 2.31 MB — +1273%. PNG is for transparency, not for format-converting.

**9/**
And check whether the converter uploads your image.

Most of the big ones do the work server-side. You can verify it yourself: DevTools → Network → clear → convert a file → see whether anything carries the image data.

Browser-side WASM decoding sends nothing. It also works offline, which is a nice way to prove it.

Free, nothing uploaded: example.com/avif-to-jpg/

---

**Posting notes**

- Tweet 1 is the thesis and it's the strongest thing in the thread. Don't bury it — a lot of people will quote-tweet that line alone, which is exactly what you want.
- Tweet 5's table is worth making as an image. The "break-even at q70" framing is the insight; the numbers are the proof.
- Tweet 7 generalises across all three formats. Consider spinning that one out as its own standalone post later — it's the kind of observation that gets repeat engagement.
