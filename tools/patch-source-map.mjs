/* Extends BCE_CONTENT_SOURCE_MAP.md for the Evidence section.

   The site's rule is that no claim exists on the page without a row here.
   The Evidence section roughly tripled the number of published numbers, so
   it needs four new sections, and three existing statements are now false
   and have to be corrected rather than left standing.

   node tools/patch-source-map.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MAP = path.join(ROOT, 'BCE_CONTENT_SOURCE_MAP.md');
let s = fs.readFileSync(MAP, 'utf8');
if (s.includes('## 13d. Evidence')) { console.log('already patched'); process.exit(0); }

/* ---- rename the old benchmark section and insert the new ones ---- */
s = s.replace('## 13b. Measured results — the benchmark section',
  '## 13b. Evidence — Layer 2b, the Claude agent A/B (five refactors)');

const NEW = `
## 13d. Evidence — Layer 1, retrieval replay (voyage-code-4)

| Claim on the site | Source |
| --- | --- |
| Method: 40 PRs indexed, 2 excluded by decision, 8 touch no symbol in the snapshot and are scored at file level, 30 scored, split 16 tune / 14 holdout | \`BENCH-VOY\` — scope section |
| Each PR is indexed at its own merge-base, so the engine never sees the future | \`BENCH-VOY\` — method, step 1 |
| Ground truth is the symbols and files the diff touched; tests and files the PR created are excluded | \`BENCH-VOY\` — method, step 3 |
| Both systems return 20 symbols; K=5/10/20 are cuts of one run | \`BENCH-VOY\` — method, step 4 |
| 83 ground-truth symbols; PRs are 1–8 code files, median 4 | \`BENCH-VOY\` — scope |
| Every published cell of the all-30, tune and holdout tables (recall, precision, F1, MRR, hit, file recall, file precision, with win–tie–loss) | \`BENCH-VOY\` — §3 result tables |
| Retention 100% on all three splits | \`BENCH-VOY\` — §3, §4.5 |
| Truth-loss table: semantic 16 (15/1/0), anchor 14 (12/2/0), expansion 20 (0/20/0), none 33 (0/0/33); median pool rank 75 | \`BENCH-VOY\` — "Doğrular nerede kayboldu" |
| Latency 733 → 1708 ms overall, 793 → 1681 ms on holdout | \`BENCH-VOY\` — §3 tables |
| Title-only variant: 7.9% → 7.9%, 0-30-0 | \`BENCH-VOY\` — §5.3 |
| File level over 37 PRs: 60.2% → 73.7% recall, 15.0% → 17.2% precision | \`BENCH-VOY\` — "Dosya seviyesi" |
| Named PRs #800, #827, #839, #855 and what happened in each | \`BENCH-VOY\` — §8 |
| K=5 loses on holdout because the list interleaves the model's ranks with the engine's scores | \`BENCH-VOY\` — §5.1 |

## 13e. Evidence — Layer 1, the jina profile

| Claim on the site | Source |
| --- | --- |
| Same 40 PRs, same splits, 84 ground-truth symbols | \`BENCH-JIN\` — scope |
| \`jinaai/jina-code-embeddings-1.5b\`, 1536 dimensions, vLLM on a RunPod GPU, bf16 | \`BENCH-JIN\` — header table, reproduction section |
| Engine constants are selected per model by a retrieval profile; the \`jina\` profile sets \`semantic_guard_ranks = 10\` and leaves the other two unchanged | \`BENCH-JIN\` — intro, §7 |
| Every published cell of the all-30, tune and holdout tables | \`BENCH-JIN\` — §3 |
| Retention 91.7% overall, 100% tune, 85.7% holdout | \`BENCH-JIN\` — §3, §4.4 |
| Truth-loss table: semantic 22 (19/3/0), anchor 12 (7/5/0), expansion 16 (0/16/0), none 34; median pool rank 64 | \`BENCH-JIN\` — "Doğrular nerede kayboldu" |
| The guard sweep at 0 / 5 / 7 / 10 / 15 with per-row all, tune, holdout and retention, and the note for each | \`BENCH-JIN\` — §7 sweep table |
| 10 was shipped although 7 scores higher overall and 0 scores higher on tune | \`BENCH-JIN\` — §7 |
| jina alone outperforms voyage alone (25.7 vs 16.9 at K=20; 30.8 vs 21.4 on holdout) | \`BENCH-JIN\` — §7 three-run comparison |
| Named PRs #808 (the only retention loss), #810, #834, #839 | \`BENCH-JIN\` — §8 |
| Latency 1.32 → 2.42 s overall, of which ~0.85 s is the engine | \`BENCH-JIN\` — §4.6 |
| The guard costs recall at K=5 and K=10 on the tune half | \`BENCH-JIN\` — §5.1 |

## 13f. Evidence — Layer 2a, Cursor agent benchmark v2

| Claim on the site | Source |
| --- | --- |
| 14 tasks, 28 runs, one machine, one account, same model, arms alternated per task | \`BENCH-CUR2\` — environment |
| \`cursor-grok-4.6-xhigh-fast\`, Cursor CLI \`2026.09.18-9a7762b\`, target repo \`cortex-web @ 6b31ba64\` | \`BENCH-CUR2\` — environment |
| One MCP tool (\`get_context_for_task\`), K=20, jina-code-embeddings-1.5b, context computed once and prepended: ~5.5k characters, ~1.3k tokens, 1.6 s | \`BENCH-CUR2\` — configuration |
| Confidence \`high\` on 7 of 14; the agent called the MCP tool twice in 14 runs | \`BENCH-CUR2\` — §2 |
| All sixteen aggregate rows with ratio, per-task median and tasks won | \`BENCH-CUR2\` — §2 table |
| Cost proxy = uncached input ×1 + cache read ×0.25 + output ×2.5; relative, not a currency amount | \`BENCH-CUR2\` — §2 footnote 1 |
| Totals 10.45M → 8.38M tokens, 1632 → 1471 s | \`BENCH-CUR2\` — §1, §3 |
| Automated checks 72/73 plain vs 73/73 with the engine; the failure is \`IntegrationSelector.tsx\` TS2345 on T09 | \`BENCH-CUR2\` — §3 code quality |
| Expected-file recall 1.00 and precision 0.73 in both arms; 21 files touched on T07 by both | \`BENCH-CUR2\` — §2, §4 T07 |
| All fourteen per-task rows: time, tokens, turns, tool calls, search output, files changed, checks, confidence | \`BENCH-CUR2\` — §4 |
| The seven patterns, including "the engine does not fix scope" and "confidence correlates weakly" | \`BENCH-CUR2\` — §5 |
| The four scores (6→8, 6.5→7, 7.5→8.5, 6.7→7.8), labelled on the page as judgement rather than measurement | \`BENCH-CUR2\` — §1 |
| T15 was not started: preflight measured a 17 s round trip and refused; its plain arm had no pair | \`BENCH-CUR2\` — stopping reason |

## 13g. Evidence — the withdrawn v1 comparison

| Claim on the site | Source |
| --- | --- |
| An earlier comparison showed the engine 7% worse on tokens | \`BENCH-CUR1\`, as summarised in \`BENCH-CUR2\` §1 |
| The cause was two machines routing to different model backends with different prompt-cache behaviour — 3.9k vs 7.1k uncached input per turn — not the engine | \`BENCH-CUR2\` — §1 "v1'e göre ne değişti" |
| Pre-context was also compressed from ~15k to ~5.5k characters and the rule text clarified | \`BENCH-CUR2\` — same paragraph |

`;
s = s.replace('\n## 13c. Facts added from the repository documentation', NEW + '\n## 13c. Facts added from the repository documentation');

/* ---- correct the statements the Evidence section falsifies ---- */
s = s.replace(
  'performance benchmarks · latency figures · accuracy or recall figures · user counts · repository\ncounts',
  'user counts · repository\ncounts');
s = s.replace(
  'None of the following appears anywhere on the site, because no source supports it:',
  `None of the following appears anywhere on the site, because no source supports it:

> **Amended.** Performance, latency and recall figures *were* on this list. The Evidence
> section now publishes all three, sourced in §13b and §13d–§13g and labelled as BGTS's own
> runs on BGTS's own repositories. What remains absent is any claim about how the engine
> performs on someone else's codebase.
`);

/* ---- extend the launch blocker, which now covers three more reports ---- */
s = s.replace(
  '| Publishing the benchmark figures | The report is an internal document; the site now quotes its headline numbers and dollar totals | Confirm BGTS is content to publish $56.54 / $83.75 and the per-task deltas publicly |',
  `| Publishing the benchmark figures | Four internal reports are now quoted on the page | Confirm BGTS is content to publish, publicly: the \\$56.54 / \\$83.75 totals and per-task deltas; the 40 PR numbers referenced by number (#800, #808, #810, #827, #834, #839, #855); the target repository name and commit \`cortex-web @ 6b31ba64\`; the RunPod/vLLM serving details; the \`cursor-grok-4.6-xhigh-fast\` model name and CLI build string; and the cost-proxy price ratios. **Several of these name third-party products and an internal repository — treat as blocking.** |`);

fs.writeFileSync(MAP, s);
console.log('BCE_CONTENT_SOURCE_MAP.md extended: +4 sections, 3 corrections');
