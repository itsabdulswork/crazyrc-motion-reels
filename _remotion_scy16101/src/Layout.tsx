import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useCurrentFrame, interpolate, spring, Easing } from 'remotion';
import edit from './edit.json';
import { SEGS, FPS, SPEECH_END, src2edit, BRAND } from './timeline';
import { FONT } from './ui';

export const PAPER = '#EFEDE7', INK = '#111113';
export type L = { x: number; y: number; w: number; h: number; r: number; fx: number; fy: number; k: number };
export const LAYOUTS: Record<string, L> = {
  FULL: { x: 0, y: 0, w: 1080, h: 1920, r: 0, fx: 540, fy: 960, k: 1 },
  TOP: { x: 40, y: 150, w: 1000, h: 1160, r: 40, fx: 540, fy: 700, k: 1 },
  BOTTOM: { x: 40, y: 730, w: 1000, h: 1150, r: 40, fx: 540, fy: 650, k: 1 },
  SPLIT: { x: 40, y: 150, w: 500, h: 1130, r: 40, fx: 545, fy: 620, k: 1.08 },
  CIRCLE: { x: 60, y: 150, w: 330, h: 330, r: 165, fx: 545, fy: 330, k: 0.62 },
};

// layout keyframes: one per segment start + extra cue-driven changes
export const KEYS = [
  ...SEGS.map(s => ({ f: s.from, name: (edit.segments[s.idx] as any).layout as string })),
  ...edit.keys.map(k => ({ f: src2edit(k.t), name: k.layout })),
].sort((a, b) => a.f - b.f);

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const layoutAt = (f: number): { L: L; name: string; p: number } => {
  let i = 0;
  for (let j = 0; j < KEYS.length; j++) if (KEYS[j].f <= f) i = j;
  const cur = LAYOUTS[KEYS[i].name], prev = LAYOUTS[KEYS[Math.max(0, i - 1)].name];
  const p = i === 0 ? 1 : spring({ frame: f - KEYS[i].f, fps: FPS, config: { damping: 17, stiffness: 150, mass: 0.8 } });
  const L = Object.fromEntries(Object.keys(cur).map(k => [k, lerp((prev as any)[k], (cur as any)[k], p)])) as L;
  return { L, name: KEYS[i].name, p };
};

// ------------------------------------------------------------------ paper stage
export const Paper: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: PAPER }}>
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px)', backgroundSize: '90px 90px', backgroundPosition: '40px 30px' }} />
      <div style={{ position: 'absolute', left: -200, top: 1520, whiteSpace: 'nowrap', fontFamily: FONT, fontWeight: 700, fontSize: 300, color: 'transparent', WebkitTextStroke: '2px rgba(0,0,0,0.07)', transform: `translateX(${-(f * 2.2) % 1900}px)` }}>
        SCY 16101 · MONSTER · 4WD · SCY 16101 · MONSTER · 4WD ·</div>
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile('img/grain.png')})`, backgroundPosition: `${(f * 137) % 512}px ${(f * 263) % 512}px`, opacity: 0.06, mixBlendMode: 'multiply' }} />
    </AbsoluteFill>
  );
};

// ------------------------------------------------------------------ the moving video window
const GRADE = 'contrast(1.08) saturate(1.1) brightness(1.03)';
export const VideoWindow: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= SPEECH_END) return null;
  const { L } = layoutAt(f);
  const seg = SEGS.find(s => f >= s.from && f < s.from + s.dur)!;
  const drift = interpolate(f - seg.from, [0, seg.dur], [seg.zoom[0], seg.zoom[1]], { easing: Easing.inOut(Easing.quad) });
  const k = L.k * drift;
  const shadow = L.w < 1070 ? '0 30px 70px rgba(0,0,0,0.28), 0 0 0 3px #111113' : 'none';
  return (
    <div style={{ position: 'absolute', left: L.x, top: L.y, width: L.w, height: L.h, borderRadius: L.r, overflow: 'hidden', boxShadow: shadow, background: '#000' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920, transformOrigin: '0 0', transform: `translate(${L.w / 2 - L.fx * k}px, ${L.h / 2 - L.fy * k}px) scale(${k})` }}>
        {SEGS.map(s => (
          <Sequence key={s.idx} from={s.from} durationInFrames={s.dur} layout="none">
            <OffthreadVideo src={staticFile('footage.mp4')} trimBefore={s.srcFrom} muted style={{ position: 'absolute', width: 1080, height: 1920, filter: GRADE }} />
          </Sequence>
        ))}
      </div>
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 65% at 50% 42%, transparent 55%, rgba(0,0,0,0.35))' }} />
    </div>
  );
};

// ------------------------------------------------------------------ editorial header (auto-contrast)
export const Header: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= SPEECH_END) return null;
  const seg = SEGS.find(s => f >= s.from && f < s.from + s.dur)!;
  const label = (edit.segments[seg.idx] as any).label as string;
  const sw = spring({ frame: f - seg.from, fps: FPS, config: { damping: 16, stiffness: 220 } });
  return (
    <AbsoluteFill style={{ mixBlendMode: 'difference', pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: 44, top: 52, fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '0.18em', color: '#fff' }}>CRAZYRC®</div>
      <div style={{ position: 'absolute', left: 44, top: 92, fontFamily: FONT, fontWeight: 600, fontSize: 18, letterSpacing: '0.3em', color: '#fff', opacity: 0.8 }}>REVIEW N°06 — SCY 16101</div>
      <div style={{ position: 'absolute', right: 44, top: 52, textAlign: 'right', fontFamily: FONT, fontWeight: 700, color: '#fff' }}>
        <div style={{ fontSize: 30, letterSpacing: '0.08em' }}>{String(seg.idx + 1).padStart(2, '0')}<span style={{ opacity: 0.5 }}>/{String(SEGS.length).padStart(2, '0')}</span></div>
        <div style={{ fontSize: 18, letterSpacing: '0.3em', marginTop: 6, transform: `translateY(${(1 - sw) * 14}px)`, opacity: sw }}>{label}</div>
      </div>
      <div style={{ position: 'absolute', left: 44, right: 44, top: 132, height: 2, background: '#fff', opacity: 0.6, transformOrigin: 'left', transform: `scaleX(${f / SPEECH_END})` }} />
    </AbsoluteFill>
  );
};

/** black tab stuck to the window corner: "● REC  03 — SCALE" */
export const WindowTab: React.FC = () => {
  const f = useCurrentFrame();
  if (f >= SPEECH_END) return null;
  const { L, name } = layoutAt(f);
  if (name === 'FULL' || L.w > 1060) return null;
  const blink = Math.floor(f / 15) % 2 === 0;
  const circle = name === 'CIRCLE';
  return (
    <div style={{ position: 'absolute', left: L.x + (circle ? L.w * 0.5 - 70 : 22), top: L.y + (circle ? L.h - 14 : 22), display: 'flex', alignItems: 'center', gap: 10, background: INK, color: '#fff', padding: '8px 14px', borderRadius: 8, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: '0.2em' }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, background: blink ? BRAND.hot : '#550000' }} />LIVE
    </div>
  );
};
