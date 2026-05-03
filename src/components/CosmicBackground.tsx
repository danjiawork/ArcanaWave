// src/components/CosmicBackground.tsx
import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const STAR_COUNT = 600;
const SHOOTING_STAR_INTERVAL = 3000;

export function CosmicBackground({ handX }: { handX?: number }) {
  const starsRef = useRef<THREE.Points>(null);
  const ringsRef = useRef<THREE.Group>(null);
  const shootingRef = useRef<THREE.Mesh>(null);
  const shootingState = useRef({ active: false, time: 0, nextAt: 2000 });

  const starPositions = useMemo(() => {
    const pos = new Float32Array(STAR_COUNT * 3);
    for (let i = 0; i < STAR_COUNT; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20 - 5;
    }
    return pos;
  }, []);

  const starSizes = useMemo(() => {
    const sizes = new Float32Array(STAR_COUNT);
    for (let i = 0; i < STAR_COUNT; i++) {
      sizes[i] = Math.random() * 0.08 + 0.02;
    }
    return sizes;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (starsRef.current) {
      starsRef.current.rotation.z = t * 0.02;
      if (handX !== undefined) {
        starsRef.current.position.x = (handX - 0.5) * -0.5;
      }
    }

    if (ringsRef.current) {
      ringsRef.current.rotation.z = t * 0.1;
      ringsRef.current.children.forEach((ring, i) => {
        ring.rotation.z = t * (0.05 + i * 0.03) * (i % 2 === 0 ? 1 : -1);
      });
    }

    const elapsed = t * 1000;
    const ss = shootingState.current;
    if (!ss.active && elapsed > ss.nextAt) {
      ss.active = true;
      ss.time = 0;
      if (shootingRef.current) {
        shootingRef.current.visible = true;
        shootingRef.current.position.set(
          (Math.random() - 0.5) * 15,
          Math.random() * 5 + 3,
          -2
        );
        const angle = Math.random() * 0.5 + 0.3;
        shootingRef.current.rotation.z = -angle;
      }
    }
    if (ss.active && shootingRef.current) {
      ss.time += 16;
      const progress = ss.time / 600;
      shootingRef.current.position.x += 0.3;
      shootingRef.current.position.y -= 0.15;
      shootingRef.current.scale.x = Math.max(0, 1 - progress);
      if (progress >= 1) {
        ss.active = false;
        ss.nextAt = elapsed + SHOOTING_STAR_INTERVAL + Math.random() * 2000;
        shootingRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* Gold particle starfield */}
      <points ref={starsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={STAR_COUNT}
            array={starPositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#d4af37"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          sizeAttenuation
        />
      </points>

      {/* Orbital rings */}
      <group ref={ringsRef} position={[0, -3, -2]}>
        <mesh rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[4, 0.015, 16, 100]} />
          <meshBasicMaterial color="#f472b6" transparent opacity={0.4} />
        </mesh>
        <mesh rotation={[Math.PI / 2.5, 0.2, 0]}>
          <torusGeometry args={[5, 0.01, 16, 100]} />
          <meshBasicMaterial color="#d4af37" transparent opacity={0.3} />
        </mesh>
        <mesh rotation={[Math.PI / 4, -0.1, 0]}>
          <torusGeometry args={[3.5, 0.012, 16, 100]} />
          <meshBasicMaterial color="#c084fc" transparent opacity={0.25} />
        </mesh>
      </group>

      {/* Shooting star */}
      <mesh ref={shootingRef} visible={false}>
        <planeGeometry args={[1.5, 0.02]} />
        <meshBasicMaterial
          color="#f0c878"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Depth fog effect */}
      <mesh position={[0, 0, -10]}>
        <planeGeometry args={[60, 60]} />
        <meshBasicMaterial color="#070714" transparent opacity={0.3} />
      </mesh>
    </>
  );
}
