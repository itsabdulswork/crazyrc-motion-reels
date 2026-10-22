import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { SEGS, at, BRAND } from './timeline';
import { FONT, Glass, Label, pop, ease, clamp, IconWheel, IconTrigger, IconGauge, IconSpring, IconAxle, IconBulb, IconShield } from './ui';

const end = (i: number) => SEGS[i].from + SEGS[i].dur;
/** enter/exit envelope for a panel living in [a, b) */
const life = (f: number, a: number, b: number) => {
  const inn = pop(f, a, { damping: 14, stiffness: 170, mass: 0.7 });
  const out = interpolate(f, [b - 6, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  return { inn, out, on: f >= a && f < b };
};
const Zone: React.FC<{ children: React.ReactNode; y?: number }> = ({ children, y = 1440 }) => (
  <AbsoluteFill style={{ top: y, height: 1920 - y, alignItems: 'center', justifyContent: 'flex-start' }}>{children}</AbsoluteFill>
);

const Tile: React.FC<{ f: number; a: number; b: number; icon: React.ReactNode; l1: string; l2: string; w?: number }> = ({ f, a, b, icon, l1, l2, w = 300 }) => {
  const { inn, out, on } = life(f, a, b); if (!on) return <div style={{ width: w }} />;
  return (
    <div style={{ transform: `translateY(${(1 - inn) * 140 + out * 160}px) scale(${0.85 + 0.15 * inn})`, opacity: clamp(inn * 1.4) * (1 - out) }}>
      <Glass style={{ width: w, height: 330, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
        {icon}
        <div style={{ textAlign: 'center' }}><Label size={30} ls={0.06}>{l1}</Label><Label size={30} ls={0.06} color={BRAND.hot}>{l2}</Label></div>
      </Glass>
    </div>
  );
};

// -------------------------------------------------------------------------------- per-beat panels
const ScalePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = at(1, 0.06), b = end(1); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const car = ease(f, a + 2, a + 16, 0, 1, Easing.out(Easing.exp));
  return (
    <Zone><div style={{ transform: `translateY(${(1 - inn) * 200 + out * 200}px)`, opacity: 1 - out }}>
      <Glass style={{ width: 960, height: 330, display: 'flex', alignItems: 'center' }}>
        <Img src={staticFile('img/orange.png')} style={{ width: 470, marginLeft: 30, transform: `translateX(${(1 - car) * -500}px) rotate(${(1 - car) * -6}deg)` }} />
        <div style={{ marginLeft: 26 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, color: BRAND.hot, lineHeight: 0.9 }}>1:18</div>
          <Label size={34} ls={0.22}>SCALE</Label>
          <Label size={26} ls={0.16} color="rgba(255,255,255,0.65)" style={{ marginTop: 10 }}>4WD ROCK CRAWLER</Label>
        </div>
      </Glass>
    </div></Zone>
  );
};

const ControlPanel: React.FC<{ f: number }> = ({ f }) => {
  const b = end(2);
  const lvl = interpolate(f, [at(2, 0.66), at(2, 0.74), at(2, 0.8), at(2, 0.86), at(2, 0.9)], [0, 0.5, 0.5, 1, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Zone><div style={{ display: 'flex', gap: 30 }}>
      <Tile f={f} a={at(2, 0.04)} b={b} icon={<IconTrigger pull={(Math.sin(f / 4) + 1) / 2} />} l1="PROPORTIONAL" l2="THROTTLE" />
      <Tile f={f} a={at(2, 0.3)} b={b} icon={<IconWheel rot={Math.sin(f / 7) * 35} />} l1="PROPORTIONAL" l2="STEERING" />
      <Tile f={f} a={at(2, 0.62)} b={b} icon={<IconGauge level={lvl} />} l1="3 SPEED" l2="MODES" />
    </div></Zone>
  );
};

const LightsPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = at(3, 0.02), b = end(3); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const glow = (Math.sin((f - a) / 2.5) + 1) / 2;
  return (
    <>
      <AbsoluteFill style={{ background: `linear-gradient(105deg, transparent ${interpolate(f, [a, b], [-40, 120])}%, rgba(255,214,140,0.35) ${interpolate(f, [a, b], [-30, 130])}%, transparent ${interpolate(f, [a, b], [-20, 140])}%)`, mixBlendMode: 'screen' }} />
      <Zone><div style={{ transform: `translateY(${(1 - inn) * 200 + out * 200}px)`, opacity: 1 - out }}>
        <Glass accent={BRAND.gold} style={{ width: 960, height: 300, display: 'flex', alignItems: 'center', gap: 34, paddingLeft: 60 }}>
          <IconBulb glow={glow} size={170} />
          <div><Label size={34} ls={0.2} color="rgba(255,255,255,0.7)">MULTIPLE</Label><Label size={92} ls={0.02}>LED LIGHTS</Label></div>
        </Glass>
      </div></Zone>
    </>
  );
};

const ChassisPanel: React.FC<{ f: number }> = ({ f }) => {
  const b = end(4);
  return (
    <Zone><div style={{ display: 'flex', gap: 30 }}>
      <Tile w={465} f={f} a={at(4, 0.05)} b={b} icon={<IconSpring squash={(Math.sin(f / 3.2) + 1) / 2} size={140} />} l1="4 INDEPENDENT" l2="SUSPENSION" />
      <Tile w={465} f={f} a={at(4, 0.62)} b={b} icon={<IconAxle spin={f * 14} size={140} />} l1="SOLID AXLE" l2="UNDERNEATH" />
    </div></Zone>
  );
};

const Cutaway: React.FC<{ f: number }> = ({ f }) => {
  const a = at(5, 0.1), b = at(5, 0.66); if (f < a || f >= b) return null;
  const inn = ease(f, a, a + 6, 0, 1, Easing.out(Easing.exp)); const out = ease(f, b - 6, b, 0, 1, Easing.in(Easing.exp));
  const kb = interpolate(f, [a, b], [1.0, 1.12]);
  const tag = pop(f, a + 6);
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - inn) * 50}% 0 ${(1 - inn) * 50 + out * 100}% 0)` }}>
      <Img src={staticFile('img/lifestyle.jpg')} style={{ position: 'absolute', height: 1920 * 1.22, left: '50%', bottom: 0, transform: `translateX(-58%) scale(${kb})`, transformOrigin: '60% 80%', filter: 'contrast(1.08) saturate(1.15)' }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.5) 100%)' }} />
      <div style={{ position: 'absolute', top: 200, left: 70, transform: `translateX(${(1 - tag) * -300}px)` }}>
        <Label size={34} ls={0.3} color={BRAND.gold}>BUILT FOR</Label>
        <Label size={120} ls={0}>OFF-ROAD</Label>
      </div>
    </AbsoluteFill>
  );
};

const Crack: React.FC<{ f: number }> = ({ f }) => {
  const t0 = at(6, 0.78); const l = f - t0; if (l < 0 || l > 16) return null;
  const grow = ease(l, 0, 4); const fade = 1 - ease(l, 8, 16);
  const cx = 600, cy = 700;
  const lines = Array.from({ length: 11 }, (_, i) => {
    const a = (i / 11) * Math.PI * 2 + random(`c${i}`) * 0.5; const L = 300 + random(`l${i}`) * 500;
    let d = `M${cx} ${cy}`; let x = cx, y = cy;
    for (let k = 1; k <= 4; k++) { x = cx + Math.cos(a + (random(`j${i}${k}`) - 0.5) * 0.5) * L * (k / 4) * grow; y = cy + Math.sin(a + (random(`k${i}${k}`) - 0.5) * 0.5) * L * (k / 4) * grow; d += ` L${x} ${y}`; }
    return d;
  });
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1080} height={1920}>{lines.map((d, i) => <path key={i} d={d} stroke="#fff" strokeWidth={4 - (i % 3)} fill="none" opacity={0.85} />)}
        <circle cx={cx} cy={cy} r={18 * grow} fill="#fff" opacity={0.8} /></svg>
      <AbsoluteFill style={{ background: 'rgba(255,40,30,0.18)', opacity: 1 - ease(l, 0, 6) }} />
    </AbsoluteFill>
  );
};

const CarePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = at(7, 0.03), b = end(8); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const draw = ease(f, a, a + 18);
  const second = f >= SEGS[8].from;
  const sw = pop(f, SEGS[8].from + 2);
  return (
    <Zone y={1420}><div style={{ transform: `translateY(${(1 - inn) * 220 + out * 220}px)`, opacity: 1 - out }}>
      <Glass style={{ width: 960, height: 350, display: 'flex', alignItems: 'center', gap: 26, paddingLeft: 50 }}>
        <IconShield size={210} draw={draw} />
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 124, lineHeight: 0.9, color: '#fff' }}>6 <span style={{ fontSize: 64 }}>MONTHS</span></div>
          <Label size={62} ls={0.02} color={BRAND.hot}>FREE REPAIRS</Label>
          <div style={{ marginTop: 14, height: 40, position: 'relative' }}>
            <Label size={22} ls={0.14} color="rgba(255,255,255,0.7)" style={{ position: 'absolute', whiteSpace: 'nowrap', opacity: second ? 1 - sw : 1 }}>ON EVERY RC · LABOUR ON US</Label>
            {second && <Label size={22} ls={0.14} color={BRAND.gold} style={{ position: 'absolute', whiteSpace: 'nowrap', opacity: sw, transform: `translateY(${(1 - sw) * 20}px)` }}>INDIA'S FIRST RC CARE PLAN</Label>}
          </div>
        </div>
      </Glass>
    </div></Zone>
  );
};

const WebPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = at(9, 0.05), b = end(9); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const cursor = ease(f, a + 10, a + 30);
  return (
    <Zone y={1420}><div style={{ transform: `translateY(${(1 - inn) * 220 + out * 220}px) rotate(${(1 - inn) * 4}deg)`, opacity: 1 - out }}>
      <div style={{ width: 960, height: 360, background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.45)' }}>
        <div style={{ height: 56, background: '#ececec', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ marginLeft: 16, flex: 1, height: 34, borderRadius: 17, background: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 18, fontFamily: FONT, fontSize: 22, color: '#444', fontWeight: 600 }}>🔒 crazyrc.in/products/jjrc-c8801</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 30px', gap: 24 }}>
          <Img src={staticFile('img/orange.png')} style={{ width: 380 }} />
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: '#222', lineHeight: 1.15 }}>JJRC C8801 1:18 4WD<br />Off-Road Climbing RC Car</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 10, background: '#e7f6ec', color: '#0f7a37', fontFamily: FONT, fontWeight: 700, fontSize: 20, padding: '6px 14px', borderRadius: 20 }}>● IN STOCK</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, color: '#222', marginTop: 8 }}>Rs. 14,999</div>
          </div>
        </div>
      </div>
      <svg width={60} height={60} style={{ position: 'absolute', left: 700 - cursor * 40, top: 420 - cursor * 140 }}><path d="M8 4 L8 46 L20 34 L30 54 L38 50 L28 30 L44 30 Z" fill="#fff" stroke="#111" strokeWidth={3} /></svg>
    </div></Zone>
  );
};

const Fireworks: React.FC<{ f: number; a: number; b: number }> = ({ f, a, b }) => {
  if (f < a || f >= b) return null;
  const bursts = [[0, 240, 360], [9, 860, 300], [18, 520, 180], [28, 180, 560], [36, 900, 620], [48, 560, 420], [60, 300, 260], [72, 820, 480]];
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
      <svg width={1080} height={1920}>
        {bursts.map(([d, x, y], k) => {
          const l = f - a - d; if (l < 0 || l > 30) return null;
          const r = 160 * (1 - Math.pow(1 - l / 30, 3)); const o = 1 - l / 30;
          return <g key={k}>{Array.from({ length: 22 }, (_, i) => {
            const ang = (i / 22) * Math.PI * 2 + k; const rr = r * (0.75 + random(`f${k}${i}`) * 0.35);
            const c = [BRAND.gold, '#ff7a2a', '#fff3c4', BRAND.hot][i % 4];
            return <circle key={i} cx={x + Math.cos(ang) * rr} cy={y + Math.sin(ang) * rr + l * l * 0.06} r={4.5 * o + 1} fill={c} opacity={o} />;
          })}</g>;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const OfferPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = at(10, 0.04), b = end(10); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const reveal = at(10, 0.72);
  const k = ease(f, reveal - 8, reveal + 8, 0, 1, Easing.inOut(Easing.cubic));
  const price = Math.round((14999 - k * 2499) / 1);
  const strike = ease(f, at(10, 0.18), at(10, 0.28));
  const big = pop(f, reveal);
  return (
    <>
      <Fireworks f={f} a={a} b={b} />
      <Zone y={1400}><div style={{ transform: `translateY(${(1 - inn) * 220 + out * 220}px)`, opacity: 1 - out }}>
        <Glass accent={BRAND.gold} style={{ width: 960, height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: '0.24em', color: '#1a1206', background: `linear-gradient(90deg, ${BRAND.gold}, #ffe39a, ${BRAND.gold})`, padding: '8px 26px', borderRadius: 8 }}>🪔 DIWALI & DUSSEHRA OFFER</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 30, marginTop: 18 }}>
            <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 58, color: 'rgba(255,255,255,0.55)' }}>₹14,999
              <div style={{ position: 'absolute', left: -4, top: '52%', height: 6, width: `${strike * 104}%`, background: BRAND.hot, transform: 'rotate(-6deg)' }} /></div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, color: '#fff', lineHeight: 1, transform: `scale(${1 + 0.12 * Math.max(0, big) * Math.exp(-Math.max(0, f - reveal) / 6)})`, textShadow: `0 0 ${30 * k}px rgba(255,194,58,0.6)` }}>₹{price.toLocaleString('en-IN')}</div>
          </div>
        </Glass>
      </div></Zone>
    </>
  );
};

const Stamp: React.FC<{ f: number }> = ({ f }) => {
  const a = at(11, 0.2), b = end(11); if (f < a || f >= b) return null;
  const s = pop(f, a, { damping: 9, stiffness: 220, mass: 0.6 });
  const out = ease(f, b - 6, b);
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 380 }}>
      <div style={{ transform: `rotate(-9deg) scale(${interpolate(s, [0, 1], [2.6, 1]) * (1 - out * 0.3)})`, opacity: clamp(s * 2) * (1 - out), border: `10px solid ${BRAND.gold}`, borderRadius: 26, padding: '14px 40px', background: 'rgba(160,0,0,0.88)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, color: '#fff', lineHeight: 0.95, textAlign: 'center' }}>₹2,500</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 92, color: BRAND.gold, letterSpacing: '0.3em', textAlign: 'center', paddingLeft: '0.3em' }}>OFF</div>
      </div>
    </AbsoluteFill>
  );
};

const CTA: React.FC<{ f: number }> = ({ f }) => {
  const a = at(12, 0.08), b = end(12) + 4; const { inn, on } = life(f, a, b); if (!on) return null;
  const tap = at(12, 0.62); const tl = f - tap; const press = tl >= 0 && tl < 8 ? Math.sin((tl / 8) * Math.PI) : 0;
  return (
    <Zone y={1450}><div style={{ transform: `translateY(${(1 - inn) * 220}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22 }}>
      <div style={{ position: 'relative', transform: `scale(${1 - press * 0.06})` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, background: BRAND.red, borderRadius: 26, padding: '26px 56px', boxShadow: `0 20px 50px rgba(219,0,0,${0.45 + press * 0.3})` }}>
          <Label size={58} ls={0.06}>BUY NOW</Label><div style={{ width: 4, height: 54, background: 'rgba(255,255,255,0.5)' }} /><Label size={46} ls={0.08}>CRAZYRC.IN</Label>
        </div>
        {tl >= 0 && tl < 18 && <div style={{ position: 'absolute', left: '72%', top: '60%', width: 30 + tl * 14, height: 30 + tl * 14, marginLeft: -(15 + tl * 7), marginTop: -(15 + tl * 7), borderRadius: '50%', border: '5px solid #fff', opacity: 1 - tl / 18 }} />}
      </div>
      <Label size={26} ls={0.3} color="rgba(255,255,255,0.8)">LINK IN BIO · ORDER ON WHATSAPP</Label>
    </div></Zone>
  );
};

export const Panels: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Cutaway f={f} />
      <ScalePanel f={f} /><ControlPanel f={f} /><LightsPanel f={f} /><ChassisPanel f={f} />
      <Crack f={f} /><CarePanel f={f} /><WebPanel f={f} /><OfferPanel f={f} /><Stamp f={f} /><CTA f={f} />
    </AbsoluteFill>
  );
};
