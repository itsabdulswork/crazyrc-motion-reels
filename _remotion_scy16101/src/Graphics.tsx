import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing, random, spring } from 'remotion';
import { SEGS, end, cue, FPS, BRAND } from './timeline';
import { FONT, clamp, ease } from './ui';
import { INK, PAPER } from './Layout';

const RED = BRAND.red;
const sp = (f: number, at: number, cfg = { damping: 15, stiffness: 170, mass: 0.7 }) => spring({ frame: f - at, fps: FPS, config: cfg });
const live = (f: number, a: number, b: number) => f >= a && f < b;
const outAt = (f: number, b: number, d = 6) => interpolate(f, [b - d, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) });

/** text line that rises out of a mask */
const Reveal: React.FC<{ f: number; at: number; children: React.ReactNode; size: number; color?: string; ls?: number; weight?: number; style?: React.CSSProperties; out?: number }> = ({ f, at, children, size, color = INK, ls = -0.02, weight = 700, style, out }) => {
  const p = ease(f, at, at + 10, 0, 1, Easing.out(Easing.exp));
  const o = out !== undefined ? ease(f, out - 6, out, 0, 1, Easing.in(Easing.cubic)) : 0;
  return (
    <div style={{ overflow: 'hidden', paddingBottom: size * 0.06, ...style }}>
      <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, lineHeight: 0.95, letterSpacing: `${ls}em`, color, textTransform: 'uppercase', whiteSpace: 'nowrap', transform: `translateY(${(1 - p) * 105 - o * 105}%)` }}>{children}</div>
    </div>
  );
};
const Small: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = INK, style }) => (
  <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: '0.3em', color, textTransform: 'uppercase', ...style }}>{children}</div>
);
/** horizontal rule that draws itself */
const Rule: React.FC<{ f: number; at: number; w: number; color?: string; h?: number; style?: React.CSSProperties }> = ({ f, at, w, color = INK, h = 3, style }) => (
  <div style={{ width: w * ease(f, at, at + 14, 0, 1, Easing.inOut(Easing.cubic)), height: h, background: color, ...style }} />
);
const Tag: React.FC<{ children: React.ReactNode; bg?: string; p?: number; style?: React.CSSProperties }> = ({ children, bg = INK, p = 1, style }) => (
  <div style={{ display: 'inline-block', background: bg, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: '0.2em', padding: '8px 14px', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, ...style }}>{children}</div>
);
const Reg: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 26, o = 1 }) => (
  <svg width={s * 2} height={s * 2} style={{ position: 'absolute', left: x - s, top: y - s, opacity: o }}><g stroke={INK} strokeWidth={2}><line x1={0} y1={s} x2={s * 2} y2={s} /><line x1={s} y1={0} x2={s} y2={s * 2} /><circle cx={s} cy={s} r={s * 0.45} fill="none" /></g></svg>
);
const Badge: React.FC<{ f: number; text: string; size?: number; color?: string; fill?: string }> = ({ f, text, size = 230, color = INK, fill = 'transparent' }) => {
  const chars = text.split(''); const r = size / 2 - 22;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={size / 2 - 2} fill={fill} stroke={color} strokeWidth={2} />
      <g transform={`rotate(${f * 1.4} ${size / 2} ${size / 2})`}>
        {chars.map((c, i) => { const a = (i / chars.length) * 360; return <text key={i} x={size / 2} y={size / 2 - r} transform={`rotate(${a} ${size / 2} ${size / 2})`} textAnchor="middle" fontFamily="Bai Jamjuree" fontWeight={700} fontSize={19} fill={color}>{c}</text>; })}
      </g>
    </svg>
  );
};
const Odometer: React.FC<{ f: number; at: number; text: string; size: number; color?: string }> = ({ f, at, text, size, color = INK }) => (
  <div style={{ display: 'flex' }}>
    {text.split('').map((ch, i) => {
      const p = ease(f, at + i * 2, at + i * 2 + 14, 0, 1, Easing.out(Easing.cubic));
      const isDigit = /\d/.test(ch);
      const roll = isDigit ? Array.from({ length: 6 }, (_, k) => Math.floor(random(`${text}${i}${k}`) * 10)).concat([Number(ch)]) : [ch];
      const idx = (roll.length - 1) * p;
      return (
        <div key={i} style={{ height: size * 0.95, overflow: 'hidden', fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 0.95, color, letterSpacing: '-0.03em' }}>
          <div style={{ transform: `translateY(${-idx * size * 0.95}px)` }}>{roll.map((d, k) => <div key={k} style={{ height: size * 0.95 }}>{d}</div>)}</div>
        </div>
      );
    })}
  </div>
);
/** light paper card rising over full-screen video */
const Card: React.FC<{ f: number; a: number; b: number; h: number; children: React.ReactNode }> = ({ f, a, b, h, children }) => {
  const p = sp(f, a); const o = outAt(f, b);
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 1880 - h, height: h, background: PAPER, borderRadius: 30, boxShadow: '0 -10px 50px rgba(0,0,0,0.35), 0 0 0 3px #111113', transform: `translateY(${(1 - p) * (h + 80) + o * (h + 80)}px)`, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      {children}
    </div>
  );
};

// ================================================================================ 0. hook (full)
const G0: React.FC<{ f: number }> = ({ f }) => {
  const b = end(0); if (!live(f, 0, b)) return null;
  const fa = cue('fast'), j = cue('jump'); const o = outAt(f, b, 5);
  const bounce = f >= j ? Math.abs(Math.sin((f - j) / 4)) * 26 * Math.exp(-(f - j) / 14) : 0;
  return (
    <div style={{ position: 'absolute', left: 56, top: 1200, opacity: 1 - o }}>
      <Tag p={ease(f, 4, 12)} bg={RED}>IF YOU LOVE</Tag>
      <div style={{ marginTop: 10, display: 'inline-block', background: INK, padding: '6px 24px 10px', clipPath: `inset(0 ${(1 - ease(f, fa - 2, fa + 8, 0, 1, Easing.out(Easing.exp))) * 100}% 0 0)` }}>
        <Reveal f={f} at={fa} size={150} color="#fff">FAST RC</Reveal>
      </div>
      <div style={{ marginTop: 10, display: 'inline-block', background: '#fff', padding: '6px 24px 10px', transform: `translateY(${-bounce}px)`, clipPath: `inset(0 ${(1 - ease(f, j - 2, j + 8, 0, 1, Easing.out(Easing.exp))) * 100}% 0 0)` }}>
        <Reveal f={f} at={j} size={130}>&amp; BIG JUMPS?</Reveal>
      </div>
    </div>
  );
};

// ================================================================================ 2. model reveal (TOP)
const G2: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[2].from, b = end(2) + 2; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const s = cue('scy'), n = cue('num');
  return (
    <div style={{ position: 'absolute', left: 60, top: 1350, right: 60, opacity: 1 - o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Tag p={ease(f, s - 2, s + 6)}>SUCHIYU · SCY</Tag><Rule f={f} at={s} w={560} /></div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
        <Odometer f={f} at={n - 2} text="16101" size={215} />
        <div style={{ textAlign: 'right', marginBottom: 26 }}>
          {['MONSTER', 'TRUCK', '1:16 · 4WD'].map((t, i) => <Reveal key={t} f={f} at={n + 4 + i * 3} size={34} ls={0.08} color={i === 1 ? RED : INK}>{t}</Reveal>)}
        </div>
      </div>
      <Rule f={f} at={n + 6} w={960} color={RED} h={8} />
    </div>
  );
};

// ================================================================================ 3. top speed (circle) — truck in the air
const G3: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[3].from, b = end(3); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const fo = cue('forty'), t2 = cue('twos');
  const fill = ease(f, cue('speed'), cue('km') + 14, 0, 1, Easing.out(Easing.cubic));
  const air = ease(f, a + 4, a + 40, 0, 1, Easing.linear);
  const jy = -Math.sin(Math.min(1, air) * Math.PI) * 120; const jr = interpolate(air, [0, 0.5, 1], [-10, 4, 0]);
  const jx = interpolate(sp(f, a + 2, { damping: 16, stiffness: 110, mass: 0.8 }), [0, 1], [1200, 40]);
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <Small color={RED}>N°04 — TOP SPEED</Small>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 6 }}>
          <Odometer f={f} at={fo - 4} text="40" size={250} />
          <Reveal f={f} at={cue('km') - 2} size={66} color={RED} style={{ marginBottom: 30 }}>KM/H</Reveal>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 600, height: 620, overflow: 'hidden' }}>
        {Array.from({ length: 14 }, (_, i) => { const y = 60 + random(`ly${i}`) * 500; const w = 120 + random(`lw${i}`) * 380; const x = 1200 - ((f * (34 + random(`lv${i}`) * 30) + random(`lx${i}`) * 1600) % 1800); return <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: 4 + (i % 3) * 3, background: i % 4 ? INK : RED, opacity: 0.55 }} />; })}
        <div style={{ position: 'absolute', left: 140, right: 140, top: 560, height: 30, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.25), transparent 70%)', transform: `scaleX(${1 + jy / 300})` }} />
        <Img src={staticFile('img/purple.png')} style={{ position: 'absolute', left: jx, top: 120 + jy, width: 1000, transform: `rotate(${jr}deg)`, filter: 'drop-shadow(0 30px 24px rgba(0,0,0,0.28))' }} />
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1300 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>{[0, 10, 20, 30, 40].map(v => <div key={v} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, color: v <= fill * 40 ? RED : 'rgba(0,0,0,0.35)' }}>{v}</div>)}</div>
        <div style={{ height: 22, background: 'rgba(0,0,0,0.1)', marginTop: 8, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: `repeating-linear-gradient(90deg, ${RED} 0 22px, #a80000 22px 26px)` }} />
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 22 }}>
          <Tag p={ease(f, t2 - 2, t2 + 6)} bg={INK} style={{ fontSize: 30 }}>ON A 2S BATTERY</Tag>
          <Tag p={ease(f, t2 + 4, t2 + 12)} bg={RED} style={{ fontSize: 30 }}>390 MOTOR</Tag>
        </div>
      </div>
      <div style={{ position: 'absolute', right: 50, top: 1560, opacity: ease(f, a + 10, a + 18) }}><Badge f={f} text="· SCY 16101 · MONSTER TRUCK " /></div>
      <div style={{ position: 'absolute', left: 60, top: 1600 }}><Reveal f={f} at={t2 + 8} size={70}>BUILT TO</Reveal><Reveal f={f} at={t2 + 12} size={70} color={RED}>FLY.</Reveal></div>
    </AbsoluteFill>
  );
};

// ================================================================================ 4. independent suspension (split)
const Spring: React.FC<{ sq: number }> = ({ sq }) => {
  const h = 260 - sq * 70; const n = 9; let d = `M60 0 V20`;
  for (let i = 0; i < n; i++) { const y0 = 20 + (h / n) * i; d += ` L${i % 2 ? 18 : 102} ${y0 + h / n / 2} L60 ${y0 + h / n}`; }
  return (
    <svg width={120} height={330} viewBox="0 0 120 330">
      <rect x={42} y={0} width={36} height={20} fill={INK} />
      <path d={d} stroke={RED} strokeWidth={9} fill="none" strokeLinejoin="round" />
      <rect x={36} y={20 + h} width={48} height={330 - 20 - h} rx={8} fill={INK} />
      <rect x={54} y={20 + h - 30} width={12} height={40} fill="#9a9aa2" />
    </svg>
  );
};
const G4: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[4].from, b = end(4); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const ind = cue('indep'), su = cue('suspension');
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 580, top: 180, width: 460 }}>
        <Small color={RED}>N°05 — CHASSIS</Small>
        <Reveal f={f} at={ind - 3} size={62} style={{ marginTop: 16 }}>INDEPENDENT</Reveal>
        <Reveal f={f} at={su - 2} size={62} color={RED}>SUSPENSION</Reveal>
        <Rule f={f} at={su} w={440} style={{ margin: '16px 0' }} />
        <Reveal f={f} at={su + 6} size={24} ls={0.16}>OIL SPRINGS · WISHBONE</Reveal>
        <Reveal f={f} at={su + 10} size={24} ls={0.16} color={RED}>EVERY WHEEL MOVES ALONE</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1320, display: 'flex', justifyContent: 'space-between' }}>
        {['FL', 'FR', 'RL', 'RR'].map((t, i) => {
          const p = sp(f, ind + i * 3); const sq = f > su ? Math.max(0, Math.sin((f - su) / 3 + i * 1.7)) * Math.exp(-(f - su) / 40) : 0;
          return (
            <div key={t} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', transform: `translateY(${(1 - p) * 400}px)` }}>
              <Spring sq={sq} />
              <Tag style={{ marginTop: 10 }} bg={i % 2 ? RED : INK}>{t}</Tag>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 5. off-road tyres (bottom window, paper top)
const BigTyre: React.FC<{ rot: number; s?: number }> = ({ rot, s = 380 }) => (
  <svg width={s} height={s} viewBox="0 0 200 200"><g transform={`rotate(${rot} 100 100)`}>
    <circle cx="100" cy="100" r="96" fill={INK} />
    {Array.from({ length: 16 }, (_, i) => <path key={i} d="M86 2 L114 2 L110 24 L90 24 Z" fill="#3a3a40" transform={`rotate(${i * 22.5} 100 100)`} />)}
    {Array.from({ length: 16 }, (_, i) => <path key={i} d="M96 26 L110 26 L106 40 L98 40 Z" fill="#2a2a2e" transform={`rotate(${i * 22.5 + 11} 100 100)`} />)}
    <circle cx="100" cy="100" r="52" fill="#18181b" stroke="#3a3a40" strokeWidth={4} />
    {Array.from({ length: 6 }, (_, i) => <path key={i} d="M100 52 L108 90 L92 90 Z" fill="#2f2f34" transform={`rotate(${i * 60} 100 100)`} />)}
    <circle cx="100" cy="100" r="12" fill={RED} /></g></svg>
);
const G5: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[5].from, b = end(5); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const of = cue('offroad'), ty = cue('tyres');
  const roll = ease(f, a, a + 18, 0, 1, Easing.out(Easing.cubic));
  return (
    <div style={{ position: 'absolute', left: 40, right: 40, top: 160, height: 560, opacity: 1 - o }}>
      <svg width={1000} height={80} style={{ position: 'absolute', left: 0, top: 470 }}><path d={`M0 30 Q 250 ${10 + Math.sin(f / 5) * 6} 500 30 T 1000 30`} stroke="rgba(120,80,40,0.45)" strokeWidth={10} strokeDasharray="22 14" fill="none" /></svg>
      <div style={{ position: 'absolute', left: interpolate(roll, [0, 1], [-420, 20]), top: 80, transform: `rotate(${f * 6}deg)` }}><BigTyre rot={0} /></div>
      <div style={{ position: 'absolute', right: 20, top: 40, textAlign: 'right' }}>
        <Small color={RED}>N°06 — GRIP</Small>
        <Reveal f={f} at={of - 2} size={110} style={{ marginTop: 8 }}>OFF-ROAD</Reveal>
        <Reveal f={f} at={ty - 2} size={110} color={RED}>TYRES</Reveal>
        <div style={{ marginTop: 16 }}><Tag p={ease(f, ty + 6, ty + 14)}>BIG-FOOT GRIP</Tag></div>
      </div>
    </div>
  );
};

// ================================================================================ 6. 4WD card (full)
const G6: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[6].from + 6, b = end(6); if (!live(f, a, b)) return null;
  const w = cue('fourwd');
  const wheels = [[60, 40], [60, 260], [330, 40], [330, 260]];
  return (
    <Card f={f} a={a} b={b} h={420}>
      <svg width={430} height={340} style={{ position: 'absolute', left: 50, top: 40 }} viewBox="0 0 430 340">
        <rect x={110} y={70} width={210} height={200} rx={24} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="840" strokeDashoffset={840 * (1 - ease(f, a, a + 16))} />
        <line x1={95} y1={70} x2={95} y2={270} stroke={INK} strokeWidth={6} opacity={ease(f, a + 8, a + 14)} />
        <line x1={365} y1={70} x2={365} y2={270} stroke={INK} strokeWidth={6} opacity={ease(f, a + 8, a + 14)} />
        <line x1={95} y1={170} x2={365} y2={170} stroke={RED} strokeWidth={6} strokeDasharray="270" strokeDashoffset={270 * (1 - ease(f, w, w + 10))} />
        {wheels.map(([x, y], i) => { const on = ease(f, w + i * 3, w + i * 3 + 5); return <rect key={i} x={x} y={y} width={70} height={60} rx={14} fill={on > 0.5 ? RED : INK} transform={`translate(0 ${-8 * on})`} />; })}
      </svg>
      <div style={{ position: 'absolute', right: 50, top: 60, textAlign: 'right' }}>
        <Small color={RED}>N°07 — DRIVE</Small>
        <Reveal f={f} at={w - 3} size={200} style={{ marginTop: 6 }}>4WD</Reveal>
        <Reveal f={f} at={w + 4} size={34} ls={0.16}>FULL-TIME DRIVE</Reveal>
      </div>
    </Card>
  );
};

// ================================================================================ 7. brushed motor (TOP)
const Motor: React.FC<{ f: number; on: number }> = ({ f, on }) => (
  <svg width={420} height={300} viewBox="0 0 420 300">
    <rect x={30} y={60} width={290} height={180} rx={30} fill="#c9ccd2" stroke={INK} strokeWidth={6} />
    {Array.from({ length: 7 }, (_, i) => <line key={i} x1={70 + i * 36} y1={70} x2={70 + i * 36} y2={230} stroke="rgba(0,0,0,0.12)" strokeWidth={6} />)}
    <rect x={320} y={110} width={50} height={80} rx={10} fill={INK} />
    <rect x={370} y={140} width={46} height={20} fill="#9a9aa2" />
    <g transform={`translate(175 150) rotate(${f * 40 * on})`}>{[0, 1, 2].map(i => <rect key={i} x={-6} y={-70} width={12} height={140} fill={RED} transform={`rotate(${i * 60})`} />)}</g>
    <circle cx={175} cy={150} r={20} fill={INK} />
    {on > 0.5 && [0, 1, 2, 3].map(i => { const ang = (i / 4) * Math.PI * 2 + f; return <line key={i} x1={345 + Math.cos(ang) * 10} y1={150 + Math.sin(ang) * 10} x2={345 + Math.cos(ang) * 30} y2={150 + Math.sin(ang) * 30} stroke={BRAND.gold} strokeWidth={4} strokeLinecap="round" opacity={(f % 3) / 3} />; })}
    <path d="M60 240 V280 M100 240 V280" stroke={RED} strokeWidth={8} />
  </svg>
);
const G7: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[7].from, b = end(7) + 2; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const br = cue('brush');
  const on = ease(f, br - 2, br + 8);
  return (
    <div style={{ position: 'absolute', left: 40, top: 1330, width: 1000, height: 560, opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 0, top: 80, transform: `translateX(${(1 - sp(f, a + 2)) * -600}px)` }}><Motor f={f} on={on} /></div>
      <div style={{ position: 'absolute', right: 20, top: 40, textAlign: 'right' }}>
        <Small color={RED}>N°08 — POWER</Small>
        <Reveal f={f} at={a + 4} size={190} style={{ marginTop: 6 }}>390</Reveal>
        <Reveal f={f} at={br - 2} size={54} color={RED}>BRUSHED MOTOR</Reveal>
        <Reveal f={f} at={br + 6} size={24} ls={0.16}>CARBON BRUSH · STRONG MAGNET</Reveal>
      </div>
    </div>
  );
};

// ================================================================================ 8. proportional control (circle)
const G8: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[8].from, b = end(8); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const st = cue('steering'), th = cue('throttle'), cp = cue('compulsory');
  const steer = f >= st ? Math.sin((f - st) / 9) * 0.9 : 0;
  const thr = f >= th ? (Math.sin((f - th) / 11 - 1.4) + 1) / 2 : 0;
  const wp = sp(f, st - 4), tp = sp(f, th - 4);
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <Small color={RED}>N°09 — CONTROL</Small>
        <Reveal f={f} at={a + 2} size={84} color={RED} style={{ marginTop: 10 }}>PROPORTIONAL</Reveal>
        <Reveal f={f} at={th - 2} size={58}>STEERING + THROTTLE</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 640, width: 440, height: 700, border: `4px solid ${INK}`, background: '#fff', transform: `translateY(${(1 - wp) * 800}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={300} height={300} viewBox="0 0 120 120"><g transform={`rotate(${steer * 90} 60 60)`} fill="none" stroke={INK} strokeWidth={8} strokeLinecap="round"><circle cx="60" cy="60" r="48" /><circle cx="60" cy="60" r="10" fill={RED} stroke="none" /><path d="M12 60 H50 M70 60 H108 M60 70 V108" /></g></svg>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 64, color: INK, fontVariantNumeric: 'tabular-nums' }}>{steer < 0 ? 'L' : 'R'} {Math.round(Math.abs(steer) * 100)}%</div>
        <Small>STEERING</Small>
      </div>
      <div style={{ position: 'absolute', left: 580, top: 640, width: 440, height: 700, border: `4px solid ${INK}`, background: '#fff', transform: `translateY(${(1 - tp) * 800}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 120, height: 300, border: `6px solid ${INK}`, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 6, right: 6, bottom: 6, height: `${thr * 94}%`, background: `repeating-linear-gradient(0deg, ${RED} 0 18px, #a80000 18px 22px)` }} />
        </div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 64, color: INK, fontVariantNumeric: 'tabular-nums', marginTop: 14 }}>{Math.round(thr * 100)}%</div>
        <Small>THROTTLE</Small>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1400, display: 'flex', gap: 12 }}>
        <Tag p={ease(f, cp - 2, cp + 6)} bg={RED} style={{ fontSize: 30 }}>STANDARD ON THIS MODEL</Tag>
        <Tag p={ease(f, cp + 4, cp + 12)} style={{ fontSize: 30 }}>2.4GHZ · 80M</Tag>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1500 }}><Reveal f={f} at={cp + 6} size={64}>SMOOTH. PRECISE.</Reveal><Reveal f={f} at={cp + 10} size={64} color={RED}>EVERY TIME.</Reveal></div>
    </AbsoluteFill>
  );
};

// ================================================================================ 9. send it — hazard tapes (full, 2 segments)
const G9: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[9].from, b = end(10); if (!live(f, a, b)) return null;
  const o = outAt(f, b, 5);
  const tape = (dir: number, rot: number, top: number, at: number, text: string, red: boolean) => {
    const p = ease(f, at, at + 8, 0, 1, Easing.out(Easing.exp));
    return (
      <div style={{ position: 'absolute', left: -200, width: 1480, top, height: 104, transform: `rotate(${rot}deg) translateX(${(1 - p) * 1500 * dir}px)`, background: `repeating-linear-gradient(-45deg, ${BRAND.gold} 0 40px, ${INK} 40px 80px)`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: red ? RED : INK, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 54, letterSpacing: '0.14em', padding: '4px 30px' }}>{text}</div>
      </div>
    );
  };
  return <AbsoluteFill style={{ opacity: 1 - o }}>{tape(1, -6, 1480, cue('uchal') - 4, 'SEND IT.', false)}{tape(-1, 5, 1650, SEGS[10].from, 'BROKE IT? NO TENSION.', true)}</AbsoluteFill>;
};

// ================================================================================ 10. care plan (TOP, 2 segments)
const G10: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[11].from, b = end(12) + 2; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const m = cue('months'), fr = cue('free'), f2 = cue('free2');
  const st = sp(f, f2 - 2, { damping: 8, stiffness: 240, mass: 0.6 });
  return (
    <div style={{ position: 'absolute', left: 40, top: 1330, width: 1000, height: 560, opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 20, top: 26 }}>
        <Small color={RED}>N°11 — CRAZYRC CARE PLAN</Small>
        <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
          {Array.from({ length: 6 }, (_, i) => { const on = ease(f, m + i * 2, m + i * 2 + 5); const flip = interpolate(on, [0, 0.5, 1], [0, 90, 0]); return (
            <div key={i} style={{ width: 98, height: 118, border: `3px solid ${INK}`, background: on > 0.5 ? RED : PAPER, transform: `perspective(400px) rotateX(${flip}deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: '0.2em', color: on > 0.5 ? '#fff' : INK }}>MONTH</div>
              <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, lineHeight: 1, color: on > 0.5 ? '#fff' : INK }}>{i + 1}</div>
            </div>); })}
        </div>
        <Reveal f={f} at={fr - 3} size={124} style={{ marginTop: 18 }}>FREE REPAIR</Reveal>
        <Reveal f={f} at={fr + 2} size={30} ls={0.2} color={RED}>LABOUR ON US · INDIA'S FIRST RC CARE PLAN</Reveal>
      </div>
      {f >= f2 - 2 && (
        <div style={{ position: 'absolute', right: 10, top: 10, transform: `rotate(-12deg) scale(${interpolate(st, [0, 1], [2.6, 1])})`, opacity: clamp(st * 2), border: `8px solid ${RED}`, borderRadius: 20, padding: '6px 22px', background: PAPER }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: INK, letterSpacing: '0.2em', textAlign: 'center' }}>REPAIR BILL</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 92, color: RED, lineHeight: 1, textAlign: 'center' }}>₹0</div>
        </div>
      )}
    </div>
  );
};

// ================================================================================ 11. price tag + coupon (split)
const G11: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[13].from, b = end(13); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const p1 = cue('p1'), p2 = cue('p2'), cp = cue('coupon');
  const drop = sp(f, a + 2, { damping: 6, stiffness: 90, mass: 0.8 });
  const swing = Math.sin((f - a) / 7) * 8 * Math.exp(-(f - a) / 40) + Math.sin(f / 18) * 1.5;
  const strike = ease(f, p2 - 2, p2 + 6);
  const tk = sp(f, cp - 2, { damping: 13, stiffness: 140, mass: 0.7 });
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 800, top: 150, width: 4, height: 200 * drop, background: INK }} />
      <div style={{ position: 'absolute', left: 620, top: 150 + 200 * drop - 20, width: 360, transformOrigin: '182px 0', transform: `rotate(${swing}deg)` }}>
        <div style={{ position: 'relative', background: '#fff', border: `4px solid ${INK}`, clipPath: 'polygon(20% 0, 80% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)', padding: '70px 26px 30px', boxShadow: '0 30px 50px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', left: '50%', top: 22, width: 30, height: 30, marginLeft: -15, borderRadius: 15, border: `4px solid ${INK}` }} />
          <Small color={RED}>LISTED ON CRAZYRC</Small>
          <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 92, lineHeight: 1, color: INK, marginTop: 10, letterSpacing: '-0.03em', opacity: ease(f, p1 - 6, p1 + 2) }}>₹12,500
            <div style={{ position: 'absolute', left: -6, top: '52%', height: 8, width: `${strike * 106}%`, background: RED, transform: 'rotate(-6deg)' }} /></div>
          <div style={{ height: 3, background: INK, margin: '16px 0' }} />
          <Small style={{ fontSize: 18 }}>SCY 16101 · 1:16 4WD</Small>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1330, transform: `translateY(${(1 - tk) * 600}px) rotate(${(1 - tk) * -6}deg)` }}>
        <div style={{ display: 'flex', background: RED, color: '#fff', height: 300, position: 'relative', boxShadow: '0 30px 50px rgba(0,0,0,0.25)' }}>
          <div style={{ width: 260, borderRight: '6px dashed rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '0.24em' }}>COUPON</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 76, lineHeight: 1 }}>−₹1K</div>
          </div>
          <div style={{ flex: 1, padding: '34px 40px' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', opacity: 0.85 }}>WITH OUR COUPON</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 8, opacity: ease(f, p2 - 4, p2 + 2) }}>₹11,500</div>
          </div>
          {[-1, 1].map(s => <div key={s} style={{ position: 'absolute', left: 230, [s < 0 ? 'top' : 'bottom']: -30, width: 60, height: 60, borderRadius: 30, background: PAPER }} />)}
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}><Small>APPLY AT CHECKOUT</Small><Small color={RED}>CRAZYRC.IN</Small></div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 12. Diwali (circle, 2 segments)
const Diya: React.FC<{ f: number; s?: number }> = ({ f, s = 90 }) => (
  <svg width={s} height={s} viewBox="0 0 70 70"><path d="M8 40 Q35 66 62 40 Z" fill="#c8641a" /><path d="M35 8 C44 22 42 34 35 38 C28 34 26 22 35 8Z" fill="#ffc23a" transform={`rotate(${Math.sin(f / 3) * 6} 35 38)`} style={{ filter: 'drop-shadow(0 0 10px #ffb000)' }} /></svg>
);
const G12: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[14].from, b = end(15) + 4; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const of = cue('offer');
  const k = ease(f, of - 8, of + 10, 0, 1, Easing.inOut(Easing.cubic));
  const price = Math.round(11500 - 500 * k);
  const warm = ease(f, a, a + 12);
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 60% 30%, rgba(255,194,58,${0.35 * warm}), transparent 60%)` }} />
      {Array.from({ length: 26 }, (_, i) => { const x = random(`gx${i}`) * 1080; const y = (random(`gy${i}`) * 1920 + f * (2 + random(`gv${i}`) * 3)) % 1920; const r = 3 + random(`gr${i}`) * 6; return <div key={i} style={{ position: 'absolute', left: x, top: y, width: r, height: r, transform: 'rotate(45deg)', background: i % 3 ? BRAND.gold : RED, opacity: 0.8 * warm }} />; })}
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Diya f={f} s={70} /><Small color="#a06a00">N°13 — FESTIVE PRICE</Small></div>
        <Reveal f={f} at={cue('diwali') - 2} size={150} color={RED}>DIWALI</Reveal>
        <Reveal f={f} at={cue('offerw') - 2} size={70}>OFFER</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 600, display: 'flex', alignItems: 'baseline', gap: 26, opacity: ease(f, SEGS[15].from - 4, SEGS[15].from + 4) }}>
        <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 64, color: 'rgba(0,0,0,0.4)', opacity: ease(f, of - 2, of + 6), width: 270 * ease(f, of - 6, of + 4, 0, 1, Easing.inOut(Easing.cubic)), overflow: 'hidden', whiteSpace: 'nowrap' }}>₹11,500
          <div style={{ position: 'absolute', left: -4, top: '52%', height: 8, width: `${ease(f, of + 8, of + 16) * 104}%`, background: RED, transform: 'rotate(-6deg)' }} /></div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 176, color: INK, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: `scale(${1 + 0.1 * Math.exp(-Math.max(0, f - of) / 6) * (f >= of ? 1 : 0)})`, transformOrigin: 'left' }}>₹{price.toLocaleString('en-IN')}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 900, height: 700 }}>
        {['blue', 'purple'].map((c, i) => { const p = sp(f, a + 6 + i * 6); return <Img key={c} src={staticFile(`img/${c}.png`)} style={{ position: 'absolute', width: i ? 700 : 560, left: i ? 340 : 20, top: i ? 250 : 0, transform: `translateX(${(1 - p) * (i ? 1000 : -1000)}px)`, filter: 'drop-shadow(0 30px 24px rgba(0,0,0,0.25))', zIndex: i }} />; })}
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1680, display: 'flex', gap: 12 }}>
        {['BLUE', 'PURPLE'].map((t, i) => <Tag key={t} p={ease(f, a + 20 + i * 4, a + 28 + i * 4)} bg={i === 0 ? '#1e3a8a' : '#6b21a8'}>{t}</Tag>)}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 13. CTA
const G13: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('buy') - 2, b = end(16) + 4; if (!live(f, a, b)) return null;
  const u = cue('url'); const tl = f - u; const press = tl >= 0 && tl < 8 ? Math.sin((tl / 8) * Math.PI) : 0;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 1360 }}>
      <Small color={RED}>N°15 — GET YOURS</Small>
      <Reveal f={f} at={a + 4} size={120} style={{ marginTop: 10 }}>BUY TODAY</Reveal>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 20, transform: `scale(${1 - press * 0.05})`, transformOrigin: 'left', clipPath: `inset(0 ${(1 - ease(f, a + 8, a + 18)) * 100}% 0 0)` }}>
        <div style={{ background: RED, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 64, padding: '12px 30px', letterSpacing: '0.04em' }}>CRAZYRC.IN</div>
        <svg width={100} height={60}><path d="M6 30 H86 M62 8 L88 30 L62 52" stroke={INK} strokeWidth={8} fill="none" strokeLinecap="round" strokeLinejoin="round" transform={`translate(${Math.sin(f / 4) * 8} 0)`} /></svg>
      </div>
      {tl >= 0 && tl < 18 && <div style={{ position: 'absolute', left: 300 - tl * 7, top: 210 - tl * 7, width: 30 + tl * 14, height: 30 + tl * 14, borderRadius: '50%', border: `5px solid ${INK}`, opacity: 1 - tl / 18 }} />}
    </div>
  );
};

export const Graphics: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <G2 f={f} /><G3 f={f} /><G4 f={f} /><G5 f={f} /><G7 f={f} /><G8 f={f} /><G10 f={f} /><G11 f={f} /><G12 f={f} /><G13 f={f} />
    </AbsoluteFill>
  );
};
/** graphics drawn on top of the video window */
export const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill><G0 f={f} /><G6 f={f} /><G9 f={f} /></AbsoluteFill>;
};
