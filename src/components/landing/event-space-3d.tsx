"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import * as THREE from "three";
import { makeTicketBackCanvas, makeTicketCanvas } from "./ticket-texture";

const TRAVEL = 34;

function canvasTex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 8;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── Floating Ticket Pass ── */
function TicketPass({
  front,
  back,
  position,
  scale = 1,
  rotation = [0, 0, 0],
  spin = 0,
}: {
  front: THREE.Texture;
  back: THREE.Texture;
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  spin?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const frontMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: front,
        roughness: 0.15,
        metalness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transparent: true,
        side: THREE.FrontSide,
        envMapIntensity: 0.6,
      }),
    [front]
  );
  const backMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: back,
        roughness: 0.15,
        metalness: 0.25,
        clearcoat: 1.0,
        clearcoatRoughness: 0.05,
        transparent: true,
        side: THREE.FrontSide,
        envMapIntensity: 0.6,
      }),
    [back]
  );

  useFrame((state, dt) => {
    if (!ref.current) return;
    ref.current.rotation.y += dt * spin;
    ref.current.position.y =
      position[1] + Math.sin(state.clock.elapsedTime * 0.6 + position[2]) * 0.08;
  });

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      {/* Soft volumetric glow behind the card */}
      <mesh position={[0, 0, -0.12]}>
        <planeGeometry args={[7.6, 5.0]} />
        <meshBasicMaterial
          color="#7c3aed"
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* Card edge / chassis */}
      <mesh position={[0, 0, -0.02]}>
        <boxGeometry args={[5.68, 3.66, 0.045]} />
        <meshPhysicalMaterial
          color="#0a0c1a"
          roughness={0.12}
          metalness={0.85}
          clearcoat={1.0}
          clearcoatRoughness={0.04}
        />
      </mesh>
      {/* Front face */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[5.6, 3.584]} />
        <primitive object={frontMat} attach="material" />
      </mesh>
      {/* Back face */}
      <mesh position={[0, 0, -0.045]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[5.6, 3.584]} />
        <primitive object={backMat} attach="material" />
      </mesh>
    </group>
  );
}

/* ── Subtle floating particles ── */
function Particles({ count }: { count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const data = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        x: -4 + seeded(i, 1) * 16,
        y: -3 + seeded(i, 2) * 6,
        z: -4 - seeded(i, 3) * 30,
        speed: 0.15 + seeded(i, 4) * 0.35,
        phase: seeded(i, 5) * Math.PI * 2,
        size: 0.008 + seeded(i, 6) * 0.018,
      })),
    [count]
  );
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    data.forEach((d, i) => {
      const drift = Math.sin(t * d.speed + d.phase);
      dummy.position.set(d.x + drift * 0.3, d.y + Math.sin(t * 0.2 + d.phase) * 0.15, d.z);
      const s = d.size;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      ref.current!.setMatrixAt(i, dummy.matrix);
    });
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial
        color="#a78bfa"
        transparent
        opacity={0.4}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

function seeded(index: number, salt: number) {
  const x = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/* ── Camera Rig ── */
function Rig({
  progress,
  animate,
}: {
  progress: MotionValue<number>;
  animate: boolean;
}) {
  useFrame((state) => {
    const p = animate ? progress.get() : 0.04;
    const targetZ = -p * TRAVEL;
    const cam = state.camera;
    cam.position.z += (targetZ - cam.position.z) * 0.1;
    const sway = Math.sin(p * Math.PI * 1.4) * 0.25;
    cam.position.x += (sway + state.pointer.x * 0.28 - cam.position.x) * 0.05;
    cam.position.y += (state.pointer.y * 0.18 - cam.position.y) * 0.05;
    cam.lookAt(3.5, -0.05, cam.position.z - 8);
  });
  return null;
}

/* ── Main Scene ── */
function Scene({
  progress,
  animate,
  small,
}: {
  progress: MotionValue<number>;
  animate: boolean;
  small: boolean;
}) {
  const ticket = useMemo(() => canvasTex(makeTicketCanvas()), []);
  const ticketBack = useMemo(() => canvasTex(makeTicketBackCanvas()), []);
  const mainTicketPosition: [number, number, number] = small
    ? [8.65, -2.08, -10.5]
    : [5.55, 0.04, -8];
  const mainTicketScale = small ? 0.22 : 0.86;
  const mainTicketRotation: [number, number, number] = small
    ? [0.02, -0.16, 0.02]
    : [0.055, -0.2, 0.035];

  return (
    <>
      <color attach="background" args={["#080911"]} />
      <fog attach="fog" args={["#080911", 8, 38]} />

      {/* Clean lighting setup */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[4, 5, 3]} intensity={1.0} color="#e8e4ff" />
      <directionalLight position={[-5, -1, -3]} intensity={0.4} color="#7c3aed" />

      {/* Subtle colored fill lights for reflections on the card */}
      <pointLight position={[8, 2, -6]} intensity={3} color="#db2777" distance={14} decay={2} />
      <pointLight position={[3, -1, -10]} intensity={4} color="#2563eb" distance={16} decay={2} />

      <Rig progress={progress} animate={animate} />

      <TicketPass
        front={ticket}
        back={ticketBack}
        position={mainTicketPosition}
        rotation={mainTicketRotation}
        scale={mainTicketScale}
        spin={0.012}
      />

      {/* Soft floating particles instead of hard geometric shapes */}
      {!small && <Particles count={40} />}
    </>
  );
}

export default function EventSpace3D({
  progress,
}: {
  progress: MotionValue<number>;
}) {
  const small =
    typeof window !== "undefined" && window.innerWidth < 768;
  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const animate = !reduce;

  return (
    <Canvas
      camera={{ position: [0, 0, 0.1], fov: 58 }}
      dpr={small ? [1, 1.3] : [1, 1.75]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      frameloop={animate ? "always" : "demand"}
      style={{ pointerEvents: "none" }}
    >
      <Scene progress={progress} animate={animate} small={small} />
    </Canvas>
  );
}
