import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import edit from './edit.json';
import { src2edit, segAt, BRAND } from './timeline';
import { FONT, pop } from './ui';

type Word = { t: string; hot: boolean };
type Chunk = { words: Word[]; a: number; b: number; last: boolean };

// Word-synced captions: each chunk starts on the frame its first word is spoken.
const parse = (text: string): Word[] => {
  const out: Word[] = []; let hot = false;
  text.split(' ').forEach(raw => {
    if (raw.startsWith('*')) hot = true;
    out.push({ t: raw.replace(/\*/g, ''), hot });
    if (raw.endsWith('*') || raw.endsWith('*?')) hot = false;
  });
  return out;
};
const CHUNKS: Chunk[] = (() => {
  const list = edit.caps.map(c => ({ words: parse(c.text), a: src2edit(c.t) }));
  return list.map((c, i) => {
    const seg = segAt(c.a)!; const segEnd = seg.from + seg.dur;
    const next = list[i + 1]?.a ?? Infinity;
    const b = Math.min(next, segEnd);
    return { ...c, b, last: b === segEnd };
  });
})();

export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const ch = CHUNKS.find(c => f >= c.a && f < c.b);
  if (!ch) return null;
  const l = f - ch.a;
  const exit = ch.last ? interpolate(f, [ch.b - 4, ch.b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic) }) : 0;
  return (
    <AbsoluteFill style={{ alignItems: 'center', paddingTop: 1250 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '10px 20px', maxWidth: 980, opacity: 1 - exit, transform: `translateY(${exit * 30}px)` }}>
        {ch.words.map((w, i) => {
          const p = pop(l, i * 2, { damping: 12, stiffness: 320, mass: 0.45 });
          const base: React.CSSProperties = {
            fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase', display: 'inline-block', lineHeight: 1.08,
            opacity: l >= i * 2 ? 1 : 0, transform: `translateY(${(1 - p) * 34}px) scale(${0.6 + 0.4 * p})`,
          };
          if (!w.hot) return <span key={i} style={{ ...base, fontSize: 80, color: '#fff', WebkitTextStroke: '10px #0b0b0d', paintOrder: 'stroke fill', textShadow: '0 8px 22px rgba(0,0,0,0.55)' }}>{w.t}</span>;
          const box = pop(l, i * 2 + 1, { damping: 14, stiffness: 260, mass: 0.5 });
          return (
            <span key={i} style={{ ...base, position: 'relative', isolation: 'isolate', fontSize: 86, color: '#fff', padding: '2px 18px 6px', textShadow: '0 3px 0 rgba(0,0,0,0.25)' }}>
              <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${BRAND.hot}, ${BRAND.red})`, borderRadius: 16, transform: `scaleX(${box}) rotate(-2deg)`, transformOrigin: 'left center', boxShadow: '0 12px 30px rgba(219,0,0,0.45)', zIndex: -1 }} />
              <span style={{ position: 'relative' }}>{w.t}</span>
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
