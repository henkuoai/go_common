/* =====================================================================
   Site-level constants shared by the generator and the verifiers, so the
   domain is changed in exactly one place.

   >>> Before deploying, replace SITE with the real domain. <<<

   It reaches the canonical tag, the hreflang cluster, og:url, the JSON-LD
   and sitemap.xml of all 16 generated pages.
   ===================================================================== */

export const SITE = 'https://example.com';

/* Tools in nav / cluster order. The labels are format names rather than
   prose, so they are deliberately identical in all four locales. */
export const TOOLS = [
  { slug: 'heic-to-jpg', label: 'HEIC → JPG' },
  { slug: 'webp-to-png', label: 'WebP → PNG' },
  { slug: 'avif-to-jpg', label: 'AVIF → JPG' },
];

/* Letterform in the inline SVG favicon, per page. */
export const FAVICON = { '': '/', 'heic-to-jpg': 'J', 'webp-to-png': 'PN', 'avif-to-jpg': 'J' };
