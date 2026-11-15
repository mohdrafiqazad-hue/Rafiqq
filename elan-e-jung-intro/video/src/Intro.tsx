import { Audio } from "@remotion/media";
import { ThreeCanvas } from "@remotion/three";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Scene3D } from "./Scene3D";
import { DURATION, EMBLEM_Y, F_EMBLEM, F_NEWS, F_TITLE } from "./timing";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Approximate screen position of a world Y at the resting camera (fov 35, z 20)
const screenY = (worldY: number) => 960 - ((worldY - 0.35) / 12.6) * 1920;
const EMBLEM_PX = screenY(EMBLEM_Y);

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = interpolate(frame, [F_EMBLEM, F_EMBLEM + 6, F_EMBLEM + 40], [0, 1, 0.35], clamp);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse 85% 55% at 50% ${(EMBLEM_PX / 1920) * 100 + 8}%,
          rgba(150,8,20,${0.25 + pulse * 0.45}) 0%,
          rgba(40,3,8,0.9) 45%,
          #030103 100%)`,
      }}
    />
  );
};

const Streaks: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {new Array(14).fill(0).map((_, i) => {
        const start = Math.floor(random(`st${i}`) * 40);
        const dur = 10 + random(`sd${i}`) * 8;
        const dir = i % 2 === 0 ? 1 : -1;
        const p = interpolate(frame, [start, start + dur], [0, 1], clamp);
        if (p <= 0 || p >= 1) return null;
        const y = 300 + random(`sy${i}`) * 1300;
        const w = 300 + random(`sw${i}`) * 500;
        const x = interpolate(p, [0, 1], dir > 0 ? [-w, 1080] : [1080, -w]);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: w,
              height: 3,
              borderRadius: 3,
              opacity: Math.sin(p * Math.PI),
              background: `linear-gradient(${dir > 0 ? 90 : 270}deg, transparent, ${i % 3 === 0 ? "#ffd27a" : "#ff2a3c"}, #fff)`,
              boxShadow: "0 0 18px 4px rgba(255,40,60,0.7)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Shockwave: React.FC<{ at: number; y: number; size: number }> = ({ at, y, size }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + 22], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  if (frame < at || p >= 1) return null;
  const r = 80 + p * size;
  return (
    <div
      style={{
        position: "absolute",
        left: 540 - r,
        top: y - r,
        width: r * 2,
        height: r * 2,
        borderRadius: "50%",
        border: `${10 * (1 - p) + 2}px solid rgba(255,200,150,${1 - p})`,
        boxShadow: `0 0 60px 20px rgba(255,40,50,${(1 - p) * 0.7}), inset 0 0 50px rgba(255,120,80,${(1 - p) * 0.6})`,
        mixBlendMode: "screen",
      }}
    />
  );
};

const Flare: React.FC = () => {
  const frame = useCurrentFrame();
  const a =
    interpolate(frame, [F_EMBLEM, F_EMBLEM + 2, F_EMBLEM + 30], [0, 1, 0.25], clamp) +
    interpolate(frame, [F_NEWS, F_NEWS + 2, F_NEWS + 25], [0, 0.8, 0], clamp);
  const breathe = frame > F_NEWS + 25 ? 0.2 + Math.sin(frame / 8) * 0.06 : 0;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {/* anamorphic flare across the emblem */}
      <div
        style={{
          position: "absolute",
          left: -200,
          right: -200,
          top: EMBLEM_PX - 6,
          height: 12,
          opacity: a + breathe,
          background: "linear-gradient(90deg, transparent, rgba(255,60,70,0.9) 30%, #fff 50%, rgba(255,60,70,0.9) 70%, transparent)",
          filter: "blur(4px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 540 - 260,
          top: EMBLEM_PX - 260,
          width: 520,
          height: 520,
          borderRadius: "50%",
          opacity: (a + breathe) * 0.8,
          background: "radial-gradient(circle, rgba(255,235,200,0.9) 0%, rgba(255,60,60,0.35) 30%, transparent 65%)",
        }}
      />
    </AbsoluteFill>
  );
};

const FlashAndFade: React.FC = () => {
  const frame = useCurrentFrame();
  const white =
    interpolate(frame, [F_EMBLEM - 1, F_EMBLEM, F_EMBLEM + 5], [0, 0.85, 0], clamp) +
    interpolate(frame, [F_TITLE, F_TITLE + 1, F_TITLE + 5], [0, 0.3, 0], clamp) +
    interpolate(frame, [F_NEWS, F_NEWS + 1, F_NEWS + 6], [0, 0.45, 0], clamp);
  const black =
    interpolate(frame, [0, 6], [1, 0], clamp) +
    interpolate(frame, [DURATION - 12, DURATION - 1], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  return (
    <>
      <AbsoluteFill style={{ background: "#fff1e0", opacity: white }} />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
    </>
  );
};

const Grade: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 75% 60% at 50% 45%, transparent 55%, rgba(0,0,0,0.85) 100%)",
        }}
      />
      <AbsoluteFill style={{ opacity: 0.09, mixBlendMode: "overlay" }}>
        <svg width="1080" height="1920">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={frame % 24} />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="1080" height="1920" filter="url(#grain)" />
        </svg>
      </AbsoluteFill>
    </>
  );
};

export const Intro: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "#030103" }}>
      <Background />
      <Streaks />
      <ThreeCanvas
        width={width}
        height={height}
        camera={{ fov: 35, position: [0, 0.35, 27], near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      >
        <Scene3D />
      </ThreeCanvas>
      <Shockwave at={F_EMBLEM} y={EMBLEM_PX} size={700} />
      <Shockwave at={F_NEWS} y={screenY(-2.6)} size={520} />
      <Flare />
      <Grade />
      <FlashAndFade />
      <Audio src={staticFile("intro_sfx.wav")} />
    </AbsoluteFill>
  );
};
