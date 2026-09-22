/* Brings the docs in line with self-hosted fonts.

   The page now makes ZERO third-party runtime requests, so every sentence
   that said "Google Fonts is the only external request" is false.

   Every replacement below asserts it matched. An earlier pass silently
   failed on a CRLF/LF mismatch and left a stale claim in README.md — a
   patch that does not verify itself is not a patch.

   node tools/patch-docs-fonts.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function edit(file, pairs) {
  const p = path.join(ROOT, file);
  let s = fs.readFileSync(p, 'utf8');
  const crlf = s.includes('\r\n');
  for (const [from, to] of pairs) {
    const f = crlf ? from.replace(/\n/g, '\r\n') : from;
    const t = crlf ? to.replace(/\n/g, '\r\n') : to;
    if (!s.includes(f)) {
      if (s.includes(t)) { console.log('  (zaten uygulanmis) ' + file + ': ' + from.slice(0, 45)); continue; }
      throw new Error(file + ': bulunamadi -> ' + from.slice(0, 70));
    }
    s = s.split(f).join(t);
    console.log('  ok  ' + file + ': ' + from.slice(0, 55).replace(/\n/g, ' '));
  }
  fs.writeFileSync(p, s, 'utf8');
}

edit('README.md', [
  [
    '`index.html`, no build step, no framework, no external dependency besides Google Fonts.',
    '`index.html`, no build step, no framework and **no third-party runtime request at all** —\nfonts and three.js are self-hosted under `assets/`.',
  ],
  [
    'walkthrough were base64 data URIs and are now real files, lazy-loaded. Google Fonts is the only\n  external request. The WebGL hero',
    'walkthrough were base64 data URIs and are now real files, lazy-loaded. The three font families\n  are self-hosted (latin + latin-ext, 238 KB, SIL OFL), so the page makes no cross-origin request\n  on the critical path — or on any path. The WebGL hero',
  ],
  [
    '| `assets/` | Extracted media (six UI screenshots, the walkthrough MP4 and its poster, the social card), the vendored three.js build, and `hero-gl.js`. `MANIFEST.json` records the sha256 of every extracted file. |',
    '| `assets/` | Extracted media (six UI screenshots, the walkthrough MP4 and its poster, the social card), the self-hosted fonts, the vendored three.js build, and `hero-gl.js`. `MANIFEST.json` and the two `PROVENANCE.json` files record the origin and sha256 of everything vendored. |',
  ],
]);

edit('BCE_SEO.md', [
  [
    '- Fonts are the only external request. CSS and the page\'s own JS are inline; images, the\n  walkthrough video and the vendored three.js build are same-origin files under `assets/`,\n  served immutable and cache-busted by a `?v=` handle',
    '- **There is no third-party request.** CSS and the page\'s own JS are inline; the three font\n  families, the images, the walkthrough video and the three.js build are all same-origin files\n  under `assets/`, served immutable and cache-busted by a `?v=` handle. Fonts are woff2,\n  latin + latin-ext only, with `font-display:swap` and the two families used above the fold\n  preloaded',
  ],
]);

console.log('\nREADME.md ve BCE_SEO.md guncellendi.');
