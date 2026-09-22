/* ============================================================
   The hero, lifted.

   This renders the SAME seven-symbol subgraph the SVG hero draws
   — the webhook route, the handler, refresh_session and what it
   touches — with one axis added: z is the symbol's graph distance
   from the focus symbol. Nothing here is generated. Every node,
   every edge, every type and every degree comes from the HERO
   object the SVG is drawn from, and a reader can check the two
   against each other by turning this off.

   That constraint is the whole design. The page's argument is
   that it does not invent structure, so a hero that invented
   4,900 edges to look impressive would refute the product in its
   first viewport. Seven real nodes, honestly layered, is the
   larger claim: the flat picture you were reading was a
   projection of something with depth.

   Everything else is restraint. No lights, no postprocessing, no
   bloom, no fog, no orbit controls, and — the one that matters
   for a laptop battery — no animation loop at rest. Frames are
   rendered when something changes and at no other time.
   ============================================================ */
import * as THREE from 'three';

const B = window.__BCE;
const HERO = B && B.HERO;
const stage = document.getElementById('hero-stage');
const canvas = document.getElementById('hero-gl');
const labelHost = document.getElementById('hero-labels');
if (!B || !HERO || !stage || !canvas) throw new Error('hero-gl: nothing to draw');

/* ---------- palette, read from the design system ---------- */
const ROLE = {
  route:  '--i-warn',
  anchor: '--i-accent',
  focus:  '--i-warn',
  cand:   '--i-cand',
};
const EDGE = {
  CALLS:      { c: '--i-accent', w: 1.00 },
  REFERENCES: { c: '--band-ink-2', w: 0.80 },
  ROUTES_TO:  { c: '--i-warn', w: 1.00 },
  INHERITS:   { c: '--i-type', w: 0.90 },
  IMPLEMENTS: { c: '--i-type', w: 0.90 },
  EXPLAINS:   { c: '--i-dim', w: 0.60 },
};
const tok = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const col = (n) => new THREE.Color(tok(n) || '#22c9fb');

/* ---------- graph distance: the z axis, computed not invented ---------- */
function distances() {
  const adj = {};
  HERO.nodes.forEach((n) => { adj[n.id] = []; });
  HERO.edges.forEach((e) => { adj[e.f].push(e.t); adj[e.t].push(e.f); });
  const focus = (HERO.nodes.find((n) => n.role === 'focus') || HERO.nodes[0]).id;
  const d = { [focus]: 0 };
  let front = [focus];
  while (front.length) {
    const next = [];
    for (const id of front) {
      for (const nb of adj[id]) if (d[nb] === undefined) { d[nb] = d[id] + 1; next.push(nb); }
    }
    front = next;
  }
  return d;
}
const DIST = distances();
const MAXD = Math.max(...Object.values(DIST));

/* SVG viewBox is 620x330; keep the same layout so the two heroes are
   comparable frame to frame, and add depth as the only new information. */
const NX = (x) => (x - 310) / 62;
const NY = (y) => -(y - 165) / 62;
const NZ = (id) => -(DIST[id] || 0) * 1.15;

/* ---------- scene ---------- */
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1.879, 0.1, 100);
const group = new THREE.Group();
scene.add(group);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, powerPreference: 'low-power' });
renderer.setClearAlpha(0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const POS = {}, NODES = HERO.nodes;
NODES.forEach((n) => { POS[n.id] = new THREE.Vector3(NX(n.x), NY(n.y), NZ(n.id)); });

/* Nodes: one instanced disc per symbol, radius by degree. Unlit — the
   instrument palette is flat by design and a PBR material would invent a
   material world this page does not have. */
const disc = new THREE.CircleGeometry(1, 20);
const nodeMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 });
const nodes = new THREE.InstancedMesh(disc, nodeMat, NODES.length);
nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
group.add(nodes);

const ring = new THREE.RingGeometry(0.98, 1.06, 24);
const ringMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.9 });
const rings = new THREE.InstancedMesh(ring, ringMat, NODES.length);
group.add(rings);

function radius(n) { return 0.11 + Math.sqrt(n.deg || 1) / 24; }

function placeNodes() {
  const m = new THREE.Matrix4();
  NODES.forEach((n, i) => {
    const p = POS[n.id], r = radius(n);
    m.makeScale(r, r, r); m.setPosition(p);
    nodes.setMatrixAt(i, m);
    const m2 = new THREE.Matrix4().makeScale(r, r, r); m2.setPosition(p);
    rings.setMatrixAt(i, m2);
    const c = col(ROLE[n.role] || '--i-cand');
    /* depth reads as distance: further back fades toward the panel colour */
    const fade = 1 - (DIST[n.id] || 0) / (MAXD + 1.4);
    nodes.setColorAt(i, c.clone().lerp(col('--i-bg'), 1 - fade));
    rings.setColorAt(i, c);
  });
  nodes.instanceMatrix.needsUpdate = true;
  rings.instanceMatrix.needsUpdate = true;
  if (nodes.instanceColor) nodes.instanceColor.needsUpdate = true;
  if (rings.instanceColor) rings.instanceColor.needsUpdate = true;
}

/* Edges: camera-facing ribbons rebuilt per frame. Seven edges is 42
   vertices, so the "expensive" honest option costs nothing, and gl.LINES
   could not express provenance weight anyway — it is 1px everywhere. */
const edgeGeo = new THREE.BufferGeometry();
const EN = HERO.edges.length;
const ePos = new Float32Array(EN * 6 * 3);
const eCol = new Float32Array(EN * 6 * 3);
edgeGeo.setAttribute('position', new THREE.BufferAttribute(ePos, 3));
edgeGeo.setAttribute('color', new THREE.BufferAttribute(eCol, 3));
const edgeMat = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.66, side: THREE.DoubleSide, depthWrite: false });
group.add(new THREE.Mesh(edgeGeo, edgeMat));

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _d = new THREE.Vector3();
const _v = new THREE.Vector3(), _p = new THREE.Vector3(), _cam = new THREE.Vector3();

function buildEdges() {
  group.updateWorldMatrix(true, false);
  _cam.copy(camera.position);
  group.worldToLocal(_cam);
  let o = 0;
  HERO.edges.forEach((e) => {
    const st = EDGE[e.type] || EDGE.REFERENCES;
    _a.copy(POS[e.f]); _b.copy(POS[e.t]);
    _d.subVectors(_b, _a).normalize();
    _v.subVectors(_cam, _a).normalize();
    _p.crossVectors(_d, _v).normalize().multiplyScalar(0.016 * st.w * 2.2);
    /* pull the ends back so the ribbon meets the disc edge, not its centre */
    const ra = radius(NODES.find((n) => n.id === e.f)) * 1.05;
    const rb = radius(NODES.find((n) => n.id === e.t)) * 1.05;
    const A = _a.clone().addScaledVector(_d, ra);
    const Bv = _b.clone().addScaledVector(_d, -rb);
    const q = [
      A.clone().add(_p), Bv.clone().add(_p), Bv.clone().sub(_p),
      A.clone().add(_p), Bv.clone().sub(_p), A.clone().sub(_p),
    ];
    const c = col(st.c);
    for (const p of q) {
      ePos[o] = p.x; ePos[o + 1] = p.y; ePos[o + 2] = p.z;
      eCol[o] = c.r; eCol[o + 1] = c.g; eCol[o + 2] = c.b;
      o += 3;
    }
  });
  edgeGeo.attributes.position.needsUpdate = true;
  edgeGeo.attributes.color.needsUpdate = true;
}

/* Labels stay HTML. Symbol names are the substance of this graph, so they
   keep real fonts, real translation and a real place in the document. */
const labels = NODES.map((n) => {
  const s = document.createElement('span');
  s.textContent = n.label;
  s.style.cssText = 'position:absolute;left:0;top:0;white-space:nowrap;font:500 11px/1 var(--ff-mono);pointer-events:none;will-change:transform';
  labelHost.appendChild(s);
  return s;
});
const _e = new THREE.Vector3();
function placeLabels() {
  const w = canvas.clientWidth, hh = canvas.clientHeight;
  NODES.forEach((n, i) => {
    _v.copy(POS[n.id]); group.localToWorld(_v); _v.project(camera);
    const x = (_v.x * 0.5 + 0.5) * w, y = (-_v.y * 0.5 + 0.5) * hh;
    /* Project the top of the disc as well, so the label clears the node at
       any canvas size and any camera distance instead of guessing. */
    _e.copy(POS[n.id]).y += radius(n);
    group.localToWorld(_e); _e.project(camera);
    const top = (-_e.y * 0.5 + 0.5) * hh;
    const s = labels[i];
    s.style.transform = 'translate3d(' + Math.round(x) + 'px,' + Math.round(Math.min(top, y) - 12) + 'px,0) translateX(-50%)';
    s.style.color = tok(ROLE[n.role] || '--i-cand');
    s.style.opacity = String(1 - (DIST[n.id] || 0) / (MAXD + 2.2));
  });
}

/* ---------- motion: one arrival, then only what the reader drives ---------- */
let dirty = true, running = false, visible = false, alive = true;
const cam = { z: 14, yaw: 0.0, pitch: 0.0 };
const target = { z: 10.4, yaw: 0.0, pitch: 0.0 };
let pointer = { x: 0, y: 0 };
const mark = () => { dirty = true; schedule(); };

function resize() {
  const r = stage.getBoundingClientRect();
  if (!r.width) return;
  const dpr = Math.min(window.devicePixelRatio || 1,
    (navigator.deviceMemory && navigator.deviceMemory <= 4) ? 1.25 : 1.75);
  renderer.setPixelRatio(dpr);
  renderer.setSize(r.width, r.height, false);
  camera.aspect = r.width / r.height;
  camera.updateProjectionMatrix();
  mark();
}

/* Scroll scrub: the flat frame opens into an oblique one as the hero
   leaves. The camera move IS the claim — a graph, not a list. */
function onScroll() {
  const r = stage.getBoundingClientRect();
  const p = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
  target.yaw = p * 0.40 + pointer.x * 0.07;
  target.pitch = p * 0.16 + pointer.y * 0.05;
  target.z = 10.4 + p * 1.1;
  mark();
}

let last = 0, slow = 0;
function frame(t) {
  running = false;
  if (!alive) return;
  const dt = Math.min(0.05, last ? (t - last) / 1000 : 0.016);
  last = t;

  /* critically damped, frame-rate independent — the same hand as the
     --spring-flow curve the CSS uses */
  const k = 4.2, f = 1 - Math.exp(-k * dt);
  let moving = false;
  for (const key of ['z', 'yaw', 'pitch']) {
    const d = target[key] - cam[key];
    if (Math.abs(d) > 1e-4) { cam[key] += d * f; moving = true; }
    else cam[key] = target[key];
  }

  camera.position.set(0, 0, cam.z);
  camera.lookAt(0, 0, 0);
  group.rotation.y = cam.yaw;
  group.rotation.x = cam.pitch;

  buildEdges();
  const t0 = performance.now();
  renderer.render(scene, camera);
  placeLabels();
  const cost = performance.now() - t0;

  /* If this machine cannot hold the frame, stop shipping it a hero.
     Silently: the SVG underneath is complete and correct. */
  if (cost > 22) { if (++slow > 60) demote('slow'); } else slow = Math.max(0, slow - 1);

  dirty = false;
  if (moving) schedule();
}
function schedule() {
  if (running || !alive || !visible) return;
  running = true;
  requestAnimationFrame(frame);
}

function demote(why) {
  alive = false;
  try {
    stage.classList.remove('gl-live');
    labelHost.textContent = '';
    renderer.dispose();
    disc.dispose(); ring.dispose(); edgeGeo.dispose();
    nodeMat.dispose(); ringMat.dispose(); edgeMat.dispose();
    canvas.remove();
  } catch (e) { /* the fallback is already on screen */ }
  if (why === 'slow') {
    try { localStorage.setItem('bce:webgl', 'auto-off'); } catch (e) {}
  }
  document.dispatchEvent(new CustomEvent('bce:gl', { detail: { on: false } }));
}

/* ---------- wiring ---------- */
placeNodes();
resize();

new ResizeObserver(resize).observe(stage);
addEventListener('scroll', onScroll, { passive: true });

const io = new IntersectionObserver((en) => {
  visible = en[0].isIntersecting;
  if (visible) { last = 0; mark(); }
}, { rootMargin: '120px' });
io.observe(stage);

document.addEventListener('visibilitychange', () => {
  if (!document.hidden) { last = 0; mark(); }
});

/* pointer parallax, fine pointers only, and only a few degrees */
if (matchMedia('(pointer:fine)').matches) {
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    onScroll();
  });
  stage.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; onScroll(); });
}

/* The palette is a design-system token, so it follows the theme and the
   language like every other component on the page. */
new MutationObserver(() => { placeNodes(); mark(); })
  .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
document.addEventListener('bce:lang', () => { placeNodes(); mark(); });

/* A user who turns the OS setting on mid-session gets the SVG back. */
const rm = matchMedia('(prefers-reduced-motion: reduce)');
(rm.addEventListener ? rm.addEventListener.bind(rm, 'change') : rm.addListener.bind(rm))(() => {
  if (rm.matches) demote('reduced-motion');
});
canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); demote('context-lost'); });

/* Only now, with a real frame on screen, hand over from the SVG. */
onScroll();
renderer.render(scene, camera);
placeLabels();
requestAnimationFrame(() => {
  if (!alive) return;
  stage.classList.add('gl-live');
  document.dispatchEvent(new CustomEvent('bce:gl', { detail: { on: true } }));
  mark();
});

export default { demote };
