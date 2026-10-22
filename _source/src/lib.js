import * as THREE from 'three';

// ------------------------------------------------------------------ brand
export const BRAND = {
  red: '#DB0000', redHot: '#FF2A2A', ink: '#222222', slate: '#3F4045',
  paper: '#F7F7F7', grey: '#CDCDCD', green: '#1A8F3C', greenDeep: '#0F7A37',
  blue: '#1A56DB', white: '#FFFFFF', font: 'Bai Jamjuree',
};
export const col = (hex, mul = 1) => new THREE.Color(hex).multiplyScalar(mul);

// ------------------------------------------------------------------ math / easing
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const ramp = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, t) => a + (b - a) * t;
export const ease = {
  linear: x => x,
  inCubic: x => x * x * x,
  outCubic: x => 1 - Math.pow(1 - x, 3),
  inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
  outQuart: x => 1 - Math.pow(1 - x, 4),
  inOutQuart: x => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2),
  inExpo: x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
  outExpo: x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
  inOutExpo: x => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
  outBack: (x, s = 1.7) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2),
  inBack: (x, s = 1.7) => (s + 1) * x * x * x - s * x * x,
  outElastic: x => (x <= 0 ? 0 : x >= 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * (2 * Math.PI) / 3) + 1),
};
/** eased progress of t through [a, a+d] */
export const ep = (t, a, d, fn = ease.outExpo) => fn(ramp(t, a, a + d));
export function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** smooth deterministic noise (sum of sines), ~[-1,1] */
export const wobble = (t, s = 0) =>
  (Math.sin(t * 1.7 + s) * 0.5 + Math.sin(t * 3.1 + s * 2.3) * 0.3 + Math.sin(t * 7.3 + s * 4.1) * 0.2);

// ------------------------------------------------------------------ canvas text
const FONT = BRAND.font;
export function fontStr(px, weight = 700, italic = false) {
  return `${italic ? 'italic ' : ''}${weight} ${px}px "${FONT}"`;
}

/**
 * Builds a glyph atlas for `str`. Each glyph lives in its own cell so it can be animated alone.
 * Returns { tex, glyphs:[{u0,u1,x,w}], width, height } in em units (1 em = font size).
 */
export function glyphAtlas(str, { px = 180, weight = 700, ls = 0, stroke = 0, italic = false } = {}) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  ctx.font = fontStr(px, weight, italic);
  const pad = Math.ceil(px * 0.18 + stroke);
  const chars = [...str];
  const adv = chars.map(ch => ctx.measureText(ch).width);
  const cellW = adv.map(a => Math.ceil(a + pad * 2));
  const H = Math.ceil(px * 1.36);
  c.width = cellW.reduce((a, b) => a + b, 0);
  c.height = H;
  ctx.font = fontStr(px, weight, italic);
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineJoin = 'round';
  let cx = 0, pen = 0;
  const glyphs = [];
  const lsPx = ls * px;
  chars.forEach((ch, i) => {
    if (stroke > 0) { ctx.lineWidth = stroke; ctx.strokeText(ch, cx + pad, H * 0.53); }
    else ctx.fillText(ch, cx + pad, H * 0.53);
    glyphs.push({ ch, u0: cx / c.width, u1: (cx + cellW[i]) / c.width, x: (pen - pad) / px, w: cellW[i] / px, adv: adv[i] / px });
    cx += cellW[i];
    pen += adv[i] + (i < chars.length - 1 ? lsPx : 0);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, glyphs, width: pen / px, height: H / px };
}

/**
 * Kinetic text line: one plane per glyph. size = em height in world units.
 * align: 0 = centre, -1 = left, 1 = right
 */
export class TextLine extends THREE.Group {
  constructor(str, { size = 0.5, color = '#fff', mul = 0.93, weight = 700, ls = 0.02, stroke = 0, align = 0, px, italic = false, blending, maxW = 3.7 } = {}) {
    super();
    this.str = str;
    px = px || Math.round(clamp(size * 300, 90, 360));
    const a = glyphAtlas(str, { px, weight, ls, stroke: stroke ? stroke * px : 0, italic });
    this.atlas = a;
    this.size = size;
    this.width = a.width * size;
    const off = align === 0 ? -this.width / 2 : align < 0 ? 0 : -this.width;
    this.glyphs = [];
    a.glyphs.forEach((g, i) => {
      const geo = new THREE.PlaneGeometry(g.w * size, a.height * size);
      const uv = geo.attributes.uv;
      for (let k = 0; k < uv.count; k++) uv.setX(k, uv.getX(k) === 0 ? g.u0 : g.u1);
      const mat = new THREE.MeshBasicMaterial({ map: a.tex, transparent: true, depthWrite: false, color: col(color, mul), toneMapped: false, blending: blending ?? THREE.NormalBlending });
      const m = new THREE.Mesh(geo, mat);
      const holder = new THREE.Group();
      holder.position.x = off + (g.x + g.w / 2) * size;
      holder.add(m);
      holder.userData.base = holder.position.clone();
      this.add(holder);
      this.glyphs.push({ holder, mesh: m, mat });
    });
    if (this.width > maxW) { const k = maxW / this.width; this.glyphs.forEach(g => { g.holder.position.x *= k; g.holder.userData.base.x *= k; g.holder.scale.setScalar(k); g.mesh.scale.setScalar(k); g.holder.scale.setScalar(1); }); this.width = maxW; this.fit = k; }
  }
  setColor(hex, mul = 0.93) { this.glyphs.forEach(g => g.mat.color.copy(col(hex, mul))); }
  setOpacity(o) { this.glyphs.forEach(g => (g.mat.opacity = o)); }
  /**
   * Per-glyph in/out animation, pure function of t.
   * style: rise | drop | slam | flip | fade | wipe
   */
  animate(t, { at = 0, stagger = 0.03, dur = 0.5, style = 'rise', out = Infinity, outDur = 0.3, outStyle = 'up', fromRight = false, opacity = 1 } = {}) {
    const n = this.glyphs.length;
    this.glyphs.forEach((g, i0) => {
      const i = fromRight ? n - 1 - i0 : i0;
      const p = ramp(t, at + i * stagger, at + i * stagger + dur);
      const q = ramp(t, out + i * stagger * 0.5, out + i * stagger * 0.5 + outDur);
      const h = g.holder, m = g.mesh, s = this.size;
      h.position.copy(h.userData.base);
      h.rotation.set(0, 0, 0); h.scale.setScalar(1);
      let o = 1;
      if (style === 'rise') {
        const e = ease.outExpo(p);
        h.position.y += (1 - e) * -s * 0.9; h.rotation.x = (1 - e) * 1.2; o = ease.outCubic(p);
      } else if (style === 'drop') {
        const e = ease.outBack(p, 2.2);
        h.position.y += (1 - e) * s * 1.2; o = ramp(p, 0, 0.3);
      } else if (style === 'slam') {
        const e = ease.outExpo(p);
        h.scale.setScalar(lerp(3.2, 1, e)); h.position.z += (1 - e) * 2; o = ramp(p, 0, 0.25);
      } else if (style === 'flip') {
        const e = ease.outBack(p, 1.6);
        h.rotation.y = (1 - e) * -Math.PI * 0.5; o = ramp(p, 0, 0.4);
      } else if (style === 'fade') {
        o = ease.inOutCubic(p);
      } else if (style === 'wipe') {
        const e = ease.outExpo(p);
        h.position.x += (1 - e) * -s * 0.6; o = ramp(p, 0, 0.5);
      }
      if (q > 0) {
        const e = ease.inExpo(q);
        if (outStyle === 'up') { h.position.y += e * s * 1.1; h.rotation.x -= e * 1.1; }
        else if (outStyle === 'down') h.position.y -= e * s * 1.1;
        else if (outStyle === 'scale') h.scale.multiplyScalar(1 + e * 1.5);
        else if (outStyle === 'left') h.position.x -= e * 4;
        o *= 1 - ease.inCubic(q);
      }
      g.mat.opacity = o * opacity;
      h.visible = g.mat.opacity > 0.002;
    });
  }
}

/** Static canvas-drawn panel, aspect-correct plane in world units (width w). */
export function canvasPlane(w, cw, ch, draw, { transparent = true, mul = 1 } = {}) {
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const ctx = c.getContext('2d');
  draw(ctx, cw, ch);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent, depthWrite: false, toneMapped: false, color: new THREE.Color(mul, mul, mul) });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, (w * ch) / cw), mat);
  mesh.userData.canvas = c;
  return mesh;
}

export function canvasTex(cw, ch, draw) {
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  draw(c.getContext('2d'), cw, ch);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Text pill like the site's badges. */
export function pill(text, { px = 64, bg = BRAND.red, fg = '#fff', weight = 700, ls = 0.08, padX = 0.9, padY = 0.45, dot = null, icon = null, radius = null, border = null } = {}) {
  const tmp = document.createElement('canvas').getContext('2d');
  tmp.font = fontStr(px, weight);
  tmp.letterSpacing = `${ls * px}px`;
  const tw = tmp.measureText(text).width;
  const lead = dot || icon ? px * 1.25 : 0;
  const W = Math.ceil(tw + lead + px * padX * 2), H = Math.ceil(px * (1 + padY * 2));
  const c = document.createElement('canvas');
  c.width = W + 8; c.height = H + 8;
  const ctx = c.getContext('2d');
  ctx.translate(4, 4);
  ctx.fillStyle = bg;
  ctx.beginPath(); ctx.roundRect(0, 0, W, H, radius ?? H / 2); ctx.fill();
  if (border) { ctx.lineWidth = 4; ctx.strokeStyle = border; ctx.stroke(); }
  if (dot) { ctx.fillStyle = dot; ctx.beginPath(); ctx.arc(px * padX + px * 0.38, H / 2, px * 0.34, 0, Math.PI * 2); ctx.fill(); }
  if (icon) icon(ctx, px * padX + px * 0.38, H / 2, px * 0.42);
  ctx.font = fontStr(px, weight);
  ctx.letterSpacing = `${ls * px}px`;
  ctx.fillStyle = fg; ctx.textBaseline = 'middle';
  ctx.fillText(text, px * padX + lead, H / 2 + px * 0.04);
  return c;
}

/** red circle with a white check, for coverage chips */
export function checkIcon(ctx, x, y, r, fill = BRAND.red) {
  ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.28; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * 0.02); ctx.lineTo(x - r * 0.1, y + r * 0.36); ctx.lineTo(x + r * 0.5, y - r * 0.34); ctx.stroke();
}

export function texPlane(canvas, w, opts = {}) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, ...opts });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, (w * canvas.height) / canvas.width), mat);
}

export function imagePlane(tex, h, opts = {}) {
  const img = tex.image;
  const w = (h * img.width) / img.height;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false, ...opts });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  m.userData.w = w; m.userData.h = h;
  return m;
}

// ------------------------------------------------------------------ GLSL chunks
export const GLSL_NOISE = /* glsl */ `
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),u.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),u.x), u.y); }
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<6;i++){ s+=a*vnoise(p); p=p*2.03+vec2(1.7,9.2); a*=.5; } return s; }
`;

/** Fullscreen background quad driven by a fragment shader (vUv, uTime, uPar). */
export function bgQuad(frag, uniforms = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uPar: { value: new THREE.Vector2() }, uAspect: { value: 1080 / 1920 }, ...uniforms },
    vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.99999, 1.0); }`,
    fragmentShader: GLSL_NOISE + frag,
    depthWrite: false, depthTest: false,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  m.frustumCulled = false; m.renderOrder = -1000;
  return m;
}

/**
 * GPU particle field — positions are a pure function of uTime (deterministic for rendering).
 * mode 0 = embers rising, 1 = burst sparks, 2 = drifting dust
 */
export function particles(count, { mode = 0, color = '#ff3b1f', mul = 3, size = 0.06, spread = new THREE.Vector3(4, 7, 4), origin = new THREE.Vector3(), seed = 1, burstAt = 0, speed = 1, gravity = 2.5 } = {}) {
  const r = rng(seed);
  const g = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3), rnd = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    pos.set([(r() - 0.5) * spread.x, (r() - 0.5) * spread.y, (r() - 0.5) * spread.z], i * 3);
    rnd.set([r(), r(), r(), r()], i * 4);
  }
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uColor: { value: col(color, mul) }, uSize: { value: size }, uMode: { value: mode }, uSpread: { value: spread }, uOrigin: { value: origin }, uBurst: { value: burstAt }, uSpeed: { value: speed }, uGrav: { value: gravity }, uOpacity: { value: 1 }, uScale: { value: 1920 / (2 * Math.tan((40 * Math.PI) / 360)) } },
    vertexShader: /* glsl */ `
      attribute vec4 aRnd; uniform float uTime, uSize, uMode, uBurst, uSpeed, uGrav, uScale; uniform vec3 uSpread, uOrigin;
      varying float vA; varying vec4 vR;
      void main(){
        vec3 p = position; float a = 1.0; vR = aRnd;
        if (uMode < 0.5) {               // embers rising + swirling
          float h = uSpread.y; float y = mod(p.y + uTime * uSpeed * (0.4 + aRnd.x), h) - h * .5;
          p.y = y; p.x += sin(uTime * (0.6 + aRnd.y) + aRnd.z * 6.28) * 0.35; p.z += cos(uTime * (0.5 + aRnd.w) + aRnd.x * 6.28) * 0.3;
          a = smoothstep(-h*.5, -h*.3, y) * (1. - smoothstep(h*.25, h*.5, y)) * (0.55 + 0.45 * sin(uTime * (5. + aRnd.w*9.) + aRnd.z * 20.));
        } else if (uMode < 1.5) {        // burst
          float t = uTime - uBurst; if (t < 0.) { a = 0.; t = 0.; }
          float th = aRnd.x * 6.2831, ph = acos(2. * aRnd.y - 1.);
          vec3 dir = vec3(sin(ph) * cos(th), sin(ph) * sin(th) * .8, cos(ph) * .6);
          float sp = uSpeed * (1.5 + aRnd.z * 5.);
          float drag = (1. - exp(-t * 2.2)) / 2.2;
          p = uOrigin + dir * sp * drag; p.y -= uGrav * t * t * 0.5;
          a *= (1. - smoothstep(0.25 + aRnd.w * .9, 0.45 + aRnd.w * 1.1, t));
        } else {                          // dust drift
          p.x += sin(uTime * .3 + aRnd.x * 6.28) * .4 + uTime * uSpeed * (aRnd.y - .5);
          p.y += cos(uTime * .25 + aRnd.y * 6.28) * .3;
          a = .35 + .65 * aRnd.z;
        }
        vA = a;
        vec4 mv = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = uSize * (0.4 + aRnd.w * 1.2) * uScale / -mv.z;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity; varying float vA; varying vec4 vR;
      void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); float s = smoothstep(.5, .0, d); s *= s;
        vec3 colr = uColor * mix(vec3(1.), vec3(1.4, 1.2, .9), vR.y);
        gl_FragColor = vec4(colr * s * vA * uOpacity, 1.0); }`,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(g, mat);
  pts.frustumCulled = false;
  return pts;
}
