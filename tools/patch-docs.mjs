/* Brings README.md and BCE_SEO.md back in line with what the site now is:
   no longer a single self-contained file, and no longer quoting one
   benchmark run.

   node tools/patch-docs.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const wr = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);

/* ---------------- README ---------------- */
let r = rd('README.md');

r = r.replace(
  'This microsite is the product\'s landing page: one\n`index.html`, no build step, no framework, no external dependency besides Google Fonts.',
  `This microsite is the product's landing page: one \`index.html\`, no build step, no framework
and no third-party runtime — three.js is vendored into \`assets/vendor/\` rather than pulled
from a CDN, and Google Fonts is the only external request.`);

r = r.replace(
  '| `index.html` | The site. Complete `<head>`, inline CSS and JS, images and video as data URIs. |',
  `| \`index.html\` | The site. Complete \`<head>\`, inline CSS and JS; media and the renderer live in \`assets/\`. |
| \`assets/\` | Extracted media (six UI screenshots, the walkthrough MP4 and its poster, the social card), the vendored three.js build, and \`hero-gl.js\`. \`MANIFEST.json\` records the sha256 of every extracted file. |
| \`tools/\` | One-off, zero-dependency Node scripts that produced the above. Committed for reproducibility; none of them runs at serve time. |
| \`serve.js\` | Local preview server. Correct MIME types and byte-range support, so the video seeks. |`);

/* The old "everything is inlined" performance note is now false. */
r = r.replace(
  '- **Performance**: Google Fonts is the only external request; everything else is inlined.',
  `- **Performance**: \`index.html\` is ~410 KB, down from 3.1 MB — the screenshots and the 1.7 MB
  walkthrough were base64 data URIs and are now real files, lazy-loaded. Google Fonts is the only
  external request. The WebGL hero is never fetched before \`load\`, and not at all on a phone, a
  metered connection, a low-memory device, a software rasteriser, or with reduced motion set.`);

r = r.replace(
  '| Benchmark figures | The "Measured results" section publishes dollar totals and per-task deltas from an internal A/B report — confirm they\'re cleared for public release. |',
  `| Benchmark figures | The "Evidence" section publishes four internal measurement runs: dollar totals and per-task deltas, 40 pull requests referenced by number, a target repository name and commit, serving details, and third-party model and CLI build strings. Confirm all of it is cleared for public release — see §16 of \`BCE_CONTENT_SOURCE_MAP.md\`. |`);

/* Evidence deserves a line in About, since it is now the page's main claim. */
r = r.replace(
  '> **No model in the retrieval path. Same task, same answer.**',
  `> **No model in the retrieval path. Same task, same answer.**

The page's **Evidence** section publishes four measurement runs interactively — two 40-pull-request
retrieval replays (against \`voyage-code-4\` and \`jina-code-embeddings-1.5b\`) and two agent A/B
studies (Cursor with \`grok-4.6\`, and Claude \`opus-5\`) — including every result where the engine
lost.`);

wr('README.md', r);

/* ---------------- BCE_SEO.md ---------------- */
let s = rd('BCE_SEO.md');

s = s.replace(
  '- Fonts are the only external request; everything else — images, video, CSS, JS — is inline',
  `- Fonts are the only external request. CSS and the page's own JS are inline; images, the
  walkthrough video and the vendored three.js build are same-origin files under \`assets/\`,
  served immutable and cache-busted by a \`?v=\` handle
- Every chart in the Evidence section carries its numbers twice: as an SVG with \`role="img"\`,
  a \`<title>\` and a generated \`<desc>\`, and as a real \`<table>\` with \`<caption>\` and
  \`th[scope]\` inside a \`<details>\`. No figure is the only place a number appears
- The WebGL hero is \`aria-hidden\`; when it is live the SVG hero is hidden with \`visibility\`,
  not \`opacity\`, so its focusable nodes leave the tab order rather than becoming invisible
  focus stops. A visually-hidden paragraph describes the graph in both languages`);

s = s.replace(
  '| Item | Action |\n| --- | --- |\n| Repository is not public |',
  '| Item | Action |\n| --- | --- |\n| Benchmark figures | Four internal reports are now quoted. Confirm public release — see §16 of `BCE_CONTENT_SOURCE_MAP.md` |\n| Repository is not public |');

wr('BCE_SEO.md', s);
console.log('README.md and BCE_SEO.md updated');
