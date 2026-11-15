import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";
import fontJson from "three/examples/fonts/helvetiker_bold.typeface.json";
import {
  EMBLEM_Y,
  F_EMBLEM,
  F_LETTERS,
  F_NEWS,
  F_SWEEP,
  F_TITLE,
  LETTER_GAP,
  NEWS_Y,
  TITLE_Y,
} from "./timing";

const font: Font = new FontLoader().parse(
  fontJson as unknown as Parameters<FontLoader["parse"]>[0],
);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const outExpo = Easing.bezier(0.16, 1, 0.3, 1);

// Classic broadcast chrome: bright top, hard horizon, dark band, warm bottom.
// TextGeometry front-face UVs are glyph units, so v=0 is the baseline.
const chromeMap = (capHeight: number) => {
  const c = document.createElement("canvas");
  c.width = 4;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "#ffffff");
  g.addColorStop(0.3, "#e6e9f0");
  g.addColorStop(0.49, "#9aa0ad");
  g.addColorStop(0.5, "#3a3d46");
  g.addColorStop(0.62, "#6d717c");
  g.addColorStop(0.85, "#e9e2d6");
  g.addColorStop(1, "#ffffff");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.repeat.set(1, 1 / capHeight);
  return t;
};

// ------------------------------------------------------------------ materials
const useMaterials = () =>
  useMemo(
    () => ({
      gold: new THREE.MeshStandardMaterial({
        color: "#e0b04a",
        metalness: 1,
        roughness: 0.22,
      }),
      chrome: new THREE.MeshStandardMaterial({
        map: chromeMap(0.74),
        metalness: 0.7,
        roughness: 0.22,
      }),
      chromeBig: new THREE.MeshStandardMaterial({
        map: chromeMap(0.74 * 1.35),
        metalness: 0.7,
        roughness: 0.22,
      }),
      redMetal: new THREE.MeshStandardMaterial({
        color: "#9e0a16",
        metalness: 0.85,
        roughness: 0.3,
      }),
      darkDisc: new THREE.MeshStandardMaterial({
        color: "#160407",
        metalness: 0.9,
        roughness: 0.35,
      }),
      redGlow: new THREE.MeshStandardMaterial({
        color: "#ff1a2b",
        emissive: "#ff1022",
        emissiveIntensity: 2.2,
        metalness: 0.2,
        roughness: 0.4,
      }),
      plate: new THREE.MeshPhysicalMaterial({
        color: "#c80d1d",
        metalness: 0.35,
        roughness: 0.25,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
      white: new THREE.MeshStandardMaterial({
        color: "#ffffff",
        metalness: 0.4,
        roughness: 0.2,
        emissive: "#ffffff",
        emissiveIntensity: 0.25,
      }),
    }),
    [],
  );

type Mats = ReturnType<typeof useMaterials>;

const makeText = (
  text: string,
  size: number,
  depth: number,
  bevel: number,
): THREE.BufferGeometry => {
  const g = new TextGeometry(text, {
    font,
    size,
    depth,
    curveSegments: 10,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel * 0.6,
    bevelSegments: 4,
  });
  g.computeBoundingBox();
  g.center();
  return g;
};

// ------------------------------------------------------------------ environment
const Environment: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.75;
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.05;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

// ------------------------------------------------------------------ camera
const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const camera = useThree((s) => s.camera);

  const dolly = interpolate(frame, [0, F_EMBLEM], [27, 20], {
    ...clamp,
    easing: outExpo,
  });
  const push = interpolate(frame, [F_NEWS, 180], [0, -1.6], clamp);
  const shake = (at: number, amp: number) => {
    const d = frame - at;
    if (d < 0) return 0;
    return amp * Math.exp(-d / 5) * Math.sin(d * 2.7);
  };
  const s = shake(F_EMBLEM, 0.22) + shake(F_TITLE, 0.1) + shake(F_NEWS, 0.16);
  const orbit = Math.sin(frame / 55) * 0.6;

  camera.position.set(orbit + s * 0.6, 0.35 + s, dolly + push);
  camera.lookAt(0, 0.35, 0);
  camera.updateProjectionMatrix();
  return null;
};

// ------------------------------------------------------------------ globe
const Globe: React.FC = () => {
  const frame = useCurrentFrame();
  const geo = useMemo(() => {
    const pts: number[] = [];
    const r = 3.6;
    const seg = 96;
    for (let lat = -75; lat <= 75; lat += 15) {
      const phi = (lat * Math.PI) / 180;
      for (let i = 0; i < seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const b = ((i + 1) / seg) * Math.PI * 2;
        pts.push(
          r * Math.cos(phi) * Math.cos(a), r * Math.sin(phi), r * Math.cos(phi) * Math.sin(a),
          r * Math.cos(phi) * Math.cos(b), r * Math.sin(phi), r * Math.cos(phi) * Math.sin(b),
        );
      }
    }
    for (let lon = 0; lon < 180; lon += 15) {
      const th = (lon * Math.PI) / 180;
      for (let i = 0; i < seg; i++) {
        const a = (i / seg) * Math.PI * 2;
        const b = ((i + 1) / seg) * Math.PI * 2;
        pts.push(
          r * Math.sin(a) * Math.cos(th), r * Math.cos(a), r * Math.sin(a) * Math.sin(th),
          r * Math.sin(b) * Math.cos(th), r * Math.cos(b), r * Math.sin(b) * Math.sin(th),
        );
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        color: "#ff2a3a",
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [],
  );
  mat.opacity =
    interpolate(frame, [5, 40], [0, 0.32], clamp) +
    interpolate(frame, [F_EMBLEM, F_EMBLEM + 4, F_EMBLEM + 25], [0, 0.4, 0], clamp);

  return (
    <lineSegments
      geometry={geo}
      material={mat}
      position={[0, EMBLEM_Y - 0.2, -4.5]}
      rotation={[0.38, frame * 0.012, 0.18]}
    />
  );
};

// ------------------------------------------------------------------ embers
const COUNT = 420;
const Embers: React.FC = () => {
  const frame = useCurrentFrame();
  const sprite = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,190,120,0.9)");
    g.addColorStop(1, "rgba(255,60,20,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(COUNT * 3), 3));
    return g;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.13,
        map: sprite,
        color: "#ff9a4a",
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [sprite],
  );

  const pos = geo.getAttribute("position") as THREE.BufferAttribute;
  const burst = Math.max(0, frame - F_EMBLEM);
  for (let i = 0; i < COUNT; i++) {
    const x0 = (random(`x${i}`) - 0.5) * 16;
    const z0 = -8 + random(`z${i}`) * 14;
    const speed = 0.02 + random(`s${i}`) * 0.05;
    const span = 18;
    const y = ((random(`y${i}`) * span + frame * speed) % span) - span / 2;
    // radial push from the emblem impact
    const push = (1 - Math.exp(-burst / 10)) * (random(`p${i}`) * 1.4);
    const dx = x0 === 0 ? 0 : Math.sign(x0) * push;
    pos.setXYZ(i, x0 + dx + Math.sin(frame / 20 + i) * 0.15, y, z0);
  }
  pos.needsUpdate = true;
  mat.opacity = interpolate(frame, [0, 25], [0, 0.9], clamp);

  return <points geometry={geo} material={mat} />;
};

// ------------------------------------------------------------------ emblem
const Emblem: React.FC<{ m: Mats }> = ({ m }) => {
  const frame = useCurrentFrame();
  const geos = useMemo(() => {
    const ticks: THREE.BufferGeometry[] = [];
    return {
      outer: new THREE.TorusGeometry(1.95, 0.13, 32, 160),
      glow: new THREE.TorusGeometry(1.62, 0.035, 16, 160),
      disc: new THREE.CylinderGeometry(1.58, 1.58, 0.26, 128),
      tick: new THREE.BoxGeometry(0.06, 0.22, 0.08),
      mono: makeText("EJ", 1.35, 0.32, 0.06),
      ticks,
    };
  }, []);

  const t = interpolate(frame, [8, F_EMBLEM], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.5, 0, 0.75, 0.2),
  });
  const z = interpolate(t, [0, 1], [-60, 0]);
  const spin = interpolate(t, [0, 1], [Math.PI * 5, 0]);
  // little settle wobble after landing
  const d = frame - F_EMBLEM;
  const wobble = d > 0 ? Math.exp(-d / 9) * Math.sin(d * 0.75) * 0.22 : 0;
  const idle = d > 0 ? Math.sin(d / 28) * 0.12 : 0;
  const scalePunch = d >= 0 ? 1 + Math.exp(-d / 4) * 0.08 : 1;

  return (
    <group
      position={[0, EMBLEM_Y, z]}
      rotation={[0, spin + wobble + idle, 0]}
      scale={scalePunch}
      visible={frame >= 8}
    >
      <mesh geometry={geos.outer} material={m.gold} />
      <mesh geometry={geos.glow} material={m.redGlow} position={[0, 0, 0.14]} />
      <mesh geometry={geos.disc} material={m.darkDisc} rotation={[Math.PI / 2, 0, 0]} />
      <group rotation={[0, 0, -frame * 0.01]}>
        {new Array(48).fill(0).map((_, i) => {
          const a = (i / 48) * Math.PI * 2;
          return (
            <mesh
              key={i}
              geometry={geos.tick}
              material={i % 4 === 0 ? m.redGlow : m.gold}
              position={[Math.cos(a) * 1.78, Math.sin(a) * 1.78, 0.12]}
              rotation={[0, 0, a + Math.PI / 2]}
              scale={i % 4 === 0 ? [1.2, 1.5, 1] : 1}
            />
          );
        })}
      </group>
      <mesh geometry={geos.mono} material={[m.chromeBig, m.redMetal]} position={[0, 0, 0.3]} />
    </group>
  );
};

// ------------------------------------------------------------------ title
const TITLE = "ELAN E JUNG";
const TITLE_WIDTH = 5.7;

const Title: React.FC<{ m: Mats }> = ({ m }) => {
  const frame = useCurrentFrame();
  const letters = useMemo(() => {
    const size = 1;
    const scale = size / font.data.resolution;
    const items: { ch: string; x: number; geo: THREE.BufferGeometry | null }[] = [];
    let x = 0;
    for (const ch of TITLE) {
      const glyph = font.data.glyphs[ch];
      const adv = glyph.ha * scale + 0.06;
      items.push({ ch, x: x + adv / 2, geo: ch === " " ? null : makeText(ch, size, 0.34, 0.035) });
      x += adv;
    }
    const k = TITLE_WIDTH / x;
    return { items: items.map((it) => ({ ...it, x: (it.x - x / 2) * k })), k };
  }, []);

  let n = 0;
  return (
    <group position={[0, TITLE_Y, 0]} scale={letters.k}>
      {letters.items.map((it, i) => {
        if (!it.geo) return null;
        const start = F_LETTERS + n * LETTER_GAP;
        n++;
        const p = interpolate(frame, [start, start + 9], [0, 1], {
          ...clamp,
          easing: outExpo,
        });
        const rx = interpolate(p, [0, 1], [-Math.PI * 0.9, 0]);
        return (
          <mesh
            key={i}
            geometry={it.geo}
            material={[m.chrome, m.redMetal]}
            visible={frame >= start}
            position={[
              it.x / letters.k,
              interpolate(p, [0, 1], [-2.5, 0]),
              interpolate(p, [0, 1], [14, 0]),
            ]}
            rotation={[rx, 0, 0]}
          />
        );
      })}
    </group>
  );
};

// ------------------------------------------------------------------ NEWS TV plate
const NewsPlate: React.FC<{ m: Mats }> = ({ m }) => {
  const frame = useCurrentFrame();
  const geos = useMemo(
    () => ({
      plate: new THREE.BoxGeometry(3.3, 0.82, 0.22),
      line: new THREE.BoxGeometry(1.15, 0.045, 0.06),
      text: makeText("NEWS TV", 0.46, 0.12, 0.015),
    }),
    [],
  );
  const p = interpolate(frame, [F_NEWS - 8, F_NEWS], [0, 1], {
    ...clamp,
    easing: Easing.bezier(0.6, 0, 0.9, 0.4),
  });
  const d = frame - F_NEWS;
  const settle = d > 0 ? Math.exp(-d / 6) * Math.sin(d * 0.9) * 0.08 : 0;
  const lines = interpolate(frame, [F_NEWS, F_NEWS + 14], [0, 1], {
    ...clamp,
    easing: outExpo,
  });
  return (
    <group position={[0, NEWS_Y, 0]} visible={frame >= F_NEWS - 8}>
      <group rotation={[interpolate(p, [0, 1], [-Math.PI / 2, 0]) + settle, 0, 0]} scale={interpolate(p, [0, 1], [0.6, 1])}>
        <mesh geometry={geos.plate} material={m.plate} />
        <mesh geometry={geos.text} material={m.white} position={[0, 0, 0.16]} />
      </group>
      <mesh geometry={geos.line} material={m.gold} position={[-2.35, 0, 0]} scale={[lines, 1, 1]} />
      <mesh geometry={geos.line} material={m.gold} position={[2.35, 0, 0]} scale={[lines, 1, 1]} />
    </group>
  );
};

// ------------------------------------------------------------------ lights
const Lights: React.FC = () => {
  const frame = useCurrentFrame();
  const sweepX = interpolate(frame, [F_SWEEP, F_SWEEP + 22], [-7, 7], clamp);
  const sweepI = interpolate(frame, [F_SWEEP, F_SWEEP + 4, F_SWEEP + 18, F_SWEEP + 24], [0, 90, 90, 0], clamp);
  const flash = interpolate(frame, [F_EMBLEM, F_EMBLEM + 2, F_EMBLEM + 16], [0, 140, 0], clamp);
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[3, 6, 8]} intensity={1.6} color="#fff2e0" />
      <directionalLight position={[-6, -2, -4]} intensity={3} color="#ff2030" />
      <pointLight position={[6, -3, 3]} intensity={25} color="#ff3040" distance={20} />
      <pointLight position={[sweepX, 0.3, 3.5]} intensity={sweepI} color="#ffffff" distance={12} />
      <pointLight position={[0, EMBLEM_Y, 4]} intensity={flash} color="#ffd9a0" distance={14} />
    </>
  );
};

export const Scene3D: React.FC = () => {
  const m = useMaterials();
  return (
    <>
      <Environment />
      <CameraRig />
      <Lights />
      <Globe />
      <Embers />
      <Emblem m={m} />
      <Title m={m} />
      <NewsPlate m={m} />
    </>
  );
};
