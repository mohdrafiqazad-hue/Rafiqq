"""Synthesise an original, royalty-free cinematic underscore timed to the reel's scene cuts."""
import json, re, sys
import numpy as np
from scipy.io import wavfile

SR = 44100
src = open(sys.argv[1]).read()
scenes = json.loads(re.search(r"SCENES = (\[.*?\]) as const", src, re.S).group(1))
TOTAL = int(re.search(r"TOTAL = (\d+)", src).group(1))
TRANS = int(re.search(r"TRANS = (\d+)", src).group(1))
dur = TOTAL / 30 + 0.5
n = int(dur * SR)
t = np.arange(n) / SR
out = np.zeros(n)

def hz(m): return 440 * 2 ** ((m - 69) / 12)

def lowpass(x, fc):
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y

# Chord pad: Dm - Bb - F - C, 8 s per chord, warm detuned saws
chords = [[38, 50, 53, 57, 62], [34, 46, 53, 58, 62], [41, 48, 53, 57, 60], [36, 48, 52, 55, 60]]
seg = 8.0
pad = np.zeros(n)
for k in range(int(dur // seg) + 1):
    s0 = int(k * seg * SR); s1 = min(n, int((k + 1) * seg * SR + 2 * SR))
    if s0 >= n: break
    tt = np.arange(s1 - s0) / SR
    env = np.minimum(1, tt / 2.5) * np.clip((seg + 2 - tt) / 2.0, 0, 1)
    chord = chords[k % 4] if k < int(dur // seg) else [38, 50, 54, 57, 62]  # resolve to D major
    sig = np.zeros_like(tt)
    for m in chord:
        for det in (-0.08, 0.08):
            f = hz(m + det)
            for h in range(1, 7):
                sig += np.sin(2 * np.pi * f * h * tt + h) / h * (0.6 if m < 45 else 0.35)
    pad[s0:s1] += sig * env
pad = lowpass(pad, 900)
pad *= 0.5 + 0.5 * (0.5 + 0.5 * np.sin(2 * np.pi * t / 6.0))  # slow breathing swell

# Heartbeat sub pulse (72 bpm, two thumps)
pulse = np.zeros(n)
beat = 60 / 72
def thump(at, amp):
    i = int(at * SR); L = int(0.35 * SR)
    if i + L > n: return
    tt = np.arange(L) / SR
    f = 55 * np.exp(-tt * 6) + 38
    pulse[i:i + L] += amp * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9)
b = 0.0
while b < dur - 4:
    thump(b, 0.9); thump(b + 0.22, 0.55); b += beat * 2

# Cinematic impact + reverse swell at every scene change
hits = np.zeros(n)
rng = np.random.default_rng(7)
for s in scenes[1:]:
    at = (s["start"] + TRANS / 2) / 30
    i = int(at * SR); L = int(2.5 * SR)
    tt = np.arange(L) / SR
    boom = np.sin(2 * np.pi * np.cumsum(70 * np.exp(-tt * 3) + 30) / SR) * np.exp(-tt * 2.2)
    noise = rng.standard_normal(L) * np.exp(-tt * 7) * 0.25
    seg_ = (boom + lowpass(noise, 2500)) * 0.9
    e = min(n, i + L); hits[i:e] += seg_[: e - i]
    R = int(1.2 * SR); r0 = max(0, i - R)
    rt = np.arange(i - r0) / SR
    swell = lowpass(rng.standard_normal(i - r0), 1800) * (rt / 1.2) ** 3 * 0.8
    hits[r0:i] += swell

mix = pad * 0.22 + pulse * 0.35 + hits * 0.45
fade_in = np.minimum(1, t / 1.5); fade_out = np.clip((dur - t) / 3.0, 0, 1)
mix *= fade_in * fade_out
mix /= np.max(np.abs(mix)) + 1e-9
stereo = np.stack([mix, np.roll(mix, int(0.012 * SR))], axis=1) * 0.9
wavfile.write(sys.argv[2], SR, (stereo * 32767).astype(np.int16))
print("music", dur, "s")
