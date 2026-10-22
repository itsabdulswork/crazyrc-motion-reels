import React from 'react';
import { AbsoluteFill, OffthreadVideo, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing } from 'remotion';
import { SEGS, Seg, Hook, BRAND, cue } from './timeline';
import { pulseAt } from './FX';
import { FONT, ease, pop } from './ui';

const GRADE: React.CSSProperties = { filter: 'contrast(1.09) saturate(1.16) brightness(1.03)' };
const ORIGIN = '50% 24%';   // punch-ins centre on the presenter's face

const HookTitle: React.FC<{ f: number; behind: boolean; hook: Hook; last: number }> = ({ f, behind, hook, last }) => {
  const slam = pop(f, 0, { damping: 13, stiffness: 140, mass: 0.7 });
  const s = interpolate(slam, [0, 1], [2.4, 1]) * interpolate(f, [26, last], [1, 0.93], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const o = interpolate(f, [0, 3], [0, 1], { extrapolateRight: 'clamp' });
  const tag = ease(f, 4, 14);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: behind ? 170 : 150, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: o,
      transform: hook.mode === 'badge' ? `translateY(${-70 * ease(f, 20, 34, 0, 1, Easing.inOut(Easing.cubic))}px) scale(${s * (1 - 0.6 * ease(f, 20, 34, 0, 1, Easing.inOut(Easing.cubic)))})` : `scale(${s})`,
      transformOrigin: '50% 0%' }}>
      <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, letterSpacing: '0.42em', color: '#fff', background: BRAND.red, padding: '8px 18px 8px 30px', borderRadius: 10, transform: `translateY(${(1 - tag) * 30}px)`, opacity: tag, marginBottom: 6 }}>{hook.tag}</div>
      <div style={{
        fontFamily: FONT, fontWeight: 700, fontSize: hook.size, lineHeight: 0.9, textAlign: 'center', whiteSpace: 'pre', letterSpacing: '-0.02em', color: '#fff',
        filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.5))',
        backgroundImage: 'linear-gradient(180deg,#ffffff 30%,#ffd6d0 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{hook.title.replace(' ', '\n')}</div>
    </div>
  );
};

const SegmentView: React.FC<{ seg: Seg }> = ({ seg }) => {
  const f = useCurrentFrame();
  const [z0, z1] = seg.zoom;
  // punch-in snaps on the cut, then drifts slowly
  const z = interpolate(f, [0, seg.dur], [z0, z1], { easing: Easing.inOut(Easing.quad) });
  const whip = seg.idx === 0 ? 0 : interpolate(f, [0, 5], [1, 0], { extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const dir = seg.idx % 2 ? 1 : -1;
  const hook = seg.hook;
  const last = seg.dur - 1;
  const frameNo = String(Math.min(last, f)).padStart(3, '0');
  return (
    <AbsoluteFill style={{ transform: `translateY(${whip * dir * 70}px) scale(${z + whip * 0.06})`, transformOrigin: ORIGIN, filter: whip > 0.02 ? `blur(${whip * 10}px)` : undefined }}>
      {hook ? (
        <>
          <Img src={staticFile(`${hook.dir}/f${frameNo}.png`)} style={{ width: 1080, height: 1920, ...GRADE }} />
          {f >= 24 && hook.mode !== 'badge' && <HookTitle f={f} behind hook={hook} last={last} />}
          <Img src={staticFile(`${hook.dir}m/m${frameNo}.png`)} style={{ position: 'absolute', inset: 0, width: 1080, height: 1920, ...GRADE, opacity: f >= 24 && hook.mode !== 'badge' ? 1 : 0, filter: `${GRADE.filter} drop-shadow(0 0 26px rgba(255,42,42,0.55))` }} />
          {(f < 24 || hook.mode === 'badge') && <HookTitle f={f} behind={false} hook={hook} last={last} />}
        </>
      ) : (
        <OffthreadVideo src={staticFile('footage.mp4')} trimBefore={seg.srcFrom} muted style={{ width: 1080, height: 1920, objectFit: 'cover', ...GRADE }} />
      )}
    </AbsoluteFill>
  );
};

const BEATS = (['c8819', 'speed', 'four', 'suspension', 'tyres', 'damage', 'free', 'fix', 'price', 'offer', 'url'] as const).map(k => cue(k));
export const FootageTrack: React.FC = () => {
  const g = useCurrentFrame();
  return (
  <AbsoluteFill style={{ backgroundColor: '#000', transform: `scale(${1 + pulseAt(g, BEATS)})`, transformOrigin: '50% 28%' }}>
    {SEGS.map(seg => (
      <Sequence key={seg.idx} from={seg.from} durationInFrames={seg.dur} layout="none">
        <AbsoluteFill><SegmentView seg={seg} /></AbsoluteFill>
      </Sequence>
    ))}
  </AbsoluteFill>
  );
};

/** filmic finish: warm/teal split, vignette, animated grain */
export const Finish: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(255,120,60,0.06), rgba(0,90,110,0.07))', mixBlendMode: 'soft-light' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 75% 60% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.42) 100%)' }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile('img/grain.png')})`, backgroundPosition: `${(f * 137) % 512}px ${(f * 263) % 512}px`, opacity: 0.07, mixBlendMode: 'overlay' }} />
    </AbsoluteFill>
  );
};
