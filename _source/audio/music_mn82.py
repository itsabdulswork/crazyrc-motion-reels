"""
MN82 breakdown score — 120 BPM, F minor, 20 s, cut to the picture.
  0-2   intro: ticking build, riser            -> BUST @2 (shatter + boom)
  2-9.5 groove; callout ticks @4.0..7.75, wide @8.5
  9.5   tape-rewind into silence               -> rebuild @10
  10-14 rebuild groove, metal clank on every snap (10.0 .. 13.5), riser -> drop @14
  14-17 drop + arp (climb, remote)             -> hit @17 (end card)
  17-19 final groove, final hit @19, tail to 20
"""
import os, sys
import numpy as np
from scipy import signal

HERE = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(HERE, 'music.py'), encoding='utf-8').read()
src = src.split('# ---------------------------------------------------------------- arrangement')[0]
src = src.replace('DUR = 30.0', 'DUR = 20.0')
exec(src)   # instruments + helpers from the first reel's score

def clank(g=1.0, base=1.0):
    n = int(0.6 * SR); t = np.arange(n) / SR
    parts = [(523, 1.0, 0.25), (1187, 0.7, 0.18), (1873, 0.55, 0.12), (2711, 0.4, 0.09), (3907, 0.3, 0.06), (5231, 0.2, 0.04)]
    x = sum(a * np.sin(2 * np.pi * f * base * t + f) * np.exp(-t / d) for f, a, d in parts)
    click = bq(noise(n), 'highpass', 3000) * np.exp(-t / 0.004)
    thud = np.sin(2 * np.pi * (70 + 80 * np.exp(-t * 40)) * t) * np.exp(-t / 0.07)
    y = (x * 0.35 + click * 0.6 + thud * 0.8) * g
    return np.stack([y, np.roll(y, 90)], 1) * 0.55

def ratchet(len_=0.35, g=1.0):
    n = int(len_ * SR); out = np.zeros(n, np.float32)
    k = 0.0
    while k < len_ - 0.02:
        i = int(k * SR); c = tick()[: n - i]; out[i:i + len(c)] += c * (0.6 + 0.4 * k / len_)
        k += 0.022 - 0.01 * k / len_
    return np.stack([out, out], 1) * g

def shatter(g=1.0):
    n = int(1.4 * SR); out = np.zeros(n, np.float32); r = np.random.default_rng(3)
    for _ in range(60):
        st = int(r.uniform(0, 0.6) ** 2 * SR); f = r.uniform(1800, 9000); d = r.uniform(0.02, 0.15)
        m = int(0.3 * SR); t = np.arange(m) / SR
        p = np.sin(2 * np.pi * f * t) * np.exp(-t / d) * r.uniform(0.2, 1)
        e = min(n, st + m); out[st:e] += p[: e - st]
    burst = bq(noise(n), 'highpass', 1500) * np.exp(-np.arange(n) / SR / 0.12)
    y = out * 0.25 + burst * 0.6
    return np.stack([y, np.roll(y, 200)], 1) * g

def rewind(len_=0.5, g=1.0):
    n = int(len_ * SR); t = np.arange(n) / SR; u = t / len_
    f = 1400 * (0.06 / 1.4) ** u
    s = bq(polyblep_saw(f, n) * 0.5 + polyblep_saw(f * 1.5, n) * 0.3, 'lowpass', 5000)
    flutter = 1 + 0.4 * np.sin(2 * np.pi * (30 - 20 * u) * t)
    y = s * flutter * (1 - u) ** 0.7 * np.minimum(1, t / 0.01)
    return np.stack([y, y], 1) * 0.4 * g

drums, bass, music, lead, fx, send = buf(), buf(), buf(), buf(), buf(), buf()
CH = {'Fm': ([53, 56, 60, 65], 41), 'Db': ([53, 56, 61, 65], 37), 'Ab': ([51, 56, 60, 63], 44), 'Eb': ([51, 55, 58, 63], 39)}
PROG = ['Fm', 'Db', 'Ab', 'Eb']
kicks = []
def bar_t(b, step=0): return b * 2.0 + step * S16

def groove(b, arp=False, stabs=True, bassline=True, kick_on=True, hats=True, filt=False, chord=None):
    ch, root = CH[chord or PROG[b % 4]]
    for s in range(16):
        t = bar_t(b, s)
        if kick_on and s % 4 == 0: add(drums, kick(), t); kicks.append(t)
        if s in (4, 12): c = clap(); add(drums, c, t, 0.9); add(send, c, t, 0.25)
        if hats:
            if s % 4 == 2: add(drums, hat(True), t, 0.85, pan=0.15)
            else: add(drums, hat(False, [1, .45, .7, .45][s % 4]), t, 1.0, pan=-0.2)
        if bassline and s % 4 != 0:
            add(bass, bass_note(root + (12 if s % 4 == 3 else 0), S16 * 0.92, cut0=900 if filt else 2600), t)
        if stabs and s in (2, 6, 10, 14, 15) and not filt:
            st = supersaw(ch, 0.09, cut=4200, rel=0.05); add(music, st, t, 0.5); add(send, st, t, 0.3)
        if arp:
            pat = [0, 2, 3, 1, 3, 2, 0, 3, 1, 2, 3, 2, 0, 1, 3, 2]
            p = pluck(ch[pat[s] % 4] + 12 + (12 if s in (6, 14) else 0), 0.22)
            add(lead, p, t, 0.85, pan=0.3 * np.sin(s)); add(send, p, t, 0.35)

# bar 0 — intro: ticking, muted pulse, riser
for s in range(16):
    t = bar_t(0, s)
    add(drums, hat(False, 0.35 + 0.04 * s), t, pan=-0.3 + 0.04 * s)
    if s % 4 == 0 and s < 14: add(drums, bq(kick(0.6), 'lowpass', 380), t, 0.75)
add(fx, ratchet(0.4, 0.5), 0.9)
add(fx, riser(2.0, 1.0), 0.0)
pad0 = supersaw(CH['Fm'][0], 1.95, cut=900, att=0.8, rel=0.05); add(music, pad0, 0, 0.3); add(send, pad0, 0, 0.4)
add(fx, crash(1.1)[::-1], 2.0 - 1.1, 0.6)
# @2 BUST
add(fx, boom(2.0, 1.15), 2.0); add(fx, shatter(1.0), 2.0); add(fx, crash(1.8), 2.0, 0.8); add(send, crash(1.8), 2.0, 0.35)
add(fx, whoosh(0.7, 0.9), 2.05)
# bars 1-3 groove (2-8), bar 4 (8-10) groove until the rewind
for b in (1, 2, 3): groove(b)
for s in range(12):  # 8.0 - 9.5
    t = bar_t(4, s)
    if s % 4 == 0: add(drums, kick(), t); kicks.append(t)
    if s == 4: add(drums, clap(), t, 0.9)
    if s >= 8: add(drums, clap(), t, 0.35 + 0.1 * (s - 8))
    add(drums, hat(False, 0.6), t, pan=-0.2)
    if s % 4 != 0: add(bass, bass_note(CH['Eb'][1], S16 * 0.9), t)
for c in [4.0, 4.75, 5.5, 6.25, 7.0, 7.75]:
    add(fx, tick(), c, 0.9, pan=0.4); add(fx, whoosh(0.3, 0.45), c - 0.12)
add(fx, whoosh(0.6, 0.8), 8.3)
# 9.5 rewind -> near silence until 10
add(fx, rewind(0.5, 1.1), 9.5); add(fx, whoosh(0.5, 0.7, rev=True), 9.5)
# bars 5-6 rebuild (10-14) with clanks on every snap
for b in (5, 6):
    groove(b, stabs=(b == 6), chord=['Fm', 'Db'][b - 5])
for i, t in enumerate([10.0, 10.5, 11.0, 11.5, 12.0, 12.5, 13.0, 13.5]):
    add(fx, clank(0.9 + i * 0.03, 1.0 + 0.04 * (i % 3)), t); add(fx, ratchet(0.2, 0.35), t - 0.28)
    add(send, clank(0.4), t, 0.3)
add(fx, riser(1.6, 1.0, 300, 4500), 12.4); add(fx, crash(0.9)[::-1], 13.1, 0.6)
# @14 drop: climb
add(fx, boom(1.6, 0.9), 14.0); add(fx, crash(1.6), 14.0, 0.7)
add(fx, motor_whine(1.6, 0.8), 14.0)
groove(7, arp=True, chord='Fm')
# 16-17 remote: filtered bar half + riser
for s in range(8):
    t = 16.0 + s * S16
    if s % 4 == 0: add(drums, kick(0.9), t); kicks.append(t)
    add(drums, hat(False, 0.55), t, pan=-0.2)
    if s % 4 != 0: add(bass, bass_note(CH['Db'][1], S16 * 0.9, cut0=700), t)
add(fx, riser(1.0, 0.9, 400, 5000), 16.0); add(fx, whoosh(0.5, 0.8), 15.85)
# @17 end card
add(fx, boom(1.8, 1.0), 17.0); add(fx, crash(1.8), 17.0, 0.85)
for s in range(16):
    if 17.0 + s * S16 >= 19.0: break
for b_t in [17.0]:
    for s in range(16):
        t = b_t + s * S16
        if s % 4 == 0: add(drums, kick(), t); kicks.append(t)
        if s in (4, 12): add(drums, clap(), t, 0.9)
        if s % 4 == 2: add(drums, hat(True), t, 0.85, pan=0.15)
        else: add(drums, hat(False, [1, .45, .7, .45][s % 4]), t, pan=-0.2)
        ch, root = CH['Ab']
        if s % 4 != 0: add(bass, bass_note(root + (12 if s % 4 == 3 else 0), S16 * 0.92), t)
        if s in (2, 6, 10, 14, 15): st = supersaw(ch, 0.09, cut=4200, rel=0.05); add(music, st, t, 0.5); add(send, st, t, 0.3)
        pat = [0, 2, 3, 1, 3, 2, 0, 3, 1, 2, 3, 2, 0, 1, 3, 2]
        p = pluck(ch[pat[s] % 4] + 12, 0.22); add(lead, p, t, 0.8); add(send, p, t, 0.35)
# @19 final hit + tail
add(drums, kick(1.2), 19.0); kicks.append(19.0)
add(fx, boom(1.0, 1.0), 19.0); add(fx, crash(1.0), 19.0, 0.8)
fin = supersaw(CH['Fm'][0] + [41, 72], 0.9, cut=3500, rel=0.5, dec=0.6); add(music, fin, 19.0, 0.7); add(send, fin, 19.0, 0.9)
add(bass, bass_note(41, 0.8, cut0=1500, cut1=200), 19.0)

# ---------------------------------------------------------------- mix (same chain as reel 1)
sc = np.ones(N, np.float32); tt = np.arange(N) / SR
for k in kicks:
    i = int(k * SR); j = min(N, i + int(0.3 * SR)); u = tt[i:j] - k
    sc[i:j] = np.minimum(sc[i:j], 1 - 0.78 * np.exp(-u / 0.085) * np.minimum(1, u / 0.004 + 0.3))
bass *= sc[:, None]; music *= sc[:, None]; lead *= (0.4 + 0.6 * sc)[:, None]
d = int(3 * S16 * SR); dl = np.zeros_like(lead)
for k in range(1, 5):
    sh = lead[: N - d * k] * (0.42 ** k)
    if k % 2: dl[d * k:, 0] += sh[:, 1]; dl[d * k:, 1] += sh[:, 0]
    else: dl[d * k:] += sh
lead = lead + bq(dl, 'highpass', 400) * 0.8
rev = convolve(send, reverb_ir(2.2)) * 0.35
mix = drums * 0.95 + bass + music * 0.8 + lead * 0.6 + fx * 0.9 + rev
mix = bq(mix, 'highpass', 25)
mix /= np.percentile(np.abs(mix), 99.95)
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
fade = np.ones(N); fs = int(19.5 * SR); fade[fs:] = np.linspace(1, 0, N - fs) ** 2
mix *= fade[:, None]
mix /= np.abs(mix).max() / 0.89
from scipy.io import wavfile
out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'music_mn82.wav')
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print('wrote', out)
