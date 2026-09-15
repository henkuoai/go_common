# Quora · answer

**Question to target:** "How do I open HEIC files on Windows 10?"
Similar high-traffic questions to answer with this:
- "Why can't I open HEIC files on my PC?"
- "How do I convert HEIC to JPG without losing quality?"
- "Is it safe to upload photos to online converters?"
**Link:** `example.com/heic-to-jpg/`
**Quora rules:** a bare link gets collapsed as spam. Answer must be genuinely complete *without* the link, then mention the tool as one option among several.

---

HEIC is not a broken file — it's a **deliberate Apple choice** that Windows never had a reason to support out of the box.

Your iPhone encodes photos with HEVC, the same codec family used for 4K video. It gets an identical-looking photo into roughly half the bytes of a JPEG. Apple switched to it in iOS 11 because it halves what your photos cost you in iCloud storage. The cost is that almost nothing outside Apple's ecosystem can read it.

**First, the thing that does not work:**

Renaming `.heic` to `.jpg`. The container is still HEVC inside. Every application that trusts the file extension will fail with a corrupt-image error. A meaningful share of online "help" on this topic is people telling each other to rename, which is why so many people conclude their photos are damaged. They aren't.

**Now the real options.**

**1. Install the codec (Windows).** Microsoft ships "HEIF Image Extensions" and "HEVC Video Extensions" in the Store. Note the second one: in many regions it is **paid**, around $0.99. Once installed, File Explorer generates thumbnails and Photos opens the files. This is the cleanest fix if you just want to *view* them. It does nothing for applications that refuse HEIC on their own — Photoshop before CC 2018, most Office versions, and practically every web upload form.

**2. Change your camera setting going forward.** Settings → Camera → Formats → *Most Compatible*. New photos save as JPEG. This is worth doing if you know you'll be mailing photos to Windows users or uploading them to forms. It doesn't touch your existing library.

**3. Convert them.** For anything beyond a handful of files this is the only practical route. Two families of tool exist and the difference matters:

*Server-side converters* — iLoveIMG, CloudConvert, Convertio, Zamzar, TinyPNG. You upload, their machine converts, you download. This works, and the performance is good because they have real CPU. What you're trading away is that your photo now exists on someone else's disk, subject to their retention policy. Their free tiers are also restrictive: CloudConvert caps you at 25 conversions a day, Zamzar at 2 files, iLoveIMG around 15 images, and several add watermarks or size ceilings.

*Browser-side converters* — the file is decoded on your own machine using WebAssembly, so nothing is transmitted. Functionally this is the same as running desktop software; the advantage is that it's just a web page. You can verify the claim rather than believe it: open DevTools (F12) → Network tab, clear it, convert a file, and watch whether any request carries your image data.

**4. Desktop software.** macOS Preview exports JPEG natively and for free. On Windows, XnView MP and IrfanView handle HEIC once the codec is installed. If you're doing this weekly with hundreds of files, software is worth the install.

**One warning nobody gives you before you start:**

Your JPEG will be **larger** than the HEIC — typically 20–70% larger. This surprises people and makes them think the converter is bad. It isn't: HEVC is simply more efficient than JPEG, so a faithful JPEG has to spend more bytes to look the same. If the resulting size is a problem, lower the quality setting or reduce the pixel dimensions. Those are the only two levers.

Disclosure: I built a browser-side converter myself — `example.com/heic-to-jpg/`. It handles batches, offers a quality slider, and has a "match my original size" option that binary-searches the quality setting so the output lands near your input byte count. But for a few files, any option above is a reasonable choice.
