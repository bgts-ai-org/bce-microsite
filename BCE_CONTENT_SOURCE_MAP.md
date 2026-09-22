# BCE_CONTENT_SOURCE_MAP.md

Every technical claim on the microsite, with the source that verifies it. This file exists to stop
the site from making a claim the product does not support.

**Source keys**

| Key | Source |
| --- | --- |
| `README` | `README.md` in `bgts_context_engine-0.2.0.tar.gz` (PyPI sdist) |
| `README.tr` | `README.tr.md`, same distribution |
| `CHANGELOG` | `CHANGELOG.md`, same distribution |
| `LICENSE` | `LICENSE`, same distribution |
| `PKG` | `pyproject.toml` / `PKG-INFO`, same distribution |
| `CODE:<path>` | A module in `src/` of the same distribution — read directly |
| `UI-ASSET` | `src/bce/api/rest/static/` in the same distribution (shipped web UI) |
| `BGTS` | bgts.com/tr and bgts.com/tr/iletisim, read 10 Sep 2026 |
| `REPO:<path>` | A file in the full repository archive supplied by BGTS (`bgts-context-engine-main.zip`) |
| `RUN` | The recorded `/ui` walkthrough — `ui-walkthrough.mp4`, frames and captions transcribed |
| `BENCH-CLD` | `cce-benchmark-raporu.html`, the agent A/B report dated 4 Sep 2026 (`claude-opus-5`, five refactors). Formerly keyed `BENCH`. |
| `BENCH-VOY` | 40-PR retrieval replay against `voyage-code-4`, engine vs baseline (`voyage_vs_bce_k40_v3.md` / `.json`, motor v3) |
| `BENCH-JIN` | The same 40-PR replay against `jinaai/jina-code-embeddings-1.5b` under the `jina` retrieval profile, including the `semantic_guard_ranks` sweep (`jina_vs_bce_k40_gpu.md` / `.json`) |
| `BENCH-CUR2` | Cursor agent benchmark v2 — 14 matched task pairs, `cursor-grok-4.6-xhigh-fast`, target repo `cortex-web @ 6b31ba64` |
| `BENCH-CUR1` | Cursor agent benchmark v1, the withdrawn Windows-vs-Mac comparison. Cited only for the correction it produced. |
| `ARCH-PDF` | `Cortex_Context_Engine_Mimari.pdf`, architecture specification, June 2026 |
| `DECK` | `Cortex-Context-Engine-Sunum.pptx`, 17-slide internal presentation |
| `DERIVED` | Constructed for the site from verified values; labelled as an example on the page |

---

## 1. Product identity

| Claim on the site | Source |
| --- | --- |
| "BGTS Context Engine", short form "BCE" | `PKG` (package `bgts-context-engine`, module `src/bce/`, CLI `bce`, env prefix `BCE_*`) |
| "Deterministic code-graph context for AI coding agents." | `README` (tagline, verbatim) |
| Version 0.2.0, released 10 Sep 2026; 0.1.0 on 8 Sep 2026 | `CHANGELOG`, PyPI release history |
| MIT © BGTS | `LICENSE`, `README` |
| Python ≥ 3.11 | `PKG` |
| Built by Oğuz Öztürk and Enes İyidil | `README` |
| Maintainer contact `opensource-ai@bgts.com` | `README`, PyPI metadata |

---

## 2. The central claims

| Claim | Source |
| --- | --- |
| "The same task text, against the same commit, returns the same context pack." | `README` (bold sentence, verbatim) |
| "No model in the retrieval path, no clock, no randomness." | `README` |
| "Embeddings are used in one place only: finding entry points… They never affect ranking." | `README`; `CODE:core/orchestrator/orchestrator.py` docstring ("embeddings only ever appear upstream as pre-computed anchor candidates") |
| Stable tiebreak — score descending, then `symbol_id` ascending | `CODE:core/scoring/engine.py::score_candidates` |
| Versioned scoring weights, `scoring-v1` | `CODE:core/scoring/engine.py::SCORE_WEIGHTS_VERSION` |
| "determinism is the product" — contribution rule | `README` (Contributing) |
| Determinism verified by running each case repeatedly and comparing output | `README`; `CODE:cli.py` (`--determinism-runs`, default 3) |

---

## 3. Anchors

| Claim | Source |
| --- | --- |
| Four independent anchor sources: explicit names, task history, full-text, vector | `README` ("How it works"); `CODE:core/orchestrator/anchors.py` docstring |
| Source tags `explicit`, `jira`, `history`, `lexical`, `semantic` | `CODE:core/orchestrator/anchors.py::AnchorResult` |
| Route paths in the task text resolve to handler symbols and act as an anchor source | `CODE:core/orchestrator/anchors.py` (Source 1b, `_extract_paths` → `find_routes` → `handler_id`) |
| The semantic source is the only one that may touch a model, and only to *find* an anchor | `CODE:core/orchestrator/anchors.py` docstring, source 4 |
| Identifier extraction requires tokens of length ≥ 3 | `CODE:core/orchestrator/anchors.py::_extract_identifiers` |
| "Three sources agreeing is usually right; one is a guess." | `README` ("What comes back") |

---

## 4. Expansion

| Claim | Source |
| --- | --- |
| Callers 2 hops, callees 1 hop | `README`; `CODE:core/orchestrator/expand.py` (`_CALLERS_HOPS = 2`, `_CALLEES_HOPS = 1`) |
| References 1 hop, tagging `ref_kind` | `CODE:core/orchestrator/expand.py` |
| Type hierarchy walked in both directions, 1 hop (supertypes, subtypes, implementers) | `CODE:core/orchestrator/expand.py` |
| Same-file siblings, 1 hop | `CODE:core/orchestrator/expand.py` |
| A symbol reached by several paths keeps its smallest distance; cycles cut by a visited set | `CODE:core/orchestrator/expand.py::record`, `_bfs` |
| "when you change a function, what breaks is upstream of it" | `README` |

---

## 5. Scoring

| Claim | Source |
| --- | --- |
| Formula: `w1·ref_kind + w2·task_signal + w3·centrality + w4·proximity − w5·leaf_penalty + w6·provenance` | `CODE:core/scoring/engine.py` module docstring and `score_candidate` |
| Weights 3.0 / 2.0 / 1.0 / 2.0 / 1.5 / 0.5 | `CODE:core/scoring/engine.py::ScoreWeights` defaults |
| Anchors receive a +5.0 floor so a correct entry point is never pruned | `CODE:core/scoring/engine.py::score_candidate` |
| `ref_kind_weight`: define 1.0, write 0.8, read 0.3, pass 0.2, unknown 0.5 | `CODE:core/scoring/engine.py::_REF_KIND_WEIGHT` |
| `provenance_weight`: scip 1.0, treesitter 0.8, heuristic 0.4, unknown 0.6 | `CODE:core/scoring/engine.py::_PROVENANCE_WEIGHT` |
| Centrality is `min(degree/20, 1.0)` — saturates at degree 20 | `CODE:core/scoring/engine.py::score_candidate` |
| Proximity is `1 / max(graph_distance, 1)` | `CODE:core/scoring/engine.py::score_candidate` |
| Leaf penalty applies to a node that is consumed but calls nothing | `CODE:core/orchestrator/expand.py::to_candidates` (`is_leaf = not callees and bool(callers)`) |
| "Reference kind carries the heaviest weight, because a place that *writes* a value is where the bug lives" | `README` |
| "a logger touches everything and explains nothing" | `README` |

---

## 6. Assembly and token budget

| Claim | Source |
| --- | --- |
| Detail levels `full` / `signature` / `reference` | `CODE:core/assembler/assembler.py::DetailLevel` |
| Distance 0–1 → `full`; 2 → `signature`; 3+ → `reference` | `CODE:core/assembler/assembler.py` (`_NEAR_MAX_DISTANCE = 1`, `_MID_MAX_DISTANCE = 2`) |
| `reference` renders as `name @ file:line` | `CODE:core/assembler/assembler.py::_render` |
| Token estimate ≈ 4 characters per token, no model, no network | `CODE:core/assembler/assembler.py` (`_CHARS_PER_TOKEN = 4`) |
| An overflowing item is retried at reference detail, then skipped — never reordered | `CODE:core/assembler/assembler.py::assemble` |
| Default budget 4000 tokens, default 8 candidates | `CODE:cli.py` (`--max-tokens 4000`, `--max-candidates 8`); `CODE:api/mcp/tools.py` (`max_tokens` default 4000) |
| "That is how eight genuinely relevant symbols fit in 4000 tokens." | `README` |

---

## 7. Coverage and confidence

| Claim | Source |
| --- | --- |
| Metrics: `anchor_source_count`, `connected_component_ratio`, `top_candidate_margin`, `orphan_ratio`, `provenance_distribution`, `touches_god_node`, `commit_mismatch` | `CODE:core/coverage/confidence.py::compute_coverage` |
| HIGH: `source_count ≥ 3` AND `connected_component_ratio ≥ 0.7` AND `top_candidate_margin ≥ 1.0` | `CODE:core/coverage/confidence.py::_confidence_level` |
| LOW: `source_count ≤ 1` AND (`top_candidate_margin < 0.5` OR `orphan_ratio > 0.5`) | `CODE:core/coverage/confidence.py::_confidence_level` |
| MEDIUM: everything else | `CODE:core/coverage/confidence.py::_confidence_level` |
| God node threshold is degree ≥ 20 | `CODE:core/coverage/confidence.py::GOD_NODE_DEGREE` |
| `connected_component_ratio` is the share of candidates within 2 hops | `CODE:core/coverage/confidence.py` |
| "`confidence: "low"` … the moment for an agent to ask a follow-up question instead of editing." | `README` |
| "`commit_mismatch` means the index is behind your working tree." | `README` |

---

## 8. Data model and indexing

| Claim | Source |
| --- | --- |
| Node labels `Repo`, `File`, `Symbol`, `Module`, `Route`, `DesignNote` | `CODE:domain/enums.py::NodeLabel` |
| Edge labels `DEFINED_IN`, `BELONGS_TO`, `IMPORTS`, `CALLS`, `INHERITS`, `IMPLEMENTS`, `REFERENCES`, `ROUTES_TO`, `EXPLAINS` | `CODE:domain/enums.py::EdgeLabel` |
| Symbol kinds (11 values) | `CODE:domain/enums.py::SymbolKind` |
| Ref kinds `define`, `write`, `read`, `pass` | `CODE:domain/enums.py::RefKind` |
| Provenance `scip`, `treesitter`, `heuristic` | `CODE:domain/enums.py::Provenance` |
| Design-note kinds `note`, `why`, `hack`, `todo`, `fixme` | `CODE:domain/enums.py::DesignNoteKind` |
| Route HTTP methods incl. `ANY` | `CODE:domain/enums.py::HttpMethod` |
| `WHY:` comments bound to the symbol they explain via `EXPLAINS` | `README`; `CODE:indexing/extractor/designnote.py` |
| Symbol ids follow SCIP-moniker logic, hashed, repo- and commit-independent | `CODE:indexing/parser/symbol_id.py` docstring |
| Symbol ids survive file moves and reformatting, so history and embeddings stay valid | `README`; `CODE:indexing/parser/symbol_id.py` |
| Incremental re-indexing driven by `git diff` | `README`; `CODE:cli.py::reindex` (`--since`, `--to`) |
| Framework-aware routes: FastAPI, Flask, Express, NestJS, Spring, ASP.NET, Gin | `CODE:indexing/parser/languages/*_provider.py` (`framework="fastapi"|"flask"|"express"|"nestjs"|"spring"|"aspnet"|"gin"`) |
| `ROUTES_TO` edges are `heuristic`, `synthesized_by='route-binding'` | `CODE:indexing/extractor/routes.py` |
| Remote indexing from Bitbucket | `CODE:cli.py::index-remote`; `CODE:indexing/gitsync/bitbucket.py` |
| Background job queue with enqueue / status / cancel | `CODE:api/rest/routes.py` (`/v1/jobs/*`); `CODE:jobs/`; migration `0007_jobs.sql` |

---

## 9. Languages and cross-language

| Claim | Source |
| --- | --- |
| Six languages: Python, JavaScript, TypeScript built in; Java, C#, Go behind the `langs` extra | `README`; `CODE:indexing/parser/registry.py::build_default_registry` and `_OPTIONAL_PROVIDERS` |
| Python `.py`, `.pyi`; Java `.java`; C# `.cs`; Go `.go` | `CODE:indexing/parser/languages/*_provider.py::extensions` |
| Optional providers register only if their grammar imports | `CODE:indexing/parser/registry.py::_register_optional` |
| Adding a language touches two files | `README` |
| React Native bridge: `RCT_EXPORT_METHOD` ↔ `NativeModules.<Module>.foo()` | `CODE:indexing/extractor/bridges.py` |
| Swift ↔ ObjC via `@objc(…)` / `@objc func` | `CODE:indexing/extractor/bridges.py` |
| Expo Modules `Function("foo")` / `AsyncFunction("foo")` | `CODE:indexing/extractor/bridges.py` |
| RN event channels `sendEvent(withName:)` ↔ `addListener("onX")` | `CODE:indexing/extractor/bridges.py` |
| Bridge tags `rn-bridge`, `swift-objc-bridge`, `expo-module-extract`, `rn-event-channel` | `CODE:indexing/extractor/bridges.py` |
| Bridge edges are inferred from naming conventions and tagged `heuristic` | `CODE:indexing/extractor/bridges.py` module docstring |

---

## 10. Interfaces

| Claim | Source |
| --- | --- |
| 14 MCP tools | `CODE:api/mcp/tools.py::TOOL_SPECS` (14 keys); `README` ("fourteen tools") |
| Layer 1 = 6 tools, Layer 2 = 3, Layer 3 = 5 | `CODE:api/mcp/tools.py` descriptions |
| Tool names and descriptions shown in the explorer | `CODE:api/mcp/tools.py::TOOL_SPECS` — copied verbatim |
| MCP is stdio only today; streamable HTTP is on the roadmap | `README` (Roadmap item 2) |
| MCP surface is behind the `mcp` extra | `README` |
| Client configs for Cursor, Claude Code, VS Code, Claude Desktop, and the `uvx` form | `README` — reproduced verbatim |
| REST at `:8000`, OpenAPI at `/docs`, UI at `/ui/` | `README`; `CODE:cli.py::serve` |
| Endpoints mirror the tools 1:1 | `CODE:api/rest/routes.py`; `CODE:api/mcp/tools.py` ("Mirrors the REST surface 1:1") |
| Per-user scope resolved from the `X-BCE-User` header | `CHANGELOG` 0.1.0 |
| Every tool response uses `{tool, payload, message, locale}` | `CODE:api/mcp/tools.py` module docstring |
| CLI commands: `migrate`, `index`, `index-remote`, `reindex`, `bench`, `resolve-symbol`, `find-references`, `context`, `languages`, `serve`, `serve-mcp` | `CODE:cli.py`; `CHANGELOG` 0.1.0 |
| `/ui` ships in the wheel and replays a retrieval stage by stage | `README`; `CHANGELOG` 0.1.0; `CODE:api/rest/ui/trace.py` |
| UI stage names `semantic → anchors → expand → score → narrow → assemble` | `CODE:api/rest/ui/trace.py` |

---

## 11. Storage and deployment

| Claim | Source |
| --- | --- |
| One PostgreSQL with Apache AGE and pgvector | `README`; `CODE:storage/relational/migrations/0001_extensions_graph.sql`, `0003_vector.sql` |
| PostgreSQL 16 in the Compose file | `README` quick start comment |
| One query joins graph traversal, vector search and SQL filter; one `pg_dump` backs up the index | `README` |
| Docker Compose deployment ships preconfigured | `CHANGELOG` 0.1.0 |
| Runs offline: default embedding provider is deterministic arithmetic over token digests | `README`; `CODE:indexing/embedder/encoder.py` |
| Selecting `voyage` without its key/package raises `EncoderConfigError` rather than falling back | `CHANGELOG` 0.2.0 |

---

## 12. Measurement and honesty statements

| Claim | Source |
| --- | --- |
| `bce bench --cases … --out …`; recall, precision, precision@1, MRR, median and p95 latency | `README`; `CODE:cli.py::bench`; `CODE:bench/runner.py` |
| Two pass/fail checks: byte-identical ordering, and no out-of-scope repository surfaced | `README` |
| No benchmark numbers are published, on purpose | `README` ("the harness ships instead of a leaderboard") |
| The engine has no authentication of its own | `README` (Security) |
| Only Layer-3 endpoints apply the per-user repository scope | `README`; `CODE:api/mcp/tools.py::dispatch_tool` (scope passed only to Layer-3 calls) |
| Roadmap, in order: scope on every layer · streamable HTTP MCP · more languages (Rust, Kotlin, PHP) · wider SCIP ingestion · a published benchmark corpus | `README` (Roadmap) |

---

## 13. The recorded run — the pipeline section

Every value in the pipeline section is transcribed from the supplied `/ui` walkthrough.

| Claim on the site | Source |
| --- | --- |
| Task text: "How does get_context_for_task turn find_anchors into a ranked context pack through expand_from_anchors score_candidate and assemble" | `RUN` — the task field in the recording |
| 4.9k edges · 136 files · 1.5k symbols · 135 modules · 41 routes · 3 design notes · PY 84% / TS 15% | `RUN` — the explorer's stats bar |
| "Embedding search found 10 candidates (the lowest-priority anchor source)" | `RUN` — verbatim stage line |
| "42 anchors placed (lexical: 39, semantic: 10, explicit: 6)" | `RUN` — verbatim stage line |
| "2 new nodes discovered at distance 2 (458 in total)" | `RUN` — verbatim stage line |
| "458 candidates scored using 4 task signals" | `RUN` — verbatim stage line |
| "Top 8 selected out of 458 candidates" | `RUN` — verbatim stage line |
| "Context pack ready · confidence medium, 8 items included" | `RUN` — verbatim stage line |
| The eight selected candidates, their file paths and scores (11.50 / 11.20 / 11.10 / 10.90 / 9.60 / 9.40 / 9.25 / 9.20) | `RUN` — the SELECTED CANDIDATES panel |
| `#9 extract_file` and `#10 _build_anchors` also at 9.20, `#12 to_candidates` at 9.05 | `RUN` — the SCORE RANKING (TOP 20) panel |
| Anchor source limits: lexical 5 per term, semantic 10 | `REPO:docs/retrieval.md` §1 |
| `task_signal` is 1.0 or 0.0, never fractional | `REPO:docs/retrieval.md` §3 |
| "There is no fan-out cap" | `REPO:docs/retrieval.md` §2 |
| "IMPORTS is deliberately not traversed here" | `REPO:docs/retrieval.md` §2 |
| The scope filter runs before narrowing | `REPO:docs/retrieval.md` §5 |
| Sorted by `(-score, symbol_id)`, scores rounded to six decimals first | `REPO:docs/retrieval.md` §4; `CODE:core/scoring/engine.py` |
| **The margin explanation:** 11.50 − 11.20 = 0.30, and `high` needs ≥ 1.0, therefore `medium` | Arithmetic on `RUN` values against the rule in `CODE:core/coverage/confidence.py::_confidence_level`. The site shows the subtraction. |
| **The tiebreak demonstration:** three symbols at 9.20 ordered `api` < `indexing` < `tools` | `RUN` — the observed order in the ranking panel, explained by the sort in `CODE:core/scoring/engine.py` |
| Score breakdown reproducing `find_anchors = 11.50` (anchor 5.0 + ref_kind unknown 0.5 + task_signal 1.0 + centrality min(12/20) + distance 0 + treesitter 0.8) | `DERIVED` — a feature vector that reproduces the **published** score exactly under `scoring-v1`, using only values the implementation can produce. Presented as a reconciliation of the observed score, not as a recorded feature vector. |
| The call edges drawn on the canvas (`context → get_context_for_task → _build_anchors → find_anchors`, `→ RetrievalOrchestrator.retrieve → expand_from_anchors / to_candidates / score_candidates`, `→ assemble`, `→ compute_coverage`) | `CODE:tools/layer3/orchestration.py` lines 90–190 and `CODE:core/orchestrator/orchestrator.py` — read from the source, not inferred |

**Labelled on the page** as a recorded run, with a note that the canvas draws the call
structure the run walked while the run itself scored 458 candidates.

## 13a. The README worked example — the token-budget section

The budget panel keeps the README's published example, because it is the only source with
per-item token costs.

| Value | Source |
| --- | --- |
| `refresh_session` 11.42 / distance 0 / `full` / 214 tokens | `README` JSON |
| `SESSION_TTL` 6.10 / distance 2 / `signature` / 31 tokens | `README` JSON |
| `used_tokens 2913`, `budget 4000`, `included 8`, `skipped 0` | `README` JSON |
| The six other pack items and their token costs | `DERIVED` — constructed to fill the README's own `included: 8` and `used_tokens: 2913`, obeying the real detail thresholds and descending score order |
| The re-packing at 1000 / 2000 / 8000 tokens | Computed in the browser by a JS reimplementation of `CODE:core/assembler/assembler.py::assemble` — same thresholds, same 4-chars-per-token estimate, same retry-then-skip rule |

The panel is captioned as the README worked example.

## 13b. Evidence — Layer 2b, the Claude agent A/B (five refactors)

| Claim on the site | Source |
| --- | --- |
| −32.5% cost ($56.54 / $83.75), −33.2% LLM calls (500 / 748), −23.8% wall clock, −26.8% tokens | `BENCH-CLD` — totals table |
| 18,579 / 19,149 lines changed, 72 / 73 files, 14 / 15 test files | `BENCH-CLD` — output-quality table |
| Cost per changed line $0.0030 / $0.0044 | `BENCH-CLD` — same table |
| Per-task deltas (hard-1 +183%, hard-2 −28%, hard-3 −30%, xhard-1 −34%, xhard-2 −47%) | `BENCH-CLD` — per-task table |
| Tool calls per LLM call 1.31 vs 0.71; sub-agents 4 vs 8; cache reads −25.7%; output tokens −26.5% | `BENCH-CLD` — "where the gain comes from" table |
| The `hard-1` explanation and the "turn it off when the task names the files" rule | `BENCH-CLD` — the `hard-1` exception box and recommendations |
| "Excluding hard-1, four tasks 39% cheaper, 41% fewer LLM calls" | `BENCH-CLD` — same box |
| xhard-2 broke up a 6,015-line page to ~570 lines; xhard-1 produced 14 domain modules | `BENCH-CLD` — output-quality section |
| n=1 per task, no repeats | `BENCH-CLD` — reliability section |
| Wall clock weakest metric, concurrent runs on different checkouts | `BENCH-CLD` — reliability section |
| No PR compiled or tested in any of the ten runs | `BENCH-CLD` — quality-signals section |
| Both arms needed a repair round | `BENCH-CLD` — quality-signals section |
| `contextEngine.enabled` is per request | `BENCH-CLD` — recommendations |

**Omitted deliberately:** Bitbucket PR numbers, job IDs, the internal repository name, log
file paths and the pricing-label correction. They identify internal systems and add nothing
for a visitor. Restorable on request.

## 13c. Facts added from the repository documentation

| Claim on the site | Source |
| --- | --- |
| Hybrid search blends lexical and semantic at a fixed 0.55 / 0.45 with a structural tiebreak | `REPO:docs/architecture.md` |
| Indexing is two passes; the linker follows actual import bindings rather than guessing by name | `REPO:docs/architecture.md` |
| SCIP output, when available, upgrades edge provenance from `treesitter` to `scip` | `REPO:docs/architecture.md` |
| Symbol identity digests language, package, namespace, kind, name and signature — never path or line | `REPO:docs/architecture.md` |
| Renaming a symbol changes its id, and that is correct | `REPO:docs/architecture.md` |
| Re-indexing detaches and rebuilds each changed file's subgraph | `REPO:docs/architecture.md` |
| `/ui` replays through `POST /v1/ui/context-trace` | `REPO:docs/architecture.md` |
| Route frameworks and their exact decorators/annotations | `REPO:docs/languages.md` |
| Bridge patterns and their `synthesized_by` tags | `REPO:docs/languages.md` |
| JavaScript also covers `.mjs` and `.cjs` | `REPO:docs/languages.md` |
| `get_call_graph` hops max 10; `semantic_search` limit max 100 | `REPO:docs/mcp.md` |
| Every Layer-3 parameter and its default | `REPO:docs/mcp.md` |
| `X-BCE-User` is trusted as given and is not verified | `REPO:SECURITY.md` |
| `/v1/ui/*` is unfiltered; anyone reaching the port can read the graph including symbol bodies | `REPO:SECURITY.md` |
| Security contact `security-ai@bgts.com` | `REPO:SECURITY.md` |

## 13d. Evidence — Layer 1, retrieval replay (voyage-code-4)

| Claim on the site | Source |
| --- | --- |
| Method: 40 PRs indexed, 2 excluded by decision, 8 touch no symbol in the snapshot and are scored at file level, 30 scored, split 16 tune / 14 holdout | `BENCH-VOY` — scope section |
| Each PR is indexed at its own merge-base, so the engine never sees the future | `BENCH-VOY` — method, step 1 |
| Ground truth is the symbols and files the diff touched; tests and files the PR created are excluded | `BENCH-VOY` — method, step 3 |
| Both systems return 20 symbols; K=5/10/20 are cuts of one run | `BENCH-VOY` — method, step 4 |
| 83 ground-truth symbols; PRs are 1–8 code files, median 4 | `BENCH-VOY` — scope |
| Every published cell of the all-30, tune and holdout tables (recall, precision, F1, MRR, hit, file recall, file precision, with win–tie–loss) | `BENCH-VOY` — §3 result tables |
| Retention 100% on all three splits | `BENCH-VOY` — §3, §4.5 |
| Truth-loss table: semantic 16 (15/1/0), anchor 14 (12/2/0), expansion 20 (0/20/0), none 33 (0/0/33); median pool rank 75 | `BENCH-VOY` — "Doğrular nerede kayboldu" |
| Latency 733 → 1708 ms overall, 793 → 1681 ms on holdout | `BENCH-VOY` — §3 tables |
| Title-only variant: 7.9% → 7.9%, 0-30-0 | `BENCH-VOY` — §5.3 |
| File level over 37 PRs: 60.2% → 73.7% recall, 15.0% → 17.2% precision | `BENCH-VOY` — "Dosya seviyesi" |
| Named PRs #800, #827, #839, #855 and what happened in each | `BENCH-VOY` — §8 |
| K=5 loses on holdout because the list interleaves the model's ranks with the engine's scores | `BENCH-VOY` — §5.1 |

## 13e. Evidence — Layer 1, the jina profile

| Claim on the site | Source |
| --- | --- |
| Same 40 PRs, same splits, 84 ground-truth symbols | `BENCH-JIN` — scope |
| `jinaai/jina-code-embeddings-1.5b`, 1536 dimensions, vLLM on a RunPod GPU, bf16 | `BENCH-JIN` — header table, reproduction section |
| Engine constants are selected per model by a retrieval profile; the `jina` profile sets `semantic_guard_ranks = 10` and leaves the other two unchanged | `BENCH-JIN` — intro, §7 |
| Every published cell of the all-30, tune and holdout tables | `BENCH-JIN` — §3 |
| Retention 91.7% overall, 100% tune, 85.7% holdout | `BENCH-JIN` — §3, §4.4 |
| Truth-loss table: semantic 22 (19/3/0), anchor 12 (7/5/0), expansion 16 (0/16/0), none 34; median pool rank 64 | `BENCH-JIN` — "Doğrular nerede kayboldu" |
| The guard sweep at 0 / 5 / 7 / 10 / 15 with per-row all, tune, holdout and retention, and the note for each | `BENCH-JIN` — §7 sweep table |
| 10 was shipped although 7 scores higher overall and 0 scores higher on tune | `BENCH-JIN` — §7 |
| jina alone outperforms voyage alone (25.7 vs 16.9 at K=20; 30.8 vs 21.4 on holdout) | `BENCH-JIN` — §7 three-run comparison |
| Named PRs #808 (the only retention loss), #810, #834, #839 | `BENCH-JIN` — §8 |
| Latency 1.32 → 2.42 s overall, of which ~0.85 s is the engine | `BENCH-JIN` — §4.6 |
| The guard costs recall at K=5 and K=10 on the tune half | `BENCH-JIN` — §5.1 |

## 13f. Evidence — Layer 2a, Cursor agent benchmark v2

| Claim on the site | Source |
| --- | --- |
| 14 tasks, 28 runs, one machine, one account, same model, arms alternated per task | `BENCH-CUR2` — environment |
| `cursor-grok-4.6-xhigh-fast`, Cursor CLI `2026.09.18-9a7762b`, target repo `cortex-web @ 6b31ba64` | `BENCH-CUR2` — environment |
| One MCP tool (`get_context_for_task`), K=20, jina-code-embeddings-1.5b, context computed once and prepended: ~5.5k characters, ~1.3k tokens, 1.6 s | `BENCH-CUR2` — configuration |
| Confidence `high` on 7 of 14; the agent called the MCP tool twice in 14 runs | `BENCH-CUR2` — §2 |
| All sixteen aggregate rows with ratio, per-task median and tasks won | `BENCH-CUR2` — §2 table |
| Cost proxy = uncached input ×1 + cache read ×0.25 + output ×2.5; relative, not a currency amount | `BENCH-CUR2` — §2 footnote 1 |
| Totals 10.45M → 8.38M tokens, 1632 → 1471 s | `BENCH-CUR2` — §1, §3 |
| Automated checks 72/73 plain vs 73/73 with the engine; the failure is `IntegrationSelector.tsx` TS2345 on T09 | `BENCH-CUR2` — §3 code quality |
| Expected-file recall 1.00 and precision 0.73 in both arms; 21 files touched on T07 by both | `BENCH-CUR2` — §2, §4 T07 |
| All fourteen per-task rows: time, tokens, turns, tool calls, search output, files changed, checks, confidence | `BENCH-CUR2` — §4 |
| The seven patterns, including "the engine does not fix scope" and "confidence correlates weakly" | `BENCH-CUR2` — §5 |
| The four scores (6→8, 6.5→7, 7.5→8.5, 6.7→7.8), labelled on the page as judgement rather than measurement | `BENCH-CUR2` — §1 |
| T15 was not started: preflight measured a 17 s round trip and refused; its plain arm had no pair | `BENCH-CUR2` — stopping reason |

## 13g. Evidence — the withdrawn v1 comparison

| Claim on the site | Source |
| --- | --- |
| An earlier comparison showed the engine 7% worse on tokens | `BENCH-CUR1`, as summarised in `BENCH-CUR2` §1 |
| The cause was two machines routing to different model backends with different prompt-cache behaviour — 3.9k vs 7.1k uncached input per turn — not the engine | `BENCH-CUR2` — §1 "v1'e göre ne değişti" |
| Pre-context was also compressed from ~15k to ~5.5k characters and the rule text clarified | `BENCH-CUR2` — same paragraph |


## 14. Corporate content

| Claim | Source |
| --- | --- |
| BGTS — Business & Global Technology Solutions; "BilgeAdam Technology & Software" | `BGTS` |
| Consulting proposition: indexing, deployment, scoring tuned to their repositories, the agent stack | `README` ("Why this exists", final paragraph) |
| `opensource-ai@bgts.com` | `README` |
| info@bgts.com · +90 444 3330 · weekdays 09:00–18:00 · reply within 24 hours | `BGTS` |
| İstanbul — İTÜ ARI Teknokent, Sarıyer (headquarters); Ankara — Bilkent Cyberpark | `BGTS` |
| Form fields Ad Soyad · E-posta · Şirket · Telefon · Mesajınız; submit "Mesaj Gönder" | `BGTS` |
| KVKK line "Kişisel verilerimin 6698 sayılı KVKK kapsamında işlenmesini kabul ediyorum." | `BGTS` — verbatim |
| Palette `#0b0e14 / #38bdf8 / #fbbf24 / #e2e8f0`, fonts Inter + JetBrains Mono | `UI-ASSET` (`index-DrLRaTMU.css`, `index.html`, `favicon.svg`) |

**Not used, deliberately:** BGTS's 30+ years / 1.400+ engineers / 1.500+ projects figures. They are
true of BGTS and false of BCE, and putting them on a product page would imply BCE has that scale
behind it in production.

---

## 15. Claims deliberately absent

None of the following appears anywhere on the site, because no source supports it:

> **Amended.** Performance, latency and recall figures *were* on this list. The Evidence
> section now publishes all three, sourced in §13b and §13d–§13g and labelled as BGTS's own
> runs on BGTS's own repositories. What remains absent is any claim about how the engine
> performs on someone else's codebase.


user counts · repository
counts · enterprise customers · named production deployments · security guarantees · scalability
numbers · uptime · any supported language beyond the six · any MCP tool beyond the fourteen · any
claim about which AI models it works best with.

---

## 16. Launch blockers

| Item | Why | Action before publishing |
| --- | --- | --- |
| `github.com/bgts-ai-org/bgts-context-engine` returned 404 on 10 Sep 2026 | Primary CTA and ~10 links point there | Make the repository public, or repoint those links. **Still open.** |
| `docs/*.md`, `CONTRIBUTING.md`, `SECURITY.md` deep links | ✅ All verified present in the supplied archive | No action beyond making the repo public |
| Publishing the benchmark figures | Four internal reports are now quoted on the page | Confirm BGTS is content to publish, publicly: the \$56.54 / \$83.75 totals and per-task deltas; the 40 PR numbers referenced by number (#800, #808, #810, #827, #834, #839, #855); the target repository name and commit `cortex-web @ 6b31ba64`; the RunPod/vLLM serving details; the `cursor-grok-4.6-xhigh-fast` model name and CLI build string; and the cost-proxy price ratios. **Several of these name third-party products and an internal repository — treat as blocking.** |
| Publishing the UI walkthrough | The video shows BCE's own repository, including real symbol and test names | Confirm none of the visible symbol names are sensitive |
| `SECURITY.md` supported-versions table says `0.1.x` | Current release is `0.2.0` | Correct in the repo before launch (not shown on the site) |
| Contact form has no backend | It must never appear to send and then drop the message | Wire it to the BGTS endpoint, or keep the `mailto:` fallback that is currently implemented |
| KVKK text and processing basis | Legal | Confirm with BGTS that the corporate wording and privacy-notice link are correct for this microsite |
| Star count, download count | Not shown today | Keep them off, or wire to a live source — never hardcode |
