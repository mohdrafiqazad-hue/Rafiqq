"""Synthesise the Elan E Jung News TV intro soundtrack (6 s, 48 kHz stereo).

Every sound is generated from scratch (noise + oscillators), so there is no
third-party audio and no copyright claim. Hit times match the video frames
(30 fps) in video/src/timing.ts.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve
from scipy.io import wavfile

SR = 48000
FPS = 30
DUR = 6.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

# Frame numbers of the main hits (keep in sync with video/src/timing.ts)
F_EMBLEM, F_TITLE, F_SWEEP, F_NEWS, F_END = 50, 84, 92, 112, 180
T = lambda f: f / FPS

L = np.zeros(N)
R = np.zeros(N)


def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N:
        return
    sig = sig[: N - i0]
    gl = np.cos((pan + 1) * np.pi / 4) * np.sqrt(2)
    gr = np.sin((pan + 1) * np.pi / 4) * np.sqrt(2)
    L[i0 : i0 + len(sig)] += sig * gain * gl
    R[i0 : i0 + len(sig)] += sig * gain * gr


def tt(d):
    return np.arange(int(d * SR)) / SR


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], "bandpass", fs=SR, output="sos"), x)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, "lowpass", fs=SR, output="sos"), x)


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, "highpass", fs=SR, output="sos"), x)


def sweep_filter(x, f0, f1, q=0.35, blocks=200):
    """Band-pass noise whose centre frequency glides f0 -> f1 (exponentially)."""
    out = np.zeros_like(x)
    n = len(x)
    edges = np.linspace(0, n, blocks + 1).astype(int)
    for k in range(blocks):
        a, b = edges[k], edges[k + 1]
        fc = f0 * (f1 / f0) ** (k / blocks)
        lo, hi = fc * (1 - q), min(fc * (1 + q), SR / 2 - 100)
        pad = 2048
        seg = x[max(0, a - pad) : b]
        y = bp(seg, lo, hi)
        out[a:b] = y[-(b - a) :]
    return out


def saw(f, t):
    ph = np.cumsum(np.broadcast_to(f, t.shape)) / SR
    return 2 * (ph % 1) - 1


# ---------------------------------------------------------------- riser
d = T(F_EMBLEM)
t = tt(d)
noise = rng.standard_normal(len(t))
riser = sweep_filter(noise, 250, 6000) * (t / d) ** 2.2
tone = np.sin(2 * np.pi * np.cumsum(80 * (4 ** (t / d))) / SR) * (t / d) ** 2
add(riser, 0, 0.55)
add(tone, 0, 0.25)

# light-streak whooshes at the start
for t0, pan in [(0.15, -0.6), (0.55, 0.6), (0.95, -0.3)]:
    dd = 0.45
    tw = tt(dd)
    w = sweep_filter(rng.standard_normal(len(tw)), 500, 3500, blocks=60)
    env = np.sin(np.pi * tw / dd) ** 2
    add(w * env, t0, 0.35, pan)

# ---------------------------------------------------------------- reverb IR
ir_t = tt(2.2)
ir = rng.standard_normal(len(ir_t)) * np.exp(-ir_t * 3.2)
ir = lp(ir, 6000)
ir /= np.sqrt(np.sum(ir**2))


def verb(x, wet=0.35):
    return x + wet * fftconvolve(x, ir)[: len(x)]


def impact(dur=2.6, f_hi=70, f_lo=32, crack=1.0, sub=1.0):
    t = tt(dur)
    f = f_lo + (f_hi - f_lo) * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.7) * sub
    body = lp(rng.standard_normal(len(t)), 900) * np.exp(-t * 9) * 0.9
    snap = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t * 40) * 0.6 * crack
    x = np.tanh(1.6 * (boom + body + snap))
    return verb(x, 0.45)


# ---------------------------------------------------------------- emblem impact
add(impact(), T(F_EMBLEM), 0.95)
# reverse-swell sucks into the hit
dd = 0.5
tr = tt(dd)
rev = lp(rng.standard_normal(len(tr)), 3000) * (tr / dd) ** 3
add(rev, T(F_EMBLEM) - dd, 0.35)

# ---------------------------------------------------------------- title letters
for i in range(11):
    t0 = T(52 + i * 2.6)
    dd = 0.22
    tw = tt(dd)
    w = bp(rng.standard_normal(len(tw)), 900, 5000) * np.sin(np.pi * tw / dd) ** 2
    add(w, t0, 0.16, -0.8 + i * 0.16)
add(impact(dur=1.8, f_hi=95, f_lo=45, crack=1.3, sub=0.6), T(F_TITLE), 0.6)

# ---------------------------------------------------------------- metallic shine
dd = 1.6
ts = tt(dd)
shine = np.zeros(len(ts))
for k, fr in enumerate([2093, 2637, 3322, 4186, 5274, 6645]):
    shine += np.sin(2 * np.pi * fr * ts + k) / (k + 1)
shine *= np.exp(-ts * 2.6) * np.minimum(ts / 0.03, 1)
swish = sweep_filter(rng.standard_normal(len(ts)), 2000, 9000, blocks=80) * np.exp(-ts * 4)
add(verb(shine * 0.5 + swish * 0.5, 0.6), T(F_SWEEP), 0.3, 0.2)

# ---------------------------------------------------------------- NEWS TV stinger
dd = DUR - T(F_NEWS)
tn = tt(dd)
chord = np.zeros(len(tn))
for fr in [73.42, 110.0, 146.83, 174.61, 220.0, 293.66]:  # D minor
    for det in (-0.25, 0.25):
        chord += saw(fr * (1 + det / 100), tn)
cut = 300 + 3200 * np.exp(-tn * 3)
blocks = np.array_split(np.arange(len(tn)), 120)
brass = np.zeros(len(tn))
for b in blocks:
    fc = cut[b[0]]
    pad = 2048
    a0 = max(0, b[0] - pad)
    y = lp(chord[a0 : b[-1] + 1], fc)
    brass[b] = y[-len(b) :]
brass *= np.minimum(tn / 0.015, 1) * (0.35 + 0.65 * np.exp(-tn * 1.2))
brass /= np.max(np.abs(brass))
add(verb(brass, 0.5), T(F_NEWS), 0.45)
add(impact(dur=2.4, f_hi=60, f_lo=30, crack=0.8, sub=1.0), T(F_NEWS), 0.85)

# timpani-like roll leading to the stinger
for k in range(6):
    t0 = T(F_NEWS) - 0.36 + k * 0.06
    tk = tt(0.4)
    hit = np.sin(2 * np.pi * 98 * tk) * np.exp(-tk * 12) + lp(rng.standard_normal(len(tk)), 500) * np.exp(-tk * 30) * 0.4
    add(hit, t0, 0.12 + k * 0.05)

# ---------------------------------------------------------------- news pulse + drone
dd = DUR - T(F_EMBLEM)
td = tt(dd)
drone = lp(saw(36.71, td) + 0.5 * saw(36.71 * 1.502, td), 220) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.4 * td))
drone *= np.minimum(td / 0.6, 1)
add(drone, T(F_EMBLEM), 0.22)

beat = 60 / 120 / 2  # eighth notes at 120 bpm
for k in range(int((DUR - T(F_TITLE)) / beat)):
    t0 = T(F_TITLE) + k * beat
    tk = tt(0.12)
    f = 587.33 if k % 4 == 0 else 440.0
    blip = np.sin(2 * np.pi * f * tk) * np.exp(-tk * 45)
    add(blip, t0, 0.07 if k % 2 else 0.11, 0.35 if k % 2 else -0.35)

# ---------------------------------------------------------------- master
mix = np.stack([L, R], axis=1)
fade = np.ones(N)
fo = int(0.45 * SR)
fade[-fo:] = np.linspace(1, 0, fo) ** 1.5
mix *= fade[:, None]
mix = np.tanh(mix * 1.1)
mix /= np.max(np.abs(mix)) / 0.7  # about -3 dBFS, leaves headroom for AAC
out = sys.argv[1] if len(sys.argv) > 1 else "intro_sfx.wav"
wavfile.write(out, SR, (mix * 32767).astype(np.int16))
print("wrote", out, f"{DUR}s")
