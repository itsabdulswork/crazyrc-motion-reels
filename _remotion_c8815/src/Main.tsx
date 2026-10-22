import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { SPEECH_END, END_CARD, TOTAL, cue, BRAND } from './timeline';
import { FootageTrack, Finish } from './Footage';
import { Captions } from './Captions';
import { Panels } from './Panels';
import { FONT, Label, pop, ease, clamp, IconWhatsApp } from './ui';

const SHAKES = [{ t: cue('damage') + 2, a: 26 }, { t: cue('offer'), a: 12 }, { t: cue('military'), a: 8 }];
const shakeAt = (f: number) => {
  let x = 0, y = 0, r = 0;
  for (const s of SHAKES) { const l = f - s.t; if (l < 0 || l > 14) continue; const k = s.a * Math.exp(-l / 4); x += (random(`x${f}`) - 0.5) * k; y += (random(`y${f}`) - 0.5) * k; r += (random(`r${f}`) - 0.5) * k * 0.02; }
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
};

const Watermark: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ opacity: interpolate(f, [60, 75], [0, 0.9], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
      <Img src={staticFile('img/logo.png')} style={{ position: 'absolute', right: 40, top: 70, width: 210, filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.5))' }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 8, width: `${(f / SPEECH_END) * 100}%`, background: BRAND.hot }} />
    </AbsoluteFill>
  );
};

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = ease(f, 0, 10, 0, 1, Easing.out(Easing.exp));
  const logo = pop(f, 4); const car = pop(f, 10, { damping: 13, stiffness: 120, mass: 0.8 }); const pr = pop(f, 22); const url = pop(f, 32);
  const rays = f * 0.6;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${wipe * 150}% at 50% 60%)`, background: 'radial-gradient(ellipse at 50% 42%, #2c3320 0%, #120f08 55%, #050505 100%)' }}>
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${rays}deg at 50% 44%, rgba(255,194,58,0.08) 0deg 6deg, transparent 6deg 18deg)`, maskImage: 'radial-gradient(circle at 50% 44%, black 0%, transparent 65%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
        <Img src={staticFile('img/logo.png')} style={{ width: 560, transform: `scale(${interpolate(logo, [0, 1], [1.8, 1])})`, opacity: clamp(logo * 2) }} />
        <Label size={34} ls={0.26} style={{ marginTop: 30, opacity: clamp(car * 2) }}>JJRC C8815 · WILLYS MILITARY TRUCK</Label>
        <div style={{ position: 'relative', width: 1080, height: 600, marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', bottom: 40, width: 760, height: 60, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(0,0,0,0.7), transparent 70%)' }} />
          <Img src={staticFile('img/willys.png')} style={{ position: 'absolute', top: 20, width: 960, transform: `translateX(${(1 - car) * -1100}px) rotate(${(1 - car) * -4}deg)`, filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.6))' }} />
          <div style={{ position: 'absolute', left: 70, top: 0, opacity: clamp(car * 2), fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.2em', color: '#1a1206', background: '#b9c78f', padding: '8px 18px', borderRadius: 8 }}>1:12 · 4WD · RTR</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, transform: `scale(${pr})`, marginTop: 10 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 54, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', textDecorationColor: BRAND.hot }}>₹8,999</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 140, color: '#fff', lineHeight: 1 }}>₹7,999</div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 20, maxWidth: 960, opacity: clamp(pr * 2) }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: '#1a1206', background: BRAND.gold, padding: '10px 18px', borderRadius: 8 }}>DIWALI OFFER</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: '#fff', background: BRAND.red, padding: '10px 18px', borderRadius: 8 }}>6 MONTHS FREE REPAIRS</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: '#1a1206', background: '#b9c78f', padding: '10px 18px', borderRadius: 8 }}>+ WINCH + TARPAULIN</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 40, transform: `translateY(${(1 - url) * 60}px)`, opacity: clamp(url * 2) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#25D366', borderRadius: 40, padding: '14px 30px' }}><IconWhatsApp size={46} /><Label size={32} ls={0.06} color="#08260f">ORDER ON WHATSAPP</Label></div>
          <Label size={44} ls={0.1}>CRAZYRC.IN</Label>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  const fadeOut = interpolate(f, [TOTAL - 8, TOTAL], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      <AbsoluteFill style={{ transform: shakeAt(f) }}>
        <FootageTrack />
        <Finish />
        <Panels />
        <Captions />
      </AbsoluteFill>
      <Sequence durationInFrames={SPEECH_END}><Watermark /></Sequence>
      <Sequence from={SPEECH_END} durationInFrames={END_CARD}><EndCard /></Sequence>
      <AbsoluteFill style={{ background: '#000', opacity: fadeOut }} />
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
