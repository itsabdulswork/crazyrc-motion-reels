import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { SEGS, end, cue, BRAND } from './timeline';
import { FONT, Glass, Label, pop, ease, clamp, IconShield, IconSpring } from './ui';
import { SpeedLines, LightLeak, Flash, Dust } from './FX';

const life = (f: number, a: number, b: number) => {
  const inn = pop(f, a, { damping: 14, stiffness: 170, mass: 0.7 });
  const out = interpolate(f, [b - 6, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  return { inn, out, on: f >= a && f < b };
};
const Zone: React.FC<{ children: React.ReactNode; y?: number }> = ({ children, y = 1420 }) => (
  <AbsoluteFill style={{ top: y, height: 1920 - y, alignItems: 'center', justifyContent: 'flex-start' }}>{children}</AbsoluteFill>
);
const Slide: React.FC<{ inn: number; out: number; children: React.ReactNode; tilt?: number }> = ({ inn, out, children, tilt = 0 }) => (
  <div style={{ transform: `perspective(1400px) translateY(${(1 - inn) * 240 + out * 240}px) rotateX(${(1 - inn) * 28}deg) rotate(${(1 - inn) * tilt}deg)`, opacity: clamp(inn * 1.6) * (1 - out) }}>{children}</div>
);
const Sheen: React.FC<{ f: number; a: number; dur?: number }> = ({ f, a, dur = 22 }) => {
  const x = interpolate(f, [a, a + dur], [-40, 140], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) });
  return <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(110deg, transparent ${x - 12}%, rgba(255,255,255,0.28) ${x}%, transparent ${x + 12}%)`, pointerEvents: 'none' }} />;
};
const Chip: React.FC<{ children: React.ReactNode; p: number; bg?: string; fg?: string }> = ({ children, p, bg = 'rgba(255,255,255,0.1)', fg = '#fff' }) => (
  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: '0.16em', color: fg, background: bg, border: '1.5px solid rgba(255,255,255,0.18)', padding: '8px 14px', borderRadius: 10, transform: `scale(${p})`, opacity: clamp(p * 2) }}>{children}</div>
);

// ================================================================================ 1. kinetic hook
const HookKinetic: React.FC<{ f: number }> = ({ f }) => {
  const segEnd = end(0); if (f >= segEnd) return null;
  const b = cue('budget'), t = cue('tight'), n = cue('need'), fa = cue('fast');
  const g1out = ease(f, n - 4, n + 2, 0, 1, Easing.in(Easing.cubic));
  const pb = pop(f, b, { damping: 11, stiffness: 200, mass: 0.6 });
  const pt = pop(f, t, { damping: 9, stiffness: 240, mass: 0.5 });
  const vise = ease(f, t + 2, t + 9, 0, 1, Easing.out(Easing.back(2)));
  const shake = f > t + 6 && f < t + 16 ? (random(`v${f}`) - 0.5) * 10 : 0;
  const pn = pop(f, n, { damping: 12, stiffness: 220, mass: 0.5 });
  const ps = pop(f, fa, { damping: 10, stiffness: 160, mass: 0.6 });
  const out = ease(f, segEnd - 5, segEnd);
  return (
    <AbsoluteFill style={{ opacity: 1 - out }}>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 52%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0.75))', opacity: ease(f, 0, 8) }} />
      {f < n + 2 && (
        <div style={{ position: 'absolute', top: 1250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: 1 - g1out, transform: `translateY(${-g1out * 160}px)` }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 64, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.75)', transform: `scale(${pb})`, opacity: clamp(pb * 2) }}>BUDGET</div>
          {f >= t && (
            <div style={{ position: 'relative', marginTop: 8, transform: `translateX(${shake}px) scaleX(${1 - vise * 0.16})` }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 230, lineHeight: 0.95, color: '#fff', transform: `scale(${interpolate(pt, [0, 1], [2.2, 1])})`, opacity: clamp(pt * 2), textShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>TIGHT?</div>
              {[-1, 1].map(s => <div key={s} style={{ position: 'absolute', top: 20, [s < 0 ? 'left' : 'right']: interpolate(vise, [0, 1], [-260, -36]), width: 34, height: 200, borderRadius: 8, background: `linear-gradient(90deg, ${BRAND.red}, ${BRAND.hot})`, boxShadow: '0 0 30px rgba(255,42,42,0.6)' }} />)}
            </div>
          )}
        </div>
      )}
      {f >= n && (
        <div style={{ position: 'absolute', top: 1250, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 64, letterSpacing: '0.3em', color: 'rgba(255,255,255,0.75)', transform: `translateY(${(1 - pn) * 60}px)`, opacity: clamp(pn * 2) }}>BUT NEED</div>
          {f >= fa && (
            <div style={{ position: 'relative', marginTop: 8 }}>
              {[3, 2, 1].map(k => <div key={k} style={{ position: 'absolute', inset: 0, fontFamily: FONT, fontWeight: 700, fontSize: 230, lineHeight: 0.95, fontStyle: 'italic', color: BRAND.hot, opacity: 0.18 * (4 - k) * (1 - ease(f, fa + 4, fa + 14)), transform: `translateX(${-k * 50 * (1 - ps) - k * 14}px) skewX(-12deg)` }}>SPEED?</div>)}
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 230, lineHeight: 0.95, fontStyle: 'italic', color: BRAND.hot, transform: `translateX(${(1 - ps) * -700}px) skewX(-12deg)`, textShadow: '0 20px 60px rgba(219,0,0,0.55)' }}>SPEED?</div>
            </div>
          )}
        </div>
      )}
      <SpeedLines a={fa} b={segEnd} cy={1300} strength={0.65} />
    </AbsoluteFill>
  );
};

// ================================================================================ 2. hero plate under the title
const HeroPlate: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('c8819') - 4, b = end(1); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const rot = interpolate(f, [a, a + 22], [55, -8], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }) + Math.sin((f - a) / 20) * 3;
  const chips = ['1:20 SCALE', '4WD', '35 KM/H', 'RTR'];
  return (
    <Zone y={1330}><Slide inn={inn} out={out}>
      <Glass style={{ width: 960, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        <div style={{ position: 'absolute', left: '50%', top: 236, width: 600, height: 50, marginLeft: -300, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,42,42,0.55), transparent 70%)', filter: 'blur(6px)' }} />
        <Img src={staticFile('img/grey.png')} style={{ width: 560, marginTop: -110, transform: `perspective(1200px) rotateY(${rot}deg)`, filter: 'drop-shadow(0 26px 24px rgba(0,0,0,0.65))' }} />
        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>{chips.map((c, i) => <Chip key={c} p={pop(f, a + 10 + i * 3)} bg={i === 2 ? BRAND.red : undefined}>{c}</Chip>)}</div>
        <Sheen f={f} a={a + 8} />
      </Glass>
    </Slide></Zone>
  );
};

// ================================================================================ 3. speedometer
const Gauge: React.FC<{ v: number; max?: number; glow: number }> = ({ v, max = 40, glow }) => {
  const A0 = -225, A1 = 45; const ang = (x: number) => ((A0 + (A1 - A0) * (x / max)) * Math.PI) / 180;
  const R = 150, cx = 180, cy = 180;
  const arc = (x0: number, x1: number, r: number) => { const a0 = ang(x0), a1 = ang(x1); return `M${cx + Math.cos(a0) * r} ${cy + Math.sin(a0) * r} A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + Math.cos(a1) * r} ${cy + Math.sin(a1) * r}`; };
  const na = ang(v);
  return (
    <svg width={360} height={330} viewBox="0 0 360 330">
      <path d={arc(0, max, R)} stroke="rgba(255,255,255,0.12)" strokeWidth={18} fill="none" strokeLinecap="round" />
      <path d={arc(0, Math.max(0.01, v), R)} stroke="url(#gg)" strokeWidth={18} fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 ${8 + glow * 18}px rgba(255,42,42,0.9))` }} />
      <defs><linearGradient id="gg" x1="0" x2="1"><stop offset="0" stopColor="#ffb02a" /><stop offset="1" stopColor="#ff2a2a" /></linearGradient></defs>
      {Array.from({ length: 9 }, (_, i) => { const x = i * 5; const a = ang(x); return (
        <g key={i}><line x1={cx + Math.cos(a) * (R - 26)} y1={cy + Math.sin(a) * (R - 26)} x2={cx + Math.cos(a) * (R - 40)} y2={cy + Math.sin(a) * (R - 40)} stroke={x <= v ? '#fff' : 'rgba(255,255,255,0.35)'} strokeWidth={4} />
          <text x={cx + Math.cos(a) * (R - 62)} y={cy + Math.sin(a) * (R - 62) + 8} fill="rgba(255,255,255,0.6)" fontFamily="Bai Jamjuree" fontWeight={700} fontSize={20} textAnchor="middle">{x}</text></g>); })}
      <line x1={cx} y1={cy} x2={cx + Math.cos(na) * (R - 30)} y2={cy + Math.sin(na) * (R - 30)} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={14} fill={BRAND.hot} />
    </svg>
  );
};
const SpeedPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[2].from + 2, b = end(2); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const s = cue('speed'), up = cue('upto');
  const rev = interpolate(f, [up - 4, up + 4, s - 2], [0, 12, 6], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const hit = ease(f, s - 2, s + 14, 0, 1, Easing.out(Easing.back(1.4)));
  const v = f < s - 2 ? rev : interpolate(hit, [0, 1], [6, 35]) + (f > s + 14 ? Math.sin(f / 2) * 0.4 : 0);
  const glow = ease(f, s + 8, s + 16) * (0.6 + 0.4 * Math.sin(f / 3));
  const kmh = pop(f, cue('kmh'));
  return (
    <Zone y={1400}><Slide inn={inn} out={out}>
      <Glass style={{ width: 960, height: 400, display: 'flex', alignItems: 'center', paddingLeft: 30 }}>
        <Gauge v={v} glow={glow} />
        <div style={{ marginLeft: 10 }}>
          <Label size={26} ls={0.3} color="rgba(255,255,255,0.7)">TOP SPEED</Label>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 210, lineHeight: 0.86, color: '#fff', textShadow: `0 0 ${glow * 40}px rgba(255,42,42,0.8)`, fontVariantNumeric: 'tabular-nums' }}>{Math.round(v)}</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 54, letterSpacing: '0.16em', color: BRAND.hot, transform: `translateX(${(1 - kmh) * 60}px)`, opacity: clamp(kmh * 2) }}>KM/H</div>
        </div>
        <Sheen f={f} a={s + 6} />
      </Glass>
    </Slide></Zone>
  );
};

// ================================================================================ 4. cinematic cutaway
const Cutaway: React.FC<{ f: number; a: number; b: number; img: string; kicker: string; lines: string[]; at?: number[] }> = ({ f, a, b, img, kicker, lines, at = [] }) => {
  if (f < a || f >= b) return null;
  const wipe = ease(f, a, a + 9, 0, 1, Easing.inOut(Easing.cubic)); const wout = ease(f, b - 8, b, 0, 1, Easing.inOut(Easing.cubic));
  const kb = interpolate(f, [a, b], [1.04, 1.16]);
  const px = interpolate(f, [a, b], [-14, 14]);
  return (
    <AbsoluteFill style={{ clipPath: `polygon(${wout * 160 - 30}% 0, ${wipe * 160}% 0, ${wipe * 160 - 30}% 100%, ${wout * 160 - 60}% 100%)` }}>
      <AbsoluteFill style={{ background: '#050506' }} />
      <Img src={staticFile(`img/${img}`)} style={{ position: 'absolute', width: 1080, height: 1920, objectFit: 'cover', transform: 'scale(1.3)', filter: 'blur(36px) brightness(0.45) saturate(1.3)' }} />
      <div style={{ position: 'absolute', left: 40, right: 40, top: 290, height: 900, borderRadius: 36, overflow: 'hidden', boxShadow: '0 50px 100px rgba(0,0,0,0.65), 0 0 0 2px rgba(255,255,255,0.08)' }}>
        <Img src={staticFile(`img/${img}`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${kb}) translateX(${px}px)`, filter: 'contrast(1.1) saturate(1.15)' }} />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1250 }}>
        <Label size={34} ls={0.36} color={BRAND.gold} style={{ opacity: ease(f, a + 6, a + 12) }}>{kicker}</Label>
        {lines.map((l, i) => { const p = pop(f, at[i] ?? a + 8 + i * 6); return <div key={i} style={{ overflow: 'hidden', paddingBottom: 6 }}><Label size={150} ls={-0.01} color={i === 0 ? '#fff' : BRAND.hot} style={{ transform: `translateY(${(1 - p) * 110}%)`, lineHeight: 1 }}>{l}</Label></div>; })}
      </div>
      <div style={{ position: 'absolute', left: 40, top: 250, width: interpolate(ease(f, a + 4, a + 18), [0, 1], [0, 1000]), height: 6, background: BRAND.hot, boxShadow: '0 0 18px #ff2a2a' }} />
      <Dust a={a} b={b} n={28} />
    </AbsoluteFill>
  );
};

// ================================================================================ 5. suspension with live callouts
const SHOCKS = [[0.65, 0.75], [0.17, 0.69]];
const SuspensionPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[4].from + 2, b = end(4); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const four = cue('four'), sus = cue('suspension');
  const n = pop(f, four, { damping: 9, stiffness: 220, mass: 0.6 });
  const squash = f >= sus ? (Math.sin((f - sus) / 2.4) + 1) / 2 * Math.exp(-(f - sus) / 30) : 0;
  const W = 540, H = 408;
  return (
    <Zone y={1350}><Slide inn={inn} out={out}>
      <Glass style={{ width: 980, height: 440, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: W, height: H, marginLeft: 18, borderRadius: 22, overflow: 'hidden' }}>
          <Img src={staticFile('img/shocks.jpg')} style={{ width: W, height: H, objectFit: 'cover', transform: `translateY(${squash * 6}px)` }} />
          {SHOCKS.map(([x, y], i) => {
            const p = pop(f, four + 2 + i * 5); const ring = ((f - four) % 20) / 20;
            return (<React.Fragment key={i}>
              <div style={{ position: 'absolute', left: x * W - 34, top: y * H - 34, width: 68, height: 68, borderRadius: '50%', border: `4px solid ${BRAND.hot}`, transform: `scale(${p * (1 + ring * 0.6)})`, opacity: clamp(p) * (1 - ring * 0.8) }} />
              <div style={{ position: 'absolute', left: x * W - 9, top: y * H - 9, width: 18, height: 18, borderRadius: 9, background: '#fff', boxShadow: '0 0 16px #ff2a2a', transform: `scale(${p})` }} />
            </React.Fragment>);
          })}
        </div>
        <div style={{ marginLeft: 26, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 190, lineHeight: 0.85, color: BRAND.hot, transform: `scale(${interpolate(n, [0, 1], [2.4, 1])})`, opacity: clamp(n * 2) }}>4</div>
            <IconSpring squash={squash} size={130} />
          </div>
          <Label size={30} ls={0.14} style={{ opacity: ease(f, four, four + 8) }}>INDEPENDENT</Label>
          <Label size={42} ls={0.02} color={BRAND.hot} style={{ opacity: ease(f, sus - 2, sus + 6) }}>SUSPENSION</Label>
        </div>
        <Sheen f={f} a={sus} />
      </Glass>
    </Slide></Zone>
  );
};

// ================================================================================ 6. tyres
const Tyre: React.FC<{ size: number; rot: number }> = ({ size, rot }) => (
  <svg width={size} height={size} viewBox="0 0 200 200"><g transform={`rotate(${rot} 100 100)`}>
    <circle cx="100" cy="100" r="92" fill="#2a2a30" stroke={BRAND.hot} strokeWidth={4} />
    {Array.from({ length: 18 }, (_, i) => <rect key={i} x="94" y="4" width="16" height="22" rx="3" fill="#4a4a52" transform={`rotate(${i * 20} 100 100)`} />)}
    <circle cx="100" cy="100" r="54" fill="#8a8d94" stroke="#c9ccd2" strokeWidth={4} />
    {Array.from({ length: 5 }, (_, i) => <path key={i} d="M100 52 L108 92 L92 92 Z" fill="#1e1e22" transform={`rotate(${i * 72} 100 100)`} />)}
    <circle cx="100" cy="100" r="13" fill={BRAND.hot} /></g></svg>
);
const WHEELS = [[0.53, 0.79, 78], [0.93, 0.575, 62]];
const TyrePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[5].from + 1, b = end(6); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const four = cue('four2'), sp = cue('specially'), ty = cue('tyres');
  const roll = ease(f, ty - 4, ty + 14, 0, 1, Easing.out(Easing.cubic));
  const W = 560;
  return (
    <Zone y={1350}><Slide inn={inn} out={out}>
      <Glass style={{ width: 980, height: 440, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: W, marginLeft: 16 }}>
          <Img src={staticFile('img/grey.png')} style={{ width: W }} />
          <svg width={W} height={W * 679 / 1152} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
            {WHEELS.map(([x, y, r], i) => { const d = ease(f, four + i * 6, four + i * 6 + 14); return (
              <circle key={i} cx={x * W} cy={y * W * 679 / 1152} r={r} fill="none" stroke={BRAND.hot} strokeWidth={5} strokeDasharray={`${2 * Math.PI * r * d} 999`} transform={`rotate(${-90 + f * 4} ${x * W} ${y * W * 679 / 1152})`} style={{ filter: 'drop-shadow(0 0 8px #ff2a2a)' }} />); })}
          </svg>
        </div>
        <div style={{ marginLeft: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ transform: `translateX(${(1 - roll) * 420}px) rotate(${(1 - roll) * 360 + f * 3}deg)`, opacity: clamp(roll * 3) }}><Tyre size={170} rot={0} /></div>
          <Label size={26} ls={0.2} color={BRAND.gold} style={{ marginTop: 6, opacity: ease(f, sp, sp + 6) }}>SPECIALLY MADE</Label>
          <Label size={40} ls={0.02} style={{ opacity: ease(f, ty, ty + 6) }}>OFF-ROAD</Label>
          <Label size={40} ls={0.02} color={BRAND.hot} style={{ opacity: ease(f, ty + 3, ty + 9) }}>TYRES ×4</Label>
        </div>
      </Glass>
    </Slide></Zone>
  );
};

// ================================================================================ 7. damage → care plan → stamp
const Crack: React.FC<{ f: number; t0: number }> = ({ f, t0 }) => {
  const l = f - t0; if (l < 0 || l > 18) return null;
  const grow = ease(l, 0, 4); const fade = 1 - ease(l, 9, 18);
  const cx = 560, cy = 760;
  const lines = Array.from({ length: 13 }, (_, i) => {
    const ang = (i / 13) * Math.PI * 2 + random(`c${i}`) * 0.5; const L = 320 + random(`l${i}`) * 540;
    let d = `M${cx} ${cy}`;
    for (let k = 1; k <= 4; k++) d += ` L${cx + Math.cos(ang + (random(`j${i}${k}`) - 0.5) * 0.5) * L * (k / 4) * grow} ${cy + Math.sin(ang + (random(`k${i}${k}`) - 0.5) * 0.5) * L * (k / 4) * grow}`;
    return d;
  });
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1080} height={1920}>{lines.map((d, i) => <path key={i} d={d} stroke="#fff" strokeWidth={4 - (i % 3)} fill="none" opacity={0.85} />)}<circle cx={cx} cy={cy} r={20 * grow} fill="#fff" opacity={0.8} /></svg>
      <AbsoluteFill style={{ background: 'rgba(255,40,30,0.22)', opacity: 1 - ease(l, 0, 6) }} />
    </AbsoluteFill>
  );
};
const CarePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('months') - 6, b = end(7); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const m = cue('months'), fr = cue('free');
  const months = Math.min(6, Math.floor(interpolate(f, [m, m + 12], [0, 6.99], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })));
  const st = pop(f, fr, { damping: 8, stiffness: 240, mass: 0.6 });
  return (
    <Zone y={1360}><Slide inn={inn} out={out}>
      <Glass style={{ width: 960, height: 400, display: 'flex', alignItems: 'center', gap: 26, paddingLeft: 46, overflow: 'visible' }}>
        <IconShield size={210} draw={ease(f, a, a + 18)} />
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 130, lineHeight: 0.9, color: '#fff' }}>{months} <span style={{ fontSize: 64 }}>MONTHS</span></div>
          <div style={{ display: 'flex', gap: 10, margin: '12px 0' }}>{Array.from({ length: 6 }, (_, i) => <div key={i} style={{ width: 54, height: 14, borderRadius: 7, background: i < months ? BRAND.hot : 'rgba(255,255,255,0.15)', boxShadow: i < months ? '0 0 10px #ff2a2a' : undefined }} />)}</div>
          <Label size={22} ls={0.16} color={BRAND.gold}>INDIA'S FIRST RC CARE PLAN</Label>
        </div>
        {f >= fr && (
          <div style={{ position: 'absolute', left: 6, top: 200, transform: `rotate(-12deg) scale(${interpolate(st, [0, 1], [2.6, 1])})`, opacity: clamp(st * 2), border: `8px solid ${BRAND.hot}`, borderRadius: 20, padding: '6px 22px', background: 'rgba(20,0,0,0.85)', boxShadow: '0 20px 50px rgba(0,0,0,0.6)' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 66, color: BRAND.hot, lineHeight: 1, letterSpacing: '0.04em' }}>FREE</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: '#fff', letterSpacing: '0.3em', textAlign: 'center' }}>REPAIR</div>
          </div>
        )}
      </Glass>
    </Slide></Zone>
  );
};

// ================================================================================ 8. repair bill ₹0
const Receipt: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('breaks') - 2, b = end(8); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const fx = cue('fix');
  const rows = [['DIAGNOSIS', a + 6], ['REPAIR LABOUR', a + 12], ['TESTING & QC', a + 18]] as const;
  const total = pop(f, fx, { damping: 10, stiffness: 220, mass: 0.6 });
  const wr = f * 6;
  return (
    <Zone y={1385}><Slide inn={inn} out={out} tilt={-4}>
      <div style={{ width: 760, padding: '26px 40px 30px', background: '#f6f3ea', borderRadius: '18px 18px 6px 6px', boxShadow: '0 30px 70px rgba(0,0,0,0.55)', position: 'relative', fontFamily: FONT, color: '#1a1a1a' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: 30, letterSpacing: '0.24em' }}>REPAIR BILL</div>
          <svg width={58} height={58} viewBox="0 0 60 60" style={{ transform: `rotate(${wr}deg)` }}><path d="M38 8 a14 14 0 0 0 -16 18 L8 40 a6 6 0 0 0 8 8 L30 34 a14 14 0 0 0 18 -16 l-8 8 l-8 -2 l-2 -8 Z" fill={BRAND.red} /></svg>
        </div>
        <div style={{ height: 2, background: 'repeating-linear-gradient(90deg,#999 0 10px,transparent 10px 18px)', margin: '12px 0 8px' }} />
        {rows.map(([t, at]) => { const p = ease(f, at, at + 6); return (
          <div key={t} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 30, margin: '8px 0', opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}><span>{t}</span><span>₹0</span></div>); })}
        <div style={{ height: 2, background: '#1a1a1a', margin: '10px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: 52 }}>
          <span>TOTAL</span>
          <span style={{ color: '#0f7a37', transform: `scale(${interpolate(total, [0, 1], [1.8, 1])})`, opacity: clamp(total * 2), display: 'inline-block' }}>₹0 ✓</span>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: -14, height: 16, background: 'linear-gradient(135deg, #f6f3ea 33%, transparent 33%) 0 0 / 22px 16px, linear-gradient(225deg, #f6f3ea 33%, transparent 33%) 0 0 / 22px 16px' }} />
      </div>
    </Slide></Zone>
  );
};

// ================================================================================ 9. website
const WebPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('crazyrc') - 6, b = end(9); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const cursor = ease(f, a + 8, cue('price'));
  const hl = ease(f, cue('price'), cue('price') + 6);
  const click = f - cue('price'); const ring = click >= 0 && click < 14 ? click / 14 : -1;
  return (
    <Zone y={1400}><Slide inn={inn} out={out} tilt={4}>
      <div style={{ width: 960, height: 380, background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.45)', position: 'relative' }}>
        <div style={{ height: 56, background: '#ececec', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ marginLeft: 16, flex: 1, height: 34, borderRadius: 17, background: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 18, fontFamily: FONT, fontSize: 22, color: '#444', fontWeight: 600 }}>🔒 crazyrc.in/products/jjrc-c8819-4wd-off-road-rc-car</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 26px', gap: 18 }}>
          <Img src={staticFile('img/grey.png')} style={{ width: 400 }} />
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: '#222', lineHeight: 1.15 }}>JJRC C8819 4WD<br />Off Road RC Car</div>
            <div style={{ display: 'inline-flex', marginTop: 8, background: '#e7f6ec', color: '#0f7a37', fontFamily: FONT, fontWeight: 700, fontSize: 20, padding: '6px 14px', borderRadius: 20 }}>● IN STOCK</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 6 }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, color: '#222', padding: '0 8px', background: `rgba(255,214,0,${0.55 * hl})`, borderRadius: 8 }}>Rs. 7,499</div>
              <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 26, color: '#999', textDecoration: 'line-through' }}>Rs. 9,999</div>
            </div>
          </div>
        </div>
      </div>
      <svg width={60} height={60} style={{ position: 'absolute', left: 800 - cursor * 120, top: 460 - cursor * 130 }}><path d="M8 4 L8 46 L20 34 L30 54 L38 50 L28 30 L44 30 Z" fill="#fff" stroke="#111" strokeWidth={3} /></svg>
      {ring >= 0 && <div style={{ position: 'absolute', left: 688 - ring * 40, top: 338 - ring * 40, width: 20 + ring * 80, height: 20 + ring * 80, borderRadius: '50%', border: '4px solid #111', opacity: 1 - ring }} />}
    </Slide></Zone>
  );
};

// ================================================================================ 10. Diwali offer
const Fireworks: React.FC<{ f: number; a: number; b: number }> = ({ f, a, b }) => {
  if (f < a || f >= b) return null;
  const bursts = [[0, 240, 360], [8, 860, 300], [16, 520, 170], [26, 180, 560], [34, 900, 620], [46, 560, 420], [58, 300, 250], [70, 820, 480], [80, 520, 640]];
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
      <svg width={1080} height={1920}>
        {bursts.map(([d, x, y], k) => {
          const l = f - a - d; if (l < 0 || l > 30) return null;
          const r = 170 * (1 - Math.pow(1 - l / 30, 3)); const o = 1 - l / 30;
          return <g key={k}>{Array.from({ length: 24 }, (_, i) => {
            const ang = (i / 24) * Math.PI * 2 + k; const rr = r * (0.75 + random(`f${k}${i}`) * 0.35);
            return <circle key={i} cx={x + Math.cos(ang) * rr} cy={y + Math.sin(ang) * rr + l * l * 0.06} r={4.5 * o + 1} fill={[BRAND.gold, '#ff7a2a', '#fff3c4', BRAND.hot][i % 4]} opacity={o} />;
          })}</g>;
        })}
      </svg>
    </AbsoluteFill>
  );
};
const Diya: React.FC<{ f: number }> = ({ f }) => (
  <svg width={70} height={70} viewBox="0 0 70 70"><path d="M8 40 Q35 66 62 40 Z" fill="#c8641a" /><path d="M35 8 C44 22 42 34 35 38 C28 34 26 22 35 8Z" fill="#ffc23a" transform={`rotate(${Math.sin(f / 3) * 6} 35 38)`} style={{ filter: 'drop-shadow(0 0 10px #ffb000)' }} /></svg>
);
const OfferPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('diwali') - 4, b = end(10); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const reveal = cue('offer');
  const k = ease(f, reveal - 8, reveal + 8, 0, 1, Easing.inOut(Easing.cubic));
  const price = Math.round(7499 - k * 999);
  const strike = ease(f, cue('yours'), cue('yours') + 8);
  const big = pop(f, reveal);
  const tag = pop(f, reveal + 6, { damping: 9, stiffness: 220, mass: 0.6 });
  const shimmer = interpolate(f, [a, b], [-50, 150]);
  return (
    <>
      <Fireworks f={f} a={a} b={b + 10} />
      <Zone y={1380}><Slide inn={inn} out={out}>
        <Glass accent={BRAND.gold} style={{ width: 960, height: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 26px 6px 14px', borderRadius: 10, background: `linear-gradient(100deg, ${BRAND.gold} ${shimmer - 30}%, #fff1c2 ${shimmer}%, ${BRAND.gold} ${shimmer + 30}%)` }}>
            <Diya f={f} /><div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 32, letterSpacing: '0.24em', color: '#1a1206' }}>DIWALI OFFER</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 30, marginTop: 14 }}>
            <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 58, color: 'rgba(255,255,255,0.55)' }}>₹7,499
              <div style={{ position: 'absolute', left: -4, top: '52%', height: 6, width: `${strike * 104}%`, background: BRAND.hot, transform: 'rotate(-6deg)' }} /></div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 156, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', transform: `scale(${1 + 0.12 * Math.max(0, big) * Math.exp(-Math.max(0, f - reveal) / 6)})`, textShadow: `0 0 ${34 * k}px rgba(255,194,58,0.65)` }}>₹{price.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ position: 'absolute', right: -20, top: -50, transform: `rotate(10deg) scale(${interpolate(tag, [0, 1], [2.2, 1])})`, opacity: clamp(tag * 2), background: BRAND.red, border: `5px solid ${BRAND.gold}`, borderRadius: 18, padding: '10px 22px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: '#fff', lineHeight: 1, letterSpacing: '0.08em' }}>DIWALI</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 40, color: BRAND.gold, letterSpacing: '0.18em', textAlign: 'center' }}>DEAL</div>
          </div>
          <Sheen f={f} a={reveal + 2} />
        </Glass>
      </Slide></Zone>
    </>
  );
};

// ================================================================================ 11. CTA
const CTA: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[11].from + 2, b = end(11) + 4; const { inn, on } = life(f, a, b); if (!on) return null;
  const tap = cue('url'); const tl = f - tap; const press = tl >= 0 && tl < 8 ? Math.sin((tl / 8) * Math.PI) : 0;
  const bob = Math.sin(f / 4) * 10;
  return (
    <Zone y={1450}><div style={{ transform: `translateY(${(1 - inn) * 220}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      <div style={{ position: 'relative', transform: `scale(${1 - press * 0.06})` }}>
        <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', gap: 22, background: `linear-gradient(180deg, ${BRAND.hot}, ${BRAND.red})`, borderRadius: 26, padding: '26px 56px', boxShadow: `0 20px 50px rgba(219,0,0,${0.45 + press * 0.3})` }}>
          <Label size={58} ls={0.06}>BUY NOW</Label><div style={{ width: 4, height: 54, background: 'rgba(255,255,255,0.5)' }} /><Label size={46} ls={0.08}>CRAZYRC.IN</Label>
          <Sheen f={f} a={a + 6} dur={18} />
        </div>
        {tl >= 0 && tl < 18 && <div style={{ position: 'absolute', left: '72%', top: '60%', width: 30 + tl * 14, height: 30 + tl * 14, marginLeft: -(15 + tl * 7), marginTop: -(15 + tl * 7), borderRadius: '50%', border: '5px solid #fff', opacity: 1 - tl / 18 }} />}
        <svg width={70} height={70} style={{ position: 'absolute', left: '74%', top: 96 + bob }}><path d="M35 62 L35 14 M18 30 L35 12 L52 30" stroke="#fff" strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
      <Label size={26} ls={0.3} color="rgba(255,255,255,0.8)" style={{ marginTop: 60 }}>LINK IN BIO · ORDER ON WHATSAPP</Label>
    </div></Zone>
  );
};

export const Panels: React.FC = () => {
  const f = useCurrentFrame();
  const off = cue('offroad');
  return (
    <AbsoluteFill>
      <HookKinetic f={f} />
      <SpeedLines a={cue('speed') - 2} b={end(2) - 4} cy={640} strength={0.8} />
      <Cutaway f={f} a={SEGS[3].from + 4} b={end(3)} img="cine.jpg" kicker="MADE ONLY FOR" lines={['OFF-ROAD', 'ADVENTURE']} at={[off - 2, cue('adventure') - 2]} />
      <HeroPlate f={f} /><SpeedPanel f={f} /><SuspensionPanel f={f} /><TyrePanel f={f} />
      <Crack f={f} t0={cue('damage') + 2} /><CarePanel f={f} /><Receipt f={f} /><WebPanel f={f} /><OfferPanel f={f} /><CTA f={f} />
      <LightLeak at={SEGS[1].from - 4} hue="red" /><LightLeak at={SEGS[3].from} dir={-1} /><LightLeak at={cue('months') - 4} hue="red" />
      <LightLeak at={cue('diwali') - 6} hue="gold" /><LightLeak at={cue('offer') - 2} hue="gold" dir={-1} />
      <Flash at={cue('speed')} max={0.35} /><Flash at={cue('free')} color="#ff2a2a" max={0.25} /><Flash at={cue('offer')} max={0.4} />
    </AbsoluteFill>
  );
};
