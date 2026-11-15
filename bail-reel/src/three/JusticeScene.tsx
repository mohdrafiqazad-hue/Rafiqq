import { ThreeCanvas } from "@remotion/three";
import { useThree } from "@react-three/fiber";
import React, { useLayoutEffect, useMemo } from "react";
import { Easing, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { SCENES } from "../timings";

const GOLD = new THREE.MeshStandardMaterial({
  color: "#d9a845",
  metalness: 1,
  roughness: 0.2,
});
const DARK_STONE = new THREE.MeshStandardMaterial({
  color: "#10141d",
  metalness: 0.4,
  roughness: 0.28,
});

// Camera shot per scene: azimuth (rad), distance, camera height, look-at height.
// A low look-at height pushes the scales up in frame, leaving room for text below.
const SHOTS: [number, number, number, number][] = [
  [0.0, 11.8, 1.5, 1.2], // hook – hero, low angle dolly-in
  [0.75, 13.2, 3.4, -0.35], // what is bail
  [-0.6, 13.0, 2.9, -0.35], // step 1
  [0.55, 12.8, 3.8, -0.35], // step 2
  [-0.35, 13.4, 2.5, -0.35], // step 3
  [0.9, 12.8, 3.2, -0.35], // step 4
  [-0.8, 13.0, 3.5, -0.4], // step 5
  [0.3, 13.0, 2.8, -0.35], // step 6
  [0.0, 10.8, 1.8, 1.6], // principle – hero, balanced
  [0.0, 14.0, 5.2, -1.4], // closing – wide, high
];

const ease = Easing.bezier(0.45, 0, 0.2, 1);

function shotAt(frame: number) {
  let i = 0;
  for (let k = 0; k < SCENES.length; k++) if (frame >= SCENES[k].start) i = k;
  const prev = SHOTS[Math.max(0, i - 1)];
  const cur = SHOTS[i];
  const local = frame - SCENES[i].start;
  const t = i === 0 ? 1 : interpolate(local, [0, 45], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const mix = (a: number, b: number) => a + (b - a) * t;
  // slow drift inside each shot keeps the frame alive
  const drift = local * 0.0016 * (i % 2 === 0 ? 1 : -1);
  const push = i === 0 ? interpolate(local, [0, 120], [3.2, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  }) : 0;
  return {
    az: mix(prev[0], cur[0]) + drift,
    dist: mix(prev[1], cur[1]) - local * 0.002 + push,
    h: mix(prev[2], cur[2]),
    look: mix(prev[3], cur[3]),
    scene: i,
    local,
  };
}

const CameraRig: React.FC = () => {
  const frame = useCurrentFrame();
  const { camera } = useThree();
  const s = shotAt(frame);
  useLayoutEffect(() => {
    camera.position.set(Math.sin(s.az) * s.dist, s.h, Math.cos(s.az) * s.dist);
    camera.lookAt(0, s.look, 0);
  }, [camera, s.az, s.dist, s.h, s.look]);
  return null;
};

const Environment: React.FC = () => {
  const { gl, scene } = useThree();
  useLayoutEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    scene.environmentIntensity = 0.55;
    return () => {
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

// A cylinder stretched between two points (used for chains).
const Rod: React.FC<{ a: THREE.Vector3; b: THREE.Vector3; r: number }> = ({ a, b, r }) => {
  const { pos, quat, len } = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(b, a);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      dir.clone().normalize(),
    );
    return { pos: a.clone().add(b).multiplyScalar(0.5), quat: q, len: dir.length() };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={GOLD} castShadow>
      <cylinderGeometry args={[r, r, len, 10]} />
    </mesh>
  );
};

const PAN_R = 0.6;
const PAN_THETA = Math.PI * 0.64;
const RIM_R = PAN_R * Math.sin(PAN_THETA);
const DROP = 1.15;
const PAN_CENTER_Y = -DROP - PAN_R * Math.cos(PAN_THETA);

const Pan: React.FC<{ x: number; tilt: number; sway: number }> = ({ x, tilt, sway }) => {
  const chains = useMemo(
    () =>
      [0, 1, 2].map((k) => {
        const a = (k / 3) * Math.PI * 2 + Math.PI / 6;
        return new THREE.Vector3(Math.cos(a) * RIM_R * 0.97, -DROP, Math.sin(a) * RIM_R * 0.97);
      }),
    [],
  );
  const origin = useMemo(() => new THREE.Vector3(0, 0, 0), []);
  return (
    <group position={[x, 0, 0]} rotation={[0, 0, -tilt + sway]}>
      <mesh material={GOLD}>
        <sphereGeometry args={[0.07, 20, 20]} />
      </mesh>
      {chains.map((c, k) => (
        <Rod key={k} a={origin} b={c} r={0.012} />
      ))}
      <mesh position={[0, PAN_CENTER_Y, 0]} material={GOLD} castShadow>
        <sphereGeometry args={[PAN_R, 64, 24, 0, Math.PI * 2, PAN_THETA, Math.PI - PAN_THETA]} />
      </mesh>
      <mesh position={[0, -DROP, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD}>
        <torusGeometry args={[RIM_R, 0.022, 12, 64]} />
      </mesh>
    </group>
  );
};

const Scales: React.FC<{ tilt: number; sway: number; spin: number }> = ({ tilt, sway, spin }) => {
  return (
    <group rotation={[0, spin, 0]}>
      {/* stepped stone base with gold trims */}
      <mesh position={[0, 0.09, 0]} material={DARK_STONE} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.18, 64]} />
      </mesh>
      <mesh position={[0, 0.18, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD}>
        <torusGeometry args={[0.95, 0.025, 12, 80]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} material={DARK_STONE} castShadow>
        <cylinderGeometry args={[0.62, 0.72, 0.18, 64]} />
      </mesh>
      <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD}>
        <torusGeometry args={[0.62, 0.022, 12, 80]} />
      </mesh>
      {/* pillar */}
      <mesh position={[0, 1.55, 0]} material={GOLD} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 2.4, 32]} />
      </mesh>
      {[0.6, 1.4, 2.25].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} material={GOLD}>
          <torusGeometry args={[0.11, 0.03, 12, 40]} />
        </mesh>
      ))}
      {/* finial */}
      <mesh position={[0, 2.98, 0]} material={GOLD}>
        <sphereGeometry args={[0.13, 32, 32]} />
      </mesh>
      <mesh position={[0, 3.22, 0]} material={GOLD}>
        <coneGeometry args={[0.07, 0.3, 24]} />
      </mesh>
      {/* beam */}
      <group position={[0, 2.78, 0]} rotation={[0, 0, tilt]}>
        <mesh rotation={[0, 0, Math.PI / 2]} material={GOLD} castShadow>
          <cylinderGeometry args={[0.035, 0.035, 2.7, 20]} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]} material={GOLD}>
          <cylinderGeometry args={[0.07, 0.07, 0.4, 24]} />
        </mesh>
        <Pan x={-1.35} tilt={tilt} sway={sway} />
        <Pan x={1.35} tilt={tilt} sway={-sway} />
      </group>
    </group>
  );
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const COUNT = 520;
  const base = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < COUNT; i++) {
      arr.push(
        (random(`x${i}`) - 0.5) * 14,
        random(`y${i}`) * 9,
        (random(`z${i}`) - 0.5) * 14,
      );
    }
    return arr;
  }, []);
  const positions = useMemo(() => {
    const p = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const sp = 0.004 + random(`s${i}`) * 0.006;
      p[i * 3] = base[i * 3] + Math.sin(frame * 0.01 + i) * 0.25;
      p[i * 3 + 1] = (base[i * 3 + 1] + frame * sp) % 9 - 1;
      p[i * 3 + 2] = base[i * 3 + 2] + Math.cos(frame * 0.008 + i) * 0.25;
    }
    return p;
  }, [frame, base]);
  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#ffd27a"
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

const Beam: React.FC<{ x: number; z: number; rot: number; opacity: number }> = ({
  x,
  z,
  rot,
  opacity,
}) => (
  <mesh position={[x, 4.5, z]} rotation={[0, 0, rot]}>
    <cylinderGeometry args={[0.15, 2.1, 10, 48, 1, true]} />
    <meshBasicMaterial
      color="#ffcf7a"
      transparent
      opacity={opacity}
      side={THREE.DoubleSide}
      depthWrite={false}
      blending={THREE.AdditiveBlending}
    />
  </mesh>
);

const World: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = shotAt(frame);

  // Balance: heavily tipped in the hook, settling over time, perfectly level for the "Bail is the rule" scene.
  const settle = Math.exp(-frame / (fps * 18));
  let tilt = 0.24 * settle * Math.cos(frame / (fps * 1.6)) + 0.04 * Math.sin(frame / (fps * 2.7));
  if (s.scene === 8) {
    const k = interpolate(s.local, [0, 50], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    tilt *= k;
  }
  const sway = 0.03 * Math.sin(frame / 22);
  const spin = Math.sin(frame / (fps * 9)) * 0.25;

  const glow = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const g = c.getContext("2d")!;
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(255,200,110,0.55)");
    grd.addColorStop(0.4, "rgba(255,170,70,0.18)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    return new THREE.CanvasTexture(c);
  }, []);

  const flicker = 0.055 + 0.012 * Math.sin(frame / 9) + 0.008 * Math.sin(frame / 3.7);

  return (
    <>
      <Environment />
      <CameraRig />
      <fog attach="fog" args={["#06080e", 13, 30]} />
      <ambientLight intensity={0.12} />
      <spotLight
        position={[1.5, 9, 3.5]}
        angle={0.42}
        penumbra={0.75}
        intensity={260}
        color="#ffe2b0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
      />
      <pointLight position={[-5, 4.5, -5]} intensity={45} color="#4f7dff" />
      <pointLight position={[5, 4, -5]} intensity={7} color="#3fd0ff" />
      <Scales tilt={tilt} sway={sway} spin={spin} />
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[30, 96]} />
        <meshStandardMaterial color="#090c13" metalness={0.55} roughness={0.32} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={glow} transparent depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* concentric gold rings on the floor */}
      {[2.2, 3.4, 4.8].map((r, k) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, frame * 0.002 * (k % 2 ? 1 : -1)]} position={[0, 0.01, 0]}>
          <ringGeometry args={[r, r + 0.015, 128]} />
          <meshBasicMaterial color="#c8953b" transparent opacity={0.35 - k * 0.08} />
        </mesh>
      ))}
      <Beam x={0} z={0} rot={0} opacity={flicker} />
      <Beam x={-3.2} z={-3} rot={0.18} opacity={flicker * 0.55} />
      <Beam x={3.4} z={-3.5} rot={-0.2} opacity={flicker * 0.5} />
      <Dust />
    </>
  );
};

export const JusticeScene: React.FC = () => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas
      width={width}
      height={height}
      shadows
      camera={{ fov: 42, near: 0.1, far: 80, position: [0, 2, 8] }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.05 }}
    >
      <World />
    </ThreeCanvas>
  );
};
