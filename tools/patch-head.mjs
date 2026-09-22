/* Moves font loading into <head> and self-hosts it.

   Three separate defects in the same four lines:
     1. A second <title> sits inside <body>, shorter and worse than the real
        one in <head>. Two <title> elements is invalid and the wrong one can
        win.
     2. The stylesheet <link> and both <link rel=preconnect> are inside
        <body>, after </head> — a render-blocking stylesheet discovered late.
     3. It points at two third-party origins, which contradicts the page's
        own "no external dependency" claim and costs two DNS+TLS handshakes
        before a glyph can paint.

   node tools/patch-head.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'index.html');
let src = fs.readFileSync(HTML, 'utf8');
if (!src.includes('\r\n')) throw new Error('expected CRLF source');
const before = src.length;

const OLD = [
  '<title>BGTS Context Engine</title>',
  '<link rel="preconnect" href="https://fonts.googleapis.com">',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
  '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap">',
].join('\r\n');

if (src.includes(OLD)) {
  /* Remove the block and the newline that followed it. */
  src = src.replace(OLD + '\r\n', () => '');
} else if (!src.includes('assets/fonts/fonts.css')) {
  throw new Error('the in-body font block was not found and fonts are not self-hosted yet');
}

/* Into <head>, before the critical inline CSS so the cascade order is
   unchanged: families are declared, then the design system uses them. */
const ANCHOR = '<style>:root{color-scheme:light}';
const NEW = [
  '<!-- Self-hosted; see tools/fetch-fonts.mjs. Same origin, immutable,',
  '     latin + latin-ext only. No third-party request on the critical path. -->',
  '<link rel="preload" href="assets/fonts/inter-var-latin.woff2?v=1" as="font" type="font/woff2" crossorigin>',
  '<link rel="preload" href="assets/fonts/archivo-var-latin.woff2?v=1" as="font" type="font/woff2" crossorigin>',
  '<link rel="stylesheet" href="assets/fonts/fonts.css?v=1">',
  ANCHOR,
].join('\r\n');

if (!src.includes('assets/fonts/fonts.css')) {
  if (!src.includes(ANCHOR)) throw new Error('critical CSS anchor not found');
  src = src.replace(ANCHOR, () => NEW);
}

if (/[^\r]\n/.test(src)) throw new Error('line endings changed');
const titles = (src.match(/<title>/g) || []).length;
if (titles !== 1) throw new Error('expected exactly one <title>, found ' + titles);
if (src.includes('fonts.googleapis.com') || src.includes('fonts.gstatic.com')) {
  throw new Error('a Google Fonts reference survived');
}

fs.writeFileSync(HTML, src, 'utf8');
console.log('index.html  ' + before + ' -> ' + src.length + '  (one <title>, fonts self-hosted in <head>)');
