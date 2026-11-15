import { fade } from "@remotion/transitions/fade";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SCENE_COMPONENTS } from "./scenes";
import { JusticeScene } from "./three/JusticeScene";
import { SCENES, TRANS } from "./timings";
import { C, CinematicFinish, SANS } from "./ui";

const sceneAt = (frame: number) => {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (frame >= SCENES[k].start) i = k;
  return i;
};

const TopBrand: React.FC = () => {
  const frame = useCurrentFrame();
  const closingStart = SCENES[SCENES.length - 1].start;
  const o =
    interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(frame, [closingStart, closingStart + TRANS], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", top: 150, left: 0, right: 0, textAlign: "center", opacity: o }}>
      <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 28, letterSpacing: 8, color: C.gold }}>ADV. MOHAMMAD RAFIQ AZAD</div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 22, letterSpacing: 6, color: C.mute, marginTop: 4 }}>
        LEGAL AWARENESS • BNSS 2023
      </div>
    </div>
  );
};

/** Six-segment progress bar shown during the step scenes (scenes 3–8). */
const StepProgress: React.FC = () => {
  const frame = useCurrentFrame();
  const first = SCENES[2].start;
  const last = SCENES[8].start;
  const o =
    interpolate(frame, [first, first + 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) *
    interpolate(frame, [last, last + 15], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  if (o <= 0) return null;
  return (
    <div style={{ position: "absolute", top: 240, left: 200, right: 200, display: "flex", gap: 12, opacity: o }}>
      {[2, 3, 4, 5, 6, 7].map((s) => {
        const st = SCENES[s].start;
        const p = interpolate(frame, [st, st + SCENES[s].dur - TRANS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        return (
          <div key={s} style={{ flex: 1, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
            <div style={{ width: `${p * 100}%`, height: "100%", background: `linear-gradient(90deg, ${C.goldDeep}, ${C.goldLight})`, boxShadow: `0 0 12px ${C.gold}` }} />
          </div>
        );
      })}
    </div>
  );
};

/** Gold anamorphic light streak on every scene change. */
const SceneFlash: React.FC = () => {
  const frame = useCurrentFrame();
  const i = sceneAt(frame);
  if (i === 0) return null;
  const mid = SCENES[i].start + TRANS / 2;
  const o = interpolate(frame, [mid - 10, mid, mid + 16], [0, 0.85, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const x = interpolate(frame, [mid - 10, mid + 16], [-30, 130], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "screen", opacity: o }}>
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: `${x - 60}%`,
          width: "120%",
          height: 6,
          background: "linear-gradient(90deg, transparent, #fff3d0, #ffb84a, transparent)",
          boxShadow: "0 0 60px 30px rgba(255,190,90,0.45)",
        }}
      />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 38%, rgba(255,200,120,0.35), transparent 60%)" }} />
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 90% 70% at 50% 30%, #1a2236 0%, #0a0e18 55%, #04050a 100%)" }}>
      <JusticeScene />
      {/* readability scrim behind lower text */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(4,5,10,0.55) 0%, transparent 18%, transparent 42%, rgba(4,5,10,0.82) 72%, rgba(4,5,10,0.92) 100%)" }} />
      <TransitionSeries>
        {SCENES.map((s, i) => {
          const Comp = SCENE_COMPONENTS[i];
          return (
            <React.Fragment key={s.vo}>
              {i > 0 ? <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANS })} /> : null}
              <TransitionSeries.Sequence name={`Scene ${i + 1}`} durationInFrames={s.dur}>
                <Comp />
              </TransitionSeries.Sequence>
            </React.Fragment>
          );
        })}
      </TransitionSeries>
      <TopBrand />
      <StepProgress />
      <SceneFlash />
      <CinematicFinish />
    </AbsoluteFill>
  );
};
