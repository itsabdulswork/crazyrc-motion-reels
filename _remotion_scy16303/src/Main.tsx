import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing, random, spring } from 'remotion';
import { SPEECH_END, END_CARD, TOTAL, cue, FPS, BRAND } from './timeline';
import { Paper, VideoWindow, Header, WindowTab, INK, PAPER } from './Layout';
import { Graphics, Overlays } from './Graphics';
import { Captions } from './Captions';
import { FONT, clamp, ease } from './ui';

const SHAKES = [{ t: cue('bindas2'), a: 14 }, { t: cue('damage'), a: 22 }, { t: cue('offer'), a: 10 }, { t: cue('fourwd'), a: 8 }, { t: cue('km'), a: 10 }];
const shakeAt = (f: number) => {
  let x = 0, y = 0, r = 0;
  for (const s of SHAKES) { const l = f - s.t; if (l < 0 || l > 14) continue; const k = s.a * Math.exp(-l / 4); x += (random(`x${f}`) - 0.5) * k; y += (random(`y${f}`) - 0.5) * k; r += (random(`r${f}`) - 0.5) * k * 0.02; }
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
};

const SPECS = [['TOP SPEED', '35+ KM/H'], ['SCALE', '1:16 ON-ROAD DRIFT'], ['DRIVE', '4WD · 4 SUSPENSION'], ['BATTERY', '7.4V 1300 MAH'], ['RUN TIME', '15–20 MIN'], ['IN THE BOX', 'MULTIPLE TYRE SETS']];
const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = ease(f, 0, 12, 0, 1, Easing.inOut(Easing.cubic));
  const cars = ['blue', 'grey'];
  const ci = Math.min(1, Math.floor(f / 40)); const local = f - ci * 40;
  const pIn = spring({ frame: local, fps: FPS, config: { damping: 14, stiffness: 120 } });
  const pr = spring({ frame: f - 60, fps: FPS, config: { damping: 13, stiffness: 160 } });
  const cta = ease(f, 76, 88);
  return (
    <AbsoluteFill style={{ background: PAPER, clipPath: `inset(${(1 - wipe) * 100}% 0 0 0)` }}>
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.055) 1px, transparent 1px)', backgroundSize: '90px 90px', backgroundPosition: '40px 30px' }} />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 70, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Img src={staticFile('img/logo.png')} style={{ width: 300 }} />
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: '0.3em', color: INK, textAlign: 'right' }}>REVIEW N°05<br /><span style={{ color: BRAND.red }}>THE SPEC SHEET</span></div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 230, height: 4, background: INK, transformOrigin: 'left', transform: `scaleX(${ease(f, 4, 20)})` }} />
      <div style={{ position: 'absolute', left: 60, top: 260, overflow: 'hidden' }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, lineHeight: 0.95, color: INK, letterSpacing: '-0.03em', transform: `translateY(${(1 - ease(f, 6, 18, 0, 1, Easing.out(Easing.exp))) * 100}%)` }}>16303</div>
      </div>
      <div style={{ position: 'absolute', left: 64, top: 410, fontFamily: FONT, fontWeight: 700, fontSize: 30, letterSpacing: '0.2em', color: BRAND.red, opacity: ease(f, 10, 18) }}>SCY · HURRICANE DRIFT CAR</div>
      <div style={{ position: 'absolute', left: 40, right: 40, top: 470, height: 640 }}>
        <Img src={staticFile(`img/${cars[ci]}.png`)} style={{ position: 'absolute', left: 10, top: 170, width: 980, transform: `translateX(${(1 - pIn) * 700}px)`, opacity: clamp(pIn * 2), filter: 'drop-shadow(0 40px 30px rgba(0,0,0,0.25))' }} />
        <div style={{ position: 'absolute', right: 10, top: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['#1f2a4a', 'NAVY BLUE'], ['#5a5d63', 'GREY']].map(([c, n], i) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: '0.2em', color: INK, opacity: i === ci ? 1 : 0.35 }}>
              <div style={{ width: 22, height: 22, background: c, outline: i === ci ? `3px solid ${BRAND.red}` : 'none', outlineOffset: 3 }} />{n}</div>))}
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1130 }}>
        {SPECS.map(([k, v], i) => { const p = ease(f, 14 + i * 4, 24 + i * 4); return (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderTop: `2px solid ${INK}`, padding: '12px 0', opacity: p, transform: `translateX(${(1 - p) * 40}px)` }}>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: '0.26em', color: 'rgba(0,0,0,0.55)' }}>{k}</div>
            <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 30, color: INK }}>{v}</div>
          </div>); })}
        <div style={{ borderTop: `4px solid ${INK}` }} />
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1560, display: 'flex', alignItems: 'baseline', gap: 24, transform: `scale(${pr})`, transformOrigin: 'left' }}>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 56, color: 'rgba(0,0,0,0.4)', textDecoration: 'line-through', textDecorationColor: BRAND.red }}>₹11,499</div>
        <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 150, color: INK, lineHeight: 1, letterSpacing: '-0.03em' }}>₹9,999</div>
        <div style={{ marginLeft: 'auto', background: BRAND.gold, color: INK, fontFamily: FONT, fontWeight: 700, fontSize: 22, letterSpacing: '0.2em', padding: '8px 14px' }}>DIWALI</div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1760, display: 'flex', gap: 14, clipPath: `inset(0 ${(1 - cta) * 100}% 0 0)` }}>
        <div style={{ flex: 1, background: BRAND.red, color: '#fff', fontFamily: FONT, fontWeight: 700, fontSize: 40, padding: '18px 0', textAlign: 'center', letterSpacing: '0.08em' }}>CRAZYRC.IN</div>
        <div style={{ flex: 1, background: '#25D366', color: '#08260f', fontFamily: FONT, fontWeight: 700, fontSize: 30, padding: '24px 0', textAlign: 'center', letterSpacing: '0.08em' }}>ORDER ON WHATSAPP</div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1720, fontFamily: FONT, fontWeight: 700, fontSize: 18, letterSpacing: '0.24em', color: BRAND.red, opacity: cta }}>+ 6 MONTHS FREE REPAIR ON EVERY RC</div>
    </AbsoluteFill>
  );
};

export const Main: React.FC = () => {
  const f = useCurrentFrame();
  const fadeOut = interpolate(f, [TOTAL - 8, TOTAL], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <AbsoluteFill style={{ transform: shakeAt(f) }}>
        <Paper />
        <Graphics />
        <VideoWindow />
        <WindowTab />
        <Overlays />
        <Captions />
      </AbsoluteFill>
      <Header />
      <Sequence from={SPEECH_END} durationInFrames={END_CARD}><EndCard /></Sequence>
      <AbsoluteFill style={{ background: INK, opacity: fadeOut }} />
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
