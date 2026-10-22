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

// ================================================================================ 0. intro headline (full video)
const G0: React.FC<{ f: number }> = ({ f }) => {
  const a = 0, b = end(0); if (!live(f, a, b)) return null;
  const m = cue('military'), c = cue('cars');
  const o = outAt(f, b, 5);
  return (
    <div style={{ position: 'absolute', left: 56, top: 1210, opacity: 1 - o }}>
      <Tag p={ease(f, 4, 12)} bg={RED}>IF YOU LOVE</Tag>
      <div style={{ marginTop: 10, background: INK, padding: '6px 24px 10px', clipPath: `inset(0 ${(1 - ease(f, m - 2, m + 8, 0, 1, Easing.out(Easing.exp))) * 100}% 0 0)` }}>
        <Reveal f={f} at={m} size={170} color="#fff">MILITARY</Reveal>
      </div>
      <div style={{ marginTop: 10, display: 'inline-block', background: '#fff', padding: '6px 24px 10px', clipPath: `inset(0 ${(1 - ease(f, c - 2, c + 8, 0, 1, Easing.out(Easing.exp))) * 100}% 0 0)` }}>
        <Reveal f={f} at={c} size={130}>TRUCKS?</Reveal>
      </div>
    </div>
  );
};

// ================================================================================ 1. model reveal (paper under TOP window)
const G1: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('jjrc'), b = end(1) + 2; if (!live(f, a - 2, b)) return null;
  const o = outAt(f, b);
  return (
    <div style={{ position: 'absolute', left: 60, top: 1350, right: 60, opacity: 1 - o }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}><Tag p={ease(f, a, a + 8)}>JJRC</Tag><Rule f={f} at={a + 2} w={640} /></div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 10 }}>
        <Odometer f={f} at={cue('c8835') - 2} text="C8835" size={215} />
        <div style={{ textAlign: 'right', marginBottom: 26 }}>
          {['HUMMER', 'CRAWLER', '4WD · RTR'].map((t, i) => <Reveal key={t} f={f} at={cue('c8835') + 4 + i * 3} size={34} ls={0.08} color={i === 1 ? RED : INK}>{t}</Reveal>)}
        </div>
      </div>
      <Rule f={f} at={cue('c8835') + 6} w={960} color={RED} h={8} />
    </div>
  );
};

// ================================================================================ 2. Hummer design (paper, circle window)
const G2: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[2].from, b = end(2); if (!live(f, a, b + 4)) return null;
  const o = outAt(f, b + 4);
  const car = sp(f, a + 2, { damping: 14, stiffness: 90, mass: 0.9 });
  const h = cue('hummer'), s = cue('simulated');
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <Small color={RED} style={{ opacity: ease(f, a + 2, a + 8) }}>N°03 — DESIGN</Small>
        <Reveal f={f} at={h - 2} size={128} style={{ marginTop: 8 }}>HUMMER</Reveal>
        <Reveal f={f} at={s - 2} size={60} ls={0.02} color={RED}>SIMULATION</Reveal>
        <Reveal f={f} at={s + 3} size={60} ls={0.02}>RC TRUCK</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 40, top: 560, width: 1000 }}>
        <Img src={staticFile('img/black.png')} style={{ width: 1000, transform: `translateX(${(1 - car) * 900}px) perspective(1600px) rotateY(${(1 - car) * -35}deg)`, filter: 'drop-shadow(0 40px 30px rgba(0,0,0,0.25))' }} />
        {[[30, 30], [970, 30], [30, 940], [970, 940]].map(([x, y], i) => <Reg key={i} x={x} y={y} o={ease(f, a + 10 + i * 2, a + 16 + i * 2)} />)}
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1560, display: 'flex', gap: 12 }}>
        {['MILITARY STYLE', 'ABS BODY', '904 G'].map((t, i) => <Tag key={t} p={ease(f, s + 4 + i * 4, s + 12 + i * 4)} bg={i === 0 ? RED : INK}>{t}</Tag>)}
      </div>
      <div style={{ position: 'absolute', right: 50, top: 1520, opacity: ease(f, a + 10, a + 18) }}><Badge f={f} text="· JJRC C8835 · HUMMER CRAWLER " /></div>
    </AbsoluteFill>
  );
};

// ================================================================================ 3. 1:12 scale with dimension lines
const Dim: React.FC<{ f: number; at: number; x1: number; y1: number; x2: number; y2: number; label: string; vertical?: boolean }> = ({ f, at, x1, y1, x2, y2, label, vertical }) => {
  const p = ease(f, at, at + 14, 0, 1, Easing.inOut(Easing.cubic));
  const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
  return (
    <g>
      <line x1={x1} y1={y1} x2={xe} y2={ye} stroke={RED} strokeWidth={3} />
      {vertical ? <><line x1={x1 - 12} y1={y1} x2={x1 + 12} y2={y1} stroke={RED} strokeWidth={3} /><line x1={x2 - 12} y1={ye} x2={x2 + 12} y2={ye} stroke={RED} strokeWidth={3} opacity={p} /></>
        : <><line x1={x1} y1={y1 - 12} x2={x1} y2={y1 + 12} stroke={RED} strokeWidth={3} /><line x1={xe} y1={y2 - 12} x2={xe} y2={y2 + 12} stroke={RED} strokeWidth={3} opacity={p} /></>}
      <text x={(x1 + x2) / 2 + (vertical ? -16 : 0)} y={(y1 + y2) / 2 + (vertical ? 0 : 34)} textAnchor={vertical ? 'end' : 'middle'} fontFamily="Bai Jamjuree" fontWeight={700} fontSize={26} fill={INK} opacity={ease(f, at + 8, at + 14)} letterSpacing="2">{label}</text>
    </g>
  );
};
const G3: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[3].from, b = end(3); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const sc = cue('scale');
  const car = sp(f, a + 2);
  return (
    <div style={{ position: 'absolute', left: 40, top: 1330, width: 1000, height: 560, opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 90, top: 30, width: 480, transform: `translateY(${(1 - car) * 300}px)` }}>
        <Img src={staticFile('img/green.png')} style={{ width: 480 }} />
      </div>
      <svg width={1000} height={560} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <Dim f={f} at={sc + 4} x1={90} y1={440} x2={570} y2={440} label="32 CM" />
        <Dim f={f} at={sc + 10} x1={60} y1={30} x2={60} y2={414} label="15" vertical />
      </svg>
      <div style={{ position: 'absolute', right: 10, top: 40, textAlign: 'right' }}>
        <Small color={RED} style={{ opacity: ease(f, a + 2, a + 8) }}>N°04 — SCALE</Small>
        <Reveal f={f} at={sc - 3} size={190} style={{ marginTop: 6 }}>1:12</Reveal>
        <Reveal f={f} at={sc + 2} size={40} ls={0.2} color={RED}>SCALE MODEL</Reveal>
      </div>
    </div>
  );
};

// ================================================================================ 4. 4WD schematic card
const G4: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[4].from + 2, b = end(4); if (!live(f, a, b)) return null;
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
        <Small color={RED}>N°05 — DRIVE</Small>
        <Reveal f={f} at={w - 3} size={200} style={{ marginTop: 6 }}>4WD</Reveal>
        <Reveal f={f} at={w + 4} size={34} ls={0.16}>FULL-TIME DRIVE</Reveal>
      </div>
    </Card>
  );
};

// ================================================================================ 5. crawler (split)
const G5: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[5].from, b = end(5); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const c = cue('crawler'), bg = cue('beginners');
  const pos = ease(f, bg - 4, bg + 10, 0, 1, Easing.out(Easing.back(1.6)));
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 580, top: 180, width: 460 }}>
        <Small color={RED}>N°06 — LEVEL</Small>
        <Reveal f={f} at={a + 2} size={58} style={{ marginTop: 14 }}>AN</Reveal>
        <Reveal f={f} at={a + 5} size={74} color={RED}>EXCELLENT</Reveal>
        <Rule f={f} at={a + 8} w={440} style={{ margin: '14px 0' }} />
      </div>
      <div style={{ position: 'absolute', left: 1010, top: 470, transformOrigin: '0 0', transform: 'rotate(90deg)' }}>
        <Reveal f={f} at={c - 3} size={210} ls={-0.03}>CRAWLER</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1380 }}>
        <Small style={{ opacity: ease(f, a + 6, a + 12) }}>SKILL LEVEL</Small>
        <div style={{ position: 'relative', height: 120, marginTop: 20 }}>
          <div style={{ position: 'absolute', left: 0, right: 0, top: 50, height: 6, background: INK, transformOrigin: 'left', transform: `scaleX(${ease(f, a + 6, a + 20)})` }} />
          {['BEGINNER', 'INTERMEDIATE', 'PRO'].map((t, i) => (
            <div key={t} style={{ position: 'absolute', left: `${i * 50}%`, top: 34, transform: 'translateX(-50%)', opacity: ease(f, a + 10 + i * 3, a + 16 + i * 3), marginLeft: i === 0 ? 20 : i === 2 ? -20 : 0 }}>
              <div style={{ width: 4, height: 38, background: INK, margin: '0 auto' }} />
              <Small style={{ marginTop: 14, fontSize: 18, textAlign: 'center' }}>{t}</Small>
            </div>
          ))}
          <div style={{ position: 'absolute', left: `${interpolate(pos, [0, 1], [80, 3])}%`, top: 22, width: 62, height: 62, borderRadius: 31, background: RED, border: '5px solid #111113', opacity: ease(f, a + 12, a + 16) }} />
        </div>
        <div style={{ marginTop: 40 }}><Tag p={ease(f, bg, bg + 8)} bg={RED} style={{ fontSize: 34 }}>PERFECT FOR BEGINNERS</Tag></div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 6. battery 40 min (bottom window, top paper)
const G6: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[6].from, b = cue('best1') - 2; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const fo = cue('forty');
  const v = Math.round(interpolate(f, [fo - 4, fo + 16], [0, 40], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) }));
  const ring = v / 40; const R = 150, C = 2 * Math.PI * R;
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: 170, height: 540, opacity: 1 - o }}>
      <Small color={RED} style={{ opacity: ease(f, a + 2, a + 8) }}>N°07 — BATTERY BACKUP</Small>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, marginTop: 20 }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 330, lineHeight: 0.8, color: INK, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', width: 430 }}>{v}</div>
        <div style={{ marginBottom: 20 }}>
          <Reveal f={f} at={fo + 4} size={80}>MIN</Reveal>
          <Reveal f={f} at={fo + 8} size={28} ls={0.2} color={RED}>RUN TIME</Reveal>
        </div>
        <svg width={340} height={340} viewBox="0 0 340 340" style={{ marginLeft: 'auto' }}>
          <circle cx={170} cy={170} r={R} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth={26} />
          <circle cx={170} cy={170} r={R} fill="none" stroke={RED} strokeWidth={26} strokeDasharray={`${C * ring} ${C}`} transform="rotate(-90 170 170)" strokeLinecap="butt" />
          {Array.from({ length: 40 }, (_, i) => { const ang = (i / 40) * Math.PI * 2 - Math.PI / 2; return <line key={i} x1={170 + Math.cos(ang) * 118} y1={170 + Math.sin(ang) * 118} x2={170 + Math.cos(ang) * (i % 5 ? 112 : 104)} y2={170 + Math.sin(ang) * (i % 5 ? 112 : 104)} stroke={INK} strokeWidth={i % 5 ? 2 : 4} />; })}
          <text x={170} y={182} textAnchor="middle" fontFamily="Bai Jamjuree" fontWeight={700} fontSize={36} fill={INK}>7.4V</text>
        </svg>
      </div>
    </div>
  );
};

// ================================================================================ 7. Type-C (top window, bottom paper)
const G7: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('best1'), b = end(7) + 2; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const t = cue('typec');
  const plug = ease(f, t - 8, t + 4, 0, 1, Easing.inOut(Easing.cubic));
  const spark = f >= t + 4 && f < t + 14;
  return (
    <div style={{ position: 'absolute', left: 40, top: 1330, width: 1000, height: 560, opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 30, top: 30 }}>
        <Small color={RED} style={{ opacity: ease(f, a + 2, a + 8) }}>N°08 — CHARGING</Small>
        <Reveal f={f} at={a + 4} size={64} style={{ marginTop: 10 }}>THE BEST THING?</Reveal>
        <Reveal f={f} at={t - 4} size={170} color={RED}>TYPE-C</Reveal>
      </div>
      <svg width={1000} height={200} viewBox="0 0 1000 200" style={{ position: 'absolute', left: 0, top: 330 }}>
        <rect x={640} y={60} width={300} height={90} rx={20} fill={INK} />
        <rect x={662} y={88} width={110} height={34} rx={17} fill="#3a3a40" />
        <g transform={`translate(${interpolate(plug, [0, 1], [-260, 0])} 0)`}>
          <path d={`M30 105 H520`} stroke={INK} strokeWidth={22} strokeLinecap="round" />
          <rect x={500} y={72} width={150} height={66} rx={18} fill="#d8d6d0" stroke={INK} strokeWidth={5} />
          <rect x={640} y={90} width={110} height={30} rx={15} fill="#9a9aa2" stroke={INK} strokeWidth={4} />
        </g>
        {spark && [0, 1, 2, 3, 4, 5].map(i => { const ang = (i / 6) * Math.PI * 2; const l = (f - t - 4) * 5; return <line key={i} x1={650 + Math.cos(ang) * 20} y1={105 + Math.sin(ang) * 20} x2={650 + Math.cos(ang) * (30 + l)} y2={105 + Math.sin(ang) * (30 + l)} stroke={RED} strokeWidth={5} strokeLinecap="round" />; })}
      </svg>
    </div>
  );
};

// ================================================================================ 8. details with numbered callouts
const PTS: [string, string, number, number, number, number][] = [
  // label, cue, anchor x, y (0..1 of image), label x, y (px in stage)
  ['DOORS OPEN', 'door', 0.82, 0.38, 560, 1380],
  ['TOP SHELL OPENS', 'topshell', 0.52, 0.06, 470, 540],
  ['BATTERY AT THE BACK', 'battcomp', 0.985, 0.47, 620, 1520],
];
const G8: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[8].from, b = end(8); if (!live(f, a, b + 4)) return null;
  const o = outAt(f, b + 4);
  const car = sp(f, a + 2, { damping: 14, stiffness: 90, mass: 0.9 });
  const IX = 40, IY = 640, IW = 1000, IH = 1000 * 934 / 1170;
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 430, top: 175 }}>
        <Small color={RED}>N°09 — DETAILS</Small>
        <Reveal f={f} at={a + 3} size={86} style={{ marginTop: 8 }}>BUILT LIKE</Reveal>
        <Reveal f={f} at={a + 7} size={86} color={RED}>THE REAL ONE</Reveal>
      </div>
      <Img src={staticFile('img/green.png')} style={{ position: 'absolute', left: IX, top: IY, width: IW, transform: `translateY(${(1 - car) * 500}px)`, filter: 'drop-shadow(0 40px 30px rgba(0,0,0,0.25))' }} />
      <svg width={1080} height={1920} style={{ position: 'absolute', left: 0, top: 0 }}>
        {PTS.map(([t, k, ax, ay, lx, ly], i) => {
          const c = cue(k as any); const p = ease(f, c - 2, c + 10, 0, 1, Easing.inOut(Easing.cubic));
          if (f < c - 2) return null;
          const x0 = IX + ax * IW, y0 = IY + ay * IH; const x1 = x0 + (lx - x0) * p, y1 = y0 + (ly - y0) * p;
          const pulse = ((f - c) % 24) / 24;
          return <g key={i}>
            <circle cx={x0} cy={y0} r={14 + pulse * 22} fill="none" stroke={RED} strokeWidth={4} opacity={1 - pulse} />
            <circle cx={x0} cy={y0} r={11} fill={RED} stroke="#fff" strokeWidth={4} />
            <polyline points={`${x0},${y0} ${x1},${y0 + (ly - y0) * Math.min(1, p * 1.6)} ${x1},${y1}`} fill="none" stroke={INK} strokeWidth={3} />
          </g>;
        })}
      </svg>
      {PTS.map(([t, k, , , lx, ly], i) => {
        const c = cue(k as any); const p = ease(f, c + 6, c + 14);
        return (
          <div key={i} style={{ position: 'absolute', left: Math.min(lx - 20, 1040 - 22 - t.length * 20), top: ly - 24, display: 'flex', alignItems: 'center', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
            <div style={{ background: RED, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 30, width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
            <div style={{ background: INK, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '0.08em', height: 52, display: 'flex', alignItems: 'center', padding: '0 16px' }}>{t}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ================================================================================ 9. ground clearance card
const G9: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[9].from + 4, b = end(9); if (!live(f, a, b)) return null;
  const c = cue('clearance');
  const W = 520, H = W * 934 / 1168;
  const ax = 0.43 * W, y0 = 0.66 * H, y1 = 0.83 * H;
  const p = ease(f, c - 2, c + 12, 0, 1, Easing.inOut(Easing.cubic));
  return (
    <Card f={f} a={a} b={b} h={470}>
      <div style={{ position: 'absolute', left: 30, top: 30, width: W, height: H }}>
        <Img src={staticFile('img/yellow.png')} style={{ width: W }} />
        <svg width={W} height={H + 40} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <line x1={-10} y1={y1} x2={W + 10} y2={y1} stroke={INK} strokeWidth={3} strokeDasharray="10 8" opacity={ease(f, a + 4, a + 10)} />
          <line x1={ax} y1={y1} x2={ax} y2={y1 - (y1 - y0) * p} stroke={RED} strokeWidth={6} />
          <path d={`M${ax - 14} ${y0 + 16} L${ax} ${y0} L${ax + 14} ${y0 + 16}`} stroke={RED} strokeWidth={6} fill="none" opacity={p} />
          <path d={`M${ax - 14} ${y1 - 16} L${ax} ${y1} L${ax + 14} ${y1 - 16}`} stroke={RED} strokeWidth={6} fill="none" opacity={p} />
        </svg>
      </div>
      <div style={{ position: 'absolute', right: 44, top: 56, textAlign: 'right' }}>
        <Small color={RED}>N°10 — OFF-ROAD</Small>
        <Reveal f={f} at={cue('high') - 2} size={110} style={{ marginTop: 8 }}>HIGH</Reveal>
        <Reveal f={f} at={c - 2} size={64} ls={0}>GROUND</Reveal>
        <Reveal f={f} at={c + 2} size={64} ls={0} color={RED}>CLEARANCE</Reveal>
      </div>
    </Card>
  );
};

// ================================================================================ 10. damaged → hazard tape
const G10: React.FC<{ f: number }> = ({ f }) => {
  const d = cue('damaged'); const b = end(10); if (!live(f, d - 2, b)) return null;
  const tape = (dir: number, rot: number, top: number, delay: number) => {
    const p = ease(f, d + delay, d + delay + 8, 0, 1, Easing.out(Easing.exp));
    return (
      <div style={{ position: 'absolute', left: -200, width: 1480, top, height: 110, transform: `rotate(${rot}deg) translateX(${(1 - p) * 1500 * dir}px)`, background: `repeating-linear-gradient(-45deg, ${BRAND.gold} 0 40px, ${INK} 40px 80px)`, boxShadow: '0 16px 40px rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: INK, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 56, letterSpacing: '0.16em', padding: '4px 30px' }}>{dir > 0 ? 'DAMAGED?' : 'NO PROBLEM.'}</div>
      </div>
    );
  };
  return <AbsoluteFill>{tape(1, -8, 380, 0)}{tape(-1, 6, 560, 5)}</AbsoluteFill>;
};

// ================================================================================ 11. care plan calendar
const G11: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[11].from, b = end(11) + 4; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const m = cue('months'), fr = cue('free');
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
      <div style={{ position: 'absolute', right: 0, top: 110, opacity: ease(f, a + 4, a + 10) }}><Badge f={f} text="· CRAZYRC CARE PLAN · 6 MONTHS FREE " size={210} fill={PAPER} /></div>
    </div>
  );
};

// ================================================================================ 12. hanging price tag (split)
const G12: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[12].from, b = end(12); if (!live(f, a, b)) return null;
  const o = outAt(f, b); const pr = cue('price');
  const drop = sp(f, a + 4, { damping: 6, stiffness: 90, mass: 0.8 });
  const swing = Math.sin((f - a) / 7) * 8 * Math.exp(-(f - a) / 40) + Math.sin(f / 18) * 1.5;
  const typed = 'crazyrc.in/products/jjrc-c8835'; const n = Math.floor(interpolate(f, [a + 6, a + 40], [0, typed.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }));
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <div style={{ position: 'absolute', left: 800, top: 150, width: 4, height: 200 * drop, background: INK }} />
      <div style={{ position: 'absolute', left: 620, top: 150 + 200 * drop - 20, width: 360, transformOrigin: '182px 0', transform: `rotate(${swing}deg)` }}>
        <div style={{ position: 'relative', background: '#fff', border: `4px solid ${INK}`, clipPath: 'polygon(20% 0, 80% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)', padding: '70px 26px 30px', boxShadow: '0 30px 50px rgba(0,0,0,0.2)' }}>
          <div style={{ position: 'absolute', left: '50%', top: 22, width: 30, height: 30, marginLeft: -15, borderRadius: 15, border: `4px solid ${INK}` }} />
          <Small color={RED}>LISTED ON CRAZYRC</Small>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 76, lineHeight: 1, color: INK, marginTop: 14, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>₹10,000</div>
          <div style={{ height: 3, background: INK, margin: '16px 0' }} />
          <Small style={{ fontSize: 18 }}>JJRC C8835 · HUMMER</Small>
          <div style={{ position: 'absolute', left: 8, right: 8, top: 96, height: 112, border: `6px solid ${RED}`, borderRadius: '50%', transform: 'rotate(-4deg)', clipPath: `inset(0 ${(1 - ease(f, pr, pr + 12)) * 100}% 0 0)` }} />
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1360, right: 60 }}>
        <Small>VISIT</Small>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 52, color: INK, marginTop: 12, borderBottom: `4px solid ${INK}`, paddingBottom: 10 }}>{typed.slice(0, n)}<span style={{ opacity: Math.floor(f / 8) % 2 ? 1 : 0, color: RED }}>|</span></div>
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 13. Diwali offer (circle window)
const Diya: React.FC<{ f: number; s?: number }> = ({ f, s = 90 }) => (
  <svg width={s} height={s} viewBox="0 0 70 70"><path d="M8 40 Q35 66 62 40 Z" fill="#c8641a" /><path d="M35 8 C44 22 42 34 35 38 C28 34 26 22 35 8Z" fill="#ffc23a" transform={`rotate(${Math.sin(f / 3) * 6} 35 38)`} style={{ filter: 'drop-shadow(0 0 10px #ffb000)' }} /></svg>
);
const G13: React.FC<{ f: number }> = ({ f }) => {
  const a = SEGS[13].from, b = end(13) + 4; if (!live(f, a, b)) return null;
  const o = outAt(f, b); const of = cue('offer');
  const k = ease(f, of - 8, of + 10, 0, 1, Easing.inOut(Easing.cubic));
  const price = Math.round(10000 - 1000 * k);
  const strike = ease(f, of + 8, of + 16);
  const warm = ease(f, a, a + 12);
  const cars = ['black', 'green', 'yellow'];
  return (
    <AbsoluteFill style={{ opacity: 1 - o }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 60% 30%, rgba(255,194,58,${0.35 * warm}), transparent 60%)` }} />
      {Array.from({ length: 26 }, (_, i) => { const x = random(`gx${i}`) * 1080; const y = (random(`gy${i}`) * 1920 + f * (2 + random(`gv${i}`) * 3)) % 1920; const r = 3 + random(`gr${i}`) * 6; return <div key={i} style={{ position: 'absolute', left: x, top: y, width: r, height: r, transform: 'rotate(45deg)', background: i % 3 ? BRAND.gold : RED, opacity: 0.8 * warm }} />; })}
      <div style={{ position: 'absolute', left: 430, top: 170 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><Diya f={f} s={70} /><Small color="#a06a00">N°13 — FESTIVE PRICE</Small></div>
        <Reveal f={f} at={a + 3} size={150} color={RED}>DIWALI</Reveal>
        <Reveal f={f} at={a + 7} size={70}>OFFER</Reveal>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 600, display: 'flex', alignItems: 'baseline', gap: 26 }}>
        <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 700, fontSize: 64, color: 'rgba(0,0,0,0.4)', opacity: ease(f, of - 2, of + 6), width: 270 * ease(f, of - 6, of + 4, 0, 1, Easing.inOut(Easing.cubic)), overflow: 'hidden', whiteSpace: 'nowrap' }}>₹10,000
          <div style={{ position: 'absolute', left: -4, top: '52%', height: 8, width: `${strike * 104}%`, background: RED, transform: 'rotate(-6deg)' }} /></div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 180, color: INK, letterSpacing: '-0.04em', lineHeight: 1, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', transform: `scale(${1 + 0.1 * Math.exp(-Math.max(0, f - of) / 6) * (f >= of ? 1 : 0)})`, transformOrigin: 'left' }}>₹{price.toLocaleString('en-IN')}</div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 960, height: 560 }}>
        {cars.map((c, i) => { const p = sp(f, a + 8 + i * 5); return <Img key={c} src={staticFile(`img/${c}.png`)} style={{ position: 'absolute', width: 520, left: 20 + i * 270, top: (i % 2) * 60, transform: `translateY(${(1 - p) * 700}px)`, filter: 'drop-shadow(0 30px 24px rgba(0,0,0,0.25))', zIndex: i === 1 ? 2 : 1 }} />; })}
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1600, display: 'flex', gap: 12 }}>
        {['BLACK', 'MILITARY GREEN', 'DESERT YELLOW'].map((t, i) => <Tag key={t} p={ease(f, a + 24 + i * 4, a + 32 + i * 4)} bg={i === 1 ? '#3f4d2c' : i === 2 ? '#a88a55' : INK}>{t}</Tag>)}
      </div>
    </AbsoluteFill>
  );
};

// ================================================================================ 14. CTA
const G14: React.FC<{ f: number }> = ({ f }) => {
  const a = cue('buy') - 2, b = end(14) + 4; if (!live(f, a, b)) return null;
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
      <G1 f={f} /><G2 f={f} /><G3 f={f} /><G5 f={f} /><G6 f={f} /><G7 f={f} /><G8 f={f} /><G11 f={f} /><G12 f={f} /><G13 f={f} /><G14 f={f} />
    </AbsoluteFill>
  );
};
/** graphics drawn on top of the video window */
export const Overlays: React.FC = () => {
  const f = useCurrentFrame();
  return <AbsoluteFill><G0 f={f} /><G4 f={f} /><G9 f={f} /><G10 f={f} /></AbsoluteFill>;
};
