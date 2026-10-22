import React from 'react';
import { AbsoluteFill, Img, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import edit from './edit.json';
import { src2edit, SPEECH_END, BRAND } from './timeline';
import { FONT, ease, pop } from './ui';

// ------------------------------------------------------------------ chapter bar (segmented progress + label)
const CH = edit.chapters.map((c, i, a) => ({ label: c.label, a: src2edit(c.t), b: i < a.length - 1 ? src2edit(a[i + 1].t) : SPEECH_END }));
export const ChapterBar: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= SPEECH_END) return null;
  const cur = CH.findIndex(c => f >= c.a && f < c.b);
  const c = CH[Math.max(0, cur)];
  const enter = ease(f, 0, 12);
  const sw = pop(f, c.a, { damping: 15, stiffness: 220, mass: 0.5 });
  return (
    <AbsoluteFill style={{ opacity: enter }}>
      <div style={{ position: 'absolute', left: 48, right: 48, top: 36, display: 'flex', gap: 8 }}>
        {CH.map((s, i) => {
          const p = interpolate(f, [s.a, s.b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          return (
            <div key={i} style={{ flex: s.b - s.a, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.22)', overflow: 'hidden' }}>
              <div style={{ width: `${p * 100}%`, height: '100%', background: i === cur ? BRAND.hot : '#fff', boxShadow: i === cur ? '0 0 12px #ff2a2a' : undefined }} />
            </div>
          );
        })}
      </div>
      <div style={{ position: 'absolute', left: 48, top: 62, display: 'flex', alignItems: 'center', gap: 12, transform: `translateX(${(1 - sw) * -40}px)`, opacity: sw }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: BRAND.hot, letterSpacing: '0.1em' }}>{String(cur + 1).padStart(2, '0')}</div>
        <div style={{ width: 26, height: 3, background: 'rgba(255,255,255,0.7)' }} />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, color: '#fff', letterSpacing: '0.28em', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}>{c.label}</div>
      </div>
      <Img src={staticFile('img/logo.png')} style={{ position: 'absolute', right: 40, top: 56, width: 190, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ light leak: warm anamorphic sweep
export const LightLeak: React.FC<{ at: number; dur?: number; hue?: 'warm' | 'red' | 'gold'; dir?: 1 | -1 }> = ({ at, dur = 16, hue = 'warm', dir = 1 }) => {
  const f = useCurrentFrame(); const l = f - at;
  if (l < 0 || l > dur) return null;
  const p = l / dur; const o = Math.sin(p * Math.PI);
  const x = interpolate(p, [0, 1], dir > 0 ? [-30, 130] : [130, -30], { easing: Easing.inOut(Easing.cubic) });
  const c = hue === 'red' ? '255,40,20' : hue === 'gold' ? '255,196,80' : '255,140,60';
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: o, pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 55% 70% at ${x}% 45%, rgba(${c},0.85), rgba(${c},0.25) 45%, transparent 75%)` }} />
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 30% 22% at ${x * 0.7 + 20}% 70%, rgba(255,240,210,0.55), transparent 70%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: '44%', height: 8, background: `linear-gradient(90deg, transparent, rgba(255,230,200,${0.9 * o}), transparent)`, filter: 'blur(3px)' }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ radial speed lines (anime streaks)
export const SpeedLines: React.FC<{ a: number; b: number; cx?: number; cy?: number; strength?: number }> = ({ a, b, cx = 540, cy = 700, strength = 1 }) => {
  const f = useCurrentFrame(); if (f < a || f >= b) return null;
  const o = Math.min(ease(f, a, a + 6), 1 - ease(f, b - 8, b)) * strength;
  const N = 46;
  return (
    <AbsoluteFill style={{ opacity: o, pointerEvents: 'none' }}>
      <svg width={1080} height={1920}>
        {Array.from({ length: N }, (_, i) => {
          const ang = (i / N) * Math.PI * 2 + random(`a${i}`) * 0.1;
          const flick = random(`s${i}-${Math.floor(f / 2)}`);
          if (flick < 0.35) return null;
          const r0 = 520 + random(`r${i}-${Math.floor(f / 2)}`) * 260, r1 = 1500;
          const w = 3 + random(`w${i}`) * 10;
          const x0 = cx + Math.cos(ang) * r0, y0 = cy + Math.sin(ang) * r0, x1 = cx + Math.cos(ang) * r1, y1 = cy + Math.sin(ang) * r1;
          const nx = -Math.sin(ang) * w, ny = Math.cos(ang) * w;
          return <polygon key={i} points={`${x0},${y0} ${x1 + nx},${y1 + ny} ${x1 - nx},${y1 - ny}`} fill="#fff" opacity={0.55 * flick} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ dust / bokeh drift
export const Dust: React.FC<{ a: number; b: number; color?: string; n?: number }> = ({ a, b, color = '255,200,140', n = 40 }) => {
  const f = useCurrentFrame(); if (f < a || f >= b) return null;
  const o = Math.min(ease(f, a, a + 10), 1 - ease(f, b - 10, b));
  return (
    <AbsoluteFill style={{ opacity: o, mixBlendMode: 'screen', pointerEvents: 'none' }}>
      {Array.from({ length: n }, (_, i) => {
        const x = (random(`x${i}`) * 1180 + f * (0.4 + random(`v${i}`) * 1.4)) % 1180 - 50;
        const y = (random(`y${i}`) * 2000 - f * (0.6 + random(`u${i}`))) % 2000;
        const r = 3 + random(`r${i}`) * 16; const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / 9 + i));
        return <div key={i} style={{ position: 'absolute', left: x, top: (y + 2000) % 2000, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle, rgba(${color},${0.7 * tw}), transparent 70%)`, filter: r > 12 ? 'blur(2px)' : undefined }} />;
      })}
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ flash frame (white / red) on hard beats
export const Flash: React.FC<{ at: number; color?: string; dur?: number; max?: number }> = ({ at, color = '#fff', dur = 6, max = 0.7 }) => {
  const f = useCurrentFrame(); const l = f - at; if (l < 0 || l > dur) return null;
  return <AbsoluteFill style={{ background: color, opacity: max * (1 - l / dur), mixBlendMode: color === '#fff' ? 'screen' : 'normal', pointerEvents: 'none' }} />;
};

/** beat zoom on keywords: returns extra scale for the footage */
export const pulseAt = (f: number, beats: number[], amt = 0.055) => {
  let s = 0;
  for (const b of beats) { const l = f - b; if (l >= -2 && l < 18) s = Math.max(s, l < 0 ? amt * (1 + l / 2) * 0.4 : amt * Math.exp(-l / 5)); }
  return s;
};
