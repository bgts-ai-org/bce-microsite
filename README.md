# Deploying the BCE microsite

`index.html` is a single self-contained file. No build step, no dependencies, no external
assets except Google Fonts. Drop it on any static host.

## Before publishing

1. **Make the repository public.** The page links to
   `github.com/bgts-ai-org/bgts-context-engine` in about ten places, including the primary
   CTA. It returned 404 when the site was built.
2. **Set the real origin.** Replace `https://bgts.com/bce/` in `robots.txt`, `sitemap.xml`
   and the `<link rel="canonical">` / `hreflang` tags at the top of `index.html`.
3. **Confirm the Open Graph image resolves.** It points at
   `raw.githubusercontent.com/.../docs/assets/social-preview.png`, which only serves once the
   repository is public. If the site will live on bgts.com, host a copy there and update the
   four `og:image` / `twitter:image` references instead.
4. **Decide on the benchmark figures.** The Measured results section publishes dollar totals
   and per-task deltas from the internal A/B report. Internal PR numbers, job IDs and the
   repository name are already omitted.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The site. Complete `<head>`, inline CSS and JS, images and video as data URIs. |
| `robots.txt` | Allow-all plus the sitemap pointer. |
| `sitemap.xml` | One URL with `hreflang` alternates for `en`, `tr` and `x-default`. |

## Language URLs

`?lang=tr` and `?lang=en` set the language on load and are declared as `hreflang`
alternates, so each language is separately indexable and shareable. The default is English;
the choice persists per browser in `localStorage`.

## What the page emits for crawlers

- Title, description and keywords, swapped per language
- Open Graph and Twitter card metadata with the product's own social preview
- `canonical` plus `hreflang` for `en` / `tr` / `x-default`
- JSON-LD: `SoftwareApplication`, `SoftwareSourceCode`, `Organization` and an eight-question
  `FAQPage`, regenerated when the language changes
- The repository's seventeen GitHub topics, rendered as real links to their topic pages
