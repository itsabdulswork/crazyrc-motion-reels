import edit from './edit.json';

export const FPS = edit.fps;
export type Hook = { tag: string; title: string; size: number; dir: string; mode?: 'badge' | 'behind' };
export type Seg = { s: number; e: number; zoom: number[]; cap: string; hook?: Hook; from: number; dur: number; srcFrom: number; idx: number };

// Frame-accurate edited timeline: each source range becomes a back-to-back sequence.
let cursor = 0;
export const SEGS: Seg[] = edit.segments.map((g, idx) => {
  const srcFrom = Math.round(g.s * FPS);
  const dur = Math.round(g.e * FPS) - srcFrom;
  const seg = { ...(g as any), from: cursor, dur, srcFrom, idx } as Seg;
  cursor += dur;
  return seg;
});
export const SPEECH_END = cursor;
export const END_CARD = Math.round(edit.endCard * FPS);
export const TOTAL = SPEECH_END + END_CARD;
export const segAt = (f: number) => SEGS.find(s => f >= s.from && f < s.from + s.dur);
/** edited frame for a moment `p` (0..1) through segment i */
export const at = (i: number, p = 0) => SEGS[i].from + Math.round(SEGS[i].dur * p);
export const end = (i: number) => SEGS[i].from + SEGS[i].dur;
/** source-time (seconds) -> edited frame; times inside a removed pause snap to the next segment */
export const src2edit = (t: number) => {
  const sf = Math.round(t * FPS);
  for (const s of SEGS) {
    if (sf < s.srcFrom) return s.from;
    if (sf < s.srcFrom + s.dur) return s.from + (sf - s.srcFrom);
  }
  return SPEECH_END;
};
export const CUES = edit.cues as Record<string, number>;
/** edited frame of a spoken keyword */
export const cue = (k: keyof typeof edit.cues) => src2edit(CUES[k]);

export const BRAND = { red: '#DB0000', hot: '#FF2A2A', ink: '#141416', gold: '#FFC23A', paper: '#F7F7F7', green: '#1A8F3C', olive: '#4B5A3A' };
