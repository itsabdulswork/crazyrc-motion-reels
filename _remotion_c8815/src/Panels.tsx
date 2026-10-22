import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { SEGS, at, end, cue, BRAND } from './timeline';
import {
  FONT, Glass, Label, pop, ease, clamp, IconWheel, IconShield, IconShovel, IconBattery, IconWinch, IconTarp, IconUpgrade,
} from './ui';

/** enter/exit envelope for a panel living in [a, b) */
const life = (f: number, a: number, b: number) => {
  const inn = pop(f, a, { damping: 14, stiffness: 170, mass: 0.7 });
  const out = interpolate(f, [b - 6, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });
  return { inn, out, on: f >= a && f < b };
};
const Zone: React.FC<{ children: React.ReactNode; y?: number }> = ({ children, y = 1440 }) => (
  <AbsoluteFill style={{ top: y, height: 1920 - y, alignItems: 'center', justifyContent: 'flex-start' }}>{children}</AbsoluteFill>
);
const Slide: React.FC<{ inn: number; out: number; children: React.ReactNode; tilt?: number }> = ({ inn, out, children, tilt = 0 }) => (
  <div style={{ transform: `translateY(${(1 - inn) * 220 + out * 220}px) rotate(${(1 - inn) * tilt}deg)`, opacity: 1 - out }}>{children}</div>
);
const Tick: React.FC<{ on: number }> = ({ on }) => (
  <svg width={46} height={46} viewBox="0 0 46 46"><circle cx="23" cy="23" r="21" fill={on > 0.5 ? BRAND.hot : 'rgba(255,255,255,0.12)'} />
    <path d="M13 24 L20 31 L34 16" fill="none" stroke="#fff" strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="34" strokeDashoffset={34 * (1 - on)} /></svg>
);

// -------------------------------------------------------------------------------- hook B: model plate
const MilitaryPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('military') - 2, b = end(1); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const car = ease(f, a, a + 14, 0, 1, Easing.out(Easing.exp));
  return (
    <Zone y={1400}><Slide inn={inn} out={out}>
      <Glass accent={BRAND.olive} style={{ width: 960, height: 330, display: 'flex', alignItems: 'center' }}>
        <Img src={staticFile('img/willys.png')} style={{ width: 470, marginLeft: 26, transform: `translateX(${(1 - car) * -520}px)` }} />
        <div style={{ marginLeft: 20 }}>
          <Label size={30} ls={0.3} color="#b9c78f">WILLYS</Label>
          <Label size={78} ls={0} style={{ marginTop: 4 }}>MILITARY</Label>
          <Label size={78} ls={0} color={BRAND.hot}>TRUCK</Label>
          <Label size={22} ls={0.2} color="rgba(255,255,255,0.65)" style={{ marginTop: 8 }}>1:12 SCALE · 4WD · RTR</Label>
        </div>
      </Glass>
    </Slide></Zone>
  );
};

// -------------------------------------------------------------------------------- feature panels
const ShovelPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('shovel') - 3, b = end(2); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const ring = ((f - a) % 24) / 24;
  return (
    <Zone y={1400}><Slide inn={inn} out={out} tilt={3}>
      <Glass accent={BRAND.olive} style={{ width: 960, height: 340, display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'relative', width: 540, marginLeft: 16 }}>
          <Img src={staticFile('img/willys.png')} style={{ width: 540 }} />
          {/* the scale shovel strapped to the body side */}
          <div style={{ position: 'absolute', left: '64%', top: '61%', width: 70 + ring * 70, height: 70 + ring * 70, marginLeft: -(35 + ring * 35), marginTop: -(35 + ring * 35), borderRadius: '50%', border: `5px solid ${BRAND.hot}`, opacity: 1 - ring }} />
          <div style={{ position: 'absolute', left: '64%', top: '61%', width: 18, height: 18, marginLeft: -9, marginTop: -9, borderRadius: 9, background: BRAND.hot, boxShadow: '0 0 20px #ff2a2a' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <IconShovel size={120} dig={(Math.sin(f / 4) + 1) / 2} />
          <Label size={44} ls={0.04}>SCALE</Label><Label size={44} ls={0.04} color={BRAND.hot}>SHOVEL</Label>
        </div>
      </Glass>
    </Slide></Zone>
  );
};

const SteeringPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('steering') - 3, b = end(3); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const turn = Math.sin((f - a) / 5);
  return (
    <Zone y={1420}><Slide inn={inn} out={out}>
      <Glass style={{ width: 960, height: 300, display: 'flex', alignItems: 'center', gap: 30, paddingLeft: 50 }}>
        <IconWheel rot={turn * 70} size={170} />
        <svg width={120} height={170} viewBox="0 0 120 170"><g fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round">
          <path d="M20 85 H100" strokeDasharray="8 8" opacity={0.5} />
          <g transform={`rotate(${turn * 28} 60 85)`}><rect x="38" y="35" width="44" height="100" rx="12" fill="rgba(255,42,42,0.25)" stroke="#ff2a2a" /></g></g></svg>
        <div><Label size={30} ls={0.2} color="rgba(255,255,255,0.7)">WORKING</Label><Label size={64} ls={0}>STEERING</Label><Label size={64} ls={0} color={BRAND.hot}>WHEEL</Label></div>
      </Glass>
    </Slide></Zone>
  );
};

const Cutaway: React.FC<{ f: number; a: number; b: number; img: string; kicker: string; title: string; focus?: string; scale?: number; fit?: boolean }> = ({ f, a, b, img, kicker, title, focus = '50% 100%', scale = 1.22, fit = false }) => {
  if (f < a || f >= b) return null;
  const inn = ease(f, a, a + 6, 0, 1, Easing.out(Easing.exp)); const out = ease(f, b - 6, b, 0, 1, Easing.in(Easing.exp));
  const kb = interpolate(f, [a, b], [1.0, 1.1]);
  const tag = pop(f, a + 5);
  return (
    <AbsoluteFill style={{ clipPath: `inset(${(1 - inn) * 50}% 0 ${(1 - inn) * 50 + out * 100}% 0)` }}>
      {fit ? (<>
        <Img src={staticFile(`img/${img}`)} style={{ position: 'absolute', height: 1920, left: '50%', top: 0, transform: 'translateX(-50%) scale(1.15)', filter: 'blur(40px) brightness(0.55) saturate(1.2)' }} />
        <Img src={staticFile(`img/${img}`)} style={{ position: 'absolute', width: 1080 * 1.08, left: '50%', top: 160, transform: `translateX(-50%) scale(${kb})`, transformOrigin: focus, borderRadius: 30, boxShadow: '0 40px 80px rgba(0,0,0,0.6)', filter: 'contrast(1.08) saturate(1.12)' }} />
      </>) : (
        <Img src={staticFile(`img/${img}`)} style={{ position: 'absolute', height: 1920 * scale, left: '50%', bottom: 0, transform: `translateX(-50%) scale(${kb})`, transformOrigin: focus, filter: 'contrast(1.08) saturate(1.12)' }} />
      )}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 32%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.55) 100%)' }} />
      <div style={{ position: 'absolute', top: 200, left: 70, transform: `translateX(${(1 - tag) * -320}px)` }}>
        <Label size={34} ls={0.3} color={BRAND.gold}>{kicker}</Label>
        <Label size={112} ls={0}>{title}</Label>
      </div>
    </AbsoluteFill>
  );
};

const RuntimePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('runtime') - 2, b = end(4); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const lvl = ease(f, a + 2, a + 26, 0, 1, Easing.out(Easing.cubic));
  return (
    <Zone y={1420}><Slide inn={inn} out={out}>
      <Glass accent="#3ddc6a" style={{ width: 960, height: 300, display: 'flex', alignItems: 'center', gap: 34, paddingLeft: 56 }}>
        <IconBattery size={190} level={lvl} />
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 132, lineHeight: 0.9, color: '#fff' }}>15–25</div>
          <Label size={34} ls={0.2} color="#3ddc6a">MIN RUN TIME</Label>
        </div>
      </Glass>
    </Slide></Zone>
  );
};

const AdvantagePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('crazyrc') - 2, b = end(5); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const shine = interpolate(f, [a + 6, a + 30], [-30, 130], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <Zone y={1420}><Slide inn={inn} out={out}>
      <Glass style={{ width: 960, height: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Label size={28} ls={0.34} color="rgba(255,255,255,0.7)">THE</Label>
        <Img src={staticFile('img/logo.png')} style={{ width: 520, margin: '4px 0' }} />
        <Label size={28} ls={0.34} color={BRAND.gold}>ADVANTAGE</Label>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(110deg, transparent ${shine - 10}%, rgba(255,255,255,0.22) ${shine}%, transparent ${shine + 10}%)` }} />
      </Glass>
    </Slide></Zone>
  );
};

const UpgradePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('upgraded') - 2, b = cue('winch') - 2; const { inn, out, on } = life(f, a, b); if (!on) return null;
  const same = pop(f, a + 14);
  return (
    <Zone y={1420}><Slide inn={inn} out={out}>
      <Glass accent={BRAND.gold} style={{ width: 960, height: 300, display: 'flex', alignItems: 'center', gap: 26, paddingLeft: 50 }}>
        <IconUpgrade size={170} lift={(Math.sin(f / 4) + 1) / 2} />
        <div>
          <Label size={30} ls={0.24} color={BRAND.gold}>UPGRADED VERSION</Label>
          <Label size={76} ls={0}>SAME PRICE</Label>
          <div style={{ display: 'inline-block', marginTop: 8, transform: `scale(${same})`, transformOrigin: 'left center', fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: '0.2em', color: '#1a1206', background: BRAND.gold, padding: '6px 14px', borderRadius: 6 }}>ONLY AT CRAZYRC</div>
        </div>
      </Glass>
    </Slide></Zone>
  );
};

const Checklist: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('winch') - 2, b = end(7); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const rows = [
    { t: 'WORKING WINCH', at: cue('winch') + 2, icon: <IconWinch size={74} pull={(Math.sin(f / 5) + 1) / 2} />, hot: cue('working') },
    { t: 'TARPAULIN COVER', at: cue('tarpaulin'), icon: <IconTarp size={74} cover={ease(f, cue('tarpaulin'), cue('tarpaulin') + 14)} /> },
    { t: 'SCALE SHOVEL', at: cue('winch') + 8, icon: <IconShovel size={74} /> },
  ];
  return (
    <Zone y={1360}><Slide inn={inn} out={out}>
      <Glass accent={BRAND.olive} style={{ width: 960, height: 430, padding: '26px 40px 26px 56px' }}>
        <Label size={26} ls={0.34} color="#b9c78f">UPGRADED · IN THE BOX</Label>
        {rows.map((r, i) => {
          const p = pop(f, r.at - 4); const tick = ease(f, r.at, r.at + 8);
          const flash = r.hot ? Math.max(0, 1 - Math.abs(f - r.hot) / 10) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, marginTop: 18, opacity: clamp(p * 1.5), transform: `translateX(${(1 - p) * 80}px) scale(${1 + flash * 0.05})`, transformOrigin: 'left center' }}>
              <Tick on={tick} />{r.icon}<Label size={50} ls={0.02} color={flash > 0.3 ? BRAND.hot : '#fff'}>{r.t}</Label>
            </div>
          );
        })}
      </Glass>
    </Slide></Zone>
  );
};

const Crack: React.FC<{ f: number }> = ({ f }) => {
  const t0 = cue('damage') + 2; const l = f - t0; if (l < 0 || l > 16) return null;
  const grow = ease(l, 0, 4); const fade = 1 - ease(l, 8, 16);
  const cx = 560, cy = 760;
  const lines = Array.from({ length: 12 }, (_, i) => {
    const ang = (i / 12) * Math.PI * 2 + random(`c${i}`) * 0.5; const L = 300 + random(`l${i}`) * 520;
    let d = `M${cx} ${cy}`;
    for (let k = 1; k <= 4; k++) d += ` L${cx + Math.cos(ang + (random(`j${i}${k}`) - 0.5) * 0.5) * L * (k / 4) * grow} ${cy + Math.sin(ang + (random(`k${i}${k}`) - 0.5) * 0.5) * L * (k / 4) * grow}`;
    return d;
  });
  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1080} height={1920}>{lines.map((d, i) => <path key={i} d={d} stroke="#fff" strokeWidth={4 - (i % 3)} fill="none" opacity={0.85} />)}<circle cx={cx} cy={cy} r={18 * grow} fill="#fff" opacity={0.8} /></svg>
      <AbsoluteFill style={{ background: 'rgba(255,40,30,0.18)', opacity: 1 - ease(l, 0, 6) }} />
    </AbsoluteFill>
  );
};

const CarePanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('months') - 4, b = end(8); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const draw = ease(f, a, a + 18);
  return (
    <Zone y={1420}><Slide inn={inn} out={out}>
      <Glass style={{ width: 960, height: 350, display: 'flex', alignItems: 'center', gap: 26, paddingLeft: 50 }}>
        <IconShield size={210} draw={draw} />
        <div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 124, lineHeight: 0.9, color: '#fff' }}>6 <span style={{ fontSize: 64 }}>MONTHS</span></div>
          <Label size={62} ls={0.02} color={BRAND.hot}>FREE REPAIRS</Label>
          <Label size={22} ls={0.14} color={BRAND.gold} style={{ marginTop: 14, whiteSpace: 'nowrap' }}>INDIA'S FIRST RC CARE PLAN</Label>
        </div>
      </Glass>
    </Slide></Zone>
  );
};

const WebPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('website') - 3, b = end(9); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const cursor = ease(f, a + 8, cue('price'));
  const hl = ease(f, cue('price'), cue('price') + 6);
  return (
    <Zone y={1420}><Slide inn={inn} out={out} tilt={4}>
      <div style={{ width: 960, height: 360, background: '#fff', borderRadius: 28, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.45)', position: 'relative' }}>
        <div style={{ height: 56, background: '#ececec', display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px' }}>
          {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: c }} />)}
          <div style={{ marginLeft: 16, flex: 1, height: 34, borderRadius: 17, background: '#fff', display: 'flex', alignItems: 'center', paddingLeft: 18, fontFamily: FONT, fontSize: 22, color: '#444', fontWeight: 600 }}>🔒 crazyrc.in/products/jjrc-c8815-willys</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', padding: '14px 30px', gap: 22 }}>
          <Img src={staticFile('img/willys.png')} style={{ width: 390 }} />
          <div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, color: '#222', lineHeight: 1.15 }}>JJRC C8815 RTR Willys<br />Military Jeep RC Truck</div>
            <div style={{ display: 'inline-flex', marginTop: 10, background: '#e7f6ec', color: '#0f7a37', fontFamily: FONT, fontWeight: 700, fontSize: 20, padding: '6px 14px', borderRadius: 20 }}>● 4WD · OFF-ROAD CLIMBING</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 54, color: '#222', marginTop: 8, display: 'inline-block', padding: '0 8px', background: `rgba(255,214,0,${0.55 * hl})`, borderRadius: 8 }}>Rs. 8,999</div>
          </div>
        </div>
      </div>
      <svg width={60} height={60} style={{ position: 'absolute', left: 760 - cursor * 120, top: 430 - cursor * 120 }}><path d="M8 4 L8 46 L20 34 L30 54 L38 50 L28 30 L44 30 Z" fill="#fff" stroke="#111" strokeWidth={3} /></svg>
    </Slide></Zone>
  );
};

const Fireworks: React.FC<{ f: number; a: number; b: number }> = ({ f, a, b }) => {
  if (f < a || f >= b) return null;
  const bursts = [[0, 240, 360], [8, 860, 300], [16, 520, 170], [26, 180, 560], [34, 900, 620], [46, 560, 420], [58, 300, 250], [70, 820, 480], [82, 520, 640]];
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
      <svg width={1080} height={1920}>
        {bursts.map(([d, x, y], k) => {
          const l = f - a - d; if (l < 0 || l > 30) return null;
          const r = 160 * (1 - Math.pow(1 - l / 30, 3)); const o = 1 - l / 30;
          return <g key={k}>{Array.from({ length: 22 }, (_, i) => {
            const ang = (i / 22) * Math.PI * 2 + k; const rr = r * (0.75 + random(`f${k}${i}`) * 0.35);
            return <circle key={i} cx={x + Math.cos(ang) * rr} cy={y + Math.sin(ang) * rr + l * l * 0.06} r={4.5 * o + 1} fill={[BRAND.gold, '#ff7a2a', '#fff3c4', BRAND.hot][i % 4]} opacity={o} />;
          })}</g>;
        })}
      </svg>
    </AbsoluteFill>
  );
};

const OfferPanel: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('diwali') - 3, b = end(10); const { inn, out, on } = life(f, a, b); if (!on) return null;
  const reveal = cue('offer');
  const k = ease(f, reveal - 8, reveal + 8, 0, 1, Easing.inOut(Easing.cubic));
  const price = Math.round(8999 - k * 1000);
  const strike = ease(f, a + 10, a + 18);
  const big = pop(f, reveal);
  const sticker = pop(f, reveal + 6, { damping: 9, stiffness: 220, mass: 0.6 });
  return (
    <>
      <Fireworks f={f} a={a} b={b + 8} />
      <Zone y={1400}><Slide inn={inn} out={out}>
        <Glass accent={BRAND.gold} style={{ width: 960, height: 380, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, letterSpacing: '0.24em', color: '#1a1206', background: `linear-gradient(90deg, ${BRAND.gold}, #ffe39a, ${BRAND.gold})`, padding: '8px 26px', borderRadius: 8 }}>🪔 DIWALI OFFER</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 30, marginTop: 18 }}>
            <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 58, color: 'rgba(255,255,255,0.55)' }}>₹8,999
              <div style={{ position: 'absolute', left: -4, top: '52%', height: 6, width: `${strike * 104}%`, background: BRAND.hot, transform: 'rotate(-6deg)' }} /></div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, color: '#fff', lineHeight: 1, transform: `scale(${1 + 0.12 * Math.max(0, big) * Math.exp(-Math.max(0, f - reveal) / 6)})`, textShadow: `0 0 ${30 * k}px rgba(255,194,58,0.6)` }}>₹{price.toLocaleString('en-IN')}</div>
          </div>
          <div style={{ position: 'absolute', right: -18, top: -44, transform: `rotate(10deg) scale(${interpolate(sticker, [0, 1], [2.2, 1])})`, opacity: clamp(sticker * 2), background: BRAND.red, border: `5px solid ${BRAND.gold}`, borderRadius: 18, padding: '8px 20px', boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, color: '#fff', lineHeight: 1 }}>₹1,000</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: BRAND.gold, letterSpacing: '0.3em', textAlign: 'center' }}>OFF</div>
          </div>
        </Glass>
      </Slide></Zone>
    </>
  );
};

const CTA: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[11].from + 2, b = end(11) + 4; const { inn, on } = life(f, a, b); if (!on) return null;
  const tap = cue('url'); const tl = f - tap; const press = tl >= 0 && tl < 8 ? Math.sin((tl / 8) * Math.PI) : 0;
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
      <Cutaway f={f} a={at(4, 0.03)} b={cue('runtime') - 3} img="climb.jpg" kicker="4WD" title="BUILT TO CLIMB" focus="50% 50%" fit />
      <Cutaway f={f} a={cue('winch') - 2} b={cue('working') + 18} img="lights.jpg" kicker="UPGRADED" title="WORKING WINCH" focus="55% 95%" scale={1.38} />
      <MilitaryPanel f={f} /><ShovelPanel f={f} /><SteeringPanel f={f} /><RuntimePanel f={f} /><AdvantagePanel f={f} />
      <UpgradePanel f={f} /><Checklist f={f} /><Crack f={f} /><CarePanel f={f} /><WebPanel f={f} /><OfferPanel f={f} /><CTA f={f} />
    </AbsoluteFill>
  );
};
