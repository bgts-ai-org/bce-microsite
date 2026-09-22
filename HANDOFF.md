# HANDOFF

Bu dosya, depoda çalışacak bir sonraki kişi (ya da ajan) içindir. `index.html`'i elle
düzenlemeden önce okuyun.

---

## 1. Sert kurallar

**`index.html` üretilmiş bir dosyadır. Elle düzenlemeyin.**

Kaynaklar `tools/evidence/` altında; `index.html` onlardan üretiliyor. Elle yapılan bir
düzenleme bir sonraki build'de sessizce kaybolur.

**Dosya saf CRLF'tir** (0 çıplak LF). İki düzenleme yöntemi onu sessizce bozar:

| Yöntem | Ne olur |
| --- | --- |
| `sed -i` (Git Bash'te GNU sed) | Tüm dosyayı LF'e çevirir → 2 satırlık değişiklik 4.500 satırlık sahte diff olur |
| `String.replace(a, b)` — `b` bir **string** ise | `$$`, `$&`, `` $` ``, `$'` özel desen sayılır. Sayfanın kendi `$$(selector)` yardımcısını sessizce `$`'a çevirir: sorunsuz parse eder, sadece bir tıklama işleyicisi çalışınca patlar. |

### Aynı depoda paralel oturum çalıştırmayın

Bu depoda iki ajan oturumu aynı anda çalıştı: biri Kanıt bölümünü ve varlık ayrıştırmayı,
diğeri Gmail destekli iletişim formunu yazdı. İkisi de `serve.js`'e ve `index.html`'e dokundu.
Bu sefer temiz birleşti ve ikinci oturum her iki işi tek commit'te (`e082190`) push etti —
ama bu şans eseriydi. `index.html` üretilmiş bir dosya olduğu için eşzamanlı düzenleme
sessiz kayıpla sonuçlanabilir.

Biri çalışıyorsa diğeri beklesin, ya da ayrı dal kullanın.

**Doğrusu:** utf8 oku, `\r\n` ile böl, `\r\n` ile birleştir, `.replace()`'e **fonksiyon** ver,
yazmadan önce `if (/[^\r]\n/.test(out)) throw` ile doğrula. `tools/` altındaki script'lerin
hepsi bunu yapıyor — yenisini yazmak yerine onları genişletin.

---

## 2. Yeniden inşa

```bash
node tools/build.mjs           # tek komut — doğru sırayı kendisi bilir
node tools/build.mjs --check   # CI: index.html kaynaklarla senkron mu?
```

Zincir dört adımdır ve sıra `tools/build.mjs` içinde kayıtlıdır:

| # | Adım | Sahiplendiği bölge |
| --- | --- | --- |
| 1 | `build-evidence` | `#evidence` bölümü, kendi CSS bloğu, kendi script bloğu |
| 2 | `build-hero-gl` | hero sahnesi, hero CSS'i, WebGL adası |
| 3 | `patch-head` | `<head>` — yerelleştirilmiş fontlar, tek `<title>` |
| 4 | `patch-contact-form` | `#contact` — forma `/api/contact` bağlar |

**1 mutlaka 2'den önce gelmeli:** `build-evidence` CSS bloğunu hero bayrağına kadar yeniden
yazar, `build-hero-gl` de onu hemen geri koyar.

**3 ve 4 birer migration'dır** — kendi çıktısını tespit edip sessizce atlarlar. Hiçbir build
adımının sahiplenmediği bölgelere (`<head>`, `#contact`) dokundukları için zincirde dururlar;
temel bir dosyadan tam yeniden üretimi mümkün kılan şey budur.

**Doğrulanmış:**

- Dört adım da idempotent — ikinci çalıştırma **byte-aynı** sonuç verir.
- Varlık çıkarma sonrası temel dosyadan tam zincir, commit edilmiş `index.html`'i
  **byte-aynı** yeniden üretir.
- Build adımları `#contact` bölgesine dokunmaz; iletişim formu yaması hayatta kalır
  (deneyle doğrulandı, varsayım değil).

Zincirde **olmayan** tek seferlik script'ler — tükettikleri veri artık yok ya da ağ gerekiyor:
`extract-assets`, `patch-media`, `fetch-fonts`, `fetch-vendor`.

Tek seferlik, tekrar çalıştırılması gerekmeyen script'ler:

| Script | Ne yaptı |
| --- | --- |
| `extract-assets.mjs` | 9 base64 yükü `assets/` altına çıkardı (3,09 MB → 418 KB). `--verify` ile sha256 doğrulaması yapılabilir. |
| `patch-media.mjs` | Ekran görüntüsü ve videoya intrinsic boyut verdi, videoyu IntersectionObserver arkasına aldı |
| `fetch-vendor.mjs` | three.js 0.186.0'ı `assets/vendor/` altına indirdi |
| `fetch-fonts.mjs` | Üç yazı tipi ailesini `assets/fonts/` altına indirdi |
| `patch-head.mjs` | Fontları `<head>`'e taşıdı, `<body>` içindeki fazla `<title>`'ı sildi |
| `patch-source-map.mjs`, `patch-docs.mjs`, `patch-docs-fonts.mjs` | Dokümanları güncelledi |

---

## 3. Mimari

```
tools/evidence/evidence-data.js      <- TÜM rakamlar. Tek kaynak, Object.freeze'li.
tools/evidence/evidence-section.html <- bölüm markup'ı
tools/evidence/evidence.css          <- grafik stilleri
tools/evidence/evidence-charts.js    <- 5 SVG grafik
tools/hero-gl.js  ==  assets/hero-gl.js   <- ikisi senkron tutulmalı
```

> ⚠️ `tools/hero-gl.js` düzenlendiğinde `assets/hero-gl.js`'e **kopyalanmalıdır**
> (`cp tools/hero-gl.js assets/hero-gl.js`). Build script'i bunu yapmıyor.

Sayfadaki her bileşen `window.__BCE` üzerinden çalışır: `RUN, HERO, drawGraph, el, h, L, $, $$,
RM, EDGE_STYLE, applyLang, readLang`. Dil değişiminde `document` üzerinde `bce:lang` olayı
tetiklenir ve ~12 bileşen kendini yeniden çizer. Yeni bileşen aynı deseni izlemelidir.

Tema değişimi olay **tetiklemez** — `data-theme` özniteliği ayarlanır. WebGL katmanı bunun için
`MutationObserver` kullanıyor.

---

## 4. Rakamların kaynağı

`evidence-data.js` içindeki her sayı dört ölçüm raporundan gelir ve
`BCE_CONTENT_SOURCE_MAP.md` §13b–§13g'de kaynağıyla eşlenmiştir.

Şema: `metrics[bölüm][metrik][K] = [model, model+motor, kazanç, berabere, kayıp]`

- Sabit beşli demet, bir grafiğin model değerini yanlış sisteme çizmesini imkânsız kılar.
- **Olmayan bir K dürüst bir boşluktur** — rapor o hücreyi yayımlamamıştır. Grafik kesikli
  çerçeveli "veri yok" kutusu çizer. **Asla ara değer uydurmayın.**
- W-T-L `null` olabilir: raporların 6. bölüm tabloları değeri verir ama PR bazlı dökümü vermez.
  Grafik o zaman şeridi çizmez. `0-30-0` uydurmak yanlış olur.

İç tutarlılık kontrolü (her değişiklikten sonra koşulabilir):
`(16 × tune + 14 × holdout) / 30` **=** `all-30`. voyage ve jina için ondalık hassasiyetle tutar.

---

## 5. Test

```bash
node serve.js          # http://localhost:8080
```

Faydalı URL'ler: `?lang=tr` · `?webgl=off` · `#evidence`

Görsel/etkileşim testi için headless Chrome:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless --disable-gpu \
  --no-sandbox --hide-scrollbars --window-size=1440,1750 --virtual-time-budget=9000 \
  --screenshot=out.png "http://localhost:8080/"
```

Etkileşim testi deseni: `index.html`'i bir iframe'e al, `window.onerror`'u yakala, kontrollere
`.click()` at, sonucu `<pre>`'ye yaz, `--dump-dom` ile oku.

**Bilinen sınır:** `--virtual-time-budget` zamanlayıcıları ileri sardığı için kare süresi /
jank ölçümü headless'ta anlamsızdır. Motion regresyonları gerçek tarayıcıda gözle kontrol
edilmelidir.

**Bilinen ve düzeltilmeyen:** 320 piksel genişlikte 12 piksel yatay taşma. Commit edilmiş
HEAD'de de birebir aynı — bu çalışmadan gelmiyor.

---

## 6. Yayın öncesi — BLOCKER

Sayfa artık dört iç ölçüm raporunu yayımlıyor. Aşağıdakiler **kamuya açılmadan önce onay
gerektirir** (ayrıntı: `BCE_CONTENT_SOURCE_MAP.md` §16):

- `$56.54 / $83.75` toplamları ve görev bazlı yüzdeler
- 40 pull request'in numarayla anılması (#800, #808, #810, #827, #834, #839, #855)
- Hedef depo adı ve commit'i: `cortex-web @ 6b31ba64`
- RunPod / vLLM sunum ayrıntıları
- `cursor-grok-4.6-xhigh-fast` model adı ve Cursor CLI build string'i
- Maliyet vekilindeki fiyat oranları

Bunların birkaçı **iç bir depoyu ve üçüncü taraf ürünleri** adlandırıyor.

Ayrıca hâlâ açık: `github.com/bgts-ai-org/bgts-context-engine` public değil (birincil CTA dahil
~10 link), `https://bgts.com/bce/` yer tutucu origin.

---

## 7. Bilerek yapılmayanlar

| İş | Neden |
| --- | --- |
| **Scroll döngüsü birleştirme** (6 dinleyici → 1 read/write hattı) | Gerçek kazanç layout thrashing'i bitirmekte, bu da her callback'i read ve write fazlarına bölmeyi gerektirir — sayfanın en ayırt edici özelliği olan motion'ı yeniden yazmak demek. Headless'ta kare süresi ölçülemediği için "aynı görünüyor" diye doğrulanamaz. Ölçülmemiş bir kazanç için çalışan motion kodunu riske atmak doğru takas değil. Gerçek tarayıcıda profil çıkarıp karar verin. |
| **Journey bölümüne scroll-scrub kamera** | Yeni bir özellik, kalan bir adım değil. `graphState(stage)` fonksiyonu hazır, sticky sahne + tek renderer ile yapılabilir. Aynı doğrulama sorunu geçerli. |
| **Grafiklerin portre mobil düzeni** | 640 px altında grafik paneli yatay kayıyor — sitenin `.canvas-wrap` ile zaten yaptığı takas. Portreye çevirmek daha iyi olurdu; 880 birimlik viewBox'ı 320 px'e sığdırmak 4 piksellik etiket demek. |
| **Gerçek graf export'u** (`assets/graph/bce-self.json`) | BCE'den 1,5k sembol + 4,9k kenar dışa aktarılırsa hero "provenance düzlemleri" versiyonuna yükseltilebilir: scip / treesitter / heuristic ayrı katmanlarda. Veri olmadan uydurmak, sayfanın kendi tezini çürütürdü. |

---

## 8. Durum

`e082190` ile hepsi `origin/main`'e push edildi (46 dosya, +6.276 / −93). O commit iki
oturumun işini birlikte taşıyor; `Co-Authored-By` satırı yalnızca birini anıyor.

`index.html` 419 KB (öncesi 3,09 MB). Üçüncü taraf çalışma-zamanı isteği: **sıfır**.

Gizli bilgi taraması yapıldı: `lib/gmail.js` kimlik bilgilerini yalnızca `process.env`'den
okuyor, `.env` `.gitignore`'da ve takip edilmiyor, commit genelinde sabit kodlanmış token yok.
