/* Splices the Evidence section into index.html.

   The site has no build step and must keep working as one file, so this
   runs once, by hand, and its output is committed. Re-running it is safe:
   it detects an already-spliced page and replaces the section in place.

   node tools/build-evidence.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'index.html');
const SRC = path.join(ROOT, 'tools', 'evidence');

const crlf = (s) => s.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n').replace(/\r\n$/, '');
const part = (f) => crlf(fs.readFileSync(path.join(SRC, f), 'utf8'));

let src = fs.readFileSync(HTML, 'utf8');
if (!src.includes('\r\n')) throw new Error('expected CRLF source');
const before = src.length;

/* ---- 1. the section itself ---------------------------------------- */
const section = part('evidence-section.html');
const startRe = /<section class="sec sec-band" id="(?:benchmark|evidence)" aria-labelledby="(?:bm|ev)-h">/;
const m = startRe.exec(src);
if (!m) throw new Error('benchmark/evidence section not found');
const from = m.index;
const endMark = '\r\n</section>';
const to = src.indexOf(endMark, from);
if (to < 0) throw new Error('section terminator not found');
src = src.slice(0, from) + section + src.slice(to + endMark.length);

/* ---- 2. CSS, appended to the single <style> block ------------------ */
/* Must be a string that actually occurs in evidence.css. The banner is a
   box comment, so the marker sits on its own line and is NOT preceded by
   the opening slash-star — getting this wrong makes the script append the
   stylesheet again on every re-run instead of replacing it. */
const CSS_MARK = '   EVIDENCE — charts.';
const css = part('evidence.css');
/* Every replacement below goes through a function. A replacement STRING
   treats $$, $&, $` and $' as substitution patterns, which silently turns
   every $$ selector in the injected JS into $ — the kind of corruption
   that parses fine and fails only when a handler runs. */
if (src.includes(CSS_MARK)) {
  /* Stop at the hero-stage banner as well as at </style>. build-hero-gl.mjs
     appends its own block after this one, and a match that ran to </style>
     would swallow it — silently, and only visibly if that script is not
     re-run afterwards. */
  src = src.replace(
    new RegExp('\\r\\n/\\* =+\\r\\n   EVIDENCE — charts\\.[\\s\\S]*?(?=\\r\\n/\\* =+\\r\\n   HERO STAGE|\\r\\n</style>)'),
    () => '\r\n' + css);
} else {
  src = src.replace('\r\n</style>', () => '\r\n' + css + '\r\n</style>');
}

/* ---- 3. data + charts, as two new scripts before </body> ----------- */
const data = part('evidence-data.js');
const charts = part('evidence-charts.js');
const block =
  '<script>\r\n' + data + '\r\n</script>\r\n\r\n' +
  '<script>\r\n' + charts + '\r\n</script>\r\n';
const BLOCK_START = '<script>\r\n/* ============================================================\r\n   EVIDENCE — every published number';
if (src.includes('EVIDENCE — every published number')) {
  const s = src.indexOf(BLOCK_START);
  const e = src.indexOf('</script>', src.indexOf('EVIDENCE — figures.')) + '</script>\r\n'.length;
  if (s < 0 || e < 0) throw new Error('could not locate the existing evidence scripts');
  src = src.slice(0, s) + block + src.slice(e);
} else {
  src = src.replace('\r\n</body>', () => '\r\n' + block + '\r\n</body>');
}

/* ---- 4. links, nav and scroll-spy ---------------------------------- */
const rewires = [
  /* the two in-page links that pointed at the old fragment */
  { from: '<li><a href="#benchmark" data-i18n data-en="Measured results" data-tr="Ölçüm sonuçları">Measured results</a></li>',
    to:   '<li><a href="#evidence" data-i18n data-en="Evidence" data-tr="Kanıt">Evidence</a></li>' },
  /* scroll-spy group membership */
  { from: 'integrations:["integrations","comparison","benchmark"]',
    to:   'integrations:["integrations","comparison","evidence"]' },
];
for (const r of rewires) {
  if (src.includes(r.from)) src = src.replace(r.from, () => r.to);
  else if (!src.includes(r.to)) throw new Error('rewire target not found: ' + r.from.slice(0, 60));
}

/* The hero fact still advertised one agent run. The headline claim is now
   retrieval quality, measured twice on two models. Replaced whole, so the
   text node a JS-off reader sees matches the attributes. */
const heroOld = '<li><a href="#benchmark" style="color:var(--accent)"><span data-i18n data-en="measured: −32.5% cost" data-tr="ölçüldü: −%32,5 maliyet">measured: −32.5% cost</span></a></li>';
const heroNew = '<li><a href="#evidence" style="color:var(--accent)"><span data-i18n data-en="measured: 2× recall, −20% tokens" data-tr="ölçüldü: 2× recall, −%20 token">measured: 2× recall, −20% tokens</span></a></li>';
if (src.includes(heroOld)) src = src.replace(heroOld, () => heroNew);
else if (!src.includes(heroNew)) throw new Error('hero fact link not found');

if (/[^\r]\n/.test(src)) throw new Error('line endings changed');
fs.writeFileSync(HTML, src, 'utf8');
console.log('index.html  ' + before + ' B -> ' + src.length + ' B  (+' + (src.length - before) + ')');
