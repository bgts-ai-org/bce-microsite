/* Adds the WebGL hero to index.html.

   Three separate concerns, deliberately kept apart:
     1. CSS for the stage, so the box is sized before anything loads
     2. markup: the canvas and label layer as siblings of the SVG
     3. a module island at the very end that gates hard and loads late

   The module island is the reason the rest of the page's ES5 is safe:
   `import(` inside one of the existing classic scripts would be a PARSE
   error on an older engine and would take every component on the page
   down with it. A <script type="module"> is ignored wholesale instead.

   node tools/build-hero-gl.mjs
*/
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HTML = path.join(ROOT, 'index.html');
const THREE_DIR = 'assets/vendor/three-0.186.0';

let src = fs.readFileSync(HTML, 'utf8');
if (!src.includes('\r\n')) throw new Error('expected CRLF source');
const before = src.length;
const nl = (a) => a.join('\r\n');

/* ---- 1. CSS ------------------------------------------------------- */
const CSS = nl([
  '',
  '/* ============================================================',
  '   HERO STAGE — the SVG hero and its WebGL counterpart occupy',
  '   one box whose height comes from aspect-ratio on the wrapper,',
  '   not from either child. The canvas can therefore appear, or',
  '   fail to appear, or be torn down mid-session, without moving',
  '   a single pixel of the page around it.',
  '',
  '   The handover uses visibility, never opacity: drawGraph gives',
  '   the SVG focusable nodes, and an opacity:0 SVG would leave a',
  '   run of invisible tab stops behind the canvas.',
  '   ============================================================ */',
  '.hero-stage{position:relative;width:100%;min-width:560px;aspect-ratio:620/330}',
  '.hero-stage>svg,.hero-stage>canvas,.hero-stage>div{position:absolute;inset:0;width:100%;height:100%;min-width:0}',
  '#hero-gl{display:block;opacity:0;transition:opacity .45s var(--spring-flow)}',
  '.hero-stage.gl-live #hero-gl{opacity:1}',
  '.hero-stage.gl-live>svg{visibility:hidden}',
  '#hero-labels{pointer-events:none}',
  '.vh{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip-path:inset(50%);white-space:nowrap;border:0}',
  '.gl-btn{cursor:pointer;font:400 .68rem/1 var(--ff-mono)}',
  '@media (prefers-reduced-motion:reduce){',
  '  #hero-gl{display:none}',
  '  .hero-stage.gl-live>svg{visibility:visible}',
  '}',
  '/* A WebGL canvas is entirely invisible in Windows High Contrast. */',
  '@media (forced-colors:active){',
  '  #hero-gl,#hero-labels{display:none!important}',
  '  .hero-stage.gl-live>svg{visibility:visible!important}',
  '}',
]);
if (!src.includes('HERO STAGE — the SVG hero')) {
  src = src.replace('\r\n</style>', () => CSS + '\r\n</style>');
}

/* ---- 2. markup ---------------------------------------------------- */
const svgOld = '        <div class="canvas-wrap"><svg id="hero-svg" viewBox="0 0 620 330" role="img" aria-labelledby="hero-svg-t"><title id="hero-svg-t">Retrieval subgraph: the route anchors the webhook handler, which calls refresh_session, which reads SESSION_TTL.</title></svg></div>';
const svgNew = nl([
  '        <div class="canvas-wrap"><div class="hero-stage" id="hero-stage">',
  '          <svg id="hero-svg" viewBox="0 0 620 330" role="img" aria-labelledby="hero-svg-t"><title id="hero-svg-t">Retrieval subgraph: the route anchors the webhook handler, which calls refresh_session, which reads SESSION_TTL.</title></svg>',
  '          <canvas id="hero-gl" aria-hidden="true" role="presentation" tabindex="-1"></canvas>',
  '          <div id="hero-labels" aria-hidden="true"></div>',
  '        </div></div>',
  '        <p id="hero-desc" class="vh" data-i18n',
  '           data-en="The same subgraph in three dimensions: depth is each symbol’s distance in the code graph from refresh_session. The route POST /meeting/webhook anchors handle_meeting_webhook, which calls refresh_session and verify_webhook_signature; refresh_session calls SessionStore.renew and reads AuthConfig, and SESSION_TTL sits two steps out."',
  '           data-tr="Aynı alt graf üç boyutta: derinlik, her sembolün kod grafında refresh_session’a olan uzaklığıdır. POST /meeting/webhook rotası handle_meeting_webhook’u çıpalar; o da refresh_session ve verify_webhook_signature’ı çağırır; refresh_session, SessionStore.renew’u çağırıp AuthConfig’i okur ve SESSION_TTL iki adım ötededir.">The same subgraph in three dimensions: depth is each symbol’s distance in the code graph from refresh_session.</p>',
]);
if (src.includes(svgOld)) src = src.replace(svgOld, () => svgNew);
else if (!src.includes('id="hero-stage"')) throw new Error('hero svg wrapper not found');

/* the toggle, beside "live retrieval graph" in the panel header */
const chipOld = '<span class="r"><span data-i18n data-en="live retrieval graph" data-tr="canlı getirme grafı">live retrieval graph</span></span>';
const chipNew = '<span class="r"><span data-i18n data-en="live retrieval graph" data-tr="canlı getirme grafı">live retrieval graph</span><button type="button" class="chip gl-btn" id="hero-gl-toggle" hidden aria-pressed="false"></button></span>';
if (src.includes(chipOld)) src = src.replace(chipOld, () => chipNew);

/* HERO is the data both heroes draw from; the module needs it. */
const heroExport = '};\r\nfunction paintHero(){';
if (src.includes(heroExport) && !src.includes('B.HERO=HERO')) {
  src = src.replace(heroExport, () => '};\r\nB.HERO=HERO;   /* the 3D hero draws the same seven nodes */\r\nfunction paintHero(){');
}

/* ---- 3. the island ------------------------------------------------ */
const ISLAND = nl([
  '',
  '<!-- ============================ WEBGL HERO ============================',
  '     Gated hard and loaded late. Every check below is a reason NOT to',
  '     download 800 KB of renderer, and the SVG hero underneath is a',
  '     complete answer in every one of those cases. Nothing is requested',
  '     until after load, so the largest contentful paint cannot see it. -->',
  '<script type="importmap">',
  '{"imports":{"three":"./' + THREE_DIR + '/three.module.min.js"}}',
  '<\/script>',
  '<script type="module">',
  '(function(){',
  '  var stage=document.getElementById("hero-stage");',
  '  var btn=document.getElementById("hero-gl-toggle");',
  '  var pref=null;',
  '  try{ pref=localStorage.getItem("bce:webgl"); }catch(e){}',
  '',
  '  function label(on){',
  '    if(!btn) return;',
  '    btn.hidden=false;',
  '    var tr=document.documentElement.lang==="tr";',
  '    btn.textContent=on?(tr?"WebGL · açık":"WebGL · on"):(tr?"SVG · açık":"SVG · on");',
  '    btn.setAttribute("aria-pressed",String(on));',
  '    btn.setAttribute("aria-label",tr?"Hero grafiğini WebGL ve SVG arasında değiştir":"Switch the hero graphic between WebGL and SVG");',
  '  }',
  '  if(btn){',
  '    btn.addEventListener("click",function(){',
  '      var on=btn.getAttribute("aria-pressed")==="true";',
  '      try{ localStorage.setItem("bce:webgl",on?"off":"on"); }catch(e){}',
  '      location.reload();',
  '    });',
  '    document.addEventListener("bce:lang",function(){ label(btn.getAttribute("aria-pressed")==="true"); });',
  '  }',
  '',
  '  /* --- the gates --- */',
  '  var q=new URLSearchParams(location.search).get("webgl");',
  '  if(q==="off"||pref==="off"||pref==="auto-off"){ label(false); return; }',
  '  if(!stage){ return; }',
  '  if(matchMedia("(prefers-reduced-motion: reduce)").matches){ label(false); return; }',
  '  /* a coarse pointer on a small screen is a phone: it gets the SVG, which',
  '     is genuinely good, instead of a renderer and a battery bill */',
  '  if(matchMedia("(pointer: coarse)").matches && innerWidth<900){ label(false); return; }',
  '  var c=navigator.connection;',
  '  if(c && (c.saveData || /(^|-)(2g|slow-2g)$/.test(c.effectiveType||""))){ label(false); return; }',
  '  if((navigator.deviceMemory||8)<4 || (navigator.hardwareConcurrency||8)<4){ label(false); return; }',
  '  try{',
  '    var t=document.createElement("canvas");',
  '    var gl=t.getContext("webgl2",{failIfMajorPerformanceCaveat:true,antialias:false});',
  '    if(!gl){ label(false); return; }',
  '    var lose=gl.getExtension("WEBGL_lose_context"); if(lose) lose.loseContext();',
  '  }catch(e){ label(false); return; }',
  '',
  '  label(false);',
  '  document.addEventListener("bce:gl",function(e){ label(!!(e.detail&&e.detail.on)); });',
  '',
  '  /* Never fetched at all if the reader deep-linked past the hero. */',
  '  var armed=false;',
  '  function go(){',
  '    if(armed) return; armed=true;',
  '    var idle=window.requestIdleCallback||function(f){ return setTimeout(f,1); };',
  '    idle(function(){',
  '      import("' + './assets/hero-gl.js").catch(function(err){',
  '        if(window.console) console.warn("hero-gl unavailable, keeping the SVG",err);',
  '      });',
  '    },{timeout:2500});',
  '  }',
  '  function arm(){',
  '    if(!("IntersectionObserver" in window)){ go(); return; }',
  '    var io=new IntersectionObserver(function(en){',
  '      if(en[0].isIntersecting){ io.disconnect(); go(); }',
  '    },{rootMargin:"200px"});',
  '    io.observe(stage);',
  '  }',
  '  if(document.readyState==="complete") arm();',
  '  else addEventListener("load",arm);',
  '})();',
  '<\/script>',
]);
if (!src.includes('WEBGL HERO')) {
  src = src.replace('\r\n</body>', () => ISLAND + '\r\n</body>');
}

if (/[^\r]\n/.test(src)) throw new Error('line endings changed');
fs.writeFileSync(HTML, src, 'utf8');
console.log('index.html  ' + before + ' B -> ' + src.length + ' B  (+' + (src.length - before) + ')');
