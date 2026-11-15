# Elan E Jung News TV – 3D Cinematic Intro (YouTube Shorts)

**Final video:** `Elan-E-Jung-News-TV-Intro.mp4` (1080×1920, 9:16, 30 fps, 6 s, AAC audio)

## Sequence
| Time | What happens |
|------|--------------|
| 0.0–1.6 s | Light streaks, embers and a red wireframe globe; riser sound |
| 1.7 s | 3D gold "EJ" emblem spins in from depth and lands, with a boom, flash and shockwave |
| 1.7–2.8 s | Chrome letters of "ELAN E JUNG" fly in one by one, ending in a second hit |
| 3.1 s | A light sweep and metallic shimmer cross the logo |
| 3.7 s | Red "NEWS TV" plate flips in with a cinematic D-minor stinger |
| 3.7–6.0 s | Logo hold with a slow push-in and news pulse, then fade to black |

All the sound is synthesised by `audio/make_sfx.py` (no third-party audio, so no copyright claim).

## Re-render
```bash
cd video
npm install
# On a machine with a GPU, leave out --gl=swangle
REMOTION_BROWSER=/path/to/chrome-headless-shell \
  npx remotion render ElanEJungIntro out/intro.mp4 --gl=swangle --codec=h264 --crf=16
```
Regenerate the audio: `python3 audio/make_sfx.py video/public/intro_sfx.wav`

To change the text, edit `TITLE` and `"NEWS TV"` / `"EJ"` in `video/src/Scene3D.tsx`. Timings are in `video/src/timing.ts`, and they must match the frame numbers at the top of `audio/make_sfx.py`.
