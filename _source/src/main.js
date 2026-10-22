import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';
import { clamp, wobble } from './lib.js';

const params = new URLSearchParams(location.search);
const REEL = await import(params.get('reel') === 'mn82' ? './mn82.js' : './scenes.js');
const { buildScenes, HITS } = REEL;
const W = 1080, H = 1920, FPS = 30, DURATION = REEL.DURATION || 30;
const SUB = Number(params.get('sub') || 6);          // motion-blur sub-frames
const SHUTTER = 0.5;                                  // fraction of frame interval (180°)

const canvas = document.getElementById('c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const rtOpts = { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace, depthBuffer: true };
const sceneRT = new THREE.WebGLRenderTarget(W, H, { ...rtOpts, samples: 4 });
const accumRT = new THREE.WebGLRenderTarget(W, H, { ...rtOpts, depthBuffer: false });

// fullscreen helpers
const fsCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
const fsGeo = new THREE.PlaneGeometry(2, 2);
const accumMat = new THREE.ShaderMaterial({
  uniforms: { tSrc: { value: null }, uW: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: 'uniform sampler2D tSrc; uniform float uW; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(tSrc, vUv).rgb * uW, 1.); }',
  blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
  depthTest: false, depthWrite: false,
});
const accumScene = new THREE.Scene();
accumScene.add(new THREE.Mesh(fsGeo, accumMat));

const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), 0.9, 0.55, 0.92);

// final grade: shockwave, chromatic aberration, radial blur, flash, vignette, grain, soft-clip, sRGB
const finalMat = new THREE.ShaderMaterial({
  uniforms: {
    tSrc: { value: accumRT.texture }, uTime: { value: 0 }, uCA: { value: 0 }, uFlash: { value: 0 }, uZoom: { value: 0 },
    uShock: { value: new THREE.Vector4(0.5, 0.5, -1, 0) }, uVig: { value: 0.35 }, uGrain: { value: 0.045 }, uExposure: { value: 1 },
    uFade: { value: 0 }, uFlashCol: { value: new THREE.Color(1, 1, 1) }, uGlitch: { value: 0 },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }',
  fragmentShader: /* glsl */ `
    uniform sampler2D tSrc; uniform float uTime, uCA, uFlash, uZoom, uVig, uGrain, uExposure, uFade, uGlitch; uniform vec4 uShock; uniform vec3 uFlashCol;
    varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 tone(vec3 x){ vec3 k = 0.82 + 0.18 * (1.0 - exp(-(x - 0.82) / 0.18)); return mix(x, k, step(0.82, x)); }
    vec3 toSRGB(vec3 c){ c = clamp(c, 0., 1.); return mix(c * 12.92, 1.055 * pow(c, vec3(1. / 2.4)) - .055, step(.0031308, c)); }
    void main(){
      vec2 uv = vUv; vec2 asp = vec2(1080./1920., 1.);
      // glitch slices
      if (uGlitch > 0.) { float row = floor(uv.y * 38.); float g = step(1. - uGlitch * .35, h(vec2(row, floor(uTime * 30.)))); uv.x += (h(vec2(row, 3.1)) - .5) * .12 * g * uGlitch; }
      // shockwave ring
      if (uShock.z >= 0.) {
        vec2 d = (uv - uShock.xy) * asp; float r = length(d); float ring = uShock.z;
        float w = 0.09; float k = smoothstep(w, 0., abs(r - ring));
        uv -= normalize(d + 1e-5) / asp * k * uShock.w * 0.06;
      }
      vec2 c = uv - .5;
      vec3 col = vec3(0.);
      // radial zoom blur + chromatic aberration in one pass
      const int NS = 10;
      float ca = uCA * 0.012 + 0.0012;
      for (int i = 0; i < NS; i++) {
        float f = float(i) / float(NS - 1);
        float z = 1. - uZoom * 0.12 * f;
        vec2 u = .5 + c * z;
        vec2 dir = c * ca;
        col.r += texture2D(tSrc, u + dir).r; col.g += texture2D(tSrc, u).g; col.b += texture2D(tSrc, u - dir).b;
      }
      col /= float(NS);
      col *= uExposure;
      col += uFlashCol * uFlash;
      // grade: slightly lift reds, deepen shadows
      col = pow(max(col, 0.), vec3(1.04, 1.06, 1.08));
      col = tone(col);
      float v = smoothstep(1.15, 0.25, length(c * vec2(1.0, 0.82)));
      col *= mix(1. - uVig, 1., v);
      col *= 1. - uFade;
      vec3 s = toSRGB(col);
      float gn = h(vUv * vec2(1080., 1920.) + fract(uTime * 7.13) * 100.) - .5;
      s += gn * uGrain;
      gl_FragColor = vec4(s, 1.);
    }`,
  depthTest: false, depthWrite: false,
});
const finalScene = new THREE.Scene();
finalScene.add(new THREE.Mesh(fsGeo, finalMat));

// ---------------------------------------------------------------- assets
async function loadAssets() {
  const faces = [['700', 'BaiJamjuree-Bold'], ['600', 'BaiJamjuree-SemiBold'], ['500', 'BaiJamjuree-Medium']];
  for (const [w, f] of faces) {
    const ff = new FontFace('Bai Jamjuree', `url(assets/fonts/${f}.ttf)`, { weight: w });
    await ff.load(); document.fonts.add(ff);
  }
  await document.fonts.ready;
  const tl = new THREE.TextureLoader();
  const names = REEL.TEXTURES || ['logo', 'h12y', 'trx4m', 'mx07', 'nb48', 'huracan', 'sf25', 'excav', 'f14', 'sonic', 'rzr', 'typhon', 'redbull', 'mn82', 'sr71', 'c3', 'trx4mt'];
  const tex = {};
  await Promise.all(names.map(n => new Promise((res, rej) => tl.load(n.includes('/') ? `assets/${n}` : `assets/cut/${n}.png`, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; tex[n.split('/').pop().split('.')[0]] = t; res(); }, undefined, rej))));
  const json = await new Promise((res, rej) => new TTFLoader().load('assets/fonts/BaiJamjuree-Bold.ttf', res, undefined, rej));
  const font3d = new Font(json);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = REEL.envScene ? pmrem.fromScene(REEL.envScene(), 0.015).texture : pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  return { tex, font3d, env };
}

// ---------------------------------------------------------------- post-fx timeline
function fxAt(t) {
  let flash = 0, ca = 0, zoom = 0, shake = 0, glitch = 0, shock = null, flashCol = [1, 1, 1];
  for (const h of HITS) {
    const d = t - h.t;
    if (d < -0.3 || d > 2) continue;
    if (h.zoomIn && d < 0) zoom = Math.max(zoom, h.zoomIn * Math.pow(clamp(1 + d / 0.3), 3));
    if (d < 0) continue;
    if (h.flash) { const f = h.flash * Math.exp(-d / (h.flashDecay || 0.09)); if (f > flash) { flash = f; flashCol = h.flashCol || [1, 1, 1]; } }
    if (h.ca) ca = Math.max(ca, h.ca * Math.exp(-d / 0.22));
    if (h.zoom) zoom = Math.max(zoom, h.zoom * Math.exp(-d / 0.16));
    if (h.shake) shake = Math.max(shake, h.shake * Math.exp(-d / 0.28));
    if (h.glitch) glitch = Math.max(glitch, h.glitch * (d < 0.18 ? 1 : 0));
    if (h.shock && d < 0.9) shock = [h.shock[0], h.shock[1], d * 1.6, (1 - d / 0.9) * (h.shockAmp || 1)];
  }
  return { flash, ca, zoom, shake, glitch, shock, flashCol };
}

// ---------------------------------------------------------------- main
let SCENES = null;
function activeScene(t) {
  for (const s of SCENES) if (t >= s.start && t < s.end) return s;
  return SCENES[SCENES.length - 1];
}

function renderSceneAt(t) {
  const s = activeScene(t);
  s.update(t - s.start, t);
  const fx = fxAt(t);
  const cam = s.camera;
  if (fx.shake > 0) {
    cam.position.x += wobble(t * 40, 1) * 0.05 * fx.shake;
    cam.position.y += wobble(t * 40, 7) * 0.05 * fx.shake;
    cam.rotation.z += wobble(t * 35, 3) * 0.012 * fx.shake;
  }
  cam.updateMatrixWorld();
  renderer.setRenderTarget(sceneRT);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  renderer.render(s.scene, cam);
  return s;
}

window.renderFrame = function (frame) {
  const t0 = frame / FPS;
  renderer.setRenderTarget(accumRT);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  let s0 = activeScene(t0);
  for (let i = 0; i < SUB; i++) {
    let t = t0 + (SUB > 1 ? (i / (SUB - 1)) * (SHUTTER / FPS) : 0);
    if (t >= s0.end) t = s0.end - 1e-4;          // never smear across a hard cut
    renderSceneAt(t);
    accumMat.uniforms.tSrc.value = sceneRT.texture;
    accumMat.uniforms.uW.value = 1 / SUB;
    renderer.setRenderTarget(accumRT);
    renderer.autoClear = false;
    renderer.render(accumScene, fsCam);
    renderer.autoClear = true;
  }
  // bloom adds onto accumRT
  bloom.strength = s0.bloom ?? 0.9;
  bloom.threshold = s0.bloomThreshold ?? 1.0;
  bloom.radius = s0.bloomRadius ?? 0.55;
  bloom.render(renderer, null, accumRT, 0, false);
  const fx = fxAt(t0);
  const u = finalMat.uniforms;
  u.uTime.value = t0;
  u.uCA.value = fx.ca + (s0.ca ?? 0);
  u.uFlash.value = fx.flash;
  u.uFlashCol.value.setRGB(...fx.flashCol);
  u.uZoom.value = fx.zoom;
  u.uGlitch.value = fx.glitch;
  u.uVig.value = s0.vignette ?? 0.38;
  u.uGrain.value = s0.grain ?? 0.04;
  u.uExposure.value = s0.exposure ? s0.exposure(t0 - s0.start) : 1;
  u.uShock.value.set(...(fx.shock || [0.5, 0.5, -1, 0]));
  u.uFade.value = clamp((t0 - (DURATION - 0.45)) / 0.4);
  renderer.setRenderTarget(null);
  renderer.render(finalScene, fsCam);
  return true;
};

(async () => {
  try {
    const assets = await loadAssets();
    SCENES = buildScenes(assets, { W, H });
    // warm up every scene so shaders compile before capture
    for (const s of SCENES) { s.update(0.01, s.start + 0.01); renderer.compile(s.scene, s.camera); }
    window.renderFrame(0);
    window.__meta = { W, H, FPS, DURATION, frames: FPS * DURATION };
    window.__ready = true;
    const f = params.get('f');
    if (f !== null) window.renderFrame(Number(f));
  } catch (e) {
    window.__error = String(e && e.stack || e);
    console.error(e);
  }
})();
