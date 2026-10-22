import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate } from 'remotion';
import { SEGS, BRAND } from './timeline';
import { FONT, pop } from './ui';

type Word = { t: string; hot: boolean; w: number };
type Chunk = { words: Word[]; a: number; b: number };

// split "*hot words*" captions into ≤3-word chunks timed by character weight
function chunks(cap: string, from: number, dur: number): Chunk[] {
  const words: Word[] = []; let hot = false;
  cap.split(' ').forEach(raw => {
    const open = raw.startsWith('*'); if (open) hot = true;
    const t = raw.replace(/\*/g, ''); words.push({ t, hot, w: t.length + 2 });
    if (raw.endsWith('*') && !(open && raw.length === 1)) hot = false;
  });
  const groups: Word[][] = []; let g: Word[] = [];
  words.forEach(w => { if (g.length >= 3 || g.reduce((a, x) => a + x.t.length, 0) + w.t.length > 15) { groups.push(g); g = []; } g.push(w); });
  if (g.length) groups.push(g);
  const total = words.reduce((a, w) => a + w.w, 0);
  const lead = 2, usable = dur - lead - 3; let c = from + lead;
  return groups.map(gr => { const len = (gr.reduce((a, w) => a + w.w, 0) / total) * usable; const ch = { words: gr, a: Math.round(c), b: Math.round(c + len) }; c += len; return ch; });
}
const ALL = SEGS.flatMap(s => (s.cap ? chunks(s.cap, s.from, s.dur) : []));

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const ch = ALL.find(c => f >= c.a && f < c.b + (ALL[ALL.indexOf(c) + 1]?.a === c.b ? 0 : 6));
  if (!ch) return null;
  const local = f - ch.a; const len = ch.b - ch.a;
  const totalW = ch.words.reduce((a, w) => a + w.w, 0);
  let acc = 0;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'flex-start', paddingTop: 1255 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0 22px', maxWidth: 960, transform: `scale(${interpolate(pop(local, 0, { damping: 14, stiffness: 260, mass: 0.5 }), [0, 1], [0.82, 1])})` }}>
        {ch.words.map((w, i) => {
          const start = (acc / totalW) * len; acc += w.w;
          const on = local >= start;
          const p = pop(local, start, { damping: 11, stiffness: 300, mass: 0.45 });
          return (
            <span key={i} style={{
              fontFamily: FONT, fontWeight: 700, fontSize: w.hot ? 92 : 84, lineHeight: 1.12, textTransform: 'uppercase', letterSpacing: '0.01em',
              color: w.hot ? BRAND.hot : '#fff', opacity: on ? 1 : 0.0,
              transform: `translateY(${(1 - p) * 26}px) scale(${0.7 + 0.3 * p})`, display: 'inline-block',
              WebkitTextStroke: '10px #0b0b0d', paintOrder: 'stroke fill',
              textShadow: '0 8px 22px rgba(0,0,0,0.55)',
            }}>{w.t}</span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
