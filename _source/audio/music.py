"""
Crazy RC showreel score — 120 BPM, F minor, 30 s, built to the edit.
1 bar = 2.0 s, 1 beat = 0.5 s, 1 sixteenth = 0.125 s.

Timeline (matches index.html scenes):
  0-2   intro: start-light beeps, riser, lights out -> DROP @2
  2-10  drop A (logo, hero car, categories)
  10-12 breakdown + build (brands)        -> impact @12
  12-20 drop B + lead arp (care plan, shipping)
  20-24 drive + build (lab / club / racing)
  24-26 half-time hits ("others sell..." / "we keep...")
  26-28 final drop (end card)            -> final hit @28, tail to 30
"""
import numpy as np, sys, os
from scipy import signal

SR = 44100
DUR = 30.0
N = int(SR * DUR)
BPM = 120
BEAT = 60 / BPM
S16 = BEAT / 4
rng = np.random.default_rng(7)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def buf(): return np.zeros((N, 2), np.float32)

def add(dst, sig, t, gain=1.0, pan=0.0):
    """mix mono/stereo sig into dst at time t (s)."""
    i = int(round(t * SR))
    if i >= N: return
    if sig.ndim == 1:
        l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
        sig = np.stack([sig * l * 1.414, sig * r * 1.414], 1)
    j = min(N, i + len(sig))
    if i < 0:
        sig = sig[-i:]; i = 0
    dst[i:j] += sig[: j - i] * gain

def env_exp(n, dec, att=0.002):
    t = np.arange(n) / SR
    a = np.minimum(1, t / max(att, 1e-5))
    return a * np.exp(-t / dec)

def polyblep_saw(freq, n, phase0=0.0):
    f = np.broadcast_to(np.asarray(freq, np.float64), (n,))
    dt = f / SR
    ph = (phase0 + np.cumsum(dt)) % 1.0
    s = 2 * ph - 1
    m = ph < dt
    x = ph[m] / dt[m]; s[m] -= x + x - x * x - 1
    m = ph > 1 - dt
    x = (ph[m] - 1) / dt[m]; s[m] -= x * x + x + x + 1
    return s.astype(np.float32)

def bq(x, kind, f, q=0.707, order=2):
    if kind == 'bp':
        b, a = signal.butter(order, [f[0] / (SR / 2), f[1] / (SR / 2)], 'band')
    else:
        b, a = signal.butter(order, f / (SR / 2), kind)
    return signal.lfilter(b, a, x, axis=0).astype(np.float32)

noise = lambda n: rng.standard_normal(n).astype(np.float32)

# ---------------------------------------------------------------- instruments
def kick(g=1.0):
    n = int(0.42 * SR); t = np.arange(n) / SR
    f = 46 + 120 * np.exp(-t * 32) + 40 * np.exp(-t * 300)
    ph = 2 * np.pi * np.cumsum(f) / SR
    body = np.sin(ph) * (np.exp(-t / 0.22) * np.minimum(1, t / 0.0015))
    click = bq(noise(n), 'highpass', 2500) * np.exp(-t / 0.004) * 0.5
    return np.tanh((body + click) * 1.8) * 0.9 * g

def clap():
    n = int(0.35 * SR); t = np.arange(n) / SR
    nz = bq(noise(n), 'bp', (900, 3200))
    e = np.zeros(n)
    for k, d in enumerate([0, 0.009, 0.018]):
        e += (t >= d) * np.exp(-(t - d).clip(0) / 0.006) * (0.8 if k < 2 else 1)
    e += (t >= 0.027) * np.exp(-(t - 0.027).clip(0) / 0.11) * 0.7
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) * 0.5
    snap = bq(noise(n), 'highpass', 5000) * np.exp(-t / 0.03) * 0.35
    return (nz * e + body + snap) * 0.55

def hat(open_=False, v=1.0):
    n = int((0.32 if open_ else 0.06) * SR); t = np.arange(n) / SR
    # metallic: sum of square-ish partials + noise
    m = sum(np.sign(np.sin(2 * np.pi * f * t)) for f in [3140, 4320, 5530, 6870, 8120, 9480]) / 6
    x = bq(m * 0.5 + noise(n) * 0.7, 'highpass', 7000)
    return x * np.exp(-t / (0.11 if open_ else 0.018)) * 0.22 * v

def crash(len_=1.8):
    n = int(len_ * SR); t = np.arange(n) / SR
    x = bq(noise(n), 'highpass', 4200) + 0.3 * bq(noise(n), 'bp', (2500, 7000))
    st = np.stack([x, bq(noise(n), 'highpass', 4200)], 1)
    return st * (np.exp(-t / 0.55) * np.minimum(1, t / 0.002))[:, None] * 0.28

def boom(len_=2.0, g=1.0):
    n = int(len_ * SR); t = np.arange(n) / SR
    f = 32 + 60 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    hit = bq(noise(n), 'lowpass', 900) * np.exp(-t / 0.08) * 0.9
    return np.tanh((s + hit) * 1.5) * 0.85 * g

def riser(len_, g=1.0, f0=180, f1=2400):
    n = int(len_ * SR); t = np.arange(n) / SR; u = t / len_
    # noise swept through 24 band segments
    nz = noise(n); out = np.zeros(n, np.float32)
    segs = 24
    for k in range(segs):
        lo = 300 * (30 ** (k / segs)); hi = lo * 2.2
        band = bq(nz, 'bp', (lo, min(hi, 19000)))
        w = np.exp(-((u - k / (segs - 1)) ** 2) / (2 * 0.05 ** 2))
        out += band * w
    pitch = f0 * (f1 / f0) ** (u ** 1.6)
    saw = bq(polyblep_saw(pitch, n), 'highpass', 150) * 0.18
    saw2 = polyblep_saw(pitch * 1.007, n) * 0.12
    amp = (u ** 2.2)
    x = (out * 0.9 + saw + saw2) * amp
    return np.stack([x, np.roll(x, 300)], 1) * 0.5 * g

def whoosh(len_=0.6, g=1.0, rev=False, pan_sweep=True):
    n = int(len_ * SR); t = np.arange(n) / SR; u = t / len_
    nz = noise(n); out = np.zeros(n, np.float32)
    for k in range(10):
        lo = 400 * (12 ** (k / 10)); band = bq(nz, 'bp', (lo, lo * 1.8))
        w = np.exp(-((u - (k / 9) * 0.8 - 0.1) ** 2) / (2 * 0.09 ** 2))
        out += band * w
    amp = np.sin(np.pi * u) ** 2
    x = out * amp
    if rev: x = x[::-1]
    if pan_sweep:
        p = np.linspace(-0.8, 0.8, n)
        return np.stack([x * np.cos((p + 1) * np.pi / 4), x * np.sin((p + 1) * np.pi / 4)], 1) * 0.55 * g
    return np.stack([x, x], 1) * 0.4 * g

def motor_whine(len_=1.2, g=1.0):
    """brushless RC motor rev: rising buzzy pitch with PWM grit."""
    n = int(len_ * SR); t = np.arange(n) / SR; u = t / len_
    f = 140 + 1300 * (1 - np.exp(-u * 3.2)) / (1 - np.exp(-3.2))
    s = polyblep_saw(f, n) * 0.6 + np.sign(np.sin(2 * np.pi * np.cumsum(f * 2) / SR)) * 0.15
    s = bq(s, 'bp', (300, 6000))
    trem = 1 + 0.25 * np.sin(2 * np.pi * 38 * t)
    amp = np.minimum(1, u / 0.05) * (1 - u) ** 0.6
    x = s * trem * amp
    return np.stack([x, np.roll(x, 120)], 1) * 0.32 * g

def beep(f=880, len_=0.14):
    n = int(len_ * SR); t = np.arange(n) / SR
    s = np.sin(2 * np.pi * f * t) * 0.7 + np.sin(2 * np.pi * f * 2 * t) * 0.15
    return s * np.minimum(1, t / 0.003) * np.exp(-t / 0.07) * 0.5

def tick():
    n = int(0.05 * SR); t = np.arange(n) / SR
    return bq(noise(n), 'bp', (2500, 6000)) * np.exp(-t / 0.006) * 0.35

def bass_note(m, dur, cut0=2200, cut1=260, g=1.0):
    """additive saw w/ time-varying 4-pole lowpass + sub sine."""
    n = int(dur * SR); t = np.arange(n) / SR
    f0 = mtof(m)
    fc = cut1 + (cut0 - cut1) * np.exp(-t / 0.045)
    x = np.zeros(n, np.float32)
    K = int(min(60, 9000 / f0))
    for k in range(1, K + 1):
        a = (1 / k) / np.sqrt(1 + (k * f0 / fc) ** 8)
        x += (a * (np.sin(2 * np.pi * k * f0 * 1.003 * t) + np.sin(2 * np.pi * k * f0 * 0.997 * t + k))).astype(np.float32) * 0.5
    sub = np.sin(2 * np.pi * f0 / 2 * t) * 0.55
    e = np.minimum(1, t / 0.003) * np.minimum(1, (dur - t).clip(0) / 0.012)
    return np.tanh((x * 0.75 + sub) * 1.4) * e * 0.42 * g

def supersaw(ms, dur, cut=3800, voices=7, det=0.18, att=0.004, rel=0.06, dec=None):
    n = int((dur + rel) * SR); t = np.arange(n) / SR
    L = np.zeros(n, np.float32); R = np.zeros(n, np.float32)
    for m in ms:
        f = mtof(m)
        for v in range(voices):
            d = (v - (voices - 1) / 2) / ((voices - 1) / 2)
            s = polyblep_saw(f * 2 ** (d * det / 12), n, phase0=rng.random())
            p = d * 0.8
            L += s * np.cos((p + 1) * np.pi / 4); R += s * np.sin((p + 1) * np.pi / 4)
    st = np.stack([L, R], 1) / (len(ms) * voices ** 0.6)
    st = bq(st, 'lowpass', cut, order=2)
    st = bq(st, 'highpass', 180)
    e = np.minimum(1, t / att) * np.where(t < dur, 1, np.exp(-(t - dur) / max(rel / 3, 1e-3)))
    if dec: e *= np.exp(-t / dec)
    return st * e[:, None]

def pluck(m, dur=0.2):
    n = int(dur * SR); t = np.arange(n) / SR; f = mtof(m)
    s = polyblep_saw(f, n) * 0.6 + polyblep_saw(f * 1.006, n) * 0.4
    s += np.sign(np.sin(2 * np.pi * f * 2 * t)) * 0.12
    fc_env = 900 + 5000 * np.exp(-t / 0.05)
    # cheap time-varying lp: crossfade two filtered copies
    a = bq(s, 'lowpass', 6000); b = bq(s, 'lowpass', 900)
    w = (fc_env - 900) / 5000
    x = a * w + b * (1 - w)
    return x * np.minimum(1, t / 0.002) * np.exp(-t / 0.09) * 0.35

def reverb_ir(len_=2.2, damp=6000):
    n = int(len_ * SR); t = np.arange(n) / SR
    ir = np.stack([noise(n), noise(n)], 1) * np.exp(-t / (len_ / 6.5))[:, None]
    ir = bq(ir, 'lowpass', damp)
    ir[: int(0.018 * SR)] = 0
    return ir / np.sqrt((ir ** 2).sum() / 2)

def convolve(x, ir):
    return np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:N] for c in range(2)], 1).astype(np.float32)

# ---------------------------------------------------------------- arrangement
drums, bass, music, lead, fx, send = buf(), buf(), buf(), buf(), buf(), buf()
CH = {  # bar -> chord voicing, bass root
    'Fm': ([53, 56, 60, 65], 41), 'Db': ([53, 56, 61, 65], 37),
    'Ab': ([51, 56, 60, 63], 44), 'Eb': ([51, 55, 58, 63], 39)}
PROG = ['Fm', 'Db', 'Ab', 'Eb']
def chord_at(bar): return CH[PROG[bar % 4]]

kicks = []
def bar_t(b, step=0): return b * 2.0 + step * S16

def groove(b, full=True, arp=False, stabs=True, hats=True, bassline=True, kick_on=True):
    ch, root = chord_at(b)
    for s in range(16):
        t = bar_t(b, s)
        if kick_on and s % 4 == 0:
            add(drums, kick(), t); kicks.append(t)
        if s in (4, 12):
            c = clap(); add(drums, c, t, 0.9); add(send, c, t, 0.25)
        if hats:
            if s % 4 == 2: add(drums, hat(True), t, 0.9, pan=0.15)
            else: add(drums, hat(False, [1, .45, .7, .45][s % 4]), t, 1.0, pan=-0.2)
        if bassline and s % 4 != 0:
            m = root + (12 if s % 4 == 3 else 0)
            add(bass, bass_note(m, S16 * 0.92, cut0=2600 if full else 900), t)
        if stabs and s in (2, 6, 10, 14, 15) and full:
            st = supersaw(ch, 0.09, cut=4200, rel=0.05)
            add(music, st, t, 0.55); add(send, st, t, 0.3)
        if arp:
            pat = [0, 2, 3, 1, 3, 2, 0, 3, 1, 2, 3, 2, 0, 1, 3, 2]
            m = ch[pat[s] % 4] + 12 + (12 if s in (6, 14) else 0)
            p = pluck(m, 0.22)
            add(lead, p, t, 0.9, pan=0.3 * np.sin(s)); add(send, p, t, 0.35)

# bar 0 — intro
for k, t in enumerate([0.5, 0.75, 1.0, 1.25, 1.5]):
    add(fx, beep(880), t, 0.8); add(send, beep(880), t, 0.3)
for t in [0.0, 0.5, 1.0]:
    add(drums, bq(kick(0.6), 'lowpass', 400), t, 0.7)
add(fx, riser(2.0, 0.9), 0.0)
pad0 = supersaw(CH['Fm'][0], 1.95, cut=900, att=0.8, rel=0.05)
add(music, pad0, 0.0, 0.35); add(send, pad0, 0.0, 0.4)
r = crash(1.2)[::-1]; add(fx, r, 2.0 - 1.2, 0.6)

# bars 1-4 — drop A
for b in range(1, 5):
    groove(b)
# bar 5 — breakdown (brands)
_, root = CH['Fm']
pad = supersaw(CH['Fm'][0] + [68], 1.9, cut=1400, att=0.3, rel=0.1)
add(music, pad, 10.0, 0.5); add(send, pad, 10.0, 0.5)
for s in range(16):
    t = bar_t(5, s)
    if s % 2 == 0: add(drums, hat(False, 0.6), t, pan=-0.2)
    if s % 4 == 3: add(bass, bass_note(root, S16, cut0=500, cut1=200), t, 0.8)
    if s >= 8:  # snare roll build
        c = clap(); add(drums, c, t, 0.25 + 0.5 * (s - 8) / 8)
        add(drums, clap(), t + S16 / 2, 0.2 + 0.4 * (s - 8) / 8)
add(fx, riser(2.0, 1.1, 250, 3500), 10.0)
add(fx, crash(1.0)[::-1], 11.0, 0.6)

# bars 6-9 — drop B + arp
for b in range(6, 10):
    groove(b, arp=True)
# bars 10-11 — drive + build
groove(10, arp=True)
for s in range(16):  # bar 11: kick accelerates, stabs continue, riser
    t = bar_t(11, s)
    if s % (4 if s < 8 else 2) == 0:
        add(drums, kick(), t); kicks.append(t)
    if s >= 8:
        add(drums, clap(), t, 0.3 + 0.5 * (s - 8) / 8)
        add(drums, clap(), t + S16 / 2, 0.25 + 0.45 * (s - 8) / 8)
    else:
        if s in (4,): add(drums, clap(), t, 0.9)
    if s % 4 != 0:
        add(bass, bass_note(CH['Eb'][1], S16 * 0.9, cut0=1400 + 120 * s), t)
    add(drums, hat(False, 0.5 + 0.03 * s), t, pan=-0.2)
add(fx, riser(2.0, 1.2, 220, 4200), 22.0)
add(fx, crash(1.0)[::-1], 23.0, 0.7)

# bar 12 — half-time hits @24 and @25
for t, ch in [(24.0, 'Fm'), (25.0, 'Db')]:
    add(drums, kick(1.1), t); kicks.append(t)
    add(fx, boom(1.2, 0.8), t)
    add(fx, crash(1.0), t, 0.7)
    st = supersaw(CH[ch][0] + [CH[ch][0][0] - 12], 0.7, cut=3000, rel=0.3, dec=0.5)
    add(music, st, t, 0.6); add(send, st, t, 0.6)
    add(bass, bass_note(CH[ch][1], 0.7, cut0=1800, cut1=300), t)
for s in [10, 11, 12, 13, 14, 15]:
    add(drums, clap(), bar_t(12, s), 0.35 + 0.08 * (s - 10))
add(fx, riser(0.9, 0.9, 400, 5000), 25.1)
add(fx, crash(0.8)[::-1], 25.2, 0.6)

# bar 13 — final drop
groove(13, arp=True)
# @28 final hit, tail
add(drums, kick(1.2), 28.0); kicks.append(28.0)
add(fx, boom(2.0, 1.1), 28.0)
add(fx, crash(2.0), 28.0, 0.9)
fin = supersaw(CH['Fm'][0] + [41, 72], 1.6, cut=3500, rel=0.6, dec=0.9)
add(music, fin, 28.0, 0.7); add(send, fin, 28.0, 0.9)
add(bass, bass_note(41, 1.2, cut0=1500, cut1=200), 28.0)

# ---------------------------------------------------------------- SFX synced to picture
for t in [2.0, 12.0, 26.0]:
    add(fx, boom(2.0, 1.0), t); add(fx, crash(1.8), t, 0.8); add(send, crash(1.8), t, 0.3)
add(fx, motor_whine(1.3, 1.0), 3.85)          # hero crawler revs in
add(fx, whoosh(0.5, 0.9), 3.75)
for k in range(8):                             # category cards snap on each beat
    add(fx, tick(), 6.0 + k * 0.5, 0.8, pan=(-0.5 if k % 2 else 0.5))
    add(fx, whoosh(0.32, 0.45), 6.0 + k * 0.5 - 0.16)
add(fx, whoosh(0.8, 1.0, rev=True), 9.25)      # into brand tunnel
add(fx, motor_whine(1.0, 0.9), 15.9)           # delivery dash
add(fx, whoosh(0.6, 0.9), 15.7)
for t in [17.0, 18.0, 19.0]: add(fx, whoosh(0.4, 0.6), t - 0.2)
for t in [20.0, 21.0, 22.0, 23.0]: add(fx, whoosh(0.45, 0.8), t - 0.22)  # cube turns
add(fx, whoosh(0.7, 0.8), 26.6)

# ---------------------------------------------------------------- sidechain + mix
sc = np.ones(N, np.float32)
tt = np.arange(N) / SR
for k in kicks:
    i = int(k * SR); j = min(N, i + int(0.3 * SR)); u = tt[i:j] - k
    sc[i:j] = np.minimum(sc[i:j], 1 - 0.78 * np.exp(-u / 0.085) * np.minimum(1, u / 0.004 + 0.3))
bass *= sc[:, None]; music *= sc[:, None]; lead *= (0.4 + 0.6 * sc)[:, None]

# lead ping-pong delay (3/16)
d = int(3 * S16 * SR); dl = np.zeros_like(lead)
for k in range(1, 5):
    sh = lead[: N - d * k] * (0.42 ** k)
    if k % 2: dl[d * k:, 0] += sh[:, 1]; dl[d * k:, 1] += sh[:, 0]
    else: dl[d * k:] += sh
lead = lead + bq(dl, 'highpass', 400) * 0.8

rev = convolve(send, reverb_ir(2.4)) * 0.35
mix = drums * 0.95 + bass * 1.0 + music * 0.8 + lead * 0.6 + fx * 0.85 + rev
mix = bq(mix, 'highpass', 25)
# glue: soft clip + normalise
mix /= np.percentile(np.abs(mix), 99.95)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fade = np.ones(N); fs = int(29.2 * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 2
mix *= fade[:, None]
mix /= np.abs(mix).max() / 0.89

out = sys.argv[1] if len(sys.argv) > 1 else 'music.wav'
from scipy.io import wavfile
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('wrote', out, mix.shape)
