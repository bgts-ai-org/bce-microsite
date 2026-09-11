# BGTS Context Engine — Microsite

**Deterministic code-graph context for AI coding agents.** This repository hosts the
single-file, self-contained landing page for the
[BGTS Context Engine (BCE)](https://github.com/bgts-ai-org/bgts-context-engine) — an
open-source, MIT-licensed engine that maps repositories into a deterministic code graph and
serves the symbols, relationships and evidence AI agents need, over MCP and REST, on
PostgreSQL with Apache AGE and pgvector.

[![Live Site](https://img.shields.io/badge/site-bgts.com%2Fbce-0d1729)](https://bgts.com/bce/)
[![Source](https://img.shields.io/badge/repo-bgts--context--engine-181717?logo=github&logoColor=white)](https://github.com/bgts-ai-org/bgts-context-engine)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/bgts-ai-org/bgts-context-engine/blob/main/LICENSE)
[![Interfaces](https://img.shields.io/badge/interfaces-MCP%20%7C%20REST-6f42c1)](https://github.com/bgts-ai-org/bgts-context-engine)
[![Database](https://img.shields.io/badge/database-PostgreSQL%20%2B%20Apache%20AGE%20%2B%20pgvector-336791?logo=postgresql&logoColor=white)](https://github.com/bgts-ai-org/bgts-context-engine)

## Table of contents

- [About](#about)
- [Live site](#live-site)
- [Files](#files)
- [SEO and structured data](#seo-and-structured-data)
- [Before publishing](#before-publishing)
- [Related links](#related-links)
- [License](#license)

## About

BCE indexes a codebase into a queryable, deterministic code graph — no embeddings, no
approximation — so AI coding agents get exact symbols, call graphs and evidence instead of
guessing from vector similarity. This microsite is the product's landing page: one
`index.html`, no build step, no framework, no external dependency besides Google Fonts.

Topics covered on the page and in this repository: `ai-agents` · `apache-age` ·
`code-graph` · `code-search` · `codebase-indexing` · `context-engineering` ·
`deterministic` · `deterministic-ai` · `developer-tools` · `llm` · `mcp` · `mcp-server` ·
`pgvector` · `postgresql` · `rag` · `static-analysis` · `tree-sitter`

## Live site

🔗 **https://bgts.com/bce/** *(placeholder origin — see [Before publishing](#before-publishing))*

Each language has its own indexable, shareable URL:

| Language | URL |
| --- | --- |
| English (default) | `https://bgts.com/bce/?lang=en` |
| Türkçe | `https://bgts.com/bce/?lang=tr` |

The choice persists per browser in `localStorage` and is declared to crawlers via
`hreflang` (`en`, `tr`, `x-default`).

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The site. Complete `<head>`, inline CSS and JS, images and video as data URIs. |
| `robots.txt` | Allow-all plus the sitemap pointer. |
| `sitemap.xml` | One URL with `hreflang` alternates for `en`, `tr` and `x-default`. |
| `og-image.jpg` | The 1200×675 Open Graph / Twitter card image. |
| `BCE_SEO.md` | Full inventory of what the page emits for search engines and social platforms. |
| `BCE_RESEARCH.md` | Source research backing the product claims on the page. |
| `BCE_CONTENT_SOURCE_MAP.md` | Maps every on-page claim to its source. |

## SEO and structured data

- **Metadata**: language-specific `<title>` and `description`, `keywords` sourced from the
  repository's own topics, `canonical`, full `hreflang` set, Open Graph and Twitter card tags,
  `theme-color`, and an inline SVG favicon — all re-emitted on language switch.
- **JSON-LD**: `SoftwareApplication`, `SoftwareSourceCode`, `Organization` and an
  eight-question `FAQPage`, regenerated per language. Every claim in the structured data is
  also stated on the page itself.
- **On-page**: exactly one `h1`, every section wired to an `h2` via `aria-labelledby`,
  descriptive `alt` text on every image, semantic `nav`/`main`/`section`/`figure`/`table`
  markup, no text baked into images, no horizontal scroll from 320px up, and no
  layout-shift animations — all Core Web Vitals inputs.
- **Performance**: Google Fonts is the only external request; everything else is inlined.

See [`BCE_SEO.md`](./BCE_SEO.md) for the complete breakdown.

## Before publishing

| Item | Action |
| --- | --- |
| Repository visibility | Make `bgts-ai-org/bgts-context-engine` public, or repoint the ~10 links on the page (including the primary CTA) that reference it. |
| Canonical host | Replace `https://bgts.com/bce/` in `index.html` (`canonical`, `hreflang`, sitemap references), `robots.txt` and `sitemap.xml` with the real production origin. |
| Open Graph image | Currently references the product's official social preview; confirm it resolves from the production origin before launch. |
| Benchmark figures | The "Measured results" section publishes dollar totals and per-task deltas from an internal A/B report — confirm they're cleared for public release. |
| Analytics | None is included by default. Add it deliberately and keep any KVKK/GDPR notice consistent with what it collects. |

## Related links

- [BGTS Context Engine — source repository](https://github.com/bgts-ai-org/bgts-context-engine)
- [Documentation](https://github.com/bgts-ai-org/bgts-context-engine/tree/main/docs)
- [Changelog](https://github.com/bgts-ai-org/bgts-context-engine/blob/main/CHANGELOG.md)
- [Contributing](https://github.com/bgts-ai-org/bgts-context-engine/blob/main/CONTRIBUTING.md)

## License

This microsite documents and links to the BGTS Context Engine, which is MIT-licensed. See
the [source repository](https://github.com/bgts-ai-org/bgts-context-engine) for license
terms.
