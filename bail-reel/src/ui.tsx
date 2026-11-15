import { loadFont } from "@remotion/fonts";
import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

loadFont({ family: "Cinzel", url: staticFile("cinzel-latin-700-normal.woff2"), weight: "700" });
loadFont({ family: "Cinzel", url: staticFile("cinzel-latin-900-normal.woff2"), weight: "900" });
loadFont({ family: "Montserrat", url: staticFile("montserrat-latin-400-normal.woff2"), weight: "400" });
loadFont({ family: "Montserrat", url: staticFile("montserrat-latin-600-normal.woff2"), weight: "600" });
loadFont({ family: "Montserrat", url: staticFile("montserrat-latin-800-normal.woff2"), weight: "800" });
loadFont({ family: "Bebas", url: staticFile("bebas-neue-latin-400-normal.woff2"), weight: "400" });

export const C = {
  gold: "#e8b85a",
  goldLight: "#ffe3a3",
  goldDeep: "#8a5a17",
  ink: "#f4efe6",
  mute: "#b9b3a6",
  red: "#ff5a4e",
  green: "#4fe0a6",
  glass: "rgba(12,16,26,0.62)",
};

export const SERIF = "Cinzel, serif";
export const SANS = "Montserrat, sans-serif";
export const DISPLAY = "Bebas, sans-serif";

export const goldText: React.CSSProperties = {
  backgroundImage: `linear-gradient(180deg, ${C.goldLight} 0%, ${C.gold} 45%, #b07b28 75%, ${C.goldLight} 100%)`,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** 3D flip-in from below: rotates up from the floor with depth blur. */
export const Reveal: React.FC<{
  at: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  from?: "below" | "left" | "right" | "zoom";
}> = ({ at, children, style, from = "below" }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 18, stiffness: 90, mass: 0.9 } });
  const o = interpolate(frame - at, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const t: Record<string, React.CSSProperties> = {
    below: { rotate: `x ${interpolate(p, [0, 1], [75, 0])}deg`, translate: `0 ${interpolate(p, [0, 1], [90, 0])}px` },
    left: { rotate: `y ${interpolate(p, [0, 1], [-70, 0])}deg`, translate: `${interpolate(p, [0, 1], [-140, 0])}px 0` },
    right: { rotate: `y ${interpolate(p, [0, 1], [70, 0])}deg`, translate: `${interpolate(p, [0, 1], [140, 0])}px 0` },
    zoom: { scale: interpolate(p, [0, 1], [1.6, 1]) },
  };
  return (
    <div style={{ perspective: 1400, ...style }}>
      <div
        style={{
          ...t[from],
          opacity: o,
          filter: `blur(${interpolate(o, [0, 1], [14, 0])}px)`,
          transformOrigin: "50% 100%",
        }}
      >
        {children}
      </div>
    </div>
  );
};

/** Glass card with gold hairline border and a light sweep. */
export const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties; accent?: string }> = ({
  children,
  style,
  accent = C.gold,
}) => {
  const frame = useCurrentFrame();
  const sweep = ((frame * 6) % 2600) - 800;
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background: C.glass,
        border: `2px solid ${accent}66`,
        borderRadius: 34,
        padding: "34px 40px",
        boxShadow: `0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 40px ${accent}22`,
        backdropFilter: "blur(10px)",
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: sweep,
          width: 220,
          background: "linear-gradient(100deg, transparent, rgba(255,230,170,0.10), transparent)",
          rotate: "12deg",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
};

export const SecChip: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.gold }) => (
  <span
    style={{
      display: "inline-block",
      fontFamily: SANS,
      fontWeight: 800,
      fontSize: 34,
      letterSpacing: 1,
      color: "#140d02",
      background: `linear-gradient(180deg, ${C.goldLight}, ${color})`,
      padding: "8px 22px",
      borderRadius: 999,
      boxShadow: `0 6px 20px ${color}55`,
    }}
  >
    {children}
  </span>
);

/** Step header: extruded 3D number + title. */
export const StepHeader: React.FC<{ n: number; title: string; sub?: string; at?: number }> = ({
  n,
  title,
  sub,
  at = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: { damping: 14, stiffness: 80 } });
  const num = String(n).padStart(2, "0");
  const depth = Array.from({ length: 14 }, (_, i) => `${i * 0.7}px ${i + 1}px 0 ${i < 13 ? "#6b4310" : "rgba(0,0,0,0.6)"}`).join(",");
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 34 }}>
      <div
        style={{
          position: "relative",
          perspective: 900,
          width: 230,
          height: 210,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            rotate: `y ${interpolate(p, [0, 1], [-100, -14])}deg`,
            scale: interpolate(p, [0, 1], [0.4, 1]),
            opacity: interpolate(p, [0, 0.3], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          <div style={{ position: "absolute", fontFamily: DISPLAY, fontSize: 240, lineHeight: "210px", color: "#6b4310", textShadow: depth }}>
            {num}
          </div>
          <div style={{ position: "absolute", fontFamily: DISPLAY, fontSize: 240, lineHeight: "210px", ...goldText }}>{num}</div>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <Reveal at={at + 6} from="right">
          <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 30, letterSpacing: 10, color: C.gold }}>STEP {num}</div>
          <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 70, lineHeight: 1.05, color: C.ink, textShadow: "0 6px 30px rgba(0,0,0,0.8)" }}>
            {title}
          </div>
          {sub ? <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 38, color: C.goldLight, marginTop: 6 }}>{sub}</div> : null}
        </Reveal>
      </div>
    </div>
  );
};

export const Icon: React.FC<{ name: "check" | "clock" | "shield" | "doc" | "warn" | "court" | "user" | "eye"; color?: string; size?: number }> = ({
  name,
  color = C.gold,
  size = 54,
}) => {
  const s = { fill: "none", stroke: color, strokeWidth: 2.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const paths: Record<string, React.ReactNode> = {
    check: <path {...s} d="M5 12.5l4.5 4.5L19 7" />,
    clock: (
      <>
        <circle {...s} cx="12" cy="12" r="9" />
        <path {...s} d="M12 7v5l3.5 2.5" />
      </>
    ),
    shield: <path {...s} d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3z M8.5 12l2.5 2.5 4.5-5" />,
    doc: <path {...s} d="M7 3h7l5 5v13H7z M14 3v5h5 M10 13h6 M10 17h6" />,
    warn: <path {...s} d="M12 3l10 18H2L12 3z M12 10v5 M12 18v.2" />,
    court: <path {...s} d="M3 10l9-6 9 6 M5 10v8 M9.5 10v8 M14.5 10v8 M19 10v8 M3 21h18" />,
    user: (
      <>
        <circle {...s} cx="12" cy="8" r="4" />
        <path {...s} d="M4 21c1.2-4 4.2-6 8-6s6.8 2 8 6" />
      </>
    ),
    eye: (
      <>
        <path {...s} d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
        <circle {...s} cx="12" cy="12" r="3" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ flexShrink: 0, filter: `drop-shadow(0 0 10px ${color}88)` }}>
      {paths[name]}
    </svg>
  );
};

export const Bullet: React.FC<{
  at: number;
  icon: React.ComponentProps<typeof Icon>["name"];
  children: React.ReactNode;
  color?: string;
  from?: "left" | "right" | "below";
}> = ({ at, icon, children, color = C.gold, from = "left" }) => (
  <Reveal at={at} from={from}>
    <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 22 }}>
      <div
        style={{
          width: 86,
          height: 86,
          borderRadius: 24,
          display: "grid",
          placeItems: "center",
          background: `${color}1c`,
          border: `2px solid ${color}77`,
        }}
      >
        <Icon name={icon} color={color} />
      </div>
      <div style={{ fontFamily: SANS, fontWeight: 600, fontSize: 44, lineHeight: 1.2, color: C.ink }}>{children}</div>
    </div>
  </Reveal>
);

/** Big time-limit chip with a ring that fills. */
export const TimerChip: React.FC<{ at: number; value: string; unit: string; label: string; color?: string; compact?: boolean }> = ({
  at,
  value,
  unit,
  label,
  color = C.gold,
  compact = false,
}) => {
  const frame = useCurrentFrame();
  const fill = interpolate(frame - at, [5, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const R = 74;
  const L = 2 * Math.PI * R;
  return (
    <Reveal at={at} from="zoom">
      <div
        style={{
          display: "flex",
          flexDirection: compact ? "column" : "row",
          alignItems: "center",
          gap: compact ? 14 : 28,
          textAlign: compact ? "center" : "left",
        }}
      >
        <div style={{ position: "relative", width: 180, height: 180 }}>
          <svg width={180} height={180} style={{ position: "absolute", left: 0, top: 0, rotate: "-90deg" }}>
            <circle cx={90} cy={90} r={R} stroke="rgba(255,255,255,0.12)" strokeWidth={10} fill="rgba(0,0,0,0.35)" />
            <circle
              cx={90}
              cy={90}
              r={R}
              stroke={color}
              strokeWidth={10}
              fill="none"
              strokeDasharray={L}
              strokeDashoffset={L * (1 - fill)}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 12px ${color})` }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 92, lineHeight: "80px", color: C.ink }}>{value}</div>
              <div style={{ fontFamily: SANS, fontWeight: 800, fontSize: 21, letterSpacing: 2, color }}>{unit}</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, fontFamily: SANS, fontWeight: 600, fontSize: compact ? 34 : 42, lineHeight: 1.2, color: C.ink }}>{label}</div>
      </div>
    </Reveal>
  );
};

/** Film grain, vignette and anamorphic lens streak. */
export const CinematicFinish: React.FC = () => {
  const frame = useCurrentFrame();
  const seed = Math.floor(random(`g${frame}`) * 1000);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill
        style={{
          background: "radial-gradient(ellipse 75% 60% at 50% 45%, transparent 45%, rgba(0,0,0,0.78) 100%)",
        }}
      />
      <svg width="100%" height="100%" style={{ position: "absolute", opacity: 0.09, mixBlendMode: "overlay" }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={seed} />
        </filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
