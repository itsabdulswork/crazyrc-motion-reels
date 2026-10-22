import edit from './edit.json';

export const FPS = edit.fps;
export type Seg = { s: number; e: number; zoom: number[]; cap: string; from: number; dur: number; srcFrom: number; idx: number };

// Frame-accurate edited timeline: each source range becomes a back-to-back sequence.
let cursor = 0;
export const SEGS: Seg[] = edit.segments.map((g, idx) => {
  const srcFrom = Math.round(g.s * FPS);
  const dur = Math.round(g.e * FPS) - srcFrom;
  const seg = { ...g, from: cursor, dur, srcFrom, idx };
  cursor += dur;
  return seg;
});
export const SPEECH_END = cursor;
export const END_CARD = Math.round(edit.endCard * FPS);
export const TOTAL = SPEECH_END + END_CARD;
export const segAt = (f: number) => SEGS.find(s => f >= s.from && f < s.from + s.dur);
/** edited frame for a moment `p` (0..1) through segment i */
export const at = (i: number, p = 0) => SEGS[i].from + Math.round(SEGS[i].dur * p);

export const BRAND = { red: '#DB0000', hot: '#FF2A2A', ink: '#141416', gold: '#FFC23A', paper: '#F7F7F7', green: '#1A8F3C' };
