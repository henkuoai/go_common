# Reddit post · "why won't my iPhone photos open"

**Target subs:** r/iphone · r/applehelp · r/WindowsHelp · r/techsupport · r/software
**Link:** `example.com/heic-to-jpg/`
**Rules to respect:** most of these subs ban self-promo in the post body. Put the post up with no link, then add the link in your own first comment. Disclose that you built it — stealth marketing gets you banned and it is easy to spot.

---

**Title:** Why iPhone photos won't open on Windows, and the 20-second fix

**Body:**

Worth knowing if you move between an iPhone and a PC.

Your iPhone hasn't shot JPEG since iOS 11. It shoots HEIC — same codec family as 4K video — and Apple switched because it packs an identical-looking photo into roughly half the bytes. Great for your storage bill. Terrible for everything downstream of your phone.

Where it actually bites:

- Windows File Explorer shows a blank tile. You need "HEIF Image Extensions" from the Microsoft Store, and in a lot of regions that is a **paid** extension. Charging people to double-click their own holiday photos is a genuinely wild decision.
- Photoshop before CC 2018, older Office, most web upload forms and a lot of print shops just refuse the file.
- Word and PowerPoint insert dialogs won't list it.
- Government, visa and university portals almost universally demand JPEG.

**You cannot fix this by renaming.** A HEIC file renamed to `.jpg` is still HEVC inside. Anything that sniffs the extension will hand you a "corrupt image" error. If a guide tells you to rename, close that guide.

Options, ranked honestly:

**1. Stop creating them (going forward only).** Settings → Camera → Formats → *Most Compatible*. New photos become JPEG. Does nothing for the years you already have.

**2. Mail or AirDrop.** Sharing multiple photos through Mail can convert them, and AirDrop to a Mac then exporting works. Both are fine for three files and unbearable for three hundred.

**3. A converter — and here is where you should pay attention.** Nearly all the popular ones upload your photo to their servers to do the work: iLoveIMG, CloudConvert, Convertio, Zamzar, TinyPNG. Their free tiers are also tight (CloudConvert 25/day, Zamzar 2 files, iLoveIMG ~15 images).

Full disclosure: I built one that doesn't, at `example.com/heic-to-jpg/`. It decodes in your browser with WebAssembly so the file never leaves your device, and the page counts its own outbound network requests and lists them so you can check the claim instead of trusting it. But honestly, if you only need a handful of files, option 2 is fine and you don't need my thing.

**The part nobody warns you about:** the JPEG will be *bigger* than the HEIC. Usually 20–70% bigger. That is not a bad converter — HEVC is more efficient than JPEG, which is the entire reason Apple picked it. Asking a converter to "shrink my file while converting to JPG" is asking for something the format can't give you. Lower the quality, or resize, if byte count matters more than dimensions.

---

**Follow-up comment to post yourself** (this is where the link goes):

> Since a few people asked: the tool I mentioned is `example.com/heic-to-jpg/` — no account, no watermark, batch + ZIP. It decodes locally via WASM so nothing gets uploaded. Happy to answer anything about the implementation.
