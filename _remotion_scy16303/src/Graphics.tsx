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

// ================================================================================ 0. intro (full video)
const G0: React.FC<{ f: number }> = ({ f }) => {
  const b = end(0); if (!live(f, 0, b)) return null;
  const s = cue('scy'), n = cue('num'); const o = outAt(f, b, 5);
  return (
    <div style={{ position: 'absolute', left: 56, top: 1220, opacity: 1 - o }}>
      <Tag p={ease(f, 2, 10)} bg={RED}>THIS IS THE</Tag>
      <div style={{ marginTop: 10, display: 'inline-block', background: INK, padding: '6px 24px 10px', clipPath: `inset(0 ${(1 - ease(f, s - 2, s + 8, 0, 1, Easing.out(Easing.exp))) * 100}% 0 0)` }}>
        <Reveal f={f} at={s} size={150} color="#fff">SCY</Reveal>
      </div>
      <div style={{ marginTop: 10, background: '#fff', padding: '6px 24px 4px', display: 'inline-block', clipPath: `inset(0 ${(1 - ease(f, n - 2, n + 8, 0, 1, Easing.out(Easing.exp))) * 100}% 0 0)` }}>
        <Odometer f={f} at={n} text="16303" size={170} />
      </div>
    </div>
  );
};

// ================================================================================ 1. best drift car (TOP window)
const Smoke: React.FC<{ f: number; a: number; x: number; y: number; n?: number }> = ({ f, a, x, y, n = 16 }) => (
  <>{Array.from({ length: n }, (_, i) => {
    const born = a + i * 1.6; const l = f - born; if (l < 0 || l > 34) return null;
    const r = 30 + l * 4 + random(`r${i}`) * 30; const op = 0.22 * (1 - l / 34);
    return <div key={i} style={{ position: 'absolute', left: x - i * 18 - l * 2 - r / 2, top: y - r / 2 - l * 1.2 + random(`y${i}`) * 20, width: r, height: r, borderRadius: '50%', background: `rgba(120,120,128,${op})`, filter: 'blur(6px)' }} />;
  })}</>
);
const G1: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[1].from, b = end(1); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const be = cue('best'), d = cue('drift'), bu = cue('budget');
  const slide = ease(f, d - 6, d + 18, 0, 1, Easing.out(Easing.cubic));
  const yaw = interpolate(slide, [0, 0.6, 1], [-14, 6, 0]);
  const cx = interpolate(slide, [0, 1], [-700, 430]);
  return (
    <div style={{ position: 'absolute', left: 40, top: 1330, width: 1000, height: 560, opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 20, top: 24 }}>
        <Small color={RED} style={{ opacity: ease(f, a + 2, a + 8) }}>N°02 — CATEGORY</Small>
        <Reveal f={f} at={be - 2} size={96} style={{ marginTop: 8 }}>BEST DRIFT</Reveal>
        <Reveal f={f} at={d} size={96} color={RED}>CAR</Reveal>
      </div>
      <div style={{ position: 'absolute', right: 20, top: 30, textAlign: 'right' }}>
        <Tag p={ease(f, bu - 2, bu + 6)} bg={INK} style={{ fontSize: 30 }}>IN YOUR BUDGET</Tag>
      </div>
      <svg width={1000} height={560} style={{ position: 'absolute', left: 0, top: 0 }}>
        {[0, 1].map(k => <path key={k} d={`M ${-40} ${440 + k * 40} C 200 ${470 + k * 40}, 340 ${400 + k * 30}, ${Math.max(0, cx + 40)} ${430 + k * 34}`} stroke="rgba(17,17,19,0.55)" strokeWidth={14} fill="none" strokeLinecap="round" strokeDasharray="1600" strokeDashoffset={1600 * (1 - slide)} />)}
      </svg>
      <Smoke f={f} a={d - 4} x={cx + 40} y={430} />
      <Img src={staticFile('img/blue.png')} style={{ position: 'absolute', left: cx, top: 240, width: 540, transform: `rotate(${yaw}deg)`, filter: 'drop-shadow(0 26px 20px rgba(0,0,0,0.3))' }} />
    </div>
  );
};

// ================================================================================ 2. top speed (circle)
const G2: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[2].from, b = end(2); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const k = cue('km');
  const fill = ease(f, cue('speed'), k + 14, 0, 1, Easing.out(Easing.cubic));
  const car = sp(f, a + 2, { damping: 16, stiffness: 120, mass: 0.8 });
  const jit = f > k ? Math.sin(f * 2.3) * 2 : 0;
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <Small color={RED}>N°03 — TOP SPEED</Small>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 6 }}>
          <Odometer f={f} at={k - 4} text="35+" size={230} />
          <Reveal f={f} at={k + 4} size={58} color={RED} style={{ marginBottom: 26 }}>KM/H</Reveal>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, height: 500, overflow: 'hidden' }}>
        {Array.from({ length: 14 }, (_, i) => { const y = 40 + random(`ly${i}`) * 420; const w = 120 + random(`lw${i}`) * 380; const x = 1200 - ((f * (34 + random(`lv${i}`) * 30) + random(`lx${i}`) * 1600) % 1800); return <div key={i} style={{ position: 'absolute', left: x, top: y, width: w, height: 4 + (i % 3) * 3, background: i % 4 ? INK : RED, opacity: 0.6 * car }} />; })}
        <Img src={staticFile('img/grey.png')} style={{ position: 'absolute', left: 60, top: 60, width: 960, transform: `translateX(${(1 - car) * 1200}px) translateY(${jit}px)`, filter: 'drop-shadow(0 30px 24px rgba(0,0,0,0.28))' }} />
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1240 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>{[0, 5, 10, 15, 20, 25, 30, 35].map(v => <div key={v} style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, color: v <= fill * 35 ? RED : 'rgba(0,0,0,0.35)' }}>{v}</div>)}</div>
        <div style={{ height: 22, background: 'rgba(0,0,0,0.1)', marginTop: 8, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${fill * 100}%`, background: `repeating-linear-gradient(90deg, ${RED} 0 22px, #a80000 22px 26px)` }} />
        </div>
        <Small style={{ marginTop: 16 }}>390 BRUSHED MOTOR · 4WD · ON-ROAD DRIFT</Small>
      </div>
      <div style={{ position: 'absolute', right: 50, top: 1500 }}><Badge f={f} text="· SCY 16303 · HURRICANE DRIFT " /></div>
    </AbsoluteFill>
  );
};

// ================================================================================ 3. battery (bottom window, paper top)
const G3: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[3].from, b = end(3); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const bt = cue('battery'), m = cue('mins');
  const cells = 10; const lvl = ease(f, bt - 2, bt + 24, 0, 1, Easing.out(Easing.cubic));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 170, height: 540, opacity: 1 - o }}>
      <Small color={RED}>N°04 — POWER</Small>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginTop: 10 }}>
        <Odometer f={f} at={bt - 4} text="1300" size={190} />
        <div style={{ marginBottom: 20 }}><Reveal f={f} at={bt + 6} size={64}>MAH</Reveal><Reveal f={f} at={bt + 10} size={24} ls={0.2} color={RED}>7.4V LI-ION</Reveal></div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: 26 }}>
        <div style={{ flex: 1, height: 120, border: `6px solid ${INK}`, padding: 8, display: 'flex', gap: 6 }}>
          {Array.from({ length: cells }, (_, i) => <div key={i} style={{ flex: 1, background: i < lvl * cells ? (i < 2 ? RED : INK) : 'transparent', transform: `scaleY(${i < lvl * cells ? 1 : 0.3})` }} />)}
        </div>
        <div style={{ width: 22, height: 54, background: INK }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18, alignItems: 'center' }}>
        <Tag p={ease(f, m - 2, m + 6)} bg={RED} style={{ fontSize: 32 }}>15–20 MIN RUNTIME</Tag>
        <Small style={{ opacity: ease(f, m + 4, m + 10) }}>USB CHARGING · 2–3 HRS</Small>
      </div>
    </div>
  );
};

// ================================================================================ 4. 4 suspension (split)
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
const G4b: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[4].from, b = end(4); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const fo = cue('four'), su = cue('suspension');
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 580, top: 180, width: 460 }}>
        <Small color={RED}>N°05 — CHASSIS</Small>
        <Reveal f={f} at={fo - 3} size={330} color={RED} style={{ marginTop: 0 }}>4</Reveal>
        <Reveal f={f} at={su - 2} size={66}>SUSPENSION</Reveal>
        <Rule f={f} at={su} w={440} style={{ margin: '16px 0' }} />
        <Reveal f={f} at={su + 6} size={26} ls={0.16}>INDEPENDENT · OIL SPRINGS</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1320, display: 'flex', justifyContent: 'space-between' }}>
        {['FL', 'FR', 'RL', 'RR'].map((t, i) => {
          const p = sp(f, fo + i * 3); const sq = f > su ? (Math.sin((f - su) / 3 + i * 1.3) + 1) / 2 * Math.exp(-(f - su) / 40) : 0;
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

// ================================================================================ 6. tyre sets (circle)
const TyreSvg: React.FC<{ rot: number; slick?: boolean }> = ({ rot, slick }) => (
  <svg width={340} height={340} viewBox="0 0 200 200"><g transform={`rotate(${rot} 100 100)`}>
    <circle cx="100" cy="100" r="94" fill={slick ? '#2a2a2e' : INK} />
    {!slick && Array.from({ length: 24 }, (_, i) => <rect key={i} x="92" y="6" width="16" height="20" rx="3" fill="#3a3a40" transform={`rotate(${i * 15} 100 100)`} />)}
    {slick && <circle cx="100" cy="100" r="88" fill="none" stroke="#3a3a40" strokeWidth={3} />}
    <circle cx="100" cy="100" r="58" fill="#c9ccd2" stroke={INK} strokeWidth={4} />
    {Array.from({ length: 10 }, (_, i) => <path key={i} d="M100 46 L105 92 L95 92 Z" fill="#8a8d94" transform={`rotate(${i * 36} 100 100)`} />)}
    <circle cx="100" cy="100" r="12" fill={RED} /></g></svg>
);
const G6: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[6].from, b = end(6); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const bx = cue('box'), mu = cue('multiple'), ty = cue('tyre');
  const r1 = ease(f, bx - 4, bx + 14, 0, 1, Easing.out(Easing.cubic)), r2 = ease(f, ty - 6, ty + 12, 0, 1, Easing.out(Easing.cubic));
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <Small color={RED}>N°07 — IN THE BOX</Small>
        <Reveal f={f} at={a + 4} size={64} style={{ marginTop: 10 }}>THE BEST PART?</Reveal>
        <Reveal f={f} at={mu - 2} size={94} color={RED}>MULTIPLE</Reveal>
        <Reveal f={f} at={ty - 2} size={94}>TYRE SETS</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 660, transform: `translateX(${(1 - r1) * 1100}px) rotate(${(1 - r1) * 360}deg)` }}><TyreSvg rot={f * 2} /></div>
      <div style={{ position: 'absolute', left: 680, top: 660, transform: `translateX(${(1 - r2) * 1100}px) rotate(${(1 - r2) * 360}deg)` }}><TyreSvg rot={f * 2} slick /></div>
      <div style={{ position: 'absolute', left: 60, top: 1030, width: 340, textAlign: 'center' }}><Tag p={ease(f, bx + 10, bx + 18)}>GRIP · RUBBER</Tag></div>
      <div style={{ position: 'absolute', left: 680, top: 1030, width: 340, textAlign: 'center' }}><Tag p={ease(f, ty + 10, ty + 18)} bg={RED}>DRIFT · HARD</Tag></div>
      <svg width={360} height={120} style={{ position: 'absolute', left: 360, top: 760, opacity: ease(f, ty + 6, ty + 14) }}><path d="M20 40 H320 M290 16 L326 40 L290 64 M340 84 H40 M70 60 L34 84 L70 108" stroke={INK} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1180 }}>
        <Rule f={f} at={ty + 8} w={960} />
        <Reveal f={f} at={ty + 12} size={52} style={{ marginTop: 18 }}>SWAP IN SECONDS</Reveal>
        <Reveal f={f} at={ty + 16} size={26} ls={0.18} color={RED}>GRIP FOR SPEED · HARD TYRES FOR DRIFT</Reveal>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 8. drive it hard (full) — hazard tape low
const G8: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[8].from, b = end(8); if (!live(f, a, b)) return null;
  const o = outAt(f, b, 5);
  const tape = (dir: number, rot: number, top: number, at: number, text: string, red: boolean) => {
    const p = ease(f, at, at + 8, 0, 1, Easing.out(Easing.exp));
    return (
      <div style={{ position: 'absolute', left: -200, width: 1480, top, height: 104, transform: `rotate(${rot}deg) translateX(${(1 - p) * 1500 * dir}px)`, background: `repeating-linear-gradient(-45deg, ${BRAND.gold} 0 40px, ${INK} 40px 80px)`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: red ? RED : INK, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 54, letterSpacing: '0.14em', padding: '4px 30px' }}>{text}</div>
      </div>
    );
  };
  return <AbsoluteFill style={{ opacity: 1 - o }}>{tape(1, -6, 1480, cue('bindas2') - 2, 'DRIVE IT HARD.', false)}{tape(-1, 5, 1650, cue('damage') - 2, 'DAMAGE = FREE REPAIR', true)}</AbsoluteFill>;
};

// ================================================================================ 9. price tag + coupon (split)
const G9: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[9].from, b = end(9); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const p1 = cue('p1'), p2 = cue('p2'), cp = cue('coupon');
  const drop = sp(f, a + 2, { damping: 6, stiffness: 90, mass: 0.8 });
  const swing = Math.sin((f - a) / 7) * 8 * Math.exp(-(f - a) / 40) + Math.sin(f / 18) * 1.5;
  const strike = ease(f, p2 - 2, p2 + 6);
  const tk = sp(f, p2 - 4, { damping: 13, stiffness: 140, mass: 0.7 });
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 800, top: 150, width: 4, height: 200 * drop, background: INK }} />
      <div style={{ position: 'absolute', left: 620, top: 150 + 200 * drop - 20, width: 360, transformOrigin: '182px 0', transform: `rotate(${swing}deg)` }}>
        <div style={{ position: 'relative', background: '#fff', border: `4px solid ${INK}`, clipPath: 'polygon(20% 0, 80% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)', padding: '70px 26px 30px', boxShadow: '0 30px 50px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', left: '50%', top: 22, width: 30, height: 30, marginLeft: -15, borderRadius: 15, border: `4px solid ${INK}` }} />
          <Small color={RED}>LISTED ON CRAZYRC</Small>
          <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 92, lineHeight: 1, color: INK, marginTop: 10, letterSpacing: '-0.03em', opacity: ease(f, p1 - 4, p1 + 2) }}>₹11,500
            <div style={{ position: 'absolute', left: -6, top: '52%', height: 8, width: `${strike * 106}%`, background: RED, transform: 'rotate(-6deg)' }} /></div>
          <div style={{ height: 3, background: INK, margin: '16px 0' }} />
          <Small style={{ fontSize: 18 }}>SCY 16303 · 1:16 DRIFT</Small>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1330, transform: `translateY(${(1 - tk) * 600}px) rotate(${(1 - tk) * -6}deg)` }}>
        <div style={{ display: 'flex', background: RED, color: '#fff', height: 300, position: 'relative', boxShadow: '0 30px 50px rgba(0,0,0,0.25)' }}>
          <div style={{ width: 260, borderRight: '6px dashed rgba(255,255,255,0.7)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '0.24em' }}>COUPON</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 76, lineHeight: 1 }}>−₹1K</div>
          </div>
          <div style={{ flex: 1, padding: '34px 40px' }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.24em', opacity: 0.85 }}>WITH OUR EXISTING COUPON</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 8 }}>₹10,500</div>
          </div>
          {[-1, 1].map(s => <div key={s} style={{ position: 'absolute', left: 230, [s < 0 ? 'top' : 'bottom']: -30, width: 60, height: 60, borderRadius: 30, background: PAPER }} />)}
        </div>
        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between' }}>
          <Small>APPLY AT CHECKOUT</Small><Small color={RED} style={{ opacity: ease(f, cp, cp + 6) }}>CRAZYRC.IN</Small>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 10. Diwali (circle, two segments)
const Diya: React.FC<{ f: number; s?: number }> = ({ f, s = 90 }) => (
  <svg width={s} height={s} viewBox="0 0 70 70"><path d="M8 40 Q35 66 62 40 Z" fill="#c8641a" /><path d="M35 8 C44 22 42 34 35 38 C28 34 26 22 35 8Z" fill="#ffc23a" transform={`rotate(${Math.sin(f / 3) * 6} 35 38)`} style={{ filter: 'drop-shadow(0 0 10px #ffb000)' }} /></svg>
);
const G10: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[10].from, b = end(11) + 4; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const of = cue('offer'), spc = cue('special');
  const k = ease(f, of - 8, of + 10, 0, 1, Easing.inOut(Easing.cubic));
  const price = Math.round(10500 - 501 * k);
  const strike = ease(f, of + 8, of + 16);
  const warm = ease(f, a, a + 12);
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 60% 30%, rgba(255,194,58,${0.35 * warm}), transparent 60%)` }} />
      {Array.from({ length: 26 }, (_, i) => { const x = random(`gx${i}`) * 1080; const y = (random(`gy${i}`) * 1920 + f * (2 + random(`gv${i}`) * 3)) % 1920; const r = 3 + random(`gr${i}`) * 6; return <div key={i} style={{ position: 'absolute', left: x, top: y, width: r, height: r, transform: 'rotate(45deg)', background: i % 3 ? BRAND.gold : RED, opacity: 0.8 * warm }} />; })}
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Diya f={f} s={70} /><Small color="#a06a00">N°11 — FESTIVE PRICE</Small></div>
        <Reveal f={f} at={cue('diwali') - 2} size={150} color={RED}>DIWALI</Reveal>
        <Reveal f={f} at={spc - 2} size={64}>SPECIAL OFFER</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 600, display: 'flex', alignItems: 'baseline', gap: 26, opacity: ease(f, SEGS[11].from - 4, SEGS[11].from + 4) }}>
        <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 64, color: 'rgba(0,0,0,0.4)', opacity: ease(f, of - 2, of + 6), width: 270 * ease(f, of - 6, of + 4, 0, 1, Easing.inOut(Easing.cubic)), overflow: 'hidden', whiteSpace: 'nowrap' }}>₹10,500
          <div style={{ position: 'absolute', left: -4, top: '52%', height: 8, width: `${strike * 104}%`, background: RED, transform: 'rotate(-6deg)' }} /></div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 176, color: INK, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: `scale(${1 + 0.1 * Math.exp(-Math.max(0, f - of) / 6) * (f >= of ? 1 : 0)})`, transformOrigin: 'left' }}>₹{price.toLocaleString('en-IN')}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 940, height: 600 }}>
        {['blue', 'grey'].map((c, i) => { const p = sp(f, a + 6 + i * 6); return <Img key={c} src={staticFile(`img/${c}.png`)} style={{ position: 'absolute', width: 820, left: i ? 220 : 20, top: i * 230, transform: `translateX(${(1 - p) * (i ? 1000 : -1000)}px)`, filter: 'drop-shadow(0 30px 24px rgba(0,0,0,0.25))', zIndex: i }} />; })}
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1620, display: 'flex', gap: 12 }}>
        {['NAVY BLUE', 'GUNMETAL GREY'].map((t, i) => <Tag key={t} p={ease(f, a + 20 + i * 4, a + 28 + i * 4)} bg={i === 0 ? '#1f2a4a' : '#5a5d63'}>{t}</Tag>)}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 4. 4WD schematic card
const G4: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[5].from + 2, b = end(5); if (!live(f, a, b)) return null;
  const w = cue('fourwd');
  const wheels = [[60, 40], [60, 260], [330, 40], [330, 260]];
  return (
    <Card f={f} a={a} b={b} h={420}>
      <svg width={430} height={340} style={{ position: 'absolute', left: 50, top: 40 }} viewBox="0 0 430 340">
        <rect x={110} y={70} width={210} height={200} rx={24} fill="none" stroke={INK} strokeWidth={4} strokeDasharray="840" strokeDashoffset={840 * (1 - ease(f, a, a + 16))} />
        <line x1={95} y1={70} x2={95} y2={270} stroke={INK} strokeWidth={6} opacity={ease(f, a + 8, a + 14)} />
        <line x1={365} y1={70} x2={365} y2={270} stroke={INK} strokeWidth={6} opacity={ease(f, a + 8, a + 14)} />
        <line x1={95} y1={170} x2={365} y2={170} stroke={RED} strokeWidth={6} strokeDasharray="270" strokeDashoffset={270 * (1 - ease(f, w, w + 10))} />
        {wheels.map(([x, y], i) => { const on = ease(f, w + i * 3, w + i * 3 + 5); return <rect key={i} x={x} y={y} width={70} height={60} rx={14} fill={on > 0.5 ? RED : INK} style={{ filter: on > 0.5 ? 'drop-shadow(0 0 10px rgba(219,0,0,0.6))' : undefined }} transform={`translate(0 ${-8 * on})`} />; })}
      </svg>
      <div style={{ position: 'absolute', right: 50, top: 60, textAlign: 'right' }}>
        <Small color={RED}>N°06 — DRIVE</Small>
        <Reveal f={f} at={w - 3} size={200} style={{ marginTop: 6 }}>4WD</Reveal>
        <Reveal f={f} at={w + 4} size={34} ls={0.16}>FULL-TIME DRIVE</Reveal>
      </div>
    </Card>
  );
};

// ================================================================================ 11. care plan calendar
const G11: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[7].from, b = end(7) + 4; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const m = cue('months'), fr = cue('free');
  return (
    <div style={{ position: 'absolute', left: 40, top: 1330, width: 1000, height: 560, opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 20, top: 26 }}>
        <Small color={RED}>N°08 — CRAZYRC CARE PLAN</Small>
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
      <div style={{ position: 'absolute', right: 0, top: 110, opacity: ease(f, a + 4, a + 10) }}><Badge f={f} text="· CRAZYRC CARE PLAN · 6 MONTHS FREE " size={210} fill={PAPER} /></div>
    </div>
  );
};

// ================================================================================ 14. CTA
const G14: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('buy') - 2, b = end(12) + 4; if (!live(f, a, b)) return null;
  const u = cue('url'); const tl = f - u; const press = tl >= 0 && tl < 8 ? Math.sin((tl / 8) * Math.PI) : 0;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 1360 }}>
      <Small color={RED}>N°13 — GET YOURS</Small>
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
      <G1 f={f} /><G2 f={f} /><G3 f={f} /><G4b f={f} /><G6 f={f} /><G11 f={f} /><G9 f={f} /><G10 f={f} /><G14 f={f} />
    </AbsoluteFill>
  );
};
/** graphics drawn on top of the video window */
export const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill><G0 f={f} /><G4 f={f} /><G8 f={f} /></AbsoluteFill>;
};
