// Procedural MNRC MN82 / Toyota Land Cruiser LC79 pickup, built part-by-part so it can explode.
// Units: 1 = 10 cm (real truck 36 x 16 x 16 cm). +x forward, +y up, +z = right side.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { canvasTex, fontStr } from './lib.js';

export const PAINT = { red: '#8C0D15', beige: '#CDB07A' };
const FW = 1.215, RW = -0.975, WR = 0.31, TRACK = 0.62;   // wheel x, wheel radius, wheel z

export function buildLC79(env) {
  const M = {
    paint: new THREE.MeshPhysicalMaterial({ color: PAINT.red, roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, envMap: env, envMapIntensity: 1.1 }),
    black: new THREE.MeshStandardMaterial({ color: 0x141416, roughness: 0.55, metalness: 0.1, envMap: env, envMapIntensity: 0.6 }),
    frame: new THREE.MeshStandardMaterial({ color: 0x0d0d0f, roughness: 0.42, metalness: 0.2, envMap: env, envMapIntensity: 0.7 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1, metalness: 1, envMap: env, envMapIntensity: 1.4 }),
    rubber: new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: 0.92, metalness: 0, envMap: env, envMapIntensity: 0.3 }),
    rim: new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: 0.4, metalness: 0.4, envMap: env, envMapIntensity: 0.8 }),
    can: new THREE.MeshStandardMaterial({ color: 0xcfd0d4, roughness: 0.28, metalness: 1, envMap: env, envMapIntensity: 1.2 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xc9a14a, roughness: 0.3, metalness: 1, envMap: env }),
    pcb: new THREE.MeshStandardMaterial({ color: 0xc7a35a, roughness: 0.45, metalness: 0.35, envMap: env }),
    spring: new THREE.MeshStandardMaterial({ color: 0xd3161b, roughness: 0.3, metalness: 0.4, envMap: env }),
    ti: new THREE.MeshStandardMaterial({ color: 0x8e9198, roughness: 0.3, metalness: 0.9, envMap: env }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x0c1014, roughness: 0.04, metalness: 0.3, clearcoat: 1, envMap: env, envMapIntensity: 1.5, side: THREE.DoubleSide }),
    amber: new THREE.MeshStandardMaterial({ color: 0xff8a10, emissive: 0xff6a00, emissiveIntensity: 0.25, roughness: 0.2, envMap: env }),
    lens: new THREE.MeshPhysicalMaterial({ color: 0xdfe6ee, roughness: 0.05, metalness: 0.6, clearcoat: 1, envMap: env, envMapIntensity: 1.6 }),
    wireR: new THREE.MeshStandardMaterial({ color: 0xc8141a, roughness: 0.5 }),
    wireB: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 }),
    wireO: new THREE.MeshStandardMaterial({ color: 0xe0701a, roughness: 0.5 }),
    white: new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.5 }),
  };
  const root = new THREE.Group();
  const parts = [];      // { name, obj, off: Vector3, rot: Euler, group, snap }
  const cast = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };
  const box = (w, h, d, mat, r = 0) => new THREE.Mesh(r ? new RoundedBoxGeometry(w, h, d, 2, r) : new THREE.BoxGeometry(w, h, d), mat);
  const cyl = (r, h, mat, seg = 24, r2) => new THREE.Mesh(new THREE.CylinderGeometry(r, r2 ?? r, h, seg), mat);
  const between = (a, b, r, mat) => {             // cylinder spanning two points
    const v = new THREE.Vector3().subVectors(b, a); const m = cyl(r, v.length(), mat, 12);
    m.position.copy(a).addScaledVector(v, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); return m;
  };
  const add = (name, obj, off, rot = [0, 0, 0], group = 'chassis', snap = 0, anchor) => {
    const holder = new THREE.Group(); holder.add(obj); root.add(holder); cast(obj);
    parts.push({ name, obj: holder, off: new THREE.Vector3(...off), rot: new THREE.Euler(...rot), group, snap, anchor: anchor ? new THREE.Vector3(...anchor) : null });
    return holder;
  };

  // ---------------------------------------------------------------- ladder frame
  const frame = new THREE.Group();
  for (const z of [-0.28, 0.28]) { const r = box(3.2, 0.09, 0.05, M.frame, 0.015); r.position.set(-0.05, 0.43, z); frame.add(r); }
  for (const x of [1.5, 0.62, -0.32, -1.58]) { const c = box(0.06, 0.07, 0.56, M.frame); c.position.set(x, 0.43, 0); frame.add(c); }
  for (const z of [-0.3, 0.3]) for (const x of [1.4, 0.95, -0.7, -1.25]) { const b = box(0.08, 0.12, 0.04, M.frame); b.position.set(x, 0.5, z * 1.08); frame.add(b); }
  const tray = box(0.95, 0.03, 0.5, M.black, 0.01); tray.position.set(-0.48, 0.41, 0); frame.add(tray);
  for (const z of [-0.24, 0.24]) { const w = box(0.95, 0.08, 0.02, M.black); w.position.set(-0.48, 0.46, z); frame.add(w); }
  add('frame', frame, [0, 0, 0], [0, 0, 0], 'frame', 10.0);

  // ---------------------------------------------------------------- axles, links, wheels, shocks
  const tyreProfile = [];
  for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (i / 16) * Math.PI; tyreProfile.push(new THREE.Vector2(0.235 + Math.cos(a) * 0.075, Math.sin(a) * 0.12)); }
  const tyreGeo = new THREE.LatheGeometry(tyreProfile, 48); tyreGeo.rotateX(Math.PI / 2);
  const lug = new THREE.BoxGeometry(0.05, 0.045, 0.07);
  const rimTex = canvasTex(256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#121214'; ctx.beginPath(); ctx.arc(128, 128, 126, 0, 7); ctx.fill();
    ctx.strokeStyle = '#2a2a2e'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(128, 128, 112, 0, 7); ctx.stroke();
    ctx.fillStyle = '#050506'; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ctx.beginPath(); ctx.ellipse(128 + Math.cos(a) * 80, 128 + Math.sin(a) * 80, 13, 9, a, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#1e1e21'; ctx.beginPath(); ctx.arc(128, 128, 46, 0, 7); ctx.fill();
    ctx.fillStyle = '#0a0a0b'; for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ctx.beginPath(); ctx.arc(128 + Math.cos(a) * 30, 128 + Math.sin(a) * 30, 5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#2c2c30'; ctx.beginPath(); ctx.arc(128, 128, 14, 0, 7); ctx.fill();
  });
  const makeWheel = side => {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(tyreGeo, M.rubber));
    const lugs = new THREE.InstancedMesh(lug, M.rubber, 72); const mm = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < 72; i++) {
      const a = (Math.floor(i / 2) / 36) * Math.PI * 2 + (i % 2) * 0.087; const zz = (i % 2 ? 0.05 : -0.05);
      q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a); mm.compose(new THREE.Vector3(Math.cos(a) * 0.305, Math.sin(a) * 0.305, zz), q, s); lugs.setMatrixAt(i, mm);
    }
    g.add(lugs);
    const rim = cyl(0.19, 0.17, M.rim, 32); rim.rotation.x = Math.PI / 2; g.add(rim);
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.19, 40), new THREE.MeshStandardMaterial({ map: rimTex, roughness: 0.45, metalness: 0.4, envMap: env }));
    face.position.z = 0.09 * side; if (side < 0) face.rotation.y = Math.PI; g.add(face);
    return g;
  };
  for (const [ax, name, snap] of [[FW, 'axleF', 10.0], [RW, 'axleR', 10.0]]) {
    const a = new THREE.Group();
    const h = cyl(0.05, 1.12, M.black, 16); h.rotation.x = Math.PI / 2; h.position.set(ax, WR, 0); a.add(h);
    const diff = new THREE.Mesh(new THREE.SphereGeometry(0.115, 24, 16), M.black); diff.scale.set(1, 0.95, 0.85); diff.position.set(ax, WR, 0.1); a.add(diff);
    const cover = cyl(0.08, 0.04, M.ti, 20); cover.rotation.z = Math.PI / 2; cover.position.set(ax - Math.sign(ax) * 0.1, WR, 0.1); a.add(cover);
    for (const z of [-0.5, 0.5]) { const k = box(0.11, 0.16, 0.08, M.black, 0.02); k.position.set(ax, WR, z); a.add(k); }
    add(name, a, [0, -0.62, 0], [0, 0, ax > 0 ? 0.12 : -0.12], 'chassis', snap);
    for (const side of [-1, 1]) {
      const w = makeWheel(side); w.position.set(ax, WR, side * TRACK);
      const hold = add(`wheel${name}${side}`, w, [0, -0.62, side * 0.8], [0, 0, 0], 'wheel', snap, [ax, WR, side * (TRACK + 0.12)]);
      hold.userData.spin = w;
    }
    const links = new THREE.Group();
    for (const z of [-0.2, 0.2]) {
      const dir = Math.sign(ax);
      links.add(between(new THREE.Vector3(ax - dir * 0.08, WR - 0.07, z * 1.6), new THREE.Vector3(ax - dir * 0.62, 0.38, z * 1.35), 0.016, M.ti));
      links.add(between(new THREE.Vector3(ax - dir * 0.08, WR + 0.09, z * 0.6), new THREE.Vector3(ax - dir * 0.52, 0.46, z * 0.9), 0.014, M.ti));
    }
    add(`links${name}`, links, [0, -0.38, 0], [0, 0, 0], 'chassis', snap + 0.5);
    for (const side of [-1, 1]) {
      const sh = new THREE.Group();
      const p0 = new THREE.Vector3(ax - Math.sign(ax) * 0.02, WR + 0.05, side * 0.43), p1 = new THREE.Vector3(ax + Math.sign(ax) * 0.05, 0.86, side * 0.34);
      sh.add(between(p0, p0.clone().lerp(p1, 0.55), 0.03, M.black));
      sh.add(between(p0.clone().lerp(p1, 0.4), p1, 0.012, M.chrome));
      const v = new THREE.Vector3().subVectors(p1, p0); const L = v.length();
      const pts = []; for (let i = 0; i <= 140; i++) { const t = i / 140; pts.push(new THREE.Vector3(Math.cos(t * Math.PI * 2 * 9) * 0.048, 0.06 + t * (L - 0.14), Math.sin(t * Math.PI * 2 * 9) * 0.048)); }
      const spring = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 400, 0.009, 6), M.spring);
      spring.position.copy(p0); spring.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), v.normalize()); sh.add(spring);
      for (const p of [p0, p1]) { const e = cyl(0.028, 0.03, M.black, 12); e.rotation.x = Math.PI / 2; e.position.copy(p); sh.add(e); }
      add(`shock${name}${side}`, sh, [0, 0.3, side * 0.5], [side * 0.25, 0, 0], 'chassis', snap + 0.5, [p1.x, (p0.y + p1.y) / 2, side * 0.42]);
    }
  }
  // ---------------------------------------------------------------- driveline
  const dl = new THREE.Group();
  const gbOut = new THREE.Vector3(0.18, 0.4, 0.04);
  dl.add(between(gbOut, new THREE.Vector3(FW - 0.13, WR + 0.02, 0.1), 0.026, M.black));
  dl.add(between(gbOut, new THREE.Vector3(RW + 0.13, WR + 0.02, 0.1), 0.026, M.black));
  for (const p of [gbOut, new THREE.Vector3(FW - 0.13, WR + 0.02, 0.1), new THREE.Vector3(RW + 0.13, WR + 0.02, 0.1)]) { const j = new THREE.Mesh(new THREE.SphereGeometry(0.04, 16, 12), M.ti); j.position.copy(p); dl.add(j); }
  add('driveline', dl, [0, -0.3, 0], [0, 0, 0], 'chassis', 10.5, [0.7, 0.36, 0.07]);
  // ---------------------------------------------------------------- motor + gearbox
  const mg = new THREE.Group();
  const gb = box(0.22, 0.2, 0.24, M.black, 0.03); gb.position.set(0.18, 0.5, 0.02); mg.add(gb);
  const motor = cyl(0.1, 0.3, M.can, 32); motor.rotation.z = Math.PI / 2; motor.position.set(0.44, 0.52, 0.06); mg.add(motor);
  const capE = cyl(0.1, 0.03, M.black, 32); capE.rotation.z = Math.PI / 2; capE.position.set(0.6, 0.52, 0.06); mg.add(capE);
  for (const dz of [-0.04, 0.04]) { const tab = box(0.03, 0.05, 0.015, M.brass); tab.position.set(0.62, 0.55, 0.06 + dz); mg.add(tab); }
  add('motor', mg, [0, 0.55, 0], [0, 0.3, 0], 'chassis', 11.0, [0.44, 0.52, 0.06]);
  // ---------------------------------------------------------------- receiver / ESC board
  const esc = new THREE.Group();
  const board = box(0.44, 0.022, 0.3, M.pcb); board.position.set(0.98, 0.52, 0); esc.add(board);
  [[0.88, -0.06, 0.08, 0.03, 0.06], [1.05, 0.08, 0.06, 0.025, 0.05], [1.12, -0.08, 0.05, 0.02, 0.05]].forEach(([x, z, w, h, d]) => { const c = box(w, h, d, M.wireB); c.position.set(x, 0.545, z); esc.add(c); });
  [[0.95, 0.09], [1.0, 0.1]].forEach(([x, z]) => { const c = cyl(0.025, 0.06, M.black, 16); c.position.set(x, 0.56, z); esc.add(c); });
  [[0.82, 0.08], [1.15, 0.05]].forEach(([x, z]) => { const c = box(0.07, 0.05, 0.05, M.white); c.position.set(x, 0.555, z); esc.add(c); });
  const wire = (pts, mat) => esc.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))), 40, 0.012, 6), mat));
  wire([[0.82, 0.56, 0.08], [0.72, 0.64, 0.12], [0.62, 0.6, 0.1], [0.6, 0.55, 0.08]], M.wireR);
  wire([[0.83, 0.56, 0.06], [0.74, 0.62, 0.02], [0.63, 0.58, 0.03], [0.6, 0.55, 0.04]], M.wireB);
  wire([[1.15, 0.56, 0.05], [1.25, 0.62, 0.0], [1.33, 0.56, -0.06]], M.wireO);
  add('esc', esc, [0.1, 0.85, 0], [0, -0.25, 0.1], 'chassis', 11.5, [0.98, 0.54, 0]);
  // ---------------------------------------------------------------- servo
  const sv = new THREE.Group();
  const svb = box(0.13, 0.11, 0.22, M.black, 0.015); svb.position.set(1.4, 0.48, -0.03); sv.add(svb);
  const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.08), new THREE.MeshStandardMaterial({ map: canvasTex(256, 100, (c, w, h) => { c.fillStyle = '#1b1b1d'; c.fillRect(0, 0, w, h); c.fillStyle = '#e22'; c.fillRect(0, 0, 12, h); c.font = fontStr(44, 700); c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText('17g', 28, h / 2); c.font = fontStr(22, 600); c.fillStyle = '#aaa'; c.fillText('SERVO', 120, h / 2); }), roughness: 0.6 }));
  lab.position.set(1.4, 0.48, 0.081); sv.add(lab);
  const horn = box(0.03, 0.02, 0.12, M.white); horn.position.set(1.42, 0.55, -0.1); sv.add(horn);
  add('servo', sv, [0.3, 0.6, -0.25], [0, 0.5, 0], 'chassis', 11.5, [1.4, 0.48, -0.03]);
  // ---------------------------------------------------------------- battery
  const bat = new THREE.Group();
  const batTex = canvasTex(512, 160, (c, w, h) => {
    c.fillStyle = '#122a6a'; c.fillRect(0, 0, w, h); c.fillStyle = '#0a1a46'; c.fillRect(0, h * 0.7, w, h * 0.3);
    c.font = fontStr(64, 700); c.fillStyle = '#fff'; c.textBaseline = 'middle'; c.fillText('7.4V', 24, h * 0.36);
    c.font = fontStr(40, 600); c.fillStyle = '#9fd0ff'; c.fillText('500mAh LI-ION', 190, h * 0.38);
    c.font = fontStr(24, 600); c.fillStyle = '#c8d6ff'; c.fillText('RECHARGEABLE · USB', 24, h * 0.85);
  });
  const pack = box(0.5, 0.13, 0.3, new THREE.MeshStandardMaterial({ color: 0xffffff, map: batTex, roughness: 0.35, metalness: 0.1, envMap: env }), 0.04);
  pack.position.set(-0.48, 0.5, 0); bat.add(pack);
  const plug = box(0.06, 0.04, 0.06, M.white); plug.position.set(-0.18, 0.52, 0.1); bat.add(plug);
  add('battery', bat, [-0.1, 0.95, 0], [0.15, 0.4, 0], 'chassis', 12.0, [-0.48, 0.5, 0]);

  // ---------------------------------------------------------------- body: front clip
  const extrude = (pts, depth, bevel = 0.025, holes = []) => {
    const sh = new THREE.Shape(pts.map(p => new THREE.Vector2(...p)));
    holes.forEach(h => sh.holes.push(h));
    const g = new THREE.ExtrudeGeometry(sh, { depth: depth - bevel * 2, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 24 });
    g.translate(0, 0, -(depth - bevel * 2) / 2); return g;
  };
  const archPts = (cx, y0, r, x0, x1) => {   // outline bottom with wheel arch from x0 (front) to x1 (rear)
    const pts = []; const dy = y0 - WR; const half = Math.sqrt(r * r - dy * dy);
    pts.push([x0, y0], [cx + half, y0]);
    const a0 = Math.atan2(dy, half), a1 = Math.PI - a0;
    for (let i = 1; i < 20; i++) { const a = a0 + (a1 - a0) * (i / 20); pts.push([cx + Math.cos(a) * r, WR + Math.sin(a) * r]); }
    pts.push([cx - half, y0], [x1, y0]); return pts;
  };
  const fc = new THREE.Group();
  const clipPts = [[0.78, 0.9], [1.7, 0.9], [1.79, 0.86], [1.8, 0.56], ...archPts(FW, 0.56, 0.43, 1.8, 0.78).slice(1)];
  fc.add(new THREE.Mesh(extrude(clipPts, 1.3, 0.03), M.paint));
  const scoop = box(0.28, 0.035, 0.36, M.paint, 0.015); scoop.position.set(1.32, 0.915, 0); fc.add(scoop);
  const grilleTex = canvasTex(512, 200, (c, w, h) => {
    c.fillStyle = '#0b0b0c'; c.fillRect(0, 0, w, h);
    c.fillStyle = PAINT.red; for (let i = 0; i < 3; i++) c.fillRect(20, 40 + i * 50, w - 40, 16);
    for (let i = 0; i < 6; i++) c.fillRect(30 + i * 90, 20, 10, h - 40);
    c.strokeStyle = '#ddd'; c.lineWidth = 8; c.beginPath(); c.ellipse(w / 2, h / 2, 36, 26, 0, 0, 7); c.stroke();
    c.beginPath(); c.ellipse(w / 2, h / 2 - 4, 14, 22, 0, 0, 7); c.stroke();
  });
  fc.userData.grilleTex = grilleTex;
  const grille = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.22), new THREE.MeshStandardMaterial({ map: grilleTex, roughness: 0.35, metalness: 0.5, envMap: env }));
  grille.rotation.y = Math.PI / 2; grille.position.set(1.812, 0.74, 0); fc.add(grille);
  const gFrame = box(0.02, 0.25, 0.66, M.chrome); gFrame.position.set(1.805, 0.74, 0); fc.add(gFrame);
  for (const z of [-0.47, 0.47]) {
    const bez = box(0.03, 0.17, 0.2, M.chrome, 0.01); bez.position.set(1.805, 0.75, z); fc.add(bez);
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.07, 24, 12, 0, Math.PI), M.lens); l.rotation.y = Math.PI / 2; l.scale.set(1, 1, 0.4); l.position.set(1.82, 0.75, z); fc.add(l);
    const am = box(0.04, 0.09, 0.08, M.amber, 0.01); am.position.set(1.79, 0.76, z * 1.33); fc.add(am);
  }
  for (const side of [-1, 1]) {   // black flares
    const fl = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.035, 8, 32, Math.PI * 0.9), M.black);
    fl.position.set(FW, WR, side * 0.665); fl.rotation.z = Math.PI * 0.05; fc.add(fl);
  }
  add('frontclip', fc, [0.7, 1.15, 0], [0, 0, 0.3], 'body', 13.5, [1.3, 0.9, 0]);
  // bumper
  const bp = new THREE.Group();
  const bb = box(0.14, 0.2, 1.36, M.black, 0.03); bb.position.set(1.86, 0.6, 0); bp.add(bb);
  const bar = box(0.04, 0.05, 1.1, M.chrome, 0.015); bar.position.set(1.94, 0.67, 0); bp.add(bar);
  for (const z of [-0.5, 0.5]) { const f = cyl(0.035, 0.03, M.lens, 20); f.rotation.z = Math.PI / 2; f.position.set(1.935, 0.57, z); bp.add(f); }
  add('bumper', bp, [1.0, 0.1, 0], [0, 0.4, 0], 'body', 13.5);
  // snorkel (left side, as on the product)
  const sn = new THREE.Group();
  const snCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(1.0, 0.86, -0.67), new THREE.Vector3(0.86, 0.95, -0.69), new THREE.Vector3(0.78, 1.2, -0.69), new THREE.Vector3(0.7, 1.46, -0.69)]);
  sn.add(new THREE.Mesh(new THREE.TubeGeometry(snCurve, 40, 0.03, 12), M.black));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), M.black); head.scale.set(1, 0.8, 1); head.position.set(0.7, 1.5, -0.69); sn.add(head);
  add('snorkel', sn, [0.3, 1.4, -0.7], [0.4, 0, 0.6], 'body', 13.0);
  // ---------------------------------------------------------------- cab
  const cab = new THREE.Group();
  const cabPts = [[0.78, 0.56], [0.78, 0.92], [0.66, 1.42], [-0.08, 1.44], [-0.13, 1.4], [-0.13, 0.56]];
  cab.add(new THREE.Mesh(extrude(cabPts, 1.3, 0.035), M.paint));
  const ws = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.46), M.glass);
  ws.position.set(0.735, 1.17, 0); ws.rotation.set(0, Math.PI / 2, 0); ws.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.atan2(0.12, 0.5)); cab.add(ws);
  for (const side of [-1, 1]) {
    const sw = new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape([[0.62, 1.0], [0.04, 1.0], [0.04, 1.36], [0.53, 1.36]].map(p => new THREE.Vector2(...p)))), M.glass);
    sw.position.z = side * 0.657; cab.add(sw);
    const door = box(0.6, 0.006, 0.006, M.black); door.position.set(0.33, 0.62, side * 0.656); cab.add(door);
    for (const x of [0.03, 0.66]) { const dl2 = box(0.006, 0.4, 0.006, M.black); dl2.position.set(x, 0.78, side * 0.656); cab.add(dl2); }
    const hdl = box(0.07, 0.02, 0.012, M.chrome); hdl.position.set(0.1, 0.92, side * 0.66); cab.add(hdl);
    const arm = box(0.02, 0.02, 0.08, M.black); arm.position.set(0.66, 1.02, side * 0.69); cab.add(arm);
    const mir = box(0.03, 0.11, 0.07, M.black, 0.01); mir.position.set(0.66, 1.05, side * 0.75); cab.add(mir);
  }
  const rw = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.26), M.glass); rw.rotation.y = -Math.PI / 2; rw.position.set(-0.137, 1.2, 0); cab.add(rw);
  for (const side of [-1, 1]) { const sill = box(0.9, 0.06, 0.02, M.black); sill.position.set(0.32, 0.59, side * 0.66); cab.add(sill); }
  add('cab', cab, [0, 1.75, 0], [0, -0.35, -0.12], 'body', 13.0, [0.3, 1.44, 0]);
  // roll bar (body coloured, as on the product)
  const rb = new THREE.Group();
  for (const z of [-0.56, 0.56]) { rb.add(between(new THREE.Vector3(-0.22, 0.98, z), new THREE.Vector3(-0.22, 1.46, z), 0.028, M.paint)); rb.add(between(new THREE.Vector3(-0.22, 1.4, z), new THREE.Vector3(-0.55, 0.98, z), 0.022, M.paint)); }
  rb.add(between(new THREE.Vector3(-0.22, 1.46, -0.56), new THREE.Vector3(-0.22, 1.46, 0.56), 0.028, M.paint));
  rb.add(between(new THREE.Vector3(-0.22, 1.28, -0.56), new THREE.Vector3(-0.22, 1.28, 0.56), 0.018, M.paint));
  add('rollbar', rb, [-0.35, 2.15, 0], [0, 0, 0.5], 'body', 12.5);
  // ---------------------------------------------------------------- bed
  const bed = new THREE.Group();
  const floor = box(1.66, 0.04, 1.26, M.paint, 0.01); floor.position.set(-0.99, 0.62, 0); bed.add(floor);
  for (const side of [-1, 1]) {
    const wall = new THREE.Mesh(extrude([[-0.16, 1.0], [-1.82, 1.0], ...archPts(RW, 0.6, 0.43, -0.16, -1.82).reverse()], 0.05, 0.012), M.paint);
    wall.position.z = side * 0.635; bed.add(wall);
    const lip = box(1.68, 0.03, 0.08, M.paint, 0.01); lip.position.set(-0.99, 1.0, side * 0.62); bed.add(lip);
    const fl = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.032, 8, 32, Math.PI * 0.9), M.black); fl.position.set(RW, WR, side * 0.66); fl.rotation.z = Math.PI * 0.05; bed.add(fl);
    for (let i = 0; i < 6; i++) { const rib = box(0.02, 0.3, 0.012, M.paint); rib.position.set(-0.35 - i * 0.28, 0.82, side * 0.664); bed.add(rib); }
  }
  const fw = box(0.05, 0.4, 1.3, M.paint, 0.01); fw.position.set(-0.18, 0.8, 0); bed.add(fw);
  const tg = box(0.05, 0.4, 1.3, M.paint, 0.01); tg.position.set(-1.81, 0.8, 0); bed.add(tg);
  for (const z of [-0.5, 0.5]) { const tl = box(0.02, 0.1, 0.12, new THREE.MeshStandardMaterial({ color: 0xff2020, emissive: 0xaa0000, emissiveIntensity: 0.5, roughness: 0.2 })); tl.position.set(-1.84, 0.68, z); bed.add(tl); }
  add('bed', bed, [-0.8, 1.2, 0], [0, 0.25, -0.2], 'body', 12.5, [-1.0, 1.0, 0.63]);

  // ---------------------------------------------------------------- outline highlight (inverted hull) per part
  const hiMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.6, 0.05, 0.03), side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  parts.forEach(p => {
    const hulls = [];
    p.obj.traverse(m => { if (m.isMesh && !m.isInstancedMesh && m.geometry.type !== 'PlaneGeometry' && m.geometry.type !== 'ShapeGeometry' && m.geometry.type !== 'CircleGeometry') hulls.push(m); });
    p.hi = hulls.map(m => { const h = new THREE.Mesh(m.geometry, hiMat.clone()); h.castShadow = false; h.receiveShadow = false; m.add(h); h.userData.mesh = m; return h; });
  });

  // technical edge lines (blueprint look while exploded)
  const wireMat = new THREE.LineBasicMaterial({ color: new THREE.Color(1, 1, 1), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  parts.forEach(p => p.obj.traverse(m => {
    if (!m.isMesh || m.isInstancedMesh || !m.geometry || m.material === hiMat || m.userData.mesh) return;
    const n = m.geometry.attributes.position.count; if (n > 6000) return;
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 30), wireMat); m.add(e);
  }));
  const api = {
    root, parts, M,
    byName: Object.fromEntries(parts.map(p => [p.name, p])),
    setPaint(hex) { M.paint.color.set(hex); },
    setWire(o) { wireMat.opacity = o; wireMat.visible = o > 0.003; },
    /** f(name) -> explode amount 0..1+ ; hover(t) adds float wobble */
    pose(f, t = 0, wobble = 0) {
      parts.forEach((p, i) => {
        const e = f(p);
        p.obj.position.copy(p.off).multiplyScalar(e);
        p.obj.position.y += Math.sin(t * 1.3 + i * 1.7) * 0.04 * wobble * Math.min(1, e);
        p.obj.rotation.set(p.rot.x * e + Math.sin(t * 0.9 + i) * 0.04 * wobble * Math.min(1, e), p.rot.y * e, p.rot.z * e);
      });
    },
    highlight(name, amt, t = 0) {
      parts.forEach(p => {
        const on = (Array.isArray(name) ? name.includes(p.name) : p.name === name);
        p.hi.forEach(h => {
          const s = 1 + 0.035 / Math.max(0.15, h.userData.mesh.geometry.boundingSphere ? h.userData.mesh.geometry.boundingSphere.radius : 0.3);
          h.scale.setScalar(s); h.material.opacity = on ? amt * (0.75 + 0.25 * Math.sin(t * 12)) : 0; h.visible = h.material.opacity > 0.01;
        });
      });
    },
    spinWheels(a) { parts.forEach(p => { if (p.obj.userData.spin) p.obj.userData.spin.rotation.z = -a; }); },
    anchorWorld(name, out) {
      const p = api.byName[name]; out.copy(p.anchor || new THREE.Vector3()); return p.obj.localToWorld(out);
    },
  };
  parts.forEach(p => p.obj.traverse(m => { if (m.isMesh && m.geometry && !m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); }));
  return api;
}
