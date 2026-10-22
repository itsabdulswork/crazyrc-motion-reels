import React from 'react';
import { interpolate, spring, Easing } from 'remotion';
import { BRAND, FPS } from './timeline';

export const FONT = "'Bai Jamjuree', sans-serif";
export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const pop = (f: number, delay = 0, cfg = { damping: 12, stiffness: 180, mass: 0.6 }) => spring({ frame: f - delay, fps: FPS, config: cfg });
export const ease = (f: number, a: number, b: number, from = 0, to = 1, fn = Easing.out(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: fn });

/** dark glass card used by every panel */
export const Glass: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; accent?: string }> = ({ style, children, accent = BRAND.hot }) => (
  <div style={{
    background: 'linear-gradient(160deg, rgba(24,24,28,0.92), rgba(10,10,12,0.88))',
    border: '2px solid rgba(255,255,255,0.10)', borderRadius: 34, boxShadow: `0 30px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 0 1px rgba(0,0,0,0.4)`,
    backdropFilter: 'blur(14px)', position: 'relative', overflow: 'hidden', ...style,
  }}>
    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: accent }} />
    {children}
  </div>
);

export const Label: React.FC<{ children: React.ReactNode; size?: number; color?: string; ls?: number; weight?: number; style?: React.CSSProperties }> =
  ({ children, size = 30, color = '#fff', ls = 0.12, weight = 700, style }) => (
    <div style={{ fontFamily: FONT, fontWeight: weight, fontSize: size, letterSpacing: `${ls}em`, color, textTransform: 'uppercase', lineHeight: 1.05, ...style }}>{children}</div>
  );

// ------------------------------------------------------------------ icons (stroke SVG, animated by props)
const S = { fill: 'none', stroke: '#fff', strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
export const IconWheel: React.FC<{ rot?: number; size?: number }> = ({ rot = 0, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g transform={`rotate(${rot} 60 60)`} {...S}>
    <circle cx="60" cy="60" r="44" /><circle cx="60" cy="60" r="10" fill={BRAND.hot} stroke="none" />
    <path d="M16 60 H50 M70 60 H104 M60 70 V104" /></g></svg>
);
export const IconTrigger: React.FC<{ pull?: number; size?: number }> = ({ pull = 0, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}>
    <path d="M30 20 H86 a10 10 0 0 1 10 10 V52 H30 Z" /><path d="M46 52 L40 104 H66 L70 52" />
    <path d={`M74 58 q${12 - pull * 8} 12 ${2 - pull * 6} 26`} stroke={BRAND.hot} /></g></svg>
);
export const IconGauge: React.FC<{ level?: number; size?: number }> = ({ level = 0, size = 120 }) => {
  const a = -120 + level * 120; const r = (a * Math.PI) / 180;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}>
      <path d="M18 84 A44 44 0 1 1 102 84" />
      {[0, 1, 2].map(i => { const t = ((-120 + i * 120) * Math.PI) / 180; return <line key={i} x1={60 + Math.sin(t) * 34} y1={70 - Math.cos(t) * 34} x2={60 + Math.sin(t) * 42} y2={70 - Math.cos(t) * 42} stroke={i <= Math.round(level * 2) ? BRAND.hot : '#fff'} />; })}
      <line x1="60" y1="70" x2={60 + Math.sin(r) * 30} y2={70 - Math.cos(r) * 30} stroke={BRAND.hot} strokeWidth={8} />
      <circle cx="60" cy="70" r="7" fill="#fff" stroke="none" /></g></svg>
  );
};
export const IconSpring: React.FC<{ squash?: number; size?: number }> = ({ squash = 0, size = 120 }) => {
  const h = 70 - squash * 22; const top = 60 - h / 2; const n = 6; let d = `M60 ${top - 14} V${top}`;
  for (let i = 0; i < n; i++) { const y0 = top + (h / n) * i; d += ` L${i % 2 ? 38 : 82} ${y0 + h / n / 2} L60 ${y0 + h / n}`; }
  d += ` V${top + h + 14}`;
  return <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}><path d={d} stroke={BRAND.hot} /><path d={`M36 ${top - 14} H84 M36 ${top + h + 14} H84`} /></g></svg>;
};
export const IconAxle: React.FC<{ spin?: number; size?: number }> = ({ spin = 0, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}>
    <line x1="24" y1="60" x2="96" y2="60" strokeWidth={9} /><circle cx="60" cy="60" r="13" fill={BRAND.hot} stroke="none" />
    {[18, 102].map(x => <g key={x} transform={`rotate(${spin} ${x} 60)`}><rect x={x - 9} y="34" width="18" height="52" rx="6" /><line x1={x} y1="40" x2={x} y2="80" stroke={BRAND.hot} strokeWidth={4} /></g>)}</g></svg>
);
export const IconBulb: React.FC<{ glow?: number; size?: number }> = ({ glow = 0, size = 120 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}>
    {[0, 1, 2, 3, 4].map(i => { const a = (-150 + i * 30) * Math.PI / 180; return <line key={i} x1={60 + Math.cos(a) * 40} y1={56 + Math.sin(a) * 40} x2={60 + Math.cos(a) * (48 + glow * 8)} y2={56 + Math.sin(a) * (48 + glow * 8)} stroke={BRAND.gold} opacity={glow} />; })}
    <path d="M44 72 a26 26 0 1 1 32 0 V84 H44 Z" fill={`rgba(255,194,58,${0.25 + glow * 0.6})`} /><path d="M46 96 H74" /></g></svg>
);
export const IconShield: React.FC<{ size?: number; draw?: number }> = ({ size = 160, draw = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S} strokeWidth={6}>
    <path d="M60 10 L100 24 V56 C100 82 82 100 60 110 C38 100 20 82 20 56 V24 Z" fill="rgba(219,0,0,0.25)" stroke={BRAND.hot} strokeDasharray="330" strokeDashoffset={330 * (1 - draw)} />
    <path d="M42 58 L55 71 L80 45" strokeDasharray="60" strokeDashoffset={60 * (1 - clamp((draw - 0.5) * 2))} /></g></svg>
);
export const IconWhatsApp: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48"><circle cx="24" cy="24" r="20" fill="#fff" /><path d="M8 42 L12 31 L19 37 Z" fill="#fff" />
    <path d="M17 15 c-2 2 -2 6 2 11 c4 5 9 8 12 7 l2 -3 l-4 -3 l-2 2 c-2 -1 -5 -4 -6 -6 l2 -2 l-3 -4 Z" fill="#25D366" /></svg>
);

// ------------------------------------------------------------------ C8815 icons
export const IconShovel: React.FC<{ size?: number; dig?: number }> = ({ size = 120, dig = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S} transform={`rotate(${-20 + dig * 18} 60 60)`}>
    <path d="M60 14 V70" /><path d="M48 14 H72" /><path d="M42 70 H78 L74 96 Q60 112 46 96 Z" fill="rgba(255,42,42,0.25)" stroke={BRAND.hot} /></g></svg>
);
export const IconBattery: React.FC<{ size?: number; level?: number }> = ({ size = 120, level = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}>
    <rect x="16" y="36" width="80" height="48" rx="10" /><path d="M104 52 V68" strokeWidth={9} />
    <rect x="26" y="46" width={Math.max(0.001, 60 * level)} height="28" rx="4" fill={level > 0.25 ? '#3ddc6a' : BRAND.hot} stroke="none" />
    <path d="M58 40 L48 62 H62 L54 82" stroke="#fff" strokeWidth={5} opacity={level > 0.95 ? 1 : 0} /></g></svg>
);
export const IconWinch: React.FC<{ size?: number; pull?: number }> = ({ size = 120, pull = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}>
    <rect x="14" y="40" width="40" height="40" rx="8" /><circle cx="34" cy="60" r="10" fill={BRAND.hot} stroke="none" />
    <path d={`M54 60 H${92 - pull * 26}`} strokeDasharray="6 6" />
    <path d={`M${92 - pull * 26} 60 v14 a10 10 0 0 0 20 0 v-6`} stroke={BRAND.hot} /></g></svg>
);
export const IconTarp: React.FC<{ size?: number; cover?: number }> = ({ size = 120, cover = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S}>
    <path d="M14 88 H106" /><circle cx="34" cy="90" r="10" /><circle cx="86" cy="90" r="10" />
    <path d={`M22 80 V${78 - 40 * cover} Q60 ${30 - 36 * cover + 40} 98 ${78 - 40 * cover} V80`} fill="rgba(122,140,92,0.55)" stroke="#b9c78f" /></g></svg>
);
export const IconUpgrade: React.FC<{ size?: number; lift?: number }> = ({ size = 120, lift = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 120 120"><g {...S} transform={`translate(0 ${-lift * 8})`}>
    <path d="M60 18 L94 54 H74 V96 H46 V54 H26 Z" fill="rgba(255,194,58,0.25)" stroke={BRAND.gold} /></g></svg>
);
