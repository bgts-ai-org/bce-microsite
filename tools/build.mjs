/* index.html'i kaynaklardan yeniden uretir.
   Regenerates index.html from its sources.

   Tek giris noktasi. Sira onemlidir ve burada kayitlidir; ezberden
   calistirmayin.

   One entry point. The order matters and is recorded here rather than in
   somebody's memory:

     1. build-evidence   — the Evidence section, its CSS and its scripts
     2. build-hero-gl    — the hero stage, its CSS and the WebGL island
                           (must follow 1: build-evidence rewrites the CSS
                           block up to the hero banner, and this puts it back)
     3. patch-head       — self-hosted fonts into <head>, one <title>
     4. patch-contact-form — wires the contact form to POST /api/contact

   3 ve 4 birer migration'dir: kendi sonuclarini tespit edip atlarlar, ve
   #contact / <head> bolgelerine dokunurlar — bunlari hicbir build adimi
   sahiplenmez. Zincirde durmalari, temel bir dosyadan tam yeniden uretimi
   mumkun kilar.

   3 and 4 are migrations: they detect their own output and skip. They touch
   <head> and #contact, which no build step owns. Keeping them in the chain
   is what makes a full rebuild from the committed base reproduce the page.

   extract-assets, patch-media, fetch-fonts ve fetch-vendor bu zincirde
   DEGILDIR: onlar tek seferliktir (tukettikleri base64 artik yok, ya da ag
   erisimi gerektirir).

   Hepsi idempotenttir: ikinci calistirma byte-ayni sonuc verir.
   All three are idempotent: a second run produces a byte-identical file.

     node tools/build.mjs            # build
     node tools/build.mjs --check    # build, then fail if anything changed

   --check, bir degisikligin yeniden uretilip uretilmedigini dogrular; CI
   icin. --check verifies index.html is in sync with tools/ — for CI, or
   before a commit.
*/
import { readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'index.html');
const CHECK = process.argv.includes('--check');

const STEPS = ['build-evidence.mjs', 'build-hero-gl.mjs', 'patch-head.mjs', 'patch-contact-form.mjs'];

const before = readFileSync(HTML);

for (const s of STEPS) {
  process.stdout.write('  ' + s.replace('.mjs', '').padEnd(20));
  try {
    const out = execFileSync(process.execPath, [path.join(ROOT, 'tools', s)], {
      cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(out.trim().split('\n').pop() || 'ok');
  } catch (e) {
    console.log('FAILED');
    process.stderr.write((e.stderr || e.message || '') + '\n');
    process.exit(1);
  }
}

const after = readFileSync(HTML);

/* Line endings are the one thing every step can silently destroy, so the
   chain checks once at the end rather than trusting each step. */
const text = after.toString('utf8');
if (/[^\r]\n/.test(text)) throw new Error('bare LF in index.html — a step broke CRLF');

const titles = (text.match(/<title>/g) || []).length;
if (titles !== 1) throw new Error('expected exactly one bare <title>, found ' + titles);
if (text.includes('fonts.googleapis.com')) throw new Error('a Google Fonts reference reappeared');
if (text.includes(';base64,')) throw new Error('a base64 payload reappeared');

const changed = !before.equals(after);
console.log('\nindex.html ' + after.length + ' B — ' + (changed ? 'guncellendi / updated' : 'degisiklik yok / unchanged'));

if (CHECK && changed) {
  writeFileSync(path.join(ROOT, 'index.html.expected'), after);
  console.error('\n--check: index.html kaynaklarla senkron degildi.');
  console.error('--check: index.html was out of sync with tools/. It has been regenerated;');
  console.error('         review the diff and commit it.');
  try { unlinkSync(path.join(ROOT, 'index.html.expected')); } catch {}
  process.exit(1);
}
