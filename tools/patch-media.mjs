/* One-off follow-up to extract-assets.mjs.

   Extraction alone introduces a regression: the screenshot and the video used
   to arrive synchronously as data URIs, so their boxes were never empty. As
   network URLs they would pop in and shift the section. This gives both an
   intrinsic size and a real HTML src/poster, and defers only the 1.7 MB video
   payload behind an IntersectionObserver.

   Net effect for a JS-off reader: strictly better than before, because the
   screenshot and the poster frame now exist in the markup. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HTML = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), 'index.html');
let src = fs.readFileSync(HTML, 'utf8');
if (!src.includes('\r\n')) throw new Error('expected CRLF source');

const edits = [
  {
    name: 'shot-img: intrinsic size + default src',
    from: '          <img id="shot-img" alt="" style="width:100%;height:auto;display:block;border:1px solid var(--i-rule);border-radius:var(--r2)">',
    /* SHOTS defaults to idx 1 (Anchors) -- the HTML src must name the same
       frame the JS paints first, or the first swap is a visible flash. */
    to: [
      '          <img id="shot-img" width="1200" height="675" loading="lazy" decoding="async" fetchpriority="low"',
      '               src="assets/ui/03-anchors.webp?v=1"',
      '               alt="BCE Graph Explorer at the Anchors stage."',
      '               style="width:100%;height:auto;aspect-ratio:16/9;display:block;background:var(--i-panel);border:1px solid var(--i-rule);border-radius:var(--r2)">',
    ].join('\r\n'),
  },
  {
    name: 'walk video: intrinsic size + poster in markup',
    from: '          <video id="walk" controls playsinline preload="none" style="width:100%;height:auto;display:block;background:var(--i-bg)"',
    to: [
      '          <video id="walk" controls playsinline preload="none" width="1440" height="810"',
      '                 poster="assets/walkthrough-poster.webp?v=1"',
      '                 style="width:100%;height:auto;aspect-ratio:16/9;display:block;background:var(--i-bg)"',
    ].join('\r\n'),
  },
  {
    name: 'walk video: gate the 1.7 MB source behind an observer',
    from: [
      '  var v=$("#walk");',
      '  if(v){ v.poster=A.poster; v.src=A.video; }',
    ].join('\r\n'),
    to: [
      '  /* The poster now ships in the markup, so nothing here touches first paint.',
      '     Only the 1.7 MB source is deferred: attached when the player is nearly in',
      '     view, and on any direct interaction, so a click never lands on an empty',
      '     <video>. Never autoplayed -- unrequested video on a data plan is',
      '     indefensible on a page that argues for restraint. */',
      '  var v=$("#walk");',
      '  if(v){',
      '    var armed=false;',
      '    var arm=function(){',
      '      if(armed) return;',
      '      armed=true;',
      '      v.preload="metadata";',
      '      v.src=A.video;',
      '    };',
      '    if("IntersectionObserver" in window){',
      '      var vio=new IntersectionObserver(function(en){',
      '        if(en[0].isIntersecting){ vio.disconnect(); arm(); }',
      '      },{rootMargin:"400px 0px"});',
      '      vio.observe(v);',
      '    } else { arm(); }',
      '    v.addEventListener("pointerdown",arm,true);',
      '    v.addEventListener("focus",arm,true);',
      '  }',
    ].join('\r\n'),
  },
];

for (const e of edits) {
  const n = src.split(e.from).length - 1;
  if (n !== 1) throw new Error(e.name + ': expected 1 match, found ' + n);
  src = src.replace(e.from, e.to);
  console.log('  ok  ' + e.name);
}

if (!src.includes('\r\n') || /[^\r]\n/.test(src)) throw new Error('line endings changed');
fs.writeFileSync(HTML, src, 'utf8');
console.log('index.html patched, ' + src.length + ' B');
