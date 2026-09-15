# X / Twitter · thread

**Use for:** X, Threads, Bluesky, Mastodon
**Link:** `example.com/webp-to-png/` — last tweet only
**Angle:** two counterintuitive facts in one thread: PNG is huge *because* the source was small, and JPEG shrinks it while PNG doesn't.

---

**1/**
You convert a WebP to PNG and the file goes from 295 KB to 2.4 MB.

That's not a bad converter. PNG is a lossless format, and the WebP you started with was not.

**2/**
Quick background: WebP gives you the same-looking image as a JPEG in ~30% fewer bytes, and it supports transparency. That's why every site at scale now serves it, and why you keep downloading files Photoshop refuses to open.

**3/**
Here's the part that confuses people. I measured a real 1600×1068 photo three ways:

• 294.6 KB WebP → PNG → **2.43 MB (+746%)**
• 29.6 KB WebP → PNG → 361.6 KB (+1121%)
• 27.0 KB WebP → PNG → 63.1 KB (+134%)

**4/**
Look at the pattern. The **smaller** your source file, the **worse** the blow-up ratio gets.

That reads backwards until you see why: a 27 KB WebP is 27 KB because it threw away a huge amount of information. PNG refuses to do that. It re-stores everything, losslessly.

**5/**
The other thing that surprises people: **the quality slider does nothing on PNG.**

There's no quality to trade — lossless means lossless. Every tutorial telling you to "set PNG to 80%" is telling you to move a control that has no effect on the output.

**6/**
The only lever that actually reduces a PNG is pixel dimensions.

That same 1600px image resized to 1280px came out around 4× smaller. In my testing, resizing is the entire game with PNG. Quality settings are decoration.

**7/**
But before you reach for PNG at all, ask whether you need transparency.

• Need transparency → PNG, accept the size
• Don't need transparency → use JPEG. The same 294.6 KB WebP became **178.5 KB at JPEG q70 — 39% smaller than the original.**

**8/**
And one silent failure worth guarding against: **JPEG has no alpha channel.**

Convert a transparent WebP to JPEG and every transparent area becomes solid — usually white or black. Nothing warns you. The image just quietly has a different background than it did.

**9/**
If you're building a converter, detect an alpha channel in the source, and when the user picks an output format that can't store it, say so before they download — not after.

Data loss the user can't see is the worst kind of bug.

Converters that don't upload your files: example.com/webp-to-png/

---

**Posting notes**

- Tweets 3 and 4 carry the thread. If you make a table image, that's the one to attach.
- The "quality slider does nothing on PNG" claim is the most quotable line. Consider making that tweet 1 if you want a punchier opener and can afford to lose the setup.
- Tweet 8 is a good standalone post for a design-heavy audience if you want to split this into two threads.
