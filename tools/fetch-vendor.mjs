/* Vendors the pinned three.js build into assets/vendor/.

   The page's whole identity is "no external dependency besides Google Fonts".
   Acquiring a hard runtime dependency on a third-party CDN to draw a hero
   would trade that for nothing: the bytes are the same, and self-hosting
   removes a DNS lookup, a TLS handshake, a CDN outage class, an SRI problem
   and a privacy surface.

   The upstream URLs stay recorded here as provenance.

     node tools/fetch-vendor.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VERSION = '0.186.0';
const BASE = 'https://cdn.jsdelivr.net/npm/three@' + VERSION + '/';
const OUT = path.join(ROOT, 'assets', 'vendor', 'three-' + VERSION);

/* three.module.min.js imports ./three.core.min.js as a sibling, so both
   files must land side by side or the relative import 404s. */
const FILES = ['build/three.module.min.js', 'build/three.core.min.js'];

fs.mkdirSync(OUT, { recursive: true });
const manifest = { version: VERSION, source: BASE, files: {} };

/* jsDelivr minifies on the fly and does NOT rewrite import specifiers, so
   three.module.min.js still says `from"./three.core.js"` while the file
   beside it is named three.core.min.js. One specifier is retargeted here,
   recorded below, and nothing else in either file is touched. */
const PATCH = [{ file: 'three.module.min.js', from: 'from"./three.core.js"', to: 'from"./three.core.min.js"' }];

for (const f of FILES) {
  const url = BASE + f;
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + ' -> HTTP ' + res.status);
  let buf = Buffer.from(await res.arrayBuffer());
  const name = path.basename(f);
  const upstream = crypto.createHash('sha384').update(buf).digest('base64');

  const patches = [];
  for (const p of PATCH.filter((p) => p.file === name)) {
    let s = buf.toString('utf8');
    const n = s.split(p.from).length - 1;
    if (n === 0) throw new Error(name + ': expected to find ' + p.from);
    s = s.split(p.from).join(p.to);
    buf = Buffer.from(s, 'utf8');
    patches.push({ from: p.from, to: p.to, occurrences: n });
  }

  fs.writeFileSync(path.join(OUT, name), buf);
  manifest.files[name] = {
    bytes: buf.length, url,
    sha384_upstream: upstream,
    sha384_vendored: crypto.createHash('sha384').update(buf).digest('base64'),
    patches,
  };
  console.log('  ' + name.padEnd(26) + String(buf.length).padStart(8) + ' B'
    + (patches.length ? '   (' + patches.length + ' import specifier retargeted)' : ''));
}

fs.writeFileSync(path.join(OUT, 'PROVENANCE.json'), JSON.stringify(manifest, null, 2) + '\n');
console.log('\nthree.js ' + VERSION + ' vendored to assets/vendor/three-' + VERSION + '/');
console.log('MIT licensed, (c) 2010-2026 three.js authors.');
