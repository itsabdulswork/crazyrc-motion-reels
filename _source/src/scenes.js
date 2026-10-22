import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  BRAND, col, clamp, ramp, lerp, ease, ep, rng, wobble, TextLine, canvasTex, pill, checkIcon, texPlane,
  imagePlane, bgQuad, particles, fontStr,
} from './lib.js';

// Post-fx hits, aligned to the score (120 BPM: beat = 0.5 s, bar = 2 s)
export const HITS = [
  ...[0.5, 0.75, 1.0, 1.25, 1.5].map((t, i) => ({ t, shake: 0.12 + i * 0.04, ca: 0.15 })),
  { t: 2.0, flash: 1.3, ca: 1.6, zoom: 1.3, shake: 1.2, shock: [0.5, 0.56], zoomIn: 0.8 },
  { t: 4.0, flash: 0.5, flashCol: [1, 0.12, 0.05], ca: 0.9, zoom: 0.9, shake: 0.5, zoomIn: 0.5 },
  { t: 6.0, ca: 0.7, zoom: 0.8, shake: 0.4, zoomIn: 0.6 },
  ...[6.5, 7, 7.5, 8, 8.5, 9, 9.5].map(t => ({ t, ca: 0.35, shake: 0.15, zoom: 0.25 })),
  { t: 10.0, ca: 0.9, zoom: 1.2, glitch: 0.7, zoomIn: 0.5 },
  { t: 12.0, flash: 1.6, ca: 1.6, zoom: 1.2, shake: 1.3, shock: [0.5, 0.62], zoomIn: 1.2 },
  { t: 14.0, ca: 0.6, zoom: 0.6, shake: 0.3 },
  { t: 16.0, flash: 0.35, ca: 0.9, zoom: 1.1, shake: 0.6, zoomIn: 0.7 },
  ...[17, 18, 19].map(t => ({ t, ca: 0.5, shake: 0.3, zoom: 0.5 })),
  { t: 20.0, flash: 0.6, flashCol: [1, 0.1, 0.04], ca: 1.0, zoom: 0.9, shake: 0.7, zoomIn: 0.6 },
  ...[21, 22, 23].map(t => ({ t, ca: 0.6, zoom: 0.6, shake: 0.35 })),
  { t: 24.0, flash: 0.9, ca: 1.3, shake: 1.0, glitch: 1 },
  { t: 25.0, flash: 0.5, flashCol: [1, 0.1, 0.04], ca: 1.5, shake: 1.0, glitch: 1 },
  { t: 26.0, flash: 1.6, ca: 1.6, zoom: 1.3, shake: 1.3, shock: [0.5, 0.64], zoomIn: 1.2 },
  { t: 28.0, flash: 0.7, ca: 1.0, shake: 0.8, shock: [0.5, 0.64], shockAmp: 0.6 },
];

const RED = BRAND.red;
const FW = 4.1, FH = 7.28;   // frame size in world units at distance 10 (fov 40)

export function mkScene(start, end, opts = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov || 40, 1080 / 1920, 0.1, 600);
  scene.add(camera);
  const hud = new THREE.Group();
  hud.position.z = -(FH / 2) / Math.tan(((opts.fov || 40) * Math.PI) / 360);
  camera.add(hud);
  return { start, end, scene, camera, hud, ...opts };
}

function glowTex(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)') {
  return canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, inner); g.addColorStop(0.25, 'rgba(255,255,255,0.35)'); g.addColorStop(1, outer);
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
  });
}
const GLOW = glowTex();
export function glow(color, mul, size) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: GLOW, color: col(color, mul), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  return m;
}

/** extruded look for a flat logo: stacked alpha-to-coverage layers */
export function logoStack(tex, width, layers = 16, depth = 0.22) {
  const g = new THREE.Group();
  const h = (width * tex.image.height) / tex.image.width;
  const geo = new THREE.PlaneGeometry(width, h);
  for (let i = layers - 1; i >= 0; i--) {
    const k = i / (layers - 1);
    const c = i === 0 ? new THREE.Color(1, 1, 1) : new THREE.Color(0.32, 0.03, 0.03).multiplyScalar(1 - k * 0.8);
    const mat = new THREE.MeshBasicMaterial({ map: tex, color: c, alphaTest: 0.02, alphaToCoverage: true, toneMapped: false });
    const m = new THREE.Mesh(geo, mat);
    m.position.z = -k * depth;
    g.add(m);
  }
  // glint sweep (additive, masked by logo alpha)
  const glint = new THREE.Mesh(geo, new THREE.ShaderMaterial({
    uniforms: { map: { value: tex }, uG: { value: -1 }, uAmt: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `uniform sampler2D map; uniform float uG, uAmt; varying vec2 vUv;
      void main(){ vec4 t = texture2D(map, vUv); float d = (vUv.x * 1.0 + vUv.y * 0.35) - uG; float b = exp(-d*d/0.0006) * 0.45 + exp(-d*d/0.02) * 0.05;
        gl_FragColor = vec4(vec3(1.,.92,.85) * b * t.a * uAmt, 1.); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  glint.position.z = 0.002;
  g.add(glint);
  g.userData.glint = glint.material.uniforms;
  g.userData.h = h;
  return g;
}

/** thin top chrome shared by all scenes: brand tag, section index, progress bar */
export function chrome(S, idx, label, dark = true, dur = 30) {
  const g = new THREE.Group();
  const fg = dark ? '#ffffff' : BRAND.ink;
  const tag = new TextLine('CRAZYRC', { size: 0.12, ls: 0.32, color: fg, mul: dark ? 0.8 : 0.9, align: -1 });
  tag.position.set(-1.78, 3.3, 0);
  const sq = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), new THREE.MeshBasicMaterial({ color: col(RED, 1.2), toneMapped: false }));
  sq.position.set(-1.86, 3.3, 0);
  const idxT = new TextLine(`${String(idx).padStart(2, '0')} — ${label}`, { size: 0.1, ls: 0.25, color: fg, mul: dark ? 0.6 : 0.75, align: 1, weight: 600 });
  idxT.position.set(1.84, 3.3, 0);
  const track = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 0.012), new THREE.MeshBasicMaterial({ color: dark ? col('#ffffff', 0.12) : col('#000000', 0.12), transparent: true, opacity: dark ? 0.6 : 0.35, toneMapped: false }));
  track.position.set(0, 3.14, 0);
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 0.012), new THREE.MeshBasicMaterial({ color: col(RED, 1.4), toneMapped: false }));
  bar.geometry.translate(1.85, 0, 0);
  bar.position.set(-1.85, 3.14, 0.001);
  g.add(tag, sq, idxT, track, bar);
  S.hud.add(g);
  return (t, lt) => {
    bar.scale.x = Math.max(0.0001, t / dur);
    const o = ep(lt, 0.05, 0.3, ease.outCubic);
    tag.setOpacity(o); idxT.animate(lt, { at: 0.05, stagger: 0.012, dur: 0.3, style: 'fade' });
  };
}

// ======================================================================================
export function buildScenes(A, { W, H }) {
  const T = A.tex;
  const scenes = [
    s1Lights(A), s2Logo(A), s3Hero(A), s4Range(A), s5Brands(A),
    s6Care(A), s7Delivery(A), s8Community(A), s9Promise(A), s10End(A),
  ];
  // HUD overlays always draw on top of the 3D world
  scenes.forEach(S => S.hud.traverse(o => { if (o.material) { o.material.depthTest = false; o.material.fog = false; o.renderOrder = 999; } }));
  return scenes;
}

// -------------------------------------------------------------------------------- S1 0-2
function s1Lights(A) {
  const S = mkScene(0, 2, { bloom: 0.75, bloomRadius: 0.5 });
  const bg = bgQuad(/* glsl */`
    uniform float uTime; uniform vec2 uPar; uniform float uAspect, uLit; varying vec2 vUv;
    void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.) + uPar;
      float n = fbm(p * 2.5 + vec2(0., -uTime * .15));
      vec3 c = vec3(.008, .008, .01) + vec3(.06, .0, .0) * smoothstep(.7, .0, length(p - vec2(0., .18))) * (0.3 + uLit * 0.5);
      c += vec3(.04, .0, .0) * pow(n, 2.5) * (0.5 + uLit * .6);
      gl_FragColor = vec4(c, 1.); }`, { uLit: { value: 0 } });
  S.scene.add(bg);
  // floor grid
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLit: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime, uLit; varying vec3 vP;
      void main(){ vec2 g = abs(fract(vP.xz * .9) - .5); float l = smoothstep(.035, .0, min(g.x, g.y));
        float fade = exp(-length(vP.xz - vec2(0., -2.)) * .12);
        vec3 c = vec3(1., .04, .02) * l * fade * (0.25 + uLit * 0.8);
        gl_FragColor = vec4(c, 1.); }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -3.2;
  S.scene.add(floor);
  // gantry
  const metal = new THREE.MeshStandardMaterial({ color: 0x18191d, metalness: 0.7, roughness: 0.35, envMap: A.env, envMapIntensity: 0.5 });
  const beam = new THREE.Mesh(new RoundedBoxGeometry(3.75, 0.16, 0.2, 3, 0.05), metal);
  beam.position.set(0, 2.05, -0.1);
  S.scene.add(beam);
  const lamps = [];
  for (let i = 0; i < 5; i++) {
    const pod = new THREE.Group();
    pod.position.set((i - 2) * 0.72, 1.15, 0);
    const box = new THREE.Mesh(new RoundedBoxGeometry(0.6, 1.36, 0.34, 4, 0.1), metal);
    pod.add(box);
    for (let k = 0; k < 2; k++) {
      const y = k ? -0.3 : 0.3;
      const rim = new THREE.Mesh(new THREE.RingGeometry(0.19, 0.228, 48), new THREE.MeshBasicMaterial({ color: col('#2b2c31', 0.6), toneMapped: false }));
      rim.position.set(0, y, 0.175);
      const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.19, 48), new THREE.MeshBasicMaterial({ color: col('#200000'), toneMapped: false }));
      lamp.position.set(0, y, 0.176);
      const halo = glow(BRAND.redHot, 0, 1.0);
      halo.position.set(0, y, 0.2);
      pod.add(rim, lamp, halo);
      lamps.push({ lamp, halo, i });
    }
    S.scene.add(pod);
  }
  const L1 = new TextLine('ARE YOU', { size: 0.5, ls: 0.06, maxW: 3.2 });
  L1.position.set(0, -0.75, 0.2);
  const L2 = new TextLine('RC CRAZY?', { size: 0.86, ls: 0.01, color: BRAND.redHot, mul: 1.05, maxW: 3.3 });
  L2.position.set(0, -1.6, 0.2);
  S.scene.add(L1, L2);
  const dust = particles(160, { mode: 2, color: '#ff4a3a', mul: 0.7, size: 0.035, spread: new THREE.Vector3(8, 9, 6), seed: 3, speed: 0.1 });
  S.scene.add(dust);
  const ch = chrome(S, 1, 'LIGHTS OUT');
  const LIGHT_T = [0.5, 0.75, 1.0, 1.25, 1.5];
  S.update = (lt, t) => {
    const lit = LIGHT_T.filter(x => lt >= x).length;
    lamps.forEach(({ lamp, halo, i }) => {
      const on = lt >= LIGHT_T[i];
      const k = on ? 1 + 0.6 * Math.exp(-(lt - LIGHT_T[i]) / 0.06) : 0;
      lamp.material.color.copy(on ? new THREE.Color(3.2 * k, 0.04 * k, 0.02 * k) : col('#1a0000'));
      halo.material.color.copy(new THREE.Color(on ? 0.35 * k : 0, 0, 0));
    });
    bg.material.uniforms.uTime.value = t;
    bg.material.uniforms.uLit.value = lit / 5;
    floor.material.uniforms.uLit.value = lit / 5;
    dust.material.uniforms.uTime.value = t;
    L1.animate(lt, { at: 0.18, stagger: 0.035, dur: 0.5, style: 'rise' });
    L2.animate(lt, { at: 0.95, stagger: 0.04, dur: 0.45, style: 'slam' });
    const push = lerp(12.2, 10.2, ep(lt, 0, 1.5, ease.inOutCubic)) - 1.8 * ep(lt, 1.5, 0.5, ease.inExpo);
    S.camera.position.set(Math.sin(lt * 0.9) * 0.35, -0.9 + lt * 0.15, push);
    S.camera.lookAt(0, 0.35, 0);
    S.camera.rotation.z += Math.sin(lt * 1.3) * 0.02;
    bg.material.uniforms.uPar.value.set(S.camera.position.x * 0.02, 0);
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S2 2-4
export const SMOKE_FRAG = /* glsl */`
  uniform float uTime, uAspect, uInt, uRays; uniform vec2 uPar; uniform vec2 uC; varying vec2 vUv;
  void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.) + uPar; vec2 q = p - uC;
    float r = length(q);
    float n = fbm(p * 2.0 + vec2(uTime * .12, -uTime * .28));
    float n2 = fbm(p * 3.6 + n * 1.8 - vec2(0., uTime * .35));
    vec3 c = vec3(.007, .005, .006) + vec3(.16, .0, .0) * smoothstep(1.1, .25, r) * uInt;
    c += vec3(.55, .02, .0) * pow(n2, 3.2) * 0.8 * smoothstep(1.2, .25, r) * uInt;
    c += vec3(.10, .01, .01) * exp(-r * r * 9.);
    float a = atan(q.y, q.x);
    float rays = pow(.5 + .5 * sin(a * 13. + uTime * .5 + n * 4.), 7.) * smoothstep(.9, .0, r);
    c += vec3(1., .06, .02) * rays * .32 * uRays * smoothstep(.12, .35, r);
    gl_FragColor = vec4(c, 1.); }`;

function marquee(text, { bg = RED, fg = '#fff', w = 12, h = 0.34 } = {}) {
  const tex = canvasTex(2048, 96, (ctx, cw, chh) => {
    ctx.fillStyle = bg; ctx.fillRect(0, 0, cw, chh);
    ctx.font = fontStr(50, 700); ctx.fillStyle = fg; ctx.textBaseline = 'middle';
    ctx.letterSpacing = '3px';
    let x = 0; const unit = text + '   ●   ';
    const uw = ctx.measureText(unit).width;
    // repeat so the texture tiles seamlessly
    const reps = Math.max(1, Math.round(cw / uw));
    const sx = cw / (uw * reps);
    ctx.save(); ctx.scale(sx, 1);
    for (let i = 0; i < reps; i++) { ctx.fillText(unit, x, chh / 2 + 2); x += uw; }
    ctx.restore();
  });
  tex.wrapS = THREE.RepeatWrapping;
  tex.repeat.x = w / (h * 2048 / 96);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true, depthWrite: false }));
  return m;
}

function s2Logo(A) {
  const S = mkScene(2, 4, { bloom: 0.85 });
  const bg = bgQuad(SMOKE_FRAG, { uInt: { value: 1 }, uRays: { value: 1 }, uC: { value: new THREE.Vector2(0, 0.08) } });
  S.scene.add(bg);
  const logo = logoStack(A.tex.logo, 3.6, 18, 0.26);
  logo.position.set(0, 0.45, 0);
  S.scene.add(logo);
  const halo = glow(BRAND.redHot, 0.5, 6.5); halo.position.set(0, 0.45, -0.6); S.scene.add(halo);
  const sparks = particles(320, { mode: 1, color: '#ff5a1f', mul: 4, size: 0.05, origin: new THREE.Vector3(0, 0.45, 0), seed: 11, speed: 1.6, gravity: 3, burstAt: 2.0 });
  const embers = particles(180, { mode: 0, color: '#ff3a12', mul: 2.5, size: 0.045, spread: new THREE.Vector3(7, 9, 5), seed: 5, speed: 0.9 });
  S.scene.add(sparks, embers);
  const sub = new TextLine("INDIA'S FAVOURITE RC STORE", { size: 0.2, ls: 0.2, weight: 600, maxW: 3.2 });
  sub.position.set(0, -0.72, 0.1);
  const rule = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.025), new THREE.MeshBasicMaterial({ color: col(RED, 1.6), toneMapped: false }));
  rule.position.set(0, -1.05, 0.1);
  S.scene.add(sub, rule);
  const m1 = marquee('FREE 6 MONTHS REPAIR ON ALL HOBBY GRADE RC CARS   ●   CASH ON DELIVERY ON IN-STOCK MODELS   ●   FREE SHIPPING ACROSS INDIA');
  m1.position.set(0, 2.55, -0.5); m1.rotation.z = -0.09;
  const m2 = marquee('CRAWLERS   ●   BASHERS   ●   BUGGIES   ●   DRIFT   ●   F1   ●   PLANES   ●   BOATS   ●   EXCAVATORS', { bg: '#111114', fg: BRAND.redHot });
  m2.position.set(0, -2.45, -0.5); m2.rotation.z = 0.07;
  S.scene.add(m1, m2);
  const ch = chrome(S, 2, 'BRAND');
  S.update = (lt, t) => {
    const u = bg.material.uniforms; u.uTime.value = t;
    u.uRays.value = 0.5 + 0.7 * Math.exp(-lt / 0.5);
    const e = ep(lt, 0, 0.42);
    logo.scale.setScalar(lerp(2.8, 1, e) * (1 + 0.04 * Math.exp(-ramp(lt, 0.42, 1) * 6) * Math.sin(lt * 30)));
    logo.position.z = (1 - e) * 2.5;
    logo.rotation.set(Math.sin(lt * 1.3) * 0.06, Math.sin(lt * 1.1 + 0.4) * 0.28 * ep(lt, 0.3, 0.6, ease.outCubic), (1 - e) * -0.2);
    logo.visible = lt > 0.0;
    logo.userData.glint.uG.value = lerp(-0.4, 1.6, ep(lt, 0.55, 0.7, ease.inOutCubic));
    halo.material.color.copy(col(BRAND.redHot, 0.25 + 0.6 * Math.exp(-lt / 0.4)));
    sparks.material.uniforms.uTime.value = t;
    embers.material.uniforms.uTime.value = t;
    sub.animate(lt, { at: 0.38, stagger: 0.018, dur: 0.45, style: 'rise' });
    rule.scale.x = Math.max(0.001, 2.2 * ep(lt, 0.5, 0.6, ease.inOutExpo));
    const mi = ep(lt, 0.05, 0.5);
    m1.position.x = lerp(-12, 0, mi); m2.position.x = lerp(12, 0, mi);
    m1.material.map.offset.x = lt * 0.18; m2.material.map.offset.x = -lt * 0.16;
    // exit whip
    const out = ep(lt, 1.72, 0.28, ease.inExpo);
    S.camera.position.set(Math.sin(lt * 0.8) * 0.5, 0.25, lerp(10.2, 9.0, ep(lt, 0, 2, ease.outCubic)) - out * 3);
    S.camera.lookAt(0, 0.2, 0);
    S.camera.rotation.z += out * -0.25;
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S3 4-6
const STUDIO_FRAG = /* glsl */`
  uniform float uTime, uAspect, uGlow; uniform vec2 uPar; varying vec2 vUv;
  void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.) + uPar;
    vec3 c = mix(vec3(.018, .018, .022), vec3(.004, .004, .006), smoothstep(-.5, .5, p.y));
    float hz = exp(-pow((p.y + .08) * 4.5, 2.)) * smoothstep(.9, 0., abs(p.x));
    c += vec3(.55, .01, .0) * hz * .55 * uGlow;
    c += vec3(.05, .0, .0) * pow(fbm(p * 3. + uTime * .1), 3.) * 2.;
    gl_FragColor = vec4(c, 1.); }`;

function speedLines(n, seed, { color = '#ffffff', mul = 1.6, len = 3, spreadY = 6, spreadZ = 3, gap = 0 } = {}) {
  const r = rng(seed);
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: col(color, mul), transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), n);
  mesh.userData.r = Array.from({ length: n }, () => [r(), r(), r(), r()]);
  mesh.userData.len = len; mesh.userData.sy = spreadY; mesh.userData.sz = spreadZ; mesh.userData.gap = gap;
  mesh.frustumCulled = false;
  return mesh;
}
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3();
function updateLines(mesh, t, speed, amt) {
  const { r, len, sy, sz, gap } = mesh.userData;
  r.forEach((k, i) => {
    const x = 7 - ((t * speed * (0.7 + k[0]) + k[1] * 14) % 14);
    const zz = gap ? Math.sign(k[3] - 0.5) * (gap + Math.abs(k[3] - 0.5) * 2 * (sz / 2 - gap)) : (k[3] - 0.5) * sz;
    _v.set(x, (k[2] - 0.5) * sy, zz);
    _s.set(len * (0.4 + k[0]) * amt + 0.0001, 0.012 + k[3] * 0.02, 1);
    _m.compose(_v, _q, _s);
    mesh.setMatrixAt(i, _m);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

export function chipRow(labels, { px = 46, gap = 0.08, h = 0.3, style = 'outline' } = {}) {
  const g = new THREE.Group();
  const items = labels.map(l => {
    const c = style === 'outline'
      ? pill(l, { px, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.55)', fg: '#fff', ls: 0.12, padX: 0.7, padY: 0.38 })
      : pill(l, { px, ls: 0.12, padX: 0.7, padY: 0.38 });
    const m = texPlane(c, (h * c.width) / c.height);
    m.userData.w = (h * c.width) / c.height;
    return m;
  });
  const total = items.reduce((a, m) => a + m.userData.w, 0) + gap * (items.length - 1);
  let x = -total / 2;
  items.forEach(m => { m.position.x = x + m.userData.w / 2; x += m.userData.w + gap; g.add(m); });
  g.userData.items = items;
  return g;
}

function s3Hero(A) {
  const S = mkScene(4, 6, { bloom: 0.7 });
  const bg = bgQuad(STUDIO_FRAG, { uGlow: { value: 1 } });
  S.scene.add(bg);
  const topL = new TextLine('BUILT FOR', { size: 0.24, ls: 0.35, weight: 600, color: '#ffffff', mul: 0.75 });
  topL.position.set(0, 3.0, -1.5);
  const big1 = new TextLine('EVERY', { size: 1.15, ls: 0.0, stroke: 0.022, color: '#ffffff', mul: 0.85 });
  big1.position.set(0, 2.18, -1.6);
  const big2 = new TextLine('TERRAIN', { size: 0.92, ls: -0.01, color: BRAND.redHot, mul: 1.0 });
  big2.position.set(0, 1.12, -1.6);
  S.scene.add(topL, big1, big2);
  // floor + reflection
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `uniform float uTime; varying vec3 vP; void main(){
      float d = length(vP.xz * vec2(.45, 1.)); vec3 c = vec3(.25, .0, .0) * exp(-d * 1.2) + vec3(.012);
      vec2 g = abs(fract(vP.xz * 1.2 + vec2(uTime * 2.2, 0.)) - .5); c += vec3(.4, .02, .0) * smoothstep(.03, .0, min(g.x, g.y)) * exp(-d * .5) * .35;
      gl_FragColor = vec4(c, 1.); }`,
  }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -1.55;
  S.scene.add(floor);
  const car = imagePlane(A.tex.h12y, 2.45);
  const carG = new THREE.Group(); carG.add(car);
  car.position.y = 2.45 / 2;
  carG.position.set(0, -1.62, 0.6);
  const refl = imagePlane(A.tex.h12y, 2.45, { opacity: 0.13, depthTest: false });
  refl.scale.y = -1; refl.position.y = -2.45 / 2; refl.renderOrder = 2;
  carG.add(refl);
  const rim = glow(BRAND.redHot, 0.55, 5); rim.position.set(0, 1.3, -0.4); carG.add(rim);
  S.scene.add(carG);
  const lines = speedLines(46, 9, { len: 3.5, spreadY: 4.5, spreadZ: 4 });
  lines.position.set(0, -0.3, 0.2);
  S.scene.add(lines);
  const dust = particles(220, { mode: 1, color: '#c0603a', mul: 0.9, size: 0.06, origin: new THREE.Vector3(0.2, -1.5, 0.6), seed: 21, speed: 0.55, gravity: 1.2, burstAt: 4.32 });
  S.scene.add(dust);
  // info block
  const name = new TextLine('MJX HYPER GO H12Y', { size: 0.27, ls: 0.06 });
  name.position.set(0, -2.25, 0);
  const chips = chipRow(['BRUSHLESS', '4WD', '1:12 SCALE', 'RTR'], { h: 0.27 });
  chips.position.set(0, -2.68, 0);
  const stock = texPlane(pill('IN STOCK', { px: 52, bg: '#ffffff', fg: BRAND.ink, dot: BRAND.green, ls: 0.06 }), 1.15);
  stock.position.set(-0.72, -3.12, 0);
  const price = new TextLine('₹22,499', { size: 0.36, ls: 0.02, color: '#ffffff' });
  price.position.set(0.72, -3.12, 0);
  S.hud.add(name, chips, stock, price);
  const ch = chrome(S, 3, 'HERO');
  S.update = (lt, t) => {
    bg.material.uniforms.uTime.value = t;
    floor.material.uniforms.uTime.value = lt * (1 - ep(lt, 0.2, 0.6, ease.outCubic)) + 0.6;
    const e = ep(lt, 0, 0.5);
    const land = ep(lt, 0.3, 0.5, ease.outElastic);
    carG.position.x = lerp(6.5, 0, e);
    carG.position.y = -1.62 + Math.sin(ramp(lt, 0.22, 0.42) * Math.PI) * 0.25 * (lt < 0.42 ? 1 : 0);
    carG.rotation.z = (1 - land) * 0.06 + (1 - e) * 0.05;
    carG.scale.setScalar(1 + 0.02 * Math.sin(lt * 2));
    updateLines(lines, lt, 22, 1);
    lines.material.opacity = 0.55 * (1 - ep(lt, 0.25, 0.6, ease.outCubic)) + 0.08;
    dust.material.uniforms.uTime.value = t;
    topL.animate(lt, { at: 0.12, stagger: 0.025, dur: 0.4, style: 'rise' });
    big1.animate(lt, { at: 0.18, stagger: 0.045, dur: 0.5, style: 'rise' });
    big2.animate(lt, { at: 0.32, stagger: 0.04, dur: 0.5, style: 'rise' });
    name.animate(lt, { at: 0.55, stagger: 0.015, dur: 0.4, style: 'wipe' });
    chips.userData.items.forEach((m, i) => { const p = ep(lt, 0.7 + i * 0.07, 0.35, ease.outBack); m.scale.setScalar(Math.max(0.001, p)); m.material.opacity = clamp(p); });
    const ps = ep(lt, 1.0, 0.4, ease.outBack); stock.scale.setScalar(Math.max(0.001, ps)); stock.material.opacity = clamp(ps);
    price.animate(lt, { at: 1.05, stagger: 0.03, dur: 0.4, style: 'drop' });
    // camera: slow orbit + push, quick exit push
    const a = lerp(-0.13, 0.1, ep(lt, 0, 2, ease.inOutCubic));
    const r = lerp(10.4, 9.2, ep(lt, 0, 2, ease.outCubic)) - 2.5 * ep(lt, 1.8, 0.2, ease.inExpo);
    S.camera.position.set(Math.sin(a) * r, 0.35, Math.cos(a) * r);
    S.camera.lookAt(0, -0.05, 0);
    bg.material.uniforms.uPar.value.set(a * 0.15, 0);
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S4 6-10
const CATS = [
  ['CRAWLERS', 'TRAXXAS TRX-4M', 'trx4m'], ['BASHERS', 'ZD RACING MX-07 · 80 KM/H', 'mx07'],
  ['BUGGIES', 'NITRO & ELECTRIC', 'nb48'], ['ON-ROAD', '& DRIFT', 'huracan'],
  ['F1 CORNER', 'OFFICIAL LICENSED', 'sf25'], ['CONSTRUCTION', 'EXCAVATORS · LOADERS', 'excav'],
  ['AIRCRAFT', 'E-FLITE JETS & PLANES', 'f14'], ['BOATS', 'BRUSHLESS SPEEDBOATS', 'sonic'],
];

function cardTex(img, i, total) {
  return canvasTex(900, 1180, (ctx, w, h) => {
    ctx.fillStyle = BRAND.paper; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 46); ctx.fill();
    // subtle top gradient
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ececec');
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(10, 10, w - 20, h - 20, 40); ctx.fill();
    // red corner index
    ctx.font = fontStr(64, 700); ctx.fillStyle = BRAND.red; ctx.textBaseline = 'top';
    ctx.fillText(String(i + 1).padStart(2, '0'), 56, 50);
    ctx.font = fontStr(30, 600); ctx.fillStyle = '#9a9a9a'; ctx.letterSpacing = '6px';
    ctx.fillText(`/ ${String(total).padStart(2, '0')}`, 140, 74);
    ctx.letterSpacing = '0px';
    // floor shadow ellipse
    const sg = ctx.createRadialGradient(w / 2, 790, 10, w / 2, 790, 380);
    sg.addColorStop(0, 'rgba(0,0,0,0.22)'); sg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save(); ctx.scale(1, 0.18); ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(w / 2, 790 / 0.18, 380, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    // shop now pill
    ctx.fillStyle = BRAND.red; ctx.beginPath(); ctx.roundRect(56, h - 150, 300, 90, 12); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = fontStr(38, 700); ctx.textBaseline = 'middle'; ctx.letterSpacing = '3px';
    ctx.fillText('SHOP NOW', 88, h - 103);
    ctx.letterSpacing = '0px';
    ctx.fillStyle = BRAND.ink; ctx.font = fontStr(30, 600);
    ctx.fillText('crazyrc.in', w - 230, h - 103);
  });
}

function s4Range(A) {
  const S = mkScene(6, 10, { bloom: 0.55, bloomThreshold: 1.0 });
  const bg = bgQuad(STUDIO_FRAG, { uGlow: { value: 0.7 } });
  S.scene.add(bg);
  // giant outlined background type
  const bgText = canvasTex(2048, 300, (ctx, w, h) => {
    ctx.font = fontStr(230, 700); ctx.strokeStyle = 'rgba(219,0,0,0.9)'; ctx.lineWidth = 4; ctx.textBaseline = 'middle';
    ctx.strokeText('LAND · AIR · WATER · ', 10, h / 2 + 10);
  });
  bgText.wrapS = THREE.RepeatWrapping;
  const bgT = new THREE.Mesh(new THREE.PlaneGeometry(30, 30 * 300 / 2048 * 1), new THREE.MeshBasicMaterial({ map: bgText, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false }));
  bgText.repeat.x = 1;
  bgT.position.set(0, 1.0, -14);
  S.scene.add(bgT);
  const bgT2 = bgT.clone(); bgT2.material = bgT.material.clone(); bgT2.material.map = bgText.clone(); bgT2.material.map.wrapS = THREE.RepeatWrapping; bgT2.material.map.needsUpdate = true;
  bgT2.position.set(0, -4.6, -14);
  S.scene.add(bgT2);
  const R = 6.2;                 // ring radius
  const STEP = 0.43;              // radians between cards
  const ring = new THREE.Group();
  ring.position.set(0, 0.25, -R);
  S.scene.add(ring);
  const cards = CATS.map(([name, sub, key], i) => {
    const g = new THREE.Group();
    const card = new THREE.Mesh(new THREE.PlaneGeometry(3.05, 3.05 * 1180 / 900), new THREE.MeshBasicMaterial({ map: cardTex(null, i, CATS.length), transparent: true, depthWrite: false, toneMapped: false }));
    g.add(card);
    const img = A.tex[key].image;
    const maxW = 3.3, maxH = 2.3;
    const h = Math.min(maxH, (maxW * img.height) / img.width);
    const pic = imagePlane(A.tex[key], h);
    pic.position.set(0, 0.32 + (maxH - h) * 0.15, 0.32);   // pops out of the card
    g.add(pic);
    const a = i * STEP;
    g.position.set(Math.sin(a) * R, 0, Math.cos(a) * R);
    g.rotation.y = a;
    ring.add(g);
    const title = new TextLine(name, { size: name.length > 9 ? 0.46 : 0.62, ls: 0.01 });
    title.position.set(0, -2.55, 0);
    const subT = new TextLine(sub, { size: 0.15, ls: 0.24, weight: 600, color: '#ffffff', mul: 0.6 });
    subT.position.set(0, -3.0, 0);
    S.hud.add(title, subT);
    return { g, card, pic, title, subT };
  });
  const head = new TextLine('SHOP BY CATEGORY', { size: 0.17, ls: 0.34, weight: 600 });
  head.position.set(0, 2.8, 0);
  const redBar = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.03), new THREE.MeshBasicMaterial({ color: col(RED, 1.4), toneMapped: false }));
  redBar.position.set(0, 2.58, 0);
  S.hud.add(head, redBar);
  const ch = chrome(S, 4, 'RANGE');
  S.update = (lt, t) => {
    bg.material.uniforms.uTime.value = t;
    // ring steps one card per beat, landing on the beat
    let idx = 0;
    for (let k = 1; k < 8; k++) idx += ep(lt, k * 0.5 - 0.2, 0.28, ease.inOutQuart);
    const enter = 1 - ep(lt, 0, 0.45, ease.outExpo);
    ring.rotation.y = -idx * STEP + enter * 1.4;
    const ex = ep(lt, 3.72, 0.28, ease.inExpo);
    cards.forEach((c, i) => {
      const d = Math.abs(i - idx);
      const focus = clamp(1 - d);
      c.card.material.color.setScalar(lerp(0.35, 1.0, focus));
      c.pic.material.color.setScalar(lerp(0.4, 1.0, focus));
      c.pic.position.z = 0.32 + 0.25 * focus;
      c.pic.rotation.z = Math.sin(t * 2 + i) * 0.015;
      const tin = i * 0.5 - (i === 0 ? 0 : 0.08);
      c.title.animate(lt, { at: tin, stagger: 0.016, dur: 0.3, style: 'rise', out: i < 7 ? i * 0.5 + 0.42 : 3.75, outDur: 0.12, outStyle: 'up' });
      c.subT.animate(lt, { at: tin + 0.06, stagger: 0.008, dur: 0.25, style: 'fade', out: i < 7 ? i * 0.5 + 0.42 : 3.75, outDur: 0.1 });
    });
    head.animate(lt, { at: 0.05, stagger: 0.02, dur: 0.4, style: 'rise' });
    redBar.scale.x = Math.max(0.001, ep(lt, 0.2, 0.4) * (1 + 0.5 * Math.sin(idx * Math.PI)));
    bgT.material.map.offset.x = lt * 0.08; bgT2.material.map.offset.x = -lt * 0.06 + 0.3;
    const bump = 0.12 * Math.exp(-((lt % 0.5)) / 0.12) * (lt > 0.45 ? 1 : 0);
    S.camera.position.set(Math.sin(lt * 0.7) * 0.25, 0.25 + Math.sin(lt * 0.5) * 0.1, 10.0 - bump - ex * 4);
    S.camera.lookAt(0, 0.2, -2);
    S.camera.rotation.z += Math.sin(lt * 0.9) * 0.012;
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S5 10-12
const BRANDS = ['TRAXXAS', 'ARRMA', 'LOSI', 'TAMIYA', 'KYOSHO', 'E-FLITE', 'AXIAL', 'MJX', 'WLTOYS', 'RGT', 'FMS', 'RASTAR', 'HUINA', 'ZD RACING', 'PRO BOAT', 'MAISTO', 'BBURAGO', 'JJRC', 'HSP', 'MST', 'JLB RACING', 'KAMTOM', 'HOBBYZONE', 'HANGAR 9', 'CROSSRC', 'MNRC', 'SUCHIYU', 'HB TOYS', 'TEAM LOSI', 'HYPER GO'];

function counterPlane(w, cw, chh) {
  const c = document.createElement('canvas'); c.width = cw; c.height = chh;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * chh) / cw), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  let last = null;
  m.userData.draw = (str, color = '#fff') => {
    if (str === last) return; last = str;
    const ctx = c.getContext('2d'); ctx.clearRect(0, 0, cw, chh);
    ctx.font = fontStr(Math.round(chh * 0.78), 700); ctx.fillStyle = color === '#fff' ? '#eeeeee' : color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(str, cw / 2, chh * 0.54);
    tex.needsUpdate = true;
  };
  return m;
}

function s5Brands(A) {
  const S = mkScene(10, 12, { bloom: 0.8, fov: 55 });
  S.scene.fog = new THREE.Fog(0x000000, 12, 48);
  const tex = canvasTex(2048, 1024, (ctx, w, h) => {
    ctx.fillStyle = '#070708'; ctx.fillRect(0, 0, w, h);
    const r = rng(77); const rows = 6; let bi = 0;
    for (let row = 0; row < rows; row++) {
      let x = -r() * 200; const y = (row + 0.5) * (h / rows);
      while (x < w) {
        const b = BRANDS[bi++ % BRANDS.length];
        const style = r();
        ctx.font = fontStr(96, 700); ctx.letterSpacing = '4px'; ctx.textBaseline = 'middle';
        if (style < 0.22) { ctx.fillStyle = RED; ctx.fillText(b, x, y); }
        else if (style < 0.6) { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.5; ctx.strokeText(b, x, y); }
        else { ctx.fillStyle = 'rgba(235,235,235,0.92)'; ctx.fillText(b, x, y); }
        x += ctx.measureText(b).width + 90;
      }
      ctx.fillStyle = 'rgba(219,0,0,0.5)'; ctx.fillRect(0, (row + 1) * (h / rows) - 2, w, 3);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(-2, 12);
  const tunnel = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.2, 200, 64, 1, true), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, toneMapped: false, color: col('#ffffff', 0.9) }));
  tunnel.rotation.x = Math.PI / 2;
  tunnel.position.z = -95;
  S.scene.add(tunnel);
  const rings = [];
  for (let i = 0; i < 22; i++) {
    const rr = new THREE.Mesh(new THREE.TorusGeometry(3.12, 0.02, 6, 96), new THREE.MeshBasicMaterial({ color: col(BRAND.redHot, 3), toneMapped: false }));
    rr.position.z = -i * 8 - 4; S.scene.add(rr); rings.push(rr);
  }
  const endLight = glow('#ffffff', 2.5, 14); endLight.position.z = -150; S.scene.add(endLight);
  // HUD
  const num = counterPlane(3.6, 1200, 420); num.position.set(0, 0.5, 0);
  const lab1 = new TextLine('MODELS', { size: 0.42, ls: 0.3, weight: 600 }); lab1.position.set(0, -0.48, 0);
  const lab2 = new TextLine('GLOBAL BRANDS', { size: 0.3, ls: 0.28, weight: 600 }); lab2.position.set(0, -0.48, 0);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 2.6), new THREE.MeshBasicMaterial({ map: GLOW, color: new THREE.Color(0, 0, 0), transparent: true, opacity: 0.85, depthWrite: false }));
  plate.position.set(0, 0.1, -0.1);
  S.hud.add(plate, num, lab1, lab2);
  const ch = chrome(S, 5, 'BRANDS');
  S.update = (lt, t) => {
    const z = -(lt * 14 + Math.pow(lt, 3) * 9);
    S.camera.position.set(0, 0, z);
    S.camera.rotation.set(0, 0, lt * 0.55 + Math.pow(lt, 2) * 0.2);
    endLight.material.color.copy(col('#ffffff', 0.5 + 6 * Math.pow(ramp(lt, 1.2, 2), 3)));
    endLight.scale.setScalar(1 + 3 * Math.pow(ramp(lt, 1.3, 2), 2));
    rings.forEach((r, i) => { r.material.color.copy(col(BRAND.redHot, 2 + 2 * Math.sin(t * 8 - i))); });
    // counters
    const p1 = ep(lt, 0.05, 0.6, ease.outCubic);
    const p2 = ep(lt, 1.0, 0.5, ease.outCubic);
    if (lt < 0.98) {
      num.userData.draw(`${Math.round(350 * p1)}${p1 > 0.98 ? '+' : ''}`);
      num.material.opacity = ep(lt, 0, 0.12) * (1 - ep(lt, 0.88, 0.1));
    } else {
      num.userData.draw(`${Math.round(40 * p2)}${p2 > 0.98 ? '+' : ''}`, '#ff2a2a');
      num.material.opacity = ep(lt, 0.98, 0.1);
    }
    num.scale.setScalar(1 + 0.08 * Math.exp(-((lt < 0.98 ? lt : lt - 0.98)) / 0.15));
    lab1.animate(lt, { at: 0.12, stagger: 0.03, dur: 0.35, style: 'rise', out: 0.86, outDur: 0.12 });
    lab2.animate(lt, { at: 1.05, stagger: 0.02, dur: 0.35, style: 'rise', out: 1.85, outDur: 0.15, outStyle: 'scale' });
    plate.material.opacity = 0.75 * (1 - ep(lt, 1.8, 0.2));
    num.material.opacity *= 1 - ep(lt, 1.8, 0.15);
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S6 12-16
const PAPER_FRAG = /* glsl */`
  uniform float uTime, uAspect; uniform vec2 uPar; varying vec2 vUv;
  void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.) + uPar;
    vec3 c = vec3(.90, .90, .905);
    vec2 g = fract(p * 22.) - .5; float dots = smoothstep(.09, .05, length(g));
    c -= dots * .05;
    c = mix(c, vec3(.72, .05, .04), smoothstep(.55, 1.25, length(p * vec2(1.3, .8))) * .55);
    c -= .03 * fbm(p * 2. + uTime * .05);
    gl_FragColor = vec4(c, 1.); }`;

function s6Care(A) {
  const S = mkScene(12, 16, { bloom: 0.25, bloomThreshold: 1.1, vignette: 0.18, grain: 0.03 });
  const bg = bgQuad(PAPER_FRAG);
  S.scene.add(bg);
  S.scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(3, 5, 6); S.scene.add(key);
  const fill = new THREE.DirectionalLight(0xff3020, 1.5); fill.position.set(-5, -2, 2); S.scene.add(fill);
  const geo = new TextGeometry('6', { font: A.font3d, size: 2.55, depth: 0.75, curveSegments: 16, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.06, bevelSegments: 6 });
  geo.center();
  const six = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: new THREE.Color(BRAND.red), metalness: 0.45, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08, envMap: A.env, envMapIntensity: 1.3 }));
  const sixG = new THREE.Group(); sixG.add(six); sixG.position.set(0, 0.68, 0);
  S.scene.add(sixG);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.2), new THREE.MeshBasicMaterial({ map: GLOW, color: new THREE.Color(0, 0, 0), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.MultiplyBlending, premultipliedAlpha: true }));
  shadow.position.set(0.15, -1.0, -1.2);
  // orbiting text ring — echoes the rotating badge on crazyrc.in
  const ringG = new THREE.Group(); ringG.position.copy(sixG.position); ringG.rotation.set(0.3, 0, -0.12);
  const ringStr = 'CRAZYRC CARE PLAN • FREE REPAIRS • 6 MONTHS • ';
  const atlasLine = new TextLine(ringStr, { size: 0.21, ls: 0.34, color: BRAND.slate, mul: 1, maxW: 1e9 });
  const circ = atlasLine.width; const RR = circ / (2 * Math.PI);
  atlasLine.glyphs.forEach(g => {
    const x = g.holder.userData.base.x + circ / 2; const th = (x / circ) * Math.PI * 2;
    g.holder.position.set(Math.sin(th) * RR, 0, Math.cos(th) * RR);
    g.holder.rotation.set(0, th, 0);
    g.holder.userData.base = g.holder.position.clone();
    g.mat.side = THREE.DoubleSide;
    ringG.add(g.holder);
  });
  S.scene.add(ringG);
  const top = texPlane(pill("INDIA'S FIRST RC CARE PLAN", { px: 46, ls: 0.14 }), 3.1);
  top.position.set(0, 3.0 - 0.15, 0.5);
  const every = new TextLine('EVERY RC COMES WITH', { size: 0.2, ls: 0.26, weight: 600, color: BRAND.slate, mul: 1 });
  every.position.set(0, 2.5 - 0.1, 0.5);
  const mo = new TextLine('MONTHS', { size: 0.78, ls: 0.04, color: BRAND.ink, mul: 1 });
  mo.position.set(0, -1.28, 0.6);
  const fr = new TextLine('FREE REPAIRS', { size: 0.6, ls: 0.0, color: BRAND.red, mul: 1 });
  fr.position.set(0, -2.02, 0.6);
  S.scene.add(top, every, mo, fr);
  // coverage list (camera travels down to it)
  const covered = new TextLine("WHAT'S COVERED", { size: 0.3, ls: 0.18, color: BRAND.ink, mul: 1 });
  covered.position.set(0, -4.25, 0.3);
  const items = ['CRASHES & DROPS', 'WATER DAMAGE', 'MOTOR FAILURES', 'BATTERY & ESC', 'REMOTE FAULTS', 'SERVOS & GEARS'];
  const chips = items.map((s, i) => {
    const c = pill(s, { px: 44, bg: BRAND.ink, fg: '#fff', ls: 0.1, padX: 0.6, padY: 0.42, icon: (ctx, x, y, r) => checkIcon(ctx, x, y, r), radius: 16 });
    const hh = 0.38, ww = Math.min(1.72, hh * c.width / c.height);
    const m = texPlane(c, ww);
    const col2 = i % 2, row = Math.floor(i / 2);
    m.position.set(col2 ? 0.9 : -0.9, -4.95 - row * 0.58, 0.3);
    S.scene.add(m);
    return m;
  });
  const ext = texPlane(pill('EXTEND TO 1 FULL YEAR · ₹499', { px: 44, bg: BRAND.red, ls: 0.1, padX: 0.8 }), 3.2);
  ext.position.set(0, -6.82, 0.3);
  const fine = new TextLine('LABOUR ON US · PARTS QUOTED FOR YOUR APPROVAL', { size: 0.105, ls: 0.16, weight: 600, color: BRAND.slate, mul: 1 });
  fine.position.set(0, -7.3, 0.3);
  S.scene.add(covered, ext, fine);
  const ch = chrome(S, 6, 'CARE PLAN', false);
  S.update = (lt, t) => {
    bg.material.uniforms.uTime.value = t;
    const e = ep(lt, 0, 0.55);
    sixG.position.z = lerp(9, 0, e);
    six.rotation.set(Math.sin(lt * 0.9) * 0.12, (1 - e) * Math.PI * 2.2 + Math.sin(lt * 1.2) * 0.45, (1 - e) * 0.4);
    sixG.scale.setScalar(1 + 0.05 * Math.exp(-ramp(lt, 0.5, 2) * 5) * Math.sin(lt * 26));
    ringG.rotation.y = lt * 0.9;
    ringG.scale.setScalar(ep(lt, 0.2, 0.6, ease.outBack));
    top.material.opacity = ep(lt, 0.25, 0.3); top.scale.setScalar(Math.max(0.001, ep(lt, 0.25, 0.4, ease.outBack)));
    every.animate(lt, { at: 0.35, stagger: 0.015, dur: 0.35, style: 'fade' });
    mo.animate(lt, { at: 0.45, stagger: 0.035, dur: 0.45, style: 'rise' });
    fr.animate(lt, { at: 0.62, stagger: 0.03, dur: 0.45, style: 'rise' });
    covered.animate(lt, { at: 2.05, stagger: 0.025, dur: 0.4, style: 'rise' });
    chips.forEach((m, i) => {
      const p = ep(lt, 2.25 + i * 0.12, 0.4, ease.outBack);
      m.material.opacity = clamp(p * 1.5); m.rotation.x = (1 - clamp(p)) * 1.2; m.position.z = 0.3 + (1 - clamp(p)) * 0.8;
    });
    ext.material.opacity = ep(lt, 3.0, 0.3); ext.scale.setScalar(Math.max(0.001, ep(lt, 3.0, 0.4, ease.outBack)));
    fine.animate(lt, { at: 3.15, stagger: 0.006, dur: 0.3, style: 'fade' });
    // camera: orbit the 6, then travel down to the list on the bar line (14.0)
    const down = ep(lt, 1.82, 0.5, ease.inOutExpo);
    const a = Math.sin(lt * 0.7) * 0.22;
    const camY = lerp(0.4, -5.6, down);
    const r = lerp(10, 9.6, down) - 0.6 * ep(lt, 0.4, 1.4, ease.outCubic) * (1 - down) - 1.5 * ep(lt, 3.8, 0.2, ease.inExpo);
    S.camera.position.set(Math.sin(a) * r, camY + 0.15, Math.cos(a) * r);
    S.camera.lookAt(0, lerp(0.35, -5.65, down), 0);
    bg.material.uniforms.uPar.value.set(a * 0.2, -down * 0.25);
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S7 16-20
const SKY_FRAG = /* glsl */`
  uniform float uTime, uAspect; uniform vec2 uPar; varying vec2 vUv;
  void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.); p.x += uPar.x;
    float hy = -0.02;                                   // horizon
    vec3 c = mix(vec3(.25, .015, .01), vec3(.004, .004, .008), smoothstep(hy, hy + .45, p.y));
    c += vec3(1., .2, .05) * exp(-pow((p.y - hy) * 9., 2.)) * .6;
    // skyline
    float bx = floor(p.x * 34. + 40.); float bh = hash12(vec2(bx, 3.)) * .09 + .015 + step(.85, hash12(vec2(bx, 7.))) * .07;
    float sky = step(p.y, hy + bh) * step(hy - .01, p.y);
    vec3 b = vec3(.012, .006, .008);
    vec2 wg = fract(vec2(p.x * 34. * 4., p.y * 140.)); float win = step(.55, hash12(floor(vec2(p.x * 136., p.y * 140.)))) * step(.3, wg.x) * step(.4, wg.y);
    b += vec3(1., .55, .25) * win * .35 * step(p.y, hy + bh - .006);
    c = mix(c, b, sky);
    gl_FragColor = vec4(c, 1.); }`;

function boxTex(A) {
  return canvasTex(512, 512, (ctx, w, h) => {
    ctx.fillStyle = '#1b1b1f'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = BRAND.red; ctx.fillRect(w * 0.42, 0, w * 0.16, h);
    const img = A.tex.logo.image; const lw = w * 0.82, lh = lw * img.height / img.width;
    ctx.drawImage(img, (w - lw) / 2, h * 0.3 - lh / 2, lw, lh);
    ctx.font = fontStr(30, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.letterSpacing = '6px';
    ctx.fillText('HANDLE WITH CARE', w / 2, h * 0.78);
    ctx.font = fontStr(26, 600); ctx.fillStyle = '#bbb'; ctx.fillText('RC INSIDE', w / 2, h * 0.86);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 6; ctx.strokeRect(3, 3, w - 6, h - 6);
  });
}
function signTex(city) {
  return canvasTex(768, 300, (ctx, w, h) => {
    ctx.fillStyle = '#111114'; ctx.beginPath(); ctx.roundRect(0, 0, w, h, 26); ctx.fill();
    ctx.lineWidth = 10; ctx.strokeStyle = BRAND.red; ctx.beginPath(); ctx.roundRect(14, 14, w - 28, h - 28, 18); ctx.stroke();
    ctx.font = fontStr(104, 700); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(city, w / 2, h * 0.43);
    ctx.font = fontStr(36, 600); ctx.fillStyle = '#ff5a5a'; ctx.letterSpacing = '5px';
    ctx.fillText('FREE DELIVERY ✓', w / 2, h * 0.78);
  });
}

function s7Delivery(A) {
  const S = mkScene(16, 20, { bloom: 0.7, fov: 52 });
  S.scene.fog = new THREE.Fog(0x120406, 12, 90);
  const sky = bgQuad(SKY_FRAG); S.scene.add(sky);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(7, 600), new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: 'varying vec3 vP; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: GLSL_ROAD,
    fog: false,
  }));
  road.rotation.x = -Math.PI / 2; road.position.z = -280;
  S.scene.add(road);
  // lamp posts + signs
  const postMat = new THREE.MeshBasicMaterial({ color: 0x0c0c0e });
  const posts = new THREE.Group();
  for (let i = 0; i < 26; i++) {
    for (const side of [-1, 1]) {
      const z = -i * 9 - 6 - (side > 0 ? 4.5 : 0);
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.08, 3.2, 0.08), postMat); p.position.set(side * 4.1, 1.6, z);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.16), new THREE.MeshBasicMaterial({ color: col(i % 3 === 0 ? BRAND.redHot : '#ffd9b0', 3), toneMapped: false }));
      head.position.set(side * 3.8, 3.2, z);
      posts.add(p, head);
    }
  }
  S.scene.add(posts);
  const cities = ['MUMBAI', 'DELHI', 'BENGALURU', 'HYDERABAD', 'CHENNAI', 'KOLKATA', 'PUNE'];
  cities.forEach((c, i) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6 * 300 / 768), new THREE.MeshBasicMaterial({ map: signTex(c), toneMapped: false, fog: true }));
    const side = i % 2 ? 1 : -1;
    s.position.set(side * 3.0, 2.7, -22 - i * 21);
    s.rotation.y = -side * 0.35;
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.0, 0.06), postMat); leg.position.set(side * 3.0, 1.0, -22 - i * 21 - 0.05);
    S.scene.add(s, leg);
  });
  const box = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.8, 0.8, 3, 0.04), new THREE.MeshBasicMaterial({ map: boxTex(A), toneMapped: false }));
  S.scene.add(box);
  const boxGlow = glow(BRAND.redHot, 0.5, 2.6); boxGlow.rotation.x = -Math.PI / 2; S.scene.add(boxGlow);
  const lines = speedLines(34, 33, { len: 5, spreadY: 3.2, spreadZ: 9, mul: 0.9, gap: 1.9 });
  lines.rotation.y = Math.PI / 2;
  S.scene.add(lines);
  // HUD copy, one idea per beat-pair
  const mk = (s, size, color, y, mul = 0.93) => { const l = new TextLine(s, { size, ls: 0.02, color, mul }); l.position.set(0, y, 0); S.hud.add(l); return l; };
  const blocks = [
    [mk('FREE DELIVERY', 0.56, '#ffffff', 2.25), mk('ACROSS INDIA', 0.56, BRAND.redHot, 1.6, 1.1)],
    [mk('DISPATCH IN', 0.5, '#ffffff', 2.25), mk('24–48 HRS', 0.72, BRAND.redHot, 1.52, 1.1)],
    [mk('PRE-ORDERS?', 0.5, '#ffffff', 2.25), mk('DUTIES ON US', 0.56, BRAND.redHot, 1.6, 1.1)],
    [mk('CASH ON', 0.5, '#ffffff', 2.25), mk('DELIVERY', 0.72, BRAND.redHot, 1.52, 1.1)],
  ];
  const subs = [
    texPlane(pill('DOORSTEP · ZERO COST', { px: 40, bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.4)', ls: 0.16 }), 2.3),
    texPlane(pill('IN STOCK', { px: 44, bg: '#ffffff', fg: BRAND.ink, dot: BRAND.green, ls: 0.06 }), 1.25),
    texPlane(pill('IMPORTED FOR YOU · 4–8 WEEKS', { px: 40, bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.4)', ls: 0.14 }), 2.7),
    texPlane(pill('ON IN-STOCK MODELS', { px: 40, bg: 'rgba(0,0,0,0.55)', border: 'rgba(255,255,255,0.4)', ls: 0.16 }), 2.3),
  ];
  subs.forEach(s => { s.position.set(0, 0.95, 0); S.hud.add(s); });
  const ch = chrome(S, 7, 'DELIVERY');
  S.update = (lt, t) => {
    const speed = 34;
    const z = -lt * speed - 6 * ep(lt, 0, 0.6, ease.outCubic);
    const sway = Math.sin(lt * 2.1) * 0.35;
    const camZ = z + 4;
    S.camera.position.set(sway * 0.5, 1.05 + Math.sin(lt * 9) * 0.02, camZ);
    S.camera.lookAt(sway * 0.2, 0.9, camZ - 10);
    S.camera.rotation.z += -sway * 0.05;
    const enter = 1 - ep(lt, 0, 0.5);
    box.position.set(sway * 0.8, 0.42 + Math.abs(Math.sin(lt * 7)) * 0.06, z - 1.5 - enter * 12);
    box.rotation.set(Math.sin(lt * 7) * 0.04, 0.35 + Math.sin(lt * 1.5) * 0.25, Math.sin(lt * 3) * 0.05);
    boxGlow.position.set(box.position.x, 0.02, box.position.z);
    lines.position.set(0, 1.4, camZ - 6);
    updateLines(lines, lt, 40, 1);
    sky.material.uniforms.uPar.value.set(sway * 0.03, 0);
    road.material.uniforms.uTime.value = t;
    blocks.forEach((b, i) => {
      const at = i; const out = i < 3 ? i + 0.86 : 3.8;
      b[0].animate(lt, { at: at + 0.0, stagger: 0.022, dur: 0.35, style: 'rise', out, outDur: 0.14 });
      b[1].animate(lt, { at: at + 0.08, stagger: 0.03, dur: 0.38, style: 'slam', out: out + 0.02, outDur: 0.14 });
      const s = subs[i]; const p = ep(lt, at + 0.2, 0.3, ease.outBack) * (1 - ep(lt, out, 0.12));
      s.material.opacity = clamp(p); s.scale.setScalar(Math.max(0.001, p));
    });
    ch(t, lt);
  };
  return S;
}
const GLSL_ROAD = /* glsl */`
  uniform float uTime; varying vec3 vP; varying vec2 vUv;
  float h(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
  void main(){
    float x = vP.x, z = vP.z;
    vec3 c = vec3(.018, .016, .018) + h(floor(vP.xz * 40.)) * .012;
    float dash = step(.5, fract(z * .25)) * smoothstep(.07, .05, abs(x));
    c += vec3(.42) * dash;
    float edge = smoothstep(.06, .02, abs(abs(x) - 3.2));
    c += vec3(1., .05, .02) * edge * 2.2;
    // lane reflections of lamps
    c += vec3(.3, .05, .02) * exp(-pow(abs(x) - 2.6, 2.) * 3.) * (.5 + .5 * sin(z * .7)) * .25;
    float fog = exp(-max(0., -z - (-z) * 0.) * 0.);
    gl_FragColor = vec4(c, 1.);
  }`;

// -------------------------------------------------------------------------------- S8 20-24
const CHECKER_FRAG = /* glsl */`
  uniform float uTime, uAspect; uniform vec2 uPar; varying vec2 vUv;
  void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.) + uPar;
    vec2 q = p * 7.; q.y += sin(q.x * .7 + uTime * 3.) * .35; q.x += sin(q.y * .5 + uTime * 2.) * .2;
    float ck = mod(floor(q.x) + floor(q.y), 2.);
    float shade = .5 + .5 * sin(q.x * .7 + uTime * 3.);
    vec3 c = mix(vec3(.01), vec3(.07, .0, .0), ck) * (.5 + shade * .8);
    c *= smoothstep(1.2, .2, length(p));
    gl_FragColor = vec4(c, 1.); }`;

function faceTex(A, idx, title, accent, lines, imgKey) {
  return canvasTex(1024, 1600, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#17171a'); g.addColorStop(1, '#0b0b0d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    // red diagonal slab
    ctx.fillStyle = BRAND.red; ctx.beginPath(); ctx.moveTo(0, h * 0.5); ctx.lineTo(w, h * 0.36); ctx.lineTo(w, h * 0.62); ctx.lineTo(0, h * 0.76); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; for (let i = 0; i < 40; i++) ctx.fillRect(0, h * 0.3 + i * 22, w, 2);
    // image
    const img = A.tex[imgKey].image; const iw = w * 0.92, ih = Math.min(h * 0.4, iw * img.height / img.width);
    const iw2 = ih * img.width / img.height;
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    ctx.drawImage(img, (w - iw2) / 2, h * 0.565 - ih / 2, iw2, ih);
    ctx.shadowColor = 'transparent';
    // header
    ctx.font = fontStr(56, 700); ctx.fillStyle = BRAND.red; ctx.textBaseline = 'top';
    ctx.fillText(String(idx).padStart(2, '0'), 70, 80);
    ctx.font = fontStr(30, 600); ctx.fillStyle = '#888'; ctx.letterSpacing = '8px'; ctx.fillText('CRAZYRC', 160, 98); ctx.letterSpacing = '0px';
    ctx.font = fontStr(124, 700); ctx.fillStyle = '#fff'; ctx.fillText(title, 66, 170);
    ctx.fillStyle = '#ff2a2a'; ctx.fillText(accent, 66, 300);
    // bullet list
    ctx.font = fontStr(44, 600); ctx.textBaseline = 'middle'; ctx.letterSpacing = '2px';
    lines.forEach((l, i) => {
      const y = h * 0.84 + i * 76 - 40;
      checkIcon(ctx, 92, y, 22);
      ctx.fillStyle = '#f2f2f2'; ctx.fillText(l, 140, y + 2);
    });
    ctx.strokeStyle = 'rgba(255,42,42,0.9)'; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
  });
}

function s8Community(A) {
  const S = mkScene(20, 24, { bloom: 0.6 });
  const bg = bgQuad(CHECKER_FRAG); S.scene.add(bg);
  const faces = [
    faceTex(A, 1, 'CRAZYRC', 'LAB', ['CUSTOM BUILDS', 'PERFORMANCE UPGRADES', 'PAINT & TUNING'], 'rzr'),
    faceTex(A, 2, 'CRAZYRC', 'CLUB', ['MONTHLY MEETUPS', 'TECH WORKSHOPS', 'MEMBER-ONLY DEALS'], 'typhon'),
    faceTex(A, 3, 'RACING', 'CHAMPIONSHIP', ['7 RACE FORMATS', 'OFF-ROAD · DRIFT · F1 · DRAG', "HYDERABAD'S BIGGEST RC EVENT"], 'redbull'),
    faceTex(A, 4, 'BULK &', 'B2B ORDERS', ['RETAILERS & DISTRIBUTORS', 'SCHOOLS · CLUBS · EVENTS', 'GST INVOICE ON EVERY ORDER'], 'mn82'),
  ];
  const BW = 3.2, BH = 5.0;
  const side = new THREE.MeshBasicMaterial({ color: 0x0a0a0c });
  // BoxGeometry material order: +x, -x, +y, -y, +z, -z ; faces come to the front in order +z, +x, -z, -x
  const mats = [faces[1], faces[3], null, null, faces[0], faces[2]].map(f => f ? new THREE.MeshBasicMaterial({ map: f, toneMapped: false }) : side);
  const prism = new THREE.Mesh(new THREE.BoxGeometry(BW, BH, BW), mats);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(prism.geometry), new THREE.LineBasicMaterial({ color: col(BRAND.redHot, 2.5), toneMapped: false }));
  prism.add(edges);
  const pg = new THREE.Group(); pg.add(prism); pg.position.set(0, 0.05, -BW / 2);
  S.scene.add(pg);
  const normals = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(-1, 0, 0), null, null, new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, -1)];
  const sparks = particles(200, { mode: 0, color: '#ff3a12', mul: 2, size: 0.04, spread: new THREE.Vector3(8, 9, 4), seed: 8, speed: 1.2 });
  S.scene.add(sparks);
  const head = new TextLine('MORE THAN A STORE', { size: 0.2, ls: 0.3, weight: 600 });
  head.position.set(0, 2.9, 0); S.hud.add(head);
  const ch = chrome(S, 8, 'COMMUNITY');
  const _n = new THREE.Vector3(), _d = new THREE.Vector3();
  S.update = (lt, t) => {
    bg.material.uniforms.uTime.value = t;
    let rot = 0;
    for (let k = 1; k < 4; k++) rot += ep(lt, k - 0.26, 0.4, ease.inOutQuart);
    const enter = ep(lt, 0, 0.55);
    prism.rotation.y = -rot * Math.PI / 2 + (1 - enter) * 1.2;
    prism.rotation.x = Math.sin(lt * 1.3) * 0.04;
    pg.scale.setScalar(lerp(0.6, 1, enter));
    // fake lighting per face
    S.camera.updateMatrixWorld();
    mats.forEach((m, i) => {
      if (!normals[i]) return;
      _n.copy(normals[i]).applyQuaternion(prism.getWorldQuaternion(new THREE.Quaternion()));
      _d.copy(S.camera.position).sub(pg.position).normalize();
      const k = clamp(_n.dot(_d));
      m.color.setScalar(0.18 + 0.82 * Math.pow(k, 0.7));
    });
    sparks.material.uniforms.uTime.value = t;
    head.animate(lt, { at: 0.1, stagger: 0.02, dur: 0.4, style: 'rise' });
    const out = ep(lt, 3.7, 0.3, ease.inExpo);
    const a = Math.sin(lt * 0.8) * 0.12;
    const r = 9.6 - out * 6;
    S.camera.position.set(Math.sin(a) * r, 0.15 + Math.sin(lt) * 0.1, Math.cos(a) * r);
    S.camera.lookAt(0, 0.05, 0);
    bg.material.uniforms.uPar.value.set(a * 0.3, 0);
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S9 24-26
function s9Promise(A) {
  const S = mkScene(24, 26, { bloom: 0.8 });
  const bg = bgQuad(/* glsl */`
    uniform float uTime, uAspect, uHit, uRed; uniform vec2 uPar; varying vec2 vUv;
    void main(){ vec2 p = (vUv - .5) * vec2(uAspect, 1.) + uPar;
      vec3 c = vec3(.006);
      float n = fbm(p * 2.2 + vec2(uTime * .2, 0.));
      c += vec3(.06, .0, .0) * n * n * (1. + uRed * 2.);
      float streak = exp(-pow((p.y - uHit) * 40., 2.)) * exp(-abs(p.x) * 1.2);
      c += mix(vec3(.5), vec3(1.2, .06, .02), uRed) * streak * 0.6;
      gl_FragColor = vec4(c, 1.); }`, { uHit: { value: 0.12 }, uRed: { value: 0 } });
  S.scene.add(bg);
  const a1 = new TextLine('OTHERS SELL', { size: 0.5, ls: 0.04, maxW: 3.1 }); a1.position.set(0, 1.62, 0);
  const a2 = new TextLine('RC CARS.', { size: 0.5, ls: 0.04, maxW: 3.1 }); a2.position.set(0, 1.02, 0);
  const b1 = new TextLine('WE KEEP THEM', { size: 0.52, ls: 0.03, color: '#ffffff', mul: 0.93, maxW: 3.1 }); b1.position.set(0, -0.15, 0.2);
  const b2 = new TextLine('RUNNING.', { size: 0.8, ls: 0.0, color: BRAND.redHot, mul: 1.1, maxW: 3.3 }); b2.position.set(0, -1.05, 0.2);
  S.scene.add(a1, a2, b1, b2);
  const embers = particles(140, { mode: 0, color: '#ff2a12', mul: 2, size: 0.04, spread: new THREE.Vector3(6, 9, 4), seed: 19, speed: 1.4 });
  S.scene.add(embers);
  const ch = chrome(S, 9, 'PROMISE');
  S.update = (lt, t) => {
    const u = bg.material.uniforms; u.uTime.value = t;
    u.uRed.value = ep(lt, 1.0, 0.1);
    u.uHit.value = lt < 1 ? 0.065 : -0.27;
    const dim = 1 - 0.7 * ep(lt, 1.0, 0.25, ease.outCubic);
    a1.animate(lt, { at: 0.0, stagger: 0.03, dur: 0.35, style: 'slam', opacity: dim });
    a2.animate(lt, { at: 0.12, stagger: 0.03, dur: 0.35, style: 'slam', opacity: dim });
    const lift = ep(lt, 1.0, 0.3) * 0.65;
    a1.position.y = 1.62 + lift; a2.position.y = 1.02 + lift;
    b1.animate(lt, { at: 1.0, stagger: 0.025, dur: 0.3, style: 'slam' });
    b2.animate(lt, { at: 1.1, stagger: 0.035, dur: 0.35, style: 'slam' });
    embers.material.uniforms.uTime.value = t;
    embers.material.uniforms.uOpacity.value = ep(lt, 1.0, 0.2);
    const push = ep(lt, 1.55, 0.45, ease.inExpo);
    S.camera.position.set(Math.sin(lt * 0.6) * 0.2, 0.2 - push * 1.0, 9.9 - lt * 0.25 - push * 8.6);
    S.camera.lookAt(0, 0.2 - push * 1.1, 0);
    ch(t, lt);
  };
  return S;
}

// -------------------------------------------------------------------------------- S10 26-30
function s10End(A) {
  const S = mkScene(26, 30.5, { bloom: 0.8 });
  const bg = bgQuad(SMOKE_FRAG, { uInt: { value: 1 }, uRays: { value: 1 }, uC: { value: new THREE.Vector2(0, 0.17) } });
  S.scene.add(bg);
  const logo = logoStack(A.tex.logo, 3.5, 18, 0.26); logo.position.set(0, 1.25, 0); S.scene.add(logo);
  const halo = glow(BRAND.redHot, 0.5, 6.5); halo.position.set(0, 1.25, -0.6); S.scene.add(halo);
  const sparks = particles(320, { mode: 1, color: '#ff5a1f', mul: 4, size: 0.05, origin: new THREE.Vector3(0, 1.25, 0), seed: 41, speed: 1.6, gravity: 3, burstAt: 26.0 });
  const sparks2 = particles(240, { mode: 1, color: '#ffffff', mul: 3, size: 0.04, origin: new THREE.Vector3(0, 1.25, 0), seed: 42, speed: 1.3, gravity: 2.5, burstAt: 28.0 });
  const embers = particles(200, { mode: 0, color: '#ff3a12', mul: 2.4, size: 0.045, spread: new THREE.Vector3(7, 9, 5), seed: 6, speed: 0.9 });
  S.scene.add(sparks, sparks2, embers);
  const url = new TextLine('CRAZYRC.IN', { size: 0.5, ls: 0.12 }); url.position.set(0, -0.05, 0.1);
  const tag = new TextLine("INDIA'S FAVOURITE RC STORE", { size: 0.16, ls: 0.26, weight: 600, color: '#ffffff', mul: 0.7 }); tag.position.set(0, -0.52, 0.1);
  S.scene.add(url, tag);
  const badgeTxt = ['FREE DELIVERY', 'SECURE PAYMENT', '6 MONTHS FREE REPAIR', 'SUPPORT 7 DAYS A WEEK'];
  const badges = badgeTxt.map((s, i) => {
    const c = pill(s, { px: 40, bg: 'rgba(20,20,24,0.85)', border: 'rgba(255,255,255,0.18)', fg: '#fff', ls: 0.1, padX: 0.6, padY: 0.5, icon: (ctx, x, y, r) => checkIcon(ctx, x, y, r * 0.95), radius: 14 });
    const m = texPlane(c, 0.26 * c.width / c.height);
    m.position.set(0, -1.2 - i * 0.4, 0.1);
    S.scene.add(m);
    return m;
  });
  const wa = texPlane(pill('ORDER ON WHATSAPP  ·  +91 81848 49321', { px: 46, bg: '#25D366', fg: '#0b2a14', ls: 0.06, padX: 0.8, padY: 0.55, icon: (ctx, x, y, r) => { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - r * 0.75, y + r * 0.45); ctx.lineTo(x - r * 1.05, y + r * 1.05); ctx.lineTo(x - r * 0.25, y + r * 0.85); ctx.fill(); ctx.fillStyle = '#25D366'; [-0.42, 0, 0.42].forEach(d => { ctx.beginPath(); ctx.arc(x + d * r, y, r * 0.13, 0, Math.PI * 2); ctx.fill(); }); } }), 3.7);
  wa.position.set(0, -2.95, 0.1);
  S.scene.add(wa);
  const ch = chrome(S, 10, 'SHOP NOW');
  S.update = (lt, t) => {
    const u = bg.material.uniforms; u.uTime.value = t;
    u.uRays.value = 0.5 + 0.7 * Math.exp(-lt / 0.5) + 0.6 * Math.exp(-Math.max(0, lt - 2) / 0.5) * (lt > 2 ? 1 : 0);
    const e = ep(lt, 0, 0.42);
    const pulse = lt > 2 ? 0.05 * Math.exp(-(lt - 2) / 0.25) : 0;
    logo.scale.setScalar(lerp(3.0, 1, e) + pulse);
    logo.position.z = (1 - e) * 2.5;
    logo.rotation.set(Math.sin(lt * 1.1) * 0.05, Math.sin(lt * 0.9 + 0.3) * 0.22 * ep(lt, 0.3, 0.8, ease.outCubic), (1 - e) * 0.2);
    logo.userData.glint.uG.value = lt < 1.9 ? lerp(-0.4, 1.6, ep(lt, 0.5, 0.7, ease.inOutCubic)) : lerp(-0.4, 1.6, ep(lt, 2.0, 0.6, ease.inOutCubic));
    halo.material.color.copy(col(BRAND.redHot, 0.25 + 0.6 * Math.exp(-lt / 0.4) + (lt > 2 ? 0.5 * Math.exp(-(lt - 2) / 0.4) : 0)));
    [sparks, sparks2, embers].forEach(p => (p.material.uniforms.uTime.value = t));
    url.animate(lt, { at: 0.3, stagger: 0.03, dur: 0.45, style: 'rise' });
    tag.animate(lt, { at: 0.5, stagger: 0.012, dur: 0.4, style: 'fade' });
    badges.forEach((m, i) => { const p = ep(lt, 0.7 + i * 0.1, 0.4, ease.outBack); m.material.opacity = clamp(p); m.scale.setScalar(Math.max(0.001, p)); });
    const pw = ep(lt, 1.2, 0.45, ease.outBack); wa.material.opacity = clamp(pw); wa.scale.setScalar(Math.max(0.001, pw) * (1 + 0.03 * Math.sin(lt * 6) * ramp(lt, 1.6, 2)));
    S.camera.position.set(Math.sin(lt * 0.5) * 0.35, 0.15, lerp(10.6, 9.6, ep(lt, 0, 4, ease.outCubic)));
    S.camera.lookAt(0, 0.0, 0);
    bg.material.uniforms.uPar.value.set(S.camera.position.x * 0.02, 0);
    ch(t, lt);
  };
  return S;
}
