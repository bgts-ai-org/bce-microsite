# BCE_SEO.md

What the microsite emits for search engines and social platforms, and what has to change
before launch.

---

## 1. Topics

The page renders the repository's own seventeen GitHub topics, verbatim and in the same
order, as real links to their `github.com/topics/...` pages:

`ai-agents` · `apache-age` · `code-graph` · `code-search` · `codebase-indexing` ·
`context-engineering` · `deterministic` · `deterministic-ai` · `developer-tools` · `llm` ·
`mcp` · `mcp-server` · `pgvector` · `postgresql` · `rag` · `static-analysis` · `tree-sitter`

They appear in three places: as the visible chip row in the Open Source section, in the
`keywords` meta tag, and in the `keywords` property of both the `SoftwareApplication` and
`SoftwareSourceCode` JSON-LD nodes. Keeping one array as the single source means the site and
the repository cannot drift apart.

## 2. Metadata

Everything below is emitted in both languages and re-emitted when the visitor switches.

| Item | Notes |
| --- | --- |
| `<title>` | Language-specific. EN: *BGTS Context Engine — Deterministic Code Context for AI Agents* |
| `description` | Names the mechanism, the licence, both interfaces and the database, in one sentence |
| `keywords` | The seventeen topics plus the product's own terminology |
| `robots` | `index, follow, max-image-preview:large, max-snippet:-1` |
| `canonical` | The page's own origin and path |
| `hreflang` | `en`, `tr` and `x-default`, pointing at `?lang=` URLs |
| Open Graph | `type`, `site_name`, `title`, `description`, `image` (1600×900 with alt), `locale`, `locale:alternate` |
| Twitter | `summary_large_image` with title, description and image |
| `theme-color` | `#0d1729`, the BGTS navy |
| Favicon | The product's own four-node graph mark, inline as an SVG data URI |

The Open Graph image is the product's official social preview — the same asset the README
uses — rather than a screenshot of the site.

## 3. Structured data

One JSON-LD block, four nodes, regenerated on language change:

- **`SoftwareApplication`** — version, licence, download and install URLs, code repository,
  runtime platform, requirements, an eight-item `featureList`, keywords, and a free `Offer`.
  Author, publisher and maintainer all point at the Organization node by `@id`.
- **`SoftwareSourceCode`** — the repository itself, linked back to the application.
- **`Organization`** — BGTS, with both office addresses, the project email and the phone.
- **`FAQPage`** — eight questions with answers, in the page's current language: what it is,
  how it differs from embedding search, what deterministic means, supported languages, how it
  connects to an agent, what infrastructure it needs, whether it runs offline, and the licence.

Every answer restates something the page already says and the source map already verifies.
No claim exists only in the structured data.

## 4. Language URLs

`?lang=tr` and `?lang=en` set the language on load, so each language has a stable, shareable,
separately indexable URL, declared to crawlers through `hreflang`. English is the default and
the choice persists per browser.

## 5. On-page SEO

- Exactly one `h1`; every section has an `h2` and is wired to it by `aria-labelledby`
- Every image carries a descriptive `alt`; the walkthrough video carries an `aria-label`
- Section ids are readable words, so in-page anchors are meaningful URLs
- Real semantic elements throughout — `nav`, `main`, `section`, `figure`/`figcaption`,
  `table`/`caption`/`th[scope]`, `label[for]`
- Text is real text, never baked into an image. The one exception is the UI screenshots,
  whose content is also written out in the captions beneath them
- No horizontal scroll at any width from 320px up, and no layout shift from the entrance
  animations, both of which are Core Web Vitals inputs
- Fonts are the only external request; everything else — images, video, CSS, JS — is inline

## 6. Before launch

| Item | Action |
| --- | --- |
| Repository is not public | Make it public, or repoint about ten links including the primary CTA |
| Canonical and sitemap host | Replace `https://bgts.com/bce/` with the production origin in `index.html`, `robots.txt` and `sitemap.xml` |
| Open Graph image | Resolves only once the repository is public; host a copy on the production origin if the site lives on bgts.com |
| `sitemap.xml` / `robots.txt` | Ship both from `deploy/` at the site root |
| Analytics | None is included. Add it deliberately, and keep the KVKK notice consistent with whatever it collects |
