/* One-off asset surgery for index.html.
   Node >= 18, zero dependencies. Never runs at serve time.

     node tools/extract-assets.mjs --extract   # write assets/, touch nothing else
     node tools/extract-assets.mjs --rewrite   # edit index.html in place
     node tools/extract-assets.mjs --verify    # re-hash assets/ against MANIFEST.json

   index.html is pure CRLF. Every read/write here preserves that byte for byte;
   a stray LF would produce a 4584-line diff and hide the real change. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'index.html');
const ASSETS = path.join(ROOT, 'assets');
const MANIFEST = path.join(ASSETS, 'MANIFEST.json');

/* Where each inlined key lands on disk. `social` is deliberately absent: it is
   defined in __BCE_ASSETS but never read (the #opensource card carries its own
   separate inline copy), so it is dropped rather than extracted. */
const MAP = {
  semantic:  'ui/02-semantic.webp',
  anchors:   'ui/03-anchors.webp',
  expansion: 'ui/04-expansion.webp',
  scoring:   'ui/05-scoring.webp',
  narrowing: 'ui/06-narrowing.webp',
  result:    'ui/07-result.webp',
  poster:    'walkthrough-poster.webp',
  video:     'walkthrough.mp4',
};
const DROP = ['social'];
const OG_OUT = 'og-card.webp';
const CACHE_BUST = 'v=1';

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const read = () => fs.readFileSync(HTML, 'utf8');

function lines(src) {
  if (src.includes('\n') && !src.includes('\r\n')) throw new Error('expected CRLF source');
  return src.split('\r\n');
}

/* Magic-byte check. A silent base64 truncation would otherwise ship a corrupt
   file that still looks plausible on disk. */
function sniff(buf, kind) {
  if (kind === 'image/webp') {
    return buf.slice(0, 4).toString('latin1') === 'RIFF'
        && buf.slice(8, 12).toString('latin1') === 'WEBP';
  }
  if (kind === 'video/mp4') return buf.slice(4, 8).toString('latin1') === 'ftyp';
  return false;
}

/* --- locate the two payload sites, by content, never by line index --- */
function findAssetBlock(L) {
  const open = L.findIndex((l) => l.includes('window.__BCE_ASSETS={'));
  if (open < 0) throw new Error('__BCE_ASSETS block not found');
  let close = -1;
  for (let i = open + 1; i < L.length && i - open <= 40; i++) {
    if (/^\};<\/script>/.test(L[i])) { close = i; break; }
  }
  if (close < 0) throw new Error('__BCE_ASSETS terminator not found');
  return { open, close };
}

function parseEntries(L, open, close) {
  const out = [];
  const re = /^\s*(\w+)\s*:\s*"data:(image\/webp|video\/mp4);base64,([A-Za-z0-9+/=]+)"\s*,?\s*$/;
  for (let i = open + 1; i < close; i++) {
    const m = re.exec(L[i]);
    if (!m) throw new Error('unparsed line ' + (i + 1) + ' inside __BCE_ASSETS');
    out.push({ line: i, key: m[1], kind: m[2], b64: m[3] });
  }
  return out;
}

/* The #opensource social card: its own inline data URI on its own line.
   Matched on the src attribute, so the inline SVG favicon is untouched. */
function findOgImg(L) {
  const re = /src="data:image\/webp;base64,([A-Za-z0-9+/=]+)"/;
  const i = L.findIndex((l) => re.test(l));
  if (i < 0) throw new Error('inline og card <img> not found');
  return { line: i, b64: re.exec(L[i])[1] };
}

function extract() {
  const L = lines(read());
  const { open, close } = findAssetBlock(L);
  const entries = parseEntries(L, open, close);
  const og = findOgImg(L);

  const manifest = {};
  let written = 0;
  let dropped = 0;

  const emit = (rel, b64, kind) => {
    const buf = Buffer.from(b64, 'base64');
    if (!sniff(buf, kind)) throw new Error(rel + ': decoded bytes are not ' + kind);
    const abs = path.join(ASSETS, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, buf);
    if (sha(fs.readFileSync(abs)) !== sha(buf)) throw new Error(rel + ': round-trip mismatch');
    manifest[rel] = { bytes: buf.length, sha256: sha(buf), type: kind };
    written += buf.length;
    console.log('  ' + rel.padEnd(28) + String(buf.length).padStart(9) + ' B');
  };

  console.log('extracting:');
  for (const e of entries) {
    if (DROP.includes(e.key)) {
      dropped += Buffer.from(e.b64, 'base64').length;
      console.log('  ' + (e.key + ' (dropped, unused)').padEnd(28));
      continue;
    }
    if (!MAP[e.key]) throw new Error('no destination mapped for key "' + e.key + '"');
    emit(MAP[e.key], e.b64, e.kind);
  }
  emit(OG_OUT, og.b64, 'image/webp');

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log('\n  ' + written + ' B written to assets/, ' + dropped + ' B dropped as unused');
}

function rewrite() {
  const src = read();
  const L = lines(src);
  const { open, close } = findAssetBlock(L);
  const entries = parseEntries(L, open, close);
  const og = findOgImg(L);

  for (const e of entries) {
    if (!DROP.includes(e.key) && !fs.existsSync(path.join(ASSETS, MAP[e.key]))) {
      throw new Error('run --extract first: assets/' + MAP[e.key] + ' is missing');
    }
  }

  /* The global survives as a path map, so the consumer that does
     img.src = A[sh.k] needs no change at all -- a URL substitutes for a data
     URI transparently. ?v= is the cache-bust handle; bump it on any re-export. */
  const keys = Object.entries(MAP);
  const body = keys
    .map(([k, rel], i) => '  ' + k + ':"assets/' + rel + '?' + CACHE_BUST + '"'
      + (i < keys.length - 1 ? ',' : ''))
    .join('\r\n');

  const head = [
    '<script>/* Extracted by tools/extract-assets.mjs. Paths, not payloads:',
    '   these were inlined base64 until they made the document 3.1 MB.',
    '   Byte-for-byte provenance in assets/MANIFEST.json. */',
    'window.__BCE_ASSETS={',
  ].join('\r\n');

  const block = head + '\r\n' + body + '\r\n};</script>';
  const out = L.slice(0, open).concat([block], L.slice(close + 1));

  out[og.line] = out[og.line].replace(
    /src="data:image\/webp;base64,[A-Za-z0-9+/=]+"/,
    'src="assets/' + OG_OUT + '?' + CACHE_BUST + '"');

  const next = out.join('\r\n');

  /* Post-conditions. Abort before writing rather than leave a broken page. */
  if (next.length > 420000) throw new Error('result still ' + next.length + ' B -- extraction did not take');
  const leftovers = next.match(/;base64,/g) || [];
  if (leftovers.length !== 0) throw new Error(leftovers.length + ' base64 payload(s) remain');
  if (!/data:image\/svg\+xml/.test(next)) throw new Error('inline SVG favicon was clobbered');
  if (next.includes('\n') && !next.includes('\r\n')) throw new Error('line endings changed');

  fs.writeFileSync(HTML, next, 'utf8');
  const pct = ((1 - next.length / src.length) * 100).toFixed(1);
  console.log('index.html  ' + src.length + ' B -> ' + next.length + ' B  (-' + pct + '%)');
}

function verify() {
  const man = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  let bad = 0;
  for (const [rel, rec] of Object.entries(man)) {
    const buf = fs.readFileSync(path.join(ASSETS, rel));
    const ok = buf.length === rec.bytes && sha(buf) === rec.sha256;
    if (!ok) bad++;
    console.log('  ' + (ok ? 'ok  ' : 'FAIL') + ' ' + rel);
  }
  if (bad) { console.error(bad + ' file(s) do not match MANIFEST.json'); process.exit(1); }
  console.log('all ' + Object.keys(man).length + ' assets match MANIFEST.json');
}

const mode = process.argv[2];
if (mode === '--extract') extract();
else if (mode === '--rewrite') rewrite();
else if (mode === '--verify') verify();
else { console.error('usage: extract-assets.mjs --extract | --rewrite | --verify'); process.exit(2); }
