// MNRC MN82 · Toyota Land Cruiser LC79 — 20 s exploded-view product breakdown (9:16)
import * as THREE from 'three';
import { BRAND, col, clamp, ramp, lerp, ease, ep, TextLine, pill, checkIcon, texPlane, imagePlane, bgQuad, particles, fontStr, canvasTex } from './lib.js';
import { mkScene, chrome, glow, logoStack, SMOKE_FRAG } from './scenes.js';
import { buildLC79, PAINT } from './lc79.js';

export const DURATION = 20;
export const TEXTURES = ['logo', 'mn82/red.png', 'mn82/beige.png', 'mn82/remote.png', 'mn82/scene.jpg'];
const RED = BRAND.red;
const HH = 3.64, HW = 3.64 * 1080 / 1920;          // HUD half extents

// beat-locked moments (120 BPM)
const CALLS = [
  { t: 4.0, part: 'driveline', a: '4WD', b: 'SHAFT DRIVE', sub: 'FRONT & REAR SOLID AXLES' },
  { t: 4.75, part: 'motor', a: 'HIGH-TORQUE', b: 'BRUSHED MOTOR', sub: 'GEARED DOWN FOR CRAWLING' },
  { t: 5.5, part: 'servo', a: '17G', b: 'WATERPROOF SERVO', sub: 'PROPORTIONAL STEERING' },
  { t: 6.25, part: 'battery', a: '7.4V LI-ION', b: '500MAH PACK', sub: '30–40 MIN RUN · USB CHARGING' },
  { t: 7.0, part: ['shockaxleF1', 'shockaxleF-1', 'shockaxleR1', 'shockaxleR-1'], anchor: 'shockaxleF1', a: 'COIL-SPRING', b: 'SHOCKS ×4', sub: 'SOAKS UP ROCKS & RUTS' },
  { t: 7.75, part: ['wheelaxleF1', 'wheelaxleF-1', 'wheelaxleR1', 'wheelaxleR-1'], anchor: 'wheelaxleF1', a: '62MM', b: 'ALL-TERRAIN TYRES', sub: '24MM WIDE · 37MM WHEELS' },
];
const SNAPS = [10.0, 10.5, 11.0, 11.5, 12.0, 12.5, 13.0, 13.5];

export const HITS = [
  { t: 1.0, shake: 0.15, ca: 0.2 },
  { t: 2.0, flash: 0.7, ca: 1.7, zoom: 1.3, shake: 1.5, shock: [0.5, 0.5], zoomIn: 0.9 },
  ...CALLS.map(c => ({ t: c.t, ca: 0.45, zoom: 0.35, shake: 0.15 })),
  { t: 8.5, ca: 0.7, zoom: 0.7, shake: 0.3 },
  { t: 9.5, ca: 1.3, glitch: 1, zoom: 0.5 }, { t: 9.75, ca: 1.0, glitch: 0.8 },
  ...SNAPS.map((t, i) => ({ t, ca: 0.45 + i * 0.04, shake: 0.3 + i * 0.04, zoom: 0.25, flash: 0 })),
  { t: 14.0, flash: 1.0, ca: 1.4, zoom: 1.1, shake: 1.0, zoomIn: 0.7, shock: [0.5, 0.5] },
  { t: 15.0, ca: 0.4, shake: 0.2 }, { t: 15.5, ca: 0.4, shake: 0.2 },
  { t: 16.0, ca: 1.0, zoom: 1.0, shake: 0.5, zoomIn: 0.6 },
  { t: 17.0, flash: 1.3, ca: 1.5, zoom: 1.2, shake: 1.1, shock: [0.5, 0.55], zoomIn: 1.0 },
  { t: 19.0, flash: 0.6, ca: 0.9, shake: 0.7, shock: [0.5, 0.3], shockAmp: 0.6 },
];

const STUDIO = /* glsl */`
  uniform float uTime, uAspect, uRed, uDim; uniform vec2 uPar; varying vec2 vUv;
  void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.) + uPar;
    vec3 c = mix(vec3(.016, .016, .02), vec3(.003, .003, .005), smoothstep(-.2, .6, p.y));
    c += vec3(.5, .01, .0) * exp(-pow((p.y - .05) * 5., 2.)) * smoothstep(1., 0., abs(p.x)) * .18 * uRed;
    vec2 g = abs(fract(p * vec2(9., 9.) + vec2(0., uTime * .05)) - .5);
    c += vec3(.02) * smoothstep(.02, .0, min(g.x, g.y)) * smoothstep(.7, .1, length(p));
    c += vec3(.05, .0, .0) * pow(fbm(p * 2.5 + uTime * .08), 3.) * 2.;
    gl_FragColor = vec4(c * uDim, 1.); }`;

/** HDR studio for reflections: softboxes + strip lights + a red kicker */
export function envScene() {
  const sc = new THREE.Scene(); sc.background = new THREE.Color(0.012, 0.012, 0.014);
  const panel = (w, h, c, pos, look) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(...pos); m.lookAt(...look); sc.add(m); };
  panel(7, 2.5, new THREE.Color(5, 5, 5), [0, 6, 0], [0, 0, 0]);
  panel(0.8, 6, new THREE.Color(3.5, 3.5, 3.6), [-6, 2, 1], [0, 1, 0]);
  panel(0.8, 6, new THREE.Color(2.6, 2.7, 3.0), [6, 2, -1], [0, 1, 0]);
  panel(5, 3, new THREE.Color(3.0, 0.1, 0.05), [0, 2, -7], [0, 1, 0]);
  panel(6, 1.2, new THREE.Color(1.4, 1.4, 1.5), [0, 1.5, 7], [0, 1, 0]);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.02, 0.02, 0.022) })); fl.rotation.x = -Math.PI / 2; fl.position.y = -0.5; sc.add(fl);
  return sc;
}

export function buildScenes(A) {
  const truck = buildLC79(A.env);
  const all = [...studioScenes(A, truck), endScene(A)];
  all.forEach(S => S.hud.traverse(o => { if (o.material) { o.material.depthTest = false; o.material.fog = false; o.renderOrder = o.userData.order ?? 999; } }));
  return all;
}

// =====================================================================================
function studioScenes(A, truck) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1080 / 1920, 0.1, 200);
  scene.add(camera);
  const bg = bgQuad(STUDIO, { uRed: { value: 1 }, uDim: { value: 1 } });
  scene.add(bg);
  // lights
  scene.add(new THREE.HemisphereLight(0xb8c4ff, 0x1a0505, 0.35));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(4, 8, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -5, right: 5, top: 6, bottom: -4, near: 1, far: 30 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff2a1a, 1.4); rim.position.set(-5, 3, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8fb0ff, 0.7); fill.position.set(-6, 2, 4); scene.add(fill);
  const sweep = new THREE.SpotLight(0xffffff, 0, 30, 0.35, 0.6, 1.2); sweep.visible = false; sweep.position.set(0, 7, 3); scene.add(sweep, sweep.target);
  // floor: reflective-ish dark disc + red ring
  const floorTex = canvasTex(512, 512, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2); g.addColorStop(0, '#1c1c20'); g.addColorStop(0.45, '#0e0e11'); g.addColorStop(1, '#050506'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const floor = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({ map: floorTex }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const shadowCatch = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.ShadowMaterial({ opacity: 0.6 }));
  shadowCatch.rotation.x = -Math.PI / 2; shadowCatch.position.y = 0.002; shadowCatch.receiveShadow = true; scene.add(shadowCatch);
  const ring = new THREE.Mesh(new THREE.RingGeometry(2.55, 2.6, 128), new THREE.MeshBasicMaterial({ color: col(BRAND.redHot, 2.2), toneMapped: false }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.003; scene.add(ring);
  const ring2 = new THREE.Mesh(new THREE.RingGeometry(2.2, 2.21, 128), new THREE.MeshBasicMaterial({ color: col('#ffffff', 0.25), toneMapped: false }));
  ring2.rotation.x = -Math.PI / 2; ring2.position.y = 0.003; scene.add(ring2);
  const turn = new THREE.Group(); turn.add(truck.root); scene.add(turn);
  // ramp for the climb shot
  const rampG = new THREE.Group();
  const slab = new THREE.Mesh(new THREE.BoxGeometry(7, 0.18, 2.4), new THREE.MeshStandardMaterial({ color: 0x17171a, roughness: 0.8, metalness: 0.1 }));
  slab.position.set(2.2, -0.09, 0); slab.receiveShadow = true; rampG.add(slab);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(7, 0.02, 0.03), new THREE.MeshBasicMaterial({ color: col(BRAND.redHot, 2.5), toneMapped: false }));
  edge.position.set(2.2, 0.005, 1.2); rampG.add(edge);
  rampG.rotation.z = THREE.MathUtils.degToRad(46);
  rampG.visible = false; scene.add(rampG);
  const arcGeo = new THREE.TorusGeometry(1.5, 0.018, 6, 96, THREE.MathUtils.degToRad(46));
  const arc = new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ color: col(BRAND.redHot, 3), toneMapped: false }));
  arc.position.set(0, 0.01, 1.25); scene.add(arc);
  const base = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.012, 0.012), new THREE.MeshBasicMaterial({ color: col('#ffffff', 0.8), toneMapped: false }));
  base.position.set(1.7, 0.006, 1.25); scene.add(base);
  const sparks = particles(380, { mode: 1, color: '#ff6a2a', mul: 4, size: 0.05, origin: new THREE.Vector3(0.2, 0.9, 0), seed: 82, speed: 2.2, gravity: 3.2, burstAt: 2.0 });
  const embers = particles(160, { mode: 0, color: '#ff3a12', mul: 1.6, size: 0.04, spread: new THREE.Vector3(9, 7, 7), seed: 9, speed: 0.6 });
  embers.position.y = 2.5;
  scene.add(sparks, embers);

  // ---------- explode curve per part
  const bodyOrder = ['cab', 'frontclip', 'bed', 'rollbar', 'snorkel', 'bumper'];
  const liftAt = t => 0.72 * ease.outExpo(ramp(t, 2.3, 3.0)) * (1 - ease.inOutCubic(ramp(t, 10.0, 11.0)));
  const wireAt = t => 0.22 * ep(t, 2.6, 0.6, ease.outCubic) * (1 - ep(t, 12.5, 1.0, ease.inOutCubic));
  function amount(p, t) {
    if (p.group === 'frame') return 0;
    const bi = bodyOrder.indexOf(p.name);
    const st = bi >= 0 ? 2.0 + bi * 0.025 : 2.32 + (truck.parts.indexOf(p) % 12) * 0.035;
    let e = bi >= 0 ? ease.outBack(ramp(t, st, st + 0.75), 1.25) : ease.outExpo(ramp(t, st, st + 0.7));
    const back = p.snap;
    e *= 1 - ease.inCubic(ramp(t, back - 0.42, back));
    if (t > back && t < back + 0.4) e -= 0.035 * Math.exp(-(t - back) / 0.07) * Math.sin((t - back) * 70);
    return e;
  }

  // ---------- segments share this world; each has its own HUD
  const segs = [];
  const seg = (start, end, opts = {}) => {
    const S = { start, end, scene, camera, hud: new THREE.Group(), ...opts };
    S.hud.position.z = -HH / Math.tan((36 * Math.PI) / 360);
    camera.add(S.hud); segs.push(S); return S;
  };
  const showOnly = S => segs.forEach(s => (s.hud.visible = s === S));
  const common = (t) => {
    bg.material.uniforms.uTime.value = t;
    sparks.material.uniforms.uTime.value = t; embers.material.uniforms.uTime.value = t;
  };
  const look = (pos, target, roll = 0) => { camera.position.copy(pos); camera.lookAt(target); camera.rotation.z += roll; };
  const orbit = (a, r, h, ty = 0.6, tx = 0) => look(new THREE.Vector3(Math.sin(a) * r + tx, h, Math.cos(a) * r), new THREE.Vector3(tx, ty, 0));
  const reset = () => { rampG.visible = false; arc.visible = false; base.visible = false; turn.position.set(0, 0, 0); turn.rotation.set(0, 0, 0); ring.visible = ring2.visible = true; };

  // ---------------- 0–2 hook
  const S1 = seg(0, 2, { bloom: 0.8 });
  const c1 = chrome(S1, 1, 'MN82', true, DURATION);
  const kick1 = new TextLine('MNRC · MN82 · RTR 1/12', { size: 0.14, ls: 0.32, weight: 600, color: '#ffffff', mul: 0.7 }); kick1.position.set(0, 2.72, 0);
  const t1a = new TextLine('LAND CRUISER', { size: 0.5, ls: 0.06 }); t1a.position.set(0, 2.2, 0);
  const t1b = new TextLine('LC79', { size: 1.25, ls: 0.02, color: BRAND.redHot, mul: 1.05 }); t1b.position.set(0, 1.25, 0);
  const lic = texPlane(pill('OFFICIALLY LICENSED · TOYOTA', { px: 40, bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.35)', ls: 0.16 }), 2.6); lic.position.set(0, -2.95, 0);
  S1.hud.add(kick1, t1a, t1b, lic);
  S1.update = (lt, t) => {
    showOnly(S1); reset(); common(t); truck.setWire(0);
    truck.setPaint(PAINT.red); truck.pose(() => 0); truck.highlight(null, 0); truck.spinWheels(0);
    turn.rotation.y = -0.5 + lt * 0.35;
    sweep.intensity = 60 * ep(lt, 0, 0.6, ease.outCubic); sweep.target.position.set(lerp(-3, 3, ep(lt, 0, 1.6, ease.inOutCubic)), 0, 0);
    const push = ep(lt, 1.55, 0.45, ease.inExpo);
    orbit(0.62 + lt * 0.08, lerp(10.4, 9.6, ep(lt, 0, 1.5)) - push * 2.4, 1.7 - push * 0.3, 1.45);
    kick1.animate(lt, { at: 0.1, stagger: 0.012, dur: 0.35, style: 'fade', out: 1.8, outDur: 0.15 });
    t1a.animate(lt, { at: 0.25, stagger: 0.03, dur: 0.45, style: 'rise', out: 1.8, outDur: 0.15 });
    t1b.animate(lt, { at: 0.5, stagger: 0.06, dur: 0.45, style: 'slam', out: 1.82, outDur: 0.15 });
    const pl = ep(lt, 0.8, 0.35, ease.outBack) * (1 - ep(lt, 1.8, 0.15)); lic.material.opacity = clamp(pl); lic.scale.setScalar(Math.max(0.001, pl));
    bg.material.uniforms.uRed.value = 0.5 + 0.5 * ep(lt, 0, 1.5);
    c1(t, lt);
  };

  // ---------------- 2–4 bust
  const S2 = seg(2, 4, { bloom: 0.9 });
  const c2 = chrome(S2, 2, 'BREAKDOWN', true, DURATION);
  const b1 = new TextLine('BUILT LIKE', { size: 0.42, ls: 0.06 }); b1.position.set(0, -2.15, 0);
  const b2 = new TextLine('THE REAL THING', { size: 0.42, ls: 0.02, color: BRAND.redHot, mul: 1.05 }); b2.position.set(0, -2.7, 0);
  S2.hud.add(b1, b2);
  S2.update = (lt, t) => {
    showOnly(S2); reset(); common(t); turn.position.y = liftAt(t); truck.setWire(wireAt(t));
    truck.setPaint(PAINT.red); truck.pose(p => amount(p, t), t, ep(lt, 0.8, 0.6)); truck.highlight(null, 0);
    turn.rotation.y = -0.5 + (2 + lt) * 0.35 + ep(lt, 0, 0.5) * 0.25;
    sweep.intensity = 40;
    const pull = ep(lt, 0, 1.2, ease.outCubic);
    orbit(0.78 + lt * 0.1, lerp(6.4, 12.4, pull), lerp(1.3, 3.0, pull), lerp(0.75, 1.15, pull));
    b1.animate(lt, { at: 0.35, stagger: 0.03, dur: 0.4, style: 'rise', out: 1.85, outDur: 0.15 });
    b2.animate(lt, { at: 0.5, stagger: 0.025, dur: 0.4, style: 'rise', out: 1.87, outDur: 0.15 });
    c2(t, lt);
  };

  // ---------------- 4–9.5 callouts
  const S3 = seg(4, 9.5, { bloom: 0.85 });
  const c3 = chrome(S3, 3, 'INSIDE', true, DURATION);
  const lineMat = () => new THREE.MeshBasicMaterial({ color: col(BRAND.redHot, 1.6), toneMapped: false, transparent: true });
  const calls = CALLS.map((c, i) => {
    const left = i % 2 === 0; const ax = left ? -1.78 : 1.78; const al = left ? -1 : 1;
    const g = new THREE.Group();
    const idx = new TextLine(`${String(i + 1).padStart(2, '0')} / 06`, { size: 0.12, ls: 0.3, color: BRAND.redHot, mul: 1.1, align: al, weight: 600 }); idx.position.set(ax, -1.72, 0);
    const la = new TextLine(c.a, { size: 0.42, ls: 0.02, align: al, maxW: 3.5 }); la.position.set(ax, -2.12, 0);
    const lb = new TextLine(c.b, { size: 0.34, ls: 0.02, align: al, color: BRAND.redHot, mul: 1.05, maxW: 3.5 }); lb.position.set(ax, -2.55, 0);
    const sub = new TextLine(c.sub, { size: 0.12, ls: 0.24, align: al, weight: 600, color: '#ffffff', mul: 0.6, maxW: 3.5 }); sub.position.set(ax, -2.9, 0);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.014), lineMat()); line.geometry.translate(0.5, 0, 0);
    const elbow = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.014), lineMat()); elbow.geometry.translate(0.5, 0, 0);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 24), lineMat());
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.095, 32), lineMat());
    g.add(idx, la, lb, sub, line, elbow, dot, halo);
    S3.hud.add(g);
    return { ...c, g, idx, la, lb, sub, line, elbow, dot, halo, ax, left };
  });
  const care = new TextLine('EVERY PART SERVICEABLE', { size: 0.2, ls: 0.2, weight: 600 }); care.position.set(0, -2.25, 0);
  const careP = texPlane(pill('CRAZYRC CARE · 6 MONTHS FREE REPAIRS', { px: 40, bg: RED, ls: 0.12 }), 3.4); careP.position.set(0, -2.75, 0);
  S3.hud.add(care, careP);
  const _a = new THREE.Vector3();
  const toHud = v => { const p = v.clone().project(camera); return new THREE.Vector2(p.x * HW, p.y * HH); };
  const setSeg = (m, a, b, prog) => { const d = new THREE.Vector2().subVectors(b, a); m.position.set(a.x, a.y, 0); m.rotation.z = Math.atan2(d.y, d.x); m.scale.x = Math.max(0.0001, d.length() * prog); };
  S3.update = (lt, t) => {
    showOnly(S3); reset(); common(t); turn.position.y = liftAt(t); truck.setWire(wireAt(t));
    truck.setPaint(PAINT.red); truck.pose(p => amount(p, t), t, 1);
    turn.rotation.y = -0.5 + 4 * 0.35 + 0.25 + (t - 4) * 0.22;
    sweep.intensity = 30;
    const cur = CALLS.findIndex((c, i) => t >= c.t && t < (CALLS[i + 1]?.t ?? 8.5));
    // camera breathes toward the active part
    let target = new THREE.Vector3(0, 1.2, 0);
    if (cur >= 0) { truck.anchorWorld(CALLS[cur].anchor || CALLS[cur].part, _a); target.lerp(_a, 0.3 * ep(t, CALLS[cur].t, 0.3, ease.inOutCubic)); }
    const wide = ep(t, 8.5, 0.6, ease.inOutCubic);
    camera.position.set(Math.sin(0.98 + lt * 0.06) * lerp(12.2, 13, wide), lerp(3.1, 3.3, wide), Math.cos(0.98 + lt * 0.06) * lerp(12.2, 13, wide));
    camera.lookAt(target.x * (1 - wide), lerp(target.y, 1.25, wide), target.z * (1 - wide));
    camera.updateMatrixWorld();
    calls.forEach((c, i) => {
      const t0 = c.t, t1 = i < calls.length - 1 ? calls[i + 1].t : 8.5;
      const on = t >= t0 - 0.05 && t < t1;
      c.g.visible = on;
      if (!on) return;
      const l = t - t0;
      truck.highlight(c.part, ep(l, 0, 0.15) * (1 - ep(t, t1 - 0.12, 0.1)), t);
      truck.anchorWorld(c.anchor || c.part, _a);
      const A2 = toHud(_a);
      const corner = new THREE.Vector2(c.ax + (c.left ? 0 : 0), -1.55);
      const elbowPt = new THREE.Vector2(A2.x, -1.55);
      const pr = ep(l, 0.0, 0.18, ease.outCubic), pr2 = ep(l, 0.12, 0.16, ease.outCubic);
      setSeg(c.line, A2, elbowPt, pr); setSeg(c.elbow, elbowPt, corner, pr2);
      c.dot.position.set(A2.x, A2.y, 0); c.halo.position.set(A2.x, A2.y, 0);
      c.halo.scale.setScalar(1 + 0.5 * ((l * 2) % 1)); c.halo.material.opacity = 1 - ((l * 2) % 1);
      const outT = t1 - 0.1;
      c.idx.animate(t, { at: t0 + 0.12, stagger: 0.01, dur: 0.2, style: 'fade', out: outT, outDur: 0.08 });
      c.la.animate(t, { at: t0 + 0.1, stagger: 0.018, dur: 0.3, style: 'rise', out: outT, outDur: 0.1, fromRight: !c.left });
      c.lb.animate(t, { at: t0 + 0.16, stagger: 0.014, dur: 0.3, style: 'rise', out: outT, outDur: 0.1, fromRight: !c.left });
      c.sub.animate(t, { at: t0 + 0.22, stagger: 0.006, dur: 0.25, style: 'fade', out: outT, outDur: 0.08 });
      const fade = 1 - ep(t, outT, 0.1);
      [c.line, c.elbow, c.dot].forEach(m => (m.material.opacity = fade));
      c.halo.material.opacity *= fade;
    });
    if (cur < 0) truck.highlight(null, 0);
    care.animate(t, { at: 8.6, stagger: 0.015, dur: 0.35, style: 'rise', out: 9.4, outDur: 0.1 });
    const cp = ep(t, 8.75, 0.35, ease.outBack) * (1 - ep(t, 9.4, 0.1)); careP.material.opacity = clamp(cp); careP.scale.setScalar(Math.max(0.001, cp));
    c3(t, lt);
  };

  // ---------------- 9.5–14 rewind + rebuild
  const S4 = seg(9.5, 14, { bloom: 0.85 });
  const c4 = chrome(S4, 4, 'REBUILD', true, DURATION);
  const rw = new TextLine('◀◀  REWIND', { size: 0.2, ls: 0.3, weight: 600, color: BRAND.redHot, mul: 1.1 }); rw.position.set(0, 2.6, 0);
  const asm = new TextLine('SNAP IT BACK TOGETHER', { size: 0.2, ls: 0.24, weight: 600 }); asm.position.set(0, 2.62, 0);
  const pct = (() => {
    const c = document.createElement('canvas'); c.width = 900; c.height = 300; const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 0.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
    let last = ''; m.userData.draw = (s, color) => { if (s + color === last) return; last = s + color; const x = c.getContext('2d'); x.clearRect(0, 0, 900, 300); x.font = fontStr(230, 700); x.fillStyle = color; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(s, 450, 160); tex.needsUpdate = true; };
    return m;
  })();
  pct.position.set(0, -2.2, 0);
  const track = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.02), new THREE.MeshBasicMaterial({ color: col('#ffffff', 0.18), toneMapped: false }));
  track.position.set(0, -2.82, 0);
  const fillBar = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.02), new THREE.MeshBasicMaterial({ color: col(BRAND.redHot, 1.8), toneMapped: false }));
  fillBar.geometry.translate(1.6, 0, 0); fillBar.position.set(-1.6, -2.82, 0.001);
  const rtr = texPlane(pill('READY TO RUN', { px: 44, bg: RED, ls: 0.2 }), 2.1); rtr.position.set(0, -3.15, 0);
  S4.hud.add(rw, asm, pct, track, fillBar, rtr);
  S4.update = (lt, t) => {
    showOnly(S4); reset(); common(t); turn.position.y = liftAt(t); truck.setWire(wireAt(t));
    truck.setPaint(PAINT.red);
    const jit = t < 10 ? 1 : 0;
    truck.pose(p => amount(p, t) + jit * 0.04 * Math.sin(t * 90 + p.snap * 7), t, t < 10 ? 1 : 1 - ep(t, 10, 3));
    // flash outline on the parts that just landed
    const landed = truck.parts.filter(p => p.snap > 9.9 && t >= p.snap && t < p.snap + 0.25).map(p => p.name);
    truck.highlight(landed, landed.length ? 1 - ramp(t, Math.floor(t * 2) / 2, Math.floor(t * 2) / 2 + 0.25) : 0, t);
    const base0 = -0.5 + 4 * 0.35 + 0.25 + 5.5 * 0.22;
    const rewind = ep(t, 9.5, 0.5, ease.inOutCubic);
    turn.rotation.y = base0 - rewind * 2.2 + ep(t, 10, 4, ease.inOutCubic) * (2 * Math.PI - 0.26 - (base0 - 2.2) + 0.16 - 0.16);
    sweep.intensity = 30;
    const close = ep(t, 10.0, 4.0, ease.inOutCubic);
    const a = lerp(1.25, 0.7, close) - 0.6 * rewind * (1 - close);
    camera.position.set(Math.sin(a) * lerp(13, 9.6, close), lerp(3.3, 1.8, close), Math.cos(a) * lerp(13, 9.6, close));
    camera.lookAt(0, lerp(1.25, 1.2, close), 0);
    if (t < 10) camera.rotation.z += Math.sin(t * 80) * 0.01;
    rw.animate(t, { at: 9.5, stagger: 0.02, dur: 0.15, style: 'fade', out: 9.95, outDur: 0.05 });
    asm.animate(t, { at: 10.05, stagger: 0.012, dur: 0.3, style: 'rise' });
    const done = SNAPS.filter(s => t >= s).length;
    const frac = t < 10 ? 0 : clamp(done / SNAPS.length * 0.875 + ep(t, 14 - 0.5, 0.5) * 0.125);
    const shown = t >= 13.95 ? 100 : Math.round(frac * 100);
    pct.userData.draw(`${shown}%`, shown === 100 ? '#ff2a2a' : '#eeeeee');
    pct.material.opacity = ep(t, 10.0, 0.15);
    pct.scale.setScalar(1 + 0.08 * Math.exp(-((t - (SNAPS.filter(s => t >= s).pop() ?? 0))) / 0.1));
    fillBar.scale.x = Math.max(0.0001, frac); track.visible = fillBar.visible = t >= 10;
    const rp = ep(t, 13.55, 0.3, ease.outBack); rtr.material.opacity = clamp(rp); rtr.scale.setScalar(Math.max(0.001, rp));
    c4(t, lt);
  };

  // ---------------- 14–16 climb
  const S5 = seg(14, 16, { bloom: 0.9 });
  const c5 = chrome(S5, 5, 'OFF-ROAD', true, DURATION);
  const deg = new TextLine('46°', { size: 1.5, ls: 0.0, color: '#ffffff' }); deg.position.set(0, 2.25, 0);
  const degL = new TextLine('MAX CLIMBING ANGLE', { size: 0.17, ls: 0.3, weight: 600, color: BRAND.redHot, mul: 1.1 }); degL.position.set(0, 1.38, 0);
  const statsTxt = ['52°  APPROACH', '39°  DEPARTURE', '40MM  GROUND CLEARANCE'];
  const stats = statsTxt.map((s, i) => { const m = texPlane(pill(s, { px: 40, bg: 'rgba(16,16,20,0.85)', border: 'rgba(255,42,42,0.8)', ls: 0.12, padX: 0.7 }), 0.3 * 1); const c = m.material.map.image; const w = 0.32 * c.width / c.height; m.scale.set(w, w, 1); m.position.set(0, -2.15 - i * 0.44, 0); S5.hud.add(m); return m; });
  S5.hud.add(deg, degL);
  S5.update = (lt, t) => {
    showOnly(S5); reset(); common(t); truck.setWire(0);
    ring.visible = ring2.visible = false;
    rampG.visible = true; arc.visible = true; base.visible = true;
    truck.setPaint(PAINT.red); truck.pose(() => 0); truck.highlight(null, 0);
    const climb = 0.6 + lt * 0.55;
    const th = THREE.MathUtils.degToRad(46);
    turn.rotation.set(0, 0, th);
    turn.position.set(Math.cos(th) * climb, Math.sin(th) * climb, 0);
    truck.spinWheels(climb / 0.31);
    arc.geometry.setDrawRange(0, Math.floor(arcGeo.index.count * ep(lt, 0.1, 0.6, ease.outCubic) / 6) * 6);
    sweep.intensity = 25;
    const a = -0.18 + lt * 0.05;
    camera.position.set(1.6 + Math.sin(a) * 9.6, 1.8, Math.cos(a) * 9.6);
    camera.lookAt(1.25, 1.45, 0);
    deg.animate(lt, { at: 0.0, stagger: 0.05, dur: 0.4, style: 'slam', out: 1.88, outDur: 0.12 });
    degL.animate(lt, { at: 0.2, stagger: 0.012, dur: 0.3, style: 'fade', out: 1.88, outDur: 0.1 });
    stats.forEach((m, i) => { const p = ep(lt, 1.0 + i * 0.25, 0.3, ease.outBack) * (1 - ep(lt, 1.88, 0.1)); m.material.opacity = clamp(p); const w = 0.32 * m.material.map.image.width / m.material.map.image.height; m.scale.set(w * Math.max(0.001, p), w * Math.max(0.001, p), 1); });
    c5(t, lt);
  };
  stats.forEach(m => m.geometry.dispose());
  stats.forEach(m => { m.geometry = new THREE.PlaneGeometry(1, 1 / (m.material.map.image.width / m.material.map.image.height)); });

  // ---------------- 16–17 remote
  const S6 = seg(16, 17, { bloom: 0.8 });
  const c6 = chrome(S6, 6, 'CONTROL', true, DURATION);
  const shade = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.72, depthWrite: false })); shade.position.z = -0.5; shade.userData.order = 998;
  const remote = imagePlane(A.tex.remote, 3.0); remote.position.set(1.0, -0.75, 0);
  const g1 = new TextLine('2.4GHZ', { size: 0.62, ls: 0.02, align: -1 }); g1.position.set(-1.85, 2.3, 0);
  const g2 = new TextLine('50M RANGE', { size: 0.42, ls: 0.02, align: -1, color: BRAND.redHot, mul: 1.05 }); g2.position.set(-1.85, 1.68, 0);
  const g3 = new TextLine('PROPORTIONAL THROTTLE', { size: 0.12, ls: 0.22, align: -1, weight: 600, color: '#ffffff', mul: 0.7 }); g3.position.set(-1.85, 1.25, 0);
  const g4 = new TextLine('& STEERING · LIGHT CONTROL', { size: 0.12, ls: 0.22, align: -1, weight: 600, color: '#ffffff', mul: 0.7 }); g4.position.set(-1.85, 1.02, 0);
  const g5 = texPlane(pill('8 KM/H · 30–40 MIN RUN', { px: 40, bg: RED, ls: 0.14 }), 2.6); g5.position.set(0, -2.95, 0);
  S6.hud.add(shade, remote, g1, g2, g3, g4, g5);
  S6.update = (lt, t) => {
    showOnly(S6); reset(); common(t); truck.setWire(0);
    ring.visible = ring2.visible = false; rampG.visible = true; arc.visible = true; base.visible = true;
    const th = THREE.MathUtils.degToRad(46); const climb = 0.6 + (2 + lt) * 0.55;
    turn.rotation.set(0, 0, th); turn.position.set(Math.cos(th) * climb, Math.sin(th) * climb, 0); truck.spinWheels(climb / 0.31);
    truck.pose(() => 0); truck.highlight(null, 0);
    camera.position.set(1.6 + Math.sin(-0.08) * 9.0, 1.8, Math.cos(-0.08) * 9.0); camera.lookAt(1.25, 1.45, 0);
    shade.material.opacity = 0.75 * ep(lt, 0, 0.15);
    const e = ep(lt, 0, 0.45);
    remote.position.set(lerp(3.5, 1.0, e), -0.75 + Math.sin(lt * 3) * 0.04, 0); remote.rotation.set(0, (1 - e) * -0.9 + Math.sin(lt * 2) * 0.08, (1 - e) * 0.3);
    remote.material.opacity = ep(lt, 0, 0.2);
    g1.animate(lt, { at: 0.05, stagger: 0.03, dur: 0.3, style: 'rise' });
    g2.animate(lt, { at: 0.15, stagger: 0.025, dur: 0.3, style: 'rise' });
    g3.animate(lt, { at: 0.3, stagger: 0.006, dur: 0.25, style: 'fade' });
    g4.animate(lt, { at: 0.36, stagger: 0.006, dur: 0.25, style: 'fade' });
    const p = ep(lt, 0.45, 0.3, ease.outBack); g5.material.opacity = clamp(p); g5.scale.setScalar(Math.max(0.001, p));
    c6(t, lt);
  };
  return segs;
}

// =====================================================================================
function endScene(A) {
  const S = mkScene(17, 20.5, { bloom: 0.8 });
  const bg = bgQuad(SMOKE_FRAG, { uInt: { value: 0.8 }, uRays: { value: 0.6 }, uC: { value: new THREE.Vector2(0, 0.0) } });
  S.scene.add(bg);
  const logo = logoStack(A.tex.logo, 2.3, 14, 0.18); logo.position.set(0, 2.62, 0); S.scene.add(logo);
  const name = new TextLine('MN82 · LAND CRUISER LC79', { size: 0.19, ls: 0.16, weight: 600 }); name.position.set(0, 1.92, 0.1);
  const red = imagePlane(A.tex.red, 1.75); red.position.set(0, 0.85, 0);
  const beige = imagePlane(A.tex.beige, 1.75); beige.position.set(0, -0.95, 0);
  const tagR = texPlane(pill('RED WINE', { px: 36, bg: '#7d0d12', ls: 0.2 }), 1.05); tagR.position.set(-1.35, 1.75 - 0.15, 0.2);
  const tagB = texPlane(pill('BEIGE', { px: 36, bg: '#a88f5f', fg: '#1a140a', ls: 0.2 }), 0.8); tagB.position.set(1.45, -0.05 - 0.15, 0.2);
  const glowR = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 1.6), new THREE.MeshBasicMaterial({ map: canvasTex(256, 128, (c, w, h) => { const g = c.createRadialGradient(w / 2, h * 0.8, 4, w / 2, h * 0.8, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }), color: col(BRAND.redHot, 0.5), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
  glowR.position.set(0, 0.35, -0.2);
  const glowB = glowR.clone(); glowB.position.set(0, -1.45, -0.2);
  S.scene.add(glowR, glowB, red, beige, tagR, tagB, name);
  const price = new TextLine('₹8,499', { size: 0.62, ls: 0.01 }); price.position.set(-0.45, -2.32, 0.1);
  const mrp = (() => { const c = pill('₹10,499', { px: 40, bg: 'rgba(0,0,0,0)', fg: '#9a9a9a', ls: 0.04 }); const x = c.getContext('2d'); x.strokeStyle = '#ff2a2a'; x.lineWidth = 5; x.beginPath(); x.moveTo(c.width * 0.18, c.height * 0.55); x.lineTo(c.width * 0.82, c.height * 0.48); x.stroke(); return texPlane(c, 1.2); })();
  mrp.position.set(1.25, -2.3, 0.1);
  const stock = texPlane(pill('IN STOCK · SHIPS IN 24–48 HRS', { px: 38, bg: '#ffffff', fg: BRAND.ink, dot: BRAND.green, ls: 0.08 }), 2.9); stock.position.set(0, -2.86, 0.1);
  const url = new TextLine('CRAZYRC.IN', { size: 0.3, ls: 0.16 }); url.position.set(0, -3.3, 0.1);
  S.scene.add(price, mrp, stock, url);
  const sparks = particles(260, { mode: 1, color: '#ff5a1f', mul: 3.5, size: 0.045, origin: new THREE.Vector3(0, 0, 0), seed: 77, speed: 1.8, gravity: 3, burstAt: 17.0 });
  const embers = particles(160, { mode: 0, color: '#ff3a12', mul: 2.2, size: 0.04, spread: new THREE.Vector3(7, 9, 5), seed: 66, speed: 0.8 });
  S.scene.add(sparks, embers);
  const ch = chrome(S, 7, 'GET YOURS', true, DURATION);
  S.update = (lt, t) => {
    const u = bg.material.uniforms; u.uTime.value = t; u.uRays.value = 0.4 + 0.6 * Math.exp(-lt / 0.5) + (lt > 2 ? 0.5 * Math.exp(-(lt - 2) / 0.4) : 0);
    [sparks, embers].forEach(p => (p.material.uniforms.uTime.value = t));
    const e1 = ep(lt, 0, 0.5), e2 = ep(lt, 0.25, 0.5);
    red.position.set(lerp(-4.5, 0, e1) + Math.sin(lt * 1.2) * 0.04, 0.85, 0); red.rotation.y = (1 - e1) * 0.6; red.material.opacity = clamp(e1 * 2);
    beige.position.set(lerp(4.5, 0, e2) - Math.sin(lt * 1.2) * 0.04, -0.95, 0); beige.rotation.y = (1 - e2) * -0.6; beige.material.opacity = clamp(e2 * 2);
    glowR.material.opacity = e1; glowB.material.opacity = e2;
    [[tagR, 0.45], [tagB, 0.6]].forEach(([m, a]) => { const p = ep(lt, a, 0.3, ease.outBack); m.material.opacity = clamp(p); m.scale.setScalar(Math.max(0.001, p)); });
    const le = ep(lt, 0.1, 0.4);
    logo.scale.setScalar(lerp(2.2, 1, le) + (lt > 2 ? 0.05 * Math.exp(-(lt - 2) / 0.25) : 0)); logo.position.z = (1 - le) * 2;
    logo.rotation.y = Math.sin(lt * 1.1) * 0.15; logo.visible = lt > 0.1;
    logo.userData.glint.uG.value = lerp(-0.4, 1.6, ep(lt, 2.0, 0.6, ease.inOutCubic));
    name.animate(lt, { at: 0.35, stagger: 0.012, dur: 0.35, style: 'rise' });
    price.animate(lt, { at: 0.75, stagger: 0.04, dur: 0.4, style: 'drop' });
    const mp = ep(lt, 0.95, 0.3, ease.outBack); mrp.material.opacity = clamp(mp); mrp.scale.setScalar(Math.max(0.001, mp));
    const sp = ep(lt, 1.1, 0.35, ease.outBack); stock.material.opacity = clamp(sp); stock.scale.setScalar(Math.max(0.001, sp));
    url.animate(lt, { at: 1.3, stagger: 0.03, dur: 0.4, style: 'rise' });
    S.camera.position.set(Math.sin(lt * 0.5) * 0.25, 0.05, lerp(10.4, 9.7, ep(lt, 0, 3, ease.outCubic)));
    S.camera.lookAt(0, -0.1, 0);
    ch(t, lt);
  };
  return S;
}
