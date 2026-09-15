# X / Twitter · thread

**Use for:** X, Threads, Bluesky, Mastodon
**Link:** `example.com/heic-to-jpg/` — put it in the **last** tweet only. Links in tweet 1 kill reach.
**Angle:** be the person who explains the counterintuitive thing. This thread works because it corrects a belief most people hold.

---

**1/**
Your JPEG just came out 68% bigger than the HEIC it came from.

That's not a broken converter. That's arithmetic.

**2/**
HEIC is built on HEVC. At matched *visual* quality, HEVC needs roughly 50% fewer bytes than JPEG.

That efficiency isn't a side effect of HEIC — it's the entire reason Apple switched to it.

**3/**
So "convert my HEIC to JPG and make it smaller" is asking for something the format won't give you. A faithful JPEG is bigger. Not sometimes. Always.

**4/**
Measured on one 1440×960 iPhone photo, starting from a 286.7 KB HEIC:

• JPG q95 → 771 KB (+169%)
• JPG q85 → 482 KB (+68%)
• JPG q75 → 366 KB (+28%)
• JPG q65 → 302 KB (+5%)
• JPG q55 → 260 KB (−9%)

**5/**
Look at q85. That's the "visually lossless, we recommend this" default that basically every converter ships.

It's also the worst possible first impression: the user's file more than doubles and they assume the tool is garbage. Most close the tab and never come back.

**6/**
The fix isn't a better compressor. It's picking quality by *target size* instead of by habit.

Binary-search the quality setting until the output matches the input byte count. On that same photo it settled at q61 → 283.2 KB, which is −1% versus the original.

**7/**
If you're building anything that converts files:

• default to ~q70, not q85
• when the output grows, say **why** in plain language
• offer a "match my original size" button

An unexplained number going up is where users leave. An explained one is a trust signal.

**8/**
And check whether the tool uploads your photos to a server before it converts them.

Most of the big ones do. Browser-side WebAssembly decoding doesn't have to — the file can stay on your device the whole time.

I built one that works that way: example.com/heic-to-jpg/

---

**Posting notes**

- Tweet 1 must stand alone as a complete, interesting claim — treat everything after as bonus.
- If you have a screenshot of the q95/q85/q75 table, attach it to tweet 4. Numbers in an image travel further than numbers in text.
- Do not put the link in a reply to tweet 1; the algorithm treats it as a link-bait pattern. Last tweet or nothing.
