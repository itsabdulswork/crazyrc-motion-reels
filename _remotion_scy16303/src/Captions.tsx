import React from 'react';
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from 'remotion';
import edit from './edit.json';
import { src2edit, segAt, BRAND } from './timeline';
import { FONT } from './ui';
import { layoutAt } from './Layout';

type Word = { t: string; hot: boolean };
const parse = (text: string): Word[] => {
  const out: Word[] = []; let hot = false;
  text.split(' ').forEach(raw => {
    if (raw.startsWith('*')) hot = true;
    out.push({ t: raw.replace(/\*/g, ''), hot });
    if (raw.replace(/[?!.,]+$/, '').endsWith('*')) hot = false;
  });
  return out;
};
const CHUNKS = (() => {
  const list = edit.caps.map(c => ({ words: parse(c.text), a: src2edit(c.t) }));
  return list.map((c, i) => {
    const seg = segAt(c.a)!; const segEnd = seg.from + seg.dur;
    const b = Math.min(list[i + 1]?.a ?? Infinity, segEnd);
    return { ...c, b, last: b === segEnd };
  });
})();

// Editorial captions: each word is its own ink block that wipes open left→right.
export const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const ch = CHUNKS.find(c => f >= c.a && f < c.b);
  if (!ch) return null;
  const { L, name } = layoutAt(f);
  if (name === 'CIRCLE') return null;
  const narrow = name === 'SPLIT';
  const size = narrow ? 50 : name === 'FULL' ? 72 : 64;
  const y = name === 'FULL' ? 1250 : L.y + L.h - (narrow ? 230 : 170);
  const l = f - ch.a;
  const exit = ch.last ? interpolate(f, [ch.b - 4, ch.b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 0;
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', left: L.x + 30, width: L.w - 60, top: y, display: 'flex', flexWrap: 'wrap', justifyContent: narrow ? 'flex-start' : 'center', gap: 8, opacity: 1 - exit }}>
        {ch.words.map((w, i) => {
          const p = interpolate(l, [i * 2, i * 2 + 5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
          return (
            <div key={i} style={{ position: 'relative', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, background: w.hot ? BRAND.red : '#111113', padding: `2px ${size * 0.22}px 6px`, transform: `translateY(${(1 - p) * 10}px)` }}>
              <span style={{ fontFamily: FONT, fontWeight: 700, fontSize: size, lineHeight: 1.05, color: '#fff', letterSpacing: '-0.005em', textTransform: 'uppercase' }}>{w.t}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
