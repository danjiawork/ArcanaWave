import { useRef, useMemo, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

const CARD_WIDTH = 1.2;
const CARD_HEIGHT = 2;
const TOTAL_CARDS = 22;

export type SceneState =
  | "IDLE"
  | "FAN"
  | "PENDING"
  | "DRAWING"
  | "WAITING_REVEAL"
  | "REVEAL";

interface TarotSceneProps {
  state: SceneState;
  drawnCards: number[];
  pendingCard: number | null;
  scrollOffset: number;
  onCardDrawn: (index: number) => void;
  tarotDeck: { name: string; nameEn?: string; meaning: string; meaningEn?: string }[];
  isResetting: boolean;
  cardFronts: THREE.Texture[];
  cardBacks: THREE.Texture[];
}

export function TarotScene({
  state,
  drawnCards,
  pendingCard,
  scrollOffset,
  onCardDrawn,
  tarotDeck,
  isResetting,
  cardFronts,
  cardBacks,
}: TarotSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const cardsRef = useRef<THREE.Group[]>([]);

  const cards = useMemo(() => {
    return Array.from({ length: TOTAL_CARDS }).map((_, i) => ({
      id: i,
      color: new THREE.Color().setHSL(i / TOTAL_CARDS, 0.3, 0.2),
      name: tarotDeck[i]?.name ?? `Card ${i}`,
      meaning: tarotDeck[i]?.meaning ?? "",
    }));
  }, [tarotDeck]);

  const targetPositions = useRef<THREE.Vector3[]>(
    cards.map(() => new THREE.Vector3())
  );
  const targetRotations = useRef<THREE.Euler[]>(
    cards.map(() => new THREE.Euler())
  );
  const targetScales = useRef<THREE.Vector3[]>(
    cards.map(() => new THREE.Vector3(1, 1, 1))
  );

  useEffect(() => {
    if (isResetting) {
      cards.forEach((_, i) => {
        targetPositions.current[i].set(0, 0, i * 0.01);
        targetRotations.current[i].set(0, 0, 0);
        targetScales.current[i].set(1, 1, 1);
      });
      return;
    }

    if (state === "IDLE") {
      cards.forEach((_, i) => {
        targetPositions.current[i].set(0, 0, i * 0.01);
        targetRotations.current[i].set(0, 0, 0);
        targetScales.current[i].set(1, 1, 1);
      });
    } else if (state === "FAN" || state === "DRAWING" || state === "PENDING") {
      const spreadAngle = Math.PI * 0.6;
      const angleStep = spreadAngle / (TOTAL_CARDS - 1);
      const startAngle = Math.PI / 2 + spreadAngle / 2;
      const scrollShift = scrollOffset * spreadAngle * 0.4;

      cards.forEach((card, i) => {
        const isDrawn = drawnCards.includes(card.id);
        const drawnIndex = drawnCards.indexOf(card.id);
        const isPending = pendingCard === card.id;

        if (isDrawn) {
          const xOffset = (drawnIndex - 1) * 2;
          targetPositions.current[i].set(xOffset, 3, 2 + drawnIndex * 0.1);
          targetRotations.current[i].set(0, 0, 0);
          targetScales.current[i].set(0.8, 0.8, 0.8);
        } else if (isPending) {
          targetPositions.current[i].set(0, 0.5, 3);
          targetRotations.current[i].set(0, 0, 0);
          targetScales.current[i].set(1.5, 1.5, 1.5);
        } else {
          const angle = startAngle - i * angleStep + scrollShift;
          const radius = 5.5;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius - radius - 2.5;
          targetPositions.current[i].set(x, y, i * 0.01);
          targetRotations.current[i].set(0, 0, angle - Math.PI / 2);
          targetScales.current[i].set(0.9, 0.9, 0.9);
        }
      });
    } else if (state === "WAITING_REVEAL") {
      cards.forEach((card, i) => {
        const isDrawn = drawnCards.includes(card.id);
        const drawnIndex = drawnCards.indexOf(card.id);

        if (isDrawn) {
          const xOffset = (drawnIndex - 1) * 2.2;
          targetPositions.current[i].set(xOffset, -1, 2);
          targetRotations.current[i].set(0, 0, 0);
          targetScales.current[i].set(2, 2, 2);
        } else {
          targetPositions.current[i].set(0, -10, 0);
        }
      });
    } else if (state === "REVEAL") {
      cards.forEach((card, i) => {
        const isDrawn = drawnCards.includes(card.id);
        const drawnIndex = drawnCards.indexOf(card.id);

        if (isDrawn) {
          const xOffset = (drawnIndex - 1) * 2.5;
          targetPositions.current[i].set(xOffset, -1.5, 1.5);
          targetRotations.current[i].set(0, Math.PI, 0);
          targetScales.current[i].set(1.8, 1.8, 1.8);
        } else {
          targetPositions.current[i].set(0, -10, 0);
        }
      });
    }
  }, [state, drawnCards, pendingCard, scrollOffset, cards, isResetting]);

  useFrame((r3fState, delta) => {
    const dt = Math.min(delta, 0.1);
    cardsRef.current.forEach((group, i) => {
      if (!group) return;
      group.position.lerp(targetPositions.current[i], dt * 5);
      const targetQuat = new THREE.Quaternion().setFromEuler(
        targetRotations.current[i]
      );
      group.quaternion.slerp(targetQuat, dt * 5);
      group.scale.lerp(targetScales.current[i], dt * 5);

      if (drawnCards.includes(i) && state !== "REVEAL") {
        group.position.y +=
          Math.sin(r3fState.clock.elapsedTime * 2 + i) * 0.005;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {cards.map((card, i) => {
        const isDrawn = drawnCards.includes(card.id);
        const isPending = pendingCard === card.id;
        const backTexture = cardBacks.length > 0 ? cardBacks[i % cardBacks.length] : null;
        const frontTexture = cardFronts.length > i ? cardFronts[i] : null;

        return (
          <group
            key={card.id}
            ref={(el) => (cardsRef.current[i] = el as THREE.Group)}
          >
            {/* Back of card */}
            <mesh position={[0, 0, 0.01]}>
              <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
              {backTexture ? (
                <meshStandardMaterial map={backTexture} side={THREE.FrontSide} />
              ) : (
                <meshStandardMaterial color="#0f0c29" side={THREE.FrontSide} />
              )}
            </mesh>

            {/* Gold wireframe border on back */}
            {!backTexture && (
              <mesh position={[0, 0, 0.015]}>
                <planeGeometry args={[CARD_WIDTH * 0.85, CARD_HEIGHT * 0.85]} />
                <meshStandardMaterial
                  color="#d4af37"
                  wireframe
                  transparent
                  opacity={0.6}
                />
              </mesh>
            )}

            {/* Position label for drawn cards */}
            {isDrawn && state !== "REVEAL" && (
              <Text
                position={[0, -CARD_HEIGHT / 2 - 0.2, 0.02]}
                fontSize={0.15}
                color="#d4af37"
                anchorX="center"
              >
                {["过去", "现在", "未来"][drawnCards.indexOf(card.id)]}
              </Text>
            )}

            {/* Front of card (visible after flip/reveal) */}
            <mesh position={[0, 0, -0.01]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[CARD_WIDTH, CARD_HEIGHT]} />
              {frontTexture ? (
                <meshStandardMaterial map={frontTexture} side={THREE.FrontSide} />
              ) : (
                <meshStandardMaterial color={card.color} side={THREE.FrontSide} />
              )}
            </mesh>

            {/* Card name/meaning on front when no texture and revealed */}
            {!frontTexture && state === "REVEAL" && isDrawn && (
              <>
                <Text
                  position={[0, 0.6, -0.02]}
                  rotation={[0, Math.PI, 0]}
                  fontSize={0.12}
                  color="#d4af37"
                  anchorX="center"
                  maxWidth={CARD_WIDTH * 0.8}
                >
                  {card.name}
                </Text>
                <Text
                  position={[0, 0, -0.02]}
                  rotation={[0, Math.PI, 0]}
                  fontSize={0.07}
                  color="#fef3c7"
                  anchorX="center"
                  maxWidth={CARD_WIDTH * 0.8}
                >
                  {card.meaning}
                </Text>
              </>
            )}

            {/* Glow ring for pending card */}
            {isPending && (
              <mesh position={[0, 0, -0.02]}>
                <ringGeometry args={[0.7, 0.85, 32]} />
                <meshBasicMaterial
                  color="#c084fc"
                  transparent
                  opacity={0.6}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            )}

            {/* Particles for drawn cards */}
            {isDrawn && state !== "REVEAL" && (
              <CardParticles />
            )}
          </group>
        );
      })}
    </group>
  );
}

function CardParticles() {
  const particlesRef = useRef<THREE.Points>(null);
  const particleCount = 30;
  const velocities = useMemo(() => new Float32Array(particleCount * 3), []);

  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * CARD_WIDTH * 0.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * CARD_HEIGHT * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
      velocities[i * 3] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
    }
    return pos;
  }, [particleCount, velocities]);

  useFrame((_, delta) => {
    if (!particlesRef.current) return;
    const arr = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < particleCount; i++) {
      arr[i * 3] += velocities[i * 3] * dt * 60;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * dt * 60;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * dt * 60;
      velocities[i * 3] *= 0.98;
      velocities[i * 3 + 1] *= 0.98;
      velocities[i * 3 + 2] *= 0.98;

      if (
        Math.abs(arr[i * 3]) > CARD_WIDTH ||
        Math.abs(arr[i * 3 + 1]) > CARD_HEIGHT ||
        Math.abs(arr[i * 3 + 2]) > 0.2
      ) {
        arr[i * 3] = (Math.random() - 0.5) * CARD_WIDTH * 0.5;
        arr[i * 3 + 1] = (Math.random() - 0.5) * CARD_HEIGHT * 0.5;
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
        velocities[i * 3] = (Math.random() - 0.5) * 0.005;
        velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.005;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.001;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#d4af37"
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
