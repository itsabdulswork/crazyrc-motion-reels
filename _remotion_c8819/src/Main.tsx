import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame, interpolate, Easing, random } from 'remotion';
import { SPEECH_END, END_CARD, TOTAL, cue, BRAND } from './timeline';
import { FootageTrack, Finish } from './Footage';
import { Captions } from './Captions';
import { Panels } from './Panels';
import { ChapterBar, LightLeak, Dust } from './FX';
import { FONT, Label, pop, ease, clamp, IconWhatsApp, IconWheel, IconBattery } from './ui';

const SHAKES = [{ t: cue('damage') + 2, a: 28 }, { t: cue('free'), a: 14 }, { t: cue('offer'), a: 12 }, { t: cue('tight') + 6, a: 8 }, { t: cue('speed'), a: 10 }];
const shakeAt = (f: number) => {
  let x = 0, y = 0, r = 0;
  for (const s of SHAKES) { const l = f - s.t; if (l < 0 || l > 14) continue; const k = s.a * Math.exp(-l / 4); x += (random(`x${f}`) - 0.5) * k; y += (random(`y${f}`) - 0.5) * k; r += (random(`r${f}`) - 0.5) * k * 0.02; }
  // "no matter how rough you drive" — handheld rumble
  const ra = cue('rough'), rb = cue('breaks') + 6;
  if (f >= ra && f < rb) { const k = 5 * Math.sin(Math.PI * (f - ra) / (rb - ra)); x += (random(`rx${f}`) - 0.5) * k * 2; y += (random(`ry${f}`) - 0.5) * k * 2; r += (random(`rr${f}`) - 0.5) * 0.4; }
  return `translate(${x}px, ${y}px) rotate(${r}deg)`;
};

const SpecIcon: React.FC<{ p: number; icon: React.ReactNode; v: string; l: string }> = ({ p, icon, v, l }) => (
  <div style={{ width: 220, height: 200, borderRadius: 24, background: 'linear-gradient(160deg, rgba(40,40,46,0.9), rgba(14,14,16,0.9))', border: '1.5px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - p) * 60}px) scale(${0.7 + 0.3 * p})`, opacity: clamp(p * 2) }}>
    {icon}<Label size={40} ls={0} style={{ marginTop: 4 }}>{v}</Label><Label size={18} ls={0.2} color="rgba(255,255,255,0.6)">{l}</Label>
  </div>
);

const EndCard: React.FC = () => {
  const f = useCurrentFrame();
  const wipe = ease(f, 0, 12, 0, 1, Easing.out(Easing.exp));
  const logo = pop(f, 4); const car = pop(f, 8, { damping: 13, stiffness: 120, mass: 0.8 }); const pr = pop(f, 46); const url = pop(f, 56);
  // colourway flip: grey -> yellow at frame 30
  const flip = ease(f, 26, 40, 0, 1, Easing.inOut(Easing.cubic));
  const showYellow = flip > 0.5; const ry = showYellow ? (1 - flip) * -180 : flip * 180;
  const rays = f * 0.6;
  return (
    <AbsoluteFill style={{ clipPath: `circle(${wipe * 150}% at 50% 55%)`, background: 'radial-gradient(ellipse at 50% 40%, #3a0606 0%, #120203 55%, #050505 100%)' }}>
      <AbsoluteFill style={{ background: `repeating-conic-gradient(from ${rays}deg at 50% 36%, rgba(255,42,42,0.10) 0deg 6deg, transparent 6deg 18deg)`, maskImage: 'radial-gradient(circle at 50% 36%, black 0%, transparent 65%)' }} />
      <Dust a={0} b={END_CARD + 10} color="255,90,60" n={34} />
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 300 }}>
        <Img src={staticFile('img/logo.png')} style={{ width: 520, transform: `scale(${interpolate(logo, [0, 1], [1.8, 1])})`, opacity: clamp(logo * 2) }} />
        <Label size={34} ls={0.3} style={{ marginTop: 22, opacity: clamp(car * 2) }}>JJRC C8819 · 4WD OFF-ROAD</Label>
        <div style={{ position: 'relative', width: 1080, height: 520, display: 'flex', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', bottom: 40, width: 760, height: 70, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(255,42,42,0.45), transparent 70%)', filter: 'blur(4px)' }} />
          <Img src={staticFile(showYellow ? 'img/yellow.png' : 'img/grey.png')} style={{ position: 'absolute', top: 40, width: 860, transform: `translateX(${(1 - car) * -1100}px) perspective(1600px) rotateY(${ry}deg)`, filter: 'drop-shadow(0 34px 30px rgba(0,0,0,0.65))' }} />
          <div style={{ position: 'absolute', left: 90, top: 30, display: 'flex', gap: 10, opacity: clamp(car * 2) }}>
            {[['GREY', '#5b5f66', 0], ['YELLOW', '#e8a417', 1]].map(([n, c, i]) => (
              <div key={n as string} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT, fontWeight: 700, fontSize: 20, letterSpacing: '0.18em', color: '#fff', padding: '6px 14px', borderRadius: 20, border: `2px solid ${(i === 1) === showYellow ? '#fff' : 'rgba(255,255,255,0.2)'}` }}>
                <div style={{ width: 16, height: 16, borderRadius: 8, background: c as string }} />{n}</div>))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 18, marginTop: -6 }}>
          <SpecIcon p={pop(f, 30)} v="35" l="KM/H" icon={<svg width={70} height={56} viewBox="0 0 70 56"><path d="M6 50 A30 30 0 1 1 64 50" stroke="#fff" strokeWidth={6} fill="none" strokeLinecap="round" /><line x1="35" y1="44" x2="54" y2="22" stroke={BRAND.hot} strokeWidth={6} strokeLinecap="round" /></svg>} />
          <SpecIcon p={pop(f, 34)} v="4WD" l="OFF-ROAD" icon={<IconWheel rot={f * 8} size={62} />} />
          <SpecIcon p={pop(f, 38)} v="30" l="MIN RUN" icon={<IconBattery size={66} level={1} />} />
          <SpecIcon p={pop(f, 42)} v="1:20" l="SCALE" icon={<svg width={62} height={56} viewBox="0 0 62 56"><rect x="6" y="10" width="50" height="36" rx="6" stroke="#fff" strokeWidth={5} fill="none" /><path d="M6 46 L56 10" stroke={BRAND.hot} strokeWidth={5} /></svg>} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, transform: `scale(${pr})`, marginTop: 34 }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 54, color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', textDecorationColor: BRAND.hot }}>₹7,499</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 140, color: '#fff', lineHeight: 1, textShadow: '0 0 30px rgba(255,194,58,0.4)' }}>₹6,500</div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 16, opacity: clamp(pr * 2) }}>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: '#1a1206', background: BRAND.gold, padding: '10px 18px', borderRadius: 8 }}>DIWALI OFFER</div>
          <div style={{ fontFamily: FONT, fontWeight: 700, fontSize: 24, letterSpacing: '0.16em', color: '#fff', background: BRAND.red, padding: '10px 18px', borderRadius: 8 }}>6 MONTHS FREE REPAIR</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 34, transform: `translateY(${(1 - url) * 60}px)`, opacity: clamp(url * 2) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#25D366', borderRadius: 40, padding: '14px 30px' }}><IconWhatsApp size={46} /><Label size={32} ls={0.06} color="#08260f">ORDER ON WHATSAPP</Label></div>
          <Label size={44} ls={0.1}>CRAZYRC.IN</Label>
        </div>
      </AbsoluteFill>
      <LightLeak at={0} hue="red" dur={20} />
      <LightLeak at={28} hue="gold" dur={14} dir={-1} />
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
      <ChapterBar />
      <Sequence from={SPEECH_END} durationInFrames={END_CARD}><EndCard /></Sequence>
      <AbsoluteFill style={{ background: '#000', opacity: fadeOut }} />
      <Audio src={staticFile('mix.wav')} />
    </AbsoluteFill>
  );
};
