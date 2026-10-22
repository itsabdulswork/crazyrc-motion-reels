"""
C8801 reel audio: edited dialogue + 100 BPM bed (ducked under voice) + SFX locked to the graphics.
Reads ../src/edit.json (same cut list Remotion uses) and writes ../public/mix.wav.
"""
import os, sys, json, subprocess
import numpy as np
from scipy import signal
from scipy.io import wavfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
edit = json.load(open(os.path.join(ROOT, 'src', 'edit.json'), encoding='utf-8'))
FPS = edit['fps']

# ------------------------------------------------------------------ timeline (mirrors timeline.ts)
segs, cur = [], 0
for i, g in enumerate(edit['segments']):
    a = round(g['s'] * FPS); d = round(g['e'] * FPS) - a
    segs.append(dict(i=i, src=a / FPS, dur=d / FPS, frm=cur / FPS)); cur += d
SPEECH_END = cur / FPS
TOTAL = SPEECH_END + round(edit['endCard'] * FPS) / FPS
def at(i, p=0.0): return segs[i]['frm'] + round(segs[i]['dur'] * FPS * p) / FPS

# ------------------------------------------------------------------ dialogue edit
sr, raw = wavfile.read(os.path.join(HERE, 'voice_raw.wav')); raw = raw.astype(np.float32) / 32768
SR = sr
N = int(round(TOTAL * SR))
voice = np.zeros((N, 2), np.float32)
xf = int(0.012 * SR)
for s in segs:
    a = int(round(s['src'] * SR)); n = int(round(s['dur'] * SR)); o = int(round(s['frm'] * SR))
    clip = raw[a:a + n].copy()
    ramp = np.linspace(0, 1, xf)[:, None]
    clip[:xf] *= ramp; clip[-xf:] *= ramp[::-1]
    voice[o:o + len(clip)] += clip
wavfile.write(os.path.join(HERE, 'voice_edit.wav'), SR, (voice * 32767).clip(-32768, 32767).astype(np.int16))
chain = ('highpass=f=75,afftdn=nr=12:nf=-42,equalizer=f=220:t=q:w=1.2:g=-2,equalizer=f=3400:t=q:w=1.4:g=3.5,'
         'equalizer=f=9000:t=q:w=1:g=1.5,acompressor=threshold=-24dB:ratio=3.2:attack=6:release=90:makeup=5,'
         'alimiter=limit=0.89,loudnorm=I=-16:TP=-2:LRA=7')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', os.path.join(HERE, 'voice_edit.wav'), '-af', chain, '-ar', str(SR), os.path.join(HERE, 'voice_proc.wav')], check=True)
_, vp = wavfile.read(os.path.join(HERE, 'voice_proc.wav')); vp = vp.astype(np.float32) / 32768
if vp.ndim == 1: vp = np.stack([vp, vp], 1)
vp = vp[:N] if len(vp) >= N else np.pad(vp, ((0, N - len(vp)), (0, 0)))

# ------------------------------------------------------------------ instruments from the reel-1 score
src = open(os.path.join(ROOT, '..', '_source', 'audio', 'music.py'), encoding='utf-8').read()
src = src.split('# ---------------------------------------------------------------- arrangement')[0]
src = src.replace('SR = 44100', f'SR = {SR}').replace('DUR = 30.0', f'DUR = {TOTAL:.4f}').replace('BPM = 120', 'BPM = 100')
exec(src)
vp = vp[:N] if len(vp) >= N else np.pad(vp, ((0, N - len(vp)), (0, 0)))

def clank(g=1.0):
    n = int(0.5 * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, a, d in [(880, 1, .2), (1760, .6, .12), (2640, .4, .08), (3960, .25, .05)])
    return np.stack([x, x], 1) * 0.2 * g
def ding(f0=1568, g=1.0, len_=1.2):      # cash-register / bell
    n = int(len_ * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f0 * m * t) * np.exp(-t / d) for m, a, d in [(1, 1, .5), (2.76, .5, .25), (5.4, .25, .12), (8.9, .12, .06)])
    return np.stack([x, np.roll(x, 300)], 1) * 0.25 * g
def pop_sfx(g=1.0, f0=900):
    n = int(0.09 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * (f0 + 900 * np.exp(-t * 60)) * t) * np.exp(-t / 0.025)
    return np.stack([x, x], 1) * 0.3 * g
def dhol(low=True, g=1.0):
    n = int(0.35 * SR); t = np.arange(n) / SR
    if low: x = np.sin(2 * np.pi * np.cumsum(70 + 90 * np.exp(-t * 18)) / SR) * np.exp(-t / 0.16)
    else: x = bq(noise(n), 'bp', (700, 3500)) * np.exp(-t / 0.03) + np.sin(2 * np.pi * 330 * t) * np.exp(-t / 0.06) * 0.6
    return np.stack([x, x], 1) * 0.5 * g
def crackle(len_=0.6, g=1.0):
    n = int(len_ * SR); out = np.zeros(n, np.float32); r = np.random.default_rng(5)
    for _ in range(40):
        i = int(r.uniform(0, len_ * 0.9) * SR); m = int(0.01 * SR)
        out[i:i + m] += bq(noise(m), 'highpass', 2500) * np.exp(-np.arange(m) / SR / 0.002) * r.uniform(0.3, 1)
    return np.stack([out, np.roll(out, 50)], 1) * 0.5 * g

mus, drums, fx, send = buf(), buf(), buf(), buf()
kicks = []
# chords: F minor-ish loop at 100 BPM (bar = 2.4 s)
BAR = 4 * BEAT
CH = [([53, 56, 60, 65], 41), ([49, 53, 56, 61], 37), ([51, 56, 60, 63], 44), ([51, 55, 58, 63], 39)]
nbars = int(np.ceil(SPEECH_END / BAR)) + 1
offer0, offer1 = at(10, 0.0), at(11, 1.0)
for b in range(nbars):
    t0 = b * BAR
    if t0 >= SPEECH_END: break
    ch, root = CH[b % 4]
    festive = offer0 - 0.05 <= t0 < offer1
    for s in range(16):
        t = t0 + s * S16
        if t >= SPEECH_END - 0.05: break
        # trap-ish drums: kick pattern, snare on 3, hats w/ rolls
        if s in (0, 7, 10) or (s == 14 and b % 2): add(drums, kick(0.9), t); kicks.append(t)
        if s in (4, 12): c = clap(); add(drums, c, t, 0.75); add(send, c, t, 0.2)
        if s % 2 == 0: add(drums, hat(False, 0.8 if s % 4 == 0 else 0.5), t, pan=-0.2)
        if b % 2 and s >= 12: add(drums, hat(False, 0.35), t + S16 / 2, pan=0.2)
        # 808 sub with glide feel
        if s in (0, 7, 10): add(mus, bass_note(root - 12 if s == 0 else root, S16 * (6 if s == 0 else 3) * 0.95, cut0=500, cut1=160), t, 1.1)
        if s in (2, 6, 11, 14): p = pluck(ch[(s // 2) % 4] + 12, 0.25); add(mus, p, t, 0.55, pan=0.25 * np.sin(s)); add(send, p, t, 0.3)
        if festive:
            if s in (0, 3, 6, 8, 11, 14): add(drums, dhol(True, 0.9), t)
            if s in (2, 5, 10, 13, 15): add(drums, dhol(False, 0.7), t)
            if s % 4 == 1: add(mus, ding(2093 if s == 1 else 1568, 0.25, 0.6), t)
    pad = supersaw(ch, BAR * 0.98, cut=1200, att=0.4, rel=0.2); add(mus, pad, t0, 0.18); add(send, pad, t0, 0.2)

# ------------------------------------------------------------------ SFX locked to graphics
add(fx, boom(1.6, 0.9), 0.0); add(fx, crash(1.4), 0.0, 0.5)
add(fx, whoosh(0.5, 0.9), 24 / FPS - 0.25)                     # presenter steps in front of the title
for s in segs[1:]: add(fx, whoosh(0.28, 0.35), s['frm'] - 0.12)  # every jump cut
for t in [at(1, .06), at(2, .04), at(2, .3), at(2, .62), at(4, .05), at(4, .62)]: add(fx, pop_sfx(1.0), t)
for t in [at(2, .74), at(2, .86)]: add(fx, tick(), t, 1.0)
add(fx, ding(2637, 0.6, 0.8), at(3, .05)); add(fx, whoosh(0.6, 0.5), at(3, 0.0))
add(fx, whoosh(0.4, 1.0), at(5, .1) - 0.15); add(fx, boom(0.8, 0.5), at(5, .1))
add(fx, motor_whine(1.0, 0.6), at(5, .14))
add(fx, boom(1.0, 1.0), at(6, .78)); add(fx, crackle(0.5, 1.2), at(6, .78)); add(fx, clank(1.5), at(6, .78))
add(fx, boom(1.0, 0.7), at(7, .03)); add(fx, ding(1318, 0.6), at(7, .1))
add(fx, whoosh(0.4, 0.7), at(9, .05) - 0.1); add(fx, tick(), at(9, .05) + 30 / FPS, 1.2)
for k, d in enumerate([0, 9, 18, 28, 36, 48, 60, 72]):
    t = at(10, .04) + d / FPS
    if t < at(11, 0): add(fx, crackle(0.45, 0.5), t); add(fx, pop_sfx(0.5, 1400), t)
add(fx, ding(1568, 1.1, 1.4), at(10, .72)); add(fx, ding(2093, 0.8, 1.2), at(10, .72) + 0.08)
add(fx, boom(1.2, 1.1), at(11, .2)); add(fx, clank(1.2), at(11, .2))
add(fx, tick(), at(12, .62), 1.4); add(fx, pop_sfx(1.0, 700), at(12, .62))
add(fx, riser(1.2, 0.9, 300, 5000), SPEECH_END - 1.2)
add(fx, boom(2.0, 1.2), SPEECH_END); add(fx, crash(2.0), SPEECH_END, 0.8)
fin = supersaw(CH[0][0] + [41, 72], 1.8, cut=3500, rel=0.8, dec=1.0); add(mus, fin, SPEECH_END, 0.6); add(send, fin, SPEECH_END, 0.8)
add(drums, kick(1.1), SPEECH_END)
for k, t in enumerate(np.arange(SPEECH_END + 0.3, TOTAL - 0.4, 0.3)): add(fx, crackle(0.3, 0.35), t)

# ------------------------------------------------------------------ mix: sidechain to kick, duck under voice
tt = np.arange(N) / SR
sc = np.ones(N, np.float32)
for k in kicks:
    i = int(k * SR); j = min(N, i + int(0.25 * SR)); u = tt[i:j] - k
    sc[i:j] = np.minimum(sc[i:j], 1 - 0.5 * np.exp(-u / 0.08))
env = np.abs(vp).mean(1)
win = int(0.03 * SR); env = np.convolve(env, np.ones(win) / win, 'same')
speech = (env > 0.02).astype(np.float32)
# attack 40 ms, release 300 ms
duck = np.zeros(N, np.float32); g = 0.0
a_c, r_c = np.exp(-1 / (0.04 * SR)), np.exp(-1 / (0.3 * SR))
step = 64
for i in range(0, N, step):
    tgt = speech[i]; c = a_c if tgt > g else r_c
    g = tgt + (g - tgt) * c ** step; duck[i:i + step] = g
music_gain = (1 - 0.72 * duck)
rev = convolve(send, reverb_ir(1.8)) * 0.3
bed = (mus * sc[:, None] + drums * 0.9 + rev) * music_gain[:, None] * 0.55
mix = vp * 1.0 + bed + fx * 0.55
mix = bq(mix, 'highpass', 25)
mix /= max(1e-6, np.abs(mix).max()) / 0.95
fade = np.ones(N); fs = int((TOTAL - 0.35) * SR); fade[fs:] = np.linspace(1, 0, N - fs)
mix *= fade[:, None]
tmp = os.path.join(HERE, 'mix_pre.wav')
wavfile.write(tmp, SR, (mix * 32767).astype(np.int16))
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', tmp, '-af', 'loudnorm=I=-14:TP=-1:LRA=9', '-ar', str(SR), os.path.join(ROOT, 'public', 'mix.wav')], check=True)
print(f'speech {SPEECH_END:.2f}s total {TOTAL:.2f}s -> public/mix.wav')
