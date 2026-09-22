/* ============================================================
   EVIDENCE — every published number from the four measurement
   runs, in one frozen object.

   Shape rules, enforced here so charts cannot get them wrong:
     metrics[split][metric][K] = [baseline, bce, wins, ties, losses]
   A fixed tuple means a figure can never plot a baseline value
   against the wrong system. An absent K is an honest hole: the
   report did not publish that cell, and charts must render a gap
   rather than interpolate one.

   Every narrative string sits beside the number it describes, so
   a bce:lang repaint re-reads this object instead of a parallel
   string table that could drift away from it.

   Sources: BENCH-VOY, BENCH-JIN, BENCH-CUR2, BENCH-CUR1, BENCH-CLD
   (see BCE_CONTENT_SOURCE_MAP.md §13b-§13f).
   ============================================================ */
var EVIDENCE = {
  meta: { k: [5, 10, 20], splits: ["holdout", "tune", "all"] },

  /* ---------------- Layer 1 — the 40-PR replay ---------------- */
  replay: {
    method: {
      indexed: 40, excluded: 2, fileOnly: 8, scored: 30,
      tune: 16, holdout: 14, returned: 20,
      filesMedian: 4, filesRange: [1, 8], targetsRange: [1, 9]
    },

    models: {
      voyage: {
        label: "voyage-code-4",
        serving: { en: "hosted API", tr: "barındırılan API" },
        truths: 83,
        guardRanks: 0,
        latency: { all: [733, 1708], holdout: [793, 1681] },
        retention: { all: 100, tune: 100, holdout: 100 },
        metrics: {
          holdout: {
            recall:  { 5: [17.9, 8.3, 1, 10, 3], 10: [17.9, 27.4, 2, 12, 0], 20: [21.4, 35.9, 4, 10, 0] },
            hit:     { 10: [28.6, 35.7, 1, 13, 0], 20: [35.7, 57.1, 3, 11, 0] },
            frecall: { 5: [43.5, 48.2, null, null, null], 10: [48.6, 72.2, 6, 8, 0], 20: [56.2, 78.6, 6, 8, 0] },
            prec:    { 10: [2.9, 5.0, 2, 12, 0] },
            fprec:   { 20: [14.7, 19.7, 9, 4, 1] },
            mrr:     { 10: [0.086, 0.064, 1, 9, 4], 20: [0.090, 0.078, 4, 6, 4] }
          },
          tune: {
            recall:  { 5: [6.2, 15.6, 2, 14, 0], 10: [9.9, 27.1, 3, 12, 1], 20: [13.0, 37.5, 6, 10, 0] },
            hit:     { 20: [31.2, 56.2, 4, 12, 0] },
            frecall: { 20: [55.7, 60.9, 4, 11, 1] },
            mrr:     { 10: [0.156, 0.200, 4, 11, 1], 20: [0.159, 0.211, 6, 9, 1] }
          },
          all: {
            recall:  { 5: [11.7, 12.2, 3, 24, 3], 10: [13.6, 27.2, 5, 24, 1], 20: [16.9, 36.8, 10, 20, 0] },
            hit:     { 5: [23.3, 23.3, null, null, null], 10: [26.7, 36.7, 4, 25, 1], 20: [33.3, 56.7, 7, 23, 0] },
            frecall: { 10: [49.1, 63.1, 12, 15, 3], 20: [56.0, 69.2, 10, 19, 1] },
            prec:    { 10: [3.3, 5.7, 5, 24, 1], 20: [2.2, 4.5, 10, 20, 0] },
            fprec:   { 20: [15.0, 17.3, 17, 7, 6] },
            f1:      { 20: [3.7, 7.7, 10, 20, 0] },
            mrr:     { 10: [0.123, 0.137, 5, 20, 5], 20: [0.127, 0.149, 10, 15, 5] }
          }
        },
        loss: {
          k: 20, medianPoolRank: 75,
          channels: [
            { id: "semantic",  truths: 16, returned: 15, narrowed: 1,  never: 0 },
            { id: "anchor",    truths: 14, returned: 12, narrowed: 2,  never: 0 },
            { id: "expansion", truths: 20, returned: 0,  narrowed: 20, never: 0 },
            { id: "none",      truths: 33, returned: 0,  narrowed: 0,  never: 33 }
          ]
        },
        notable: [
          { pr: 800, split: "tune", note: { en: "voyage returned nothing. The engine found the target from a name in the task text.", tr: "voyage hiçbir şey getirmedi. Motor hedefi görev metnindeki bir addan buldu." } },
          { pr: 855, split: "holdout", note: { en: "3 of 4 truths (75%) against voyage's 0. File recall went 40% to 100%.", tr: "4 doğrunun 3'ü (%75), voyage'da 0. Dosya recall %40'tan %100'e çıktı." } },
          { pr: 827, split: "all", loss: true, note: { en: "The only K=10 loss: voyage found it at rank 6, the engine placed it in the 11-20 band. Equal at K=20.", tr: "K=10'daki tek kayıp: voyage 6. sırada buldu, motor 11-20 bandına koydu. K=20'de eşit." } },
          { pr: 839, split: "holdout", loss: true, note: { en: "A K=5 loss. voyage ranked it 3rd-5th, the engine 7th-9th. Equal again at K=10.", tr: "K=5 kaybı. voyage 3.-5. sırada, motor 7.-9.'da. K=10'da yine eşit." } }
        ]
      },

      jina: {
        label: "jina-code-embeddings-1.5b",
        serving: { en: "open source, vLLM on a RunPod GPU, bf16", tr: "açık kaynak, RunPod GPU üzerinde vLLM, bf16" },
        truths: 84,
        guardRanks: 10,
        latency: { all: [1320, 2420], holdout: [1210, 2370] },
        engineShareMs: 850,
        retention: { all: 91.7, tune: 100, holdout: 85.7 },
        metrics: {
          holdout: {
            recall:  { 5: [11.9, 11.5, 1, 12, 1], 10: [19.8, 20.6, 1, 13, 0], 20: [30.8, 34.9, 2, 11, 1] },
            hit:     { 5: [21.4, 28.6, 1, 13, 0], 10: [35.7, 35.7, 0, 14, 0], 20: [50.0, 57.1, 2, 11, 1] },
            frecall: { 5: [46.9, 52.9, null, null, null], 10: [54.9, 57.9, 2, 12, 0], 20: [66.5, 77.8, 4, 10, 0] },
            prec:    { 10: [4.3, 5.0, 1, 13, 0], 20: [3.6, 4.3, 2, 11, 1] },
            fprec:   { 20: [17.7, 22.0, 7, 3, 4] },
            mrr:     { 5: [0.143, 0.155, 1, 12, 1], 10: [0.165, 0.165, 1, 12, 1], 20: [0.175, 0.177, 3, 8, 3] }
          },
          tune: {
            recall:  { 5: [6.8, 3.6, 0, 15, 1], 10: [19.3, 16.2, 0, 15, 1], 20: [21.3, 41.1, 5, 11, 0] },
            hit:     { 10: [31.2, 25.0, 0, 15, 1], 20: [31.2, 56.2, 4, 12, 0] },
            frecall: { 20: [63.5, 64.1, 2, 12, 2] },
            prec:    { 20: [2.2, 4.4, 5, 11, 0] },
            mrr:     { 10: [0.095, 0.079, 0, 15, 1], 20: [0.095, 0.101, 4, 11, 1] }
          },
          all: {
            recall:  { 5: [9.2, 7.3, 1, 27, 2], 10: [19.5, 18.2, 1, 28, 1], 20: [25.7, 38.2, 7, 22, 1] },
            hit:     { 5: [20.0, 20.0, null, null, null], 10: [33.3, 30.0, 0, 29, 1], 20: [40.0, 56.7, 6, 23, 1] },
            frecall: { 10: [52.6, 56.2, 4, 25, 1], 20: [64.9, 70.5, 6, 22, 2] },
            prec:    { 10: [4.0, 4.0, 1, 28, 1], 20: [2.8, 4.3, 7, 22, 1] },
            fprec:   { 20: [19.9, 21.1, 15, 5, 10] },
            f1:      { 20: [4.8, 7.5, 7, 22, 1] },
            mrr:     { 10: [0.128, 0.119, 1, 27, 2], 20: [0.132, 0.137, 7, 19, 4] }
          }
        },
        loss: {
          k: 20, medianPoolRank: 64,
          channels: [
            { id: "semantic",  truths: 22, returned: 19, narrowed: 3,  never: 0 },
            { id: "anchor",    truths: 12, returned: 7,  narrowed: 5,  never: 0 },
            { id: "expansion", truths: 16, returned: 0,  narrowed: 16, never: 0 },
            { id: "none",      truths: 34, returned: 0,  narrowed: 0,  never: 34 }
          ]
        },
        /* The sweep that chose semantic_guard_ranks. Engine-only rerun,
           the model's own lists held fixed. The value shipped (10) is not
           the best on the half it was fitted on -- that is the point. */
        guard: {
          chosen: 10, baselineHoldout: 30.8,
          rows: [
            { g: 0,  all: 35.7, tune: 42.7, hold: 27.8, ret: 83, note: { en: "voyage's own constants. On the holdout the engine falls below the model it is supposed to improve.", tr: "voyage'ın kendi sabitleri. Holdout'ta motor, iyileştirmesi gereken modelin altına düşüyor." } },
            { g: 5,  all: 35.7, tune: 42.7, hold: 27.8, ret: 83, note: { en: "No change: the truths being dropped sit at ranks 7 to 15, so protecting 5 protects nothing.", tr: "Değişim yok: düşen doğrular 7.-15. sıralarda, dolayısıyla 5'i korumak hiçbir şeyi korumuyor." } },
            { g: 7,  all: 38.7, tune: 42.7, hold: 34.1, ret: 88, note: { en: "Highest overall figure of the sweep, but weaker than 10 on holdout K=10 and on retention.", tr: "Taramanın en yüksek genel değeri, ama holdout K=10'da ve retention'da 10'un gerisinde." } },
            { g: 10, all: 38.2, tune: 41.1, hold: 34.9, ret: 92, chosen: true, note: { en: "Shipped. Not the best on the tuned half — the only setting that beats the model at every K on the holdout.", tr: "Yayımlanan. Ayarlandığı yarıda en iyisi değil — holdout'ta her K'da modeli geçen tek ayar." } },
            { g: 15, all: 30.2, tune: 37.0, hold: 22.4, ret: 89, note: { en: "Collapse. Five slots left for the engine is not enough to add anything.", tr: "Çöküş. Motora kalan beş slot bir şey eklemeye yetmiyor." } }
          ]
        },
        notable: [
          { pr: 839, split: "holdout", note: { en: "Found by jina at rank 7. With voyage's constants the engine dropped it entirely (100% to 0). The guard holds it at slot 7. Half the holdout difference is this one PR.", tr: "jina 7. sırada buldu. voyage sabitleriyle motor onu tamamen düşürmüştü (%100'den 0'a). Guard 7. slotta tutuyor. Holdout farkının yarısı bu tek PR." } },
          { pr: 808, split: "holdout", loss: true, note: { en: "The only retention loss. jina found it at rank 13, outside the guard's 10; the engine pushed it past 50 and it left the list. 25% to 0.", tr: "Tek retention kaybı. jina 13. sırada buldu, guard'ın 10'unun dışında; motor onu 50'nin ötesine itti ve listeden çıktı. %25'ten 0'a." } },
          { pr: 834, split: "holdout", note: { en: "Nine truths. jina placed two at ranks 6 and 14; the engine moved them to 3 and 9. MRR 0.17 to 0.33.", tr: "Dokuz doğru. jina ikisini 6. ve 14. sıraya koydu; motor 3. ve 9.'ya taşıdı. MRR 0.17'den 0.33'e." } },
          { pr: 810, split: "all", loss: true, note: { en: "jina found it at rank 4; the engine placed it at slot 13 because the container quota pierced the guard. Equal at K=20, a loss at K=10.", tr: "jina 4. sırada buldu; kapsayıcı kotası guard'ı deldiği için motor 13. slota koydu. K=20'de eşit, K=10'da kayıp." } }
        ]
      }
    },

    /* The 37-PR view, including the 8 PRs whose diff touches no symbol
       in the snapshot. A file is still an answer. */
    fileLevel: {
      voyage: { recall: [60.2, 73.7, 11, 25, 1], prec: [15.0, 17.2, 20, 8, 9] },
      jina:   { recall: [70.2, 74.7, 6, 29, 2],  prec: [19.1, 20.9, 22, 5, 10] }
    },

    /* Deliberately not built as a control: the result is no difference. */
    titleOnly: { voyage: [7.9, 7.9, 0, 30, 0], jina: [10.7, 11.5, 1, 29, 0] }
  },

  /* ---------------- Layer 2a — Cursor + grok, 14 tasks ---------------- */
  cursor: {
    meta: {
      tasks: 14, runs: 28,
      model: "cursor-grok-4.6-xhigh-fast",
      cli: "2026.09.18-9a7762b",
      repo: "cortex-web @ 6b31ba64",
      k: 20, embed: "jina-code-embeddings-1.5b",
      preContext: { chars: 5500, tokens: 1300, seconds: 1.6, highConfidence: 7 },
      mcpCalls: 2,
      totals: { tokens: [10.45, 8.38], seconds: [1632, 1471] },
      checks: [72, 73, 73],
      precision: 0.73
    },
    scores: { cost: [6, 8], time: [6.5, 7], quality: [7.5, 8.5], overall: [6.7, 7.8] },

    /* group: which band of F4 the row belongs to; shown = in the chart,
       the rest live in the numbers table only. */
    agg: [
      { id: "grep",    group: "search", shown: true,  plain: 93.9,  mcp: 50.3,  ratio: 0.54, med: 0.52, won: 11, unit: "KB", label: { en: "grep / glob output", tr: "grep / glob çıktısı" } },
      { id: "toolout", group: "search", shown: true,  plain: 168,   mcp: 117,   ratio: 0.70, med: 0.74, won: 11, unit: "KB", label: { en: "tool output, total", tr: "araç çıktısı, toplam" } },
      { id: "tools",   group: "search", shown: true,  plain: 62.2,  mcp: 53.1,  ratio: 0.85, med: 0.86, won: 10, label: { en: "tool calls", tr: "araç çağrısı" } },
      { id: "reads",   group: "search", shown: false, plain: 66.2,  mcp: 59.2,  ratio: 0.89, med: 1.03, won: 7,  unit: "KB", label: { en: "file reads", tr: "dosya okuma" } },
      { id: "files",   group: "search", shown: false, plain: 11.7,  mcp: 12.0,  ratio: 1.02, med: 1.00, won: null, label: { en: "distinct files read", tr: "okunan farklı dosya" } },

      { id: "input",   group: "cost", shown: true,  plain: 110600, mcp: 85300, ratio: 0.77, med: 0.89, won: 8,  label: { en: "uncached input tokens", tr: "cache'siz girdi token" } },
      { id: "tokens",  group: "cost", shown: true,  plain: 746000, mcp: 598000, ratio: 0.80, med: 0.95, won: 8, label: { en: "total tokens", tr: "toplam token" } },
      { id: "proxy",   group: "cost", shown: true,  plain: 0.29,   mcp: 0.23,  ratio: 0.80, med: 0.94, won: 8,  label: { en: "cost proxy", tr: "maliyet vekili" } },
      { id: "cache",   group: "cost", shown: false, plain: 625000, mcp: 504000, ratio: 0.81, med: 0.91, won: 10, label: { en: "cache reads", tr: "cache okuma" } },
      { id: "output",  group: "cost", shown: false, plain: 10800,  mcp: 9000,  ratio: 0.84, med: 0.96, won: 8,  label: { en: "output tokens", tr: "çıktı token" } },
      { id: "ctx",     group: "cost", shown: false, plain: 38700,  mcp: 37700, ratio: 0.97, med: 1.00, won: 7,  label: { en: "context per turn", tr: "tur başına bağlam" } },

      { id: "added",   group: "work", shown: true,  plain: 52,    mcp: 40,    ratio: 0.77, med: 1.00, won: null, label: { en: "lines added", tr: "eklenen satır" } },
      { id: "turns",   group: "work", shown: true,  plain: 15.0,  mcp: 13.1,  ratio: 0.87, med: 0.91, won: 10, label: { en: "model turns", tr: "model turu" } },
      { id: "time",    group: "work", shown: true,  plain: 116.6, mcp: 105.1, ratio: 0.90, med: 1.06, won: 4,  unit: "s", label: { en: "wall clock", tr: "süre" } },
      { id: "deleted", group: "work", shown: false, plain: 15.5,  mcp: 12,    ratio: 0.78, med: 1.00, won: null, label: { en: "lines deleted", tr: "silinen satır" } },
      { id: "changed", group: "work", shown: false, plain: 5.43,  mcp: 5.21,  ratio: 0.96, med: 1.00, won: null, label: { en: "files changed", tr: "değişen dosya" } }
    ],

    /* verdict: win | slight | tie | lossSlight | loss  (from the engine's side) */
    tasks: [
      { id: "T01", verdict: "win", kind: "bugfix", conf: "high",
        title: { en: "raw fetch path exits on 401 without refreshing the token", tr: "raw fetch yolu 401'de token yenilemeden çıkıyor" },
        plain: { s: 200, tok: 655000, turns: 16, tools: 51, search: 89, files: 2, add: 181, del: 10, checks: [4, 4] },
        mcp:   { s: 112, tok: 442000, turns: 12, tools: 34, search: 62, files: 2, add: 182, del: 8,  checks: [4, 4] },
        why: { en: "Pre-context named httpClient.ts's raw, refreshAccessToken and tokenStorage with line numbers. The agent wandered four turns less.", tr: "Ön-bağlam httpClient.ts'teki raw, refreshAccessToken ve tokenStorage'ı satır numarasıyla verdi. Ajan dört tur daha az dolaştı." } },
      { id: "T02", verdict: "tie", kind: "refactor", conf: "high",
        title: { en: "all access-token reads must go through tokenStorage", tr: "tüm access-token okumaları tokenStorage'dan geçmeli" },
        plain: { s: 46, tok: 221000, turns: 8, tools: 36, search: 70, files: 5, checks: [4, 4] },
        mcp:   { s: 47, tok: 216000, turns: 8, tools: 38, search: 36, files: 5, checks: [4, 4] },
        why: { en: "Search output halved, turn count identical. The agent already finished in eight turns.", tr: "Arama çıktısı yarıya indi, tur sayısı aynı. Ajan zaten sekiz turda bitiriyordu." } },
      { id: "T03", verdict: "lossSlight", kind: "i18n", conf: "medium",
        title: { en: "workspace list toasts are hardcoded Turkish", tr: "workspace listesi toast'ları sabit Türkçe" },
        plain: { s: 65, tok: 323000, turns: 10, tools: 34, search: 77, files: 3, checks: [4, 4] },
        mcp:   { s: 79, tok: 365000, turns: 11, tools: 36, search: 39, files: 3, checks: [4, 4] },
        why: { en: "The code graph holds no en.json or tr.json — it indexes code, not JSON — so the agent had to search for them anyway.", tr: "Kod grafı en.json veya tr.json tutmaz — kodu indeksler, JSON'u değil — bu yüzden ajan onları yine de aramak zorunda kaldı." } },
      { id: "T04", verdict: "win", kind: "dedup", conf: "low",
        title: { en: "task draft page duplicates the shared API error helper", tr: "task draft sayfası paylaşılan API hata yardımcısını kopyalıyor" },
        plain: { s: 103, tok: 370000, turns: 11, tools: 36, search: 79, files: 3, add: 42, del: 34, checks: [4, 4] },
        mcp:   { s: 74,  tok: 167000, turns: 7,  tools: 24, search: 5,  files: 3, add: 34, del: 20, checks: [4, 4] },
        why: { en: "Despite low confidence the pre-context named the right files. The agent searched almost not at all — 5 KB against 79 KB.", tr: "Güven düşük olmasına rağmen ön-bağlam doğru dosyaları verdi. Ajan neredeyse hiç arama yapmadı — 79 KB'a karşı 5 KB." } },
      { id: "T05", verdict: "lossSlight", kind: "feature", conf: "high",
        title: { en: "restore the Prompt Library page", tr: "Prompt Library sayfasını geri getir" },
        plain: { s: 71, tok: 420000, turns: 13, tools: 46, search: 57, files: 3, checks: [6, 6] },
        mcp:   { s: 80, tok: 450000, turns: 12, tools: 40, search: 79, files: 3, checks: [6, 6] },
        why: { en: "The agent called the MCP tool a second time and searched more rather than less. Same result either way.", tr: "Ajan MCP aracını ikinci kez çağırdı ve daha az değil daha çok arama yaptı. Sonuç her iki kolda da aynı." } },
      { id: "T06", verdict: "tie", kind: "routing", conf: "high",
        title: { en: "cost management is unreachable from the sidebar", tr: "cost management sidebar'dan erişilemiyor" },
        plain: { s: 64, tok: 304000, turns: 12, tools: 36, search: 32, files: 4, checks: [5, 5] },
        mcp:   { s: 58, tok: 312000, turns: 11, tools: 38, search: 47, files: 4, checks: [5, 5] },
        why: { en: "Six seconds faster, 3% more tokens. Nothing separates the two arms.", tr: "Altı saniye hızlı, %3 fazla token. İki kolu ayıran bir şey yok." } },
      { id: "T07", verdict: "tie", kind: "feature", conf: "high",
        title: { en: "a new run state, TIMED_OUT, end to end", tr: "yeni run durumu TIMED_OUT, uçtan uca" },
        plain: { s: 268, tok: 2970000, turns: 36, tools: 184, search: 186, files: 21, add: 69, del: 22, checks: [8, 8] },
        mcp:   { s: 290, tok: 2740000, turns: 35, tools: 193, search: 97,  files: 21, add: 68, del: 29, checks: [8, 8] },
        why: { en: "The most expensive task in the set for both arms. Six files were expected; both touched 21. The engine does not fix scope.", tr: "Setin iki kolda da en pahalı görevi. Altı dosya bekleniyordu; ikisi de 21 dosyaya dokundu. Motor kapsamı düzeltmiyor." } },
      { id: "T08", verdict: "tie", kind: "bugfix", conf: "high",
        title: { en: "stopped runs stay 'running' in the Activity Monitor", tr: "durdurulan run'lar Activity Monitor'da 'running' kalıyor" },
        plain: { s: 57, tok: 249000, turns: 9,  tools: 35, search: 67, files: 2, checks: [5, 5] },
        mcp:   { s: 61, tok: 278000, turns: 10, tools: 30, search: 28, files: 2, checks: [5, 5] },
        why: { en: "12% more tokens, 58% less search output. A wash.", tr: "%12 fazla token, %58 az arama çıktısı. Başabaş." } },
      { id: "T09", verdict: "win", kind: "feature", conf: "low",
        title: { en: "Zabbix monitoring integration", tr: "Zabbix monitoring entegrasyonu" },
        plain: { s: 338, tok: 2860000, turns: 31, tools: 143, search: 215, files: 12, add: 262, del: 25, checks: [5, 6] },
        mcp:   { s: 205, tok: 1300000, turns: 18, tools: 74,  search: 103, files: 9,  add: 124, del: 10, checks: [6, 6] },
        why: { en: "The clearest difference in the set. The plain arm shipped code that does not compile — TFunction passed to an incompatible parameter, TS2345. The engine arm found the existing integration pattern and copied it: half the time, half the tokens, half the code, clean tsc.", tr: "Setin en belirgin farkı. Sade kol derlenmeyen kod üretti — TFunction uyumsuz bir parametreye geçirildi, TS2345. Motor kolu mevcut entegrasyon desenini bulup kopyaladı: yarı süre, yarı token, yarı kod, temiz tsc." } },
      { id: "T10", verdict: "slight", kind: "feature", conf: "medium",
        title: { en: "Slack preference for cancelled runs, plus the shared settings type", tr: "iptal edilen run'lar için Slack tercihi ve paylaşılan ayar tipi" },
        plain: { s: 102, tok: 540000, turns: 17, tools: 49, search: 40, files: 2, add: 35, del: 46, checks: [5, 5] },
        mcp:   { s: 119, tok: 461000, turns: 14, tools: 39, search: 33, files: 2, add: 10, del: 24, checks: [5, 5] },
        why: { en: "The plain arm rewrote the settings type; the engine arm extended the existing one. 10 added lines against 35 — a smaller, safer change, 17 seconds slower.", tr: "Sade kol ayar tipini yeniden yazdı; motor kolu mevcut tipi genişletti. 35'e karşı 10 eklenen satır — daha küçük, daha güvenli bir değişiklik, 17 saniye yavaş." } },
      { id: "T11", verdict: "lossSlight", kind: "dedup", conf: "medium",
        title: { en: "one file-size formatter, across eleven files", tr: "tek dosya-boyutu biçimlendirici, on bir dosyada" },
        plain: { s: 145, tok: 652000, turns: 16, tools: 101, search: 43, files: 11, add: 64, del: 61, checks: [5, 5] },
        mcp:   { s: 152, tok: 738000, turns: 17, tools: 95,  search: 26, files: 11, add: 67, del: 60, checks: [5, 5] },
        why: { en: "A 'find every copy' task. K=20 cannot hold eleven files, so the agent greps for the rest and pays both costs.", tr: "'Her kopyayı bul' tipi bir görev. K=20 on bir dosyayı tutamaz, ajan kalanı için grep'e döner ve iki maliyeti birden öder." } },
      { id: "T12", verdict: "slight", kind: "ui", conf: "medium",
        title: { en: "the flow designer canvas should use a full-bleed surface", tr: "flow designer kanvası full-bleed yüzey kullanmalı" },
        plain: { s: 67, tok: 352000, turns: 11, tools: 39, search: 264, files: 1, checks: [3, 3] },
        mcp:   { s: 78, tok: 278000, turns: 10, tools: 37, search: 26,  files: 1, checks: [3, 3] },
        why: { en: "A single grep for 'surface' returned 190 KB in the plain arm. The engine arm went straight to the component. Identical four-line diff.", tr: "Sade kolda tek bir 'surface' grep'i 190 KB döndürdü. Motor kolu doğrudan bileşene gitti. Aynı dört satırlık diff." } },
      { id: "T13", verdict: "loss", kind: "i18n", conf: "high",
        title: { en: "HTTP fallback error messages ignore the UI language", tr: "HTTP fallback hata mesajları arayüz dilini yok sayıyor" },
        plain: { s: 63, tok: 316000, turns: 11, tools: 60, search: 42,  files: 4, checks: [6, 6] },
        mcp:   { s: 70, tok: 444000, turns: 10, tools: 50, search: 113, files: 4, checks: [6, 6] },
        why: { en: "The engine's worst task: 40% more tokens. Pre-context pointed at the right file, but the agent still ran two broad greps — i18n imports at 34 KB and Turkish error strings at 41 KB. Confidence was high and it was wrong.", tr: "Motorun en kötü görevi: %40 fazla token. Ön-bağlam doğru dosyayı gösterdi ama ajan yine iki geniş grep yaptı — 34 KB i18n importları, 41 KB Türkçe hata metinleri. Güven yüksekti ve yanıldı." } },
      { id: "T14", verdict: "slight", kind: "feature", conf: "low",
        title: { en: "map two new auth error codes", tr: "iki yeni auth hata kodunu eşle" },
        plain: { s: 43, tok: 207000, turns: 9, tools: 21, search: 55, files: 3, checks: [8, 8] },
        mcp:   { s: 45, tok: 184000, turns: 8, tools: 16, search: 10, files: 3, checks: [8, 8] },
        why: { en: "11% fewer tokens, 82% less searching, identical diff.", tr: "%11 az token, %82 az arama, aynı diff." } }
    ],

    patterns: [
      { id: "scale",      en: "The gain scales with the size of the task. Above 150 seconds the engine cuts 40% or more; below 60 seconds it is neutral or a few seconds behind. A fixed 1.6 s and 1.3k tokens per turn does not amortise on small work.", tr: "Kazanç görevin büyüklüğüyle ölçekleniyor. 150 saniyenin üstünde motor %40 ve fazlasını kesiyor; 60 saniyenin altında nötr ya da birkaç saniye geride. Sabit 1,6 s ve tur başına 1,3k token küçük işlerde amorti olmuyor." },
      { id: "habit",      en: "Search output halves but the turn count falls only 13%. The agent opens the file it was handed and then greps anyway, out of habit.", tr: "Arama çıktısı yarıya iniyor ama tur sayısı yalnızca %13 düşüyor. Ajan kendisine verilen dosyayı açıyor ve sonra alışkanlıkla yine grep atıyor." },
      { id: "locale",     en: "The code graph does not see locale or JSON files, so i18n tasks go the wrong way.", tr: "Kod grafı locale ve JSON dosyalarını görmüyor, bu yüzden i18n görevleri ters yöne gidiyor." },
      { id: "k20",        en: "K=20 is not enough for 'find every copy' tasks. The pre-context shows some of the eleven files; the agent greps for the rest and both costs stack.", tr: "K=20, 'her kopyayı bul' görevleri için yetmiyor. Ön-bağlam on bir dosyanın bir kısmını gösteriyor; ajan kalanı için grep'e dönüyor ve iki maliyet üst üste biniyor." },
      { id: "diff",       en: "The quality gain is diff economy: the same checks passed with 23% fewer lines, and one compile error avoided, because the agent finds the existing pattern instead of reinventing it.", tr: "Kalite kazancı diff ekonomisinde: aynı kontroller %23 daha az satırla geçildi ve bir derleme hatasından kaçınıldı; çünkü ajan mevcut deseni yeniden icat etmek yerine buluyor." },
      { id: "scope",      en: "The engine does not fix scope. Expected-file precision is 0.73 in both arms and both touched 21 files on T07. That needs a rule, not retrieval.", tr: "Motor kapsamı düzeltmiyor. Beklenen dosya hassasiyeti iki kolda da 0,73 ve T07'de ikisi de 21 dosyaya dokundu. Bunun için getirme değil, kural gerekiyor." },
      { id: "confidence", en: "The confidence label correlates weakly with the outcome. The two low-confidence tasks are the engine's best; the worst was labelled high. Confidence measures anchor overlap, not sufficiency for the task.", tr: "Güven etiketi sonuçla zayıf ilişkili. İki düşük güvenli görev motorun en iyileri; en kötüsü yüksek etiketliydi. Güven, çıpa örtüşmesini ölçüyor; görev için yeterliliği değil." }
    ],

    stopped: { at: "T15", en: "Preflight measured a 17-second round trip to the embedding server and refused to start the run. T15's plain arm finished but had no pair, so it was excluded. A stopping rule that fired is worth more than a fifteenth task.", tr: "Preflight, embedding sunucusuna 17 saniyelik bir gidiş-dönüş ölçtü ve koşuyu başlatmadı. T15'in sade kolu bitti ama eşi olmadığı için değerlendirmeye alınmadı. Ateşlenen bir durma kuralı, on beşinci bir görevden değerlidir." },

    v1: { en: "An earlier comparison showed the engine 7% worse on tokens. The cause was two machines routing to different model backends with different prompt-cache behaviour — 3.9k against 7.1k uncached input per turn — not the engine. On one machine the difference vanished. It is recorded here because a benchmark that publishes only the run that worked is not a benchmark.", tr: "Daha önceki bir karşılaştırma motoru tokende %7 geride göstermişti. Sebep, iki makinenin farklı model arka uçlarına yönlenmesi ve farklı prompt-cache davranışıydı — tur başına 3,9k'ya karşı 7,1k cache'siz girdi — motor değil. Tek makinede fark ortadan kalktı. Burada kayıtlı, çünkü yalnızca işe yarayan koşuyu yayımlayan bir ölçüm, ölçüm değildir." }
  },

  /* ---------------- Layer 2b — the earlier Claude run ---------------- */
  claude: {
    meta: { model: "claude-opus-5", tasks: 5, date: "2026-09-04" },
    perTask: [
      { id: "hard-1",  cost: 183,  time: 134, llm: 94,  lost: true },
      { id: "hard-2",  cost: -28,  time: -31, llm: -19 },
      { id: "hard-3",  cost: -30,  time: -7,  llm: -25 },
      { id: "xhard-1", cost: -34,  time: -19, llm: -50 },
      { id: "xhard-2", cost: -47,  time: -49, llm: -59 }
    ],
    exclHard1: { cost: -39, llm: -41 }
  }
};
if (Object.freeze) Object.freeze(EVIDENCE);
