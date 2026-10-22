import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { SPEECH_END, END_CARD, TOTAL, at, BRAND } from './timeline';
import { FootageTrack, Finish } from './Footage';
import { Captions } from './Captions';
import { Panels } from './Panels';
import { FONT, Label, pop, ease, clamp, IconWhatsApp } from './ui';

const SHAKES = [{ t: at(6, 0.78), a: 26 }, { t: at(11, 0.2), a: 22 }, { t: at(10, 0.72), a: 10 }];
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
  const logo = pop(f, 4); const o1 = pop(f, 10); const o2 = pop(f, 14); const pr = pop(f, 22); const url = pop(f, 30);
  const rays = f * 0.6;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${wipe * 150}% at 50% 60%)`, background: 'radial-gradient(ellipse at 50% 40%, #3a0606 0%, #120203 55%, #050505 100%)' }}>
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${rays}deg at 50% 38%, rgba(255,42,42,0.10) 0deg 6deg, transparent 6deg 18deg)`, maskImage: 'radial-gradient(circle at 50% 38%, black 0%, transparent 65%)' }} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
        <Img src={staticFile('img/logo.png')} style={{ width: 560, transform: `scale(${interpolate(logo, [0, 1], [1.8, 1])})`, opacity: clamp(logo * 2) }} />
        <Label size={36} ls={0.3} style={{ marginTop: 30, opacity: clamp(o1 * 2) }}>JJRC C8801 · 1:18 4WD CRAWLER</Label>
        <div style={{ position: 'relative', width: 1080, height: 760, marginTop: 10 }}>
          <Img src={staticFile('img/orange.png')} style={{ position: 'absolute', width: 680, left: 40, top: 10, transform: `translateX(${(1 - o1) * -900}px)`, filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.6))' }} />
          <Img src={staticFile('img/green.png')} style={{ position: 'absolute', width: 560, right: 30, top: 330, transform: `translateX(${(1 - o2) * 900}px)`, filter: 'drop-shadow(0 30px 30px rgba(0,0,0,0.6))' }} />
          <div style={{ position: 'absolute', left: 90, top: 400, opacity: clamp(o1 * 2), fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.2em', color: '#fff', background: '#e2620f', padding: '8px 18px', borderRadius: 8 }}>ORANGE</div>
          <div style={{ position: 'absolute', right: 90, top: 300, opacity: clamp(o2 * 2), fontFamily: FONT, fontWeight: 700, fontSize: 26, letterSpacing: '0.2em', color: '#fff', background: '#3c5a3a', padding: '8px 18px', borderRadius: 8 }}>GREEN</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, transform: `scale(${pr})`, marginTop: 30 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 54, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', textDecorationColor: BRAND.hot }}>₹14,999</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 130, color: '#fff', lineHeight: 1 }}>₹12,500</div>
        </div>
        <div style={{ display: 'flex', gap: 16, marginTop: 18, opacity: clamp(pr * 2) }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: '#1a1206', background: BRAND.gold, padding: '10px 18px', borderRadius: 8 }}>DIWALI & DUSSEHRA OFFER</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: '#fff', background: BRAND.red, padding: '10px 18px', borderRadius: 8 }}>6 MONTHS FREE REPAIRS</div>
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
