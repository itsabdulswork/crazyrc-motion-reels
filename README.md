# Crazy RC — 9:16 Motion Graphics Reels

Vertical (1080×1920) product reels for [crazyrc.in](https://crazyrc.in), built entirely in code: Three.js + GLSL shaders for the 3D pieces, [Remotion](https://www.remotion.dev) for the presenter edits, and Python/NumPy for the music and sound design.

## The reels

All finished reels are in [`videos/`](videos/) (share-size H.264, 1080×1920, 30 fps, −14 LUFS).

| Reel | Style | File |
|---|---|---|
| Crazy RC brand showreel (30 s) | Three.js + shaders, 3D camera moves | `videos/CrazyRC_Showreel_9x16.mp4` |
| MNRC MN82 LC79 breakdown (20 s) | Procedural 3D truck that explodes and rebuilds | `videos/MNRC_MN82_Breakdown_9x16.mp4` |
| JJRC C8801 | Dark punchy edit, kinetic captions | `videos/JJRC_C8801_Reel_9x16.mp4` |
| JJRC C8815 Willys | Dark punchy edit, word-timed panels | `videos/JJRC_C8815_Reel_9x16.mp4` |
| JJRC C8819 | Premium edit: chapter bar, live gauges, light leaks | `videos/JJRC_C8819_Reel_9x16.mp4` |
| JJRC C8835 Hummer | Editorial "magazine" layout engine | `videos/JJRC_C8835_Reel_9x16.mp4` |
| SCY 16303 drift car | Editorial | `videos/SCY_16303_Reel_9x16.mp4` |
| SCY 16101 monster truck | Editorial | `videos/SCY_16101_Reel_9x16.mp4` |

## Project layout

- `_source/` — Three.js renderer (`src/main.js`, `src/scenes.js`, `src/mn82.js`, `src/lc79.js`), Puppeteer frame capture (`render.mjs`), and the synthesized scores (`audio/music.py`, `audio/music_mn82.py`).
- `_remotion_<model>/` — one Remotion project per presenter reel:
  - `src/edit.json` — the cut list, word-timed captions and spoken-keyword cues that every graphic and sound effect is keyed to.
  - `src/*.tsx` — compositions (layout engine, captions, motion graphics, end card).
  - `audio/build_audio.py` — edits the dialogue to the same cut list, then mixes the beat, sidechain/ducking and SFX.

## Rendering

The presenter reels need the original footage, which is not in this repo. Put a 1080×1920 copy at `_remotion_<model>/public/footage.mp4` and the source audio at `audio/voice_raw.wav`, then:

```bash
npm ci
python audio/build_audio.py
npx remotion render src/index.ts C8801 out.mp4
```

The 3D reels in `_source/` need no footage:

```bash
cd _source && npm ci
python audio/music.py audio/music.wav
node render.mjs --out showreel.mp4
```

Fonts: Bai Jamjuree (SIL Open Font License). Product photos and logos belong to Crazy RC and the respective manufacturers.
