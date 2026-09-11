# BCE_RESEARCH.md

**Project:** BGTS Context Engine (BCE) — premium product microsite
**Research date:** 10 September 2026
**Product version researched:** `bgts-context-engine` 0.2.0 (released 10 September 2026)

---

## 0. Source inventory and access status

| Source | Status | Used for |
| --- | --- | --- |
| **Full repository** (`bgts-context-engine-main.zip`, provided by BGTS) | ✅ **Read in full** | `docs/*.md`, `CONTRIBUTING.md`, `SECURITY.md`, `web/`, `tests/`, `deploy/`, `server.json` — everything the public repo would contain |
| **PyPI sdist `bgts_context_engine-0.2.0.tar.gz`** | ✅ Downloaded and read in full | The executing source: scoring weights, confidence thresholds, hop limits, tool catalogue |
| PyPI project page | ✅ Reachable | Metadata, release history, authors, license |
| GitHub — `github.com/bgts-ai-org/bgts-context-engine` | ❌ **404 / not publicly reachable on 10 Sep 2026** (verified via HTTP fetch, GitHub API and a real browser) | Links only. **Launch blocker.** |
| **`cce-benchmark-raporu.html`** — A/B benchmark, 4 Sep 2026 | ✅ Read in full | The measured-results section. Company-provided material |
| **`Cortex_Context_Engine_Mimari.pdf`** — architecture spec, June 2026 | ✅ Read in full | Design principles P1–P5, confidence→behaviour table, auditability argument, POC criteria, risks |
| **`Cortex-Context-Engine-Sunum.pptx`** — 17-slide internal deck | ✅ Read in full | Competitor analysis, what was taken from CodeGraph and Graphify and why, encoder comparison |
| **`ui-walkthrough.mp4`** — 51s, 1600×900 | ✅ Frames extracted, captions transcribed | The recorded run that drives the pipeline section; the "See it in action" screenshots |
| **`social-preview.png`** | ✅ Read | Official OG image, already carrying the new product name |
| bgts.com/tr + /tr/iletisim | ✅ Read in a real browser | Corporate identity, tone, contact form, KVKK text, footer, offices |

### Source precedence

Where sources disagree, the **shipped 0.2.0 code wins**, then the repository docs, then the
company documents. This matters in three concrete places:

1. **CLI and package name.** The June architecture PDF and the deck say `cce` / `CCE`; the
   shipped package is `bce` / BCE. The site uses `bce` throughout.
2. **Product name.** The PDF and deck say "Cortex Context Engine"; the shipped README, the
   web UI and the official social preview all say "BGTS Context Engine". The site uses the
   latter, with `BCE` as the short form.
3. **Interfaces.** The PDF lists optional gRPC; the shipped code has MCP over stdio and
   REST only. The site claims only what ships.

## 1. Product definition

> **BGTS Context Engine** — deterministic code-graph context for AI coding agents.

One-sentence definition (the message the visitor must leave with):

> BCE is a deterministic code-context engine that indexes repositories into a graph and gives AI
> agents a ranked, explainable and token-budget-aware view of the code that actually matters.

PyPI summary line, verbatim:

> "Deterministic code-graph context engine for AI coding agents - PostgreSQL, Apache AGE and
> pgvector, over MCP and REST"

The product's own framing example, used consistently in README, README.tr and the shipped JSON
example — the microsite should reuse it rather than invent a new one:

> *"Why does the login timeout fire on the meeting webhook?"* → the eight symbols that actually
> answer it, ranked, budgeted and reproducible.

### What it is not

- Not an LLM, not a coding agent, not an IDE plugin. It is the **retrieval layer beneath** an agent.
- Not a vector database wrapper. Embeddings appear in exactly one place (anchor finding) and
  **never affect ranking**.
- Not a language server. It is repository-wide and cross-language rather than project-scoped.

---

## 2. Terminology

### Product naming (binding for the microsite)

| Use | Do not use |
| --- | --- |
| **BGTS Context Engine** (full product name) | ~~CCT~~ |
| **BCE** (short form; also the CLI binary name `bce` and the package prefix `BCE_*`) | ~~Cortex Content Engine~~ |

`BCE` is not a marketing abbreviation invented for the site — it is the actual CLI command
(`bce index`, `bce context`, `bce serve`), the environment-variable prefix (`BCE_DB_HOST`,
`BCE_EMBEDDING_PROVIDER`), the Python package (`src/bce/`) and the database name in the docs
(`BCE_DB_NAME=bce`). Using it on the site is factually correct, not a brand shortcut.

**Old CCT material.** No CCT/Cortex Content Engine artefact was supplied with this brief, and the
name appears nowhere in the 0.2.0 distribution. Mapping is therefore recorded but unused:

```
OLD TERMINOLOGY                  CURRENT TERMINOLOGY
CCT / Cortex Content Engine  →   BGTS Context Engine (BCE)
```

No concept is carried forward from old material; the 0.2.0 distribution defines the product.

### Domain vocabulary (all verified in code)

| Term | Meaning | Where it lives in the code |
| --- | --- | --- |
| **anchor** | A graph entry point nominated by one of four independent sources, tagged with the source(s) that produced it | `core/orchestrator/anchors.py` |
| **anchor source** | `explicit`, `jira`, `history`, `lexical`, `semantic` | `AnchorResult.anchors` values |
| **expansion** | Fixed-template bounded graph walk out from the anchors | `core/orchestrator/expand.py` |
| **candidate** | A symbol produced by expansion, carrying the features scoring needs | `core/scoring/engine.py::Candidate` |
| **score** | Deterministic weighted sum over six features | `core/scoring/engine.py::score_candidate` |
| **narrowing** | Keeping the top *N* candidates (CLI default `--max-candidates 8`) | `core/orchestrator/orchestrator.py` |
| **assembly** | Fitting the ranked list into a token budget, degrading detail by distance | `core/assembler/assembler.py` |
| **detail level** | `full` / `signature` / `reference` | `assembler.py::DetailLevel` |
| **coverage** | The trust report attached to every result | `core/coverage/confidence.py` |
| **confidence** | `high` / `medium` / `low`, computed from coverage metrics | `confidence.py::ConfidenceLevel` |
| **provenance** | How an edge entered the graph: `scip` / `treesitter` / `heuristic` | `domain/enums.py::Provenance` |
| **ref kind** | `define` / `write` / `read` / `pass` on a REFERENCES edge | `domain/enums.py::RefKind` |
| **context pack** | The `{anchors, context, coverage}` envelope returned to the agent | README "What comes back" |
| **god node** | A hub symbol with degree ≥ 20 (a logger, a config object) | `confidence.py::GOD_NODE_DEGREE` |

---

## 3. Technical architecture

### 3.1 The three layers

The tool surface is organised in three layers, and the same functions are exposed over both MCP and
REST from one implementation (`src/bce/tools/layer1|layer2|layer3`, bound by
`api/mcp/tools.py` and `api/rest/routes.py`).

| Layer | Purpose | Tools |
| --- | --- | --- |
| **Layer 1 — graph primitives** | Exact structural questions | `resolve_symbol`, `find_references`, `find_implementers`, `get_call_graph`, `get_dependencies`, `get_type_hierarchy` |
| **Layer 2 — search** | Finding entry points when nothing is named | `semantic_search`, `hybrid_search`, `find_similar_code` |
| **Layer 3 — orchestration** | Task-level retrieval, scoped and budgeted | `get_context_for_task`, `suggest_change_sites`, `expand_blast_radius`, `select_repos`, `assemble_context` |

**14 tools total** — 6 + 3 + 5. Verified by counting the keys of `TOOL_SPECS` in
`src/bce/api/mcp/tools.py`; matches the README's "fourteen tools".

### 3.2 The retrieval pipeline

From `core/orchestrator/orchestrator.py` (stage numbering is the module's own):

```
stage 0  commit pinning        every stage runs against the pinned commit
stage 1  multi-source anchors
stage 2  deterministic expand  (fixed template)
stage 3  scoring + narrowing
stage 4  scope filter          (per-user repository visibility)
stage 5  token-budget assembly
         coverage              trust report over the result
```

The README expresses the same pipeline as the user-facing sequence used on the site:

```
task text → anchors → expansion → scoring → scope → narrowing → assembly → coverage
```

The `/ui` player records these as named stages: `semantic → anchors → expand → score → narrow →
assemble` (`api/rest/ui/trace.py`).

### 3.3 Anchors — four independent sources

`core/orchestrator/anchors.py`, docstring and implementation:

1. **Explicit reference** — exact symbol names *and* route paths found in the task text. Fully
   deterministic. Route nodes act as an anchor source in their own right.
2. **Jira metadata** — component → repo mapping, linked commit/PR (deterministic lookup).
3. **task_history** — files touched by past resolutions of the task (semi-deterministic; past data).
4. **Semantic/lexical hybrid** — lexical keyword match first, embedding as the lowest-priority
   "widest net" fallback. **This is the only source that may touch a model, and only to *find* an
   anchor.**

Source tags recorded per anchor: `explicit`, `jira`, `history`, `lexical`, `semantic`.
Identifier extraction requires tokens of length ≥ 3 and de-duplicates deterministically.

### 3.4 Expansion — the fixed template

`core/orchestrator/expand.py`. Three rules guarantee determinism: fixed template, deterministic
ordering, deterministic de-dup and bound.

| Walk | Limit |
| --- | --- |
| CALLS — **callers** | **2 hops** (`_CALLERS_HOPS = 2`) |
| CALLS — **callees** | **1 hop** (`_CALLEES_HOPS = 1`) |
| REFERENCES — referrers | 1 hop, tags `ref_kind` |
| INHERITS / IMPLEMENTS — supertypes, subtypes, implementers | 1 hop, both directions |
| Same-file siblings | 1 hop |

A symbol reached by several paths keeps its **smallest** distance; cycles are cut by a visited set.

The reason for the asymmetry, stated in the README: *when you change a function, what breaks is
upstream of it.*

### 3.5 Scoring — the exact formula

`core/scoring/engine.py`. Weights version: **`scoring-v1`**.

```
score(node) =
    w1 * ref_kind_weight        w1 = 3.0
  + w2 * task_signal_match      w2 = 2.0
  + w3 * structural_centrality  w3 = 1.0
  + w4 * proximity              w4 = 2.0
  - w5 * leaf_penalty           w5 = 1.5
  + w6 * provenance_weight      w6 = 0.5
  (+ 5.0 if the node is an anchor — a guaranteed floor so a correct entry point is never pruned)
```

Component definitions, verbatim from the implementation:

| Component | Definition |
| --- | --- |
| `ref_kind_weight` | `define` 1.0 · `write` 0.8 · `read` 0.3 · `pass` 0.2 · unknown 0.5 |
| `centrality` | `min(degree / 20, 1.0)` — saturates at degree 20 |
| `proximity` | `1 / max(graph_distance, 1)` |
| `leaf_penalty` | 1.0 when the node is consumed but calls nothing, else 0.0 |
| `provenance_weight` | `scip` 1.0 · `treesitter` 0.8 · `heuristic` 0.4 · unknown 0.6 |

Final ordering: **score descending, then `symbol_id` ascending** — the stable tiebreak that makes
byte-identical output possible.

Why it works, from the module docstring: a type merely *carried* through 900+ files scores near zero
on w1 and takes a leaf penalty, while the handful that *define/write/handle* it float to the top.

### 3.6 Assembly — token budget and detail degradation

`core/assembler/assembler.py`:

| Graph distance | Detail level | Content |
| --- | --- | --- |
| 0–1 | `full` | Full body |
| 2 | `signature` | Signature + docstring |
| 3+ | `reference` | `name @ file:line` |

Token estimation is a fixed heuristic of **≈4 characters per token** — no model, no network.
Items are consumed top-down. An item that would overflow the budget is first retried at
reference-only detail; only if that still overflows is it **skipped, not reordered** (the module
notes this as "recall > precision"). CLI default budget: `--max-tokens 4000`.

### 3.7 Coverage and confidence — the trust report

`core/coverage/confidence.py`. Metrics computed on every Layer-3 result:

- `anchor_count`, `anchor_sources`, `anchor_source_count`
- `connected_component_ratio` — share of candidates within 2 hops
- `cross_repo_edge_ratio`
- `top_candidate_margin` — score gap between #1 and #2
- `orphan_ratio` — candidates not attached to any anchor
- `provenance_distribution` — `{scip, treesitter, heuristic}` share
- `touches_god_node`, `max_centrality_in_context` — hub warning at degree ≥ 20
- `commit_mismatch`, `commit_mismatch_count`

**Confidence thresholds, exactly as implemented:**

```
HIGH   source_count >= 3  AND  connected_component_ratio >= 0.7  AND  top_candidate_margin >= 1.0
LOW    source_count <= 1  AND  (top_candidate_margin < 0.5  OR  orphan_ratio > 0.5)
MEDIUM everything else
```

The consumer behaviour, from the README: `confidence: "low"` means the engine found something but
could not corroborate it — **the moment for an agent to ask a follow-up question instead of
editing.** `commit_mismatch` means the index is behind the working tree.

### 3.8 Data model

`domain/enums.py`:

- **Node labels:** `Repo`, `File`, `Symbol`, `Module`, `Route`, `DesignNote`
- **Edge labels:** `DEFINED_IN`, `BELONGS_TO`, `IMPORTS`, `CALLS`, `INHERITS`, `IMPLEMENTS`,
  `REFERENCES`, `ROUTES_TO`, `EXPLAINS`
- **Symbol kinds:** function, method, class, interface, variable, constant, enum, type, field,
  property, constructor
- **Ref kinds:** define, write, read, pass
- **Provenance:** scip, treesitter, heuristic
- **Design-note kinds:** note, why, hack, todo, fixme
- **HTTP methods on Route nodes:** GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS, ANY

**Symbol identity** (`indexing/parser/symbol_id.py`): follows SCIP-moniker logic —
`language + package + namespace + name + signature` hashed with blake2b (8-byte digest,
16 hex chars) into an id that is **repo- and commit-independent**. This is what lets a CALLS edge
resolve to the same symbol across repos and commits, and what makes tools chainable (one tool's
`symbol_id` is another tool's input). It is also why, per the README, symbol ids survive file moves
and reformatting.

### 3.9 Storage — one database

Single PostgreSQL 16 instance carrying **Apache AGE** (graph) and **pgvector** (embeddings)
alongside ordinary relational tables. Migration files in `storage/relational/migrations/` confirm
the shape: `0001_extensions_graph`, `0002_relational`, `0003_vector`, `0004_rls`,
`0005_embeddings_dim`, `0006_fts`, `0007_jobs`.

Stated benefit (README): one query joins a graph traversal, a vector search and a SQL filter — and
one `pg_dump` backs up the index.

### 3.10 Indexing

- Tree-sitter parsing per language provider (`indexing/parser/languages/`).
- **Incremental re-indexing driven by `git diff`** (`bce reindex --since ... --to HEAD`).
- Remote indexing from Bitbucket (`bce index-remote --url ...`, `indexing/gitsync/bitbucket.py`).
- Background job queue with enqueue/status/cancel endpoints (`jobs/`, `0007_jobs.sql`).
- **Framework-aware route extraction**, verified in the providers:
  FastAPI, Flask, Express, NestJS, Spring, ASP.NET, Gin. `ROUTES_TO` edges are tagged
  `heuristic` with `synthesized_by='route-binding'`.
- **DesignNote extraction**: `WHY:`/`NOTE:`/`HACK:`/`TODO:`/`FIXME:`/`XXX` line comments become
  DesignNote nodes with `EXPLAINS` edges to the nearest enclosing symbol; `treesitter` provenance.

### 3.11 Languages

| Language | Availability | Extensions |
| --- | --- | --- |
| Python | Built in | `.py`, `.pyi` |
| JavaScript | Built in | JS provider |
| TypeScript (+ TSX) | Built in | TS / TSX providers |
| Java | `langs` extra | `.java` |
| C# | `langs` extra | `.cs` |
| Go | `langs` extra | `.go` |

**Six languages.** Optional providers register only if their grammar imports, so the supported set
is a deterministic function of the environment. Adding a language is a one-line registration plus a
provider module.

### 3.12 Cross-language bridges

`indexing/extractor/bridges.py` — the concrete mechanisms, all regex-based, all deterministic
(sorted inputs, de-duplicated outputs), all tagged `provenance='heuristic'` with a specific
`synthesized_by` tag:

| Bridge | Native side | JS side | Tag |
| --- | --- | --- | --- |
| React Native legacy bridge | `RCT_EXPORT_METHOD(foo:…)` / `RCT_REMAP_METHOD` in ObjC/ObjC++ | `NativeModules.<Module>.foo(…)` | `rn-bridge` |
| Swift ↔ ObjC | `@objc(fooBar:)` / `@objc func fooBar` | — | `swift-objc-bridge` |
| Expo Modules DSL | `Function("foo")` / `AsyncFunction("foo")` in a Swift/Kotlin `ModuleDefinition` | JS call | `expo-module-extract` |
| RN event channels | `sendEvent(withName: "onX", …)` | `addListener("onX")` | `rn-event-channel` |

Native languages recognised for bridging: ObjC, ObjC++, Swift, Kotlin.

### 3.13 Interfaces

- **MCP**: 14 tools over **stdio only** (`bce serve-mcp`), behind the `mcp` extra. Streamable HTTP
  transport is on the roadmap, not shipped.
- **REST**: FastAPI at `:8000`, OpenAPI at `/docs`. Endpoints mirror the tools 1:1 plus indexing and
  jobs routes. Per-user scope resolved from the `X-BCE-User` header (CHANGELOG 0.1.0).
- **Web UI**: `/ui`, ships inside the wheel. A graph explorer plus a player that replays each
  pipeline stage for a task. English by default with a Turkish catalog.
- **CLI**: `migrate`, `index`, `index-remote`, `reindex`, `bench`, `resolve-symbol`,
  `find-references`, `context`, `languages`, `serve`, `serve-mcp`.

Every tool response uses the envelope `{tool, payload, message, locale}` — payload is
language-neutral, only `message` is localised (en/tr catalogs ship in `core/i18n/catalogs/`).

### 3.14 Offline operation

The default embedding provider is **deterministic arithmetic over token digests** — no API key, no
network, repeatable benchmarks. A Voyage provider can be selected via
`BCE_EMBEDDING_PROVIDER=voyage`; as of 0.2.0 selecting it without its API key or package raises
`EncoderConfigError` rather than silently falling back, because a substituted encoder is not
detectable by nearest-neighbour search and returned bad anchors instead of an error.

### 3.15 Measurement

`bce bench --cases my-tasks.json --out report.json`. Each case is a task text plus its ground-truth
`symbol_id`s. The report gives recall, precision, precision@1 and MRR per case, plus median and p95
latency. Two pass/fail checks matter more than the scores:

1. every case is run repeatedly (`--determinism-runs`, default 3) and must return a **byte-identical
   ordering**;
2. any case with a scoped principal must not surface a repository that principal cannot read.

**No benchmark numbers ship with the product, and none may appear on the site.** The project's own
position: retrieval-quality claims are worthless without the task set they were measured on, so the
harness ships instead of a leaderboard.

### 3.16 Security posture (stated honestly on the site)

The engine has **no authentication of its own** and expects to sit behind something that does. Only
Layer-3 endpoints apply the per-user repository scope; Layers 1 and 2 do not. Closing that is the
first roadmap item. The site must not imply enterprise security guarantees.

### 3.17 Roadmap (verbatim ordering from the README)

1. Scope enforcement on every layer
2. Streamable HTTP transport for MCP
3. More languages — Rust, Kotlin and PHP most requested
4. Wider SCIP ingestion
5. A published benchmark corpus

---

## 4. Core differentiators

Ranked by how defensible they are, which is also the order the site should argue them:

1. **Determinism.** Same task text + same commit → same context pack. No model in the retrieval
   path, no clock, no randomness. Verified by the benchmark harness, enforced by the contribution
   rule ("determinism is the product"). This is the differentiator no embedding system can copy.
2. **Structural relevance instead of textual similarity.** Retrieval basis is a code graph plus
   anchors. Embeddings find entry points; they never rank.
3. **Explainability.** `anchors` says why the engine looked where it did and which independent
   sources agreed. `provenance` says how each edge got into the graph.
4. **A trust report, not just results.** `coverage` + `confidence` tell the agent when *not* to act.
5. **Token-budget awareness with detail degradation by distance.** Eight genuinely relevant symbols
   in 4000 tokens.
6. **Cross-language edges.** A hole no single parser can see.
7. **One database.** Graph + vector + SQL in one PostgreSQL; one backup.
8. **Open source, MIT, runs offline.**

---

## 5. Comparison table (from the README, unchanged)

| | Embedding RAG | Language server | BGTS Context Engine |
| --- | --- | --- | --- |
| Retrieval basis | text similarity | compiler index | code graph + anchors |
| Cross-file, cross-repo | weak | per project | yes |
| Cross-language edges | no | no | yes, heuristic |
| Same query, same answer | no | yes | yes |
| Ranked for *a task* | by similarity | not ranked | yes, with coverage |
| Token budget aware | chunk count | no | yes, detail by distance |
| Explains its own answer | no | no | anchors + provenance + confidence |

Positioning sentence: a language server is exact but scoped to what you have open; embedding search
is broad but unaccountable. BCE sits between them — repository-wide and cross-language like the
former, exact and reproducible like the latter.

---

## 6. User personas

| Persona | Arrives from | Wants to know | Leaves with |
| --- | --- | --- | --- |
| **Agent-building engineer** (primary) | GitHub, MCP registry, HN, a colleague | Does this actually beat my embedding retriever? How does it rank? Can I run it today? | The pipeline understood + `pip install` + the MCP config block |
| **Staff / platform engineer** (primary) | Search for "code graph context AI agent" | Where does it sit in my stack? What does it need to run? Is it auditable? | Architecture + one-database picture + the honest security note |
| **Engineering leader at a large org** (secondary) | BGTS relationship, a talk, LinkedIn | Can we run this inside our perimeter? Who supports it? | The contact form and the BGTS consulting proposition |
| **Open-source contributor** (secondary) | PyPI, MCP registry | What's the contribution path? | Languages / provider interface + roadmap + repo link |

The first two decide the site's register: technical, specific, no marketing adjectives. The third is
served by one contact section at the end, not by softening the rest.

---

## 7. Content hierarchy — the 19 questions from the brief, mapped

| # | Question | Answered in |
| --- | --- | --- |
| 1 | What is BCE? | Hero + Overview |
| 2 | What problem does it solve? | Problem |
| 3 | Why isn't semantic/vector search enough? | Problem (side-by-side) |
| 4 | Why a code graph? | What BCE does (graph explorer) |
| 5 | What happens inside when a task is given? | Retrieval Journey (7 steps) |
| 6 | What are anchors? | Journey step 02 |
| 7 | How does graph expansion work? | Journey step 03 |
| 8 | How does scoring work? | Journey step 04 + formula panel |
| 9 | How is the token budget used? | Journey step 05 + Token Budget |
| 10 | Why do coverage / confidence matter? | Journey step 06 + Trust |
| 11 | Why does deterministic retrieval matter? | Determinism (run it three times) |
| 12 | How does it connect to agents over MCP? | MCP + Tool Explorer |
| 13 | How is it used over REST/API? | MCP section, second tab |
| 14 | Which languages does it support? | Languages / Indexing |
| 15 | Why do cross-language relationships matter? | Cross-language |
| 16 | Can it run offline? | Open Source / Quick start |
| 17 | What does open source mean here? | Open Source |
| 18 | How does a developer try it today? | Quick start |
| 19 | Why should an enterprise contact BGTS? | Contact |

---

## 8. Corporate context — BGTS

Read from bgts.com/tr and bgts.com/tr/iletisim on 10 Sep 2026.

- **Legal / brand:** BGTS — Business & Global Technology Solutions; logo lockup carries
  "BilgeAdam Technology & Software".
- **Positioning line (TR, verbatim):** "Kritik Sistemler için Güçlü Teknoloji Çözümleri"
- **Footer descriptor (TR, verbatim):** "Finans, Savunma, Perakende ve Telekom sektörleri için
  stratejik teknoloji ortağı. 30+ yıldır dijital dönüşümü güvenle yönetiyoruz."
- **Scale claims used by BGTS itself:** 30+ years, 1.400+ engineers, 1.500+ completed projects.
  *These belong to BGTS, not to BCE, and must never be presented as BCE metrics.*
- **Sectors:** Banking & finance, retail, telecommunications, defence.
- **Contact:** +90 444 3330 (weekdays 09:00–18:00) · info@bgts.com (reply within 24 hours)
- **Offices:** İstanbul (İTÜ ARI Teknokent, Sarıyer — headquarters), Ankara (Bilkent Cyberpark),
  plus London, Sheffield, Düsseldorf, Amsterdam in the footer.
- **Contact form fields (TR, verbatim):** Ad Soyad · E-posta · Şirket · Telefon · Mesajınız
- **KVKK consent line (TR, verbatim):** "Kişisel verilerimin 6698 sayılı KVKK kapsamında
  işlenmesini kabul ediyorum. *"
- **Submit label (TR, verbatim):** "Mesaj Gönder"
- **Copyright line:** "© 2026 BGTS. Tüm hakları saklıdır."

### Visual language observed

- Light, calm, corporate. White and very light grey grounds; generous white space.
- Deep navy hero grounds with a **bright sky-blue** used to emphasise the second line of a headline.
- Primary CTA: solid royal-blue pill with white text, ~10px radius, icon + label.
- Cards: white, 1px light border, ~12px radius, small uppercase blue eyebrow label above a title.
- Dark navy footer, four columns, sky-blue icons.
- Type: geometric humanist sans, semibold display weights, comfortable line height.

### BCE's own shipped identity (from the wheel — this is the product's real palette)

`src/bce/api/rest/static/` in the 0.2.0 distribution ships the web UI with these tokens:

```
--bg        #0b0e14      --text      #e2e8f0
--bg-raised #11151f      --text-dim  #8b98ad
--bg-panel  #141926      --accent    #38bdf8
--border    #232b3b      --warn      #fbbf24
                         --error     #f87171
```

Fonts loaded by the shipped UI: **Inter** (400/500/600/700) and **JetBrains Mono** (400/500).
Favicon: a four-node graph in `#38bdf8` around an amber `#fbbf24` centre on a `#0f172a` tile — a
literal drawing of *anchors around a focus symbol*.

**This is the bridge.** BGTS corporate navy + sky blue and BCE's shipped `#38bdf8` accent are the
same family. The microsite can be a genuine BGTS product without copying bgts.com, by taking the
corporate structure and restraint and the product's own dark technical surface.

---

## 9. Unknowns and claims requiring verification before launch

| Item | Status | Action |
| --- | --- | --- |
| GitHub repository public availability | 404 on 10 Sep 2026 | Site links to the canonical URL. **Confirm the repo is public before publishing**, or the primary CTA is broken. |
| `docs/*.md` deep links (architecture, retrieval, data-model, mcp, languages, deployment) | ✅ All six exist in the supplied repository | Verified. They resolve once the repo is public. |
| `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CITATION.cff`, `AUTHORS`, `server.json` | ✅ All present | Verified. `SECURITY.md` also gives `security-ai@bgts.com`. |
| Social preview image and the UI walkthrough video | ✅ Supplied directly | **Both used on the site**, re-encoded and embedded. No screenshot is faked. |
| GitHub star count | Unknown | Not shown. |
| Number of users / repositories / production deployments / enterprise customers | Unknown, almost certainly zero-to-few for a 2-day-old package | **Never shown.** |
| Latency, recall, precision numbers | Deliberately unpublished by the project | **Never shown.** The site explains the harness, and separately reports the A/B cost/time/call measurement, which is a different kind of claim. |
| `SECURITY.md` supported-versions table | Says `0.1.x`; the current release is `0.2.0` | Not shown on the site. Worth correcting in the repo. |
| `bce languages` runtime output | Depends on installed grammars | Site states built-in vs `langs` extra, which is the deterministic truth. |
| Jira anchor source | Present in the anchors docstring; no Jira client module in the sdist | Described as an anchor *source* in the pipeline, not as a shipped Jira integration. |
| MCP registry listing (`server.json`, `io.github.bgts-ai-org/bgts-context-engine`) | Manifest referenced in CHANGELOG; listing not verified | Mentioned only as "an MCP server manifest ships", not as "listed in the registry". |

### Anti-invention rules carried into implementation

Nothing on the site may state: a benchmark number, a latency figure, an accuracy figure, a user or
repository count, an enterprise customer, a production deployment, a security guarantee, a
scalability number, or a supported language that is not one of the six above. Every number that
appears — `4000`, `2913`, `8`, `11.42`, `6.10`, `0.875`, `1.84`, `3.0/2.0/1.0/2.0/1.5/0.5`, `20`,
`2 hops`, `1 hop`, `14`, `6` — is either a scoring weight, a threshold, a hop limit or a value from
the README's own worked example, and is labelled as such.

---

## 10. The recorded run (source for the pipeline section)

A 51-second walkthrough of the shipped `/ui` Graph Explorer was supplied by BGTS. In it,
**BCE indexes its own repository** and is asked to explain its own retrieval pipeline. Every
number in the site's pipeline section is transcribed from that recording.

**Index, as the UI reports it:** 4.9k edges · 1 repo · 136 files · 1.5k symbols ·
135 modules · 41 routes · 3 design notes · PY 84% · TS 15% · JS ~1%.

**Task text:** *"How does get_context_for_task turn find_anchors into a ranked context pack
through expand_from_anchors score_candidate and assemble"*

**Stage lines, verbatim from the player:**

| Stage | Line |
| --- | --- |
| — | Analyze runs `get_context_for_task` and records every stage so the graph can replay it. |
| Semantic candidates | Embedding search found 10 candidates (the lowest-priority anchor source) |
| Anchors | 42 anchors placed (lexical: 39, semantic: 10, explicit: 6) |
| Expansion (step 2) | 2 new nodes discovered at distance 2 (458 in total) |
| Scoring | 458 candidates scored using 4 task signals; a warmer colour means a higher score |
| Narrowing: top 8 | Top 8 selected out of 458 candidates |
| Result | Context pack ready · confidence medium, 8 items included |

Narrative captions also shown: *"While the pipeline runs, the graph walks real edges — this
is search, not ranking."* · *"Embeddings only nominate entry points. They never affect
ranking."* · *"Narrowing keeps Top-N. Warmer colour still means a higher score; rank badges
appear on the graph."*

**Selected candidates (top 8), as displayed:**

| # | Symbol | File | Score |
| --- | --- | --- | --- |
| 1 | `find_anchors` | `bce:src/bce/core/orchestrator/anchors.py` | 11.50 |
| 2 | `expand_from_anchors` | `bce:src/bce/core/orchestrator/expand.py` | 11.20 |
| 3 | `assemble` | `bce:src/bce/core/assembler/assembler.py` | 11.10 |
| 4 | `context` | `bce:src/bce/cli.py` | 10.90 |
| 5 | `score_candidates` | `bce:src/bce/core/scoring/engine.py` | 9.60 |
| 6 | `index_incremental` | `bce:src/bce/indexing/indexer.py` | 9.40 |
| 7 | `test_monorepo_service_rooted_import_is_linked` | `bce:tests/test_linker_crossfile.py` | 9.25 |
| 8 | `repo_graph` | `bce:src/bce/api/rest/ui/queries.py` | 9.20 |

Coverage panel: `confidence medium` · `anchors 42` · `candidates 8`.

### Two findings that came out of this run

**1. `medium` is correct, and provably so.** Three anchor sources fired, which satisfies the
first `high` condition. But `11.50 − 11.20 = 0.30`, and `high` requires
`top_candidate_margin ≥ 1.0`. The rule in `confidence.py` therefore returns `medium`. The
site uses this as its trust example precisely because the graph looks excellent and the
label still is not `high`.

**2. The tiebreak is visible in the output.** Positions 8, 9 and 10 all score exactly
**9.20**: `repo_graph` (`…/api/rest/ui/queries.py`), `extract_file`
(`…/indexing/extractor/extractor.py`) and `_build_anchors` (`…/tools/layer3/orchestration.py`).
They are ordered `api` < `indexing` < `tools` — the `(-score, symbol_id)` sort in
`score_candidates`, resolving a three-way tie alphabetically. The cut at `max_candidates: 8`
lands between #8 and #9 because of a string comparison, not a coin flip. This is the
strongest determinism evidence available and the site features it.

### One correction the repo docs forced

`docs/retrieval.md` states that `task_signal` is **binary** — 1.0 if the symbol's name
appears among the task's identifier tokens, else 0.0. An earlier draft of this site showed a
fractional `task_signal` of 0.46 in a worked score breakdown. That was wrong and has been
removed. The breakdown now shown reconciles `find_anchors = 11.50` using only values the
implementation can produce (anchor floor 5.0, `ref_kind` unknown 0.5, `task_signal` 1.0,
centrality `min(12/20)`, distance 0, `treesitter` provenance).

---

## 11. Measured results (source for the benchmark section)

**Report:** *Context Engine (CCE) kazanç değerlendirmesi*, 4 September 2026, `claude-opus-5`.
Five refactoring tasks on an internal React/TypeScript web application, each run twice —
once with the context engine enabled, once without — with the same agent, model and prompts.
Each run produced a pull request, so outputs are directly comparable.

| Metric | With engine | Without | Δ |
| --- | --- | --- | --- |
| Total cost | $56.54 | $83.75 | **−32.5%** |
| Wall clock | 126m 24s | 165m 48s | −23.8% |
| LLM calls | 500 | 748 | −33.2% |
| Tokens | 60.8M | 83.0M | −26.8% |
| Files changed | 72 | 73 | −1.4% |
| Lines changed | 18,579 | 19,149 | −3.0% |
| Test files | 14 | 15 | −6.7% |
| Cost per changed line | $0.0030 | $0.0044 | −32% |

**Mechanism.** Tool calls per LLM call rose from 0.71 to 1.31 (+85%) while LLM calls fell
33%: the engine front-loads "where is the relevant code" so the agent spends its turns
working rather than searching. Exploratory sub-agent spawns halved (4 vs 8) and cache-read
tokens — the largest cost line — fell 25.7%.

**The negative result.** On `hard-1` the engine cost **+183%**. The prompt already gave the
full path and line number of all six files to change, so there was nothing to discover and
the added context was pure overhead. Excluding `hard-1`, the remaining four tasks were 39%
cheaper with 41% fewer LLM calls. The report's own rule: turn the engine off per request
when the task already names the files.

**Stated limitations, all carried onto the site:** one run per task (n=1, no repeats);
wall-clock is the weakest metric because the two arms ran concurrently on different
checkouts; and in all ten runs the agent had no shell, so `tsc`, `lint`, `test` and `build`
were skipped — no pull request was ever compiled. "Quality is equal" therefore rests on diff
volume, file structure and test-file counts, not on running code.

**Editorial decision.** Bitbucket PR numbers, job IDs and the internal repository name are
present in the report but **omitted from the site**. They identify internal systems and add
nothing for a visitor. They can be restored on request; the methodology is described without
them.

---

## 12. Design principles (architecture spec, June 2026)

The PDF states five principles that all design decisions derive from. They are older than the
shipped code but still describe it accurately, and they explain *why* the engine is shaped
the way it is:

| | Principle | What it means |
| --- | --- | --- |
| **P1** | The deterministic line | The system splits in two. The providing side (the engine) has no LLM and is reproducible; the consuming side (the agent) is probabilistic and makes decisions. The line is never blurred. |
| **P2** | Semantic seed, graph truth | Embedding search does not produce answers — it finds an entry point. Real context comes from deterministic graph traversal, so an embedding's whim is damped by expansion. |
| **P3** | Narrowing plus transparent uncertainty | The job is not "pick the right file" but "reduce the search space to something a model can reason about without losing recall". What uncertainty remains is measured and declared, never hidden. |
| **P4** | Recall over precision, deliberately | A missed file leads to wrong code; an extra file is only noise. Collect generously, then trim to budget by deterministic ranking. |
| **P5** | One database | Graph, embeddings, metadata and permissions in one PostgreSQL, so one query joins a traversal, a vector search and an access filter. |

The PDF also states the commercial argument the site's architecture section reflects without
repeating: deterministic, auditable context can answer "why did the AI change this code?"
with a traceable path, which a pure-LLM approach cannot — and that is what a regulated buyer
requires. The site expresses this as auditability, not as market positioning.

**Honest-expectation framing, quoted from the PDF's closing box:** the engine is not a system
that finds the right files 100% of the time, because no such system exists. Its value is
reducing the search space from a thousand to about eight, not losing recall, and *measuring
and declaring* the remaining uncertainty rather than concealing it.

---

## 13. Competitive lineage (internal deck)

The deck documents which ideas were taken from two prior tools and the filter applied to
each — only features that are fully deterministic, or that sit in the anchor-finding step
and are damped by deterministic traversal afterwards.

| From | Taken | Why |
| --- | --- | --- |
| CodeGraph | Framework-aware routes | "Which function handles this endpoint?" becomes deterministic, and a route becomes an explicit anchor source |
| CodeGraph | iOS / RN / Expo bridges | Closes the cross-language call path a single-language AST cannot see |
| CodeGraph | Provenance labelling | Exact edges score higher, and an auditor can see how a link was found |
| CodeGraph | Blast radius | "What breaks if I change this?" answered deterministically |
| Graphify | God-node warning (degree ≥ 20) | Warns the consumer when context may be noisy |
| Graphify | `WHY:` / DesignNote extraction | Why code was written the way it was enters the context, not just what it does |
| Graphify | Coverage / confidence signal | Lets the agent choose between continue, widen and ask a human |
| Graphify | Graph visualisation and trace | "Why did the AI pick this code?" becomes watchable |

The deck also compares the two embedding providers: `voyage-code-3` at 1024 dimensions
reports 94% benchmark accuracy, the dependency-free hashing encoder 62.5% — but the hashing
encoder returned byte-identical results across 48 of 48 runs. **These figures are not on the
site**: they describe anchor-finding accuracy on an unpublished internal task set, and
presenting them without that task set would be exactly the kind of unanchored retrieval
number the project itself refuses to publish.

